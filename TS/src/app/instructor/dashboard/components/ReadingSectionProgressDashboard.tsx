import { useEffect, useState } from 'react'
import { Card, Form, Spinner } from 'react-bootstrap'
import SectionStudentProgressTable from './SectionStudentProgressTable'
import { useAuthContext } from '@/context/useAuthContext'

const ReadingSectionProgressDashboard = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [weeks, setWeeks] = useState<string[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/adminDashboardHistoryTable/admin/weeks`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        )

        if (!res.ok) throw new Error('Failed to fetch weeks')

        const data = await res.json()
        setWeeks(data)
        setSelectedWeek(data[data.length - 1]) // auto-select latest
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeeks()
  }, [baseURL, user?.token])

  if (loading) return <Spinner animation="border" />

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Reading Section Progress</h5>

        <Form.Select
          style={{ width: 150 }}
          value={selectedWeek ?? ''}
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Form.Select>
      </Card.Header>

      <Card.Body>
        {selectedWeek && (
          <SectionStudentProgressTable
            weekKey={selectedWeek}
            apiType="reading"
          />
        )}
      </Card.Body>
    </Card>
  )
}

export default ReadingSectionProgressDashboard
