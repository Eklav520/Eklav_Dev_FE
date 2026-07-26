import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button, Spinner, Alert, Badge } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { useGazeDetection } from '@/app/student/self-interview/components/useGazeDetection'
import GazeScanOverlay from '@/app/student/self-interview/components/GazeScanOverlay'
import {
  FiCheckCircle, FiXCircle, FiFileText, FiClipboard, FiSend, FiTerminal,
  FiVideo, FiAlertTriangle, FiPlay,
} from 'react-icons/fi'
import { FaFlask } from 'react-icons/fa'

// ================= TYPES =================
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
  input?: string
  type?: 'positive' | 'negative'
}

type JudgeResult = {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  tests: TestCaseResult[]
}

type Language = { id: string; name: string }

// ================= CONSTANTS =================
const LANGUAGES: Language[] = [
  { id: 'javascript', name: 'JavaScript (Node.js)' },
  { id: 'python', name: 'Python 3' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++ (GCC)' },
  { id: 'c', name: 'C (GCC)' },
  { id: 'csharp', name: 'C# (.NET)' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'assembly', name: 'Assembly (NASM)' }, // Added Assembly
]

const DEFAULT_CODE: Record<string, string> = {
  javascript: `function main(input) {\n  console.log(input);\n}\n\n// Example usage:\n// main("Hello World");`,
  python: `def main():\n    print(input())\n\nif __name__ == "__main__":\n    main()`,
  java: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.next();\n    System.out.println(s);\n  }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    cout << s;\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    printf("%s", s);\n    return 0;\n}`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        string s = Console.ReadLine();\n        Console.WriteLine(s);\n    }\n}`,
  php: `<?php\n$input = fgets(STDIN);\necho $input;\n?>`,
  ruby: `def main\n  input = gets.chomp\n  puts input\nend\n\nmain if __FILE__ == $0`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    var s string\n    fmt.Scan(&s)\n    fmt.Println(s)\n}`,
  rust: `use std::io;\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    println!("{}", input);\n}`,
  typescript: `function main(input: string): void {\n  console.log(input);\n}\n\n// Example usage:\n// main("Hello World");`,
  assembly: `section .data\n    msg db 'Hello World', 0\n\nsection .bss\n    input resb 100\n\nsection .text\n    global _start\n\n_start:\n    ; Read input\n    mov eax, 3          ; sys_read\n    mov ebx, 0          ; stdin\n    mov ecx, input      ; buffer\n    mov edx, 100        ; size\n    int 0x80\n    \n    ; Write output\n    mov eax, 4          ; sys_write\n    mov ebx, 1          ; stdout\n    mov ecx, input      ; message\n    mov edx, 100        ; length\n    int 0x80\n    \n    ; Exit\n    mov eax, 1          ; sys_exit\n    xor ebx, ebx        ; return 0\n    int 0x80`,
}

// ================= UTILITIES =================
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

