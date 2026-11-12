import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FaHeadphones, FaMicrophone, FaBookOpen, FaRandom, FaTheaterMasks, FaSpellCheck,
  FaSearch, FaDownload, FaUserGraduate, FaCheckCircle, FaLayerGroup, FaChalkboardTeacher,
  FaSpinner, FaEye, FaTimes,
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, TableFooter, EmptyState, initialsOf, scoreBadgeClass, type SelectOption } from '@/components/admin-ui'

/* ─── Types ─────────────────────────────────────────────── */
type Pagination = { total: number; page: number; limit: number; totalPages: number }

type LSRWSectionStat = { key: string; label: string; attempts: number; avgScore: number; studentsUsed: number }
type LSRWOverview = {
  totalAttempts: number
  completedAttempts: number
  uniqueStudents: number
  patternBreakdown: { 1: number; 2: number }
  sections: LSRWSectionStat[]
}
type LSRWSectionEntry = { scoreAwarded: number; marks: number; status: string } | undefined
type LSRWStudentRow = {
  userId: string
  name: string
  email: string
  sections: Record<string, LSRWSectionEntry>
  patterns: number[]
  attempts: number
  overallAvg: number | null
  lastActivity: string | null
}

type LSRWAttemptSection = { sectionKey: string; label: string; marks: number; scoreAwarded: number | null; status: string; completedAt: string | null }
type LSRWAttempt = {
  attemptId: string
  patternKey: number
  status: string
  startedAt: string
  completedAt: string | null
  totalScoreAwarded: number
  totalMarks: number
  sections: LSRWAttemptSection[]
}
type LSRWAttemptsResponse = { student: { userId: string; name: string; email: string }; attempts: LSRWAttempt[] }

/* ─── Constants ─────────────────────────────────────────── */
const LSRW_SECTIONS = [
  { key: 'listeningReading', short: 'L + R', label: 'Listening + Reading', icon: FaHeadphones,    color: '#3b82f6' },
  { key: 'speaking', short: 'Speaking',         label: 'Speaking',            icon: FaMicrophone,    color: '#a855f7' },
  { key: 'passages', short: 'Passages',         label: 'Reading Passages',    icon: FaBookOpen,      color: '#22c55e' },
  { key: 'jumbled', short: 'Jumbled',          label: 'Jumbled Sentences',   icon: FaRandom,        color: '#f59e0b' },
  { key: 'storytelling', short: 'Story',     label: 'Story Telling',       icon: FaTheaterMasks,  color: '#ec4899' },
  { key: 'grammar', short: 'Grammar',          label: 'Grammar',             icon: FaSpellCheck,    color: '#ef4444' },
] as const

// Pattern 1 and Pattern 2 are NOT the same 6 sections — each pattern is its
// own fixed 4-section sequence (student/lsrw-communication/sectionsConfig.ts,
// PATTERN_SECTIONS — kept in sync with the backend's lsrwPatternConfig.js).
const LSRW_PATTERN_SECTION_KEYS: Record<1 | 2, string[]> = {
  1: ['listeningReading', 'speaking', 'grammar', 'passages'],
  2: ['listeningReading', 'jumbled', 'grammar', 'storytelling'],
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const scoreBarColor = (pct: number | null) =>
  pct == null ? '#2b2e31' : pct >= 80 ? '#31d866' : pct >= 50 ? '#f6aa24' : '#fb5f67'

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months < 12 ? `${months} mo ago` : `${Math.floor(months / 12)} yr ago`
}

const RANGE_OPTIONS: SelectOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom Range' },
]

