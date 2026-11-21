import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaArrowRight, FaCheckCircle, FaClipboardCheck, FaFileExcel, FaFilePdf, FaHeadset,
  FaChevronRight, FaCompressAlt, FaExpandAlt, FaMicrophone, FaPaperPlane, FaSearch, FaTable, FaPen, FaRedo, FaStop, FaTimes, FaVolumeMute,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import eklavMark from '@/assets/images/logo-mobile-light.svg'
import eklavLogo from '@/assets/images/logo_black.png'

/* Eklav AI: a full-screen assistant on the admin / institute dashboards. The admin types or talks
   ("top 10 performers in CSE", "create an MCQ exam for CSE tomorrow at 10") and the API answers
   from live student data or prepares an action. Actions that change data (creating an exam) only
   happen when the admin presses the button on the card. In voice mode replies are read aloud and
   the mic reopens afterwards, so the whole conversation can be hands-free. */

type Row = {
  id: string; rank: number; name: string; email: string; rollNumber: string; branch: string; joiningYear: string
  overall: number; engagement: number; course: number; interview: number; english: number; assessment: number; code: number
  timeSecs: number; activeDays: number; status: 'on-track' | 'needs-attention' | 'at-risk' | 'not-started'
}
type Table = { title: string; sortBy: string; period: string; view?: 'summary' | 'full'; single?: boolean; total: number; rows: Row[] }
type ExamRound = { roundType: string; label: string; enabled: boolean; pickCount: number; timeSeconds: number; startDateTime: string; endDateTime: string; passPercentage: number }
type ExamDraft = { title: string; description: string; branch: string[]; joiningYear: string[]; rounds: ExamRound[] }
type Action =
  | { type: 'create_exam'; exam: ExamDraft; examPage: string }
  | { type: 'navigate'; url: string; label: string }
  | { type: 'clarify'; question: string; options: string[] }
type Msg = { role: 'user' | 'assistant'; text: string; table?: Table | null; action?: Action | null; error?: boolean }

const COLUMN_LABELS: Record<string, string> = {
  engagement: 'Engagement', course: 'Course', interview: 'AI Interview', english: 'English',
  assessment: 'Assessments', code: 'Code', time_spent: 'Time Spent',
}
const STATUS_LABELS: Record<Row['status'], string> = {
  'on-track': 'On Track', 'needs-attention': 'Needs Attention', 'at-risk': 'At Risk', 'not-started': 'Not Started',
}
const FULL_COLUMNS: [keyof Row, string][] = [
  ['engagement', 'Engagement'], ['course', 'Course'], ['interview', 'AI Interview'], ['english', 'English'], ['assessment', 'Assessments'], ['code', 'Code'],
]
const PERIOD_LABELS: Record<string, string> = {
  all: 'All time', last_7_days: 'Last 7 days', last_30_days: 'Last 30 days', last_90_days: 'Last 90 days', this_month: 'This month',
}
const FOLLOW_UPS = ['Top 10 performers', 'Students below 40%', 'Who is at risk?', 'Branch-wise summary', 'Create an exam']

const fmtTime = (secs: number) => {
  const m = Math.round((secs || 0) / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}
const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const fmtClock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const scoreClass = (v: number) => (v >= 75 ? 'is-good' : v >= 50 ? 'is-mid' : 'is-low')
const scoreHex = (v: number) => (v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : v > 0 ? '#ef4444' : '#3a3e43')
const extraValue = (r: Row, key: string) => (key === 'time_spent' ? fmtTime(r.timeSecs) : `${(r as any)[key] ?? 0}%`)
const plain = (text: string) => text.replace(/\*\*/g, '')

/* Replies are plain text with the odd **bold** */
const RichText = ({ text }: { text: string }) => (
  <>
    {text.split('\n').filter(Boolean).map((line, i) => (
      <p key={i}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') && part.endsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : part))}</p>
    ))}
  </>
)

/* ── Student table + exports ─────────────────────────────────── */

const exportRows = (table: Table) => ({
  head: ['Rank', 'Student', 'Email', 'Roll No', 'Branch', 'Year', 'Overall %', 'Engagement %', 'Course %', 'AI Interview %', 'English %', 'Assessments %', 'Code %', 'Time Spent', 'Status'],
  body: table.rows.map((r) => [
    r.rank, r.name, r.email, r.rollNumber, r.branch, r.joiningYear, r.overall, r.engagement, r.course, r.interview,
    r.english, r.assessment, r.code, fmtTime(r.timeSecs), STATUS_LABELS[r.status],
  ]),
})

const downloadCsv = (table: Table) => {
  const { head, body } = exportRows(table)
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '﻿' + [head, ...body].map((row) => row.map(cell).join(',')).join('\r\n') // BOM so Excel reads UTF-8
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${table.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'eklav-students'}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const toDataUrl = (src: string) => fetch(src).then((r) => r.blob()).then((b) => new Promise<string>((resolve, reject) => {
  const fr = new FileReader()
  fr.onload = () => resolve(fr.result as string)
  fr.onerror = reject
  fr.readAsDataURL(b)
}))

/* Branded A4 report: Eklav logo header, summary strip, the full table, page footers */
const downloadPdf = async (table: Table, preparedFor: string) => {
  const [pdfLib, tableLib, logo] = await Promise.all([
    import('jspdf'), import('jspdf-autotable'), toDataUrl(eklavLogo).catch(() => ''),
  ])
  const jsPDF = pdfLib.jsPDF || pdfLib.default
  const autoTable = tableLib.autoTable || tableLib.default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 12
  const ORANGE: [number, number, number] = [255, 122, 0]
  const INK: [number, number, number] = [15, 23, 42]
  const GRAY: [number, number, number] = [100, 116, 139]
  const generated = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  // Header: logo left, report details right, orange rule
  if (logo) doc.addImage(logo, 'PNG', M, 9, 46, 46 * 228 / 1093)
  else { doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...ORANGE); doc.text('Eklav', M, 17) }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRAY)
  doc.text('STUDENT PERFORMANCE REPORT', W - M, 12, { align: 'right' })
  doc.text(`Generated ${generated}`, W - M, 16.5, { align: 'right' })
  if (preparedFor) doc.text(`Prepared for ${preparedFor}`, W - M, 21, { align: 'right' })
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.8); doc.line(M, 25, W - M, 25)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...INK)
  doc.text(table.title, M, 34)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY)
  doc.text(`${PERIOD_LABELS[table.period] || 'All time'}  ·  Showing ${table.rows.length} of ${table.total} students  ·  Ranked by ${table.sortBy === 'overall' ? 'overall score' : COLUMN_LABELS[table.sortBy] || table.sortBy}`, M, 39.5)

  // Summary strip
  const started = table.rows.filter((r) => r.status !== 'not-started')
  const avg = started.length ? Math.round(started.reduce((s, r) => s + r.overall, 0) / started.length) : 0
  const count = (s: Row['status']) => table.rows.filter((r) => r.status === s).length
  const kpis: [string, string, [number, number, number]][] = [
    ['Students', String(table.rows.length), INK],
    ['Average overall', `${avg}%`, ORANGE],
    ['Top score', `${Math.max(0, ...table.rows.map((r) => r.overall))}%`, [22, 163, 74]],
    ['On track', String(count('on-track')), [22, 163, 74]],
    ['Needs attention', String(count('needs-attention')), [217, 119, 6]],
    ['At risk', String(count('at-risk')), [220, 38, 38]],
  ]
  const gap = 3
  const bw = (W - 2 * M - gap * (kpis.length - 1)) / kpis.length
  kpis.forEach(([label, value, color], i) => {
    const x = M + i * (bw + gap)
    doc.setFillColor(255, 247, 237); doc.setDrawColor(254, 215, 170); doc.setLineWidth(0.3)
    doc.roundedRect(x, 44, bw, 15, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY)
    doc.text(label.toUpperCase(), x + 4, 49.5)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...color)
    doc.text(value, x + 4, 56)
  })

  const { head, body } = exportRows(table)
  const STATUS_COLORS: Record<string, [number, number, number]> = {
    'On Track': [22, 163, 74], 'Needs Attention': [217, 119, 6], 'At Risk': [220, 38, 38], 'Not Started': [148, 163, 184],
  }
  autoTable(doc, {
    startY: 64,
    margin: { left: M, right: M, top: 18, bottom: 16 },
    head: [head.map((h) => h.replace(' %', ''))],
    body: body.map((r) => r.map((c, i) => (i >= 6 && i <= 12 ? `${c}%` : String(c ?? '') || '—'))),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.2, cellPadding: 1.8, textColor: INK, lineColor: [226, 232, 240], lineWidth: 0.2, valign: 'middle' },
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold', fontSize: 7.4, halign: 'center' },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { cellWidth: 40 },
      6: { halign: 'center', fontStyle: 'bold' },
      ...Object.fromEntries([3, 4, 5, 7, 8, 9, 10, 11, 12, 13].map((i) => [i, { halign: 'center' as const }])),
      14: { halign: 'center', fontStyle: 'bold', cellWidth: 27 },
    },
    didParseCell: (d) => {
      if (d.section !== 'body') return
      if (d.column.index === 14) d.cell.styles.textColor = STATUS_COLORS[String(d.cell.raw)] || INK
      if (d.column.index === 6) {
        const v = parseInt(String(d.cell.raw), 10)
        d.cell.styles.textColor = v >= 75 ? [22, 163, 74] : v >= 50 ? [217, 119, 6] : [220, 38, 38]
      }
    },
    didDrawPage: () => {
      // Small logo on continuation pages, footer on every page
      if (doc.getNumberOfPages() > 1 && logo) {
        doc.addImage(logo, 'PNG', M, 6, 26, 26 * 228 / 1093)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY)
        doc.text(table.title, W - M, 10, { align: 'right' })
      }
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.line(M, H - 11, W - M, H - 11)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY)
      doc.text('Generated by Eklav AI  ·  www.eklav.in  ·  Confidential: for internal use only', M, H - 6.5)
    },
  })

  // Page numbers once the total is known
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY)
    doc.text(`Page ${p} of ${pages}`, W - M, H - 6.5, { align: 'right' })
  }

  doc.save(`${table.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'eklav-students'}.pdf`)
}

/* ── "Preparing your report" while the assistant works: a satellite gathering data around a globe ── */