// ================= COMPONENTS =================
const ConsoleOutput: React.FC<{
  result: JudgeResult | null
  showRawJson: boolean
  onToggleRawJson: () => void
  onRunProgramOnly: () => void
  isRunning: boolean
}> = ({ result, showRawJson, onToggleRawJson, onRunProgramOnly, isRunning }) => {
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
        <p>Click "Run Code" to execute your solution</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Use Ctrl+Enter or Alt+Enter for quick execution</p>
      </div>
    )
  }

  const total = result.tests?.length || 0
  const passed = result.tests?.filter(t => t.passed).length || 0

  return (
    <div>
      {/* Header with Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div>
            <span style={{ color: '#888' }}>Status:</span>
            <span style={{ marginLeft: '8px', color: result.success ? '#28a745' : '#dc3545', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {result.success ? <FiCheckCircle /> : <FiXCircle />} {result.success ? 'Success' : 'Failed'}
            </span>
          </div>
          {total > 0 && (
            <div>
              <span style={{ color: '#888' }}>Tests:</span>
              <span style={{ marginLeft: '8px', color: '#ff6b35', fontWeight: 600 }}>
                {passed}/{total} passed
              </span>
            </div>
          )}
          <div>
            <span style={{ color: '#888' }}>Exit Code:</span>
            <span style={{ marginLeft: '8px', fontWeight: 600 }}>{result.exitCode}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={onRunProgramOnly}
            disabled={isRunning}
            style={{ background: '#222', borderColor: '#444', color: '#fff' }}
          >
            Run Only
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={onToggleRawJson}
            style={{ background: '#222', borderColor: '#444', color: '#fff' }}
          >
            {showRawJson ? 'Hide JSON' : 'View JSON'}
          </Button>
        </div>
      </div>

      {/* Output Content */}
      {showRawJson ? (
        <pre style={{
          background: '#0a0a0a',
          padding: '12px',
          borderRadius: '6px',
          overflow: 'auto',
          maxHeight: '200px',
          fontSize: '12px',
          color: '#e2e8f0'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <>
          {/* Standard Output - Always show even if empty */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Output:</div>
            <pre style={{
              background: '#0a0a0a',
              padding: '10px',
              borderRadius: '6px',
              overflow: 'auto',
              maxHeight: '120px',
              fontSize: '13px',
              color: result.stdout ? '#e2e8f0' : '#888',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {result.stdout || '(no output)'}
            </pre>
          </div>

          {/* Error Output */}
          {result.stderr && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#f87171', fontSize: '12px', marginBottom: '4px' }}>Error:</div>
              <pre style={{
                background: 'rgba(220, 53, 69, 0.1)',
                padding: '10px',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '120px',
                fontSize: '13px',
                color: '#f87171',
                margin: 0
              }}>
                {result.stderr}
              </pre>
            </div>
          )}

          {/* Test Results */}
          {result.tests && result.tests.length > 0 && (
            <div>
              <div style={{ color: '#ff6b35', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Test Cases
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.tests.map((test, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: test.passed ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                      border: `1px solid ${test.passed ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`,
                      borderRadius: '6px',
                      padding: '8px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', display: 'inline-flex', color: test.passed ? '#28a745' : '#dc3545' }}>{test.passed ? <FiCheckCircle /> : <FiXCircle />}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{test.name || `Test ${idx + 1}`}</span>
                      {test.type && (
                        <Badge style={{ background: test.type === 'positive' ? '#28a745' : '#dc3545', fontSize: '10px' }}>
                          {test.type === 'positive' ? 'Positive' : 'Negative'}
                        </Badge>
                      )}
                    </div>
                    {test.input && (
                      <div style={{ marginTop: '8px', fontSize: '11px' }}>
                        <span style={{ color: '#888' }}>Input:</span>
                        <pre style={{ color: '#e2e8f0', margin: '4px 0 0 0', fontSize: '11px' }}>{test.input}</pre>
                      </div>
                    )}
                    {!test.passed && test.expected && test.actual && (
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div>
                            <span style={{ color: '#888' }}>Expected:</span>
                            <pre style={{ color: '#28a745', margin: '4px 0 0 0' }}>{test.expected}</pre>
                          </div>
                          <div>
                            <span style={{ color: '#888' }}>Got:</span>
                            <pre style={{ color: '#dc3545', margin: '4px 0 0 0' }}>{test.actual}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ================= MAIN COMPONENT =================
interface Props {
  eventId: string
  onSubmitted?: () => void
  baseURL?: string
  // Tab-switch/window-blur/fullscreen-exit count from the page-level
  // useProctorGuard — folded into the submission alongside the face/gaze
  // violations tracked in this component.
  tabSwitchViolationCount?: number
  // Call right before requesting camera/mic — the resulting permission
  // bubble steals window focus and can force fullscreen to exit, which
  // would otherwise be mistaken for the student tabbing away.
  onBeforeCameraRequest?: () => void
}

export default function StudentCodeChallengeComponent({ eventId, onSubmitted, baseURL = import.meta.env.VITE_API_BASE_URL, tabSwitchViolationCount = 0, onBeforeCameraRequest }: Props) {
  const { user } = useAuthContext()
  const token = user?.token

  // State
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_CODE.javascript)
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<JudgeResult | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [showTerminal, setShowTerminal] = useState(true)
  const editorRef = useRef<any | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [roundConfig, setRoundConfig] = useState<any>(null)

  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const draftKey = `coding_draft_${user?.id}_${eventId}`

  // Camera refs
  // State (not a plain ref) so the gaze-detection effect below — which
  // depends on this value — actually re-runs once the <video> node mounts.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // ── Gaze/head-pose/mask/no-face proctoring (same detector as the MCQ round
  // and /student/self-interview). No blocking modal, no strike cap — just a
  // silent tally sent up with the submission for admin review, same as the
  // aptitude round. Reuses this panel's existing camera stream/video element
  // (via useExternalStream) rather than requesting a second independent
  // camera stream — mediapipe's Camera utility always does its own
  // getUserMedia, and most Windows webcams only allow one active capture
  // session at a time.
  // Unlike the MCQ round's FILL-blank input, there's no single discrete
  // "answer field" here to suspend tracking for — the whole round is spent
  // typing code — so this always runs unsuspended.
  const gaze = useGazeDetection(videoEl, !!cameraStream && !submitted, false, { useExternalStream: true })
  const faceViolationCount = gaze.violationCount + gaze.headViolationCount + gaze.maskViolationCount + gaze.noFaceViolationCount
  // handleSubmit may run from a setInterval closure captured well before the
  // latest counts, so submission reads this ref instead of the values above.
  const violationCountsRef = useRef({
    eyeViolationCount: 0,
    headViolationCount: 0,
    maskViolationCount: 0,
    noFaceViolationCount: 0,
    tabSwitchViolationCount: 0,
    faceViolationCount: 0,
  })
  useEffect(() => {
    violationCountsRef.current = {
      eyeViolationCount: gaze.violationCount,
      headViolationCount: gaze.headViolationCount,
      maskViolationCount: gaze.maskViolationCount,
      noFaceViolationCount: gaze.noFaceViolationCount,
      tabSwitchViolationCount,
      faceViolationCount,
    }
  }, [gaze.violationCount, gaze.headViolationCount, gaze.maskViolationCount, gaze.noFaceViolationCount, tabSwitchViolationCount, faceViolationCount])

  // Current challenge
  const currentChallenge = challenges[currentQuestionIndex]
  const [showQuestionPanel, setShowQuestionPanel] = useState(true)
  const [results, setResults] = useState<Record<string, JudgeResult>>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  // ================= CAMERA RECORDING =================
  const startCamera = async () => {
    try {
      onBeforeCameraRequest?.()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true,
      })

      setCameraStream(stream)

      /* 🎥 START RECORDING */
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm"
      })

      mediaRecorderRef.current = recorder
      recordedChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.current.push(e.data)
        }
      }

      recorder.start(1000)

    } catch (err) {
      console.error("Camera error:", err)
      setCameraError("Unable to access camera")
    }
  }

  const stopAndUploadRecording = async () => {
    return new Promise<string>((resolve) => {
      const recorder = mediaRecorderRef.current

      if (!recorder) return resolve("")

      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordedChunks.current, {
            type: "video/webm"
          })

          if (!blob.size) return resolve("")

          const fileName = `coding_${Date.now()}.webm`

          const presignRes = await fetch(`${baseURL}/api/assessment/presign/session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fileName,
              fileType: "video/webm",
            }),
          })

          const { uploadUrl, fileUrl } = await presignRes.json()

          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "video/webm" },
            body: blob,
          })

          resolve(fileUrl)
        } catch (err) {
          console.error("Upload error:", err)
          resolve("")
        }
      }

      recorder.stop()
    })
  }


  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  // Assigns the stream once both the stream and the <video> node exist —
  // whichever resolves second (camera permission vs. the question-panel
  // finishing its initial load) triggers this, instead of relying on
  // startCamera() to catch a video node that may not have mounted yet.
  useEffect(() => {
    if (videoEl && cameraStream) {
      videoEl.srcObject = cameraStream
      videoEl.play().catch(() => {})
    }
  }, [videoEl, cameraStream])

  // ================= FETCH CHALLENGES =================
  useEffect(() => {
    const fetchRoundAndChallenges = async () => {
      try {
        setLoading(true);

        let pickCount = 2;
        let totalTime = 60 * 60;

        try {
          const roundRes = await fetch(`${baseURL}/api/assessment/exams/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (roundRes.ok) {
            const examData = await roundRes.json();
            console.log('Exam data:', examData);

            let codingRound = null;
            if (Array.isArray(examData.rounds)) {
              codingRound = examData.rounds.find((r: any) => r.roundType === 'coding');
            }

            if (codingRound) {
              pickCount = codingRound.pickCount || 2;
              totalTime = codingRound.timeSeconds || 60 * 60;
              setRoundConfig(codingRound);
            }
          }
        } catch (err) {
          console.warn('Could not fetch exam details, using defaults:', err);
        }

        const challengesRes = await fetch(`${baseURL}/api/events/${eventId}/codechallenges`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!challengesRes.ok) {
          throw new Error(`Failed to fetch challenges: ${challengesRes.status}`);
        }

        const data = await challengesRes.json();
        console.log('Challenges data:', data);

        const allChallenges: Challenge[] = data?.challenges || [];

        if (allChallenges.length === 0) {
          setError('No challenges available for this exam');
          setLoading(false);
          return;
        }

        const shuffled = [...allChallenges];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selectedChallenges = shuffled.slice(0, Math.min(pickCount, allChallenges.length));
        console.log('Selected challenges:', selectedChallenges);

        setChallenges(selectedChallenges);
        setTimeLeft(totalTime);

        const initialCodes: Record<string, string> = {};
        selectedChallenges.forEach((challenge) => {
          initialCodes[challenge._id] = DEFAULT_CODE[language] || DEFAULT_CODE.javascript;
        });
        setCodes(initialCodes);
        setCode(initialCodes[selectedChallenges[0]._id]);

      } catch (err: any) {
        console.error('Error fetching challenges:', err);
        setError(err.message || 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    if (eventId && token) {
      fetchRoundAndChallenges();
    }
    startCamera();

    return () => stopCamera();
  }, [eventId, token]);

  // Update code when switching questions
  useEffect(() => {
    if (currentChallenge && codes[currentChallenge._id]) {
      setCode(codes[currentChallenge._id])
    }
  }, [currentChallenge, codes])

  // Auto-save draft to localStorage whenever codes or question index changes
  useEffect(() => {
    if (submitted || challenges.length === 0) return
    localStorage.setItem(draftKey, JSON.stringify({ codes, currentQuestionIndex, language }))
  }, [codes, currentQuestionIndex, language])

  // Restore draft after challenges load
  useEffect(() => {
    if (challenges.length === 0) return
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const { codes: savedCodes, currentQuestionIndex: savedIndex, language: savedLang } = JSON.parse(saved)
      if (savedCodes && Object.keys(savedCodes).length > 0) {
        setCodes(savedCodes)
        setLanguage(savedLang || 'javascript')
        const idx = Math.min(savedIndex ?? 0, challenges.length - 1)
        setCurrentQuestionIndex(idx)
        const challengeId = challenges[idx]?._id
        if (challengeId && savedCodes[challengeId]) {
          setCode(savedCodes[challengeId])
        }
        setShowResumeBanner(true)
        setTimeout(() => setShowResumeBanner(false), 4000)
      }
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [challenges])

  // Save code when it changes
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value ?? ''
    setCode(newCode)
    if (currentChallenge) {
      setCodes(prev => ({ ...prev, [currentChallenge._id]: newCode }))
    }
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    editor.focus()

    const stopClipboard = (event: any) => {
      event.preventDefault()
      event.stopPropagation?.()
      return false
    }

    const domNode = editor.getDomNode?.() || editor.getContainerDomNode?.()
    if (domNode) {
      domNode.addEventListener('copy', stopClipboard)
      domNode.addEventListener('paste', stopClipboard)
      domNode.addEventListener('cut', stopClipboard)
      domNode.addEventListener('contextmenu', stopClipboard)
    }

    editor.onKeyDown((e: any) => {
      const key = e.browserEvent?.key?.toLowerCase?.()
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(key)) {
        e.preventDefault()
        e.stopPropagation()
      }
    })

    if (monaco?.KeyMod && monaco?.KeyCode) {
      const blockedKeys = [
        monaco.KeyCode.KEY_C,
        monaco.KeyCode.KEY_V,
        monaco.KeyCode.KEY_X,
        monaco.KeyCode.KEY_A,
      ]
      blockedKeys.forEach((keyCode) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | keyCode, () => null)
      })
    }
  }

  // ================= TIMER =================
  useEffect(() => {
    if (submitted || !timeLeft || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return prev ? prev - 1 : null
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted, timeLeft])

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [showQuestionPanel])

  // ================= RUN CODE ONLY (No Tests) =================
  const runCodeOnly = async () => {
    if (isRunning) return
    setIsRunning(true)
    setShowTerminal(true)

    console.log('Running code only with payload:', { language, code, challengeId: currentChallenge?._id })

    try {
      const payload = { language, code, challengeId: currentChallenge?._id }
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Execution failed: ${res.status} ${errorText}`)
      }

      const data = await res.json()
      console.log('Run result:', data)

      setResult({
        success: data.success || false,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode || 0,
        tests: [],
      })
    } catch (err: any) {
      console.error('Run error:', err)
      setResult({
        success: false,
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        tests: [],
      })
    } finally {
      setIsRunning(false)
    }
  }

  // ================= RUN ALL TESTS =================
  const runAllTests = async () => {
    if (!currentChallenge?.testSpec) {
      await runCodeOnly()
      return
    }

    const positiveTests = currentChallenge.testSpec.positiveTests || []
    const negativeTests = currentChallenge.testSpec.negativeTests || []
    const allTests = [...positiveTests, ...negativeTests]

    setIsRunning(true)
    setShowTerminal(true)

    const testResults: TestCaseResult[] = []
    let allPassed = true

    for (let i = 0; i < allTests.length; i++) {
      const test = allTests[i]
      const isPositive = i < positiveTests.length

      try {
        const payload = {
          language,
          code,
          challengeId: currentChallenge._id,
          stdin: unescapeText(test.input)
        }

        console.log(`Running test ${i + 1}:`, payload)

        const res = await fetch(`${baseURL}/api/judge/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        const actualOutput = data.stdout?.trim() || ''
        const expectedOutput = unescapeText(test.expectedOutput).trim()
        const passed = actualOutput === expectedOutput

        if (!passed) allPassed = false

        testResults.push({
          name: `${isPositive ? 'Positive' : 'Negative'} Test ${isPositive ? positiveTests.indexOf(test) + 1 : negativeTests.indexOf(test) + 1}`,
          passed,
          stdout: actualOutput,
          expected: expectedOutput,
          actual: actualOutput,
          input: unescapeText(test.input),
          type: isPositive ? 'positive' : 'negative',
        })
      } catch (err: any) {
        allPassed = false
        testResults.push({
          name: `${isPositive ? 'Positive' : 'Negative'} Test ${isPositive ? positiveTests.indexOf(test) + 1 : negativeTests.indexOf(test) + 1}`,
          passed: false,
          stdout: '',
          expected: unescapeText(test.expectedOutput),
          actual: err.message,
          input: unescapeText(test.input),
          type: isPositive ? 'positive' : 'negative',
        })
      }
    }

    const newResult = {
      success: allPassed,
      stdout: `Tests completed: ${testResults.filter(t => t.passed).length}/${testResults.length} passed`,
      stderr: '',
      exitCode: allPassed ? 0 : 1,
      tests: testResults,
    }

    setResult(newResult)

    // ✅ STORE PER QUESTION
    if (currentChallenge?._id) {
      setResults(prev => ({
        ...prev,
        [currentChallenge._id]: newResult
      }))
    }

    setIsRunning(false)
  }

  // ================= SUBMIT =================
  const handleSubmit = async (auto = false) => {
    if (submitted) return
    setSubmitted(true)
    const sessionMediaUrl = await stopAndUploadRecording()
    stopCamera()

    try {
      const passedTests = result?.tests?.filter(t => t.passed).length || 0
      const totalTests = result?.tests?.length || 0

      await fetch(`${baseURL}/api/assessment/complete-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: eventId,
          roundType: 'coding',
          sessionMediaUrl,
          autoSubmitted: auto,
          language,

          submissions: challenges.map(c => {
            const res = results[c._id]

            return {
              questionId: c._id,
              code: codes[c._id],

              testResults: res?.tests?.map(t => ({
                input: t.input,
                expected: t.expected,
                actual: t.actual,
                passed: t.passed
              })) || [],

              testsPassed: res?.tests?.filter(t => t.passed).length || 0,
              testsTotal: res?.tests?.length || 0
            }
          }),

          completedQuestions: challenges.map(c => c._id),
          ...violationCountsRef.current,
        })
      })

      localStorage.removeItem(draftKey)
      onSubmitted?.()
    } catch (err) {
      console.error('Submit error:', err)
    }
  }

  // ================= UI HELPERS =================
  const formatTime = (t: number | null) => {
    if (!t) return '00:00'
    const m = Math.floor(t / 60)
    const s = t % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getMonacoLanguage = (lang: string) => {
    const map: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      php: 'php',
      ruby: 'ruby',
      assembly: 'assembly', // Assembly language support
    }
    return map[lang] || 'plaintext'
  }

  const editorTheme = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editorCursor.foreground': '#ff6b35',
    },
  }

  // ================= RENDER =================
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="dark" style={{ background: '#111', color: '#ff6b35', borderColor: '#ff6b35', margin: '16px' }}>
        {error}
      </Alert>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      {/* Resume banner */}
      {showResumeBanner && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#28a745', color: '#fff', textAlign: 'center',
          padding: '10px 16px', fontSize: '14px', fontWeight: 600,
          animation: 'fadeOut 0.5s ease 3.5s forwards',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <FiCheckCircle /> Previous session restored — your code has been loaded
        </div>
      )}
      {/* ================= LEFT PANEL - QUESTION ================= */}
      <div style={{
        width: showQuestionPanel ? '26%' : '0px',
        minWidth: showQuestionPanel ? '280px' : '0px',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        background: '#111',
        borderRight: showQuestionPanel ? '1px solid #333' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header — matches the code editor panel's header so both panels'
            content starts at the same vertical offset. */}
        {showQuestionPanel && (
          <div style={{
            height: '58px',
            boxSizing: 'border-box',
            padding: '0 20px',
            background: '#111',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#ff6b35', fontWeight: 600, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FiFileText /> Problem Statement</span>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: showQuestionPanel ? '20px' : '0px' }}>

        {/* Question Navigation */}
        {challenges.length > 1 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {challenges.map((challenge, idx) => (
                <Button
                  key={challenge._id}
                  size="sm"
                  onClick={() => {
                    setCurrentQuestionIndex(idx)
                    setResult(null)
                  }}
                  style={{
                    background: currentQuestionIndex === idx ? '#ff6b35' : '#222',
                    border: 'none',
                    fontSize: '12px',
                    padding: '6px 12px'
                  }}
                >
                  Question {idx + 1}
                </Button>
              ))}
            </div>
            <div style={{ height: '2px', background: '#333', width: '100%', marginBottom: '16px' }}></div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#ff6b35', marginBottom: '8px', fontSize: '18px' }}>
            {challenges.length > 1 && `Question ${currentQuestionIndex + 1}: `}{currentChallenge?.title}
          </h3>
          <div style={{ height: '2px', background: '#ff6b35', width: '50px' }}></div>
        </div>

        {/* Question Description */}
        <div style={{ color: '#e2e8f0', lineHeight: '1.5', fontSize: '13px' }}>
          {currentChallenge?.description?.split('\n').map((line, i) => {
            if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />
            if (line.includes('Input') || line.includes('Output') || line.includes('Example')) {
              return <h5 key={i} style={{ color: '#ff6b35', marginTop: '14px', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>{line}</h5>
            }
            return <p key={i} style={{ margin: '6px 0', fontSize: '13px' }}>{line}</p>
          })}
        </div>

        {/* Sample Test Cases - Show both Positive and Negative */}
        {currentChallenge?.testSpec && (
          <div style={{ marginTop: '18px' }}>
            <h5 style={{ color: '#ff6b35', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiClipboard /> Sample Test Cases</h5>

            {/* Positive Tests */}
            {(currentChallenge.testSpec.positiveTests || []).length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Badge style={{ background: '#28a745', marginBottom: '6px', fontSize: '10px' }}>Positive</Badge>
                {(currentChallenge.testSpec.positiveTests || []).map((test, idx) => (
                  <div key={`pos-${idx}`} style={{
                    display: 'flex',
                    gap: '8px',
                    background: '#0a0a0a',
                    borderRadius: '5px',
                    padding: '7px 9px',
                    marginBottom: '6px',
                    border: '1px solid #28a74533'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '9.5px', color: '#888', marginBottom: '2px' }}>Input</div>
                      <pre style={{ fontSize: '11px', color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{unescapeText(test.input)}</pre>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #222', paddingLeft: '8px' }}>
                      <div style={{ fontSize: '9.5px', color: '#888', marginBottom: '2px' }}>Output</div>
                      <pre style={{ fontSize: '11px', color: '#28a745', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{unescapeText(test.expectedOutput)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Negative Tests */}
            {(currentChallenge.testSpec.negativeTests || []).length > 0 && (
              <div>
                <Badge style={{ background: '#dc3545', marginBottom: '6px', fontSize: '10px' }}>Negative</Badge>
                {(currentChallenge.testSpec.negativeTests || []).map((test, idx) => (
                  <div key={`neg-${idx}`} style={{
                    display: 'flex',
                    gap: '8px',
                    background: '#0a0a0a',
                    borderRadius: '5px',
                    padding: '7px 9px',
                    marginBottom: '6px',
                    border: '1px solid #dc354533'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '9.5px', color: '#888', marginBottom: '2px' }}>Input</div>
                      <pre style={{ fontSize: '11px', color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{unescapeText(test.input)}</pre>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #222', paddingLeft: '8px' }}>
                      <div style={{ fontSize: '9.5px', color: '#888', marginBottom: '2px' }}>Output</div>
                      <pre style={{ fontSize: '11px', color: '#dc3545', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{unescapeText(test.expectedOutput)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>
      </div>

      {/* ================= MIDDLE PANEL - CODE EDITOR ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Header — same fixed height as the question panel's header above,
            so both panels' content starts at the same vertical offset. */}
        <div style={{
          height: '58px',
          boxSizing: 'border-box',
          padding: '0 20px',
          background: '#111',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

            {/* ✅ Toggle Question Panel */}
            <div
              onClick={() => setShowQuestionPanel(prev => !prev)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '2px',
                  background: '#ff6b35',
                  transform: showQuestionPanel ? 'none' : 'rotate(45deg) translate(3px, 3px)',
                  transition: 'all 0.3s'
                }}
              />
              <span
                style={{
                  width: '16px',
                  height: '2px',
                  background: '#ff6b35',
                  opacity: showQuestionPanel ? 1 : 0,
                  transition: 'all 0.3s'
                }}
              />
              <span
                style={{
                  width: '16px',
                  height: '2px',
                  background: '#ff6b35',
                  transform: showQuestionPanel ? 'none' : 'rotate(-45deg) translate(3px, -3px)',
                  transition: 'all 0.3s'
                }}
              />
            </div>
            {/* Language Dropdown */}
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value
                setLanguage(newLang)
                const newDefaultCode = DEFAULT_CODE[newLang] || DEFAULT_CODE.javascript
                setCode(newDefaultCode)
                if (currentChallenge) {
                  setCodes(prev => ({ ...prev, [currentChallenge._id]: newDefaultCode }))
                }
              }}
              style={{
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>

          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>Time Left</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: timeLeft && timeLeft < 300 ? '#dc3545' : '#ff6b35' }}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              theme="custom-dark"
              beforeMount={(monaco) => monaco.editor.defineTheme('custom-dark', editorTheme)}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                padding: { top: 0, bottom: 0 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                contextmenu: false,
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
              }}
            />
          </div>
        </div>

        {/* Run Buttons */}
        <div style={{
          padding: '12px 20px',
          background: '#111',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '12px'
        }}>
          <Button
            onClick={runCodeOnly}
            disabled={isRunning}
            style={{
              background: '#6c757d',
              border: 'none',
              padding: '8px 24px',
              fontWeight: 'bold',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            {isRunning ? 'Running...' : <><FiPlay /> Run Code Only</>}
          </Button>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            style={{
              background: '#ff6b35',
              border: 'none',
              padding: '8px 24px',
              fontWeight: 'bold',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            {isRunning ? 'Testing...' : <><FaFlask /> Run All Tests</>}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={submitted || isRunning}
            style={{
              background: '#28a745',
              border: 'none',
              padding: '8px 24px',
              fontWeight: 'bold',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}
          >
            <FiSend /> Submit All
          </Button>
        </div>

        {/* Terminal - FIXED: Proper toggle functionality */}
        <div
          onClick={() => setShowTerminal(prev => !prev)}
          style={{
            borderTop: '1px solid #333',
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            flex: showTerminal ? '0 0 35vh' : '0 0 40px'
          }}
        >
          <div style={{
            padding: '8px 16px',
            background: '#111',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '40px',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
              <span style={{ fontSize: '14px', display: 'inline-flex' }}><FiTerminal /></span>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>Console Output</span>
              {result && (
                <Badge style={{ background: result.success ? '#28a745' : '#dc3545', fontSize: '10px' }}>
                  {result.success ? 'Passed' : 'Failed'}
                </Badge>
              )}
            </div>
            <span style={{ transform: showTerminal ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', pointerEvents: 'none' }}>▼</span>
          </div>

          {showTerminal && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px', cursor: 'auto' }}
              onClick={(e) => e.stopPropagation()}>
              <ConsoleOutput
                result={result}
                showRawJson={showRawJson}
                onToggleRawJson={() => setShowRawJson(!showRawJson)}
                onRunProgramOnly={runCodeOnly}
                isRunning={isRunning}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANEL - CAMERA ================= */}
      <div style={{
        width: '260px',
        background: '#111',
        borderLeft: '1px solid #333',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <h6 style={{ color: '#ff6b35', marginBottom: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiVideo /> Recording</h6>
          <div style={{ height: '2px', background: '#333', width: '100%' }}></div>
        </div>

        {cameraError ? (
          <div style={{ textAlign: 'center', padding: '16px', background: '#0a0a0a', borderRadius: '6px' }}>
            <p style={{ color: '#dc3545', fontSize: '11px' }}>{cameraError}</p>
            <Button
              size="sm"
              onClick={startCamera}
              style={{ background: '#ff6b35', border: 'none', fontSize: '11px' }}
            >
              Retry Camera
            </Button>
          </div>
        ) : (
          <div style={{
            background: '#000',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '2px solid #ff6b35'
          }}>
            <div style={{
              background: '#ff6b35',
              padding: '3px 6px',
              fontSize: '9px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Camera Feed</span>
              {cameraStream && (
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  background: '#ff0000',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite'
                }} />
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <video
                ref={setVideoEl}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: 'auto',
                  background: '#000',
                  display: 'block'
                }}
              />
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

            {/* Gaze/head-pose/mask proctoring status — same detector as the
                MCQ round, condensed to a status strip since this panel is
                small. */}
            {gaze.isReady && (
              <div style={{
                padding: '5px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                color: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? '#fff' : '#28a745',
                background: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? '#dc3545' : 'rgba(40,167,69,0.12)',
              }}>
                {!gaze.faceDetected
                  ? <><FiAlertTriangle /> Face not visible — remove any covering ({gaze.noFaceSeconds}s)</>
                  : gaze.maskDetected
                    ? <><FiAlertTriangle /> Mouth/nose covered — remove mask ({gaze.maskAwaySeconds}s)</>
                    : gaze.isLookingAway
                      ? <><FiAlertTriangle /> Look at the screen ({gaze.lookAwaySeconds}s)</>
                      : gaze.isHeadTurned
                        ? <><FiAlertTriangle /> Face the camera ({gaze.headAwaySeconds}s)</>
                        : <><FiCheckCircle /> Face tracking OK</>}
              </div>
            )}

            {/* Silent tally — not a blocking violation, just a count sent up
                with the submission for admin review. */}
            {faceViolationCount > 0 && (
              <div style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 600,
                textAlign: 'center',
                color: '#f59e0b',
                background: 'rgba(245,158,11,0.12)',
              }}>
                Face/gaze violations noted: {faceViolationCount}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #333' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#888', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <FiAlertTriangle /> Camera is being recorded during the challenge
            </p>
            <div style={{ fontSize: '9px', color: '#888' }}>
              {challenges.length} question{challenges.length !== 1 ? 's' : ''} to complete
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeOut {
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  )
}