/* ─── Main Component ─────────────────────────────────────── */
const LSRWPracticeFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL
  const now = new Date()

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10)
  const [rangeMode, setRangeMode]     = useState<'monthly' | 'custom'>('monthly')
  const [customStart, setCustomStart] = useState(toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [customEnd, setCustomEnd]     = useState(toDateStr(now))
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd]     = useState('')
  const isCustom = rangeMode === 'custom' && Boolean(appliedStart && appliedEnd)

  const applyCustomRange = () => { setAppliedStart(customStart); setAppliedEnd(customEnd) }
  const rangeParams = (): Record<string, string> => (isCustom ? { startDate: appliedStart, endDate: appliedEnd } : { monthKey })

  /* ── Overview + Students ─────────────────────────────────── */
  const [lsrwOverview, setLsrwOverview]   = useState<LSRWOverview | null>(null)
  const [lsrwOvLoading, setLsrwOvLoading] = useState(true)
  const [lsrwStudents, setLsrwStudents]   = useState<LSRWStudentRow[]>([])
  const [lsrwPag, setLsrwPag]             = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [lsrwStudLoading, setLsrwStudLoad] = useState(false)
  const [lsrwSearch, setLsrwSearch]       = useState('')
  const [lsrwPage, setLsrwPage]           = useState(1)
  const lsrwSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchLsrwOverview = useCallback(async () => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return
    setLsrwOvLoading(true)
    const params = new URLSearchParams(rangeParams())
    try {
      const res = await fetch(`${baseURL}${apiBase}/lsrw-overview?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) setLsrwOverview(data)
    } catch (err) { console.error(err) }
    finally { setLsrwOvLoading(false) }
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  const fetchLsrwStudents = useCallback(async (opts: { page?: number; search?: string } = {}) => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return
    setLsrwStudLoad(true)
    const params = new URLSearchParams({ page: String(opts.page ?? 1), limit: '20', search: opts.search ?? '', ...rangeParams() })
    try {
      const res = await fetch(`${baseURL}${apiBase}/lsrw-students?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) {
        setLsrwStudents(data.students)
        setLsrwPag({ total: data.total, page: data.page, limit: data.limit, totalPages: Math.max(1, Math.ceil(data.total / data.limit)) })
      }
    } catch (err) { console.error(err) }
    finally { setLsrwStudLoad(false) }
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  useEffect(() => {
    if (rangeMode === 'custom' && !isCustom) return
    fetchLsrwOverview()
    fetchLsrwStudents({ page: lsrwPage, search: lsrwSearch })
  }, [lsrwPage, monthKey, isCustom, appliedStart, appliedEnd, rangeMode]) // eslint-disable-line

  const onLsrwSearch = (val: string) => {
    setLsrwSearch(val)
    if (lsrwSearchTimer.current) clearTimeout(lsrwSearchTimer.current)
    lsrwSearchTimer.current = setTimeout(() => {
      setLsrwPage(1)
      fetchLsrwStudents({ page: 1, search: val })
    }, 400)
  }

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '9999', search: lsrwSearch, ...rangeParams() })
      const res = await fetch(`${baseURL}${apiBase}/lsrw-students?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (!data.success) return
      const rows = (data.students as LSRWStudentRow[]).map((s, i) => {
        const row: Record<string, string | number> = { '#': i + 1, Name: s.name || '', Email: s.email || '' }
        LSRW_SECTIONS.forEach(({ key, label }) => {
          const entry = s.sections[key]
          row[`${label} Score`] = entry ? `${entry.scoreAwarded}/${entry.marks}` : '—'
        })
        row['Overall Avg'] = s.overallAvg ?? '—'
        row['Attempts'] = s.attempts
        row['Last Activity'] = s.lastActivity ? new Date(s.lastActivity).toLocaleDateString('en-IN') : '—'
        return row
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'LSRW Practice')
      XLSX.writeFile(wb, `LSRW_Practice_${isCustom ? `${appliedStart}_to_${appliedEnd}` : monthKey}.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  /* ── Per-student attempt drill-down ("View") ─────────────── */
  const [lsrwAttemptsData, setLsrwAttemptsData] = useState<LSRWAttemptsResponse | null>(null)
  const [lsrwAttemptsLoading, setLsrwAttemptsLoading] = useState(false)
  const [lsrwAttemptsError, setLsrwAttemptsError] = useState('')
  const [lsrwModalStudentId, setLsrwModalStudentId] = useState('')
  const [lsrwModalStart, setLsrwModalStart] = useState('')
  const [lsrwModalEnd, setLsrwModalEnd] = useState('')
  const [lsrwModalAppliedStart, setLsrwModalAppliedStart] = useState('')
  const [lsrwModalAppliedEnd, setLsrwModalAppliedEnd] = useState('')
  const [lsrwModalPatternTab, setLsrwModalPatternTab] = useState<1 | 2>(1)

  const fetchLsrwAttempts = async (studentId: string, rangeOverride?: Record<string, string>) => {
    if (!user?.token) return
    setLsrwAttemptsError('')
    setLsrwAttemptsLoading(true)
    try {
      const params = new URLSearchParams({ studentId, ...(rangeOverride ?? rangeParams()) })
      const res = await fetch(`${baseURL}${apiBase}/lsrw-student-attempts?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) setLsrwAttemptsData(data)
      else setLsrwAttemptsError(data.message || 'Failed to load attempts')
    } catch (err) {
      console.error(err)
      setLsrwAttemptsError('Network error')
    } finally {
      setLsrwAttemptsLoading(false)
    }
  }

  const openLsrwAttempts = (studentId: string) => {
    setLsrwModalStudentId(studentId)
    setLsrwAttemptsData(null)
    setLsrwModalStart(''); setLsrwModalEnd('')
    setLsrwModalAppliedStart(''); setLsrwModalAppliedEnd('')
    setLsrwModalPatternTab(1)
    fetchLsrwAttempts(studentId)
  }
  const applyLsrwModalRange = () => {
    setLsrwModalAppliedStart(lsrwModalStart)
    setLsrwModalAppliedEnd(lsrwModalEnd)
    if (!lsrwModalStart || !lsrwModalEnd) return
    fetchLsrwAttempts(lsrwModalStudentId, { startDate: lsrwModalStart, endDate: lsrwModalEnd })
  }
  const clearLsrwModalRange = () => {
    setLsrwModalStart(''); setLsrwModalEnd(''); setLsrwModalAppliedStart(''); setLsrwModalAppliedEnd('')
    fetchLsrwAttempts(lsrwModalStudentId)
  }
  const closeLsrwAttempts = () => { setLsrwAttemptsData(null); setLsrwAttemptsError(''); setLsrwModalStudentId('') }

  const periodLabel = isCustom ? `${appliedStart} to ${appliedEnd}` : `${MONTH_SHORT[month - 1]} ${year}`
  const pageStart = lsrwPag.total === 0 ? 0 : (lsrwPag.page - 1) * lsrwPag.limit

  return (
    <AdminPage>
      <PageHeader
        icon={FaChalkboardTeacher}
        title="LSRW Section Report"
        actions={<>
          <AdminSelect label="Report period" prefix="Period:" value={rangeMode} options={RANGE_OPTIONS} onChange={value => setRangeMode(value as 'monthly' | 'custom')} />
          {rangeMode === 'monthly' ? (
            <>
              <AdminSelect label="Month" value={String(month)} options={MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }))} onChange={value => setMonth(Number(value))} />
              <AdminSelect label="Year" value={String(year)} options={yearRange.map(y => ({ value: String(y), label: String(y) }))} onChange={value => setYear(Number(value))} />
            </>
          ) : (
            <>
              <input type="date" className="aui-date" aria-label="Start date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
              <input type="date" className="aui-date" aria-label="End date" value={customEnd} min={customStart} max={toDateStr(now)} onChange={(e) => setCustomEnd(e.target.value)} />
              <button type="button" className="aui-btn aui-btn-soft" onClick={applyCustomRange}>Apply</button>
            </>
          )}
          <button type="button" className="aui-btn aui-btn-primary" onClick={handleExportExcel} disabled={exporting || !lsrwOverview}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </>}
      />

      {lsrwOvLoading || !lsrwOverview ? (
        <div className="aui-empty">
          <FaSpinner className="aui-spin" />
          <span>{rangeMode === 'custom' && !isCustom ? 'Choose a start and end date, then Apply' : 'Loading LSRW report…'}</span>
        </div>
      ) : (
        <>
          <StatCards
            items={[
              { label: 'Total Attempts', value: lsrwOverview.totalAttempts.toLocaleString(), icon: FaCheckCircle, tone: 'orange', hint: `${lsrwOverview.completedAttempts} completed` },
              { label: 'Students Practiced', value: lsrwOverview.uniqueStudents, icon: FaUserGraduate, tone: 'blue', hint: 'attempted ≥ 1 section' },
              { label: 'Pattern 1', value: lsrwOverview.patternBreakdown[1] ?? 0, icon: FaLayerGroup, tone: 'purple', hint: 'attempts' },
              { label: 'Pattern 2', value: lsrwOverview.patternBreakdown[2] ?? 0, icon: FaLayerGroup, tone: 'green', hint: 'attempts' },
            ]}
          />

        </>
      )}

      {/* Student table */}
      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>LSRW Student Performance</h3>
            <p>{lsrwPag.total} student{lsrwPag.total !== 1 ? 's' : ''} · {periodLabel}</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={lsrwSearch} onChange={onLsrwSearch} placeholder="Search students" />
          </div>
        </div>

        {lsrwStudents.length === 0 ? (
          lsrwStudLoading ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" /><span>Loading students…</span></div>
          ) : (
            <EmptyState
              icon={lsrwSearch ? FaSearch : FaChalkboardTeacher}
              title={lsrwSearch ? `No students match “${lsrwSearch}”` : 'No LSRW activity in this period'}
              text={lsrwSearch ? 'Try a different name or email.' : 'Student attempts will appear here once they start practising.'}
            />
          )
        ) : (
          <div className="aui-table-scroll lsrw-scroll">
            {lsrwStudLoading && (
              <div className="lsrw-table-loading">
                <FaSpinner className="aui-spin" />
              </div>
            )}
            <table className="aui-table lsrw-table">
              <thead>
                <tr className="lsrw-group-row">
                  <th rowSpan={2} className="lsrw-col-num">#</th>
                  <th rowSpan={2} className="lsrw-col-student">Student</th>
                  <th colSpan={LSRW_SECTIONS.length} className="lsrw-group">Section Scores</th>
                  <th rowSpan={2} className="lsrw-center">Overall</th>
                  <th rowSpan={2} className="lsrw-center">Attempts</th>
                  <th rowSpan={2}>Last Activity</th>
                  <th rowSpan={2} className="text-end">Action</th>
                </tr>
                <tr>
                  {LSRW_SECTIONS.map(({ key, label, short, icon: Icon, color }) => (
                    <th key={key} className="lsrw-section-th" title={label}>
                      <span className="lsrw-section-head"><Icon style={{ color }} />{short}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lsrwStudents.map((s, i) => {
                  const displayName = s.name || s.email?.split('@')[0] || '—'
                  return (
                    <tr key={s.userId}>
                      <td className="aui-num lsrw-col-num">{pageStart + i + 1}</td>
                      <td className="lsrw-col-student">
                        <div className="aui-person">
                          <span className="aui-avatar">{initialsOf(displayName)}</span>
                          <div className="aui-stack">
                            <strong>{displayName}</strong>
                            <small>{s.email}</small>
                          </div>
                        </div>
                      </td>
                      {LSRW_SECTIONS.map(({ key }) => {
                        const entry = s.sections[key]
                        const pct = entry && entry.marks > 0 ? Math.round((entry.scoreAwarded / entry.marks) * 100) : null
                        return (
                          <td key={key} className="lsrw-score-td">
                            {entry ? (
                              <div className="lsrw-score" title={`${pct}%`}>
                                <strong>{entry.scoreAwarded}<small>/{entry.marks}</small></strong>
                                <span><i style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%`, background: scoreBarColor(pct) }} /></span>
                              </div>
                            ) : (
                              <span className="lsrw-na">Not attempted</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="lsrw-center">
                        {s.overallAvg !== null
                          ? <span className={`lsrw-overall ${scoreBadgeClass(s.overallAvg)}`}>{s.overallAvg}%</span>
                          : <span className="aui-num">—</span>}
                      </td>
                      <td className="lsrw-center"><span className="lsrw-attempts">{s.attempts}</span></td>
                      <td>
                        {s.lastActivity ? (
                          <div className="aui-stack">
                            <strong className="lsrw-ago">{timeAgo(s.lastActivity)}</strong>
                            <small>{new Date(s.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                          </div>
                        ) : <span className="aui-num">—</span>}
                      </td>
                      <td className="text-end">
                        <button type="button" className="aui-btn aui-btn-sm" onClick={() => openLsrwAttempts(s.userId)}>
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {lsrwPag.total > 0 && (
          <TableFooter page={lsrwPag.page} pageSize={lsrwPag.limit} total={lsrwPag.total} onPageChange={setLsrwPage} noun="students" />
        )}
      </div>

      {/* ── Attempt Drill-Down ("View") ────────────────── */}
      {(lsrwAttemptsLoading || lsrwAttemptsData || lsrwAttemptsError) && createPortal(
        <div className="aui-page lsrw-modal-backdrop" onClick={closeLsrwAttempts}>
          <div className="lsrw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lsrw-modal-head">
              <div className="aui-person">
                <span className="aui-avatar">{initialsOf(lsrwAttemptsData?.student.name || '?')}</span>
                <div className="aui-stack">
                  <strong style={{ fontSize: '0.92rem' }}>LSRW Attempts{lsrwAttemptsData ? ` · ${lsrwAttemptsData.student.name}` : ''}</strong>
                  <small>{lsrwAttemptsData?.student.email || ''}</small>
                </div>
              </div>
              <div className="lsrw-modal-tools">
                <span className="aui-count">Date range</span>
                <input type="date" className="aui-date" aria-label="Attempts start date" value={lsrwModalStart} max={lsrwModalEnd || undefined} onChange={(e) => setLsrwModalStart(e.target.value)} />
                <span className="aui-count">–</span>
                <input type="date" className="aui-date" aria-label="Attempts end date" value={lsrwModalEnd} min={lsrwModalStart || undefined} onChange={(e) => setLsrwModalEnd(e.target.value)} />
                <button type="button" className="aui-btn aui-btn-soft aui-btn-sm" onClick={applyLsrwModalRange}>Apply</button>
                {(lsrwModalStart || lsrwModalEnd || lsrwModalAppliedStart || lsrwModalAppliedEnd) && (
                  <button type="button" className="aui-btn aui-btn-sm" onClick={clearLsrwModalRange}>Clear</button>
                )}
                <button type="button" className="aui-icon-btn" onClick={closeLsrwAttempts} aria-label="Close"><FaTimes size={12} /></button>
              </div>
            </div>

            <div className="lsrw-modal-body">
              {lsrwAttemptsLoading && (
                <div className="aui-empty"><FaSpinner className="aui-spin" /><span>Loading attempts…</span></div>
              )}
              {lsrwAttemptsError && <div className="aui-alert">{lsrwAttemptsError}</div>}
              {lsrwAttemptsData && !lsrwAttemptsLoading && (
                lsrwAttemptsData.attempts.length === 0 ? (
                  <EmptyState icon={FaChalkboardTeacher} title="No attempts in this range" text="Try a wider date range." />
                ) : (() => {
                  type Cell = { score: number | null; marks: number; status: string; time: string; ms: number }

                  const pattern1 = lsrwAttemptsData.attempts.filter((a) => a.patternKey === 1)
                  const pattern2 = lsrwAttemptsData.attempts.filter((a) => a.patternKey === 2)
                  const activeAttempts = lsrwModalPatternTab === 1 ? pattern1 : pattern2
                  const activeSections = LSRW_SECTIONS.filter((s) => LSRW_PATTERN_SECTION_KEYS[lsrwModalPatternTab].includes(s.key))

                  const dateSet = new Set(activeAttempts.map((a) => toDateStr(new Date(a.startedAt))))
                  const dates = [...dateSet].sort()
                  const bySection: Record<string, Record<string, Cell>> = {}
                  activeSections.forEach(({ key }) => { bySection[key] = {} })
                  activeAttempts.forEach((a) => {
                    const d = toDateStr(new Date(a.startedAt))
                    const ms = new Date(a.startedAt).getTime()
                    a.sections.forEach((sec) => {
                      if (!bySection[sec.sectionKey]) return
                      const existing = bySection[sec.sectionKey][d]
                      if (!existing || ms > existing.ms) {
                        const time = new Date(a.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        bySection[sec.sectionKey][d] = { score: sec.scoreAwarded, marks: sec.marks, status: sec.status, time, ms }
                      }
                    })
                  })

                  return (
                    <div>
                      <div className="lsrw-tabs">
                        {([1, 2] as const).map((p) => (
                          <button key={p} type="button" className={lsrwModalPatternTab === p ? 'is-active' : ''} onClick={() => setLsrwModalPatternTab(p)}>
                            Pattern {p}
                            <span className="aui-badge aui-badge-muted">{p === 1 ? pattern1.length : pattern2.length}</span>
                          </button>
                        ))}
                      </div>

                      {activeAttempts.length === 0 ? (
                        <EmptyState icon={FaLayerGroup} title={`No Pattern ${lsrwModalPatternTab} attempts in this range`} />
                      ) : (
                        <div className="aui-card" style={{ marginTop: '1rem' }}>
                          <div className="aui-table-scroll" style={{ borderRadius: 12 }}>
                            <table className="aui-table" style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: 180 }} />
                                {dates.map((d) => <col key={d} style={{ width: 110 }} />)}
                              </colgroup>
                              <thead>
                                <tr>
                                  <th className="lsrw-sticky">Section</th>
                                  {dates.map((d) => (
                                    <th key={d} style={{ textAlign: 'center' }}>
                                      {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {activeSections.map(({ key, label, color }) => (
                                  <tr key={key}>
                                    <td className="lsrw-sticky">
                                      <span className="lsrw-th-dot" style={{ background: color }} /><strong style={{ color: '#eceef0' }}>{label}</strong>
                                    </td>
                                    {dates.map((d) => {
                                      const cell = bySection[key][d]
                                      return (
                                        <td key={d} style={{ textAlign: 'center' }}>
                                          {!cell || cell.status === 'pending' ? (
                                            <span className="aui-num">—</span>
                                          ) : (
                                            <div className="aui-stack" style={{ alignItems: 'center' }}>
                                              <span className={`aui-badge ${scoreBadgeClass(cell.marks > 0 ? Math.round(((cell.score ?? 0) / cell.marks) * 100) : null)}`}>{cell.score}<span style={{ opacity: 0.6 }}>/{cell.marks}</span></span>
                                              <small>{cell.time}</small>
                                            </div>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .lsrw-th-dot { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; vertical-align: 1px; }

        /* Student performance table */
        .lsrw-table th, .lsrw-table td { white-space: nowrap; }
        .lsrw-table thead tr:first-child th { border-bottom: 0; }
        .lsrw-table thead tr + tr { border-bottom: 1px solid #25282b; background: #17191b; }
        .lsrw-table .lsrw-group { padding: 0.55rem 0.85rem 0.35rem; text-align: center; color: #c9cdd1; border-left: 1px solid #25282b; border-right: 1px solid #25282b; border-bottom: 1px solid #25282b; }
        .lsrw-table .lsrw-section-th { padding-top: 0.45rem; text-align: center; font-size: 0.62rem; }
        .lsrw-table .lsrw-section-th:first-child { border-left: 1px solid #25282b; }
        .lsrw-table .lsrw-section-th:last-child { border-right: 1px solid #25282b; }
        .lsrw-section-head { display: inline-flex; align-items: center; gap: 5px; }
        .lsrw-section-head svg { font-size: 0.72rem; }
        .lsrw-table .lsrw-center { text-align: center; }
        .lsrw-col-num { width: 44px; }
        .lsrw-col-student { position: sticky; left: 0; z-index: 1; min-width: 230px; background: #0e1012; box-shadow: 1px 0 0 #25282b; }
        .lsrw-table thead .lsrw-col-student { z-index: 2; background: #17191b; }
        .lsrw-table tbody tr:hover .lsrw-col-student { background: #17191b; }

        .lsrw-score-td { min-width: 92px; text-align: center; }
        .lsrw-score { display: inline-flex; flex-direction: column; align-items: stretch; gap: 4px; width: 72px; }
        .lsrw-score strong { color: #eceef0; font-size: 0.78rem; font-weight: 700; }
        .lsrw-score strong small { color: #858a90; font-size: 0.66rem; font-weight: 600; }
        .lsrw-score > span { display: block; height: 4px; overflow: hidden; border-radius: 99px; background: #2b2e31; }
        .lsrw-score > span > i { display: block; height: 100%; border-radius: inherit; animation: lsrw-bar 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes lsrw-bar { from { width: 0; } }
        .lsrw-na { color: #4b5056; font-size: 0.68rem; }

        .lsrw-overall { display: inline-block; min-width: 52px; padding: 4px 10px; border: 1px solid; border-radius: 99px; font-size: 0.74rem; font-weight: 800; }
        .lsrw-attempts { display: inline-grid; min-width: 28px; height: 24px; padding: 0 8px; place-items: center; border-radius: 7px; background: #1b1e21; color: #e5e7eb; font-size: 0.74rem; font-weight: 700; }
        .lsrw-ago { font-size: 0.76rem !important; font-weight: 600 !important; }
        .lsrw-table-loading { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; background: rgba(0,0,0,0.45); }

        .lsrw-modal-backdrop { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: rgba(0,0,0,0.78); backdrop-filter: blur(6px); }
        .lsrw-modal { display: flex; flex-direction: column; width: min(1280px, 94vw); max-height: 88vh; overflow: hidden; border: 1px solid #25282b; border-radius: 14px; background: #0e1012; box-shadow: 0 32px 80px rgba(0,0,0,0.75); }
        .lsrw-modal-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 0.9rem 1.1rem; border-bottom: 1px solid #25282b; background: #111315; }
        .lsrw-modal-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .lsrw-modal-body { overflow-y: auto; padding: 1rem 1.1rem 1.25rem; }
        .lsrw-tabs { display: flex; gap: 4px; border-bottom: 1px solid #25282b; }
        .lsrw-tabs button { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 0.55rem 1rem 0.75rem; border: 0; background: none; color: #858a90; font-size: 0.84rem; font-weight: 600; cursor: pointer; }
        .lsrw-tabs button.is-active { color: #fff; }
        .lsrw-tabs button.is-active::after { content: ""; position: absolute; left: 12%; right: 12%; bottom: -1px; height: 2px; border-radius: 2px; background: #ff7a00; }
        .lsrw-sticky { position: sticky; left: 0; z-index: 1; background: #0e1012; box-shadow: 1px 0 0 #25282b; }
        .aui-table thead .lsrw-sticky { z-index: 2; background: #17191b; }
      `}</style>
    </AdminPage>
  )
}

export default LSRWPracticeFull
