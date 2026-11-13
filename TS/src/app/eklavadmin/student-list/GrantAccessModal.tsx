import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaInfinity, FaSpinner, FaTimes, FaUserCheck } from 'react-icons/fa'

/* Approve a student from the dashboard and set how long they can use the app.
   The backend writes the same fields a purchase does, so the plan expires on its own. */

export type GrantAccess = {
  userStatus: string | null
  plan: string | null
  startDate: string | null
  endDate: string | null
  source?: string | null
  grantedAt?: string | null
  note?: string | null
  modules: { moduleKey: string; plan: string | null; source: string | null; endDate: string | null }[]
}

type Plan = '6months' | '12months' | 'custom' | 'unlimited'

const fmt = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const PLANS: { key: Plan; title: string; hint: string; icon: typeof FaCalendarAlt }[] = [
  { key: '6months', title: '6 months', hint: 'Same as the 6-month purchase', icon: FaCalendarAlt },
  { key: '12months', title: '12 months', hint: 'Same as the 12-month purchase', icon: FaCalendarAlt },
  { key: 'custom', title: 'Custom end date', hint: 'Pick the last day of access', icon: FaCalendarAlt },
  { key: 'unlimited', title: 'No end date', hint: 'Stays approved until changed', icon: FaInfinity },
]

