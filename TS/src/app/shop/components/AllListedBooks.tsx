import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { getAllBooks } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { BookType } from '@/types/other'
import { Card, CardBody, CardFooter, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'

// booksData: BookType[]

export const BooksCard = ({ image, name, price, title, icon: Icon, id }: BookType) => {
  return (
    <Card className="shadow h-100">
      <div className="position-relative">
        <img src={image} className="card-img-top" alt="book image" />
        <div className="card-img-overlay d-flex z-index-0 p-3">
          <div className="w-100 mb-auto d-flex justify-content-end">
            <div className="icon-md bg-dark rounded-circle fs-5">
              <a href="#" className="text-white">
                <Icon />
              </a>
            </div>
          </div>
        </div>
      </div>
      <CardBody className="px-3">
        <CardTitle className="mb-0">
          <Link to={`/shop/product-detail/${id}`} className="stretched-link">
            {title}
          </Link>
        </CardTitle>
      </CardBody>
      <CardFooter className="pt-0 px-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="h6 fw-light mb-0">By {name}</span>
          <h5 className="text-success mb-0">${price}</h5>
        </div>
      </CardFooter>
    </Card>
  )
}

const AllListedBooks = () => {
  const bookData = useFetchData(getAllBooks)

  return (
    <section className="py-5">
      <Container>
        <Row>
          <Col xs={12}>
            <Row className=" mb-4 align-items-center">
              <Col md={4}>
                <h5 className="mb-0">All Listed Books</h5>
              </Col>
              <Col md={4} className="mt-3 mt-xl-0">
                <form className="border-bottom p-2 input-borderless">
                  <ChoicesFormInput className="js-choice">
                    <option>Product type</option>
                    <option>PDF</option>
                    <option>Compact Disk</option>
                    <option>Paperback</option>
                  </ChoicesFormInput>
                </form>
              </Col>
              <Col md={4} className="mt-3 mt-xl-0">
                <form className="border-bottom p-2 input-borderless">
                  <ChoicesFormInput className="js-choice">
                    <option>Select category</option>
                    <option>Software</option>
                    <option>Finance</option>
                    <option>Web design</option>
                    <option>Web Development</option>
                    <option>Information technology</option>
                    <option>Science</option>
                  </ChoicesFormInput>
                </form>
              </Col>
            </Row>
            <Row className=" g-4">
              {bookData?.map((item, idx) => (
                <Col sm={6} lg={4} xl={3} key={idx}>
                  <BooksCard {...item} />
                </Col>
              ))}
            </Row>
            <Col xs={12}>
              <nav className="mt-4 d-flex justify-content-center" aria-label="navigation">
                <ul className="pagination pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                  <li className="page-item mb-0">
                    <a className="page-link" href="#" tabIndex={-1}>
                      <FaAngleDoubleLeft />
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
                      ..
                    </a>
                  </li>
                  <li className="page-item mb-0">
                    <a className="page-link" href="#">
                      6
                    </a>
                  </li>
                  <li className="page-item mb-0">
                    <a className="page-link" href="#">
                      <FaAngleDoubleRight />
                    </a>
                  </li>
                </ul>
              </nav>
            </Col>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default AllListedBooks
