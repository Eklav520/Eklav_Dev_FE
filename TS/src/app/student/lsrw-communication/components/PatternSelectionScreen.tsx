import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import {
  FaFileAlt, FaBookOpen, FaMicrophone, FaPuzzlePiece, FaImage, FaInfoCircle, FaArrowRight,
  FaCheckCircle, FaHourglassHalf, FaChartLine, FaSearch, FaChevronDown, FaChevronUp, FaDownload,
  FaStar, FaRegStar, FaTrophy, FaExclamationTriangle, FaClock, FaTimes, FaVolumeUp, FaStop,
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
type SubmissionItem = {
  itemId: string; type: 'reading' | 'listening'; expectedSentence: string; transcript: string
  marks: number; scoreAwarded: number; accuracyPercent: number; mistakes: SubmissionMistake[]; alignment?: AlignmentToken[]; audioUrl?: string | null; recordedSeconds: number
  pronunciationFeedback?: string
}
type SubmissionDetail = {
  _id: string; totalMarks: number; totalScoreAwarded: number; totalQuestions: number
  items: SubmissionItem[]
}
type SpeakingSubmissionItem = { itemId: string; topic: string; transcript: string; marks: number; scoreAwarded: number; feedback: string; sampleAnswer?: string; recordedSeconds: number }
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

// Graded % is computed only over sections that have real grading so far
// (gradedMarks/gradedScore), not the attempt's full total — otherwise
// sections with no grading yet (pending: true "auto-grade coming later")
// would silently drag the percentage down and mislead the student.
const gradedPct = (a: Attempt) => {
  const graded = a.sections.filter((s) => s.status === 'graded')
  const gradedMarks = graded.reduce((sum, s) => sum + s.marks, 0)
  const gradedScore = graded.reduce((sum, s) => sum + (s.scoreAwarded || 0), 0)
  return gradedMarks > 0 ? Math.round((gradedScore / gradedMarks) * 100) : 0
}

const formatDuration = (a: Attempt) => {
  if (!a.completedAt) return 'In Progress'
  const mins = Math.round((new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 60000)
  return mins < 1 ? '< 1 min' : `${mins} min`
}

const downloadReport = (a: Attempt) => {
  const graded = a.sections.filter((s) => s.status === 'graded')
  const gradedMarks = graded.reduce((sum, s) => sum + s.marks, 0)
  const gradedScore = graded.reduce((sum, s) => sum + (s.scoreAwarded || 0), 0)
  const lines = [
    `LSRW Communication Round — Pattern ${a.patternKey} Report`,
    `Date: ${new Date(a.createdAt).toLocaleString()}`,
    `Status: ${a.status === 'completed' ? 'Completed' : 'In Progress'}`,
    `Time Taken: ${formatDuration(a)}`,
    '',
    'Section-wise Result:',
    ...a.sections.map((s) => `  ${s.label}: ${
      s.status === 'graded' ? `${s.scoreAwarded}/${s.marks} (${Math.round((s.scoreAwarded! / s.marks) * 100)}%)`
        : s.status === 'attempted' ? 'Attempted — pending grading'
        : 'Not attempted'
    }`),
    '',
    `Graded Total: ${gradedScore}/${gradedMarks}${gradedMarks > 0 ? ` (${Math.round((gradedScore / gradedMarks) * 100)}%)` : ''}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `lsrw-pattern${a.patternKey}-${new Date(a.createdAt).toISOString().slice(0, 10)}.txt`
  link.click()
  URL.revokeObjectURL(url)
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
    setSpeakingIdx(null)
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

  // Plays the student's actual recorded voice when it was captured/uploaded
  // (audioUrl); older submissions from before real audio capture existed
  // fall back to a text-to-speech reading of the transcript.
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const toggleSpeak = (idx: number, text: string, audioUrl?: string | null) => {
    if (speakingIdx === idx) {
      playbackAudioRef.current?.pause()
      playbackAudioRef.current = null
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setSpeakingIdx(null)
      return
    }
    playbackAudioRef.current?.pause()
    playbackAudioRef.current = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()

    if (audioUrl) {
      const audioEl = new Audio(audioUrl)
      playbackAudioRef.current = audioEl
      audioEl.onended = () => setSpeakingIdx(null)
      audioEl.onerror = () => setSpeakingIdx(null)
      setSpeakingIdx(idx)
      audioEl.play().catch(() => setSpeakingIdx(null))
      return
    }

    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-IN'
    utter.onend = () => setSpeakingIdx(null)
    utter.onerror = () => setSpeakingIdx(null)
    setSpeakingIdx(idx)
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
        map[a._id] = idx === 0 ? null : gradedPct(a) - gradedPct(byPattern[p][idx - 1])
      })
    })
    return map
  }, [chronological])

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
      if (sortBy === 'highest') return gradedPct(b) - gradedPct(a)
      return gradedPct(a) - gradedPct(b)
    })
    return list
  }, [attempts, patternFilter, search, sortBy])

  const sectionCell = (result: SectionResult | undefined): { text: string; sub: string | null; color: string } => {
    if (!result || result.status === 'pending') return { text: '—', sub: null, color: PAGE_GRAY }
    if (result.status === 'graded') {
      const pct = Math.round((result.scoreAwarded! / result.marks) * 100)
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
                  const pct = gradedPct(a)
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
                          {improvement === null || improvement === undefined ? (
                            <span style={{ fontSize: 12, color: PAGE_GRAY }}>—</span>
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
                                    const pctBar = graded_ ? Math.round((result.scoreAwarded! / result.marks) * 100) : 0
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
                                    const pctS = Math.round((s.scoreAwarded! / s.marks) * 100)
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
                                            View Mistakes
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
                                            View Answers
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'passages' && (
                                          <button
                                            onClick={() => togglePassageFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Answers
                                          </button>
                                        )}
                                        {s.submissionId && s.sectionKey === 'jumbled' && (
                                          <button
                                            onClick={() => toggleJumbledFeedback(s.submissionId!)}
                                            style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                                          >
                                            View Answers
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
                                  onClick={() => downloadReport(a)}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 10, alignItems: 'stretch' }}>
                  {(mistakeDetail[openMistakesFor] as SubmissionDetail).items.map((it, idx) => {
                    const expectedTokens = it.alignment?.filter((t) => t.type !== 'extra') || []
                    const saidTokens = it.alignment?.filter((t) => t.type !== 'missing') || []
                    const isPerfect = it.mistakes.length === 0
                    return (
                      <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1} · {it.type === 'reading' ? 'Reading' : 'Listening'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {(it.transcript?.trim() || it.audioUrl) && (
                              <button
                                onClick={() => toggleSpeak(idx, it.transcript, it.audioUrl)}
                                title={it.audioUrl ? "Play your actual recording" : "No recording saved for this attempt — playing a text-to-speech reading of the transcript instead"}
                                style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${ORANGE}55`, background: speakingIdx === idx ? ORANGE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                {speakingIdx === idx
                                  ? <FaStop size={9} color="#fff" />
                                  : <FaVolumeUp size={10} color={ORANGE} />}
                              </button>
                            )}
                            <span style={{ color: pctColor(it.accuracyPercent), fontWeight: 700, fontSize: 12 }}>{it.scoreAwarded}/{it.marks} ({it.accuracyPercent}%)</span>
                          </div>
                        </div>
                        {isPerfect && (
                          <div style={{ color: '#16a34a', fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>✓ Perfect — matched every word.</div>
                        )}
                        {it.alignment && it.alignment.length > 0 ? (
                          <>
                            <div style={{ background: '#eff6ff', borderLeft: '3px solid #2563eb', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 6 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2563eb' }}>EXPECTED</span>
                              <div style={{ marginTop: 2 }}>
                                {expectedTokens.map((t, ti) => {
                                  const wrong = t.type === 'missing' || t.type === 'substitution'
                                  return <span key={ti} style={wrong ? { color: '#dc2626', fontWeight: 700 } : undefined}>{t.type === 'match' ? t.word : t.expected} </span>
                                })}
                              </div>
                            </div>
                            <div style={{ background: '#f5f3ff', borderLeft: '3px solid #7c3aed', borderRadius: '0 8px 8px 0', padding: '6px 10px' }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed' }}>STUDENT SAID</span>
                              <div style={{ marginTop: 2 }}>
                                {it.transcript.trim() === '' ? (
                                  <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(nothing captured)</span>
                                ) : saidTokens.map((t, ti) => {
                                  const wrong = t.type === 'extra' || t.type === 'substitution'
                                  return <span key={ti} style={wrong ? { color: '#dc2626', fontWeight: 700 } : undefined}>{t.type === 'match' ? t.word : t.said} </span>
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12 }}>
                            <div style={{ color: PAGE_GRAY, marginBottom: 3 }}>Expected: <span style={{ color: PAGE_TEXT }}>{it.expectedSentence}</span></div>
                            <div style={{ color: PAGE_GRAY }}>You said: <span style={{ color: PAGE_TEXT }}>{it.transcript || '(nothing captured)'}</span></div>
                          </div>
                        )}
                        {!isPerfect && it.pronunciationFeedback && (
                          <div style={{ background: '#fff7ed', borderLeft: '3px solid #ea580c', borderRadius: '0 8px 8px 0', padding: '8px 10px', marginTop: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                              <FaGraduationCap size={11} color="#ea580c" />
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ea580c' }}>PRONUNCIATION TIPS</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#7c2d12', lineHeight: 1.5, whiteSpace: 'pre-line' as const }}>{it.pronunciationFeedback}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {(speakingFeedbackDetail[openSpeakingFeedbackFor] as SpeakingSubmissionDetail).items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1}</span>
                        <span style={{ color: pctColor(Math.round((it.scoreAwarded / it.marks) * 100)), fontWeight: 700, fontSize: 12 }}>{it.scoreAwarded}/{it.marks} ({Math.round((it.scoreAwarded / it.marks) * 100)}%)</span>
                      </div>
                      <div style={{ background: '#eff6ff', borderLeft: '3px solid #2563eb', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2563eb' }}>TOPIC</span>
                        <div style={{ marginTop: 2 }}>{it.topic}</div>
                      </div>
                      <div style={{ background: '#f5f3ff', borderLeft: '3px solid #7c3aed', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed' }}>WHAT YOU SAID</span>
                        <div style={{ marginTop: 2 }}>
                          {it.transcript.trim() ? it.transcript : <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>(nothing captured)</span>}
                        </div>
                      </div>
                      <div style={{ background: '#fff7ed', borderLeft: '3px solid #ea580c', borderRadius: '0 8px 8px 0', padding: '6px 10px', marginBottom: it.sampleAnswer ? 6 : 0 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ea580c' }}>AI FEEDBACK</span>
                        <div style={{ marginTop: 2 }}>{it.feedback || 'No feedback available.'}</div>
                      </div>
                      {it.sampleAnswer && (
                        <div style={{ background: '#f0fdf4', borderLeft: '3px solid #16a34a', borderRadius: '0 8px 8px 0', padding: '6px 10px' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#16a34a' }}>SAMPLE ANSWER</span>
                          <div style={{ marginTop: 2 }}>{it.sampleAnswer}</div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {(grammarDetail[openGrammarFor] as GrammarSubmissionDetail).items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1} · {it.category}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: it.isCorrect ? '#16a34a' : '#dc2626' }}>
                          {it.isCorrect ? <FaCheckCircle size={11} /> : <FaTimes size={11} />}
                          {it.scoreAwarded}/{it.marks}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: PAGE_TEXT, marginBottom: 8, fontWeight: 600 }}>{it.question}</div>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginBottom: 4 }}>
                        <strong>Your answer:</strong> {it.studentAnswer || <em>(not answered)</em>}
                      </div>
                      {!it.isCorrect && (
                        <div style={{ fontSize: 11.5, color: '#16a34a' }}>
                          <strong>Correct answer:</strong> {it.correctAnswer}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 10, alignItems: 'start' }}>
                  {(passageDetail[openPassageFor] as PassageSubmissionDetail).items.map((it, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: PAGE_TEXT, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: it.isCorrect ? '#16a34a' : '#dc2626' }}>
                          {it.isCorrect ? <FaCheckCircle size={11} /> : <FaTimes size={11} />}
                          {it.scoreAwarded}/{it.marks}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: PAGE_TEXT, marginBottom: 8, fontWeight: 600 }}>{it.question}</div>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginBottom: 4 }}>
                        <strong>Your answer:</strong> {it.studentAnswer || <em>(not answered)</em>}
                      </div>
                      {!it.isCorrect && (
                        <div style={{ fontSize: 11.5, color: '#16a34a' }}>
                          <strong>Correct answer:</strong> {it.correctAnswer}
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
