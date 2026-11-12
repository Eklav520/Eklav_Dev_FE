import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Modal } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaPlus, FaTrash, FaEdit, FaBullhorn, FaTrophy, FaUpload, FaTimes, FaSpinner, FaExclamationTriangle,
  FaEye, FaEyeSlash, FaGlobeAsia, FaImage, FaCheckCircle, FaCalendarAlt,
} from 'react-icons/fa'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import PageMetaData from '@/components/PageMetaData'
import {
  AdminPage, PageHeader, StatCards, Tabs, SearchInput, AdminSelect, TableFooter, EmptyState,
  initialsOf, type SelectOption,
} from '@/components/admin-ui'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

type Tab = 'announce' | 'achieve'

const ANNOUNCE_TYPES = ['general', 'info', 'event', 'urgent', 'holiday']
const ACHIEVE_CATS   = ['general', 'academic', 'sports', 'placement', 'extracurricular', 'certification']

const TYPE_BADGE: Record<string, string> = {
  urgent: 'aui-badge-red', event: 'aui-badge-blue', holiday: 'aui-badge-green', info: 'aui-badge-orange', general: 'aui-badge-purple',
}
const CAT_BADGE: Record<string, string> = {
  academic: 'aui-badge-amber', sports: 'aui-badge-green', placement: 'aui-badge-blue',
  extracurricular: 'aui-badge-red', certification: 'aui-badge-purple', general: 'aui-badge-orange',
}

const TEMPLATES: { id: string; label: string; preview: React.CSSProperties; desc: string }[] = [
  { id: 'wave',    label: 'Celebration',   desc: 'Blue waves, image left',   preview: { background: 'linear-gradient(135deg,#38bdf8,#3b82f6)' } },
  { id: 'bold',    label: 'Bold Event',    desc: 'Orange accent, big title', preview: { background: 'linear-gradient(135deg,#ff7a00,#f97316)' } },
  { id: 'dark',    label: 'Professional',  desc: 'Dark navy, modern look',   preview: { background: 'linear-gradient(135deg,#1e293b,#0f172a)' } },
  { id: 'minimal', label: 'Minimal Clean', desc: 'White, clean typography',  preview: { background: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' } },
]

const emptyA = { title: '', subtitle: '', description: '', type: 'general', template: 'wave', imageUrl: '', date: '' }
const emptyB = { studentName: '', studentEmail: '', studentPic: '', title: '', description: '', category: 'general', imageUrl: '', date: '' }

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const capOptions = (values: string[]): SelectOption[] => values.map(v => ({ value: v, label: cap(v) }))
const plainText = (html: string) => (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

const PAGE_SIZE = 10

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
  label, value, onChange, folder, token, round,
}: {
  label: string; value: string; onChange: (url: string) => void; folder: string; token: string; round?: boolean
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
    <div className="aui-field">
      <label className="aui-label">{label} <span className="aui-optional">Optional</span></label>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="d-none" />
      {value ? (
        <div className="ann-image">
          <img src={value} alt="" className={round ? 'is-round' : ''} />
          <div className="ann-image-actions">
            <button type="button" className="aui-btn aui-btn-sm" onClick={() => ref.current?.click()} disabled={uploading}>
              {uploading ? <><FaSpinner className="aui-spin" /> Uploading…</> : 'Replace'}
            </button>
            <button type="button" className="aui-btn aui-btn-sm aui-btn-danger" onClick={() => onChange('')}>Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" className="ann-drop" onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading
            ? <><FaSpinner className="aui-spin" /> Uploading…</>
            : <><FaUpload /> <span><strong>Upload image</strong><small>JPG, PNG or WebP · up to 10 MB</small></span></>}
        </button>
      )}
      {error && <p className="aui-error">{error}</p>}
    </div>
  )
}