const PREP_STEPS = [
  'Connecting to student records…',
  'Collecting scores from every module…',
  'Ranking and comparing students…',
  'Preparing your report…',
]

const ReportPreparing = ({ variant = 'chat' }: { variant?: 'chat' | 'panel' }) => {
  const [step, setStep] = useState(0)
  useEffect(() => {
    // Walk through the steps, then stay on the last one until the answer arrives
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PREP_STEPS.length - 1)), 1300)
    return () => clearInterval(t)
  }, [])
  return (
    <div className={variant === 'panel' ? 'eka-prep is-panel' : 'eka-bubble eka-prep'} role="status" aria-live="polite">
      <div className="eka-prep-visual" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id={`eka-globe-${variant}`} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffb15e" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#ff7a00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#120c06" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          {/* globe */}
          <circle cx="60" cy="60" r="24" fill={`url(#eka-globe-${variant})`} stroke="rgba(255,154,60,0.6)" />
          <ellipse cx="60" cy="60" rx="24" ry="9" fill="none" stroke="rgba(255,177,94,0.35)" />
          <ellipse cx="60" cy="60" rx="10" ry="24" fill="none" stroke="rgba(255,177,94,0.35)" />
          <line x1="36" y1="60" x2="84" y2="60" stroke="rgba(255,177,94,0.25)" />
          {/* orbit */}
          <ellipse cx="60" cy="60" rx="50" ry="20" fill="none" stroke="rgba(255,154,60,0.25)" strokeDasharray="3 4" transform="rotate(-20 60 60)" />
          {/* satellite travelling the orbit */}
          <g className="eka-prep-sat">
            <g transform="translate(110 60)">
              <rect x="-4" y="-3" width="8" height="6" rx="1.5" fill="#fff" />
              <rect x="-13" y="-2" width="8" height="4" fill="#ff9a3c" />
              <rect x="5" y="-2" width="8" height="4" fill="#ff9a3c" />
              <circle r="2" cx="0" cy="0" fill="#ff7a00" />
            </g>
          </g>
          {/* data pulses rising from the globe */}
          <circle className="eka-prep-ping" cx="60" cy="60" r="24" fill="none" stroke="#ff9a3c" />
          <circle className="eka-prep-ping is-late" cx="60" cy="60" r="24" fill="none" stroke="#ff9a3c" />
        </svg>
      </div>
      <div className="eka-prep-text">
        <b>Preparing your report</b>
        <ul>
          {PREP_STEPS.map((s, i) => (
            <li key={s} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
              <span>{i < step ? '✓' : i === step ? '' : ''}</span>{s}
            </li>
          ))}
        </ul>
        <div className="eka-prep-bar"><i style={{ width: `${((step + 1) / PREP_STEPS.length) * 92}%` }} /></div>
      </div>
    </div>
  )
}

/* ── Results: a compact card in the chat, the data itself in a side panel ── */

type SortKey = 'rank' | 'name' | 'branch' | 'overall' | 'timeSecs' | 'activeDays' | keyof Row
const STATUS_FILTERS: ('all' | Row['status'])[] = ['all', 'on-track', 'needs-attention', 'at-risk', 'not-started']

const summarize = (rows: Row[]) => {
  const started = rows.filter((r) => r.status !== 'not-started')
  return {
    avg: started.length ? Math.round(started.reduce((s, r) => s + r.overall, 0) / started.length) : 0,
    count: (s: Row['status']) => rows.filter((r) => r.status === s).length,
  }
}

const ResultChip = ({ table, active, onOpen }: { table: Table; active: boolean; onOpen: () => void }) => {
  const { avg, count } = summarize(table.rows)
  return (
    <button type="button" className={`eka-result${active ? ' is-active' : ''}`} onClick={onOpen}>
      <span className="eka-result-icon"><FaTable /></span>
      <span className="eka-result-text">
        <b>{table.title}</b>
        <small>{table.single || table.rows.length === 1
          ? `Student report · ${table.rows[0]?.overall ?? 0}% overall · ${STATUS_LABELS[table.rows[0]?.status || 'not-started']}`
          : `${table.rows.length} students · avg ${avg}% · ${count('at-risk')} at risk · ${PERIOD_LABELS[table.period] || 'All time'}`}</small>
      </span>
      <span className="eka-result-open">{active ? 'Showing' : 'View'} <FaChevronRight /></span>
    </button>
  )
}

