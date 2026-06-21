import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { createPortal } from 'react-dom'
import { Button, Spinner, Alert, Badge, Card, Form, Row, Col, InputGroup, Toast } from 'react-bootstrap'
import { BookOpen, Clock3, FlaskConical, Laptop, PencilLine, Monitor, Search, BarChart3, CheckCircle2, ListChecks, FileText, Target } from 'lucide-react'
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
  Beginner:     { color: '#4ade80', dot: '#22c55e', bg: '#052e16', border: '#166534' },
  Intermediate: { color: '#fbbf24', dot: '#f59e0b', bg: '#1c1200', border: '#78350f' },
  Advanced:     { color: '#f87171', dot: '#ef4444', bg: '#1f0a0a', border: '#7f1d1d' },
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Beginner
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, borderRadius: '20px',
      padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.3px', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />
      {difficulty}
    </span>
  )
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

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}m`
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
                  <div key={idx} style={{ background: test.passed ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)', border: `1px solid ${test.passed ? '#28a74533' : '#dc354533'}`, borderRadius: '6px', padding: '10px' }}>
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

  // State
  const [labs, setLabs] = useState<LabProgram[]>([])
  const [completedPrograms, setCompletedPrograms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Student's own branch & joining year (auto-filter)
  const studentBranch = user?.branch || user?.department || ''
  const studentYear = user?.joiningYear || ''

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState<LabProgram | null>(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  
  // Tab state
  const [activeTab, setActiveTab] = useState('available')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 50
  
  // Results state
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<JudgeResult | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [terminalOutput, setTerminalOutput] = useState('')
  const editorRef = useRef<any | null>(null)
  const [toastState, setToastState] = useState<{
    show: boolean
    title: string
    message: string
    variant: 'success' | 'danger' | 'warning' | 'info'
  }>({ show: false, title: '', message: '', variant: 'info' })

  const showToast = (
    title: string,
    text: string,
    variant: 'success' | 'danger' | 'warning' | 'info' = 'info'
  ) => {
    setToastState({ show: true, title, message: text, variant })
  }

  // Fetch labs
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
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch lab programs')
        }

        const list = Array.isArray(data.data) ? data.data : []
        setLabs(list)
        
        const completed = localStorage.getItem('completedPrograms')
        if (completed) {
          setCompletedPrograms(JSON.parse(completed))
        }
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

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showModal])

  // Filter labs — auto-apply student's branch & joining year
  const filteredLabs = React.useMemo(() => {
    let filtered = labs

    // Auto-filter: only show labs matching this student's branch and joining year
    if (studentBranch) {
      filtered = filtered.filter(lab => !lab.branch || lab.branch === studentBranch)
    }
    if (studentYear) {
      filtered = filtered.filter(lab => !lab.year || lab.year === studentYear)
    }

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
  }, [labs, completedPrograms, activeTab, searchTerm, difficultyFilter, studentBranch, studentYear])

  const totalPages = Math.max(1, Math.ceil(filteredLabs.length / ITEMS_PER_PAGE))

  const paginatedLabs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredLabs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredLabs, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, difficultyFilter])

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

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
    if (!code.trim()) {
      setMessage('Please write your code before running.')
      setShowTerminal(true)
      return
    }

    setIsRunning(true)
    setShowTerminal(true)
    setResult(null)
    setMessage('')
    setTerminalOutput('Running current code...\n')

    try {
      const sampleInput = selectedLab.testCases?.[0]?.input || ''
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin: unescapeText(sampleInput),
        }),
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
    if (!code.trim()) {
      setMessage('Please write your code before running tests.')
      return
    }

    setIsRunning(true)
    setShowTerminal(true)
    setMessage('')
    setTerminalOutput('Running tests...\n')

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
          body: JSON.stringify({
            language,
            code,
            stdin: unescapeText(tc.input),
          }),
        })

        const data = await res.json()
        const actualOutput = String(data?.stdout || '').trim()
        const expectedOutput = unescapeText(tc.expectedOutput).trim()
        const passed = res.ok && Number(data?.exitCode) === 0 && actualOutput === expectedOutput

        terminalLog += `   Actual: ${actualOutput || '(empty)'}\n`
        terminalLog += `   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`
        if (data?.stderr) terminalLog += `   Error: ${data.stderr}\n`

        runResults.push({
          index: i + 1,
          input: tc.input,
          expectedOutput,
          actualOutput,
          stderr: String(data?.stderr || ''),
          passed,
        })
      }

      setTerminalOutput(terminalLog)
      
      const allPassed = runResults.every(r => r.passed)
      setResult({
        success: allPassed,
        stdout: `Tests completed: ${runResults.filter(r => r.passed).length}/${runResults.length} passed`,
        stderr: '',
        exitCode: allPassed ? 0 : 1,
        tests: runResults,
      })

      if (allPassed) {
        setMessage('✅ All test cases passed! You can now submit your solution.')
      } else {
        setMessage('❌ Some test cases failed. Fix your code and run again.')
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to run test cases')
      setTerminalOutput(`Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const submitLab = async () => {
    if (!selectedLab || !token || !code.trim()) return

    setSubmitting(true)
    setMessage('')

    try {
      const res = await fetch(`${baseURL}/api/institute/college-labs/${selectedLab._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      setTimeout(() => {
        handleCloseModal()
        setActiveTab('completed')
      }, 1500)
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  return (
    <div className="college-labs-container">
      <div className="container-fluid px-4 py-4">
        {/* Header */}
        <div className="header-section mb-4">
          <h1 className="page-title">
            <span className="title-icon"><Laptop size={28} strokeWidth={2} /></span>
            College Lab Programs
          </h1>
          <p className="page-subtitle">
            Practice coding problems, run tests, and submit solutions to complete programs
          </p>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar mb-4">
          <Row className="g-3 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="search-icon"><Search size={14} strokeWidth={2.2} /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search programs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              {/* Batch info chip */}
              {(studentBranch || studentYear) ? (
                <div className="batch-chip">
                  <span className="batch-chip-label">Your Batch</span>
                  {studentBranch && <span className="batch-chip-branch">{studentBranch}</span>}
                  {studentYear && <span className="batch-chip-year">Joined {studentYear}</span>}
                </div>
              ) : (
                <div className="batch-chip batch-chip-unknown">
                  <span className="batch-chip-label">Batch not set — showing all</span>
                </div>
              )}
            </Col>
            <Col md={2}>
              <div className="stats-badge" style={{ flexDirection: 'column', gap: '0.3rem' }}>
                <span className="stat-item"><span className="stat-icon"><BookOpen size={14} strokeWidth={2} /></span>Total: {filteredLabs.length}</span>
                <span className="stat-item"><span className="stat-icon"><CheckCircle2 size={14} strokeWidth={2} /></span>Done: {completedPrograms.length}</span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Tabs */}
        <div className="tabs-wrapper mb-4">
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
              <span className="tab-icon"><ListChecks size={14} strokeWidth={2} /></span> Available Programs <Badge className="tab-badge">{filteredLabs.length}</Badge>
            </button>
            <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
              <span className="tab-icon"><CheckCircle2 size={14} strokeWidth={2} /></span> Completed Programs <Badge className="tab-badge">{completedPrograms.length}</Badge>
            </button>
          </div>
        </div>

        {/* Programs Grid */}
        {filteredLabs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No programs found</p>
            <small>{activeTab === 'available' ? 'Check back later for new programs' : 'Start with an available program to build your portfolio'}</small>
          </div>
        ) : (
          <>
            <div className="programs-grid">
              {paginatedLabs.map((lab) => (
              <Card key={lab._id} className="program-card">
                <Card.Body>
                  <div className="card-header-custom">
                    <Card.Title>{lab.title}</Card.Title>
                    <DifficultyBadge difficulty={lab.difficulty} />
                  </div>
                  <p className="card-description">{lab.description.substring(0, 100)}...</p>
                  <div className="card-meta">
                    <span className="meta-item"><FileText size={14} strokeWidth={2} className="meta-icon" /> {lab.testCases?.length || 0} test cases</span>
                    {lab.timeLimitSeconds && <span className="meta-item"><Clock3 size={14} strokeWidth={2} className="meta-icon" /> {formatDuration(lab.timeLimitSeconds)}</span>}
                    {lab.maxScore && <span className="meta-item"><Target size={14} strokeWidth={2} className="meta-icon" /> Max Score: {lab.maxScore}</span>}
                  </div>
                  {(lab.branch || lab.year) && (
                    <div className="card-tags">
                      {lab.branch && <span className="card-tag tag-branch">{lab.branch}</span>}
                      {lab.year && <span className="card-tag tag-year">{lab.year}</span>}
                    </div>
                  )}
                  <Button className="view-btn" onClick={() => handleShowDetails(lab)}>
                    View Program →
                  </Button>
                </Card.Body>
              </Card>
              ))}
            </div>

            {filteredLabs.length > ITEMS_PER_PAGE && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLabs.length)} of {filteredLabs.length} programs
                </div>

                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && <span className="page-ellipsis">...</span>}
                        <button
                          className={`page-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Left Description + Right Terminal */}
      {showModal && selectedLab && createPortal(
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-toast-area">
              <Toast
                onClose={() => setToastState((prev) => ({ ...prev, show: false }))}
                show={toastState.show}
                delay={5000}
                autohide
                bg={toastState.variant}
              >
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
                <DifficultyBadge difficulty={selectedLab.difficulty} />
              </div>
              <div className="modal-right-controls">
                <div className="language-bar">
                  <span className="language-label">Select Language:</span>
                  <select
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value
                      setLanguage(newLang)
                      setCode(DEFAULT_CODE[newLang] || DEFAULT_CODE.python)
                      setResult(null)
                    }}
                    className="language-select"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <button className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
            </div>

            {/* Modal Body - Split Layout */}
            <div className="split-layout">
              {/* Left Side - Program Description */}
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
                        <div className="test-case-header">
                          <span className="test-case-number">#{idx + 1}</span>
                        </div>
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
                    <div className="info-row">
                      <span>Time Limit:</span>
                      <strong>{formatDuration(selectedLab.timeLimitSeconds)}</strong>
                    </div>
                    {selectedLab.maxScore && (
                      <div className="info-row">
                        <span>Max Score:</span>
                        <strong>{selectedLab.maxScore}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Code Editor & Terminal */}
              <div className="split-right">
                {/* Code Editor */}
                <div className="editor-section">
                  <div className="editor-header">
                    <span className="editor-icon"><PencilLine size={14} strokeWidth={2.2} /></span>
                    <span>Code Editor</span>
                    <button
                      type="button"
                      className="terminal-toggle-btn"
                      onClick={() => setShowTerminal((prev) => !prev)}
                    >
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
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      padding: { top: 10, bottom: 10 },
                      renderLineHighlight: 'all',
                      cursorBlinking: 'smooth',
                      contextmenu: false,
                    }}
                  />
                </div>

                {/* Terminal Output */}
                {showTerminal && (
                  <div className="terminal-section expanded">
                    <div className="terminal-header">
                      <span className="terminal-icon"><Monitor size={14} strokeWidth={2.2} /></span>
                      <span>Terminal Output</span>
                      <button
                        type="button"
                        className="clear-terminal"
                        onClick={() => setTerminalOutput('')}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="hide-terminal"
                        onClick={() => setShowTerminal(false)}
                      >
                        ▲
                      </button>
                    </div>
                    <div className="terminal-content">
                      {message && (
                        <div className={`terminal-status ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
                          {message}
                        </div>
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
              {/* Action Buttons */}
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
        .college-labs-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header */
        .header-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .title-icon {
          font-size: 2rem;
          display: inline-flex;
          align-items: center;
        }

        .page-subtitle {
          color: #888888;
          font-size: 1rem;
        }

        /* Filters Bar */
        .filters-bar {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          padding: 1rem;
        }

        .search-icon {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ff6b35;
        }

        .search-input {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
        }

        .search-input:focus {
          background: #1a1a1a;
          border-color: #ff6b35;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
        }

        .filter-select {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
        }

        .stats-badge {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .stat-item {
          background: #1a1a1a;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #888888;
        }

        .stat-icon {
          display: inline-flex;
          align-items: center;
          color: #ff9a5c;
        }

        /* Batch chip */
        .batch-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #0c1a2e;
          border: 1px solid #1e3a5f;
          border-radius: 10px;
          padding: 0.45rem 0.85rem;
          flex-wrap: wrap;
        }

        .batch-chip-unknown {
          background: #1a1a1a;
          border-color: #333;
        }

        .batch-chip-label {
          font-size: 0.7rem;
          color: #60a5fa;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .batch-chip-branch {
          font-size: 0.78rem;
          font-weight: 700;
          color: #ffffff;
          background: rgba(96, 165, 250, 0.18);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .batch-chip-year {
          font-size: 0.78rem;
          color: #fb923c;
          font-weight: 600;
          background: rgba(251, 146, 60, 0.12);
          padding: 2px 8px;
          border-radius: 6px;
        }

        /* Tabs */
        .tabs-wrapper {
          border-bottom: 2px solid #333333;
        }

        .tabs-header {
          display: flex;
          gap: 0.5rem;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: #888888;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-icon {
          display: inline-flex;
          align-items: center;
        }

        .tab-btn.active {
          color: #ff6b35;
          border-bottom: 3px solid #ff6b35;
        }

        .tab-badge {
          background: rgba(255,107,53,0.15) !important;
          color: #ff6b35 !important;
          border: 1px solid rgba(255,107,53,0.3) !important;
          margin-left: 0.5rem;
          font-weight: 700;
        }

        /* Programs Grid */
        .programs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .program-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .program-card:hover {
          transform: translateY(-4px);
          border-color: #ff6b35;
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
        }

        .card-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-header-custom .card-title {
          color: #ff6b35;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .card-description {
          color: #b0b0b0;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          font-size: 0.75rem;
          color: #888888;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .meta-icon {
          color: #ff9a5c;
        }

        .card-tags {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .card-tag {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .tag-branch {
          background: #0c1a2e;
          color: #60a5fa;
          border: 1px solid #1e3a5f;
        }

        .tag-year {
          background: #1a0e00;
          color: #fb923c;
          border: 1px solid #7c2d12;
        }

        .view-btn {
          width: 100%;
          background: transparent;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          transition: all 0.3s ease;
        }

        .view-btn:hover {
          background: #ff6b35;
          color: #ffffff;
        }

        .pagination-wrapper {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .pagination-info {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .page-btn {
          background: #111827;
          border: 1px solid #374151;
          color: #e5e7eb;
          border-radius: 8px;
          padding: 0.35rem 0.7rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-btn:hover:not(:disabled) {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .page-btn.active {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #ffffff;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-ellipsis {
          color: #9ca3af;
          font-size: 0.85rem;
          padding: 0 0.15rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          width: 100dvw;
          height: 100dvh;
          background: rgba(0, 0, 0, 0.95);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-container {
          width: 100vw;
          height: 100vh;
          background: #000000;
          border: none;
          border-radius: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .modal-toast-area {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 30;
          max-width: min(420px, 92vw);
        }

        .modal-toast-area .toast {
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
        }

        .modal-toast-area .toast-header {
          background: rgba(0, 0, 0, 0.85);
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .toast-body-text {
          color: #ffffff;
          font-size: 0.82rem;
          line-height: 1.35;
          white-space: normal;
          word-break: break-word;
        }

        /* Modal Header */
        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        /* Modal Footer */
        .modal-footer-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-top: 2px solid #ff6b35;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-right-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-icon {
          display: inline-flex;
          align-items: center;
        }

        .modal-title {
          color: #ff6b35;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-close:hover {
          background: #ff6b35;
        }

        /* Split Layout */
        .split-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .split-left {
          flex: 0 0 34%;
          max-width: 34%;
          overflow-y: auto;
          padding: 1.5rem;
          border-right: 1px solid #333333;
          background: #0a0a0a;
        }

        .split-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          background: #050505;
          overflow: hidden;
          min-width: 0;
          gap: 0.75rem;
        }

        /* Left Side Content */
        .content-section {
          margin-bottom: 1.5rem;
        }

        .description-section {
          margin-bottom: 1rem;
        }

        .section-title {
          color: #ff6b35;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-content {
          color: #d0d0d0;
          font-size: 0.85rem;
          line-height: 1.6;
          max-height: 110px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .test-cases-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 52vh;
          overflow-y: auto;
          padding-right: 4px;
        }

        .test-case-card {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 10px;
          padding: 0.75rem;
        }

        .test-case-number {
          font-size: 0.7rem;
          color: #ff6b35;
          font-weight: 600;
        }

        .test-case-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .test-case-row, .info-row {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
        }

        .row-label {
          color: #888888;
          min-width: 60px;
        }

        .row-value {
          color: #fbbf24;
          font-family: monospace;
        }

        .info-row {
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #222222;
        }

        /* Right Side */
        .language-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .language-label {
          font-size: 0.85rem;
          color: #888888;
        }

        .language-select {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .editor-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .editor-header {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-bottom: none;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: #ff6b35;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .terminal-toggle-btn {
          margin-left: auto;
          background: #111111;
          border: 1px solid #333333;
          color: #28a745;
          border-radius: 6px;
          font-size: 0.72rem;
          padding: 0.2rem 0.55rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .terminal-toggle-btn:hover {
          border-color: #28a745;
          color: #34ce57;
        }

        .terminal-section {
          flex: 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .terminal-section.expanded {
          flex: 0.8;
          min-height: 150px;
        }

        .terminal-header {
          background: #0a0a0a;
          border: 1px solid #333333;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .terminal-section.expanded .terminal-header {
          border-bottom: none;
        }

        .clear-terminal {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #888888;
          font-size: 0.7rem;
          cursor: pointer;
        }

        .clear-terminal:hover {
          color: #ff6b35;
        }

        .hide-terminal {
          background: transparent;
          border: none;
          color: #a3a3a3;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 0;
        }

        .hide-terminal:hover {
          color: #ffffff;
        }

        .terminal-content {
          background: #0b0b0b;
          border: 1px solid #333333;
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
        }

        .terminal-status {
          margin-bottom: 0.6rem;
          padding: 0.45rem 0.6rem;
          border-radius: 8px;
          font-size: 0.78rem;
          border: 1px solid transparent;
        }

        .terminal-status.success {
          color: #28a745;
          background: rgba(40, 167, 69, 0.12);
          border-color: #28a745;
        }

        .terminal-status.error {
          color: #dc3545;
          background: rgba(220, 53, 69, 0.12);
          border-color: #dc3545;
        }

        .terminal-status.info {
          color: #ff9a5c;
          background: rgba(255, 154, 92, 0.12);
          border-color: #ff9a5c;
        }

        .terminal-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
          padding: 0.45rem 0.6rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .terminal-summary.passed {
          color: #28a745;
          background: rgba(40, 167, 69, 0.12);
          border-color: #28a745;
        }

        .terminal-summary.failed {
          color: #dc3545;
          background: rgba(220, 53, 69, 0.12);
          border-color: #dc3545;
        }

        .terminal-text {
          color: #28a745;
          font-family: 'Consolas', monospace;
          font-size: 0.75rem;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .action-buttons {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
        }

        .run-code-btn, .run-btn, .submit-btn {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.42rem 0.8rem;
          font-weight: 600;
          font-size: 0.82rem;
          min-width: 135px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .run-code-btn {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: #ffffff;
          border: 1px solid #4b5563;
        }

        .run-code-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(75, 85, 99, 0.35);
        }

        .run-btn {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          color: #ffffff;
        }

        .run-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .submit-btn {
          background: linear-gradient(135deg, #28a745 0%, #34ce57 100%);
          color: #ffffff;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }

        .run-code-btn:disabled, .run-btn:disabled, .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message {
          margin: 0;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.85rem;
        }

        .message.success {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
        }

        .message.error {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #dc3545;
        }

        .message.info {
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid #ff6b35;
          color: #ff6b35;
        }

        .results-summary {
          margin: 0;
        }

        .summary-header {
          padding: 0.75rem;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .summary-header.passed {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
        }

        .summary-header.failed {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #dc3545;
        }

        /* Scrollbars */
        .split-left::-webkit-scrollbar,
        .terminal-content::-webkit-scrollbar {
          width: 6px;
        }

        .split-left::-webkit-scrollbar-track,
        .terminal-content::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .split-left::-webkit-scrollbar-thumb,
        .terminal-content::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 3px;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .split-layout {
            flex-direction: column;
          }
          
          .split-left {
            flex: 1 1 auto;
            max-width: 100%;
            border-right: none;
            border-bottom: 1px solid #333333;
            max-height: 300px;
          }
          
          .stats-badge {
            justify-content: flex-start;
          }
        }

        @media (max-width: 768px) {
          .programs-grid {
            grid-template-columns: 1fr;
          }

          .pagination-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentCollegeLabsPage