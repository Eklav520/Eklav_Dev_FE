/* Shared types and derived metrics for student performance reports */

export type Student = { _id: string; name?: string; fullName?: string; email: string; branch?: string; rollNumber?: string; gender?: string; joiningYear?: string | number }

export type SectionStat    = { sessions: number; totalAttempts?: number; avgScore: number }
export type AssessmentStat = { sessions: number; passed: number; avgScore: number }
export type TopicAttempt   = { topic: string; usedThisMonth: number; remaining: number }
export type TopicStat      = SectionStat & { monthlyLimit?: number; topicsAttempted?: TopicAttempt[]; topicsAvailable?: string[] }
export type ResumeAttempt  = { attemptNumber: number | null; totalScore: number | null; isScored: boolean; createdAt: string }
export type ResumeStat     = { sessions: number; avgScore: number; monthlyLimit: number; usedThisMonth: number; remainingThisMonth: number; attempts: ResumeAttempt[] }
export type EnglishSection = {
  attemptsUsed: number; monthlyLimit: number; remainingAttempts: number
  bestScore: number | null; latestScore: number | null; avgScore: number
  trend: string
  attempts: { attempt: number; score: number; date: string }[]
}

export type VocabSection = {
  totalWordsLearned: number; wordsMastered: number; masteredPercentOfLearned: number
  wordsToReview: number; wordsPracticedInPeriod: number
  currentLevel: string; nextLevel: string | null
}

export type CourseItem = { courseId: string; title: string; progress: number }

/* Extra detail returned by student-report (newer API versions) */
export type ReportDetail = {
  interviewTopics: { topic: string; sessions: number; avgScore: number; bestScore: number | null; lastAt: string | null }[]
  recentInterviews: { topic: string; score: number | null; date: string | null }[]
  code: { solvedByDifficulty: { easy: number; medium: number; hard: number }; recentSolved: { title: string; difficulty: string | null; solvedAt: string }[] }
  recentAssessments: { score: number | null; result: string | null; date: string }[]
  dailyActivity: { date: string; secs: number }[]
  longestStreak: number
  lastActiveDate: string | null
}

export type Report = {
  student: { _id: string; name: string; email: string; branch: string; rollNumber: string; gender: string; college: string; department: string; joiningYear: string | number; batch: string; skills: string[]; profileImage: string; reportId: string }
  period: { from: string | null; to: string | null }
  overallScore: number; englishAvg: number; aiAvg: number
  /* Computed by the API from the six module scores; absent on older API versions */
  status?: ReportStatus
  moduleScores?: Record<'engagement' | 'course' | 'interview' | 'english' | 'assessment' | 'code', number>
  periodDays?: number
  rank: { position: number; total: number; score?: number; overallPosition?: number | null; overallTotal?: number | null } | null
  timeSpent: { totalSecs: number; uniqueDays: number; avgMinPerDay: number; label: string }
  courses: CourseItem[]
  totalCoursesAvailable: number
  overallCourseProgress: number
  codeStats: { available: { easy: number; medium: number; hard: number }; solved: number }
  activity: { labsCompleted: number; labsAvailable: number; freelanceAvailable: number; freelanceAssigned: number; freelanceCompleted: number; codeSolved: number }
  sections: {
    speaking: EnglishSection; writing: EnglishSection; reading: EnglishSection
    listening: EnglishSection; jam: EnglishSection
    vocabulary: VocabSection
    selfInterview: TopicStat; resumeInterview: ResumeStat
    assessment: AssessmentStat
  }
  detail?: ReportDetail | null
}
export type ReportStatus = 'on-track' | 'needs-attention' | 'at-risk' | 'not-started'
export type TrendPoint = { label: string; score: number | null }

export const sName = (s: Student) => s.fullName || s.name || s.email

