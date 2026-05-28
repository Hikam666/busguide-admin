import { createClient } from '@/lib/supabase/client'

export interface Rute {
  id: number
  kode: string
  nama: string
  terminal_awal: number | null
  terminal_akhir: number | null
  estimasi_menit: number | null
  halte_awal?: { nama: string }
  halte_akhir?: { nama: string }
}

export const getRute = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rute')
    .select(`
      *,
      halte_awal:halte!terminal_awal (nama),
      halte_akhir:halte!terminal_akhir (nama)
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as any[]
}

export const createRute = async (rute: Omit<Rute, 'id' | 'halte_awal' | 'halte_akhir'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('rute')
    .insert([{ ...rute, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as Rute
}

export const updateRute = async (id: number, rute: Partial<Omit<Rute, 'id' | 'halte_awal' | 'halte_akhir'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rute')
    .update(rute)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Rute
}

export const deleteRute = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('rute')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// === Titik Rute (UC-15a) ===
export interface TitikRute {
  id: number
  id_rute: number
  urutan: number
  latitude: number
  longitude: number
}

export const getTitikRute = async (id_rute: number) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('titik_rute')
    .select('*')
    .eq('id_rute', id_rute)
    .order('urutan', { ascending: true })

  if (error) throw error
  return data as TitikRute[]
}

export const createTitikRute = async (titik: Omit<TitikRute, 'id'>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('titik_rute')
    .insert([titik])
    .select()
    .single()

  if (error) throw error
  return data as TitikRute
}

export const deleteTitikRute = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('titik_rute')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
