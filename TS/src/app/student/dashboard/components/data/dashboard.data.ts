// data/dashboard.data.ts
import {
  FaClock,
  FaBookOpen,
  FaBullseye,
  FaTrophy,
  FaFire,
  FaUsers,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

/* ================= TYPES ================= */

export type GrammarSkill = 'Speaking' | 'Listening' | 'Writing'
export type GrammarMode = 'Today' | 'Weekly' | 'Overall'

export type KPI = {
  label: string
  value: string | number
  icon: any
  color: string
  bgColor: string
  trend: string
  graphData?: number[] // ✅ ADD THIS
}

export type QuickStat = {
  label: string
  value: string
  icon: IconType
  color: string
}

/* ================= STUDENT ================= */

export const student = {
  name: 'Jagadeesh K',
  completion: 17,
}

/* ================= KPI ================= */

export const kpis: KPI[] = [
  {
    label: 'Courses Count',
    value: '24',
    icon: FaClock,
    color: 'primary',
    bgColor: 'rgba(13,110,253,.1)',
    trend: '+2%',
  },
  {
    label: 'Enrolled Courses',
    value: '2',
    icon: FaBookOpen,
    color: 'success',
    bgColor: 'rgba(25,135,84,.1)',
    trend: '+1',
  },
  {
    label: 'Accuracy',
    value: '78%',
    icon: FaBullseye,
    color: 'warning',
    bgColor: 'rgba(255,193,7,.1)',
    trend: '+5%',
  },
  {
    label: 'Rank',
    value: '#',
    icon: FaTrophy,
    color: 'info',
    bgColor: 'rgba(13,202,240,.1)',
    trend: '↑12',
  },
]

/* ================= QUICK STATS ================= */

export const quickStats: QuickStat[] = [
  {
    label: 'Current Streak',
    value: '5 days',
    icon: FaFire,
    color: '#FF6B6B',
  },
  {
    label: 'Avg Daily Time',
    value: '2.4 hrs',
    icon: FaClock,
    color: '#4ECDC4',
  },
  {
    label: 'Peer Rank',
    value: 'Top 15%',
    icon: FaUsers,
    color: '#45B7D1',
  },
]

/* ================= ENGLISH GRAMMAR ================= */

export const grammarData: Record<
  GrammarMode,
  Record<GrammarSkill, number>
> & { lastPracticed: string } = {
  Today: {
    Speaking: 58,
    Listening: 61,
    Writing: 64,
  },
  Weekly: {
    Speaking: 56,
    Listening: 89,
    Writing: 74,
  },
  Overall: {
    Speaking: 72,
    Listening: 60,
    Writing: 68,
  },
  lastPracticed: '22 Feb 2025',
}

export const grammarRankByMode: Record<GrammarMode, number> = {
  Today: 112,
  Weekly: 72,
  Overall: 58,
}

export const grammarSkillRanks: Record<GrammarSkill, number> = {
  Speaking: 124,
  Listening: 18,
  Writing: 52,
}

export const grammarTrendData: Record<GrammarSkill, number[]> = {
  Speaking: [48, 52, 55, 58, 62, 72],
  Listening: [50, 55, 58, 60, 64, 60],
  Writing: [45, 50, 56, 60, 64, 68],
}

/* ================= WEEKLY PERFORMANCE ================= */

export const weeklyProgressData = [
  { day: 'Mon', hours: 2.5, score: 65 },
  { day: 'Tue', hours: 3.2, score: 70 },
  { day: 'Wed', hours: 1.8, score: 58 },
  { day: 'Thu', hours: 4.1, score: 82 },
  { day: 'Fri', hours: 2.9, score: 75 },
  { day: 'Sat', hours: 3.5, score: 88 },
  { day: 'Sun', hours: 2.0, score: 72 },
]

/* ================= SELF PREPARATION ================= */

export const selfPrep = {
  aiInterview: {
    Today: { score: 55, rank: 110 },
    Weekly: { score: 62, rank: 72 },
  },
  coding: {
    easy: 12,
    medium: 5,
    hard: 1,
    rank: 220,
  },
  aptitude: {
    marks: 70,
    rank: 95,
  },
}

/* ================= ADMIN UPDATES ================= */

export type UpdateType = 'info' | 'success' | 'warning'

export const adminUpdates: {
  text: string
  date: string
  type: UpdateType
}[] = [
  { text: 'New Aptitude Test released', date: 'Today', type: 'info' },
  { text: 'AI Interview v2 is live', date: '2 days ago', type: 'success' },
  { text: 'English Speaking mock on Friday', date: '1 week ago', type: 'warning' },
]

/* ================= ATTENDANCE ================= */

export type AttendanceStatus = 'present' | 'absent'
export type AttendanceMap = Record<string, AttendanceStatus>

export const attendanceByMonth: Record<string, AttendanceMap> = {
  '2025-03': {
    '2025-03-01': 'present',
    '2025-03-02': 'absent',
    '2025-03-03': 'present',
    '2025-03-04': 'present',
    '2025-03-05': 'absent',
    '2025-03-06': 'present',
    '2025-03-07': 'present',
  },
}

/* ================= COURSES ================= */

export type CourseSkill = {
  skill: string
  progress: number
  color: string
}

export type Course = {
  name: string
  status: string
  rank: number
  progress: number
  color: string
  skills: CourseSkill[]
}

export const courses: Course[] = [
  {
    name: 'Full Stack MERN',
    status: 'In Progress',
    rank: 0,
    progress: 65,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    skills: [
      { skill: 'React', progress: 85, color: '#667eea' },
      { skill: 'Node.js', progress: 72, color: '#24c6dc' },
      { skill: 'MongoDB', progress: 68, color: '#f46b45' },
      { skill: 'JavaScript', progress: 92, color: '#56ab2f' },
    ],
  },
  {
    name: 'Python',
    status: 'In Progress',
    rank: 88,
    progress: 48,
    color: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    skills: [
      { skill: 'Basics', progress: 70, color: '#f7971e' },
      { skill: 'OOP', progress: 52, color: '#ffb347' },
    ],
  },
  {
    name: 'Power BI',
    status: 'Not Started',
    rank: 0,
    progress: 0,
    color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    skills: [],
  },
]

