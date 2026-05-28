'use client'

import { useState, useEffect } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { PerjalananLaporan, getLaporanPerjalanan } from '@/services/laporanService'
import styles from './laporan.module.css'

export default function LaporanPage() {
  const [data, setData] = useState<PerjalananLaporan[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('semua')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getLaporanPerjalanan()
      setData(res)
    } catch (error) {
      console.error('Failed to fetch laporan:', error)
      alert('Gagal mengambil data laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const headers = ['ID', 'Pengguna', 'Rute', 'Halte Asal', 'Halte Tujuan', 'Waktu Mulai', 'Waktu Selesai', 'Status']
    
    const rows = filteredData.map(item => [
      item.id,
      `"${item.profil?.nama || 'Unknown'}"`,
      `"${item.rute?.nama || '-'}"`,
      `"${item.halte_asal?.nama || '-'}"`,
      `"${item.halte_tujuan?.nama || '-'}"`,
      new Date(item.waktu_mulai).toLocaleString('id-ID'),
      item.waktu_selesai ? new Date(item.waktu_selesai).toLocaleString('id-ID') : '-',
      item.status
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `laporan_perjalanan_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = filterStatus === 'semua' 
    ? data 
    : data.filter(item => item.status === filterStatus)

  const columns = [
    { key: 'profil', title: 'Pengguna', render: (item: any) => item.profil?.nama || 'Unknown' },
    { key: 'rute', title: 'Rute', render: (item: any) => item.rute?.nama || '-' },
    { key: 'halte_asal', title: 'Dari', render: (item: any) => item.halte_asal?.nama || '-' },
    { key: 'halte_tujuan', title: 'Tujuan', render: (item: any) => item.halte_tujuan?.nama || '-' },
    { key: 'waktu_mulai', title: 'Waktu Mulai', render: (item: any) => new Date(item.waktu_mulai).toLocaleString('id-ID') },
    { key: 'status', title: 'Status', render: (item: any) => (
      <span style={{ 
        padding: '0.25rem 0.5rem', 
        borderRadius: '999px', 
        fontSize: '0.75rem',
        backgroundColor: item.status === 'selesai' ? '#D1FAE5' : item.status === 'aktif' ? '#DBEAFE' : '#FEE2E2',
        color: item.status === 'selesai' ? '#065F46' : item.status === 'aktif' ? '#1E40AF' : '#991B1B'
      }}>
        {item.status.toUpperCase()}
      </span>
    ) }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Laporan Perjalanan</h1>
        <Button onClick={handleExportCSV}>Export CSV</Button>
      </div>

      <div className={styles.filters}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Filter Status:</label>
        <select 
          style={{
            padding: '0.5rem 1rem', fontSize: '0.875rem',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'
          }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="semua">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      <Table columns={columns} data={filteredData} isLoading={loading} emptyMessage="Tidak ada data laporan perjalanan." />
    </div>
  )
}
