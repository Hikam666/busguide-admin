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
  rute_wisata?: {
    id_rute: number
    rute: {
      id: number
      kode: string
      nama: string
      halte_awal?: { nama: string } | null
      halte_akhir?: { nama: string } | null
    } | null
  }[]
}

export const getWisata = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wisata')
    .select(`
      *,
      rute_wisata (
        id_rute,
        rute (
          id,
          kode,
          nama,
          halte_awal:halte!terminal_awal (nama),
          halte_akhir:halte!terminal_akhir (nama)
        )
      )
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as Wisata[]
}

export const createWisata = async (wisata: Omit<Wisata, 'id' | 'rute_wisata'>, id_rute?: number | null) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('wisata')
    .insert([{ ...wisata, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error

  if (id_rute) {
    const { error: relError } = await supabase
      .from('rute_wisata')
      .insert([{ id_wisata: data.id, id_rute }])
    if (relError) throw relError
  }

  return data as Wisata
}

export const updateWisata = async (
  id: number,
  wisata: Partial<Omit<Wisata, 'id' | 'rute_wisata'>>,
  id_rute?: number | null
) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wisata')
    .update(wisata)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Delete existing associations
  const { error: delError } = await supabase
    .from('rute_wisata')
    .delete()
    .eq('id_wisata', id)
  if (delError) throw delError

  // Insert new association if provided
  if (id_rute) {
    const { error: relError } = await supabase
      .from('rute_wisata')
      .insert([{ id_wisata: id, id_rute }])
    if (relError) throw relError
  }

  return data as Wisata
}

export const deleteWisata = async (id: number) => {
  const supabase = createClient()
  
  // Clean up relationships first
  const { error: relError } = await supabase
    .from('rute_wisata')
    .delete()
    .eq('id_wisata', id)
  if (relError) throw relError

  const { error } = await supabase
    .from('wisata')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
