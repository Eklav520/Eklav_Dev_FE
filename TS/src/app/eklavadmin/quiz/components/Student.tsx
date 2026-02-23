import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar4 from '@/assets/images/avatar/04.jpg'
import avatar6 from '@/assets/images/avatar/06.jpg'
import avatar7 from '@/assets/images/avatar/07.jpg'
import avatar9 from '@/assets/images/avatar/09.jpg'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaAngleRight, FaRegEnvelope, FaSearch } from 'react-icons/fa'
import { FaAngleLeft } from 'react-icons/fa6'

const Student = () => {
  return (
    <Card className="border bg-transparent rounded-3 mt-4">
      <CardHeader className="bg-transparent border-bottom">
        <h3 className="mb-0">Student quiz result</h3>
      </CardHeader>
      <CardBody>
        <Row className="g-3 align-items-center justify-content-between mb-4">
          <Col md={8}>
            <form className="rounded position-relative">
              <input className="form-control pe-5 bg-transparent" type="search" placeholder="Search" aria-label="Search" />
              <button
                className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                type="submit">
                <FaSearch className="fs-6 " />
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
                  Student name
                </th>
                <th scope="col" className="border-0">
                  Course name
                </th>
                <th scope="col" className="border-0">
                  Date
                </th>
                <th scope="col" className="border-0">
                  Points
                </th>
                <th scope="col" className="border-0 rounded-end">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar1} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Lori Stevens</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>7/1/2023</td>
                <td>450/500</td>
                <td>
                  <Button variant="success-soft" className=" btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar3} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Dennis Barrett</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>6/1/2023</td>
                <td>425/500</td>
                <td>
                  <Button variant="success-soft" className="btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar4} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Billy Vasquez</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>5/1/2023</td>
                <td>385/500</td>
                <td>
                  <Button variant="success-soft" className="btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar9} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Carolyn Ortiz</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>5/1/2023</td>
                <td>398/500</td>
                <td>
                  <Button variant="success-soft" className="btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar7} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Larry Lawson</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>4/1/2023</td>
                <td>428/500</td>
                <td>
                  <Button variant="success-soft" className="btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-sm me-2">
                      <img src={avatar6} className="rounded" alt="avatar" />
                    </div>
                    <div>
                      <h6 className="mb-0">
                        <a href="#">Frances Guerrero</a>
                      </h6>
                    </div>
                  </div>
                </td>
                <td>
                  <h6 className="table-responsive-title mt-2 mt-md-0 mb-0">
                    <a href="#">The complete Digital Marketing Courses - 12 Course in 1</a>
                  </h6>
                </td>
                <td>4/1/2023</td>
                <td>486/500</td>
                <td>
                  <Button variant="success-soft" className="btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                    <FaRegEnvelope className="far fa-envelope" />
                  </Button>
                </td>
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
  )
}

export default Student
