import useToggle from '@/hooks/useToggle'
import type { CourseType } from '@/types/other'
import clsx from 'clsx'

import { Card, CardBody, CardFooter, CardTitle } from 'react-bootstrap'
import { FaHeart, FaRegClock, FaRegHeart, FaRegStar, FaStar, FaStarHalfAlt, FaTable } from 'react-icons/fa'

const CourseCard = ({ course }: { course: CourseType }) => {
  const { image, badge, rating, title, duration, lectures } = course
  const { isTrue, toggle } = useToggle()

  return (
    <Card className="shadow h-100">
      <img src={image} className="card-img-top" alt="course image" />
      <CardBody className="pb-0">
        <div className="d-flex justify-content-between mb-2">
          <a href="#" className={clsx('badge bg-opacity-10', badge.class)}>
            {badge.text}
          </a>
          <span role="button" className="h6 fw-light mb-0" onClick={toggle}>
            {!isTrue ? <FaRegHeart /> : <FaHeart fill="red" />}
          </span>
        </div>
        <CardTitle>
          <a href="#">{title}</a>
        </CardTitle>
        <ul className="list-inline mb-0">
          {Array(Math.floor(rating.star))
            .fill(0)
            .map((_star, idx) => (
              <li key={idx} className="list-inline-item me-1 small">
                <FaStar size={14} className="text-warning" />
              </li>
            ))}
          {!Number.isInteger(rating.star) && (
            <li className="list-inline-item me-1 small">

              <FaStarHalfAlt size={14} className="text-warning" />
            </li>
          )}
          {rating.star < 5 &&
            Array(5 - Math.ceil(rating.star))
              .fill(0)
              .map((_star, idx) => (
                <li key={idx} className="list-inline-item me-1 small">
                  <FaRegStar size={14} className="text-warning" />
                </li>
              ))}
          <li className="list-inline-item ms-2 h6 fw-light mb-0">{rating.star}/5.0</li>
        </ul>
      </CardBody>
      <CardFooter className="pt-0 pb-3">
        <hr />
        <div className="d-flex justify-content-between">
          <span className="h6 fw-light mb-0">
            <FaRegClock className="text-danger me-2" />
            {duration}
          </span>
          <span className="h6 fw-light mb-0">
            <FaTable className="text-orange me-2" />
            {lectures} lectures
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CourseCard
