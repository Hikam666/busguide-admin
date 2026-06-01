'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './Header.module.css'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  type: 'route' | 'wisata' | 'trip'
  title: string
  desc: string
  time: string
  timestamp: number
  read: boolean
}

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  // Notification States
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Format date helper
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.round(diffMs / 60000)
      
      if (diffMin < 1) return 'Baru saja'
      if (diffMin < 60) return `${diffMin} menit yang lalu`
      
      const diffHours = Math.round(diffMin / 60)
      if (diffHours < 24) return `${diffHours} jam yang lalu`
      
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays} hari yang lalu`
    } catch (e) {
      return 'Baru-baru ini'
    }
  }

  // Fetch initial notifications from database (Only trips)
  const fetchNotifications = async () => {
    try {
      // Fetch latest trips (perjalanan)
      const { data: trips } = await supabase
        .from('perjalanan')
        .select(`
          id,
          waktu_mulai,
          status,
          rute:rute!id_rute (nama, kode),
          profil:profiles!id_pengguna (nama)
        `)
        .order('id', { ascending: false })
        .limit(10) // Show up to 10 historical trips

      const fetchedNotifs: NotificationItem[] = []

      // Map Trips
      if (trips) {
        trips.forEach((t: any) => {
          const profilData = Array.isArray(t.profil) ? t.profil[0] : t.profil
          const ruteData = Array.isArray(t.rute) ? t.rute[0] : t.rute
          const userName = profilData?.nama || 'Pengguna'
          const ruteName = ruteData ? `${ruteData.kode} (${ruteData.nama})` : 'Rute'
          fetchedNotifs.push({
            id: `trip-${t.id}`,
            type: 'trip',
            title: 'Perjalanan Dimulai',
            desc: `${userName} melakukan perjalanan rute ${ruteName}.`,
            time: formatTimeAgo(t.waktu_mulai),
            timestamp: new Date(t.waktu_mulai).getTime(),
            read: true
          })
        })
      }

      // Sort by timestamp descending
      fetchedNotifs.sort((a, b) => b.timestamp - a.timestamp)

      // Fallback greeting check
      if (fetchedNotifs.length === 0) {
        fetchedNotifs.push({
          id: 'system-active',
          type: 'trip',
          title: 'Sistem Aktif',
          desc: 'Koneksi real-time database berhasil terhubung. Menunggu perjalanan baru...',
          time: 'Baru saja',
          timestamp: Date.now(),
          read: false
        })
      }

      setNotifications(fetchedNotifs)
    } catch (err) {
      console.error('Failed to fetch initial notifications:', err)
    }
  }

  // Load initial notifications & subscribe to real-time events
  useEffect(() => {
    fetchNotifications()

    // Subscribe to insert database changes on perjalanan table only
    const channel = supabase
      .channel('db-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'perjalanan' },
        async (payload: any) => {
          const { data: tripDetail } = await supabase
            .from('perjalanan')
            .select(`
              id,
              waktu_mulai,
              rute:rute!id_rute (nama, kode),
              profil:profiles!id_pengguna (nama)
            `)
            .eq('id', payload.new.id)
            .single()

          if (tripDetail) {
            const detail = tripDetail as any
            const profilData = Array.isArray(detail.profil) ? detail.profil[0] : detail.profil
            const ruteData = Array.isArray(detail.rute) ? detail.rute[0] : detail.rute
            const userName = profilData?.nama || 'Pengguna'
            const ruteName = ruteData ? `${ruteData.kode} (${ruteData.nama})` : 'Rute'
            setNotifications(prev => [
              {
                id: `trip-${tripDetail.id}`,
                type: 'trip',
                title: 'Perjalanan Dimulai',
                desc: `${userName} melakukan perjalanan rute ${ruteName}.`,
                time: 'Baru saja',
                timestamp: Date.now(),
                read: false
              },
              // Filter out system-active fallback if it was present
              ...prev.filter(n => n.id !== 'system-active')
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle outside clicks to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleItemClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Search bar is removed as requested */}
        <div style={{ flex: 1 }} />
        
        <div className={styles.headerRight}>
          <div className={styles.notificationWrapper} ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={styles.notificationBtn} 
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {unreadCount > 0 && <span className={styles.badge} />}
            </button>

            {isOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Notifikasi Real-time</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className={styles.markAllReadBtn}>
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyState}>Tidak ada notifikasi baru</div>
                  ) : (
                    notifications.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleItemClick(item.id)}
                        className={`${styles.notificationItem} ${!item.read ? styles.itemUnread : ''}`}
                      >
                        <div className={`${styles.itemIcon} ${item.type === 'wisata' ? styles.itemIconSuccess : item.type === 'trip' ? styles.itemIconWarning : ''}`}>
                          {item.type === 'route' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                          ) : item.type === 'wisata' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                          )}
                        </div>
                        <div className={styles.itemContent}>
                          <span className={styles.itemTitle}>{item.title}</span>
                          <span className={styles.itemDesc}>{item.desc}</span>
                          <span className={styles.itemTime}>{item.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
 
          <div className={styles.divider}></div>
 
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Admin BusGuide</span>
              <span className={styles.userRole}>Super Admin</span>
            </div>
            <div className={styles.avatar}>A</div>
          </div>
 
          <button onClick={handleLogout} className={styles.logoutIcon} aria-label="Logout" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
