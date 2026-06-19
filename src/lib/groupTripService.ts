import { supabase } from './supabase'

export interface GroupMember {
  id: string
  name: string
  avatar: string
  isOwner: boolean
}

export interface GroupExpense {
  id: string
  description: string
  amount: number
  paidBy: string
  date: string
}

export interface GroupPoll {
  id: string
  question: string
  options: { id: string; text: string; votes: string[] }[]
  createdBy: string
  isActive: boolean
}

export interface GroupTripData {
  id: string
  name: string
  destination: string[]
  startDate: string
  endDate: string
  members: GroupMember[]
  expenses: GroupExpense[]
  polls: GroupPoll[]
  inviteCode: string
}

const uid = async () => (await supabase.auth.getUser()).data.user?.id

const SELECT = `
  *,
  group_members(user_id, profiles(nickname, avatar_url)),
  group_expenses(id, description, amount, paid_by, created_at),
  group_polls(id, question, options, is_active, created_by, created_at)
`.trim()

function mapGroup(g: any, currentUserId: string): GroupTripData {
  return {
    id: g.id,
    name: g.name,
    destination: g.destination ?? [],
    startDate: g.start_date,
    endDate: g.end_date,
    inviteCode: g.invite_code,
    members: (g.group_members ?? []).map((m: any) => ({
      id: m.user_id,
      name: m.user_id === currentUserId ? '나' : (m.profiles?.nickname ?? '멤버'),
      avatar: m.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`,
      isOwner: m.user_id === g.created_by,
    })),
    expenses: (g.group_expenses ?? [])
      .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
      .map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        paidBy: e.paid_by,
        date: e.created_at,
      })),
    polls: (g.group_polls ?? [])
      .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
      .map((p: any) => ({
        id: p.id,
        question: p.question,
        options: p.options ?? [],
        createdBy: p.created_by,
        isActive: p.is_active,
      })),
  }
}

export const groupTripService = {
  getMyGroups: async (): Promise<GroupTripData[]> => {
    const id = await uid()
    if (!id) return []

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', id)

    if (!memberships?.length) return []

    const groupIds = memberships.map((m: any) => m.group_id)
    const { data } = await supabase
      .from('group_trips')
      .select(SELECT)
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    return (data ?? []).map(g => mapGroup(g, id))
  },

  getGroupById: async (groupId: string): Promise<GroupTripData | null> => {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase.from('group_trips').select(SELECT).eq('id', groupId).single()
    return data ? mapGroup(data, id) : null
  },

  getGroupByInviteCode: async (code: string): Promise<GroupTripData | null> => {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase
      .from('group_trips')
      .select(SELECT)
      .eq('invite_code', code.toUpperCase())
      .maybeSingle()
    return data ? mapGroup(data, id) : null
  },

  createGroup: async (
    name: string,
    destination: string[],
    startDate: string,
    endDate: string,
  ): Promise<GroupTripData | null> => {
    const id = await uid()
    if (!id) return null

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: group, error } = await supabase
      .from('group_trips')
      .insert({ name, destination, start_date: startDate, end_date: endDate, invite_code: inviteCode, created_by: id })
      .select('id')
      .single()

    if (error || !group) return null

    await supabase.from('group_members').insert({ group_id: group.id, user_id: id })
    return groupTripService.getGroupById(group.id)
  },

  joinGroup: async (groupId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    const { error } = await supabase
      .from('group_members')
      .upsert({ group_id: groupId, user_id: id }, { onConflict: 'group_id,user_id' })
    return !error
  },

  addExpense: async (groupId: string, description: string, amount: number): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    const { error } = await supabase
      .from('group_expenses')
      .insert({ group_id: groupId, description, amount, paid_by: id })
    return !error
  },

  addPoll: async (
    groupId: string,
    question: string,
    options: { id: string; text: string; votes: string[] }[],
  ): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    const { error } = await supabase
      .from('group_polls')
      .insert({ group_id: groupId, question, options, created_by: id, is_active: true })
    return !error
  },

  deleteGroup: async (groupId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    const { error } = await supabase.from('group_trips').delete().eq('id', groupId).eq('created_by', id)
    return !error
  },

  leaveGroup: async (groupId: string): Promise<boolean> => {
    const id = await uid()
    if (!id) return false
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', id)
    return !error
  },

  vote: async (
    pollId: string,
    optionId: string,
    currentOptions: { id: string; text: string; votes: string[] }[],
  ): Promise<'ok' | 'already_voted' | 'error'> => {
    const id = await uid()
    if (!id) return 'error'

    if (currentOptions.some(opt => opt.votes.includes(id))) return 'already_voted'

    const newOptions = currentOptions.map(opt =>
      opt.id === optionId ? { ...opt, votes: [...opt.votes, id] } : opt
    )
    const { error } = await supabase.from('group_polls').update({ options: newOptions }).eq('id', pollId)
    return error ? 'error' : 'ok'
  },
}
