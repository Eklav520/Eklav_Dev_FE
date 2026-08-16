import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaHeadphones, FaMicrophone, FaBookOpen, FaRandom, FaTheaterMasks, FaSpellCheck,
  FaSearch, FaDownload, FaUserGraduate, FaCheckCircle, FaLayerGroup, FaChalkboardTeacher,
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

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
  { key: 'listeningReading', label: 'Listening + Reading', icon: FaHeadphones,    color: '#3b82f6' },
  { key: 'speaking',         label: 'Speaking',            icon: FaMicrophone,    color: '#a855f7' },
  { key: 'passages',         label: 'Reading Passages',    icon: FaBookOpen,      color: '#22c55e' },
  { key: 'jumbled',          label: 'Jumbled Sentences',   icon: FaRandom,        color: '#f59e0b' },
  { key: 'storytelling',     label: 'Story Telling',       icon: FaTheaterMasks,  color: '#ec4899' },
  { key: 'grammar',          label: 'Grammar',             icon: FaSpellCheck,    color: '#ef4444' },
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

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' } as React.CSSProperties,
  statCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '0.65rem 0.8rem' } as React.CSSProperties,
  iconCircle: (accent: string): React.CSSProperties => ({
    background: accent, borderRadius: '50%', width: 26, height: 26,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }),
  numSm: { fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 3 } as React.CSSProperties,
  labelSm: { color: '#999', fontSize: '0.72rem' } as React.CSSProperties,
  sub: (accent: string): React.CSSProperties => ({ color: accent, fontSize: '0.66rem', fontWeight: 600, display: 'block' }),
  card:  { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  th:    { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.7rem 0.9rem', textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const },
  td:    { padding: '0.65rem 0.9rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.8rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut: { padding: '0.65rem 0.9rem', borderBottom: '1px solid #1e1e1e', color: '#aaa', fontSize: '0.76rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 26px 6px 12px', fontSize: '0.82rem', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 200 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
  sectionLabel: { color: '#aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' } as React.CSSProperties,
  headerBtn: (accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: `${accent}18`, border: `1px solid ${accent}44`,
    color: accent, borderRadius: 8, padding: '7px 14px',
    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  }),
}

/* ─── Helpers ────────────────────────────────────────────── */
const scoreColor = (score: number | null | undefined) => {
  if (score == null) return '#333'
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

/* ─── Pagination Button ──────────────────────────────────── */
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

  if (lsrwOvLoading || !lsrwOverview) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaChalkboardTeacher size={18} color="#ff6b00" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>LSRW Practice — Section Report</span>
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>
            Track student progress on the LSRW Skill Practice round — Pattern 1 and Pattern 2, section by section.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <select style={{ ...S.select, width: 130 }} value={rangeMode} onChange={(e) => setRangeMode(e.target.value as 'monthly' | 'custom')}>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>

          {rangeMode === 'monthly' ? (
            <>
              <select style={{ ...S.select, width: 130 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select style={{ ...S.select, width: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          ) : (
            <>
              <input type="date" style={{ ...S.select, width: 140 }} value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
              <input type="date" style={{ ...S.select, width: 140 }} value={customEnd} min={customStart} max={toDateStr(now)} onChange={(e) => setCustomEnd(e.target.value)} />
              <button style={S.headerBtn('#ff6b00')} onClick={applyCustomRange}>Apply</button>
            </>
          )}

          <button style={S.headerBtn('#22c55e')} onClick={handleExportExcel} disabled={exporting}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ff6b00')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Attempts</span>
          </div>
          <div style={S.numSm}>{lsrwOverview.totalAttempts.toLocaleString()}</div>
          <span style={S.sub('#999')}>{lsrwOverview.completedAttempts} completed</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#3b82f6')}><FaUserGraduate size={12} color="#fff" /></div>
            <span style={S.labelSm}>Students Practiced</span>
          </div>
          <div style={S.numSm}>{lsrwOverview.uniqueStudents}</div>
          <span style={S.sub('#999')}>attempted ≥ 1 section</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#a855f7')}><FaLayerGroup size={12} color="#fff" /></div>
            <span style={S.labelSm}>Pattern 1</span>
          </div>
          <div style={S.numSm}>{lsrwOverview.patternBreakdown[1] ?? 0}</div>
          <span style={S.sub('#999')}>attempts</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#22c55e')}><FaLayerGroup size={12} color="#fff" /></div>
            <span style={S.labelSm}>Pattern 2</span>
          </div>
          <div style={S.numSm}>{lsrwOverview.patternBreakdown[2] ?? 0}</div>
          <span style={S.sub('#999')}>attempts</span>
        </div>
      </div>

      {/* Section cards */}
      <div style={S.sectionLabel}>LSRW Sections – {isCustom ? `${appliedStart} to ${appliedEnd}` : `${MONTH_SHORT[month - 1]} ${year}`}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {LSRW_SECTIONS.map(({ key, label, icon: Icon, color }) => {
          const stat = lsrwOverview.sections.find((s) => s.key === key)
          return (
            <div key={key} style={{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: 14, padding: '1rem', borderTop: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.75rem' }}>
                <div style={{ background: `${color}18`, borderRadius: 8, padding: '6px', display: 'inline-flex' }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ color: '#ddd', fontWeight: 700, fontSize: '0.8rem' }}>{label}</span>
              </div>
              <div style={{ color, fontWeight: 800, fontSize: '1.35rem', lineHeight: 1 }}>{stat?.attempts ?? 0}</div>
              <div style={{ color: '#555', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.05em', marginTop: 2, marginBottom: '0.5rem' }}>ATTEMPTS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666', fontSize: '0.68rem' }}>{stat?.studentsUsed ?? 0} students</span>
                {(stat?.avgScore ?? 0) > 0 && (
                  <span style={{
                    background: `${scoreColor(stat!.avgScore)}18`, color: scoreColor(stat!.avgScore),
                    border: `1px solid ${scoreColor(stat!.avgScore)}33`,
                    borderRadius: 5, padding: '1px 7px', fontSize: '0.66rem', fontWeight: 700,
                  }}>
                    avg {stat!.avgScore}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Student table */}
      <div style={S.card}>
        <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e1e1e', display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>LSRW Student Performance</span>
          <span style={{ color: '#444', fontSize: '0.73rem' }}>{lsrwPag.total} students</span>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
            <input style={S.searchInput} placeholder="Search by name or email" value={lsrwSearch} onChange={(e) => onLsrwSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ position: 'relative', overflowX: 'auto' }}>
          {lsrwStudLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, minWidth: 28 }}>#</th>
                <th style={{ ...S.th, minWidth: 140 }}>Student</th>
                {LSRW_SECTIONS.map(({ key, label, color }) => (
                  <th key={key} style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>
                    <span style={{ color }}>{label}</span>
                  </th>
                ))}
                <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Overall Avg</th>
                <th style={{ ...S.th, minWidth: 70, textAlign: 'center' }}>Attempts</th>
                <th style={{ ...S.th, minWidth: 110 }}>Last Activity</th>
                <th style={{ ...S.th, minWidth: 60, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lsrwStudents.length === 0 ? (
                <tr>
                  <td colSpan={LSRW_SECTIONS.length + 6} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                    {lsrwStudLoading ? '' : 'No students found'}
                  </td>
                </tr>
              ) : lsrwStudents.map((s, i) => (
                <tr key={s.userId}>
                  <td style={S.tdMut}>{(lsrwPag.page - 1) * lsrwPag.limit + i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                    {s.name || s.email?.split('@')[0] || '—'}
                  </td>
                  {LSRW_SECTIONS.map(({ key }) => {
                    const entry = s.sections[key]
                    return (
                      <td key={key} style={{ ...S.td, textAlign: 'center' }}>
                        {entry ? (
                          <span style={{
                            background: `${scoreColor(entry.scoreAwarded)}18`, color: scoreColor(entry.scoreAwarded),
                            border: `1px solid ${scoreColor(entry.scoreAwarded)}33`,
                            borderRadius: 6, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700,
                          }}>
                            {entry.scoreAwarded}<span style={{ opacity: 0.6 }}>/{entry.marks}</span>
                          </span>
                        ) : <span style={{ color: '#444', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    )
                  })}
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {s.overallAvg !== null ? (
                      <span style={{
                        background: `${scoreColor(s.overallAvg)}18`, color: scoreColor(s.overallAvg),
                        border: `1px solid ${scoreColor(s.overallAvg)}33`,
                        borderRadius: 6, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {s.overallAvg}
                      </span>
                    ) : <span style={{ color: '#444' }}>—</span>}
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{s.attempts}</td>
                  <td style={S.tdMut}>
                    {s.lastActivity ? new Date(s.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button
                      onClick={() => openLsrwAttempts(s.userId)}
                      style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#ff6b00', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.footer}>
          <span>
            Showing{' '}
            <strong style={{ color: '#aaa' }}>
              {lsrwPag.total === 0 ? 0 : (lsrwPag.page - 1) * lsrwPag.limit + 1}–{Math.min(lsrwPag.page * lsrwPag.limit, lsrwPag.total)}
            </strong>
            {' '}of <strong style={{ color: '#aaa' }}>{lsrwPag.total}</strong> students
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <PagBtn disabled={lsrwPag.page <= 1} onClick={() => setLsrwPage(lsrwPag.page - 1)}>‹ Prev</PagBtn>
            {Array.from({ length: lsrwPag.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === lsrwPag.totalPages || Math.abs(p - lsrwPag.page) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(p); return acc
              }, [])
              .map((p, idx) => p === '…'
                ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                : <PagBtn key={p} active={p === lsrwPag.page} onClick={() => setLsrwPage(p as number)}>{p}</PagBtn>
              )}
            <PagBtn disabled={lsrwPag.page >= lsrwPag.totalPages} onClick={() => setLsrwPage(lsrwPag.page + 1)}>Next ›</PagBtn>
          </div>
        </div>
      </div>

      {/* ── Attempt Drill-Down ("View") ────────────────── */}
      {(lsrwAttemptsLoading || lsrwAttemptsData || lsrwAttemptsError) && createPortal(
        <div
          onClick={closeLsrwAttempts}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#141414', border: '1px solid #252525', borderRadius: 16,
              width: '94vw', maxHeight: '88vh', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>LSRW Attempts</div>
                <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>
                  {lsrwAttemptsData ? `${lsrwAttemptsData.student.name} · ${lsrwAttemptsData.student.email}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>Date Range</span>
                <input type="date" style={S.select} value={lsrwModalStart} max={lsrwModalEnd || undefined} onChange={(e) => setLsrwModalStart(e.target.value)} />
                <span style={{ color: '#555' }}>–</span>
                <input type="date" style={S.select} value={lsrwModalEnd} min={lsrwModalStart || undefined} onChange={(e) => setLsrwModalEnd(e.target.value)} />
                <button
                  onClick={applyLsrwModalRange}
                  style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.4)', color: '#ff6b00', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Apply
                </button>
                {(lsrwModalStart || lsrwModalEnd || lsrwModalAppliedStart || lsrwModalAppliedEnd) && (
                  <button
                    onClick={clearLsrwModalRange}
                    style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={closeLsrwAttempts}
                  style={{ background: '#222', border: '1px solid #333', color: '#777', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.1rem 1.4rem' }}>
              {lsrwAttemptsLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
                  <Spinner animation="border" style={{ color: '#ff6b00' }} />
                </div>
              )}
              {lsrwAttemptsError && (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>{lsrwAttemptsError}</div>
              )}
              {lsrwAttemptsData && !lsrwAttemptsLoading && (
                lsrwAttemptsData.attempts.length === 0 ? (
                  <div style={{ color: '#444', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No attempts in this range</div>
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
                      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', marginBottom: '1rem' }}>
                        {([1, 2] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setLsrwModalPatternTab(p)}
                            style={{ position: 'relative', background: 'none', border: 'none', padding: '0.6rem 1.1rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: lsrwModalPatternTab === p ? 700 : 500, color: lsrwModalPatternTab === p ? '#fff' : '#555' }}
                          >
                            Pattern {p}
                            {(p === 1 ? pattern1.length : pattern2.length) === 0 && (
                              <span style={{ marginLeft: 6, color: '#444', fontSize: '0.68rem' }}>(none)</span>
                            )}
                            {lsrwModalPatternTab === p && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: '#ff6b00', borderRadius: 2 }} />}
                          </button>
                        ))}
                      </div>

                      {activeAttempts.length === 0 ? (
                        <div style={{ color: '#444', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>No Pattern {lsrwModalPatternTab} attempts in this range</div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: 170 }} />
                              {dates.map((d) => <col key={d} style={{ width: 110 }} />)}
                            </colgroup>
                            <thead>
                              <tr>
                                <th style={{ ...S.th, position: 'sticky', left: 0, zIndex: 2, background: '#111', boxShadow: '1px 0 0 #2a2a2a' }}>Section</th>
                                {dates.map((d) => (
                                  <th key={d} style={{ ...S.th, textAlign: 'center' }}>
                                    {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activeSections.map(({ key, label, color }) => (
                                <tr key={key}>
                                  <td style={{ ...S.td, fontWeight: 700, position: 'sticky', left: 0, zIndex: 1, background: '#141414', boxShadow: '1px 0 0 #2a2a2a' }}>
                                    <span style={{ color }}>{label}</span>
                                  </td>
                                  {dates.map((d) => {
                                    const cell = bySection[key][d]
                                    return (
                                      <td key={d} style={{ ...S.td, textAlign: 'center' }}>
                                        {!cell ? (
                                          <span style={{ color: '#333' }}>—</span>
                                        ) : cell.status === 'pending' ? (
                                          <span style={{ color: '#444', fontSize: '0.75rem' }}>—</span>
                                        ) : (
                                          <div>
                                            <div style={{ color: scoreColor(cell.score ?? 0), fontWeight: 700, fontSize: '0.78rem' }}>
                                              {cell.score}<span style={{ opacity: 0.6 }}>/{cell.marks}</span>
                                            </div>
                                            <div style={{ color: '#555', fontSize: '0.6rem', marginTop: 2 }}>{cell.time}</div>
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
    </div>
  )
}

export default LSRWPracticeFull
