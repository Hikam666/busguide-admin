'use client'

import { useState, useEffect } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Halte, getHalte, createHalte, updateHalte, deleteHalte } from '@/services/halteService'
import styles from './halte.module.css'

export default function HaltePage() {
  const [data, setData] = useState<Halte[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentHalte, setCurrentHalte] = useState<Partial<Halte> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getHalte()
      setData(res)
    } catch (error) {
      console.error('Failed to fetch halte:', error)
      alert('Gagal mengambil data halte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (halte?: Halte) => {
    if (halte) {
      setCurrentHalte(halte)
    } else {
      setCurrentHalte({ tipe: 'halte', latitude: 0, longitude: 0 })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentHalte(null)
  }

  const handleOpenDelete = (halte: Halte) => {
    setCurrentHalte(halte)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentHalte(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHalte?.nama || currentHalte.latitude === undefined || currentHalte.longitude === undefined) {
      alert('Mohon isi field yang wajib')
      return
    }

    setSubmitting(true)
    try {
      if (currentHalte.id) {
        await updateHalte(currentHalte.id, {
          nama: currentHalte.nama,
          tipe: currentHalte.tipe as 'halte' | 'terminal',
          alamat: currentHalte.alamat,
          latitude: currentHalte.latitude,
          longitude: currentHalte.longitude
        })
      } else {
        await createHalte({
          nama: currentHalte.nama,
          tipe: (currentHalte.tipe || 'halte') as 'halte' | 'terminal',
          alamat: currentHalte.alamat || '',
          latitude: currentHalte.latitude,
          longitude: currentHalte.longitude
        })
      }
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      const errorMsg = error?.message || error?.details || JSON.stringify(error)
      alert(`Gagal menyimpan data. Detail: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentHalte?.id) return
    setSubmitting(true)
    try {
      await deleteHalte(currentHalte.id)
      handleCloseDelete()
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus data. Halte mungkin sedang digunakan pada rute.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'nama', title: 'Nama' },
    { key: 'tipe', title: 'Tipe' },
    { key: 'alamat', title: 'Alamat' },
    { 
      key: 'koordinat', 
      title: 'Koordinat',
      render: (item: Halte) => `${item.latitude}, ${item.longitude}`
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: Halte) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleOpenDelete(item)}>Hapus</Button>
        </div>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen Halte & Terminal</h1>
        <Button onClick={() => handleOpenModal()}>Tambah Halte</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} />

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={currentHalte?.id ? 'Edit Halte' : 'Tambah Halte'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form id="halte-form" onSubmit={handleSave}>
          <Input 
            label="Nama Halte/Terminal" 
            value={currentHalte?.nama || ''} 
            onChange={(e) => setCurrentHalte({...currentHalte, nama: e.target.value})}
            required 
          />
          
          <div className={styles.formGroup}>
            <label className="text-sm font-medium text-main mb-1">Tipe</label>
            <select 
              className="w-full p-2.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:border-primary"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-main)',
              }}
              value={currentHalte?.tipe || 'halte'}
              onChange={(e) => setCurrentHalte({...currentHalte, tipe: e.target.value as 'halte'|'terminal'})}
            >
              <option value="halte">Halte</option>
              <option value="terminal">Terminal</option>
            </select>
          </div>

          <Input 
            label="Alamat" 
            value={currentHalte?.alamat || ''} 
            onChange={(e) => setCurrentHalte({...currentHalte, alamat: e.target.value})}
          />
          
          <div className={styles.row}>
            <Input 
              label="Latitude" 
              type="number"
              step="any"
              value={currentHalte?.latitude || 0} 
              onChange={(e) => setCurrentHalte({...currentHalte, latitude: parseFloat(e.target.value)})}
              required 
            />
            <Input 
              label="Longitude" 
              type="number"
              step="any"
              value={currentHalte?.longitude || 0} 
              onChange={(e) => setCurrentHalte({...currentHalte, longitude: parseFloat(e.target.value)})}
              required 
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseDelete}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={submitting}>Ya, Hapus</Button>
          </>
        }
      >
        <div className={styles.deleteConfirm}>
          <p>Apakah Anda yakin ingin menghapus <strong>{currentHalte?.nama}</strong>?</p>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Data ini tidak dapat dikembalikan. Jika halte masih digunakan dalam suatu rute, proses hapus mungkin akan gagal.
          </span>
        </div>
      </Modal>
    </div>
  )
}
