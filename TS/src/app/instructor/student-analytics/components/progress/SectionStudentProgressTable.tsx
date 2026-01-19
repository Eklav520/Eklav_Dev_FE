import { Table, Spinner, Badge, Button } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

type StudentProgress = {
  _id: string
  name: string
  college: string
  attempts: number
  bestScore?: number
  avgScore?: number
  lastAttemptDate?: string
}

const ROWS_PER_PAGE = 10

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
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true)

        const endpoint =
          apiType === 'reading'
            ? 'reading-section-progress'
            : apiType === 'listening'
            ? 'listening-section-progress'
            : apiType === 'justaMinute'
            ? 'justaMinute-section-progress'
            : apiType === 'englishPractice'
            ? 'english-practice-section-progress'
            : 'section-progress'

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
        setCurrentPage(1) // 🔁 reset page on reload
      } catch (err) {
        console.error(err)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [weekKey, apiType, baseURL, user?.token])

  const downloadExcel = () => {
    if (data.length === 0) return

    const formattedData = data.map((s, index) => ({
      'S.No': index + 1,
      'Student Name': s.name,
      College: s.college,
      Attempts: s.attempts,
      'Best Score': s.bestScore ?? '-',
      'Avg Score': s.avgScore != null ? Math.round(s.avgScore) : '-',
      'Last Attempt': s.lastAttemptDate
        ? new Date(s.lastAttemptDate).toLocaleDateString()
        : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Progress')
    XLSX.writeFile(workbook, `student-progress-${apiType}-${weekKey}.xlsx`)
  }

  if (loading) return <Spinner animation="border" />

  // 🔢 Pagination logic
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE
  const paginatedData = data.slice(startIndex, startIndex + ROWS_PER_PAGE)

  return (
    <>
      {/* Download Button */}
      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="success"
          size="sm"
          onClick={downloadExcel}
          disabled={data.length === 0}
        >
          ⬇ Download Excel
        </Button>
      </div>

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
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                No data available
              </td>
            </tr>
          )}

          {paginatedData.map((s) => (
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

      {/* Pagination Footer (same style as your example) */}
      {data.length > 0 && (
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
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft />
                </Button>
              </li>

              {/* Pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li
                  key={page}
                  className={`page-item ${currentPage === page ? 'active' : ''}`}
                >
                  <Button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </li>
              ))}

              {/* Next */}
              <li
                className={`page-item ${
                  currentPage === totalPages ? 'disabled' : ''
                }`}
              >
                <Button
                  className="page-link"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <FaAngleRight />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}

export default SectionStudentProgressTable
