import { Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import CourseMaterial from './CourseMaterial'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { AllNotesData } from '../data'
import { Fragment } from 'react'

import course1 from '@/assets/images/courses/4by3/01.jpg'
import { BsPencilSquare, BsPlayFill, BsTrash } from 'react-icons/bs'
import Discussion from './Discussion'

const AllNotes = () => {
  return (
    <Card>
      <CardHeader className="border-bottom p-0 pb-3">
        <div className="d-sm-flex justify-content-between align-items-center">
          <h4 className="mb-0">All Notes</h4>
          <form className="col-sm-6 col-lg-3 bg-light-input">
            <ChoicesFormInput className="form-select js-choice z-index-9" aria-label=".form-select-sm">
              <option>Sort by</option>
              <option>All</option>
              <option>Introductions</option>
              <option>What is Digital Marketing</option>
              <option>Most Viewed</option>
            </ChoicesFormInput>
          </form>
        </div>
      </CardHeader>
      <CardBody className="p-0 pt-3">
        {AllNotesData.map((note, idx) => (
          <Fragment key={idx}>
            <Row className="g-4" key={idx}>
              <Col sm={2} xl={1}>
                <img src={course1} className="rounded flex-shrink-0" alt="course" />
              </Col>
              <Col sm={10} xl={11}>
                <h5>{note.title}</h5>
                <p>{note.description}</p>
                <div className="hstack gap-3 flex-wrap">
                  <Button variant="primary" size="sm" className="mb-0">
                    <BsPlayFill className="me-2" />
                    Play
                  </Button>
                  <a href="#" className="text-success mb-0">
                    <BsPencilSquare className="me-2" />
                    Edit
                  </a>
                  <a href="#" className="text-danger mb-0">
                    <BsTrash className="me-2" />
                    Delete
                  </a>
                </div>
              </Col>
            </Row>
            {AllNotes.length - 1 != idx && <hr />}
          </Fragment>
        ))}
      </CardBody>
    </Card>
  )
}

const CourseDetail = () => {
  return (
    <section className="pt-0">
      <Container>
        <Row>
          <Col xs={12}>
            <Card className="shadow rounded-2 p-0 mt-n5">
              <TabContainer defaultActiveKey="course">
                <CardHeader className="border-bottom px-4 pt-3 pb-0">
                  <Nav defaultActiveKey="0" className="nav-bottom-line py-0" id="course-pills-tab" role="tablist">
                    <NavItem className="me-2 me-sm-4" role="presentation">
                      <NavLink as="button" eventKey="course" className="mb-2 mb-md-0" type="button" role="tab">
                        Course Materials
                      </NavLink>
                    </NavItem>
                    <NavItem className="me-2 me-sm-4" role="presentation">
                      <NavLink as="button" eventKey="notes" className="mb-2 mb-md-0" type="button" role="tab">
                        Notes
                      </NavLink>
                    </NavItem>
                    <NavItem className="me-2 me-sm-4" role="presentation">
                      <NavLink as="button" eventKey="discussion" className="mb-2 mb-md-0" type="button" role="tab">
                        Discussion
                      </NavLink>
                    </NavItem>
                  </Nav>
                </CardHeader>
                <CardBody className="p-sm-4">
                  <TabContent id="course-pills-tabContent">
                    <TabPane eventKey="course" className="fade" role="tabpanel">
                      <CourseMaterial />
                    </TabPane>
                    <TabPane eventKey="notes" className="fade" role="tabpanel">
                      <AllNotes />
                    </TabPane>
                    <TabPane eventKey="discussion" className="fade" role="tabpanel">
                      <Discussion />
                    </TabPane>
                  </TabContent>
                </CardBody>
              </TabContainer>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
export default CourseDetail
