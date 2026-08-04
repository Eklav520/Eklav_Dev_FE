import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  FaFileAlt, FaBookOpen, FaMicrophone, FaPuzzlePiece, FaImage, FaInfoCircle, FaArrowRight,
  FaCheckCircle, FaHourglassHalf, FaChartLine, FaSearch, FaChevronDown, FaChevronUp, FaDownload,
  FaStar, FaRegStar, FaTrophy, FaExclamationTriangle, FaClock, FaTimes, FaStop, FaPlay,
  FaGraduationCap,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { PATTERN_SECTIONS } from '../sectionsConfig'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'
const ORANGE = '#ff7a00'

// `count` here is only a fallback shown while the real counts (below) are
// still loading — the real badge value is however many questions the admin
// has actually configured to be RANDOMLY SHOWN per attempt (LSRWRoundSettings),
// not the size of the full question bank. `key` matches sectionsConfig.ts's
// PATTERN_SECTIONS keys, used to look that real count up per section.
const PATTERNS: {
  key: 1 | 2
  label: string
  sections: { letter: string; key: string; label: string; icon: any; color: string; bg: string; count: number }[]
}[] = [
  {
    key: 1,
    label: 'Pattern 1',
    sections: [
      { letter: 'A', key: 'listeningReading', label: 'Reading & Listening', icon: FaBookOpen,     color: '#2563eb', bg: '#eff6ff', count: 23 },
      { letter: 'B', key: 'speaking',          label: 'Speaking',              icon: FaMicrophone,  color: '#7c3aed', bg: '#f5f3ff', count: 4 },
      { letter: 'C', key: 'grammar',           label: 'Grammar',                icon: FaPuzzlePiece, color: '#16a34a', bg: '#f0fdf4', count: 34 },
      { letter: 'D', key: 'passages',          label: 'Passages',                icon: FaFileAlt,     color: '#ea580c', bg: '#fff7ed', count: 16 },
    ],
  },
  {
    key: 2,
    label: 'Pattern 2',
    sections: [
      { letter: 'A', key: 'listeningReading', label: 'Reading & Listening', icon: FaBookOpen,    color: '#2563eb', bg: '#eff6ff', count: 24 },
      { letter: 'B', key: 'jumbled',           label: 'Jumbled Sentences',    icon: FaPuzzlePiece, color: '#16a34a', bg: '#f0fdf4', count: 10 },
      { letter: 'C', key: 'grammar',           label: 'Grammar',              icon: FaFileAlt,     color: '#ea580c', bg: '#fff7ed', count: 24 },
      { letter: 'D', key: 'storytelling',      label: 'Story Telling',        icon: FaImage,       color: '#db2777', bg: '#fdf2f8', count: 2 },
    ],
  },
]

type SectionResult = { sectionKey: string; label: string; marks: number; scoreAwarded: number | null; status: 'pending' | 'attempted' | 'graded'; submissionId?: string | null }
type SubmissionMistake = { expected: string; said: string; type: 'substitution' | 'missing' | 'extra' }
type AlignmentToken = { type: 'match' | 'substitution' | 'missing' | 'extra'; word?: string; expected?: string; said?: string }
// `points` is the current shape; `feedback` is kept optional to still render
// older submissions saved before this was split into bullet points.
type AccentReview = { score: number; points?: string[]; feedback?: string }
type SubmissionItem = {
  itemId: string; type: 'reading' | 'listening'; expectedSentence: string; transcript: string
  marks: number; scoreAwarded: number; accuracyPercent: number; mistakes: SubmissionMistake[]; alignment?: AlignmentToken[]; audioUrl?: string | null; recordedSeconds: number
  pronunciationFeedback?: string
  // AI reading of the expected sentence, for side-by-side comparison with the
  // student's own recording — the item's real reference audio for listening
  // questions, or a cached TTS reading for reading questions.
  aiAudioUrl?: string | null
  // GPT-4o audio-based judgement of the student's actual pronunciation,
  // stress and intonation (rise/fall) from the recording itself — separate
  // from the plain word-accuracy diff above.
  accentReview?: AccentReview | null
}
type SubmissionDetail = {
  _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number
  items: SubmissionItem[]
}
type SpeakingSubmissionItem = { itemId: string; topic: string; transcript: string; marks: number; scoreAwarded: number; feedback: string; mistakes?: string[]; sampleAnswer?: string; sampleAnswerAudioUrl?: string | null; recordedSeconds: number }
type SpeakingSubmissionDetail = { _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number; items: SpeakingSubmissionItem[] }
type GrammarSubmissionItem = { itemId: string; category: string; type: 'mcq' | 'fill'; question: string; options: string[]; correctAnswer: string; studentAnswer: string; isCorrect: boolean; marks: number; scoreAwarded: number }
type GrammarSubmissionDetail = { _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number; items: GrammarSubmissionItem[] }
type PassageSubmissionItem = { passageId: string; questionIndex: number; question: string; options: string[]; correctAnswer: string; studentAnswer: string; isCorrect: boolean; marks: number; scoreAwarded: number }
type PassageSubmissionDetail = { _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number; items: PassageSubmissionItem[] }
type JumbledSubmissionItem = { itemId: string; correctOrder: string[]; studentOrder: string[]; isCorrect: boolean; marks: number; scoreAwarded: number }
type JumbledSubmissionDetail = { _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number; items: JumbledSubmissionItem[] }
type StoryTellingSubmissionItem = { itemId: string; promptType: 'image' | 'text'; promptText: string; points: string[]; story: string; marks: number; scoreAwarded: number; feedback: string }
type StoryTellingSubmissionDetail = { _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number; items: StoryTellingSubmissionItem[] }
type Attempt = {
  _id: string; patternKey: 1 | 2; sections: SectionResult[]
  totalMarks: number; totalScoreAwarded: number; status: 'in_progress' | 'completed'
  createdAt: string; startedAt: string; completedAt: string | null
}

const pctColor = (pct: number) => pct >= 80 ? '#16a34a' : pct >= 60 ? '#ea580c' : '#dc2626'
const overallLabel = (pct: number) =>
  pct >= 90 ? 'Excellent' : pct >= 75 ? 'Very Good' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs Improvement'

