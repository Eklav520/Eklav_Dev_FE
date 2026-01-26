import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Spinner, Table } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

type WritingProgressRow = {
  studentId: string
  studentName: string
  college: string
  attempts: number
  bestScore: number
  avgScore: number
  lastAttemptDate?: string
  weekKey: string
  mode?: string
}

const ROWS_PER_PAGE = 10

type WritingUnifiedProgressTableProps = {
  weekKey: string
  registerDownload?: (fn: () => void) => void
}

const WritingUnifiedProgressTable = ({
  weekKey,
  registerDownload,
}: WritingUnifiedProgressTableProps) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<WritingProgressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchWriting = async () => {
      try {
        setLoading(true)
        setCurrentPage(1)

        const res = await fetch(
          `${baseURL}/api/adminDashboardCharts/admin/writing/history?page=1&limit=${ROWS_PER_PAGE}&weekKey=${encodeURIComponent(
            weekKey
          )}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!res.ok) throw new Error('Failed to fetch writing progress')

        const result = await res.json()
        setData(result.data || [])
        setTotalPages(result.totalPages || 1)
      } catch (err) {
        console.error(err)
        setData([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    if (weekKey) fetchWriting()
  }, [weekKey, baseURL, user?.token])

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true)

        const res = await fetch(
          `${baseURL}/api/adminDashboardCharts/admin/writing/history?page=${currentPage}&limit=${ROWS_PER_PAGE}&weekKey=${encodeURIComponent(
            weekKey
          )}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!res.ok) throw new Error('Failed to fetch writing progress')

        const result = await res.json()
        setData(result.data || [])
        setTotalPages(result.totalPages || 1)
      } catch (err) {
        console.error(err)
        setData([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    if (weekKey) fetchPage()
  }, [currentPage, weekKey, baseURL, user?.token])

  const downloadExcel = useCallback(() => {
    if (data.length === 0) return

    const formatted = data.map((row, index) => ({
      'S.No': (currentPage - 1) * ROWS_PER_PAGE + index + 1,
      'Student Name': row.studentName,
      College: row.college,
      Attempts: row.attempts,
      'Best Score': row.bestScore ?? '-',
      'Avg Score': row.avgScore != null ? row.avgScore : '-',
      'Last Attempt': row.lastAttemptDate
        ? new Date(row.lastAttemptDate).toLocaleDateString()
        : '-',
      Week: row.weekKey,
      Mode: row.mode || '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(formatted)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Writing Progress')
    XLSX.writeFile(workbook, `writing-progress-${weekKey}-p${currentPage}.xlsx`)
  }, [data, weekKey, currentPage])

  useEffect(() => {
    if (registerDownload) {
      registerDownload(downloadExcel)
    }
  }, [registerDownload, downloadExcel])

  if (loading) return <Spinner animation="border" />

  return (
    <>
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
            <th>Week</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-muted">
                No data available
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={row.studentId}>
                <td>{row.studentName}</td>
                <td>{row.college}</td>
                <td>
                  <Badge bg={row.attempts > 0 ? 'success' : 'secondary'}>
                    {row.attempts}
                  </Badge>
                </td>
                <td>{row.bestScore ?? '-'}</td>
                <td>{row.avgScore != null ? row.avgScore : '-'}</td>
                <td>
                  {row.lastAttemptDate
                    ? new Date(row.lastAttemptDate).toLocaleDateString()
                    : '-'}
                </td>
                <td>{row.weekKey}</td>
                <td className="text-capitalize">{row.mode || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-2 border-top">
          <p className="mb-2 mb-sm-0 text-secondary small">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
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

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
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
      )}
    </>
  )
}

export default WritingUnifiedProgressTable
