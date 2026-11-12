import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Modal } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import CollegeSearch from '@/app/(other)/auth/sign-up/components/CollegeSearch'
import {
  FaTicketAlt, FaPlus, FaEdit, FaTrash, FaCopy, FaCheck, FaTimes, FaSpinner, FaSyncAlt,
  FaCheckCircle, FaExclamationTriangle, FaUniversity, FaGlobe, FaUsers, FaClock,
} from 'react-icons/fa'
import { AdminPage, AdminSelect, EmptyState, PageHeader, ProgressBar, SearchInput, StatCards, TableFooter, type StatItem } from '@/components/admin-ui'

type Coupon = {
  _id: string
  code: string
  college: string
  discountPercent: number
  startDate: string
  endDate: string
  maxUses: number | null
  usedCount: number
  isActive: boolean
  createdAt?: string
}

type CouponForm = {
  code: string
  college: string
  discountPercent: string
  startDate: string
  endDate: string
  maxUses: string
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '',
  college: 'ALL',
  discountPercent: '',
  startDate: '',
  endDate: '',
  maxUses: '',
  isActive: true,
}

const PAGE_SIZE = 10
const DAY = 1000 * 3600 * 24

const toDateInput = (dateStr: string) => (dateStr ? new Date(dateStr).toISOString().split('T')[0] : '')
const formatDate = (dateStr: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const daysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY)
const isExpired = (endDate: string) => new Date(endDate) < new Date()
const isScheduled = (startDate: string) => new Date(startDate) > new Date()

type CouponState = 'live' | 'off' | 'expired' | 'scheduled' | 'used-up'
const stateOf = (c: Coupon): CouponState =>
  isExpired(c.endDate) ? 'expired'
    : !c.isActive ? 'off'
    : c.maxUses != null && c.usedCount >= c.maxUses ? 'used-up'
    : isScheduled(c.startDate) ? 'scheduled'
    : 'live'

const STATE_BADGE: Record<CouponState, { cls: string; label: string }> = {
  live: { cls: 'aui-badge-green', label: 'Live' },
  off: { cls: 'aui-badge-muted', label: 'Paused' },
  expired: { cls: 'aui-badge-red', label: 'Expired' },
  scheduled: { cls: 'aui-badge-blue', label: 'Scheduled' },
  'used-up': { cls: 'aui-badge-amber', label: 'Used up' },
}

