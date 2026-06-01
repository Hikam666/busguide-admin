import { createClient } from '@/lib/supabase/client'

export interface Halte {
  id: number
  nama: string
  tipe: 'halte' | 'terminal'
  alamat: string | null
  latitude: number
  longitude: number
  fasilitas?: string | null
  foto?: string | null
}

export const getHalte = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('halte')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw error
  return data as Halte[]
}

export const createHalte = async (halte: Omit<Halte, 'id'>) => {
  const supabase = createClient()
  
  // Get current user id
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('halte')
    .insert([{ ...halte, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as Halte
}

export const updateHalte = async (id: number, halte: Partial<Omit<Halte, 'id'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('halte')
    .update(halte)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Halte
}

export const deleteHalte = async (id: number) => {
  const supabase = createClient()
  
  // TODO: Check if halte is used in a route before deleting if required
  
  const { error } = await supabase
    .from('halte')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
