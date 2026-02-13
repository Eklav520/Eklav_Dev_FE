import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

export type EnglishSection =
  | 'SPEAKING'
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'JUST_A_MINUTE'

export type EnglishAttempt = {
  attempt: number
  score: number | null
  date: string
}

export type EnglishSectionHistory = {
  monthlyLimit: number
  attemptsUsed: number
  remainingAttempts: number
  summary: {
    bestScore: number | null
    latestScore: number | null
    trend: 'UP' | 'DOWN' | 'SAME' | 'NA'
  }
  attempts: EnglishAttempt[]
}


export type EnglishDashboardHistory = Record<
  EnglishSection,
  EnglishSectionHistory
>

export const useEnglishDashboardHistory = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<EnglishDashboardHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return

    setLoading(true)

    fetch(`${baseURL}/api/dashboard/english/history`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [user?.token, baseURL])

  return { data, loading }
}