// Accent/pronunciation feedback quotes the specific words being discussed in
// 'single' or "double" quotes — highlight those inline so the exact word a
// student should focus on jumps out instead of blending into the sentence.
const highlightQuotedWords = (text: string) => {
  const parts = text.split(/('[^']+'|"[^"]+")/g)
  return parts.map((part, i) => {
    const quoted = /^['"][^'"]+['"]$/.test(part)
    return quoted
      ? <span key={i} style={{ fontWeight: 700, color: '#4c1d95', background: '#e9d5ff', borderRadius: 4, padding: '0 4px' }}>{part}</span>
      : <span key={i}>{part}</span>
  })
}

// Graded % is computed only over sections that have real grading so far
// (gradedMarks/gradedScore), not the attempt's full total — otherwise
// sections with no grading yet (pending: true "auto-grade coming later")
// would silently drag the percentage down and mislead the student.
//
// `accentBlend` (submissionId -> blended 0-100 %, see the fetch effect in the
// component) lets Listening & Reading sections fold in the accent/intonation
// score (70% word-accuracy + 30% accent) for DISPLAY purposes only — the
// underlying scoreAwarded/marks stored on the attempt are never touched, so
// this only changes what percentage is shown, not any real recorded grade.
const gradedPct = (a: Attempt, accentBlend?: Record<string, number>) => {
  const graded = a.sections.filter((s) => s.status === 'graded')
  const gradedMarks = graded.reduce((sum, s) => sum + s.marks, 0)
  const gradedScore = graded.reduce((sum, s) => {
    if (s.sectionKey === 'listeningReading' && s.submissionId && accentBlend?.[s.submissionId] !== undefined) {
      return sum + (accentBlend[s.submissionId] / 100) * s.marks
    }
    return sum + (s.scoreAwarded || 0)
  }, 0)
  return gradedMarks > 0 ? Math.round((gradedScore / gradedMarks) * 100) : 0
}

const formatDuration = (a: Attempt) => {
  if (!a.completedAt) return 'In Progress'
  const mins = Math.round((new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 60000)
  return mins < 1 ? '< 1 min' : `${mins} min`
}

const BRAND_ORANGE: [number, number, number] = [255, 122, 0]
const BRAND_DARK: [number, number, number] = [15, 23, 42]
const BRAND_GRAY: [number, number, number] = [100, 116, 139]

const downloadReport = (a: Attempt, student?: { name?: string; email?: string }, accentBlend?: Record<string, number>) => {
  const graded = a.sections.filter((s) => s.status === 'graded')
  const gradedMarks = graded.reduce((sum, s) => sum + s.marks, 0)
  const gradedScore = graded.reduce((sum, s) => sum + (s.scoreAwarded || 0), 0)
  const pct = gradedPct(a, accentBlend)
  const sectionPct = (s: SectionResult) =>
    s.sectionKey === 'listeningReading' && s.submissionId && accentBlend?.[s.submissionId] !== undefined
      ? accentBlend[s.submissionId]
      : Math.round((s.scoreAwarded! / s.marks) * 100)

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header band ──
  doc.setFillColor(...BRAND_ORANGE)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('LSRW Communication Round', 14, 13)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pattern ${a.patternKey} — Performance Report`, 14, 21)

  // ── Student / attempt meta ──
  let y = 38
  doc.setTextColor(...BRAND_DARK)
  doc.setFontSize(10)
  const metaRows: [string, string][] = [
    ...(student?.name ? [['Student', student.name] as [string, string]] : []),
    ...(student?.email ? [['Email', student.email] as [string, string]] : []),
    ['Date', new Date(a.createdAt).toLocaleString()],
    ['Status', a.status === 'completed' ? 'Completed' : 'In Progress'],
    ['Time Taken', formatDuration(a)],
  ]
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 45, y)
    y += 6
  })

  // ── Overall score summary card ──
  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND_GRAY)
  doc.text('GRADED TOTAL', 20, y + 8)
  doc.setFontSize(15)
  const scoreColor: [number, number, number] = pct >= 80 ? [22, 163, 74] : pct >= 60 ? [234, 88, 12] : [220, 38, 38]
  doc.setTextColor(...scoreColor)
  doc.text(`${gradedScore}/${gradedMarks}  (${pct}%)`, 20, y + 17)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...BRAND_DARK)
  doc.text(overallLabel(pct), pageWidth - 20, y + 13, { align: 'right' })
  y += 32

  // ── Section-wise table ──
  autoTable(doc, {
    startY: y,
    head: [['Section', 'Score', 'Percentage', 'Status']],
    body: a.sections.map((s) => [
      s.label,
      s.status === 'graded' ? `${s.scoreAwarded}/${s.marks}` : '—',
      s.status === 'graded' ? `${sectionPct(s)}%` : '—',
      s.status === 'graded' ? 'Graded' : s.status === 'attempted' ? 'Pending grading' : 'Not attempted',
    ]),
    styles: { fontSize: 9.5, cellPadding: 4 },
    headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = String(data.cell.raw)
        data.cell.styles.textColor = v === 'Graded' ? [22, 163, 74] : v === 'Pending grading' ? [234, 88, 12] : [148, 163, 184]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ── Footer ──
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40
  doc.setFontSize(8)
  doc.setTextColor(...BRAND_GRAY)
  doc.text(`Generated on ${new Date().toLocaleString()} — Eklav LSRW Communication Assessment`, 14, finalY + 12)

  doc.save(`lsrw-pattern${a.patternKey}-${new Date(a.createdAt).toISOString().slice(0, 10)}.pdf`)
}

// Unique section keys across both patterns, in first-seen order, for the
// strengths/weaknesses breakdown below.
const ALL_SECTION_DEFS = [...PATTERN_SECTIONS[1], ...PATTERN_SECTIONS[2]].filter(
  (s, idx, arr) => arr.findIndex((x) => x.key === s.key) === idx
)

type Props = { onSelect: (pattern: 1 | 2) => void; onPracticeSection: (sectionKey: string) => void }

const PatternSelectionScreen = ({ onSelect, onPracticeSection }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Real "questions shown per attempt" counts per section, from
  // LSRWRoundSettings via each section's own student-facing endpoint — the
  // same random-subset size the student will actually get, not the total
  // bank size.
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!user?.token) return
    const headers = { Authorization: `Bearer ${user.token}` }
    const endpoints: { key: string; url: string; extract: (d: any) => number }[] = [
      { key: 'listeningReading', url: '/api/student/lsrw-content', extract: (d) => (d.readingCount ?? 0) + (d.listeningCount ?? 0) },
      { key: 'speaking', url: '/api/student/lsrw-speaking-content', extract: (d) => d.speakingCount ?? 0 },
      { key: 'grammar', url: '/api/student/lsrw-grammar-content', extract: (d) => d.grammarCount ?? 0 },
      { key: 'jumbled', url: '/api/student/lsrw-jumbled-content', extract: (d) => d.jumbledCount ?? 0 },
      { key: 'storytelling', url: '/api/student/lsrw-storytelling-content', extract: (d) => d.storyCount ?? 0 },
      { key: 'passages', url: '/api/student/lsrw-passage-content', extract: (d) => d.passageCount ?? 0 },
    ]
    Promise.all(endpoints.map((e) =>
      fetch(`${baseURL}${e.url}`, { headers })
        .then((r) => r.json())
        .then((d) => ({ key: e.key, count: d.success ? e.extract(d) : null }))
        .catch(() => ({ key: e.key, count: null }))
    )).then((results) => {
      const map: Record<string, number> = {}
      results.forEach((r) => { if (r.count !== null) map[r.key] = r.count })
      setSectionCounts(map)
    })
  }, [user?.token, baseURL])

  // Real per-Pattern exam attempts — one attempt = one full sequential run
  // through a Pattern's sections. Drives the history table, performance
  // graph, and per-section strengths/weaknesses below.
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(true)
  useEffect(() => {
    if (!user?.token) return
    setLoadingAttempts(true)
    fetch(`${baseURL}/api/student/lsrw-pattern/my-attempts`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setAttempts(data.attempts) })
      .catch(() => {})
      .finally(() => setLoadingAttempts(false))
  }, [user?.token, baseURL])

  // Listening & Reading's displayed percentage blends in the accent/intonation
  // score (70% word-accuracy + 30% accent, same weighting as the per-question
  // badge in the mistake breakdown) — but that needs each submission's full
  // item list, which the attempt-history endpoint doesn't return. Fetch it
  // once per graded Listening & Reading submissionId and cache the blended %
  // here; every percentage shown for that section (table cell, section-wise
  // performance bar, PDF report) reads from this cache. The underlying
  // scoreAwarded/marks stored on the attempt are never modified — this only
  // changes what percentage is displayed.
  const [accentBlend, setAccentBlend] = useState<Record<string, number>>({})
  const accentBlendFetchedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!user?.token) return
    attempts.forEach((a) => a.sections.forEach((s) => {
      if (s.sectionKey !== 'listeningReading' || s.status !== 'graded' || !s.submissionId) return
      if (accentBlendFetchedRef.current.has(s.submissionId)) return
      accentBlendFetchedRef.current.add(s.submissionId)
      fetch(`${baseURL}/api/student/lsrw-content/submissions/${s.submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) return
          const items: SubmissionItem[] = data.submission.items || []
          const totalMarks = items.reduce((sum, it) => sum + it.marks, 0)
          if (totalMarks === 0) return
          const blendedScore = items.reduce((sum, it) => {
            const combinedPct = it.accentReview ? it.accuracyPercent * 0.7 + it.accentReview.score * 0.3 : it.accuracyPercent
            return sum + (combinedPct / 100) * it.marks
          }, 0)
          setAccentBlend((prev) => ({ ...prev, [s.submissionId!]: Math.round((blendedScore / totalMarks) * 100) }))
        })
        .catch(() => {})
    }))
  }, [attempts, user?.token, baseURL])

  const chronological = useMemo(() => [...attempts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [attempts])

  // Month-scaffold performance graph — always plots every day of the chosen
  // month (not just days with an attempt) so the line/axis fills the full
  // card width instead of collapsing to a single centered point when there
  // are few attempts. A day with multiple attempts is averaged.
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    attempts.forEach((a) => set.add(monthKey(new Date(a.createdAt))))
    set.add(monthKey(new Date()))
    return Array.from(set).sort().reverse()
  }, [attempts])

  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()))

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  // One line per section (matching "Where You Stand"'s 6 sections/colors) —
  // each day bucket only averages that section's GRADED results, so an
  // ungraded/absent section on a given day is a gap (null), not a fabricated 0.
  const monthChart = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const sectionDayBuckets: Record<string, Record<number, number[]>> = {}
    ALL_SECTION_DEFS.forEach((def) => { sectionDayBuckets[def.key] = {} })

    let hasAnyAttemptThisMonth = false
    chronological.forEach((a) => {
      const d = new Date(a.createdAt)
      if (monthKey(d) !== selectedMonth) return
      hasAnyAttemptThisMonth = true
      const day = d.getDate()
      a.sections.forEach((s) => {
        if (s.status !== 'graded' || s.scoreAwarded === null || !sectionDayBuckets[s.sectionKey]) return
        const pct = Math.round((s.scoreAwarded / s.marks) * 100)
        ;(sectionDayBuckets[s.sectionKey][day] ??= []).push(pct)
      })
    })

    const categories: string[] = []
    for (let day = 1; day <= daysInMonth; day++) categories.push(String(day))

    const sectionSeries = ALL_SECTION_DEFS.map((def) => ({
      def,
      data: categories.map((_, idx) => {
        const vals = sectionDayBuckets[def.key][idx + 1]
        return vals ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
      }),
    }))

    return { categories, sectionSeries, hasAnyAttemptThisMonth }
  }, [chronological, selectedMonth])

  const chartSeries = useMemo(() => monthChart.sectionSeries.map((s) => ({
    name: s.def.label,
    data: s.data,
  })), [monthChart])

  const chartOptions = useMemo(() => ({
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    // connectNulls draws the line straight through days with no attempt
    // (they'd otherwise be gaps, which is why a section with only sparse
    // attempts this month showed as isolated dots instead of a line) — each
    // series still keeps its own section color from `colors` below.
    stroke: { curve: 'smooth' as const, width: 2.5, connectNulls: true },
    colors: monthChart.sectionSeries.map((s) => s.def.color),
    markers: { size: 4, strokeColors: '#fff', strokeWidth: 2 },
    legend: { show: true, fontSize: '11px', position: 'bottom' as const, itemMargin: { horizontal: 8, vertical: 4 } },
    xaxis: {
      categories: monthChart.categories,
      title: { text: `Day of month — ${monthLabel(selectedMonth)}`, style: { fontSize: '11px', color: PAGE_GRAY } },
      labels: { style: { fontSize: '10px' }, rotate: 0 },
      tickAmount: Math.max(1, Math.min(monthChart.categories.length - 1, 15)),
      axisBorder: { show: true, color: PAGE_BORDER },
      axisTicks: { show: true, color: PAGE_BORDER },
    },
    yaxis: {
      min: 0, max: 100,
      labels: { formatter: (v: number) => `${v}%` },
      axisBorder: { show: true, color: PAGE_BORDER, offsetX: -1 },
      axisTicks: { show: true, color: PAGE_BORDER, width: 6 },
    },
    grid: { strokeDashArray: 4, padding: { top: 0, left: 5 } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v}%` } },
  }), [monthChart, selectedMonth])

  // Per-section strengths/weaknesses across every attempt (any pattern) —
  // only sections with at least one "graded" result contribute; ungraded
  // sections are shown honestly as "Not graded yet" rather than a fabricated verdict.
  const sectionPerformance = useMemo(() => {
    return ALL_SECTION_DEFS.map((def) => {
      const gradedResults = attempts
        .flatMap((a) => a.sections)
        .filter((s) => s.sectionKey === def.key && s.status === 'graded' && s.scoreAwarded !== null)
      if (gradedResults.length === 0) return { def, avgPct: null, verdict: 'Not graded yet' as const }
      const avgPct = Math.round(gradedResults.reduce((sum, r) => sum + (r.scoreAwarded! / r.marks) * 100, 0) / gradedResults.length)
      const verdict = avgPct >= 70 ? 'Strong' : avgPct >= 40 ? 'Average' : 'Needs Improvement'
      return { def, avgPct, verdict }
    })
  }, [attempts])

  const verdictColor = (v: string) => v === 'Strong' ? '#16a34a' : v === 'Average' ? '#ea580c' : v === 'Needs Improvement' ? '#dc2626' : PAGE_GRAY
  const verdictBg = (v: string) => v === 'Strong' ? '#f0fdf4' : v === 'Average' ? '#fff7ed' : v === 'Needs Improvement' ? '#fef2f2' : PAGE_BG

  // ── Attempt table: search / filter / sort / row improvement / expand ──
  const [search, setSearch] = useState('')
  const [patternFilter, setPatternFilter] = useState<'all' | 1 | 2>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'highest' | 'lowest'>('latest')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Word-by-word mistake breakdown for Listening & Reading — lazy-loaded per
  // submissionId the first time its "View Mistakes" panel is opened, then
  // cached so re-toggling doesn't refetch.
  const [openMistakesFor, setOpenMistakesFor] = useState<string | null>(null)
  const [mistakeDetail, setMistakeDetail] = useState<Record<string, SubmissionDetail | 'loading' | 'error'>>({})

  const closeMistakes = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    playbackAudioRef.current?.pause()
    playbackAudioRef.current = null
    setSpeakingKey(null)
    setOpenMistakesFor(null)
  }

  const toggleMistakes = (submissionId: string) => {
    if (openMistakesFor === submissionId) { closeMistakes(); return }
    setOpenMistakesFor(submissionId)
    if (mistakeDetail[submissionId] || !user?.token) return
    setMistakeDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setMistakeDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setMistakeDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Same lazy-load pattern as the Listening & Reading mistake breakdown, but
  // for Speaking's AI-graded per-topic feedback.
  const [openSpeakingFeedbackFor, setOpenSpeakingFeedbackFor] = useState<string | null>(null)
  const [speakingFeedbackDetail, setSpeakingFeedbackDetail] = useState<Record<string, SpeakingSubmissionDetail | 'loading' | 'error'>>({})

  const toggleSpeakingFeedback = (submissionId: string) => {
    if (openSpeakingFeedbackFor === submissionId) { setOpenSpeakingFeedbackFor(null); return }
    setOpenSpeakingFeedbackFor(submissionId)
    if (speakingFeedbackDetail[submissionId] || !user?.token) return
    setSpeakingFeedbackDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-speaking-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setSpeakingFeedbackDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setSpeakingFeedbackDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Same lazy-load pattern, for Grammar's per-question correct/incorrect breakdown.
  const [openGrammarFor, setOpenGrammarFor] = useState<string | null>(null)
  const [grammarDetail, setGrammarDetail] = useState<Record<string, GrammarSubmissionDetail | 'loading' | 'error'>>({})

  const toggleGrammarFeedback = (submissionId: string) => {
    if (openGrammarFor === submissionId) { setOpenGrammarFor(null); return }
    setOpenGrammarFor(submissionId)
    if (grammarDetail[submissionId] || !user?.token) return
    setGrammarDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-grammar-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setGrammarDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setGrammarDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Same lazy-load pattern, for Passages' per-question correct/incorrect breakdown.
  const [openPassageFor, setOpenPassageFor] = useState<string | null>(null)
  const [passageDetail, setPassageDetail] = useState<Record<string, PassageSubmissionDetail | 'loading' | 'error'>>({})

  const togglePassageFeedback = (submissionId: string) => {
    if (openPassageFor === submissionId) { setOpenPassageFor(null); return }
    setOpenPassageFor(submissionId)
    if (passageDetail[submissionId] || !user?.token) return
    setPassageDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-passage-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setPassageDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setPassageDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Same lazy-load pattern, for Jumbled Sentences' per-sentence correct/incorrect breakdown.
  const [openJumbledFor, setOpenJumbledFor] = useState<string | null>(null)
  const [jumbledDetail, setJumbledDetail] = useState<Record<string, JumbledSubmissionDetail | 'loading' | 'error'>>({})

  const toggleJumbledFeedback = (submissionId: string) => {
    if (openJumbledFor === submissionId) { setOpenJumbledFor(null); return }
    setOpenJumbledFor(submissionId)
    if (jumbledDetail[submissionId] || !user?.token) return
    setJumbledDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-jumbled-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setJumbledDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setJumbledDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Same lazy-load pattern, for Story Telling's per-prompt AI feedback.
  const [openStoryFor, setOpenStoryFor] = useState<string | null>(null)
  const [storyDetail, setStoryDetail] = useState<Record<string, StoryTellingSubmissionDetail | 'loading' | 'error'>>({})

  const toggleStoryFeedback = (submissionId: string) => {
    if (openStoryFor === submissionId) { setOpenStoryFor(null); return }
    setOpenStoryFor(submissionId)
    if (storyDetail[submissionId] || !user?.token) return
    setStoryDetail((prev) => ({ ...prev, [submissionId]: 'loading' }))
    fetch(`${baseURL}/api/student/lsrw-storytelling-content/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        setStoryDetail((prev) => ({ ...prev, [submissionId]: data.success ? data.submission : 'error' }))
      })
      .catch(() => setStoryDetail((prev) => ({ ...prev, [submissionId]: 'error' })))
  }

  // Plays either the student's actual recorded voice or the AI reference
  // voice, keyed by a string (`${idx}:student` / `${idx}:ai`) so both can be
  // tracked independently per question. Falls back to text-to-speech when no
  // real audio URL was captured (e.g. older submissions).
  const [speakingKey, setSpeakingKey] = useState<string | null>(null)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const toggleSpeak = (key: string, text: string, audioUrl?: string | null) => {
    if (speakingKey === key) {
      playbackAudioRef.current?.pause()
      playbackAudioRef.current = null
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setSpeakingKey(null)
      return
    }
    playbackAudioRef.current?.pause()
    playbackAudioRef.current = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()

    if (audioUrl) {
      const audioEl = new Audio(audioUrl)
      playbackAudioRef.current = audioEl
      audioEl.onended = () => setSpeakingKey(null)
      audioEl.onerror = () => setSpeakingKey(null)
      setSpeakingKey(key)
      audioEl.play().catch(() => setSpeakingKey(null))
      return
    }

    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-IN'
    utter.onend = () => setSpeakingKey(null)
    utter.onerror = () => setSpeakingKey(null)
    setSpeakingKey(key)
    window.speechSynthesis.speak(utter)
  }

  // Real, chronological improvement vs the student's own previous attempt of
  // the SAME pattern — not a cross-student comparison (no leaderboard exists).
  const improvementById = useMemo(() => {
    const byPattern: Record<number, Attempt[]> = { 1: [], 2: [] }
    chronological.forEach((a) => byPattern[a.patternKey].push(a))
    const map: Record<string, number | null> = {}
    ;([1, 2] as const).forEach((p) => {
      byPattern[p].forEach((a, idx) => {
        map[a._id] = idx === 0 ? null : gradedPct(a, accentBlend) - gradedPct(byPattern[p][idx - 1], accentBlend)
      })
    })
    return map
  }, [chronological, accentBlend])

  const filteredSortedAttempts = useMemo(() => {
    let list = [...attempts]
    if (patternFilter !== 'all') list = list.filter((a) => a.patternKey === patternFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((a) =>
        `pattern ${a.patternKey}`.includes(q) ||
        new Date(a.createdAt).toLocaleDateString().toLowerCase().includes(q) ||
        a.status.includes(q)
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'highest') return gradedPct(b, accentBlend) - gradedPct(a, accentBlend)
      return gradedPct(a, accentBlend) - gradedPct(b, accentBlend)
    })
    return list
  }, [attempts, patternFilter, search, sortBy, accentBlend])

  const sectionCell = (result: SectionResult | undefined): { text: string; sub: string | null; color: string } => {
    if (!result || result.status === 'pending') return { text: '—', sub: null, color: PAGE_GRAY }
    if (result.status === 'graded') {
      const pct = result.sectionKey === 'listeningReading' && result.submissionId && accentBlend[result.submissionId] !== undefined
        ? accentBlend[result.submissionId]
        : Math.round((result.scoreAwarded! / result.marks) * 100)
      return { text: `${result.scoreAwarded}/${result.marks}`, sub: `${pct}%`, color: pctColor(pct) }
    }
    return { text: result.label, sub: 'Pending grading', color: PAGE_GRAY } // attempted but not gradable yet
  }

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: PAGE_TEXT, margin: '0 0 4px' }}>LSRW Communication Round</h2>
        <p style={{ color: PAGE_GRAY, fontSize: 13, margin: 0 }}>Choose a pattern to start practicing different sections of English and improve your LSRW skills.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 20 }}>
        {PATTERNS.map((pattern) => (
          <div key={pattern.key} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaFileAlt size={16} color={ORANGE} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: PAGE_TEXT }}>{pattern.label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const }}>
              {pattern.sections.map((s, i) => (
                <div
                  key={s.letter}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    borderBottom: i < pattern.sections.length - 1 ? `1px solid ${PAGE_BORDER}` : 'none',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={14} color={s.color} />
                  </div>
                  <span style={{ fontSize: 13, color: PAGE_GRAY, flexShrink: 0 }}>Section {s.letter}:-</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: PAGE_TEXT, flex: 1 }}>{s.label}</span>
                  <button
                    onClick={() => onPracticeSection(s.key)}
                    title="Try this section for practice — not scored or saved"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid #16a34a55`, color: '#16a34a', background: '#f0fdf4', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <FaGraduationCap size={10} /> Practice
                  </button>
                  <span style={{ border: `1px solid ${ORANGE}55`, color: ORANGE, borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 700, minWidth: 34, textAlign: 'center' as const }}>
                    {sectionCounts[s.key] ?? s.count}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSelect(pattern.key)}
              style={{
                marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: CARD_BG, border: `1.5px solid ${ORANGE}`, color: ORANGE, borderRadius: 10,
                padding: '11px 0', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Select {pattern.label} <FaArrowRight size={11} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <FaInfoCircle size={14} color={ORANGE} />
        <span style={{ fontSize: 12.5, color: PAGE_GRAY }}>Each pattern is one exam — its sections must be completed in order. Selecting a pattern resumes any exam already in progress.</span>
      </div>

      {/* Performance graph + attempt history — real data pulled from every
          Pattern exam attempt the student has started/completed. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(280px, 380px)', gap: 20, marginBottom: 20, alignItems: 'stretch' }}>
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: '16px 20px', display: 'flex', flexDirection: 'column' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaChartLine size={13} color={ORANGE} />
              <span style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT }}>Performance Over Attempts</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: PAGE_TEXT, background: PAGE_BG }}
            >
              {availableMonths.map((mk) => (
                <option key={mk} value={mk}>{monthLabel(mk)}</option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: 11.5, color: PAGE_GRAY, margin: '0 0 8px' }}>% score = graded marks earned so far ÷ total marks for that attempt.</p>
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
            {loadingAttempts ? (
              <div style={{ textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 13 }}>Loading…</div>
            ) : (
              <>
                <ReactApexChart options={chartOptions as any} series={chartSeries} type="line" height={300} width="100%" />
                {!monthChart.hasAnyAttemptThisMonth && (
                  <div style={{ textAlign: 'center' as const, fontSize: 11.5, color: PAGE_GRAY, marginTop: 4 }}>No attempts recorded in {monthLabel(selectedMonth)}.</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Section strengths / weaknesses */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: '16px 20px', display: 'flex', flexDirection: 'column' as const }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT, marginBottom: 12 }}>Where You Stand — by Section</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', gap: 10 }}>
            {sectionPerformance.map(({ def, avgPct, verdict }) => (
              <div key={def.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: def.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <def.icon size={11} color={def.color} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_TEXT, flex: 1 }}>{def.label}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                  color: verdictColor(verdict), background: verdictBg(verdict), border: `1px solid ${verdictColor(verdict)}33`,
                }}>
                  {avgPct !== null ? `${avgPct}% · ` : ''}{verdict}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attempt history table */}
      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <FaSearch size={12} color={PAGE_GRAY} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search attempts…"
              style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 13, color: PAGE_TEXT, background: PAGE_BG }}
            />
          </div>
          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2))}
            style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG }}
          >
            <option value="all">Pattern: All</option>
            <option value={1}>Pattern 1</option>
            <option value={2}>Pattern 2</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG }}
          >
            <option value="latest">Sort: Latest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest">Sort: Highest Score</option>
            <option value="lowest">Sort: Lowest Score</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: 900 }}>
            <thead>
              <tr style={{ background: PAGE_BG }}>
                {['No.', 'Pattern', 'Date', 'Overall', 'Section 1', 'Section 2', 'Section 3', 'Section 4', 'Rating', 'Improvement', 'Details'].map((h) => (
                  <th key={h} style={{ textAlign: 'left' as const, fontSize: 11, color: PAGE_GRAY, textTransform: 'uppercase' as const, letterSpacing: '0.03em', padding: '10px 16px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingAttempts ? (
                <tr><td colSpan={11} style={{ padding: '30px 20px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 13 }}>Loading…</td></tr>
              ) : filteredSortedAttempts.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '30px 20px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 13 }}>No attempts match.</td></tr>
              ) : (
                filteredSortedAttempts.map((a, rowIdx) => {
                  const pct = gradedPct(a, accentBlend)
                  const stars = Math.max(1, Math.min(5, Math.round(pct / 20)))
                  const improvement = improvementById[a._id]
                  const isOpen = expandedId === a._id
                  const secDefs = PATTERN_SECTIONS[a.patternKey]
                  const graded = a.sections.filter((s) => s.status === 'graded')
                  const best = graded.length ? graded.reduce((m, s) => (s.scoreAwarded! / s.marks > m.scoreAwarded! / m.marks ? s : m)) : null
                  const worst = graded.length > 1 ? graded.reduce((m, s) => (s.scoreAwarded! / s.marks < m.scoreAwarded! / m.marks ? s : m)) : null

                  return (
                    <Fragment key={a._id}>
                      <tr style={{ borderTop: `1px solid ${PAGE_BORDER}` }}>
                        <td style={{ padding: '12px 16px', fontSize: 12.5, color: PAGE_GRAY }}>{filteredSortedAttempts.length - rowIdx}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: a.patternKey === 1 ? '#7c3aed' : '#0891b2', background: a.patternKey === 1 ? '#f5f3ff' : '#ecfeff', borderRadius: 8, padding: '2px 8px' }}>
                            Pattern {a.patternKey}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: PAGE_GRAY, whiteSpace: 'nowrap' as const }}>
                          {new Date(a.createdAt).toLocaleDateString()}<br />
                          <span style={{ fontSize: 10.5 }}>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: pctColor(pct) }}>{pct}%</div>
                          <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>{overallLabel(pct)}</div>
                        </td>
                        {[0, 1, 2, 3].map((i) => {
                          const cell = sectionCell(a.sections[i])
                          return (
                            <td key={i} style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: cell.color }}>{cell.text}</div>
                              {cell.sub && <div style={{ fontSize: 10, color: PAGE_GRAY }}>{cell.sub}</div>}
                            </td>
                          )
                        })}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {Array.from({ length: 5 }, (_, i) => i < stars
                              ? <FaStar key={i} size={10} color="#f59e0b" />
                              : <FaRegStar key={i} size={10} color={PAGE_BORDER} />)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {improvement === undefined ? (
                            <span style={{ fontSize: 12, color: PAGE_GRAY }}>—</span>
                          ) : improvement === null ? (
                            // First attempt of this pattern — nothing to compare against yet,
                            // so show the overall score itself as the baseline future attempts
                            // will be measured against.
                            <span style={{ fontSize: 12, fontWeight: 600, color: PAGE_GRAY }}>{pct}% <span style={{ fontWeight: 400 }}>(baseline)</span></span>
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 700, color: improvement >= 0 ? '#16a34a' : '#dc2626' }}>
                              {improvement >= 0 ? '+' : ''}{improvement}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => setExpandedId(isOpen ? null : a._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_TEXT, borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {isOpen ? <>Hide <FaChevronUp size={9} /></> : <>View <FaChevronDown size={9} /></>}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={11} style={{ padding: 0, borderTop: `1px solid ${PAGE_BORDER}` }}>
                            <div style={{ background: PAGE_BG, padding: '18px 22px', display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) minmax(260px, 1fr) minmax(220px, 300px)', gap: 20 }}>
                              {/* Highlights */}
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <FaTrophy size={16} color="#f59e0b" />
                                  <div>
                                    <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>Best Section</div>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: PAGE_TEXT }}>{best ? best.label : 'Not enough graded data yet'}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <FaExclamationTriangle size={16} color="#dc2626" />
                                  <div>
                                    <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>Needs Improvement</div>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: PAGE_TEXT }}>{worst ? worst.label : 'Not enough graded data yet'}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <FaClock size={16} color={PAGE_GRAY} />
                                  <div>
                                    <div style={{ fontSize: 10.5, color: PAGE_GRAY }}>Time Taken</div>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: PAGE_TEXT }}>{formatDuration(a)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Section-wise performance bars */}
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT, marginBottom: 10 }}>Section-wise Performance</div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                                  {secDefs.map((def, idx) => {
                                    const result = a.sections[idx]
                                    const graded_ = result?.status === 'graded'
                                    const pctBar = graded_
                                      ? (result.sectionKey === 'listeningReading' && result.submissionId && accentBlend[result.submissionId] !== undefined
                                          ? accentBlend[result.submissionId]
                                          : Math.round((result.scoreAwarded! / result.marks) * 100))
                                      : 0
                                    return (
                                      <div key={def.key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: PAGE_TEXT, marginBottom: 3 }}>
                                          <span>{def.label}</span>
                                          <span style={{ color: PAGE_GRAY }}>{graded_ ? `${pctBar}% (${result.scoreAwarded}/${result.marks})` : (result?.status === 'attempted' ? 'Pending grading' : 'Not attempted')}</span>
                                        </div>
                                        <div style={{ height: 7, borderRadius: 4, background: PAGE_BORDER, overflow: 'hidden' }}>
                                          <div style={{ width: `${graded_ ? pctBar : 0}%`, height: '100%', background: graded_ ? pctColor(pctBar) : PAGE_BORDER }} />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Feedback + report download */}
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT, marginBottom: 10 }}>Feedback</div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 14 }}>
                                  {a.sections.map((s) => {
                                    if (s.status !== 'graded') {
                                      return <div key={s.sectionKey} style={{ fontSize: 11.5, color: PAGE_GRAY }}><FaHourglassHalf size={9} style={{ marginRight: 6 }} />{s.label}: pending grading.</div>
                                    }
                                    const pctS = s.sectionKey === 'listeningReading' && s.submissionId && accentBlend[s.submissionId] !== undefined
                                      ? accentBlend[s.submissionId]
                                      : Math.round((s.scoreAwarded! / s.marks) * 100)
                                    const msg = pctS >= 85 ? `${s.label}: excellent accuracy — keep it up.`
                                      : pctS >= 60 ? `${s.label}: solid performance — keep practicing.`
                                      : `${s.label}: needs more practice — review the fundamentals.`
                                    return (
                                      <div key={s.sectionKey} style={{ fontSize: 11.5, color: PAGE_TEXT, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                        <FaCheckCircle size={10} color={pctColor(pctS)} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ flex: 1 }}>{msg}</span>
                                        {s.submissionId && s.sectionKey === 'listeningReading' && (
                                          <button
                                            onClick={() => toggleMistakes(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'speaking' && (
                                          <button
                                            onClick={() => toggleSpeakingFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'grammar' && (
                                          <button
                                            onClick={() => toggleGrammarFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'passages' && (
                                          <button
                                            onClick={() => togglePassageFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'jumbled' && (
                                          <button
                                            onClick={() => toggleJumbledFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'storytelling' && (
                                          <button
                                            onClick={() => toggleStoryFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Feedback
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <button
                                  onClick={() => downloadReport(a, { name: user?.username, email: user?.email }, accentBlend)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <FaDownload size={11} /> Download Report
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mistake breakdown — modal, not an inline expander, so it doesn't
          push the rest of the attempt-history row's content around. */}
      {openMistakesFor && (
        <div
          onClick={closeMistakes}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Listening & Reading — Mistake Breakdown</span>
                <span
                  title="Red word = mismatch between the expected sentence and what you said"
                  style={{ display: 'flex', alignItems: 'center', cursor: 'help' }}
                >
                  <FaInfoCircle size={13} color={PAGE_GRAY} />
                </span>
              </div>
              <button
                onClick={closeMistakes}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              <style>{`
                .lsrw-mistake-scroll::-webkit-scrollbar { width: 6px; }
                .lsrw-mistake-scroll::-webkit-scrollbar-track { background: transparent; }
                .lsrw-mistake-scroll::-webkit-scrollbar-thumb { background: ${PAGE_BORDER}; border-radius: 10px; }
                .lsrw-mistake-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
              `}</style>
              {mistakeDetail[openMistakesFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : mistakeDetail[openMistakesFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the mistake breakdown.</div>
              ) : (
                <div style={{ overflowX: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>
                  <table style={{ width: '100%', minWidth: 1250, borderCollapse: 'separate' as const, borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Q', 'Expected', 'Student Said', 'Pronunciation Tips', 'Accent & Intonation', 'Score'].map((h) => (
                          <th key={h} style={{ textAlign: 'left' as const, fontSize: 11, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' as const, background: `linear-gradient(90deg, ${ORANGE}, #ff9a3d)` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(mistakeDetail[openMistakesFor] as SubmissionDetail).items.map((it, idx) => {
                        const expectedTokens = it.alignment?.filter((t) => t.type !== 'extra') || []
                        const saidTokens = it.alignment?.filter((t) => t.type !== 'missing') || []
                        const isPerfect = it.mistakes.length === 0
                        // Overall = 70% word-accuracy + 30% accent/intonation when an
                        // accent review exists (display-only — graded marks/section
                        // totals still use word-accuracy alone, unchanged).
                        const combinedPct = it.accentReview
                          ? Math.round(it.accuracyPercent * 0.7 + it.accentReview.score * 0.3)
                          : it.accuracyPercent
                        const rowBg = idx % 2 === 0 ? CARD_BG : PAGE_BG
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, fontWeight: 800, color: ORANGE, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const }}>
                              {idx + 1}
                              <div style={{ fontSize: 10.5, fontWeight: 600, color: PAGE_GRAY, textTransform: 'capitalize' as const }}>{it.type}</div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 200, maxWidth: 240, color: PAGE_TEXT, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {(it.aiAudioUrl || it.expectedSentence) && (
                                <button
                                  onClick={() => toggleSpeak(`${idx}:ai`, it.expectedSentence, it.aiAudioUrl)}
                                  title={it.aiAudioUrl ? "Play the AI's model pronunciation" : "No AI voice available — playing a text-to-speech reading instead"}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: speakingKey === `${idx}:ai` ? '#6c63ff' : '#f0efff', border: '1px solid #6c63ff55', color: speakingKey === `${idx}:ai` ? '#fff' : '#6c63ff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}
                                >
                                  {speakingKey === `${idx}:ai` ? <FaStop size={9} /> : <FaPlay size={8} />}
                                  {speakingKey === `${idx}:ai` ? 'Stop' : 'AI Voice'}
                                </button>
                              )}
                              {isPerfect && (
                                <div style={{ color: '#16a34a', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>✓ Perfect match</div>
                              )}
                              <div>
                                {expectedTokens.length > 0
                                  ? expectedTokens.map((t, ti) => {
                                      const wrong = t.type === 'missing' || t.type === 'substitution'
                                      return <span key={ti} style={wrong ? { color: '#dc2626', fontWeight: 700 } : undefined}>{t.type === 'match' ? t.word : t.expected} </span>
                                    })
                                  : it.expectedSentence}
                              </div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 200, maxWidth: 240, color: PAGE_TEXT, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {(it.transcript?.trim() || it.audioUrl) && (
                                <button
                                  onClick={() => toggleSpeak(`${idx}:student`, it.transcript, it.audioUrl)}
                                  title={it.audioUrl ? "Play your actual recording" : "No recording saved for this attempt — playing a text-to-speech reading of the transcript instead"}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: speakingKey === `${idx}:student` ? ORANGE : '#fff7ed', border: `1px solid ${ORANGE}55`, color: speakingKey === `${idx}:student` ? '#fff' : ORANGE, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}
                                >
                                  {speakingKey === `${idx}:student` ? <FaStop size={9} /> : <FaPlay size={8} />}
                                  {speakingKey === `${idx}:student` ? 'Stop' : 'Your Voice'}
                                </button>
                              )}
                              <div>
                                {it.transcript.trim() === '' ? (
                                  <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(nothing captured)</span>
                                ) : saidTokens.length > 0 ? (
                                  saidTokens.map((t, ti) => {
                                    const wrong = t.type === 'extra' || t.type === 'substitution'
                                    return <span key={ti} style={wrong ? { color: '#dc2626', fontWeight: 700 } : undefined}>{t.type === 'match' ? t.word : t.said} </span>
                                  })
                                ) : it.transcript}
                              </div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 220, maxWidth: 280, color: '#9a3412', borderTop: `1px solid ${PAGE_BORDER}` }}>
                              {!isPerfect && it.pronunciationFeedback ? (
                                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7 }}>
                                  {it.pronunciationFeedback
                                    .split(/\n+/).filter(Boolean)
                                    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean))
                                    .map((p, pi) => <li key={pi}>{highlightQuotedWords(p)}</li>)}
                                </ul>
                              ) : <span style={{ color: PAGE_GRAY }}>—</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 220, maxWidth: 280, color: '#3730a3', borderTop: `1px solid ${PAGE_BORDER}` }}>
                              {it.accentReview && ((it.accentReview.points?.length ?? 0) > 0 || it.accentReview.feedback) ? (
                                <>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: pctColor(it.accentReview.score), marginBottom: 4 }}>{it.accentReview.score}/100</div>
                                  <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7 }}>
                                    {(it.accentReview.points?.length
                                      ? it.accentReview.points
                                      // Legacy submissions only stored one combined paragraph —
                                      // split it into sentences so it still reads as points.
                                      : it.accentReview.feedback!.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean)
                                    ).map((p, pi) => <li key={pi}>{highlightQuotedWords(p)}</li>)}
                                  </ul>
                                </>
                              ) : <span style={{ color: PAGE_GRAY }}>—</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' as const, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const, textAlign: 'center' as const }}>
                              <span title={it.accentReview ? 'Overall = 70% word-accuracy + 30% accent/intonation' : undefined} style={{ display: 'inline-block', background: pctColor(combinedPct), color: '#fff', fontWeight: 700, fontSize: 12.5, borderRadius: 20, padding: '4px 10px' }}>{it.scoreAwarded}/{it.marks}</span>
                              <div style={{ fontSize: 11, color: pctColor(combinedPct), fontWeight: 700, marginTop: 4, textAlign: 'center' as const }}>{combinedPct}%</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Speaking feedback — same modal shell as the Listening & Reading
          mistake breakdown, but per-topic AI feedback instead of a word diff. */}
      {openSpeakingFeedbackFor && (
        <div
          onClick={() => setOpenSpeakingFeedbackFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Speaking — AI Feedback</span>
              <button
                onClick={() => setOpenSpeakingFeedbackFor(null)}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              {speakingFeedbackDetail[openSpeakingFeedbackFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : speakingFeedbackDetail[openSpeakingFeedbackFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the feedback.</div>
              ) : (
                <div style={{ overflowX: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>
                  <table style={{ width: '100%', minWidth: 1150, borderCollapse: 'separate' as const, borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Q', 'Topic', 'What You Said', 'Grammar & Mistakes', 'Sample Answer', 'AI Feedback', 'Score'].map((h) => (
                          <th key={h} style={{ textAlign: 'left' as const, fontSize: 11, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' as const, background: `linear-gradient(90deg, ${ORANGE}, #ff9a3d)` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(speakingFeedbackDetail[openSpeakingFeedbackFor] as SpeakingSubmissionDetail).items.map((it, idx) => {
                        const pct = Math.round((it.scoreAwarded / it.marks) * 100)
                        const rowBg = idx % 2 === 0 ? CARD_BG : PAGE_BG
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, fontWeight: 800, color: ORANGE, borderTop: `1px solid ${PAGE_BORDER}` }}>{idx + 1}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 160, maxWidth: 200, fontWeight: 700, color: PAGE_TEXT, borderTop: `1px solid ${PAGE_BORDER}` }}>{it.topic}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 200, maxWidth: 260, color: PAGE_TEXT, fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.transcript.trim() ? it.transcript : <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const, fontWeight: 400 }}>(nothing captured)</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 220, maxWidth: 280, color: PAGE_TEXT, borderTop: `1px solid ${PAGE_BORDER}` }}>
                              {it.mistakes && it.mistakes.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7, fontWeight: 500 }}>
                                  {it.mistakes.map((m, mi) => <li key={mi}>{highlightQuotedWords(m)}</li>)}
                                </ul>
                              ) : <span style={{ color: PAGE_GRAY }}>—</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 200, maxWidth: 260, color: '#15803d', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.sampleAnswer ? (
                                <>
                                  <button
                                    onClick={() => toggleSpeak(`speaking-${idx}:ai`, it.sampleAnswer!, it.sampleAnswerAudioUrl)}
                                    title={it.sampleAnswerAudioUrl ? "Hear how this should sound" : "No AI voice available — playing a text-to-speech reading instead"}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: speakingKey === `speaking-${idx}:ai` ? '#16a34a' : '#f0fdf4', border: '1px solid #16a34a55', color: speakingKey === `speaking-${idx}:ai` ? '#fff' : '#16a34a', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 6 }}
                                  >
                                    {speakingKey === `speaking-${idx}:ai` ? <FaStop size={9} /> : <FaPlay size={8} />}
                                    {speakingKey === `speaking-${idx}:ai` ? 'Stop' : 'Listen'}
                                  </button>
                                  <div>{it.sampleAnswer}</div>
                                </>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 180, maxWidth: 240, color: '#c2410c', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>{it.feedback || 'No feedback available.'}</td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' as const, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const, textAlign: 'center' as const }}>
                              <span style={{ display: 'inline-block', background: pctColor(pct), color: '#fff', fontWeight: 700, fontSize: 12.5, borderRadius: 20, padding: '4px 10px' }}>{it.scoreAwarded}/{it.marks}</span>
                              <div style={{ fontSize: 11, color: pctColor(pct), fontWeight: 700, marginTop: 4, textAlign: 'center' as const }}>{pct}%</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grammar answers — same modal shell as the others, per-question
          correct/incorrect + correct answer instead of a word diff or AI feedback. */}
      {openGrammarFor && (
        <div
          onClick={() => setOpenGrammarFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Grammar — Your Answers</span>
              <button
                onClick={() => setOpenGrammarFor(null)}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              {grammarDetail[openGrammarFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : grammarDetail[openGrammarFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the answers.</div>
              ) : (
                <div style={{ overflowX: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>
                  <table style={{ width: '100%', minWidth: 900, borderCollapse: 'separate' as const, borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Q', 'Topic', 'Question', 'Your Answer', 'Correct Answer', 'Score'].map((h) => (
                          <th key={h} style={{ textAlign: 'left' as const, fontSize: 11, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' as const, background: `linear-gradient(90deg, ${ORANGE}, #ff9a3d)` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(grammarDetail[openGrammarFor] as GrammarSubmissionDetail).items.map((it, idx) => {
                        const rowBg = idx % 2 === 0 ? CARD_BG : PAGE_BG
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, fontWeight: 800, color: ORANGE, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const }}>{idx + 1}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 120, maxWidth: 160, color: PAGE_TEXT, fontWeight: 600, borderTop: `1px solid ${PAGE_BORDER}` }}>{it.category}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 220, maxWidth: 320, color: PAGE_TEXT, fontWeight: 600, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>{it.question}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 160, maxWidth: 220, color: it.isCorrect ? '#15803d' : '#dc2626', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.studentAnswer || <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(not answered)</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 160, maxWidth: 220, color: '#15803d', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.isCorrect ? <span style={{ color: PAGE_GRAY }}>—</span> : it.correctAnswer}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' as const, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const, textAlign: 'center' as const }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: it.isCorrect ? '#16a34a' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: 12.5, borderRadius: 20, padding: '4px 10px' }}>
                                {it.isCorrect ? <FaCheckCircle size={11} /> : <FaTimes size={11} />}
                                {it.scoreAwarded}/{it.marks}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Passages answers — same modal shell as Grammar's, per-question
          correct/incorrect + correct answer. */}
      {openPassageFor && (
        <div
          onClick={() => setOpenPassageFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Passages — Your Answers</span>
              <button
                onClick={() => setOpenPassageFor(null)}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              {passageDetail[openPassageFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : passageDetail[openPassageFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the answers.</div>
              ) : (
                <div style={{ overflowX: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>
                  <table style={{ width: '100%', minWidth: 900, borderCollapse: 'separate' as const, borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Q', 'Question', 'Your Answer', 'Correct Answer', 'Score'].map((h) => (
                          <th key={h} style={{ textAlign: 'left' as const, fontSize: 11, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.04em', padding: '12px 14px', fontWeight: 700, whiteSpace: 'nowrap' as const, background: `linear-gradient(90deg, ${ORANGE}, #ff9a3d)` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(passageDetail[openPassageFor] as PassageSubmissionDetail).items.map((it, idx) => {
                        const rowBg = idx % 2 === 0 ? CARD_BG : PAGE_BG
                        return (
                          <tr key={idx} style={{ background: rowBg }}>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, fontWeight: 800, color: ORANGE, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const }}>{idx + 1}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 220, maxWidth: 320, color: PAGE_TEXT, fontWeight: 600, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>{it.question}</td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 160, maxWidth: 220, color: it.isCorrect ? '#15803d' : '#dc2626', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.studentAnswer || <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(not answered)</span>}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'top' as const, minWidth: 160, maxWidth: 220, color: '#15803d', fontWeight: 500, borderTop: `1px solid ${PAGE_BORDER}`, lineHeight: 1.6 }}>
                              {it.isCorrect ? <span style={{ color: PAGE_GRAY }}>—</span> : it.correctAnswer}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' as const, borderTop: `1px solid ${PAGE_BORDER}`, whiteSpace: 'nowrap' as const, textAlign: 'center' as const }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: it.isCorrect ? '#16a34a' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: 12.5, borderRadius: 20, padding: '4px 10px' }}>
                                {it.isCorrect ? <FaCheckCircle size={11} /> : <FaTimes size={11} />}
                                {it.scoreAwarded}/{it.marks}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jumbled Sentences answers — same modal shell as Grammar/Passages',
          per-sentence correct/incorrect + correct order. */}
      {openJumbledFor && (
        <div
          onClick={() => setOpenJumbledFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Jumbled Sentences — Your Answers</span>
              <button
                onClick={() => setOpenJumbledFor(null)}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              {jumbledDetail[openJumbledFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : jumbledDetail[openJumbledFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the answers.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {(jumbledDetail[openJumbledFor] as JumbledSubmissionDetail).items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: it.isCorrect ? '#16a34a' : '#dc2626' }}>
                          {it.isCorrect ? <FaCheckCircle size={11} /> : <FaTimes size={11} />}
                          {it.scoreAwarded}/{it.marks}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginBottom: 4 }}>
                        <strong>Your order:</strong> {it.studentOrder.length ? it.studentOrder.join(' ') : <em>(not attempted)</em>}
                      </div>
                      {!it.isCorrect && (
                        <div style={{ fontSize: 11.5, color: '#16a34a' }}>
                          <strong>Correct order:</strong> {it.correctOrder.join(' ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Story Telling feedback — same modal shell as Speaking's, per-prompt
          AI feedback instead of a word diff. */}
      {openStoryFor && (
        <div
          onClick={() => setOpenStoryFor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: CARD_BG, borderRadius: 16, width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Story Telling — AI Feedback</span>
              <button
                onClick={() => setOpenStoryFor(null)}
                aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <FaTimes size={12} color={PAGE_GRAY} />
              </button>
            </div>
            <div className="lsrw-mistake-scroll" style={{ padding: '14px 20px', overflowY: 'auto' as const, scrollbarWidth: 'thin' as const }}>
              {storyDetail[openStoryFor] === 'loading' ? (
                <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center' as const, padding: '20px 0' }}>Loading…</div>
              ) : storyDetail[openStoryFor] === 'error' ? (
                <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' as const, padding: '20px 0' }}>Couldn't load the feedback.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {(storyDetail[openStoryFor] as StoryTellingSubmissionDetail).items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1}</span>
                        <span style={{ color: pctColor(Math.round((it.scoreAwarded / it.marks) * 100)), fontWeight: 700, fontSize: 12 }}>{it.scoreAwarded}/{it.marks} ({Math.round((it.scoreAwarded / it.marks) * 100)}%)</span>
                      </div>
                      {it.promptType === 'text' && (
                        <div style={{ background: '#eff6ff', borderLeft: '3px solid #2563eb', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 6 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2563eb' }}>PROMPT</span>
                          <div style={{ marginTop: 2 }}>{it.promptText}</div>
                        </div>
                      )}
                      <div style={{ background: '#f5f3ff', borderLeft: '3px solid #7c3aed', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed' }}>YOUR STORY</span>
                        <div style={{ marginTop: 2 }}>
                          {it.story.trim() ? it.story : <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(nothing captured)</span>}
                        </div>
                      </div>
                      <div style={{ background: '#fff7ed', borderLeft: '3px solid #ea580c', borderRadius: '0 8px 8px 0', padding: '6px 10px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ea580c' }}>AI FEEDBACK</span>
                        <div style={{ marginTop: 2 }}>{it.feedback || 'No feedback available.'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternSelectionScreen
