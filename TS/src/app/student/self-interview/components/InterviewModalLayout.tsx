import React, { useState, useRef, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import ResumeInterviewSelection from './ResumeInterviewSelection'
import InterviewUILayoutWithLogic from './InterviewUILayoutWithLogic'
import {
  FaLaptopCode, FaFileAlt, FaTimes, FaStar,
  FaBrain, FaChartLine, FaTrophy, FaUserTie, FaRocket,
  FaLightbulb, FaArrowRight, FaRobot, FaUser,
} from 'react-icons/fa'
import interviewImg from '@/assets/images/interview.png'
import { useAuthContext } from '@/context/useAuthContext'

type InterviewMeta = {
  interviewType: 'topic' | 'resume'
  attemptId?: string
  attemptNumber?: number
}

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (token) { fetchLimits(); fetchResumeLimits() }
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

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '28px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: 0, marginBottom: 28, background: '#fff8f2', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(255,122,0,0.07)' }}>

        {/* Left: label + title + underline + desc + features */}
        <div style={{ flex: 1, minWidth: 280, padding: '32px 32px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FaStar style={{ color: '#ff7a00', fontSize: 12 }} />
            <span style={{ color: '#ff7a00', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>AI Powered Practice</span>
          </div>

          {/* Title */}
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', margin: '0 0 8px' }}>AI Interview Practice</h2>

          {/* Orange underline */}
          <div style={{ width: 48, height: 4, background: '#ff7a00', borderRadius: 4, marginBottom: 14 }} />

          {/* Description */}
          <p style={{ color: '#475569', fontSize: 14, margin: '0 0 20px', maxWidth: 480, lineHeight: 1.7 }}>
            Choose between topic-based technical interviews or resume-based simulations
            tailored to your background. Get real-time AI feedback and improve with every attempt.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { icon: <FaRobot size={13} color="#ff7a00" />, label: 'AI-Powered', sub: 'Smart learning' },
              { icon: <FaChartLine size={13} color="#ff7a00" />, label: 'Track Progress', sub: 'See your improvement' },
              { icon: <FaUser size={13} color="#ff7a00" />, label: 'Personalized', sub: 'Learn at your pace' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: illustration */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
          <img
            src={interviewImg}
            alt="AI Interview"
            style={{ width: 380, maxWidth: '45vw', objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>

      {/* ── Two Interview Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 36 }}>

        {/* Topic-Based Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaLaptopCode color="#fff" size={16} />
                </div>
                <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Topic-Based Interview</h5>
              </div>
              <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>Tech Stack</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: '10px 0 0' }}>Practice interviews on React, JavaScript, Node.js and more.</p>
          </div>
          <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TopicSelection onStart={handleStart} limits={limits?.limits || {}} />
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 20px', display: 'flex', gap: 0 }}>
            {[
              { icon: <FaBrain size={13} />, label: 'AI Interviewer', sub: 'Real-time conversation' },
              { icon: <FaChartLine size={13} />, label: 'Smart Feedback', sub: 'Detailed AI insights' },
              { icon: <FaTrophy size={13} />, label: 'Performance Score', sub: 'Track your progress' },
            ].map((f, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 4px', borderRight: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ color: '#ff7a00', marginBottom: 3 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{f.label}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Resume-Based Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaFileAlt color="#fff" size={16} />
                </div>
                <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Resume-Based Interview</h5>
              </div>
              <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>Core Branch</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: '10px 0 0' }}>Upload your resume and get personalized interview questions.</p>
          </div>
          <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <ResumeInterviewSelection onStart={handleStart} resumeLimits={resumeLimits} />
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 20px', display: 'flex', gap: 0 }}>
            {[
              { icon: <FaUserTie size={13} />, label: 'Personalized Questions', sub: 'Tailored to your resume' },
              { icon: <FaBrain size={13} />, label: 'AI Evaluation', sub: 'In-depth analysis' },
              { icon: <FaRocket size={13} />, label: 'Improve & Grow', sub: 'Strengthen your skills' },
            ].map((f, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 4px', borderRight: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ color: '#3b82f6', marginBottom: 3 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{f.label}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works ──────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px 32px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>How It Works</h3>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>A simple 3-step process to simulate real interview experience and receive AI-powered feedback.</p>
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
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</div>
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
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{f.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.sub}</div>
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
