import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

export interface InterviewerRef { name: string; teamMemberId?: string | null }

export interface Interview {
  _id: string
  candidateName: string
  candidateEmail?: string
  jobTitle?: string
  interviewType: string
  interviewers?: InterviewerRef[]
  scheduledAt: string
  durationMinutes?: number
  meetingLink?: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  feedbackScore?: number | null
  feedbackNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Permissions {
  viewCandidates: boolean; scheduleInterview: boolean; conductInterview: boolean
  provideFeedback: boolean; assessmentReports: boolean; manageSettings: boolean; manageUsers: boolean
}

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export const useMyInterviews = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [interviews, setInterviews] = useState<Interview[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberRole, setMemberRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/my-interviews`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || 'Failed to load your interviews')
        return r.json()
      })
      .then(data => {
        setInterviews(Array.isArray(data.interviews) ? data.interviews : [])
        setPermissions(data.permissions || null)
        setMemberName(data.member?.name || '')
        setMemberRole(data.member?.role || '')
        setLoadError('')
      })
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  const startInterview = async (iv: Interview) => {
    setActionError('')
    try {
      const res = await fetch(`${baseURL}/interviews/${iv._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress' }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to update status')
      fetchAll()
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status')
    }
  }

  const now = new Date()
  const today = useMemo(() => interviews.filter(iv => isSameDay(new Date(iv.scheduledAt), now)), [interviews])
  const upcoming = useMemo(() => {
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return interviews.filter(iv => {
      const d = new Date(iv.scheduledAt)
      return (iv.status === 'Scheduled' || iv.status === 'In Progress') && d.getTime() >= now.getTime() && d.getTime() <= in7.getTime()
    })
  }, [interviews])
  const tomorrow = useMemo(() => {
    const t = new Date(now); t.setDate(t.getDate() + 1)
    return interviews.filter(iv => isSameDay(new Date(iv.scheduledAt), t))
  }, [interviews])
  const thisWeek = useMemo(() => {
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return interviews.filter(iv => {
      const d = new Date(iv.scheduledAt)
      return d.getTime() >= now.getTime() && d.getTime() <= in7.getTime()
    })
  }, [interviews])
  const scheduledOnly = useMemo(() => interviews.filter(iv => iv.status === 'Scheduled'), [interviews])
  const completed = useMemo(() => interviews.filter(iv => iv.status === 'Completed'), [interviews])
  const cancelled = useMemo(() => interviews.filter(iv => iv.status === 'Cancelled'), [interviews])
  const completedThisMonth = useMemo(() => completed.filter(iv => isSameMonth(new Date(iv.updatedAt || iv.scheduledAt), now)), [completed])
  const cancelledThisMonth = useMemo(() => cancelled.filter(iv => isSameMonth(new Date(iv.updatedAt || iv.scheduledAt), now)), [cancelled])
  const feedbackGiven = useMemo(() => interviews.filter(iv => typeof iv.feedbackScore === 'number'), [interviews])
  const feedbackGivenThisMonth = useMemo(() => feedbackGiven.filter(iv => isSameMonth(new Date(iv.updatedAt || iv.scheduledAt), now)), [feedbackGiven])

  return {
    interviews, permissions, memberName, memberRole, loading, loadError, actionError, setActionError,
    fetchAll, startInterview,
    today, upcoming, tomorrow, thisWeek, scheduledOnly, completed, cancelled,
    completedThisMonth, cancelledThisMonth, feedbackGiven, feedbackGivenThisMonth,
  }
}
