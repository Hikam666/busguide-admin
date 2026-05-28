'use client'

import { useState, useEffect } from 'react'
import { getHalte } from '@/services/halteService'
import { getRute } from '@/services/ruteService'
import { getPoBus } from '@/services/armadaService'
import { getLaporanPerjalanan } from '@/services/laporanService'
import styles from './home.module.css'

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    halte: 0,
    rute: 0,
    armada: 0,
    laporan: 0,
  })
  
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [halteRes, ruteRes, armadaRes, laporanRes] = await Promise.all([
          getHalte(),
          getRute(),
          getPoBus(),
          getLaporanPerjalanan()
        ])

        setMetrics({
          halte: halteRes.length,
          rute: ruteRes.length,
          armada: armadaRes.length,
          laporan: laporanRes.length,
        })

        // Get 5 most recent reports for activity feed
        setRecentActivities(laporanRes.slice(0, 5))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <h1>Selamat Datang di BusGuide</h1>
          <p>
            Ringkasan data transportasi cerdas Anda. Kelola halte, rute bus, armada, dan pantau laporan perjalanan harian secara langsung dari satu panel terpusat yang modern.
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(69, 105, 168, 0.1)', color: 'var(--primary-color)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Halte</span>
            <span className={styles.metricValue}>{metrics.halte}</span>
            <span className={styles.metricTrend}><span className={styles.trendUp}>↑ Stabil</span> dari bulan lalu</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(120, 221, 176, 0.1)', color: 'var(--success)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Rute Aktif</span>
            <span className={styles.metricValue}>{metrics.rute}</span>
            <span className={styles.metricTrend}><span className={styles.trendUp}>↑ +2</span> rute baru</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 216, 138, 0.15)', color: '#D4A633' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Mitra Armada</span>
            <span className={styles.metricValue}>{metrics.armada}</span>
            <span className={styles.metricTrend}><span className={styles.trendUp}>↑ Stabil</span> kemitraan</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(255, 143, 163, 0.1)', color: 'var(--danger)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Laporan Harian</span>
            <span className={styles.metricValue}>{metrics.laporan}</span>
            <span className={styles.metricTrend}><span className={styles.trendDown}>↓ -5%</span> dari kemarin</span>
          </div>
        </div>
      </section>

      {/* Charts & Activity */}
      <section className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Grafik Laporan Perjalanan (Simulasi)</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            Area Data Visualization (Charts/Graphs)
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Aktivitas Terbaru</h3>
          </div>
          <div className={styles.activityList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div key={idx} className={styles.activityItem}>
                  <div className={styles.activityAvatar}>
                    {activity.profil?.nama ? activity.profil.nama.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className={styles.activityDetails}>
                    <span className={styles.activityText}>
                      <strong>{activity.profil?.nama || 'Unknown User'}</strong> memulai rute <strong>{activity.rute?.nama || 'Rute'}</strong>
                    </span>
                    <span className={styles.activityTime}>
                      {new Date(activity.waktu_mulai).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada aktivitas.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