export default function AnnouncementsAdminPage() {
  const { user } = useAuthContext()
  const h = { Authorization: `Bearer ${user?.token}` }

  const defaultTab = useMemo<Tab>(() => new URLSearchParams(window.location.search).get('tab') === 'achieve' ? 'achieve' : 'announce', [])
  const [tab, setTab]               = useState<Tab>(defaultTab)
  const [announcements, setAnn]     = useState<any[]>([])
  const [achievements, setAch]      = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')
  const [toDelete, setToDelete]     = useState<any | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [search, setSearch]       = useState('')
  const [kindFilter, setKind]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(1)

  const [aForm, setAForm] = useState({ ...emptyA })
  const [bForm, setBForm] = useState({ ...emptyB })

  const isAnn = tab === 'announce'
  const noun = isAnn ? 'Announcement' : 'Achievement'
  const apiPath = isAnn ? '/api/institute/announcements' : '/api/institute/achievements'

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        axios.get(`${baseURL}/api/institute/announcements/admin`, { headers: h }),
        axios.get(`${baseURL}/api/institute/achievements/admin`,  { headers: h }),
      ])
      setAnn(a.data.data || [])
      setAch(b.data.data || [])
    } catch { setError('Failed to load announcements and achievements.') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (user?.token) fetchAll() }, [user?.token]) // eslint-disable-line

  const switchTab = (t: Tab) => {
    setTab(t); resetForm(); setSearch(''); setKind(''); setStatus(''); setPage(1)
  }
  useEffect(() => { setPage(1) }, [search, kindFilter, statusFilter])

  const resetForm = () => { setAForm({ ...emptyA }); setBForm({ ...emptyB }); setEditId(null); setShowForm(false); setFormError('') }

  const openCreate = () => { resetForm(); setShowForm(true) }

  const handleEdit = (item: any) => {
    setEditId(item._id)
    setFormError('')
    if (isAnn) {
      setAForm({ title: item.title, subtitle: item.subtitle || '', description: item.description, type: item.type, template: item.template || 'wave', imageUrl: item.imageUrl || '', date: item.date?.slice(0, 10) || '' })
    } else {
      setBForm({ studentName: item.studentName, studentEmail: item.studentEmail || '', studentPic: item.studentPic || '', title: item.title, description: item.description || '', category: item.category, imageUrl: item.imageUrl || '', date: item.date?.slice(0, 10) || '' })
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (isAnn ? !aForm.title.trim() : (!bForm.studentName.trim() || !bForm.title.trim())) {
      setFormError(isAnn ? 'Please add a title.' : 'Please add the student name and achievement title.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body  = { ...(isAnn ? aForm : bForm), instituteId: user?.instituteId }
      if (editId) await axios.put(`${baseURL}${apiPath}/${editId}`, body, { headers: h })
      else        await axios.post(`${baseURL}${apiPath}`, body, { headers: h })
      await fetchAll()
      resetForm()
    } catch { setFormError('Save failed. Please try again.') }
    finally { setSaving(false) }
  }

  // Confirmed from the in-app dialog (replaces the browser confirm box)
  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await axios.delete(`${baseURL}${apiPath}/${toDelete._id}`, { headers: h })
      setToDelete(null)
      fetchAll()
    } catch { setError('Delete failed. Please try again.') }
    finally { setDeleting(false) }
  }

  const toggleActive = async (item: any) => {
    setTogglingId(item._id)
    try {
      await axios.put(`${baseURL}${apiPath}/${item._id}`, { active: !item.active, instituteId: user?.instituteId }, { headers: h })
      await fetchAll()
    } catch { setError('Could not change visibility. Please try again.') }
    finally { setTogglingId(null) }
  }

  const items = isAnn ? announcements : achievements
  const activeCount = items.filter(i => i.active).length
  const globalCount = items.filter(i => i.isGlobal).length

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i =>
      (!q || [i.title, i.subtitle, i.studentName, i.studentEmail, plainText(i.description)].some(v => (v || '').toLowerCase().includes(q))) &&
      (!kindFilter || (isAnn ? i.type : i.category) === kindFilter) &&
      (!statusFilter || (statusFilter === 'active' ? i.active : !i.active)))
  }, [items, search, kindFilter, statusFilter, isAnn])
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const filtersActive = !!(search || kindFilter || statusFilter)

  const VisibilitySwitch = ({ item }: { item: any }) => (
    <label className="aui-toggle ann-switch" title={item.active ? 'Visible to students — click to hide' : 'Hidden — click to show'}>
      <input type="checkbox" checked={!!item.active} disabled={togglingId === item._id} onChange={() => toggleActive(item)} aria-label={item.active ? 'Hide' : 'Show'} />
      <span className="aui-toggle-track" />
      <span className={`ann-switch-label${item.active ? ' is-on' : ''}`}>{item.active ? 'Visible' : 'Hidden'}</span>
    </label>
  )

  const RowActions = ({ item }: { item: any }) => (
    <div className="ann-actions">
      <button type="button" className="aui-icon-btn" onClick={() => handleEdit(item)} title="Edit" aria-label="Edit"><FaEdit size={11} /></button>
      <button type="button" className="aui-icon-btn ann-delete" onClick={() => setToDelete(item)} title="Delete" aria-label="Delete"><FaTrash size={11} /></button>
    </div>
  )

  return (
    <AdminPage>
      <PageMetaData title="Announcements" />
      <style>{QUILL_DARK_CSS}</style>

      <PageHeader
        icon={isAnn ? FaBullhorn : FaTrophy}
        title={isAnn ? 'Announcements' : 'Achievements'}
        stats={
          <StatCards
            inline
            loading={loading}
            items={[
              { label: `Total ${noun}s`, value: items.length, icon: isAnn ? FaBullhorn : FaTrophy, tone: 'orange' },
              { label: 'Visible', value: activeCount, icon: FaEye, tone: 'green' },
              { label: 'Hidden', value: items.length - activeCount, icon: FaEyeSlash, tone: 'red' },
              ...(globalCount ? [{ label: 'Global', value: globalCount, icon: FaGlobeAsia, tone: 'blue' as const }] : []),
            ]}
          />
        }
        actions={
          <Tabs<Tab>
            value={tab}
            onChange={switchTab}
            items={[
              { value: 'announce', label: 'Announcements', icon: FaBullhorn, count: announcements.length },
              { value: 'achieve', label: 'Achievements', icon: FaTrophy, count: achievements.length },
            ]}
          />
        }
      />

      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>{isAnn ? 'Dashboard announcements' : 'Student achievements'}</h3>
            <p>Shown on the student dashboard while visible</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={search} onChange={setSearch} placeholder={isAnn ? 'Search announcements…' : 'Search student or title…'} />
            <AdminSelect
              label={isAnn ? 'Type' : 'Category'}
              value={kindFilter}
              options={[{ value: '', label: isAnn ? 'All types' : 'All categories' }, ...capOptions(isAnn ? ANNOUNCE_TYPES : ACHIEVE_CATS)]}
              onChange={setKind}
            />
            <AdminSelect
              label="Visibility"
              value={statusFilter}
              options={[{ value: '', label: 'Any visibility' }, { value: 'active', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }]}
              onChange={setStatus}
            />
            <button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> New {noun}</button>
          </div>
        </div>

        {loading ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={isAnn ? FaBullhorn : FaTrophy}
            title={`No ${noun.toLowerCase()}s yet`}
            text={isAnn ? 'Post news, events or holidays — students see them on their dashboard.' : 'Celebrate your students — achievements appear on the student dashboard.'}
            action={<button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> Create {noun}</button>}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={isAnn ? FaBullhorn : FaTrophy}
            title="Nothing matches"
            text="Try a different search or filter."
            action={<button type="button" className="aui-btn aui-btn-sm" onClick={() => { setSearch(''); setKind(''); setStatus('') }}>Clear filters</button>}
          />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  {isAnn ? (
                    <tr>
                      <th>Announcement</th>
                      <th style={{ width: 120 }}>Type</th>
                      <th style={{ width: 130 }}>Date</th>
                      <th style={{ width: 140 }}>Visibility</th>
                      <th style={{ width: 90 }} className="text-end">Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th style={{ width: 260 }}>Student</th>
                      <th>Achievement</th>
                      <th style={{ width: 140 }}>Category</th>
                      <th style={{ width: 130 }}>Date</th>
                      <th style={{ width: 140 }}>Visibility</th>
                      <th style={{ width: 90 }} className="text-end">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {paged.map((item: any) => isAnn ? (
                    <tr key={item._id} className={item.active ? '' : 'ann-muted'}>
                      <td>
                        <div className="ann-item">
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt="" className="ann-thumb" />
                            : <span className="ann-thumb ann-thumb-empty" style={TEMPLATES.find(t => t.id === item.template)?.preview}><FaBullhorn /></span>}
                          <div className="aui-stack">
                            <strong>
                              {item.title}
                              {item.isGlobal && <span className="aui-badge aui-badge-blue ann-global"><FaGlobeAsia size={8} /> Global</span>}
                            </strong>
                            <small>{item.subtitle || plainText(item.description) || '—'}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className={`aui-badge ${TYPE_BADGE[item.type] || 'aui-badge-muted'}`}>{cap(item.type)}</span></td>
                      <td className="aui-num">{fmtDate(item.date)}</td>
                      <td><VisibilitySwitch item={item} /></td>
                      <td className="text-end"><RowActions item={item} /></td>
                    </tr>
                  ) : (
                    <tr key={item._id} className={item.active ? '' : 'ann-muted'}>
                      <td>
                        <div className="aui-person">
                          {item.studentPic
                            ? <img src={item.studentPic} alt="" className="aui-avatar ann-pic" />
                            : <span className="aui-avatar">{initialsOf(item.studentName)}</span>}
                          <div className="aui-stack">
                            <strong>{item.studentName}</strong>
                            <small>{item.studentEmail || 'No email'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="aui-stack ann-text">
                          <strong>
                            {item.title}
                            {item.isGlobal && <span className="aui-badge aui-badge-blue ann-global"><FaGlobeAsia size={8} /> Global</span>}
                          </strong>
                          {plainText(item.description) && <small>{plainText(item.description)}</small>}
                        </div>
                      </td>
                      <td><span className={`aui-badge ${CAT_BADGE[item.category] || 'aui-badge-muted'}`}>{cap(item.category)}</span></td>
                      <td className="aui-num">{fmtDate(item.date)}</td>
                      <td><VisibilitySwitch item={item} /></td>
                      <td className="text-end"><RowActions item={item} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooter page={page} pageSize={PAGE_SIZE} total={visible.length} onPageChange={setPage} noun={`${noun.toLowerCase()}s`} />
          </>
        )}
      </div>

      {/* ── Create / edit ── */}
      <Modal show={showForm && !!user?.token} onHide={() => !saving && resetForm()} size="lg" centered scrollable contentClassName="aui-modal" backdropClassName="aui-backdrop" enforceFocus={false}>
        <div className="aui-page ann-modal">
          <div className="aui-modal-head">
            <span className="aui-heading-icon">{isAnn ? <FaBullhorn /> : <FaTrophy />}</span>
            <div>
              <h3>{editId ? 'Edit' : 'New'} {noun}</h3>
              <p>{user?.role === 'admin' ? 'Global — visible to all institutes' : 'Shown on your students’ dashboard'}</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={resetForm} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
          </div>

          <div className="aui-modal-body">
            {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}

            {isAnn ? (
              <>
                <div className="aui-field">
                  <label className="aui-label">Banner template</label>
                  <div className="ann-templates">
                    {TEMPLATES.map(t => (
                      <button key={t.id} type="button" className={`ann-template${aForm.template === t.id ? ' is-active' : ''}`} onClick={() => setAForm(f => ({ ...f, template: t.id }))} aria-pressed={aForm.template === t.id}>
                        <span className="ann-template-preview" style={t.preview}>
                          <i style={{ color: t.id === 'minimal' ? '#334155' : '#fff' }}>Aa</i>
                          {aForm.template === t.id && <FaCheckCircle className="ann-template-check" />}
                        </span>
                        <strong>{t.label}</strong>
                        <small>{t.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="aui-field-row">
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ann-title">Title</label>
                    <input id="ann-title" className={`aui-input${formError && !aForm.title.trim() ? ' is-invalid' : ''}`} value={aForm.title} onChange={e => setAForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Campus placement drive" />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ann-sub">Subtitle <span className="aui-optional">Optional</span></label>
                    <input id="ann-sub" className="aui-input" value={aForm.subtitle} onChange={e => setAForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Short tagline" />
                  </div>
                </div>
                <div className="aui-field-row">
                  <div className="aui-field">
                    <label className="aui-label">Type</label>
                    <AdminSelect label="Type" value={aForm.type} options={capOptions(ANNOUNCE_TYPES)} onChange={v => setAForm(f => ({ ...f, type: v }))} />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ann-date"><FaCalendarAlt size={10} /> Date</label>
                    <input id="ann-date" type="date" className="aui-input" value={aForm.date} onChange={e => setAForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                {user?.token && (
                  <ImageUploadField label="Banner image" value={aForm.imageUrl} onChange={v => setAForm(f => ({ ...f, imageUrl: v }))} folder="announcements" token={user.token} />
                )}
                <div className="aui-field mb-0">
                  <label className="aui-label">Description</label>
                  <div className="ann-quill">
                    <ReactQuill theme="snow" value={aForm.description} onChange={v => setAForm(f => ({ ...f, description: v }))} placeholder="Write announcement details…" modules={QUILL_MODULES} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="aui-section-label ann-first">Student</div>
                <div className="aui-field-row">
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ach-name">Student name</label>
                    <input id="ach-name" className={`aui-input${formError && !bForm.studentName.trim() ? ' is-invalid' : ''}`} value={bForm.studentName} onChange={e => setBForm(f => ({ ...f, studentName: e.target.value }))} placeholder="e.g. Priya Sharma" />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ach-email">Student email <span className="aui-optional">Optional</span></label>
                    <input id="ach-email" type="email" className="aui-input" value={bForm.studentEmail} onChange={e => setBForm(f => ({ ...f, studentEmail: e.target.value }))} placeholder="name@college.edu" />
                  </div>
                </div>
                {user?.token && (
                  <ImageUploadField label="Student photo" value={bForm.studentPic} onChange={v => setBForm(f => ({ ...f, studentPic: v }))} folder="achievements/students" token={user.token} round />
                )}

                <div className="aui-section-label">Achievement</div>
                <div className="aui-field">
                  <label className="aui-label" htmlFor="ach-title">Achievement title</label>
                  <input id="ach-title" className={`aui-input${formError && !bForm.title.trim() ? ' is-invalid' : ''}`} value={bForm.title} onChange={e => setBForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Won the national hackathon" />
                </div>
                <div className="aui-field-row">
                  <div className="aui-field">
                    <label className="aui-label">Category</label>
                    <AdminSelect label="Category" value={bForm.category} options={capOptions(ACHIEVE_CATS)} onChange={v => setBForm(f => ({ ...f, category: v }))} />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="ach-date"><FaCalendarAlt size={10} /> Date</label>
                    <input id="ach-date" type="date" className="aui-input" value={bForm.date} onChange={e => setBForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                {user?.token && (
                  <ImageUploadField label="Achievement image" value={bForm.imageUrl} onChange={v => setBForm(f => ({ ...f, imageUrl: v }))} folder="achievements/images" token={user.token} />
                )}
                <div className="aui-field mb-0">
                  <label className="aui-label">Description <span className="aui-optional">Optional</span></label>
                  <div className="ann-quill">
                    <ReactQuill theme="snow" value={bForm.description} onChange={v => setBForm(f => ({ ...f, description: v }))} placeholder="Write achievement details…" modules={QUILL_MODULES} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={resetForm} disabled={saving}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Saving…</> : editId ? 'Save Changes' : `Publish ${noun}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal show={!!toDelete} onHide={() => !deleting && setToDelete(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-page">
          <div className="aui-modal-body ann-confirm">
            <span className="ann-confirm-icon"><FaTrash /></span>
            <h3>Delete this {noun.toLowerCase()}?</h3>
            <p><b>{toDelete?.title}</b> will be removed from the student dashboard. This can’t be undone.</p>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><FaSpinner className="aui-spin" /> Deleting…</> : <><FaTrash size={11} /> Delete</>}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .ann-item { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .ann-thumb { width: 64px; height: 40px; flex: 0 0 64px; border: 1px solid #2c3034; border-radius: 7px; object-fit: cover; }
        .ann-thumb-empty { display: grid; place-items: center; color: rgba(255,255,255,0.85); font-size: 0.8rem; }
        .ann-item .aui-stack, .ann-text { max-width: 560px; }
        .ann-global { margin-left: 8px; vertical-align: 1px; }
        .ann-pic { object-fit: cover; padding: 0; }
        .aui-table tbody tr.ann-muted .ann-item, .aui-table tbody tr.ann-muted .aui-person, .aui-table tbody tr.ann-muted .ann-text { opacity: 0.55; }

        .ann-switch { align-items: center; gap: 8px; padding: 0; border: 0; background: none; }
        .ann-switch .aui-toggle-track { margin-top: 0; }
        .ann-switch-label { color: #858a90; font-size: 0.74rem; font-weight: 650; }
        .ann-switch-label.is-on { color: #45dd75; }
        .ann-actions { display: inline-flex; gap: 6px; }
        .ann-delete:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }

        .ann-modal { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .ann-first { margin-top: 0; }
        .ann-templates { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .ann-template { display: flex; flex-direction: column; gap: 2px; padding: 6px 6px 9px; border: 1px solid #2c3034; border-radius: 11px; background: #131518; text-align: left; transition: border-color 0.15s, box-shadow 0.15s; }
        .ann-template:hover { border-color: #4a4f55; }
        .ann-template.is-active { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 3px rgba(255,122,0,0.15); }
        .ann-template-preview { position: relative; display: grid; place-items: center; height: 52px; margin-bottom: 6px; border-radius: 7px; }
        .ann-template-preview i { font-size: 0.8rem; font-style: normal; font-weight: 800; }
        .ann-template-check { position: absolute; top: 6px; right: 6px; color: #fff; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5)); }
        .ann-template strong { padding: 0 4px; color: #e5e7eb; font-size: 0.76rem; }
        .ann-template.is-active strong { color: #ffb15e; }
        .ann-template small { padding: 0 4px; color: #6b7280; font-size: 0.68rem; }

        .ann-drop { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 70px; border: 1.5px dashed #3a3f45; border-radius: 10px; background: #111315; color: #ff9a3c; transition: border-color 0.15s, background 0.15s; }
        .ann-drop:hover:not(:disabled) { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); }
        .ann-drop span { display: flex; flex-direction: column; text-align: left; }
        .ann-drop strong { color: #e5e7eb; font-size: 0.82rem; }
        .ann-drop small { color: #6b7280; font-size: 0.7rem; }
        .ann-image { display: flex; align-items: center; gap: 12px; }
        .ann-image img { height: 72px; max-width: 220px; border: 1px solid #2c3034; border-radius: 9px; object-fit: cover; }
        .ann-image img.is-round { width: 72px; border-radius: 50%; }
        .ann-image-actions { display: flex; gap: 8px; }

        .ann-confirm { padding: 1.5rem 1.5rem 1.1rem; text-align: center; }
        .ann-confirm-icon { display: inline-grid; place-items: center; width: 48px; height: 48px; margin-bottom: 0.75rem; border: 1px solid rgba(251,95,103,0.3); border-radius: 14px; background: rgba(251,95,103,0.12); color: #fb737a; font-size: 1.05rem; }
        .ann-confirm h3 { margin: 0 0 0.4rem; color: #fff; font-size: 1.05rem; font-weight: 750; }
        .ann-confirm p { margin: 0; color: #9aa0a6; font-size: 0.82rem; line-height: 1.5; }
        .ann-confirm p b { color: #e5e7eb; }

        @media (max-width: 767.98px) {
          .ann-templates { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </AdminPage>
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

/* Dark-mode overrides for Quill (scoped so they don't affect other pages) */
const QUILL_DARK_CSS = `
  .ann-quill { overflow: hidden; border: 1px solid #34383d; border-radius: 8px; }
  .ann-quill:focus-within { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
  .ann-quill .ql-toolbar { background:#111315; border:none; border-bottom:1px solid #2c3034; }
  .ann-quill .ql-container { background:#17191c; border:none; color:#e5e7eb; min-height:180px; font-size:13px; font-family: inherit; }
  .ann-quill .ql-editor { min-height:180px; }
  .ann-quill .ql-editor.ql-blank::before { color:#5b616a; font-style:normal; }
  .ann-quill .ql-picker-label, .ann-quill .ql-picker-item { color:#ccc; }
  .ann-quill .ql-stroke { stroke:#ccc; }
  .ann-quill .ql-fill { fill:#ccc; }
  .ann-quill button:hover .ql-stroke, .ann-quill .ql-picker-label:hover .ql-stroke { stroke:#ff7a00; }
  .ann-quill button:hover .ql-fill, .ann-quill .ql-picker-label:hover .ql-fill { fill:#ff7a00; }
  .ann-quill .ql-active .ql-stroke { stroke:#ff7a00; }
  .ann-quill .ql-active .ql-fill { fill:#ff7a00; }
  .ann-quill .ql-picker-options { background:#17191c; border:1px solid #34383d; }
  .ann-quill .ql-picker-item:hover { color:#ff7a00; }
`
