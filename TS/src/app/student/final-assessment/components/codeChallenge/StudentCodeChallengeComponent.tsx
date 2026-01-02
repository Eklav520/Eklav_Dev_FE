// StudentCodeChallengeComponent.tsx
import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useRef, useState } from 'react'

/**
 * Behavior:
 * - No preview/description in parent when `hidePreview` is true.
 * - Parent can auto-open the modal via `startOpen`.
 * - Calls `onSubmitted` after successful submit (so parent can set "evaluation pending").
 * - Calls `onClose` when the modal is closed/cancelled.
 * - HARD GATE: challenge only starts if screen recording is granted & starts successfully.
 * - Violation detection: tab switching, new tab opening, fullscreen exit
 * - Auto-submit after 2 violations
 *
 * NOTE (iframes): if this runs inside an <iframe>, ensure:
 * <iframe allow="camera; microphone; display-capture; fullscreen" allowfullscreen ... />
 */

// --- types ---
type TestCase = {
  _id: string
  input: string
  expectedOutput: string
  points?: number
  matchType?: string
}

type TestSpec = {
  type?: string
  entry?: string
  command?: string
  timeoutSeconds?: number
  positiveTests?: TestCase[]
  negativeTests?: TestCase[]
}

type Challenge = {
  _id: string
  eventId?: string
  title: string
  slug?: string
  description: string
  timeLimitSeconds?: number
  maxScore?: number
  testSpec?: TestSpec
  createdAt?: string
  updatedAt?: string
}

type TestCaseResult = {
  name: string
  passed: boolean
  stdout: string
  expected?: string
  actual?: string
}

type JudgeResult = {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  tests: TestCaseResult[]
}

type Language = { id: string; name: string }
type WebcamPosition = { right: number; bottom: number }

// --- constants ---
const LANGUAGES: Language[] = [
  { id: 'javascript', name: 'JavaScript (Node)' },
  { id: 'python', name: 'Python 3' },
  { id: 'java', name: 'Java 11' },
  { id: 'cpp', name: 'C++ (g++)' },
]

// --- utils: capability checks ---
function isCanvasCaptureSupported() {
  return typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
}
function isMediaRecorderSupported() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window
}

// --- simple challenge loader hook ---
function useChallengeLoader(baseURL: string, eventId: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${baseURL}/api/events/${eventId}/codechallenges`)
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
        const arr: Challenge[] = await res.json()
        if (!mounted) return
        if (arr && arr.length > 0) setChallenge(arr[Math.floor(Math.random() * arr.length)])
        else
          setChallenge({
            _id: 'demo-1',
            title: 'Demo challenge',
            description: 'Write a function that reverses a string.',
            timeLimitSeconds: 15 * 60,
          })
      } catch (e) {
        console.warn('fetch failed', e)
        if (!mounted) return
        setChallenge({
          _id: 'demo-1',
          title: 'Demo challenge',
          description: 'Write a function that reverses a string.',
          timeLimitSeconds: 15 * 60,
        })
      }
    })()
    return () => {
      mounted = false
    }
  }, [baseURL, eventId])
  return { challenge }
}

// --- recording hook ---
function useScreenRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const camVideoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const stopRecordingAndCleanup = () => {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') mr.stop()
    } catch {}
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    try {
      combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    combinedStreamRef.current = null

    try {
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        ;(screenVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
        screenVideoRef.current.srcObject = null
      }
    } catch {}

    try {
      if (camVideoRef.current && camVideoRef.current.srcObject) {
        ;(camVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
        camVideoRef.current.srcObject = null
      }
    } catch {}

    try {
      if (audioContextRef.current) audioContextRef.current.close()
    } catch {}
    audioContextRef.current = null
    recordedChunksRef.current = []
    mediaRecorderRef.current = null
  }

  // Promise version: waits for final chunk after .stop()
  const stopRecordingAndGetBlob = async (): Promise<Blob | null> => {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          try {
            mr.onstop = () => resolve()
            mr.stop()
          } catch {
            resolve()
          }
        })
      }
      const chunks = recordedChunksRef.current.slice()
      stopRecordingAndCleanup()
      if (!chunks || chunks.length === 0) return null
      return new Blob(chunks, { type: 'video/webm' })
    } catch (err) {
      console.error(err)
      stopRecordingAndCleanup()
      return null
    }
  }

  return {
    mediaRecorderRef,
    recordedChunksRef,
    combinedStreamRef,
    screenVideoRef,
    camVideoRef,
    animationFrameRef,
    audioContextRef,
    stopRecordingAndCleanup,
    stopRecordingAndGetBlob,
  }
}

// --- violation detection hook ---
function useViolationDetection(maxViolations: number = 2, onMaxViolations: () => void) {
  const [violations, setViolations] = useState(0)
  const [showViolationAlert, setShowViolationAlert] = useState(false)
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!showViolationAlert) return

    // Hide violation alert after 3 seconds
    violationTimeoutRef.current = setTimeout(() => {
      setShowViolationAlert(false)
    }, 3000)

    return () => {
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current)
      }
    }
  }, [showViolationAlert])

  const addViolation = (reason: string) => {
    console.warn(`Violation detected: ${reason}`)
    const newViolations = violations + 1
    setViolations(newViolations)
    setShowViolationAlert(true)

    if (newViolations >= maxViolations) {
      onMaxViolations()
    }
  }

  const resetViolations = () => {
    setViolations(0)
    setShowViolationAlert(false)
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current)
      violationTimeoutRef.current = null
    }
  }

  return {
    violations,
    showViolationAlert,
    addViolation,
    resetViolations,
  }
}

// helper: unescape common sequences like "\n", "\t", "\r\n"
function unescapeText(s: unknown): string {
  if (s == null) return ''
  const str = String(s)
  return str
    .replace(/\\\\/g, '\\')
    .replace(/\\r\\n/g, '\r\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
}

// small helper for date formatting (currently unused but kept)
function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(String(iso)).toLocaleString()
  } catch {
    return String(iso)
  }
}

/* ---------- Violation Alert Component ---------- */
const ViolationAlert: React.FC<{ show: boolean; violations: number; maxViolations: number }> = ({ show, violations, maxViolations }) => {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(255, 107, 107, 0.4)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: '600',
        backdropFilter: 'blur(10px)',
        animation: 'shake 0.5s ease-in-out',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <span>Violation Detected!</span>
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        {violations >= maxViolations
          ? 'Maximum violations reached! Submitting automatically...'
          : `Violation ${violations}/${maxViolations} - Stay in fullscreen mode and do not switch tabs.`}
      </div>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            25% { transform: translateX(-50%) translateY(-5px); }
            50% { transform: translateX(-50%) translateY(5px); }
            75% { transform: translateX(-50%) translateY(-5px); }
          }
        `}
      </style>
    </div>
  )
}

