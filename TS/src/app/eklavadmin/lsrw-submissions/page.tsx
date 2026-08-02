import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaUserGraduate, FaChevronDown, FaChevronRight, FaBook, FaHeadphones } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'
const ORANGE = '#ff7a00'
const BLUE   = '#2563eb'

type Mistake = { expected: string; said: string; type: 'substitution' | 'missing' | 'extra' }
type SubmissionItem = {
  itemId: string
  type: 'reading' | 'listening'
  expectedSentence: string
  transcript: string
  marks: number
  scoreAwarded: number
  accuracyPercent: number
  mistakes: Mistake[]
  timeLimit: number
  recordedSeconds: number
}
type Submission = {
  _id: string
  studentId: { _id: string; name?: string; email?: string; rollNumber?: string } | null
  items: SubmissionItem[]
  totalMarks: number
  totalScoreAwarded: number
  totalQuestions: number
  createdAt: string
}

const mistakeLabel = (m: Mistake) => {
  if (m.type === 'substitution') return `said "${m.said}" instead of "${m.expected}"`
  if (m.type === 'missing') return `missed the word "${m.expected}"`
  return `said an extra word "${m.said}"`
}

const LSRWSubmissionsAdmin = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}/api/eklavadmin/lsrw-submissions`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setSubmissions(data.submissions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.token, baseURL])

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <PageMetaData title="Listening & Reading — Student Results" />

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: PAGE_TEXT, margin: '0 0 4px' }}>Listening & Reading — Student Results</h2>
        <p style={{ color: PAGE_GRAY, fontSize: 13, margin: 0 }}>Marks and word-level mistakes per question, computed automatically from each student's speech-to-text transcript.</p>
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, fontWeight: 700, fontSize: 14, color: PAGE_TEXT }}>
          {submissions.length} attempt{submissions.length === 1 ? '' : 's'}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' as const }}><Spinner animation="border" style={{ color: ORANGE, width: 22, height: 22 }} /></div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 13 }}>No student attempts yet.</div>
        ) : (
          submissions.map((sub) => {
            const isOpen = !!expanded[sub._id]
            const percent = sub.totalMarks > 0 ? Math.round((sub.totalScoreAwarded / sub.totalMarks) * 100) : 0
            return (
              <div key={sub._id} style={{ borderBottom: `1px solid ${PAGE_BORDER}` }}>
                <div
                  onClick={() => toggle(sub._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}
                >
                  {isOpen ? <FaChevronDown size={11} color={PAGE_GRAY} /> : <FaChevronRight size={11} color={PAGE_GRAY} />}
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaUserGraduate size={14} color={ORANGE} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: PAGE_TEXT }}>{sub.studentId?.name || 'Unknown Student'}</div>
                    <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                      {sub.studentId?.email || '—'}{sub.studentId?.rollNumber ? ` · ${sub.studentId.rollNumber}` : ''} · {new Date(sub.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: PAGE_GRAY }}>{sub.totalQuestions} question{sub.totalQuestions === 1 ? '' : 's'}</span>
                  <span style={{
                    border: `1px solid ${percent >= 60 ? '#22c55e' : '#dc2626'}55`,
                    color: percent >= 60 ? '#16a34a' : '#dc2626',
                    background: percent >= 60 ? '#f0fdf4' : '#fef2f2',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, minWidth: 90, textAlign: 'center' as const,
                  }}>
                    {sub.totalScoreAwarded} / {sub.totalMarks} ({percent}%)
                  </span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 20px 18px 62px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    {sub.items.map((item, idx) => {
                      const accent = item.type === 'reading' ? ORANGE : BLUE
                      return (
                        <div key={idx} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: accent }}>
                              {item.type === 'reading' ? <FaBook size={11} /> : <FaHeadphones size={11} />}
                              Question {idx + 1} — {item.type === 'reading' ? 'Reading' : 'Listening'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT }}>
                              {item.scoreAwarded} / {item.marks} marks · {item.accuracyPercent}% accuracy
                            </span>
                          </div>
                          <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: 4 }}>
                            <strong style={{ color: PAGE_TEXT }}>Expected:</strong> {item.expectedSentence}
                          </div>
                          <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: item.mistakes.length ? 8 : 0 }}>
                            <strong style={{ color: PAGE_TEXT }}>Student said:</strong> {item.transcript || <em>(no speech captured)</em>}
                          </div>
                          {item.mistakes.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                              {item.mistakes.map((m, mi) => (
                                <span key={mi} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '3px 9px', fontSize: 11 }}>
                                  {mistakeLabel(m)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LSRWSubmissionsAdmin
