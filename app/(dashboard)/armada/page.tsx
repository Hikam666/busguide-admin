'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { PoBus, Bus, getPoBus, createPoBus, updatePoBus, deletePoBus, getBusWithPo, createBus, updateBus, deleteBus } from '@/services/armadaService'
import styles from './armada.module.css'

export default function ArmadaPage() {
  const [activeTab, setActiveTab] = useState<'po' | 'armada'>('po')
  const [poList, setPoList] = useState<PoBus[]>([])
  const [busList, setBusList] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)

  // PO Modal States
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [isPoDeleteModalOpen, setIsPoDeleteModalOpen] = useState(false)
  const [currentPo, setCurrentPo] = useState<Partial<PoBus> | null>(null)

  // Bus Modal States
  const [isBusModalOpen, setIsBusModalOpen] = useState(false)
  const [isBusDeleteModalOpen, setIsBusDeleteModalOpen] = useState(false)
  const [currentBus, setCurrentBus] = useState<Partial<Bus> | null>(null)

  // Bus Facilities Checkbox States
  const [facilityAC, setFacilityAC] = useState(false)
  const [facilityWiFi, setFacilityWiFi] = useState(false)
  const [facilityToilet, setFacilityToilet] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // Search & Pagination States
  const [poSearchQuery, setPoSearchQuery] = useState('')
  const [busSearchQuery, setBusSearchQuery] = useState('')
  const [poCurrentPage, setPoCurrentPage] = useState(1)
  const [busCurrentPage, setBusCurrentPage] = useState(1)
  const poItemsPerPage = 5
  const busItemsPerPage = 9

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const [poRes, busRes] = await Promise.all([
        getPoBus(),
        getBusWithPo()
      ])
      setPoList(poRes || [])
      setBusList(busRes || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data Armada/PO Bus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
  }, [])

  // PO Handlers
  const handleOpenPoModal = (po?: PoBus) => {
    if (po) {
      setCurrentPo(po)
    } else {
      setCurrentPo({ nama: '', tagline: '', deskripsi: '', logo_url: '', jenis_layanan: '', fasilitas: '', kontak: '' })
    }
    setIsPoModalOpen(true)
  }

  const handleClosePoModal = () => {
    setIsPoModalOpen(false)
    setCurrentPo(null)
  }

  const handleOpenPoDelete = (po: PoBus) => {
    setCurrentPo(po)
    setIsPoDeleteModalOpen(true)
  }

  const handleClosePoDelete = () => {
    setIsPoDeleteModalOpen(false)
    setCurrentPo(null)
  }

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPo?.nama) {
      alert('Nama PO Bus wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        nama: currentPo.nama,
        tagline: currentPo.tagline || null,
        deskripsi: currentPo.deskripsi || null,
        logo_url: currentPo.logo_url || null,
        jenis_layanan: currentPo.jenis_layanan || null,
        fasilitas: currentPo.fasilitas || null,
        kontak: currentPo.kontak || null
      }

      if (currentPo.id) {
        await updatePoBus(currentPo.id, payload)
      } else {
        await createPoBus(payload)
      }
      handleClosePoModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save PO:', error)
      const errObj = error as Record<string, unknown>
      if (errObj.code === '23505') {
        alert('PO sudah terdaftar dalam sistem')
      } else {
        const message = (errObj?.message as string) || (errObj?.details as string) || (error instanceof Error ? error.message : JSON.stringify(error)) || 'Gagal menyimpan data'
        alert(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePo = async () => {
    if (!currentPo?.id) return
    setSubmitting(true)
    try {
      await deletePoBus(currentPo.id)
      handleClosePoDelete()
      fetchData()
    } catch (error) {
      console.error('Failed to delete PO:', error)
      const errObj = error as Record<string, unknown>
      const message = (errObj?.message as string) || (errObj?.details as string) || 'Gagal menghapus data. PO ini mungkin masih terikat dengan armada bus.'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Bus Handlers
  const handleOpenBusModal = (bus?: Bus) => {
    if (bus) {
      setCurrentBus(bus)
      const list = (bus.fasilitas || []).map(f => f.trim().toLowerCase())
      setFacilityAC(list.includes('ac'))
      setFacilityWiFi(list.includes('wifi'))
      setFacilityToilet(list.includes('toilet'))
    } else {
      setCurrentBus({ nomor_polisi: '', nama_bus: '', tipe: '', id_po: poList[0]?.id || null, kapasitas: 40, status: 'aktif' })
      setFacilityAC(true)
      setFacilityWiFi(false)
      setFacilityToilet(false)
    }
    setIsBusModalOpen(true)
  }

  const handleCloseBusModal = () => {
    setIsBusModalOpen(false)
    setCurrentBus(null)
    setFacilityAC(false)
    setFacilityWiFi(false)
    setFacilityToilet(false)
  }

  const handleOpenBusDelete = (bus: Bus) => {
    setCurrentBus(bus)
    setIsBusDeleteModalOpen(true)
  }

  const handleCloseBusDelete = () => {
    setIsBusDeleteModalOpen(false)
    setCurrentBus(null)
  }

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBus?.nomor_polisi || !currentBus?.tipe) {
      alert('Nomor Polisi dan Tipe Bus wajib diisi')
      return
    }

    const facilitiesList: string[] = []
    if (facilityAC) facilitiesList.push('AC')
    if (facilityWiFi) facilitiesList.push('WiFi')
    if (facilityToilet) facilitiesList.push('Toilet')

    setSubmitting(true)
    try {
      const payload = {
        nomor_polisi: currentBus.nomor_polisi,
        nama_bus: currentBus.nama_bus || null,
        tipe: currentBus.tipe,
        id_po: currentBus.id_po ? Number(currentBus.id_po) : null,
        kapasitas: currentBus.kapasitas ? Number(currentBus.kapasitas) : 40,
        fasilitas: facilitiesList,
        status: currentBus.status || 'aktif'
      }

      if (currentBus.id) {
        await updateBus(currentBus.id, payload)
      } else {
        await createBus(payload)
      }
      handleCloseBusModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save Bus:', error)
      const errObj = error as Record<string, unknown>
      if (errObj.code === '23505') {
        alert('Nomor polisi bus sudah terdaftar')
      } else {
        const message = (errObj?.message as string) || (errObj?.details as string) || (error instanceof Error ? error.message : JSON.stringify(error)) || 'Gagal menyimpan data'
        alert(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBus = async () => {
    if (!currentBus?.id) return
    setSubmitting(true)
    try {
      await deleteBus(currentBus.id)
      handleCloseBusDelete()
      fetchData()
    } catch (error) {
      console.error('Failed to delete Bus:', error)
      const errObj = error as Record<string, unknown>
      const message = (errObj?.message as string) || (errObj?.details as string) || 'Gagal menghapus data. Bus ini mungkin masih digunakan dalam jadwal bus.'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle status optimistically
  const handleToggleBusStatus = async (id: number, currentStatus: 'aktif' | 'tidak_aktif') => {
    const newStatus = currentStatus === 'aktif' ? 'tidak_aktif' : 'aktif'
    setBusList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
    try {
      await updateBus(id, { status: newStatus })
      fetchData(false)
    } catch (error) {
      console.error('Failed to toggle status:', error)
      alert('Gagal mengubah status armada')
      setBusList(prev => prev.map(item => item.id === id ? { ...item, status: currentStatus } : item))
    }
  }

  // PO computations
  const filteredPo = useMemo(() => {
    return poList.filter(po => {
      if (!poSearchQuery) return true
      const q = poSearchQuery.toLowerCase()
      return (
        po.nama?.toLowerCase().includes(q) ||
        (po.tagline || '').toLowerCase().includes(q) ||
        (po.deskripsi || '').toLowerCase().includes(q)
      )
    })
  }, [poList, poSearchQuery])

  const poTotalPages = Math.ceil(filteredPo.length / poItemsPerPage) || 1
  const poStartIndex = (poCurrentPage - 1) * poItemsPerPage
  const paginatedPo = useMemo(() => {
    return filteredPo.slice(poStartIndex, poStartIndex + poItemsPerPage)
  }, [filteredPo, poStartIndex])

  // Bus computations
  const filteredBus = useMemo(() => {
    return busList.filter(bus => {
      if (!busSearchQuery) return true
      const q = busSearchQuery.toLowerCase()
      return (
        bus.nomor_polisi?.toLowerCase().includes(q) ||
        bus.tipe?.toLowerCase().includes(q) ||
        bus.po_bus?.nama?.toLowerCase().includes(q)
      )
    })
  }, [busList, busSearchQuery])

  const busTotalPages = Math.ceil(filteredBus.length / busItemsPerPage) || 1
  const busStartIndex = (busCurrentPage - 1) * busItemsPerPage
  const paginatedBus = useMemo(() => {
    return filteredBus.slice(busStartIndex, busStartIndex + busItemsPerPage)
  }, [filteredBus, busStartIndex])

  // PO columns
  const poColumns = [
    {
      key: 'logo',
      title: 'Logo',
      width: '8%',
      render: (item: PoBus) => (
        <div className={styles.logoCell}>
          {item.logo_url ? (
            <img src={item.logo_url} alt={item.nama} className={styles.logoThumbnail} />
          ) : (
            <div className={styles.logoFallback}>{item.nama.charAt(0).toUpperCase()}</div>
          )}
        </div>
      )
    },
    {
      key: 'nama',
      title: 'PO Bus',
      width: '22%',
      render: (item: PoBus) => (
        <div className={styles.poCell}>
          <div className={styles.poName} title={item.nama}>{item.nama}</div>
          <div className={styles.poTagline} title={item.tagline || ''}>{item.tagline || '-'}</div>
        </div>
      )
    },
    {
      key: 'jenis_layanan',
      title: 'Jenis Layanan',
      width: '20%',
      render: (item: PoBus) => (
        <span className={styles.pillLayanan} title={item.jenis_layanan || ''}>
          {item.jenis_layanan || '-'}
        </span>
      )
    },
    {
      key: 'kontak',
      title: 'Kontak',
      width: '15%',
      render: (item: PoBus) => (
        <div className={styles.kontakCell} title={item.kontak || ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginRight: '4px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span className={styles.kontakText}>{item.kontak || '-'}</span>
        </div>
      )
    },
    {
      key: 'fasilitas',
      title: 'Fasilitas PO',
      width: '23%',
      render: (item: PoBus) => (
        <div className={styles.fasilitasCell} title={item.fasilitas || ''}>
          <span className={styles.fasilitasText}>{item.fasilitas || '-'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '12%',
      render: (item: PoBus) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenPoModal(item)}
            title="Edit PO Bus"
            aria-label={`Edit PO ${item.nama}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenPoDelete(item)}
            title="Hapus PO Bus"
            aria-label={`Hapus PO ${item.nama}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      )
    }
  ]

  // Bus columns
  const busColumns = [
    {
      key: 'nomor_polisi',
      title: 'Nomor Polisi',
      width: '18%',
      render: (item: Bus) => (
        <div className={styles.busNamePlateCell}>
          <div className={styles.plateBadge} title={item.nomor_polisi}>
            <span className={styles.plateText}>{item.nomor_polisi}</span>
          </div>
          {item.nama_bus && <span className={styles.busNameText} title={item.nama_bus}>{item.nama_bus}</span>}
        </div>
      )
    },
    {
      key: 'tipe',
      title: 'Tipe Bus',
      width: '16%',
      render: (item: Bus) => (
        <span className={styles.busType}>{item.tipe}</span>
      )
    },
    {
      key: 'po_bus',
      title: 'PO Operator',
      width: '22%',
      render: (item: Bus) => {
        const po = item.po_bus
        return (
          <div className={styles.operatorCell}>
            {po?.logo_url ? (
              <img src={po.logo_url} alt={po.nama} className={styles.miniLogo} />
            ) : (
              <div className={styles.miniFallback}>{po?.nama?.charAt(0).toUpperCase() || 'P'}</div>
            )}
            <span className={styles.operatorName}>{po?.nama || 'PO Umum'}</span>
          </div>
        )
      }
    },
    {
      key: 'kapasitas',
      title: 'Kapasitas',
      width: '12%',
      render: (item: Bus) => (
        <div className={styles.capacityCell}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"></path><path d="M5 18v2"></path><path d="M19 18v2"></path><path d="M12 4v5"></path></svg>
          <span className={styles.capacityText}>{item.kapasitas || 40} Kursi</span>
        </div>
      )
    },
    {
      key: 'fasilitas',
      title: 'Fasilitas',
      width: '16%',
      render: (item: Bus) => {
        const list = (item.fasilitas || []).map(f => f.trim().toLowerCase())
        const hasAC = list.includes('ac')
        const hasWiFi = list.includes('wifi')
        const hasToilet = list.includes('toilet')

        return (
          <div className={styles.facilitiesRow}>
            {hasAC && (
              <span className={styles.facilityIconWrapper} title="AC">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2v20"></path><path d="m20 16-4-4 4-4"></path><path d="m4 8 4 4-4 4"></path><path d="m16 4-4 4-4-4"></path><path d="m8 20 4-4 4 4"></path></svg>
              </span>
            )}
            {hasWiFi && (
              <span className={styles.facilityIconWrapper} title="WiFi">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3"></line></svg>
              </span>
            )}
            {hasToilet && (
              <span className={styles.facilityIconWrapper} title="Toilet">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 22V12h6v10M12 2a2 2 0 1 0 0 4 2 2 0 1 0 0-4zM8 12V8a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v4"></path></svg>
              </span>
            )}
            {!hasAC && !hasWiFi && !hasToilet && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}
          </div>
        )
      }
    },
    {
      key: 'status',
      title: 'Status',
      width: '8%',
      render: (item: Bus) => {
        const isChecked = item.status === 'aktif'
        return (
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleBusStatus(item.id, item.status)}
              aria-label={`Toggle status bus ${item.nomor_polisi}`}
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
      render: (item: Bus) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenBusModal(item)}
            title="Edit Armada"
            aria-label={`Edit Bus ${item.nomor_polisi}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenBusDelete(item)}
            title="Hapus Armada"
            aria-label={`Hapus Bus ${item.nomor_polisi}`}
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
          <h1 className={styles.title}>Manajemen Armada & PO Bus</h1>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder={activeTab === 'po' ? 'Cari PO Bus...' : 'Cari plat atau tipe...'}
            value={activeTab === 'po' ? poSearchQuery : busSearchQuery}
            onChange={(e) => {
              if (activeTab === 'po') {
                setPoSearchQuery(e.target.value)
                setPoCurrentPage(1)
              } else {
                setBusSearchQuery(e.target.value)
                setBusCurrentPage(1)
              }
            }}
            className={styles.searchInput}
            aria-label="Cari data"
          />
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricsLeft}>
          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi} ${activeTab === 'po' ? styles.kpiCardActive : ''}`}
            onClick={() => setActiveTab('po')}
            title="Klik untuk melihat Daftar PO Bus"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total PO Bus</span>
              <span className={styles.kpiValue}>{poList.length}</span>
            </div>
          </div>

          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi} ${activeTab === 'armada' ? styles.kpiCardActive : ''}`}
            onClick={() => setActiveTab('armada')}
            title="Klik untuk melihat Daftar Armada Bus"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="14" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M8 3v8"></path><path d="M16 3v8"></path><path d="M6 17v4"></path><path d="M18 17v4"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Armada Bus</span>
              <span className={styles.kpiValue}>{busList.length}</span>
            </div>
          </div>
        </div>

        {activeTab === 'po' ? (
          <Button onClick={() => handleOpenPoModal()} className={styles.addButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Tambah PO Bus
          </Button>
        ) : (
          <Button onClick={() => handleOpenBusModal()} className={styles.addButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Tambah Armada Bus
          </Button>
        )}
      </div>

      <div className={styles.tableCard}>
        {activeTab === 'po' ? (
          <>
            <Table columns={poColumns} data={paginatedPo} isLoading={loading} />
            {!loading && filteredPo.length > 0 && (
              <div className={styles.paginationRow}>
                <div className={styles.paginationInfo}>
                  Menampilkan {poStartIndex + 1}–{Math.min(poStartIndex + poItemsPerPage, filteredPo.length)} dari {filteredPo.length} PO Bus
                </div>
                <div className={styles.paginationButtons}>
                  <button
                    onClick={() => setPoCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={poCurrentPage === 1}
                    className={styles.pageButton}
                    aria-label="Sebelumnya"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: poTotalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPoCurrentPage(pageNum)}
                        className={`${styles.pageNumberButton} ${poCurrentPage === pageNum ? styles.pageNumberButtonActive : ''}`}
                        aria-label={`Halaman ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPoCurrentPage(prev => Math.min(prev + 1, poTotalPages))}
                    disabled={poCurrentPage === poTotalPages}
                    className={styles.pageButton}
                    aria-label="Berikutnya"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Table columns={busColumns} data={paginatedBus} isLoading={loading} />
            {!loading && filteredBus.length > 0 && (
              <div className={styles.paginationRow}>
                <div className={styles.paginationInfo}>
                  Menampilkan {busStartIndex + 1}–{Math.min(busStartIndex + busItemsPerPage, filteredBus.length)} dari {filteredBus.length} armada
                </div>
                <div className={styles.paginationButtons}>
                  <button
                    onClick={() => setBusCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={busCurrentPage === 1}
                    className={styles.pageButton}
                    aria-label="Sebelumnya"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: busTotalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setBusCurrentPage(pageNum)}
                        className={`${styles.pageNumberButton} ${busCurrentPage === pageNum ? styles.pageNumberButtonActive : ''}`}
                        aria-label={`Halaman ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setBusCurrentPage(prev => Math.min(prev + 1, busTotalPages))}
                    disabled={busCurrentPage === busTotalPages}
                    className={styles.pageButton}
                    aria-label="Berikutnya"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PO Form Modal */}
      <Modal 
        isOpen={isPoModalOpen} 
        onClose={handleClosePoModal}
        title={currentPo?.id ? 'Edit PO Bus' : 'Tambah PO Bus'}
        footer={
          <>
            <Button variant="ghost" onClick={handleClosePoModal}>Batal</Button>
            <Button onClick={handleSavePo} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSavePo}>
          <Input 
            label="Nama PO Bus *" 
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
          <div className={styles.row}>
            <Input 
              label="Kontak" 
              placeholder="e.g. 0812-3456-789"
              value={currentPo?.kontak || ''} 
              onChange={(e) => setCurrentPo({...currentPo, kontak: e.target.value})}
            />
            <Input 
              label="Jenis Layanan" 
              placeholder="e.g. Executive, Patas, VIP"
              value={currentPo?.jenis_layanan || ''} 
              onChange={(e) => setCurrentPo({...currentPo, jenis_layanan: e.target.value})}
            />
          </div>
          <Input 
            label="Fasilitas PO" 
            placeholder="e.g. AC, Wifi, Toilet, USB Charger"
            value={currentPo?.fasilitas || ''} 
            onChange={(e) => setCurrentPo({...currentPo, fasilitas: e.target.value})}
          />
          <Input 
            label="Logo URL" 
            type="url"
            value={currentPo?.logo_url || ''} 
            onChange={(e) => setCurrentPo({...currentPo, logo_url: e.target.value})}
          />
        </form>
      </Modal>

      {/* PO Delete Confirmation Modal */}
      <Modal
        isOpen={isPoDeleteModalOpen}
        onClose={handleClosePoDelete}
        title="Konfirmasi Hapus PO"
        footer={
          <>
            <Button variant="ghost" onClick={handleClosePoDelete}>Batal</Button>
            <Button variant="danger" onClick={handleDeletePo} isLoading={submitting}>Ya, Hapus</Button>
          </>
        }
      >
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus PO Bus <strong>{currentPo?.nama}</strong>?</p>
      </Modal>

      {/* Bus Form Modal */}
      <Modal 
        isOpen={isBusModalOpen} 
        onClose={handleCloseBusModal}
        title={currentBus?.id ? 'Edit Armada Bus' : 'Tambah Armada Bus'}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseBusModal}>Batal</Button>
            <Button onClick={handleSaveBus} isLoading={submitting}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSaveBus}>
          <div className={styles.row}>
            <Input 
              label="Nomor Polisi *" 
              placeholder="e.g. N 1234 AB"
              value={currentBus?.nomor_polisi || ''} 
              onChange={(e) => setCurrentBus({...currentBus, nomor_polisi: e.target.value.toUpperCase()})}
              required 
            />
            <Input 
              label="Nama Bus (Opsional)" 
              placeholder="e.g. Jetbus 5 / Voyager"
              value={currentBus?.nama_bus || ''} 
              onChange={(e) => setCurrentBus({...currentBus, nama_bus: e.target.value})}
            />
          </div>
          <div className={styles.row}>
            <Input 
              label="Tipe Bus *" 
              placeholder="e.g. Executive / Double Decker"
              value={currentBus?.tipe || ''} 
              onChange={(e) => setCurrentBus({...currentBus, tipe: e.target.value})}
              required 
            />
            <Input 
              label="Kapasitas (Kursi) *" 
              type="number"
              value={currentBus?.kapasitas === null || currentBus?.kapasitas === undefined ? '' : currentBus.kapasitas} 
              onChange={(e) => setCurrentBus({...currentBus, kapasitas: e.target.value ? parseInt(e.target.value) : 0})}
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Operator PO Bus *</label>
            <select 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
              }}
              value={currentBus?.id_po || ''}
              onChange={(e) => setCurrentBus({...currentBus, id_po: parseInt(e.target.value) || null})}
              required
            >
              <option value="">- Pilih PO Operator -</option>
              {poList.map(po => (
                <option key={po.id} value={po.id}>{po.nama}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Fasilitas</label>
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
                  checked={facilityToilet}
                  onChange={(e) => setFacilityToilet(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>Toilet</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Status</label>
            <select 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
              }}
              value={currentBus?.status || 'aktif'}
              onChange={(e) => setCurrentBus({...currentBus, status: e.target.value as 'aktif'|'tidak_aktif'})}
            >
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Bus Delete Confirmation Modal */}
      <Modal
        isOpen={isBusDeleteModalOpen}
        onClose={handleCloseBusDelete}
        title="Konfirmasi Hapus Armada"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseBusDelete}>Batal</Button>
            <Button variant="danger" onClick={handleDeleteBus} isLoading={submitting}>Ya, Hapus</Button>
          </>
        }
      >
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus armada bus dengan plat <strong>{currentBus?.nomor_polisi}</strong>?</p>
      </Modal>
    </div>
  )
}
