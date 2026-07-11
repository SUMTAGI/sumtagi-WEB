import { supabase } from './supabase'

export type UserRole = 'user' | 'host' | 'admin'
export type HostStatus = 'pending' | 'approved' | 'rejected'

export interface HostApplication {
  id: string
  business_name: string
  representative_name: string | null
  phone: string
  business_registration_number: string | null
  status: HostStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface HostApplicationInput {
  businessName: string
  representativeName?: string
  phone: string
  businessRegistrationNumber?: string
}

const uid = async () => (await supabase.auth.getUser()).data.user?.id

const toRow = (input: HostApplicationInput) => ({
  business_name: input.businessName.trim(),
  representative_name: input.representativeName?.trim() || null,
  phone: input.phone.trim(),
  business_registration_number: input.businessRegistrationNumber?.trim() || null,
})

export const hostService = {
  getMyHostApplication: async (): Promise<HostApplication | null> => {
    const id = await uid()
    if (!id) return null
    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('getMyHostApplication error:', error)
      return null
    }
    return data
  },

  createHostApplication: async (input: HostApplicationInput): Promise<HostApplication | null> => {
    const id = await uid()
    if (!id) return null
    const { data, error } = await supabase
      .from('hosts')
      .insert({ id, ...toRow(input) })
      .select()
      .single()
    if (error) {
      console.error('createHostApplication error:', error)
      return null
    }
    return data
  },

  updateHostApplication: async (input: HostApplicationInput): Promise<HostApplication | null> => {
    const id = await uid()
    if (!id) return null
    const { data, error } = await supabase
      .from('hosts')
      .update(toRow(input))
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('updateHostApplication error:', error)
      return null
    }
    return data
  },

  resubmitHostApplication: async (): Promise<boolean> => {
    const { error } = await supabase.rpc('resubmit_host_application')
    if (error) {
      console.error('resubmitHostApplication error:', error)
      return false
    }
    return true
  },
}
