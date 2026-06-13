import { useState, useEffect, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaUserGraduate, FaSearch, FaFileDownload, FaMicrophone,
  FaPen, FaBook, FaHeadphones, FaBullhorn, FaRobot, FaFileAlt,
  FaClipboardList, FaCheckCircle, FaStar,
  FaChevronLeft, FaChevronRight, FaTrophy, FaClock,
  FaCode, FaGraduationCap, FaEye, FaFlask,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ── Types ─────────────────────────────────────────────── */
type Student = { _id: string; name?: string; fullName?: string; email: string; branch?: string; rollNumber?: string; gender?: string }

type SectionStat    = { sessions: number; totalAttempts?: number; avgScore: number }
type AssessmentStat = { sessions: number; passed: number; avgScore: number }
type TopicAttempt   = { topic: string; usedThisMonth: number; remaining: number }
type TopicStat      = SectionStat & { monthlyLimit?: number; topicsAttempted?: TopicAttempt[]; topicsAvailable?: string[] }
type ResumeAttempt  = { attemptNumber: number | null; totalScore: number | null; isScored: boolean; createdAt: string }
type ResumeStat     = { sessions: number; avgScore: number; monthlyLimit: number; usedThisMonth: number; remainingThisMonth: number; attempts: ResumeAttempt[] }
type EnglishSection = {
  attemptsUsed: number; monthlyLimit: number; remainingAttempts: number
  bestScore: number | null; latestScore: number | null; avgScore: number
  trend: string
  attempts: { attempt: number; score: number; date: string }[]
}

type CourseItem = { courseId: string; title: string; progress: number }

type Report = {
  student: { _id: string; name: string; email: string; branch: string; rollNumber: string; gender: string; college: string; department: string; joiningYear: string | number; batch: string; skills: string[]; profileImage: string; reportId: string }
  period: { from: string | null; to: string | null }
  overallScore: number; englishAvg: number; aiAvg: number
  rank: { position: number; total: number; score?: number } | null
  timeSpent: { totalSecs: number; uniqueDays: number; avgMinPerDay: number; label: string }
  courses: CourseItem[]
  totalCoursesAvailable: number
  overallCourseProgress: number
  codeStats: { available: { easy: number; medium: number; hard: number }; solved: number }
  activity: { labsCompleted: number; labsAvailable: number; freelanceAvailable: number; freelanceAssigned: number; freelanceCompleted: number; codeSolved: number }
  sections: {
    speaking: EnglishSection; writing: EnglishSection; reading: EnglishSection
    listening: EnglishSection; jam: EnglishSection
    selfInterview: TopicStat; resumeInterview: ResumeStat
    assessment: AssessmentStat
  }
}

type RowState = { from: string; to: string; loading: boolean }

/* ── Helpers ────────────────────────────────────────────── */
const sName      = (s: Student) => s.fullName || s.name || s.email
const pct        = (v: number)  => `${Math.min(100, Math.max(0, v))}%`
const scoreColor = (v: number)  => v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : v > 0 ? '#ef4444' : '#444'
const fmt        = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const PAGE_SIZE  = 10

/* ── Small reusable pieces ──────────────────────────────── */
const SectionHeader = ({ num, title, sub, color }: { num: string; title: string; sub?: string; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem' }}>
    <div style={{
      width: 28, height: 28, borderRadius: 7, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>{num}</div>
    <div>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{title}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
)

const MetricBox = ({ label, value, unit, sub, color, icon: Icon }: {
  label: string; value: string | number; unit?: string; sub?: string; color: string; icon?: React.ElementType
}) => (
  <div className="metric-card" style={{
    flex: '1 1 0', background: '#101418', border: '1px solid #1e2530',
    borderRadius: 12, padding: '1.1rem 1rem 0.9rem', display: 'flex',
    flexDirection: 'column' as const, alignItems: 'center', gap: 0,
    borderTop: `3px solid ${color}`,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', marginBottom: 10,
      background: `${color}18`, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {Icon ? <Icon size={13} color={color} /> : <FaStar size={11} color={color} />}
    </div>
    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</div>
    {unit && <div style={{ fontSize: '0.58rem', color: '#444', marginTop: 3, fontWeight: 500 }}>{unit}</div>}
    <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: 7, fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' as const }}>{label}</div>
    {sub && (
      <div style={{
        marginTop: 5, fontSize: '0.58rem', fontWeight: 700, color,
        background: `${color}12`, border: `1px solid ${color}25`,
        borderRadius: 4, padding: '2px 7px',
      }}>{sub}</div>
    )}
  </div>
)

const SkillRow = ({ icon: Icon, label, sessions, score, color, maxScore = 100 }: {
  icon: React.ElementType; label: string; sessions: number; score: number; color: string; maxScore?: number
}) => (
  <div style={{ marginBottom: '0.85rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <Icon size={11} color={color} />
        <span style={{ fontSize: '0.79rem', color: '#ccc', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '0.62rem', color: '#3a3a3a', background: '#1a1a1a', borderRadius: 4, padding: '1px 6px' }}>
          {sessions} session{sessions !== 1 ? 's' : ''}
        </span>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: score > 0 ? color : '#2a2a2a', minWidth: 38, textAlign: 'right' as const }}>
        {score > 0 ? `${score}/${maxScore}` : '—'}
      </span>
    </div>
    <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6, overflow: 'hidden', position: 'relative' as const }}>
      <div style={{
        width: score > 0 ? pct(score) : '0%', height: '100%',
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        borderRadius: 4, animation: 'barFill 0.9s cubic-bezier(.22,.68,0,1.2) 0.3s both',
      }} />
    </div>
  </div>
)

const TopicTag = ({ label, used }: { label: string; used: boolean }) => (
  <span style={{
    fontSize: '0.65rem', borderRadius: 5, padding: '3px 8px', fontWeight: 600,
    background: used ? 'rgba(168,85,247,0.12)' : '#111',
    border: `1px solid ${used ? 'rgba(168,85,247,0.35)' : '#1e1e1e'}`,
    color: used ? '#a855f7' : '#333',
  }}>{label}</span>
)

const DiffRow = ({ level, available, color }: { level: string; available: number; color: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#111', border: `1px solid ${color}18`, borderRadius: 8,
    padding: '0.65rem 0.9rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.78rem', color: '#bbb', fontWeight: 600 }}>{level}</span>
    </div>
    <span style={{ fontSize: '0.75rem', color: '#555' }}>{available} available</span>
  </div>
)

/* ── Main Component ─────────────────────────────────────── */
const StudentReports = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user }   = useAuthContext()
  const baseURL    = import.meta.env.VITE_API_BASE_URL
  const printRef   = useRef<HTMLDivElement>(null)

  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchTerm, setSearchTerm]   = useState('')
  const [page, setPage]               = useState(1)
  const [rowState, setRowState]       = useState<Record<string, RowState>>({})
  const [report, setReport]           = useState<Report | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [modalError, setModalError]   = useState('')

  useEffect(() => {
    if (!user?.token) return
    setLoadingList(true)
    fetch(`${baseURL}${apiBase}/students`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setAllStudents(d.students || []) })
      .catch(console.error)
      .finally(() => setLoadingList(false))
  }, [user?.token]) // eslint-disable-line

  const filtered   = searchTerm.trim()
    ? allStudents.filter(s =>
        sName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : allStudents

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getRow = (id: string): RowState => rowState[id] ?? { from: '', to: '', loading: false }
  const setRow = (id: string, patch: Partial<RowState>) =>
    setRowState(prev => ({ ...prev, [id]: { ...getRow(id), ...patch } }))

  const generateReport = async (student: Student, action: 'preview' | 'download') => {
    const { from, to } = getRow(student._id)
    setRow(student._id, { loading: true })
    setModalError('')
    try {
      const params = new URLSearchParams({ userId: student._id })
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      const r = await fetch(`${baseURL}${apiBase}/student-report?${params}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const d = await r.json()
      if (!d.success) { setModalError(d.message || 'Failed to generate'); return }
      setReport(d.report)
      setShowModal(true)
      if (action === 'download') setTimeout(() => triggerPrint(), 500)
    } catch { setModalError('Network error') }
    finally { setRow(student._id, { loading: false }) }
  }

  const triggerPrint = () => {
    if (!printRef.current) return
    const content = printRef.current.outerHTML
    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Performance Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: #080808; font-family: system-ui,-apple-system,sans-serif; color: #fff; }
    @media print {
      @page { margin: 8mm; size: A4 portrait; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>${content}</body>
</html>`)
    pw.document.close()
    pw.onload = () => { setTimeout(() => { pw.print(); pw.close() }, 300) }
  }

  /* ── Report body ── */
  const ReportBody = ({ rep }: { rep: Report }) => {
    const sec     = rep.sections
    const topicsWithUsage = sec.selfInterview.topicsAttempted || []
    const topicUsageMap   = Object.fromEntries(topicsWithUsage.map(t => [t.topic, t]))
    const monthlyLimit    = sec.selfInterview.monthlyLimit ?? 5
    const topRank = rep.rank ? Math.max(1, Math.ceil((rep.rank.position / rep.rank.total) * 100)) : null
    const totalCodeAvail = (rep.codeStats?.available.easy ?? 0) + (rep.codeStats?.available.medium ?? 0) + (rep.codeStats?.available.hard ?? 0)

    return (
      <div ref={printRef} style={{ maxWidth: 860, margin: '0 auto', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes barFill {
          from { clip-path: inset(0 100% 0 0 round 4px); }
          to   { clip-path: inset(0 0% 0 0 round 4px); }
        }
        @keyframes barFill3 {
          from { clip-path: inset(0 100% 0 0 round 3px); }
          to   { clip-path: inset(0 0% 0 0 round 3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .report-section { animation: fadeSlideUp 0.5s ease both; }
        .report-section:nth-child(1) { animation-delay: 0.05s; }
        .report-section:nth-child(2) { animation-delay: 0.12s; }
        .report-section:nth-child(3) { animation-delay: 0.19s; }
        .report-section:nth-child(4) { animation-delay: 0.26s; }
        .report-section:nth-child(5) { animation-delay: 0.33s; }
        .report-section:nth-child(6) { animation-delay: 0.40s; }
        .report-section:nth-child(7) { animation-delay: 0.47s; }
        .report-section:nth-child(8) { animation-delay: 0.54s; }
        .report-section:nth-child(9) { animation-delay: 0.61s; }
        .metric-card { animation: popIn 0.4s ease both; }
        .metric-card:nth-child(1) { animation-delay: 0.15s; }
        .metric-card:nth-child(2) { animation-delay: 0.22s; }
        .metric-card:nth-child(3) { animation-delay: 0.29s; }
        .metric-card:nth-child(4) { animation-delay: 0.36s; }
        .metric-card:nth-child(5) { animation-delay: 0.43s; }
        .metric-card:nth-child(6) { animation-delay: 0.50s; }
        .bar-fill   { animation: barFill  0.9s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 0.3s; }
        .bar-fill-3 { animation: barFill3 0.9s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 0.3s; }
      `}</style>

        {/* ── Cover header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0f1e3a 50%, #0a1628 100%)',
          border: '1px solid #1a2a4a', borderRadius: 18, overflow: 'hidden',
          marginBottom: '1.25rem', animation: 'fadeSlideUp 0.5s ease both',
        }}>

          {/* ── Title band ── */}
          <div style={{ padding: '1.5rem 2rem 1.25rem', textAlign: 'center' as const, borderBottom: '1px solid #152038' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Student Performance Report
            </div>
            <div style={{ fontSize: '0.7rem', color: '#4a6080', marginTop: '0.35rem', letterSpacing: '0.05em' }}>
              Comprehensive Skills &amp; Behavioural Analysis · EKLAV Platform
            </div>
          </div>

          {/* ── Body: avatar+info  |  score+rank ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'stretch' }}>

            {/* LEFT — avatar + info rows + skills */}
            <div style={{ padding: '1.4rem 2rem', borderRight: '1px solid #152038' }}>

              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.1rem' }}>
                {rep.student.profileImage ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${rep.student.profileImage}`}
                    alt={rep.student.name}
                    style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1e3a5f', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '2px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaUserGraduate size={22} color="#3b82f6" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{rep.student.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#4a6080', marginTop: 2 }}>{rep.student.email}</div>
                </div>
              </div>

              {/* Info rows */}
              {[
                { label: 'Programme',   value: rep.student.department || rep.student.branch || '—' },
                { label: 'Institution', value: rep.student.college || '—' },
                { label: 'Batch',       value: rep.student.batch ? `${rep.student.batch}${rep.student.joiningYear ? ' · ' + rep.student.joiningYear : ''}` : (rep.student.joiningYear ? String(rep.student.joiningYear) : '—') },
                { label: 'Roll No',     value: rep.student.rollNumber || '—' },
                { label: 'Report Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                { label: 'Report ID',   value: rep.student.reportId },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '0.48rem 0',
                  borderBottom: i < arr.length - 1 ? '1px dashed #152038' : 'none',
                }}>
                  <span style={{ fontSize: '0.68rem', color: '#3a5070', fontWeight: 600, minWidth: 90, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, textAlign: 'right' as const, maxWidth: 310 }}>{row.value}</span>
                </div>
              ))}

              {/* Skills */}
              {rep.student.skills?.length > 0 && (
                <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px dashed #152038' }}>
                  <div style={{ fontSize: '0.58rem', color: '#3a5070', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.3rem' }}>
                    {rep.student.skills.map(s => (
                      <span key={s} style={{
                        fontSize: '0.62rem', fontWeight: 600, color: '#93c5fd',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 5, padding: '2px 8px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — score + rank */}
            <div style={{
              padding: '1.5rem 1.75rem',
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '1rem', minWidth: 165,
            }}>
              {/* Overall score */}
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.55rem', color: '#3a5070', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>OVERALL SCORE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1, color: rep.overallScore >= 75 ? '#22c55e' : rep.overallScore >= 50 ? '#f59e0b' : rep.overallScore > 0 ? '#ef4444' : '#fff' }}>
                    {rep.overallScore > 0 ? rep.overallScore : '—'}
                  </span>
                  {rep.overallScore > 0 && <span style={{ fontSize: '0.9rem', color: '#3a5070', fontWeight: 600 }}>/100</span>}
                </div>
                <div style={{
                  marginTop: 6, fontSize: '0.62rem', fontWeight: 700,
                  color: rep.overallScore >= 75 ? '#22c55e' : rep.overallScore >= 50 ? '#f59e0b' : rep.overallScore > 0 ? '#ef4444' : '#3a5070',
                }}>
                  {rep.overallScore >= 75 ? 'Excellent' : rep.overallScore >= 50 ? 'Strong Performer' : rep.overallScore > 0 ? 'Needs Improvement' : 'No Activity'}
                </div>
              </div>

              {/* Rank badge */}
              {rep.rank && (
                <div style={{
                  background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)',
                  borderRadius: 10, padding: '0.6rem 1rem', textAlign: 'center' as const, width: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: 3 }}>
                    <FaTrophy size={10} color="#fbbf24" />
                    <span style={{ fontSize: '0.55rem', color: '#8a6a20', fontWeight: 700, letterSpacing: '0.08em' }}>INSTITUTE RANK</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                    #{rep.rank.position}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#8a6a20', marginTop: 3 }}>
                    of {rep.rank.total} students · Top {topRank}%
                  </div>
                </div>
              )}

              {/* Period */}
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.6rem', color: '#3a5070', fontWeight: 600 }}>
                  {rep.period.from || rep.period.to
                    ? `${fmt(rep.period.from)} → ${fmt(rep.period.to)}`
                    : 'All Time'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 01 Score Snapshot ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="01" title="Score Snapshot" sub="Overall performance summary" color="#ff6b00" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.65rem' }}>
            <MetricBox
              label="Overall Score"
              value={rep.overallScore > 0 ? rep.overallScore : '—'}
              unit={rep.overallScore > 0 ? '/ 100' : undefined}
              color={scoreColor(rep.overallScore)}
              icon={FaStar}
              sub={rep.overallScore >= 75 ? 'Excellent' : rep.overallScore >= 50 ? 'Good' : rep.overallScore > 0 ? 'Needs Work' : undefined}
            />
            <MetricBox
              label="Institute Rank"
              value={rep.rank ? `#${rep.rank.position}` : '—'}
              unit={rep.rank ? `of ${rep.rank.total}` : undefined}
              color="#fbbf24" icon={FaTrophy}
              sub={topRank ? `Top ${topRank}%` : undefined}
            />
            <MetricBox
              label="Daily Avg Time"
              value={rep.timeSpent.avgMinPerDay > 0 ? `${rep.timeSpent.avgMinPerDay}m` : '—'}
              unit="avg / day"
              color={rep.timeSpent.label === 'Good' ? '#22c55e' : rep.timeSpent.label === 'Average' ? '#f59e0b' : rep.timeSpent.avgMinPerDay > 0 ? '#ef4444' : '#555'}
              icon={FaClock}
              sub={rep.timeSpent.label !== 'No Data' ? rep.timeSpent.label : undefined}
            />
            <MetricBox
              label="Enrolled Courses"
              value={rep.courses.length}
              unit={`of ${rep.totalCoursesAvailable || '—'} available`}
              color="#3b82f6" icon={FaGraduationCap}
              sub={rep.overallCourseProgress > 0 ? `${rep.overallCourseProgress}% progress` : undefined}
            />
            <MetricBox
              label="English Avg"
              value={rep.englishAvg > 0 ? rep.englishAvg : '—'}
              unit={rep.englishAvg > 0 ? '/ 100' : undefined}
              color="#22c55e" icon={FaMicrophone}
            />
            <MetricBox
              label="AI Interview"
              value={rep.aiAvg > 0 ? rep.aiAvg : '—'}
              unit={rep.aiAvg > 0 ? '/ 100' : undefined}
              color="#a855f7" icon={FaRobot}
            />
          </div>
        </div>

        {/* ── 02 Courses ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="02" title="Course Progress" sub="Enrolled courses and completion status" color="#3b82f6" />
          {/* Summary bar */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
            {[
              { label: 'Available', value: rep.totalCoursesAvailable, color: '#3b82f6' },
              { label: 'Enrolled', value: rep.courses.length, color: '#22c55e' },
              { label: 'Avg Progress', value: `${rep.overallCourseProgress}%`, color: '#f59e0b' },
              { label: 'Completed', value: rep.courses.filter(c => c.progress >= 100).length, color: '#a855f7' },
            ].map(item => (
              <div key={item.label} style={{
                flex: '1 1 90px', background: '#141414', border: `1px solid ${item.color}20`,
                borderRadius: 9, padding: '0.65rem', textAlign: 'center' as const,
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.6rem', color: '#444', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {rep.courses.length === 0 ? (
            <div style={{ color: '#333', fontSize: '0.78rem', padding: '0.5rem 0', textAlign: 'center' as const }}>Not enrolled in any course</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.55rem' }}>
              {[...rep.courses].sort((a, b) => b.progress - a.progress).map(c => {
                const p = Math.min(100, Math.round(c.progress))
                const col = p >= 100 ? '#22c55e' : p >= 50 ? '#3b82f6' : p >= 20 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={c.courseId} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.78rem', color: '#ccc', fontWeight: 500, flex: 1, marginRight: 8 }}>{c.title}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, color: col,
                        background: `${col}12`, border: `1px solid ${col}30`,
                        borderRadius: 5, padding: '2px 8px', flexShrink: 0,
                      }}>
                        {p === 100 ? '✓ Completed' : `${p}%`}
                      </span>
                    </div>
                    <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div className="bar-fill" style={{ width: pct(p), height: '100%', background: `linear-gradient(90deg, ${col}88, ${col})`, borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 03 English Practice ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="03" title="English Practice" sub="Current month · Speaking · Writing · Reading · Listening · JAM" color="#22c55e" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {([
              { label: 'Speaking',  stat: sec.speaking,  color: '#22c55e', icon: FaMicrophone, scale: 1  },
              { label: 'Writing',   stat: sec.writing,   color: '#3b82f6', icon: FaPen,        scale: 1  },
              { label: 'Reading',   stat: sec.reading,   color: '#f59e0b', icon: FaBook,       scale: 1  },
              { label: 'Listening', stat: sec.listening, color: '#ec4899', icon: FaHeadphones, scale: 1  },
              { label: 'JAM',       stat: sec.jam,       color: '#ff6b00', icon: FaBullhorn,   scale: 10 },
            ] as { label: string; stat: EnglishSection; color: string; icon: React.ElementType; scale: number }[]).map(({ label, stat, color, icon: Icon, scale }) => {
              const trendIcon = stat.trend === 'IMPROVED' ? '↑' : stat.trend === 'DROPPED' ? '↓' : '–'
              const trendColor = stat.trend === 'IMPROVED' ? '#22c55e' : stat.trend === 'DROPPED' ? '#ef4444' : '#444'
              const displayBest   = stat.bestScore   != null ? Math.min(100, Math.round(stat.bestScore   * scale)) : null
              const displayLatest = stat.latestScore != null ? Math.min(100, Math.round(stat.latestScore * scale)) : null
              const barPct = displayBest != null ? displayBest : 0
              return (
                <div key={label} style={{ background: '#111', border: `1px solid ${color}20`, borderRadius: 10, padding: '0.85rem' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icon size={12} color={color} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ddd' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', background: `${color}15`, border: `1px solid ${color}30`, color, borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>
                      {stat.attemptsUsed}/{stat.monthlyLimit}
                    </span>
                  </div>
                  {/* Scores row */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' as const }}>
                    <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 7, padding: '0.35rem 0.5rem', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: displayBest != null ? color : '#2a2a2a', lineHeight: 1 }}>
                        {displayBest ?? '—'}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: '#444', marginTop: 2, fontWeight: 600 }}>BEST</div>
                    </div>
                    <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 7, padding: '0.35rem 0.5rem', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: displayLatest != null ? '#aaa' : '#2a2a2a', lineHeight: 1 }}>
                        {displayLatest ?? '—'}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: '#444', marginTop: 2, fontWeight: 600 }}>LATEST</div>
                    </div>
                    <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 7, padding: '0.35rem 0.5rem', textAlign: 'center' as const }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: trendColor, lineHeight: 1 }}>{trendIcon}</div>
                      <div style={{ fontSize: '0.55rem', color: '#444', marginTop: 2, fontWeight: 600 }}>TREND</div>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{ width: `${barPct}%`, height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4 }} />
                  </div>
                  {/* Mini attempt dots */}
                  {stat.attempts.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', flexWrap: 'wrap' as const }}>
                      {stat.attempts.slice(-10).map((a, i) => {
                        const displayScore = Math.min(100, Math.round(a.score * scale))
                        return (
                          <div key={i} title={`Attempt ${a.attempt}: ${displayScore}`} style={{
                            width: 20, height: 18, borderRadius: 4, fontSize: '0.5rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `${color}18`, color,
                          }}>{displayScore}</div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* English summary bar */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 700 }}>OVERALL ENGLISH BEST AVG</span>
            <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 80 }}>
              <div className="bar-fill" style={{ width: pct(rep.englishAvg), height: '100%', background: 'linear-gradient(90deg, #22c55e88, #22c55e)', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: scoreColor(rep.englishAvg), minWidth: 40, textAlign: 'right' as const }}>
              {rep.englishAvg > 0 ? `${rep.englishAvg}%` : '—'}
            </span>
          </div>
        </div>

        {/* ── 04 AI Interview ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="04" title="AI Based Interview" sub="Topic Based · Resume Based" color="#a855f7" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

            {/* Topic Based */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaRobot size={13} color="#a855f7" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Topic Based</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#666' }}>{monthlyLimit} attempts/topic · this month</span>
              </div>
              {topicsWithUsage.length === 0 ? (
                <div style={{ fontSize: '0.7rem', color: '#333', textAlign: 'center' as const, padding: '1rem 0' }}>No topics available yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
                  {topicsWithUsage.map(t => {
                    const usedPct = Math.round((t.usedThisMonth / monthlyLimit) * 100);
                    const barColor = t.usedThisMonth >= monthlyLimit ? '#ef4444' : t.usedThisMonth > 0 ? '#a855f7' : '#1e1e1e';
                    return (
                      <div key={t.topic}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.68rem', color: t.usedThisMonth > 0 ? '#c084fc' : '#555', fontWeight: t.usedThisMonth > 0 ? 700 : 400 }}>
                            {t.topic}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 700 }}>{t.usedThisMonth}/{monthlyLimit}</span>
                            <span style={{ fontSize: '0.58rem', color: t.remaining === 0 ? '#ef4444' : '#22c55e' }}>
                              {t.remaining === 0 ? 'Full' : `${t.remaining} left`}
                            </span>
                          </div>
                        </div>
                        <div style={{ background: '#1a1a1a', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                          <div className="bar-fill-3" style={{ width: `${usedPct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {sec.selfInterview.sessions > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a855f7' }}>{sec.selfInterview.sessions}</div>
                    <div style={{ fontSize: '0.58rem', color: '#444' }}>Total Sessions</div>
                  </div>
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: sec.selfInterview.avgScore > 0 ? scoreColor(sec.selfInterview.avgScore) : '#333' }}>
                      {sec.selfInterview.avgScore > 0 ? `${sec.selfInterview.avgScore}%` : '—'}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: '#444' }}>Avg Score</div>
                  </div>
                </div>
              )}
            </div>

            {/* Resume Based */}
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaFileAlt size={13} color="#ec4899" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Resume Based</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: '#666' }}>{sec.resumeInterview.monthlyLimit} attempts · this month</span>
              </div>

              {/* Monthly usage meter */}
              <div style={{ background: '#141414', borderRadius: 9, padding: '0.65rem 0.8rem', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', color: '#888' }}>Monthly usage</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ec4899' }}>
                      {sec.resumeInterview.usedThisMonth}/{sec.resumeInterview.monthlyLimit}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: sec.resumeInterview.remainingThisMonth === 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                      {sec.resumeInterview.remainingThisMonth === 0 ? 'Limit reached' : `${sec.resumeInterview.remainingThisMonth} remaining`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: sec.resumeInterview.monthlyLimit }).map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: i < sec.resumeInterview.usedThisMonth
                        ? (sec.resumeInterview.usedThisMonth >= sec.resumeInterview.monthlyLimit ? '#ef4444' : '#ec4899')
                        : '#1e1e1e',
                    }} />
                  ))}
                </div>
              </div>

              {/* Attempt list */}
              {sec.resumeInterview.sessions === 0 ? (
                <div style={{ fontSize: '0.7rem', color: '#333', textAlign: 'center' as const, padding: '0.75rem 0' }}>No resume interviews yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
                  {sec.resumeInterview.attempts.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#141414', borderRadius: 7, padding: '0.45rem 0.7rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#ec4899', fontWeight: 700 }}>
                          #{a.attemptNumber ?? i + 1}
                        </span>
                        <span style={{
                          fontSize: '0.58rem', borderRadius: 4, padding: '1px 5px',
                          color: a.isScored ? '#22c55e' : '#f59e0b',
                          background: a.isScored ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          border: `1px solid ${a.isScored ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}>
                          {a.isScored ? 'Scored' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: a.totalScore != null ? scoreColor(a.totalScore) : '#444' }}>
                          {a.totalScore != null ? `${Math.round(a.totalScore)}%` : '—'}
                        </span>
                        <span style={{ fontSize: '0.57rem', color: '#555' }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 05 Code Challenges ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="05" title="Code Challenges" sub="Problem availability and student progress" color="#06b6d4" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

            {/* Availability */}
            <div>
              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.55rem' }}>AVAILABLE PROBLEMS</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
                <DiffRow level="Easy"   available={rep.codeStats?.available.easy   ?? 0} color="#22c55e" />
                <DiffRow level="Medium" available={rep.codeStats?.available.medium ?? 0} color="#f59e0b" />
                <DiffRow level="Hard"   available={rep.codeStats?.available.hard   ?? 0} color="#ef4444" />
              </div>
              <div style={{ marginTop: '0.55rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '0.5rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: '#555' }}>Total Available</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#06b6d4' }}>{totalCodeAvail}</span>
              </div>
            </div>

            {/* Student progress */}
            <div>
              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.55rem' }}>STUDENT PROGRESS</div>
              <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '0.4rem', height: 'calc(100% - 24px)' }}>
                <FaCode size={20} color={rep.codeStats?.solved > 0 ? '#06b6d4' : '#222'} />
                <div style={{ fontSize: '2rem', fontWeight: 900, color: rep.codeStats?.solved > 0 ? '#06b6d4' : '#222', lineHeight: 1 }}>
                  {rep.codeStats?.solved ?? 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#444' }}>Problems Solved</div>
                {totalCodeAvail > 0 && (
                  <>
                    <div style={{ width: '100%', background: '#1a1a1a', borderRadius: 4, height: 5, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{
                        width: pct(Math.round(((rep.codeStats?.solved ?? 0) / totalCodeAvail) * 100)),
                        height: '100%', background: 'linear-gradient(90deg, #06b6d488, #06b6d4)', borderRadius: 4, animation: 'barFill 0.9s cubic-bezier(.22,.68,0,1.2) 0.3s both',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#06b6d4' }}>
                      {Math.round(((rep.codeStats?.solved ?? 0) / totalCodeAvail) * 100)}% of total
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Assessments strip ── */}
        {sec.assessment.sessions > 0 && (
          <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
            <SectionHeader num="06" title="Assessments" sub="MCQ · Coding · TR · HR rounds" color="#f59e0b" />
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' as const }}>
              {[
                { label: 'Attempted', value: sec.assessment.sessions,   color: '#06b6d4' },
                { label: 'Passed',    value: sec.assessment.passed,     color: '#22c55e' },
                { label: 'Failed',    value: sec.assessment.sessions - sec.assessment.passed, color: '#ef4444' },
                { label: 'Pass Rate', value: sec.assessment.sessions > 0 ? `${Math.round((sec.assessment.passed / sec.assessment.sessions) * 100)}%` : '—', color: '#f59e0b' },
                { label: 'Avg Score', value: sec.assessment.avgScore > 0 ? `${sec.assessment.avgScore}%` : '—', color: scoreColor(sec.assessment.avgScore) },
              ].map(item => (
                <div key={item.label} style={{
                  flex: '1 1 80px', background: '#141414', border: `1px solid ${item.color}20`,
                  borderRadius: 9, padding: '0.7rem', textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.6rem', color: '#444', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── College Labs ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="07" title="College Labs" sub="Available labs and student completion" color="#ef4444" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.55rem' }}>AVAILABLE LABS</div>
              <div style={{ background: '#111', border: '1px solid #ef444418', borderRadius: 9, padding: '1rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: 90 }}>
                <FaFlask size={18} color={rep.activity.labsAvailable > 0 ? '#ef4444' : '#222'} />
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: rep.activity.labsAvailable > 0 ? '#ef4444' : '#222', lineHeight: 1 }}>{rep.activity.labsAvailable}</div>
                <div style={{ fontSize: '0.62rem', color: '#444' }}>Total Labs</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.55rem' }}>STUDENT PROGRESS</div>
              <div style={{ background: '#111', border: '1px solid #22c55e18', borderRadius: 9, padding: '1rem', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: 90 }}>
                <FaCheckCircle size={18} color={rep.activity.labsCompleted > 0 ? '#22c55e' : '#222'} />
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: rep.activity.labsCompleted > 0 ? '#22c55e' : '#222', lineHeight: 1 }}>{rep.activity.labsCompleted}</div>
                <div style={{ fontSize: '0.62rem', color: '#444' }}>Labs Completed</div>
              </div>
            </div>
          </div>
          {rep.activity.labsAvailable > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.62rem', color: '#444' }}>Completion rate</span>
                <span style={{ fontSize: '0.62rem', color: '#22c55e' }}>
                  {Math.round((rep.activity.labsCompleted / rep.activity.labsAvailable) * 100)}%
                </span>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                  width: pct(Math.round((rep.activity.labsCompleted / rep.activity.labsAvailable) * 100)),
                  height: '100%', background: 'linear-gradient(90deg, #22c55e88, #22c55e)', borderRadius: 4, animation: 'barFill 0.9s cubic-bezier(.22,.68,0,1.2) 0.3s both',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Freelance Tasks ── */}
        <div className="report-section" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
          <SectionHeader num="08" title="Freelance Tasks" sub="Institute tasks · Assigned · Completed" color="#f59e0b" />

          {/* 3-stat summary */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
            {[
              { label: 'Available',  value: rep.activity.freelanceAvailable,  color: '#f59e0b', icon: FaStar },
              { label: 'Assigned',   value: rep.activity.freelanceAssigned,   color: '#3b82f6', icon: FaFileAlt },
              { label: 'Completed',  value: rep.activity.freelanceCompleted,  color: '#22c55e', icon: FaCheckCircle },
            ].map(item => (
              <div key={item.label} style={{
                flex: '1 1 90px', background: '#141414', border: `1px solid ${item.color}20`,
                borderRadius: 10, padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={15} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: item.value > 0 ? item.color : '#333', lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: '0.6rem', color: '#444', marginTop: 2 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          {rep.activity.freelanceAvailable > 0 && (
            <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 9, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
              {[
                { label: 'Assigned rate',   value: rep.activity.freelanceAssigned,  total: rep.activity.freelanceAvailable, color: '#3b82f6' },
                { label: 'Completion rate', value: rep.activity.freelanceCompleted, total: rep.activity.freelanceAvailable, color: '#22c55e' },
              ].map(bar => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.62rem', color: '#444' }}>{bar.label}</span>
                    <span style={{ fontSize: '0.62rem', color: bar.color, fontWeight: 700 }}>
                      {bar.value} / {bar.total} ({Math.round((bar.value / bar.total) * 100)}%)
                    </span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{ width: pct(Math.round((bar.value / bar.total) * 100)), height: '100%', background: `linear-gradient(90deg, ${bar.color}88, ${bar.color})`, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    )
  }

  /* ── Table UI ── */
  return (
    <div style={{ color: '#fff' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
            <FaUserGraduate size={14} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Student Reports</div>
            <div style={{ fontSize: '0.68rem', color: '#555' }}>
              {loadingList ? 'Loading…' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative' as const, flex: '0 1 320px' }}>
          <FaSearch size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
          <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
            placeholder="Search by name, email or roll no…"
            style={{ width: '100%', background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '8px 10px 8px 30px', color: '#fff', fontSize: '0.81rem', outline: 'none' }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 140px 160px', padding: '0.6rem 1rem', borderBottom: '1px solid #1a1a1a', background: '#141414' }}>
          {['#', 'Student', 'Roll / Branch', 'From', 'To', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loadingList && (
          <div style={{ padding: '2.5rem', textAlign: 'center' as const }}>
            <div style={{ width: 20, height: 20, border: '2px solid #ff6b00', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
            <div style={{ color: '#444', fontSize: '0.78rem' }}>Loading students…</div>
          </div>
        )}
        {!loadingList && paginated.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center' as const, color: '#333', fontSize: '0.8rem' }}>No students found</div>
        )}

        {!loadingList && paginated.map((s, i) => {
          const row = getRow(s._id)
          return (
            <div key={s._id}
              style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 140px 160px', padding: '0.65rem 1rem', borderBottom: '1px solid #141414', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#111')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ fontSize: '0.72rem', color: '#333', fontWeight: 600 }}>{(page - 1) * PAGE_SIZE + i + 1}</div>
              <div>
                <div style={{ fontSize: '0.82rem', color: '#ddd', fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sName(s)}</div>
                <div style={{ fontSize: '0.67rem', color: '#444', marginTop: 1 }}>{s.email}</div>
              </div>
              <div>
                {s.rollNumber && <div style={{ fontSize: '0.72rem', color: '#777' }}>{s.rollNumber}</div>}
                {s.branch    && <div style={{ fontSize: '0.67rem', color: '#444' }}>{s.branch}</div>}
                {!s.rollNumber && !s.branch && <span style={{ color: '#2a2a2a', fontSize: '0.7rem' }}>—</span>}
              </div>
              <div>
                <input type="date" value={row.from} onChange={e => setRow(s._id, { from: e.target.value })}
                  style={{ background: '#141414', border: '1px solid #222', borderRadius: 6, padding: '5px 7px', color: '#aaa', fontSize: '0.72rem', outline: 'none', colorScheme: 'dark', width: '100%' }} />
              </div>
              <div>
                <input type="date" value={row.to} onChange={e => setRow(s._id, { to: e.target.value })}
                  style={{ background: '#141414', border: '1px solid #222', borderRadius: 6, padding: '5px 7px', color: '#aaa', fontSize: '0.72rem', outline: 'none', colorScheme: 'dark', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => generateReport(s, 'preview')} disabled={row.loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 6, padding: '5px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: row.loading ? 'not-allowed' : 'pointer', opacity: row.loading ? 0.6 : 1 }}>
                  {row.loading
                    ? <div style={{ width: 10, height: 10, border: '1.5px solid #aaa6', borderTop: '1.5px solid #aaa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <FaEye size={10} />}
                  Preview
                </button>
                <button onClick={() => generateReport(s, 'download')} disabled={row.loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', color: '#ff6b00', borderRadius: 6, padding: '5px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: row.loading ? 'not-allowed' : 'pointer', opacity: row.loading ? 0.6 : 1 }}>
                  <FaFileDownload size={10} /> PDF
                </button>
              </div>
            </div>
          )
        })}

        {!loadingList && filtered.length > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid #1a1a1a', background: '#0d0d0d' }}>
            <div style={{ fontSize: '0.72rem', color: '#444' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: '#141414', border: '1px solid #222', color: page === 1 ? '#2a2a2a' : '#888', borderRadius: 6, padding: '4px 8px', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <FaChevronLeft size={10} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
                const p = page <= 3 ? k + 1 : page - 2 + k
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ background: p === page ? '#ff6b00' : '#141414', border: `1px solid ${p === page ? '#ff6b00' : '#222'}`, color: p === page ? '#fff' : '#666', borderRadius: 6, padding: '4px 9px', fontSize: '0.72rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer', minWidth: 28, textAlign: 'center' as const }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: '#141414', border: '1px solid #222', color: page === totalPages ? '#2a2a2a' : '#888', borderRadius: 6, padding: '4px 8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen>
        <Modal.Header closeButton style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaUserGraduate size={16} color="#ff6b00" />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {report ? `${report.student.name} — Performance Report` : 'Performance Report'}
              </div>
              {report && (
                <div style={{ color: '#444', fontSize: '0.68rem' }}>
                  {report.period.from || report.period.to ? `${fmt(report.period.from)} → ${fmt(report.period.to)}` : 'All Time'}
                </div>
              )}
            </div>
          </div>
          {report && (
            <button onClick={triggerPrint}
              style={{ marginLeft: 'auto', marginRight: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ff6b00', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <FaFileDownload size={12} /> Download PDF
            </button>
          )}
        </Modal.Header>
        <Modal.Body style={{ background: '#080808', padding: '1.5rem', overflowY: 'auto' as const }}>
          {modalError && (
            <div style={{ background: '#1a0a0a', border: '1px solid #5a1a1a', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}
          {report && <ReportBody rep={report} />}
        </Modal.Body>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default StudentReports
