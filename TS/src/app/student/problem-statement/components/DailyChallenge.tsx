import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Button, Card, Spinner, Form, Nav } from 'react-bootstrap'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { sql } from '@codemirror/lang-sql'
import { json } from '@codemirror/lang-json'
import { useAuthContext } from '@/context/useAuthContext'
import MySubmissions from './MySubmissions'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { githubLight } from '@uiw/codemirror-theme-github'


const languageOptions = [
  { label: 'JavaScript', value: 'javascript', extension: javascript },
  { label: 'Python', value: 'python', extension: python },
  { label: 'C++', value: 'cpp', extension: cpp },
  { label: 'C', value: 'c', extension: cpp }, // reuse cpp highlighter
  { label: 'Java', value: 'java', extension: java },
  { label: 'HTML', value: 'html', extension: html },
  { label: 'CSS', value: 'css', extension: css },
  { label: 'SQL', value: 'sql', extension: sql },
  { label: 'JSON', value: 'json', extension: json },
]


const StudentChallengeView: React.FC = () => {
  const [challenge, setChallenge] = useState<any>(null)
  const [tab, setTab] = useState('description')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [loadingChallenge, setLoadingChallenge] = useState(true)
  const [runningCode, setRunningCode] = useState(false)
  const [code, setCode] = useState('// Write your solution here')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [language, setLanguage] = useState('javascript')
  const { user } = useAuthContext()
  const token = user?.token

  const getLangExtension = () => {
    const lang = languageOptions.find((l) => l.value === language)
    return lang ? lang.extension() : javascript()
  }

  useEffect(() => {
    if (!token) return
    setLoadingChallenge(true)
    fetch(`${baseURL}/student/challenge/today`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setChallenge(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingChallenge(false))
  }, [token])

  const handleRunCode = async () => {
    setRunningCode(true)
    setOutput('Running code...')

    try {
      const res = await fetch(`${baseURL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemId: challenge._id, code, language }),
      })
      const data = await res.json()
      const passed = data.result.filter((r: any) => r.passed).length
      const total = data.result.length
      const resultDetails = data.result
        .map(
          (r: any, i: number) =>
            `🔹 Test ${i + 1}\nInput: ${r.input}\nExpected: ${r.expectedOutput}\nActual: ${r.actualOutput}\nResult: ${r.passed ? '✅ Passed' : '❌ Failed'}`,
        )
        .join('\n\n')
      setOutput(`Passed ${passed}/${total} test cases\n\n${resultDetails}`)
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`)
    } finally {
      setRunningCode(false)
    }
  }

  // ---------- UI ----------
  if (loadingChallenge) return <Spinner animation="border" className="d-block mx-auto my-5" />
  if (error || !challenge) return <p className="text-center text-danger">No challenge available</p>

  return (
    <Container fluid className="my-3">
      <Row style={{ height: '80vh' }}>
        {/* LEFT PANEL */}
        <Col md={5} className="d-flex flex-column">
          <Card className="flex-grow-1 shadow-sm">
            <Card.Header>
              <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k || 'description')}>
                <Nav.Item>
                  <Nav.Link eventKey="description">Description</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="discussion">Discussion</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="submissions">Submissions</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body style={{ overflowY: 'auto' }}>
              {tab === 'description' && (
                <>
                  <h5>{challenge.title}</h5>
                  <div dangerouslySetInnerHTML={{ __html: challenge.description }} />
                  <p>
                    <strong>Sample Input:</strong> <code>{challenge.sampleInput}</code>
                  </p>
                  <p>
                    <strong>Sample Output:</strong> <code>{challenge.sampleOutput}</code>
                  </p>
                  <h6>Test Cases:</h6>
                  <ul>
                    {challenge.testCases?.map((t: any, i: number) => (
                      <li key={i}>
                        <b>Input:</b> {t.input} | <b>Expected:</b> {t.expectedOutput}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {tab === 'discussion' && <p>💬 Discussion coming soon...</p>}
              {tab === 'submissions' && <MySubmissions />}
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT PANEL */}
        <Col md={7} className="d-flex flex-column">
          {/* Lang Dropdown */}
          <Form.Select className="mb-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </Form.Select>

          {/* Editor + Output inside same card */}
          <Card className="flex-grow-1 shadow-sm d-flex flex-column">
            <Card.Body className="p-0 flex-grow-1 d-flex flex-column">
              <CodeMirror
                height="100%"
                theme={githubLight}
                extensions={[getLangExtension()]}
                value={code}
                onChange={(value) => {
                  // Auto insert newline after every 150 characters
                  const maxLineLength = 80
                  const lines = value.split('\n').map((line) => {
                    if (line.length > maxLineLength) {
                      // Break line automatically
                      return line.match(new RegExp(`.{1,${maxLineLength}}`, 'g'))?.join('\n') || line
                    }
                    return line
                  })
                  setCode(lines.join('\n'))
                }}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightActiveLineGutter: true,
                  foldGutter: false,
                  autocompletion: false,
                  indentOnInput: false,
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  alert('⚠️ Pasting is disabled during challenges.')
                }}
                onDrop={(e) => e.preventDefault()} // Prevent drag-drop paste
                onKeyDown={(e) => {
                  // Prevent paste shortcuts (Ctrl+V / Cmd+V)
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                    e.preventDefault()
                    alert('⚠️ Paste is disabled.')
                  }
                }}
              />

              {/* Output stays fixed area below editor, scrollable */}
              {output && (
                <div className="border-top mt-2 p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="d-flex justify-content-between">
                    <strong>📤 Output</strong>
                    <Button size="sm" variant="outline-danger" onClick={() => setOutput('')}>
                      Close
                    </Button>
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{output}</pre>
                </div>
              )}
            </Card.Body>

            {/* Sticky footer */}
            <Card.Footer className="text-center">
              <Button variant="primary" className="me-2" onClick={handleRunCode} disabled={runningCode}>
                {runningCode ? 'Running...' : 'Run'}
              </Button>
              <Button variant="success" disabled={alreadySubmitted}>
                {alreadySubmitted ? 'Submitted' : 'Submit'}
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default StudentChallengeView
