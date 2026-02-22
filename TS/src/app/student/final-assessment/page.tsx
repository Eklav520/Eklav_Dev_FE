import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, ListGroup, Badge, Modal, Spinner, Alert } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import StudentQuiz from './components/StudentQuiz'
import { useAuthContext } from '@/context/useAuthContext'
import StudentCodeChallengeComponent from './components/codeChallenge/StudentCodeChallengeComponent'
import TechnicalRound from './components/TRRound/TechnicalRound'
import HRRound from './HRRound/HRRound'
import StarRating from '@/app/instructor/final-assessment/components/StarRating'

type RoundKey = 'quiz' | 'code' | 'tr' | 'hr'
type RoundStatus = 'locked' | 'ready' | 'in_progress' | 'pending' | 'passed' | 'failed'

// Typed status constants
const LOCKED: RoundStatus = 'locked'
const READY: RoundStatus = 'ready'
const IN_PROGRESS: RoundStatus = 'in_progress'
const PENDING: RoundStatus = 'pending'
const PASSED: RoundStatus = 'passed'
const FAILED: RoundStatus = 'failed'

// states we should not clobber (server/user-driven)
const PERSIST_STATUSES: readonly RoundStatus[] = [PENDING, IN_PROGRESS, PASSED, FAILED] as const

const initialRounds: { key: RoundKey; label: string; status: RoundStatus }[] = [
  { key: 'quiz', label: 'Quiz', status: READY },
  { key: 'code', label: 'Code Challenge', status: LOCKED },
  { key: 'tr', label: 'Technical Round (TR)', status: LOCKED },
  { key: 'hr', label: 'HR Round', status: LOCKED },
]

const statusBadge = (s: RoundStatus) => {
  switch (s) {
    case READY:
      return <Badge style={{ backgroundColor: '#ff7a00' }}>
        Ready
      </Badge>
    case IN_PROGRESS:
      return <Badge style={{ backgroundColor: '#ff9a3c' }}>
        In Progress
      </Badge>
    case PENDING:
      return <Badge bg="warning">Pending evaluation</Badge>
    case PASSED:
      return <Badge bg="success">Passed</Badge>
    case FAILED:
      return <Badge bg="danger">Failed</Badge>
    case LOCKED:
    default:
      return <Badge bg="secondary">Locked</Badge>
  }
}

/** QUIZ -> CODE unlocks (preserve code state if already active/terminal) */
function deriveWithQuizStatus(
  prev: { key: RoundKey; label: string; status: RoundStatus }[],
  quizStatus: RoundStatus,
): { key: RoundKey; label: string; status: RoundStatus }[] {
  return prev.map((r) => {
    if (r.key === 'quiz') return { ...r, status: quizStatus }
    if (r.key === 'code') {
      const prevStatus = r.status
      if (PERSIST_STATUSES.includes(prevStatus)) return r
      if (prevStatus === LOCKED && quizStatus === PASSED) return { ...r, status: READY }
      return r
    }
    return r
  })
}

/** CODE -> TR unlocks (preserve TR state if already active/terminal) */
function deriveWithCodeStatus(
  prev: { key: RoundKey; label: string; status: RoundStatus }[],
  codeStatus: RoundStatus,
): { key: RoundKey; label: string; status: RoundStatus }[] {
  return prev.map((r) => {
    if (r.key === 'code') return { ...r, status: codeStatus }
    if (r.key === 'tr') {
      const prevStatus = r.status
      if (PERSIST_STATUSES.includes(prevStatus)) return r
      if (prevStatus === LOCKED && codeStatus === PASSED) return { ...r, status: READY }
      return r
    }
    return r
  })
}

/** TR -> HR unlocks (preserve HR state if already active/terminal) */
function deriveWithTRStatus(
  prev: { key: RoundKey; label: string; status: RoundStatus }[],
  trStatus: RoundStatus,
): { key: RoundKey; label: string; status: RoundStatus }[] {
  return prev.map((r) => {
    if (r.key === 'tr') {
      // TR is source-of-truth from server
      return { ...r, status: trStatus }
    }
    if (r.key === 'hr') {
      const prevStatus = r.status
      if (PERSIST_STATUSES.includes(prevStatus)) return r
      if (prevStatus === LOCKED && trStatus === PASSED) {
        return { ...r, status: READY } // 🔓 unlock HR when TR passed
      }
      return r
    }
    return r
  })
}

