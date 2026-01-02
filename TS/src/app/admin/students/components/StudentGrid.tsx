import { getAllStudents } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { StudentType } from '@/types/other'
import { Card, CardBody, CardFooter, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ProgressBar, Row } from 'react-bootstrap'
import { BsCalendar, BsCurrencyDollar, BsEnvelopeFill, BsPencilSquare, BsThreeDots, BsTrash } from 'react-icons/bs'
import { FaBan, FaBook, FaMapMarkerAlt } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const StudentCard = ({ location, payments, progress, totalCourse, course }: StudentType) => {
  return (
    <Col md={6} xxl={4}>
      <Card className="bg-transparent border h-100">
        <CardHeader className="bg-transparent border-bottom d-flex justify-content-between">
          <div className="d-sm-flex align-items-center">
            <div className="avatar avatar-md flex-shrink-0 ">
              {course?.avatar && <img className="avatar-img rounded-circle" src={course.avatar} alt="avatar" />}
            </div>
            <div className="ms-0 ms-sm-2 mt-2 mt-sm-0">
              <h5 className="mb-0">
                <a href="#">{course?.name}</a>
              </h5>
              <span className="text-body small icons-center">
                <FaMapMarkerAlt className="me-1 mt-1" />
                {location}
              </span>
            </div>
          </div>
          <Dropdown drop="down" align="end">
            <DropdownToggle className="btn btn-sm btn-light btn-round small mb-0 arrow-none">
              <BsThreeDots />
            </DropdownToggle>
            <DropdownMenu className="dropdown-w-sm dropdown-menu-end min-w-auto shadow rounded">
              <DropdownItem href="#">
                <BsPencilSquare className="me-2" />
                Edit
              </DropdownItem>
              <DropdownItem href="#">
                <BsTrash className="me-2" />
                Remove
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </CardHeader>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div className="icon-md bg-success bg-opacity-10 text-success rounded-circle flex-shrink-0">
                <BsCurrencyDollar />
              </div>
              <h6 className="mb-0 ms-2 fw-light">Payments</h6>
            </div>
            <span className="mb-0 fw-bold">${payments}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <div className="icon-md bg-purple bg-opacity-10 text-purple rounded-circle flex-shrink-0">
                <FaBook />
              </div>
              <h6 className="mb-0 ms-2 fw-light">Total Course</h6>
            </div>
            <span className="mb-0 fw-bold">{totalCourse}</span>
          </div>
          <div className="overflow-hidden">
            <h6 className="mb-0">{progress}%</h6>
            <ProgressBar
              variant="primary"
              className="progress-sm bg-opacity-10 aos "
              data-aos="slide-right"
              data-aos-delay={200}
              data-aos-duration={1000}
              data-aos-easing="ease-in-out"
              now={progress}
              aria-valuenow={85}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </CardBody>
        <CardFooter className="bg-transparent border-top">
          <div className="d-sm-flex justify-content-between align-items-center">
            <h6 className="mb-2 mb-sm-0 icons-center">
              <BsCalendar className="bi bi-calendar fa-fw text-orange me-2" />
              <span className="text-body">Join at:</span>&nbsp;
              {course?.date.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </h6>
            <div className="text-end text-primary-hover">
              <Link
                to="#"
                className="btn btn-link text-body p-0 mb-0 me-2"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-original-title="Message"
                aria-label="Message">
                <BsEnvelopeFill />
              </Link>
              <Link
                to="#"
                className="btn btn-link text-body p-0 mb-0"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-original-title="Block"
                aria-label="Block">
                <FaBan className="fas fa-ban" />
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Col>
  )
}

const StudentGrid = () => {
  const studentData = useFetchData(getAllStudents)
  return <Row className="g-4">{studentData?.map((item, idx) => <StudentCard key={idx} {...item} />)}</Row>
}

export default StudentGrid
