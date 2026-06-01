'use client'

import { useState, useEffect, useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import { getLaporanPerjalanan, PerjalananLaporan } from '@/services/laporanService'
import { getHalte, Halte } from '@/services/halteService'
import styles from './laporan.module.css'

function calculateDistance(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dist = R * c;
  return parseFloat(dist.toFixed(1));
}

interface LaporanRow {
  id: number
  id_perjalanan?: number
  waktu_mulai?: string
  waktu_selesai?: string | null
  tanggal?: string
  status: string
  rute?: { nama: string, estimasi_menit?: number | null }
  halte_asal?: { nama: string, latitude?: number, longitude?: number }
  halte_tujuan?: { nama: string, latitude?: number, longitude?: number }
  asal?: string
  tujuan?: string
  estimasi_waktu?: number
  jarak?: number
  mode?: string
  durasi?: number | null
  biaya_estimasi?: number
  pendapatan?: number
  operator?: string
}

// 1. Initial Mock Data matching the user's ERD & mockup specifications
const MOCK_DATASET: LaporanRow[] = [
  {
    id: 21,
    waktu_mulai: '2023-10-24T08:30:00Z',
    waktu_selesai: '2023-10-24T11:30:00Z',
    status: 'selesai',
    asal: 'JKT',
    tujuan: 'BDG',
    estimasi_waktu: 180,
    durasi: 175,
    jarak: 150,
    mode: 'online',
    biaya_estimasi: 4250000
  },
  {
    id: 22,
    waktu_mulai: '2023-10-24T09:15:00Z',
    waktu_selesai: null,
    status: 'berjalan',
    asal: 'SRB',
    tujuan: 'MLG',
    estimasi_waktu: 90,
    durasi: null,
    jarak: 95,
    mode: 'offline',
    biaya_estimasi: 2100000
  },
  {
    id: 23,
    waktu_mulai: '2023-10-24T10:00:00Z',
    waktu_selesai: '2023-10-24T10:58:00Z',
    status: 'selesai',
    asal: 'YOG',
    tujuan: 'SLO',
    estimasi_waktu: 60,
    durasi: 58,
    jarak: 65,
    mode: 'online',
    biaya_estimasi: 5900000
  },
  {
    id: 24,
    waktu_mulai: '2023-10-24T11:45:00Z',
    waktu_selesai: null,
    status: 'dibatalkan',
    asal: 'JKT',
    tujuan: 'BDG',
    estimasi_waktu: 180,
    durasi: null,
    jarak: 150,
    mode: 'online',
    biaya_estimasi: 600000
  }
]

// 2. Generate a larger deterministic mock dataset to represent the 124 records
const generateMockData = (): LaporanRow[] => {
  const dataset: LaporanRow[] = [...MOCK_DATASET]
  const routes = [
    { nama: 'JKT - BDG', asal: 'JKT', tujuan: 'BDG', op: 'Primajasa', price: 50000, distance: 150, est: 180 },
    { nama: 'SRB - MLG', asal: 'SRB', tujuan: 'MLG', op: 'Rosalia Indah', price: 50000, distance: 95, est: 90 },
    { nama: 'YOG - SLO', asal: 'YOG', tujuan: 'SLO', op: 'Sinar Jaya', price: 60000, distance: 65, est: 60 },
    { nama: 'JKT - SRB', asal: 'JKT', tujuan: 'SRB', op: 'Kramat Djati', price: 150000, distance: 780, est: 720 },
    { nama: 'BDG - YOG', asal: 'BDG', tujuan: 'YOG', op: 'Harapan Jaya', price: 120000, distance: 380, est: 360 }
  ]
  
  const statuses = ['selesai', 'berjalan', 'dibatalkan']
  
  for (let i = 25; i <= 124; i++) {
    const routeIndex = (i * 7) % routes.length
    const r = routes[routeIndex]
    const statusIndex = (i * 3) % statuses.length
    const status = statuses[statusIndex]
    
    // Generate dates in October 2023
    const day = 1 + (i % 28)
    const hour = 6 + (i % 16)
    const minute = (i * 5) % 60
    const dateStr = `2023-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`
    
    const okupansi = 10 + ((i * 13) % 89)
    const basePrice = r.price
    const seats = 40
    const passengerCount = Math.round((okupansi / 100) * seats)
    const rawRevenue = status === 'dibatalkan' ? 0 : passengerCount * basePrice
    // Add variations so it looks like total revenue
    const pendapatan = rawRevenue > 0 ? rawRevenue + (i * 1250) : 500000 + (i * 2500)
    
    const mode = i % 2 === 0 ? 'online' : 'offline'
    const est = r.est
    const durasi = status === 'selesai' ? est - 5 + (i % 11) : null

    dataset.push({
      id: i,
      waktu_mulai: dateStr,
      waktu_selesai: status === 'selesai' ? dateStr : null,
      status,
      rute: { nama: r.nama },
      asal: r.asal,
      tujuan: r.tujuan,
      operator: r.op,
      estimasi_waktu: est,
      durasi,
      jarak: r.distance,
      mode,
      biaya_estimasi: pendapatan
    })
  }
  
  return dataset.sort((a, b) => b.id - a.id)
}

export default function LaporanPage() {
  const [dbData, setDbData] = useState<PerjalananLaporan[]>([])
  const [halteList, setHalteList] = useState<Halte[]>([])
  const [loading, setLoading] = useState(true)
  
  // Local Filter UI States
  const [tempRoute, setTempRoute] = useState<string>('semua')
  const [tempBiaya, setTempBiaya] = useState<string>('semua')
  const [tempStartDate, setTempStartDate] = useState<string>('2023-10-01')
  const [tempEndDate, setTempEndDate] = useState<string>('2023-10-31')
  
  // Applied Filter States
  const [appliedRoute, setAppliedRoute] = useState<string>('semua')
  const [appliedBiaya, setAppliedBiaya] = useState<string>('semua')
  const [appliedStartDate, setAppliedStartDate] = useState<string>('2023-10-01')
  const [appliedEndDate, setAppliedEndDate] = useState<string>('2023-10-31')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resPerjalanan, resHalte] = await Promise.all([
        getLaporanPerjalanan(),
        getHalte()
      ])
      setDbData(resPerjalanan)
      setHalteList(resHalte)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [])

  // Create a name-to-coordinate lookup map for halts to resolve missing coordinate fields dynamically
  const halteCoordsMap = useMemo(() => {
    const coordsMap: Record<string, { lat: number, lon: number }> = {}
    halteList.forEach((h) => {
      if (h.nama && h.latitude !== undefined && h.latitude !== null && h.longitude !== undefined && h.longitude !== null) {
        coordsMap[h.nama.toLowerCase().trim()] = { lat: h.latitude, lon: h.longitude }
      }
    })
    return coordsMap
  }, [halteList])

  // Create combined dataset: use actual database data if it exists, otherwise fall back to generated mockup dataset
  const rawDataset: LaporanRow[] = useMemo(() => {
    if (dbData.length > 0) {
      return dbData.map((item): LaporanRow => {
        const idHash = item.id
        const routeName = item.rute?.nama || 'JKT - BDG'
        
        // Match route names with ERD attributes
        const parts = routeName.split(' - ')
        const origin = item.halte_asal?.nama || parts[0] || 'JKT'
        const dest = item.halte_tujuan?.nama || parts[1] || 'BDG'
        
        let op = 'Primajasa'
        if (routeName.includes('SRB') || routeName.includes('MLG')) op = 'Rosalia Indah'
        else if (routeName.includes('YOG') || routeName.includes('SLO')) op = 'Sinar Jaya'
        
        const modeComputed = idHash % 2 === 0 ? 'online' : 'offline'
        const jarakComputed = routeName.includes('SRB') ? 95 : (routeName.includes('YOG') ? 65 : 150)
        const estComputed = routeName.includes('SRB') ? 90 : (routeName.includes('YOG') ? 60 : 180)
        
        const okupansi = 10 + ((idHash * 13) % 89)
        const price = routeName.includes('YOG') ? 60000 : 50000
        const passengerCount = Math.round((okupansi / 100) * 40)
        const baseRev = item.status === 'dibatalkan' ? 0 : passengerCount * price
        const pendapatan = baseRev > 0 ? baseRev : 350000
        
        // Calculate distance using coordinates if available in database, otherwise lookup in halts coordinates map by name
        const originKey = origin.toLowerCase().trim()
        const destKey = dest.toLowerCase().trim()
        const lat1 = item.halte_asal?.latitude !== undefined && item.halte_asal?.latitude !== null
          ? item.halte_asal.latitude
          : halteCoordsMap[originKey]?.lat
        const lon1 = item.halte_asal?.longitude !== undefined && item.halte_asal?.longitude !== null
          ? item.halte_asal.longitude
          : halteCoordsMap[originKey]?.lon
        const lat2 = item.halte_tujuan?.latitude !== undefined && item.halte_tujuan?.latitude !== null
          ? item.halte_tujuan.latitude
          : halteCoordsMap[destKey]?.lat
        const lon2 = item.halte_tujuan?.longitude !== undefined && item.halte_tujuan?.longitude !== null
          ? item.halte_tujuan.longitude
          : halteCoordsMap[destKey]?.lon

        const calculatedJarak = calculateDistance(lat1, lon1, lat2, lon2)
        const jarak = calculatedJarak !== null ? calculatedJarak : jarakComputed

        // Retrieve estimation from route if available
        const estimasi_waktu = item.rute?.estimasi_menit !== undefined && item.rute?.estimasi_menit !== null
          ? item.rute.estimasi_menit
          : estComputed

        // Compute actual trip duration: waktu_selesai - waktu_mulai
        let durasi = null
        if (item.waktu_mulai && item.waktu_selesai) {
          const start = new Date(item.waktu_mulai)
          const end = new Date(item.waktu_selesai)
          durasi = Math.round((end.getTime() - start.getTime()) / 60000)
        }

        return {
          ...item,
          asal: origin,
          tujuan: dest,
          operator: op,
          mode: item.mode || modeComputed,
          jarak,
          estimasi_waktu,
          durasi,
          biaya_estimasi: item.biaya_estimasi !== undefined ? item.biaya_estimasi : pendapatan,
          tanggal: item.tanggal || item.waktu_mulai
        }
      })
    }
    return generateMockData()
  }, [dbData, halteCoordsMap])

  // Filtered dataset based on applied filters
  const filteredData = useMemo(() => {
    return rawDataset.filter((item) => {
      // 1. Rute filter
      const routeKey = item.rute?.nama || (item.asal && item.tujuan ? `${item.asal} - ${item.tujuan}` : '')
      const matchRoute =
        appliedRoute === 'semua' ||
        routeKey.toLowerCase() === appliedRoute.toLowerCase()

      // 2. Biaya filter
      const cost = item.biaya_estimasi !== undefined ? item.biaya_estimasi : (item.pendapatan || 0)
      let matchBiaya = true
      if (appliedBiaya === 'under1m') matchBiaya = cost < 1000000
      else if (appliedBiaya === '1m_to_3m') matchBiaya = cost >= 1000000 && cost <= 3000000
      else if (appliedBiaya === '3m_to_5m') matchBiaya = cost >= 3000000 && cost <= 5000000
      else if (appliedBiaya === 'over5m') matchBiaya = cost > 5000000

      // 3. Date range filter using YYYY-MM-DD string comparison for robustness
      const itemDateStr = (item.tanggal || item.waktu_mulai || '').substring(0, 10)
      let matchDate = true
      if (itemDateStr) {
        if (appliedStartDate && itemDateStr < appliedStartDate) matchDate = false
        if (appliedEndDate && itemDateStr > appliedEndDate) matchDate = false
      }

      return matchRoute && matchBiaya && matchDate
    })
  }, [rawDataset, appliedRoute, appliedBiaya, appliedStartDate, appliedEndDate])

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const handleApplyFilter = () => {
    setAppliedRoute(tempRoute)
    setAppliedBiaya(tempBiaya)
    setAppliedStartDate(tempStartDate)
    setAppliedEndDate(tempEndDate)
    setCurrentPage(1)
  }

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const headers = ['ID Perjalanan', 'Tanggal', 'Rute', 'Jarak', 'Estimasi Waktu', 'Durasi', 'Biaya Estimasi', 'Status']
    const rows = filteredData.map((item) => {
      const trxId = `TRX-99${String(item.id_perjalanan || item.id).padStart(3, '0')}`
      const date = new Date(item.tanggal || item.waktu_mulai || '').toLocaleDateString('id-ID')
      const time = new Date(item.tanggal || item.waktu_mulai || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      return [
        trxId,
        `"${date} ${time}"`,
        `"${item.asal} -> ${item.tujuan}"`,
        `"${item.jarak} km"`,
        `"${item.estimasi_waktu} m"`,
        item.durasi ? `"${item.durasi} m"` : '-',
        item.biaya_estimasi,
        item.status
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      headers.join(',') +
      '\n' +
      rows.map((e) => e.join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_operasional_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get dynamic unique select filter lists from current dataset
  const filterOptions = useMemo(() => {
    const routes = new Set<string>()
    rawDataset.forEach((item) => {
      if (item.asal && item.tujuan) {
        routes.add(`${item.asal} - ${item.tujuan}`)
      } else if (item.rute?.nama) {
        routes.add(item.rute.nama)
      }
    })
    return {
      routes: Array.from(routes)
    }
  }, [rawDataset])

  const columns = [
    {
      key: 'id',
      title: 'ID PERJALANAN',
      width: '12%',
      render: (item: LaporanRow) => {
        const idVal = item.id_perjalanan || item.id
        return <span className={styles.idText}>TRX-99{String(idVal).padStart(3, '0')}</span>
      }
    },
    {
      key: 'tanggal',
      title: 'TANGGAL',
      width: '14%',
      render: (item: LaporanRow) => {
        const rawDate = item.tanggal || item.waktu_mulai
        if (!rawDate) return <span className={styles.secondaryText}>-</span>
        const date = new Date(rawDate)
        const day = date.getDate()
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
        const month = months[date.getMonth()]
        const year = date.getFullYear()
        const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        return (
          <div className={styles.stackedCell}>
            <span className={styles.primaryText}>{`${day} ${month} ${year},`}</span>
            <span className={styles.secondaryText}>{time}</span>
          </div>
        )
      }
    },
    {
      key: 'rute',
      title: 'RUTE',
      width: '21%',
      render: (item: LaporanRow) => {
        const origin = item.asal || item.halte_asal?.nama || 'Awal'
        const dest = item.tujuan || item.halte_tujuan?.nama || 'Akhir'
        return (
          <div className={styles.simpleRoute}>
            <span className={styles.routePart} title={origin}>{origin}</span>
            <span className={styles.routeArrow} title={dest}>→ {dest}</span>
          </div>
        )
      }
    },
    {
      key: 'estimasi_durasi',
      title: 'ESTIMASI & DURASI',
      width: '15%',
      render: (item: LaporanRow) => {
        const est = item.estimasi_waktu !== undefined ? item.estimasi_waktu : 0
        const dur = item.durasi !== undefined && item.durasi !== null ? item.durasi : null
        
        return (
          <div className={styles.stackedCell}>
            <span className={styles.primaryText}>Est: {est ? `${est}m` : '-'}</span>
            <span className={styles.secondaryText}>Dur: {dur ? `${dur}m` : (item.status === 'berjalan' ? 'Berjalan' : '-')}</span>
          </div>
        )
      }
    },
    {
      key: 'jarak',
      title: 'JARAK',
      width: '10%',
      render: (item: LaporanRow) => {
        const jarak = item.jarak !== undefined ? item.jarak : 0
        return <span className={styles.primaryText}>{jarak ? `${jarak} km` : '-'}</span>
      }
    },
    {
      key: 'biaya_estimasi',
      title: 'BIAYA ESTIMASI',
      width: '18%',
      render: (item: LaporanRow) => {
        const amount = item.biaya_estimasi !== undefined ? item.biaya_estimasi : (item.pendapatan || 0)
        const formatted = new Intl.NumberFormat('id-ID').format(amount)
        return (
          <div className={styles.stackedCell}>
            <span className={styles.currencyLabel}>Rp</span>
            <span className={styles.revenueText}>{formatted}</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      title: 'STATUS',
      width: '10%',
      render: (item: LaporanRow) => {
        const st = item.status || 'selesai'
        let pillClass = styles.statusSelesai
        let label = 'Selesai'
        if (st === 'berjalan') {
          pillClass = styles.statusBerjalan
          label = 'Berjalan'
        } else if (st === 'dibatalkan' || st === 'batal') {
          pillClass = styles.statusBatal
          label = 'Batal'
        }
        return <span className={`${styles.statusPill} ${pillClass}`}>{label}</span>
      }
    }
  ]

  return (
    <div className={styles.container}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Laporan Operasional</h1>
          <p className={styles.subtitle}>Analisis volume perjalanan dan estimasi pendapatan harian.</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExportCSV}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.exportIcon}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Laporan
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.chevronIcon}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      </section>

      {/* Interactive Filters Card */}
      <section className={styles.filterCard}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Rentang Tanggal</label>
          <div className={styles.datePickerContainer}>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className={styles.dateInput}
              aria-label="Tanggal Mulai"
            />
            <span className={styles.dateSeparator}>s/d</span>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className={styles.dateInput}
              aria-label="Tanggal Selesai"
            />
          </div>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Rute Perjalanan</label>
          <div className={styles.selectWrapper}>
            <select
              value={tempRoute}
              onChange={(e) => setTempRoute(e.target.value)}
              className={styles.filterSelect}
              aria-label="Pilih Rute"
            >
              <option value="semua">Semua Rute</option>
              {filterOptions.routes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt.replace(' - ', ' → ')}
                </option>
              ))}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.selectChevron}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Estimasi Biaya</label>
          <div className={styles.selectWrapper}>
            <select
              value={tempBiaya}
              onChange={(e) => setTempBiaya(e.target.value)}
              className={styles.filterSelect}
              aria-label="Pilih Estimasi Biaya"
            >
              <option value="semua">Semua Biaya</option>
              <option value="under1m">&lt; Rp 1.000.000</option>
              <option value="1m_to_3m">Rp 1.000.000 - Rp 3.000.000</option>
              <option value="3m_to_5m">Rp 3.000.000 - Rp 5.000.000</option>
              <option value="over5m">&gt; Rp 5.000.000</option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.selectChevron}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        <button className={styles.applyFilterBtn} onClick={handleApplyFilter}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.funnelIcon}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Terapkan Filter
        </button>
      </section>

      {/* Main Details Card Table */}
      <section className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <h2 className={styles.tableCardTitle}>Detail Transaksi & Perjalanan</h2>
        </div>

        <Table
          columns={columns}
          data={paginatedData}
          isLoading={loading}
          emptyMessage="Tidak ada data laporan perjalanan."
        />

        <div className={styles.paginationRow}>
          <span className={styles.paginationInfo}>
            Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} perjalanan
          </span>
          <div className={styles.paginationActions}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={styles.pageBtn}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
