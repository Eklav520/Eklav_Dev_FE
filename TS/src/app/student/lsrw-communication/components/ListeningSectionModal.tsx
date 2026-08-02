import { useEffect, useState } from 'react'
import {
  FaHeadphones, FaPlay, FaPause, FaVolumeUp, FaArrowLeft, FaArrowRight,
  FaShieldAlt, FaPaperPlane, FaExclamationTriangle, FaVideoSlash, FaTimes,
} from 'react-icons/fa'
import { useGazeDetection } from '@/app/student/self-interview/components/useGazeDetection'
import GazeScanOverlay from '@/app/student/self-interview/components/GazeScanOverlay'
import { useProctorGuard } from '@/app/student/final-assessment/helper/useProctorGuard'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const ORANGE = '#ff7a00'
const TOTAL_QUESTIONS = 15

// Placeholder content only — no real audio/question bank exists for this
// round yet. Question text/options are generic stand-ins for layout demo.
const QUESTIONS = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
  number: i + 1,
  prompt: i === 0
    ? 'What is the main idea of the passage?'
    : `Placeholder question ${i + 1} — replace with real listening content.`,
  options: i === 0
    ? ['The importance of time management', 'The benefits of morning exercise', 'The impact of technology on education', 'The need for a healthy lifestyle']
    : ['Option A', 'Option B', 'Option C', 'Option D'],
  audioLength: '01:12',
  marks: 1,
}))

type Props = { show: boolean; onClose: () => void }

const ListeningSectionModal = ({ show, onClose }: Props) => {
  const [current, setCurrent]   = useState(1)
  const [answers, setAnswers]   = useState<Record<number, number>>({})
  const [marked, setMarked]     = useState<Set<number>>(new Set())
  const [visited, setVisited]   = useState<Set<number>>(new Set([1]))
  const [playing, setPlaying]   = useState(false)

  // ── Camera + face/gaze proctoring (reused from /student/self-interview,
  // same detector the Final Assessment rounds use). Real, live detection —
  // not fabricated — but this round has no backend to persist violations
  // to yet, so counts are only displayed here, not submitted anywhere.
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
        // Fires if the OS/browser closes the camera out from under us —
        // physically unplugged, disabled in OS settings, permission revoked
        // mid-session, or handed to another app. Without this, the <video>
        // just freezes on the last frame and face tracking silently stops
        // reporting anything, with no indication why.
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

  // ── Tab-switch / window-blur proctoring — counted only, no lock/auto-submit
  // (this is a UI shell round, unlike the graded Final Assessment).
  const proctor = useProctorGuard(
    { maxViolations: 9999, enabled: show, captureFullscreenExit: false, autoReenterFullscreen: false, preventEscFullscreen: false },
    {}
  )
  useEffect(() => {
    if (show) proctor.arm()
    else proctor.disarm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const q = QUESTIONS[current - 1]

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS) return
    setVisited((prev) => new Set(prev).add(n))
    setCurrent(n)
    setPlaying(false)
  }

  const selectOption = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [current]: idx }))
  }

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(current)) next.delete(current)
      else next.add(current)
      return next
    })
  }

  const saveAndNext = () => goTo(current + 1)

  const stateOf = (n: number): 'current' | 'marked' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    if (marked.has(n)) return 'marked'
    if (answers[n] !== undefined) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: ORANGE,     color: '#fff', border: ORANGE },
    marked:     { bg: '#8b5cf6',  color: '#fff', border: '#8b5cf6' },
    answered:   { bg: '#22c55e',  color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,    color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastQuestion = current === TOTAL_QUESTIONS

  if (!show) return null

  return (
    // Full-page takeover — same pattern Final Assessment's live exam rounds
    // use (a plain fixed div, not a react-bootstrap Modal), so there's no
    // backdrop/z-index stacking to fight with the rest of the app's layout.
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
      <div style={{ padding: '54px 24px 28px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: 15 }}>Question {current} / {TOTAL_QUESTIONS}</span>
                <span style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{q.marks} Mark</span>
              </div>
              <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 16px' }}>Listen to the audio carefully and answer the question.</p>

              {/* Audio player (visual only — no real audio source) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: ORANGE, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  {playing ? <FaPause size={12} color="#fff" /> : <FaPlay size={12} color="#fff" style={{ marginLeft: 2 }} />}
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: PAGE_TEXT, flexShrink: 0 }}>Audio Clip</span>
                <div style={{ flex: 1, height: 5, borderRadius: 4, background: PAGE_BORDER, overflow: 'hidden' }}>
                  <div style={{ width: playing ? '35%' : '0%', height: '100%', background: ORANGE, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: PAGE_GRAY, flexShrink: 0 }}>00:00 / {q.audioLength}</span>
                <FaVolumeUp size={14} color={PAGE_GRAY} style={{ flexShrink: 0 }} />
              </div>

              <div style={{ fontWeight: 700, fontSize: 14.5, color: PAGE_TEXT, marginBottom: 14 }}>{q.prompt}</div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 16 }}>
                {q.options.map((opt, idx) => {
                  const selected = answers[current] === idx
                  return (
                    <label
                      key={idx}
                      onClick={() => selectOption(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        border: `1.5px solid ${selected ? ORANGE : PAGE_BORDER}`, borderRadius: 10,
                        background: selected ? '#fff7ed' : CARD_BG, cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? ORANGE : PAGE_BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ORANGE }} />}
                      </span>
                      <span style={{ fontSize: 13.5, color: PAGE_TEXT }}>
                        <strong style={{ marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</strong>{opt}
                      </span>
                    </label>
                  )
                })}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: PAGE_TEXT, cursor: 'pointer' }}>
                <input type="checkbox" checked={marked.has(current)} onChange={toggleMark} style={{ accentColor: '#8b5cf6' }} />
                Mark for Review
              </label>
            </div>

            {/* Prev / Save & Next */}
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
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  <FaPaperPlane size={12} /> Submit Listening Section
                </button>
              ) : (
                <button
                  onClick={saveAndNext}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Save & Next <FaArrowRight size={11} />
                </button>
              )}
            </div>

            {/* Live proctoring violations */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '16px 20px', marginTop: 20 }}>
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
                <FaHeadphones size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT }}>Listening Overview</span>
              </div>
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
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Answered</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#8b5cf6', display: 'inline-block' }} /> Marked</span>
              </div>
            </div>

            {/* Camera / face proctoring preview — real live detection, reused
                from the self-interview + final-assessment proctor. Pinned to
                the bottom of the sidebar column (margin-top: auto) so its
                position never shifts as the question palette above grows —
                and the stretched grid row keeps this column's bottom edge
                level with the main column's (Proctoring — Live Violations
                panel), whatever the question count. */}
            <div style={{
              marginTop: 'auto', width: '100%',
              background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                <FaShieldAlt size={13} color={ORANGE} />
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

export default ListeningSectionModal
