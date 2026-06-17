import { supabase } from './supabase'

export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email: string, password: string, nickname: string, travelStyle: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname, travel_style: travelStyle } },
    }),

  signOut: () => supabase.auth.signOut(),

  getUser: () => supabase.auth.getUser(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),

  localizedError: (message: string) => {
    if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 틀렸어요'
    if (message.includes('Email not confirmed')) return '이메일 인증이 필요해요'
    if (message.includes('already registered')) return '이미 가입된 이메일이에요'
    if (message.includes('Password should be')) return '비밀번호는 6자 이상이어야 해요'
    if (message.includes('Unable to validate email')) return '올바른 이메일 형식이 아니에요'
    return '오류가 발생했어요. 다시 시도해주세요'
  },
}
