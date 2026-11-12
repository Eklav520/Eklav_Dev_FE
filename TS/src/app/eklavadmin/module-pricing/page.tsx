import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { FaTag, FaPencilAlt, FaCheck, FaTimes, FaSpinner, FaUsers, FaHourglassHalf, FaSyncAlt, FaExclamationTriangle, FaInfoCircle, FaLayerGroup } from 'react-icons/fa'
import { AdminPage, EmptyState, PageHeader, StatCards, Tabs, initialsOf, type StatItem } from '@/components/admin-ui'

type Plan = '6months' | '12months'
const PLANS: { key: Plan; label: string }[] = [
  { key: '6months', label: '6 Months' },
  { key: '12months', label: '12 Months' },
]

type ModuleInfo = {
  key: string
  label: string
  description: string
  plans: Record<Plan, number>
  enrolledCount?: number
  enrolledByPlan?: Record<Plan, number>
  // Started checkout but never completed it (popup closed, payment failed, etc).
  initiatedCount?: number
  initiatedByPlan?: Record<Plan, number>
}
// `${moduleKey}:${plan}` — each duration is edited/saved independently.
type EditKey = string

type StudentStatus = 'paid' | 'created'

type EnrolledStudent = {
  name: string
  phoneNo: string | null
  email: string
  plan: Plan
  amount: number
  status: StudentStatus
  purchasedAt: string
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

// The price a student sees on the LSRW pattern-selection screen (and every
// other module purchase screen later) is read live from the same
// ModulePricing collection this page writes to — a save here takes effect
// immediately, no deploy needed.
const ModulePricingPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<EditKey | null>(null)
  const [draftRupees, setDraftRupees] = useState('')
  const [draftError, setDraftError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<EditKey | null>(null)

  // Enrolled/initiated-students modal
  const [viewing, setViewing] = useState<{ moduleKey: string; moduleLabel: string; plan: Plan } | null>(null)
  const [viewingStatus, setViewingStatus] = useState<StudentStatus>('paid')
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const load = () => {
    if (!user?.token) return
    setLoading(true)
    setError(null)
    fetch(`${baseURL}/api/eklavadmin/module-pricing`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load')
        setModules(data.modules)
      })
      .catch((e) => setError(e.message || 'Failed to load module pricing'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [user?.token, baseURL]) // eslint-disable-line

  const startEdit = (moduleKey: string, plan: Plan, priceInPaise: number) => {
    setEditingKey(`${moduleKey}:${plan}`)
    setDraftRupees(String(priceInPaise / 100))
    setDraftError('')
  }
  const cancelEdit = () => { setEditingKey(null); setDraftRupees(''); setDraftError('') }

  const save = (moduleKey: string, plan: Plan) => {
    const value = Number(draftRupees)
    if (!user?.token) return
    if (!Number.isFinite(value) || value < 1) { setDraftError('Enter at least ₹1'); return }
    setSaving(true)
    fetch(`${baseURL}/api/eklavadmin/module-pricing/${moduleKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ plan, priceInPaise: Math.round(value * 100) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to save')
        setModules((prev) => prev.map((m) => (m.key === moduleKey ? { ...m, plans: { ...m.plans, [plan]: data.priceInPaise } } : m)))
        const key = `${moduleKey}:${plan}`
        setEditingKey(null)
        setSavedKey(key)
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2500)
      })
      .catch((e) => setDraftError(e.message || 'Failed to save price'))
      .finally(() => setSaving(false))
  }

  const openStudents = (moduleKey: string, moduleLabel: string, plan: Plan, status: StudentStatus) => {
    setViewing({ moduleKey, moduleLabel, plan })
    setViewingStatus(status)
  }
  const closeStudents = () => { setViewing(null); setStudents([]); setStudentsError(null) }

  useEffect(() => {
    if (!viewing || !user?.token) return
    setStudents([])
    setStudentsError(null)
    setStudentsLoading(true)
    fetch(`${baseURL}/api/eklavadmin/module-pricing/${viewing.moduleKey}/enrollments?plan=${viewing.plan}&status=${viewingStatus}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load students')
        setStudents(data.students)
      })
      .catch((e) => setStudentsError(e.message || 'Failed to load students'))
      .finally(() => setStudentsLoading(false))
  }, [viewing, viewingStatus, user?.token, baseURL])

  const byPlan = (m: ModuleInfo, field: 'enrolledByPlan' | 'initiatedByPlan', plan: Plan) => m[field]?.[plan] ?? 0
  const totalEnrolled = modules.reduce((s, m) => s + PLANS.reduce((t, p) => t + byPlan(m, 'enrolledByPlan', p.key), 0), 0)
  const totalInitiated = modules.reduce((s, m) => s + PLANS.reduce((t, p) => t + byPlan(m, 'initiatedByPlan', p.key), 0), 0)
  const stats: StatItem[] = [
    { label: 'Modules', value: modules.length, icon: FaLayerGroup, tone: 'orange' },
    { label: 'Enrolled', value: totalEnrolled, icon: FaUsers, tone: 'green' },
    { label: 'Checkout drop-offs', value: totalInitiated, icon: FaHourglassHalf, tone: 'amber' },
  ]
  const viewingModule = viewing ? modules.find((m) => m.key === viewing.moduleKey) : undefined

  return (
    <AdminPage>
      <PageMetaData title="Module Pricing" />

      <PageHeader
        icon={FaTag}
        title="Module Pricing"
        subtitle="What a student pays to unlock one module on its own, for 6 or 12 months"
        stats={<StatCards inline items={stats} loading={loading && modules.length === 0} />}
        actions={
          <button type="button" className="aui-btn" onClick={load} disabled={loading}>
            <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
          </button>
        }
      />

      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>Prices by module</h3>
            <p><FaInfoCircle size={10} style={{ marginRight: 5, verticalAlign: '-1px' }} />Changes apply to new checkouts immediately. Click a price to edit it.</p>
          </div>
        </div>

        {loading && modules.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading module pricing…</p></div>
        ) : modules.length === 0 ? (
          <EmptyState icon={FaTag} title="No modules to price" text="Modules appear here once they're available for individual purchase." />
        ) : (
          <div className="aui-table-scroll">
            <table className="aui-table mp-table">
              <thead>
                <tr>
                  <th>Module</th>
                  {PLANS.map((p) => <th key={p.key} style={{ width: 190 }}>{p.label}</th>)}
                  <th style={{ width: 190 }}>Enrolled</th>
                  <th style={{ width: 190 }}>Started, not paid</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.key}>
                    <td>
                      <div className="aui-person">
                        <span className="mp-icon"><FaTag size={12} /></span>
                        <div className="aui-stack">
                          <strong>{mod.label}</strong>
                          <small className="mp-desc" title={mod.description}>{mod.description}</small>
                        </div>
                      </div>
                    </td>
                    {PLANS.map(({ key: plan, label }) => {
                      const editKey = `${mod.key}:${plan}`
                      const priceInPaise = mod.plans?.[plan] ?? 0
                      return (
                        <td key={plan}>
                          {editingKey === editKey ? (
                            <div className="mp-edit">
                              <div className={`mp-input${draftError ? ' is-invalid' : ''}`}>
                                <span>₹</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={draftRupees}
                                  onChange={(e) => { setDraftRupees(e.target.value); setDraftError('') }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') save(mod.key, plan); if (e.key === 'Escape') cancelEdit() }}
                                  autoFocus
                                  aria-label={`${mod.label} ${label} price in rupees`}
                                />
                              </div>
                              <button type="button" className="aui-icon-btn mp-ok" onClick={() => save(mod.key, plan)} disabled={saving} title="Save (Enter)">
                                {saving ? <FaSpinner className="aui-spin" size={10} /> : <FaCheck size={10} />}
                              </button>
                              <button type="button" className="aui-icon-btn" onClick={cancelEdit} disabled={saving} title="Cancel (Esc)"><FaTimes size={10} /></button>
                              {draftError && <small className="mp-err">{draftError}</small>}
                            </div>
                          ) : (
                            <button type="button" className="mp-price" onClick={() => startEdit(mod.key, plan, priceInPaise)} title={`Edit ${label} price`}>
                              <b>{rupees(priceInPaise)}</b>
                              {savedKey === editKey ? <span className="mp-saved"><FaCheck size={9} /> Saved</span> : <FaPencilAlt className="mp-pen" size={10} />}
                            </button>
                          )}
                        </td>
                      )
                    })}
                    {(['paid', 'created'] as const).map((status) => (
                      <td key={status}>
                        <div className="mp-counts">
                          {PLANS.map(({ key: plan, label }) => {
                            const n = byPlan(mod, status === 'paid' ? 'enrolledByPlan' : 'initiatedByPlan', plan)
                            return (
                              <button
                                key={plan}
                                type="button"
                                className={`mp-count${n ? (status === 'paid' ? ' is-green' : ' is-amber') : ''}`}
                                disabled={n === 0}
                                onClick={() => openStudents(mod.key, mod.label, plan, status)}
                                title={n ? `View ${label} students` : `None at ${label}`}
                              >
                                <b>{n}</b> <small>{label.replace(' Months', 'm')}</small>
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Students ── */}
      <Modal show={!!viewing} onHide={closeStudents} size="lg" centered contentClassName="aui-modal" backdropClassName="aui-backdrop" scrollable>
        <div className="aui-modal-head">
          <span className="aui-heading-icon"><FaUsers /></span>
          <div>
            <h3>{viewing?.moduleLabel}</h3>
            <p>{viewingStatus === 'paid' ? 'Students who bought this module' : 'Students who started checkout but did not pay'}</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={closeStudents} aria-label="Close"><FaTimes size={12} /></button>
        </div>
        <div className="aui-page mp-modal-bar">
          <Tabs<StudentStatus>
            small
            value={viewingStatus}
            onChange={setViewingStatus}
            label="Status"
            items={[
              { value: 'paid', label: 'Enrolled', icon: FaUsers, count: viewingModule && viewing ? byPlan(viewingModule, 'enrolledByPlan', viewing.plan) : undefined },
              { value: 'created', label: 'Started, not paid', icon: FaHourglassHalf, count: viewingModule && viewing ? byPlan(viewingModule, 'initiatedByPlan', viewing.plan) : undefined },
            ]}
          />
          <Tabs<Plan>
            small
            value={viewing?.plan ?? '6months'}
            onChange={(plan) => viewing && setViewing({ ...viewing, plan })}
            label="Plan"
            items={PLANS.map((p) => ({ value: p.key, label: p.label }))}
          />
        </div>
        <div className="aui-modal-body mp-modal-body">
          {studentsLoading ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading students…</p></div>
          ) : studentsError ? (
            <div className="aui-alert"><FaExclamationTriangle /> <span>{studentsError}</span></div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={viewingStatus === 'paid' ? FaUsers : FaHourglassHalf}
              title={viewingStatus === 'paid' ? 'No enrolled students' : 'No drop-offs'}
              text={viewingStatus === 'paid' ? 'Nobody has bought this module at this duration yet.' : 'Everyone who started checkout here completed it.'}
            />
          ) : (
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Student</th>
                    <th>Phone</th>
                    <th className="text-end">Amount</th>
                    <th className="text-end">{viewingStatus === 'paid' ? 'Purchased' : 'Started'}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i}>
                      <td className="aui-num">{i + 1}</td>
                      <td>
                        <div className="aui-person">
                          <span className="aui-avatar">{initialsOf(s.name)}</span>
                          <div className="aui-stack">
                            <strong>{s.name}</strong>
                            <small>{s.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{s.phoneNo || <span className="mp-muted">Not on file</span>}</td>
                      <td className="text-end mp-amount">₹{Number(s.amount).toLocaleString('en-IN')}</td>
                      <td className="text-end mp-muted">{new Date(s.purchasedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .mp-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border-radius: 10px; background: rgba(255,122,0,0.1); color: #ff9a3c; }
        .mp-desc { display: block; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mp-price { display: inline-flex; align-items: center; gap: 10px; padding: 4px 8px; margin-left: -8px; border: 1px solid transparent; border-radius: 8px; background: none; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .mp-price b { color: #fff; font-size: 1rem; font-weight: 800; }
        .mp-pen { color: #4b5056; transition: color 0.15s; }
        .mp-price:hover { border-color: #34383d; background: #17191c; }
        .mp-price:hover .mp-pen { color: #ff9a3c; }
        .mp-saved { display: inline-flex; align-items: center; gap: 4px; color: #45dd75; font-size: 0.72rem; font-weight: 700; }
        .mp-edit { position: relative; display: flex; align-items: center; gap: 6px; }
        .mp-input { display: flex; align-items: center; gap: 4px; width: 110px; height: 32px; padding: 0 0.6rem; border: 1px solid rgba(255,122,0,0.75); border-radius: 8px; background: #17191c; box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
        .mp-input.is-invalid { border-color: rgba(251,95,103,0.7); box-shadow: 0 0 0 3px rgba(251,95,103,0.12); }
        .mp-input span { color: #6b7280; font-size: 0.82rem; }
        .mp-input input::-webkit-outer-spin-button, .mp-input input::-webkit-inner-spin-button { margin: 0; -webkit-appearance: none; }
        .mp-input input { -moz-appearance: textfield; }
        .mp-input input { width: 100%; min-width: 0; padding: 0; border: 0; outline: none; background: none; color: #fff; font-size: 0.9rem; font-weight: 700; color-scheme: dark; }
        .mp-ok { border-color: rgba(49,216,102,0.45) !important; color: #45dd75 !important; }
        .mp-err { position: absolute; top: 100%; left: 0; margin-top: 3px; color: #fb737a; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
        .mp-counts { display: flex; gap: 6px; }
        .mp-count { display: inline-flex; align-items: baseline; gap: 4px; min-width: 64px; padding: 4px 9px; border: 1px solid #25282b; border-radius: 8px; background: #111315; color: #6b7280; cursor: pointer; transition: border-color 0.15s; }
        .mp-count b { color: #4b5056; font-size: 0.9rem; }
        .mp-count small { font-size: 0.68rem; }
        .mp-count:disabled { cursor: default; opacity: 0.7; }
        .mp-count.is-green b { color: #45dd75; }
        .mp-count.is-amber b { color: #f4b43f; }
        .mp-count:not(:disabled):hover { border-color: #454a50; }
        .mp-modal-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 0.7rem 1.25rem; border-bottom: 1px solid #25282b; }
        .mp-modal-body { padding: 0 !important; }
        .mp-modal-body .aui-alert { margin: 1rem 1.25rem !important; }
        .mp-amount { color: #fff; font-weight: 700; }
        .mp-muted { color: #858a90 !important; font-size: 0.78rem; }
      `}</style>
    </AdminPage>
  )
}

export default ModulePricingPage
