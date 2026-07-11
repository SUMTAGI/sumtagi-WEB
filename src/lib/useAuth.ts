import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { HostApplication, UserRole } from './hostService'

interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  travel_style: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hostApplication, setHostApplication] = useState<HostApplication | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // profile/hosts는 로그인한 사용자의 id가 실제로 바뀔 때만 다시 조회한다
  // (토큰 갱신 등 onAuthStateChange가 자주 쏘는 이벤트마다 재조회하지 않기 위함).
  useEffect(() => {
    let cancelled = false

    if (!user) {
      setProfile(null)
      setHostApplication(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('hosts').select('*').eq('id', user.id).maybeSingle(),
    ]).then(([profileRes, hostRes]) => {
      if (cancelled) return
      if (profileRes.error) console.error('profile fetch error:', profileRes.error)
      if (hostRes.error) console.error('host application fetch error:', hostRes.error)
      setProfile((profileRes.data as Profile) ?? null)
      setHostApplication((hostRes.data as HostApplication) ?? null)
      setProfileLoading(false)
    })

    return () => { cancelled = true }
  }, [user?.id])

  const nickname = profile?.nickname ?? (user?.user_metadata?.nickname as string | undefined)
  const displayName = nickname ?? user?.email?.split('@')[0] ?? '사용자'
  const role: UserRole = profile?.role ?? 'user'
  const isAdmin = role === 'admin'
  const isHost = role === 'host'
  // 세션 확인과 profile/hosts 조회가 모두 끝나야 loading이 풀린다 —
  // 역할별 메뉴가 잘못된 상태로 잠깐 보이는 것을 막기 위함(MyPage 등에서 사용).
  const loading = sessionLoading || profileLoading

  return {
    user,
    profile,
    role,
    hostApplication,
    isHost,
    isAdmin,
    loading,
    displayName,
    signOut: () => supabase.auth.signOut(),
  }
}
