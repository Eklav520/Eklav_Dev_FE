import { useEffect, useRef, useState } from 'react'
import { FaImage, FaTrash, FaUpload, FaCalendarAlt } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import SiteEventsModal from './SiteEventsModal'

// Admin control for the ONE shared landing-page hero slot — either the
// site-wide promo banner (see TopNavigationBar.tsx / AuthLayout.tsx on the
// student side, which fetch GET /api/site-banner) or the "Upcoming Events"
// cards (GET /api/site-events), never both at once. Which one is live is
// GET/PUT /api/site-hero-config (see SiteHeroConfig on the backend) — the
// Banner/Events switch here changes that, so there's a single, obvious place
// to manage both instead of a separate admin page for events.
const SiteBannerUpload = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [heroMode, setHeroMode] = useState<'banner' | 'events'>('banner')
  const [heroModeLoading, setHeroModeLoading] = useState(true)
  const [savingHeroMode, setSavingHeroMode] = useState(false)
  const [eventsCount, setEventsCount] = useState(0)
  const [showEventsModal, setShowEventsModal] = useState(false)

  const fetchBanner = async () => {
    try {
      const res = await fetch(`${baseURL}/api/site-banner`)
      const data = await res.json()
      setCurrentUrl(data.banner?.imageUrl ?? null)
    } catch (err) {
      console.error('Failed to fetch site banner', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHeroMode = async () => {
    setHeroModeLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/site-hero-config`)
      const data = await res.json()
      setHeroMode(data.activeContent === 'events' ? 'events' : 'banner')
    } catch (err) {
      console.error('Failed to fetch hero config', err)
    } finally {
      setHeroModeLoading(false)
    }
  }

  const fetchEventsCount = async () => {
    try {
      const res = await fetch(`${baseURL}/api/site-events`)
      const data = await res.json()
      setEventsCount(Array.isArray(data.events) ? data.events.length : 0)
    } catch (err) {
      console.error('Failed to fetch site events count', err)
    }
  }

  useEffect(() => { fetchBanner(); fetchHeroMode(); fetchEventsCount() }, [])

  const handleHeroModeChange = async (mode: 'banner' | 'events') => {
    if (mode === heroMode || savingHeroMode || !token) return
    setSavingHeroMode(true)
    try {
      await fetch(`${baseURL}/api/site-hero-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activeContent: mode }),
      })
      setHeroMode(mode)
    } catch (err) {
      console.error('Failed to switch landing-page content', err)
    } finally {
      setSavingHeroMode(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // 1. Presigned S3 POST URL
      const presignRes = await fetch(`${baseURL}/s3/presign/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'image/png',
          context: 'site-banner',
          assetType: 'image',
        }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const presignData = await presignRes.json()
      if (!presignData.uploadUrl || !presignData.fields || !presignData.fileUrl) {
        throw new Error('Invalid presign response from server')
      }

      // 2. Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const formData = new FormData()
        Object.entries(presignData.fields as Record<string, string>).forEach(([k, v]) => formData.append(k, v))
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhr.open('POST', presignData.uploadUrl)
        xhr.upload.onprogress = (evt) => { if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100)) }
        xhr.onload = () => {
          if (xhr.status === 204 || xhr.status === 201 || xhr.status === 200) resolve()
          else reject(new Error(`S3 upload failed with status ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('S3 upload network error'))
        xhr.send(formData)
      })

      // 3. Persist the URL
      const saveRes = await fetch(`${baseURL}/api/site-banner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: presignData.fileUrl }),
      })
      if (!saveRes.ok) throw new Error('Failed to save banner')
      const saveData = await saveRes.json()
      setCurrentUrl(saveData.banner?.imageUrl ?? presignData.fileUrl)
    } catch (err) {
      console.error('Banner upload error', err)
      setError((err as Error).message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleRemove = async () => {
    if (!token) return
    try {
      await fetch(`${baseURL}/api/site-banner`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setCurrentUrl(null)
    } catch (err) {
      console.error('Failed to remove site banner', err)
    }
  }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.1rem 1.25rem', marginTop: '1.5rem' }}>
      {/* Banner / Events switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap' as const, gap: 10 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Landing Page Hero Content</div>
        <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 9, padding: 3, gap: 3, opacity: heroModeLoading ? 0.5 : 1 }}>
          <button
            type="button"
            onClick={() => handleHeroModeChange('banner')}
            disabled={savingHeroMode || heroModeLoading}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
              background: heroMode === 'banner' ? '#ff7a00' : 'transparent',
              color: heroMode === 'banner' ? '#000' : '#888',
            }}
          >
            <FaImage size={10} /> Banner
          </button>
          <button
            type="button"
            onClick={() => handleHeroModeChange('events')}
            disabled={savingHeroMode || heroModeLoading}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
              background: heroMode === 'events' ? '#ff7a00' : 'transparent',
              color: heroMode === 'events' ? '#000' : '#888',
            }}
          >
            <FaCalendarAlt size={10} /> Events
          </button>
        </div>
      </div>

      {heroMode === 'banner' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,122,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FaImage color="#ff7a00" size={16} />
          </div>

          <div style={{ minWidth: 200 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Site Banner (Top Nav)</div>
            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: 2 }}>
              Shows at the top of the public nav — only on eklav.in and localhost, never on institute subdomains.
            </div>
            <div style={{ color: '#ff9933', fontSize: '0.7rem', marginTop: 3 }}>
              Use a wide strip image (~1600×220px, roughly 7:1) so it fills the nav edge-to-edge without cropping or empty space.
            </div>
          </div>

          {!loading && currentUrl && (
            <img src={currentUrl} alt="Current site banner" style={{ height: 44, maxWidth: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid #262626' }} />
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {uploading && <span style={{ color: '#999', fontSize: '0.75rem' }}>{progress}%</span>}
            {error && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</span>}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ff7a00', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
            >
              <FaUpload size={11} /> {currentUrl ? 'Replace' : 'Upload'}
            </button>

            {currentUrl && (
              <button
                type="button"
                onClick={handleRemove}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid #333', color: '#999', borderRadius: 8, padding: '7px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaTrash size={11} /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,122,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FaCalendarAlt color="#ff7a00" size={16} />
          </div>

          <div style={{ minWidth: 200 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Upcoming Events</div>
            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: 2 }}>
              {eventsCount > 0 ? `${eventsCount} active event${eventsCount === 1 ? '' : 's'} showing on the landing page.` : 'No active events yet.'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEventsModal(true)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#ff7a00', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <FaCalendarAlt size={11} /> Manage Events
          </button>
        </div>
      )}

      <SiteEventsModal
        show={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        onCountChange={setEventsCount}
      />
    </div>
  )
}

export default SiteBannerUpload
