import { Table, Spinner, Badge } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

type StudentProgress = {
  _id: string
  name: string
  college: string
  attempts: number
  bestScore?: number
  avgScore?: number
  lastAttemptDate?: string
}

const SectionStudentProgressTable = ({
  weekKey,
  apiType = 'writing',
}: {
  weekKey: string
  apiType?: 'writing' | 'reading' | 'listening' | 'justaMinute' | 'englishPractice'
}) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true)

        // ✅ endpoint selection for all sections
        const endpoint =
          apiType === 'reading'
            ? 'reading-section-progress'
            : apiType === 'listening'
            ? 'listening-section-progress'
            : apiType === 'justaMinute'
            ? 'justaMinute-section-progress'
            : apiType === 'englishPractice'
            ? 'english-practice-section-progress'
            : 'section-progress' // writing (default)

        const res = await fetch(
          `${baseURL}/api/adminDashboardHistoryTable/admin/${endpoint}?weekKey=${weekKey}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!res.ok) throw new Error('Failed to fetch section progress')

        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [weekKey, apiType, baseURL, user?.token])

  if (loading) return <Spinner animation="border" />

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>College</th>
          <th>Attempts</th>
          <th>Best Score</th>
          <th>Avg Score</th>
          <th>Last Attempt</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center text-muted">
              No data available
            </td>
          </tr>
        )}

        {data.map((s) => (
          <tr key={s._id}>
            <td>{s.name}</td>
            <td>{s.college}</td>

            <td>
              <Badge bg={s.attempts > 0 ? 'success' : 'secondary'}>
                {s.attempts}
              </Badge>
            </td>

            <td>{s.bestScore ?? '-'}</td>

            <td>{s.avgScore != null ? Math.round(s.avgScore) : '-'}</td>

            <td>
              {s.lastAttemptDate
                ? new Date(s.lastAttemptDate).toLocaleDateString()
                : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default SectionStudentProgressTable
