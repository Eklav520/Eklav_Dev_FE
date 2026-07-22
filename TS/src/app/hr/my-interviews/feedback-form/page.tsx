import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPaperclip, FiSave, FiCheckCircle, FiX, FiPlus } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'
import { useMyInterviews } from '../useMyInterviews'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const CRITERIA = [
  { key: 'technicalKnowledge', label: 'Technical Knowledge', hint: 'Concept clarity, depth of skills' },
  { key: 'problemSolving', label: 'Problem Solving', hint: 'Logic, approach, ability to solve' },
  { key: 'codingQuality', label: 'Coding Quality', hint: 'Code quality, best practices' },
  { key: 'communication', label: 'Communication', hint: 'Clarity of communication' },
  { key: 'confidence', label: 'Confidence', hint: 'Self-confidence and attitude' },
  { key: 'culturalFit', label: 'Cultural Fit', hint: 'Team player and adaptability' },
]
const RATING_LABELS = ['Poor', 'Fair', 'Average', 'Good', 'Excellent']
const RECOMMENDATIONS = ['Shortlist', 'Hire', 'Hold', 'Needs Improvement', 'Not Selected']

interface CriterionState { key: string; label: string; rating: number | null; remarks: string }

const avatarColor = (name: string) => {
  const colors = [['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'], ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF']]
  return colors[(name.charCodeAt(0) || 0) % colors.length]
}
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const TABS = ['Feedback Form', 'Evaluation Summary', 'Interviewer Feedback', 'Attachments', 'Comments', 'Timeline'] as const

const HRFeedbackFormPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>()
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const { interviews, loading: interviewsLoading } = useMyInterviews()
  const interview = useMemo(() => interviews.find(iv => iv._id === interviewId), [interviews, interviewId])

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Feedback Form')
  const [criteria, setCriteria] = useState<CriterionState[]>(CRITERIA.map(c => ({ key: c.key, label: c.label, rating: null, remarks: '' })))
  const [strengths, setStrengths] = useState<string[]>([])
  const [strengthDraft, setStrengthDraft] = useState('')
  const [areasToImprove, setAreasToImprove] = useState<string[]>([])
  const [areaDraft, setAreaDraft] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [additionalComments, setAdditionalComments] = useState('')
  const [status, setStatus] = useState<'Draft' | 'Submitted'>('Draft')

  const [loadingFeedback, setLoadingFeedback] = useState(true)
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!baseURL || !token || !interviewId) return
    fetch(`${baseURL}/interview-feedback/mine/${interviewId}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setCriteria(CRITERIA.map(c => {
            const existing = (data.criteria || []).find((x: any) => x.key === c.key)
            return { key: c.key, label: c.label, rating: existing?.rating ?? null, remarks: existing?.remarks || '' }
          }))
          setStrengths(data.strengths || [])
          setAreasToImprove(data.areasToImprove || [])
          setRecommendation(data.recommendation || '')
          setAdditionalComments(data.additionalComments || '')
          setStatus(data.status || 'Draft')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFeedback(false))
  }, [baseURL, token, interviewId])

  const overallRating = useMemo(() => {
    const rated = criteria.map(c => c.rating).filter((r): r is number => typeof r === 'number')
    return rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null
  }, [criteria])

  const setCriterionRating = (key: string, rating: number) => {
    setCriteria(prev => prev.map(c => (c.key === key ? { ...c, rating } : c)))
  }
  const setCriterionRemarks = (key: string, remarks: string) => {
    setCriteria(prev => prev.map(c => (c.key === key ? { ...c, remarks } : c)))
  }

  const addStrength = () => {
    if (!strengthDraft.trim()) return
    setStrengths(prev => [...prev, strengthDraft.trim()])
    setStrengthDraft('')
  }
  const addArea = () => {
    if (!areaDraft.trim()) return
    setAreasToImprove(prev => [...prev, areaDraft.trim()])
    setAreaDraft('')
  }

  const save = async (submit: boolean) => {
    if (submit && !recommendation) {
      setError('Recommendation is required to submit')
      return
    }
    setSaving(submit ? 'submit' : 'draft')
    setError('')
    try {
      const res = await fetch(`${baseURL}/interview-feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          criteria: criteria.map(c => ({ key: c.key, label: c.label, rating: c.rating, remarks: c.remarks })),
          strengths, areasToImprove, recommendation, additionalComments,
          status: submit ? 'Submitted' : 'Draft',
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to save feedback')
      if (submit) {
        navigate('/hr/my-interviews/feedback')
      } else {
        setStatus('Draft')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save feedback')
    } finally {
      setSaving(null)
    }
  }

  const inputStyle = { width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 10px', fontSize: '0.82rem', background: '#fff', color: '#0f172a', colorScheme: 'light' as const, boxSizing: 'border-box' as const }

  if (interviewsLoading || loadingFeedback) {
    return <div style={{ padding: 40, textAlign: 'center', color: GRAY }}>Loading…</div>
  }
  if (!interview) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: GRAY }}>
        Interview not found or not assigned to you.
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate('/hr/my-interviews')} style={{ background: 'none', border: 'none', color: BLUE, cursor: 'pointer', fontWeight: 600 }}>← Back to Dashboard</button>
        </div>
      </div>
    )
  }

  const [fg, bg] = avatarColor(interview.candidateName)
  const isSubmitted = status === 'Submitted'

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Dark header */}
      <div style={{ background: '#0d1117', padding: '16px 20px', color: '#fff', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 6 }}>
          FEEDBACK FORM – REPORT GIVEN BY INTERVIEWER
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#c8d6e8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <FiArrowLeft size={13} /> Back to Candidate List
        </button>
      </div>

      <div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

        {/* Candidate summary bar */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: bg, color: fg, fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(interview.candidateName)}</div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{interview.candidateName}</div>
              {isSubmitted && <span style={{ fontSize: '0.7rem', color: GREEN, fontWeight: 600 }}>Submitted</span>}
            </div>
          </div>
          <div><div style={{ fontSize: '0.68rem', color: GRAY }}>Job Title</div><div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{interview.jobTitle || '—'}</div></div>
          <div><div style={{ fontSize: '0.68rem', color: GRAY }}>Interview Date</div><div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{new Date(interview.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
          <div><div style={{ fontSize: '0.68rem', color: GRAY }}>Round</div><div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{interview.interviewType}</div></div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: GRAY }}>Overall Rating</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: overallRating ? GREEN : '#cbd5e1' }}>{overallRating != null ? `${overallRating}/5` : '—'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 18, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap',
              fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? BLUE : GRAY,
              borderBottom: activeTab === tab ? `2px solid ${BLUE}` : '2px solid transparent', marginBottom: -1,
            }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab !== 'Feedback Form' ? (
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: GRAY, fontSize: '0.86rem' }}>
            {activeTab} is coming soon.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Evaluation Criteria */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Evaluation Criteria</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.7rem', color: GRAY, fontWeight: 600, width: 160 }}>Criteria</th>
                        {RATING_LABELS.map((l, i) => (
                          <th key={l} style={{ textAlign: 'center', padding: '6px 4px', fontSize: '0.66rem', color: GRAY, fontWeight: 600 }}>{l} ({i + 1})</th>
                        ))}
                        <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '0.7rem', color: GRAY, fontWeight: 600, width: 50 }}>Rating</th>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.7rem', color: GRAY, fontWeight: 600 }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, ci) => (
                        <tr key={c.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{c.label}</div>
                            <div style={{ fontSize: '0.66rem', color: GRAY }}>{CRITERIA[ci]?.hint}</div>
                          </td>
                          {[1, 2, 3, 4, 5].map(v => (
                            <td key={v} style={{ textAlign: 'center', padding: '10px 4px' }}>
                              <input type="radio" name={`rating-${c.key}`} checked={c.rating === v} onChange={() => setCriterionRating(c.key, v)} style={{ accentColor: BLUE, cursor: 'pointer' }} />
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, color: c.rating ? GREEN : '#cbd5e1' }}>{c.rating ?? '—'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <input value={c.remarks} onChange={e => setCriterionRemarks(c.key, e.target.value)} placeholder="Optional remarks…" style={{ ...inputStyle, height: 32 }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'right', padding: '10px 8px', fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>Overall Rating</td>
                        <td style={{ padding: '10px 8px', fontSize: '0.9rem', fontWeight: 800, color: overallRating ? GREEN : '#cbd5e1' }}>{overallRating != null ? `${overallRating}/5` : '—'}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Overall Feedback */}
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Overall Feedback</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Strengths</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={strengthDraft} onChange={e => setStrengthDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStrength() } }} placeholder="e.g. Strong grasp of core concepts" style={inputStyle} />
                    <button onClick={addStrength} style={{ height: 36, padding: '0 12px', borderRadius: 7, border: 'none', background: GREEN, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiPlus size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {strengths.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#334155', background: '#f0fdf4', borderRadius: 6, padding: '6px 10px' }}>
                        <FiCheckCircle size={12} color={GREEN} /> {s}
                        <FiX size={12} style={{ marginLeft: 'auto', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setStrengths(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Areas to Improve</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={areaDraft} onChange={e => setAreaDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addArea() } }} placeholder="e.g. Needs more practice with edge cases" style={inputStyle} />
                    <button onClick={addArea} style={{ height: 36, padding: '0 12px', borderRadius: 7, border: 'none', background: ORANGE, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiPlus size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {areasToImprove.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#334155', background: '#fff7ed', borderRadius: 6, padding: '6px 10px' }}>
                        {s}
                        <FiX size={12} style={{ marginLeft: 'auto', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setAreasToImprove(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Recommendation *</label>
                  <select value={recommendation} onChange={e => setRecommendation(e.target.value)} style={inputStyle}>
                    <option value="">Select recommendation</option>
                    {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Additional Comments (Optional)</label>
                  <textarea value={additionalComments} onChange={e => setAdditionalComments(e.target.value)} rows={3} placeholder="Anything else worth noting…" style={{ ...inputStyle, height: 'auto', padding: 10, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => save(false)} disabled={!!saving} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1 }}>
                  <FiSave size={14} /> {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
                </button>
                <button onClick={() => save(true)} disabled={!!saving} style={{ height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1 }}>
                  <FiCheckCircle size={14} /> {saving === 'submit' ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Interview Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem' }}>
                  <div><div style={{ color: GRAY, marginBottom: 2 }}>Mode</div><div style={{ color: '#334155', fontWeight: 600 }}>{interview.meetingLink ? 'Online' : 'In-Person'}</div></div>
                  <div><div style={{ color: GRAY, marginBottom: 2 }}>Duration</div><div style={{ color: '#334155', fontWeight: 600 }}>{interview.durationMinutes || 30} min</div></div>
                  <div>
                    <div style={{ color: GRAY, marginBottom: 4 }}>Interviewers</div>
                    <div style={{ display: 'flex' }}>
                      {(interview.interviewers || []).map((p, i) => {
                        const [ifg, ibg] = avatarColor(p.name)
                        return <div key={i} title={p.name} style={{ width: 24, height: 24, borderRadius: '50%', background: ibg, color: ifg, fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8 }}>{initials(p.name)}</div>
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <FiPaperclip size={13} color="#334155" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Attachments</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: GRAY }}>No attachments yet.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HRFeedbackFormPage
