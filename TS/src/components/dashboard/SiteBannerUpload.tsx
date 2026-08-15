import { useEffect, useRef, useState } from 'react'
import { FaImage, FaTrash, FaUpload } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

// Admin control for the single site-wide promo banner shown at the top of
// the public (pre-login) nav — see TopNavigationBar.tsx / AuthLayout.tsx on
// the student side, which fetch GET /api/site-banner and only render it on
// the main domain / localhost (never on institute subdomains).
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

  useEffect(() => { fetchBanner() }, [])

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
    <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.1rem 1.25rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
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
  )
}

export default SiteBannerUpload
