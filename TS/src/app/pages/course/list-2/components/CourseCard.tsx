import useToggle from '@/hooks/useToggle'
import type { CourseType } from '@/types/other'

import { Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap'
import { FaHeart, FaRegClock, FaRegHeart, FaRegStar, FaSignal, FaStar, FaStarHalfAlt, FaTable } from 'react-icons/fa'

const CourseCard = ({ course }: { course: CourseType }) => {
  const { image, title, lectures, duration, rating, badge } = course
  const { isTrue, toggle } = useToggle(true)
  return (
    <Card className="rounded overflow-hidden shadow">
      <Row className="g-0">
        <Col md={4}>
          <img src={image} alt="card image" />
        </Col>
        <Col md={8}>
          <CardBody>
            <div className="d-flex justify-content-between mb-2">
              <CardTitle className="mb-0">
                <a href="#">{title}</a>
              </CardTitle>
              <span role="button" onClick={toggle}>
                {isTrue ? <FaRegHeart /> : <FaHeart className="text-danger" />}
              </span>
            </div>
            <ul className="list-inline mb-1">
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
            <ul className="list-inline mb-0">
              {Array(Math.floor(rating.star))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaStar className="text-warning" />
                  </li>
                ))}
              {!Number.isInteger(rating) && (
                <li className="list-inline-item me-1 small">
                  <FaStarHalfAlt className="text-warning" />
                </li>
              )}
              {rating.star < 5 &&
                Array(5 - Math.ceil(rating.star))
                  .fill(0)
                  .map((_star, idx) => (
                    <li key={idx} className="list-inline-item me-1 small">
                      <FaRegStar className="text-warning" />
                    </li>
                  ))}
              <li className="list-inline-item ms-2 h6 fw-light">{rating.star}/5.0</li>
            </ul>
          </CardBody>
        </Col>
      </Row>
    </Card>
  )
}

export default CourseCard
