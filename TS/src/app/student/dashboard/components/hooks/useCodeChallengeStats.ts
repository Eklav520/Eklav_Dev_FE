import { useEffect, useState } from 'react'
import { fetchProblems, Problem } from '../data/problems.data'

type CodeStats = {
  easy: number
  medium: number
  hard: number
  total: number
}

export const useCodeChallengeStats = (completedProblemIds: number[]) => {
  const [stats, setStats] = useState<CodeStats>({
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  })

  useEffect(() => {
    const load = async () => {
      const problems: Problem[] = await fetchProblems()

      let easy = 0
      let medium = 0
      let hard = 0

      problems.forEach((p) => {
        if (completedProblemIds.includes(p.id)) {
  if (p.difficulty === 'Easy') easy++
  if (p.difficulty === 'Medium') medium++
  if (p.difficulty === 'Hard') hard++
}

      })

      setStats({
        easy,
        medium,
        hard,
        total: easy + medium + hard,
      })
    }

    if (completedProblemIds.length) load()
  }, [completedProblemIds])

  return stats
}
