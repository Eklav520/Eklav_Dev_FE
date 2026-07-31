import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, Form, Alert, ProgressBar, Badge, InputGroup } from 'react-bootstrap'
import { FaCheckCircle, FaTimesCircle, FaPlay, FaStop, FaSearch } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface LanguageResult {
  passed: boolean | null
  totalTestCases?: number
  passedCount?: number
  error?: string | null
  lastRunAt?: string | null
}

interface ProblemRow {
  _id: string
  title: string
  difficulty: string
  testResults?: {
    java?: LanguageResult
    javascript?: LanguageResult
    python?: LanguageResult
  }
}

interface RunStatus {
  runId?: string
  startedAt?: string
  finishedAt?: string | null
  total?: number
  processed?: number
  passed?: number
  failed?: number
  batchNumber?: number | null
  batchSize?: number | null
  status: 'idle' | 'running' | 'done' | 'error' | 'stopped'
  force?: boolean
  error?: string | null
}

const PER_PAGE = 100
const LANGUAGES: Array<{ key: 'java' | 'javascript' | 'python'; label: string }> = [
  { key: 'java', label: 'Java' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
]

const StatusIcon = ({ result }: { result?: LanguageResult }) => {
  if (!result || result.passed === null || result.passed === undefined) {
    return <span className="text-muted">—</span>
  }
  return result.passed ? (
    <FaCheckCircle color="#22c55e" size={18} title="Passed" />
  ) : (
    <FaTimesCircle color="#ef4444" size={18} title={result.error || 'Failed'} />
  )
}

const AdminSolutionRunner = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [problems, setProblems] = useState<ProblemRow[]>([])
  const [runStatus, setRunStatus] = useState<RunStatus>({ status: 'idle' })
  const [forceRegenerate, setForceRegenerate] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  const fetchReport = useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/api/dashboard/adminProblems/solutions-report`,
        authHeaders
      )
      setProblems(res.data.problems || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load solutions report')
    }
  }, [baseURL, token])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/api/dashboard/adminProblems/run-solutions/status`,
        authHeaders
      )
      const run = res.data.run || { status: 'idle' }
      setRunStatus(run)
      return run
    } catch (err) {
      return { status: 'idle' } as RunStatus
    }
  }, [baseURL, token])

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startPolling = () => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      const run = await fetchStatus()
      // Refresh the table on every tick too, not just at completion, so rows
      // flip to Pass/Fail live as the batch works through the problem list.
      fetchReport()
      if (run.status === 'done' || run.status === 'error') {
        stopPolling()
      }
    }, 5000)
  }

  useEffect(() => {
    fetchReport()
    fetchStatus().then((run) => {
      if (run.status === 'running') startPolling()
    })
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRunTests = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/run-solutions`,
        { force: forceRegenerate, batchNumber: page, batchSize: PER_PAGE },
        authHeaders
      )
      setRunStatus(res.data.run)
      startPolling()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start test run')
    } finally {
      setLoading(false)
    }
  }

  const handleStopTests = async () => {
    setError('')
    try {
      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/run-solutions/stop`,
        {},
        authHeaders
      )
      setRunStatus(res.data.run)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to stop test run')
    }
  }

  const overallStatus = (p: ProblemRow) => {
    const results = LANGUAGES.map((l) => p.testResults?.[l.key])
    if (results.every((r) => r?.passed === true)) return 'pass'
    if (results.some((r) => r?.passed === false)) return 'fail'
    return 'untested'
  }

  const STATUS_RANK: Record<string, number> = { fail: 0, untested: 1, pass: 2 }

  // Failed problems first (so the ones needing attention surface immediately), then
  // untested, then passing — natural (stored) order preserved within each group.
  const filtered = problems
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const rankDiff = STATUS_RANK[overallStatus(a.p)] - STATUS_RANK[overallStatus(b.p)]
      return rankDiff !== 0 ? rankDiff : a.i - b.i
    })
    .map(({ p }) => p)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const failedCount = problems.filter((p) => overallStatus(p) === 'fail').length
  const passedCount = problems.filter((p) => overallStatus(p) === 'pass').length
  const untestedCount = problems.length - failedCount - passedCount

  const isRunning = runStatus.status === 'running'
  const progressPct =
    runStatus.total && runStatus.total > 0
      ? Math.round(((runStatus.processed || 0) / runStatus.total) * 100)
      : 0

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="fw-semibold bg-white border-bottom">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span>AI Solutions &amp; Test Runner</span>
          <div className="d-flex align-items-center gap-2">
            {isRunning ? (
              <Badge bg="primary">
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                  style={{ width: '0.7rem', height: '0.7rem' }}
                />
                Running {runStatus.processed || 0}/{runStatus.total || 0} ({progressPct}%)
              </Badge>
            ) : (
              <Badge bg="secondary">Idle</Badge>
            )}
            <Badge bg="danger">{failedCount} failed</Badge>
            <Badge bg="success">{passedCount} passed</Badge>
            <Badge bg="light" text="dark">{untestedCount} not run</Badge>
            <Badge bg="secondary">{problems.length} total</Badge>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
          <Button variant="primary" onClick={handleRunTests} disabled={isRunning || loading}>
            <FaPlay className="me-2" />
            {isRunning ? 'Running...' : `Run Batch ${page}`}
          </Button>

          {isRunning && (
            <Button variant="outline-danger" onClick={handleStopTests}>
              <FaStop className="me-2" />
              Stop
            </Button>
          )}

          <Form.Check
            type="checkbox"
            id="force-regenerate"
            label="Force regenerate all solutions"
            checked={forceRegenerate}
            onChange={(e) => setForceRegenerate(e.target.checked)}
            disabled={isRunning}
          />

          <InputGroup style={{ maxWidth: 300 }} className="ms-auto">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search problems..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
        </div>

        {(isRunning || runStatus.status === 'done' || runStatus.status === 'error') && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">
                {isRunning
                  ? `Processing ${runStatus.processed || 0} / ${runStatus.total || 0}${runStatus.batchNumber ? ` (Batch ${runStatus.batchNumber})` : ''}`
                  : `Last run: ${runStatus.passed || 0} passed, ${runStatus.failed || 0} failed${runStatus.batchNumber ? ` (Batch ${runStatus.batchNumber})` : ''}`}
              </small>
              {isRunning && <small className="text-muted">{progressPct}%</small>}
            </div>
            <ProgressBar
              now={isRunning ? progressPct : 100}
              variant={runStatus.status === 'error' ? 'danger' : 'primary'}
              animated={isRunning}
              striped={isRunning}
            />
            {runStatus.status === 'error' && (
              <small className="text-danger">{runStatus.error}</small>
            )}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Problem</th>
                <th className="text-center">Java</th>
                <th className="text-center">JavaScript</th>
                <th className="text-center">Python</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => {
                const status = overallStatus(p)
                return (
                  <tr key={p._id}>
                    <td>{p.title}</td>
                    {LANGUAGES.map((l) => (
                      <td key={l.key} className="text-center">
                        <StatusIcon result={p.testResults?.[l.key]} />
                      </td>
                    ))}
                    <td className="text-center">
                      {status === 'pass' && <Badge bg="success">Pass</Badge>}
                      {status === 'fail' && <Badge bg="danger">Failed</Badge>}
                      {status === 'untested' && <Badge bg="secondary">Not run</Badge>}
                    </td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No problems found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">
              Batch {page} of {totalPages} — showing {(page - 1) * PER_PAGE + 1}
              -{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} problems
            </small>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export default AdminSolutionRunner
