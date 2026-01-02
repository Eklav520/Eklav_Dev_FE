import { getAllCourses } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import useToggle from '@/hooks/useToggle'
import { CourseType } from '@/types/other'
import { Card, CardBody, CardFooter, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaHeart, FaRegClock, FaRegHeart, FaRegStar, FaStar, FaStarHalfAlt, FaTable, FaTrash } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const WishlistCard = ({ image, title, description, rating, lectures, duration }: CourseType) => {
  const { isTrue: isOpen, toggle } = useToggle()

  return (
    <Card className="shadow">
      <img src={image} className="card-img-top" alt="course image" />
      <CardBody className="pb-0">
        <div className="d-flex justify-content-between mb-2">
          <a href="#" className="badge bg-success bg-opacity-10 text-success">
            Beginner
          </a>
          <Link to="" className="text-danger" onClick={toggle}>
            {isOpen ? <FaHeart fill="red" /> : <FaRegHeart />}
          </Link>
        </div>
        <CardTitle className="fw-normal">
          <a href="#">{title}</a>
        </CardTitle>
        <p className="mb-2 text-truncate-2">{description}</p>
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
        <div className="d-flex justify-content-between ">
          <span className="h6 fw-light mb-0 icons-center ">
            <FaRegClock className="text-danger me-2" />
            {duration}
          </span>
          <span className="h6 fw-light mb-0 icons-center ">
            <FaTable className="text-orange me-2" />
            {lectures} lectures
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

const WishlistCart = () => {
  const wishlistCartData = useFetchData(getAllCourses)
  return (
    <section className="pt-5">
      <Container>
        <div className="d-sm-flex justify-content-sm-between align-items-center mb-4">
          <h5 className="mb-2 mb-sm-0">You have 4 items in wishlist</h5>
          <div className="text-end">

            <button className="btn btn-danger-soft mb-0">
              <FaTrash className="me-2" />
              Remove all
            </button>
          </div>
        </div>
        <Row className="g-4">
          {wishlistCartData?.slice(0, 4).map((item, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <WishlistCard {...item} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default WishlistCart
