import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { useProfile } from './hooks/useProfile'
import { useEnglishDashboardHistory } from './hooks/useEnglishDashboardHistory'
import { FiMic, FiEdit3, FiHeadphones, FiBook, FiZap, FiAward, FiTrendingUp, FiPlayCircle, FiBookOpen, FiThumbsUp } from 'react-icons/fi'
import { MdOutlineTimer } from 'react-icons/md'
import { BsTrophyFill, BsFire } from 'react-icons/bs'
import { RiMoonLine } from 'react-icons/ri'
import StudentProgressView, { SectionRow } from '@/components/dashboard/StudentProgressView'
import { FiBriefcase, FiAlertTriangle, FiCalendar, FiSun, FiInfo, FiBookmark, FiMapPin, FiArrowRight } from 'react-icons/fi'
import { FaTrophy, FaGraduationCap, FaMedal, FaStar, FaCertificate, FaBriefcase as FaBriefcaseSolid } from 'react-icons/fa'
import { CountUp } from '@/components/dashboard/CountUp'
import type { Report } from '@/components/dashboard/studentReportData'

// Daily study time message: icon + text on one line
const studyTip = (color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, color, fontWeight: 600 })

// ─── Constants ────────────────────────────────────────────────────────────────
// These read from CSS custom properties (set by StudentLayout based on the
// light/dark toggle) with light-mode values as the fallback, so the whole
// page re-themes without every inline style block needing to change.
const ORANGE = '#ff7a00'
const BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_BG = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG = 'var(--dash-card-bg, #ffffff)'
const TEXT = 'var(--dash-text, #0f172a)'
const GRAY = 'var(--dash-gray, #64748b)'
const GREEN = '#10b981'
const CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.07)'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtH = (h: number) => {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  if (h === 0) return '0m'
  if (hrs === 0) return `${min}m`
  if (min === 0) return `${hrs}h`
  return `${hrs}h ${min}m`
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000)
  if (diff < 1) return 'Just now'
  if (diff < 24) return `${diff}h ago`
  const days = Math.floor(diff / 24)
  return days === 1 ? '1d ago' : `${days}d ago`
}

// ─── Section header inside cards ──────────────────────────────────────────────
const CardHeader = ({ title, sub, action, to }: { title: string; sub?: string; action?: string; to?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>{title}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: GRAY }}>{sub}</div>}
    </div>
    {action && (
      <Link to={to || '#'} style={{ fontSize: '0.76rem', color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>
        {action}
      </Link>
    )}
  </div>
)

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: CARD_BG, borderRadius: 14, padding: 18, boxShadow: CARD_SHADOW, border: `1px solid ${BORDER}`, ...style }}>
    {children}
  </div>
)

// ─── Thin progress bar ────────────────────────────────────────────────────────
const Bar = ({ pct, color = ORANGE }: { pct: number; color?: string }) => (
  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
  </div>
)

// ─── Bar Chart (TimeSheet) ────────────────────────────────────────────────────
const BarChart = ({ days }: { days: { label: string; hours: number; isToday?: boolean }[] }) => {
  const maxH = Math.max(...days.map(d => d.hours), 1)
  const Y_LABELS = [4, 3, 2, 1, 0]
  const CHART_H = 90

  return (
    <div style={{ display: 'flex', gap: 8, height: CHART_H + 36 }}>
      {/* Y-axis */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 22, width: 24, flexShrink: 0 }}>
        {Y_LABELS.map(v => (
          <span key={v} style={{ fontSize: '0.62rem', color: '#94a3b8', textAlign: 'right', lineHeight: 1 }}>{v}h</span>
        ))}
      </div>
      {/* Bars */}
      <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'flex-end', paddingBottom: 0 }}>
        {days.map((d, i) => {
          const barH = d.hours > 0 ? Math.max((d.hours / (maxH || 1)) * CHART_H, 8) : 0
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Value label on top of bar */}
              <span style={{ fontSize: '0.58rem', color: d.isToday ? ORANGE : '#94a3b8', fontWeight: d.isToday ? 700 : 400, visibility: d.hours > 0 ? 'visible' : 'hidden' }}>
                {fmtH(d.hours)}
              </span>
              <div style={{ width: '100%', height: CHART_H, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '100%', height: barH,
                  background: d.isToday ? ORANGE : `${ORANGE}99`,
                  borderRadius: '4px 4px 0 0',
                  minHeight: d.hours > 0 ? 4 : 0,
                }} />
              </div>
              <span style={{ fontSize: '0.62rem', color: d.isToday ? ORANGE : '#94a3b8', fontWeight: d.isToday ? 700 : 400, textAlign: 'center' }}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Stat Card (icon-left, text-right) ────────────────────────────────────────
const StatCard = ({ iconBg, icon, label, value, customValue, sub }: {
  iconBg: string; icon: React.ReactNode; label: string
  value: string | null; customValue?: React.ReactNode; sub?: React.ReactNode
}) => (
  <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, height: '100%', boxSizing: 'border-box', minWidth: 0 }}>
    <div style={{ width: 46, height: 46, background: iconBg, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.71rem', color: GRAY, marginBottom: 3, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      {customValue || (
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: TEXT, lineHeight: 1.1, marginBottom: 4, whiteSpace: 'nowrap' }}><CountUp text={value} /></div>
      )}
      {sub && <div style={{ fontSize: '0.71rem' }}>{sub}</div>}
    </div>
  </div>
)

