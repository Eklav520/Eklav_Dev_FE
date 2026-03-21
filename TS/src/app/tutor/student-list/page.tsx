import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Form,
  Badge,
} from 'react-bootstrap'
import { FaSearch, FaDownload, FaUsers, FaRupeeSign, FaCalendarAlt, FaEnvelope, FaBook, FaUserGraduate } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'

interface EnrolledStudent {
  id: string
  name: string
  email: string
  classTitle: string
  amountPaid: number
  enrolledAt: string
}

const TutorStudentsPage: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const studentsPerPage = 5

  /* =============================
     FETCH ALL ENROLLMENTS
  ============================= */
  const fetchEnrollments = async () => {
    try {
      const res = await fetch(`${baseURL}/tutor/enrollments`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      const data = await res.json()

      if (!res.ok) {
        console.error(data)
        return
      }

      setStudents(data.students || [])
      setTotalStudents(data.totalStudents || 0)
      setTotalRevenue(data.totalRevenue || 0)

    } catch (err) {
      console.error(err)
      setStudents([])
    }
  }

  useEffect(() => {
    if (user?.token) fetchEnrollments()
  }, [user?.token])

  /* =============================
     FILTER
  ============================= */
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.classTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /* =============================
     PAGINATION
  ============================= */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  )

  const indexOfLast = currentPage * studentsPerPage
  const indexOfFirst = indexOfLast - studentsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast)

  /* =============================
     DOWNLOAD EXCEL
  ============================= */
  const handleDownloadExcel = () => {
    if (!filteredStudents.length) return

    const excelData = filteredStudents.map((student, index) => ({
      'S.No': index + 1,
      Name: student.name,
      Email: student.email,
      Class: student.classTitle,
      AmountPaid: student.amountPaid,
      EnrolledDate: new Date(student.enrolledAt).toLocaleDateString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollments')

    XLSX.writeFile(workbook, 'Tutor_Enrollments.xlsx')
  }

  return (
    <div className="tutor-students-container">
      <PageMetaData title="My Enrolled Students" />

      <Card className="students-card">
        <CardHeader className="students-card-header">
          <div className="header-left">
            <FaUserGraduate className="header-icon" />
            <div>
              <h3 className="header-title">All Enrolled Students</h3>
              <p className="header-subtitle">Manage and track your student enrollments</p>
            </div>
          </div>

          <Button
            className="download-btn"
            onClick={handleDownloadExcel}
            disabled={!filteredStudents.length}
          >
            <FaDownload className="me-2" />
            Download Excel
          </Button>
        </CardHeader>

        <CardBody className="students-card-body">
          {/* Summary Cards */}
          <Row className="summary-cards mb-4">
            <Col md={6} lg={4}>
              <div className="summary-card">
                <div className="summary-icon-wrapper students-icon">
                  <FaUsers className="summary-icon" />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Students</span>
                  <span className="summary-value">{totalStudents}</span>
                </div>
              </div>
            </Col>
            <Col md={6} lg={4}>
              <div className="summary-card">
                <div className="summary-icon-wrapper revenue-icon">
                  <FaRupeeSign className="summary-icon" />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Revenue</span>
                  <span className="summary-value">₹ {totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </Col>
            <Col md={6} lg={4}>
              <div className="summary-card">
                <div className="summary-icon-wrapper enrollments-icon">
                  <FaCalendarAlt className="summary-icon" />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Enrollments</span>
                  <span className="summary-value">{students.length}</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <Form.Control
                type="search"
                placeholder="Search by name, email or class..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="search-input"
              />
            </div>
            {searchTerm && (
              <Badge className="search-badge">
                {filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''} found
              </Badge>
            )}
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email Address</th>
                  <th>Enrolled Class</th>
                  <th>Amount Paid</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      <div className="empty-state-content">
                        <FaUserGraduate className="empty-icon" />
                        <p>No enrollments found</p>
                        <span>Students who enroll in your classes will appear here</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student, idx) => (
                    <tr key={student.id}>
                      <td className="student-name-cell">
                        <div className="student-name-wrapper">
                          <div className="student-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="student-name">{student.name}</span>
                        </div>
                      </td>
                      <td className="student-email">
                        <FaEnvelope className="email-icon" />
                        {student.email}
                      </td>
                      <td>
                        <Badge className="class-badge">
                          <FaBook className="me-1" />
                          {student.classTitle}
                        </Badge>
                      </td>
                      <td className="amount-cell">
                        <span className="amount-value">₹ {student.amountPaid}</span>
                      </td>
                      <td className="date-cell">
                        <FaCalendarAlt className="date-icon" />
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <Button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <div className="pagination-info">
                Page <span className="current-page">{currentPage}</span> of{' '}
                <span className="total-pages">{totalPages}</span>
              </div>
              <Button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <style>{`
        .tutor-students-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        /* Card Styles */
        .students-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
        }

        .students-card-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .download-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .download-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .download-btn:disabled {
          background: #2c2c2c;
          color: #8a8a8a;
          cursor: not-allowed;
        }

        .students-card-body {
          padding: 1.5rem;
        }

        /* Summary Cards */
        .summary-cards {
          margin-bottom: 2rem;
        }

        .summary-card {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s ease;
        }

        .summary-card:hover {
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .summary-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-icon-wrapper.students-icon {
          background: rgba(255, 122, 0, 0.1);
        }

        .summary-icon-wrapper.revenue-icon {
          background: rgba(40, 167, 69, 0.1);
        }

        .summary-icon-wrapper.enrollments-icon {
          background: rgba(23, 162, 184, 0.1);
        }

        .summary-icon {
          font-size: 1.5rem;
        }

        .students-icon .summary-icon {
          color: #ff7a00;
        }

        .revenue-icon .summary-icon {
          color: #28a745;
        }

        .enrollments-icon .summary-icon {
          color: #17a2b8;
        }

        .summary-content {
          flex: 1;
        }

        .summary-label {
          display: block;
          color: #8a8a8a;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .summary-value {
          display: block;
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
        }

        /* Search Section */
        .search-section {
          margin-bottom: 1.5rem;
        }

        .search-wrapper {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #ff7a00;
          font-size: 0.9rem;
        }

        .search-input {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          color: #ffffff;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 8px;
        }

        .search-input:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          color: #ffffff;
        }

        .search-input::placeholder {
          color: #6c757d;
        }

        .search-badge {
          background: #ff7a00;
          color: #000000;
          margin-top: 0.5rem;
          padding: 0.375rem 0.75rem;
          font-weight: 500;
        }

        /* Table Styles */
        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }

        .students-table {
          width: 100%;
          border-collapse: collapse;
        }

        .students-table thead th {
          background: #000000;
          color: #ff7a00;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #ff7a00;
        }

        .students-table tbody tr {
          border-bottom: 1px solid #1f1f1f;
          transition: background 0.2s ease;
        }

        .students-table tbody tr:hover {
          background: #141414;
        }

        .students-table td {
          padding: 1rem;
          color: #e5e5e5;
        }

        /* Student Name Cell */
        .student-name-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .student-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000000;
          font-weight: 700;
          font-size: 1rem;
        }

        .student-name {
          font-weight: 600;
          color: #ffffff;
        }

        /* Email Cell */
        .student-email {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .email-icon {
          color: #ff7a00;
          font-size: 0.8rem;
        }

        /* Class Badge */
        .class-badge {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }

        /* Amount Cell */
        .amount-cell {
          font-weight: 600;
        }

        .amount-value {
          color: #28a745;
        }

        /* Date Cell */
        .date-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-icon {
          color: #ff7a00;
          font-size: 0.8rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem !important;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-icon {
          font-size: 3rem;
          color: #ff7a00;
          opacity: 0.5;
        }

        .empty-state-content p {
          margin: 0;
          font-size: 1rem;
          color: #ffffff;
          font-weight: 500;
        }

        .empty-state-content span {
          font-size: 0.85rem;
          color: #8a8a8a;
        }

        /* Pagination */
        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .pagination-btn {
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #8a8a8a;
          font-size: 0.9rem;
        }

        .current-page, .total-pages {
          color: #ff7a00;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .students-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .download-btn {
            width: 100%;
          }

          .summary-cards {
            gap: 1rem;
          }

          .search-wrapper {
            max-width: 100%;
          }

          .pagination-wrapper {
            flex-direction: column;
          }

          .pagination-btn {
            width: 100%;
          }

          .students-table thead th {
            font-size: 0.7rem;
            padding: 0.75rem;
          }

          .students-table td {
            padding: 0.75rem;
            font-size: 0.85rem;
          }

          .student-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}

export default TutorStudentsPage