const CouponAdmin: React.FC = () => {
  const { user } = useAuthContext()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState<CouponForm>({ ...emptyForm })
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const authHeaders = { headers: { Authorization: `Bearer ${user?.token}` } }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/coupons`, authHeaders)
      setCoupons(Array.isArray(res.data) ? res.data : res.data.coupons || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching coupons:', err)
      setError('Failed to fetch coupons. Please try again later.')
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, []) // eslint-disable-line
  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter])
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(t)
  }, [success])

  const filteredCoupons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return coupons.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q) && !(c.college || '').toLowerCase().includes(q)) return false
      switch (statusFilter) {
        case 'live': return stateOf(c) === 'live'
        case 'off': return stateOf(c) === 'off'
        case 'expired': return stateOf(c) === 'expired'
        case 'universal': return c.college === 'ALL'
        case 'specific': return c.college !== 'ALL'
        default: return true
      }
    })
  }, [coupons, searchTerm, statusFilter])

  const handleCollegeSelect = (college: any | null) => {
    setForm((f) => ({ ...f, college: college ? `${college.name}, ${college.address}, ${college.pincode}` : '' }))
  }

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setFormError(null); setShowModal(true) }
  const closeModal = () => { if (saving) return; setShowModal(false); setEditing(null); setForm({ ...emptyForm }) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pct = Number(form.discountPercent)
    if (!form.code.trim()) { setFormError('Enter a coupon code.'); return }
    if (!pct || pct < 1 || pct > 100) { setFormError('Discount must be between 1 and 100%.'); return }
    if (!form.startDate || !form.endDate) { setFormError('Choose the start and end dates.'); return }
    if (form.endDate < form.startDate) { setFormError('The end date must be on or after the start date.'); return }
    if (form.college !== 'ALL' && !form.college) { setFormError('Pick the college, or make the coupon valid for all colleges.'); return }

    try {
      setSaving(true)
      setFormError(null)
      const payload = {
        code: form.code.trim().toUpperCase(),
        college: form.college || 'ALL',
        discountPercent: pct,
        startDate: form.startDate,
        endDate: form.endDate,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
      }

      if (editing) {
        await axios.put(`${baseURL}/api/coupons/${editing._id}`, payload, authHeaders)
        setSuccess(`Coupon ${payload.code} was updated.`)
      } else {
        await axios.post(`${baseURL}/api/coupons`, payload, authHeaders)
        setSuccess(`Coupon ${payload.code} was created.`)
      }

      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
      fetchCoupons()
    } catch (err: any) {
      console.error('Error saving coupon:', err)
      setFormError(err?.response?.data?.error || 'Failed to save the coupon. Please check the details.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    try {
      setDeleting(true)
      await axios.delete(`${baseURL}/api/coupons/${coupon._id}`, authHeaders)
      setSuccess(`Coupon ${coupon.code} was deleted.`)
      fetchCoupons()
    } catch (err) {
      console.error('Error deleting coupon:', err)
      setError('Failed to delete the coupon. Please try again later.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      college: coupon.college,
      discountPercent: String(coupon.discountPercent),
      startDate: toDateInput(coupon.startDate),
      endDate: toDateInput(coupon.endDate),
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon._id)
    try {
      await axios.put(`${baseURL}/api/coupons/${coupon._id}`, { isActive: !coupon.isActive }, authHeaders)
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c)))
    } catch (err) {
      console.error('Error toggling coupon:', err)
      setError('Failed to update the coupon status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const pageRows = filteredCoupons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const stats: StatItem[] = [
    { label: 'Coupons', value: coupons.length, icon: FaTicketAlt, tone: 'orange' },
    { label: 'Live now', value: coupons.filter((c) => stateOf(c) === 'live').length, icon: FaCheckCircle, tone: 'green' },
    { label: 'Redemptions', value: coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0), icon: FaUsers, tone: 'blue' },
  ]

  return (
    <AdminPage>
      <PageHeader
        icon={FaTicketAlt}
        title="Coupon Management"
        subtitle="Discount codes students apply at checkout, for every college or just one"
        stats={<StatCards inline items={stats} loading={loading && coupons.length === 0} />}
        actions={
          <>
            <button type="button" className="aui-btn" onClick={fetchCoupons} disabled={loading}>
              <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
            </button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> Create Coupon</button>
          </>
        }
      />

      {success && (
        <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{success}</span>
          <button type="button" className="aui-alert-close" onClick={() => setSuccess(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
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
            <h3>All coupons</h3>
            <p>Search by code or college</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search coupons…" />
            <AdminSelect
              label="Filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All coupons' },
                { value: 'live', label: 'Live now' },
                { value: 'off', label: 'Paused' },
                { value: 'expired', label: 'Expired' },
                { value: 'universal', label: 'All colleges' },
                { value: 'specific', label: 'One college' },
              ]}
            />
            <span className="aui-count">{filteredCoupons.length} coupon{filteredCoupons.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {loading && coupons.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading coupons…</p></div>
        ) : filteredCoupons.length === 0 ? (
          <EmptyState
            icon={FaTicketAlt}
            title={coupons.length ? 'No coupons match' : 'No coupons yet'}
            text={coupons.length ? 'Try a different search or filter.' : 'Create a discount code for all colleges or a single college.'}
            action={coupons.length
              ? <button type="button" className="aui-btn" onClick={() => { setSearchTerm(''); setStatusFilter('') }}>Clear filters</button>
              : <button type="button" className="aui-btn aui-btn-primary" onClick={openCreate}><FaPlus size={11} /> Create Coupon</button>}
          />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Valid for</th>
                    <th className="text-center" style={{ width: 100 }}>Discount</th>
                    <th>Validity</th>
                    <th style={{ width: 170 }}>Usage</th>
                    <th style={{ width: 130 }}>Status</th>
                    <th className="text-end" style={{ width: 96 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((coupon) => {
                    const st = stateOf(coupon)
                    const expired = st === 'expired'
                    const left = daysLeft(coupon.endDate)
                    const pct = coupon.maxUses ? Math.min(100, (coupon.usedCount / coupon.maxUses) * 100) : 0
                    return (
                      <tr key={coupon._id} className={expired ? 'cp-expired' : ''}>
                        <td>
                          <div className="cp-code">
                            <span>{coupon.code}</span>
                            <button type="button" onClick={() => handleCopyCode(coupon.code)} title="Copy code" aria-label="Copy code">
                              {copiedCode === coupon.code ? <FaCheck size={10} className="cp-copied" /> : <FaCopy size={10} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          {coupon.college === 'ALL' ? (
                            <span className="cp-scope"><FaGlobe size={11} /> All colleges</span>
                          ) : (
                            <span className="cp-scope is-one" title={coupon.college}><FaUniversity size={11} /> {coupon.college.split(',')[0]}</span>
                          )}
                        </td>
                        <td className="text-center"><span className="cp-pct">{coupon.discountPercent}%</span></td>
                        <td>
                          <div className="cp-dates">
                            <span>{formatDate(coupon.startDate)} → {formatDate(coupon.endDate)}</span>
                            {expired
                              ? <small className="is-red">Ended {Math.abs(left)} day{Math.abs(left) === 1 ? '' : 's'} ago</small>
                              : st === 'scheduled'
                                ? <small className="is-blue">Starts {formatDate(coupon.startDate)}</small>
                                : left <= 7
                                  ? <small className="is-amber"><FaClock size={9} /> {left <= 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} left`}</small>
                                  : <small>{left} days left</small>}
                          </div>
                        </td>
                        <td>
                          {coupon.maxUses ? (
                            <ProgressBar value={pct} tone={pct >= 100 ? 'amber' : 'orange'} label={`${coupon.usedCount}/${coupon.maxUses}`} />
                          ) : (
                            <span className="cp-unlimited"><b>{coupon.usedCount}</b> used · no limit</span>
                          )}
                        </td>
                        <td>
                          <div className="cp-status">
                            <label className="cp-switch" title={expired ? 'Expired coupons cannot be switched on' : coupon.isActive ? 'Pause this coupon' : 'Switch this coupon on'}>
                              <input type="checkbox" checked={coupon.isActive && !expired} disabled={expired || togglingId === coupon._id} onChange={() => handleToggleActive(coupon)} />
                              <span className="aui-toggle-track" />
                            </label>
                            <span className={`aui-badge ${STATE_BADGE[st].cls}`}>{STATE_BADGE[st].label}</span>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="cp-actions">
                            <button type="button" className="aui-icon-btn" title="Edit coupon" onClick={() => handleEdit(coupon)}><FaEdit /></button>
                            <button type="button" className="aui-icon-btn cp-del" title="Delete coupon" onClick={() => setDeleteTarget(coupon)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter page={currentPage} pageSize={PAGE_SIZE} total={filteredCoupons.length} onPageChange={setCurrentPage} noun="coupons" />
          </>
        )}
      </div>

      {/* ── Create / edit ── */}
      <Modal show={showModal} onHide={closeModal} centered size="lg" backdrop="static" contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <form onSubmit={handleSubmit} className="aui-page">
          <div className="aui-modal-head">
            <span className="aui-heading-icon">{editing ? <FaEdit /> : <FaPlus />}</span>
            <div>
              <h3>{editing ? `Edit ${editing.code}` : 'Create coupon'}</h3>
              <p>{editing ? `Used ${editing.usedCount} time${editing.usedCount === 1 ? '' : 's'} so far` : 'Students enter the code at checkout'}</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={closeModal} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
          </div>

          <div className="aui-modal-body">
            {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}

            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-code">Coupon code</label>
                <input id="cp-code" className="aui-input cp-code-input" placeholder="e.g. EKLAV10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })} />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-pct">Discount</label>
                <div className="cp-suffix">
                  <input id="cp-pct" className="aui-input" type="number" min={1} max={100} placeholder="e.g. 10" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                  <span>% off</span>
                </div>
              </div>
            </div>

            <div className="aui-field">
              <span className="aui-label">Valid for</span>
              <div className="cp-scope-pick">
                <button type="button" className={form.college === 'ALL' ? 'is-on' : ''} onClick={() => setForm({ ...form, college: 'ALL' })}>
                  <FaGlobe /> <span><b>All colleges</b><small>Any student can use it</small></span>
                </button>
                <button type="button" className={form.college !== 'ALL' ? 'is-on' : ''} onClick={() => form.college === 'ALL' && setForm({ ...form, college: '' })}>
                  <FaUniversity /> <span><b>One college</b><small>Only that college's students</small></span>
                </button>
              </div>
              {form.college !== 'ALL' && (
                <div className="cp-college">
                  <CollegeSearch onSelect={handleCollegeSelect} value={form.college} />
                </div>
              )}
            </div>

            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-start">Starts on</label>
                <input id="cp-start" className="aui-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-end">Ends on</label>
                <input id="cp-end" className="aui-input" type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-max">Usage limit <span className="aui-optional">Optional</span></label>
                <input id="cp-max" className="aui-input" type="number" min={1} placeholder="No limit" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                <p className="aui-hint">Leave empty to allow unlimited uses.</p>
              </div>
              <div className="aui-field">
                <span className="aui-label">Status</span>
                <label className="aui-toggle">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span className="aui-toggle-track" />
                  <span>
                    <strong>{form.isActive ? 'Active' : 'Paused'}</strong>
                    <small>{form.isActive ? 'Usable between the dates above' : 'Students cannot use it until switched on'}</small>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={closeModal} disabled={saving}>Cancel</button>
            <button type="submit" className="aui-btn aui-btn-primary" disabled={saving}>
              {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheckCircle size={11} />} {editing ? 'Save changes' : 'Create coupon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete ── */}
      <Modal show={!!deleteTarget} onHide={() => !deleting && setDeleteTarget(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-modal-head">
          <span className="cp-del-icon"><FaTrash /></span>
          <div>
            <h3>Delete coupon {deleteTarget?.code}?</h3>
            <p>Used {deleteTarget?.usedCount ?? 0} time{deleteTarget?.usedCount === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="aui-modal-body"><p className="cp-modal-text">Students will no longer be able to apply this code. To stop it temporarily, pause it instead. This can't be undone.</p></div>
        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-danger" onClick={() => deleteTarget && handleDelete(deleteTarget)} disabled={deleting}>
            {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete coupon
          </button>
        </div>
      </Modal>

      <style>{`
        .cp-expired td { color: #858a90; }
        .cp-code { display: inline-flex; align-items: center; gap: 8px; }
        .cp-code span { color: #fff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86rem; font-weight: 700; letter-spacing: 0.06em; }
        .cp-expired .cp-code span { color: #9da2a8; text-decoration: line-through; text-decoration-color: #4b5056; }
        .cp-code button { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: none; color: #6b7280; cursor: pointer; }
        .cp-code button:hover { background: #1b1e21; color: #fff; }
        .cp-copied { color: #45dd75; }
        .cp-scope { display: inline-flex; align-items: center; gap: 7px; max-width: 280px; overflow: hidden; color: #a6abb0; font-size: 0.8rem; text-overflow: ellipsis; white-space: nowrap; }
        .cp-scope svg { flex: 0 0 auto; color: #60a5fa; }
        .cp-scope.is-one svg { color: #ff9a3c; }
        .cp-scope.is-one { color: #e5e7eb; }
        .cp-pct { color: #ffb15e; font-size: 0.95rem; font-weight: 800; }
        .cp-expired .cp-pct { color: #858a90; }
        .cp-dates { display: flex; flex-direction: column; gap: 2px; font-size: 0.78rem; white-space: nowrap; }
        .cp-dates span { color: #c3c7ca; }
        .cp-dates small { display: inline-flex; align-items: center; gap: 5px; color: #6b7280; font-size: 0.7rem; }
        .cp-dates small.is-red { color: #fb737a; }
        .cp-dates small.is-amber { color: #f4b43f; }
        .cp-dates small.is-blue { color: #60a5fa; }
        .cp-unlimited { color: #858a90; font-size: 0.76rem; }
        .cp-unlimited b { color: #e5e7eb; }
        .cp-status { display: flex; align-items: center; gap: 8px; }
        .cp-switch { position: relative; display: inline-flex; margin: 0; cursor: pointer; }
        .cp-switch input { position: absolute; opacity: 0; pointer-events: none; }
        .cp-switch .aui-toggle-track { margin-top: 0; }
        .cp-switch input:checked + .aui-toggle-track { background: #31c45e; }
        .cp-switch input:checked + .aui-toggle-track::after { background: #fff; transform: translateX(16px); }
        .cp-switch input:disabled + .aui-toggle-track { opacity: 0.4; cursor: not-allowed; }
        .cp-actions { display: inline-flex; gap: 6px; }
        .cp-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .cp-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
        .cp-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }

        .cp-code-input { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; }
        .cp-suffix { position: relative; }
        .cp-suffix .aui-input { padding-right: 3.6rem; }
        .cp-suffix span { position: absolute; top: 50%; right: 0.8rem; transform: translateY(-50%); color: #6b7280; font-size: 0.78rem; pointer-events: none; }
        .cp-scope-pick { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .cp-scope-pick button { display: flex; align-items: center; gap: 12px; padding: 0.7rem 0.9rem; border: 1px solid #2c3034; border-radius: 10px; background: #111315; color: #9da2a8; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .cp-scope-pick button:hover { border-color: #454a50; }
        .cp-scope-pick button.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.07); color: #ff9a3c; }
        .cp-scope-pick span { display: flex; flex-direction: column; }
        .cp-scope-pick b { color: #e5e7eb; font-size: 0.84rem; }
        .cp-scope-pick small { color: #6b7280; font-size: 0.72rem; }
        .cp-college { margin-top: 10px; }
        .cp-college .input-group-text { border-color: #34383d !important; background: #17191c !important; color: #6b7280; }
        .cp-college .form-control { height: 40px; border-color: #34383d !important; background: #17191c !important; color: #f1f5f9 !important; font-size: 0.86rem; }
        .cp-college .form-control::placeholder { color: #5b616a; }
        .cp-college .form-control:focus { box-shadow: none; }
        .cp-college .input-group:focus-within .input-group-text, .cp-college .input-group:focus-within .form-control, .cp-college .input-group:focus-within .btn { border-color: rgba(255,122,0,0.75) !important; }
        .cp-college .btn { border-color: #34383d; background: #17191c; color: #9da2a8; }
        .cp-college .dropdown-menu { border: 1px solid #34383d; border-radius: 10px; background: #17191c; box-shadow: 0 14px 34px rgba(0,0,0,0.55); }
        .cp-college .dropdown-item { color: #e5e7eb; }
        .cp-college .dropdown-item:hover, .cp-college .dropdown-item:focus { background: #23262a; color: #fff; }
        .cp-college .text-muted { color: #6b7280 !important; }
        @media (max-width: 575.98px) { .cp-scope-pick { grid-template-columns: 1fr; } }
      `}</style>
    </AdminPage>
  )
}

export default CouponAdmin
