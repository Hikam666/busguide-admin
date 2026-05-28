import { createClient } from '@/lib/supabase/client'

export interface Wisata {
  id: number
  nama: string
  alamat: string | null
  kota: string | null
  deskripsi: string | null
  tarif: number | null
  jam_buka: string | null
  jam_tutup: string | null
  foto_url: string | null
}

export const getWisata = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wisata')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw error
  return data as Wisata[]
}

export const createWisata = async (wisata: Omit<Wisata, 'id'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('wisata')
    .insert([{ ...wisata, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as Wisata
}

export const updateWisata = async (id: number, wisata: Partial<Omit<Wisata, 'id'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wisata')
    .update(wisata)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Wisata
}

export const deleteWisata = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('wisata')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
