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

export const tambahHalte = async (halte: Omit<Halte, 'id'>) => {
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

export const editHalte = async (id: number, halte: Partial<Omit<Halte, 'id'>>) => {
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

export const hapusHalte = async (id: number) => {
  const supabase = createClient()
  
  // TODO: Check if halte is used in a route before deleting if required
  
  const { error } = await supabase
    .from('halte')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Halte class methods
export const tambah = tambahHalte
export const edit = editHalte
export const hapus = hapusHalte

export const validasiKoordinat = (latitude: number, longitude: number): boolean => {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
}

export const hitungHalteTerdekat = (lat: number, lon: number, daftarHalte: Halte[]): Halte | null => {
  if (daftarHalte.length === 0) return null
  let terdekat: Halte | null = null
  let jarakTerkecil = Infinity

  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371 // Earth radius in km

  for (const h of daftarHalte) {
    const dLat = toRad(h.latitude - lat)
    const dLon = toRad(h.longitude - lon)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(h.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    if (d < jarakTerkecil) {
      jarakTerkecil = d
      terdekat = h
    }
  }
  return terdekat
}

export const getBusById = async (id: number): Promise<Halte> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('halte')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Halte
}
