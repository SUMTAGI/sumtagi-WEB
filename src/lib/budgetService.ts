import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const budgetService = {
  getExpenses: async () => {
    const id = await uid()
    if (!id) return []
    const { data } = await supabase.from('budget_items').select().eq('user_id', id).order('created_at', { ascending: false })
    return data ?? []
  },

  addExpense: async (category: string, amount: number, description: string) => {
    const id = await uid()
    if (!id) return
    await supabase.from('budget_items').insert({ user_id: id, category, amount, description })
  },

  deleteExpense: async (itemId: string) => {
    await supabase.from('budget_items').delete().eq('id', itemId)
  },
}
