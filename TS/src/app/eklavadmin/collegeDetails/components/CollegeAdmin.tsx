import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Modal } from 'react-bootstrap'
import { FaCheckCircle, FaCloudUploadAlt, FaEdit, FaExclamationTriangle, FaImage, FaMapMarkerAlt, FaPlus, FaSpinner, FaSyncAlt, FaTimes, FaTrash, FaUniversity } from 'react-icons/fa'
import { AdminPage, AdminSelect, EmptyState, PageHeader, SearchInput, StatCards, TableFooter, initialsOf, type StatItem } from '@/components/admin-ui'

type College = {
  _id: string
  name: string
  address: string
  pincode: string
  logo?: string
}

type FormState = { name: string; address: string; pincode: string; logo: File | null }
const EMPTY_FORM: FormState = { name: '', address: '', pincode: '', logo: null }
const PAGE_SIZE = 10

const CollegeLogo = ({ src, name, size = 40 }: { src?: string; name: string; size?: number }) => {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return (
    <span className="cda-logo" style={{ width: size, height: size, flexBasis: size }}>
      {src && !failed ? <img src={src} alt={name} onError={() => setFailed(true)} /> : <span>{initialsOf(name)}</span>}
    </span>
  )
}

/* Logo picker: shows the saved logo until a new file is chosen; the new file can be undone */
const LogoUpload: React.FC<{ currentLogo?: string; name: string; file: File | null; onFileSelect: (file: File | null) => void }> = ({ currentLogo, name, file, onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f?: File) => { if (f && f.type.startsWith('image/')) onFileSelect(f) }
  const shown = preview || currentLogo

  return (
    <div
      className={`cda-drop${dragActive ? ' is-drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); pick(e.dataTransfer.files?.[0]) }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      {shown ? <CollegeLogo src={shown} name={name || 'College'} size={64} /> : <span className="cda-drop-icon"><FaImage /></span>}
      <div className="aui-stack">
        <strong>{file ? file.name : currentLogo ? 'Current logo' : 'Drop a logo here'}</strong>
        <small>{file ? `${(file.size / 1024).toFixed(0)} KB · saved when you click Save` : 'PNG or JPG, square works best (max 2 MB)'}</small>
      </div>
      <div className="cda-drop-btns">
        <button type="button" className="aui-btn aui-btn-sm" onClick={() => inputRef.current?.click()}>
          <FaCloudUploadAlt size={11} /> {shown ? 'Replace' : 'Browse'}
        </button>
        {file && <button type="button" className="aui-icon-btn" title="Undo new logo" onClick={() => onFileSelect(null)}><FaTimes size={11} /></button>}
      </div>
    </div>
  )
}

const CollegeAdmin: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState<College | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState('az')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<College | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const fetchColleges = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/colleges`)
      const data = Array.isArray(res.data) ? res.data : res.data.colleges || []
      setColleges(data)
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching colleges:', err)
      setError('Failed to fetch the college list. Please try again later.')
      setColleges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchColleges() }, []) // eslint-disable-line
  useEffect(() => setCurrentPage(1), [searchTerm, sort])
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(t)
  }, [successMessage])

  const filteredColleges = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const rows = q
      ? colleges.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.address || '').toLowerCase().includes(q) || (c.pincode || '').includes(q))
      : colleges
    return [...rows].sort((a, b) => (sort === 'za' ? -1 : 1) * (a.name || '').localeCompare(b.name || ''))
  }, [colleges, searchTerm, sort])

  const stats: StatItem[] = [
    { label: 'Colleges', value: colleges.length, icon: FaUniversity, tone: 'orange' },
    { label: 'Missing logo', value: colleges.filter((c) => !c.logo).length, icon: FaImage, tone: 'amber' },
  ]

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setShowModal(true) }

  const handleEdit = (college: College) => {
    setEditing(college)
    setForm({ name: college.name, address: college.address, pincode: college.pincode, logo: null })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => { if (saving) return; setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.pincode.trim()) { setFormError('Fill in the name, address and pincode.'); return }
    try {
      setSaving(true)
      setFormError(null)
      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('address', form.address.trim())
      data.append('pincode', form.pincode.trim())
      if (form.logo) data.append('logo', form.logo)

      if (editing) {
        await axios.put(`${baseURL}/api/colleges/${editing._id}`, data)
        setSuccessMessage(`"${form.name.trim()}" was updated.`)
      } else {
        await axios.post(`${baseURL}/api/colleges`, data)
        setSuccessMessage(`"${form.name.trim()}" was added.`)
      }

      setShowModal(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      fetchColleges()
    } catch (err) {
      console.error('❌ Error saving college:', err)
      setFormError('Failed to save the college. Please check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (college: College) => {
    try {
      setDeleting(true)
      await axios.delete(`${baseURL}/api/colleges/${college._id}`)
      setSuccessMessage(`"${college.name}" was deleted.`)
      setShowDeleteConfirm(null)
      fetchColleges()
    } catch (err) {
      console.error('❌ Error deleting college:', err)
      setError('Failed to delete the college. Please try again later.')
      setShowDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  const pageRows = filteredColleges.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <AdminPage>
      <PageHeader
        icon={FaUniversity}
        title="College Details"
        subtitle="Colleges students can choose from when they sign up"
        stats={<StatCards inline items={stats} loading={loading && colleges.length === 0} />}
        actions={
          <>
            <button type="button" className="aui-btn" onClick={fetchColleges} disabled={loading}>
              <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
            </button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={openAdd}><FaPlus size={11} /> Add College</button>
          </>
        }
      />

      {successMessage && (
        <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{successMessage}</span>
          <button type="button" className="aui-alert-close" onClick={() => setSuccessMessage(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>All colleges</h3>
            <p>Search by name, address or pincode</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search colleges…" />
            <AdminSelect label="Sort" prefix="Sort:" value={sort} onChange={setSort} options={[{ value: 'az', label: 'Name A–Z' }, { value: 'za', label: 'Name Z–A' }]} />
            <span className="aui-count">{filteredColleges.length} college{filteredColleges.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {loading && colleges.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading colleges…</p></div>
        ) : filteredColleges.length === 0 ? (
          <EmptyState
            icon={FaUniversity}
            title={searchTerm ? 'No colleges match' : 'No colleges yet'}
            text={searchTerm ? 'Try a different name, address or pincode.' : 'Add the first college so students can pick it at sign-up.'}
            action={searchTerm
              ? <button type="button" className="aui-btn" onClick={() => setSearchTerm('')}>Clear search</button>
              : <button type="button" className="aui-btn aui-btn-primary" onClick={openAdd}><FaPlus size={11} /> Add College</button>}
          />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}>#</th>
                    <th>College</th>
                    <th>Address</th>
                    <th style={{ width: 120 }}>Pincode</th>
                    <th className="text-end" style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((college, i) => (
                    <tr key={college._id}>
                      <td className="aui-num">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div className="aui-person">
                          <CollegeLogo src={college.logo} name={college.name} />
                          <div className="aui-stack">
                            <strong>{college.name}</strong>
                            {!college.logo && <small className="cda-nologo">No logo</small>}
                          </div>
                        </div>
                      </td>
                      <td><span className="cda-address"><FaMapMarkerAlt size={11} /> {college.address || '—'}</span></td>
                      <td><span className="cda-pin">{college.pincode || '—'}</span></td>
                      <td className="text-end">
                        <div className="cda-actions">
                          <button type="button" className="aui-icon-btn" title="Edit" onClick={() => handleEdit(college)}><FaEdit /></button>
                          <button type="button" className="aui-icon-btn cda-del" title="Delete" onClick={() => setShowDeleteConfirm(college)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooter page={currentPage} pageSize={PAGE_SIZE} total={filteredColleges.length} onPageChange={setCurrentPage} noun="colleges" />
          </>
        )}
      </div>

      {/* Add/Edit */}
      <Modal show={showModal} onHide={closeModal} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <form onSubmit={handleSubmit} className="aui-page">
          <div className="aui-modal-head">
            <span className="aui-heading-icon">{editing ? <FaEdit /> : <FaPlus />}</span>
            <div>
              <h3>{editing ? 'Edit college' : 'Add a college'}</h3>
              <p>{editing ? editing.name : 'It appears in the college list at student sign-up'}</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={closeModal} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body">
            {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}
            <div className="aui-field">
              <label className="aui-label" htmlFor="cda-name">College name</label>
              <input id="cda-name" className="aui-input" placeholder="e.g. JNTU College of Engineering" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="aui-field">
              <label className="aui-label" htmlFor="cda-address">Address</label>
              <textarea id="cda-address" className="aui-input cda-textarea" rows={2} placeholder="Street, area, city" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="aui-field">
              <label className="aui-label" htmlFor="cda-pin">Pincode</label>
              <input id="cda-pin" className="aui-input cda-pin-input" inputMode="numeric" maxLength={6} placeholder="e.g. 500085" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div className="aui-field" style={{ marginBottom: 0 }}>
              <span className="aui-label">Logo <span className="aui-optional">Optional</span></span>
              <LogoUpload currentLogo={editing?.logo} name={form.name} file={form.logo} onFileSelect={(file) => setForm((f) => ({ ...f, logo: file }))} />
            </div>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={closeModal} disabled={saving}>Cancel</button>
            <button type="submit" className="aui-btn aui-btn-primary" disabled={saving}>
              {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheckCircle size={11} />} {editing ? 'Save changes' : 'Add college'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal show={!!showDeleteConfirm} onHide={() => !deleting && setShowDeleteConfirm(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-modal-head">
          <span className="cda-del-icon"><FaTrash /></span>
          <div>
            <h3>Delete this college?</h3>
            <p>{showDeleteConfirm?.name}</p>
          </div>
        </div>
        <div className="aui-modal-body"><p className="cda-modal-text">It will no longer appear in the college list at sign-up. This can't be undone.</p></div>
        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-danger" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} disabled={deleting}>
            {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete college
          </button>
        </div>
      </Modal>

      <style>{`
        .cda-logo { display: inline-grid; place-items: center; flex: 0 0 auto; overflow: hidden; border-radius: 10px; background: #fff; }
        .cda-logo img { width: 100%; height: 100%; padding: 3px; object-fit: contain; }
        .cda-logo > span { display: grid; place-items: center; width: 100%; height: 100%; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.78rem; font-weight: 800; }
        .cda-nologo { color: #b8860b !important; }
        .cda-address { display: inline-flex; align-items: flex-start; gap: 6px; max-width: 420px; color: #a6abb0; font-size: 0.8rem; line-height: 1.45; }
        .cda-address svg { flex: 0 0 auto; margin-top: 3px; color: #ff9a3c; }
        .cda-pin { color: #c3c7ca; font-size: 0.8rem; font-variant-numeric: tabular-nums; letter-spacing: 0.03em; }
        .cda-actions { display: inline-flex; gap: 6px; }
        .cda-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .cda-textarea { height: auto; padding: 0.6rem 0.8rem; resize: vertical; }
        .cda-pin-input { max-width: 200px; letter-spacing: 0.06em; }
        .cda-drop { display: flex; align-items: center; gap: 14px; padding: 0.85rem 1rem; border: 1.5px dashed #3a3f45; border-radius: 12px; background: #111315; transition: border-color 0.15s, background 0.15s; }
        .cda-drop.is-drag { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); }
        .cda-drop .aui-stack { flex: 1; min-width: 0; }
        .cda-drop strong { overflow: hidden; color: #e5e7eb; font-size: 0.84rem; text-overflow: ellipsis; white-space: nowrap; }
        .cda-drop small { color: #6b7280; font-size: 0.72rem; }
        .cda-drop-icon { display: grid; place-items: center; width: 64px; height: 64px; flex: 0 0 64px; border: 1px solid rgba(255,122,0,0.25); border-radius: 12px; background: rgba(255,122,0,0.08); color: #ff7a00; font-size: 1.3rem; }
        .cda-drop-btns { display: flex; gap: 6px; }
        .cda-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
        .cda-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }
      `}</style>
    </AdminPage>
  )
}

export default CollegeAdmin
