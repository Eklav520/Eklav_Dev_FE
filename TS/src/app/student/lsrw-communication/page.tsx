import { Fragment, useEffect, useState } from 'react'
import { Modal, Spinner } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import {
  FaShieldAlt, FaTimes, FaExclamationCircle, FaCheckCircle, FaArrowLeft, FaClock, FaLock, FaTrophy, FaChevronRight,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import ListeningReadingSectionModal from './components/ListeningReadingSectionModal'
import ReadingSectionModal from './components/ReadingSectionModal'
import SpeakingSectionModal from './components/SpeakingSectionModal'
import JumbledSentencesModal from './components/JumbledSentencesModal'
import StoryTellingModal from './components/StoryTellingModal'
import GrammarSectionModal from './components/GrammarSectionModal'
import PatternSelectionScreen from './components/PatternSelectionScreen'
import { PATTERN_SECTIONS } from './sectionsConfig'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const TIME_PER_SECTION_MIN = 15
const PASSING_PCT = 80

type SectionStatus = 'pending' | 'attempted' | 'graded'
type SectionResult = { sectionKey: string; label: string; marks: number; scoreAwarded: number | null; status: SectionStatus; completedAt: string | null }
type Attempt = {
  // null until the student completes their first section — selecting a
  // pattern only previews it, nothing is persisted to the DB yet.
  _id: string | null; patternKey: 1 | 2; sections: SectionResult[]; currentSectionIndex: number
  totalMarks: number; totalScoreAwarded: number; status: 'in_progress' | 'completed'
  startedAt: string; completedAt: string | null
}

type InstructionTab = 'general' | string | 'notes'

const LSRWCommunicationRound = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // A Pattern is ONE sequential exam attempt — picking it starts/resumes an
  // attempt on the backend and the student moves through its sections
  // strictly in order (see sectionsConfig.ts PATTERN_SECTIONS).
  const [pattern, setPattern] = useState<1 | 2 | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [loadingAttempt, setLoadingAttempt] = useState(false)
  // Real (non-practice) pattern attempts are capped at 30/month — surfaced
  // from /lsrw-pattern/start's 403 so the selection screen can show it as a
  // banner instead of silently doing nothing when a student hits the cap.
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const [showInstructions, setShowInstructions] = useState(false)
  const [activeTab, setActiveTab] = useState<InstructionTab>('general')

  const [showListeningReading, setShowListeningReading] = useState(false)
  const [showSpeaking, setShowSpeaking] = useState(false)
  const [showPassages, setShowPassages] = useState(false)
  const [showJumbled, setShowJumbled] = useState(false)
  const [showStoryTelling, setShowStoryTelling] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)

  // Practice Mode — a student can jump straight into any section from the
  // Pattern Selection screen (pattern still null, no real attempt exists)
  // for an ungraded, unpersisted run-through. Set only while that section's
  // modal is open in practice mode; the modals themselves skip calling
  // onSubmitted when practiceMode is true, so completeSection never fires.
  const [practiceSectionKey, setPracticeSectionKey] = useState<string | null>(null)

  // Marks/time shown per section aren't fixed — they're the sum of whatever
  // question pool the admin has actually configured (count × each item's own
  // marks/timeLimit, which can differ per item). Fetched once per pattern
  // from the same student-facing content endpoints the section modals use.
  const [sectionTotals, setSectionTotals] = useState<Record<string, { marks: number; timeSec: number }>>({})

  useEffect(() => {
    if (!user?.token || pattern === null) return
    let cancelled = false
    const headers = { Authorization: `Bearer ${user.token}` }

    const sumMarksTime = (items: { marks?: number; timeLimit?: number }[]) => ({
      marks: items.reduce((sum, i) => sum + (i.marks || 0), 0),
      timeSec: items.reduce((sum, i) => sum + (i.timeLimit || 0), 0),
    })

    const fetchers: Record<string, () => Promise<{ marks: number; timeSec: number }>> = {
      listeningReading: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-content`, { headers }).then((res) => res.json())
        return r.success ? sumMarksTime(r.items) : { marks: 0, timeSec: 0 }
      },
      speaking: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-speaking-content`, { headers }).then((res) => res.json())
        return r.success ? sumMarksTime(r.items) : { marks: 0, timeSec: 0 }
      },
      grammar: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-grammar-content`, { headers }).then((res) => res.json())
        return r.success ? sumMarksTime(r.items) : { marks: 0, timeSec: 0 }
      },
      jumbled: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-jumbled-content`, { headers }).then((res) => res.json())
        return r.success ? sumMarksTime(r.items) : { marks: 0, timeSec: 0 }
      },
      passages: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-passage-content`, { headers }).then((res) => res.json())
        if (!r.success) return { marks: 0, timeSec: 0 }
        const questions = (r.items as { questions: { marks?: number; timeLimit?: number }[] }[]).flatMap((p) => p.questions)
        return sumMarksTime(questions)
      },
      storytelling: async () => {
        const r = await fetch(`${baseURL}/api/student/lsrw-storytelling-content`, { headers }).then((res) => res.json())
        if (!r.success) return { marks: 0, timeSec: 0 }
        return sumMarksTime(r.items)
      },
    }

    ;(async () => {
      const keys = PATTERN_SECTIONS[pattern].map((s) => s.key)
      const results = await Promise.all(keys.map((k) => fetchers[k]?.() ?? Promise.resolve({ marks: 0, timeSec: 0 })))
      if (cancelled) return
      const totals: Record<string, { marks: number; timeSec: number }> = {}
      keys.forEach((k, idx) => { totals[k] = results[idx] })
      setSectionTotals(totals)
    })()

    return () => { cancelled = true }
  }, [pattern, user?.token, baseURL])

  const sectionMarks = (key: string, fallback: number) => sectionTotals[key]?.marks || fallback

  const sectionTimeLabel = (key: string, fallbackMin: number) => {
    const sec = sectionTotals[key]?.timeSec
    if (!sec) return `${fallbackMin} min`
    if (sec < 60) return `${sec} sec`
    const mins = sec / 60
    return `${Number.isInteger(mins) ? mins : mins.toFixed(1)} min`
  }

  const openSection: Record<string, () => void> = {
    listeningReading: () => setShowListeningReading(true),
    speaking: () => setShowSpeaking(true),
    passages: () => setShowPassages(true),
    jumbled: () => setShowJumbled(true),
    storytelling: () => setShowStoryTelling(true),
    grammar: () => setShowGrammar(true),
  }

  const startAttempt = async (p: 1 | 2) => {
    if (!user?.token) return
    setLoadingAttempt(true)
    try {
      const res = await fetch(`${baseURL}/api/student/lsrw-pattern/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ patternKey: p }),
      })
      const data = await res.json()
      if (data.success) {
        setAttempt(data.attempt)
        setPattern(p)
      } else if (data.limitReached) {
        setLimitMessage(data.message || `You've used all 30 pattern attempts for this month. Try again next month.`)
      }
    } catch { /* leave attempt null — the loading guard below keeps the UI safe */ }
    finally { setLoadingAttempt(false) }
  }

  const handleSelectPattern = (p: 1 | 2) => {
    setLimitMessage(null)
    startAttempt(p)
  }

  const handlePracticeSection = (sectionKey: string) => {
    setPracticeSectionKey(sectionKey)
    openSection[sectionKey]?.()
  }

  const backToPatterns = () => {
    setPattern(null)
    setAttempt(null)
  }

  const completeSection = async (sectionKey: string, scoreAwarded?: number, submissionId?: string, marks?: number) => {
    if (!attempt || !user?.token) return
    try {
      // No real attempt yet (draft only) — this call creates it on the
      // backend, lazily, from patternKey; once it exists, later calls use
      // the id-bearing URL as before.
      const url = attempt._id
        ? `${baseURL}/api/student/lsrw-pattern/${attempt._id}/section/${sectionKey}`
        : `${baseURL}/api/student/lsrw-pattern/section/${sectionKey}`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ scoreAwarded, patternKey: pattern, submissionId, marks }),
      })
      const data = await res.json()
      if (data.success) setAttempt(data.attempt)
    } catch { /* the student's already moved past the modal — nothing to roll back visually */ }
  }

  const sectionDefs = pattern === null ? [] : PATTERN_SECTIONS[pattern]

  const NAV_ITEMS: { key: InstructionTab; label: string; sub: string; icon: any; color: string }[] = [
    { key: 'general', label: 'General Instructions', sub: 'Rules for the entire exam', icon: FaShieldAlt, color: '#ea580c' },
    ...sectionDefs.map((s) => ({ key: s.key, label: s.label, sub: `${s.label} rules`, icon: s.icon, color: s.color })),
    { key: 'notes', label: 'Important Notes', sub: 'Must know information', icon: FaExclamationCircle, color: '#ea580c' },
  ]

  const GENERAL_INSTRUCTIONS = pattern === null ? [] : [
    `Pattern ${pattern} consists of ${sectionDefs.length} sections: ${sectionDefs.map((s) => s.label).join(', ')}.`,
    'Sections must be completed strictly in this order — you cannot skip ahead.',
    'Once a section is started, the timer cannot be paused.',
    'Do not refresh or leave the page during the round.',
    'Ensure you have a stable internet connection.',
    'Use headphones for the best audio experience.',
    'Your progress is auto-saved after every section.',
    'Any malpractice may lead to disqualification.',
  ]

  // Practice Mode needs the six section modals reachable even while
  // pattern === null (no real attempt exists yet) — so the main content is
  // computed via this helper instead of early-returning, keeping the modals
  // at the bottom of the component's single return always mounted.
  const renderMain = () => {
    if (pattern === null) {
      return (
        <PatternSelectionScreen
          onSelect={handleSelectPattern}
          onPracticeSection={handlePracticeSection}
          starting={loadingAttempt}
          limitMessage={limitMessage}
          onDismissLimitMessage={() => setLimitMessage(null)}
        />
      )
    }

    if (loadingAttempt || !attempt) {
      return (
        <div style={{ background: PAGE_BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" style={{ color: '#ff7a00' }} />
        </div>
      )
    }

    const isComplete = attempt.status === 'completed'
    const currentIndex = attempt.currentSectionIndex
    const doneCount = attempt.sections.filter((s) => s.status !== 'pending').length
    const progressPct = Math.round((doneCount / attempt.sections.length) * 100)

    return (
      <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

        {/* ── Header + Stats — combined into one compact bar ──────── */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '12px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10, marginBottom: 10 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: PAGE_TEXT, margin: '0 0 2px' }}>LSRW Communication Skills — Pattern {pattern}</h2>
              <p style={{ color: PAGE_GRAY, fontSize: 12, margin: 0 }}>Complete all {sectionDefs.length} sections in order to finish this exam</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <button
                onClick={backToPatterns}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, color: PAGE_TEXT, borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                <FaArrowLeft size={11} /> Back
              </button>
              <button
                onClick={() => { setActiveTab('general'); setShowInstructions(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff7ed', border: '1px solid #fed7aa', color: '#ea580c', borderRadius: 8, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                <FaShieldAlt size={11} /> Instructions
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16, borderTop: `1px solid ${PAGE_BORDER}`, paddingTop: 10 }}>
          {[
            { label: 'Exam', value: `Pattern ${pattern}` },
            { label: 'Total Sections', value: String(sectionDefs.length) },
            { label: 'Total Marks', value: String(attempt.totalMarks) },
            { label: 'Passing Marks', value: `${Math.round(attempt.totalMarks * PASSING_PCT / 100)} (${PASSING_PCT}%)` },
            { label: 'Your Score', value: isComplete ? `${attempt.totalScoreAwarded} / ${attempt.totalMarks}` : '--' },
            { label: 'Status', value: isComplete ? 'Completed' : 'In Progress', color: isComplete ? '#16a34a' : '#ea580c' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color || PAGE_TEXT }}>{s.value}</div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              border: `3px solid ${progressPct === 100 ? '#22c55e' : PAGE_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: PAGE_TEXT, flexShrink: 0,
            }}>
              {progressPct}%
            </div>
            <div style={{ fontSize: 10, color: PAGE_GRAY }}>Overall<br />Progress</div>
          </div>
          </div>
        </div>

        {/* ── Section Stepper ────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', marginBottom: 24, overflowX: 'auto' as const,
          background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '14px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          {sectionDefs.map((s, idx) => {
            const result = attempt.sections[idx]
            const done = result.status !== 'pending'
            const isCurrent = idx === currentIndex && !isComplete
            const active = done || isCurrent
            return (
              <Fragment key={s.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
                  <div style={{
                    position: 'relative', width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: active ? s.bg : PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <s.icon size={16} color={active ? s.color : PAGE_GRAY} />
                    {done && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderRadius: '50%', background: '#22c55e', border: `2px solid ${CARD_BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCheckCircle size={9} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isCurrent ? s.color : active ? PAGE_TEXT : PAGE_GRAY, whiteSpace: 'nowrap' as const }}>{s.label}</div>
                    <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>{sectionMarks(s.key, s.marks)} Marks</div>
                  </div>
                </div>
                {idx < sectionDefs.length - 1 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24 }}>
                    <FaChevronRight size={13} color={PAGE_GRAY} />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        {/* ── Current Section / Completion Summary ───────── */}
        {isComplete ? (
          <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 28, textAlign: 'center' as const }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <FaTrophy size={26} color="#16a34a" />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: 18, color: PAGE_TEXT, margin: '0 0 4px' }}>Pattern {pattern} Complete!</h4>
            <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 20px' }}>
              You scored <strong style={{ color: PAGE_TEXT }}>{attempt.totalScoreAwarded} / {attempt.totalMarks}</strong> across graded sections.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20, textAlign: 'left' as const }}>
              {sectionDefs.map((s, idx) => {
                const result = attempt.sections[idx]
                return (
                  <div key={s.key} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.icon size={13} color={s.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: PAGE_TEXT }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                        {result.status === 'graded' ? `${result.scoreAwarded} / ${sectionMarks(s.key, s.marks)} marks` : 'Attempted — pending grading'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={backToPatterns}
              style={{ background: '#ff7a00', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Patterns
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 20, marginBottom: 28, alignItems: 'start' }}>
            {/* Current section card */}
            {(() => {
              const s = sectionDefs[currentIndex]
              return (
                <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, gap: 10 }}>
                  <span style={{ alignSelf: 'flex-start', background: s.bg, color: s.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    Section {currentIndex + 1} of {sectionDefs.length}
                  </span>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                    <s.icon size={26} color={s.color} />
                  </div>
                  <h5 style={{ fontWeight: 700, fontSize: 15, color: PAGE_TEXT, margin: 0 }}>{s.label}</h5>
                  <p style={{ color: PAGE_GRAY, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '4px 0' }}>
                    <div style={{ textAlign: 'left' as const }}>
                      <div style={{ fontSize: 10, color: PAGE_GRAY }}>Marks</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{sectionMarks(s.key, s.marks)}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: 10, color: PAGE_GRAY }}>Time</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: PAGE_TEXT, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FaClock size={10} /> {sectionTimeLabel(s.key, TIME_PER_SECTION_MIN)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={openSection[s.key]}
                    style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px solid ${s.color}`, background: s.color, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Start Section
                  </button>
                </div>
              )
            })()}

            {/* Completed + upcoming sections list */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {sectionDefs.map((s, idx) => {
                if (idx === currentIndex) return null
                const result = attempt.sections[idx]
                const done = result.status !== 'pending'
                return (
                  <div key={s.key} style={{
                    background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, opacity: done ? 1 : 0.55,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {done ? <FaCheckCircle size={14} color="#22c55e" /> : <FaLock size={12} color={PAGE_GRAY} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: PAGE_TEXT }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                        {done
                          ? (result.status === 'graded' ? `${result.scoreAwarded} / ${sectionMarks(s.key, s.marks)} marks` : 'Attempted — pending grading')
                          : 'Locked — complete earlier sections first'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                      background: done ? '#f0fdf4' : PAGE_BG, color: done ? '#16a34a' : PAGE_GRAY,
                      border: `1px solid ${done ? '#86efac' : PAGE_BORDER}`,
                    }}>
                      {done ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Instructions Panel ─────────────────────────── */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FaShieldAlt size={14} color="#ea580c" />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#ea580c' }}>Important Instructions</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px' }}>
            {[
              'Sections must be completed strictly in order for this Pattern.',
              'Ensure a quiet environment for Listening and Speaking.',
              'Do not refresh or leave the round in between.',
              'Your progress is auto-saved after every section.',
            ].map((tip) => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: PAGE_TEXT }}>
                <span style={{ color: '#22c55e', marginTop: 1 }}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageMetaData title="LSRW Communication Skills" />
      {renderMain()}

      {/* ── Instructions Modal ──────────────────────────── */}
      <Modal show={showInstructions} onHide={() => setShowInstructions(false)} size="xl" centered contentClassName="border-0" dialogClassName="lsrw-instructions-modal">
        <div style={{ background: CARD_BG, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaShieldAlt size={16} color="#ea580c" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: PAGE_TEXT }}>Pattern {pattern} — Instructions</div>
                <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginTop: 2 }}>Please read all instructions carefully before you begin.</div>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <FaTimes size={13} color={PAGE_GRAY} />
            </button>
          </div>

          <div style={{ display: 'flex', minHeight: 480 }}>
            <div style={{ width: 220, borderRight: `1px solid ${PAGE_BORDER}`, padding: '16px 10px', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '0 10px', marginBottom: 8 }}>Instructions Overview</div>
              {NAV_ITEMS.map(({ key, label, sub, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    width: '100%', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 10, border: 'none', marginBottom: 4, cursor: 'pointer',
                    background: activeTab === key ? '#fff7ed' : 'transparent',
                  }}
                >
                  <Icon size={14} color={activeTab === key ? color : PAGE_GRAY} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: activeTab === key ? color : PAGE_TEXT }}>{label}</div>
                    <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>{sub}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ flex: 1, padding: '20px 24px' }}>
              {activeTab === 'general' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <FaShieldAlt size={14} color="#ea580c" />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#ea580c' }}>General Instructions</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px 24px', marginBottom: 22 }}>
                    {GENERAL_INSTRUCTIONS.map((item) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: PAGE_TEXT }}>
                        <FaCheckCircle size={12} color="#ea580c" style={{ marginTop: 2, flexShrink: 0 }} />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                    {sectionDefs.map((section) => (
                      <div key={section.key} style={{ background: section.bg, border: `1px solid ${section.color}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <section.icon size={13} color={section.color} />
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: section.color }}>{section.label} Section</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                          {section.rules.map((r) => <li key={r} style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{r}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <FaExclamationCircle size={13} color="#ea580c" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#1e293b' }}>
                      <strong>Note:</strong> Make sure you are in a quiet environment for Speaking and Listening sections.
                    </span>
                  </div>
                </>
              )}

              {activeTab !== 'general' && activeTab !== 'notes' && (() => {
                const section = sectionDefs.find((s) => s.key === activeTab)
                if (!section) return null
                return (
                  <div style={{ background: section.bg, border: `1px solid ${section.color}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <section.icon size={13} color={section.color} />
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: section.color }}>{section.label} Section</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                      {section.rules.map((r) => <li key={r} style={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{r}</li>)}
                    </ul>
                  </div>
                )
              })()}

              {activeTab === 'notes' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <FaExclamationCircle size={14} color="#ea580c" />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#ea580c' }}>Important Notes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {[
                      'Make sure you are in a quiet environment for Speaking and Listening sections.',
                      'Once a section is started, the timer cannot be paused.',
                      'Do not refresh or leave the page during the round.',
                      'Your progress is auto-saved after every section.',
                      'Any malpractice may lead to disqualification.',
                    ].map((n) => (
                      <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#1e293b', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px' }}>
                        <FaExclamationCircle size={12} color="#ea580c" style={{ marginTop: 2, flexShrink: 0 }} />
                        {n}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ListeningReadingSectionModal
        show={showListeningReading}
        onClose={() => { setShowListeningReading(false); if (practiceSectionKey === 'listeningReading') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('listeningReading', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'listeningReading'}
      />
      <SpeakingSectionModal
        show={showSpeaking}
        onClose={() => { setShowSpeaking(false); if (practiceSectionKey === 'speaking') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('speaking', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'speaking'}
      />
      <ReadingSectionModal
        show={showPassages}
        onClose={() => { setShowPassages(false); if (practiceSectionKey === 'passages') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('passages', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'passages'}
      />
      <JumbledSentencesModal
        show={showJumbled}
        onClose={() => { setShowJumbled(false); if (practiceSectionKey === 'jumbled') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('jumbled', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'jumbled'}
      />
      <StoryTellingModal
        show={showStoryTelling}
        onClose={() => { setShowStoryTelling(false); if (practiceSectionKey === 'storytelling') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('storytelling', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'storytelling'}
      />
      <GrammarSectionModal
        show={showGrammar}
        onClose={() => { setShowGrammar(false); if (practiceSectionKey === 'grammar') setPracticeSectionKey(null) }}
        onSubmitted={(result) => completeSection('grammar', result?.scoreAwarded, result?.submissionId, result?.totalMarks)}
        practiceMode={practiceSectionKey === 'grammar'}
      />
    </>
  )
}

export default LSRWCommunicationRound
