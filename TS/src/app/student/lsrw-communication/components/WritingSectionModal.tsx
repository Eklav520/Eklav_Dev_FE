import { useEffect, useState } from 'react'
import {
  FaPen, FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaQuoteRight, FaLink, FaEraser,
  FaArrowLeft, FaArrowRight, FaShieldAlt, FaPaperPlane, FaTimes,
  FaExclamationTriangle, FaVideoSlash,
} from 'react-icons/fa'
import { useGazeDetection } from '@/app/student/self-interview/components/useGazeDetection'
import GazeScanOverlay from '@/app/student/self-interview/components/GazeScanOverlay'
import { useProctorGuard } from '@/app/student/final-assessment/helper/useProctorGuard'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const PURPLE = '#7c3aed'
const TOTAL_QUESTIONS = 10
const MARKS_PER_TASK = 25
const MIN_WORDS = 250
const MAX_WORDS = 300

// Placeholder content only — no real topic bank exists for this round yet.
const TASKS = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
  number: i + 1,
  topics: i === 0
    ? [
        'Is work-from-home a productive and sustainable option for employees in the long run? Discuss.',
        'Do you think online education can replace traditional classroom learning? Explain your views.',
      ]
    : [`Placeholder topic ${2 * i + 1} — replace with a real prompt.`, `Placeholder topic ${2 * i + 2} — replace with a real prompt.`],
}))

type Props = { show: boolean; onClose: () => void }

