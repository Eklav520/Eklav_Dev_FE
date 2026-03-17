import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import axios from 'axios'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import * as XLSX from 'xlsx'

type SelfInterviewRow = {
  _id: string
  name: string
  college: string
  topic?: string
  attempts: number
  bestScore: number
  avgScore: number
  lastAttemptDate?: string
}

const ROWS_PER_PAGE = 10

type AdminSelfInterviewProgressTableProps = {
  year: number
  month: number
  week: string | null
  college: string | null
  registerDownload?: (fn: () => void) => void
}

const AdminSelfInterviewProgressTable = ({
  week,
  college,
  registerDownload,
}: AdminSelfInterviewProgressTableProps) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<SelfInterviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchProgress = useCallback(async () => {
    if (!week) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const res = await axios.get<SelfInterviewRow[]>(
        `${baseURL}/api/adminDashboardHistoryTable/admin/self-interview-progress`,
        {
          params: {
            weekKey: week,
            ...(college ? { college } : {}), // ✅ pass college
          },
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )

      setData(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Failed to fetch self interview progress', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [baseURL, user?.token, week, college])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  /* =============================
     DOWNLOAD EXCEL
  ============================== */
  const downloadExcel = useCallback(() => {
    if (!week || data.length === 0) return

    const formattedData = data.map((row, index) => ({
      'S.No': index + 1,
      'Student Name': row.name,
      College: row.college,
      Topic: row.topic ?? '-',
      Attempts: row.attempts,
      'Best Score': row.bestScore ?? '-',
      'Avg Score': row.avgScore ? row.avgScore.toFixed(2) : '-',
      'Last Attempt': row.lastAttemptDate
        ? new Date(row.lastAttemptDate).toLocaleString()
        : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Self Interview Progress')
    XLSX.writeFile(workbook, `self-interview-progress-${week}.xlsx`)
  }, [data, week])

  useEffect(() => {
    if (registerDownload) {
      registerDownload(downloadExcel)
    }
  }, [registerDownload, downloadExcel])

  /* =============================
     PAGINATION
  ============================== */
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE
  const paginatedData = data.slice(startIndex, startIndex + ROWS_PER_PAGE)

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Self Interview – Student Progress</h5>
        <Badge bg={week ? 'info' : 'secondary'}>{week || 'No week selected'}</Badge>
      </Card.Header>

      <Card.Body>
        {!week ? (
          <p className="text-center text-muted mb-0">
            Select a week in the filters above to view Self Interview progress.
          </p>
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted mb-0">
            No self interview attempts found for this week.
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
                    <td>{row.topic ?? '-'}</td>
                    <td>{row.attempts}</td>
                    <td className="fw-bold text-success">{row.bestScore ?? '-'}</td>
                    <td>{row.avgScore ? row.avgScore.toFixed(2) : '-'}</td>
                    <td>
                      {row.lastAttemptDate
                        ? new Date(row.lastAttemptDate).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* PAGINATION */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-2 border-top">
              <p className="mb-2 mb-sm-0 text-secondary small">
                Showing{' '}
                <strong>{Math.min(currentPage * ROWS_PER_PAGE, data.length)}</strong>{' '}
                of <strong>{data.length}</strong> student
                {data.length !== 1 ? 's' : ''}
              </p>

              <nav aria-label="Page navigation">
                <ul className="pagination pagination-sm pagination-primary-soft mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Button
                      className="page-link"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <FaAngleLeft />
                    </Button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? 'active' : ''}`}
                    >
                      <Button className="page-link" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  >
                    <Button
                      className="page-link"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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
  )
}

export default AdminSelfInterviewProgressTable
