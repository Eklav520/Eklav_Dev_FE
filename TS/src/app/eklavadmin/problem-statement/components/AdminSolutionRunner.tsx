import { useState, useEffect, useRef, useCallback } from 'react'
import {
  FaCheckCircle, FaTimesCircle, FaPlay, FaStop, FaStethoscope, FaRobot, FaSpinner, FaExclamationTriangle,
  FaTimes, FaCode, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa'
import { SearchInput, EmptyState } from '@/components/admin-ui'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import DiagnoseModal from './DiagnoseModal'

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

const StatusIcon = ({
  result,
  onToggle,
}: {
  result?: LanguageResult
  onToggle: (nextPassed: boolean) => void
}) => {
  const untested = !result || result.passed === null || result.passed === undefined
  // Click cycles the manual override: untested -> Passed -> Failed -> Passed -> ...
  const nextPassed = untested ? true : !result!.passed
  return (
    <button
      type="button"
      className="asr-lang-btn"
      onClick={() => onToggle(nextPassed)}
      title={
        untested
          ? 'Not run yet — click to mark manually'
          : `Click to mark as ${result!.passed ? 'Failed' : 'Passed'}`
      }
    >
      {untested ? (
        <span className="is-none">—</span>
      ) : result!.passed ? (
        <FaCheckCircle color="#45dd75" size={16} />
      ) : (
        <FaTimesCircle color="#fb737a" size={16} title={result!.error || 'Failed'} />
      )}
    </button>
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
  const [diagnoseTarget, setDiagnoseTarget] = useState<{ id: string; title: string } | null>(null)

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

  const handleToggleStatus = async (
    problemId: string,
    language: 'java' | 'javascript' | 'python',
    passed: boolean
  ) => {
    // Optimistic update so the icon flips instantly; rolled back on request failure.
    const prevProblems = problems
    setProblems((prev) =>
      prev.map((p) =>
        p._id === problemId
          ? {
              ...p,
              testResults: {
                ...p.testResults,
                [language]: { ...p.testResults?.[language], passed, error: passed ? null : 'Manually marked failed by admin' },
              },
            }
          : p
      )
    )
    try {
      await axios.patch(
        `${baseURL}/api/dashboard/adminProblems/${problemId}/status`,
        { language, passed },
        authHeaders
      )
    } catch (err: any) {
      setProblems(prevProblems)
      setError(err?.response?.data?.error || 'Failed to update status')
    }
  }

  const handleToggleOverallStatus = async (problemId: string, nextPassed: boolean) => {
    // Flips ALL THREE languages at once — the overall Status badge is derived from all of
    // them together (overallStatus), so a single-language toggle can't move it by itself.
    const prevProblems = problems
    setProblems((prev) =>
      prev.map((p) =>
        p._id === problemId
          ? {
              ...p,
              testResults: LANGUAGES.reduce(
                (acc, l) => ({
                  ...acc,
                  [l.key]: {
                    ...p.testResults?.[l.key],
                    passed: nextPassed,
                    error: nextPassed ? null : 'Manually marked failed by admin',
                  },
                }),
                { ...p.testResults }
              ),
            }
          : p
      )
    )
    try {
      await Promise.all(
        LANGUAGES.map((l) =>
          axios.patch(
            `${baseURL}/api/dashboard/adminProblems/${problemId}/status`,
            { language: l.key, passed: nextPassed },
            authHeaders
          )
        )
      )
    } catch (err: any) {
      setProblems(prevProblems)
      setError(err?.response?.data?.error || 'Failed to update status')
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

  const DIFF_BADGE: Record<string, string> = { Easy: 'aui-badge-green', Medium: 'aui-badge-amber', Hard: 'aui-badge-red' }

  return (
    <div className="aui-card">
      <div className="aui-toolbar">
        <div className="asr-title">
          <span className="asr-title-icon"><FaRobot /></span>
          <div className="aui-toolbar-title">
            <h3>
              AI Solutions &amp; Tests
              {isRunning
                ? <span className="aui-badge aui-badge-blue asr-state"><FaSpinner className="aui-spin" size={9} style={{ color: 'inherit' }} /> Running · {progressPct}%</span>
                : <span className="aui-badge aui-badge-muted asr-state">Idle</span>}
            </h3>
            <p>Generate a reference solution per problem and check it against the test cases</p>
          </div>
        </div>
        <div className="asr-counts">
          <span className="asr-count is-red"><b>{failedCount}</b> failed</span>
          <span className="asr-count is-green"><b>{passedCount}</b> passed</span>
          <span className="asr-count"><b>{untestedCount}</b> not run</span>
          <span className="asr-count"><b>{problems.length}</b> total</span>
        </div>
      </div>

      <div className="asr-controls">
        <div className="asr-run">
          {isRunning ? (
            <button type="button" className="aui-btn aui-btn-danger" onClick={handleStopTests}>
              <FaStop size={10} /> Stop run
            </button>
          ) : (
            <button type="button" className="aui-btn aui-btn-primary" onClick={handleRunTests} disabled={loading}>
              {loading ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaPlay size={10} />} Run Batch {page}
            </button>
          )}
          <label className="aui-toggle asr-force" title="Regenerate solutions even for problems that already have one">
            <input type="checkbox" checked={forceRegenerate} onChange={(e) => setForceRegenerate(e.target.checked)} disabled={isRunning} />
            <span className="aui-toggle-track" />
            <span>Force regenerate</span>
          </label>
        </div>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search problems…" />
      </div>

      {(isRunning || runStatus.status === 'done' || runStatus.status === 'error' || runStatus.status === 'stopped') && (
        <div className={`asr-progress${runStatus.status === 'error' ? ' is-error' : ''}`}>
          <div className="asr-progress-head">
            <span>
              {isRunning
                ? <>Processing <b>{runStatus.processed || 0}</b> of <b>{runStatus.total || 0}</b>{runStatus.batchNumber ? ` · batch ${runStatus.batchNumber}` : ''}</>
                : <>Last run{runStatus.batchNumber ? ` (batch ${runStatus.batchNumber})` : ''}: <b className="is-green">{runStatus.passed || 0} passed</b> · <b className="is-red">{runStatus.failed || 0} failed</b>{runStatus.status === 'stopped' ? ' · stopped' : ''}</>}
            </span>
            {isRunning && <b>{progressPct}%</b>}
          </div>
          <div className="asr-progress-track"><span style={{ width: `${isRunning ? progressPct : 100}%` }} className={isRunning ? 'is-running' : ''} /></div>
          {runStatus.status === 'error' && runStatus.error && <p className="aui-error">{runStatus.error}</p>}
        </div>
      )}

      {error && (
        <div className="aui-alert asr-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      {pageRows.length === 0 ? (
        <EmptyState icon={FaCode} title={problems.length ? 'No problems match' : 'No problems yet'} text={problems.length ? 'Try a different search.' : 'Upload problems first, then run the tests here.'} />
      ) : (
        <>
          <div className="aui-table-scroll">
            <table className="aui-table asr-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>#</th>
                  <th>Problem</th>
                  {LANGUAGES.map(l => <th key={l.key} className="text-center" style={{ width: 96 }}>{l.label}</th>)}
                  <th className="text-center" style={{ width: 110 }}>Status</th>
                  <th className="text-end" style={{ width: 130 }}>Fix</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p, i) => {
                  const status = overallStatus(p)
                  return (
                    <tr key={p._id} className={status === 'fail' ? 'is-failed' : ''}>
                      <td className="aui-num">{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>
                        <div className="asr-problem">
                          <strong title={p.title}>{p.title}</strong>
                          {p.difficulty && <span className={`aui-badge ${DIFF_BADGE[p.difficulty] || 'aui-badge-muted'}`}>{p.difficulty}</span>}
                        </div>
                      </td>
                      {LANGUAGES.map((l) => (
                        <td key={l.key} className="text-center">
                          <StatusIcon result={p.testResults?.[l.key]} onToggle={(nextPassed) => handleToggleStatus(p._id, l.key, nextPassed)} />
                        </td>
                      ))}
                      <td className="text-center">
                        <button
                          type="button"
                          className="asr-status-btn"
                          onClick={() => handleToggleOverallStatus(p._id, status !== 'pass')}
                          title={status === 'pass' ? 'Click to mark all languages Failed' : 'Click to mark all languages Passed'}
                        >
                          {status === 'pass' && <span className="aui-badge aui-badge-dot aui-badge-green">Pass</span>}
                          {status === 'fail' && <span className="aui-badge aui-badge-dot aui-badge-red">Failed</span>}
                          {status === 'untested' && <span className="aui-badge aui-badge-muted">Not run</span>}
                        </button>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className={`aui-btn aui-btn-sm${status === 'fail' ? ' aui-btn-soft' : ''}`}
                          title="Diagnose & propose a fix (test data or solution) — review before it's applied"
                          onClick={() => setDiagnoseTarget({ id: p._id, title: p.title })}
                        >
                          <FaStethoscope size={11} /> Diagnose
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Each page is one run batch, so the footer doubles as the batch picker */}
          <div className="aui-footer">
            <span>Batch <b>{page}</b> of <b>{totalPages}</b> · showing <b>{(page - 1) * PER_PAGE + 1}</b>–<b>{Math.min(page * PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b> problems</span>
            <div className="aui-pages">
              <button type="button" className="aui-page-btn" disabled={page <= 1 || isRunning} onClick={() => setPage((p) => p - 1)} aria-label="Previous batch"><FaChevronLeft /></button>
              <button type="button" className="aui-page-btn" disabled={page >= totalPages || isRunning} onClick={() => setPage((p) => p + 1)} aria-label="Next batch"><FaChevronRight /></button>
            </div>
          </div>
        </>
      )}

      <DiagnoseModal
        show={diagnoseTarget !== null}
        onClose={() => setDiagnoseTarget(null)}
        problemId={diagnoseTarget?.id || null}
        problemTitle={diagnoseTarget?.title || ''}
        onApplied={fetchReport}
      />

      <style>{`
        .asr-title { display: flex; align-items: center; gap: 12px; }
        .asr-title-icon { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid rgba(255,122,0,0.3); border-radius: 10px; background: rgba(255,122,0,0.1); color: #ff9a3c; font-size: 0.95rem; }
        .asr-state { margin-left: 8px; vertical-align: 2px; }
        .asr-counts { display: flex; flex-wrap: wrap; gap: 6px; }
        .asr-count { padding: 4px 11px; border: 1px solid #2c3034; border-radius: 99px; background: #17191c; color: #9da2a8; font-size: 0.72rem; }
        .asr-count b { color: #eceef0; }
        .asr-count.is-red b { color: #fb737a; }
        .asr-count.is-green b { color: #45dd75; }
        .asr-controls { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 0.85rem; border-bottom: 1px solid #25282b; }
        .asr-run { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .asr-force { align-items: center; gap: 8px; padding: 0; border: 0; background: none; color: #c3c7ca; font-size: 0.8rem; }
        .asr-force .aui-toggle-track { margin-top: 0; }
        .asr-progress { padding: 0.75rem 0.85rem; border-bottom: 1px solid #25282b; background: rgba(56,189,248,0.04); }
        .asr-progress.is-error { background: rgba(251,95,103,0.05); }
        .asr-progress-head { display: flex; justify-content: space-between; margin-bottom: 6px; color: #a6abb0; font-size: 0.78rem; }
        .asr-progress-head b { color: #eceef0; }
        .asr-progress-head b.is-green { color: #45dd75; }
        .asr-progress-head b.is-red { color: #fb737a; }
        .asr-progress-track { height: 7px; overflow: hidden; border-radius: 99px; background: #23262a; }
        .asr-progress-track span { display: block; height: 100%; border-radius: 99px; background: #4b5056; transition: width 0.4s ease; }
        .asr-progress-track span.is-running { background: linear-gradient(90deg, #38bdf8, #7dd3fc); }
        .asr-progress .aui-error { margin-top: 6px; }
        .asr-alert { margin: 0.85rem !important; }
        .asr-table tbody tr.is-failed { background: rgba(251,95,103,0.04); }
        .asr-problem { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .asr-problem strong { overflow: hidden; color: #eceef0; font-size: 0.82rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; max-width: 520px; }
        .asr-status-btn { padding: 0; border: 0; background: none; cursor: pointer; }
        .asr-lang-btn { display: inline-grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 1px solid transparent; border-radius: 8px; background: none; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .asr-lang-btn:hover { border-color: #34383d; background: #1b1e21; }
        .asr-lang-btn .is-none { color: #4b5056; font-weight: 700; }
      `}</style>
    </div>
  )
}

export default AdminSolutionRunner
