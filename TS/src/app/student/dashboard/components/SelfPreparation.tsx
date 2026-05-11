import { Card, ProgressBar, Spinner } from 'react-bootstrap'
import { FaRobot, FaFileAlt, FaChartBar, FaTrophy } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

/* ── Types ── */
type TopicLimit  = { remaining: number; earliestAttempt: string | null }
type TopicAvg    = { topic: string; avgScore: number }
type ResumeAttempt = {
  attemptId: string
  attemptNumber: number
  domain: string
  totalScore: number | null
  isScored: boolean
  createdAt: string
}
type ResumeResults = {
  attempts: ResumeAttempt[]
  used: number
  remaining: number
  limit: number
  bestScore: number | null
  avgScore: number | null
}

const LIMIT = 5   // self-interview attempts per topic per 30 days

const SelfPreparation = () => {
  const { user } = useAuthContext()
  const token    = user?.token
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const [topicLimits,   setTopicLimits]   = useState<Record<string, TopicLimit>>({})
  const [topicAverages, setTopicAverages] = useState<TopicAvg[]>([])
  const [resumeResults, setResumeResults] = useState<ResumeResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    const load = async () => {
      setLoading(true)
      const h = { Authorization: `Bearer ${token}` }

      const [limRes, avgRes, rnRes] = await Promise.allSettled([
        fetch(`${baseURL}/interview/limits`,                       { headers: h }),
        fetch(`${baseURL}/interview-results`,                      { headers: h }),
        fetch(`${baseURL}/api/resume-based-interview/my-results`,  { headers: h }),
      ])

      if (limRes.status === 'fulfilled' && limRes.value.ok) {
        const j = await limRes.value.json()
        setTopicLimits(j.limits ?? {})
      }
      if (avgRes.status === 'fulfilled' && avgRes.value.ok) {
        const j = await avgRes.value.json()
        setTopicAverages(j.data ?? [])
      }
      if (rnRes.status === 'fulfilled' && rnRes.value.ok) {
        setResumeResults(await rnRes.value.json())
      }

      setLoading(false)
    }

    load()
  }, [token])

  /* derived */
  const selfTopics = Object.entries(topicLimits).map(([topic, lim]) => {
    const used   = LIMIT - lim.remaining
    const avg    = topicAverages.find(t => t.topic === topic)?.avgScore ?? null
    return { topic, used, remaining: lim.remaining, avg }
  })

  const overallSelfScore = topicAverages.length > 0
    ? Math.round(topicAverages.reduce((s, t) => s + t.avgScore, 0) / topicAverages.length)
    : 0

  if (loading) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center border-0 shadow-lg"
        style={{ borderRadius: '16px', minHeight: '600px' }}>
        <div className="text-center p-4">
          <Spinner animation="border" style={{ color: '#ff7a00' }} />
          <p className="mt-3 text-white-50">Loading performance data...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header className="border-0 text-white px-3 px-md-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            flexDirection: 'column',
          }}>
          <div className="d-flex align-items-start mb-3">
            <div className="p-2 rounded-circle me-3 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <FaRobot className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.75rem)' }}>
                AI Interview
              </h1>
              <small className="opacity-75 mt-1 d-block" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                Self-interview &amp; resume interview progress
              </small>
            </div>
          </div>

          {/* stat cards */}
          <div className="d-flex gap-3" style={{ width: '100%' }}>
            <StatCard icon={<FaChartBar size={18} />} label="Self-Interview Avg" value={`${overallSelfScore}%`} />
            <StatCard
              icon={<FaTrophy size={18} />}
              label="Resume Best"
              value={resumeResults?.bestScore != null ? `${resumeResults.bestScore}` : '—'}
            />
          </div>
        </Card.Header>
      </div>

      {/* ── BODY ── */}
      <Card.Body className="p-3 p-md-4 sp-scrollbody" style={{
        background: '#1e293b',
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>

        {/* ── Self-Interview Topics ── */}
        <SectionHeader title="Self Interview" sub={`${LIMIT} attempts / topic / 30 days`} />

        {selfTopics.length === 0 ? (
          <EmptyMsg icon={<FaRobot size={32} />} msg="No self-interview data yet" />
        ) : (
          <div className="mb-4">
            {selfTopics.map(({ topic, used, remaining, avg }) => {
              const attemptPct = Math.round((used / LIMIT) * 100)
              return (
                <div key={topic} className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* row header */}
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ fontSize: '1.1rem' }}>🤖</span>
                      <div>
                        <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                          {topic}
                        </div>
                        <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                          {avg != null
                            ? <>Avg score: <span className="fw-bold text-white">{avg}%</span></>
                            : <span>No score yet</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                        {used}/{LIMIT}
                      </div>
                      <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
                        {remaining} left
                      </div>
                    </div>
                  </div>

                  {/* attempts progress bar */}
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-white-50" style={{ fontSize: '0.7rem' }}>Attempts used</span>
                    <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{attemptPct}%</span>
                  </div>
                  <BarRow pct={attemptPct} color="#ff7a00" />

                  {/* score progress bar */}
                  {avg != null && (
                    <>
                      <div className="d-flex justify-content-between mt-2 mb-1">
                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>Avg score</span>
                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{avg}%</span>
                      </div>
                      <BarRow pct={avg} color="#3b82f6" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Resume-Based Interview ── */}
        <SectionHeader
          title="Resume Interview"
          sub={resumeResults ? `${resumeResults.used}/${resumeResults.limit} used this month` : '5 attempts / month'}
        />

        {!resumeResults ? (
          <EmptyMsg icon={<FaFileAlt size={32} />} msg="No resume interview data yet" />
        ) : (
          <div className="mb-2">
            {/* monthly usage bar */}
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.1rem' }}>📄</span>
                  <div>
                    <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                      Monthly Attempts
                    </div>
                    <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                      {resumeResults.remaining} attempt{resumeResults.remaining !== 1 ? 's' : ''} remaining
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                    {resumeResults.used}/{resumeResults.limit}
                  </div>
                  {resumeResults.avgScore != null && (
                    <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
                      Avg: {resumeResults.avgScore}
                    </div>
                  )}
                </div>
              </div>
              <BarRow pct={Math.round((resumeResults.used / resumeResults.limit) * 100)} color="#10b981" />
            </div>

            {/* individual attempts */}
            {resumeResults.attempts.length > 0 && (
              <>
                <div className="text-white-50 mb-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Past Attempts
                </div>
                {resumeResults.attempts.slice(0, 5).map((a) => {
                  const maxPossible = 15 * 10  // 15 questions × max 10 pts
                  const scorePct = a.isScored && a.totalScore != null
                    ? Math.round((a.totalScore / maxPossible) * 100)
                    : null
                  return (
                    <div key={String(a.attemptId)} className="mb-3 pb-3"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>
                            Attempt #{a.attemptNumber} — {a.domain}
                          </div>
                          <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
                            {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="text-end">
                          {scorePct != null ? (
                            <>
                              <div className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>{scorePct}%</div>
                              <div className="text-white-50" style={{ fontSize: '0.7rem' }}>Score</div>
                            </>
                          ) : (
                            <span className="text-white-50" style={{ fontSize: '0.72rem' }}>Not scored</span>
                          )}
                        </div>
                      </div>
                      {scorePct != null && <BarRow pct={scorePct} color="#8b5cf6" />}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
            Monthly limits reset on the 1st of each month
          </small>
        </div>
      </Card.Body>

      <style>{`
        .sp-scrollbody::-webkit-scrollbar { width: 4px; }
        .sp-scrollbody::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .sp-scrollbody::-webkit-scrollbar-thumb { background: rgba(255,122,0,0.5); border-radius: 2px; }
        .sp-scrollbody::-webkit-scrollbar-thumb:hover { background: rgba(255,122,0,0.7); }
      `}</style>
    </Card>
  )
}

/* ── Small reusable sub-components ── */

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="d-flex align-items-center p-3 rounded-3" style={{
    flex: 1,
    background: 'rgba(255,122,0,0.15)',
    border: '1px solid rgba(255,122,0,0.4)',
  }}>
    <div className="rounded-circle p-2 flex-shrink-0 me-3" style={{
      background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
      width: 42, height: 42,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff',
    }}>
      {icon}
    </div>
    <div>
      <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', opacity: 0.8 }}>{label}</div>
      <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.2rem, 5vw, 1.4rem)', lineHeight: 1 }}>{value}</div>
    </div>
  </div>
)

const SectionHeader = ({ title, sub }: { title: string; sub: string }) => (
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h2 className="text-white fw-bold mb-0" style={{ fontSize: 'clamp(1rem, 4vw, 1.15rem)' }}>{title}</h2>
    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>{sub}</div>
  </div>
)

const EmptyMsg = ({ icon, msg }: { icon: React.ReactNode; msg: string }) => (
  <div className="text-center py-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)' }}>
    {icon}
    <div className="mt-2 text-white-50 small">{msg}</div>
  </div>
)

const BarRow = ({ pct, color }: { pct: number; color: string }) => (
  <ProgressBar now={pct} style={{
    height: 6, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  }}>
    <div style={{
      width: `${pct}%`, backgroundColor: color,
      height: '100%', transition: 'width 0.6s ease', borderRadius: 4,
    }} />
  </ProgressBar>
)

export default SelfPreparation
