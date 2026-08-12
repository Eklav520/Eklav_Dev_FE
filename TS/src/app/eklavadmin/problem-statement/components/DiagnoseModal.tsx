import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface TestCase {
  input: string
  output: string
}

interface Outcome {
  passed?: boolean
  received?: unknown
  error?: string
}

interface LanguageResult {
  code: string | null
  passed: boolean
  error: string | null
  outcomes: Outcome[]
}

interface Diagnosis {
  diagnosis: 'bad_test_data' | 'wrong_solution' | 'unclear'
  explanation: string
  testCaseFixes: Array<{ index: number; correctedOutput: string }>
  solutionFixes: Record<string, string>
}

interface DiagnoseResponse {
  alreadyPassing: boolean
  kind?: string
  testCases?: TestCase[]
  languageResults?: Record<string, LanguageResult>
  diagnosis?: Diagnosis
}

const LANGUAGES: Array<{ key: 'java' | 'javascript' | 'python'; label: string }> = [
  { key: 'java', label: 'Java' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
]

const DiagnoseModal = ({
  show,
  onClose,
  problemId,
  problemTitle,
  onApplied,
}: {
  show: boolean
  onClose: () => void
  problemId: string | null
  problemTitle: string
  onApplied: () => void
}) => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DiagnoseResponse | null>(null)

  // Editable copies of the AI's proposal — an admin can tweak before approving, not just
  // accept/reject verbatim (e.g. fixing the AI's own mistake, like a placeholder-text answer
  // it proposed that would never actually string-match).
  const [testCaseFixes, setTestCaseFixes] = useState<Array<{ index: number; correctedOutput: string }>>([])
  const [solutionFixes, setSolutionFixes] = useState<Record<string, string>>({})

  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ testResults: Record<string, LanguageResult> } | null>(null)

  const latestRequestRef = useRef<symbol | null>(null)

  useEffect(() => {
    if (!show || !problemId) return
    // Request-sequencing guard: without this, opening/closing/reopening the modal quickly (or
    // re-diagnosing the same problem twice) can let an OLDER, slower-resolving request (e.g.
    // one still waiting on a queued judge0 submission or a slow OpenAI call) land AFTER a newer
    // one and silently overwrite it — showing a stale diagnosis for however long the older
    // request happened to take, with no way to tell it apart from a fresh one. Each effect run
    // gets its own token; a resolved response is only applied if its token is still current.
    const requestToken = Symbol()
    latestRequestRef.current = requestToken
    setLoading(true)
    setError('')
    setData(null)
    setApplyResult(null)
    setTestCaseFixes([])
    setSolutionFixes({})
    axios
      .post(`${baseURL}/api/dashboard/adminProblems/${problemId}/diagnose`, {}, authHeaders)
      .then((res) => {
        if (latestRequestRef.current !== requestToken) return // a newer request has since fired
        const payload: DiagnoseResponse = res.data
        setData(payload)
        if (payload.diagnosis) {
          setTestCaseFixes(payload.diagnosis.testCaseFixes || [])
          setSolutionFixes(payload.diagnosis.solutionFixes || {})
        }
      })
      .catch((err) => {
        if (latestRequestRef.current !== requestToken) return
        setError(err?.response?.data?.error || 'Diagnosis failed')
      })
      .finally(() => {
        if (latestRequestRef.current === requestToken) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, problemId])

  const handleApply = async () => {
    if (!problemId) return
    setApplying(true)
    setError('')
    try {
      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/${problemId}/apply-diagnosis`,
        { testCaseFixes, solutionFixes },
        authHeaders
      )
      setApplyResult(res.data)
      onApplied()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to apply fix')
    } finally {
      setApplying(false)
    }
  }

  const diagnosisBadge = (d?: Diagnosis['diagnosis']) => {
    if (d === 'bad_test_data') return <Badge bg="warning" text="dark">Bad test data</Badge>
    if (d === 'wrong_solution') return <Badge bg="danger">Wrong solution</Badge>
    return <Badge bg="secondary">Unclear — needs manual review</Badge>
  }

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">Diagnose &amp; Fix — {problemTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" size="sm" className="me-2" />
            Running current solutions against judge0 and asking the AI to diagnose...
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && data?.alreadyPassing && (
          <Alert variant="success">All three languages already pass — nothing to fix.</Alert>
        )}

        {!loading && data && !data.alreadyPassing && data.diagnosis && (
          <>
            <div className="mb-3 d-flex align-items-center gap-2">
              {diagnosisBadge(data.diagnosis.diagnosis)}
            </div>
            <p className="text-muted">{data.diagnosis.explanation}</p>

            <h6 className="mt-4">Current per-language results</h6>
            {LANGUAGES.map((l) => {
              const r = data.languageResults?.[l.key]
              if (!r) return null
              return (
                <div key={l.key} className="mb-2 p-2 border rounded">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong>{l.label}</strong>
                    {r.passed ? <Badge bg="success">Passed</Badge> : <Badge bg="danger">Failed</Badge>}
                  </div>
                  {!r.passed && (
                    <small className="text-muted">
                      {r.error ||
                        r.outcomes
                          .map((o, i) => (o.passed ? null : `test ${i + 1}: ${o.error || `received ${JSON.stringify(o.received)}`}`))
                          .filter(Boolean)
                          .join(' | ')}
                    </small>
                  )}
                </div>
              )
            })}

            {data.diagnosis.diagnosis === 'bad_test_data' && testCaseFixes.length > 0 && (
              <>
                <h6 className="mt-4">Proposed test case fixes (edit if needed)</h6>
                {testCaseFixes.map((fix, i) => {
                  const original = data.testCases?.[fix.index - 1]
                  return (
                    <div key={i} className="mb-3 p-2 border rounded">
                      <div className="text-muted small mb-1">Test case {fix.index} — input: {original?.input}</div>
                      <div className="d-flex gap-2 align-items-center">
                        <div className="flex-fill">
                          <div className="small text-muted">Current (stored) expected output</div>
                          <code className="d-block p-1 bg-light">{original?.output}</code>
                        </div>
                        <div className="flex-fill">
                          <div className="small text-muted">Proposed corrected output</div>
                          <Form.Control
                            size="sm"
                            value={fix.correctedOutput}
                            onChange={(e) => {
                              const next = [...testCaseFixes]
                              next[i] = { ...next[i], correctedOutput: e.target.value }
                              setTestCaseFixes(next)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {data.diagnosis.diagnosis === 'wrong_solution' && Object.keys(solutionFixes).length > 0 && (
              <>
                <h6 className="mt-4">Proposed corrected solutions (edit if needed)</h6>
                {Object.entries(solutionFixes).map(([lang, code]) => (
                  <div key={lang} className="mb-3">
                    <div className="small text-muted mb-1">{lang}</div>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      value={code}
                      onChange={(e) => setSolutionFixes({ ...solutionFixes, [lang]: e.target.value })}
                    />
                  </div>
                ))}
              </>
            )}

            {data.diagnosis.diagnosis === 'unclear' && (
              <Alert variant="secondary" className="mt-3">
                The AI couldn't confidently determine the cause — this one needs a manual look, same as
                the payload/response diagnosis workflow used for tricky cases.
              </Alert>
            )}
          </>
        )}

        {applyResult && (
          <Alert variant="info" className="mt-4">
            <strong>Applied.</strong> Re-verified results:{' '}
            {LANGUAGES.map((l) => {
              const r = applyResult.testResults?.[l.key]
              return (
                <Badge key={l.key} bg={r?.passed ? 'success' : 'danger'} className="me-2">
                  {l.label}: {r?.passed ? 'Pass' : 'Fail'}
                </Badge>
              )
            })}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
        {!loading &&
          data &&
          !data.alreadyPassing &&
          data.diagnosis &&
          data.diagnosis.diagnosis !== 'unclear' &&
          !applyResult && (
            <Button variant="primary" onClick={handleApply} disabled={applying}>
              {applying ? 'Applying & re-verifying...' : 'Approve & Apply Fix'}
            </Button>
          )}
      </Modal.Footer>
    </Modal>
  )
}

export default DiagnoseModal