/* profileImage is either a full URL (S3/CDN) or a path served by the API */
export const profileImageUrl = (path?: string) =>
  !path ? '' : /^(https?:|data:)/.test(path) ? path : `${import.meta.env.VITE_API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

/* Institute rank from the nightly rank job, e.g. { label: '#3', total: '/ 120' } */
export const rankText = (report: Report) =>
  report.rank?.position ? { label: `#${report.rank.position}`, total: `/ ${report.rank.total}` } : null

export const reportStatus = (score: number): ReportStatus =>
  score >= 75 ? 'on-track' : score >= 50 ? 'needs-attention' : 'at-risk'
/* Prefer the API's status — it also knows when a student has no activity at all */
export const statusOf = (report: Report): ReportStatus => report.status ?? reportStatus(report.overallScore)
export const STATUS_LABELS: Record<ReportStatus, string> = {
  'on-track': 'On Track', 'needs-attention': 'Needs Attention', 'at-risk': 'At Risk', 'not-started': 'Not Started',
}
export const ENGLISH_KEYS = ['speaking', 'writing', 'reading', 'listening', 'jam'] as const
/* The API falls back to uniqueDays = 1 when there are no sessions (to avoid dividing by zero) */
export const activeDays = (report: Report) => report.timeSpent.totalSecs > 0 ? report.timeSpent.uniqueDays : 0

export const reportMetrics = (report: Report, periodDays: number) => {
  const activityPercent = periodDays > 0
    ? Math.min(100, Math.round((activeDays(report) / periodDays) * 100))
    : 0
  const availableChallenges = report.codeStats.available.easy + report.codeStats.available.medium + report.codeStats.available.hard
  return [
    { key: 'engagement', label: 'Daily Engagement', score: activityPercent, detail: `${activeDays(report)} / ${periodDays} days` },
    { key: 'course', label: 'Course Progress', score: Math.round(report.overallCourseProgress), detail: `${report.courses.filter(c => c.progress >= 100).length} / ${report.courses.length} courses` },
    { key: 'interview', label: 'AI Interview', score: Math.round(report.aiAvg), detail: `${report.sections.selfInterview.sessions + report.sections.resumeInterview.sessions} attempts` },
    { key: 'english', label: 'English Practice', score: Math.round(report.englishAvg), detail: `${ENGLISH_KEYS.filter(key => report.sections[key]?.attemptsUsed > 0).length} / 5 modules` },
    { key: 'assessment', label: 'Assessments', score: Math.round(report.sections.assessment.avgScore), detail: `${report.sections.assessment.passed} / ${report.sections.assessment.sessions} passed` },
    { key: 'code', label: 'Code Challenge', score: availableChallenges > 0 ? Math.round((report.codeStats.solved / availableChallenges) * 100) : 0, detail: `${report.codeStats.solved} / ${availableChallenges} problems` },
  ]
}

export type ReportMetric = ReturnType<typeof reportMetrics>[number]

/* `timeSpent.label` is a rating ("Good" / "Average" / …), so format the real duration */
export const formatDuration = (totalSecs: number) => {
  const minutes = Math.round((totalSecs || 0) / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours >= 10) return `${hours} hrs`
  return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`
}

export const activitiesCompleted = (report: Report) =>
  ENGLISH_KEYS.reduce((total, key) => total + (report.sections[key]?.attemptsUsed || 0), 0)
  + report.sections.assessment.sessions
  + report.sections.selfInterview.sessions
  + report.sections.resumeInterview.sessions
  + report.codeStats.solved
  + report.activity.labsCompleted

const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/* The `count` calendar months ending with the month of `endISO`, oldest first */
export const monthRanges = (endISO: string, count: number) => {
  const end = new Date(`${endISO}T00:00:00`)
  const today = isoDate(new Date())
  return Array.from({ length: count }, (_, i) => {
    const first = new Date(end.getFullYear(), end.getMonth() - (count - 1 - i), 1)
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    const to = isoDate(last) > today ? today : isoDate(last)
    return {
      label: first.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      from: isoDate(first),
      to,
    }
  })
}