const GrantAccessModal = ({ student, show, onHide, onDone, baseURL, token }: {
  student: { _id: string; fullName: string; email: string; status?: string; access?: GrantAccess | null } | null
  show: boolean
  onHide: () => void
  onDone: (result: { status: string; access: GrantAccess }) => void
  baseURL: string
  token?: string
}) => {
  const [plan, setPlan] = useState<Plan>('6months')
  const [customEnd, setCustomEnd] = useState('')
  const [extend, setExtend] = useState(true)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show) return
    setPlan('6months'); setCustomEnd(''); setExtend(true); setNote(''); setError('')
  }, [show, student?._id])

  const currentEnd = student?.access?.endDate ? new Date(student.access.endDate) : null
  const activeNow = !!currentEnd && currentEnd > new Date()

  /* Preview of the end date the backend will set (same rule: renewals add on top of the remaining time) */
  const preview = useMemo(() => {
    if (plan === 'unlimited') return null
    if (plan === 'custom') return customEnd ? new Date(`${customEnd}T00:00:00`) : null
    const base = extend && activeNow ? new Date(currentEnd!) : new Date()
    base.setMonth(base.getMonth() + (plan === '12months' ? 12 : 6))
    return base
  }, [plan, customEnd, extend, activeNow, currentEnd])

  const daysLeft = preview ? Math.ceil((preview.getTime() - Date.now()) / 86400000) : null
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)

  const submit = async () => {
    if (!student) return
    if (plan === 'custom' && !customEnd) { setError('Pick the last day of access.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin/${student._id}/approve-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, endDate: plan === 'custom' ? customEnd : undefined, extend, note: note.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not approve this student.')
      onDone({ status: data.status, access: data.access })
    } catch (e: any) {
      setError(e?.message || 'Could not approve this student.')
    } finally {
      setSaving(false)
    }
  }

  const status = student?.status || 'pending'
  const isRenewal = status === 'approved' && activeNow

  return (
    <Modal show={show} onHide={() => !saving && onHide()} centered size="lg" contentClassName="aui-modal" backdropClassName="aui-backdrop">
      <div className="aui-page">
        <div className="aui-modal-head">
          <span className="aui-heading-icon"><FaUserCheck /></span>
          <div>
            <h3>{isRenewal ? 'Extend access' : 'Approve student'}</h3>
            <p>{student?.fullName} · {student?.email}</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={onHide} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="aui-modal-body ga-body">
          {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span></div>}

          <div className="ga-current">
            <div><small>Status now</small><b className={`is-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</b></div>
            <div>
              <small>Current access</small>
              <b>
                {currentEnd
                  ? (activeNow ? `Until ${fmt(currentEnd)}` : `Expired ${fmt(currentEnd)}`)
                  : status === 'approved' ? 'No end date' : 'No plan'}
              </b>
            </div>
            {student?.access?.source && <div><small>Last granted by</small><b>{student.access.source === 'admin' ? 'Admin' : 'Payment'}</b></div>}
          </div>

          <div className="aui-section-label">Access plan</div>
          <div className="ga-plans">
            {PLANS.map((p) => (
              <button key={p.key} type="button" className={`ga-plan${plan === p.key ? ' is-on' : ''}`} onClick={() => setPlan(p.key)}>
                <span className="ga-plan-icon"><p.icon /></span>
                <span><b>{p.title}</b><small>{p.hint}</small></span>
                {plan === p.key && <FaCheckCircle className="ga-plan-check" />}
              </button>
            ))}
          </div>

          {plan === 'custom' && (
            <div className="aui-field ga-date">
              <label className="aui-label" htmlFor="ga-end">Last day of access</label>
              <input id="ga-end" type="date" className="aui-input" min={isoDay(tomorrow)} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          )}

          {(plan === '6months' || plan === '12months') && activeNow && (
            <label className="aui-toggle ga-extend">
              <input type="checkbox" checked={extend} onChange={(e) => setExtend(e.target.checked)} />
              <span className="aui-toggle-track" />
              <span>
                <strong>Add on top of the remaining time</strong>
                <small>{extend ? `Starts after the current end date (${fmt(currentEnd!)})` : 'Starts today; the remaining time is replaced'}</small>
              </span>
            </label>
          )}

          <div className={`ga-result${plan === 'unlimited' ? ' is-unlimited' : ''}`}>
            <FaCalendarAlt />
            <span>
              {plan === 'unlimited'
                ? <>Approved with <b>no end date</b>. It stays approved until someone changes it.</>
                : preview
                  ? <>Access until <b>{fmt(preview)}</b>{daysLeft != null && daysLeft > 0 ? <> · {daysLeft} days from today</> : null}. After that the student moves back to <b>Pending</b> automatically.</>
                  : <>Pick an end date to see when access stops.</>}
            </span>
          </div>

          <div className="aui-field" style={{ marginBottom: 0 }}>
            <label className="aui-label" htmlFor="ga-note">Note <span className="aui-optional">Optional</span></label>
            <textarea id="ga-note" className="aui-input ga-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid offline, scholarship, college partnership" />
          </div>
        </div>

        <div className="aui-modal-foot">
          <span className="ga-foot-note">No payment record is created for manual approvals.</span>
          <button type="button" className="aui-btn" onClick={onHide} disabled={saving}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-primary" onClick={submit} disabled={saving}>
            {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaUserCheck size={11} />} {isRenewal ? 'Extend access' : 'Approve'}
          </button>
        </div>
      </div>

      <style>{`
        .ga-body { display: flex; flex-direction: column; gap: 0.9rem; }
        .ga-current { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .ga-current > div { display: flex; flex-direction: column; gap: 2px; padding: 0.6rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .ga-current small { color: #6b7280; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .ga-current b { color: #e5e7eb; font-size: 0.86rem; }
        .ga-current b.is-approved { color: #45dd75; } .ga-current b.is-pending { color: #f4b43f; } .ga-current b.is-rejected { color: #fb737a; }
        .ga-body .aui-section-label { margin: 0.2rem 0 -0.3rem; }
        .ga-plans { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .ga-plan { position: relative; display: flex; align-items: center; gap: 12px; padding: 0.75rem 0.9rem; border: 1px solid #2c3034; border-radius: 10px; background: #111315; color: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .ga-plan:hover { border-color: #454a50; }
        .ga-plan.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.07); }
        .ga-plan-icon { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 9px; background: #1b1e21; color: #9da2a8; }
        .ga-plan.is-on .ga-plan-icon { background: rgba(255,122,0,0.15); color: #ff9a3c; }
        .ga-plan span:not(.ga-plan-icon) { display: flex; flex-direction: column; }
        .ga-plan b { color: #e5e7eb; font-size: 0.86rem; }
        .ga-plan small { color: #6b7280; font-size: 0.72rem; }
        .ga-plan-check { position: absolute; top: 10px; right: 10px; color: #ff9a3c; }
        .ga-date { max-width: 260px; margin-bottom: 0; }
        .ga-extend { margin: 0; }
        .ga-result { display: flex; align-items: flex-start; gap: 10px; padding: 0.75rem 0.9rem; border: 1px solid rgba(49,216,102,0.3); border-radius: 10px; background: rgba(49,216,102,0.06); color: #c7f0d4; font-size: 0.82rem; line-height: 1.5; }
        .ga-result svg { flex: 0 0 auto; margin-top: 3px; color: #45dd75; }
        .ga-result b { color: #fff; }
        .ga-result.is-unlimited { border-color: rgba(56,189,248,0.3); background: rgba(56,189,248,0.06); color: #cfe9f7; }
        .ga-result.is-unlimited svg { color: #7dd3fc; }
        .ga-note { height: auto; padding: 0.55rem 0.8rem; resize: vertical; }
        .ga-foot-note { margin-right: auto; color: #6b7280; font-size: 0.72rem; }
        @media (max-width: 575.98px) { .ga-plans, .ga-current { grid-template-columns: 1fr; } }
      `}</style>
    </Modal>
  )
}

export default GrantAccessModal
