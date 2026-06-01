'use client'

import { useState, useEffect, useMemo } from 'react'
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentRute, setCurrentRute] = useState<Partial<Rute> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAwal, setFilterAwal] = useState<number | ''>('')
  const [filterAkhir, setFilterAkhir] = useState<number | ''>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const [ruteRes, halteRes] = await Promise.all([getRute(), getHalte()])
      setData(ruteRes || [])
      setHalteList(halteRes || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data rute')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
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
      alert('Kode dan Nama rute wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        kode: currentRute.kode.toUpperCase(),
        nama: currentRute.nama,
        terminal_awal: currentRute.terminal_awal ? Number(currentRute.terminal_awal) : null,
        terminal_akhir: currentRute.terminal_akhir ? Number(currentRute.terminal_akhir) : null,
        estimasi_menit: currentRute.estimasi_menit ? Number(currentRute.estimasi_menit) : null
      }

      if (currentRute.id) {
        await updateRute(currentRute.id, payload)
      } else {
        await createRute(payload)
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
      alert(error instanceof Error ? error.message : 'Gagal menyimpan data rute')
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
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus rute. Rute ini mungkin masih terikat dengan jadwal atau wisata.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter & Search computations
  const filteredData = useMemo(() => {
    return data.filter(r => {
      const matchSearch = 
        !searchQuery ||
        r.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.halte_awal?.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.halte_akhir?.nama || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchAwal = !filterAwal || r.terminal_awal === Number(filterAwal)
      const matchAkhir = !filterAkhir || r.terminal_akhir === Number(filterAkhir)

      return matchSearch && matchAwal && matchAkhir
    })
  }, [data, searchQuery, filterAwal, filterAkhir])

  // Pagination computations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, startIndex])

  // KPI calculations
  const stats = useMemo(() => {
    const total = data.length
    const avgDuration = total > 0 ? Math.round(data.reduce((acc, r) => acc + (r.estimasi_menit || 0), 0) / total) : 0
    const maxDuration = total > 0 ? Math.max(...data.map(r => r.estimasi_menit || 0)) : 0
    return { total, avgDuration, maxDuration }
  }, [data])

  const columns = [
    {
      key: 'kode',
      title: 'Kode Rute',
      width: '15%',
      render: (item: Rute) => (
        <div className={styles.routeBadge} title={item.kode}>
          <span className={styles.routeBadgeText}>{item.kode}</span>
        </div>
      )
    },
    {
      key: 'nama',
      title: 'Nama Rute',
      width: '28%',
      render: (item: Rute) => (
        <div className={styles.routeNameCell} title={item.nama}>
          <span className={styles.routeNameText}>{item.nama}</span>
        </div>
      )
    },
    {
      key: 'terminal_awal',
      title: 'Terminal Awal',
      width: '20%',
      render: (item: Rute) => (
        <div className={styles.terminalCell} title={item.halte_awal?.nama || '-'}>
          <div className={styles.terminalIconWrapper} style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <span className={styles.terminalName}>{item.halte_awal?.nama || '-'}</span>
        </div>
      )
    },
    {
      key: 'terminal_akhir',
      title: 'Terminal Akhir',
      width: '20%',
      render: (item: Rute) => (
        <div className={styles.terminalCell} title={item.halte_akhir?.nama || '-'}>
          <div className={styles.terminalIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <span className={styles.terminalName}>{item.halte_akhir?.nama || '-'}</span>
        </div>
      )
    },
    {
      key: 'estimasi_menit',
      title: 'Estimasi Waktu',
      width: '17%',
      render: (item: Rute) => (
        <div className={styles.durationCell}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span className={styles.durationText}>{item.estimasi_menit ? `${item.estimasi_menit} Menit` : '-'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '15%',
      render: (item: Rute) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.iconButton}
            onClick={() => router.push(`/rute/${item.id}/titik`)}
            title="Titik Koordinat"
            aria-label={`Titik Koordinat Rute ${item.kode}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 15 9 18 3 15"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
          </button>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenModal(item)}
            title="Edit Rute"
            aria-label={`Edit Rute ${item.kode}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenDelete(item)}
            title="Hapus Rute"
            aria-label={`Hapus Rute ${item.kode}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      )
    }
  ]

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterAwal('')
    setFilterAkhir('')
    setCurrentPage(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Manajemen Rute Bus</h1>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Cari rute..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
            aria-label="Cari data rute"
          />
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricsLeft}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 15 9 18 3 15"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Rute</span>
              <span className={styles.kpiValue}>{stats.total}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Rerata Durasi</span>
              <span className={styles.kpiValue}>{stats.avgDuration} Min</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Durasi Terlama</span>
              <span className={styles.kpiValue}>{stats.maxDuration} Min</span>
            </div>
          </div>
        </div>

        <Button onClick={() => handleOpenModal()} className={styles.addButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tambah Rute
        </Button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Terminal Awal</label>
          <select 
            value={filterAwal}
            onChange={(e) => {
              setFilterAwal(e.target.value ? Number(e.target.value) : '')
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
          >
            <option value="">Semua Terminal Awal</option>
            {halteList.map(h => (
              <option key={h.id} value={h.id}>{h.nama}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Terminal Akhir</label>
          <select 
            value={filterAkhir}
            onChange={(e) => {
              setFilterAkhir(e.target.value ? Number(e.target.value) : '')
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
          >
            <option value="">Semua Terminal Akhir</option>
            {halteList.map(h => (
              <option key={h.id} value={h.id}>{h.nama}</option>
            ))}
          </select>
        </div>

        <Button variant="ghost" onClick={handleResetFilters} className={styles.resetBtn}>
          Reset Filter
        </Button>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginatedData} isLoading={loading} />
        {!loading && filteredData.length > 0 && (
          <div className={styles.paginationRow}>
            <div className={styles.paginationInfo}>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} rute
            </div>
            <div className={styles.paginationButtons}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
                aria-label="Sebelumnya"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`${styles.pageNumberButton} ${currentPage === pageNum ? styles.pageNumberButtonActive : ''}`}
                    aria-label={`Halaman ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
                aria-label="Berikutnya"
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
              label="Kode Rute *" 
              placeholder="e.g. RUT-01"
              value={currentRute?.kode || ''} 
              onChange={(e) => setCurrentRute({...currentRute, kode: e.target.value.toUpperCase()})}
              required 
            />
            <Input 
              label="Nama Rute *" 
              placeholder="e.g. Malang - Surabaya"
              value={currentRute?.nama || ''} 
              onChange={(e) => setCurrentRute({...currentRute, nama: e.target.value})}
              required 
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Terminal Awal *</label>
              <select 
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                }}
                value={currentRute?.terminal_awal || ''}
                onChange={(e) => setCurrentRute({...currentRute, terminal_awal: parseInt(e.target.value) || null})}
                required
              >
                <option value="">- Pilih Halte/Terminal -</option>
                {halteList.map(h => (
                  <option key={h.id} value={h.id}>{h.nama}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Terminal Akhir *</label>
              <select 
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                }}
                value={currentRute?.terminal_akhir || ''}
                onChange={(e) => setCurrentRute({...currentRute, terminal_akhir: parseInt(e.target.value) || null})}
                required
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
            placeholder="e.g. 120"
            value={currentRute?.estimasi_menit === null || currentRute?.estimasi_menit === undefined ? '' : currentRute.estimasi_menit} 
            onChange={(e) => setCurrentRute({...currentRute, estimasi_menit: e.target.value ? parseInt(e.target.value) : null})}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDelete}
        title="Konfirmasi Hapus Rute"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseDelete}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={submitting}>Ya, Hapus</Button>
          </>
        }
      >
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus rute <strong>{currentRute?.kode} - {currentRute?.nama}</strong>?</p>
      </Modal>
    </div>
  )
}
