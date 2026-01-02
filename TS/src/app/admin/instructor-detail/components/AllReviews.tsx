import { studentReviewData } from '@/assets/data/other'
import { ReviewType } from '@/types/other'
import { Button, Card, CardBody, CardFooter, CardHeader, Col, Table } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'

const AllReviewsCard = ({ avatar, rating, name, courseName }: ReviewType) => {
  return (
    <tr>
      <td>
        <div className="d-flex align-items-center position-relative">
          <div className="avatar avatar-xs mb-2 mb-md-0">
            <img src={avatar} className="rounded-circle" alt="avatar" />
          </div>
          <div className="mb-0 ms-2">
            <h6 className="mb-0">
              <a href="#" className="stretched-link">
                {name}
              </a>
            </h6>
          </div>
        </div>
      </td>
      <td>
        <h6 className="table-responsive-title mb-0">
          <a href="#">{courseName}</a>
        </h6>
      </td>
      <td>
        <ul className="list-inline mb-0">
          {rating && (
            <>
              {Array(Math.floor(rating))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaStar size={14} className="text-warning" />
                  </li>
                ))}
              {!Number.isInteger(rating) && (
                <li className="list-inline-item me-1 small">

                  <FaStarHalfAlt size={14} className="text-warning" />
                </li>
              )}
              {rating < 5 &&
                Array(5 - Math.ceil(rating))
                  .fill(0)
                  .map((_star, idx) => (
                    <li key={idx} className="list-inline-item me-1 small">
                      <FaRegStar size={14} className="text-warning" />
                    </li>
                  ))}
            </>
          )}
        </ul>
      </td>
      <td>
        <Button size="sm" variant="info-soft" className="mb-0" data-bs-toggle="modal" data-bs-target="#viewReview">
          View
        </Button>
      </td>
    </tr>
  )
}

const AllReviews = () => {
  return (
    <Col xs={12}>
      <Card className="bg-transparent border">
        <CardHeader className="border-bottom bg-light">
          <h5 className="mb-0">All Reviews</h5>
        </CardHeader>
        <CardBody className="pb-0">
          <div className="table-responsive border-0">
            <Table hover className="table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Student Name
                  </th>
                  <th scope="col" className="border-0">
                    Course Name
                  </th>
                  <th scope="col" className="border-0">
                    Rating
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentReviewData.slice(0, 5).map((item, idx) => (
                  <AllReviewsCard key={idx} {...item} />
                ))}
              </tbody>
            </Table>
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

export default AllReviews
