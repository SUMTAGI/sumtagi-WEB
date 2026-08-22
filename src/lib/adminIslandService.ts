import { supabase } from './supabase'
import type { Island, IslandStatus } from './api/islands'
import { logAdminAction } from './adminAuditLogService'

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// 관리자가 폼에서 채우는 값. id는 최초 생성 시에만 입력받고(= islands.id는
// uuid가 아니라 "baengnyeong" 같은 슬러그 text PK라 앱 전역에서 /island/:id,
// FERRY_ROUTES 등 여러 곳이 이 값을 그대로 참조한다), 이후 수정 화면에서는
// 절대 바꾸지 않는다 — 바꾸면 기존 링크/즐겨찾기/최근 본 섬 기록이 전부
// 끊어지기 때문.
export interface IslandInput {
  name: string
  description: string
  features: string[]
  ferry_time: string
  ferry_price: number | null
  popularity_trend: Island['popularity_trend']
  congestion: Island['congestion']
  best_season: string
  // 지금은 URL 문자열만 받는다. 추후 Supabase Storage 업로드를 붙일 땐
  // communityService.uploadImage와 같은 패턴으로 별도 버킷에 올리고 그
  // public URL을 여기 그대로 넣으면 되므로, 이 필드 자체는 바뀔 필요 없다.
  image: string | null
  ports: string[]
  lat: number | null
  lng: number | null
  status: IslandStatus
  order_index: number
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export function validateIslandInput(input: IslandInput): string | null {
  if (!input.name.trim()) return '이름을 입력해주세요'
  if (input.name.trim().length > 40) return '이름은 40자 이하로 입력해주세요'
  if (!input.description.trim()) return '설명을 입력해주세요'
  if (input.ferry_price !== null && (Number.isNaN(input.ferry_price) || input.ferry_price < 0)) {
    return '여객선 요금은 0 이상의 숫자여야 해요'
  }
  if (input.lat !== null && (Number.isNaN(input.lat) || input.lat < -90 || input.lat > 90)) {
    return '위도는 -90~90 사이의 숫자여야 해요'
  }
  if (input.lng !== null && (Number.isNaN(input.lng) || input.lng < -180 || input.lng > 180)) {
    return '경도는 -180~180 사이의 숫자여야 해요'
  }
  if (!Number.isInteger(input.order_index) || input.order_index < 0) {
    return '노출 순서는 0 이상의 정수여야 해요'
  }
  if (input.image && !/^https?:\/\//i.test(input.image.trim())) {
    return '이미지 URL은 http:// 또는 https://로 시작해야 해요'
  }
  return null
}

export function validateIslandId(id: string): string | null {
  const trimmed = id.trim()
  if (!trimmed) return '고유 ID를 입력해주세요'
  if (!SLUG_RE.test(trimmed)) return '고유 ID는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요'
  if (trimmed.length > 40) return '고유 ID는 40자 이하로 입력해주세요'
  return null
}

function isForeignKeyViolation(error: { code?: string } | null): boolean {
  return error?.code === '23503'
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

export const adminIslandService = {
  // 활성/비활성 여부와 무관하게 전부 가져온다 — 이 함수는 관리자 화면
  // 전용이며, admin 세션의 islands_select_admin RLS 정책이 전체 행을
  // 반환해준다.
  getAllIslands: async (): Promise<ServiceResult<Island[]>> => {
    const { data, error } = await supabase
      .from('islands')
      .select('*')
      .order('order_index')
      .order('name')

    if (error) {
      console.error('getAllIslands error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: data ?? [] }
  },

  createIsland: async (id: string, input: IslandInput): Promise<ServiceResult<Island>> => {
    const idError = validateIslandId(id)
    if (idError) return { success: false, error: idError }
    const inputError = validateIslandInput(input)
    if (inputError) return { success: false, error: inputError }

    const { data, error } = await supabase
      .from('islands')
      .insert({ id: id.trim(), ...toRow(input) })
      .select()
      .single()

    if (error) {
      console.error('createIsland error:', error)
      if (isUniqueViolation(error)) {
        return { success: false, error: '이미 사용 중인 고유 ID예요. 다른 값을 입력해주세요' }
      }
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'island_create', targetTable: 'islands', targetId: data.id,
      summary: `섬 추가: ${data.name}`,
    })
    return { success: true, data }
  },

  updateIsland: async (id: string, input: IslandInput): Promise<ServiceResult<Island>> => {
    const inputError = validateIslandInput(input)
    if (inputError) return { success: false, error: inputError }

    const { data, error } = await supabase
      .from('islands')
      .update(toRow(input))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('updateIsland error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'island_update', targetTable: 'islands', targetId: id,
      summary: `섬 수정: ${data.name}`,
    })
    return { success: true, data }
  },

  // 활성/비활성 전환 — 사용자 데이터와 연결됐을 가능성이 있는 섬을 안전하게
  // 내리는 기본 방법. 사용자 화면(getIslands/getIslandById)은 status='active'만
  // 보여주므로 이 한 번의 UPDATE로 즉시 노출/비노출이 반영된다.
  setIslandStatus: async (id: string, status: IslandStatus, name: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('islands').update({ status }).eq('id', id)
    if (error) {
      console.error('setIslandStatus error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'island_status_change', targetTable: 'islands', targetId: id,
      summary: `섬 ${status === 'active' ? '활성화' : '비활성화'}: ${name}`, metadata: { status },
    })
    return { success: true }
  },

  // 목록에서 바로 쓰는 순서 변경 전용 경로 — 전체 폼 검증 없이 order_index만
  // 빠르게 바꾼다(위/아래 이동 버튼용).
  setIslandOrder: async (id: string, orderIndex: number): Promise<ServiceResult> => {
    const { error } = await supabase.from('islands').update({ order_index: orderIndex }).eq('id', id)
    if (error) {
      console.error('setIslandOrder error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },

  // 완전 삭제 — attractions/restaurants/accommodations/photo_spots나 찜/여행
  // 데이터가 이 섬을 참조 중이면 FK 제약에 걸려 실패한다. 그 경우 삭제 대신
  // 비활성화를 안내한다(요구사항: "삭제가 안전한 경우에만 삭제 기능 제공").
  deleteIsland: async (id: string, name: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('islands').delete().eq('id', id)
    if (error) {
      console.error('deleteIsland error:', error)
      if (isForeignKeyViolation(error)) {
        return {
          success: false,
          error: '이 섬은 다른 데이터(관광지·맛집·찜 등)와 연결되어 있어 완전히 삭제할 수 없어요. 대신 비활성화를 이용해주세요',
        }
      }
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'island_delete', targetTable: 'islands', targetId: id,
      summary: `섬 완전 삭제: ${name}`,
    })
    return { success: true }
  },
}

function toRow(input: IslandInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    features: input.features,
    ferry_time: input.ferry_time.trim(),
    ferry_price: input.ferry_price,
    popularity_trend: input.popularity_trend,
    congestion: input.congestion,
    best_season: input.best_season.trim(),
    image: input.image?.trim() || null,
    ports: input.ports,
    lat: input.lat,
    lng: input.lng,
    status: input.status,
    order_index: input.order_index,
  }
}