/* ---------- Left pane description ---------- */
const ChallengeDescription: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const desc = String(challenge?.description ?? '').replace(/\\n/g, '\n')
  return (
    <div style={{ padding: 20, background: 'linear-gradient(180deg,#071125,#081827)', color: '#e6eef8', overflow: 'auto' }}>
      <h3 style={{ color: '#93c5fd', marginTop: 0, marginBottom: 10, fontSize: 18 }}>{challenge.title}</h3>
      <div style={{ fontSize: 13, color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{desc}</div>
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
        }}>
        <ul style={{ marginTop: 10, paddingLeft: 18, color: '#cbd5e1' }}>
          <li>
            Screen sharing & recording is <strong>required</strong> to start.
          </li>
          <li>
            Use the editor to write your solution, then <em>Run tests</em>.
          </li>
          <li>
            You can press <em>Final Submit</em> at any time. Passing all tests is recommended but not required.
          </li>
          <li style={{ color: '#f87171' }}>
            <strong>Warning:</strong> Do not switch tabs or open new windows. Violations will result in auto-submission.
          </li>
        </ul>
      </div>
    </div>
  )
}

const LanguageSelector: React.FC<{ language: string; onLanguageChange: (l: string) => void }> = ({ language, onLanguageChange }) => (
  <div style={{ marginTop: 16, padding: 20 }}>
    <label style={{ display: 'block', marginBottom: 8, color: '#cbd5e1' }}>Select Language</label>
    <select
      value={language}
      onChange={(e) => onLanguageChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: 6,
        background: '#071122',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
      {LANGUAGES.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  </div>
)

const CodeEditor: React.FC<{
  code: string
  onCodeChange: (c: string) => void
  timeLeft: number | null
  onRunTests: () => void
  onSubmit: () => void
  onCancel: () => void
  allPassed: boolean
  isRunning: boolean
}> = ({ code, onCodeChange, timeLeft, onRunTests, onSubmit, onCancel, allPassed, isRunning }) => {
  return (
    <div
      style={{
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#e6eef8' }}>🧾 Write Your Code</div>
        <div style={{ color: '#bfcbd8', fontSize: 13 }}>
          Time left:{' '}
          {timeLeft === null
            ? '--:--'
            : `${Math.floor(timeLeft / 60)
                .toString()
                .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(16,24,32,0.9)',
          }}>
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="// Write your solution here"
            style={{
              width: '100%',
              height: '100%',
              minHeight: 500,
              padding: 16,
              border: 'none',
              outline: 'none',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
              fontSize: 14,
              color: '#e6eef8',
              background: 'transparent',
              resize: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onRunTests}
            disabled={isRunning}
            style={{ padding: '10px 14px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8 }}>
            {isRunning ? 'Running...' : 'Run tests'}
          </button>

          <button
            onClick={onSubmit}
            disabled={isRunning}
            title="Submit to admin (you can submit even if tests fail or you didn't run tests)"
            style={{
              padding: '10px 14px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}>
            Final Submit
          </button>

          <button
            onClick={onCancel}
            disabled={isRunning}
            style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', color: '#e6eef8', border: 'none', borderRadius: 8 }}>
            Cancel
          </button>
        </div>

        <div style={{ color: '#9fb1c8', fontSize: 13 }}>{allPassed ? 'All tests passed ✅' : 'No results / tests pending'}</div>
      </div>
    </div>
  )
}

const DraggableWebcam: React.FC<{
  camPreviewRef: React.RefObject<HTMLVideoElement>
  position: WebcamPosition
  onDragStart: (e: React.MouseEvent) => void
}> = ({ camPreviewRef, position, onDragStart }) => (
  <div style={{ position: 'absolute', right: position.right, bottom: position.bottom, touchAction: 'none', zIndex: 30 }}>
    <video
      ref={camPreviewRef}
      playsInline
      muted
      autoPlay
      onCanPlay={() => camPreviewRef.current?.play().catch(() => {})}
      onMouseDown={onDragStart}
      style={{
        width: 180,
        height: 135,
        borderRadius: 8,
        border: '3px solid rgba(255,255,255,0.9)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
        cursor: 'grab',
        background: '#000',
      }}
    />
  </div>
)

/* ---------- Optional preview panel (used only when hidePreview=false) ---------- */
const ChallengePanel: React.FC<{
  challenge: Challenge
  openModalAndStart: () => void
  onRunSample: (input: string, name?: string) => void
}> = ({ challenge, openModalAndStart, onRunSample }) => {
  const spec = challenge.testSpec

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>{challenge.title}</h3>
          <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {unescapeText(challenge.description)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <button
            onClick={openModalAndStart}
            style={{
              padding: '8px 14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(37,99,235,0.12)',
              cursor: 'pointer',
            }}>
            Start Challenge
          </button>

          <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: 12 }}>
            <div>
              Time limit: <strong style={{ color: '#cbd5e1' }}>{challenge.timeLimitSeconds ? `${challenge.timeLimitSeconds}s` : '—'}</strong>
            </div>
            <div style={{ marginTop: 6 }}>
              Max score: <strong style={{ color: '#cbd5e1' }}>{String(challenge.maxScore ?? '—')}</strong>
            </div>
          </div>
        </div>
      </div>

      {spec && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 10,
            padding: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005))',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#cfe1ff' }}>Test Spec</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>{spec.type ?? '—'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {Array.isArray(spec.positiveTests) && spec.positiveTests.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 8, fontWeight: 700 }}>Positive Tests</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {spec.positiveTests.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            points: <strong style={{ color: '#cbd5e1' }}>{t.points ?? '—'}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Input:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#0b1116',
                            color: '#dbeafe',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.input)}
                        </pre>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Expected:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#071221',
                            color: '#86efac',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.expectedOutput)}
                        </pre>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 110 }}>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(unescapeText(t.input)).catch(() => {})
                          }}
                          title="Copy input"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#0ea5e9',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Copy Input
                        </button>

                        <button
                          onClick={() => onRunSample(String(t.input), `positive-${t._id}`)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#2563eb',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Run Sample
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(spec.negativeTests) && spec.negativeTests.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 8, fontWeight: 700 }}>Negative Tests</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {spec.negativeTests.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            points: <strong style={{ color: '#cbd5e1' }}>{t.points ?? '—'}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Input:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#0b1116',
                            color: '#ffdcdc',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.input)}
                        </pre>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Expected:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#071221',
                            color: '#ffb4b4',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.expectedOutput)}
                        </pre>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 110 }}>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(unescapeText(t.input)).catch(() => {})
                          }}
                          title="Copy input"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Copy Input
                        </button>

                        <button
                          onClick={() => onRunSample(String(t.input), `negative-${t._id}`)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#b91c1c',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Run Sample
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- OutputPanel ---------- */
const OutputPanel: React.FC<{
  statusMessage: string | null
  runningResult: JudgeResult | null
  showRawJson: boolean
  onToggleRawJson: () => void
  challenge: Challenge
  onRunSample: (input: string, name?: string) => Promise<void>
  onRunAllTests: () => Promise<void>
  isRunning: boolean
}> = ({ statusMessage, runningResult, showRawJson, onToggleRawJson, challenge, onRunSample, onRunAllTests, isRunning }) => {
  const total = runningResult?.tests?.length ?? 0
  const passed = runningResult?.tests?.filter((t) => t.passed).length ?? 0

  const renderTestCases = () => {
    if (!runningResult || !runningResult.tests || runningResult.tests.length === 0) {
      return null
    }

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Test Results</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {runningResult.tests.map((test, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                borderRadius: 8,
                background: test.passed ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                border: `1px solid ${test.passed ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: test.passed ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: 'white',
                    }}>
                    {test.passed ? '✓' : '✗'}
                  </div>
                  <span style={{ fontWeight: 600, color: test.passed ? '#10b981' : '#ef4444' }}>{test.name || `Test ${index + 1}`}</span>
                </div>

                {challenge.testSpec && (
                  <button
                    onClick={() => {
                      const allTests = [...(challenge.testSpec?.positiveTests ?? []), ...(challenge.testSpec?.negativeTests ?? [])]
                      const testCase = allTests[index]
                      if (testCase) {
                        onRunSample(testCase.input, test.name || `test-${index}`)
                        return
                      }
                      onRunSample('', test.name || `test-${index}`)
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      cursor: 'pointer',
                    }}>
                    Run This Test
                  </button>
                )}
              </div>

              {test.stdout && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.3)',
                      padding: 8,
                      borderRadius: 4,
                      fontSize: 12,
                      margin: 0,
                    }}>
                    {test.stdout}
                  </pre>
                </div>
              )}

              {!test.passed && test.expected && test.actual && (
                <div style={{ fontSize: 12 }}>
                  <div style={{ color: '#9ca3af', marginBottom: 4 }}>Expected:</div>
                  <div style={{ color: '#10b981', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.expected}</div>

                  <div style={{ color: '#9ca3af', marginBottom: 4, marginTop: 8 }}>Actual:</div>
                  <div style={{ color: '#ef4444', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.actual}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSampleTestsFromChallenge = () => {
    const spec = challenge.testSpec
    if (!spec) return null

    const pos: TestCase[] = Array.isArray(spec.positiveTests) ? spec.positiveTests : []
    const neg: TestCase[] = Array.isArray(spec.negativeTests) ? spec.negativeTests : []

    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Sample Tests</div>
          <button
            onClick={onRunAllTests}
            disabled={isRunning}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              borderRadius: 6,
              background: '#06b6d4',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}>
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        {pos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#93c5fd', marginBottom: 12, fontWeight: 600 }}>Positive Tests (Should Pass)</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {pos.map((t, i) => (
                <div
                  key={`p-${i}`}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          padding: 8,
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                        {String(t.input).replace(/\\n/g, '\n')}
                      </pre>
                    </div>
                    <button
                      onClick={() => onRunSample(String(t.input), `positive-${i}`)}
                      disabled={isRunning}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: 'none',
                        background: '#0ea5e9',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      Run Test
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Expected Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      padding: 8,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#10b981',
                    }}>
                    {String(t.expectedOutput)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {neg.length > 0 && (
          <div>
            <div style={{ fontSize: 14, color: '#fca5a5', marginBottom: 12, fontWeight: 600 }}>Negative Tests (Should Fail)</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {neg.map((t, i) => (
                <div
                  key={`n-${i}`}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          padding: 8,
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                        {String(t.input).replace(/\\n/g, '\n')}
                      </pre>
                    </div>
                    <button
                      onClick={() => onRunSample(String(t.input), `negative-${i}`)}
                      disabled={isRunning}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: 'none',
                        background: '#ef4444',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      Run Test
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Expected Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      padding: 8,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#ef4444',
                    }}>
                    {String(t.expectedOutput)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMainOutput = () => {
    if (!runningResult) {
      return <div style={{ color: '#94a3af', textAlign: 'center', padding: 20 }}>No output yet — run tests to see results</div>
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Execution Output</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  navigator.clipboard.writeText(runningResult.stdout || '').catch(() => window.alert('Could not copy to clipboard'))
                } else {
                  try {
                    window.prompt('Copy output', runningResult.stdout || '')
                  } catch {}
                }
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                cursor: 'pointer',
              }}>
              Copy Output
            </button>
            <button
              onClick={onToggleRawJson}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#6b7280',
                color: '#fff',
                cursor: 'pointer',
              }}>
              {showRawJson ? 'Hide JSON' : 'View JSON'}
            </button>
          </div>
        </div>

        {!showRawJson ? (
          <>
            {runningResult.stdout && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>Standard Output:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0,0,0,0.3)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}>
                  {runningResult.stdout || '(empty)'}
                </pre>
              </div>
            )}

            {runningResult.stderr && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#fb7185', marginBottom: 8 }}>Standard Error:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(239,68,68,0.06)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 200,
                    overflow: 'auto',
                    color: '#fca5a5',
                  }}>
                  {runningResult.stderr}
                </pre>
              </div>
            )}

            <div
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                marginBottom: 16,
              }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Exit Code:</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{runningResult.exitCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Status:</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: runningResult.success ? '#10b981' : '#ef4444' }}>
                    {runningResult.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                  Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            <pre
              style={{
                maxHeight: 300,
                overflow: 'auto',
                background: 'rgba(0,0,0,0.5)',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
              }}>
              {JSON.stringify(runningResult, null, 2)}
            </pre>
          </div>
        )}

        {renderTestCases()}
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        background: 'linear-gradient(180deg,#071122,#081122)',
        color: '#e6eef8',
        overflow: 'auto',
        height: '100%',
      }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#c7d2fe' }}>📥 Output & Results</div>
        {statusMessage && (
          <div
            style={{
              color: '#9ca3af',
              padding: 8,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6,
              marginTop: 8,
              fontSize: 14,
            }}>
            {statusMessage}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
        {renderMainOutput()}
      </div>

      {renderSampleTestsFromChallenge()}
    </div>
  )
}

