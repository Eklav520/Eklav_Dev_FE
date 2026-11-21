import { useEffect, useRef, useState } from 'react'
import { FaImage, FaTrash, FaUpload, FaCalendarAlt } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import SiteEventsModal from './SiteEventsModal'
import { ModuleShell } from './moduleOverview/ModuleOverview'

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

  const busy = savingHeroMode || heroModeLoading

  return (
    <ModuleShell
      icon={FaImage}
      color="#ff7a00"
      title="Landing Page Hero"
      subtitle="Choose what visitors see at the top of eklav.in: a promo banner or your upcoming events"
      controls={
        <div className="mo-period" role="group" aria-label="Showing on the landing page" style={{ opacity: busy ? 0.6 : 1 }}>
          <button type="button" className="sb-mode" data-on={heroMode === 'banner'} onClick={() => handleHeroModeChange('banner')} disabled={busy}><FaImage /> Banner</button>
          <button type="button" className="sb-mode" data-on={heroMode === 'events'} onClick={() => handleHeroModeChange('events')} disabled={busy}><FaCalendarAlt /> Events</button>
        </div>
      }
    >
      <div className="mo-grid-3-2">
        {/* Site banner */}
        <div className={`mo-panel sb-card${heroMode === 'banner' ? ' is-live' : ''}`}>
          <div className="mo-panel-head">
            <FaImage /><span>Site banner</span>
            <em>{heroMode === 'banner' ? <span className="sb-live"><i /> Live on landing page</span> : 'Not showing'}</em>
          </div>
          <div className="is-pad sb-body">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button type="button" className={`sb-preview${currentUrl ? ' has-image' : ''}`} onClick={() => !uploading && fileInputRef.current?.click()} disabled={uploading}>
              {!loading && currentUrl
                ? <img src={currentUrl} alt="Current site banner" />
                : <span className="sb-drop"><FaUpload /><b>Upload a banner image</b><small>Wide strip, about 1600 × 220 px (7 : 1)</small></span>}
              {uploading && <span className="sb-progress"><i style={{ width: `${progress}%` }} /><em>Uploading… {progress}%</em></span>}
            </button>
            <p className="sb-note">Shows at the top of the public site (eklav.in only, never on institute subdomains). A 7 : 1 image fills the bar edge to edge without cropping.</p>
            {error && <p className="sb-error">{error}</p>}
            <div className="sb-actions">
              <button type="button" className="mo-btn is-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <FaUpload /> {currentUrl ? 'Replace image' : 'Upload image'}
              </button>
              {currentUrl && <button type="button" className="mo-btn" onClick={handleRemove} disabled={uploading}><FaTrash /> Remove</button>}
              {heroMode !== 'banner' && <button type="button" className="mo-btn" onClick={() => handleHeroModeChange('banner')} disabled={busy}>Show banner instead</button>}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className={`mo-panel sb-card${heroMode === 'events' ? ' is-live' : ''}`}>
          <div className="mo-panel-head">
            <FaCalendarAlt /><span>Upcoming events</span>
            <em>{heroMode === 'events' ? <span className="sb-live"><i /> Live on landing page</span> : 'Not showing'}</em>
          </div>
          <div className="is-pad sb-body">
            <div className="sb-events">
              <b>{eventsCount}</b>
              <span>active event{eventsCount === 1 ? '' : 's'}</span>
            </div>
            <p className="sb-note">{eventsCount > 0 ? 'Event cards replace the banner when Events is live.' : 'Add your first event to show event cards on the landing page.'}</p>
            <div className="sb-actions">
              <button type="button" className="mo-btn is-primary" onClick={() => setShowEventsModal(true)}><FaCalendarAlt /> Manage events</button>
              {heroMode !== 'events' && <button type="button" className="mo-btn" onClick={() => handleHeroModeChange('events')} disabled={busy}>Show events instead</button>}
            </div>
          </div>
        </div>
      </div>

      <SiteEventsModal
        show={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        onCountChange={setEventsCount}
      />

      <style>{`
        .sb-mode { width: auto !important; padding: 0 14px !important; gap: 7px; display: inline-flex !important; align-items: center; font: inherit; font-size: 0.8rem !important; font-weight: 700; }
        .sb-mode + .sb-mode { border-left: 1px solid var(--mo-line) !important; }
        .sb-mode[data-on='true'] { background: #ff7a00 !important; color: #fff !important; }
        .sb-card.is-live { border-color: rgba(255,122,0,0.45); box-shadow: 0 0 0 1px rgba(255,122,0,0.12) inset; }
        .sb-live { display: inline-flex; align-items: center; gap: 6px; color: #4ade80; font-weight: 700; }
        .sb-live i { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
        .sb-body { display: flex; flex-direction: column; gap: 12px; height: 100%; }
        .sb-preview { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 7 / 1.4; min-height: 120px; padding: 0; border: 1.5px dashed #2c3035; border-radius: 12px; background: #0a0b0d; color: var(--mo-muted); cursor: pointer; overflow: hidden; transition: border-color .15s; }
        .sb-preview:hover:not(:disabled) { border-color: rgba(255,122,0,0.6); }
        .sb-preview.has-image { border-style: solid; }
        .sb-preview img { width: 100%; height: 100%; object-fit: cover; }
        .sb-drop { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .sb-drop svg { font-size: 1.2rem; color: #ff9a3c; margin-bottom: 4px; }
        .sb-drop b { color: #e6e8ea; font-size: 0.88rem; }
        .sb-drop small { color: var(--mo-dim); font-size: 0.74rem; }
        .sb-progress { position: absolute; inset: auto 0 0 0; display: block; padding: 8px 12px 10px; background: rgba(0,0,0,0.65); text-align: left; }
        .sb-progress i { display: block; height: 4px; border-radius: 99px; background: #ff7a00; transition: width .2s; }
        .sb-progress em { display: block; margin-top: 5px; color: #fff; font-size: 0.74rem; font-style: normal; font-weight: 700; }
        .sb-note { margin: 0; color: var(--mo-dim); font-size: 0.78rem; line-height: 1.55; }
        .sb-error { margin: 0; color: #f87171; font-size: 0.8rem; font-weight: 600; }
        .sb-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
        .sb-actions .mo-btn:disabled { opacity: .55; cursor: default; }
        .sb-events { display: flex; align-items: baseline; gap: 10px; padding: 18px 16px; border: 1px solid var(--mo-line); border-radius: 12px; background: #0a0b0d; }
        .sb-events b { color: #fff; font-size: 2.2rem; font-weight: 800; line-height: 1; }
        .sb-events span { color: var(--mo-muted); font-size: 0.9rem; font-weight: 600; }
      `}</style>
    </ModuleShell>
  )
}

export default SiteBannerUpload
