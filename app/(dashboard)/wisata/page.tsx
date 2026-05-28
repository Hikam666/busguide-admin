'use client'

import { useState, useEffect } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Wisata, getWisata, createWisata, updateWisata, deleteWisata } from '@/services/wisataService'
import styles from './wisata.module.css'

export default function WisataPage() {
  const [data, setData] = useState<Wisata[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentWisata, setCurrentWisata] = useState<Partial<Wisata> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getWisata()
      setData(res)
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data Wisata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (wisata?: Wisata) => {
    if (wisata) {
      setCurrentWisata(wisata)
    } else {
      setCurrentWisata({ nama: '', alamat: '', kota: '', deskripsi: '', tarif: 0, jam_buka: '', jam_tutup: '', foto_url: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentWisata(null)
  }

  const handleOpenDelete = (wisata: Wisata) => {
    setCurrentWisata(wisata)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentWisata(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWisata?.nama) {
      alert('Nama Wisata wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        nama: currentWisata.nama,
        alamat: currentWisata.alamat || null,
        kota: currentWisata.kota || null,
        deskripsi: currentWisata.deskripsi || null,
        tarif: currentWisata.tarif || null,
        jam_buka: currentWisata.jam_buka || null,
        jam_tutup: currentWisata.jam_tutup || null,
        foto_url: currentWisata.foto_url || null
      }
      
      if (currentWisata.id) {
        await updateWisata(currentWisata.id, payload)
      } else {
        await createWisata(payload)
      }
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentWisata?.id) return
    setSubmitting(true)
    try {
      await deleteWisata(currentWisata.id)
      handleCloseDelete()
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus data.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'nama', title: 'Nama Wisata' },
    { key: 'kota', title: 'Kota', render: (item: Wisata) => item.kota || '-' },
    { key: 'tarif', title: 'Tarif', render: (item: Wisata) => item.tarif ? `Rp ${item.tarif.toLocaleString('id-ID')}` : 'Gratis' },
    { key: 'jam_buka', title: 'Jam Buka', render: (item: Wisata) => item.jam_buka ? `${item.jam_buka} - ${item.jam_tutup}` : '-' },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: Wisata) => (
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
        <h1 className={styles.title}>Manajemen Data Wisata</h1>
        <Button onClick={() => handleOpenModal()}>Tambah Wisata</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} />

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={currentWisata?.id ? 'Edit Wisata' : 'Tambah Wisata'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <Input 
            label="Nama Wisata" 
            value={currentWisata?.nama || ''} 
            onChange={(e) => setCurrentWisata({...currentWisata, nama: e.target.value})}
            required 
          />
          <div className={styles.row}>
            <Input 
              label="Kota" 
              value={currentWisata?.kota || ''} 
              onChange={(e) => setCurrentWisata({...currentWisata, kota: e.target.value})}
            />
            <Input 
              label="Tarif Masuk (Rp)" 
              type="number"
              value={currentWisata?.tarif || ''} 
              onChange={(e) => setCurrentWisata({...currentWisata, tarif: parseInt(e.target.value)})}
            />
          </div>
          <Input 
            label="Alamat" 
            value={currentWisata?.alamat || ''} 
            onChange={(e) => setCurrentWisata({...currentWisata, alamat: e.target.value})}
          />
          <div className={styles.row}>
            <Input 
              label="Jam Buka" 
              type="time"
              value={currentWisata?.jam_buka || ''} 
              onChange={(e) => setCurrentWisata({...currentWisata, jam_buka: e.target.value})}
            />
            <Input 
              label="Jam Tutup" 
              type="time"
              value={currentWisata?.jam_tutup || ''} 
              onChange={(e) => setCurrentWisata({...currentWisata, jam_tutup: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Deskripsi</label>
            <textarea 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', minHeight: '100px', resize: 'vertical'
              }}
              value={currentWisata?.deskripsi || ''}
              onChange={(e) => setCurrentWisata({...currentWisata, deskripsi: e.target.value})}
            />
          </div>
          <Input 
            label="Foto URL" 
            type="url"
            value={currentWisata?.foto_url || ''} 
            onChange={(e) => setCurrentWisata({...currentWisata, foto_url: e.target.value})}
          />
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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus wisata <strong>{currentWisata?.nama}</strong>?</p>
      </Modal>
    </div>
  )
}
