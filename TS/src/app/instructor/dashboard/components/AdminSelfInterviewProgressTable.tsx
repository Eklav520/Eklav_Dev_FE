import { useEffect, useState } from 'react'
import { Card, Col, Row, Spinner, Table, Form, Button } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import axios from 'axios'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

type SelfInterviewRow = {
  _id: string
  name: string
  college: string
  topic: string
  attempts: number
  bestScore: number
  avgScore: number
  lastAttemptDate?: string
}

const ROWS_PER_PAGE = 10

const AdminSelfInterviewProgressTable = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<SelfInterviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [topic, setTopic] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchProgress()
  }, [topic])

  const fetchProgress = async () => {
    try {
      setLoading(true)

      const res = await axios.get(
        `${baseURL}/api/adminDashboardHistoryTable/admin/self-interview-progress`,
        {
          params: topic ? { topic } : {},
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )

      setData(res.data)
      setCurrentPage(1) // 🔁 reset page on filter change
    } catch (err) {
      console.error('Failed to fetch self interview progress', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 🔢 Pagination logic
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE
  const paginatedData = data.slice(startIndex, startIndex + ROWS_PER_PAGE)

  return (
    <Row>
      <Col>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Self Interview – Student Progress</h5>

            {/* Topic Filter */}
            <Form.Select
              style={{ width: 200 }}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              <option value="Redux">Redux</option>
              <option value="C">C</option>
              <option value="Python">Python</option>
              <option value="Data Science">Data Science</option>
              <option value="HTML">HTML</option>
              <option value="AI & ML">AI & ML</option>
              <option value="JavaScript">JavaScript</option>
            </Form.Select>
          </Card.Header>

          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-center text-muted">
                No self interview attempts found
              </p>
            ) : (
              <>
                <Table responsive bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>College</th>
                      <th>Topic</th>
                      <th>Attempts</th>
                      <th>Best Score</th>
                      <th>Avg Score</th>
                      <th>Last Attempt</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.map((row, index) => (
                      <tr key={row._id}>
                        <td>{startIndex + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.college}</td>
                        <td>{row.topic}</td>
                        <td>{row.attempts}</td>
                        <td className="fw-bold text-success">
                          {row.bestScore ?? '-'}
                        </td>
                        <td>
                          {row.avgScore ? row.avgScore.toFixed(2) : '-'}
                        </td>
                        <td>
                          {row.lastAttemptDate
                            ? new Date(row.lastAttemptDate).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination Footer */}
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-2 border-top">
                  <p className="mb-2 mb-sm-0 text-secondary small">
                    Showing{' '}
                    <strong>
                      {Math.min(currentPage * ROWS_PER_PAGE, data.length)}
                    </strong>{' '}
                    of <strong>{data.length}</strong> student
                    {data.length !== 1 ? 's' : ''}
                  </p>

                  <nav aria-label="Page navigation">
                    <ul className="pagination pagination-sm pagination-primary-soft mb-0">
                      {/* Prev */}
                      <li
                        className={`page-item ${
                          currentPage === 1 ? 'disabled' : ''
                        }`}
                      >
                        <Button
                          className="page-link"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <FaAngleLeft />
                        </Button>
                      </li>

                      {/* Pages */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <li
                            key={page}
                            className={`page-item ${
                              currentPage === page ? 'active' : ''
                            }`}
                          >
                            <Button
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </li>
                        )
                      )}

                      {/* Next */}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? 'disabled' : ''
                        }`}
                      >
                        <Button
                          className="page-link"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(p + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          <FaAngleRight />
                        </Button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default AdminSelfInterviewProgressTable
