import { createClient } from '@/lib/supabase/client'

export interface Jadwal {
  id: number
  id_rute: number
  id_bus: number | null
  jam_berangkat: string
  estimasi_menit: number | null
  hari: string[] | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  status: 'aktif' | 'tidak_aktif'
  interval?: number | null
  tarif?: number | null
  rute?: { nama: string, kode: string }
  bus?: { 
    nomor_polisi: string
    tipe: string
    id_po: number | null
    po_bus?: { nama: string, logo_url: string | null }
  }
}

export const getJadwal = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      *,
      rute:rute!id_rute (nama, kode),
      bus:bus!id_bus (
        nomor_polisi,
        tipe,
        id_po,
        po_bus (nama, logo_url)
      )
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as Jadwal[]
}

export const tambahJadwal = async (jadwal: Omit<Jadwal, 'id' | 'rute' | 'bus'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('jadwal')
    .insert([{ ...jadwal, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as Jadwal
}

export const editJadwal = async (id: number, jadwal: Partial<Omit<Jadwal, 'id' | 'rute' | 'bus'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jadwal')
    .update(jadwal)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Jadwal
}

export const hapusJadwal = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('jadwal')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export const getBus = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bus')
    .select('*')
    
  if (error) throw error
  return data
}

// Jadwal class methods
export const tambah = tambahJadwal
export const edit = editJadwal
export const hapus = hapusJadwal
