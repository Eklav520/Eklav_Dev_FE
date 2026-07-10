import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { createPortal } from 'react-dom'
import { Button, Spinner, Toast } from 'react-bootstrap'
import {
  BookOpen, Clock3, FlaskConical, Laptop, PencilLine, Monitor, Search,
  Shield, Database, Cloud, Brain, Globe, ChevronDown,
} from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'

// ================= TYPES =================
type TestCase = {
  _id: string
  input: string
  expectedOutput: string
  points?: number
  matchType?: string
}

type LabProgram = {
  _id: string
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  testCases: TestCase[]
  sampleCode?: string
  tags?: string[]
  timeLimitSeconds?: number
  maxScore?: number
  branch?: string
  year?: string
}

type RunResult = {
  index: number
  input: string
  expectedOutput: string
  actualOutput: string
  stderr: string
  passed: boolean
}

type JudgeResult = {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  tests: RunResult[]
}

type Language = { id: string; name: string }

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
]

const DEFAULT_CODE: Record<string, string> = {
  javascript: `function solve(input) {\n  // Write your solution here\n  console.log(input);\n}\n\n// Read input\nprocess.stdin.on('data', data => {\n  solve(data.toString().trim());\n});`,
  python: `def solve():\n    # Write your solution here\n    import sys\n    data = sys.stdin.read().strip()\n    print(data)\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine();\n        System.out.println(input);\n    }\n}`,
  cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << input << endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char input[1000];\n    fgets(input, sizeof(input), stdin);\n    printf("%s", input);\n    return 0;\n}`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        string input = Console.ReadLine();\n        Console.WriteLine(input);\n    }\n}`,
  php: `<?php\n$input = fgets(STDIN);\necho $input;\n?>`,
  ruby: `def solve\n  input = gets.chomp\n  puts input\nend\n\nsolve if __FILE__ == $0`,
  go: `package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    scanner := bufio.NewScanner(os.Stdin)\n    scanner.Scan()\n    input := scanner.Text()\n    fmt.Println(input)\n}`,
  rust: `use std::io;\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    print!("{}", input);\n}`,
  typescript: `function solve(input: string): void {\n    console.log(input);\n}\n\n// Read input\nprocess.stdin.on('data', data => {\n    solve(data.toString().trim());\n});`,
}

const DIFFICULTY_CONFIG: Record<string, { color: string; dot: string; bg: string; border: string }> = {
  Beginner:     { color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  Intermediate: { color: '#d97706', dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  Advanced:     { color: '#dc2626', dot: '#ef4444', bg: '#fff1f2', border: '#fecaca' },
}

// ================= HELPERS =================
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours > 0) return `${hours}h ${remainingMinutes}m`
  return `${minutes}m`
}

function getProgramIcon(title: string): { Icon: React.ElementType; color: string; bg: string } {
  const t = title.toLowerCase()
  if (t.includes('web') || t.includes('html') || t.includes('full stack') || t.includes('react') || t.includes('frontend'))
    return { Icon: Globe, color: '#3b82f6', bg: '#eff6ff' }
  if (t.includes('python') || t.includes('machine') || t.includes('ml') || t.includes('ai') || t.includes('data'))
    return { Icon: Brain, color: '#10b981', bg: '#f0fdf4' }
  if (t.includes('sql') || t.includes('database') || t.includes('db') || t.includes('nosql'))
    return { Icon: Database, color: '#f59e0b', bg: '#fffbeb' }
  if (t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('devops'))
    return { Icon: Cloud, color: '#6366f1', bg: '#eef2ff' }
  if (t.includes('security') || t.includes('cyber') || t.includes('hack') || t.includes('network'))
    return { Icon: Shield, color: '#ef4444', bg: '#fff1f2' }
  return { Icon: Laptop, color: '#8b5cf6', bg: '#f5f3ff' }
}

// ================= DONUT CHART =================
function DonutChart({ percentage, color = '#6c63ff' }: { percentage: number; color?: string }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (percentage / 100) * circ
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" />
      <text x="55" y="51" textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="800">{percentage}%</text>
      <text x="55" y="67" textAnchor="middle" fill="#94a3b8" fontSize="9">Complete</text>
    </svg>
  )
}

