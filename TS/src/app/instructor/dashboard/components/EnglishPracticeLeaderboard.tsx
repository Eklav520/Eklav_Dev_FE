import { useEffect, useState } from "react"
import { Table, Spinner, Alert, Badge } from "react-bootstrap"
import axios from "axios"
import { useAuthContext } from "@/context/useAuthContext"

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
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return null
}

const EnglishPracticeLeaderboard = ({
  section,
  subSection,
  weekKey
}: {
  section: string
  subSection: string
  weekKey: string
}) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/api/englishPracticeRanking/weekly`,
          {
            params: { section, subSection, weekKey },
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          }
        )
        setData(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load ranking")
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [section, subSection, weekKey, user?.token])

  if (loading) return <Spinner animation="border" />
  if (error) return <Alert variant="danger">{error}</Alert>
  if (!data) return null

  return (
    <div>
      <h5 className="mb-3">
        Weekly Leaderboard{" "}
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
          {data.leaderboard.map(row => (
            <tr
              key={row.rank}
              className={
                row.student?.userId === user?.id ? "table-primary" : ""
              }
            >
              <td>
                <strong>
                  {rankEmoji(row.rank) ?? row.rank}
                </strong>
              </td>

              <td>
                {row.student?.fullName || "—"}
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
          ))}
        </tbody>
      </Table>

      <div className="text-muted small">
        Total Students: {data.totalStudents}
      </div>
    </div>
  )
}

export default EnglishPracticeLeaderboard
