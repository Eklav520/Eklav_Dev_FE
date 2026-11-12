import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaBuilding, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaLock, FaSpinner, FaTimes, FaUnlock } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { SearchInput, Tabs, EmptyState } from '@/components/admin-ui'

interface Institute {
  _id: string
  name: string
  domain: string
  slug: string
  status: 'active' | 'inactive'
  logo?: string
}

interface Course {
  _id: string
  title: string
  allowedInstitutes?: string[]
}

interface Props {
  show: boolean
  course: Course | null
  onHide: () => void
  onUpdated: (courseId: string, allowedInstitutes: string[]) => void
}

type AccessFilter = 'all' | 'granted' | 'none'

const InstituteAccessModal = ({ show, course, onHide, onUpdated }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [institutes, setInstitutes]     = useState<Institute[]>([])
  const [allowed, setAllowed]           = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(false)
  const [toggling, setToggling]         = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy]         = useState(false)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<AccessFilter>('all')

  useEffect(() => {
    if (!show) return
    setError('')
    setSearch('')
    setFilter('all')

    // Seed current allowed list from course prop
    setAllowed(new Set(course?.allowedInstitutes ?? []))

    setLoading(true)
    fetch(`${baseURL}/api/institute/institutes`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setInstitutes(data.institutes || [])
      })
      .catch(() => setError('Failed to load institutes'))
      .finally(() => setLoading(false))
  }, [show, course?._id])

  // One grant/revoke call — same endpoint as before
  const setAccess = async (institute: Institute, grant: boolean) => {
    if (!course) return
    setToggling(prev => new Set(prev).add(institute._id))
    try {
      const res = await fetch(`${baseURL}/courses/${course._id}/institute-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ action: grant ? 'grant' : 'revoke', instituteId: institute._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')

      setAllowed(new Set(data.allowedInstitutes as string[]))
      onUpdated(course._id, data.allowedInstitutes)
    } catch (err: any) {
      setError(`${institute.name}: ${err.message || 'Something went wrong'}`)
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(institute._id); return next })
    }
  }

  const q = search.trim().toLowerCase()
  const searched = institutes.filter((i) => !q || i.name.toLowerCase().includes(q) || i.domain.toLowerCase().includes(q))
  const shown = searched.filter((i) =>
    filter === 'all' ? true : filter === 'granted' ? allowed.has(i._id) : !allowed.has(i._id))

  const grantedTotal = institutes.filter((i) => allowed.has(i._id)).length

  // Bulk: one call per institute that needs to change, in order
  const setAccessForShown = async (grant: boolean) => {
    const targets = shown.filter((i) => allowed.has(i._id) !== grant)
    if (!targets.length) return
    setBulkBusy(true)
    setError('')
    for (const inst of targets) await setAccess(inst, grant)
    setBulkBusy(false)
  }
  const canGrantShown = shown.some((i) => !allowed.has(i._id))
  const canRevokeShown = shown.some((i) => allowed.has(i._id))

  return (
    <Modal show={show} onHide={() => !bulkBusy && onHide()} size="lg" centered scrollable contentClassName="aui-modal" backdropClassName="aui-backdrop">
      <div className="aui-page iam">
        <div className="aui-modal-head">
          <span className="aui-heading-icon"><FaBuilding /></span>
          <div>
            <h3>Institute Access</h3>
            <p>{course?.title}</p>
          </div>
          <span className={`aui-badge ${grantedTotal ? 'aui-badge-green' : 'aui-badge-muted'}`}>
            {grantedTotal} / {institutes.length} granted
          </span>
          <button type="button" className="aui-icon-btn" onClick={onHide} disabled={bulkBusy} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="iam-toolbar">
          <p className="iam-note"><FaInfoCircle /> Students of granted institutes can <b>see and enroll</b> in this course from their portal. Changes save instantly.</p>
          <div className="iam-controls">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or domain…" />
            <Tabs<AccessFilter>
              small
              label="Access filter"
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: 'All', count: searched.length },
                { value: 'granted', label: 'Granted', count: searched.filter((i) => allowed.has(i._id)).length },
                { value: 'none', label: 'No access', count: searched.filter((i) => !allowed.has(i._id)).length },
              ]}
            />
          </div>
        </div>

        <div className="aui-modal-body iam-body">
          {error && (
            <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
              <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
            </div>
          )}

          {loading ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading institutes…</div>
          ) : shown.length === 0 ? (
            <EmptyState
              icon={FaBuilding}
              title={institutes.length ? 'No institutes match' : 'No institutes yet'}
              text={institutes.length ? 'Try a different search or filter.' : 'Add institutes first, then share courses with them.'}
            />
          ) : (
            <div className="iam-list">
              {shown.map((inst) => {
                const isGranted = allowed.has(inst._id)
                const busy = toggling.has(inst._id)
                return (
                  <div key={inst._id} className={`iam-row${isGranted ? ' is-granted' : ''}`}>
                    <span className="iam-logo">
                      {inst.logo ? <img src={inst.logo} alt="" /> : inst.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="aui-stack iam-name">
                      <strong>{inst.name}</strong>
                      <small>{inst.domain}</small>
                    </div>
                    <span className={`aui-badge aui-badge-dot ${inst.status === 'active' ? 'aui-badge-green' : 'aui-badge-muted'}`}>
                      {inst.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <label className="aui-toggle iam-switch" title={isGranted ? 'Revoke access' : 'Grant access'}>
                      <input type="checkbox" checked={isGranted} disabled={busy || bulkBusy} onChange={() => setAccess(inst, !isGranted)} aria-label={`${isGranted ? 'Revoke' : 'Grant'} access for ${inst.name}`} />
                      <span className="aui-toggle-track" />
                      <span className={`iam-state${isGranted ? ' is-on' : ''}`}>
                        {busy ? <FaSpinner className="aui-spin" /> : isGranted ? <FaUnlock /> : <FaLock />}
                        {isGranted ? 'Granted' : 'No access'}
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="aui-modal-foot iam-foot">
          <div className="iam-bulk">
            <button type="button" className="aui-btn aui-btn-sm" onClick={() => setAccessForShown(true)} disabled={bulkBusy || loading || !canGrantShown}>
              <FaUnlock size={10} /> Grant all shown
            </button>
            <button type="button" className="aui-btn aui-btn-sm" onClick={() => setAccessForShown(false)} disabled={bulkBusy || loading || !canRevokeShown}>
              <FaLock size={10} /> Revoke all shown
            </button>
            {bulkBusy && <span className="aui-hint"><FaSpinner className="aui-spin" /> Updating…</span>}
          </div>
          <button type="button" className="aui-btn aui-btn-primary" onClick={onHide} disabled={bulkBusy}>
            <FaCheckCircle size={11} /> Done
          </button>
        </div>
      </div>

      <style>{`
        .iam { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .iam .aui-modal-head > .aui-badge { flex-shrink: 0; }
        .iam-toolbar { padding: 0.9rem 1.25rem 0.75rem; border-bottom: 1px solid #25282b; }
        .iam-note { display: flex; align-items: flex-start; gap: 8px; margin: 0 0 0.75rem; color: #a6abb0; font-size: 0.78rem; line-height: 1.5; }
        .iam-note svg { flex: 0 0 auto; margin-top: 3px; color: #ff9a3c; }
        .iam-note b { color: #eceef0; }
        .iam-controls { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
        .iam-controls .aui-search { flex: 1 1 220px; width: auto; }
        .iam-body { padding: 0.75rem 1.25rem 1rem; }
        .iam-body .aui-alert { margin-bottom: 0.75rem; }
        .iam-list { display: flex; flex-direction: column; overflow: hidden; border: 1px solid #25282b; border-radius: 12px; }
        .iam-row { display: flex; align-items: center; gap: 12px; padding: 0.7rem 0.9rem; border-bottom: 1px solid #202326; transition: background 0.15s; }
        .iam-row:last-child { border-bottom: 0; }
        .iam-row:hover { background: #15171a; }
        .iam-row.is-granted { background: rgba(49, 216, 102, 0.05); }
        .iam-logo { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; overflow: hidden; border: 1px solid #2c3034; border-radius: 10px; background: #1b1e21; color: #ff9a3c; font-size: 0.78rem; font-weight: 800; }
        .iam-logo img { width: 100%; height: 100%; object-fit: cover; }
        .iam-name { flex: 1; }
        .iam-switch { align-items: center; gap: 10px; width: 138px; flex: 0 0 138px; padding: 0; border: 0; background: none; }
        .iam-switch .aui-toggle-track { margin-top: 0; }
        .iam-state { display: inline-flex; align-items: center; gap: 5px; color: #858a90; font-size: 0.74rem; font-weight: 650; }
        .iam-state.is-on { color: #45dd75; }
        .iam-foot { justify-content: space-between; }
        .iam-bulk { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .iam-bulk .aui-hint { display: inline-flex; align-items: center; gap: 6px; }
        @media (max-width: 575.98px) {
          .iam-row { flex-wrap: wrap; }
          .iam-switch { width: auto; flex: 1 0 100%; padding-left: 50px; }
        }
      `}</style>
    </Modal>
  )
}

export default InstituteAccessModal
