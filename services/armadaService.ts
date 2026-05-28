import { createClient } from '@/lib/supabase/client'

export interface PoBus {
  id: number
  nama: string
  tagline: string | null
  deskripsi: string | null
  logo_url: string | null
}

export const getPoBus = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('po_bus')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw error
  return data as PoBus[]
}

export const createPoBus = async (po: Omit<PoBus, 'id'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('po_bus')
    .insert([{ ...po, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as PoBus
}

export const updatePoBus = async (id: number, po: Partial<Omit<PoBus, 'id'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('po_bus')
    .update(po)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PoBus
}

export const deletePoBus = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('po_bus')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
