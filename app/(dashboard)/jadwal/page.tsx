'use client'

import { useState, useEffect } from 'react'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Jadwal, getJadwal, createJadwal, updateJadwal, deleteJadwal, getBus } from '@/services/jadwalService'
import { getRute } from '@/services/ruteService'
import styles from './jadwal.module.css'

const HARI_LIST = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([])
  const [ruteList, setRuteList] = useState<any[]>([])
  const [busList, setBusList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentJadwal, setCurrentJadwal] = useState<Partial<Jadwal> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jadwalRes, ruteRes, busRes] = await Promise.all([getJadwal(), getRute(), getBus()])
      setData(jadwalRes)
      setRuteList(ruteRes)
      setBusList(busRes)
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (jadwal?: Jadwal) => {
    if (jadwal) {
      setCurrentJadwal(jadwal)
    } else {
      setCurrentJadwal({ 
        id_rute: 0, 
        jam_berangkat: '08:00', 
        hari: [], 
        status: 'aktif' 
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
        status: currentJadwal.status as 'aktif' | 'tidak_aktif'
      }

      if (currentJadwal.id) {
        await updateJadwal(currentJadwal.id, payload)
      } else {
        await createJadwal(payload)
      }
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error.message || 'Gagal menyimpan jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentJadwal?.id) return
    setSubmitting(true)
    try {
      await deleteJadwal(currentJadwal.id)
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
    { key: 'rute', title: 'Rute', render: (item: Jadwal) => item.rute?.nama || `ID Rute: ${item.id_rute}` },
    { key: 'jam_berangkat', title: 'Jam Keberangkatan', render: (item: Jadwal) => item.jam_berangkat.substring(0, 5) },
    { key: 'bus', title: 'Bus', render: (item: Jadwal) => item.bus?.nomor_polisi || '-' },
    { key: 'hari', title: 'Hari', render: (item: Jadwal) => item.hari ? item.hari.map(h => h.substring(0,3)).join(', ') : 'Setiap Hari' },
    { key: 'status', title: 'Status', render: (item: Jadwal) => (
      <span style={{ 
        padding: '0.25rem 0.5rem', 
        borderRadius: '999px', 
        fontSize: '0.75rem',
        backgroundColor: item.status === 'aktif' ? '#D1FAE5' : '#FEE2E2',
        color: item.status === 'aktif' ? '#065F46' : '#991B1B'
      }}>
        {item.status.toUpperCase()}
      </span>
    ) },
    {
      key: 'actions',
      title: 'Aksi',
      render: (item: Jadwal) => (
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
        <h1 className={styles.title}>Manajemen Jadwal Bus</h1>
        <Button onClick={() => handleOpenModal()}>Tambah Jadwal</Button>
      </div>

      <Table columns={columns} data={data} isLoading={loading} />

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
