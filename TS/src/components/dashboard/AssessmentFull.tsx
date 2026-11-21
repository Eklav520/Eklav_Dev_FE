import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaSearch, FaCode, FaMicrophone, FaTasks, FaDownload, FaChartBar, FaUsers, FaFilePdf } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { exportBrandedPdf } from './moduleOverview/brandedPdf'
import * as XLSX from 'xlsx'
import { ReportPagination, ScoreBar, StatusPill, StudentCell, ViewButton } from './moduleOverview/ReportCells'
import ReportDrawer from './moduleOverview/ReportDrawer'
import { CohortFilters, withCohort } from './moduleOverview/cohort'
import { ReportRangeSelect, useReportRange } from './moduleOverview/range'

/* ─── Types ─────────────────────────────────────────────── */
type Scorer = { name: string; email: string; percentage: number; score: number; resultStatus: string }
type AssessmentItem = {
  examId: string; title: string; createdAt: string
  total: number; passed: number; failed: number; avgPercentage: number
  topScorers: Scorer[]; lowScorers: Scorer[]
}
type RoundResult = { roundType: string; score: number; total: number; percentage: number; passed: boolean }
type StudentRow  = {
  studentId: string; name: string; email: string
  totalScore: number; percentage: number
  resultStatus: string; status: string
  roundResults: RoundResult[]; completedAt: string | null
}
type ExamMeta   = { _id: string; title: string; createdAt: string }
type Pagination = { total: number; page: number; limit: number; totalPages: number }

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  card:   { background: '#0e1012', border: '1px solid #272a2e', borderRadius: 12 } as React.CSSProperties,
  th:     { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.75rem 1rem', textAlign: 'left' as const, borderBottom: '1px solid #202326', whiteSpace: 'nowrap' as const },
  td:     { padding: '0.7rem 1rem', borderBottom: '1px solid #202326', color: '#e0e0e0', fontSize: '0.83rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut:  { padding: '0.7rem 1rem', borderBottom: '1px solid #202326', color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #25282b', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
}

/* ─── Round icon map ─────────────────────────────────────── */
const ROUND_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  mcq:    { label: 'MCQ',    color: '#3b82f6', icon: FaClipboardList },
  coding: { label: 'Coding', color: '#a855f7', icon: FaCode          },
  tr:     { label: 'TR',     color: '#f59e0b', icon: FaMicrophone    },
  hr:     { label: 'HR',     color: '#22c55e', icon: FaTasks         },
}

