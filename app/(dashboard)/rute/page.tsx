'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Rute, getRute, createRute, updateRute, deleteRute } from '@/services/ruteService'
import { Halte, getHalte } from '@/services/halteService'
import styles from './rute.module.css'

export default function RutePage() {
  const router = useRouter()
  const [data, setData] = useState<Rute[]>([])
  const [halteList, setHalteList] = useState<Halte[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentRute, setCurrentRute] = useState<Partial<Rute> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ruteRes, halteRes] = await Promise.all([getRute(), getHalte()])
      setData(ruteRes)
      setHalteList(halteRes)
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data rute')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (rute?: Rute) => {
    if (rute) {
      setCurrentRute(rute)
    } else {
      setCurrentRute({ kode: '', nama: '', terminal_awal: null, terminal_akhir: null, estimasi_menit: null })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentRute(null)
  }

  const handleOpenDelete = (rute: Rute) => {
    setCurrentRute(rute)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentRute(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRute?.kode || !currentRute?.nama) {
      alert('Kode dan Nama wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      if (currentRute.id) {
        await updateRute(currentRute.id, {
          kode: currentRute.kode,
          nama: currentRute.nama,
          terminal_awal: currentRute.terminal_awal || null,
          terminal_akhir: currentRute.terminal_akhir || null,
          estimasi_menit: currentRute.estimasi_menit || null
        })
      } else {
        await createRute({
          kode: currentRute.kode,
          nama: currentRute.nama,
          terminal_awal: currentRute.terminal_awal || null,
          terminal_akhir: currentRute.terminal_akhir || null,
          estimasi_menit: currentRute.estimasi_menit || null
        })
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
    if (!currentRute?.id) return
    setSubmitting(true)
    try {
      await deleteRute(currentRute.id)
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
    { key: 'kode', title: 'Kode' },
    { key: 'nama', title: 'Nama Rute' },
    { 
      key: 'terminal_awal', 
      title: 'Awal',
      render: (item: Rute) => item.halte_awal?.nama || '-'
    },
    { 
      key: 'terminal_akhir', 
      title: 'Akhir',
      render: (item: Rute) => item.halte_akhir?.nama || '-'
    },
    { 
      key: 'estimasi_menit', 
      title: 'Estimasi (Mnt)',
      render: (item: Rute) => item.estimasi_menit ? `${item.estimasi_menit} menit` : '-'
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: Rute) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => router.push(`/rute/${item.id}/titik`)}>Titik Koordinat</Button>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleOpenDelete(item)}>Hapus</Button>
        </div>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen Rute Bus</h1>
        <Button onClick={() => handleOpenModal()}>Tambah Rute</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} />

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={currentRute?.id ? 'Edit Rute' : 'Tambah Rute'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className={styles.row}>
            <Input 
              label="Kode Rute" 
              value={currentRute?.kode || ''} 
              onChange={(e) => setCurrentRute({...currentRute, kode: e.target.value})}
              required 
            />
            <Input 
              label="Nama Rute" 
              value={currentRute?.nama || ''} 
              onChange={(e) => setCurrentRute({...currentRute, nama: e.target.value})}
              required 
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Terminal Awal</label>
              <select 
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                }}
                value={currentRute?.terminal_awal || ''}
                onChange={(e) => setCurrentRute({...currentRute, terminal_awal: parseInt(e.target.value) || null})}
              >
                <option value="">- Pilih Halte/Terminal -</option>
                {halteList.map(h => (
                  <option key={h.id} value={h.id}>{h.nama}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Terminal Akhir</label>
              <select 
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                }}
                value={currentRute?.terminal_akhir || ''}
                onChange={(e) => setCurrentRute({...currentRute, terminal_akhir: parseInt(e.target.value) || null})}
              >
                <option value="">- Pilih Halte/Terminal -</option>
                {halteList.map(h => (
                  <option key={h.id} value={h.id}>{h.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <Input 
            label="Estimasi Waktu (Menit)" 
            type="number"
            value={currentRute?.estimasi_menit || ''} 
            onChange={(e) => setCurrentRute({...currentRute, estimasi_menit: parseInt(e.target.value) || null})}
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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus rute <strong>{currentRute?.nama}</strong>?</p>
      </Modal>
    </div>
  )
}
