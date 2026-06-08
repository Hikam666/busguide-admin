'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { uploadFile } from '@/services/uploadService'
import styles from './profile.module.css'

interface Profile {
  id: string
  nama: string
  role: string
  no_hp: string | null
  alamat: string | null
  avatar_url: string | null
  status_akun: string | null
  last_login: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  
  // Profile fields
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [role, setRole] = useState('')
  const [statusAkun, setStatusAkun] = useState('aktif')
  const [lastLogin, setLastLogin] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserId(user.id)
        setEmail(user.email || '')

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else if (profile) {
          setNama(profile.nama || '')
          setNoHp(profile.no_hp || '')
          setAlamat(profile.alamat || '')
          setAvatarUrl(profile.avatar_url || '')
          setRole(profile.role || 'admin')
          setStatusAkun(profile.status_akun || 'aktif')
          
          if (profile.last_login) {
            setLastLogin(new Date(profile.last_login).toLocaleString('id-ID', {
              dateStyle: 'long',
              timeStyle: 'medium'
            }))
          } else {
            setLastLogin('-')
          }
        }
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!nama.trim()) {
      alert('Nama wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      let uploadedUrl = avatarUrl.trim() || null

      if (avatarFile) {
        uploadedUrl = await uploadFile(avatarFile, 'avatars')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nama: nama.trim(),
          no_hp: noHp.trim() || null,
          alamat: alamat.trim() || null,
          avatar_url: uploadedUrl
        })
        .eq('id', userId)

      if (error) throw error
      alert('Profil berhasil diperbarui!')
      // Refresh the page to reload state in Header
      router.refresh()
      window.location.reload()
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert('Gagal memperbarui profil. Mohon coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Memuat profil...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Pengaturan Profil</h1>
          <p className={styles.subtitle}>Kelola detail data pribadi dan preferensi akun administrator Anda.</p>
        </div>
      </section>

      <div className={styles.contentGrid}>
        {/* Left Card: Summary */}
        <div className={styles.profileSummaryCard}>
          <div className={styles.avatarWrapper}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={nama} className={styles.largeAvatar} />
            ) : (
              <div className={styles.largeFallback}>{nama.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <h2 className={styles.summaryName}>{nama || 'Administrator'}</h2>
          <span className={styles.summaryRoleBadge}>{role.toUpperCase()}</span>
          
          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status Akun</span>
              <span className={`${styles.statusBadge} ${statusAkun === 'aktif' ? styles.statusActive : styles.statusInactive}`}>
                {statusAkun.toUpperCase()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Login Terakhir</span>
              <span className={styles.metaValue}>{lastLogin}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Form Edit */}
        <div className={styles.formCard}>
          <h2 className={styles.cardTitle}>Detail Profil</h2>
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.row}>
              <Input
                label="Nama Lengkap *"
                placeholder="Nama Anda"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
              <div className={styles.formGroup}>
                <label className={styles.disabledLabel}>Email (Read-Only)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={styles.disabledInput}
                />
              </div>
            </div>

            <div className={styles.row}>
              <Input
                label="Nomor Telepon / HP"
                placeholder="e.g. 08123456789"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.inputLabel}>Foto Profil (Avatar)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setAvatarFile(e.target.files[0])
                    }
                  }}
                />
                {(avatarFile || avatarUrl) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {avatarFile ? `Terpilih: ${avatarFile.name}` : (avatarUrl ? 'Avatar saat ini sudah tersedia.' : '')}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Alamat Lengkap</label>
              <textarea
                placeholder="Alamat Anda"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.actionRow}>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.push('/')}
                disabled={submitting}
              >
                Kembali
              </Button>
              <Button 
                type="submit" 
                isLoading={submitting}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
