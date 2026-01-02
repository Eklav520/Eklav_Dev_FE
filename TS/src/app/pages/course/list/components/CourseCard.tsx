import useToggle from '@/hooks/useToggle'
import type { CourseType } from '@/types/other'

import { Button, Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap'
import { FaHeart, FaRegClock, FaRegHeart, FaSignal, FaStar, FaTable } from 'react-icons/fa'

const CourseCard = ({ course }: { course: CourseType }) => {
  const { isTrue, toggle } = useToggle()
  const { avatar, image, lectures, badge, label, duration, title, description, price, rating, name } = course
  return (
    <Card className="shadow overflow-hidden p-2">
      <Row className="g-0">
        <Col md={5} className="overflow-hidden">
          <img src={image} className="rounded-2" alt="Card image" />
          {price === 0 && (
            <div className="card-img-overlay">
              <div className="ribbon">
                <span>Free</span>
              </div>
            </div>
          )}
        </Col>
        <Col md={7}>
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <a href="#" className="badge text-bg-primary mb-2 mb-sm-0">
                {label}
              </a>
              <div>
                <span className="h6 fw-light me-3">
                  <FaStar className="text-warning me-1" />
                  {rating.star}
                </span>
                <span role="button" onClick={toggle}>

                  {isTrue ? <FaHeart className="text-danger" /> : <FaRegHeart />}
                </span>
              </div>
            </div>
            <CardTitle>
              <a href="#">{title}</a>
            </CardTitle>
            <p className="text-truncate-2 d-none d-lg-block">{description}</p>
            <ul className="list-inline">
              <li className="list-inline-item h6 fw-light mb-1 mb-sm-0">
                <FaRegClock className="text-danger me-2" />
                {duration}
              </li>
              <li className="list-inline-item h6 fw-light mb-1 mb-sm-0">
                <FaTable className="text-orange me-2" />
                {lectures} lectures
              </li>
              <li className="list-inline-item h6 fw-light">
                <FaSignal className="text-success me-2" />
                {badge.text}
              </li>
            </ul>
            <div className="d-sm-flex justify-content-sm-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="avatar">
                  <img className="avatar-img rounded-circle" src={avatar} alt="avatar" />
                </div>
                <p className="mb-0 ms-2">
                  <a href="#" className="h6 fw-light">
                    {name}
                  </a>
                </p>
              </div>
              <div className="mt-3 mt-sm-0">
                <Button variant="dark">View more</Button>
              </div>
            </div>
          </CardBody>
        </Col>
      </Row>
    </Card>
  )
}

export default CourseCard
