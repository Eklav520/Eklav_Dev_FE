import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiCalendar, FiBell, FiStar, FiExternalLink } from 'react-icons/fi'
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

const Stars = ({ rating }: { rating: number | null }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <FiStar key={n} size={14} color={rating != null && n <= Math.round(rating) ? '#f59e0b' : '#d1d5db'} fill={rating != null && n <= Math.round(rating) ? '#f59e0b' : 'none'} />
    ))}
  </div>
)

interface Criterion { key: string; label: string; rating: number | null; remarks: string }

interface FeedbackRow {
  candidateId: string
  candidateName: string
  jobTitle: string
  criteria: Criterion[]
  overallRating: number | null
  recommendation: string | null
  additionalComments: string
  interviewerName: string
  submittedAt: string | null
}

type RoundTab = 'Technical' | 'HR'

const HMFeedbackPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [activeTab, setActiveTab] = useState<RoundTab>('Technical')
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const memberName = (user as any)?.fullName || (user as any)?.name || 'Hiring Manager'
  const [pfg, pbg] = avatarColor(memberName)

  useEffect(() => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/hiring-manager/interview-feedback?round=${activeTab}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load feedback'))))
      .then(data => {
        const list: FeedbackRow[] = Array.isArray(data) ? data : []
        setRows(list)
        setSelectedId(list[0]?.candidateId || null)
        setLoadError('')
      })
      .catch(e => setLoadError(e.message || 'Failed to load feedback'))
      .finally(() => setLoading(false))
  }, [baseURL, token, activeTab])

  const filteredCandidates = useMemo(() => rows.filter(r => !search || r.candidateName.toLowerCase().includes(search.toLowerCase())), [rows, search])
  const selected = rows.find(r => r.candidateId === selectedId) || filteredCandidates[0] || null

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Interview Feedback</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Review submitted Technical and HR interview feedback per candidate.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidate…"
              style={{ ...inputBase, paddingLeft: 32, paddingRight: 12, height: 36, width: 200, fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 40, border: `1px solid ${BORDER}`, background: '#fff' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: pbg, color: pfg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(memberName)}</div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      {/* Round tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['Technical', 'HR'] as RoundTab[]).map(t => {
          const active = activeTab === t
          return (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              height: 38, padding: '0 16px', borderRadius: 10, border: `1px solid ${active ? BLUE : BORDER}`,
              background: active ? BLUE : '#fff', color: active ? '#fff' : '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {t} Feedback
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* Candidates list */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}`, fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Candidates</div>
          {loading && <div style={{ padding: 16, fontSize: '0.8rem', color: GRAY, textAlign: 'center' }}>Loading…</div>}
          {!loading && filteredCandidates.length === 0 && <div style={{ padding: 16, fontSize: '0.8rem', color: GRAY, textAlign: 'center' }}>No feedback yet.</div>}
          {!loading && filteredCandidates.map(r => {
            const active = selected?.candidateId === r.candidateId
            return (
              <button
                key={r.candidateId}
                onClick={() => setSelectedId(r.candidateId)}
                style={{
                  width: '100%', textAlign: 'left', display: 'block', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9',
                  background: active ? '#eff6ff' : '#fff', color: active ? BLUE : '#334155', fontSize: '0.8rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
                }}
              >
                {r.candidateName}
              </button>
            )
          })}
        </div>

        {/* Feedback detail */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
          {!selected ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Select a candidate to view feedback.</div>
          ) : (
            <>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{selected.candidateName} — {selected.jobTitle || 'Unknown Role'}</h3>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{activeTab} Interview Feedback</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {selected.criteria?.length > 0 ? selected.criteria.map(c => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: '#334155' }}>{c.label}</span>
                    <Stars rating={c.rating} />
                  </div>
                )) : (
                  <div style={{ fontSize: '0.8rem', color: GRAY }}>No criteria ratings recorded.</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Overall Recommendation</span>
                {selected.recommendation ? (
                  <span style={{ background: `${RECOMMENDATION_COLOR[selected.recommendation] || GRAY}1a`, color: RECOMMENDATION_COLOR[selected.recommendation] || GRAY, fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    {RECOMMENDATION_LABEL[selected.recommendation] || selected.recommendation}
                  </span>
                ) : <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
              </div>
            </>
          )}
        </div>

        {/* Comments panel */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Comments</div>
          {!selected ? (
            <div style={{ fontSize: '0.78rem', color: GRAY }}>—</div>
          ) : (
            <>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, marginBottom: 16 }}>{selected.additionalComments || 'No additional comments.'}</div>

              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: GRAY, marginBottom: 3 }}>Interviewer</div>
              <div style={{ fontSize: '0.82rem', color: '#0f172a', marginBottom: 14 }}>{selected.interviewerName || '—'}</div>

              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: GRAY, marginBottom: 3 }}>Interview Date</div>
              <div style={{ fontSize: '0.82rem', color: '#0f172a', marginBottom: 16 }}>{formatDate(selected.submittedAt)}</div>

              <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', fontWeight: 600, color: BLUE, cursor: 'pointer' }}>
                View Full Feedback <FiExternalLink size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default HMFeedbackPage
