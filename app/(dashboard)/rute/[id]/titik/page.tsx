'use client'

import { useState, useEffect, useMemo, useRef, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TitikRute, Rute, getTitikRute, getRute, saveTitikRuteList } from '@/services/ruteService'
import styles from './titik.module.css'

export default function TitikRutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idRute = parseInt(id)

  const [data, setData] = useState<TitikRute[]>([])
  const [originalData, setOriginalData] = useState<TitikRute[]>([])
  const [routeDetail, setRouteDetail] = useState<Rute | null>(null)
  const [loading, setLoading] = useState(true)

  // Form Modal States (for manually typing coordinate values)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTitik, setCurrentTitik] = useState<Partial<TitikRute>>({})

  const [saving, setSaving] = useState(false)

  // Leaflet Map States
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null)

  // Map Center & Zoom (Defaults centered near Jakarta or first route coordinate)
  const [centerLat, setCenterLat] = useState(-6.2146)
  const [centerLng, setCenterLng] = useState(106.8451)
  const [zoomLevel] = useState(14)

  // Active dragged item state for list sorting
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const [titikRes, ruteRes] = await Promise.all([
        getTitikRute(idRute),
        getRute()
      ])
      setData(titikRes || [])
      setOriginalData(titikRes || [])
      const matchedRoute = ruteRes.find(r => r.id === idRute)
      setRouteDetail(matchedRoute || null)

      // Center map around the first coordinates if they exist, or the starting terminal
      if (titikRes && titikRes.length > 0) {
        setCenterLat(titikRes[0].latitude)
        setCenterLng(titikRes[0].longitude)
        if (mapInstance) {
          mapInstance.setView([titikRes[0].latitude, titikRes[0].longitude], zoomLevel)
        }
      } else if (matchedRoute?.halte_awal?.latitude && matchedRoute?.halte_awal?.longitude) {
        setCenterLat(matchedRoute.halte_awal.latitude)
        setCenterLng(matchedRoute.halte_awal.longitude)
        if (mapInstance) {
          mapInstance.setView([matchedRoute.halte_awal.latitude, matchedRoute.halte_awal.longitude], zoomLevel)
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
      alert('Gagal mengambil data koordinat rute')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idRute])

  // Dynamically load Leaflet assets from CDN (safe client-side only loading)
  useEffect(() => {
    // Check if Leaflet is already loaded on window
    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    // Load stylesheet with a unique ID to avoid duplication across mounts
    let link = document.getElementById('leaflet-css') as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet script with a unique ID
    let script = document.getElementById('leaflet-js') as HTMLScriptElement
    if (!script) {
      script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => setLeafletLoaded(true)
      script.onerror = () => {
        console.error('Failed to load Leaflet script from CDN.')
      }
      document.head.appendChild(script)
    } else {
      // Script tag exists but window.L is not loaded yet (script still loading)
      const handleLoad = () => setLeafletLoaded(true)
      script.addEventListener('load', handleLoad)
      return () => {
        script.removeEventListener('load', handleLoad)
      }
    }
  }, [])

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return
    const L = (window as any).L
    if (!L) return

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false
    })

    // Standard Google Maps street theme
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map)

    setMapInstance(map)

    // Add click listener to plot points directly on map
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      setData(prev => {
        const nextUrutan = prev.length + 1
        return [
          ...prev,
          {
            id: Date.now(), // temp client ID
            id_rute: idRute,
            urutan: nextUrutan,
            latitude: lat,
            longitude: lng
          } as TitikRute
        ]
      })
    })

    // Clean up map instance on unmount to prevent container duplication errors
    return () => {
      map.remove()
      setMapInstance(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded])

  // Update Map Markers & Polylines when coordinate data changes
  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return
    const L = (window as any).L
    if (!L) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    // Render new markers
    const newMarkers: any[] = []

    // 1. Render Start/End Reference Markers if routeDetail is loaded
    if (routeDetail) {
      if (routeDetail.halte_awal?.latitude && routeDetail.halte_awal?.longitude) {
        const startIcon = L.divIcon({
          className: styles.leafletStartIcon,
          html: `<div class="${styles.startBubble}">AWAL</div>`,
          iconSize: [52, 26],
          iconAnchor: [26, 13]
        })
        const startMarker = L.marker([routeDetail.halte_awal.latitude, routeDetail.halte_awal.longitude], {
          icon: startIcon,
          draggable: false
        }).addTo(mapInstance)
        
        startMarker.bindTooltip(`<b>Mulai:</b> ${routeDetail.halte_awal.nama}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: styles.mapTooltip
        })
        
        newMarkers.push(startMarker)
      }

      if (routeDetail.halte_akhir?.latitude && routeDetail.halte_akhir?.longitude) {
        const endIcon = L.divIcon({
          className: styles.leafletEndIcon,
          html: `<div class="${styles.endBubble}">AKHIR</div>`,
          iconSize: [52, 26],
          iconAnchor: [26, 13]
        })
        const endMarker = L.marker([routeDetail.halte_akhir.latitude, routeDetail.halte_akhir.longitude], {
          icon: endIcon,
          draggable: false
        }).addTo(mapInstance)
        
        endMarker.bindTooltip(`<b>Tujuan:</b> ${routeDetail.halte_akhir.nama}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: styles.mapTooltip
        })
        
        newMarkers.push(endMarker)
      }
    }

    // 2. Render route intermediate nodes
    data.forEach((coord, idx) => {
      // Circular order marker design matching Google Maps standard badge
      const markerIcon = L.divIcon({
        className: styles.leafletMarkerIcon,
        html: `<div class="${styles.markerBubble}">${idx + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })

      const marker = L.marker([coord.latitude, coord.longitude], {
        icon: markerIcon,
        draggable: true
      }).addTo(mapInstance)

      // Update coordinates dynamically on drag release
      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng()
        setData(prev => prev.map((item, i) => i === idx ? { ...item, latitude: lat, longitude: lng } : item))
      })

      newMarkers.push(marker)
    })
    
    markersRef.current = newMarkers

    // Render connecting path lines
    const linePath = data.map(c => [c.latitude, c.longitude])
    if (linePath.length > 1) {
      const poly = L.polyline(linePath, {
        color: '#2563eb', // Royal blue line
        weight: 4,
        opacity: 0.8
      }).addTo(mapInstance)
      polylineRef.current = poly
    }

  }, [data, mapInstance, leafletLoaded, routeDetail])

  // Map Programmatic Controls
  const zoomIn = () => {
    if (mapInstance) mapInstance.zoomIn()
  }

  const zoomOut = () => {
    if (mapInstance) mapInstance.zoomOut()
  }

  const recenter = () => {
    if (!mapInstance) return
    if (data.length > 0) {
      mapInstance.setView([data[0].latitude, data[0].longitude], mapInstance.getZoom())
    } else if (routeDetail?.halte_awal?.latitude && routeDetail?.halte_awal?.longitude) {
      mapInstance.setView([routeDetail.halte_awal.latitude, routeDetail.halte_awal.longitude], mapInstance.getZoom())
    } else {
      mapInstance.setView([-6.2146, 106.8451], zoomLevel)
    }
  }

  // Re-ordering html5 drag events
  const handleListDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleListDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const updatedList = [...data]
    const draggedItem = updatedList[draggedIndex]
    updatedList.splice(draggedIndex, 1)
    updatedList.splice(index, 0, draggedItem)

    // Reset sequence order index
    const reordered = updatedList.map((item, idx) => ({
      ...item,
      urutan: idx + 1
    }))

    setData(reordered)
    setDraggedIndex(null)
  }

  // Add manually via modal form
  const handleOpenAddModal = () => {
    const nextUrutan = data.length > 0 ? Math.max(...data.map(d => d.urutan)) + 1 : 1
    setCurrentTitik({ urutan: nextUrutan, latitude: centerLat, longitude: centerLng })
    setIsModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsModalOpen(false)
    setCurrentTitik({})
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentTitik.latitude === undefined || currentTitik.longitude === undefined || currentTitik.urutan === undefined) {
      alert('Isi semua parameter koordinat')
      return
    }

    setData(prev => {
      const list = [...prev]
      const newItem = {
        id: Date.now(),
        id_rute: idRute,
        urutan: currentTitik.urutan!,
        latitude: currentTitik.latitude!,
        longitude: currentTitik.longitude!
      } as TitikRute
      
      list.push(newItem)
      list.sort((a, b) => a.urutan - b.urutan)
      
      return list.map((item, idx) => ({ ...item, urutan: idx + 1 }))
    })

    handleCloseAddModal()
  }

  const handleRemoveItem = (index: number) => {
    setData(prev => {
      const filtered = prev.filter((_, idx) => idx !== index)
      return filtered.map((item, idx) => ({ ...item, urutan: idx + 1 }))
    })
  }

  // Save changes to database
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await saveTitikRuteList(idRute, data)
      alert('Titik koordinat berhasil disimpan!')
      fetchData(false)
    } catch (error) {
      console.error('Failed to save to database:', error)
      const errObj = error as Record<string, unknown>
      const msg = errObj?.message || errObj?.details || (error instanceof Error ? error.message : JSON.stringify(error))
      alert('Gagal menyimpan perubahan ke database: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setData([...originalData])
    if (originalData.length > 0 && mapInstance) {
      mapInstance.setView([originalData[0].latitude, originalData[0].longitude], mapInstance.getZoom())
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        
        {/* Left Side: Map Section */}
        <div className={styles.mapColumn}>
          <div className={styles.mapHeader}>
            <div className={styles.titleArea}>
              <Link href="/rute" className={styles.backBtn} aria-label="Kembali">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Kembali
              </Link>
              <div className={styles.headerTitles}>
                <h1 className={styles.title}>Manajemen Titik Koordinat</h1>
                <span className={styles.subtitle}>
                  Rute: {routeDetail ? `${routeDetail.kode} (${routeDetail.nama})` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.mapWrapper}>
            
            {/* Custom Map Zoom UI overlays */}
            <div className={styles.mapControls}>
              <button onClick={zoomIn} title="Perbesar" aria-label="Perbesar peta">+</button>
              <button onClick={zoomOut} title="Perkecil" aria-label="Perkecil peta">-</button>
              <button onClick={recenter} title="Recenter Peta" className={styles.recenterBtn} aria-label="Recenter peta">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
              </button>
            </div>

            {/* Banner Mode indicator on bottom-left */}
            <div className={styles.modeBanner}>
              <div className={styles.modeDot}></div>
              <div className={styles.modeContent}>
                <h4 className={styles.modeTitle}>Mode: Edit Titik</h4>
                <p className={styles.modeText}>Klik pada peta untuk menambahkan titik koordinat baru di antara node yang ada.</p>
              </div>
            </div>

            {/* Map Element Container */}
            <div 
              ref={mapContainerRef} 
              className={styles.googleMap} 
            />
          </div>
        </div>

        {/* Right Side: Coordinates Sidebar Section */}
        <div className={styles.sidebarColumn}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Urutan Koordinat</h2>
            <Button onClick={handleOpenAddModal} className={styles.sidebarAddBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Tambah Titik
            </Button>
          </div>

          <div className={styles.cardsList}>
            {loading ? (
              <div className={styles.emptyCardState}>Loading data...</div>
            ) : data.length === 0 ? (
              <div className={styles.emptyCardState}>
                Belum ada titik koordinat. Klik pada peta untuk mulai memetakan rute ini.
              </div>
            ) : (
              data.map((coord, index) => (
                <div 
                  key={coord.id || index}
                  className={`${styles.coordCard} ${draggedIndex === index ? styles.draggedCard : ''}`}
                  draggable
                  onDragStart={(e) => handleListDragStart(e, index)}
                  onDragOver={handleListDragOver}
                  onDrop={(e) => handleListDrop(e, index)}
                >
                  <div className={styles.cardOrderBadge}>{index + 1}</div>
                  
                  <div className={styles.cardFields}>
                    <div className={styles.coordFieldGroup}>
                      <span className={styles.fieldLabel}>LATITUDE</span>
                      <span className={styles.fieldValue}>{coord.latitude.toFixed(6)}</span>
                    </div>
                    <div className={styles.coordFieldGroup}>
                      <span className={styles.fieldLabel}>LONGITUDE</span>
                      <span className={styles.fieldValue}>{coord.longitude.toFixed(6)}</span>
                    </div>
                  </div>

                  <button 
                    className={styles.cardDeleteBtn} 
                    onClick={() => handleRemoveItem(index)}
                    title="Hapus koordinat"
                    aria-label={`Hapus koordinat ke-${index + 1}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              ))
            )}

            {/* Decorative hint dashed reorder card */}
            {data.length > 1 && (
              <div className={styles.reorderHintCard}>
                <span className={styles.reorderHintText}>Geser titik untuk mengatur ulang urutan...</span>
                <span className={styles.dragHandleIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </span>
              </div>
            )}
          </div>

          <div className={styles.sidebarFooter}>
            <button 
              onClick={handleReset} 
              className={styles.resetFooterBtn}
              title="Reset Perubahan"
              aria-label="Reset semua perubahan koordinat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
              Reset
            </button>
            <button 
              onClick={handleSaveAll} 
              className={styles.saveFooterBtn}
              disabled={saving}
              title="Simpan Rute"
              aria-label="Simpan seluruh koordinat ke database"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

      </div>

      {/* Manual Input Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseAddModal}
        title="Tambah Titik Koordinat Baru"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseAddModal}>Batal</Button>
            <Button onClick={handleSaveModal}>Tambahkan</Button>
          </>
        }
      >
        <form onSubmit={handleSaveModal}>
          <Input 
            label="Urutan ke- *" 
            type="number"
            value={currentTitik?.urutan === undefined ? '' : currentTitik.urutan} 
            onChange={(e) => setCurrentTitik({...currentTitik, urutan: parseInt(e.target.value)})}
            required 
          />
          <div className={styles.row}>
            <Input 
              label="Latitude *" 
              type="number" step="any"
              placeholder="e.g. -6.2146"
              value={currentTitik?.latitude === undefined ? '' : currentTitik.latitude} 
              onChange={(e) => setCurrentTitik({...currentTitik, latitude: e.target.value ? parseFloat(e.target.value) : 0})}
              required 
            />
            <Input 
              label="Longitude *" 
              type="number" step="any"
              placeholder="e.g. 106.8451"
              value={currentTitik?.longitude === undefined ? '' : currentTitik.longitude} 
              onChange={(e) => setCurrentTitik({...currentTitik, longitude: e.target.value ? parseFloat(e.target.value) : 0})}
              required 
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
