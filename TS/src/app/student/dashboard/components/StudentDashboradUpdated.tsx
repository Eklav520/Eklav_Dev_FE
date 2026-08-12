import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { useProfile } from './hooks/useProfile'
import { useEnglishDashboardHistory } from './hooks/useEnglishDashboardHistory'
import { FiMic, FiEdit3, FiHeadphones, FiBook, FiZap, FiAward, FiTrendingUp } from 'react-icons/fi'
import { MdOutlineTimer } from 'react-icons/md'
import { BsTrophyFill, BsFire } from 'react-icons/bs'
import { RiMoonLine } from 'react-icons/ri'

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
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: TEXT, lineHeight: 1.1, marginBottom: 4, whiteSpace: 'nowrap' }}>{value}</div>
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

  const [dashSummary, setDashSummary] = useState<any>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [timesheetRecords, setTimesheetRecords] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [hrJobs, setHrJobs] = useState<any[]>([])
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

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: '"Segoe UI", system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        .sd-tab-btn { background: none; border: none; cursor: pointer; padding: 8px 16px; font-size: 0.82rem; font-weight: 500; color: ${GRAY}; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .sd-tab-btn.active { color: ${ORANGE}; border-bottom-color: ${ORANGE}; font-weight: 700; }
        .sd-tab-btn:hover:not(.active) { color: ${TEXT}; }
        .sd-check { width: 16px; height: 16px; border-radius: 50%; background: ${ORANGE}18; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0; }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: `1px solid ${ORANGE}33`, borderRadius: 10, padding: '6px 14px 6px 8px', flexShrink: 0 }}>
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

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', alignItems: 'stretch', gap: 14, padding: '16px 28px 20px', background: CARD_BG, borderBottom: `1px solid ${BORDER}` }}>

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
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b' }}>{instituteRank}</span>
                {instituteTotal && <span style={{ fontSize: '0.63rem', color: GRAY }}>/ {instituteTotal}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.63rem', color: GRAY, width: 44, flexShrink: 0 }}>Overall</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: TEXT }}>{overallRank}</span>
                {overallTotal && <span style={{ fontSize: '0.63rem', color: GRAY }}>/ {overallTotal}</span>}
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
              ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>💪 Start studying today!</span>
              : todayHours < 0.5
              ? <span style={{ color: '#ef4444', fontWeight: 600 }}>📚 Try to study more!</span>
              : todayHours < 1
              ? <span style={{ color: '#3b82f6', fontWeight: 600 }}>👍 Good progress, keep going!</span>
              : <span style={{ color: GREEN, fontWeight: 600 }}>🔥 Excellent! Outstanding effort!</span>
          }
        />
      </div>

      {/* ── SUCCESS STORY PROMPT — only shown before the student has submitted
          a story; once submitted (any status), it's hidden for good. ── */}
      {myStory === null && (
        <div style={{ margin: '18px 28px 0', background: 'linear-gradient(135deg, #fff7ed, #fef3e2)', border: `1px solid ${ORANGE}33`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: `1px solid ${ORANGE}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ORANGE, fontSize: '1.2rem' }}>
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

      {/* ── MAIN BODY — ROW LAYOUT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 28px' }}>

        {/* ════ ROW 1: Course Progress + English Practice + Daily Aptitude ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 14 }}>
        {/* placeholder-open */}

          {/* Course Progress */}
          <Card>
            <CardHeader title="My Course Progress" sub="(This Month)" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: GRAY, marginBottom: 6 }}>Overall Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.7rem', fontWeight: 800, color: TEXT }}>{avgProgress}%</span>
                <div style={{ flex: 1 }}><Bar pct={avgProgress} /></div>
                <span style={{ fontSize: '0.72rem', color: GREEN, fontWeight: 600, whiteSpace: 'nowrap' }}>↑ 12% from last month</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enrolledCourses.length > 0 ? enrolledCourses.map((c, i) => (
                <div key={i} className="sd-course-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.8rem', color: TEXT, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: GRAY }}>{c.progress}%</span>
                  </div>
                  <Bar pct={c.progress} />
                </div>
              )) : (
                <p style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '16px 0' }}>No enrolled courses yet.</p>
              )}
            </div>
          </Card>

          {/* English Practice Progress */}
          <Card>
            <CardHeader title="English Practice Progress" sub="(This Month)" />
            {(() => {
              const skills = [
                { key: 'SPEAKING',      label: 'Speaking',      icon: <FiMic size={15} /> },
                { key: 'WRITING',       label: 'Writing',       icon: <FiEdit3 size={15} /> },
                { key: 'LISTENING',     label: 'Listening',     icon: <FiHeadphones size={15} /> },
                { key: 'READING',       label: 'Reading',       icon: <FiBook size={15} /> },
                { key: 'JUST_A_MINUTE', label: 'Speaking Practice', icon: <MdOutlineTimer size={16} /> },
              ]
              const trendMeta = (trend: string) => {
                if (trend === 'IMPROVED') return { label: '↑ Improved',      color: GREEN }
                if (trend === 'FIRST')    return { label: 'First attempt', color: ORANGE }
                return { label: 'No attempts', color: '#94a3b8' }
              }
              const SkillCircle = ({ sk }: { sk: (typeof skills)[number] }) => {
                const d = (engData as any)?.[sk.key]
                const score: number | null = d?.summary?.bestScore ?? null
                const used: number = d?.attemptsUsed ?? 0
                const limit: number = d?.monthlyLimit ?? 30
                const pct = limit > 0 ? (used / limit) * 100 : 0
                const tm = trendMeta(d?.summary?.trend ?? 'NA')
                const C = 2 * Math.PI * 30
                return (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 5, color: ORANGE }}>
                      {sk.icon}
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT }}>{sk.label}</span>
                    </div>
                    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 5px' }}>
                      <svg width="80" height="80">
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                        <circle cx="40" cy="40" r="30" fill="none" stroke={ORANGE} strokeWidth="7"
                          strokeDasharray={`${(pct / 100) * C} ${C}`}
                          strokeDashoffset={C * 0.25} strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: score !== null ? '1rem' : '0.85rem', fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                          {score !== null ? `${score}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 600, color: tm.color, marginBottom: 1 }}>{tm.label}</div>
                    <div style={{ fontSize: '0.62rem', color: GRAY }}>{score !== null ? `Score: ${score}/100` : 'Not attempted'}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 1 }}>{used}/{limit} uses</div>
                  </div>
                )
              }
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {skills.slice(0, 3).map(sk => <SkillCircle key={sk.key} sk={sk} />)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxWidth: '66%', margin: '0 auto 8px' }}>
                    {skills.slice(3).map(sk => <SkillCircle key={sk.key} sk={sk} />)}
                  </div>
                </>
              )
            })()}
            <div style={{ padding: '9px 12px', background: '#fff7ed', borderRadius: 8, fontSize: '0.74rem', color: '#92400e' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiAward size={14} color={ORANGE} /> Practice everyday to improve your communication skills.</span>
            </div>
          </Card>
          {/* Daily Aptitude */}
          {(() => {
            const stats = aptitudeData?.stats
            const days = aptitudeData?.days || []
            const today = days.find((d: any) => d.isToday)
            const last7 = days.filter((d: any) => !d.isFuture).slice(-7)

            const CAT_COLOR: Record<string, string> = {
              Reasoning: '#7c3aed', Technical: '#2563eb',
              Puzzle: '#d97706', Aptitude: '#10b981',
            }
            const todayColor = today ? (CAT_COLOR[today.category] || ORANGE) : ORANGE

            // Compute stats from the selected month's days array
            const pastDays = days.filter((d: any) => !d.isFuture)
            const attendedDays = pastDays.filter((d: any) => d.attended)
            const attendedCount = attendedDays.length
            const attendancePct = pastDays.length > 0 ? Math.round((attendedCount / pastDays.length) * 100) : 0
            const monthAvgScore = attendedDays.length > 0
              ? Math.round(attendedDays.reduce((sum: number, d: any) => sum + (d.score / d.total) * 100, 0) / attendedDays.length)
              : 0

            // Monthly category breakdown
            const categories = ['Reasoning', 'Technical', 'Puzzle', 'Aptitude']
            const catStats = categories.map(cat => {
              const catDays = days.filter((d: any) => d.category === cat && !d.isFuture)
              const attended = catDays.filter((d: any) => d.attended)
              const totalScore = attended.reduce((s: number, d: any) => s + (d.score || 0), 0)
              const totalPossible = attended.reduce((s: number, d: any) => s + (d.total || 0), 0)
              const pct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0
              return { cat, attended: attended.length, total: catDays.length, totalScore, totalPossible, pct }
            })

            return (
              <Card style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header with month filter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Daily Aptitude</div>
                    <div style={{ fontSize: '0.72rem', color: GRAY }}>Monthly Progress</div>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                      value={aptitudeMonth}
                      onChange={e => setAptitudeMonth(e.target.value)}
                      style={{
                        border: `1.5px solid ${BORDER}`, borderRadius: 8,
                        padding: '4px 24px 4px 8px', fontSize: '0.7rem',
                        fontWeight: 600, color: ORANGE, background: '#fff7ed',
                        appearance: 'none', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
                        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                        return (
                          <option key={val} value={val}>
                            {d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </option>
                        )
                      })}
                    </select>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round"
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    { label: 'Attended',  value: attendedCount, color: GREEN, bg: '#f0fdf4' },
                    { label: 'Attendance', value: `${attendancePct}%`, color: ORANGE, bg: '#fff7ed' },
                    { label: 'Avg Score', value: attendedCount > 0 ? `${monthAvgScore}%` : '—', color: '#7c3aed', bg: '#f5f3ff' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', background: s.bg, borderRadius: 8, padding: '10px 6px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '0.6rem', color: GRAY, marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Monthly category progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: TEXT, marginBottom: 8 }}>Monthly Progress by Category</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {catStats.map(({ cat, attended, total, totalScore, totalPossible, pct }) => {
                      const color = CAT_COLOR[cat]
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT }}>{cat}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.65rem', color: GRAY }}>{attended}/{total} days</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: attended > 0 ? color : '#94a3b8' }}>
                                {attended > 0 ? `${totalScore}/${totalPossible}` : '—'}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Today's quiz */}
                {today && (
                  <div style={{ border: `1.5px solid ${todayColor}33`, borderRadius: 10, padding: '9px 12px', marginBottom: 10, background: `${todayColor}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: today.attended && today.total ? 5 : 0 }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: GRAY }}>Today's Quiz</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: todayColor }}>{today.category}</div>
                      </div>
                      {today.attended ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.62rem', color: GREEN, fontWeight: 700 }}>Completed</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: TEXT }}>{today.score}/{today.total}</div>
                        </div>
                      ) : (
                        <Link to="/student/aptitude" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', background: todayColor, borderRadius: 7, padding: '4px 10px', textDecoration: 'none' }}>
                          Start →
                        </Link>
                      )}
                    </div>
                    {today.attended && today.total && (
                      <Bar pct={(today.score / today.total) * 100} color={todayColor} />
                    )}
                  </div>
                )}

                {/* Last 7 days mini dots */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.65rem', color: GRAY, fontWeight: 600, marginBottom: 5 }}>Last 7 Days</div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {last7.map((d: any, i: number) => {
                      const dotColor = d.isToday ? (CAT_COLOR[d.category] || ORANGE) : d.attended ? GREEN : '#fca5a5'
                      return (
                        <div key={i} title={`${d.date} · ${d.category}${d.attended ? ` · ${d.score}/${d.total}` : ' · Missed'}`}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ width: '100%', height: 22, borderRadius: 5, background: `${dotColor}18`, border: `1.5px solid ${dotColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor }} />
                          </div>
                          <span style={{ fontSize: '0.52rem', color: GRAY }}>{new Date(d.date + 'T00:00:00').getDate()}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })()}

        </div>{/* end Row 1 */}

        {/* ════ ROW 2: Code Challenges + Time Sheet ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>

          {/* Code Challenges */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Code Challenges" />
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total',     value: totalProblems,                              bg: PAGE_BG, border: BORDER,      color: TEXT  },
                { label: 'Completed', value: completedChallenges,                        bg: '#f0fdf4', border: '#bbf7d0',   color: GREEN },
                { label: 'Remaining', value: Math.max(totalProblems - completedChallenges, 0), bg: PAGE_BG, border: BORDER, color: TEXT },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.68rem', color: s.color === GREEN ? GREEN : GRAY, fontWeight: s.color === GREEN ? 600 : 400, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Easy',   done: codeStats.easy,   color: GREEN,    bg: '#f0fdf4' },
                { label: 'Medium', done: codeStats.medium, color: '#d97706', bg: '#fffbeb' },
                { label: 'Hard',   done: codeStats.hard,   color: '#dc2626', bg: '#fef2f2' },
              ].map(d => (
                <div key={d.label} style={{ flex: 1, background: d.bg, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: d.color, marginBottom: 3 }}>{d.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: d.color }}>{d.done}</div>
                  <div style={{ fontSize: '0.62rem', color: GRAY }}>solved</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT, marginBottom: 10 }}>Top Problems Solved</div>
            {topProblems.length > 0 ? topProblems.slice(0, 3).map((ch, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topProblems.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" fill="none" stroke="#0ea5e9" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: '0.78rem', color: TEXT }}>{ch.title}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: ch.difficulty === 'Easy' ? '#ecfdf5' : ch.difficulty === 'Medium' ? '#fffbeb' : '#fef2f2',
                  color: ch.difficulty === 'Easy' ? GREEN : ch.difficulty === 'Medium' ? '#d97706' : '#dc2626',
                }}>{ch.difficulty}</span>
              </div>
            )) : (
              <p style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><FiZap size={13} color={ORANGE} /> No challenges solved yet — start now!</p>
            )}
            <Link to="/student/problem-statement" style={{ fontSize: '0.78rem', color: ORANGE, fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: 'auto', paddingTop: 12 }}>
              Go to Code Challenges →
            </Link>
          </Card>

          {/* Time Sheet */}
          <Card>
            {/* Header: title + streak badge + filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Time Sheet</div>
                  <div style={{ fontSize: '0.72rem', color: GRAY }}>Study time tracker</div>
                </div>
                {/* Streak badge in header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: studyStreak > 0 ? '#fff7ed' : '#f1f5f9', border: `1px solid ${studyStreak > 0 ? ORANGE + '40' : BORDER}`, borderRadius: 20, padding: '4px 10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', color: studyStreak > 0 ? ORANGE : GRAY }}>{studyStreak > 0 ? <BsFire size={15} /> : <RiMoonLine size={15} />}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: studyStreak > 0 ? ORANGE : GRAY }}>{studyStreak} day streak</span>
                </div>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 7 Days / This Month pill toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                  {([
                    { key: 'week',  label: '7 Days'     },
                    { key: 'month', label: 'This Month' },
                  ] as const).map(f => (
                    <button key={f.key} onClick={() => { setTsFilter(f.key); setHistoryMonth('') }} style={{
                      border: 'none', cursor: 'pointer', borderRadius: 6, padding: '5px 12px',
                      fontSize: '0.72rem', fontWeight: 600,
                      background: tsFilter === f.key ? CARD_BG : 'transparent',
                      color: tsFilter === f.key ? ORANGE : GRAY,
                      boxShadow: tsFilter === f.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s',
                    }}>{f.label}</button>
                  ))}
                </div>

                {/* Month picker dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={historyMonth}
                    onChange={e => { setHistoryMonth(e.target.value); if (e.target.value) setTsFilter('history') }}
                    style={{
                      border: `1.5px solid ${tsFilter === 'history' ? ORANGE : BORDER}`,
                      borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: '0.72rem',
                      fontWeight: 600, color: tsFilter === 'history' ? ORANGE : GRAY,
                      background: tsFilter === 'history' ? '#fff7ed' : CARD_BG,
                      appearance: 'none', cursor: 'pointer', outline: 'none',
                      minWidth: 110,
                    }}
                  >
                    <option value="">Select Month</option>
                    {pastMonthOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {/* chevron icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tsFilter === 'history' ? ORANGE : GRAY} strokeWidth="2.5" strokeLinecap="round"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart + Week Breakdown Panel */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', marginTop: 14 }}>

              {/* Bar chart — wider, anchored to bottom */}
              <div style={{ flex: 4, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {historyLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, zIndex: 1 }}>
                    <div style={{ width: 24, height: 24, border: `3px solid #f1f5f9`, borderTop: `3px solid ${ORANGE}`, borderRadius: '50%', animation: 'sd-spin 0.8s linear infinite' }} />
                  </div>
                )}
                {/* Chart label when drilling into a week */}
                {selectedWeek && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <button onClick={() => setSelectedWeek(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: ORANGE, fontSize: '0.75rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                      ← Back
                    </button>
                    <span style={{ fontSize: '0.75rem', color: GRAY }}>
                      Week {selectedWeek} · {weekSummaries.find(w => w.idx === selectedWeek)?.range}
                    </span>
                  </div>
                )}
                <BarChart days={
                  selectedWeek && drillDays ? drillDays
                  : tsFilter === 'week' ? last7
                  : tsFilter === 'month' ? monthWeeks
                  : historyWeeks
                } />
              </div>

              {/* Week Breakdown Panel */}
              <div style={{ flex: 1.5, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: TEXT }}>
                    {tsFilter === 'week' ? 'This Month — Weekly' : tsFilter === 'history' ? `${historyLabel} — Weekly` : 'This Month — Weekly'}
                  </span>
                  {selectedWeek && (
                    <button onClick={() => setSelectedWeek(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.68rem', color: ORANGE, fontWeight: 600, padding: 0 }}>Clear</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {weekSummaries.map(w => {
                    const pct = maxWeekHours > 0 ? (w.total / maxWeekHours) * 100 : 0
                    const isSelected = selectedWeek === w.idx
                    const isActive = w.total > 0
                    return (
                      <div
                        key={w.idx}
                        onClick={() => isActive ? setSelectedWeek(isSelected ? null : w.idx) : undefined}
                        style={{
                          padding: '5px 8px', borderRadius: 7,
                          border: `1.5px solid ${isSelected ? ORANGE : isActive ? BORDER : '#f1f5f9'}`,
                          background: isSelected ? '#fff7ed' : isActive ? CARD_BG : PAGE_BG,
                          cursor: isActive ? 'pointer' : 'default',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isSelected ? ORANGE : isActive ? TEXT : '#94a3b8', minWidth: 18 }}>{w.label}</span>
                            <span style={{ fontSize: '0.63rem', color: GRAY }}>{w.range}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? ORANGE : isActive ? TEXT : '#94a3b8' }}>
                              {isActive ? fmtH(w.total) : '—'}
                            </span>
                            {isActive && <span style={{ fontSize: '0.6rem', color: GRAY, marginLeft: 4 }}>{w.activeDays}d</span>}
                          </div>
                        </div>
                        {/* Mini progress bar */}
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isSelected ? ORANGE : `${ORANGE}80`, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>
                  Click a week to see daily breakdown
                </div>
              </div>
            </div>

            {/* Stats row: 5 boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
              {[
                { label: 'Today',       value: fmtH(todayHours),  color: ORANGE, bg: `${ORANGE}10` },
                { label: 'This Week',   value: fmtH(weeklyTotal), color: TEXT,   bg: PAGE_BG },
                { label: tsFilter === 'history' ? historyLabel.split(' ')[0] : 'This Month',
                                        value: tsFilter === 'history' ? fmtH(historyTotal) : fmtH(monthlyTotal),
                                                                   color: TEXT,   bg: PAGE_BG },
                { label: 'Active Days', value: String(tsFilter === 'history' ? historyRecords.filter(r => r.hours > 0).length : presentDays.length),
                                                                   color: GREEN,  bg: '#f0fdf4' },
                { label: 'Daily Avg',   value: fmtH(avgPerDay),   color: TEXT,   bg: PAGE_BG },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: s.bg, borderRadius: 8, padding: '9px 6px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: GRAY, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

        </div>{/* end Row 2 */}

        {/* ════ ROW 3: AI Mock Interview + Announcements & Achievements + Jobs ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.2fr', gap: 14 }}>

          {/* AI Mock Interview */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>AI Mock Interview</span>
              <Link to="/student/selfInterview" style={{ fontSize: '0.76rem', color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>View History</Link>
            </div>
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
              <button className={`sd-tab-btn ${aiTab === 'resume' ? 'active' : ''}`} onClick={() => setAiTab('resume')}>Resume Based</button>
              <button className={`sd-tab-btn ${aiTab === 'topic' ? 'active' : ''}`} onClick={() => setAiTab('topic')}>Topic Based</button>
            </div>
            {aiTab === 'resume' && (
              <div>
                {/* Usage stats */}
                {resumeData && (() => {
                  const score: number | null = resumeData.bestScore ?? null
                  const pct = score ?? 0
                  const R = 42
                  const C2 = 2 * Math.PI * R
                  return (
                    <>
                      {/* 3 stat boxes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                        {[
                          { label: 'Total Attempts', value: resumeData.attempts?.length ?? 0, color: TEXT,   bg: PAGE_BG },
                          { label: 'Used / Month',   value: `${resumeData.used}/${resumeData.limit}`,        color: ORANGE, bg: `${ORANGE}10` },
                          { label: 'Remaining',      value: resumeData.remaining ?? resumeData.limit,        color: GREEN,  bg: '#f0fdf4' },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: 'center', background: s.bg, borderRadius: 8, padding: '10px 6px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '0.6rem', color: GRAY, marginTop: 3 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Best Score circular ring */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                        <div style={{ position: 'relative', width: 110, height: 110 }}>
                          <svg width="110" height="110">
                            <circle cx="55" cy="55" r={R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                            <circle cx="55" cy="55" r={R} fill="none" stroke={ORANGE} strokeWidth="9"
                              strokeDasharray={`${(pct / 100) * C2} ${C2}`}
                              strokeDashoffset={C2 * 0.25} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: score !== null ? '1.4rem' : '1.2rem', fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                              {score !== null ? `${score}%` : '—'}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: GRAY }}>Best Score</div>
                        {resumeData.avgScore != null && (
                          <div style={{ fontSize: '0.68rem', color: GRAY }}>Avg Score: <strong style={{ color: TEXT }}>{resumeData.avgScore}%</strong></div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
            {aiTab === 'topic' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Topic grid with remaining counts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
                  {Object.entries(topicLimits).slice(0, 8).map(([topic, info]: [string, any]) => {
                    const rem = info?.remaining ?? 0
                    const depleted = rem === 0
                    return (
                      <div
                        key={topic}
                        onClick={() => !depleted && setSelectedTopic(topic)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 10px', borderRadius: 8, cursor: depleted ? 'default' : 'pointer',
                          border: `1.5px solid ${selectedTopic === topic ? ORANGE : depleted ? '#f1f5f9' : BORDER}`,
                          background: selectedTopic === topic ? `${ORANGE}10` : depleted ? PAGE_BG : CARD_BG,
                          transition: 'all 0.15s',
                          opacity: depleted ? 0.6 : 1,
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: depleted ? GRAY : TEXT, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, marginLeft: 6, flexShrink: 0,
                          color: depleted ? '#ef4444' : rem <= 2 ? '#d97706' : GREEN,
                        }}>{depleted ? '✕' : `${rem} left`}</span>
                      </div>
                    )
                  })}
                </div>
                {Object.keys(topicLimits).length > 8 && (
                  <Link to="/student/selfInterview" style={{ fontSize: '0.72rem', color: ORANGE, fontWeight: 600, textDecoration: 'none', marginTop: 'auto', paddingTop: 8, display: 'block' }}>
                    +{Object.keys(topicLimits).length - 8} more topics →
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* Announcements + Student Achievements (tabbed) */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Student Achievements & Announcements</span>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
              <button className={`sd-tab-btn ${annAchTab === 'achievements' ? 'active' : ''}`} onClick={() => setAnnAchTab('achievements')}>Student Achievements</button>
              <button className={`sd-tab-btn ${annAchTab === 'announcements' ? 'active' : ''}`} onClick={() => setAnnAchTab('announcements')}>Announcements</button>
            </div>

            {/* Announcements tab */}
            {annAchTab === 'announcements' && (
              announcements.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', margin: 0 }}>No announcements yet.</p>
                </div>
              ) : (
                announcements.map((a, i) => (
                  <div key={i} className="sd-ann-row">
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                      {ANNOUNCE_ICON[a.type] || '📌'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                      <div style={{ fontSize: '0.68rem', color: GRAY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.description?.replace(/<[^>]+>/g, '').slice(0, 40)}...
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Student Achievements tab */}
            {annAchTab === 'achievements' && (
              instituteAchievements.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 6 }}>
                  <BsTrophyFill size={28} color="#e2e8f0" />
                  <p style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', margin: 0 }}>No achievements yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {instituteAchievements.map((a, i) => {
                    const CAT_COLORS: Record<string, string> = {
                      academic: '#f59e0b', sports: '#10b981', placement: '#3b82f6',
                      extracurricular: '#ec4899', certification: '#8b5cf6', general: '#ff7a00',
                    }
                    const CAT_ICONS: Record<string, string> = {
                      academic: '🎓', sports: '🏆', placement: '💼',
                      extracurricular: '🌟', certification: '📜', general: '⭐',
                    }
                    const color = CAT_COLORS[a.category] || '#ff7a00'
                    const icon = CAT_ICONS[a.category] || '⭐'
                    return (
                      <div key={a._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {a.studentPic
                            ? <img src={a.studentPic} alt={a.studentName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{a.studentName?.charAt(0)?.toUpperCase() || icon}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.studentName}</div>
                          <div style={{ fontSize: '0.67rem', color: GRAY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 20, padding: '2px 8px', textTransform: 'capitalize' }}>{icon} {a.category}</span>
                          <button onClick={() => setAchModal(a)} style={{ fontSize: '0.62rem', fontWeight: 700, color: ORANGE, background: '#fff7ed', border: `1px solid ${ORANGE}44`, borderRadius: 20, padding: '2px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>View →</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </Card>

          {/* Latest Jobs by HR — moved to end */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Latest Jobs by HR" />
            <div style={{ flex: 1 }}>
            {hrJobs.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '12px 0' }}>No jobs available.</p>
            ) : (
              hrJobs.map((job, i) => (
                <div key={i} className="sd-job-row">
                  <div style={{ width: 30, height: 30, background: '#f1f5f9', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {job.logo
                      ? <img src={job.logo} alt={job.company} style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
                      : <svg width="13" height="13" fill="none" stroke={GRAY} strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                    <div style={{ fontSize: '0.66rem', color: GRAY }}>{job.company}{job.location ? ` · ${job.location.trim()}` : ''}</div>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', flexShrink: 0, textAlign: 'right' }}>{timeAgo(job.postedDate)}</div>
                </div>
              ))
            )}
            </div>
            <Link to="/student/interview-details" style={{ fontSize: '0.76rem', color: ORANGE, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 12, borderTop: `1px solid #f1f5f9` }}>
              Browse All Jobs <span style={{ fontSize: '0.9rem' }}>→</span>
            </Link>
          </Card>

        </div>
      </div>

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