/* One student's full report (shown instead of a table when the result is a single student) */
const MODULE_ROWS: [keyof Row, string][] = [
  ['engagement', 'Daily Engagement'], ['course', 'Course Progress'], ['interview', 'AI Interview'],
  ['english', 'English Practice'], ['assessment', 'Assessments'], ['code', 'Code Challenge'],
]
const StudentProfile = ({ row, onAsk }: { row: Row; onAsk: (text: string) => void }) => {
  const ring = row.status === 'not-started' ? '#3a3e43' : scoreHex(row.overall)
  const scored = MODULE_ROWS.map(([k, label]) => ({ k, label, v: Number(row[k]) || 0 }))
  const best = [...scored].sort((a, b) => b.v - a.v)[0]
  const weakest = [...scored].sort((a, b) => a.v - b.v)[0]
  const first = row.name.split(/\s+/)[0]
  return (
    <div className="eka-profile">
      <div className="eka-profile-head">
        <span className="eka-profile-avatar">{row.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
        <div className="eka-profile-who">
          <b>{row.name}</b>
          <small>{[row.rollNumber, row.branch, row.joiningYear && `Batch ${row.joiningYear}`, row.email].filter(Boolean).join(' · ')}</small>
          <span className={`eka-status is-${row.status}`}>{STATUS_LABELS[row.status]}</span>
        </div>
        <div className="eka-profile-ring" style={{ background: `conic-gradient(${ring} ${Math.min(100, row.overall) * 3.6}deg, #25282b 0deg)` }}>
          <span><b>{row.overall}%</b><small>Overall</small></span>
        </div>
      </div>

      <div className="eka-profile-stats">
        <div><small>Rank</small><b>#{row.rank}</b></div>
        <div><small>Time spent</small><b>{fmtTime(row.timeSecs)}</b></div>
        <div><small>Active days</small><b>{row.activeDays}</b></div>
        <div><small>Strongest</small><b className="is-good" title={best.label}>{best.v ? best.label : '—'}</b></div>
      </div>

      <div className="eka-profile-modules">
        <h4>Module scores</h4>
        {scored.map(({ k, label, v }) => (
          <div key={k} className="eka-profile-mod">
            <span>{label}</span>
            <div><i style={{ width: `${Math.min(100, v)}%`, background: scoreHex(v) }} /></div>
            <b style={{ color: v ? scoreHex(v) : '#6b7280' }}>{v}%</b>
          </div>
        ))}
      </div>

      {weakest && (
        <div className="eka-profile-note">
          {row.status === 'not-started'
            ? <>{first} hasn’t started on Eklav yet. A reminder to log in and begin with Daily Engagement would help.</>
            : <>Focus area: <b>{weakest.label}</b> ({weakest.v}%). {best.v > 0 && <>Strongest in <b>{best.label}</b> ({best.v}%).</>}</>}
        </div>
      )}

      <div className="eka-profile-actions">
        <button type="button" onClick={() => onAsk(`How can ${row.name} improve?`)}>How can {first} improve?</button>
        <button type="button" onClick={() => onAsk(`Compare ${row.name} with the ${row.branch || 'class'} average`)}>Compare with {row.branch || 'class'} average</button>
      </div>
    </div>
  )
}

const ResultsPanel = ({ tables, index, onIndex, onClose, onAsk, preparedFor }: {
  tables: Table[]; index: number; onIndex: (i: number) => void; onClose: () => void; onAsk: (text: string) => void; preparedFor: string
}) => {
  const table = tables[index]
  // A single student gets a profile instead of a one-row table
  const single = Boolean(table.single) || table.rows.length === 1
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Row['status']>('all')
  const [full, setFull] = useState(table.view === 'full')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 })
  const [wide, setWide] = useState(false)
  const [pdfState, setPdfState] = useState<'idle' | 'busy' | 'error'>('idle')

  // A different result resets the view
  useEffect(() => {
    setQuery(''); setStatus('all'); setFull(table.view === 'full'); setSort({ key: 'rank', dir: 1 })
  }, [table])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = table.rows.filter((r) => (status === 'all' || r.status === status)
      && (!q || [r.name, r.email, r.rollNumber, r.branch].some((v) => (v || '').toLowerCase().includes(q))))
    const { key, dir } = sort
    return [...list].sort((a, b) => {
      const x = (a as any)[key], y = (b as any)[key]
      return dir * (typeof x === 'string' ? x.localeCompare(y) : (x ?? 0) - (y ?? 0)) || a.rank - b.rank
    })
  }, [table, query, status, sort])

  const { avg, count } = summarize(table.rows)
  const view: Table = { ...table, view: full ? 'full' : 'summary', rows }
  const extra = !full && table.sortBy !== 'overall' && table.sortBy !== 'time_spent' ? table.sortBy as keyof Row : null
  const medals = sort.key === 'rank' && sort.dir === 1 && table.sortBy === 'overall' && !query && status === 'all'

  const th = (key: SortKey, label: string, num = false) => (
    <th className={`${num ? 'eka-num ' : ''}is-sortable${sort.key === key ? ' is-sorted' : ''}`}
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : (num ? -1 : 1) }))}>
      {label}{sort.key === key && <span className="eka-sort">{sort.dir === 1 ? '▲' : '▼'}</span>}
    </th>
  )
  const savePdf = () => {
    setPdfState('busy')
    downloadPdf(view, preparedFor).then(() => setPdfState('idle')).catch(() => setPdfState('error'))
  }

  return (
    <aside className={`eka-panel${wide ? ' is-wide' : ''}`} aria-label="Results">
      <div className="eka-panel-head">
        <div className="eka-panel-title">
          {tables.length > 1 && <small>Result {index + 1} of {tables.length}</small>}
          {tables.length > 1 ? (
            <select value={index} onChange={(e) => onIndex(Number(e.target.value))} aria-label="Choose a result">
              {tables.map((t, i) => <option key={i} value={i}>{t.title}</option>)}
            </select>
          ) : <b>{table.title}</b>}
          <span>{PERIOD_LABELS[table.period] || 'All time'} · {single ? 'student report' : `${table.rows.length} of ${table.total} students`}</span>
        </div>
        <div className="eka-panel-tools">
          <button type="button" className="eka-icon is-sm eka-hide-sm" onClick={() => setWide((w) => !w)} title={wide ? 'Narrow panel' : 'Widen panel'}>{wide ? <FaCompressAlt /> : <FaExpandAlt />}</button>
          <button type="button" className="eka-icon is-sm" onClick={onClose} title="Close results" aria-label="Close results"><FaTimes /></button>
        </div>
      </div>

      {single ? <StudentProfile row={table.rows[0]} onAsk={onAsk} /> : (<>
      <div className="eka-kpis">
        <div><small>Students</small><b>{table.rows.length}</b></div>
        <div><small>Average</small><b className="is-orange">{avg}%</b></div>
        <div><small>On track</small><b className="is-good">{count('on-track')}</b></div>
        <div><small>Attention</small><b className="is-mid">{count('needs-attention')}</b></div>
        <div><small>At risk</small><b className="is-low">{count('at-risk')}</b></div>
      </div>

      <div className="eka-panel-bar">
        <label className="eka-search"><FaSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, roll no, branch…" /></label>
        <div className="eka-seg" role="group" aria-label="Columns">
          <button type="button" className={!full ? 'is-on' : ''} onClick={() => setFull(false)}>Summary</button>
          <button type="button" className={full ? 'is-on' : ''} onClick={() => setFull(true)}>All sections</button>
        </div>
      </div>
      <div className="eka-filters">
        {STATUS_FILTERS.map((s) => {
          const n = s === 'all' ? table.rows.length : count(s)
          if (s !== 'all' && !n) return null
          return <button key={s} type="button" className={`is-${s}${status === s ? ' is-on' : ''}`} onClick={() => setStatus(s)}>{s === 'all' ? 'All' : STATUS_LABELS[s]} <em>{n}</em></button>
        })}
      </div>

      <div className="eka-panel-table">
        <table className={full ? 'is-full' : ''}>
          <thead>
            <tr>
              {th('rank', '#')}{th('name', 'Student')}{th('branch', 'Branch')}
              {extra && th(extra, COLUMN_LABELS[extra as string], true)}
              {th('overall', 'Overall', true)}
              {full && FULL_COLUMNS.map(([key, label]) => <Fragment key={key}>{th(key, label, true)}</Fragment>)}
              {(full || table.sortBy === 'time_spent') && th('timeSecs', 'Time', true)}
              {full && th('activeDays', 'Active days', true)}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} onClick={() => onAsk(`Give me the full report of ${r.name}${r.rollNumber ? ` (${r.rollNumber})` : ''}`)} title={`Ask Eklav about ${r.name}`}>
                <td>{medals && i < 3 && r.rank === i + 1 ? <span className={`eka-medal m${i + 1}`}>{i + 1}</span> : r.rank}</td>
                <td><span className="eka-name">{r.name}</span>{(r.rollNumber || r.email) && <small>{r.rollNumber || r.email}</small>}</td>
                <td>{r.branch || '—'}</td>
                {extra && <td className="eka-num">{extraValue(r, extra as string)}</td>}
                <td className={`eka-num eka-score ${r.status === 'not-started' ? 'is-none' : scoreClass(r.overall)}`}>{r.overall}%</td>
                {full && FULL_COLUMNS.map(([key]) => <td key={key} className={`eka-num eka-mod ${(r as any)[key] ? scoreClass((r as any)[key]) : 'is-none'}`}>{(r as any)[key] ?? 0}%</td>)}
                {(full || table.sortBy === 'time_spent') && <td className="eka-num">{fmtTime(r.timeSecs)}</td>}
                {full && <td className="eka-num">{r.activeDays}</td>}
                <td><span className={`eka-status is-${r.status}`}>{STATUS_LABELS[r.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="eka-panel-empty">No students match this search.</div>}
      </div>

      </>)}

      <div className="eka-panel-foot">
        <span>{single ? 'Download this student’s report as PDF or Excel' : `${rows.length === table.rows.length ? `${rows.length} students` : `${rows.length} of ${table.rows.length} shown`} · click a student to ask about them`}</span>
        <div>
          <button type="button" onClick={() => downloadCsv(view)} disabled={!rows.length}><FaFileExcel /> Excel</button>
          <button type="button" className="is-primary" onClick={savePdf} disabled={!rows.length || pdfState === 'busy'}>
            <FaFilePdf /> {pdfState === 'busy' ? 'Preparing…' : pdfState === 'error' ? 'Retry PDF' : 'Download PDF'}
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ── Exam draft: created only when the admin confirms ────────── */

const ExamCard = ({ draft, examPage, onDone }: { draft: ExamDraft; examPage: string; onDone: (text: string) => void }) => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [state, setState] = useState<'idle' | 'saving' | 'created' | 'error'>('idle')
  const [examId, setExamId] = useState('')
  const [error, setError] = useState('')

  const create = async () => {
    setState('saving')
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          rounds: draft.rounds.map(({ label: _label, ...round }) => round),
          branch: draft.branch,
          joiningYear: draft.joiningYear,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not create the exam.')
      setExamId(data.examId || data.exam?._id || '')
      setState('created')
      onDone(`Done! "${draft.title}" is created. Next, add questions for each round on the Assessments page.`)
    } catch (err: any) {
      setError(err?.message || 'Could not create the exam.')
      setState('error')
    }
  }

  return (
    <div className={`eka-card eka-exam${state === 'created' ? ' is-created' : ''}`}>
      <div className="eka-card-head">
        <b><FaClipboardCheck /> {draft.title}</b>
        <span>{state === 'created' ? 'Created' : 'Draft · review before creating'}</span>
      </div>
      <div className="eka-exam-meta">
        <span><em>Branches</em>{draft.branch.length ? draft.branch.join(', ') : 'All branches'}</span>
        <span><em>Batches</em>{draft.joiningYear.length ? draft.joiningYear.join(', ') : 'All batches'}</span>
        {draft.description && <span className="is-wide"><em>Description</em>{draft.description}</span>}
      </div>
      <div className="eka-exam-rounds">
        {draft.rounds.map((r) => (
          <div key={r.roundType} className="eka-exam-round">
            <b>{r.label}</b>
            <span>{r.pickCount} {r.pickCount === 1 ? 'question' : 'questions'} · {Math.round(r.timeSeconds / 60)} min · pass {r.passPercentage}%</span>
            <small>Opens {fmtWhen(r.startDateTime)} – {fmtClock(r.endDateTime)}</small>
          </div>
        ))}
      </div>
      {error && <div className="eka-exam-error">{error}</div>}
      <div className="eka-card-actions">
        {state === 'created' ? (
          <>
            <span className="eka-ok"><FaCheckCircle /> Exam created</span>
            <button type="button" className="is-primary" onClick={() => navigate(examId ? `${examPage}?exam=${examId}` : examPage)}>Add questions <FaArrowRight /></button>
          </>
        ) : (
          <>
            <button type="button" className="is-primary" onClick={create} disabled={state === 'saving'}>
              {state === 'saving' ? <span className="eka-spin" /> : <FaCheckCircle />} {state === 'saving' ? 'Creating…' : 'Create exam'}
            </button>
            <button type="button" onClick={() => navigate(examPage)}><FaPen /> Edit in form</button>
          </>
        )}
      </div>
    </div>
  )
}

