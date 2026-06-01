import { createClient } from '@/lib/supabase/client'

export interface PoBus {
  id: number
  nama: string
  tagline: string | null
  deskripsi: string | null
  logo_url: string | null
  jenis_layanan?: string | null
  fasilitas?: string | null
  kontak?: string | null
}

export interface Bus {
  id: number
  nomor_polisi: string
  nama_bus?: string | null
  tipe: string
  id_po: number | null
  kapasitas: number | null
  fasilitas: string[] | null
  status: 'aktif' | 'tidak_aktif'
  po_bus?: {
    nama: string
    logo_url: string | null
  } | null
}

// === PO Bus Operations ===

export const getPoBus = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('po_bus')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw error
  return data as PoBus[]
}

export const createPoBus = async (po: Omit<PoBus, 'id'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('po_bus')
    .insert([{ ...po, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as PoBus
}

export const updatePoBus = async (id: number, po: Partial<Omit<PoBus, 'id'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('po_bus')
    .update(po)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PoBus
}

export const deletePoBus = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('po_bus')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// === Bus (Armada) Operations ===

export const getBusWithPo = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bus')
    .select(`
      *,
      po_bus (
        nama,
        logo_url
      )
    `)
    .order('id', { ascending: false })

  if (error) throw error
  return data as Bus[]
}

export const createBus = async (bus: Omit<Bus, 'id' | 'po_bus'>) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('bus')
    .insert([{ ...bus, created_by: user?.id }])
    .select()
    .single()

  if (error) throw error
  return data as Bus
}

export const updateBus = async (id: number, bus: Partial<Omit<Bus, 'id' | 'po_bus'>>) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bus')
    .update(bus)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Bus
}

export const deleteBus = async (id: number) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('bus')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
