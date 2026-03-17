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
import { FaSearch, FaDownload } from 'react-icons/fa'
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
    <>
      <PageMetaData title="My Enrolled Students" />

      <Card className="border bg-transparent rounded-3">
        <CardHeader className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">All Enrolled Students</h3>

          <Button
            variant="outline-success"
            onClick={handleDownloadExcel}
            disabled={!filteredStudents.length}
          >
            <FaDownload className="me-2" />
            Download Excel
          </Button>
        </CardHeader>

        <CardBody>

          {/* Summary */}
          <div className="mb-3">
            <Badge bg="primary" className="me-2">
              Total Students: {totalStudents}
            </Badge>
            <Badge bg="success">
              Total Revenue: ₹ {totalRevenue}
            </Badge>
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <Form.Control
                type="search"
                placeholder="Search by name, email or class"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </Col>
          </Row>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Amount Paid</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No enrollments found
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.classTitle}</td>
                      <td>₹ {student.amountPaid}</td>
                      <td>
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between mt-3">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default TutorStudentsPage