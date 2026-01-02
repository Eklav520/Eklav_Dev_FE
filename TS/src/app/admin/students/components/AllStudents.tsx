import { Card, CardBody, CardFooter, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaListUl, FaSearch, FaThLarge } from 'react-icons/fa'
import StudentGrid from './StudentGrid'
import StudentList from './StudentList'

const AllStudents = () => {
  return (
    <Card className="bg-transparent">
      <TabContainer defaultActiveKey={1}>
        <CardHeader className="bg-transparent border-bottom px-0">
          <Row className="g-3 align-items-center justify-content-between">
            <Col md={8}>
              <form className="rounded position-relative">
                <input className="form-control bg-transparent" type="search" placeholder="Search" aria-label="Search" />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                  type="submit">
                  <FaSearch className="fs-6 " />
                </button>
              </form>
            </Col>
            <Col md={3}>
              <Nav className="list-inline mb-0 nav-pills nav-pill-dark-soft border-0 justify-content-end" id="pills-tab" role="tablist">
                <NavItem>
                  <NavLink eventKey={1} className="nav-link mb-0 me-2" data-bs-toggle="tab">
                    <FaThLarge />
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink eventKey={2} className="nav-link mb-0" data-bs-toggle="tab">
                    <FaListUl />
                  </NavLink>
                </NavItem>
              </Nav>
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="px-0">
          <TabContent>
            <TabPane eventKey={1} className="fade" id="nav-preview-tab-1">
              <StudentGrid />
            </TabPane>
            <TabPane eventKey={2} className="fade" id="nav-preview-tab-1">
              <StudentList />
            </TabPane>
          </TabContent>
        </CardBody>
      </TabContainer>
      <CardFooter className="bg-transparent pt-0 px-0">
        <div className="d-sm-flex justify-content-sm-between align-items-sm-center">
          <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
          <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
            <ul className="pagination pagination-sm pagination-primary-soft mb-0 pb-0 px-0">
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
  )
}

export default AllStudents
