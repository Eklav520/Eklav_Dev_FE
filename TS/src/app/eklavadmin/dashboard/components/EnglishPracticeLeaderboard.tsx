import { useEffect, useState } from 'react'
import { Table, Spinner, Alert, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

type StudentProfile = {
  _id: string
  userId: string
  fullName: string
  college?: string
}

type RankItem = {
  rank: number
  studentId: string
  student?: StudentProfile
  bestScore: number
  avgScore: number
  attemptCount: number
}

type RankingResponse = {
  section: string
  subSection: string
  weekKey: string
  totalStudents: number
  leaderboard: RankItem[]
}

const rankEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

const EnglishPracticeLeaderboard = ({
  section,
  subSection,
  weekKey,
  college,
}: {
  section: string
  subSection: string
  weekKey: string
  college?: string | null
}) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true)

        const res = await axios.get(
          `${baseURL}/api/englishPracticeRanking/weekly`,
          {
            params: {
              section,
              subSection,
              weekKey,
              ...(college ? { college } : {}), // ✅ college filter
            },
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        )

        setData(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load ranking')
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [section, subSection, weekKey, college, baseURL, user?.token])

  if (loading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error}</Alert>
  if (!data || !data.leaderboard.length)
    return <Alert variant="info">No ranking available</Alert>

  return (
    <div>
      <h5 className="mb-3">
        Weekly Leaderboard{' '}
        <Badge bg="secondary">{weekKey}</Badge>
      </h5>

      <Table striped bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th>Rank</th>
            <th>Student</th>
            <th>Best</th>
            <th>Avg</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {data.leaderboard.map(row => {
            const isMe = row.student?.userId === user?.id

            return (
              <tr
                key={row.rank}
                className={isMe ? 'table-primary' : ''}
              >
                <td>
                  <strong>{rankEmoji(row.rank) ?? row.rank}</strong>
                </td>

                <td>
                  <div>{row.student?.fullName || '—'}</div>
                  {row.student?.college && (
                    <div className="text-muted small">
                      {row.student.college}
                    </div>
                  )}
                </td>

                <td>{row.bestScore}</td>
                <td>{row.avgScore.toFixed(1)}</td>
                <td>{row.attemptCount}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      <div className="text-muted small">
        Total Students: {data.totalStudents}
      </div>
    </div>
  )
}

export default EnglishPracticeLeaderboard
