import { useState } from 'react'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

interface PaginationProps {
  page: number
  total: number
  limit: number
  setPage: (page: number) => void
}

const Pagination = ({  total, limit }: PaginationProps) => {
  const totalPages = Math.ceil(total / limit)
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-8 pt-2">
      <p className="mb-0 text-start ms-3">Showing {totalPages} entries</p>
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <FaAngleLeft className="icons-center" />
            </button>
          </li>

          {[...Array(totalPages)].map((_, idx) => (
            <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                {idx + 1}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <FaAngleRight className="icons-center" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Pagination