const WritingSectionModal = ({ show, onClose }: Props) => {
  const [current, setCurrent] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState<Record<number, number>>({ 1: 0 })
  const [response, setResponse] = useState<Record<number, string>>({})

  // ── Camera + face/gaze proctoring — identical setup to the Listening,
  // Speaking and Reading sections (same reused hooks; real, live detection,
  // not fabricated; no backend persistence yet for this round).
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!show) {
      cameraStream?.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
      setCameraError(null)
      return
    }
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setCameraStream(null)
            setCameraError('Camera was closed or disconnected. Proctoring has stopped.')
          }
        })
        setCameraStream(stream)
      })
      .catch(() => { if (!cancelled) setCameraError('Camera access denied or unavailable.') })
    return () => {
      cancelled = true
      cameraStream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  useEffect(() => {
    if (videoEl && cameraStream) {
      videoEl.srcObject = cameraStream
      videoEl.play().catch(() => {})
    }
  }, [videoEl, cameraStream])

  const gaze = useGazeDetection(videoEl, !!cameraStream, false, { useExternalStream: true })
  const faceViolationCount = gaze.violationCount + gaze.headViolationCount + gaze.maskViolationCount + gaze.noFaceViolationCount

  const proctor = useProctorGuard(
    { maxViolations: 9999, enabled: show, captureFullscreenExit: false, autoReenterFullscreen: false, preventEscFullscreen: false },
    {}
  )
  useEffect(() => {
    if (show) proctor.arm()
    else proctor.disarm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const task = TASKS[current - 1]
  const text = response[current] ?? ''
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS) return
    setCurrent(n)
  }

  const pickTopic = (idx: number) => setSelectedTopic((prev) => ({ ...prev, [current]: idx }))
  const updateResponse = (val: string) => setResponse((prev) => ({ ...prev, [current]: val }))

  const saveAndNext = () => goTo(current + 1)

  const stateOf = (n: number): 'current' | 'completed' | 'notVisited' => {
    if (n === current) return 'current'
    const words = (response[n] ?? '').trim()
    if (words && words.split(/\s+/).length >= MIN_WORDS) return 'completed'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: PURPLE,    color: '#fff', border: PURPLE },
    completed:  { bg: '#22c55e', color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,   color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastTask = current === TOTAL_QUESTIONS

  if (!show) return null

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: PURPLE, fontWeight: 800, fontSize: 15 }}>Writing Task {current} / {TOTAL_QUESTIONS}</span>
                <span style={{ background: '#f5f3ff', color: PURPLE, border: '1px solid #ddd6fe', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{MARKS_PER_TASK} Marks</span>
              </div>
              <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 12px' }}>Choose ONE of the following topics and write your response.</p>

              {/* Topic choice cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {task.topics.map((topic, idx) => {
                  const selected = (selectedTopic[current] ?? 0) === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => pickTopic(idx)}
                      style={{
                        display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${selected ? PURPLE : PAGE_BORDER}`,
                        background: selected ? '#f5f3ff' : CARD_BG,
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: selected ? PURPLE : PAGE_BG, color: selected ? '#fff' : PAGE_GRAY,
                        border: `1px solid ${selected ? PURPLE : PAGE_BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: selected ? PURPLE : PAGE_GRAY, marginBottom: 3 }}>Topic {idx + 1}</div>
                        <div style={{ fontSize: 13, color: PAGE_TEXT, lineHeight: 1.5 }}>{topic}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: PAGE_TEXT }}>Write your response below.</span>
                <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>Word Limit: {MIN_WORDS} – {MAX_WORDS} words</span>
              </div>

              {/* Decorative editor toolbar — plain textarea underneath */}
              <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: '10px 10px 0 0', borderBottom: 'none', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG }}>
                <select style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 6, fontSize: 12, color: PAGE_GRAY, padding: '2px 6px', background: CARD_BG }}>
                  <option>Normal</option>
                </select>
                <div style={{ display: 'flex', gap: 10, color: PAGE_GRAY }}>
                  <FaBold size={12} /><FaItalic size={12} /><FaUnderline size={12} />
                  <FaListUl size={12} /><FaListOl size={12} /><FaQuoteRight size={12} /><FaLink size={12} /><FaEraser size={12} />
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => updateResponse(e.target.value)}
                placeholder="Start writing your answer here…"
                style={{
                  width: '100%', minHeight: 240, resize: 'vertical' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: '0 0 10px 10px',
                  padding: '12px 14px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none',
                }}
              />
              <div style={{ textAlign: 'right' as const, fontSize: 11.5, color: PAGE_GRAY, margin: '4px 0 0' }}>
                Word Count: {wordCount}
              </div>
            </div>

            {/* Prev / Save & Next / Submit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: current === 1 ? '#94a3b8' : PAGE_TEXT, cursor: current === 1 ? 'not-allowed' : 'pointer' }}
              >
                <FaArrowLeft size={11} /> Previous
              </button>
              {isLastTask ? (
                <button
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: PURPLE, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  <FaPaperPlane size={12} /> Submit Writing Section
                </button>
              ) : (
                <button
                  onClick={saveAndNext}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: PURPLE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Save & Next <FaArrowRight size={11} />
                </button>
              )}
            </div>

            {/* Live proctoring violations */}
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: '12px 20px', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FaExclamationTriangle size={12} color="#dc2626" />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: '#dc2626' }}>Proctoring — Live Violations</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {[
                  ['Tab Switches', proctor.violationCount],
                  ['Looking Away', gaze.violationCount],
                  ['Head Turned', gaze.headViolationCount],
                  ['Face Covered', gaze.maskViolationCount],
                  ['Face Not Visible', gaze.noFaceViolationCount],
                ].map(([label, count]) => (
                  <span key={label as string} style={{
                    background: (count as number) > 0 ? '#fee2e2' : CARD_BG,
                    border: `1px solid ${(count as number) > 0 ? '#fca5a5' : PAGE_BORDER}`,
                    color: (count as number) > 0 ? '#dc2626' : PAGE_GRAY,
                    borderRadius: 20, padding: '6px 10px', fontSize: 11.5, fontWeight: 700,
                    textAlign: 'center' as const,
                  }}>
                    {label}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FaPen size={13} color={PURPLE} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT }}>Writing Overview</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {TASKS.map((t) => {
                  const st = stateOf(t.number)
                  const s = paletteStyle[st]
                  return (
                    <button
                      key={t.number}
                      onClick={() => goTo(t.number)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${s.border}`,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {t.number}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px', fontSize: 11, color: PAGE_GRAY }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, display: 'inline-block' }} /> Not Visited</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: PURPLE, display: 'inline-block' }} /> In Progress</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Completed</span>
              </div>
            </div>

            {/* Camera / face proctoring preview — identical wiring AND sizing
                to the Listening, Speaking and Reading sections. Pinned to
                the bottom of the stretched sidebar column (margin-top: auto)
                so its bottom edge lines up with the main column's
                Proctoring — Live Violations panel, whatever the task count. */}
            <div style={{
              marginTop: 'auto', width: '100%',
              background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                <FaShieldAlt size={13} color={PURPLE} />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: PAGE_TEXT }}>Proctoring Camera</span>
              </div>
              {cameraError ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, padding: '20px 8px', color: PAGE_GRAY, fontSize: 11.5, textAlign: 'center' as const }}>
                  <FaVideoSlash size={20} />
                  {cameraError}
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#111' }}>
                  <video ref={setVideoEl} autoPlay muted playsInline style={{ width: '100%', display: 'block' }} />
                  {gaze.isReady && (
                    <GazeScanOverlay
                      landmarks={gaze.landmarks}
                      faceDetected={gaze.faceDetected}
                      direction={gaze.direction}
                      isLookingAway={gaze.isLookingAway}
                      violationCount={gaze.violationCount}
                      lookAwaySeconds={gaze.lookAwaySeconds}
                      headDirection={gaze.headDirection}
                      isHeadTurned={gaze.isHeadTurned}
                      headViolationCount={gaze.headViolationCount}
                      headAwaySeconds={gaze.headAwaySeconds}
                      maskDetected={gaze.maskDetected}
                      maskViolationCount={gaze.maskViolationCount}
                      maskAwaySeconds={gaze.maskAwaySeconds}
                      widen={1}
                    />
                  )}
                </div>
              )}
              {!cameraError && (
                <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 8, textAlign: 'center' as const }}>
                  {faceViolationCount > 0 ? `${faceViolationCount} face violation(s) detected` : 'Face tracking active'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WritingSectionModal
