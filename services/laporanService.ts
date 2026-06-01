import { createClient } from '@/lib/supabase/client'

export interface PerjalananLaporan {
  id: number
  id_pengguna: string
  waktu_mulai: string
  waktu_selesai: string | null
  status: string
  tanggal?: string
  estimasi_waktu?: number
  jarak?: number
  mode?: string
  durasi?: number | null
  biaya_estimasi?: number
  rute?: { nama: string, estimasi_menit: number | null }
  halte_asal?: { nama: string, latitude: number, longitude: number }
  halte_tujuan?: { nama: string, latitude: number, longitude: number }
  profil?: { nama: string, email: string }
}

export const getLaporanPerjalanan = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('perjalanan')
    .select(`
      *,
      rute:rute!id_rute (nama, estimasi_menit),
      halte_asal:halte!halte_asal (nama, latitude, longitude),
      halte_tujuan:halte!halte_tujuan (nama, latitude, longitude),
      profil:profiles!id_pengguna (nama, email)
    `)
    .order('waktu_mulai', { ascending: false })

  if (error) throw error
  return data as PerjalananLaporan[]
}
