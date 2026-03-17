import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { Card, CardFooter, CardHeader, Col, Row } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import ReviewCard from './components/ReviewCard'
import PageMetaData from '@/components/PageMetaData'

const ReviewPage = () => {
  return (
    <>
      <PageMetaData title="Review" />
      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <Row className="justify-content-between align-middle">
            <Col sm={6}>
              <h3 className="card-header-title mb-2 mb-sm-0">Student review</h3>
            </Col>
            <Col sm={4}>
              <form>
                <ChoicesFormInput className="form-select js-choice z-index-9 bg-white" aria-label=".form-select-sm">
                  <option>Sort by</option>
                  <option>★★★★★ (5/5)</option>
                  <option>★★★★☆ (4/5)</option>
                  <option>★★★☆☆ (3/5)</option>
                  <option>★★☆☆☆ (2/5)</option>
                  <option>★☆☆☆☆ (1/5)</option>
                </ChoicesFormInput>
              </form>
            </Col>
          </Row>
        </CardHeader>
        <ReviewCard />
        <CardFooter className="border-top">
          <div className="d-sm-flex justify-content-sm-between align-items-sm-center">
            <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
            <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
              <ul className="pagination pagination-sm pagination-primary-soft my-0 py-0">
                <li className="page-item my-0">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <FaAngleLeft className="fas fa-angle-left" />
                  </a>
                </li>
                <li className="page-item my-0">
                  <a className="page-link" href="#">
                    1
                  </a>
                </li>
                <li className="page-item my-0 active">
                  <a className="page-link" href="#">
                    2
                  </a>
                </li>
                <li className="page-item my-0">
                  <a className="page-link" href="#">
                    3
                  </a>
                </li>
                <li className="page-item my-0">
                  <a className="page-link" href="#">
                    <FaAngleRight className="fas fa-angle-right" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

export default ReviewPage
