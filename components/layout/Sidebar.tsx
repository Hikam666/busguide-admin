'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.brandIcon} aria-hidden="true">
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 25.3333C2.28889 25.3333 1.97222 25.2056 1.71667 24.95C1.46111 24.6944 1.33333 24.3778 1.33333 24V21.2667C0.933333 20.8222 0.611111 20.3278 0.366667 19.7833C0.122222 19.2389 0 18.6444 0 18V5.33333C0 3.48889 0.855556 2.13889 2.56667 1.28333C4.27778 0.427778 6.97778 0 10.6667 0C14.4889 0 17.2222 0.411111 18.8667 1.23333C20.5111 2.05556 21.3333 3.42222 21.3333 5.33333V18C21.3333 18.6444 21.2111 19.2389 20.9667 19.7833C20.7222 20.3278 20.4 20.8222 20 21.2667V24C20 24.3778 19.8722 24.6944 19.6167 24.95C19.3611 25.2056 19.0444 25.3333 18.6667 25.3333H17.3333C16.9556 25.3333 16.6389 25.2056 16.3833 24.95C16.1278 24.6944 16 24.3778 16 24V22.6667H5.33333V24C5.33333 24.3778 5.20556 24.6944 4.95 24.95C4.69444 25.2056 4.37778 25.3333 4 25.3333H2.66667V25.3333M2.66667 10.6667H18.6667V6.66667H2.66667V10.6667V10.6667M6 18.6667C6.55556 18.6667 7.02778 18.4722 7.41667 18.0833C7.80556 17.6944 8 17.2222 8 16.6667C8 16.1111 7.80556 15.6389 7.41667 15.25C7.02778 14.8611 6.55556 14.6667 6 14.6667C5.44444 14.6667 4.97222 14.8611 4.58333 15.25C4.19444 15.6389 4 16.1111 4 16.6667C4 17.2222 4.19444 17.6944 4.58333 18.0833C4.97222 18.4722 5.44444 18.6667 6 18.6667V18.6667M15.3333 18.6667C15.8889 18.6667 16.3611 18.4722 16.75 18.0833C17.1389 17.6944 17.3333 17.2222 17.3333 16.6667C17.3333 16.1111 17.1389 15.6389 16.75 15.25C16.3611 14.8611 15.8889 14.6667 15.3333 14.6667C14.7778 14.6667 14.3056 14.8611 13.9167 15.25C13.5278 15.6389 13.3333 16.1111 13.3333 16.6667C13.3333 17.2222 13.5278 17.6944 13.9167 18.0833C14.3056 18.4722 14.7778 18.6667 15.3333 18.6667V18.6667" fill="white"/>
          </svg>
        </div>
        <div className={styles.brandText}>
          <h3>BusGuide Admin</h3>
          <p>Operational Control</p>
        </div>
      </div>
      
      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navGroupTitle}>MENU UTAMA</span>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
                Dashboard
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/halte" className={`${styles.navLink} ${pathname.startsWith('/halte') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Manajemen Halte
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/rute" className={`${styles.navLink} ${pathname.startsWith('/rute') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Manajemen Rute
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupTitle}>OPERASIONAL</span>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/armada" className={`${styles.navLink} ${pathname.startsWith('/armada') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Armada & PO Bus
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/wisata" className={`${styles.navLink} ${pathname.startsWith('/wisata') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Manajemen Wisata
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/jadwal" className={`${styles.navLink} ${pathname.startsWith('/jadwal') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Jadwal Bus
              </Link>
            </li>

          </ul>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupTitle}>ANALISIS</span>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/laporan" className={`${styles.navLink} ${pathname.startsWith('/laporan') ? styles.active : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.navIcon}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Laporan Perjalanan
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  )
}
