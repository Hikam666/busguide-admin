'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/assets/img/logo.jpg" alt="Logo" className={styles.logoImage} />
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
