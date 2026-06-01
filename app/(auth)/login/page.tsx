'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Akses ditolak: Anda bukan admin.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden="true">
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66667 25.3333C2.28889 25.3333 1.97222 25.2056 1.71667 24.95C1.46111 24.6944 1.33333 24.3778 1.33333 24V21.2667C0.933333 20.8222 0.611111 20.3278 0.366667 19.7833C0.122222 19.2389 0 18.6444 0 18V5.33333C0 3.48889 0.855556 2.13889 2.56667 1.28333C4.27778 0.427778 6.97778 0 10.6667 0C14.4889 0 17.2222 0.411111 18.8667 1.23333C20.5111 2.05556 21.3333 3.42222 21.3333 5.33333V18C21.3333 18.6444 21.2111 19.2389 20.9667 19.7833C20.7222 20.3278 20.4 20.8222 20 21.2667V24C20 24.3778 19.8722 24.6944 19.6167 24.95C19.3611 25.2056 19.0444 25.3333 18.6667 25.3333H17.3333C16.9556 25.3333 16.6389 25.2056 16.3833 24.95C16.1278 24.6944 16 24.3778 16 24V22.6667H5.33333V24C5.33333 24.3778 5.20556 24.6944 4.95 24.95C4.69444 25.2056 4.37778 25.3333 4 25.3333H2.66667V25.3333M2.66667 10.6667H18.6667V6.66667H2.66667V10.6667V10.6667M6 18.6667C6.55556 18.6667 7.02778 18.4722 7.41667 18.0833C7.80556 17.6944 8 17.2222 8 16.6667C8 16.1111 7.80556 15.6389 7.41667 15.25C7.02778 14.8611 6.55556 14.6667 6 14.6667C5.44444 14.6667 4.97222 14.8611 4.58333 15.25C4.19444 15.6389 4 16.1111 4 16.6667C4 17.2222 4.19444 17.6944 4.58333 18.0833C4.97222 18.4722 5.44444 18.6667 6 18.6667V18.6667M15.3333 18.6667C15.8889 18.6667 16.3611 18.4722 16.75 18.0833C17.1389 17.6944 17.3333 17.2222 17.3333 16.6667C17.3333 16.1111 17.1389 15.6389 16.75 15.25C16.3611 14.8611 15.8889 14.6667 15.3333 14.6667C14.7778 14.6667 14.3056 14.8611 13.9167 15.25C13.5278 15.6389 13.3333 16.1111 13.3333 16.6667C13.3333 17.2222 13.5278 17.6944 13.9167 18.0833C14.3056 18.4722 14.7778 18.6667 15.3333 18.6667V18.6667" fill="white"/>
            </svg>
          </div>
          <div className={styles.brandText}>
            <h2>BusGuide</h2>
            <p>Admin Operational Control</p>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.srOnly}>
              Email atau Nama Pengguna
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16v16H4z"></path>
                  <polyline points="4,4 12,13 20,4"></polyline>
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@busguide.id"
                aria-label="Email atau Nama Pengguna"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.srOnly}>
              Kata Sandi
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon} aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                aria-label="Kata Sandi"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