// ─── Main Component ────────────────────────────────────────────────────────────
const StudentDashboardUpdated: React.FC = () => {
  const { user } = useAuthContext()
  const { profile, loading: profileLoading } = useProfile()
  const { data: engData } = useEnglishDashboardHistory()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // The student's own progress report (same rows as the admin progress view). The server
  // ignores the userId and always returns the logged-in student's report.
  const fetchMyReport = async (_id: string, from?: string, to?: string): Promise<Report | null> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`${baseURL}/api/institute/student-report?${params}`, { headers: { Authorization: `Bearer ${user?.token}` } })
    const d = await res.json()
    if (!d.success) throw new Error(d.message || 'Could not load your progress')
    return d.report as Report
  }

  const [heroEl, setHeroEl] = useState<HTMLDivElement | null>(null)
  const [dashSummary, setDashSummary] = useState<any>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [timesheetRecords, setTimesheetRecords] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [hrJobs, setHrJobs] = useState<any[]>([])
  const [externalJobs, setExternalJobs] = useState<any[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  // External job feed (same API as the Jobs page); HR jobs are shown first, then these, max 8
  useEffect(() => {
    if (!user?.token) return
    let cancelled = false
    setJobsLoading(true)
    fetch(`${baseURL}/api/jobs/external?${new URLSearchParams({ category: 'all', query: '', location: '', page: '1' })}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setExternalJobs(Array.isArray(d.jobs) ? d.jobs : []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setJobsLoading(false) })
    return () => { cancelled = true }
  }, [user?.token, baseURL])

  const [resumeData, setResumeData] = useState<any>(null)
  const [topicLimits, setTopicLimits] = useState<Record<string, any>>({})
  const [selectedTopic, setSelectedTopic] = useState('')
  const [aiTab, setAiTab] = useState<'resume' | 'topic'>('resume')
  const [annAchTab, setAnnAchTab] = useState<'announcements' | 'achievements'>('achievements')
  const [instituteAchievements, setInstituteAchievements] = useState<any[]>([])
  const [achModal, setAchModal] = useState<any>(null)
  const [codeStats, setCodeStats] = useState({ total: 0, completed: 0, easy: 0, medium: 0, hard: 0, topProblems: [] as { title: string; difficulty: string }[] })
  const [tsFilter, setTsFilter] = useState<'week' | 'month' | 'history'>('week')
  const [historyMonth, setHistoryMonth] = useState('')   // 'YYYY-MM'
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)  // 1–5
  const [loading, setLoading] = useState(true)
  const [aptitudeData, setAptitudeData] = useState<{ days: any[]; stats: { totalAttended: number; streak: number; avgScore: number } } | null>(null)
  const [aptitudeMonth, setAptitudeMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

  // Success story widget
  const [myStory, setMyStory] = useState<{ status: string } | null | undefined>(undefined) // undefined = not fetched yet
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [storyText, setStoryText] = useState('')
  const [storyRating, setStoryRating] = useState(0)
  const [storyHoverRating, setStoryHoverRating] = useState(0)
  const [submittingStory, setSubmittingStory] = useState(false)
  const [storyError, setStoryError] = useState('')
  const [improvingStory, setImprovingStory] = useState(false)
  const [preImproveText, setPreImproveText] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}/success-stories/mine`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => setMyStory(data?.story || null))
      .catch(() => setMyStory(null))
  }, [user?.token, baseURL])

  const handleSubmitStory = async () => {
    setStoryError('')
    if (!storyText.trim() || storyRating === 0) {
      setStoryError('Please share your story and pick a star rating.')
      return
    }
    setSubmittingStory(true)
    try {
      const res = await fetch(`${baseURL}/success-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ story: storyText, rating: storyRating }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      const data = await res.json()
      setMyStory(data.story)
      setShowStoryModal(false)
      setStoryText('')
      setStoryRating(0)
      setPreImproveText(null)
    } catch {
      setStoryError('Failed to submit your story. Please try again.')
    } finally {
      setSubmittingStory(false)
    }
  }

  const handleImproveStory = async () => {
    if (!storyText.trim()) {
      setStoryError('Write a bit about your experience first — then AI can help polish it.')
      return
    }
    setStoryError('')
    setImprovingStory(true)
    try {
      const res = await fetch(`${baseURL}/success-stories/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ text: storyText }),
      })
      if (!res.ok) throw new Error('Failed to improve')
      const data = await res.json()
      setPreImproveText(storyText)
      setStoryText(data.improved)
    } catch {
      setStoryError('Could not improve the story right now. Please try again.')
    } finally {
      setImprovingStory(false)
    }
  }

  useEffect(() => {
    if (!user?.token) return
    const h = { Authorization: `Bearer ${user.token}` }
    const now = new Date()

    Promise.allSettled([
      fetch(`${baseURL}/dashboard/summary`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/enrollments/me`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/session/timesheet?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/institute/announcements`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/jobs/student`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/resume-based-interview/my-results`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/interview/limits`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/ai/me`, { headers: h }).then(r => r.json()),
      // Dashboard only needs title/difficulty to tally easy/medium/hard counts —
      // /summary skips the desc/testCases fields that make the full list slow.
      // verified=true keeps these counts consistent with what the problem list itself shows —
      // students shouldn't see a count that includes problems they can't actually access yet.
      fetch(`${baseURL}/api/dashboard/adminProblems/summary?verified=true`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/institute/achievements`, { headers: h }).then(r => r.json()),
    ]).then(([sumR, enrR, tsR, annR, jobR, resR, limR, mySubR, allProblemsR, achR]) => {
      if (sumR.status === 'fulfilled') setDashSummary(sumR.value)
      if (enrR.status === 'fulfilled') {
        const raw = Array.isArray(enrR.value) ? enrR.value : []
        setEnrolledCourses(raw.map((e: any) => ({
          name: e.courseId?.title || 'Course',
          progress: Number(e.courseProgress || 0),
        })).slice(0, 5))
      }
      if (tsR.status === 'fulfilled') setTimesheetRecords(Array.isArray(tsR.value) ? tsR.value : [])
      if (annR.status === 'fulfilled') setAnnouncements((annR.value?.data || []).slice(0, 3))
      if (achR.status === 'fulfilled') setInstituteAchievements((achR.value?.data || []).slice(0, 4))
      if (jobR.status === 'fulfilled') {
        const raw: any[] = Array.isArray(jobR.value) ? jobR.value : (jobR.value?.data || jobR.value?.jobs || [])
        setHrJobs(raw.filter((j: any) => !j.isExpired).slice(0, 4))
      }
      if (resR.status === 'fulfilled') setResumeData(resR.value)
      if (limR.status === 'fulfilled') {
        const limits = limR.value?.limits || {}
        setTopicLimits(limits)
        const firstTopic = Object.keys(limits)[0] || ''
        setSelectedTopic(firstTopic)
      }
      // Build code challenge stats from student's own submissions + all problems list
      if (mySubR.status === 'fulfilled' && allProblemsR.status === 'fulfilled') {
        const allProblems: any[] = Array.isArray(allProblemsR.value) ? allProblemsR.value : []
        const mySubs: any[] = Array.isArray(mySubR.value?.data) ? mySubR.value.data : []
        const acceptedIds = new Set(
          mySubs
            .filter((s: any) => s.verdict === 'ACCEPTED' && s.isBestSubmission === true)
            .map((s: any) => String(s.problemId))
        )
        const diffMap: Record<string, string> = {}
        allProblems.forEach((p: any, idx: number) => {
          diffMap[String(idx + 1)] = p.difficulty || 'Easy'
          diffMap[String(p._id)] = p.difficulty || 'Easy'
        })
        let easy = 0, medium = 0, hard = 0
        const top: { title: string; difficulty: string }[] = []
        acceptedIds.forEach(id => {
          const diff = diffMap[id] || 'Easy'
          if (diff === 'Easy') easy++
          else if (diff === 'Medium') medium++
          else hard++
          const prob = allProblems.find((p: any, idx: number) => String(idx + 1) === id || String(p._id) === id)
          if (prob) top.push({ title: prob.title, difficulty: diff })
        })
        setCodeStats({ total: allProblems.length, completed: acceptedIds.size, easy, medium, hard, topProblems: top.slice(0, 3) })
      }
    }).finally(() => setLoading(false))
  }, [user?.token, baseURL])

  // ── Fetch Daily Aptitude Calendar ──
  useEffect(() => {
    if (!user?.token || !aptitudeMonth) return
    const [yr, mo] = aptitudeMonth.split('-').map(Number)
    fetch(`${baseURL}/api/student/daily-aptitude/calendar?year=${yr}&month=${mo}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    }).then(r => r.json()).then(d => { if (d.success) setAptitudeData(d) }).catch(() => {})
  }, [user?.token, baseURL, aptitudeMonth])

  // ── Fetch history month on demand ──
  useEffect(() => {
    if (!historyMonth || !user?.token) return
    const [yr, mo] = historyMonth.split('-').map(Number)
    setHistoryLoading(true)
    fetch(`${baseURL}/api/session/timesheet?month=${mo}&year=${yr}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    }).then(r => r.json()).then(data => {
      setHistoryRecords(Array.isArray(data) ? data : [])
    }).finally(() => setHistoryLoading(false))
  }, [historyMonth, user?.token, baseURL])

  // ── Derived values ──
  const firstName = profile?.fullName?.split(' ')[0] || 'Student'
  const completion = profile?.completion || 0
  const coursesAvailable = dashSummary?.coursesAvailable?.value || 0
  const accuracy = dashSummary?.accuracy?.value || '—'
  const accuracyTrend = dashSummary?.accuracy?.trend || ''
  const instituteRank = dashSummary?.rank?.instituteValue || 'N/A'
  const instituteTotal = dashSummary?.rank?.instituteTotal || ''
  const overallRank = dashSummary?.rank?.overallValue || 'N/A'
  const overallTotal = dashSummary?.rank?.overallTotal || ''
  const rankTrend = dashSummary?.rank?.trend || ''
  const enrolledCount = dashSummary?.enrolledCourses?.value || enrolledCourses.length
  const totalProblems = codeStats.total
  const completedChallenges = codeStats.completed
  const topProblems = codeStats.topProblems

  // Timesheet last 7 days
  const last7 = (() => {
    const today = new Date().toISOString().slice(0, 10)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const rec = timesheetRecords.find(r => r.date === dateStr)
      return {
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        hours: rec?.hours || 0,
        isToday: dateStr === today,
      }
    })
  })()

  const weeklyTotal = last7.reduce((s, d) => s + d.hours, 0)
  const monthlyTotal = timesheetRecords.reduce((s, r) => s + (r.hours || 0), 0)
  const presentDays = timesheetRecords.filter(r => r.isPresent)
  const avgPerDay = presentDays.length > 0 ? monthlyTotal / presentDays.length : 0
  const bestDayRec = timesheetRecords.reduce<any>((b, r) => (r.hours > (b?.hours || 0) ? r : b), null)
  const todayHours = last7.find(d => d.isToday)?.hours || 0

  // Helper: group records by week bands W1–W5
  const groupByWeek = (records: any[], markCurrentWeek: boolean) => {
    const bands = [
      { label: 'W1', from: 1,  to: 7  },
      { label: 'W2', from: 8,  to: 14 },
      { label: 'W3', from: 15, to: 21 },
      { label: 'W4', from: 22, to: 28 },
      { label: 'W5', from: 29, to: 31 },
    ]
    const curWeekNum = (() => { const d = new Date().getDate(); return d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : d <= 28 ? 3 : 4 })()
    return bands.map((b, idx) => {
      const total = records.filter(r => {
        const day = new Date(r.date + 'T00:00:00').getDate()
        return day >= b.from && day <= b.to
      }).reduce((s, r) => s + (r.hours || 0), 0)
      return { label: b.label, hours: total, isToday: markCurrentWeek && idx === curWeekNum }
    }).filter((w, idx) => w.hours > 0 || idx === 0)
  }

  const monthWeeks    = groupByWeek(timesheetRecords, true)
  const historyWeeks  = groupByWeek(historyRecords, false)
  const historyTotal  = historyRecords.reduce((s, r) => s + (r.hours || 0), 0)
  const historyLabel  = historyMonth
    ? (() => { const [yr, mo] = historyMonth.split('-').map(Number); return new Date(yr, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) })()
    : ''

  // Past 12 months for dropdown
  const pastMonthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1 - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value: val, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
  })

  // Study streak: consecutive days with hours > 0 (this month only; extends with history if same month)
  const studyStreak = (() => {
    let streak = 0
    for (let i = 0; i < 31; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const rec = timesheetRecords.find(r => r.date === dateStr)
      if (rec && rec.hours > 0) streak++
      else if (i > 0) break
    }
    return streak
  })()

  // Week breakdown for the right panel
  const activeMonthRecords = tsFilter === 'history' ? historyRecords : timesheetRecords
  const weekPanelRefDate = (() => {
    if (tsFilter === 'history' && historyMonth) {
      const [yr, mo] = historyMonth.split('-').map(Number)
      return new Date(yr, mo - 1, 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })()
  const daysInRefMonth = new Date(weekPanelRefDate.getFullYear(), weekPanelRefDate.getMonth() + 1, 0).getDate()

  const weekSummaries = [
    { idx: 1, label: 'W1', from: 1,  to: Math.min(7,  daysInRefMonth) },
    { idx: 2, label: 'W2', from: 8,  to: Math.min(14, daysInRefMonth) },
    { idx: 3, label: 'W3', from: 15, to: Math.min(21, daysInRefMonth) },
    { idx: 4, label: 'W4', from: 22, to: Math.min(28, daysInRefMonth) },
    { idx: 5, label: 'W5', from: 29, to: daysInRefMonth },
  ].filter(b => b.from <= daysInRefMonth && b.from <= b.to)
   .map(b => {
    const recs = activeMonthRecords.filter(r => {
      const day = new Date(r.date + 'T00:00:00').getDate()
      return day >= b.from && day <= b.to
    })
    const total = recs.reduce((s, r) => s + (r.hours || 0), 0)
    const activeDays = recs.filter(r => r.hours > 0).length
    const mo = weekPanelRefDate.toLocaleDateString('en-IN', { month: 'short' })
    return { ...b, total, activeDays, range: `${b.from}–${b.to} ${mo}` }
  })
  const maxWeekHours = Math.max(...weekSummaries.map(w => w.total), 1)

  // Drill-down: daily bars for selected week
  const drillDays = selectedWeek ? (() => {
    const ws = weekSummaries.find(w => w.idx === selectedWeek)
    if (!ws) return null
    const yr = weekPanelRefDate.getFullYear()
    const mo = weekPanelRefDate.getMonth()
    const todayStr = new Date().toISOString().slice(0, 10)
    return Array.from({ length: ws.to - ws.from + 1 }, (_, i) => {
      const day = ws.from + i
      const d = new Date(yr, mo, day)
      if (d > new Date()) return null
      const dateStr = d.toISOString().slice(0, 10)
      const rec = activeMonthRecords.find(r => r.date === dateStr)
      return { label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), hours: rec?.hours || 0, isToday: dateStr === todayStr }
    }).filter(Boolean) as { label: string; hours: number; isToday: boolean }[]
  })() : null

  // AI Interview topics
  const topics = Object.keys(topicLimits)

  // Overall course progress
  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((s, c) => s + c.progress, 0) / enrolledCourses.length)
    : 0

  const ANNOUNCE_ICON: Record<string, string> = {
    urgent: '🚨', event: '🎉', holiday: '🌸', info: '📢', general: '📌',
  }

  if (loading || profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid #f1f5f9`, borderTop: `3px solid ${ORANGE}`, borderRadius: '50%', animation: 'sd-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: GRAY, fontSize: '0.85rem' }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes sd-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // HR jobs first, then the external feed (fetched above), max 8
  const MAX_JOBS = 8
  const jobList = [
    ...hrJobs.map((j) => ({ key: `hr-${j._id || j.title}`, title: j.title, company: j.company, location: j.location?.trim(), logo: j.logo, posted: j.postedDate, source: 'HR', href: '/student/interview-details', external: false })),
    ...externalJobs.map((j) => ({ key: `ex-${j.id}`, title: j.title, company: j.company, location: j.isRemote ? 'Remote' : j.location, logo: j.logo, posted: j.postedAt, source: j.source || 'External', href: j.applyUrl, external: true })),
  ].slice(0, MAX_JOBS)

  // Announcement / achievement types → icon + colour
  const ANN_META: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; label: string }> = {
    urgent: { icon: FiAlertTriangle, color: '#ef4444', label: 'Urgent' },
    event: { icon: FiCalendar, color: '#8b5cf6', label: 'Event' },
    holiday: { icon: FiSun, color: '#f59e0b', label: 'Holiday' },
    info: { icon: FiInfo, color: '#3b82f6', label: 'Information' },
    general: { icon: FiBookmark, color: '#64748b', label: 'Announcement' },
  }
  const ACH_META: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string }> = {
    academic: { icon: FaGraduationCap, color: '#f59e0b' },
    sports: { icon: FaMedal, color: '#10b981' },
    placement: { icon: FaBriefcaseSolid, color: '#3b82f6' },
    extracurricular: { icon: FaStar, color: '#ec4899' },
    certification: { icon: FaCertificate, color: '#8b5cf6' },
    general: { icon: FaStar, color: '#ff7a00' },
  }

  // Stat cards shown beside the overall progress ring at the top
  const statCards = (
    <>

          {/* Available Courses */}
          <StatCard
            iconBg="#fff7ed"
            icon={<svg width="26" height="26" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/>
            </svg>}
            label="Available Courses"
            value={String(coursesAvailable || enrolledCount)}
            sub={<Link to="/student/available-courses" style={{ fontSize: '0.72rem', color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Explore Now →</Link>}
          />

          {/* Rank — Institute + Overall */}
          <StatCard
            iconBg="#fefce8"
            icon={<svg width="26" height="26" fill="none" stroke="#f59e0b" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
            </svg>}
            label="Rank"
            value={null}
            customValue={
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.63rem', color: GRAY, width: 44, flexShrink: 0 }}>Institute</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}><CountUp text={instituteRank} /></span>
                  {instituteTotal && <span style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>/ {instituteTotal}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.63rem', color: GRAY, width: 44, flexShrink: 0 }}>Overall</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: TEXT }}><CountUp text={overallRank} /></span>
                  {overallTotal && <span style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>/ {overallTotal}</span>}
                </div>
              </div>
            }
            sub={rankTrend ? <span style={{ color: GREEN, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><FiTrendingUp size={12} /> {rankTrend}</span> : null}
          />

          {/* Accuracy */}
          <StatCard
            iconBg="#ecfdf5"
            icon={<svg width="26" height="26" fill="none" stroke={GREEN} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>}
            label="Accuracy"
            value={accuracy}
            sub={accuracyTrend && accuracyTrend !== 'NA'
              ? <span style={{ color: GREEN, fontWeight: 600 }}>↑ {accuracyTrend} this month</span>
              : <span style={{ color: GRAY }}>Keep practicing!</span>
            }
          />

          {/* Code Challenges */}
          <StatCard
            iconBg="#f0f9ff"
            icon={<svg width="26" height="26" fill="none" stroke="#0ea5e9" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>}
            label="Code Challenges"
            value={String(totalProblems)}
            sub={<span style={{ color: '#0ea5e9', fontWeight: 600 }}>Completed: {completedChallenges}</span>}
          />

          {/* Daily Study Time */}
          <StatCard
            iconBg="#fdf4ff"
            icon={<svg width="26" height="26" fill="none" stroke="#a855f7" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>}
            label="Daily Study Time"
            value={fmtH(todayHours)}
            sub={
              todayHours === 0
                ? <span style={studyTip('#f59e0b')}><FiPlayCircle size={13} /> Start studying today!</span>
                : todayHours < 0.5
                ? <span style={studyTip('#ef4444')}><FiBookOpen size={13} /> Try to study more!</span>
                : todayHours < 1
                ? <span style={studyTip('#3b82f6')}><FiThumbsUp size={13} /> Good progress, keep going!</span>
                : <span style={studyTip(GREEN)}><BsFire size={13} /> Excellent! Outstanding effort!</span>
            }
          />
    </>
  )

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: '"Segoe UI", system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        .sd-tab-btn { background: none; border: none; cursor: pointer; padding: 8px 16px; font-size: 0.82rem; font-weight: 500; color: ${GRAY}; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .sd-tab-btn.active { color: ${ORANGE}; border-bottom-color: ${ORANGE}; font-weight: 700; }
        .sd-tab-btn:hover:not(.active) { color: ${TEXT}; }
        .sd-check { width: 16px; height: 16px; border-radius: 50%; background: ${ORANGE}18; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0; }
        .sd-hero-slot { padding: 16px 28px 4px; background: ${CARD_BG}; }
      .sd-hero-slot:empty { display: none; }
      .sd-hero-slot .spx-hero { padding: 14px; }
      /* same 1rem gap as between the progress rows (padding: .spx-wrap resets margin) */
      .sd-extra-rows { padding-top: 1rem; }
      .sd-col-title { margin: 0 0 0.85rem; color: var(--dash-gray, #64748b); font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
      .sd-news-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; align-items: stretch !important; }
      .spx-row-main > .sd-news-grid { flex: 1; }
      .sd-news-grid > div { display: flex; flex-direction: column; padding-top: 0.35rem; }
      /* empty messages sit in the middle of their column */
      .sd-news-grid .spx-empty { margin: auto 0; padding-bottom: 1.5rem; text-align: center; }
      .sd-list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
      .sd-list li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid ${BORDER}; border-radius: 10px; background: color-mix(in srgb, var(--c) 5%, transparent); }
      .sd-avatar { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; overflow: hidden; border-radius: 50%; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); font-size: 0.85rem; }
      .sd-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .sd-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 9px; background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); }
      .sd-list-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .sd-list-text strong { overflow: hidden; color: ${TEXT}; font-size: 0.8rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
      .sd-list-text small { overflow: hidden; color: ${GRAY}; font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }
      .sd-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; background: color-mix(in srgb, var(--c) 12%, transparent); color: var(--c); font-size: 0.64rem; font-weight: 700; text-transform: capitalize; white-space: nowrap; }
      .sd-link-btn { padding: 3px 10px; border: 1px solid ${ORANGE}55; border-radius: 99px; background: transparent; color: ${ORANGE}; font-size: 0.66rem; font-weight: 700; cursor: pointer; }
      .sd-link-btn:hover { background: ${ORANGE}14; }
      .sd-time { flex-shrink: 0; color: ${GRAY}; font-size: 0.66rem; white-space: nowrap; }
      .sd-empty { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 160px; color: ${GRAY}; font-size: 0.84rem; text-align: center; }
      .sd-empty svg { color: #0ea5e9; opacity: 0.6; }
      .spx-row-main:has(> .sd-empty) { justify-content: center; }
      .sd-job-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
      .sd-src { padding: 1px 8px; border-radius: 99px; background: rgba(100,116,139,0.12); color: ${GRAY}; font-size: 0.62rem; font-weight: 700; white-space: nowrap; text-transform: capitalize; }
      .sd-src.is-hr { background: rgba(14,165,233,0.12); color: #0284c7; }
      .sd-jobs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
      .sd-jobs a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid ${BORDER}; border-radius: 12px; text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
      .sd-jobs a:hover { border-color: #0ea5e966; box-shadow: 0 4px 14px rgba(14,165,233,0.1); }
      .sd-logo { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; overflow: hidden; border-radius: 10px; background: rgba(14,165,233,0.1); color: #0ea5e9; }
      .sd-logo img { width: 26px; height: 26px; object-fit: contain; }
      .sd-list-text small svg { vertical-align: -1px; }
      @media (max-width: 1199.98px) { .sd-news-grid { grid-template-columns: 1fr !important; } }
      @media (max-width: 767.98px) { .sd-jobs { grid-template-columns: 1fr; } }
      .sd-progress-block { padding: 18px 28px 22px; background: ${CARD_BG}; border-bottom: 1px solid ${BORDER}; }
      .sd-eng-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: 12px; margin-bottom: 12px; }
      .sd-eng-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px 12px; border: 1px solid #f1f5f9; border-radius: 12px; background: #fcfcfd; min-width: 0; text-align: center; }
      .sd-eng-tile > div:last-child > div:first-child { justify-content: center; }
      .sd-eng-summary { gap: 0; border-color: #fed7aa; background: #fff7ed; }
      @media (max-width: 1280px) { .sd-eng-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 575px) { .sd-eng-grid { grid-template-columns: 1fr; } }
      .sd-check::after { content: '✓'; font-size: 9px; color: ${ORANGE}; font-weight: 800; }
        .sd-topic-select { width: 100%; border: 1px solid ${BORDER}; border-radius: 8px; padding: 9px 12px; font-size: 0.82rem; color: ${TEXT}; background: ${CARD_BG}; appearance: none; cursor: pointer; outline: none; }
        .sd-topic-select:focus { border-color: ${ORANGE}; box-shadow: 0 0 0 2px ${ORANGE}18; }
        .sd-btn-orange { background: ${ORANGE}; color: #fff; border: none; border-radius: 9px; padding: 10px 18px; font-size: 0.82rem; font-weight: 600; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .sd-btn-orange:hover { background: #e06800; }
        .sd-btn-outline { background: transparent; color: ${ORANGE}; border: 1.5px solid ${ORANGE}; border-radius: 9px; padding: 10px 18px; font-size: 0.82rem; font-weight: 600; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .sd-btn-outline:hover { background: ${ORANGE}08; }
        .sd-job-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid ${BORDER}; }
        .sd-job-row:last-child { border-bottom: none; }
        .sd-ann-row { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
        .sd-ann-row:last-child { border-bottom: none; }
        .sd-course-row { margin-bottom: 12px; }
        .sd-badge-card { background: ${PAGE_BG}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 12px; text-align: center; flex: 1; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: TEXT, whiteSpace: 'nowrap' }}>
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY, whiteSpace: 'nowrap' }}>
              Let's learn, practice and achieve your career goals today.
            </p>
          </div>

          {/* Profile Completed — compact, beside the greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,122,0,0.1)', border: `1px solid ${ORANGE}33`, borderRadius: 10, padding: '6px 14px 6px 8px', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
              <svg width="34" height="34">
                <circle cx="17" cy="17" r="14" fill="none" stroke="#fde8cc" strokeWidth="4" />
                <circle cx="17" cy="17" r="14" fill="none" stroke={ORANGE} strokeWidth="4"
                  strokeDasharray={`${(completion / 100) * 2 * Math.PI * 14} ${2 * Math.PI * 14}`}
                  strokeDashoffset={2 * Math.PI * 14 * 0.25} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, color: TEXT }}>{completion}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' }}>Profile Completed</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>Complete it to unlock recommendations</div>
            </div>
            <Link to="/student/edit-profile" style={{ fontSize: '0.72rem', fontWeight: 700, color: ORANGE, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 2 }}>
              Complete →
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Rank + Avg Study */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '0 12px', height: 40 }}>
            <BsTrophyFill size={14} color={ORANGE} />
            <span style={{ fontSize: '0.75rem', color: GRAY, fontWeight: 500 }}>Rank</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT }}>{overallRank || '—'}</span>
            <div style={{ width: 1, height: 18, background: BORDER, margin: '0 2px' }} />
            <svg width="13" height="13" fill="none" stroke="#a855f7" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '0.75rem', color: GRAY, fontWeight: 500 }}>Avg/Day</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT }}>{fmtH(avgPerDay)}</span>
          </div>
        </div>
      </div>

      {/* ── STATS ROW: overall progress ring + the stat cards (rendered by My Progress below) ── */}
      <div ref={setHeroEl} className="sd-hero-slot" />

      {/* ════ My progress — one row per section (same view as the admin progress report) ════ */}
      {user?.token && (
        <div className="sd-progress-block">
          <StudentProgressView
            studentId={String(profile?.userId || profile?._id || 'me')}
            name={profile?.fullName || 'Your'}
            fetchReport={fetchMyReport}
            theme="light"
            title="My Progress"
            subtitle="Every section since you joined, month by month"
            heroTarget={heroEl}
            heroAside={statCards}
            aptitudeLink="/student/aptitude"
          />
          <div className="spx-root is-light">
            <div className="spx-wrap sd-extra-rows">
              {/* ── Student achievements & announcements ── */}
              <SectionRow
                icon={FaTrophy} color="#f59e0b" title="Achievements & News"
                headline={<div className="spx-headline"><b>{instituteAchievements.length}</b><span>recent achievement{instituteAchievements.length === 1 ? '' : 's'}</span></div>}
                scoreNote="Celebrating students from your institute, plus the latest announcements"
                stats={[
                  { label: 'Achievements', value: instituteAchievements.length },
                  { label: 'Announcements', value: announcements.length },
                  { label: 'Latest update', value: announcements[0]?.createdAt ? timeAgo(announcements[0].createdAt) : '—' },
                ]}
              >
                <div className="spx-main-grid sd-news-grid">
                  <div>
                    <h5 className="sd-col-title">Student achievements</h5>
                    {instituteAchievements.length === 0 ? (
                      <p className="spx-empty">No achievements yet.</p>
                    ) : (
                      <ul className="sd-list">
                        {instituteAchievements.map((a, i) => {
                          const meta = ACH_META[a.category] || ACH_META.general
                          const Icon = meta.icon
                          return (
                            <li key={a._id || i} style={{ ['--c' as any]: meta.color }}>
                              <span className="sd-avatar">
                                {a.studentPic ? <img src={a.studentPic} alt="" /> : <b>{a.studentName?.charAt(0)?.toUpperCase() || '?'}</b>}
                              </span>
                              <div className="sd-list-text">
                                <strong>{a.studentName}</strong>
                                <small>{a.title}</small>
                              </div>
                              <span className="sd-chip"><Icon size={10} /> {a.category || 'general'}</span>
                              <button type="button" className="sd-link-btn" onClick={() => setAchModal(a)}>View</button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="spx-sub">
                    <h5>Announcements</h5>
                    {announcements.length === 0 ? (
                      <p className="spx-empty">No announcements yet.</p>
                    ) : (
                      <ul className="sd-list">
                        {announcements.map((a, i) => {
                          const meta = ANN_META[a.type] || ANN_META.general
                          const Icon = meta.icon
                          return (
                            <li key={a._id || i} style={{ ['--c' as any]: meta.color }}>
                              <span className="sd-icon"><Icon size={14} /></span>
                              <div className="sd-list-text">
                                <strong>{a.title}</strong>
                                <small>{(a.description || '').replace(/<[^>]+>/g, '').trim() || meta.label}</small>
                              </div>
                              {a.createdAt && <span className="sd-time">{timeAgo(a.createdAt)}</span>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </SectionRow>

              {/* ── Latest jobs (HR first, then the external job feed) ── */}
              <SectionRow
                icon={FiBriefcase} color="#0ea5e9" title="Latest Jobs"
                headline={<div className="spx-headline"><b>{jobList.length}</b><span>latest opening{jobList.length === 1 ? '' : 's'}</span></div>}
                scoreNote="Jobs from HR partners first, then matching openings from job boards"
                stats={[
                  { label: 'By HR', value: hrJobs.length },
                  { label: 'From job boards', value: jobsLoading ? '…' : externalJobs.length },
                  { label: 'Companies', value: new Set(jobList.map((j) => j.company).filter(Boolean)).size },
                ]}
                action={<Link to="/student/interview-details">Browse all jobs <FiArrowRight size={13} /></Link>}
              >
                {jobsLoading && jobList.length === 0 ? (
                  <div className="sd-empty"><span className="spx-spin" /> Loading jobs…</div>
                ) : jobList.length === 0 ? (
                  <div className="sd-empty"><FiBriefcase size={22} /> No jobs available right now.</div>
                ) : (
                  <ul className="sd-jobs">
                    {jobList.map((job) => {
                      const inner = (
                        <>
                          <span className="sd-logo">
                            {job.logo
                              ? <img src={job.logo} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                              : <FaBriefcaseSolid size={14} />}
                          </span>
                          <div className="sd-list-text">
                            <strong title={job.title}>{job.title}</strong>
                            <small>{job.company}{job.location ? <> · <FiMapPin size={10} /> {job.location}</> : null}</small>
                          </div>
                          <div className="sd-job-meta">
                            <span className={`sd-src${job.source === 'HR' ? ' is-hr' : ''}`}>{job.source === 'HR' ? 'HR' : job.source}</span>
                            {job.posted && <span className="sd-time">{timeAgo(job.posted)}</span>}
                          </div>
                        </>
                      )
                      return (
                        <li key={job.key}>
                          {job.external
                            ? <a href={job.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                            : <Link to={job.href}>{inner}</Link>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </SectionRow>
            </div>
          </div>
        </div>
      )}


      {/* ── SUCCESS STORY PROMPT — only shown before the student has submitted
          a story; once submitted (any status), it's hidden for good. ── */}
      {myStory === null && (
        <div style={{ margin: '18px 28px 0', background: 'linear-gradient(135deg, rgba(255,122,0,0.1), rgba(255,122,0,0.05))', border: `1px solid ${ORANGE}33`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: CARD_BG, border: `1px solid ${ORANGE}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ORANGE, fontSize: '1.2rem' }}>
              🌟
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: TEXT }}>Share Your Success Story</div>
              <div style={{ fontSize: '0.76rem', color: GRAY }}>Tell us how Eklav has helped you — approved stories get featured on our homepage.</div>
            </div>
          </div>
          <button onClick={() => setShowStoryModal(true)} className="sd-btn-orange" style={{ width: 'auto', padding: '10px 20px', flexShrink: 0 }}>
            Share Your Story
          </button>
        </div>
      )}

      {/* Course, English, AI interview, code and time-sheet boxes were replaced by the My Progress rows above */}

      {/* Achievement detail modal */}
      {achModal && (() => {
        const CAT_COLORS: Record<string, string> = {
          academic: '#f59e0b', sports: '#10b981', placement: '#3b82f6',
          extracurricular: '#ec4899', certification: '#8b5cf6', general: '#ff7a00',
        }
        const CAT_ICONS: Record<string, string> = {
          academic: '🎓', sports: '🏆', placement: '💼',
          extracurricular: '🌟', certification: '📜', general: '⭐',
        }
        const color = CAT_COLORS[achModal.category] || '#ff7a00'
        const icon = CAT_ICONS[achModal.category] || '⭐'
        const bg = `linear-gradient(135deg, ${color}, ${color}bb)`
        return (
          <div onClick={() => setAchModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', background: CARD_BG, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.30)' }}>

              {/* ── Banner ── */}
              <div style={{ background: bg, padding: '28px 32px 24px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.10)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -20, left: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
                {/* Close */}
                <button onClick={() => setAchModal(null)} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, backdropFilter: 'blur(4px)' }}>×</button>
                {/* Category + date row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '3px 14px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize', letterSpacing: .4 }}>{icon} {achModal.category}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.7)', marginLeft: 'auto' }}>
                    {new Date(achModal.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {/* Title */}
                <h2 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 900, color: '#fff', lineHeight: 1.35, paddingRight: 40 }}>{achModal.title}</h2>
                {/* Student pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(255,255,255,.6)', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    {achModal.studentPic
                      ? <img src={achModal.studentPic} style={{ width: 48, height: 48, objectFit: 'cover' }} />
                      : achModal.studentName?.charAt(0)?.toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{achModal.studentName}</div>
                    {achModal.studentEmail && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.72)', marginTop: 2 }}>{achModal.studentEmail}</div>}
                  </div>
                </div>
              </div>

              {/* ── Body ── */}
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 32px' }}>
                {achModal.imageUrl && (
                  <img src={achModal.imageUrl} style={{ width: '100%', maxHeight: 180, borderRadius: 14, objectFit: 'cover', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,.10)' }} />
                )}
                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.9, wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: achModal.description }} />
              </div>

              {/* ── Footer ── */}
              <div style={{ padding: '14px 32px', borderTop: `1px solid ${BORDER}`, background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ fontSize: '0.78rem', color: GRAY }}>
                  {(achModal.likes?.length > 0) && <span>❤️ {achModal.likes.length} {achModal.likes.length === 1 ? 'like' : 'likes'}</span>}
                </div>
                <button onClick={() => setAchModal(null)} style={{ background: bg, border: 'none', borderRadius: 12, padding: '9px 28px', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: `0 4px 14px ${color}55` }}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Share Success Story Modal ── */}
      {showStoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowStoryModal(false)}>
          <div style={{ background: CARD_BG, borderRadius: 14, width: 480, maxWidth: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: TEXT }}>Share Your Success Story</span>
              <button onClick={() => setShowStoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GRAY, fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 22 }}>
              {storyError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8, marginBottom: 14 }}>{storyError}</div>}

              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Your Rating</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }} onMouseLeave={() => setStoryHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    onClick={() => setStoryRating(n)}
                    onMouseEnter={() => setStoryHoverRating(n)}
                    style={{ cursor: 'pointer', fontSize: '1.6rem', color: (storyHoverRating || storyRating) >= n ? '#f59e0b' : BORDER, lineHeight: 1 }}
                  >★</span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: TEXT }}>Your Story</label>
                <button
                  onClick={handleImproveStory}
                  disabled={improvingStory}
                  title="Ask AI to polish the wording — keeps your facts, just improves clarity and flow"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: ORANGE, fontSize: '0.76rem', fontWeight: 700, cursor: improvingStory ? 'default' : 'pointer', opacity: improvingStory ? 0.6 : 1 }}
                >
                  ✨ {improvingStory ? 'Improving…' : 'Improve with AI'}
                </button>
              </div>
              <textarea
                value={storyText}
                onChange={e => { setStoryText(e.target.value); setPreImproveText(null) }}
                placeholder="Tell us how Eklav helped you — a skill you learned, a job you landed, a habit you built..."
                rows={5}
                style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, fontSize: '0.85rem', color: TEXT, background: PAGE_BG, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
              {preImproveText !== null && (
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: GRAY }}>
                  Polished by AI —{' '}
                  <span
                    onClick={() => { setStoryText(preImproveText); setPreImproveText(null) }}
                    style={{ color: ORANGE, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Undo
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button onClick={() => setShowStoryModal(false)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD_BG, color: TEXT, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmitStory}
                  disabled={submittingStory}
                  style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: ORANGE, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: submittingStory ? 'default' : 'pointer', opacity: submittingStory ? 0.7 : 1 }}
                >
                  {submittingStory ? 'Submitting…' : 'Submit Story'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default StudentDashboardUpdated
