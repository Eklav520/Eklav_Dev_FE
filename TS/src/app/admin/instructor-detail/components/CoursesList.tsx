import { coursesData } from '@/assets/data/products'
import { CourseType } from '@/types/other'
import { Button, Card, CardBody, CardFooter, CardHeader, Col } from 'react-bootstrap'
import { FaAngleLeft } from 'react-icons/fa'
import { FaAngleRight } from 'react-icons/fa6'

const CourseListCard = ({ title, image, enrolled, status }: CourseType) => {
  return (
    <tr>
      <td className="d-flex align-items-center position-relative">
        <div className="w-60px">
          <img src={image} className="rounded" alt="avatar" />
        </div>
        <h6 className="table-responsive-title mb-0 ms-2">
          <a href="#" className="stretched-link">
            {title}
          </a>
        </h6>
      </td>
      <td>{enrolled}</td>
      <td>
        <span className={`badge bg-${status === 'Live' ? 'success' : 'warning'} bg-opacity-15 text-${status === 'Live' ? 'success' : 'warning'}`}>
          {status}
        </span>
      </td>
      <td>
        <Button variant="info-soft" size="sm" className="mb-0">
          View
        </Button>
      </td>
    </tr>
  )
}

const CoursesList = () => {
  return (
    <Col xs={12}>
      <Card className="bg-transparent border h-100">
        <CardHeader className="bg-light border-bottom">
          <h5 className="mb-0">Courses List</h5>
        </CardHeader>
        <CardBody className="pb-0">
          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Course Name
                  </th>
                  <th scope="col" className="border-0">
                    Enrolled
                  </th>
                  <th scope="col" className="border-0">
                    Status
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {coursesData.slice(0, 5).map((item, idx) => (
                  <CourseListCard {...item} key={idx} />
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="bg-transparent">
          <div className="d-sm-flex justify-content-sm-between align-items-sm-center">
            <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
            <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
              <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li className="page-item mb-0">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <FaAngleLeft />
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    1
                  </a>
                </li>
                <li className="page-item mb-0 active">
                  <a className="page-link" href="#">
                    2
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    3
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    <FaAngleRight />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </CardFooter>
      </Card>
    </Col>
  )
}

export default CoursesList
