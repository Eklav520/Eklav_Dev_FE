import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import React, { useState, useEffect } from 'react'
import { Table, Spinner, Container, Alert, Pagination, Card } from 'react-bootstrap'

interface Profile {
  _id: string
  fullName: string
  courses?: string[]
}

interface QuizResult {
  _id: string
  user: string
  course: string
  score: number
  total: number
  submittedAt: string
}

interface ApiData {
  profiles: Profile[]
  results: QuizResult[]
  courseMap: Record<string, string>
}

const AdminQuizResults: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [results, setResults] = useState<QuizResult[]>([])
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [courseMap, setCourseMap] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const { user } = useAuthContext()
  const token = user?.token

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${baseURL}/admin/quiz-results`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data: ApiData = await res.json()
        setProfiles(data.profiles)
        setResults(data.results)
        setCourseMap(data.courseMap)
      } catch (err) {
        setError('Failed to load quiz results.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleToggle = (key: string) => setOpenRows((prev) => ({ ...prev, [key]: !prev[key] }))

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProfiles = profiles.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(profiles.length / itemsPerPage)

  const paginationItems = Array.from({ length: totalPages }, (_, i) => (
    <Pagination.Item key={i + 1} active={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
      {i + 1}
    </Pagination.Item>
  ))

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }

  return (
    <Card className="border bg-transparent rounded-3 py-4 px-3">
      <h4 className="mb-4 text-light-emphasis">📊 Quiz Results Overview</h4>
      <Table striped bordered hover responsive variant="dark">
        <thead className="table-dark">
          <tr>
            <th>Dropdown</th>
            <th>Student</th>
            <th>Quiz %</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {currentProfiles.map((profile) => {
            const stuKey = `stu-${profile._id}`
            const isOpen = !!openRows[stuKey]
            const enrolledCourses = profile.courses?.filter((id) => courseMap[id]) || []

            return (
              <React.Fragment key={stuKey}>
                {/* Student Row */}
                <tr onClick={() => handleToggle(stuKey)} style={{ cursor: 'pointer' }} className="bg-secondary text-light">
                  <td>{isOpen ? '▼' : '▶'}</td>
                  <td colSpan={3}>
                    <strong>{profile.fullName}</strong>
                  </td>
                </tr>

                {/* Course Rows */}
                {isOpen &&
                  enrolledCourses.length > 0 &&
                  enrolledCourses.map((courseId) => {
                    const quiz = results.find((r) => r.user === profile._id && r.course === courseId)
                    const perc = quiz && quiz.total > 0 ? Math.round((quiz.score / quiz.total) * 100) : 0
                    const percClass = perc === 0 ? 'text-muted' : perc < 40 ? 'text-danger' : perc < 80 ? 'text-warning' : 'text-success'

                    return (
                      <tr key={`${stuKey}-${courseId}`} className="bg-dark text-light">
                        <td></td>
                        <td style={{ paddingLeft: '2rem' }}>{courseMap[courseId]}</td>
                        <td className={percClass}>{quiz ? `${perc}%` : <span className="text-muted">Not Attempted</span>}</td>
                        <td>
                          {quiz && quiz.submittedAt ? (
                            new Date(quiz.submittedAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                {/* No Enrolled Courses */}
                {isOpen && enrolledCourses.length === 0 && (
                  <tr className="bg-dark text-light">
                    <td></td>
                    <td colSpan={3} style={{ paddingLeft: '2rem' }}>
                      No enrolled courses.
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </Table>
      <div className="d-flex justify-content-center mt-3">
        <Pagination className="pagination-sm pagination-primary-soft">{paginationItems}</Pagination>
      </div>
    </Card>
  )
}

export default AdminQuizResults
