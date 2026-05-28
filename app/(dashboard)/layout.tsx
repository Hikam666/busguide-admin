import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import styles from './dashboard.module.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.layoutWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  )
}
