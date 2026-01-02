import React, { useEffect, useState } from 'react'
import { Table, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

const InterviewHistory: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()
  const token = user?.token
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = records.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(records.length / itemsPerPage)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${baseURL}/self-interviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        setRecords(data)
      } catch (err) {
        console.error('Error loading interview summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (loading) return <Spinner animation="border" variant="info" />

  return (
    <div className="mt-4">
      <h4 className="mb-3">📊 Your Interview Ratings</h4>
      <Table striped bordered hover responsive>
        <thead className="table-info">
          <tr>
            <th>#</th>
            <th>Topic</th>
            <th>Date</th>
            <th>Score (/10)</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, idx) => (
            <tr key={item._id}>
              <td>{indexOfFirstItem + idx + 1}</td>
              <td>{item.topic}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>
                <strong>{item.score}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {totalPages > 1 && (
        <div className="d-flex justify-content-end mt-3">
          <ul className="pagination pagination-primary-soft">
            <li className={`page-item ${currentPage === 1 && 'disabled'}`}>
              <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                Previous
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${currentPage === page && 'active'}`}>
                <button className="page-link" onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages && 'disabled'}`}>
              <button className="page-link" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                Next
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default InterviewHistory
