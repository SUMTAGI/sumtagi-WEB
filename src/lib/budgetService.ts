import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const budgetService = {
  getExpenses: async () => {
    const id = await uid()
    if (!id) return []
    const { data, error } = await supabase.from('budget_items').select().eq('user_id', id).order('created_at', { ascending: false })
    if (error) console.error('getExpenses error:', error)
    return data ?? []
  },

  addExpense: async (category: string, amount: number, description: string) => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('budget_items').insert({ user_id: id, category, amount, description })
    if (error) console.error('addExpense error:', error)
  },

  deleteExpense: async (itemId: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId)
    if (error) console.error('deleteExpense error:', error)
  },
}