// Violation warnings for each round type
const VIOLATION_WARNINGS = {
  quiz: {
    title: "Important: Quiz Rules & Violation Warnings",
    warnings: [
      "🚫 STRICTLY NO CHEATING: Any form of cheating will result in immediate disqualification",
      "📹 Screen & Webcam Recording: Your screen and webcam will be recorded throughout the quiz",
      "🔒 No New Tabs: Do not open new browser tabs or switch to other applications",
      "📵 No Mobile Phones: Keep mobile devices away during the assessment",
      "🤫 No External Help: Do not seek help from others or use external resources",
      "⏰ Time Limit: The quiz must be completed within the allocated time",
      "⚠️ Violation Consequences: Any violation will lead to automatic failure and may result in permanent ban from future assessments"
    ],
    instructions: [
      "Ensure you have a stable internet connection",
      "Close all unnecessary applications and browser tabs",
      "Make sure your webcam is working properly",
      "Find a quiet, well-lit environment without distractions",
      "Have your student ID ready for verification if required"
    ]
  },
  code: {
    title: "Code Challenge: Rules & Violation Warnings",
    warnings: [
      "🚫 PLAGIARISM PROHIBITED: All code must be your own original work",
      "🔍 Code Similarity Detection: Your code will be checked against existing solutions",
      "🌐 Restricted Browsing: Only allowed documentation sites are permitted",
      "📹 Screen Recording Active: Your coding activity is being monitored",
      "🚷 No Code Sharing: Do not share or discuss solutions with others",
      "⏱️ Time Tracking: The time taken for each problem is recorded",
      "⚠️ Violation Consequences: Plagiarism or cheating will result in immediate failure and permanent record"
    ],
    instructions: [
      "Use proper coding standards and comments",
      "Test your code thoroughly before submission",
      "Only use approved documentation (if specified)",
      "Focus on writing clean, efficient code",
      "Save your work regularly"
    ]
  },
  tr: {
    title: "Technical Round: Guidelines & Important Notes",
    warnings: [
      "🎤 Audio/Video Recording: This interview will be recorded for evaluation",
      "🧠 Demonstrate Problem-Solving: Explain your thought process clearly",
      "🚫 No Pre-written Answers: Do not read from prepared scripts",
      "💻 No IDE Assistance: Solve problems without coding assistance tools",
      "📝 Whiteboard Thinking: Use the shared editor to demonstrate your approach",
      "⏰ Punctuality: Be on time and prepared for the scheduled session",
      "⚠️ Professional Conduct: Unprofessional behavior may lead to disqualification"
    ],
    instructions: [
      "Have your development environment ready (if required)",
      "Prepare to explain your past projects and experiences",
      "Be ready to solve problems on a virtual whiteboard",
      "Practice clear communication of technical concepts",
      "Review fundamental computer science concepts"
    ]
  },
  hr: {
    title: "HR Round: Professional Conduct Guidelines",
    warnings: [
      "🎥 Video Conference Etiquette: Maintain professional appearance and background",
      "🤝 Authentic Responses: Be genuine in your answers - do not memorize responses",
      "🚫 Misrepresentation: Do not falsify qualifications or experiences",
      "📞 No External Assistance: This is an individual assessment",
      "⏰ Respect Time: Join the meeting on time and be prepared",
      "👔 Professional Attire: Dress appropriately for the interview",
      "⚠️ Integrity Check: Any dishonesty will result in immediate rejection"
    ],
    instructions: [
      "Research the company and position beforehand",
      "Prepare examples of your achievements and experiences",
      "Think about your career goals and motivations",
      "Prepare thoughtful questions for the interviewer",
      "Practice professional communication skills"
    ]
  }
}

