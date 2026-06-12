'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Jadwal, getJadwal, tambahJadwal, editJadwal, hapusJadwal, getBus } from '@/services/jadwalService'
import { Rute, getRute } from '@/services/ruteService'
import { loadPoBus, PoBus } from '@/services/armadaService'
import styles from './jadwal.module.css'

const HARI_LIST = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

interface LocalBus {
  id: number
  nomor_polisi: string
}

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([])
  const [ruteList, setRuteList] = useState<Rute[]>([])
  const [busList, setBusList] = useState<LocalBus[]>([])
  const [poList, setPoList] = useState<PoBus[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentJadwal, setCurrentJadwal] = useState<Partial<Jadwal> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterHari, setFilterHari] = useState('semua')
  const [filterPo, setFilterPo] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('semua')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const [jadwalRes, ruteRes, busRes, poRes] = await Promise.all([
        getJadwal(),
        getRute(),
        getBus(),
        loadPoBus()
      ])
      setData(jadwalRes || [])
      setRuteList(ruteRes || [])
      setBusList((busRes || []) as LocalBus[])
      setPoList(poRes || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
  }, [])

  const handleOpenModal = (jadwal?: Jadwal) => {
    if (jadwal) {
      setCurrentJadwal(jadwal)
    } else {
      setCurrentJadwal({ 
        id_rute: 0, 
        jam_berangkat: '08:00', 
        hari: [], 
        status: 'aktif',
        interval: null,
        tarif: null
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentJadwal(null)
  }

  const handleOpenDelete = (jadwal: Jadwal) => {
    setCurrentJadwal(jadwal)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setCurrentJadwal(null)
  }

  const handleHariChange = (h: string) => {
    if (!currentJadwal) return
    const hari = currentJadwal.hari || []
    if (hari.includes(h)) {
      setCurrentJadwal({ ...currentJadwal, hari: hari.filter(item => item !== h) })
    } else {
      setCurrentJadwal({ ...currentJadwal, hari: [...hari, h] })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentJadwal?.id_rute || !currentJadwal.jam_berangkat) {
      alert('Rute dan Jam Keberangkatan wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        id_rute: currentJadwal.id_rute,
        id_bus: currentJadwal.id_bus || null,
        jam_berangkat: currentJadwal.jam_berangkat,
        estimasi_menit: currentJadwal.estimasi_menit || null,
        hari: currentJadwal.hari || [],
        tanggal_mulai: currentJadwal.tanggal_mulai || null,
        tanggal_selesai: currentJadwal.tanggal_selesai || null,
        status: currentJadwal.status as 'aktif' | 'tidak_aktif',
        interval: currentJadwal.interval !== undefined && currentJadwal.interval !== null ? Number(currentJadwal.interval) : null,
        tarif: currentJadwal.tarif !== undefined && currentJadwal.tarif !== null ? Number(currentJadwal.tarif) : null
      }

      if (currentJadwal.id) {
        await editJadwal(currentJadwal.id, payload)
      } else {
        await tambahJadwal(payload)
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
      const message = error instanceof Error ? error.message : 'Gagal menyimpan jadwal'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentJadwal?.id) return
    setSubmitting(true)
    try {
      await hapusJadwal(currentJadwal.id)
      handleCloseDelete()
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Gagal menghapus data.')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle status optimistically
  const handleToggleStatus = async (id: number, currentStatus: 'aktif' | 'tidak_aktif') => {
    const newStatus = currentStatus === 'aktif' ? 'tidak_aktif' : 'aktif'
    setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
    
    try {
      await editJadwal(id, { status: newStatus })
      fetchData(false)
    } catch (error) {
      console.error('Failed to toggle status:', error)
      alert('Gagal mengubah status jadwal')
      setData(prev => prev.map(item => item.id === id ? { ...item, status: currentStatus } : item))
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterHari('semua')
    setFilterPo('semua')
    setFilterStatus('semua')
    setCurrentPage(1)
  }

  const getTodayIndonesianNameCapitalized = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const todayIndex = new Date().getDay()
    return days[todayIndex]
  }

  // Computed metrics
  const totalActive = useMemo(() => {
    return data.filter(item => item.status === 'aktif').length
  }, [data])

  const activeToday = useMemo(() => {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
    const todayIndex = new Date().getDay()
    const todayDay = days[todayIndex]
    
    return data.filter(item => {
      if (item.status !== 'aktif') return false
      if (!item.hari || item.hari.length === 0) return true // runs every day
      return item.hari.map(h => h.toLowerCase()).includes(todayDay)
    }).length
  }, [data])

  // Filtering data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const routeName = item.rute?.nama?.toLowerCase() || ''
        const routeCode = item.rute?.kode?.toLowerCase() || ''
        const poName = item.bus?.po_bus?.nama?.toLowerCase() || ''
        const busPlate = item.bus?.nomor_polisi?.toLowerCase() || ''
        const busType = item.bus?.tipe?.toLowerCase() || ''

        if (!routeName.includes(q) && !routeCode.includes(q) && !poName.includes(q) && !busPlate.includes(q) && !busType.includes(q)) {
          return false
        }
      }

      // Hari filter
      if (filterHari && filterHari !== 'semua') {
        const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
        const todayDay = days[new Date().getDay()]
        const targetDay = filterHari === 'hari-ini' ? todayDay : filterHari

        const runsOnDay = !item.hari || item.hari.length === 0 || item.hari.map(h => h.toLowerCase()).includes(targetDay)
        if (!runsOnDay) return false
      }

      // PO filter
      if (filterPo && filterPo !== 'semua') {
        const poId = parseInt(filterPo)
        if (item.bus?.id_po !== poId) return false
      }

      // Status filter
      if (filterStatus && filterStatus !== 'semua') {
        if (item.status !== filterStatus) return false
      }

      return true
    })
  }, [data, searchQuery, filterHari, filterPo, filterStatus])

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, startIndex])

  // Columns definition
  const columns = [
    {
      key: 'rute',
      title: 'Rute',
      width: '25%',
      render: (item: Jadwal) => {
        const routeName = item.rute?.nama || `ID Rute: ${item.id_rute}`
        const routeCode = item.rute?.kode || ''

        const getRouteDescription = (name: string, code: string) => {
          const nameLower = name.toLowerCase()
          if (nameLower.includes('jakarta') && nameLower.includes('bandung')) {
            return 'Via Tol Cipularang'
          }
          if (nameLower.includes('surabaya') && nameLower.includes('malang')) {
            return 'Non-Stop'
          }
          if (nameLower.includes('jogja') && nameLower.includes('solo')) {
            return 'Reguler'
          }
          return code ? `Kode: ${code}` : 'Reguler'
        }

        const desc = getRouteDescription(routeName, routeCode)

        return (
          <div className={styles.ruteCell}>
            <div className={styles.routeName} title={routeName}>{routeName}</div>
            <div className={styles.routeDesc} title={desc}>{desc}</div>
          </div>
        )
      }
    },
    {
      key: 'bus',
      title: 'PO Bus & Bus',
      width: '20%',
      render: (item: Jadwal) => {
        const poName = item.bus?.po_bus?.nama || 'PO Umum'
        const busType = item.bus?.tipe || '-'
        const busPlate = item.bus?.nomor_polisi || ''
        const busDetail = busPlate ? `${busType} • ${busPlate}` : busType

        return (
          <div className={styles.poCell}>
            <div className={styles.busIconCircle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="14" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M8 3v8"></path><path d="M16 3v8"></path><path d="M6 17v4"></path><path d="M18 17v4"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle></svg>
            </div>
            <div className={styles.poInfo}>
              <div className={styles.poName} title={poName}>{poName}</div>
              <div className={styles.busDetail} title={busDetail}>{busDetail}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'jam_berangkat',
      title: 'Keberangkatan',
      width: '15%',
      render: (item: Jadwal) => {
        const time = item.jam_berangkat.substring(0, 5)
        return (
          <div className={styles.departureCell}>
            <div className={styles.timeText}>{time} WIB</div>
            {item.interval && <div className={styles.intervalText}>Setiap {item.interval} mnt</div>}
          </div>
        )
      }
    },
    {
      key: 'tarif',
      title: 'Tarif',
      width: '12%',
      render: (item: Jadwal) => {
        const formattedFare = item.tarif !== null && item.tarif !== undefined
          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(item.tarif))
          : '-'
        return <span className={styles.fareText}>{formattedFare}</span>
      }
    },
    {
      key: 'hari',
      title: 'Operasional',
      width: '14%',
      render: (item: Jadwal) => {
        const formatHari = (hari: string[] | null) => {
          if (!hari || hari.length === 0 || hari.length === 7) {
            return 'Setiap Hari'
          }

          const isWeekdays = hari.length === 5 &&
            ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].every(d => hari.map(h => h.toLowerCase()).includes(d))

          if (isWeekdays) {
            return 'Senin - Jumat'
          }

          return hari.map(h => h.charAt(0).toUpperCase() + h.slice(1).substring(0, 2)).join(', ')
        }

        const text = formatHari(item.hari)
        const isSetiapHari = text === 'Setiap Hari'
        const badgeClass = isSetiapHari ? styles.badgeEveryday : styles.badgeWeekdays

        return <span className={`${styles.badgePill} ${badgeClass}`}>{text}</span>
      }
    },
    {
      key: 'status',
      title: 'Status',
      width: '6%',
      render: (item: Jadwal) => {
        const isChecked = item.status === 'aktif'
        return (
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleStatus(item.id, item.status)}
              aria-label={`Toggle status jadwal ${item.id}`}
            />
            <span className={styles.slider}></span>
          </label>
        )
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '8%',
      render: (item: Jadwal) => (
        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenModal(item)}
            title="Edit Jadwal"
            aria-label={`Edit jadwal ${item.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenDelete(item)}
            title="Hapus Jadwal"
            aria-label={`Hapus jadwal ${item.id}`}
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
        <h1 className={styles.title}>Manajemen Jadwal Bus</h1>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Cari rute atau bus..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
            aria-label="Cari rute atau bus"
          />
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricsLeft}>
          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi}`}
            onClick={() => {
              setFilterHari('semua')
              setFilterStatus('aktif')
              setFilterPo('semua')
              setCurrentPage(1)
            }}
            title="Klik untuk filter semua jadwal aktif"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M9 16l2 2 4-4"></path></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Jadwal Aktif</span>
              <span className={styles.kpiValue}>{totalActive}</span>
            </div>
          </div>

          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi}`}
            onClick={() => {
              setFilterHari('hari-ini')
              setFilterStatus('aktif')
              setFilterPo('semua')
              setCurrentPage(1)
            }}
            title="Klik untuk filter jadwal hari ini"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(71, 85, 105, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Jadwal Hari Ini</span>
              <span className={styles.kpiValue}>{activeToday}</span>
            </div>
          </div>
        </div>

        <Button onClick={() => handleOpenModal()} className={styles.addButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tambah Jadwal Baru
        </Button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Hari Operasional</label>
          <select
            value={filterHari}
            onChange={(e) => {
              setFilterHari(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
            aria-label="Filter Hari Operasional"
          >
            <option value="semua">Semua Hari</option>
            <option value="hari-ini">Hari Ini ({getTodayIndonesianNameCapitalized()})</option>
            <option value="senin">Senin</option>
            <option value="selasa">Selasa</option>
            <option value="rabu">Rabu</option>
            <option value="kamis">Kamis</option>
            <option value="jumat">Jumat</option>
            <option value="sabtu">Sabtu</option>
            <option value="minggu">Minggu</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>PO Bus</label>
          <select
            value={filterPo}
            onChange={(e) => {
              setFilterPo(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
            aria-label="Filter PO Bus"
          >
            <option value="semua">Semua PO</option>
            {poList.map(po => (
              <option key={po.id} value={po.id}>{po.nama}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
            aria-label="Filter Status"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
          </select>
        </div>

        <button
          onClick={handleResetFilters}
          className={styles.resetButton}
          aria-label="Reset Filter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          Reset
        </button>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginatedData} isLoading={loading} />

        {!loading && filteredData.length > 0 && (
          <div className={styles.paginationRow}>
            <div className={styles.paginationInfo}>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} jadwal
            </div>
            <div className={styles.paginationButtons}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
                aria-label="Halaman sebelumnya"
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
                aria-label="Halaman berikutnya"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={currentJadwal?.id ? 'Edit Jadwal' : 'Tambah Jadwal'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Batal</Button>
            <Button onClick={handleSave} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Rute *</label>
            <select 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
              }}
              value={currentJadwal?.id_rute || ''}
              onChange={(e) => setCurrentJadwal({...currentJadwal, id_rute: parseInt(e.target.value)})}
              required
            >
              <option value="">- Pilih Rute -</option>
              {ruteList.map(r => (
                <option key={r.id} value={r.id}>{r.kode} - {r.nama}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Bus (Opsional)</label>
              <select 
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
                }}
                value={currentJadwal?.id_bus || ''}
                onChange={(e) => setCurrentJadwal({...currentJadwal, id_bus: parseInt(e.target.value) || null})}
              >
                <option value="">- Semua Bus -</option>
                {busList.map(b => (
                  <option key={b.id} value={b.id}>{b.nomor_polisi}</option>
                ))}
              </select>
            </div>
            <Input 
              label="Jam Keberangkatan *" 
              type="time"
              value={currentJadwal?.jam_berangkat || ''} 
              onChange={(e) => setCurrentJadwal({...currentJadwal, jam_berangkat: e.target.value})}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Hari Operasional</label>
            <div className={styles.checkboxGroup}>
              {HARI_LIST.map((h) => (
                <label key={h} className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    checked={(currentJadwal?.hari || []).includes(h)}
                    onChange={() => handleHariChange(h)}
                  />
                  {h.charAt(0).toUpperCase() + h.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <Input 
              label="Interval Keberangkatan (Menit, Opsional)" 
              type="number"
              placeholder="e.g. 15"
              value={currentJadwal?.interval === null || currentJadwal?.interval === undefined ? '' : currentJadwal.interval} 
              onChange={(e) => setCurrentJadwal({...currentJadwal, interval: e.target.value ? parseInt(e.target.value) : null})}
            />
            <Input 
              label="Tarif (Rupiah, Opsional)" 
              type="number"
              placeholder="e.g. 20000"
              value={currentJadwal?.tarif === null || currentJadwal?.tarif === undefined ? '' : currentJadwal.tarif} 
              onChange={(e) => setCurrentJadwal({...currentJadwal, tarif: e.target.value ? parseFloat(e.target.value) : null})}
            />
          </div>

          <div className={styles.row}>
            <Input 
              label="Tanggal Mulai Berlaku (Opsional)" 
              type="date"
              value={currentJadwal?.tanggal_mulai || ''} 
              onChange={(e) => setCurrentJadwal({...currentJadwal, tanggal_mulai: e.target.value})}
            />
            <Input 
              label="Tanggal Berakhir (Opsional)" 
              type="date"
              value={currentJadwal?.tanggal_selesai || ''} 
              onChange={(e) => setCurrentJadwal({...currentJadwal, tanggal_selesai: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Status</label>
            <select 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
              }}
              value={currentJadwal?.status || 'aktif'}
              onChange={(e) => setCurrentJadwal({...currentJadwal, status: e.target.value as 'aktif'|'tidak_aktif'})}
            >
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
        </form>
      </Modal>

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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus jadwal ini?</p>
      </Modal>
    </div>
  )
}
