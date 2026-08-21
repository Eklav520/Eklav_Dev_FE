import React, { useState, useRef, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import ResumeInterviewSelection from './ResumeInterviewSelection'
import InterviewUILayoutWithLogic from './InterviewUILayoutWithLogic'
import {
  FaLaptopCode, FaFileAlt,
  FaBrain, FaChartLine, FaTrophy, FaUserTie, FaRocket,
  FaLightbulb, FaArrowRight, FaLock,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type InterviewMeta = {
  interviewType: 'topic' | 'resume'
  attemptId?: string
  attemptNumber?: number
}

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes along with
// the rest of the portal without needing its own theme plumbing.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const InterviewModalLayout = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const [show, setShow] = useState(false)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [title, setTitle] = useState<string>('')
  const modalRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [meta, setMeta] = useState<InterviewMeta | undefined>(undefined)
  const [limits, setLimits] = useState<any>(null)
  const [resumeLimits, setResumeLimits] = useState<any>(null)

  // Full access (status === 'approved', same as institute-granted students)
  // OR a standalone "selfInterview" module purchase both unlock the full
  // 5-attempts/month quota; everyone else stays on the 2-attempt free trial
  // already enforced server-side in /start and /api/resume-based-interview/start.
  type ModulePlan = '6months' | '12months'
  const [moduleInfo, setModuleInfo] = useState<{ fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string; endDate: string | null } | null>(null)
  const [buyingPlan, setBuyingPlan] = useState<ModulePlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<ModulePlan>('12months')
  const [buyError, setBuyError] = useState<string | null>(null)

  const fetchModuleAccess = () => {
    if (!token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        const mod = data.modules?.selfInterview
        setModuleInfo({
          fullAccess: !!data.fullAccess,
          active: !!mod?.active,
          plans: { '6months': mod?.plans?.['6months'] ?? 19900, '12months': mod?.plans?.['12months'] ?? 34900 },
          label: mod?.label ?? 'AI Self Interview',
          endDate: mod?.endDate ?? null,
        })
      })
      .catch(() => {})
  }
  const hasAccess = moduleInfo ? (moduleInfo.fullAccess || moduleInfo.active) : user?.status?.toLowerCase() === 'approved'
  const modulePurchased = !!moduleInfo?.active && !moduleInfo?.fullAccess

  const buyModule = (plan: ModulePlan) => {
    if (!token || buyingPlan) return
    setBuyingPlan(plan)
    setBuyError(null)
    fetch(`${baseURL}/api/student/module-access/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleKey: 'selfInterview', plan }),
    })
      .then((r) => r.json())
      .then((order) => {
        if (!order.success) throw new Error(order.message || 'Failed to start payment')
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'Eklav',
          description: order.moduleLabel,
          order_id: order.orderId,
          prefill: { name: user?.fullName || '', email: user?.email || '' },
          theme: { color: '#ff7a00' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${baseURL}/api/student/module-access/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...response, moduleKey: 'selfInterview', plan }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed')
              fetchModuleAccess()
            } catch (e: any) {
              setBuyError(e.message || 'Payment verification failed. Contact support.')
            } finally {
              setBuyingPlan(null)
            }
          },
          modal: { ondismiss: () => setBuyingPlan(null) },
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.on('payment.failed', (response: any) => {
          setBuyError(`Payment failed: ${response.error?.description || 'Unknown error'}`)
          setBuyingPlan(null)
        })
        razorpay.open()
      })
      .catch((e) => { setBuyError(e.message || 'Failed to start payment'); setBuyingPlan(null) })
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (token) { fetchLimits(); fetchResumeLimits(); fetchModuleAccess() }
  }, [token])

  const handleStart = (
    id: string, questions: string[], _totalQuestions: number, title: string,
    options?: { interviewType: 'topic' | 'resume'; attemptId?: string; attemptNumber?: number }
  ) => {
    setInterviewId(id); setQuestions(questions); setTitle(title); setMeta(options); setShow(true)
  }

  const handleClose = async () => {
    setShow(false)
    await fetchLimits(); await fetchResumeLimits()
    setInterviewId(null); setQuestions([]); setTitle(''); setMeta(undefined)
  }

  const handleInterviewComplete = async () => {
    await Promise.all([fetchLimits(), fetchResumeLimits()])
    handleClose()
  }

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${baseURL}/interview/limits`, { headers: { Authorization: `Bearer ${token}` } })
      setLimits({ ...await res.json() })
    } catch (err) { console.error('Limits fetch error', err) }
  }

  const fetchResumeLimits = async () => {
    try {
      const res = await fetch(`${baseURL}/api/resume-based-interview/remaining`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
      setResumeLimits({ ...await res.json() })
    } catch (err) { console.error('Resume limits error', err) }
  }

  // Compute progress stats
  const topicLimits: Record<string, { remaining: number }> = limits?.limits || {}
  const totalTopicUsed = Object.values(topicLimits).reduce((s: number, l: any) => s + (5 - (l.remaining ?? 5)), 0)
  const resumeUsed = resumeLimits ? (resumeLimits.monthlyLimit ?? 5) - (resumeLimits.remaining ?? 5) : 0
  const totalInterviews = totalTopicUsed + resumeUsed
  const totalTopicRemaining = Object.values(topicLimits).reduce((s: number, l: any) => s + (l.remaining ?? 5), 0)
  const resumeRemaining = resumeLimits?.remaining ?? 5
  const totalAvailable = totalTopicRemaining + resumeRemaining
  const totalCapacity = totalInterviews + totalAvailable
  const utilizedPct = totalCapacity > 0 ? (totalInterviews / totalCapacity) * 100 : 0
  const attemptsRingColor = utilizedPct > 60 ? '#16a34a' : PAGE_BORDER

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {buyError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, marginBottom: 16 }}>
          {buyError}
        </div>
      )}
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: PAGE_TEXT, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            Tech Interview with AI
            {!hasAccess && (
              <span title="Unlock this module, or subscribe to a full plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ff7a00', fontSize: '0.9rem', fontWeight: 700 }}>
                <FaLock size={12} />(Premium Module)
              </span>
            )}
          </h2>
          <p style={{ color: PAGE_GRAY, fontSize: 13, margin: 0 }}>Choose topic-based or resume-based interviews and get real-time AI feedback.</p>
        </div>

        {modulePurchased && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <FaTrophy size={13} color="#16a34a" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
              Unlocked{moduleInfo?.endDate ? ` — valid until ${new Date(moduleInfo.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
            </span>
          </div>
        )}

        {!hasAccess && (() => {
          const price6 = (moduleInfo?.plans?.['6months'] ?? 19900) / 100
          const price12 = (moduleInfo?.plans?.['12months'] ?? 34900) / 100
          const betterValue = price12 / 12 < price6 / 6
          const isBusy = buyingPlan === selectedPlan
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#fff', border: '1px solid #f0d9c0', borderRadius: 10, padding: 4, flexShrink: 0 }}>
              {(['6months', '12months'] as const).map((plan) => {
                const price = plan === '6months' ? price6 : price12
                const active = selectedPlan === plan
                const highlight = plan === '12months' && betterValue
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      position: 'relative', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 1,
                      padding: '6px 14px', borderRadius: 7, minWidth: 78,
                      border: active ? '1.5px solid #ff7a00' : '1.5px solid transparent', cursor: 'pointer',
                      background: active ? '#fff7ed' : 'transparent',
                    }}
                  >
                    {highlight && (
                      <span style={{
                        position: 'absolute', top: -8, right: -4, background: '#16a34a', color: '#fff', fontSize: 8.5,
                        fontWeight: 700, letterSpacing: 0.2, borderRadius: 10, padding: '2px 5px', whiteSpace: 'nowrap' as const,
                      }}>
                        BEST
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? '#ff7a00' : '#999', whiteSpace: 'nowrap' as const }}>
                      {plan === '6months' ? '6 Months' : '12 Months'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>₹{price}</span>
                  </button>
                )
              })}
              <button
                onClick={() => buyModule(selectedPlan)}
                disabled={!!buyingPlan || !moduleInfo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#ff7a00', border: 'none', color: '#fff',
                  borderRadius: 7, padding: '9px 18px', fontSize: 12.5, fontWeight: 700, marginLeft: 6,
                  cursor: buyingPlan ? 'not-allowed' : 'pointer', opacity: buyingPlan && !isBusy ? 0.5 : 1,
                }}
              >
                {isBusy ? 'Processing…' : <>Buy Now <FaArrowRight size={10} /></>}
              </button>
            </div>
          )
        })()}
      </div>

      {/* ── Stats Bar ──────────────────────────────────────── */}
      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        {[
          { label: 'Topic Interviews Used', value: `${totalTopicUsed}` },
          { label: 'Topic Interviews Remaining', value: `${totalTopicRemaining}` },
          { label: 'Resume Interviews Used', value: `${resumeUsed}` },
          { label: 'Resume Interviews Remaining', value: `${resumeRemaining}` },
          { label: 'Total Completed', value: `${totalInterviews}`, color: '#ff7a00' },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: 11, color: PAGE_GRAY, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color || PAGE_TEXT }}>{s.value}</div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `4px solid ${attemptsRingColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: PAGE_TEXT,
          }}>
            {totalAvailable}
          </div>
          <div style={{ fontSize: 10, color: PAGE_GRAY }}>Attempts Left</div>
        </div>
      </div>

      {/* ── Two Interview Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 36 }}>

        {/* Topic-Based Card */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaLaptopCode color="#fff" size={16} />
                </div>
                <h5 style={{ fontWeight: 700, fontSize: 15, color: PAGE_TEXT, margin: 0 }}>Topic-Based Interview</h5>
              </div>
              <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>Tech Stack</span>
            </div>
            <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '10px 0 0' }}>Practice interviews on React, JavaScript, Node.js and more.</p>
          </div>
          <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TopicSelection onStart={handleStart} limits={limits?.limits || {}} hasModuleAccess={hasAccess} />
          </div>
          <div style={{ borderTop: `1px solid ${PAGE_BORDER}`, padding: '12px 20px', display: 'flex', gap: 0 }}>
            {[
              { icon: <FaBrain size={13} />, label: 'AI Interviewer', sub: 'Real-time conversation' },
              { icon: <FaChartLine size={13} />, label: 'Smart Feedback', sub: 'Detailed AI insights' },
              { icon: <FaTrophy size={13} />, label: 'Performance Score', sub: 'Track your progress' },
            ].map((f, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 4px', borderRight: i < 2 ? `1px solid ${PAGE_BORDER}` : 'none' }}>
                <div style={{ color: '#ff7a00', marginBottom: 3 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: PAGE_TEXT }}>{f.label}</div>
                <div style={{ fontSize: 10, color: PAGE_GRAY }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Resume-Based Card */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaFileAlt color="#fff" size={16} />
                </div>
                <h5 style={{ fontWeight: 700, fontSize: 15, color: PAGE_TEXT, margin: 0 }}>Resume-Based Interview</h5>
              </div>
              <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>Core Branch</span>
            </div>
            <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '10px 0 0' }}>Upload your resume and get personalized interview questions.</p>
          </div>
          <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <ResumeInterviewSelection onStart={handleStart} resumeLimits={resumeLimits} hasModuleAccess={hasAccess} />
          </div>
          <div style={{ borderTop: `1px solid ${PAGE_BORDER}`, padding: '12px 20px', display: 'flex', gap: 0 }}>
            {[
              { icon: <FaUserTie size={13} />, label: 'Personalized Questions', sub: 'Tailored to your resume' },
              { icon: <FaBrain size={13} />, label: 'AI Evaluation', sub: 'In-depth analysis' },
              { icon: <FaRocket size={13} />, label: 'Improve & Grow', sub: 'Strengthen your skills' },
            ].map((f, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 4px', borderRight: i < 2 ? `1px solid ${PAGE_BORDER}` : 'none' }}>
                <div style={{ color: '#3b82f6', marginBottom: 3 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: PAGE_TEXT }}>{f.label}</div>
                <div style={{ fontSize: 10, color: PAGE_GRAY }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works ──────────────────────────────────── */}
      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, padding: '28px 32px 32px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h3 style={{ fontWeight: 800, color: PAGE_TEXT, marginBottom: 6 }}>How It Works</h3>
          <p style={{ color: PAGE_GRAY, fontSize: 14, margin: 0 }}>A simple 3-step process to simulate real interview experience and receive AI-powered feedback.</p>
        </div>

        {/* Steps row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            {
              num: '1', color: '#ff7a00', bg: '#fff7ed',
              title: 'Choose Interview Type',
              desc: 'Select between topic-based or resume-based interviews based on your preparation needs.',
              icon: <FaLaptopCode size={32} color="#ff7a00" />,
            },
            {
              num: '2', color: '#7c3aed', bg: '#f0eeff',
              title: 'Realistic Interview Experience',
              desc: 'Simulate real-world interview scenarios with our AI interviewer in a distraction-free environment.',
              icon: <FaUserTie size={32} color="#7c3aed" />,
            },
            {
              num: '3', color: '#16a34a', bg: '#f0fdf4',
              title: 'Get AI Feedback',
              desc: 'Receive instant AI-generated feedback, ratings, and improvement suggestions to help you get better.',
              icon: <FaChartLine size={32} color="#16a34a" />,
            },
          ].map((step, i) => (
            <React.Fragment key={i}>
              {/* Step group: box + text side by side */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Colored illustration box */}
                <div style={{
                  background: step.bg,
                  borderRadius: 14,
                  padding: '14px 18px 18px',
                  minWidth: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: step.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14,
                  }}>
                    {step.num}
                  </div>
                  <div style={{ alignSelf: 'center', opacity: 0.9 }}>{step.icon}</div>
                </div>

                {/* Title + description */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT, marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: PAGE_GRAY, lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>

              {/* Arrow between steps */}
              {i < 2 && (
                <div style={{ color: '#cbd5e1', flexShrink: 0, padding: '0 12px' }}>
                  <FaArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Bottom Features Row ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { icon: <FaLightbulb size={14} color="#7c3aed" />, bg: '#f5f3ff', label: 'Boost Confidence', sub: 'Practice anytime, anywhere' },
          { icon: <FaChartLine size={14} color="#2563eb" />, bg: '#eff6ff', label: 'Track Improvement', sub: 'Monitor your performance over time' },
          { icon: <FaLaptopCode size={14} color="#0891b2" />, bg: '#ecfeff', label: 'Industry-Relevant Questions', sub: 'Stay prepared for top tech interviews' },
          { icon: <FaRocket size={14} color="#ea580c" />, bg: '#fff7ed', label: 'Continuous Improvement', sub: 'Learn, adapt, and succeed' },
        ].map((f, i) => (
          <div key={i} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT }}>{f.label}</div>
              <div style={{ fontSize: 11, color: PAGE_GRAY }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Fullscreen Interview Modal ─────────────────────── */}
      <Modal
        show={show}
        fullscreen={!isMobile ? true : undefined}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
        centered={isMobile}
        size={isMobile ? 'xl' : undefined}
      >
        <Modal.Body className="p-0">
          <div ref={modalRef} className="w-100 h-100 bg-body">
            {show && interviewId && questions.length > 0 && (
              <InterviewUILayoutWithLogic
                interviewId={interviewId}
                questions={questions}
                title={title}
                isFullscreen={!isMobile}
                meta={meta}
                onComplete={handleInterviewComplete}
              />
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default InterviewModalLayout
