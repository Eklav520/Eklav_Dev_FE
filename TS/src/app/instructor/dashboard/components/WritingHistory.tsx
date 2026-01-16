import { useEffect, useState } from 'react'
import { Card, Table, Spinner, Badge, Pagination } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

type WritingAttempt = {
  studentId: string
  weekKey: string
  weeklyLimit: number
  attempt: number
  mode: string
  prompt: string
  score: number
  createdAt: string
}

const WritingHistory = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [data, setData] = useState<WritingAttempt[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchHistory = async (pageNo = 1) => {
    try {
      setLoading(true)

      const res = await fetch(
        `${baseURL}/api/adminDashboardCharts/admin/writing/history?page=${pageNo}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const result = await res.json()

      setData(result.data)
      setPage(result.page)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Failed to load writing history', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchHistory(page)
  }, [token, page])

  const scoreVariant = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  return (
    <Card className="border p-4 mt-4">
      <h5 className="mb-3">Writing History</h5>

      {loading ? (
        <div className="text-center py-5">
          <Spinner />
        </div>
      ) : (
        <>
          <Table hover responsive className="align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Week</th>
                <th>Attempt</th>
                <th>Mode</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={`${item.studentId}-${item.createdAt}`}>
                    <td>{(page - 1) * 10 + index + 1}</td>
                    <td>{item.studentId}</td>
                    <td>{item.weekKey}</td>
                    <td>{item.attempt}</td>
                    <td className="text-capitalize">{item.mode}</td>
                    <td>
                      <Badge bg={scoreVariant(item.score)}>
                        {item.score}
                      </Badge>
                    </td>
                    <td>
                      {new Date(item.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <Pagination className="justify-content-end">
              <Pagination.Prev
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i}
                  active={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              />
            </Pagination>
          )}
        </>
      )}
    </Card>
  )
}

export default WritingHistory
