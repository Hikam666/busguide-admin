'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Wisata, loadWisata, tambahWisata, editWisata, hapusWisata } from '@/services/wisataService'
import { Rute, getRute } from '@/services/ruteService'
import { uploadFile } from '@/services/uploadService'
import styles from './wisata.module.css'

export default function WisataPage() {
  const [data, setData] = useState<Wisata[]>([])
  const [ruteList, setRuteList] = useState<Rute[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentWisata, setCurrentWisata] = useState<Partial<Wisata> | null>(null)
  const [selectedRuteId, setSelectedRuteId] = useState<string | number>('')
  const [submitting, setSubmitting] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKota, setFilterKota] = useState('semua')
  const [filterTarif, setFilterTarif] = useState('semua')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const [wisataRes, ruteRes] = await Promise.all([
        loadWisata(),
        getRute()
      ])
      setData(wisataRes || [])
      setRuteList(ruteRes || [])
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data Wisata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
  }, [])

  const handleOpenModal = (wisata?: Wisata) => {
    if (wisata) {
      setCurrentWisata(wisata)
      const firstRel = wisata.rute_wisata?.[0]
      setSelectedRuteId(firstRel ? firstRel.id_rute : '')
    } else {
      setCurrentWisata({ nama: '', alamat: '', kota: '', deskripsi: '', tarif: 0, jam_buka: '', jam_tutup: '', foto_url: '' })
      setSelectedRuteId('')
    }
    setFotoFile(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentWisata(null)
    setSelectedRuteId('')
    setFotoFile(null)
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
      let uploadedUrl = currentWisata.foto_url || null
      
      if (fotoFile) {
        uploadedUrl = await uploadFile(fotoFile, 'busguide_images', 'wisata')
      }

      const payload = {
        nama: currentWisata.nama,
        alamat: currentWisata.alamat || null,
        kota: currentWisata.kota || null,
        deskripsi: currentWisata.deskripsi || null,
        tarif: currentWisata.tarif !== undefined && currentWisata.tarif !== null ? currentWisata.tarif : null,
        jam_buka: currentWisata.jam_buka || null,
        jam_tutup: currentWisata.jam_tutup || null,
        foto_url: uploadedUrl
      }
      
      const ruteIdNumber = selectedRuteId ? Number(selectedRuteId) : null

      if (currentWisata.id) {
        await editWisata(currentWisata.id, payload, ruteIdNumber)
      } else {
        await tambahWisata(payload, ruteIdNumber)
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
      const errObj = error as Record<string, unknown>
      const message = (errObj?.message as string) || (errObj?.details as string) || (error instanceof Error ? error.message : JSON.stringify(error)) || 'Gagal menyimpan data'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentWisata?.id) return
    setSubmitting(true)
    try {
      await hapusWisata(currentWisata.id)
      handleCloseDelete()
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
      const errObj = error as Record<string, unknown>
      const message = (errObj?.message as string) || (errObj?.details as string) || (error instanceof Error ? error.message : JSON.stringify(error)) || 'Gagal menghapus data.'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setFilterKota('semua')
    setFilterTarif('semua')
    setCurrentPage(1)
  }

  // Get dynamic kota list from data
  const kotaOptions = useMemo(() => {
    const list = data
      .map(item => item.kota?.trim())
      .filter(Boolean) as string[]
    return Array.from(new Set(list)).sort()
  }, [data])

  // Computed metrics
  const totalWisata = data.length
  const totalGratis = useMemo(() => {
    return data.filter(item => !item.tarif || item.tarif === 0).length
  }, [data])
  const totalBerbayar = useMemo(() => {
    return data.filter(item => item.tarif && item.tarif > 0).length
  }, [data])

  // Filtering data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const nama = item.nama?.toLowerCase() || ''
        const alamat = item.alamat?.toLowerCase() || ''
        const kota = item.kota?.toLowerCase() || ''
        const deskripsi = item.deskripsi?.toLowerCase() || ''
        
        // Rute details matching
        const rel = item.rute_wisata?.[0]
        const ruteName = rel?.rute?.nama?.toLowerCase() || ''
        const ruteCode = rel?.rute?.kode?.toLowerCase() || ''
        const startName = rel?.rute?.halte_awal?.nama?.toLowerCase() || ''
        const endName = rel?.rute?.halte_akhir?.nama?.toLowerCase() || ''
        
        if (!nama.includes(q) && !alamat.includes(q) && !kota.includes(q) && !deskripsi.includes(q) &&
            !ruteName.includes(q) && !ruteCode.includes(q) && !startName.includes(q) && !endName.includes(q)) {
          return false
        }
      }

      // Kota filter
      if (filterKota !== 'semua') {
        if (item.kota?.trim().toLowerCase() !== filterKota.trim().toLowerCase()) {
          return false
        }
      }

      // Tarif filter
      if (filterTarif !== 'semua') {
        const isPaid = item.tarif && item.tarif > 0
        if (filterTarif === 'gratis' && isPaid) return false
        if (filterTarif === 'berbayar' && !isPaid) return false
      }

      return true
    })
  }, [data, searchQuery, filterKota, filterTarif])

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, startIndex])

  // Columns definition
  const columns = [
    {
      key: 'nama',
      title: 'Nama Wisata',
      width: '25%',
      render: (item: Wisata) => (
        <div className={styles.wisataCell}>
          <div className={styles.wisataName} title={item.nama}>{item.nama}</div>
          <div className={styles.wisataAddress} title={item.alamat || ''}>{item.alamat || '-'}</div>
        </div>
      )
    },
    {
      key: 'kota',
      title: 'Kota',
      width: '13%',
      render: (item: Wisata) => (
        <span className={styles.cityText}>{item.kota || '-'}</span>
      )
    },
    {
      key: 'tarif',
      title: 'Tarif Masuk',
      width: '16%',
      render: (item: Wisata) => {
        const isFree = !item.tarif || item.tarif === 0
        return isFree ? (
          <span className={`${styles.badgePill} ${styles.badgeFree}`}>Gratis</span>
        ) : (
          <span className={styles.fareText}>Rp {item.tarif?.toLocaleString('id-ID')}</span>
        )
      }
    },
    {
      key: 'jam_operasional',
      title: 'Jam Operasional',
      width: '16%',
      render: (item: Wisata) => {
        const hasTime = item.jam_buka && item.jam_tutup
        const timeText = hasTime ? `${item.jam_buka?.substring(0, 5)} - ${item.jam_tutup?.substring(0, 5)}` : '-'
        return (
          <div className={styles.timeCell}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.clockIcon}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span className={styles.timeText}>{timeText}</span>
          </div>
        )
      }
    },
    {
      key: 'rute',
      title: 'Rute Terkait',
      width: '20%',
      render: (item: Wisata) => {
        const rel = item.rute_wisata?.[0]
        if (!rel || !rel.rute) {
          return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
        }
        const rute = rel.rute
        const startLabel = rute.halte_awal?.nama || 'Awal'
        const endLabel = rute.halte_akhir?.nama || 'Akhir'
        const routeTitle = `${rute.kode} - ${rute.nama}`
        const terminalInfo = `${startLabel} → ${endLabel}`
        return (
          <div className={styles.ruteCell}>
            <div className={styles.routeName} title={routeTitle}>{routeTitle}</div>
            <div className={styles.routeTerminals} title={terminalInfo}>{terminalInfo}</div>
          </div>
        )
      }
    },
    {
      key: 'actions',
      title: 'Aksi',
      width: '10%',
      render: (item: Wisata) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.iconButton}
            onClick={() => handleOpenModal(item)}
            title="Edit Wisata"
            aria-label={`Edit wisata ${item.nama}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          </button>
          <button
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => handleOpenDelete(item)}
            title="Hapus Wisata"
            aria-label={`Hapus wisata ${item.nama}`}
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
        <h1 className={styles.title}>Manajemen Data Wisata</h1>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Cari wisata..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
            aria-label="Cari wisata"
          />
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricsLeft}>
          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi}`}
            onClick={() => {
              setFilterTarif('semua')
              setCurrentPage(1)
            }}
            title="Klik untuk filter semua wisata"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 22"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Wisata</span>
              <span className={styles.kpiValue}>{totalWisata}</span>
            </div>
          </div>

          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi}`}
            onClick={() => {
              setFilterTarif('gratis')
              setCurrentPage(1)
            }}
            title="Klik untuk filter wisata gratis"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v12M6 12h12"></path></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Wisata Gratis</span>
              <span className={styles.kpiValue}>{totalGratis}</span>
            </div>
          </div>

          <div
            className={`${styles.kpiCard} ${styles.interactiveKpi}`}
            onClick={() => {
              setFilterTarif('berbayar')
              setCurrentPage(1)
            }}
            title="Klik untuk filter wisata berbayar"
            role="button"
            tabIndex={0}
          >
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Wisata Berbayar</span>
              <span className={styles.kpiValue}>{totalBerbayar}</span>
            </div>
          </div>
        </div>

        <Button onClick={() => handleOpenModal()} className={styles.addButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tambah Wisata Baru
        </Button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Kota</label>
          <select
            value={filterKota}
            onChange={(e) => {
              setFilterKota(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
            aria-label="Filter Kota"
          >
            <option value="semua">Semua Kota</option>
            {kotaOptions.map(kota => (
              <option key={kota} value={kota}>{kota}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Kategori Tarif</label>
          <select
            value={filterTarif}
            onChange={(e) => {
              setFilterTarif(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.filterSelect}
            aria-label="Filter Kategori Tarif"
          >
            <option value="semua">Semua Kategori</option>
            <option value="gratis">Gratis</option>
            <option value="berbayar">Berbayar</option>
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
              Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} wisata
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
            label="Nama Wisata *" 
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
              value={currentWisata?.tarif === null || currentWisata?.tarif === undefined ? '' : currentWisata.tarif} 
              onChange={(e) => setCurrentWisata({...currentWisata, tarif: e.target.value ? parseInt(e.target.value) : 0})}
            />
          </div>
          <Input 
            label="Alamat" 
            value={currentWisata?.alamat || ''} 
            onChange={(e) => setCurrentWisata({...currentWisata, alamat: e.target.value})}
          />
          
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Rute Perjalanan (Opsional)</label>
            <select 
              style={{
                width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
              }}
              value={selectedRuteId}
              onChange={(e) => setSelectedRuteId(e.target.value)}
            >
              <option value="">- Tidak Ada Rute -</option>
              {ruteList.map(r => {
                const startLabel = r.halte_awal?.nama || 'Halte Awal'
                const endLabel = r.halte_akhir?.nama || 'Halte Akhir'
                return (
                  <option key={r.id} value={r.id}>
                    {r.kode} - {r.nama} ({startLabel} → {endLabel})
                  </option>
                )
              })}
            </select>
          </div>

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
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Foto Wisata</label>
            <input 
              type="file" 
              accept="image/*"
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFotoFile(e.target.files[0])
                }
              }}
            />
            {(fotoFile || currentWisata?.foto_url) && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {fotoFile ? `Terpilih: ${fotoFile.name}` : (currentWisata?.foto_url ? 'Foto saat ini sudah tersedia. Biarkan kosong jika tidak ingin mengubahnya.' : '')}
              </div>
            )}
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
        <p style={{ margin: '1rem 0' }}>Apakah Anda yakin ingin menghapus wisata <strong>{currentWisata?.nama}</strong>?</p>
      </Modal>
    </div>
  )
}
