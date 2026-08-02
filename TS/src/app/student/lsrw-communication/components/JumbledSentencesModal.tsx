import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaRandom, FaArrowLeft, FaArrowRight, FaCheckCircle, FaLightbulb, FaTimes, FaClock,
  FaTimesCircle, FaGraduationCap,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const ORANGE = '#ff7a00'
const DEFAULT_QUESTION_COUNT = 10
const DEFAULT_TIME_LIMIT_SEC = 60 // used only for placeholder slots with no admin-set time limit

type JumbledDbItem = { _id: string; parts: string[]; marks: number; timeLimit?: number }

const shuffle = (arr: string[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(((i + 7) * 2654435761) % (i + 1)) // deterministic pseudo-shuffle, stable per question
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Placeholder fallback — used only while no real admin-uploaded sentences
// have loaded yet (fetched from /api/student/lsrw-jumbled-content).
const PLACEHOLDER_SENTENCE = 'the / effective / use / of / time / is / very / important /.'

const buildQuestions = (dbItems: JumbledDbItem[]) => {
  const count = dbItems.length || DEFAULT_QUESTION_COUNT
  return Array.from({ length: count }, (_, i) => {
    const real = dbItems[i]
    const correct = real ? real.parts : PLACEHOLDER_SENTENCE.split(' / ')
    return {
      number: i + 1,
      itemId: real?._id,
      correct,
      shuffled: shuffle(correct),
      timeLimit: real?.timeLimit ?? DEFAULT_TIME_LIMIT_SEC,
    }
  })
}

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

type Props = { show: boolean; onClose: () => void; onSubmitted?: () => void; practiceMode?: boolean }

const JumbledSentencesModal = ({ show, onClose, onSubmitted, practiceMode }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [current, setCurrent] = useState(1)
  // Per question: the ordered list of indices (into q.shuffled) the student
  // has placed into the answer zone so far — NOT word strings, so duplicate
  // words in a sentence ("that that", "very very") are tracked correctly.
  const [placed, setPlaced] = useState<Record<number, number[]>>({})
  const [dragSource, setDragSource] = useState<{ zone: 'bank'; shuffledIdx: number } | { zone: 'placed'; pos: number } | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Real admin-uploaded sentences, when any exist — falls back to a
  // placeholder slot (see buildQuestions) for anything not yet uploaded.
  const [dbItems, setDbItems] = useState<JumbledDbItem[]>([])
  useEffect(() => {
    if (!show || !user?.token) return
    setShowResults(false)
    fetch(`${baseURL}/api/student/lsrw-jumbled-content`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setDbItems(data.items) })
      .catch(() => {})
  }, [show, user?.token, baseURL])

  const QUESTIONS = useMemo(() => buildQuestions(dbItems), [dbItems])
  const TOTAL_QUESTIONS = QUESTIONS.length
  const MARKS_TOTAL = dbItems.length ? dbItems.reduce((sum, i) => sum + i.marks, 0) : TOTAL_QUESTIONS

  const q = QUESTIONS[current - 1]
  const placedIdx = placed[current] ?? []
  const bankIdx = (q ? q.shuffled.map((_, i) => i) : []).filter((i) => !placedIdx.includes(i))

  // ── Per-question countdown — admin-set timeLimit per sentence. Reaching
  // zero auto-advances (same "time's up, move on" pattern as the recording
  // sections' countdown, just without a mic).
  const [secondsLeft, setSecondsLeft] = useState(q?.timeLimit ?? DEFAULT_TIME_LIMIT_SEC)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS) return
    setCurrent(n)
  }

  const nextQuestion = () => goTo(current + 1)

  useEffect(() => {
    if (!show || !q) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSecondsLeft(q.timeLimit)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (current < TOTAL_QUESTIONS) nextQuestion()
          else if (practiceMode) setShowResults(true)
          else { onSubmitted?.(); onClose() }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, current, q?.timeLimit])

  // Moves a word from the bank into the answer zone — at a specific
  // position if dropped/clicked onto an existing placed word, otherwise
  // appended to the end.
  const addToPlaced = (shuffledIdx: number, atPos?: number) => {
    setPlaced((prev) => {
      const cur = prev[current] ?? []
      if (cur.includes(shuffledIdx)) return prev
      const next = [...cur]
      if (atPos === undefined || atPos > next.length) next.push(shuffledIdx)
      else next.splice(atPos, 0, shuffledIdx)
      return { ...prev, [current]: next }
    })
  }

  // Sends a placed word back to the bank (click-to-remove).
  const removeFromPlaced = (pos: number) => {
    setPlaced((prev) => {
      const cur = [...(prev[current] ?? [])]
      cur.splice(pos, 1)
      return { ...prev, [current]: cur }
    })
  }

  const reorderPlaced = (from: number, to: number) => {
    setPlaced((prev) => {
      const cur = [...(prev[current] ?? [])]
      const [moved] = cur.splice(from, 1)
      cur.splice(to, 0, moved)
      return { ...prev, [current]: cur }
    })
  }

  // Drop target = an existing placed chip at position `pos` — reorders if
  // the drag started from the answer zone itself, or inserts if it came
  // from the word bank.
  const handleDropOnPlaced = (e: React.DragEvent, pos: number) => {
    e.preventDefault()
    if (!dragSource) return
    if (dragSource.zone === 'placed') {
      if (dragSource.pos !== pos) reorderPlaced(dragSource.pos, pos)
    } else {
      addToPlaced(dragSource.shuffledIdx, pos)
    }
    setDragSource(null)
  }

  // Drop target = the answer zone itself (not on any specific chip) —
  // appends a bank word to the end.
  const handleDropOnZone = (e: React.DragEvent) => {
    e.preventDefault()
    if (dragSource?.zone === 'bank') addToPlaced(dragSource.shuffledIdx)
    setDragSource(null)
  }

  const stateOf = (n: number): 'current' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    const p = placed[n]
    if (p !== undefined && p.length === QUESTIONS[n - 1]?.shuffled.length) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: ORANGE,     color: '#fff', border: ORANGE },
    answered:   { bg: '#22c55e',  color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,    color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastQuestion = current === TOTAL_QUESTIONS
  const timeCritical = secondsLeft <= 10

  if (!show || !q) return null

  if (showResults) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
        <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 820, margin: '0 auto', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaGraduationCap size={20} color={ORANGE} />
              <span style={{ fontSize: 19, fontWeight: 800, color: PAGE_TEXT }}>Practice Results — Jumbled Sentences</span>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FaTimes size={13} color={PAGE_GRAY} />
            </button>
          </div>
          <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 20px' }}>
            This was a practice attempt — nothing was saved or scored towards your real record.
          </p>
          {QUESTIONS.map((question, idx) => {
            const yourIdx = placed[question.number] ?? []
            const yourOrder = yourIdx.map((i) => question.shuffled[i])
            const correct = yourOrder.length === question.correct.length && yourOrder.join(' ') === question.correct.join(' ')
            return (
              <div key={question.number} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Question {idx + 1}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: correct ? '#16a34a' : '#dc2626' }}>
                    {correct ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                    {correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: 4 }}>
                  <strong>Your order:</strong> {yourOrder.length ? yourOrder.join(' ') : <em>(not attempted)</em>}
                </div>
                {!correct && (
                  <div style={{ fontSize: 12.5, color: '#16a34a' }}>
                    <strong>Correct order:</strong> {question.correct.join(' ')}
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={onClose}
            style={{ display: 'block', margin: '20px auto 0', background: ORANGE, border: 'none', borderRadius: 10, padding: '12px 30px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    // Full-page takeover — same pattern as the other LSRW sections and
    // Final Assessment's live exam rounds (a plain fixed div, not a
    // react-bootstrap Modal), so there's no backdrop/z-index stacking to fight.
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'fixed', top: 14, right: 20, zIndex: 1,
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <FaTimes size={13} color={PAGE_GRAY} />
      </button>
      <div style={{ padding: '56px 24px 20px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: 16 }}>Jumbled Sentences</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {practiceMode && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                      PRACTICE — not scored or saved
                    </span>
                  )}
                  <span style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{MARKS_TOTAL} Marks</span>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800,
                    background: timeCritical ? '#fef2f2' : '#fff7ed', color: timeCritical ? '#dc2626' : ORANGE,
                    border: `1px solid ${timeCritical ? '#fca5a5' : '#fed7aa'}`,
                  }}>
                    <FaClock size={11} /> {fmtTime(secondsLeft)}
                  </span>
                </div>
              </div>
              <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 12px' }}>Rearrange the given words / parts to form a meaningful and grammatically correct sentence.</p>

              <div style={{ color: ORANGE, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Question {current} / {TOTAL_QUESTIONS}</div>

              {/* Word bank — click or drag a word to add it to your answer below */}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: PAGE_GRAY, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>
                Word Bank — click or drag a word to add it
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14, minHeight: 40 }}>
                {bankIdx.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: PAGE_GRAY, fontStyle: 'italic' as const, padding: '9px 0' }}>All words placed below.</span>
                ) : (
                  bankIdx.map((shuffledIdx) => (
                    <div
                      key={shuffledIdx}
                      draggable
                      onClick={() => addToPlaced(shuffledIdx)}
                      onDragStart={(e) => {
                        setDragSource({ zone: 'bank', shuffledIdx })
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', String(shuffledIdx))
                      }}
                      onDragEnd={() => setDragSource(null)}
                      style={{
                        padding: '9px 16px', borderRadius: 8, border: `1.5px solid ${PAGE_BORDER}`,
                        background: CARD_BG, cursor: 'grab',
                        fontSize: 13.5, fontWeight: 600, color: PAGE_TEXT, userSelect: 'none' as const,
                      }}
                    >
                      {q.shuffled[shuffledIdx]}
                    </div>
                  ))
                )}
              </div>

              {/* Answer zone — click a placed word to remove it, drag to reorder */}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: PAGE_GRAY, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>
                Your Answer
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnZone}
                style={{
                  border: `2px dashed ${ORANGE}66`, borderRadius: 12, padding: '16px', marginBottom: 14,
                  background: '#fff7ed', display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', alignContent: 'center' as const, gap: 8, minHeight: 140,
                }}
              >
                {placedIdx.length === 0 ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6, color: ORANGE }}>
                    <FaRandom size={18} color={ORANGE} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>Click or drag the words above into the correct order</span>
                  </div>
                ) : (
                  placedIdx.map((shuffledIdx, pos) => (
                    <div
                      key={`${pos}-${shuffledIdx}`}
                      draggable
                      onClick={() => removeFromPlaced(pos)}
                      onDragStart={(e) => {
                        setDragSource({ zone: 'placed', pos })
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', String(pos))
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(e) => handleDropOnPlaced(e, pos)}
                      onDragEnd={() => setDragSource(null)}
                      title="Click to remove"
                      style={{
                        padding: '9px 16px', borderRadius: 8, border: `1.5px solid ${ORANGE}`,
                        background: dragSource?.zone === 'placed' && dragSource.pos === pos ? '#ffe4c7' : CARD_BG,
                        cursor: 'grab', fontSize: 13.5, fontWeight: 600, color: PAGE_TEXT, userSelect: 'none' as const,
                        opacity: dragSource?.zone === 'placed' && dragSource.pos === pos ? 0.6 : 1,
                      }}
                    >
                      {q.shuffled[shuffledIdx]}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 20px', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FaCheckCircle size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 13, color: ORANGE }}>Instructions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px' }}>
                {[
                  'Rearrange the parts to form a meaningful sentence.',
                  'Make sure to use proper punctuation.',
                  'The sentence should be grammatically correct.',
                  'Each question has its own time limit — time runs out automatically.',
                ].map((tip) => (
                  <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#1e293b' }}>
                    <FaCheckCircle size={11} color={ORANGE} style={{ marginTop: 2, flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: current === 1 ? '#94a3b8' : PAGE_TEXT, cursor: current === 1 ? 'not-allowed' : 'pointer' }}
              >
                <FaArrowLeft size={11} /> Previous
              </button>
              {isLastQuestion ? (
                <button
                  onClick={() => { if (practiceMode) { setShowResults(true); return } onSubmitted?.(); onClose() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  {practiceMode ? 'See Results' : 'Submit Section'} <FaArrowRight size={11} />
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Save & Next <FaArrowRight size={11} />
                </button>
              )}
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT, marginBottom: 14 }}>Question Navigator</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {QUESTIONS.map((qq) => {
                  const st = stateOf(qq.number)
                  const s = paletteStyle[st]
                  return (
                    <button
                      key={qq.number}
                      onClick={() => goTo(qq.number)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${s.border}`,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {qq.number}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px', fontSize: 11, color: PAGE_GRAY }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, display: 'inline-block' }} /> Not Visited</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: ORANGE, display: 'inline-block' }} /> In Progress</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Answered</span>
              </div>
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT, marginBottom: 10 }}>Section Details</div>
              {[
                ['Total Questions', String(TOTAL_QUESTIONS)],
                ['Total Marks', String(MARKS_TOTAL)],
                ['Time per Question', `${q.timeLimit} sec`],
                ['Negative Marking', 'No'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  <span style={{ color: PAGE_GRAY }}>{label}</span>
                  <span style={{ color: PAGE_TEXT, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FaLightbulb size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: ORANGE }}>Tips</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {[
                  'Read all parts carefully.',
                  'Identify the subject and the main verb.',
                  'Start with the part that makes the most sense.',
                  'Check punctuation at the end.',
                ].map((tip) => (
                  <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#1e293b' }}>
                    <FaCheckCircle size={11} color={ORANGE} style={{ marginTop: 2, flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JumbledSentencesModal
