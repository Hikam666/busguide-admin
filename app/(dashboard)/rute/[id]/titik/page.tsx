'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TitikRute, getTitikRute, createTitikRute, deleteTitikRute } from '@/services/ruteService'
import styles from './titik.module.css'

export default function TitikRutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idRute = parseInt(id)
  
  const [data, setData] = useState<TitikRute[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTitik, setCurrentTitik] = useState<Partial<TitikRute>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getTitikRute(idRute)
      setData(res)
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil titik rute')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [idRute])

  const handleOpenModal = () => {
    const nextUrutan = data.length > 0 ? Math.max(...data.map(d => d.urutan)) + 1 : 1
    setCurrentTitik({ urutan: nextUrutan, latitude: 0, longitude: 0 })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentTitik({})
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentTitik.urutan === undefined || currentTitik.latitude === undefined || currentTitik.longitude === undefined) {
      alert('Mohon isi semua field')
      return
    }

    setSubmitting(true)
    try {
      await createTitikRute({
        id_rute: idRute,
        urutan: currentTitik.urutan,
        latitude: currentTitik.latitude,
        longitude: currentTitik.longitude
      })
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert('Gagal menyimpan titik')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus titik ini?')) return
    try {
      await deleteTitikRute(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus titik')
    }
  }

  const columns = [
    { key: 'urutan', title: 'Urutan' },
    { key: 'latitude', title: 'Latitude' },
    { key: 'longitude', title: 'Longitude' },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: TitikRute) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Hapus</Button>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Link href="/rute" className={styles.backBtn}>&larr; Kembali</Link>
          <h2>Titik Koordinat Rute</h2>
        </div>
        <Button onClick={handleOpenModal}>Tambah Titik</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} emptyMessage="Belum ada titik koordinat. Tambahkan titik untuk membentuk jalur di peta." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title="Tambah Titik Koordinat"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <Input 
            label="Urutan" 
            type="number"
            value={currentTitik?.urutan || ''} 
            onChange={(e) => setCurrentTitik({...currentTitik, urutan: parseInt(e.target.value)})}
            required 
          />
          <div className={styles.row}>
            <Input 
              label="Latitude" 
              type="number" step="any"
              value={currentTitik?.latitude || ''} 
              onChange={(e) => setCurrentTitik({...currentTitik, latitude: parseFloat(e.target.value)})}
              required 
            />
            <Input 
              label="Longitude" 
              type="number" step="any"
              value={currentTitik?.longitude || ''} 
              onChange={(e) => setCurrentTitik({...currentTitik, longitude: parseFloat(e.target.value)})}
              required 
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
