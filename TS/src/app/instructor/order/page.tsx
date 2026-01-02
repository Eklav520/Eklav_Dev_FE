import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import { Card, CardBody, CardHeader, Col, FormControl, Row } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaSearch } from 'react-icons/fa'

const OrderPage = () => {
  return (
    <>
      <PageMetaData title="Order" />
      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h3 className="mb-0">Order List</h3>
        </CardHeader>
        <CardBody>
          <Row className="g-3 align-items-center justify-content-between mb-4">
            <Col md={8}>
              <form className="rounded position-relative">
                <FormControl className="pe-5 bg-transparent" type="search" placeholder="Search" aria-label="Search" />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                  type="submit">
                  <FaSearch className="fas fa-search fs-6 " />
                </button>
              </form>
            </Col>
            <Col md={3}>
              <form>
                <ChoicesFormInput className="form-select js-choice border-0 z-index-9 bg-transparent" aria-label=".form-select-sm">
                  <option>Sort by</option>
                  <option>Free</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                </ChoicesFormInput>
              </form>
            </Col>
          </Row>
          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Course name
                  </th>
                  <th scope="col" className="border-0">
                    Order ID
                  </th>
                  <th scope="col" className="border-0">
                    Date
                  </th>
                  <th scope="col" className="border-0">
                    Amount
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">The complete Digital Marketing Course - 8 Course in 1</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#125489</u>
                    </a>
                  </td>
                  <td>18/1/2023</td>
                  <td>$356</td>
                  <td>Credit Card</td>
                </tr>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">Time Management Mastery: Do More, Stress Less</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#235486</u>
                    </a>
                  </td>
                  <td>25/1/2023</td>
                  <td>$186</td>
                  <td>Debit Card</td>
                </tr>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">Building Scalable APIs with GraphQL</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#0215789</u>
                    </a>
                  </td>
                  <td>4/9/2020</td>
                  <td>$450</td>
                  <td>Paypal</td>
                </tr>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">Sketch from A to Z: for app designer</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#0135689</u>
                    </a>
                  </td>
                  <td>5/1/2023</td>
                  <td>$0</td>
                  <td>Free</td>
                </tr>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">Build Responsive Websites with HTML</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#0587623</u>
                    </a>
                  </td>
                  <td>2/1/2023</td>
                  <td>$250</td>
                  <td>Credit Card</td>
                </tr>
                <tr>
                  <td>
                    <h6 className="table-responsive-title mt-2 mt-lg-0 mb-0">
                      <a href="#">JavaScript: Full Understanding</a>
                    </h6>
                  </td>
                  <td className="text-center text-sm-start text-primary-hover">
                    <a href="#" className="text-body">
                      <u>#0215789</u>
                    </a>
                  </td>
                  <td>14/1/2023</td>
                  <td>$325</td>
                  <td>Debit Card</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-4 mt-sm-3">
            <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
            <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
              <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li className="page-item mb-0">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <FaAngleLeft className="fas fa-angle-left" />
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
                    <FaAngleRight className="fas fa-angle-right" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default OrderPage
