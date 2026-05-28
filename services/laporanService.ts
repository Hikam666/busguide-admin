import { createClient } from '@/lib/supabase/client'

export interface PerjalananLaporan {
  id: number
  id_pengguna: string
  waktu_mulai: string
  waktu_selesai: string | null
  status: string
  rute?: { nama: string }
  halte_asal?: { nama: string }
  halte_tujuan?: { nama: string }
  profil?: { nama: string, email: string }
}

export const getLaporanPerjalanan = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('perjalanan')
    .select(`
      *,
      rute:rute!id_rute (nama),
      halte_asal:halte!halte_asal (nama),
      halte_tujuan:halte!halte_tujuan (nama),
      profil:profiles!id_pengguna (nama, email)
    `)
    .order('waktu_mulai', { ascending: false })

  if (error) throw error
  return data as any[]
}
