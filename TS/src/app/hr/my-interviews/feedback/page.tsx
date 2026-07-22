import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiCalendar, FiBell, FiFilter, FiStar, FiClock, FiCheckCircle, FiUserCheck } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'
import { useMyInterviews, type Interview } from '../useMyInterviews'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const RECOMMENDATION_COLOR: Record<string, string> = {
  Shortlist: GREEN, Hire: GREEN, Hold: ORANGE, 'Needs Improvement': ORANGE, 'Not Selected': RED,
}

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

interface FeedbackDoc {
  _id: string
  interviewId: string
  overallRating: number | null
  recommendation: string | null
  status: 'Draft' | 'Submitted'
  submittedAt: string | null
}

type TabKey = 'All' | 'Completed' | 'Pending' | 'Shortlisted' | 'NotSelected'

const HRFeedbackGivenPage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const { interviews, memberName, memberRole, loading, loadError } = useMyInterviews()
  const [feedbackDocs, setFeedbackDocs] = useState<FeedbackDoc[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('All')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'rating'>('date')

  useEffect(() => {
    if (!baseURL || !token) return
    setFeedbackLoading(true)
    fetch(`${baseURL}/interview-feedback/mine`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setFeedbackDocs(Array.isArray(data) ? data : []))
      .catch(() => setFeedbackDocs([]))
      .finally(() => setFeedbackLoading(false))
  }, [baseURL, token])

  const feedbackByInterview = useMemo(() => {
    const map = new Map<string, FeedbackDoc>()
    feedbackDocs.forEach(f => map.set(f.interviewId, f))
    return map
  }, [feedbackDocs])

  // Everything I've actually sat down with — In Progress (awaiting my feedback)
  // or Completed (I already submitted). Scheduled/Cancelled don't need feedback.
  const relevant = useMemo(() => interviews.filter(iv => iv.status === 'In Progress' || iv.status === 'Completed'), [interviews])

  const submitted = useMemo(() => relevant.filter(iv => feedbackByInterview.get(iv._id)?.status === 'Submitted'), [relevant, feedbackByInterview])
  const pending = useMemo(() => relevant.filter(iv => feedbackByInterview.get(iv._id)?.status !== 'Submitted'), [relevant, feedbackByInterview])
  const shortlisted = useMemo(() => submitted.filter(iv => ['Shortlist', 'Hire'].includes(feedbackByInterview.get(iv._id)?.recommendation || '')), [submitted, feedbackByInterview])
  const notSelected = useMemo(() => submitted.filter(iv => feedbackByInterview.get(iv._id)?.recommendation === 'Not Selected'), [submitted, feedbackByInterview])

  const tabRows: Record<TabKey, Interview[]> = { All: relevant, Completed: submitted, Pending: pending, Shortlisted: shortlisted, NotSelected: notSelected }

  const ratedDocs = useMemo(() => feedbackDocs.filter(f => f.status === 'Submitted' && typeof f.overallRating === 'number'), [feedbackDocs])
  const avgRating = ratedDocs.length ? Math.round((ratedDocs.reduce((a, b) => a + (b.overallRating || 0), 0) / ratedDocs.length) * 10) / 10 : null

  const recommendationBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    feedbackDocs.forEach(f => { if (f.status === 'Submitted' && f.recommendation) counts[f.recommendation] = (counts[f.recommendation] || 0) + 1 })
    return counts
  }, [feedbackDocs])

  const filtered = useMemo(() => {
    return tabRows[activeTab]
      .filter(iv => !search || iv.candidateName.toLowerCase().includes(search.toLowerCase()) || (iv.jobTitle || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName)
        if (sortBy === 'rating') return (feedbackByInterview.get(b._id)?.overallRating || 0) - (feedbackByInterview.get(a._id)?.overallRating || 0)
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabRows, search, sortBy, feedbackByInterview])

  const initialsName = initials(memberName || 'Interviewer')
  const [pfg, pbg] = avatarColor(memberName || 'I')
  const isLoading = loading || feedbackLoading

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Feedback Given</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Candidates you've interviewed — submitted and still pending.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidate, job or interview..."
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
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{memberName || 'Interviewer'}</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>{memberRole || 'Interviewer'}</div>
            </div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Interviews', value: relevant.length, sub: 'Assigned to you', icon: <FiUserCheck size={16}/>, ic: PURPLE, bg: '#f5f3ff' },
              { label: 'Feedback Submitted', value: submitted.length, sub: relevant.length ? `${Math.round(submitted.length / relevant.length * 100)}%` : '0%', icon: <FiCheckCircle size={16}/>, ic: GREEN, bg: '#ecfdf5' },
              { label: 'Pending Feedback', value: pending.length, sub: relevant.length ? `${Math.round(pending.length / relevant.length * 100)}%` : '0%', icon: <FiClock size={16}/>, ic: ORANGE, bg: '#fff7ed' },
              { label: 'Average Rating', value: avgRating != null ? `${avgRating}/5` : '—', sub: 'All interviews', icon: <FiStar size={16}/>, ic: BLUE, bg: '#eff6ff' },
              { label: 'Shortlisted', value: shortlisted.length, sub: submitted.length ? `${Math.round(shortlisted.length / submitted.length * 100)}%` : '0%', icon: <FiUserCheck size={16}/>, ic: GREEN, bg: '#ecfdf5' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.64rem', color: GRAY, marginTop: 1, whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                {([
                  ['All', `All Candidates (${relevant.length})`],
                  ['Completed', `Feedback Completed (${submitted.length})`],
                  ['Pending', `Pending Feedback (${pending.length})`],
                  ['Shortlisted', `Shortlisted (${shortlisted.length})`],
                  ['NotSelected', `Not Selected (${notSelected.length})`],
                ] as [TabKey, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '13px 12px', fontSize: '0.8rem',
                    fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? BLUE : GRAY,
                    borderBottom: activeTab === key ? `2px solid ${BLUE}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                  <FiFilter size={13}/> Filters
                </button>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ height: 30, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
                  <option value="date">Sort by: Interview Date</option>
                  <option value="name">Sort by: Candidate Name</option>
                  <option value="rating">Sort by: Rating</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '13%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Candidate', 'Job Title', 'Interview Date', 'Round', 'Rating', 'Recommendation', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 10px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No candidates here.</td></tr>
                  )}
                  {isLoading && (
                    <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
                  )}
                  {!isLoading && filtered.map(iv => {
                    const [fg, bg] = avatarColor(iv.candidateName)
                    const fb = feedbackByInterview.get(iv._id)
                    const isSubmitted = fb?.status === 'Submitted'
                    return (
                      <tr key={iv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(iv.candidateName)}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateName}</div>
                              {iv.candidateEmail && <div style={{ fontSize: '0.66rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateEmail}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.jobTitle || '—'}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(iv.scheduledAt)}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.interviewType}</td>
                        <td style={{ padding: '12px 10px' }}>
                          {typeof fb?.overallRating === 'number' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, color: GREEN }}><FiStar size={12} /> {fb.overallRating}/5</span>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          {fb?.recommendation ? (
                            <span style={{ background: `${RECOMMENDATION_COLOR[fb.recommendation] || GRAY}1a`, color: RECOMMENDATION_COLOR[fb.recommendation] || GRAY, fontSize: '0.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{fb.recommendation}</span>
                          ) : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <button
                            onClick={() => navigate(`/hr/my-interviews/feedback-form/${iv._id}`)}
                            style={{ height: 28, padding: '0 10px', borderRadius: 7, border: isSubmitted ? `1px solid ${BORDER}` : 'none', background: isSubmitted ? '#fff' : BLUE, color: isSubmitted ? '#334155' : '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {isSubmitted ? 'View Report' : 'Give Feedback'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, fontSize: '0.76rem', color: GRAY }}>
              Showing {filtered.length} of {tabRows[activeTab].length} candidates
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Quick Insights</div>
            {Object.keys(recommendationBreakdown).length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: GRAY }}>No feedback submitted yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(recommendationBreakdown).map(([rec, count]) => (
                  <div key={rec} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: RECOMMENDATION_COLOR[rec] || GRAY }} />
                      <span style={{ color: '#334155' }}>{rec}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Waiting on Your Feedback</span>
              <span onClick={() => setActiveTab('Pending')} style={{ fontSize: '0.72rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>View all</span>
            </div>
            {pending.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: GRAY }}>You're all caught up — nothing pending.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.slice(0, 4).map(iv => {
                  const [fg, bg] = avatarColor(iv.candidateName)
                  return (
                    <div key={iv._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: bg, color: fg, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(iv.candidateName)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateName}</div>
                        <div style={{ fontSize: '0.66rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.jobTitle}</div>
                      </div>
                      <button onClick={() => navigate(`/hr/my-interviews/feedback-form/${iv._id}`)} style={{ height: 24, padding: '0 8px', borderRadius: 6, border: 'none', background: ORANGE, color: '#fff', fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Give</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HRFeedbackGivenPage
