import { createClient } from '@/lib/supabase/client'

export interface Rute {
  id: number
  kode: string
  nama: string
  terminal_awal: number | null
  terminal_akhir: number | null
  estimasi_menit: number | null
  status_operasi?: 'aktif' | 'tidak_aktif' | null
  halte_awal?: { id: number; nama: string; latitude: number; longitude: number } | null
  halte_akhir?: { id: number; nama: string; latitude: number; longitude: number } | null
}

export const getRute = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rute')
    .select(`
      *,
      halte_awal:halte!terminal_awal (id, nama, latitude, longitude),
      halte_akhir:halte!terminal_akhir (id, nama, latitude, longitude)
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as Rute[]
}

export const tambahRute = async (rute: Omit<Rute, 'id' | 'halte_awal' | 'halte_akhir'>) => {
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

export const editRute = async (id: number, rute: Partial<Omit<Rute, 'id' | 'halte_awal' | 'halte_akhir'>>) => {
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

export const hapusRute = async (id: number) => {
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

export const ambilTitikDalamRute = async (id_rute: number) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('titik_rute')
    .select('*')
    .eq('id_rute', id_rute)
    .order('urutan', { ascending: true })

  if (error) throw error
  return data as TitikRute[]
}

export const tambahTitik = async (titik: Omit<TitikRute, 'id'>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('titik_rute')
    .insert([titik])
    .select()
    .single()

  if (error) throw error
  return data as TitikRute
}

export const hapusTitik = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('titik_rute')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export const editUrutan = async (id_rute: number, list: Partial<TitikRute>[]) => {
  const supabase = createClient()

  // 1. Fetch current coordinate points in database
  const { data: dbPoints, error: fetchError } = await supabase
    .from('titik_rute')
    .select('*')
    .eq('id_rute', id_rute)

  if (fetchError) throw fetchError
  const currentPoints = dbPoints || []

  // 2. Identify points to delete
  // A point is deleted if it exists in database but its ID is not present in the new list
  const validNewIds = new Set(list.map(item => item.id).filter((id): id is number => !!id && id < 10000000000))
  const toDelete = currentPoints.filter(item => !validNewIds.has(item.id))

  // Execute deletes by ID
  for (const item of toDelete) {
    const { error: deleteError } = await supabase
      .from('titik_rute')
      .delete()
      .eq('id', item.id)
    if (deleteError) throw deleteError
  }

  // 3. Insert or Update points one-by-one to preserve sequence order
  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx]
    const payload = {
      id_rute,
      urutan: idx + 1,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude)
    }

    if (item.id && item.id < 10000000000) {
      // Update existing coordinate point
      const { error: updateError } = await supabase
        .from('titik_rute')
        .update(payload)
        .eq('id', item.id)
      if (updateError) throw updateError
    } else {
      // Insert new coordinate point
      const { error: insertError } = await supabase
        .from('titik_rute')
        .insert([payload])
      if (insertError) throw insertError
    }
  }

  return true
}

// Rute class methods
export const tambah = tambahRute
export const edit = editRute
export const hapus = hapusRute

export const getHalteList = async (idRute: number) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rute')
    .select('terminal_awal, terminal_akhir')
    .eq('id', idRute)
    .single()

  if (error) throw error
  return data
}

export const getTitikRute = ambilTitikDalamRute

export const tentukanRuteTerbaik = async (asal: string, tujuan: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rute')
    .select('*')
  if (error) throw error
  return data?.[0] || null
}

export const hitungEstimasiWaktu = (jarakKm: number, kecepatanKmh: number = 30): number => {
  return Math.round((jarakKm / kecepatanKmh) * 60)
}

export const validasiRute = (rute: Partial<Rute>): boolean => {
  return !!rute.kode && !!rute.nama && !!rute.terminal_awal && !!rute.terminal_akhir
}

export const cariLokasi = async (query: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('halte')
    .select('*')
    .ilike('nama', `%${query}%`)
  if (error) throw error
  return data
}

