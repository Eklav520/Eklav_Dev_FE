import type { CollegeType } from '@/types/other'
import { splitArray } from '@/utils/array'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardTitle, Col, Row } from 'react-bootstrap'
import { FaCheck, FaMapMarkerAlt, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'

const CollegeCard = ({ college }: { college: CollegeType }) => {
  const { address, category, courses, features, image, isOpen, logo, name, rating } = college
  const featureChunks = splitArray(features, 3)
  return (
    <Card className="border mb-1 bg-transparent">
      <img className="card-img-top" src={image} alt="Card image" />
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mt-n6 mb-3">
          <div className="bg-white p-2 rounded-2 shadow">
            <img className="rounded-1 h-60px" src={logo} width={60} height={60} alt="university logo" />
          </div>
          <div className="h5 mb-0">
            <a href="#" className={`badge text-bg-${isOpen ? 'success' : 'danger'}`}>
              Admission {isOpen ? 'Open' : 'Closed'}
            </a>
          </div>
        </div>
        <div className="d-flex justify-content-between mb-3">
          <span>
            <a href="#" className="badge text-bg-dark">
              {category}
            </a>
          </span>
          <ul className="list-inline hstack mb-0">
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
            <li className="list-inline-item ms-2 h6 fw-light mb-0">({rating})</li>
          </ul>
        </div>
        <CardTitle className="mb-3">
          <Link to="">{name}</Link>
        </CardTitle>
        <p className="mb-3">
          <FaMapMarkerAlt className="me-2" />
          {address}
        </p>
        <ul className="nav nav-divider h6 fw-light mb-3">
          {courses.map((course, idx) => (
            <li className="nav-item" key={idx}>
              {course}
            </li>
          ))}
        </ul>
        <Row className="item-collapse">
          {featureChunks.map((chunk, idx) => (
            <Col xs={6} key={idx}>
              <ul className="list-group list-group-borderless">
                {chunk.map((feature, idx) => (
                  <li className="list-group-item text-body py-1" key={idx}>

                    <FaCheck className="fa-fw text-success me-1" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Col>
          ))}
          <div className="mt-3">
            <Button variant="primary-soft">View more</Button>
          </div>
        </Row>
      </CardBody>
    </Card>
  )
}

export default CollegeCard
