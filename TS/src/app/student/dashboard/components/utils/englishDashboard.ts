import { EnglishSectionHistory } from '../hooks/useEnglishDashboardHistory'

export const filterAttemptsByMode = (
  history: EnglishSectionHistory,
  mode: 'Today' | 'Weekly' | 'Overall'
) => {
  if (!history?.attempts) return []

  const today = new Date().toDateString()

  if (mode === 'Today') {
    return history.attempts.filter(
      a => new Date(a.date).toDateString() === today
    )
  }

  if (mode === 'Weekly') {
    return history.attempts
  }

  // Overall → use weekly attempts for graph
  return history.attempts
}

export const getScoreByMode = (
  history: EnglishSectionHistory,
  mode: 'Today' | 'Weekly' | 'Overall'
) => {
  if (!history) return 0

  if (mode === 'Overall') {
    return history.summary.bestScore ?? 0
  }

  const attempts = filterAttemptsByMode(history, mode)
  const scores = attempts.map(a => a.score).filter(Boolean) as number[]

  if (!scores.length) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export const getTrendData = (
  history: EnglishSectionHistory,
  mode: 'Today' | 'Weekly' | 'Overall'
) => {
  const attempts = filterAttemptsByMode(history, mode)
  return attempts.map(a => a.score ?? 0)
}
