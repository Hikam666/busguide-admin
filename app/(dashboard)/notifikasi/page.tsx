'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Notifikasi, getNotifikasi, createNotifikasi, updateNotifikasi, deleteNotifikasi } from '@/services/notifikasiService'
import { PerjalananLaporan, getLaporanPerjalanan } from '@/services/laporanService'
import styles from './notifikasi.module.css'

export default function NotifikasiPage() {
  const [data, setData] = useState<Notifikasi[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentNotif, setCurrentNotif] = useState<Partial<Notifikasi> | null>(null)
  
  // Search and Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const notifRes = await getNotifikasi()
      setData(notifRes || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Gagal mengambil data notifikasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (notif?: Notifikasi) => {
    if (notif) {
      setCurrentNotif(notif)
    } else {
      setCurrentNotif({
        pesan: '',
        tipe: 'info',
        id_perjalanan: null
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentNotif(null)
  }

  const handleOpenDelete = (notif: Notifikasi) => {
    setCurrentNotif(notif)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentNotif(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentNotif?.pesan?.trim()) {
      alert('Pesan notifikasi wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      if (currentNotif.id) {
        await updateNotifikasi(currentNotif.id, {
          ...currentNotif,
          tipe: 'info',
          id_perjalanan: null
        })
      } else {
        await createNotifikasi({
          ...currentNotif,
          tipe: 'info',
          id_perjalanan: null
        })
      }
      handleCloseModal()
      fetchData(false)
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Gagal menyimpan data notifikasi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentNotif?.id) return
    setSubmitting(true)
    try {
      await deleteNotifikasi(currentNotif.id)
      handleCloseDelete()
      fetchData(false)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus data')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return item.pesan.toLowerCase().includes(q)
    })
  }, [data, searchQuery])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, startIndex])

  const columns = [
    {
      key: 'pesan',
      title: 'Pesan Notifikasi',
      width: '65%',
      render: (item: Notifikasi) => (
        <div className={styles.pesanCell} title={item.pesan}>
          <span className={styles.pesanText}>{item.pesan}</span>
        </div>
      )
    },
    {
      key: 'waktu',
      title: 'Waktu Dibuat',
      width: '20%',
      render: (item: Notifikasi) => {
        const timeStr = item.dikirim_at || item.created_at
        if (!timeStr) return <span className={styles.timeText}>-</span>
        const date = new Date(timeStr)
        return (
          <span className={styles.timeText} title={date.toLocaleString('id-ID')}>
            {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} <br/>
            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '10%',
      render: (item: Notifikasi) => (
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenModal(item)}
            title="Edit Notifikasi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenDelete(item)}
            title="Hapus Notifikasi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Manajemen Notifikasi</h1>
          <p className={styles.subtitle}>Kelola pesan notifikasi yang dikirim ke pengguna</p>
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Cari pesan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.metricsRow} style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <Button onClick={() => handleOpenModal()} className={styles.addButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Buat Notifikasi
        </Button>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginatedData} isLoading={loading} />

        {!loading && filteredData.length > 0 && (
          <div className={styles.paginationRow}>
            <div className={styles.paginationInfo}>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </div>
            <div className={styles.paginationButtons}>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`${styles.pageNumberButton} ${currentPage === idx + 1 ? styles.pageNumberButtonActive : ''}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentNotif?.id ? 'Edit Notifikasi' : 'Buat Notifikasi'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Pesan Notifikasi *</label>
            <textarea
              className={styles.textarea}
              placeholder="Tulis pesan Anda di sini..."
              value={currentNotif?.pesan || ''}
              onChange={(e) => setCurrentNotif({...currentNotif, pesan: e.target.value})}
              required
              autoFocus
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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus notifikasi ini?</p>
      </Modal>
    </div>
  )
}