const NavigateCard = ({ action }: { action: Extract<Action, { type: 'navigate' }> }) => {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate(action.url), 1200)
    return () => clearTimeout(t)
  }, [action.url, navigate])
  return (
    <div className="eka-card eka-nav">
      <span className="eka-spin" /> Opening <b>{action.label}</b>…
      <button type="button" onClick={() => navigate(action.url)}>Open now <FaArrowRight /></button>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────── */

// Voice is on unless the admin switched it off
const readVoicePref = () => { try { return localStorage.getItem('eklav.ai.voice') !== '0' } catch { return true } }
// After this many silent listens in a row the mic rests until the admin taps it (~1 minute)
const MAX_IDLE_LISTENS = 6
// How long the admin can pause mid-sentence before the question is sent
const SILENCE_MS = 2500
// "Bye", "you can stop", "I'll let you know"… ends the conversation: Eklav AI rests until it hears its name
const GOODBYE = /\b(bye|good\s?bye|see you|that'?s all|that is all|nothing else|no need|you can stop|stop listening|go to sleep|i'?ll let you know|i will let you know|talk (to you )?later)\b|^(ok(ay)?\W*)?(thanks|thank you)( so much| very much)?\W*$/i
// "Hi Eklav" as speech recognition tends to spell it (eklav, ek lav, aklav, eclav, ek love…)
const WAKE = /\b(?:(?:hi|hey|hello|ok|okay)\s+)?(?:[ea]\s?[kc]\s?-?\s?la+[vwbf]e?|ek\s?love)\b|\b(?:hi|hey|hello)\s+(?:equal|eclair|a\s?clove)\b|\bwake up\b/i
const isGoodbye = (t: string) => GOODBYE.test(t) && t.trim().split(/\s+/).length <= 18

const EklavAssistant = ({ apiBase }: { apiBase: string }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceMode, setVoiceMode] = useState(readVoicePref)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recRef = useRef<any>(null)
  const openRef = useRef(open)
  const voiceRef = useRef(voiceMode)
  const askRef = useRef<(text: string) => void>(() => {})
  const busyRef = useRef(false)
  const idleListensRef = useRef(0)
  const [profileName, setProfileName] = useState('')
  const [micBlocked, setMicBlocked] = useState(false)
  const [asleep, setAsleep] = useState(false)
  // Every student table in the conversation; the one open in the side panel
  const tables = useMemo(() => messages.flatMap((m) => (m.table?.rows.length ? [m.table] : [])), [messages])
  const [panelIndex, setPanelIndex] = useState<number | null>(null)
  const panelTable = panelIndex !== null ? tables[panelIndex] : undefined
  const panelOpenRef = useRef(false)
  panelOpenRef.current = !!panelTable
  const asleepRef = useRef(false)
  openRef.current = open
  voiceRef.current = voiceMode
  busyRef.current = busy
  asleepRef.current = asleep

  // The login token has no display name for admins, so use the profile (as the top bar does)
  const rawName = profileName || user?.fullName || user?.firstName || ''
  const firstName = /^(eklav\s*)?admin$/i.test(rawName.trim()) ? '' : rawName.trim().split(/\s+/)[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const SpeechRecognition = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null
  const canSpeak = typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined')
  // Replies are spoken with the server voice (the same natural voice as English Speaking Practice);
  // speakSeq drops audio that arrives after the admin has moved on
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speakSeq = useRef(0)
  const hushVoice = () => {
    speakSeq.current++
    window.speechSynthesis?.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
  }

  /* Voice in: spoken questions send themselves when the admin stops talking */
  const startListening = useCallback(() => {
    if (!SpeechRecognition || recRef.current) return
    hushVoice()
    setSpeaking(false)
    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'
    rec.interimResults = true
    // Keep listening through short pauses ("I need a … report"); we decide when the admin has finished
    rec.continuous = true
    let heard = ''
    let silence: ReturnType<typeof setTimeout> | undefined
    rec.onresult = (e: any) => {
      heard = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput(heard)
      clearTimeout(silence)
      if (heard.trim()) silence = setTimeout(() => rec.stop(), SILENCE_MS)
    }
    rec.onend = () => {
      clearTimeout(silence)
      recRef.current = null
      setListening(false)
      if (!openRef.current || rec.cancelled) return
      if (heard.trim()) {
        idleListensRef.current = 0
        askRef.current(heard)
      } else if (voiceRef.current && !busyRef.current) {
        if (++idleListensRef.current < MAX_IDLE_LISTENS) {
          setTimeout(() => { if (openRef.current && voiceRef.current && !busyRef.current) startListeningRef.current() }, 300)
        } else if (!micBlockedRef.current) {
          sleepRef.current() // nobody is talking: rest and wait for "Hi Eklav"
        }
      }
    }
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setMicBlocked(true)
        micBlockedRef.current = true
        idleListensRef.current = MAX_IDLE_LISTENS // don't keep retrying a blocked mic
      }
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
      setMicBlocked(false)
      micBlockedRef.current = false
    } catch {
      recRef.current = null
    }
  }, [SpeechRecognition])
  const startListeningRef = useRef(startListening)
  startListeningRef.current = startListening
  const micBlockedRef = useRef(false)

  /* Resting: the mic only waits for "Hi Eklav". Nothing else it hears is shown or sent. */
  const startWakeListening = useCallback(() => {
    if (!SpeechRecognition || recRef.current) return
    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'
    rec.interimResults = true
    rec.continuous = true
    rec.wake = true
    let rest = ''
    let woke = false
    let silence: ReturnType<typeof setTimeout> | undefined
    rec.onresult = (e: any) => {
      // only the latest phrase: older chatter must not count
      const latest = e.results[e.results.length - 1]?.[0]?.transcript || ''
      const m = latest.match(WAKE)
      if (!woke && !m) return
      if (m) { woke = true; rest = latest.slice((m.index || 0) + m[0].length).replace(/^[\s,.!?]+/, '') }
      else rest = latest
      clearTimeout(silence)
      silence = setTimeout(() => rec.stop(), rest.trim() ? SILENCE_MS : 900)
    }
    rec.onend = () => {
      clearTimeout(silence)
      if (recRef.current === rec) recRef.current = null
      if (!openRef.current || rec.cancelled || !asleepRef.current) return
      if (woke) wakeRef.current(rest)
      else setTimeout(() => { if (openRef.current && asleepRef.current && voiceRef.current) startWakeRef.current() }, 400)
    }
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setMicBlocked(true)
        micBlockedRef.current = true
        rec.cancelled = true
      }
    }
    recRef.current = rec
    try { rec.start() } catch { recRef.current = null }
  }, [SpeechRecognition])
  const startWakeRef = useRef(startWakeListening)
  startWakeRef.current = startWakeListening

  const sleepRef = useRef<() => void>(() => {})
  sleepRef.current = () => {
    setAsleep(true)
    asleepRef.current = true
    setListening(false)
    if (voiceRef.current) startWakeListening()
  }
  const wakeRef = useRef<(rest: string) => void>(() => {})

  const listenNow = () => {
    idleListensRef.current = 0
    if (asleepRef.current) { cancelRec(); setAsleep(false); asleepRef.current = false }
    startListening()
  }
  const cancelRec = () => {
    if (recRef.current) { recRef.current.cancelled = true; recRef.current.abort?.() }
    recRef.current = null
  }

  const stopListening = () => recRef.current?.stop()

  /* Voice out: read the reply, then listen again (hands-free) */
  const speak = useCallback((text: string) => {
    if (!canSpeak || !voiceRef.current || !text) return
    hushVoice()
    const seq = speakSeq.current
    const words = plain(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim().slice(0, 1800)
    // After speaking, listen again (or wait for "Hi Eklav" while resting)
    const done = () => {
      setSpeaking(false)
      if (voiceRef.current && openRef.current) setTimeout(asleepRef.current ? startWakeListening : startListening, 250)
    }

    // Fallback: the most natural voice this browser has (Neural / Natural / Google voices sound human)
    const browserVoice = () => {
      if (seq !== speakSeq.current) return
      if (!('speechSynthesis' in window)) { done(); return }
      const synth = window.speechSynthesis
      const u = new SpeechSynthesisUtterance(words)
      const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang))
      const natural = (v: SpeechSynthesisVoice) => /natural|neural|online/i.test(v.name)
      u.voice = voices.find((v) => natural(v) && /en-IN/i.test(v.lang))
        || voices.find((v) => natural(v) && /(aria|jenny|sonia|libby|neerja|emma|ava)/i.test(v.name))
        || voices.find(natural)
        || voices.find((v) => /Google UK English Female|Google US English/i.test(v.name))
        || voices.find((v) => v.lang === 'en-IN') || null
      u.rate = 0.98
      u.onstart = () => setSpeaking(true)
      u.onend = done
      u.onerror = () => setSpeaking(false)
      synth.speak(u)
    }

    setSpeaking(true)
    fetch(`${baseURL}/api/tts/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
      body: JSON.stringify({ text: words, gender: 'female' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (seq !== speakSeq.current) return // the admin interrupted
        if (!d?.audio) { browserVoice(); return }
        const audio = new Audio(d.audio)
        audioRef.current = audio
        audio.onended = () => { if (audioRef.current === audio) audioRef.current = null; done() }
        audio.onerror = () => { if (audioRef.current === audio) audioRef.current = null; browserVoice() }
        audio.play().catch(() => browserVoice())
      })
      .catch(() => browserVoice())
  }, [canSpeak, startListening, startWakeListening, baseURL, user?.token]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopVoice = () => {
    hushVoice()
    setSpeaking(false)
    if (recRef.current) {
      recRef.current.cancelled = true // aborting fires onend: don't send what was heard
      recRef.current.abort?.()
    }
    recRef.current = null
    setListening(false)
  }

  const toggleVoiceMode = () => {
    const next = !voiceMode
    setVoiceMode(next)
    try { localStorage.setItem('eklav.ai.voice', next ? '1' : '0') } catch { /* not persisted */ }
    if (next) listenNow()
    else stopVoice()
  }

  const close = () => {
    stopVoice()
    setAsleep(false)
    asleepRef.current = false
    setOpen(false)
  }

  useEffect(() => {
    if (!user?.token || profileName) return
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { if (p) setProfileName(p.fullName || p.name || '') })
      .catch(() => {})
  }, [user?.token, baseURL, profileName])

  // Eklav AI opens the conversation itself, like an assistant: "Hi Admin, need any help?" is shown and
  // spoken, then the mic opens for the admin's answer.
  const greet = () => {
    const who = firstName || 'Admin'
    idleListensRef.current = 0
    setAsleep(false)
    asleepRef.current = false
    setMessages([{ role: 'assistant', text: `${greeting}! Hi **${who}** 👋 How can I help you today?
Ask me about your students, say “create an exam”, or tell me which page to open.` }])
    if (voiceRef.current && canSpeak) speak(`Hi ${who}! How can I help you today?`)
    else if (voiceRef.current) startListening()
  }

  // Opening the assistant doesn't start talking: it waits quietly until the admin says "Hi Eklav"
  const newChat = () => {
    stopVoice()
    setMessages([])
    setPanelIndex(null)
    setInput('')
    idleListensRef.current = 0
    sleepRef.current()
  }

  useEffect(() => {
    if (!open) return
    idleListensRef.current = 0
    sleepRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.modal.show')) return
      if (panelOpenRef.current) setPanelIndex(null) // Esc closes the results first, then the assistant
      else close()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!messages.length) return // keep the welcome screen at the top
    requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }))
  }, [messages, busy])

  useEffect(() => () => {
    hushVoice()
    if (recRef.current) { recRef.current.cancelled = true; recRef.current.abort?.() }
  }, [])

  const ask = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    stopVoice()
    setAsleep(false)
    asleepRef.current = false
    // Goodbye: answer here, then rest until the admin says "Hi Eklav"
    if (isGoodbye(message)) {
      const who = firstName || 'Admin'
      setMessages((prev) => [...prev, { role: 'user', text: message }, { role: 'assistant', text: `Okay ${who}, I'll be right here. Just say **“Hi Eklav”** whenever you need me.` }])
      setInput('')
      setAsleep(true)
      asleepRef.current = true
      if (voiceRef.current && canSpeak) speak(`Okay ${who}. Just say Hi Eklav whenever you need me.`)
      else if (voiceRef.current) startWakeListening()
      return
    }
    // Tables travel with the history as a short note, and the latest one by id, so "these students" works
    const history = messages.filter((m) => !m.error).map((m) => ({
      role: m.role,
      text: m.table ? `${m.text}\n[Table shown: "${m.table.title}", ${m.table.rows.length} students]` : m.text,
    }))
    const shown = [...messages].reverse().find((m) => m.table?.rows.length)?.table
    const lastTable = shown ? { title: shown.title, ids: shown.rows.map((r) => r.id), names: shown.rows.map((r) => r.name) } : undefined
    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setBusy(true)
    try {
      const res = await fetch(`${baseURL}${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ message, history, lastTable, tzOffset: new Date().getTimezoneOffset() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'The assistant could not answer right now.')
      const reply = data.reply || 'Here is what I found.'
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, table: data.table, action: data.action }])
      // New data opens beside the conversation
      if (data.table?.rows?.length) setPanelIndex(tables.length)
      if (data.action?.type === 'clarify' && data.action.options?.length) {
        // read the choices out too, so the admin can answer by voice: "CSE, ECE, or All branches?"
        const opts: string[] = data.action.options
        const said = opts.filter((o) => !reply.toLowerCase().includes(o.toLowerCase()))
        speak(said.length ? `${reply} ${said.length > 1 ? `${said.slice(0, -1).join(', ')}, or ${said[said.length - 1]}` : said[0]}?` : reply)
      } else if (data.action?.type !== 'navigate') {
        // With a table on screen, read only the summary, never the list of students
        speak(data.table ? reply.split('\n').filter((l: string) => !/^\s*([-*•]|\d+[.)])\s+/.test(l)).join(' ') : reply)
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err?.message || 'Something went wrong. Please try again.', error: true }])
    } finally {
      setBusy(false)
    }
  }
  askRef.current = ask

  // "Hi Eklav" heard while resting: answer straight away if a question came with it, otherwise say yes and listen
  wakeRef.current = (rest: string) => {
    setAsleep(false)
    asleepRef.current = false
    idleListensRef.current = 0
    if (rest.trim().split(/\s+/).length >= 2) { ask(rest); return }
    if (!messages.length) { greet(); return }
    const who = firstName || 'Admin'
    setMessages((prev) => [...prev, { role: 'assistant', text: `Yes ${who}, I'm listening. How can I help?` }])
    if (canSpeak) speak(`Yes ${who}, how can I help?`)
    else startListening()
  }

  const addAssistantNote = (text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', text }])
    speak(text)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  const avatar = () => <span className="eka-avatar"><img src={eklavMark} alt="" /></span>
  const status = micBlocked
    ? 'Microphone is blocked: allow it in the browser address bar to talk'
    : speaking ? 'Speaking…' : asleep && voiceMode ? (messages.length ? 'Resting · say “Hi Eklav” to wake me' : 'Say “Hi Eklav” to start')
    : listening ? 'Listening… just speak' : busy ? 'Thinking…'
    : voiceMode && SpeechRecognition ? 'Tap the mic and talk to me' : 'Online · your intelligent campus assistant'

  return (
    <>
      {!open && (
        <button type="button" className="eka-launcher" onClick={() => setOpen(true)} aria-label="Open Eklav AI assistant">
          {avatar()}
          <span>Ask Eklav AI</span>
        </button>
      )}
      {/* Blurs the page behind the launcher while it is hovered (visual only, never blocks clicks) */}
      {!open && <div className="eka-launcher-dim" aria-hidden="true" />}

      {open && (
        <div className="eka-screen" role="dialog" aria-modal="true" aria-label="Eklav AI assistant">
          <div className="eka-top">
            <span className={`eka-avatar is-lg${listening || speaking ? ' is-live' : ''}`}><img src={eklavMark} alt="" /><i /></span>
            <div className="eka-top-text">
              <b>Eklav AI <span className="eka-spark">✦</span></b>
              <small className={listening || speaking ? 'is-live' : ''}>{status}</small>
            </div>
            <div className="eka-top-actions">
              {SpeechRecognition && canSpeak && (
                <button type="button" className={`eka-pill${voiceMode ? ' is-on' : ''}`} onClick={toggleVoiceMode} title="Talk hands-free: replies are read aloud and the mic reopens">
                  <FaHeadset /> <span>Voice mode {voiceMode ? 'on' : 'off'}</span>
                </button>
              )}
              {messages.length > 1 && (
                <button type="button" className="eka-pill" onClick={newChat} title="Start a new conversation">
                  <FaRedo /> <span>New chat</span>
                </button>
              )}
              <button type="button" className="eka-icon" onClick={close} aria-label="Close" title="Close (Esc)"><FaTimes /></button>
            </div>
          </div>

          <div className={`eka-split${panelTable || busy ? ' has-panel' : ''}`}>
          <div className="eka-main">
          <div className="eka-body" ref={bodyRef}>
            <div className="eka-column">
              {messages.length === 0 ? (
                // The assistant itself, not a menu: one presence that shows whether it is waiting, listening or talking
                <div className={`eka-welcome is-${listening ? 'listening' : speaking ? 'speaking' : busy ? 'thinking' : 'waiting'}`}>
                  <button type="button" className="eka-presence" onClick={listening ? stopListening : listenNow} aria-label={listening ? 'Stop listening' : 'Talk to Eklav AI'} title={listening ? 'Listening… tap to stop' : 'Tap and talk'}>
                    <i className="eka-ring r1" /><i className="eka-ring r2" /><i className="eka-ring r3" />
                    <span className="eka-presence-core"><img src={eklavMark} alt="" /></span>
                  </button>
                  <div className="eka-presence-state">
                    {listening ? <><span className="eka-wave"><i /><i /><i /><i /><i /></span> I'm listening…</>
                      : speaking ? <><span className="eka-wave"><i /><i /><i /><i /><i /></span> Speaking…</>
                      : busy ? 'Let me check that…'
                      : voiceMode && SpeechRecognition ? <span>Say <b className="eka-wake">“Hi Eklav”</b> to start</span> : 'Ready when you are'}
                  </div>
                  {listening && input.trim()
                    ? <p className="eka-heard">“{input}”</p>
                    : (
                      <>
                        <h2>{greeting}{firstName ? `, ${firstName}` : ''}.</h2>
                        <p>I'm your campus assistant. Just talk to me: ask about your students, set up an exam, or tell me where to go.</p>
                      </>
                    )}
                  <div className="eka-try">
                    <span>Try saying</span>
                    {['Top 10 performers', 'Who is at risk?', 'Create an exam for tomorrow'].map((ex) => (
                      <button key={ex} type="button" onClick={() => ask(ex)}>“{ex}”</button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    m.role === 'user' ? (
                      <div key={i} className="eka-row is-user"><div className="eka-bubble is-user">{m.text}</div></div>
                    ) : (
                      <div key={i} className="eka-row">
                        {avatar()}
                        <div className={`eka-bubble${m.error ? ' is-error' : ''}${m.table || m.action ? ' has-card' : ''}`}>
                          <RichText text={m.text} />
                          {m.table && m.table.rows.length > 0 && (() => {
                            const ti = tables.indexOf(m.table)
                            return <ResultChip table={m.table} active={panelIndex === ti} onOpen={() => setPanelIndex(ti)} />
                          })()}
                          {m.action?.type === 'create_exam' && <ExamCard draft={m.action.exam} examPage={m.action.examPage} onDone={addAssistantNote} />}
                          {m.action?.type === 'navigate' && i === messages.length - 1 && <NavigateCard action={m.action} />}
                          {m.action?.type === 'clarify' && m.action.options.length > 0 && (
                            <div className={`eka-options${i === messages.length - 1 ? '' : ' is-answered'}`}>
                              {m.action.options.map((o) => (
                                <button key={o} type="button" disabled={busy || i !== messages.length - 1} onClick={() => ask(o)}>{o}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}

                  {busy && (
                    <div className="eka-row">
                      {avatar()}
                      <div className="eka-bubble eka-typing eka-prep-mini"><span /><span /><span /> <em>Preparing your report…</em></div>
                      <div className="eka-prep-inline"><ReportPreparing /></div>
                    </div>
                  )}

                  {!busy && messages[messages.length - 1]?.action?.type !== 'clarify' && (
                    <div className="eka-chips">
                      {FOLLOW_UPS.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="eka-foot">
            <div className="eka-column">
              {(listening || speaking) && (
                <div className="eka-live">
                  <span className="eka-wave"><i /><i /><i /><i /><i /></span>
                  {listening ? 'Listening… pause when you’re done and I’ll send it.' : 'Eklav AI is speaking…'}
                  <button type="button" onClick={stopVoice}><FaVolumeMute /> Stop</button>
                </div>
              )}
              {asleep && !speaking && voiceMode && messages.length > 0 && (
                <div className="eka-live is-asleep">
                  <span className="eka-zz">z<sup>z</sup></span>
                  {messages.length ? 'I’m resting. Say “Hi Eklav” or tap the mic when you need me.' : 'Waiting for you. Say “Hi Eklav” to start, or type below.'}
                </div>
              )}
              <div className={`eka-input${listening ? ' is-listening' : ''}`}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  placeholder={listening ? 'Listening…' : 'Ask anything, or say “Create an exam for CSE tomorrow at 10 AM”…'}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                {SpeechRecognition && (
                  <button type="button" className={`eka-mic${listening ? ' is-on' : ''}`} onClick={listening ? stopListening : listenNow} aria-label={listening ? 'Stop listening' : 'Speak'} title={listening ? 'Stop' : 'Speak'}>
                    {listening ? <FaStop /> : <FaMicrophone />}
                  </button>
                )}
                <button type="button" className="eka-send" onClick={() => ask(input)} disabled={!input.trim() || busy} aria-label="Send"><FaPaperPlane /></button>
              </div>
              <small className="eka-hint">Enter to send · Shift + Enter for a new line · Esc to close. Nothing is changed until you confirm it.</small>
            </div>
          </div>
          </div>

          {busy && (
            <aside className="eka-panel eka-panel-prep" aria-label="Preparing report">
              <ReportPreparing variant="panel" />
            </aside>
          )}
          {panelTable && !busy && (
            <ResultsPanel tables={tables} index={panelIndex!} onIndex={setPanelIndex} onClose={() => setPanelIndex(null)}
              onAsk={(text) => { if (window.innerWidth <= 1100) setPanelIndex(null); ask(text) }} preparedFor={rawName.trim()} />
          )}
          </div>
        </div>
      )}

      <style>{`
        .eka-launcher { position: fixed; left: 50%; bottom: 22px; z-index: 1040; translate: -50% 0; display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 20px 0 6px; border: 1px solid rgba(255,122,0,0.45); border-radius: 999px; background: linear-gradient(135deg, #1a1208, #0e1012); color: #fff; font-size: 0.9rem; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.45); cursor: pointer; animation: eka-pulse 2.6s ease-out infinite; transition: transform .15s; }
        .eka-launcher:hover { transform: translateY(-3px); border-color: #ff7a00; box-shadow: 0 14px 36px rgba(255,122,0,0.28); }
        /* Bottom-centre so it is noticed, with an orange glow halo */
        .eka-launcher::before { content: ''; position: absolute; inset: -6px; z-index: -1; border-radius: inherit; background: radial-gradient(closest-side, rgba(255,122,0,0.28), rgba(255,122,0,0)); animation: eka-glow 2.4s ease-in-out infinite; pointer-events: none; }
        @keyframes eka-glow { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        .eka-launcher .eka-avatar { width: 40px; height: 40px; flex-basis: 40px; }
        .eka-launcher-dim { position: fixed; inset: 0; z-index: 1039; background: rgba(8,9,10,0.35); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); opacity: 0; pointer-events: none; transition: opacity .25s ease; }
        .eka-launcher:hover + .eka-launcher-dim, .eka-launcher:focus-visible + .eka-launcher-dim { opacity: 1; }
        @keyframes eka-pulse { 0% { box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 0 0 rgba(255,122,0,0.45); } 70%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 0 14px rgba(255,122,0,0); } }

        .eka-avatar { position: relative; display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border: 1px solid rgba(255,122,0,0.5); border-radius: 50%; background: radial-gradient(circle at 30% 25%, #2a1a0a, #0b0c0d); }
        .eka-avatar img { width: 62%; height: auto; }
        .eka-avatar.is-lg { width: 44px; height: 44px; flex-basis: 44px; }
        .eka-avatar.is-live { animation: eka-pulse 1.6s ease-out infinite; }
        .eka-avatar i { position: absolute; right: 0; bottom: 1px; width: 10px; height: 10px; border: 2px solid #0e1012; border-radius: 50%; background: #22c55e; }

        .eka-screen { position: fixed; inset: 0; z-index: 1050; display: flex; flex-direction: column; background: radial-gradient(70% 55% at 50% 0%, rgba(255,122,0,0.10), rgba(255,122,0,0) 70%), #08090a; color: #eceef0; animation: eka-in .2s ease-out; }
        @keyframes eka-in { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: none; } }
        .eka-column { width: 100%; max-width: 920px; margin: 0 auto; }
        .eka-screen button, .eka-launcher { font-family: inherit; }

        .eka-top { position: relative; left: auto; right: auto; width: auto; margin: 0; min-height: 0; display: flex; align-items: center; gap: 12px; padding: 12px 24px; border-bottom: 1px solid #1d2023; background: rgba(14,16,18,0.85); backdrop-filter: blur(8px); }
        .eka-top-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .eka-top-text b { color: #fff; font-size: 1.05rem; font-weight: 800; }
        .eka-top-text small { overflow: hidden; color: #8a9097; font-size: 0.76rem; text-overflow: ellipsis; white-space: nowrap; }
        .eka-top-text small.is-live { color: #ffb15e; }
        .eka-spark { color: #ff9a3c; font-size: 0.85rem; }
        .eka-top-actions { display: flex; align-items: center; gap: 8px; }
        .eka-pill { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: 1px solid #2a2d31; border-radius: 999px; background: #121417; color: #c9cdd2; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .eka-pill:hover { border-color: #3a3e43; color: #fff; }
        .eka-pill.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.12); color: #ffb15e; }
        .eka-icon { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #2a2d31; border-radius: 10px; background: #121417; color: #b8bdc3; cursor: pointer; }
        .eka-icon:hover { color: #fff; border-color: #3a3e43; }

        .eka-body { flex: 1; overflow-y: auto; padding: 28px 24px 12px; scrollbar-width: thin; scrollbar-color: #2a2d31 transparent; }
        .eka-body .eka-column { display: flex; flex-direction: column; gap: 16px; }

        .eka-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2vh 0 12px; }
        .eka-orb { display: grid; place-items: center; width: 96px; height: 96px; margin-bottom: 10px; padding: 0; cursor: pointer; border: 1px solid rgba(255,122,0,0.55); border-radius: 50%; background: radial-gradient(circle at 30% 25%, #3a220b, #0b0c0d 70%); box-shadow: 0 0 60px rgba(255,122,0,0.25); animation: eka-pulse 3s ease-out infinite; }
        .eka-orb img { width: 56%; }
        .eka-orb.is-listening { animation-duration: 1.1s; border-color: #ff9a3c; box-shadow: 0 0 80px rgba(255,122,0,0.45); }
        .eka-orb.is-speaking { animation-duration: 1.6s; }
        .eka-orb-label { margin-bottom: 16px; color: #7d838a; font-size: 0.76rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
        .eka-orb-label.is-on { color: #ffb15e; }
        .eka-wake { color: #ffb15e; }
        .eka-welcome h2 { margin: 0 0 10px; color: #fff; font-size: 2rem; font-weight: 800; letter-spacing: -0.01em; }
        .eka-welcome > p { max-width: 520px; margin: 0 0 34px; color: #9aa0a6; font-size: 1rem; line-height: 1.65; }
        .eka-welcome { min-height: calc(100vh - 260px); justify-content: center; }

        /* Presence: a glowing core with rings that breathe while waiting, ripple while listening, pulse while speaking */
        .eka-presence { position: relative; display: grid; place-items: center; width: 220px; height: 220px; margin: 0 0 18px; padding: 0; border: 0; background: none; cursor: pointer; }
        .eka-presence-core { position: relative; z-index: 2; display: grid; place-items: center; width: 116px; height: 116px; border-radius: 50%; border: 1px solid rgba(255,122,0,0.6); background: radial-gradient(circle at 32% 26%, #4a2a0c, #120c06 62%, #0b0c0d); box-shadow: 0 0 70px rgba(255,122,0,0.32), inset 0 0 30px rgba(255,122,0,0.18); transition: transform .3s, box-shadow .3s; }
        .eka-presence-core img { width: 54%; }
        .eka-presence:hover .eka-presence-core { transform: scale(1.04); }
        .eka-ring { position: absolute; inset: 0; margin: auto; width: 116px; height: 116px; border-radius: 50%; border: 1px solid rgba(255,122,0,0.35); pointer-events: none; animation: eka-breathe 4s ease-in-out infinite; }
        .eka-ring.r2 { animation-delay: .6s; } .eka-ring.r3 { animation-delay: 1.2s; }
        @keyframes eka-breathe { 0%, 100% { transform: scale(1.12); opacity: .35; } 50% { transform: scale(1.38); opacity: .12; } }
        @keyframes eka-ripple { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.9); opacity: 0; } }
        .is-listening .eka-ring { animation: eka-ripple 1.8s ease-out infinite; border-color: rgba(255,154,60,0.7); }
        .is-listening .eka-ring.r2 { animation-delay: .6s; } .is-listening .eka-ring.r3 { animation-delay: 1.2s; }
        .is-listening .eka-presence-core { box-shadow: 0 0 100px rgba(255,122,0,0.55), inset 0 0 34px rgba(255,122,0,0.3); border-color: #ff9a3c; }
        .is-speaking .eka-presence-core { animation: eka-talk 0.9s ease-in-out infinite; }
        @keyframes eka-talk { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
        .is-thinking .eka-ring { animation: eka-breathe 1.4s ease-in-out infinite; }
        .eka-presence-state { display: inline-flex; align-items: center; gap: 10px; min-height: 26px; margin-bottom: 18px; color: #8b9097; font-size: 0.92rem; font-weight: 600; }
        .is-listening .eka-presence-state, .is-speaking .eka-presence-state { color: #ffb15e; }
        .eka-heard { max-width: 640px; margin: 4px 0 34px; color: #fff; font-size: 1.5rem; font-weight: 600; line-height: 1.45; }
        .eka-try { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 6px; color: #5f656c; font-size: 0.86rem; }
        .eka-try span { margin-right: 4px; }
        .eka-try button { padding: 4px 6px; border: 0; background: none; color: #a3a9b0; font: inherit; cursor: pointer; transition: color .15s; }
        .eka-try button:hover { color: #ffb15e; }
        .eka-try button + button::before { content: '·'; margin-right: 10px; color: #3a3e43; }

        .eka-row { display: flex; align-items: flex-start; gap: 12px; }
        .eka-row.is-user { justify-content: flex-end; }
        .eka-bubble { min-width: 0; max-width: calc(100% - 46px); padding: 11px 15px; border: 1px solid #23262a; border-radius: 4px 16px 16px 16px; background: #121417; font-size: 0.9rem; line-height: 1.6; }
        .eka-bubble.has-card { flex: 1; }
        .eka-bubble p { margin: 0; }
        .eka-bubble p + p { margin-top: 6px; }
        .eka-bubble b { color: #fff; }
        .eka-bubble.is-user { max-width: 75%; border: 0; border-radius: 16px 4px 16px 16px; background: linear-gradient(135deg, #ff8a1f, #ff7a00); color: #fff; font-weight: 600; }
        .eka-bubble.is-error { border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.08); color: #fca5a5; }
        /* Preparing-report card: satellite orbiting a data globe, steps ticking off */
        .eka-prep { display: flex; align-items: center; gap: 16px; min-width: min(460px, 100%); padding: 14px 18px !important; }
        .eka-prep-visual { flex: 0 0 96px; height: 96px; }
        .eka-prep-visual svg { width: 100%; height: 100%; overflow: visible; }
        .eka-prep-sat { transform-origin: 60px 60px; animation: eka-orbit 2.6s linear infinite; }
        @keyframes eka-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .eka-prep-ping { transform-origin: 60px 60px; animation: eka-ping 1.8s ease-out infinite; }
        .eka-prep-ping.is-late { animation-delay: .9s; }
        @keyframes eka-ping { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.1); opacity: 0; } }
        .eka-prep-text { flex: 1; min-width: 0; }
        .eka-prep-text b { display: block; margin-bottom: 8px; color: #fff; font-size: 0.92rem; font-weight: 800; }
        .eka-prep-text ul { margin: 0 0 10px; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .eka-prep-text li { display: flex; align-items: center; gap: 8px; color: #5f656c; font-size: 0.8rem; transition: color .3s; }
        .eka-prep-text li span { display: grid; place-items: center; flex: 0 0 16px; height: 16px; border: 1px solid #2f3337; border-radius: 50%; font-size: 0.6rem; font-weight: 800; }
        .eka-prep-text li.is-done { color: #9aa0a6; }
        .eka-prep-text li.is-done span { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.15); color: #4ade80; }
        .eka-prep-text li.is-now { color: #ffb15e; font-weight: 700; }
        .eka-prep-text li.is-now span { border-color: #ff9a3c; border-top-color: transparent; animation: eka-spin .8s linear infinite; }
        @keyframes eka-spin { to { transform: rotate(360deg); } }
        .eka-prep-bar { height: 4px; border-radius: 99px; background: #23262a; overflow: hidden; }
        .eka-prep-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #c2410c, #ff9a3c); transition: width 1.1s ease; }
        /* Preparing animation in the results panel (where the report will appear) */
        .eka-panel-prep { display: flex; align-items: center; justify-content: center; padding: 32px; background: radial-gradient(60% 50% at 50% 40%, rgba(255,122,0,0.08), transparent 70%), #0c0e10; }
        .eka-prep.is-panel { flex-direction: column; text-align: center; gap: 22px; max-width: 420px; padding: 0; border: 0; background: none; }
        .eka-prep.is-panel .eka-prep-visual { flex: 0 0 auto; width: 220px; height: 220px; }
        .eka-prep.is-panel .eka-prep-text { width: 100%; }
        .eka-prep.is-panel .eka-prep-text b { font-size: 1.15rem; margin-bottom: 14px; }
        .eka-prep.is-panel .eka-prep-text ul { align-items: flex-start; gap: 9px; margin: 0 auto 16px; width: fit-content; text-align: left; }
        .eka-prep.is-panel .eka-prep-text li { font-size: 0.86rem; }
        .eka-prep-inline { display: none; }
        @media (max-width: 1100px) {
          .eka-panel-prep { display: none; }
          .eka-prep-mini { display: none !important; }
          .eka-prep-inline { display: block; }
        }
        /* Single-student report in the results panel */
        .eka-profile { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 4px 18px 16px; scrollbar-width: thin; }
        .eka-profile-head { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1px solid #1f2225; border-radius: 14px; background: linear-gradient(110deg, rgba(255,122,0,0.1), #111316 60%); }
        .eka-profile-avatar { display: grid; place-items: center; flex: 0 0 56px; height: 56px; border: 1px solid rgba(255,122,0,0.4); border-radius: 50%; background: #25201b; color: #ffb15e; font-size: 1.05rem; font-weight: 800; }
        .eka-profile-who { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .eka-profile-who b { color: #fff; font-size: 1.12rem; font-weight: 800; }
        .eka-profile-who small { color: #858b92; font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .eka-profile-ring { display: grid; place-items: center; flex: 0 0 88px; height: 88px; border-radius: 50%; }
        .eka-profile-ring > span { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 70px; height: 70px; border-radius: 50%; background: #111316; }
        .eka-profile-ring b { color: #fff; font-size: 1.1rem; font-weight: 800; line-height: 1; }
        .eka-profile-ring small { margin-top: 3px; color: #858b92; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
        .eka-profile-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .eka-profile-stats div { padding: 10px 12px; border: 1px solid #1f2225; border-radius: 10px; background: #111316; min-width: 0; }
        .eka-profile-stats small { display: block; color: #7d838a; font-size: 0.62rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
        .eka-profile-stats b { display: block; margin-top: 4px; overflow: hidden; color: #fff; font-size: 1rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
        .eka-profile-stats b.is-good { color: #4ade80; font-size: 0.86rem; }
        .eka-profile-modules { padding: 14px 16px; border: 1px solid #1f2225; border-radius: 14px; background: #0e1012; }
        .eka-profile-modules h4 { margin: 0 0 10px; color: #9aa0a6; font-size: 0.66rem; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
        .eka-profile-mod { display: grid; grid-template-columns: 150px 1fr 48px; align-items: center; gap: 12px; padding: 8px 0; }
        .eka-profile-mod + .eka-profile-mod { border-top: 1px solid #1a1d20; }
        .eka-profile-mod span { color: #d6d9dc; font-size: 0.8rem; font-weight: 600; }
        .eka-profile-mod > div { height: 8px; border-radius: 99px; background: #23262a; overflow: hidden; }
        .eka-profile-mod > div i { display: block; height: 100%; border-radius: inherit; transition: width .7s ease; }
        .eka-profile-mod b { font-size: 0.82rem; font-weight: 800; text-align: right; }
        .eka-profile-note { padding: 11px 14px; border: 1px solid rgba(255,122,0,0.28); border-radius: 12px; background: rgba(255,122,0,0.07); color: #d6d9dc; font-size: 0.82rem; line-height: 1.5; }
        .eka-profile-note b { color: #ffb15e; }
        .eka-profile-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .eka-profile-actions button { height: 34px; padding: 0 14px; border: 1px solid #2a2d31; border-radius: 999px; background: #121417; color: #c9cdd2; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
        .eka-profile-actions button:hover { border-color: rgba(255,122,0,0.55); color: #ffb15e; }
        @media (max-width: 640px) { .eka-profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .eka-profile-mod { grid-template-columns: 110px 1fr 42px; } }
        .eka-typing { display: inline-flex; align-items: center; gap: 4px; }
        .eka-typing span { width: 6px; height: 6px; border-radius: 50%; background: #ff9a3c; animation: eka-dot 1.1s infinite ease-in-out; }
        .eka-typing span:nth-child(2) { animation-delay: .15s; } .eka-typing span:nth-child(3) { animation-delay: .3s; }
        .eka-typing em { margin-left: 6px; color: #8a9097; font-style: normal; font-size: 0.8rem; }
        @keyframes eka-dot { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

        .eka-card { margin-top: 12px; overflow: hidden; border: 1px solid #25282b; border-radius: 12px; background: #0d0f11; }
        .eka-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding: 10px 12px; border-bottom: 1px solid #25282b; }
        .eka-card-head b { display: inline-flex; align-items: center; gap: 7px; font-size: 0.86rem; }
        .eka-card-head b svg { color: #ff9a3c; }
        .eka-card-head span { color: #7d838a; font-size: 0.72rem; }
        .eka-card-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 12px; border-top: 1px solid #25282b; }
        .eka-card-actions button { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border: 1px solid rgba(255,122,0,0.4); border-radius: 9px; background: rgba(255,122,0,0.08); color: #ffb15e; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
        .eka-card-actions button:hover { background: rgba(255,122,0,0.16); }
        .eka-card-actions button.is-primary { border-color: #ff7a00; background: #ff7a00; color: #fff; }
        .eka-card-actions button.is-primary:hover { filter: brightness(1.08); }
        .eka-card-actions button:disabled { opacity: .7; cursor: wait; }

        .eka-table-scroll { max-height: 380px; overflow: auto; }
        .eka-card table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .eka-card th { position: sticky; top: 0; padding: 8px 12px; background: #15171a; color: #7d838a; font-size: 0.68rem; font-weight: 700; letter-spacing: .04em; text-align: left; text-transform: uppercase; white-space: nowrap; }
        .eka-card td { padding: 8px 12px; border-top: 1px solid #1d2023; color: #d6d9dc; vertical-align: middle; }
        .eka-card td small { display: block; color: #7d838a; font-size: 0.7rem; }
        .eka-name { font-weight: 600; color: #f1f3f5; }
        .eka-card .eka-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .eka-score { font-weight: 800; }

        /* Split view: conversation on the left, results panel on the right */
        .eka-split { flex: 1; min-height: 0; display: flex; }
        .eka-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .eka-split.has-panel .eka-column { max-width: 760px; }
        .eka-panel { flex: 0 0 auto; width: clamp(520px, 52vw, 860px); display: flex; flex-direction: column; min-height: 0; border-left: 1px solid #1f2225; background: #0c0e10; animation: eka-panel-in .22s ease-out; transition: width .25s; }
        .eka-panel.is-wide { width: min(1240px, 74vw); }
        @keyframes eka-panel-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
        .eka-panel-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 12px; }
        .eka-panel-title { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .eka-panel-title small { color: #ff9a3c; font-size: 0.68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .eka-panel-title b { color: #fff; font-size: 1.08rem; font-weight: 800; }
        .eka-panel-title select { max-width: 100%; padding: 2px 26px 2px 0; border: 0; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23ff9a3c'/%3E%3C/svg%3E") no-repeat right 6px center; color: #fff; font: inherit; font-size: 1.08rem; font-weight: 800; appearance: none; cursor: pointer; outline: none; }
        .eka-panel-title select option { background: #121417; font-size: 0.9rem; }
        .eka-panel-title span { color: #7d838a; font-size: 0.76rem; }
        .eka-panel-tools { display: flex; gap: 6px; }
        .eka-icon.is-sm { width: 32px; height: 32px; }
        .eka-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; padding: 0 18px 12px; }
        .eka-kpis div { padding: 9px 11px; border: 1px solid #1f2225; border-radius: 10px; background: #111316; }
        .eka-kpis small { display: block; color: #7d838a; font-size: 0.64rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .eka-kpis b { color: #fff; font-size: 1.15rem; font-weight: 800; }
        .eka-kpis .is-orange { color: #ff9a3c; } .eka-kpis .is-good { color: #4ade80; } .eka-kpis .is-mid { color: #fbbf24; } .eka-kpis .is-low { color: #f87171; }
        .eka-panel-bar { display: flex; gap: 8px; padding: 0 18px 10px; }
        .eka-search { flex: 1; display: flex; align-items: center; gap: 8px; height: 36px; margin: 0; padding: 0 12px; border: 1px solid #25282c; border-radius: 9px; background: #0a0b0d; color: #6b7177; }
        .eka-search:focus-within { border-color: rgba(255,122,0,0.55); }
        .eka-search input { flex: 1; min-width: 0; border: 0; background: transparent; color: #eceef0; font: inherit; font-size: 0.84rem; outline: none; }
        .eka-seg { display: inline-flex; padding: 3px; border: 1px solid #25282c; border-radius: 9px; background: #0a0b0d; }
        .eka-seg button { height: 28px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent; color: #8b9097; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .eka-seg button.is-on { background: #1d2024; color: #ffb15e; }
        .eka-filters { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 18px 12px; }
        .eka-filters button { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border: 1px solid #25282c; border-radius: 999px; background: transparent; color: #9aa0a6; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
        .eka-filters button em { font-style: normal; color: #5f656c; }
        .eka-filters button.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.12); color: #ffb15e; }
        .eka-filters button.is-on em { color: inherit; }
        .eka-panel-table { flex: 1; min-height: 0; overflow: auto; margin: 0 18px; border: 1px solid #1f2225; border-radius: 12px; scrollbar-width: thin; scrollbar-color: #2a2d31 transparent; }
        .eka-panel-table table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .eka-panel-table table.is-full { min-width: 1040px; }
        .eka-panel-table th { position: sticky; top: 0; z-index: 1; padding: 9px 12px; background: #15171a; color: #7d838a; font-size: 0.66rem; font-weight: 700; letter-spacing: .04em; text-align: left; text-transform: uppercase; white-space: nowrap; }
        .eka-panel-table th.is-sortable { cursor: pointer; user-select: none; }
        .eka-panel-table th.is-sortable:hover, .eka-panel-table th.is-sorted { color: #ffb15e; }
        .eka-sort { margin-left: 4px; font-size: 0.55rem; }
        .eka-panel-table td { padding: 9px 12px; border-top: 1px solid #1a1d20; color: #d6d9dc; vertical-align: middle; white-space: nowrap; }
        .eka-panel-table td small { display: block; color: #7d838a; font-size: 0.7rem; }
        .eka-panel-table tbody tr { cursor: pointer; transition: background .12s; }
        .eka-panel-table tbody tr:hover { background: rgba(255,122,0,0.06); }
        .eka-panel-table .eka-num { text-align: right; font-variant-numeric: tabular-nums; }
        .eka-panel-empty { padding: 28px; color: #7d838a; text-align: center; font-size: 0.86rem; }
        .eka-panel-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 12px 18px 16px; }
        .eka-panel-foot > span { color: #6b7177; font-size: 0.74rem; }
        .eka-panel-foot > div { display: flex; gap: 8px; }
        .eka-panel-foot button { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 15px; border: 1px solid rgba(255,122,0,0.4); border-radius: 9px; background: rgba(255,122,0,0.08); color: #ffb15e; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
        .eka-panel-foot button.is-primary { border-color: #ff7a00; background: #ff7a00; color: #fff; }
        .eka-panel-foot button:disabled { opacity: .6; cursor: default; }

        /* Result card in the chat */
        .eka-result { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 520px; margin-top: 12px; padding: 11px 14px; border: 1px solid #2a2d31; border-radius: 12px; background: #0d0f11; color: inherit; text-align: left; cursor: pointer; transition: border-color .15s, background .15s; }
        .eka-result:hover, .eka-result.is-active { border-color: rgba(255,122,0,0.55); background: rgba(255,122,0,0.06); }
        .eka-result-icon { display: grid; place-items: center; flex: 0 0 36px; height: 36px; border-radius: 10px; background: rgba(255,122,0,0.12); color: #ff9a3c; }
        .eka-result-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .eka-result-text b { color: #fff; font-size: 0.88rem; }
        .eka-result-text small { color: #7d838a; font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .eka-result-open { display: inline-flex; align-items: center; gap: 5px; color: #ffb15e; font-size: 0.76rem; font-weight: 700; white-space: nowrap; }
        .eka-result-open svg { font-size: 0.6rem; }

        @media (max-width: 1100px) {
          .eka-panel, .eka-panel.is-wide { position: fixed; inset: 0; z-index: 3; width: auto; border-left: 0; }
          .eka-hide-sm { display: none !important; }
          .eka-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .eka-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .eka-options button { height: 36px; padding: 0 16px; border: 1px solid rgba(255,122,0,0.55); border-radius: 999px; background: rgba(255,122,0,0.1); color: #ffb15e; font: inherit; font-size: 0.84rem; font-weight: 700; cursor: pointer; transition: background .15s, transform .15s; }
        .eka-options button:hover:not(:disabled) { background: rgba(255,122,0,0.22); transform: translateY(-1px); }
        .eka-options.is-answered button { border-color: #2a2d31; background: transparent; color: #6b7280; cursor: default; }
        .eka-table-scroll table.is-full { min-width: 1080px; }
        .eka-table-scroll table.is-full th, .eka-table-scroll table.is-full td { white-space: nowrap; }
        .eka-mod { font-weight: 600; }
        .eka-mod.is-good { color: #4ade80; } .eka-mod.is-mid { color: #fbbf24; } .eka-mod.is-low { color: #f87171; } .eka-mod.is-none { color: #5b6067; }
        .eka-status { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: #1c1f22; color: #9aa0a6; }
        .eka-status.is-on-track { background: rgba(34,197,94,0.12); color: #4ade80; }
        .eka-status.is-needs-attention { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .eka-status.is-at-risk { background: rgba(239,68,68,0.12); color: #f87171; }
        .eka-score.is-good { color: #22c55e; } .eka-score.is-mid { color: #f59e0b; } .eka-score.is-low { color: #ef4444; } .eka-score.is-none { color: #6b7280; }
        .eka-medal { display: inline-grid; place-items: center; width: 21px; height: 21px; border-radius: 50%; color: #1a1206; font-size: 0.7rem; font-weight: 800; }
        .eka-medal.m1 { background: linear-gradient(135deg, #fde68a, #f59e0b); } .eka-medal.m2 { background: linear-gradient(135deg, #f1f5f9, #94a3b8); } .eka-medal.m3 { background: linear-gradient(135deg, #fed7aa, #c2410c); }

        .eka-exam.is-created { border-color: rgba(34,197,94,0.4); }
        .eka-exam-meta { display: flex; flex-wrap: wrap; gap: 8px 22px; padding: 10px 12px 0; }
        .eka-exam-meta span { display: flex; flex-direction: column; color: #e5e7eb; font-size: 0.82rem; font-weight: 600; }
        .eka-exam-meta span.is-wide { flex-basis: 100%; font-weight: 500; }
        .eka-exam-meta em { color: #7d838a; font-size: 0.68rem; font-style: normal; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
        .eka-exam-rounds { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; padding: 10px 12px 12px; }
        .eka-exam-round { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid #23262a; border-left: 3px solid #ff7a00; border-radius: 9px; background: #121417; }
        .eka-exam-round b { font-size: 0.84rem; }
        .eka-exam-round span { color: #c9cdd2; font-size: 0.76rem; }
        .eka-exam-round small { color: #8a9097; font-size: 0.72rem; }
        .eka-exam-error { margin: 0 12px 10px; padding: 8px 10px; border: 1px solid rgba(239,68,68,0.35); border-radius: 8px; background: rgba(239,68,68,0.08); color: #fca5a5; font-size: 0.78rem; }
        .eka-ok { display: inline-flex; align-items: center; gap: 6px; margin-right: auto; color: #22c55e; font-size: 0.82rem; font-weight: 700; }
        .eka-nav { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 0.84rem; }
        .eka-nav button { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border: 1px solid rgba(255,122,0,0.4); border-radius: 8px; background: rgba(255,122,0,0.08); color: #ffb15e; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
        .eka-spin { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,154,60,0.3); border-top-color: #ff9a3c; border-radius: 50%; animation: eka-rot .8s linear infinite; }
        .eka-card-actions .is-primary .eka-spin { border-color: rgba(255,255,255,0.35); border-top-color: #fff; }
        @keyframes eka-rot { to { transform: rotate(360deg); } }

        .eka-chips { display: flex; flex-wrap: wrap; gap: 8px; padding-left: 46px; }
        .eka-chips button { padding: 7px 13px; border: 1px solid #2a2d31; border-radius: 999px; background: #121417; color: #c9cdd2; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: border-color .15s, color .15s; }
        .eka-chips button:hover { border-color: rgba(255,122,0,0.55); color: #ffb15e; }

        .eka-foot { padding: 10px 24px 16px; border-top: 1px solid #1d2023; background: rgba(14,16,18,0.9); }
        .eka-live.is-asleep { color: #8b9097; }
        .eka-zz { display: inline-grid; place-items: center; width: 22px; height: 22px; border: 1px solid #2a2d31; border-radius: 50%; color: #ffb15e; font-size: 0.7rem; font-weight: 800; line-height: 1; }
        .eka-zz sup { font-size: 0.55rem; }
        .eka-live { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: #ffb15e; font-size: 0.82rem; font-weight: 600; }
        .eka-live button { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border: 1px solid #2a2d31; border-radius: 8px; background: #121417; color: #c9cdd2; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
        .eka-wave { display: inline-flex; align-items: center; gap: 3px; height: 18px; }
        .eka-wave i { width: 3px; height: 100%; border-radius: 2px; background: #ff9a3c; animation: eka-wave 1s ease-in-out infinite; }
        .eka-wave i:nth-child(2) { animation-delay: .1s; } .eka-wave i:nth-child(3) { animation-delay: .2s; } .eka-wave i:nth-child(4) { animation-delay: .3s; } .eka-wave i:nth-child(5) { animation-delay: .4s; }
        @keyframes eka-wave { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
        .eka-input { display: flex; align-items: flex-end; gap: 8px; padding: 7px 7px 7px 16px; border: 1px solid #2a2d31; border-radius: 16px; background: #121417; transition: border-color .15s, box-shadow .15s; }
        .eka-input:focus-within, .eka-input.is-listening { border-color: rgba(255,122,0,0.6); box-shadow: 0 0 0 4px rgba(255,122,0,0.08); }
        .eka-input textarea { flex: 1; min-height: 40px; max-height: 140px; padding: 9px 0; border: 0; outline: none; resize: none; background: transparent; color: #fff; font-family: inherit; font-size: 0.92rem; line-height: 1.45; field-sizing: content; }
        .eka-input textarea::placeholder { color: #6b7177; }
        .eka-mic, .eka-send { display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 42px; border: 0; border-radius: 12px; cursor: pointer; }
        .eka-mic { background: #1b1e21; color: #d6d9dc; }
        .eka-mic:hover { color: #ffb15e; }
        .eka-mic.is-on { background: #ef4444; color: #fff; animation: eka-pulse 1.6s ease-out infinite; }
        .eka-send { background: #ff7a00; color: #fff; }
        .eka-send:disabled { background: #22252a; color: #5f656b; cursor: not-allowed; }
        .eka-hint { display: block; margin-top: 8px; color: #5a6066; font-size: 0.7rem; text-align: center; }

        @media (max-width: 860px) {
          .eka-presence { width: 170px; height: 170px; }
          .eka-presence-core, .eka-ring { width: 96px; height: 96px; }
          .eka-heard { font-size: 1.2rem; }
          .eka-pill span { display: none; }
          .eka-pill { width: 36px; padding: 0; justify-content: center; }
        }
        @media (max-width: 575.98px) {
          .eka-launcher { bottom: 14px; padding: 0 6px; }
          .eka-launcher > span:last-child { display: none; }
          .eka-top, .eka-body, .eka-foot { padding-left: 14px; padding-right: 14px; }
          .eka-welcome h2 { font-size: 1.4rem; }
          .eka-chips { padding-left: 0; }
          .eka-bubble.is-user { max-width: 88%; }
          .eka-hint { display: none; }
        }
      `}</style>
    </>
  )
}

export default EklavAssistant