/* ─── Helpers ────────────────────────────────────────────── */
const PagBtn = ({ children, onClick, disabled = false, active = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: active ? '#ff6b00' : '#1a1a1a', border: `1px solid ${active ? '#ff6b00' : '#2a2a2a'}`,
    color: active ? '#fff' : disabled ? '#333' : '#888', borderRadius: 6,
    padding: '4px 10px', fontSize: '0.78rem', fontWeight: active ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer', minWidth: 32,
  }}>{children}</button>
)

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { color: string; bg: string }> = {
    passed:      { color: '#22c55e', bg: '#22c55e18' },
    failed:      { color: '#ef4444', bg: '#ef444418' },
    pending:     { color: '#f59e0b', bg: '#f59e0b18' },
    completed:   { color: '#ff6b00', bg: '#ff6b0018' },
    'in-progress': { color: '#a855f7', bg: '#a855f718' },
  }
  const c = cfg[status] || { color: '#555', bg: '#55555518' }
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.color}33`,
      borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'capitalize' as const,
    }}>{status.replace('-', ' ')}</span>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const AssessmentFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  // Date range shared by every report tab (default: till now)
  const range = useReportRange()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const [tab, setTab]           = useState<'overview' | 'students'>('overview')

  /* Overview state */
  const [overview, setOverview]     = useState<AssessmentItem[]>([])
  const [ovLoading, setOvLoading]   = useState(true)

  /* Exams list (for students tab dropdown) */
  const [exams, setExams]           = useState<ExamMeta[]>([])

  /* Students state */
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [examRounds, setExamRounds]     = useState<string[]>([])
  const [examTitle, setExamTitle]       = useState<string>('')
  const [students, setStudents]         = useState<StudentRow[]>([])
  const [pagination, setPag]            = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [stuLoading, setStuLoad]        = useState(false)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [limit]                         = useState(10)
  const [exporting, setExporting]       = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleExportExcel = async (format: 'excel' | 'pdf' = 'excel') => {
    if (!user?.token || !selectedExam) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ examId: selectedExam, page: '1', limit: '9999', search })
      const res = await fetch(`${baseURL}${apiBase}/assessment-students?${withCohort(params)}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      const rows = (data.students || []).map((s: StudentRow, i: number) => {
        const base: Record<string, string | number> = {
          '#': i + 1, 'Name': s.name, 'Email': s.email,
          'Status': s.resultStatus, 'Score (%)': s.percentage,
        }
        s.roundResults?.forEach((r) => {
          base[`${r.roundType} Score`] = `${r.score}/${r.total}`
          base[`${r.roundType} %`] = r.percentage
        })
        return base
      })
      if (format === 'pdf') {
        await exportBrandedPdf({ title: examTitle || 'Assessment results', subtitle: 'Assessment results by round', rows, fileName: `Assessment_${examTitle || selectedExam}` })
        return
      }
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Assessment Students')
      XLSX.writeFile(wb, `Assessment_${examTitle || selectedExam}.xlsx`)
    } catch (e) { console.error('Export error:', e) }
    finally { setExporting(false) }
  }

  /* ── Fetch overview ── */
  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/assessment-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return
        // Only exams held in the selected date range
        const day = (v: string) => new Date(v).toISOString().slice(0, 10)
        setOverview((d.assessments as AssessmentItem[]).filter((a) => { const x = day(a.createdAt); return x >= range.from && x <= range.to }))
      })
      .catch(console.error)
      .finally(() => setOvLoading(false))
  }, [user?.token]) // eslint-disable-line

  /* ── Fetch exam list ── */
  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/assessment-exams`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.exams.length) {
          setExams(d.exams)
          setSelectedExam(String(d.exams[0]._id))
          setExamTitle(d.exams[0].title)
        }
      })
      .catch(console.error)
  }, [user?.token]) // eslint-disable-line

  /* ── Fetch students ── */
  const fetchStudents = useCallback(async (opts: { examId?: string; page?: number; limit?: number; search?: string } = {}) => {
    const eid = opts.examId ?? selectedExam
    if (!eid || !user?.token) return
    setStuLoad(true)
    const params = new URLSearchParams({
      examId: eid,
      page: String(opts.page ?? 1),
      limit: String(opts.limit ?? 10),
      search: opts.search ?? '',
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/assessment-students?${withCohort(params)}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        setPag(data.pagination)
        setExamRounds(data.exam?.rounds || [])
        setExamTitle(data.exam?.title || '')
      }
    } catch (err) { console.error(err) }
    finally { setStuLoad(false) }
  }, [user?.token, baseURL, apiBase, selectedExam])

  useEffect(() => {
    if (tab === 'students' && selectedExam) {
      fetchStudents({ examId: selectedExam, page, limit, search })
    }
  }, [tab, selectedExam, page, limit]) // eslint-disable-line

  const onSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchStudents({ examId: selectedExam, page: 1, limit, search: val })
    }, 400)
  }

  const onExamChange = (eid: string) => {
    setSelectedExam(eid)
    setPage(1)
    setSearch('')
    fetchStudents({ examId: eid, page: 1, limit, search: '' })
  }

  /* ── Overview loading ── */
  if (ovLoading && tab === 'overview') {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  // Totals across every exam, shown as the Student Reports summary cards
  const totals = overview.reduce((t, a) => ({ attended: t.attended + a.total, passed: t.passed + a.passed, failed: t.failed + a.failed }), { attended: 0, passed: 0, failed: 0 })
  const scoredExams = overview.filter((a) => a.total > 0)
  const avgScore = scoredExams.length ? Math.round(scoredExams.reduce((s, a) => s + a.avgPercentage, 0) / scoredExams.length) : 0
  const passRate = totals.attended ? Math.round((totals.passed / totals.attended) * 100) : 0

  return (
    <div>
      {overview.length > 0 && (
        <section className="sr-summary dr-summary">
          <article className="sr-summary-card sr-card-orange">
            <span className="sr-summary-icon sr-icon-orange"><FaClipboardList /></span>
            <div><strong>{overview.length}</strong><span>Assessments</span><em className="sr-summary-rule">latest: {overview[0].title}</em></div>
          </article>
          <article className="sr-summary-card sr-card-cyan">
            <span className="sr-summary-icon sr-icon-cyan"><FaUsers /></span>
            <div><strong>{totals.attended}</strong><span>Attempts</span><em className="sr-summary-rule">students who took an exam</em></div>
          </article>
          <article className="sr-summary-card sr-card-green">
            <span className="sr-summary-icon sr-icon-green"><FaCheckCircle /></span>
            <div><strong>{totals.passed} <small>({passRate}%)</small></strong><span>Passed</span><em className="sr-summary-rule">across all assessments</em></div>
          </article>
          <article className="sr-summary-card sr-card-red">
            <span className="sr-summary-icon sr-icon-red"><FaTimesCircle /></span>
            <div><strong>{totals.failed} <small>({totals.attended ? 100 - passRate : 0}%)</small></strong><span>Failed</span><em className="sr-summary-rule">need another attempt</em></div>
          </article>
          <article className="sr-summary-card sr-card-amber">
            <span className="sr-summary-icon sr-icon-amber"><FaChartBar /></span>
            <div><strong>{avgScore}%</strong><span>Average Score</span><em className="sr-summary-rule">mean of exam averages</em></div>
          </article>
        </section>
      )}

      {/* ── All assessments: one row per exam (Student Reports table) ── */}
      {(
        <section className="sr-table-panel" aria-label="All assessments">
          <div className="dr-panel-head">
            <div><h3>All Assessments</h3><p>{overview.length} assessment{overview.length === 1 ? '' : 's'} · newest first · open Students to see every result</p></div>
          </div>
          {overview.length === 0 ? (
            <div className="sr-empty"><FaClipboardList /><span>No assessments yet</span></div>
          ) : (
            <div className="sr-table-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: 40 }}>#</th>
                    <th style={{ ...S.th, minWidth: 220 }}>Assessment</th>
                    <th style={{ ...S.th, minWidth: 90 }}>Attended</th>
                    <th style={{ ...S.th, minWidth: 150 }}>Result</th>
                    <th style={{ ...S.th, minWidth: 130 }}>Pass Rate</th>
                    <th style={{ ...S.th, minWidth: 130 }}>Avg Score</th>
                    <th style={{ ...S.th, minWidth: 170 }}>Top Scorer</th>
                    <th className="dr-actions" style={{ ...S.th, minWidth: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((item, i) => {
                    const passRate = item.total ? Math.round((item.passed / item.total) * 100) : 0
                    const top = item.topScorers[0]
                    return (
                      <tr key={String(item.examId)}>
                        <td style={S.tdMut}>{i + 1}</td>
                        <td style={S.td}>
                          <div className="dr-exam-cell">
                            <span className="dr-exam-icon"><FaClipboardList /></span>
                            <div>
                              <strong title={item.title}>{item.title}</strong>
                              <small>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}><strong>{item.total}</strong></td>
                        <td style={S.td}>
                          {item.total ? (
                            <div className="dr-result-pills">
                              <StatusPill tone="good">{item.passed} passed</StatusPill>
                              <StatusPill tone="low">{item.failed} failed</StatusPill>
                            </div>
                          ) : <StatusPill tone="none">Not taken yet</StatusPill>}
                        </td>
                        <td style={S.td}>{item.total ? <ScoreBar pct={passRate} /> : <span className="dr-dot">·</span>}</td>
                        <td style={S.td}>{item.total ? <ScoreBar pct={item.avgPercentage} /> : <span className="dr-dot">·</span>}</td>
                        <td style={S.td}>
                          {top ? <div className="dr-top-scorer"><strong title={top.name}>{top.name}</strong><small>{top.percentage}%</small></div> : <span className="dr-dot">·</span>}
                        </td>
                        <td className="dr-actions" style={S.td}>
                          <ViewButton onClick={() => { onExamChange(String(item.examId)); setTab('students') }}>Students ({item.total})</ViewButton>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Students who took the assessment: drawer with the results table ── */}
      {tab === 'students' && (() => {
        const item = overview.find((o) => String(o.examId) === selectedExam)
        const passRate = item?.total ? Math.round((item.passed / item.total) * 100) : 0
        return (
        <ReportDrawer
          name={examTitle || item?.title || 'Assessment'}
          email={item ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined}
          meta={examRounds.length ? `${examRounds.length} round${examRounds.length === 1 ? '' : 's'}` : undefined}
          icon={<FaClipboardList />}
          width={1180}
          variant="modal"
          onClose={() => setTab('overview')}
          stats={item ? [
            { label: 'Attended', value: item.total, tone: 'orange' },
            { label: 'Passed', value: item.passed, hint: `${passRate}% pass rate`, tone: 'green' },
            { label: 'Failed', value: item.failed, tone: 'red' },
            { label: 'Avg score', value: `${item.avgPercentage}%`, tone: item.avgPercentage >= 60 ? 'green' : item.avgPercentage >= 40 ? 'amber' : 'red' },
          ] : undefined}
        >
        <section className="sr-table-panel" aria-label="Student results">
          <div className="sr-toolbar">
            <div className="sr-search">
              <FaSearch aria-hidden="true" />
              <input aria-label="Search students" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or email" />
            </div>
            <div className="sr-filters sr-report-filters">
              <CohortFilters />
              <button type="button" className="sr-export-button" onClick={() => handleExportExcel('pdf')} disabled={exporting || !selectedExam}><FaFilePdf /> {exporting ? 'Preparing PDF…' : 'Export PDF'}</button>
            </div>
          </div>

          {examRounds.length > 0 && (
            <div className="dr-round-strip">
              <span>Rounds</span>
              {examRounds.map((rt) => {
                const meta = ROUND_META[rt] || { label: rt.toUpperCase(), color: '#888', icon: FaClipboardList }
                const Icon = meta.icon
                return <em key={rt} style={{ ['--c' as string]: meta.color }}><Icon /> {meta.label}</em>
              })}
            </div>
          )}

          <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
            {stuLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 40 }}>#</th>
                  <th style={{ ...S.th, minWidth: 220 }}>Student</th>
                  <th style={{ ...S.th, minWidth: 130 }}>Score</th>
                  {examRounds.map((rt) => <th key={rt} style={{ ...S.th, minWidth: 110 }}>{(ROUND_META[rt] || { label: rt.toUpperCase() }).label}</th>)}
                  <th style={{ ...S.th, minWidth: 100 }}>Result</th>
                  <th style={{ ...S.th, minWidth: 110 }}>Status</th>
                  <th style={{ ...S.th, minWidth: 120 }}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={6 + examRounds.length}>{!stuLoading && <div className="sr-empty"><FaUsers /><span>{selectedExam ? 'No students match these filters.' : 'Choose an assessment to see results.'}</span></div>}</td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.studentId}>
                    <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={S.td}><StudentCell name={s.name || s.email?.split('@')[0] || 'Student'} email={s.email} /></td>
                    <td style={S.td}><ScoreBar pct={s.percentage} label={<>{s.percentage}% <span className="dr-sub">· {s.totalScore} pts</span></>} /></td>
                    {examRounds.map((rt) => {
                      const rr = s.roundResults.find((r) => r.roundType === rt)
                      return (
                        <td key={rt} style={S.td}>
                          {rr ? <ScoreBar pct={rr.percentage} label={`${rr.score}/${rr.total}`} /> : <span className="dr-dot">·</span>}
                        </td>
                      )
                    })}
                    <td style={S.td}>
                      <StatusPill tone={s.resultStatus === 'passed' ? 'good' : s.resultStatus === 'failed' ? 'low' : 'mid'}>
                        {s.resultStatus === 'passed' ? 'Passed' : s.resultStatus === 'failed' ? 'Failed' : 'Pending'}
                      </StatusPill>
                    </td>
                    <td style={S.td}>
                      <StatusPill tone={s.status === 'completed' ? 'pending' : 'none'}>{s.status === 'completed' ? 'Completed' : s.status === 'in-progress' ? 'In progress' : s.status || '—'}</StatusPill>
                    </td>
                    <td style={S.tdMut}>{s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ReportPagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPage={setPage} />
        </section>
        </ReportDrawer>
        )
      })()}
    </div>
  )
}

export default AssessmentFull