// ================= CONSOLE OUTPUT (DARK MODAL) =================
const ConsoleOutput: React.FC<{
  result: JudgeResult | null
  showRawJson: boolean
  onToggleRawJson: () => void
  onRunProgramOnly: () => void
  isRunning: boolean
}> = ({ result, showRawJson, onToggleRawJson }) => {
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
        <p>Click "Run Tests" to execute your solution</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Use Ctrl+Enter for quick execution</p>
      </div>
    )
  }

  const total = result.tests?.length || 0
  const passed = result.tests?.filter(t => t.passed).length || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div>
            <span style={{ color: '#888' }}>Status:</span>
            <span style={{ marginLeft: '8px', color: result.success ? '#28a745' : '#dc3545', fontWeight: 600 }}>
              {result.success ? '✓ All Passed' : '✗ Some Failed'}
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
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="outline-secondary" onClick={onToggleRawJson} style={{ background: '#222', borderColor: '#444', color: '#fff' }}>
            {showRawJson ? 'Hide JSON' : 'View JSON'}
          </Button>
        </div>
      </div>

      {showRawJson ? (
        <pre style={{ background: '#0a0a0a', padding: '12px', borderRadius: '6px', overflow: 'auto', maxHeight: '300px', fontSize: '12px', color: '#e2e8f0' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <>
          {result.stdout && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Output:</div>
              <pre style={{ background: '#0a0a0a', padding: '10px', borderRadius: '6px', overflow: 'auto', maxHeight: '120px', fontSize: '13px', color: '#e2e8f0', margin: 0 }}>
                {result.stdout}
              </pre>
            </div>
          )}
          {result.stderr && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#f87171', fontSize: '12px', marginBottom: '4px' }}>Error:</div>
              <pre style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '10px', borderRadius: '6px', overflow: 'auto', maxHeight: '120px', fontSize: '13px', color: '#f87171', margin: 0 }}>
                {result.stderr}
              </pre>
            </div>
          )}
          {result.tests && result.tests.length > 0 && (
            <div>
              <div style={{ color: '#ff6b35', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Test Results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {result.tests.map((test, idx) => (
                  <div key={idx} style={{ background: test.passed ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', border: `1px solid ${test.passed ? '#28a74533' : '#dc354533'}`, borderRadius: '6px', padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span>{test.passed ? '✅' : '❌'}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>Test Case #{test.index}</span>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <div><span style={{ color: '#888' }}>Input:</span> <code style={{ color: '#e2e8f0' }}>{test.input}</code></div>
                      <div><span style={{ color: '#888' }}>Expected:</span> <code style={{ color: '#28a745' }}>{test.expectedOutput}</code></div>
                      <div><span style={{ color: '#888' }}>Got:</span> <code style={{ color: test.passed ? '#28a745' : '#dc3545' }}>{test.actualOutput}</code></div>
                      {test.stderr && <div><span style={{ color: '#888' }}>Error:</span> <code style={{ color: '#dc3545' }}>{test.stderr}</code></div>}
                    </div>
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
const StudentCollegeLabsPage = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [labs, setLabs] = useState<LabProgram[]>([])
  const [completedPrograms, setCompletedPrograms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentBranch = user?.branch || user?.department || ''
  const studentYear = user?.joiningYear || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  const [showModal, setShowModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState<LabProgram | null>(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')

  const [activeTab, setActiveTab] = useState('available')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [yearFilter, setYearFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<JudgeResult | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [terminalOutput, setTerminalOutput] = useState('')
  const editorRef = useRef<any | null>(null)
  const [toastState, setToastState] = useState<{
    show: boolean; title: string; message: string; variant: 'success' | 'danger' | 'warning' | 'info'
  }>({ show: false, title: '', message: '', variant: 'info' })

  const showToast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    setToastState({ show: true, title, message: text, variant })
  }

  useEffect(() => {
    const fetchLabs = async () => {
      if (!token) return
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${baseURL}/api/institute/college-labs/student/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch lab programs')
        setLabs(Array.isArray(data.data) ? data.data : [])
        const completed = localStorage.getItem('completedPrograms')
        if (completed) setCompletedPrograms(JSON.parse(completed))
      } catch (err: any) {
        setError(err.message || 'Failed to load labs')
      } finally {
        setLoading(false)
      }
    }
    fetchLabs()
  }, [token, baseURL])

  useEffect(() => {
    if (!showModal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [showModal])

  // Unique years & branches from all labs (for dropdown options)
  const allYears = [...new Set(labs.map(l => l.year).filter(Boolean))].sort() as string[]
  const allBranches = [...new Set(labs.map(l => l.branch).filter(Boolean))].sort() as string[]

  // All labs visible to this student (for sidebar stats)
  const allStudentLabs = React.useMemo(() => {
    let filtered = labs
    const yr = yearFilter || studentYear
    const br = branchFilter || studentBranch
    if (yr) filtered = filtered.filter(l => !l.year || l.year === yr)
    if (br) filtered = filtered.filter(l => !l.branch || l.branch === br)
    return filtered
  }, [labs, studentBranch, studentYear, yearFilter, branchFilter])

  const completedCount = completedPrograms.filter(id => allStudentLabs.some(l => l._id === id)).length
  const totalCount = allStudentLabs.length
  const notStartedCount = totalCount - completedCount
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allTags = [...new Set(allStudentLabs.flatMap(l => l.tags || []))]

  const filteredLabs = React.useMemo(() => {
    let filtered = allStudentLabs
    if (activeTab === 'available') {
      filtered = filtered.filter(lab => !completedPrograms.includes(lab._id))
    } else {
      filtered = filtered.filter(lab => completedPrograms.includes(lab._id))
    }
    if (searchTerm) {
      filtered = filtered.filter(lab =>
        lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(lab => lab.difficulty === difficultyFilter)
    }
    return filtered
  }, [allStudentLabs, completedPrograms, activeTab, searchTerm, difficultyFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLabs.length / ITEMS_PER_PAGE))

  const paginatedLabs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredLabs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredLabs, currentPage])

  useEffect(() => { setCurrentPage(1) }, [activeTab, searchTerm, difficultyFilter, yearFilter, branchFilter])
  useEffect(() => { setCurrentPage(prev => Math.min(prev, totalPages)) }, [totalPages])

  const handleShowDetails = (lab: LabProgram) => {
    setSelectedLab(lab)
    setCode(lab.sampleCode || DEFAULT_CODE[language] || DEFAULT_CODE.python)
    setResult(null)
    setTerminalOutput('')
    setMessage('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedLab(null)
    setResult(null)
    setCode('')
  }

  const runCode = async () => {
    if (!selectedLab) return
    if (!code.trim()) { setMessage('Please write your code before running.'); setShowTerminal(true); return }
    setIsRunning(true); setShowTerminal(true); setResult(null); setMessage('')
    setTerminalOutput('Running current code...\n')
    try {
      const sampleInput = selectedLab.testCases?.[0]?.input || ''
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin: unescapeText(sampleInput) }),
      })
      const data = await res.json()
      const actualOutput = String(data?.stdout || '').trim()
      const stderr = String(data?.stderr || '').trim()
      const expectedOutput = unescapeText(selectedLab.testCases?.[0]?.expectedOutput || '').trim()
      let output = '▶ Code Run Result\n'
      output += `Input: ${sampleInput || '(empty)'}\n`
      output += `Output: ${actualOutput || '(empty)'}\n`
      if (stderr) output += `Error: ${stderr}\n`
      if (selectedLab.testCases?.length) {
        output += `Expected (Test 1): ${expectedOutput || '(empty)'}\n`
        output += `Match: ${actualOutput === expectedOutput ? 'YES ✅' : 'NO ❌'}\n`
      }
      setTerminalOutput(output)
      setMessage('Run completed. Use Run Tests to validate all test cases.')
    } catch (err: any) {
      setTerminalOutput(`Error: ${err.message || 'Failed to run code'}`)
      setMessage(err.message || 'Failed to run code')
    } finally {
      setIsRunning(false)
    }
  }

  const runTests = async () => {
    if (!selectedLab) return
    if (!code.trim()) { setMessage('Please write your code before running tests.'); return }
    setIsRunning(true); setShowTerminal(true); setMessage(''); setTerminalOutput('Running tests...\n')
    try {
      const runResults: RunResult[] = []
      let terminalLog = ''
      for (let i = 0; i < selectedLab.testCases.length; i++) {
        const tc = selectedLab.testCases[i]
        terminalLog += `\n📝 Test Case ${i + 1}:\n`
        terminalLog += `   Input: ${tc.input || '(empty)'}\n`
        terminalLog += `   Expected: ${tc.expectedOutput || '(empty)'}\n`
        const res = await fetch(`${baseURL}/api/judge/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, stdin: unescapeText(tc.input) }),
        })
        const data = await res.json()
        const actualOutput = String(data?.stdout || '').trim()
        const expectedOutput = unescapeText(tc.expectedOutput).trim()
        const passed = res.ok && Number(data?.exitCode) === 0 && actualOutput === expectedOutput
        terminalLog += `   Actual: ${actualOutput || '(empty)'}\n`
        terminalLog += `   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`
        if (data?.stderr) terminalLog += `   Error: ${data.stderr}\n`
        runResults.push({ index: i + 1, input: tc.input, expectedOutput, actualOutput, stderr: String(data?.stderr || ''), passed })
      }
      setTerminalOutput(terminalLog)
      const allPassed = runResults.every(r => r.passed)
      setResult({
        success: allPassed,
        stdout: `Tests completed: ${runResults.filter(r => r.passed).length}/${runResults.length} passed`,
        stderr: '', exitCode: allPassed ? 0 : 1, tests: runResults,
      })
      setMessage(allPassed ? '✅ All test cases passed! You can now submit your solution.' : '❌ Some test cases failed. Fix your code and run again.')
    } catch (err: any) {
      setMessage(err.message || 'Failed to run test cases')
      setTerminalOutput(`Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const submitLab = async () => {
    if (!selectedLab || !token || !code.trim()) return
    setSubmitting(true); setMessage('')
    try {
      const res = await fetch(`${baseURL}/api/institute/college-labs/${selectedLab._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const apiMessage = data?.message || 'Submission failed'
        setMessage(`❌ ${apiMessage}`)
        showToast('Submission Failed', apiMessage, 'danger')
        return
      }
      const updated = [...completedPrograms, selectedLab._id]
      setCompletedPrograms(updated)
      localStorage.setItem('completedPrograms', JSON.stringify(updated))
      setMessage('🎉 Lab submitted successfully! Well done!')
      showToast('Submission Successful', 'Your solution has been submitted.', 'success')
      setTimeout(() => { handleCloseModal(); setActiveTab('completed') }, 1500)
    } catch (err: any) {
      const errMessage = err.message || 'Failed to submit lab'
      setMessage(errMessage)
      showToast('Submission Error', errMessage, 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    editor.focus()
    const stopClipboard = (event: any) => { event.preventDefault(); event.stopPropagation?.(); return false }
    const domNode = editor.getDomNode?.() || editor.getContainerDomNode?.()
    if (domNode) {
      domNode.addEventListener('copy', stopClipboard)
      domNode.addEventListener('paste', stopClipboard)
      domNode.addEventListener('cut', stopClipboard)
      domNode.addEventListener('contextmenu', stopClipboard)
    }
    editor.onKeyDown((e: any) => {
      const key = e.browserEvent?.key?.toLowerCase?.()
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(key)) { e.preventDefault(); e.stopPropagation() }
    })
    if (monaco?.KeyMod && monaco?.KeyCode) {
      [monaco.KeyCode.KEY_C, monaco.KeyCode.KEY_V, monaco.KeyCode.KEY_X, monaco.KeyCode.KEY_A].forEach(keyCode => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | keyCode, () => null)
      })
    }
  }

  const getMonacoLanguage = (lang: string) => {
    const map: Record<string, string> = {
      javascript: 'javascript', typescript: 'typescript', python: 'python',
      java: 'java', cpp: 'cpp', c: 'c', csharp: 'csharp', go: 'go', rust: 'rust', php: 'php', ruby: 'ruby',
    }
    return map[lang] || 'plaintext'
  }

  const editorTheme = {
    base: 'vs-dark', inherit: true,
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner animation="border" style={{ color: '#6c63ff' }} />
      </div>
    )
  }

  // ─── INPUT STYLES ─────────────────────────────────────────────────────────
  const filterBoxStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '7px 12px', background: '#fff', gap: 8,
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* ── Page Header ── */}
      <div style={{ padding: '24px 28px 0' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>College Lab Programs</h1>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 20 }}>
          Practice industry oriented programs specially designed for your year and branch.
        </p>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 22 }}>
          {/* Year */}
          <div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: 3 }}>Select Year</div>
            <div style={{ position: 'relative' }}>
              <select
                value={yearFilter || studentYear || ''}
                onChange={e => setYearFilter(e.target.value)}
                style={{ ...filterBoxStyle as any, minWidth: 120, fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: 30 }}
              >
                <option value="">All Years</option>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
          {/* Branch */}
          <div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: 3 }}>Select Branch</div>
            <div style={{ position: 'relative' }}>
              <select
                value={branchFilter || studentBranch || ''}
                onChange={e => setBranchFilter(e.target.value)}
                style={{ ...filterBoxStyle as any, minWidth: 220, fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: 30 }}
              >
                <option value="">All Branches</option>
                {allBranches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 320 }}>
            <div style={filterBoxStyle}>
              <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.82rem', color: '#0f172a', width: '100%', background: 'transparent' }}
              />
            </div>
          </div>
          {/* Difficulty */}
          <div style={{ position: 'relative' }}>
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              style={{ ...filterBoxStyle as any, fontSize: '0.82rem', color: '#0f172a', cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: 30, minWidth: 120 }}
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'flex', gap: 20, padding: '0 28px 32px', alignItems: 'flex-start' }}>

        {/* ──────── LEFT: Programs ──────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 0 }}>
            {[
              { key: 'available', label: `Available Programs` },
              { key: 'completed', label: `Completed (${completedCount})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? '#6c63ff' : '#64748b',
                borderBottom: activeTab === tab.key ? '2.5px solid #6c63ff' : '2.5px solid transparent',
                marginBottom: -2,
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 70px 80px 80px 140px 150px',
              padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
            }}>
              {['Program', 'Year', 'Branch', 'Tasks', 'Progress', 'Action'].map(h => (
                <div key={h} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {filteredLabs.length === 0 ? (
              <div style={{ padding: '52px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No programs found</div>
                <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  {activeTab === 'available' ? 'Check back later for new programs' : 'Complete some available programs first'}
                </div>
              </div>
            ) : (
              paginatedLabs.map((lab, idx) => {
                const { Icon: PIcon, color: pColor, bg: pBg } = getProgramIcon(lab.title)
                const isCompleted = completedPrograms.includes(lab._id)
                const progress = isCompleted ? 100 : 0
                const cfg = DIFFICULTY_CONFIG[lab.difficulty] || DIFFICULTY_CONFIG.Beginner
                return (
                  <div
                    key={lab._id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) 70px 80px 80px 140px 150px',
                      padding: '14px 16px',
                      borderBottom: idx < paginatedLabs.length - 1 ? '1px solid #f1f5f9' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Program col */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: pBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PIcon size={18} style={{ color: pColor }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lab.title}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748b', lineHeight: 1.4, marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {lab.description}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: 20, padding: '1px 8px', fontSize: '0.62rem', fontWeight: 700 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                            {lab.difficulty}
                          </span>
                          {lab.tags?.slice(0, 3).map(t => (
                            <span key={t} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 600 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Year */}
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{lab.year || '—'}</div>

                    {/* Branch */}
                    <div style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lab.branch || '—'}</div>

                    {/* Tasks */}
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{lab.testCases?.length || 0}</div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Test Cases</div>
                    </div>

                    {/* Progress */}
                    <div style={{ paddingRight: 8 }}>
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 600, marginBottom: 5,
                        color: isCompleted ? '#16a34a' : progress > 0 ? '#6c63ff' : '#94a3b8',
                      }}>
                        {isCompleted ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', minWidth: 0 }}>
                          <div style={{
                            height: '100%', borderRadius: 10, width: `${progress}%`, transition: 'width 0.3s',
                            background: isCompleted ? '#16a34a' : progress > 0 ? '#6c63ff' : 'transparent',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', flexShrink: 0, minWidth: 26, textAlign: 'right' }}>{progress}%</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <button
                        onClick={() => handleShowDetails(lab)}
                        style={{
                          padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                          fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap',
                          background: isCompleted ? '#f0fdf4' : '#fff',
                          color: isCompleted ? '#16a34a' : '#f59e0b',
                          border: isCompleted ? '1.5px solid #bbf7d0' : '1.5px solid #f59e0b',
                        }}
                      >
                        {isCompleted ? '✓ Review' : 'Start Program →'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {filteredLabs.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '0 4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLabs.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLabs.length)} of {filteredLabs.length} programs
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
                >← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>…</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
                          background: currentPage === p ? '#6c63ff' : '#fff',
                          color: currentPage === p ? '#fff' : '#374151',
                          fontSize: '0.8rem', fontWeight: currentPage === p ? 700 : 400, cursor: 'pointer',
                        }}
                      >{p}</button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
                >Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* ──────── RIGHT: Sidebar ──────── */}
        <div style={{ width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Program Progress */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 14 }}>Program Progress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <DonutChart percentage={progressPct} color="#6c63ff" />
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Completed', value: completedCount, color: '#16a34a' },
                  { label: 'Not Started', value: notStartedCount, color: '#94a3b8' },
                  { label: 'Total Programs', value: totalCount, color: '#6c63ff' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <span style={{ fontSize: '0.73rem', color: '#64748b' }}>{item.label}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px solid #6c63ff', background: '#fff', color: '#6c63ff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              View My Progress
            </button>
          </div>

          {/* How It Works */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 14 }}>How It Works</div>
            {[
              { num: '1', title: 'Choose a Program', desc: 'Select a program based on your year and branch.', color: '#6c63ff', bg: '#f0eeff' },
              { num: '2', title: 'Learn & Practice', desc: 'Go through modules, complete tasks and practice regularly.', color: '#10b981', bg: '#f0fdf4' },
              { num: '3', title: 'Track Progress', desc: 'Your progress will be saved automatically as you complete modules.', color: '#f59e0b', bg: '#fffbeb' },
              { num: '4', title: 'Complete & Earn', desc: 'Finish all modules and earn a certificate of completion.', color: '#ef4444', bg: '#fff1f2' },
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: step.color }}>{step.num}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{step.title}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4, marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Skills */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 12 }}>Top Skills You Will Gain</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(allTags.length > 0
                ? allTags.slice(0, 12)
                : ['Problem Solving', 'Programming', 'Web Development', 'Database Management', 'Cloud Computing', 'Machine Learning', 'Cyber Security']
              ).map(tag => (
                <span key={tag} style={{ background: '#f0eeff', color: '#6c63ff', borderRadius: 20, padding: '4px 11px', fontSize: '0.68rem', fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
            <button style={{ marginTop: 12, background: 'none', border: 'none', color: '#6c63ff', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              View All Skills →
            </button>
          </div>
        </div>
      </div>

      {/* ──────── CODE EDITOR MODAL (dark) ──────── */}
      {showModal && selectedLab && createPortal(
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-toast-area">
              <Toast onClose={() => setToastState(p => ({ ...p, show: false }))} show={toastState.show} delay={5000} autohide bg={toastState.variant}>
                <Toast.Header closeButton>
                  <strong className="me-auto">{toastState.title}</strong>
                </Toast.Header>
                <Toast.Body className="toast-body-text">{toastState.message}</Toast.Body>
              </Toast>
            </div>

            {/* Modal Header */}
            <div className="modal-header-custom">
              <div className="modal-title-wrapper">
                <span className="modal-icon"><Laptop size={22} strokeWidth={2} /></span>
                <h3 className="modal-title">{selectedLab.title}</h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: DIFFICULTY_CONFIG[selectedLab.difficulty]?.bg, border: `1px solid ${DIFFICULTY_CONFIG[selectedLab.difficulty]?.border}`, color: DIFFICULTY_CONFIG[selectedLab.difficulty]?.color, borderRadius: '20px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: DIFFICULTY_CONFIG[selectedLab.difficulty]?.dot, display: 'inline-block' }} />
                  {selectedLab.difficulty}
                </span>
              </div>
              <div className="modal-right-controls">
                <div className="language-bar">
                  <span className="language-label">Select Language:</span>
                  <select value={language} onChange={(e) => { const l = e.target.value; setLanguage(l); setCode(DEFAULT_CODE[l] || DEFAULT_CODE.python); setResult(null) }} className="language-select">
                    {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                  </select>
                </div>
                <button className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="split-layout">
              <div className="split-left">
                <div className="content-section description-section">
                  <h6 className="section-title"><span className="title-icon"><BookOpen size={16} strokeWidth={2} /></span> Description</h6>
                  <p className="section-content">{selectedLab.description}</p>
                </div>
                <div className="content-section">
                  <h6 className="section-title"><span className="title-icon"><FlaskConical size={16} strokeWidth={2} /></span> Test Cases ({selectedLab.testCases?.length || 0})</h6>
                  <div className="test-cases-list">
                    {selectedLab.testCases?.map((tc, idx) => (
                      <div key={idx} className="test-case-card">
                        <div className="test-case-header"><span className="test-case-number">#{idx + 1}</span></div>
                        <div className="test-case-content">
                          <div className="test-case-row">
                            <span className="row-label">Input:</span>
                            <code className="row-value">{tc.input || '(empty)'}</code>
                          </div>
                          <div className="test-case-row">
                            <span className="row-label">Expected:</span>
                            <code className="row-value">{tc.expectedOutput || '(empty)'}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedLab.timeLimitSeconds && (
                  <div className="content-section">
                    <h6 className="section-title"><span className="title-icon"><Clock3 size={16} strokeWidth={2} /></span> Constraints</h6>
                    <div className="info-row"><span>Time Limit:</span><strong>{formatDuration(selectedLab.timeLimitSeconds)}</strong></div>
                    {selectedLab.maxScore && <div className="info-row"><span>Max Score:</span><strong>{selectedLab.maxScore}</strong></div>}
                  </div>
                )}
              </div>

              <div className="split-right">
                <div className="editor-section">
                  <div className="editor-header">
                    <span className="editor-icon"><PencilLine size={14} strokeWidth={2.2} /></span>
                    <span>Code Editor</span>
                    <button type="button" className="terminal-toggle-btn" onClick={() => setShowTerminal(p => !p)}>
                      {showTerminal ? 'Hide Terminal ▲' : 'Show Terminal ▼'}
                    </button>
                  </div>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={handleEditorDidMount}
                    theme="custom-dark"
                    beforeMount={(monaco) => monaco.editor.defineTheme('custom-dark', editorTheme)}
                    options={{
                      minimap: { enabled: false }, fontSize: 13,
                      fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true,
                      wordWrap: 'on', padding: { top: 10, bottom: 10 },
                      renderLineHighlight: 'all', cursorBlinking: 'smooth', contextmenu: false,
                    }}
                  />
                </div>
                {showTerminal && (
                  <div className="terminal-section expanded">
                    <div className="terminal-header">
                      <span className="terminal-icon"><Monitor size={14} strokeWidth={2.2} /></span>
                      <span>Terminal Output</span>
                      <button type="button" className="clear-terminal" onClick={() => setTerminalOutput('')}>Clear</button>
                      <button type="button" className="hide-terminal" onClick={() => setShowTerminal(false)}>▲</button>
                    </div>
                    <div className="terminal-content">
                      {message && (
                        <div className={`terminal-status ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>{message}</div>
                      )}
                      {result && result.tests && result.tests.length > 0 && (
                        <div className={`terminal-summary ${result.success ? 'passed' : 'failed'}`}>
                          <span>{result.success ? '✅ All Tests Passed' : '❌ Some Tests Failed'}</span>
                          <span>{result.tests.filter(t => t.passed).length}/{result.tests.length} passed</span>
                        </div>
                      )}
                      <pre className="terminal-text">{terminalOutput || 'Run your code to see output here...'}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-custom">
              <div className="action-buttons">
                <Button className="run-code-btn" onClick={runCode} disabled={isRunning}>
                  {isRunning ? <><Spinner animation="border" size="sm" className="me-2" />Running...</> : <>▶ Run Code</>}
                </Button>
                <Button className="run-btn" onClick={runTests} disabled={isRunning}>
                  {isRunning ? <><Spinner animation="border" size="sm" className="me-2" />Running...</> : <>▶ Run Tests</>}
                </Button>
                <Button className="submit-btn" onClick={submitLab} disabled={submitting || !code.trim()}>
                  {submitting ? <><Spinner animation="border" size="sm" className="me-2" />Submitting...</> : <>✓ Submit Solution</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
        , document.body)}

      <style>{`
        /* ── Modal Overlay ── */
        .modal-overlay {
          position: fixed; inset: 0; width: 100dvw; height: 100dvh;
          background: rgba(0,0,0,0.95); z-index: 2147483647;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-container {
          width: 100vw; height: 100vh; background: #000;
          border: none; border-radius: 0; overflow: hidden;
          display: flex; flex-direction: column; position: relative;
        }
        .modal-toast-area { position: absolute; top: 16px; right: 16px; z-index: 30; max-width: min(420px,92vw); }
        .modal-toast-area .toast { border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 28px rgba(0,0,0,0.45); }
        .modal-toast-area .toast-header { background: rgba(0,0,0,0.85); color: #fff; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .toast-body-text { color: #fff; font-size: 0.82rem; line-height: 1.35; white-space: normal; word-break: break-word; }

        /* ── Modal Header ── */
        .modal-header-custom {
          background: linear-gradient(135deg,#0a0a0a 0%,#111 100%);
          border-bottom: 2px solid #ff6b35; padding: 1rem 1.5rem;
          display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        }
        .modal-title-wrapper { display: flex; align-items: center; gap: 1rem; }
        .modal-right-controls { display: flex; align-items: center; gap: 1rem; }
        .modal-icon { display: inline-flex; align-items: center; color: #ff6b35; }
        .modal-title { color: #ff6b35; font-size: 1.25rem; font-weight: 600; margin: 0; }
        .modal-close {
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: all 0.3s;
        }
        .modal-close:hover { background: #ff6b35; }

        /* ── Modal Footer ── */
        .modal-footer-custom {
          background: linear-gradient(135deg,#0a0a0a 0%,#111 100%);
          border-top: 2px solid #ff6b35; padding: 1rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem; flex-shrink: 0;
        }

        /* ── Split layout ── */
        .split-layout { display: flex; flex: 1; overflow: hidden; }
        .split-left {
          flex: 0 0 34%; max-width: 34%; overflow-y: auto; padding: 1.5rem;
          border-right: 1px solid #333; background: #0a0a0a;
        }
        .split-right {
          flex: 1; display: flex; flex-direction: column; padding: 0.75rem;
          background: #050505; overflow: hidden; min-width: 0; gap: 0.75rem;
        }

        /* ── Left panel ── */
        .content-section { margin-bottom: 1.5rem; }
        .description-section { margin-bottom: 1rem; }
        .section-title { color: #ff6b35; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
        .title-icon { display: inline-flex; align-items: center; }
        .section-content { color: #d0d0d0; font-size: 0.85rem; line-height: 1.6; max-height: 110px; overflow-y: auto; padding-right: 4px; }
        .test-cases-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 52vh; overflow-y: auto; padding-right: 4px; }
        .test-case-card { background: #0d0d0d; border: 1px solid #222; border-radius: 10px; padding: 0.75rem; }
        .test-case-number { font-size: 0.7rem; color: #ff6b35; font-weight: 600; }
        .test-case-content { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
        .test-case-row, .info-row { display: flex; gap: 0.5rem; font-size: 0.75rem; }
        .row-label { color: #888; min-width: 60px; }
        .row-value { color: #fbbf24; font-family: monospace; }
        .info-row { justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #222; color: #ccc; }

        /* ── Right panel: language / editor / terminal ── */
        .language-bar { display: flex; align-items: center; gap: 0.5rem; }
        .language-label { font-size: 0.85rem; color: #888; }
        .language-select { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.85rem; }
        .editor-section { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .editor-header { background: #0a0a0a; border: 1px solid #333; border-bottom: none; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #ff6b35; display: flex; align-items: center; gap: 0.5rem; }
        .editor-icon { display: inline-flex; align-items: center; }
        .terminal-toggle-btn { margin-left: auto; background: #111; border: 1px solid #333; color: #28a745; border-radius: 6px; font-size: 0.72rem; padding: 0.2rem 0.55rem; cursor: pointer; }
        .terminal-toggle-btn:hover { border-color: #28a745; }
        .terminal-section { flex: 0; display: flex; flex-direction: column; min-height: 0; }
        .terminal-section.expanded { flex: 0.8; min-height: 150px; }
        .terminal-header { background: #0a0a0a; border: 1px solid #333; padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #28a745; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
        .terminal-section.expanded .terminal-header { border-bottom: none; }
        .terminal-icon { display: inline-flex; align-items: center; }
        .clear-terminal { margin-left: auto; background: transparent; border: none; color: #888; font-size: 0.7rem; cursor: pointer; }
        .clear-terminal:hover { color: #ff6b35; }
        .hide-terminal { background: transparent; border: none; color: #a3a3a3; font-size: 0.8rem; cursor: pointer; padding: 0; }
        .hide-terminal:hover { color: #fff; }
        .terminal-content { background: #0b0b0b; border: 1px solid #333; flex: 1; overflow-y: auto; padding: 0.75rem; }
        .terminal-status { margin-bottom: 0.6rem; padding: 0.45rem 0.6rem; border-radius: 8px; font-size: 0.78rem; border: 1px solid transparent; }
        .terminal-status.success { color: #28a745; background: rgba(40,167,69,0.12); border-color: #28a745; }
        .terminal-status.error { color: #dc3545; background: rgba(220,53,69,0.12); border-color: #dc3545; }
        .terminal-status.info { color: #ff9a5c; background: rgba(255,154,92,0.12); border-color: #ff9a5c; }
        .terminal-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; padding: 0.45rem 0.6rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; border: 1px solid transparent; }
        .terminal-summary.passed { color: #28a745; background: rgba(40,167,69,0.12); border-color: #28a745; }
        .terminal-summary.failed { color: #dc3545; background: rgba(220,53,69,0.12); border-color: #dc3545; }
        .terminal-text { color: #28a745; font-family: 'Consolas',monospace; font-size: 0.75rem; margin: 0; white-space: pre-wrap; word-wrap: break-word; }

        /* ── Action buttons ── */
        .action-buttons { display: flex; gap: 0.6rem; justify-content: flex-end; }
        .run-code-btn, .run-btn, .submit-btn {
          flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; padding: 0.42rem 0.8rem; font-weight: 600; font-size: 0.82rem;
          min-width: 135px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.3s;
        }
        .run-code-btn { background: linear-gradient(135deg,#1f2937 0%,#374151 100%); color: #fff; border: 1px solid #4b5563; }
        .run-code-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(75,85,99,0.35); }
        .run-btn { background: linear-gradient(135deg,#ff6b35 0%,#ff9a5c 100%); color: #fff; }
        .run-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,107,53,0.4); }
        .submit-btn { background: linear-gradient(135deg,#28a745 0%,#34ce57 100%); color: #fff; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(40,167,69,0.4); }
        .run-code-btn:disabled, .run-btn:disabled, .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Scrollbars (modal) ── */
        .split-left::-webkit-scrollbar, .terminal-content::-webkit-scrollbar { width: 6px; }
        .split-left::-webkit-scrollbar-track, .terminal-content::-webkit-scrollbar-track { background: #1a1a1a; }
        .split-left::-webkit-scrollbar-thumb, .terminal-content::-webkit-scrollbar-thumb { background: #ff6b35; border-radius: 3px; }

        @media (max-width: 992px) {
          .split-layout { flex-direction: column; }
          .split-left { flex: 1 1 auto; max-width: 100%; border-right: none; border-bottom: 1px solid #333; max-height: 300px; }
        }
      `}</style>
    </div>
  )
}

export default StudentCollegeLabsPage
