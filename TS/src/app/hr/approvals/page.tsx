import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { FiSearch, FiCalendar, FiBell, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const RECOMMENDATION_COLOR: Record<string, string> = { Shortlist: GREEN, Hire: GREEN, Hold: ORANGE, 'Needs Improvement': ORANGE, 'Not Selected': RED }
const RECOMMENDATION_LABEL: Record<string, string> = { Shortlist: 'Shortlisted', Hire: 'Hire', Hold: 'Hold', 'Needs Improvement': 'Needs Improvement', 'Not Selected': 'Not Selected' }

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

interface Criterion { key: string; label: string; rating: number | null; remarks: string }

interface ApprovalRow {
  _id: string
  interviewId: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  interviewType: string
  scheduledAt: string
  appliedOn: string | null
  technicalRecommendation: string | null
  interviewerName: string
  overallRating: number | null
  criteria: Criterion[]
  recommendation: string
  strengths: string[]
  areasToImprove: string[]
  additionalComments: string
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Hold'
  approvedByName: string
  approvalComments: string
  approvedAt: string | null
  submittedAt: string | null
}

interface OfferRow {
  _id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  expectedCTC: number | null
  offeredCTC: number | null
  offeredByName: string
  offeredOn: string
  status: 'Pending' | 'Approved' | 'RequestChange' | 'Rejected'
}

// The three approval stages a Hiring Manager works through. Technical/HR are
// backed by real interview feedback (split by HRInterview.interviewType).
// Offer is backed by an Offer record, auto-created when the HR round is approved.
type RoundKey = 'Technical' | 'HR' | 'Offer'
type Decision = 'Approved' | 'Rejected' | 'Hold'
type OfferDecision = 'Approved' | 'RequestChange' | 'Rejected'

const ROUND_TABS: { key: RoundKey; label: string }[] = [
  { key: 'Technical', label: 'Technical Approval' },
  { key: 'HR', label: 'HR Approval' },
  { key: 'Offer', label: 'Offer Approval' },
]

const OFFER_DECISION_LABEL: Record<OfferDecision, string> = { Approved: 'Approve', RequestChange: 'Request Change', Rejected: 'Reject' }
const OFFER_DECISION_COLOR: Record<OfferDecision, string> = { Approved: GREEN, RequestChange: BLUE, Rejected: RED }

const PAGE_SIZE = 5

const OfferApprovalTable = ({
  offers, loading, ctcDrafts, setCtcDrafts, onSaveCtc, onDecision,
}: {
  offers: OfferRow[]
  loading: boolean
  ctcDrafts: Record<string, { expectedCTC: string; offeredCTC: string }>
  setCtcDrafts: Dispatch<SetStateAction<Record<string, { expectedCTC: string; offeredCTC: string }>>>
  onSaveCtc: (offerId: string) => void
  onDecision: (offer: OfferRow, decision: OfferDecision) => void
}) => {
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [offers.length])

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  const pageRows = offers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const numberInput = { border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: '#334155', colorScheme: 'light' as const, height: 28, width: 70, fontSize: '0.76rem', padding: '0 6px' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Candidate', 'Job Title', 'Expected CTC (LPA)', 'Offered CTC (LPA)', 'Offered By', 'Offered On', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 10px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && pageRows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Nothing here.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
            )}
            {!loading && pageRows.map(offer => {
              const [fg, bg] = avatarColor(offer.candidateName)
              const draft = ctcDrafts[offer._id] || { expectedCTC: '', offeredCTC: '' }
              return (
                <tr key={offer._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(offer.candidateName)}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.candidateName}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.jobTitle || '—'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <input
                      type="number" step="0.1" value={draft.expectedCTC}
                      onChange={e => setCtcDrafts(prev => ({ ...prev, [offer._id]: { ...draft, expectedCTC: e.target.value } }))}
                      onBlur={() => onSaveCtc(offer._id)}
                      style={numberInput}
                    />
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <input
                      type="number" step="0.1" value={draft.offeredCTC}
                      onChange={e => setCtcDrafts(prev => ({ ...prev, [offer._id]: { ...draft, offeredCTC: e.target.value } }))}
                      onBlur={() => onSaveCtc(offer._id)}
                      style={numberInput}
                    />
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: '#334155' }}>{offer.offeredByName || 'HR'}</td>
                  <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#334155', whiteSpace: 'nowrap' }}>{formatDate(offer.offeredOn)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['Approved', 'RequestChange', 'Rejected'] as OfferDecision[]).map(d => (
                        <button
                          key={d}
                          onClick={() => onDecision(offer, d)}
                          style={{
                            height: 26, padding: '0 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            border: `1px solid ${OFFER_DECISION_COLOR[d]}55`, background: `${OFFER_DECISION_COLOR[d]}1a`, color: OFFER_DECISION_COLOR[d],
                          }}
                        >
                          {OFFER_DECISION_LABEL[d]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
        <span style={{ fontSize: '0.76rem', color: GRAY }}>
          {offers.length === 0 ? 'Showing 0 entries' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, offers.length)} of ${offers.length} entries`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === 1 ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer' }}>
            <FiChevronLeft size={14} />
          </button>
          <span style={{ width: 28, height: 28, borderRadius: 7, background: BLUE, color: '#fff', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{page}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === totalPages ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'default' : 'pointer' }}>
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

const HRApprovalsPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [rows, setRows] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [activeRound, setActiveRound] = useState<RoundKey>('Technical')
  const [page, setPage] = useState(1)
  const [decisionRow, setDecisionRow] = useState<{ row: ApprovalRow; decision: Decision } | null>(null)
  const [feedbackRow, setFeedbackRow] = useState<ApprovalRow | null>(null)
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)

  const [offers, setOffers] = useState<OfferRow[]>([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [ctcDrafts, setCtcDrafts] = useState<Record<string, { expectedCTC: string; offeredCTC: string }>>({})
  const [offerDecisionRow, setOfferDecisionRow] = useState<{ offer: OfferRow; decision: OfferDecision } | null>(null)
  const [offerComments, setOfferComments] = useState('')
  const [offerSaving, setOfferSaving] = useState(false)

  const memberName = (user as any)?.fullName || (user as any)?.name || 'Hiring Manager'
  const memberRole = 'Hiring Manager'

  const load = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/approvals?status=Pending`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load approvals'))))
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoadError('') })
      .catch(e => setLoadError(e.message || 'Failed to load approvals'))
      .finally(() => setLoading(false))
  }

  const loadOffers = () => {
    if (!baseURL || !token) return
    setOffersLoading(true)
    fetch(`${baseURL}/offers?status=Pending`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load offers'))))
      .then(data => {
        const list: OfferRow[] = Array.isArray(data) ? data : []
        setOffers(list)
        setCtcDrafts(prev => {
          const next = { ...prev }
          list.forEach(o => { if (!next[o._id]) next[o._id] = { expectedCTC: o.expectedCTC != null ? String(o.expectedCTC) : '', offeredCTC: o.offeredCTC != null ? String(o.offeredCTC) : '' } })
          return next
        })
        setLoadError('')
      })
      .catch(e => setLoadError(e.message || 'Failed to load offers'))
      .finally(() => setOffersLoading(false))
  }

  useEffect(load, [baseURL, token])
  useEffect(loadOffers, [baseURL, token])
  useEffect(() => { setPage(1) }, [activeRound, search])

  const technicalRows = useMemo(() => rows.filter(r => r.interviewType === 'Technical Interview'), [rows])
  const hrRows = useMemo(() => rows.filter(r => r.interviewType !== 'Technical Interview'), [rows])
  const roundRows: Record<RoundKey, ApprovalRow[]> = { Technical: technicalRows, HR: hrRows, Offer: [] }
  const activeRows = roundRows[activeRound]

  const filtered = useMemo(() => {
    return activeRows.filter(r =>
      !search ||
      r.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
      (r.jobTitle || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [activeRows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const initialsName = initials(memberName)
  const [pfg, pbg] = avatarColor(memberName)

  const openDecision = (row: ApprovalRow, decision: Decision) => {
    setDecisionRow({ row, decision })
    setComments('')
  }

  const submitDecision = async () => {
    if (!decisionRow || !baseURL || !token) return
    setSaving(true)
    try {
      const res = await fetch(`${baseURL}/approvals/${decisionRow.row._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision: decisionRow.decision, comments }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to save decision')
      setDecisionRow(null)
      load()
    } catch (e: any) {
      setLoadError(e.message || 'Failed to save decision')
    } finally {
      setSaving(false)
    }
  }

  const saveCtc = async (offerId: string) => {
    if (!baseURL || !token) return
    const draft = ctcDrafts[offerId]
    if (!draft) return
    try {
      await fetch(`${baseURL}/offers/${offerId}/ctc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ expectedCTC: draft.expectedCTC, offeredCTC: draft.offeredCTC }),
      })
    } catch {
      // best-effort — the field just won't persist if this fails
    }
  }

  const openOfferDecision = (offer: OfferRow, decision: OfferDecision) => {
    setOfferDecisionRow({ offer, decision })
    setOfferComments('')
  }

  const submitOfferDecision = async () => {
    if (!offerDecisionRow || !baseURL || !token) return
    setOfferSaving(true)
    try {
      const res = await fetch(`${baseURL}/offers/${offerDecisionRow.offer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision: offerDecisionRow.decision, comments: offerComments }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to save decision')
      setOfferDecisionRow(null)
      loadOffers()
    } catch (e: any) {
      setLoadError(e.message || 'Failed to save decision')
    } finally {
      setOfferSaving(false)
    }
  }

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }
  const decisionLabel = { Approved: 'Approve', Rejected: 'Reject', Hold: 'Hold' } as Record<Decision, string>
  const decisionColor = { Approved: GREEN, Rejected: RED, Hold: ORANGE } as Record<Decision, string>

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Approvals</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Technical, HR and Offer recommendations awaiting your sign-off.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidate or job..."
              style={{ ...inputBase, paddingLeft: 32, paddingRight: 12, height: 36, width: 240, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 40, border: `1px solid ${BORDER}`, background: '#fff' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: pbg, color: pfg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initialsName}</div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{memberName}</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>{memberRole}</div>
            </div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      {/* Round tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {ROUND_TABS.map(t => {
          const count = t.key === 'Offer' ? offers.length : roundRows[t.key].length
          const active = activeRound === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveRound(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10,
                border: `1px solid ${active ? BLUE : BORDER}`, background: active ? BLUE : '#fff', color: active ? '#fff' : '#334155',
                fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#fff7ed', color: active ? '#fff' : ORANGE, fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {activeRound === 'Offer' ? (
        <OfferApprovalTable
          offers={offers.filter(o => !search || o.candidateName?.toLowerCase().includes(search.toLowerCase()) || (o.jobTitle || '').toLowerCase().includes(search.toLowerCase()))}
          loading={offersLoading}
          ctcDrafts={ctcDrafts}
          setCtcDrafts={setCtcDrafts}
          onSaveCtc={saveCtc}
          onDecision={openOfferDecision}
        />
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '17%' }} />
                <col style={{ width: '15%' }} />
                {activeRound === 'HR' && <col style={{ width: '13%' }} />}
                <col style={{ width: activeRound === 'HR' ? '16%' : '15%' }} />
                <col style={{ width: '13%' }} />
                {activeRound === 'Technical' && <col style={{ width: '12%' }} />}
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {[
                    'Candidate', 'Job Title',
                    ...(activeRound === 'HR' ? ['Tech Interview'] : []),
                    `${activeRound === 'Technical' ? 'Tech' : 'HR'} Interview Feedback`,
                    'Recommendation',
                    ...(activeRound === 'Technical' ? ['Applied On'] : []),
                    'Actions',
                  ].map(h => (
                    <th key={h} style={{ padding: '11px 10px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && pageRows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Nothing here.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
                )}
                {!loading && pageRows.map(row => {
                  const [fg, bg] = avatarColor(row.candidateName)
                  return (
                    <tr key={row._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(row.candidateName)}</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.candidateName}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.jobTitle || '—'}</td>
                      {activeRound === 'HR' && (
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          {row.technicalRecommendation ? (
                            <span style={{ background: `${RECOMMENDATION_COLOR[row.technicalRecommendation] || GRAY}1a`, color: RECOMMENDATION_COLOR[row.technicalRecommendation] || GRAY, fontSize: '0.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                              {['Shortlist', 'Hire'].includes(row.technicalRecommendation) ? 'Recommended' : row.technicalRecommendation}
                            </span>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                        </td>
                      )}
                      <td style={{ padding: '12px 10px' }}>
                        <button onClick={() => setFeedbackRow(row)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 600, color: BLUE, cursor: 'pointer', textDecoration: 'underline' }}>
                          View Feedback
                        </button>
                      </td>
                      <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                        <span style={{ background: `${RECOMMENDATION_COLOR[row.recommendation] || GRAY}1a`, color: RECOMMENDATION_COLOR[row.recommendation] || GRAY, fontSize: '0.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          {RECOMMENDATION_LABEL[row.recommendation] || row.recommendation}
                        </span>
                      </td>
                      {activeRound === 'Technical' && (
                        <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#334155', whiteSpace: 'nowrap' }}>{formatDate(row.appliedOn)}</td>
                      )}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['Approved', 'Hold', 'Rejected'] as Decision[]).map(d => (
                            <button
                              key={d}
                              onClick={() => openDecision(row, d)}
                              style={{
                                height: 26, padding: '0 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                                border: `1px solid ${decisionColor[d]}55`, background: `${decisionColor[d]}1a`, color: decisionColor[d],
                              }}
                            >
                              {decisionLabel[d]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: '0.76rem', color: GRAY }}>
              {filtered.length === 0 ? 'Showing 0 entries' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === 1 ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer' }}>
                <FiChevronLeft size={14} />
              </button>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: BLUE, color: '#fff', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === totalPages ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'default' : 'pointer' }}>
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setFeedbackRow(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 460, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{feedbackRow.candidateName}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: GRAY }}>{feedbackRow.jobTitle} · Interviewed by {feedbackRow.interviewerName || '—'}</p>

            {feedbackRow.criteria?.length > 0 && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {feedbackRow.criteria.map(c => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#334155' }}>{c.label}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.rating != null ? `${c.rating}/5` : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {feedbackRow.strengths?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Strengths</div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>{feedbackRow.strengths.join(', ')}</div>
              </div>
            )}
            {feedbackRow.areasToImprove?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Areas to Improve</div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>{feedbackRow.areasToImprove.join(', ')}</div>
              </div>
            )}
            {feedbackRow.additionalComments && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Comments</div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>{feedbackRow.additionalComments}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setFeedbackRow(null)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {decisionRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => !saving && setDecisionRow(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {decisionLabel[decisionRow.decision]} Recommendation
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: GRAY }}>
              {decisionRow.row.candidateName} — {decisionRow.row.recommendation} recommended by {decisionRow.row.interviewerName || 'interviewer'}
            </p>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Comments (optional)</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder={decisionRow.decision === 'Rejected' ? 'Reason for rejecting…' : 'Any notes for the record…'}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: '0.82rem', color: '#334155', resize: 'vertical', boxSizing: 'border-box', colorScheme: 'light' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setDecisionRow(null)} disabled={saving} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={submitDecision}
                disabled={saving}
                style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: decisionColor[decisionRow.decision], color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : `Confirm ${decisionLabel[decisionRow.decision]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {offerDecisionRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => !offerSaving && setOfferDecisionRow(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {OFFER_DECISION_LABEL[offerDecisionRow.decision]} Offer
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: GRAY }}>
              {offerDecisionRow.offer.candidateName} — {offerDecisionRow.offer.jobTitle}
            </p>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Comments (optional)</label>
            <textarea
              value={offerComments}
              onChange={e => setOfferComments(e.target.value)}
              rows={4}
              placeholder={offerDecisionRow.decision === 'RequestChange' ? 'What needs to change…' : offerDecisionRow.decision === 'Rejected' ? 'Reason for rejecting…' : 'Any notes for the record…'}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: '0.82rem', color: '#334155', resize: 'vertical', boxSizing: 'border-box', colorScheme: 'light' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setOfferDecisionRow(null)} disabled={offerSaving} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={submitOfferDecision}
                disabled={offerSaving}
                style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: OFFER_DECISION_COLOR[offerDecisionRow.decision], color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: offerSaving ? 0.7 : 1 }}
              >
                {offerSaving ? 'Saving…' : `Confirm ${OFFER_DECISION_LABEL[offerDecisionRow.decision]}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRApprovalsPage
