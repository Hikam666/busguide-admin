import { createClient } from '@/lib/supabase/client'
import { PerjalananLaporan } from './laporanService'

export interface Notifikasi {
  id: number
  id_perjalanan: number | null
  pesan: string
  tipe: 'alarm' | 'info' | 'selesai'
  dikirim_at?: string
  created_at?: string
  perjalanan?: PerjalananLaporan
}

export const getNotifikasi = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifikasi')
    .select(`
      *,
      perjalanan (
        id,
        waktu_mulai,
        status,
        profil:profiles!id_pengguna (nama)
      )
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as Notifikasi[]
}

export const createNotifikasi = async (notif: Partial<Notifikasi>) => {
  const supabase = createClient()
  const payload = {
    id_perjalanan: notif.id_perjalanan || null,
    pesan: notif.pesan,
    tipe: notif.tipe || 'info'
  }

  const { data, error } = await supabase
    .from('notifikasi')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data as Notifikasi
}

export const updateNotifikasi = async (id: number, notif: Partial<Notifikasi>) => {
  const supabase = createClient()
  const payload = {
    id_perjalanan: notif.id_perjalanan || null,
    pesan: notif.pesan,
    tipe: notif.tipe
  }

  const { data, error } = await supabase
    .from('notifikasi')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Notifikasi
}

export const deleteNotifikasi = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifikasi')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
