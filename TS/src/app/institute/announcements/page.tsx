import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Spinner, Alert } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import { FaPlus, FaTrash, FaEdit, FaBullhorn, FaTrophy, FaUpload, FaTimes } from 'react-icons/fa'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const ANNOUNCE_TYPES = ['general', 'info', 'event', 'urgent', 'holiday']
const ACHIEVE_CATS   = ['general', 'academic', 'sports', 'placement', 'extracurricular', 'certification']

const TYPE_COLOR: Record<string, string> = {
  urgent: '#ef4444', event: '#3b82f6', holiday: '#10b981', info: '#ff7a00', general: '#8b5cf6',
}
const CAT_COLOR: Record<string, string> = {
  academic: '#f59e0b', sports: '#10b981', placement: '#3b82f6',
  extracurricular: '#ec4899', certification: '#8b5cf6', general: '#ff7a00',
}

const TEMPLATES: { id: string; label: string; preview: React.CSSProperties; desc: string }[] = [
  { id: 'wave',    label: 'Celebration',   desc: 'Blue waves, image left',    preview: { background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', borderRadius: 8 } },
  { id: 'bold',    label: 'Bold Event',    desc: 'Orange accent, big title',  preview: { background: 'linear-gradient(135deg,#ff7a00,#f97316)', borderRadius: 8 } },
  { id: 'dark',    label: 'Professional',  desc: 'Dark navy, modern look',    preview: { background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 8 } },
  { id: 'minimal', label: 'Minimal Clean', desc: 'White, clean typography',   preview: { background: 'linear-gradient(135deg,#f8fafc,#e2e8f0)', borderRadius: 8, border: '1px solid #cbd5e1' } },
]

const emptyA = { title: '', subtitle: '', description: '', type: 'general', template: 'wave', imageUrl: '', date: '' }
const emptyB = { studentName: '', studentEmail: '', studentPic: '', title: '', description: '', category: 'general', imageUrl: '', date: '' }

/* ── S3 presigned upload helper ─────────────────────────── */
async function uploadToS3(file: File, folder: string, token: string): Promise<string> {
  const presignRes = await axios.post(
    `${baseURL}/api/institute/presign-image`,
    { fileName: file.name, fileType: file.type, folder },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const { uploadUrl, fields, fileUrl } = presignRes.data

  const formData = new FormData()
  Object.entries(fields as Record<string, string>).forEach(([k, v]) => formData.append(k, v))
  formData.append('file', file)

  await axios.post(uploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return fileUrl
}

/* ── Image upload field ─────────────────────────────────── */
function ImageUploadField({
  label, value, onChange, folder, token,
}: {
  label: string; value: string; onChange: (url: string) => void; folder: string; token: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    setError('')
    setUploading(true)
    try {
      const url = await uploadToS3(file, folder, token)
      onChange(url)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="preview" style={{ height: 80, borderRadius: 8, border: '1.5px solid #2a2a2a', objectFit: 'cover', maxWidth: '100%' }} />
          <button
            onClick={() => onChange('')}
            title="Remove"
            style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
          >
            <FaTimes />
          </button>
          <button
            onClick={() => ref.current?.click()}
            style={{ display: 'block', marginTop: 6, background: '#2a2a2a', border: 'none', borderRadius: 6, padding: '4px 12px', color: '#ccc', cursor: 'pointer', fontSize: 12 }}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', background: '#0a0a0a', border: '1.5px dashed #2a2a2a', borderRadius: 8,
            padding: '16px', color: uploading ? '#ff7a00' : '#666', cursor: uploading ? 'default' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 13,
          }}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" style={{ color: '#ff7a00' }} />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload style={{ fontSize: 20, color: '#555' }} />
              Click to upload image
              <span style={{ fontSize: 11, color: '#444' }}>JPG, PNG, WebP — max 10 MB</span>
            </>
          )}
        </button>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export default function AnnouncementsAdminPage() {
  const { user } = useAuthContext()
  const h = { Authorization: `Bearer ${user?.token}` }

  const defaultTab = useMemo(() => new URLSearchParams(window.location.search).get('tab') === 'achieve' ? 'achieve' : 'announce', [])
  const [tab, setTab]               = useState<'announce' | 'achieve'>(defaultTab)
  const [announcements, setAnn]     = useState<any[]>([])
  const [achievements, setAch]      = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)

  const [aForm, setAForm] = useState({ ...emptyA })
  const [bForm, setBForm] = useState({ ...emptyB })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        axios.get(`${baseURL}/api/institute/announcements/admin`, { headers: h }),
        axios.get(`${baseURL}/api/institute/achievements/admin`,  { headers: h }),
      ])
      setAnn(a.data.data || [])
      setAch(b.data.data || [])
    } catch { setError('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user?.token) fetchAll() }, [user?.token])

  const resetForm = () => { setAForm({ ...emptyA }); setBForm({ ...emptyB }); setEditId(null); setShowForm(false) }

  const handleEdit = (item: any) => {
    setEditId(item._id)
    if (tab === 'announce') {
      setAForm({ title: item.title, subtitle: item.subtitle || '', description: item.description, type: item.type, template: item.template || 'wave', imageUrl: item.imageUrl || '', date: item.date?.slice(0, 10) || '' })
    } else {
      setBForm({ studentName: item.studentName, studentEmail: item.studentEmail || '', studentPic: item.studentPic || '', title: item.title, description: item.description || '', category: item.category, imageUrl: item.imageUrl || '', date: item.date?.slice(0, 10) || '' })
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const isAnn = tab === 'announce'
      const url   = isAnn ? '/api/institute/announcements' : '/api/institute/achievements'
      const body  = { ...(isAnn ? aForm : bForm), instituteId: user?.instituteId }
      if (editId) await axios.put(`${baseURL}${url}/${editId}`, body, { headers: h })
      else        await axios.post(`${baseURL}${url}`, body, { headers: h })
      await fetchAll()
      resetForm()
    } catch { setError('Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const url = tab === 'announce' ? '/api/institute/announcements' : '/api/institute/achievements'
    await axios.delete(`${baseURL}${url}/${id}`, { headers: h })
    fetchAll()
  }

  const toggleActive = async (item: any) => {
    const url = tab === 'announce' ? '/api/institute/announcements' : '/api/institute/achievements'
    await axios.put(`${baseURL}${url}/${item._id}`, { active: !item.active, instituteId: user?.instituteId }, { headers: h })
    fetchAll()
  }

  const items = tab === 'announce' ? announcements : achievements

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '24px', color: '#e0e0e0' }}>
      <style>{QUILL_DARK_CSS}</style>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#ff7a00', fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {tab === 'announce' ? <FaBullhorn /> : <FaTrophy />}
          {tab === 'announce' ? 'Announcements' : 'Achievements'} Manager
        </h1>
        <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>Manage what students see on their dashboard</p>
      </div>

      {/* Tabs + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: '#141414', borderRadius: 10, padding: 4, gap: 4 }}>
          {(['announce', 'achieve'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); resetForm() }} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'all .2s',
              background: tab === t ? '#ff7a00' : 'transparent',
              color: tab === t ? '#000' : '#888',
            }}>
              {t === 'announce' ? `📢 Announcements (${announcements.length})` : `🏆 Achievements (${achievements.length})`}
            </button>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} style={{
          background: '#ff7a00', border: 'none', borderRadius: 10, padding: '10px 20px',
          color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <FaPlus /> Add {tab === 'announce' ? 'Announcement' : 'Achievement'}
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Form */}
      {showForm && user?.token && (
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h4 style={{ color: '#ff7a00', margin: 0 }}>{editId ? 'Edit' : 'New'} {tab === 'announce' ? 'Announcement' : 'Achievement'}</h4>
            {user?.role === 'admin' && (
              <span style={{ background: '#ff7a0022', color: '#ff7a00', border: '1px solid #ff7a0055', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                GLOBAL — visible to all institutes
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {tab === 'announce' ? (
              <>
                {/* ── Template picker ── */}
                <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
                  <label style={labelStyle}>Banner Template</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {TEMPLATES.map(t => (
                      <div key={t.id} onClick={() => setAForm(f => ({ ...f, template: t.id }))}
                        style={{
                          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                          border: aForm.template === t.id ? '2.5px solid #ff7a00' : '2px solid #1a1a1a',
                          boxShadow: aForm.template === t.id ? '0 0 0 3px rgba(255,122,0,.25)' : 'none',
                          transition: 'all .2s',
                        }}>
                        {/* Mini preview */}
                        <div style={{ ...t.preview, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                          <span style={{ color: t.id === 'minimal' ? '#334155' : '#fff', fontWeight: 800, fontSize: 11, letterSpacing: .4, textShadow: t.id === 'minimal' ? 'none' : '0 1px 3px rgba(0,0,0,.3)' }}>Aa</span>
                        </div>
                        <div style={{ padding: '8px 10px', background: '#141414' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: aForm.template === t.id ? '#ff7a00' : '#ccc' }}>{t.label}</div>
                          <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Field label="Title" value={aForm.title} onChange={v => setAForm(f => ({ ...f, title: v }))} />
                <Field label="Subtitle / Tagline (optional)" value={aForm.subtitle} onChange={v => setAForm(f => ({ ...f, subtitle: v }))} />
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={aForm.type} onChange={e => setAForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                    {ANNOUNCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <Field label="Date" type="date" value={aForm.date} onChange={v => setAForm(f => ({ ...f, date: v }))} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <ImageUploadField
                    label="Banner Image (optional)"
                    value={aForm.imageUrl}
                    onChange={v => setAForm(f => ({ ...f, imageUrl: v }))}
                    folder="announcements"
                    token={user.token}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <div className="ann-quill" style={quillWrap}>
                    <ReactQuill
                      theme="snow"
                      value={aForm.description}
                      onChange={v => setAForm(f => ({ ...f, description: v }))}
                      placeholder="Write announcement details..."
                      modules={QUILL_MODULES}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="Student Name" value={bForm.studentName} onChange={v => setBForm(f => ({ ...f, studentName: v }))} />
                <Field label="Student Email (optional)" value={bForm.studentEmail} onChange={v => setBForm(f => ({ ...f, studentEmail: v }))} />
                <ImageUploadField
                  label="Student Photo (optional)"
                  value={bForm.studentPic}
                  onChange={v => setBForm(f => ({ ...f, studentPic: v }))}
                  folder="achievements/students"
                  token={user.token}
                />
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={bForm.category} onChange={e => setBForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {ACHIEVE_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <Field label="Achievement Title" value={bForm.title} onChange={v => setBForm(f => ({ ...f, title: v }))} />
                <ImageUploadField
                  label="Achievement Image (optional)"
                  value={bForm.imageUrl}
                  onChange={v => setBForm(f => ({ ...f, imageUrl: v }))}
                  folder="achievements/images"
                  token={user.token}
                />
                <Field label="Date" type="date" value={bForm.date} onChange={v => setBForm(f => ({ ...f, date: v }))} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description (optional)</label>
                  <div className="ann-quill" style={quillWrap}>
                    <ReactQuill
                      theme="snow"
                      value={bForm.description}
                      onChange={v => setBForm(f => ({ ...f, description: v }))}
                      placeholder="Write achievement details..."
                      modules={QUILL_MODULES}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: '#ff7a00', border: 'none', borderRadius: 8, padding: '9px 24px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} style={{ background: '#2a2a2a', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#ccc', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner animation="border" style={{ color: '#ff7a00' }} /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>No items yet. Click "Add" to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {items.map((item: any) => {
            const color = tab === 'announce' ? TYPE_COLOR[item.type] || '#ff7a00' : CAT_COLOR[item.category] || '#ff7a00'
            return (
              <div key={item._id} style={{
                background: '#141414', border: `1.5px solid ${color}44`,
                borderRadius: 14, padding: '18px', opacity: item.active ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
                      {tab === 'announce' ? item.type?.toUpperCase() : item.category?.toUpperCase()}
                    </span>
                    {item.isGlobal && (
                      <span style={{ background: '#ff7a0022', color: '#ff7a00', border: '1px solid #ff7a0055', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
                        GLOBAL
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive(item)} title={item.active ? 'Deactivate' : 'Activate'} style={iconBtn(item.active ? '#28a745' : '#666')}>
                      {item.active ? '✓' : '○'}
                    </button>
                    <button onClick={() => handleEdit(item)} style={iconBtn('#3b82f6')}><FaEdit /></button>
                    <button onClick={() => handleDelete(item._id)} style={iconBtn('#ef4444')}><FaTrash /></button>
                  </div>
                </div>
                {tab === 'achieve' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {item.studentPic
                      ? <img src={item.studentPic} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}` }} />
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color }}>{item.studentName?.charAt(0)}</div>
                    }
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.studentName}</div>
                  </div>
                )}
                {item.imageUrl && <img src={item.imageUrl} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 8, maxHeight: 80, overflow: 'hidden', WebkitLineClamp: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical' }} dangerouslySetInnerHTML={{ __html: item.description }} />
                <div style={{ fontSize: 11, color: '#555' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [false, 2, 3] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }
const quillWrap: React.CSSProperties = {
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #2a2a2a',
}

/* Inject dark-mode overrides for Quill (scoped so they don't affect other pages) */
const QUILL_DARK_CSS = `
  .ann-quill .ql-toolbar { background:#141414; border:none; border-bottom:1px solid #2a2a2a; }
  .ann-quill .ql-container { background:#0a0a0a; border:none; color:#e0e0e0; min-height:200px; font-size:13px; }
  .ann-quill .ql-editor { min-height:200px; }
  .ann-quill .ql-editor.ql-blank::before { color:#555; font-style:normal; }
  .ann-quill .ql-picker-label, .ann-quill .ql-picker-item { color:#ccc; }
  .ann-quill .ql-stroke { stroke:#ccc; }
  .ann-quill .ql-fill { fill:#ccc; }
  .ann-quill button:hover .ql-stroke, .ann-quill .ql-picker-label:hover .ql-stroke { stroke:#ff7a00; }
  .ann-quill button:hover .ql-fill, .ann-quill .ql-picker-label:hover .ql-fill { fill:#ff7a00; }
  .ann-quill .ql-active .ql-stroke { stroke:#ff7a00; }
  .ann-quill .ql-active .ql-fill { fill:#ff7a00; }
  .ann-quill .ql-picker-options { background:#1a1a1a; border:1px solid #333; }
  .ann-quill .ql-picker-item:hover { color:#ff7a00; }
`
const iconBtn = (color: string): React.CSSProperties => ({
  background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 6,
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color, fontSize: 12,
})

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}