export default function StudentFinalAssessmentPage() {
  const { user } = useAuthContext()
  const token = user?.token
  const studentId = (user as any)?._id ?? (user as any)?.id ?? undefined
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  const templateId = 'default'
  // TEMP: disable starting assessment (enable later)
  //const ENABLE_START_BUTTON = false

  const [rounds, setRounds] = useState(initialRounds)
  const [activeRound, setActiveRound] = useState<RoundKey | null>(null)
  const [started, setStarted] = useState(false)
  const [statusChecked, setStatusChecked] = useState(false)
  const pollRef = useRef<number | null>(null)

  // TR status gate (so we don't flash HR start before we know TR status)
  const [trStatusChecked, setTrStatusChecked] = useState(false)
  const [hrStatusChecked, setHrStatusChecked] = useState(false)

  const [startCodeNow, setStartCodeNow] = useState(false)

  // ----- Review modal state -----
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewKind, setReviewKind] = useState<RoundKey | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<any | null>(null)

  // ----- Warning modal state -----
  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingRound, setPendingRound] = useState<RoundKey | null>(null)
  const [warningConfirmed, setWarningConfirmed] = useState(false)

  const labelFor = (k: RoundKey) => (rounds.find((r) => r.key === k)?.label) || k.toUpperCase()
  const coerceScore = (sub: any) => {
    const score = sub?.score ?? sub?.totalScore ?? sub?.marks ?? sub?.avgRating ?? null
    const max = sub?.maxScore ?? sub?.total ?? null
    return { score, max }
  }
  const coerceFeedback = (sub: any) => sub?.feedback ?? sub?.comments ?? sub?.notes ?? ''

  // Open warning modal before starting any round
  const handleStartWithWarning = (roundKey: RoundKey) => {
    setPendingRound(roundKey)
    setWarningOpen(true)
    setWarningConfirmed(false)
  }

  // Confirm and start the round after warning
  const handleConfirmStart = () => {
    if (!pendingRound) return

    setWarningOpen(false)
    setWarningConfirmed(true)

    // Update round status to in_progress
    setRounds((rs) => rs.map((r) => (r.key === pendingRound ? { ...r, status: IN_PROGRESS } : r)))
    setActiveRound(pendingRound)
    setStarted(true)

    // Special handling for code challenge
    if (pendingRound === 'code') {
      setStartCodeNow(true)
    }
  }

  const openReview = async (kind: RoundKey) => {
    if (!token) return

    setReviewKind(kind)
    setReviewOpen(true)
    setReviewLoading(true)
    setReviewError(null)
    setReviewData(null)

    try {
      /* -------- Submission API -------- */
      let url = ''
      switch (kind) {
        case 'quiz':
          url = `${API_BASE}/api/student/submission-status/${templateId}`
          break
        case 'code':
          url = `${API_BASE}/api/student/code-latest`
          break
        case 'tr':
          url = `${API_BASE}/api/tr/submission/latest`
          break
        case 'hr':
          url = `${API_BASE}/api/hr/submission/latest`
          break
      }

      let res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok && (kind === 'tr' || kind === 'hr')) {
        res = await fetch(`${API_BASE}/api/${kind}/status/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      if (!res.ok) throw new Error('Failed to load review')

      const data = await res.json()
      const submission = data?.submission ?? null

      const statusRaw =
        (submission?.status || data?.status || 'pending')
          .toString()
          .toLowerCase() as RoundStatus

      /* -------- Profile API (Admin Feedback) -------- */
      let latestProfileFeedback = null

      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (profileRes.ok) {
        const profileJson = await profileRes.json()
        const fb = Array.isArray(profileJson?.feedback)
          ? profileJson.feedback
          : []

        latestProfileFeedback = fb.length ? fb[fb.length - 1] : null
      }

      /* -------- Final State -------- */
      setReviewData({
        submission,
        status: statusRaw,
        feedback: coerceFeedback(submission),
        ...coerceScore(submission),
        answers: submission?.answers || null,
        profileFeedback: latestProfileFeedback,
      })
    } catch (e: any) {
      setReviewError(e?.message || 'Failed to load review')
    } finally {
      setReviewLoading(false)
    }
  }



  // ----- QUIZ STATUS -----
  const fetchQuizStatus = async () => {
    if (!token) {
      setStatusChecked(true)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/student/submission-status/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setStatusChecked(true)
        return
      }
      const data = await res.json()
      let quizNext: RoundStatus = READY
      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || '').toLowerCase()
        if (s === 'passed' || s === 'evaluated') quizNext = PASSED
        else if (s === 'failed') quizNext = FAILED
        else quizNext = PENDING
      }

      setRounds((prev) => deriveWithQuizStatus(prev, quizNext))

      if (quizNext === PENDING) startPolling()
      else stopPolling()
    } catch {
      // ignore
    } finally {
      setStatusChecked(true)
    }
  }

  const startPolling = () => {
    stopPolling()
    pollRef.current = window.setInterval(fetchQuizStatus, 15000) as unknown as number
  }
  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    ; (async () => {
      await fetchCodeLatest() // sets Code and may unlock TR → READY
      await fetchTRLatest() // sets TR to server status and may unlock HR
      await fetchHRLatest()
      await fetchQuizStatus()
    })()
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, templateId])

  // ----- CODE STATUS -----
  const fetchCodeLatest = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/student/code-latest`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || PENDING).toLowerCase()
        const codeNext: RoundStatus = s === 'passed' ? PASSED : s === 'failed' ? FAILED : PENDING

        // Update both Code and (conditionally) TR (to READY) based on Code
        setRounds((prev) => deriveWithCodeStatus(prev, codeNext))
      }
    } catch {
      /* ignore */
    }
  }

  // ----- TR STATUS (and HR unlock) -----
  const fetchTRLatest = async () => {
    if (!token) {
      setTrStatusChecked(true)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/tr/status/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        // ❌ DO NOT UNLOCK TR HERE
        return
      }

      const data = await res.json()

      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || 'pending').toLowerCase()

        const trNext: RoundStatus =
          s === 'passed' || s === 'evaluated'
            ? PASSED
            : s === 'failed'
              ? FAILED
              : PENDING

        // ✅ Only update TR status from server
        setRounds((prev) =>
          prev.map((r) =>
            r.key === 'tr' ? { ...r, status: trNext } : r
          )
        )
      }

      // ❌ REMOVE the "no submission → READY" block
    } catch {
      // ❌ Do NOT unlock TR here
    } finally {
      setTrStatusChecked(true)
    }
  }

  const fetchHRLatest = async () => {
    if (!token) {
      setHrStatusChecked(true)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/hr/status/latest`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || 'pending').toLowerCase()
        const hrNext: RoundStatus = s === 'passed' || s === 'evaluated' ? PASSED : s === 'failed' ? FAILED : PENDING
        setRounds((prev) => prev.map((r) => (r.key === 'hr' ? { ...r, status: hrNext } : r)))
      }
    } finally {
      setHrStatusChecked(true)
    }
  }

  // Quiz handlers
  const handleStartQuiz = () => {
    handleStartWithWarning('quiz')
  }

  const handleQuizClose = (submittedPending = true) => {
    setActiveRound(null)
    setStarted(false)
    setRounds((rs) => rs.map((r) => (r.key === 'quiz' ? { ...r, status: submittedPending ? PENDING : READY } : r)))
    fetchQuizStatus()
  }

  // Code: Start -> open modal
  const handleStartCode = () => {
    handleStartWithWarning('code')
  }

  // TR: Start -> open TR component
  const handleStartTR = () => {
    handleStartWithWarning('tr')
  }

  // HR: Start -> open HR component
  const handleStartHR = () => {
    handleStartWithWarning('hr')
  }

  // Code: Cancel -> let server decide status
  const handleCodeCancel = async () => {
    await fetchCodeLatest()
    setActiveRound(null)
    setStarted(false)
    setStartCodeNow(false)
  }

  // Code: Submitted -> pending then refresh
  const handleCodeSubmitted = () => {
    setRounds((rs) => rs.map((r) => (r.key === 'code' ? { ...r, status: PENDING } : r)))
    setActiveRound(null)
    setStarted(false)
    setStartCodeNow(false)
    fetchCodeLatest()
  }

  const quizRound = rounds.find((r) => r.key === 'quiz')!
  const codeRound = rounds.find((r) => r.key === 'code')!
  const trRound = rounds.find((r) => r.key === 'tr')!
  const hrRound = rounds.find((r) => r.key === 'hr')!

  /*   const canStart = (r: { key: RoundKey; status: RoundStatus }) =>
      ENABLE_START_BUTTON &&
      r.status === READY &&
      (r.key !== 'quiz' || statusChecked) &&
      (r.key !== 'tr' || trStatusChecked) &&
      (r.key !== 'hr' || hrStatusChecked) */

  const canStart = (r: { key: RoundKey; status: RoundStatus }) => {
    if (r.status !== READY) return false

    if (r.key === 'quiz') {
      return statusChecked
    }

    if (r.key === 'code') {
      const quiz = rounds.find((x) => x.key === 'quiz')
      return quiz?.status === PASSED
    }

    if (r.key === 'tr') {
      return trStatusChecked
    }

    if (r.key === 'hr') {
      return hrStatusChecked
    }

    return false
  }


  return (
    <>
      <PageMetaData title="Final Assessment" />

      <Card className="bg-transparent border rounded-4 p-4 mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-2">
          <h4 className="mb-0" style={{ color: '#ff7a00' }}>
            Final Assessment
          </h4>

          <Alert variant="danger" className="mb-0 py-2 px-3">
            <strong>⚠️ Important:</strong>{' '}
            Available exclusively in the <b>Premium Version</b>
          </Alert>
        </div>
        <p className="text-muted">
          You will go through four rounds. Each round unlocks only after the previous one is <strong>passed</strong>. After you submit the Quiz it
          will be marked <em>Pending evaluation</em> until the admin reviews it. Once the Quiz is <em>Passed</em>, the Code Challenge will
          automatically become <em>Ready</em>. When Code Challenge is <em>Passed</em>, the Technical Round (TR) will unlock.
        </p>

        <Alert
          style={{
            backgroundColor: 'rgba(255,122,0,0.08)',
            borderColor: '#ff7a00',
            color: '#ff7a00',
          }}
        >
          <strong>⚠️ Important:</strong> All rounds are monitored and recorded. Any violation of assessment rules will result in immediate disqualification.
          Please read all warnings carefully before starting each round.
        </Alert>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 420 }}>
            <ListGroup as="ol" numbered>
              {rounds.map((r, idx) => {
                const isQuiz = r.key === 'quiz'
                const startable = canStart(r)

                return (
                  <ListGroup.Item
                    as="li"
                    key={r.key}
                    className="d-flex justify-content-between align-items-start"
                    style={{
                      background:
                        r.status === LOCKED
                          ? 'rgba(255,255,255,0.02)'
                          : r.status === READY
                            ? 'rgba(255,122,0,0.06)'
                            : undefined,

                      borderLeft:
                        r.status === READY
                          ? '3px solid #ff7a00'     // 🟠 Ready → Orange
                          : r.status === PASSED
                            ? '3px solid #22c55e'   // 🟢 Passed → Green
                            : r.status === FAILED
                              ? '3px solid #dc3545' // 🔴 Failed → Red
                              : r.status === PENDING
                                ? '3px solid #ffb347' // 🟡 Pending → Soft orange
                                : '3px solid rgba(255,255,255,0.08)',

                      transition: 'all 0.25s ease',
                    }}>
                    <div className="ms-2 me-auto">
                      <div className="fw-semibold">{r.label}</div>
                      <div className="small text-muted">Round {idx + 1}</div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {statusBadge(r.status)}

                      {startable && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (r.key === 'quiz') handleStartQuiz()
                            else if (r.key === 'code') handleStartCode()
                            else if (r.key === 'tr') handleStartTR()
                            else if (r.key === 'hr') handleStartHR()
                          }}>
                          Start
                        </Button>
                      )}

                      {/* Checking gates */}
                      {isQuiz && r.status === READY && !statusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}
                      {r.key === 'tr' && r.status === READY && !trStatusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}
                      {r.key === 'hr' && r.status === READY && !hrStatusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}

                      {(r.status === PENDING || r.status === PASSED || r.status === FAILED) && (
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => openReview(r.key)}>
                          View
                        </Button>
                      )}

                      {!startable &&
                        !(isQuiz && !statusChecked && r.status === READY) &&
                        r.status !== PENDING &&
                        r.status !== PASSED &&
                        r.status !== FAILED && (
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: '#ff7a00',
                              borderColor: '#ff7a00',
                            }}
                          >
                            Start
                          </Button>
                        )}
                    </div>
                  </ListGroup.Item>
                )
              })}
            </ListGroup>
          </div>

          <div style={{ flex: 1 }}>
            <Card className="p-3">
              <h6>Round details</h6>
              <p className="text-muted small mb-2">
                <strong>Quiz:</strong> Records screen + webcam. After submit it becomes <em>Pending</em> until admin marks it.
              </p>
              <p className="text-muted small">
                <strong>Code Challenge:</strong> Unlocks after Quiz is <em>Passed</em>. Passing Code unlocks <strong>TR</strong>; passing TR unlocks{' '}
                <strong>HR</strong>.
              </p>

              <div className="mt-3">
                <strong>Current Quiz Status:</strong> <span className="ms-2">{statusBadge(quizRound.status)}</span>
              </div>
              <div className="mt-2">
                <strong>Current Code Status:</strong> <span className="ms-2">{statusBadge(codeRound.status)}</span>
              </div>
              <div className="mt-2">
                <strong>Current TR Status:</strong> <span className="ms-2">{statusBadge(trRound.status)}</span>
              </div>
              <div className="mt-2">
                <strong>Current HR Status:</strong> <span className="ms-2">{statusBadge(hrRound.status)}</span>
              </div>

              <Alert variant="danger" className="mt-3 small">
                <strong>🚫 Violation Policy:</strong> Cheating, plagiarism, or any form of misconduct will result in immediate failure and may lead to permanent ban from future assessments.
              </Alert>
            </Card>
          </div>
        </div>
      </Card>

      {/* Quiz modal */}
      {started && activeRound === 'quiz' && <StudentQuiz questionCount={20} onClose={() => handleQuizClose(true)} />}

      {/* Code challenge (modal-only; no preview in parent) */}
      {started && activeRound === 'code' && (
        <StudentCodeChallengeComponent
          baseURL={API_BASE}
          eventId="demoEventId" // replace with your real event id
          startOpen={startCodeNow}
          hidePreview
          onClose={handleCodeCancel}
          onSubmitted={handleCodeSubmitted}
          authToken={token}
          studentId={studentId}
        />
      )}

      {/* TR modal */}
      {started && activeRound === 'tr' && (
        <TechnicalRound
          baseURL={API_BASE}
          authToken={token}
          onClose={() => {
            setActiveRound(null)
            setStarted(false)
          }}
          onSubmitted={async () => {
            setRounds((rs) => rs.map((r) => (r.key === 'tr' ? { ...r, status: PENDING } : r)))
            setActiveRound(null)
            setStarted(false)
            await fetchTRLatest()
          }}
        />
      )}

      {/* HR modal */}
      {started && activeRound === 'hr' && (
        <HRRound
          baseURL={API_BASE}
          authToken={token}
          onClose={() => {
            setActiveRound(null)
            setStarted(false)
          }}
          onSubmitted={async () => {
            setRounds((rs) => rs.map((r) => (r.key === 'hr' ? { ...r, status: 'pending' as RoundStatus } : r)))
            setActiveRound(null)
            setStarted(false)
            // optional: await fetchHRLatest()
          }}
        />
      )}

      {/* ---------- Warning Modal ---------- */}
      <Modal show={warningOpen} onHide={() => setWarningOpen(false)} centered size="lg">
        <Modal.Header closeButton className="bg-warning bg-opacity-10">
          <Modal.Title>
            ⚠️ {pendingRound ? VIOLATION_WARNINGS[pendingRound].title : 'Important Warning'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {pendingRound && (
            <>
              <Alert variant="danger" className="mb-4">
                <h6 className="alert-heading">🚫 STRICT VIOLATION WARNINGS:</h6>
                <ul className="mb-0">
                  {VIOLATION_WARNINGS[pendingRound].warnings.map((warning, index) => (
                    <li key={index} className="small">{warning}</li>
                  ))}
                </ul>
              </Alert>

              <Card className="mb-3">
                <Card.Header className="bg-primary bg-opacity-10">
                  <strong>📋 Preparation Instructions:</strong>
                </Card.Header>
                <Card.Body>
                  <ul className="mb-0">
                    {VIOLATION_WARNINGS[pendingRound].instructions.map((instruction, index) => (
                      <li key={index} className="small">{instruction}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="warningConfirmation"
                  checked={warningConfirmed}
                  onChange={(e) => setWarningConfirmed(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="warningConfirmation">
                  <strong>I understand and agree to all the rules and warnings above.</strong> I confirm that I will not engage in any form of cheating or misconduct during this assessment.
                </label>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setWarningOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStart}
            disabled={!warningConfirmed}
            style={{
              backgroundColor: warningConfirmed ? '#ff7a00' : '#ccc',
              borderColor: warningConfirmed ? '#ff7a00' : '#ccc',
            }}
          >
            I Understand - Start Assessment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------- Review Modal ---------- */}
      <Modal show={reviewOpen} onHide={() => setReviewOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{reviewKind ? `${labelFor(reviewKind)} — Review` : 'Review'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {reviewLoading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Loading…</span>
            </div>
          )}

          {!reviewLoading && reviewError && <Alert variant="danger">{reviewError}</Alert>}

          {!reviewLoading && !reviewError && reviewData && (
            <>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <div className="text-muted small">Status</div>
                  {statusBadge((reviewData.status || 'pending') as RoundStatus)}
                </div>

                {(reviewData.score != null || reviewData.max != null) && (
                  <div className="text-end">
                    <div className="text-muted small">Score / Rating</div>
                    <div className="fw-semibold">
                      {reviewData.score != null ? reviewData.score : '--'}
                      {reviewData.max != null ? <> / {reviewData.max}</> : null}
                    </div>
                  </div>
                )}
              </div>

              {reviewData.feedback ? (
                <Card className="mb-3">
                  <Card.Body>
                    <div className="fw-semibold mb-1">Feedback</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{reviewData.feedback}</div>
                  </Card.Body>
                </Card>
              ) : (
                <div className="text-muted small mb-3">No general feedback provided.</div>
              )}

              {/* ---------- Latest Profile Feedback (ALWAYS VISIBLE) ---------- */}
              {reviewData.profileFeedback ? (
                <Card className="mb-3 border-primary">
                  <Card.Body>
                    <div className="fw-semibold mb-1">Admin Feedback</div>

                    {reviewData.profileFeedback.rating != null && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="text-muted small">Rating:</span>
                        <StarRating rating={reviewData.profileFeedback.rating} readOnly />
                        <span className="text-muted small">
                          ({reviewData.profileFeedback.rating}/5)
                        </span>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {reviewData.profileFeedback.text}
                    </div>

                    <div className="text-muted small mt-2">
                      {new Date(reviewData.profileFeedback.date).toLocaleString()}
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <div className="text-muted small mb-3">
                  No profile feedback provided yet.
                </div>
              )}

              {/* ---------- Per-question review (ONLY IF EXISTS) ---------- */}
              {Array.isArray(reviewData.answers) && reviewData.answers.length > 0 && (
                <>
                  <div className="fw-semibold mb-2">Per-question review</div>
                  <ListGroup variant="flush">
                    {reviewData.answers.map((a: any, i: number) => (
                      <ListGroup.Item key={a.qid || i} className="px-0">
                        <div className="fw-semibold mb-1">
                          Q{i + 1} {a.topic ? <span className="text-muted">· {a.topic}</span> : null}
                        </div>

                        {a.questionText && (
                          <div className="text-muted mb-1">{a.questionText}</div>
                        )}

                        <div className="small">
                          <span className="text-muted">Rating: </span>
                          <strong>{a.rating ?? '—'}</strong>
                        </div>

                        {a.feedback && (
                          <div className="small mt-1">
                            <span className="text-muted">Feedback: </span>
                            {a.feedback}
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}

            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReviewOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}