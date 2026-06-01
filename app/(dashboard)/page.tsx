'use client'

import { useEffect, useMemo, useState } from 'react'
import { getHalte } from '@/services/halteService'
import { getRute } from '@/services/ruteService'
import { getBusWithPo } from '@/services/armadaService'
import { getWisata } from '@/services/wisataService'
import { PerjalananLaporan, getLaporanPerjalanan } from '@/services/laporanService'
import { getJadwal, Jadwal } from '@/services/jadwalService'
import styles from './home.module.css'

type Metrics = {
  halte: number
  rute: number
  armada: number
  wisata: number
}

// PerjalananLaporan is used for types

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    halte: 0,
    rute: 0,
    armada: 0,
    wisata: 0,
  })

  const [recentActivities, setRecentActivities] = useState<PerjalananLaporan[]>([])
  const [schedules, setSchedules] = useState<Jadwal[]>([])
  const [filterDay, setFilterDay] = useState<string>('semua')
  const [filterHourRange, setFilterHourRange] = useState<string>('semua')
  const [loading, setLoading] = useState(true)

  const datetimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  )

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  )

  const formatWaktuMulai = (value: string | number | Date | null | undefined) => {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return datetimeFormatter.format(d)
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)

      // Allow partial success: one endpoint failing shouldn't block the others.
      const results = await Promise.allSettled([
        getHalte(),
        getRute(),
        getBusWithPo(),
        getWisata(),
        getLaporanPerjalanan(),
        getJadwal(),
      ])

      const [halteRes, ruteRes, armadaRes, wisataRes, laporanRes, jadwalRes] = results

      const safeLength = (res: PromiseSettledResult<unknown>) =>
        res.status === 'fulfilled' && Array.isArray(res.value) ? res.value.length : 0

      setMetrics({
        halte: safeLength(halteRes),
        rute: safeLength(ruteRes),
        armada: safeLength(armadaRes),
        wisata: safeLength(wisataRes),
      })

      if (laporanRes.status === 'fulfilled' && Array.isArray(laporanRes.value)) {
        setRecentActivities(laporanRes.value.slice(0, 5))
      } else {
        setRecentActivities([])
      }

      if (jadwalRes.status === 'fulfilled' && Array.isArray(jadwalRes.value)) {
        setSchedules(jadwalRes.value)
      } else {
        setSchedules([])
      }

      setLoading(false)

      // Helpful logs for debugging, without breaking UI.
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.error(`Error fetching dashboard data (index ${idx}):`, res.reason)
        }
      })
    }

    fetchDashboardData()
  }, [])

  const chartData = useMemo(() => {
    if (filterDay === 'semua') {
      const dailyCounts = {
        Senin: 0,
        Selasa: 0,
        Rabu: 0,
        Kamis: 0,
        Jumat: 0,
        Sabtu: 0,
        Minggu: 0,
      }

      schedules.forEach((schedule) => {
        if (schedule.status !== 'aktif') return
        const hour = parseInt(schedule.jam_berangkat.split(':')[0]) || 0
        
        // Hour range filter check
        if (filterHourRange === 'pagi' && (hour < 5 || hour >= 12)) return
        if (filterHourRange === 'siang' && (hour < 12 || hour >= 17)) return
        if (filterHourRange === 'malam' && (hour < 17 && hour >= 5)) return

        if (!schedule.hari || schedule.hari.length === 0) {
          // Runs every day
          dailyCounts.Senin++
          dailyCounts.Selasa++
          dailyCounts.Rabu++
          dailyCounts.Kamis++
          dailyCounts.Jumat++
          dailyCounts.Sabtu++
          dailyCounts.Minggu++
        } else {
          schedule.hari.forEach((h) => {
            const normalizedDay = h.charAt(0).toUpperCase() + h.slice(1).toLowerCase()
            if (normalizedDay in dailyCounts) {
              dailyCounts[normalizedDay as keyof typeof dailyCounts]++
            }
          })
        }
      })

      return Object.entries(dailyCounts).map(([label, value]) => ({ label, value }))
    } else {
      const hourlyBlocks = {
        '00-04': 0, // Dini Hari
        '04-08': 0, // Subuh
        '08-12': 0, // Pagi
        '12-16': 0, // Siang
        '16-20': 0, // Sore
        '20-24': 0, // Malam
      }

      const blockLabels: Record<string, string> = {
        '00-04': '00-04',
        '04-08': '04-08',
        '08-12': '08-12',
        '12-16': '12-16',
        '16-20': '16-20',
        '20-24': '20-24',
      }

      schedules.forEach((schedule) => {
        if (schedule.status !== 'aktif') return
        
        // Day filter check
        const runDays = schedule.hari ? schedule.hari.map(h => h.toLowerCase()) : []
        const isRunOnDay = runDays.length === 0 || runDays.includes(filterDay.toLowerCase())
        if (!isRunOnDay) return

        const hour = parseInt(schedule.jam_berangkat.split(':')[0]) || 0
        
        // Hour range filter check
        if (filterHourRange === 'pagi' && (hour < 5 || hour >= 12)) return
        if (filterHourRange === 'siang' && (hour < 12 || hour >= 17)) return
        if (filterHourRange === 'malam' && (hour < 17 && hour >= 5)) return

        if (hour >= 0 && hour < 4) hourlyBlocks['00-04']++
        else if (hour >= 4 && hour < 8) hourlyBlocks['04-08']++
        else if (hour >= 8 && hour < 12) hourlyBlocks['08-12']++
        else if (hour >= 12 && hour < 16) hourlyBlocks['12-16']++
        else if (hour >= 16 && hour < 20) hourlyBlocks['16-20']++
        else if (hour >= 20 && hour < 24) hourlyBlocks['20-24']++
      })

      return Object.entries(hourlyBlocks).map(([key, value]) => ({
        label: blockLabels[key],
        value,
      }))
    }
  }, [schedules, filterDay, filterHourRange])

  const maxVal = useMemo(() => {
    const val = Math.max(...chartData.map((d) => d.value))
    return val > 0 ? val : 4
  }, [chartData])

  return (
    <div className={styles.container}>
      <section className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Pantau status operasional BusGuide secara realtime</p>
        </div>
        <div className={styles.pageBadge}>
          <span className={styles.pageBadgeIcon} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </span>
          <span>{currentDate}</span>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div
              className={styles.metricIcon}
              style={{ backgroundColor: 'rgba(69, 105, 168, 0.12)', color: 'var(--primary-color)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span className={styles.metricBadge}>+12%</span>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Halte</span>
            <span className={styles.metricValue}>{metrics.halte}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 237, 247, 0.9)', color: 'var(--danger)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18"></path>
                <path d="M13 5l7 7-7 7"></path>
              </svg>
            </div>
            <span className={styles.metricBadge}>+4%</span>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Rute Aktif</span>
            <span className={styles.metricValue}>{metrics.rute}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 246, 255, 0.9)', color: 'var(--primary-color)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7" width="18" height="14" rx="2"></rect>
                <path d="M16 3v4"></path>
                <path d="M8 3v4"></path>
              </svg>
            </div>
            <span className={styles.metricBadge}>Stabil</span>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Armada</span>
            <span className={styles.metricValue}>{metrics.armada}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(255, 224, 230, 0.9)', color: 'var(--danger)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19h16"></path>
                <path d="M4 6h16"></path>
                <path d="M4 12h16"></path>
              </svg>
            </div>
            <span className={styles.metricBadge}>+24%</span>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Wisata Terdaftar</span>
            <span className={styles.metricValue}>{metrics.wisata}</span>
          </div>
        </div>
      </section>

      <section className={styles.overviewSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <p className={styles.sectionLabel}>Iktisar Jadwal Bus</p>
              <h2 className={styles.chartTitle}>
                {filterDay === 'semua' ? 'Performa Mingguan' : `Jadwal Hari ${filterDay.charAt(0).toUpperCase() + filterDay.slice(1)}`}
              </h2>
            </div>
            <div className={styles.chartFilters}>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className={styles.filterSelect}
                aria-label="Filter Hari"
              >
                <option value="semua">Semua Hari</option>
                <option value="senin">Senin</option>
                <option value="selasa">Selasa</option>
                <option value="rabu">Rabu</option>
                <option value="kamis">Kamis</option>
                <option value="jumat">Jumat</option>
                <option value="sabtu">Sabtu</option>
                <option value="minggu">Minggu</option>
              </select>

              <select
                value={filterHourRange}
                onChange={(e) => setFilterHourRange(e.target.value)}
                className={styles.filterSelect}
                aria-label="Filter Jam"
              >
                <option value="semua">Semua Jam</option>
                <option value="pagi">Pagi (05:00 - 11:59)</option>
                <option value="siang">Siang (12:00 - 16:59)</option>
                <option value="malam">Malam (17:00 - 04:59)</option>
              </select>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <svg
              viewBox="0 0 540 220"
              width="100%"
              height="100%"
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Grid lines & Y Axis */}
              {[0, 1, 2].map((j) => {
                const yGrid = 25 + (j / 2) * 165
                const gridValue = Math.round(maxVal - (j / 2) * maxVal)
                return (
                  <g key={j}>
                    <line
                      x1={35}
                      y1={yGrid}
                      x2={525}
                      y2={yGrid}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={27}
                      y={yGrid + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94A3B8"
                      fontWeight="600"
                    >
                      {gridValue}
                    </text>
                  </g>
                )
              })}

              {/* Bars and labels */}
              {chartData.map((item, i) => {
                const L = chartData.length
                const x = 35 + (i / L) * 490 + (490 / L) * 0.15
                const barWidth = (490 / L) * 0.7
                const barHeight = (item.value / maxVal) * 165
                const y = 220 - 30 - barHeight

                return (
                  <g key={item.label}>
                    {/* Value text above bar */}
                    {item.value > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="var(--primary-color)"
                      >
                        {item.value}
                      </text>
                    )}

                    {/* Bar rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight > 2 ? barHeight : (item.value > 0 ? 2 : 0)}
                      rx="4"
                      ry="4"
                      fill="url(#barGrad)"
                      style={{ transition: 'all 0.3s ease' }}
                    />

                    {/* X Axis label */}
                    <text
                      x={x + barWidth / 2}
                      y={208}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#64748B"
                    >
                      {item.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <aside className={styles.quickReportCard}>
          <div className={styles.quickReportHeader}>
            <div>
              <p className={styles.sectionLabel}>Aktivitas Terbaru</p>
              <p className={styles.sectionNote}>Riwayat Perjalan Pengguna</p>
            </div>
          </div>
          <div className={styles.reportScrollArea}>
            {loading ? (
              <p className={styles.noActivity}>Memuat data terbaru...</p>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const userName = activity.profil?.nama || 'Pengguna Umum'
                const activityStatus = activity.status || 'aktif'
                const waktuMulai = formatWaktuMulai(activity.waktu_mulai)
                const routeName = activity.rute?.nama || 'Rute Umum'
                const originStop = activity.halte_asal?.nama || 'Halte Awal'
                const destStop = activity.halte_tujuan?.nama || 'Halte Akhir'

                // Status style configuration
                const statusStyles = {
                  selesai: { bg: 'rgba(16, 185, 129, 0.12)', color: 'rgba(16, 185, 129, 1)' },
                  aktif: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgba(59, 130, 246, 1)' },
                  dibatalkan: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgba(239, 68, 68, 1)' },
                }[activityStatus] || { bg: 'rgba(107, 114, 128, 0.12)', color: 'rgba(107, 114, 128, 1)' }

                return (
                  <div key={activity.id ?? index} className={styles.reportCard}>
                    <div className={styles.avatarMini}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.reportDetails}>
                      <div className={styles.reportHeaderRow}>
                        <span className={styles.userNameText}>{userName}</span>
                        <span 
                          className={styles.statusPill} 
                          style={{ backgroundColor: statusStyles.bg, color: statusStyles.color }}
                        >
                          {activityStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.reportPathText} title={`${routeName}: ${originStop} → ${destStop}`}>
                        <span className={styles.routeNameHighlight}>{routeName}</span>: {originStop} → {destStop}
                      </div>
                      {waktuMulai && (
                        <div className={styles.reportTime}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.timeIcon}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span>{waktuMulai}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className={styles.noActivity}>Belum ada data perjalanan terbaru.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  )
}