/* ---------- Main component ---------- */
export default function StudentCodeChallengeComponent({
  baseURL = (import.meta && (import.meta as any).env?.VITE_API_BASE_URL) || '',
  eventId = 'demoEventId',
  startOpen = false,
  hidePreview = false,
  onClose,
  onSubmitted,
  onChallengeResolved,
  authToken,
  studentId,
}: {
  baseURL?: string
  eventId?: string
  startOpen?: boolean
  hidePreview?: boolean
  onClose?: () => void
  onSubmitted?: (cid?: string) => void
  onChallengeResolved?: (cid: string) => void
  authToken?: string
  studentId?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuthContext()
  const { challenge } = useChallengeLoader(baseURL, eventId)

  const [modalOpen, setModalOpen] = useState(false)
  const [language, setLanguage] = useState(LANGUAGES[0].id)
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const [runningResult, setRunningResult] = useState<JudgeResult | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // webcam drag state
  const [dragging, setDragging] = useState(false)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [camPos, setCamPos] = useState<WebcamPosition>({ right: 20, bottom: 20 })
  const modalRef = useRef<HTMLDivElement | null>(null)
  const camPreviewRef = useRef<HTMLVideoElement | null>(null)

  // recording
  const {
    mediaRecorderRef,
    recordedChunksRef,
    combinedStreamRef,
    screenVideoRef,
    camVideoRef,
    animationFrameRef,
    audioContextRef,
    stopRecordingAndCleanup,
    stopRecordingAndGetBlob,
  } = useScreenRecorder()

  // violation detection
  const { violations, showViolationAlert, addViolation, resetViolations } = useViolationDetection(2, () => {
    // Auto-submit when max violations reached
    setStatusMessage('Maximum violations reached! Auto-submitting...')
    handleFinalSubmit(true)
  })

  // Timer
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0 && !autoSubmitting) {
      setAutoSubmitting(true)
      handleFinalSubmit(true)
      return
    }
    const id = window.setTimeout(() => setTimeLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, autoSubmitting])

  // ensure cleanup when modal closes
  useEffect(() => {
    if (!modalOpen) {
      try {
        stopRecordingAndCleanup()
        resetViolations()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen])

  // Violation detection: tab switching, visibility change, fullscreen exit
  useEffect(() => {
    if (!modalOpen) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Tab switched or minimized')
      }
    }

    const handleBlur = () => {
      // Check if blur was caused by switching tabs/windows
      setTimeout(() => {
        if (!document.hasFocus()) {
          addViolation('Window/tab lost focus')
        }
      }, 100)
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation('Fullscreen mode exited')
        // Try to re-enter fullscreen
        enterFullscreen()
      }
    }

    // Listen for keyboard shortcuts that might open new tabs
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+T (new tab), Ctrl+N (new window), etc.
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'n' || e.key === 'Tab')) {
        e.preventDefault()
        addViolation('Attempted to open new tab/window')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen, addViolation])

  // Enter fullscreen function
  const enterFullscreen = async () => {
    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen()
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen error:', err)
    }
  }

  // Exit fullscreen function
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err)
    }
  }

  // Modal-first, then try to start capture; revert if denied
  async function openModalAndStart() {
    if (!challenge) return

    // First start screen sharing
    const ok = await startScreenAndCamRecording()
    if (!ok) {
      setStatusMessage('Screen share permission is required to start the challenge.')
      return
    }

    // Then open modal and enter fullscreen
    setModalOpen(true)
    setTimeLeft(challenge.timeLimitSeconds ?? 30 * 60)
    setCamPos({ right: 20, bottom: 20 })
    resetViolations()

    // Enter fullscreen after a short delay to ensure modal is rendered
    setTimeout(() => {
      enterFullscreen()
    }, 500)
  }

  // auto-open when parent asks (also gated)
  useEffect(() => {
    if (startOpen && challenge && !modalOpen) {
      openModalAndStart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOpen, challenge])

  function closeModalAndCleanup() {
    try {
      stopRecordingAndCleanup()
      exitFullscreen()
      resetViolations()
    } catch {}
    setModalOpen(false)
    onClose?.()
  }

  // --- recording with canvas PiP + robust fallback ---
  async function startScreenAndCamRecording(): Promise<boolean> {
    try {
      // Webcam first (preview only; audio off to avoid extra prompt)
      let camStream: MediaStream | null = null
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'user' } },
          audio: false,
        })
        const previewEl = camPreviewRef.current
        if (previewEl && camStream) {
          previewEl.srcObject = camStream
          previewEl.muted = true
          previewEl.playsInline = true
          previewEl.autoplay = true
          previewEl.onloadedmetadata = () => previewEl.play().catch(() => {})
        }
        if (!camStream.getVideoTracks().length) camStream = null
      } catch (camErr) {
        console.warn('Camera not available:', camErr)
        camStream = null
      }

      // Screen (system/tab audio allowed; may return none)
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: true,
      })

      // Detect environments that struggle with canvas mixing
      const canCanvas = isCanvasCaptureSupported()
      const canRecord = isMediaRecorderSupported()
      const UA = navigator.userAgent.toLowerCase()
      const isSafari = UA.includes('safari') && !UA.includes('chrome') && !UA.includes('chromium')
      const forceFallback = false

      if (forceFallback) {
        // === Fallback: record raw screen (+ optional cam) directly ===
        const direct = new MediaStream()
        screenStream.getTracks().forEach((t: MediaStreamTrack) => direct.addTrack(t))
        if (camStream) camStream.getVideoTracks().forEach((t) => direct.addTrack(t))

        let opts: MediaRecorderOptions = {}
        if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9,opus')) opts.mimeType = 'video/webm;codecs=vp9,opus'
        else if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp8,opus')) opts.mimeType = 'video/webm;codecs=vp8,opus'
        else opts.mimeType = 'video/webm'

        const mr = new MediaRecorder(direct, opts)
        mediaRecorderRef.current = mr
        combinedStreamRef.current = direct
        recordedChunksRef.current = []
        mr.ondataavailable = (e) => e.data && e.data.size && recordedChunksRef.current.push(e.data)
        mr.start(1000)

        // End gracefully if share stops
        screenStream.getVideoTracks().forEach((t: any) => {
          t.onended = () => {
            setStatusMessage('Screen share ended.')
            stopRecordingAndCleanup()
            setModalOpen(false)
          }
        })

        return true
      }

      // === Preferred: canvas PiP mix ===
      let screenVideo = screenVideoRef.current
      if (!screenVideo) {
        screenVideo = document.createElement('video')
        screenVideo.autoplay = true
        screenVideo.muted = true
        screenVideo.playsInline = true
        screenVideoRef.current = screenVideo
      }
      screenVideo.srcObject = screenStream

      let camVideo = camVideoRef.current
      if (!camVideo) {
        camVideo = document.createElement('video')
        camVideo.autoplay = true
        camVideo.muted = true
        camVideo.playsInline = true
        camVideoRef.current = camVideo
      }
      if (camStream) camVideo.srcObject = camStream

      // Wait for metadata
      await Promise.all([
        new Promise<void>((resolve) => {
          if (!screenVideo) return resolve()
          if (screenVideo.readyState >= 1) return resolve()
          const onMeta = () => {
            screenVideo!.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          screenVideo.addEventListener('loadedmetadata', onMeta)
          setTimeout(resolve, 800)
        }),
        new Promise<void>((resolve) => {
          if (!camVideo || !camStream) return resolve()
          if (camVideo.readyState >= 1) return resolve()
          const onMeta = () => {
            camVideo.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          camVideo.addEventListener('loadedmetadata', onMeta)
          setTimeout(resolve, 800)
        }),
      ]).catch(() => {})

      const dpr = window.devicePixelRatio || 1
      const vw = screenVideo?.videoWidth || 1280
      const vh = screenVideo?.videoHeight || 720
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(vw * dpr))
      canvas.height = Math.max(1, Math.floor(vh * dpr))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        screenStream.getTracks().forEach((t: any) => t.stop())
        camStream?.getTracks().forEach((t) => t.stop())
        setStatusMessage('Canvas not available; cannot start recording.')
        return false
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const draw = () => {
        try {
          // draw screen first
          if (screenVideo?.videoWidth) {
            ctx.drawImage(screenVideo, 0, 0, canvas.width / dpr, canvas.height / dpr)
          } else {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
          }
        } catch {
          ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        }

        // ✅ overlay webcam in bottom-right
        if (camStream && camVideo?.videoWidth) {
          const pipW = Math.floor((canvas.width / dpr) * 0.22)
          const pipH = Math.floor((camVideo.videoHeight / camVideo.videoWidth) * pipW) || Math.floor(pipW * 0.75)
          const margin = 12
          const x = canvas.width / dpr - pipW - margin
          const y = canvas.height / dpr - pipH - margin

          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.fillRect(x - 3, y - 3, pipW + 6, pipH + 6)

          try {
            ctx.drawImage(camVideo, x, y, pipW, pipH)
          } catch (err) {
            console.warn('Failed to draw cam frame:', err)
          }
        }

        animationFrameRef.current = requestAnimationFrame(draw)
      }
      draw()

      const canvasStream = (canvas as HTMLCanvasElement).captureStream(20)
      const out = new MediaStream()
      canvasStream.getVideoTracks().forEach((t) => out.addTrack(t))
      const screenAudio = screenStream.getAudioTracks()[0]
      if (screenAudio) out.addTrack(screenAudio)

      combinedStreamRef.current = out
      recordedChunksRef.current = []

      let options: MediaRecorderOptions = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) options.mimeType = 'video/webm;codecs=vp9,opus'
      else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) options.mimeType = 'video/webm;codecs=vp8,opus'
      else options.mimeType = 'video/webm'
      const mr = new MediaRecorder(out, options)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => e.data && e.data.size && recordedChunksRef.current.push(e.data)
      mr.start(1000)

      Promise.resolve(screenVideo?.play()).catch(() => {})
      if (camStream) Promise.resolve(camVideo?.play()).catch(() => {})

      screenStream.getVideoTracks().forEach((t: any) => {
        t.onended = () => {
          setStatusMessage('Screen share ended.')
          stopRecordingAndCleanup()
          setModalOpen(false)
        }
      })

      if (camStream) {
        setTimeout(() => {
          const w = camVideo?.videoWidth || 0
          const h = camVideo?.videoHeight || 0
          if (!w || !h) {
            console.warn('Webcam stream active but 0x0; likely blocked by browser/iframe policy.')
            setStatusMessage('Webcam preview unavailable — check browser permissions / iframe allow list.')
          }
        }, 1200)
      }

      return true
    } catch (err) {
      console.error('start capture failed', err)
      setStatusMessage('Screen share & camera required (triggered by a click; HTTPS/localhost needed).')
      return false
    }
  }

  // --- utility: check all tests passed ---
  function allTestsPassed(r: JudgeResult | null) {
    if (!r || !Array.isArray(r.tests) || r.tests.length === 0) return false
    return r.tests.every((t) => t.passed === true)
  }

  async function runAllTests() {
    setStatusMessage('Running all tests...')
    setRunningResult(null)
    setShowRawJson(false)
    setIsRunning(true)

    try {
      const payload: any = { language, code, challengeId: challenge?._id }
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        setStatusMessage(`Judge returned ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
        setRunningResult(null)
        setIsRunning(false)
        return
      }

      const text = await res.text()
      try {
        const parsed = JSON.parse(text) as JudgeResult
        if (!parsed.tests) parsed.tests = []
        setRunningResult(parsed)
        const passed = parsed.tests.filter((t) => t.passed).length
        setStatusMessage(passed === parsed.tests.length ? 'All tests passed' : `Some tests failed (${passed}/${parsed.tests.length})`)
      } catch {
        setRunningResult({ success: res.ok, stdout: text, stderr: '', exitCode: res.ok ? 0 : 1, tests: [] })
        setStatusMessage('Judge produced unstructured output')
      }
    } catch (err: any) {
      console.error('Network/runAllTests error:', err)
      setStatusMessage(`Network error: ${err?.message ?? err}. Check API URL / CORS / server.`)
      setRunningResult(null)
    } finally {
      setIsRunning(false)
    }
  }

  // --- Run a single sample
  async function runSingleSample(input: string, name?: string) {
    setStatusMessage(`Running sample${name ? ` (${name})` : ''}...`)
    setRunningResult(null)
    setShowRawJson(false)
    setIsRunning(true)
    try {
      const payload: any = { language, code, challengeId: challenge?._id, stdin: input }
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        setStatusMessage(`Judge sample run failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
        setIsRunning(false)
        return
      }

      const text = await res.text()
      try {
        const parsed = JSON.parse(text) as JudgeResult
        if (!parsed.tests) parsed.tests = []
        setRunningResult(parsed)
        setStatusMessage('Sample run complete')
      } catch {
        setRunningResult({ success: res.ok, stdout: text, stderr: '', exitCode: res.ok ? 0 : 1, tests: [] })
        setStatusMessage('Sample run produced unstructured output')
      }
    } catch (err: any) {
      setStatusMessage('Run sample failed: ' + (err?.message ?? String(err)))
    } finally {
      setIsRunning(false)
    }
  }

  // --- Final submit (allowed anytime; auto-submit still happens on timeout) ---
  async function handleFinalSubmit(isAuto = false) {
    setStatusMessage('Submitting...')
    setIsRunning(true)

    const videoBlob = await stopRecordingAndGetBlob()

    const total = runningResult?.tests?.length ?? 0
    const passed = runningResult?.tests?.filter((t) => t.passed).length ?? 0
    const judgeJson = runningResult ? JSON.stringify(runningResult) : '{}'

    const fd = new FormData()
    if (challenge?._id && challenge._id !== 'demo-1') {
      fd.append('challengeId', challenge._id)
    }
    fd.append('language', language)
    fd.append('code', code)
    fd.append('autoSubmitted', String(isAuto))
    fd.append('testsPassed', String(passed))
    fd.append('testsTotal', String(total))
    fd.append('judgeResult', judgeJson)
    if (studentId) fd.append('studentId', studentId)
    if (videoBlob) fd.append('recording', videoBlob, `recording-${Date.now()}.webm`)

    try {
      const res = await fetch(`${baseURL}/api/challenges/submit`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        body: fd,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        setStatusMessage(`Submit failed: ${res.status} ${res.statusText}${txt ? ` — ${txt}` : ''}`)
        setIsRunning(false)
        if (isAuto) closeModalAndCleanup() // ✅ force close
        return
      }

      const json = await res.json().catch(() => ({}))
      setStatusMessage('Submitted: ' + (json?.message ?? 'OK'))

      onSubmitted?.(challenge?._id)
      closeModalAndCleanup()
    } catch (err: any) {
      setStatusMessage('Submit failed: ' + (err?.message ?? String(err)))
      if (isAuto) closeModalAndCleanup() // ✅ force close
    } finally {
      setIsRunning(false)
    }
  }

  // --- drag handlers for webcam preview ---
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return
      const modal = modalRef.current
      const preview = camPreviewRef.current
      if (!modal || !preview) return
      const rect = modal.getBoundingClientRect()
      const offset = dragOffsetRef.current
      const newLeft = e.clientX - rect.left - offset.x
      const newTop = e.clientY - rect.top - offset.y
      const previewW = preview.offsetWidth,
        previewH = preview.offsetHeight
      const clampedLeft = Math.min(rect.width - previewW - 8, Math.max(8, newLeft))
      const clampedTop = Math.min(rect.height - previewH - 8, Math.max(8, newTop))
      setCamPos({ right: Math.round(rect.width - (clampedLeft + previewW)), bottom: Math.round(rect.height - (clampedTop + previewH)) })
    }
    function onUp() {
      setDragging(false)
      document.body.style.userSelect = ''
    }
    if (dragging) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.userSelect = 'none'
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
    }
  }, [dragging])

  function onPreviewMouseDown(e: React.MouseEvent) {
    const preview = camPreviewRef.current
    const modal = modalRef.current
    if (!preview || !modal) return
    setDragging(true)
    const previewRect = preview.getBoundingClientRect()
    dragOffsetRef.current = { x: e.clientX - previewRect.left, y: e.clientY - previewRect.top }
    e.preventDefault()
  }

  // --- Render UI ---
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Code Challenge</h2>

      {!hidePreview &&
        !modalOpen &&
        (challenge ? (
          <ChallengePanel challenge={challenge} openModalAndStart={openModalAndStart} onRunSample={runSingleSample} />
        ) : (
          <div>Loading challenge...</div>
        ))}

      {modalOpen && challenge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8,10,14,0.55)',
            backdropFilter: 'blur(8px) saturate(120%)',
            WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            padding: 24,
          }}>
          <ViolationAlert show={showViolationAlert} violations={violations} maxViolations={2} />

          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            style={{
              width: '94vw',
              height: '90vh',
              maxWidth: '98vw',
              maxHeight: '98vh',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '20% 60% 20%',
              boxShadow: '0 20px 60px rgba(2,6,23,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
            }}>
            {/* left */}
            <div>
              <ChallengeDescription challenge={challenge} />
              <LanguageSelector language={language} onLanguageChange={setLanguage} />
              <div style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, padding: 20 }}>
                Tip: share a different Window/Application (e.g. your code editor) so the screen capture doesn't mirror this page.
              </div>
            </div>

            {/* center */}
            <div style={{ position: 'relative' }}>
              <CodeEditor
                code={code}
                onCodeChange={setCode}
                timeLeft={timeLeft}
                onRunTests={runAllTests}
                onSubmit={() => handleFinalSubmit(false)}
                onCancel={closeModalAndCleanup}
                allPassed={allTestsPassed(runningResult)}
                isRunning={isRunning}
              />
              <DraggableWebcam camPreviewRef={camPreviewRef} position={camPos} onDragStart={onPreviewMouseDown} />
            </div>

            {/* right */}
            <OutputPanel
              statusMessage={statusMessage}
              runningResult={runningResult}
              showRawJson={showRawJson}
              onToggleRawJson={() => setShowRawJson((s) => !s)}
              challenge={challenge}
              onRunSample={runSingleSample}
              onRunAllTests={runAllTests}
              isRunning={isRunning}
            />
          </div>
        </div>
      )}
    </div>
  )
}
