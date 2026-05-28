'use client'

import { useState, useEffect } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PoBus, getPoBus, createPoBus, updatePoBus, deletePoBus } from '@/services/armadaService'
import styles from './armada.module.css'

export default function ArmadaPage() {
  const [data, setData] = useState<PoBus[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPo, setCurrentPo] = useState<Partial<PoBus> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getPoBus()
      setData(res)
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data PO Bus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (po?: PoBus) => {
    if (po) {
      setCurrentPo(po)
    } else {
      setCurrentPo({ nama: '', tagline: '', deskripsi: '', logo_url: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentPo(null)
  }

  const handleOpenDelete = (po: PoBus) => {
    setCurrentPo(po)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentPo(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPo?.nama) {
      alert('Nama PO Bus wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      if (currentPo.id) {
        await updatePoBus(currentPo.id, {
          nama: currentPo.nama,
          tagline: currentPo.tagline || null,
          deskripsi: currentPo.deskripsi || null,
          logo_url: currentPo.logo_url || null
        })
      } else {
        await createPoBus({
          nama: currentPo.nama,
          tagline: currentPo.tagline || null,
          deskripsi: currentPo.deskripsi || null,
          logo_url: currentPo.logo_url || null
        })
      }
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      if (error.code === '23505') {
        alert('PO sudah terdaftar dalam sistem')
      } else {
        alert(error.message || 'Gagal menyimpan data')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPo?.id) return
    setSubmitting(true)
    try {
      await deletePoBus(currentPo.id)
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
    { key: 'nama', title: 'Nama PO' },
    { key: 'tagline', title: 'Tagline', render: (item: PoBus) => item.tagline || '-' },
    { key: 'deskripsi', title: 'Deskripsi', render: (item: PoBus) => item.deskripsi ? item.deskripsi.substring(0, 50) + '...' : '-' },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: PoBus) => (
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
        <h1 className={styles.title}>Manajemen Armada/PO Bus</h1>
        <Button onClick={() => handleOpenModal()}>Tambah PO Bus</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} />

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={currentPo?.id ? 'Edit PO Bus' : 'Tambah PO Bus'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <Input 
            label="Nama PO Bus" 
            value={currentPo?.nama || ''} 
            onChange={(e) => setCurrentPo({...currentPo, nama: e.target.value})}
            required 
          />
          <Input 
            label="Tagline" 
            value={currentPo?.tagline || ''} 
            onChange={(e) => setCurrentPo({...currentPo, tagline: e.target.value})}
          />
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Deskripsi</label>
            <textarea 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', minHeight: '100px', resize: 'vertical'
              }}
              value={currentPo?.deskripsi || ''}
              onChange={(e) => setCurrentPo({...currentPo, deskripsi: e.target.value})}
            />
          </div>
          <Input 
            label="Logo URL" 
            type="url"
            value={currentPo?.logo_url || ''} 
            onChange={(e) => setCurrentPo({...currentPo, logo_url: e.target.value})}
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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus PO Bus <strong>{currentPo?.nama}</strong>?</p>
      </Modal>
    </div>
  )
}
