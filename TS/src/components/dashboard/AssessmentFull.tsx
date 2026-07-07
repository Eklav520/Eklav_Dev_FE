import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaSearch, FaCode, FaMicrophone, FaTasks, FaDownload, FaChartBar, FaUsers } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'

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
  card:   { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  th:     { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.75rem 1rem', textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const },
  td:     { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.83rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut:  { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
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
  const [pagination, setPag]            = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [stuLoading, setStuLoad]        = useState(false)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [limit, setLimit]               = useState(20)
  const [exporting, setExporting]       = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleExportExcel = async () => {
    if (!user?.token || !selectedExam) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ examId: selectedExam, page: '1', limit: '9999', search })
      const res = await fetch(`${baseURL}${apiBase}/assessment-students?${params}`, {
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
      .then((d) => { if (d.success) setOverview(d.assessments) })
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
      limit: String(opts.limit ?? 20),
      search: opts.search ?? '',
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/assessment-students?${params}`, {
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

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', marginBottom: '1.5rem' }}>
        {([
          { key: 'overview', label: 'Overview', icon: FaChartBar },
          { key: 'students', label: 'Students', icon: FaUsers },
        ] as const).map(({ key: t, label, icon: Icon }) => (
          <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', background: 'none', border: 'none', padding: '0.65rem 1.25rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#fff' : '#555', transition: 'color 0.15s' }}>
            <Icon size={13} color={tab === t ? '#ff6b00' : '#3a3a3a'} />
            {label}
            {tab === t && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: '#ff6b00', borderRadius: 2 }} />}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div>
          {overview.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '4rem', fontSize: '0.85rem' }}>No assessments found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1rem' }}>
              {overview.map((item) => (
                <div key={String(item.examId)} style={{
                  background: '#1a1a1a', border: '1px solid #252525',
                  borderRadius: 16, padding: '1.25rem', borderTop: '3px solid #ff6b00',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35 }}>{item.title}</div>
                      <div style={{ color: '#444', fontSize: '0.68rem', marginTop: 3 }}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    {item.avgPercentage > 0 && (
                      <div style={{
                        background: '#ff6b0018', border: '1px solid #ff6b0033',
                        borderRadius: 10, padding: '0.4rem 0.85rem', textAlign: 'center' as const, flexShrink: 0,
                      }}>
                        <div style={{ color: '#ff6b00', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>{item.avgPercentage}%</div>
                        <div style={{ color: '#444', fontSize: '0.57rem', fontWeight: 600, letterSpacing: '0.06em', marginTop: 2 }}>AVG SCORE</div>
                      </div>
                    )}
                  </div>

                  {/* Stats pills */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
                    {[
                      { label: 'Attended', value: item.total,  color: '#888'    },
                      { label: 'Passed',   value: item.passed, color: '#22c55e' },
                      { label: 'Failed',   value: item.failed, color: '#ef4444' },
                    ].map((s) => (
                      <div key={s.label} style={{
                        background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
                        padding: '0.35rem 0.75rem', textAlign: 'center' as const,
                      }}>
                        <div style={{ color: s.color, fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ color: '#444', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>{s.label.toUpperCase()}</div>
                      </div>
                    ))}
                    {/* Pass rate bar */}
                    {item.total > 0 && (
                      <div style={{ flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: '0 0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#555', fontSize: '0.62rem' }}>Pass rate</span>
                          <span style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 700 }}>
                            {Math.round((item.passed / item.total) * 100)}%
                          </span>
                        </div>
                        <div style={{ background: '#111', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.round((item.passed / item.total) * 100)}%`,
                            height: '100%', background: '#22c55e', borderRadius: 4,
                          }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top / Low scorers side by side */}
                  {(item.topScorers.length > 0 || item.lowScorers.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {/* Top scorers */}
                      {item.topScorers.length > 0 && (
                        <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.5rem' }}>
                            <FaCheckCircle size={10} color="#22c55e" />
                            <span style={{ color: '#22c55e', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>Top Scorers</span>
                          </div>
                          {item.topScorers.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: '#888', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '75%' }}>
                                <span style={{ color: '#333', fontSize: '0.6rem', marginRight: 4 }}>{i + 1}.</span>
                                {s.name}
                              </span>
                              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.72rem' }}>{s.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Low scorers */}
                      {item.lowScorers.length > 0 && (
                        <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.5rem' }}>
                            <FaTimesCircle size={10} color="#ef4444" />
                            <span style={{ color: '#ef4444', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>Low Scorers</span>
                          </div>
                          {item.lowScorers.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: '#666', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '75%' }}>
                                {s.name}
                              </span>
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.72rem' }}>{s.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Students tab ── */}
      {tab === 'students' && (
        <div style={S.card}>
          {/* Filter bar */}
          <div style={{
            padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e1e1e',
            display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center',
          }}>
            {/* Exam selector */}
            <select
              style={{ ...S.select, maxWidth: 280 }}
              value={selectedExam}
              onChange={(e) => onExamChange(e.target.value)}
            >
              {exams.map((ex) => (
                <option key={String(ex._id)} value={String(ex._id)}>{ex.title}</option>
              ))}
            </select>

            {/* Per-page */}
            <select style={{ ...S.select, width: 110 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>

            <div style={{ flex: 1 }} />

            {/* Export */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || !selectedExam}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)',
                color: '#ff6b00', borderRadius: 7, padding: '5px 12px',
                fontSize: '0.78rem', fontWeight: 600,
                cursor: (exporting || !selectedExam) ? 'not-allowed' : 'pointer',
                opacity: (exporting || !selectedExam) ? 0.5 : 1, flexShrink: 0,
              }}
            >
              <FaDownload size={11} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                style={S.searchInput}
                placeholder="Search name / email"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Round badges row (if exam has rounds) */}
          {examRounds.length > 0 && (
            <div style={{ padding: '0.5rem 1.25rem 0.6rem', borderBottom: '1px solid #1e1e1e', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <span style={{ color: '#444', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                {examTitle} — rounds:
              </span>
              {examRounds.map((rt) => {
                const meta = ROUND_META[rt] || { label: rt.toUpperCase(), color: '#888', icon: FaClipboardList }
                const Icon = meta.icon
                return (
                  <span key={rt} style={{
                    background: `${meta.color}18`, color: meta.color,
                    border: `1px solid ${meta.color}33`,
                    borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <Icon size={10} /> {meta.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Table */}
          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {stuLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 44 }}>#</th>
                  <th style={{ ...S.th, minWidth: 150 }}>Student</th>
                  <th style={{ ...S.th, minWidth: 180 }}>Email</th>
                  <th style={{ ...S.th, minWidth: 80, textAlign: 'center' }}>Score</th>
                  <th style={{ ...S.th, minWidth: 80, textAlign: 'center' }}>%</th>
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Result</th>
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Status</th>
                  {examRounds.map((rt) => {
                    const meta = ROUND_META[rt] || { label: rt.toUpperCase(), color: '#888' }
                    return (
                      <th key={rt} style={{ ...S.th, minWidth: 80, textAlign: 'center', color: meta.color }}>
                        {meta.label}
                      </th>
                    )
                  })}
                  <th style={{ ...S.th, minWidth: 120 }}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8 + examRounds.length} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                      {stuLoading ? '' : selectedExam ? 'No students found' : 'Select an assessment above'}
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.studentId}>
                    <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                      {s.name || s.email?.split('@')[0] || '—'}
                    </td>
                    <td style={S.tdMut}>{s.email}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: '#ff6b00' }}>
                      {s.totalScore}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={{
                        color: s.percentage >= 60 ? '#22c55e' : s.percentage >= 40 ? '#f59e0b' : '#ef4444',
                        fontWeight: 700,
                      }}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <StatusBadge status={s.resultStatus} />
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <StatusBadge status={s.status} />
                    </td>
                    {/* Per-round score columns */}
                    {examRounds.map((rt) => {
                      const rr = s.roundResults.find((r) => r.roundType === rt)
                      const meta = ROUND_META[rt] || { color: '#888' }
                      return (
                        <td key={rt} style={{ ...S.td, textAlign: 'center' }}>
                          {rr ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ color: rr.passed ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>
                                {rr.score}/{rr.total}
                              </span>
                              <span style={{ color: meta.color, fontSize: '0.65rem' }}>{rr.percentage}%</span>
                            </div>
                          ) : (
                            <span style={{ color: '#333', fontSize: '0.72rem' }}>—</span>
                          )}
                        </td>
                      )
                    })}
                    <td style={S.tdMut}>
                      {s.completedAt
                        ? new Date(s.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div style={S.footer}>
            <span>
              Showing{' '}
              <strong style={{ color: '#aaa' }}>
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>
              {' '}of <strong style={{ color: '#aaa' }}>{pagination.total}</strong> students
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <PagBtn disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>‹ Prev</PagBtn>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(p); return acc
                }, [])
                .map((p, idx) => p === '…'
                  ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                  : <PagBtn key={p} active={p === pagination.page} onClick={() => setPage(p as number)}>{p}</PagBtn>
                )}
              <PagBtn disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Next ›</PagBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentFull
