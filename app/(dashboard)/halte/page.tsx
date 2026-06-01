'use client'

import { useState, useEffect, useMemo } from 'react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'halte' | 'terminal'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Facilities checkbox states for the modal form
  const [facilityAC, setFacilityAC] = useState(false)
  const [facilityWiFi, setFacilityWiFi] = useState(false)
  const [facilityWaitingRoom, setFacilityWaitingRoom] = useState(false)

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const halteRes = await getHalte()
      setData(halteRes)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Gagal mengambil data halte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
  }, [])

  // Count metrics dynamically
  const metrics = useMemo(() => {
    const total = data.length
    const terminals = data.filter((h) => h.tipe === 'terminal').length
    const active = data.filter((h) => h.tipe === 'halte').length
    return { total, terminals, active }
  }, [data])

  // Filtered dataset
  const filteredData = useMemo(() => {
    let dataset = data
    if (typeFilter !== 'all') {
      dataset = dataset.filter((h) => h.tipe === typeFilter)
    }
    if (!searchQuery) return dataset
    const query = searchQuery.toLowerCase()
    return dataset.filter(
      (h) =>
        h.nama.toLowerCase().includes(query) ||
        (h.alamat || '').toLowerCase().includes(query)
    )
  }, [data, searchQuery, typeFilter])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage])

  const handleOpenModal = (halte?: Halte) => {
    if (halte) {
      setCurrentHalte(halte)
      const list = (halte.fasilitas || '').split(',').map((f) => f.trim().toLowerCase())
      setFacilityAC(list.includes('ac'))
      setFacilityWiFi(list.includes('wifi'))
      setFacilityWaitingRoom(list.includes('ruang tunggu'))
    } else {
      setCurrentHalte({ tipe: 'halte', latitude: 0, longitude: 0 })
      setFacilityAC(false)
      setFacilityWiFi(false)
      setFacilityWaitingRoom(false)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentHalte(null)
    setFacilityAC(false)
    setFacilityWiFi(false)
    setFacilityWaitingRoom(false)
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
    if (
      !currentHalte?.nama ||
      currentHalte.latitude === undefined ||
      currentHalte.longitude === undefined
    ) {
      alert('Mohon isi field yang wajib')
      return
    }

    const facilitiesList: string[] = []
    if (facilityAC) facilitiesList.push('AC')
    if (facilityWiFi) facilitiesList.push('WiFi')
    if (facilityWaitingRoom) facilitiesList.push('Ruang Tunggu')
    const facilitiesString = facilitiesList.join(', ')

    setSubmitting(true)
    try {
      if (currentHalte.id) {
        await updateHalte(currentHalte.id, {
          nama: currentHalte.nama,
          tipe: currentHalte.tipe as 'halte' | 'terminal',
          alamat: currentHalte.alamat,
          latitude: currentHalte.latitude,
          longitude: currentHalte.longitude,
          fasilitas: facilitiesString,
        })
      } else {
        await createHalte({
          nama: currentHalte.nama,
          tipe: (currentHalte.tipe || 'halte') as 'halte' | 'terminal',
          alamat: currentHalte.alamat || '',
          latitude: currentHalte.latitude,
          longitude: currentHalte.longitude,
          fasilitas: facilitiesString,
        })
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
      const err = error as Record<string, unknown>
      const errorMsg = err?.message || err?.details || JSON.stringify(error)
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
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus data. Halte mungkin sedang digunakan pada rute.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'nama',
      title: 'Nama Halte/Terminal',
      width: '25%',
      render: (item: Halte) => {
        const isTerminal = item.tipe === 'terminal'
        return (
          <div className={styles.nameCell}>
            <div className={isTerminal ? styles.thumbTerminal : styles.thumbHalte} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className={styles.nameDetails}>
              <span className={styles.stopName} title={item.nama}>{item.nama}</span>
              <span className={styles.stopCoords}>
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'tipe',
      title: 'Tipe',
      width: '10%',
      render: (item: Halte) => {
        const isTerminal = item.tipe === 'terminal'
        return (
          <span className={isTerminal ? styles.pillTerminal : styles.pillHalte}>
            {item.tipe.toUpperCase()}
          </span>
        )
      },
    },
    {
      key: 'alamat',
      title: 'Alamat',
      width: '35%',
      render: (item: Halte) => {
        return <span className={styles.addressText} title={item.alamat || ''}>{item.alamat || '-'}</span>
      },
    },
    {
      key: 'fasilitas',
      title: 'Fasilitas',
      width: '15%',
      render: (item: Halte) => {
        const facilities = (item.fasilitas || '').split(',').map((f) => f.trim().toLowerCase())
        const hasAC = facilities.includes('ac')
        const hasWiFi = facilities.includes('wifi')
        const hasWaitingRoom = facilities.includes('ruang tunggu')

        return (
          <div className={styles.facilitiesRow}>
            {hasAC && (
              <span className={styles.facilityIconWrapper} title="AC">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2v20"></path>
                  <path d="m20 16-4-4 4-4"></path>
                  <path d="m4 8 4 4-4 4"></path>
                  <path d="m16 4-4 4-4-4"></path>
                  <path d="m8 20 4-4 4 4"></path>
                </svg>
              </span>
            )}
            {hasWiFi && (
              <span className={styles.facilityIconWrapper} title="WiFi">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"></line>
                </svg>
              </span>
            )}
            {hasWaitingRoom && (
              <span className={styles.facilityIconWrapper} title="Ruang Tunggu">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"></path>
                  <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
                  <path d="M4 18v2"></path>
                  <path d="M20 18v2"></path>
                  <path d="M12 4v5"></path>
                </svg>
              </span>
            )}
            {!hasAC && !hasWiFi && !hasWaitingRoom && <span className={styles.noFacilities}>-</span>}
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '15%',
      render: (item: Halte) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionIconBtn}
            title="Lihat Peta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
          </a>
          <button
            onClick={() => handleOpenModal(item)}
            className={styles.actionIconBtn}
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button
            onClick={() => handleOpenDelete(item)}
            className={`${styles.actionIconBtn} ${styles.btnDelete}`}
            title="Hapus"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Manajemen Halte & Terminal</h1>
          <p className={styles.subtitle}>
            Kelola data titik pemberhentian transportasi umum di seluruh wilayah operasional.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className={styles.addBtn}>
          <span className={styles.addBtnIcon}>+</span> Tambah Halte Baru
        </Button>
      </section>

      {/* Summary KPI Cards Row */}
      <section className={styles.summaryRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(15, 76, 133, 0.08)', color: 'var(--primary-color)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
          </div>
          <div>
            <span className={styles.kpiLabel}>TOTAL HALTE/TERMINAL</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{metrics.total}</span>
              <span className={styles.kpiUnit}>Unit</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(239, 246, 255, 0.95)', color: '#2563EB' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h1M21 17a2 2 0 0 1-2 2 2 2 0 0 1-2-2m-8 0a2 2 0 0 1-2 2 2 2 0 0 1-2-2"></path><path d="M13 10V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5"></path></svg>
          </div>
          <div>
            <span className={styles.kpiLabel}>TERMINAL UTAMA</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{metrics.terminals}</span>
              <span className={styles.kpiUnit}>Lokasi</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10B981' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <span className={styles.kpiLabel}>HALTE AKTIF</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{metrics.active}</span>
              <span className={styles.kpiUnit} style={{ color: '#10B981' }}>Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Area */}
      <div className={styles.mainLayoutGrid}>
        <section className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h2 className={styles.tableCardTitle}>Daftar Titik Pemberhentian</h2>
            <div className={styles.tableActionsRow}>
              <div className={styles.searchBox}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Cari halte atau terminal..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className={styles.searchInput}
                  aria-label="Cari Halte"
                />
              </div>
              <div className={styles.filterTabs}>
                <button
                  type="button"
                  className={`${styles.filterTab} ${typeFilter === 'all' ? styles.activeFilterTab : ''}`}
                  onClick={() => {
                    setTypeFilter('all')
                    setCurrentPage(1)
                  }}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${typeFilter === 'halte' ? styles.activeFilterTab : ''}`}
                  onClick={() => {
                    setTypeFilter('halte')
                    setCurrentPage(1)
                  }}
                >
                  Halte
                </button>
                <button
                  type="button"
                  className={`${styles.filterTab} ${typeFilter === 'terminal' ? styles.activeFilterTab : ''}`}
                  onClick={() => {
                    setTypeFilter('terminal')
                    setCurrentPage(1)
                  }}
                >
                  Terminal
                </button>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={paginatedData}
            isLoading={loading}
          />

          {totalPages > 1 && (
            <div className={styles.paginationRow}>
              <span className={styles.paginationInfo}>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
              </span>
              <div className={styles.paginationActions}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  &larr; Prev
                </button>
                <span className={styles.pageIndicator}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

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
            onChange={(e) => setCurrentHalte({ ...currentHalte, nama: e.target.value })}
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
              onChange={(e) => setCurrentHalte({ ...currentHalte, tipe: e.target.value as 'halte' | 'terminal' })}
            >
              <option value="halte">Halte</option>
              <option value="terminal">Terminal</option>
            </select>
          </div>

          <Input
            label="Alamat"
            value={currentHalte?.alamat || ''}
            onChange={(e) => setCurrentHalte({ ...currentHalte, alamat: e.target.value })}
          />

          <div className={styles.formGroup}>
            <label className="text-sm font-medium text-main mb-1" style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500 }}>
              Fasilitas
            </label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={facilityAC}
                  onChange={(e) => setFacilityAC(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>AC</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={facilityWiFi}
                  onChange={(e) => setFacilityWiFi(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>WiFi</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={facilityWaitingRoom}
                  onChange={(e) => setFacilityWaitingRoom(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>Ruang Tunggu</span>
              </label>
            </div>
          </div>

          <div className={styles.row}>
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={currentHalte?.latitude || 0}
              onChange={(e) => setCurrentHalte({ ...currentHalte, latitude: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={currentHalte?.longitude || 0}
              onChange={(e) => setCurrentHalte({ ...currentHalte, longitude: parseFloat(e.target.value) })}
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
