import { Card, CardTitle, Col, Container, Row, Table } from 'react-bootstrap'
import { BsPatchCheckFill } from 'react-icons/bs'
import { Link } from 'react-router-dom'
import { universityData, UniversityType } from '../data'

//universityData: UniversityType[]

const UniversityCard = ({ description, image, name }: UniversityType) => {
  return (
    <Col md={6} xl={4}>
      <Card className="card-body shadow p-4 align-items-start">
        <img width={50} className="rounded-1 h-60px" src={image} alt="university logo" />
        <CardTitle className="mt-3 mb-0">{name}</CardTitle>
        <span>{description}</span>
        <Link to="/demos/university/home" className="btn btn-lg btn-link p-0 mt-3 stretched-link">
          <u>Visit University</u>
        </Link>
      </Card>
    </Col>
  )
}

const Details = () => {
  return (
    <section className="pt-9">
      <Container>
        <Row>
          <Col xs={12}>
            <p>
              Perceived end knowledge certainly day sweetness why cordially. On forth doubt miles of child. Exercise joy man children rejoiced. Yet
              uncommonly his ten who diminution astonished. Demesne had new manners savings staying had. Under folly balls, death own point now men.
              Match way these she avoids seeing death. She who drift their fat off. Ask a quick six seven offer see among. Handsome met debating sir
              dwelling age material. As style lived he worse dried. Offered related so visitors we private removed.
            </p>
            <p>
              Yet uncommonly his ten who diminution astonished. Demesne had new manners savings staying had. Under folly balls, death own point now
              men. Match way these she avoids seeing death. She who drift their fat off. Ask a quick six seven offer see among. As style lived he
              worse dried. Offered related so visitors we private removed.
            </p>
            <Row className="mt-4">
              <h5 className="mt-3">Why Study in Canada?</h5>
              <Col lg={4}>
                <ul className="list-group list-group-borderless">
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    One of the best places to live and work
                  </li>
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    Affordable education &amp; living
                  </li>
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    20 hrs/week work while Studying
                  </li>
                </ul>
              </Col>
              <Col lg={4}>
                <ul className="list-group list-group-borderless">
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    Degree recognized all over the world
                  </li>
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    Career-oriented specialized courses
                  </li>
                  <li className="list-group-item h6 fw-normal d-flex">
                    <BsPatchCheckFill className="text-success me-2" />
                    2-year study + 3-year work permit + PR
                  </li>
                </ul>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col xs={12}>
                <h5 className="mb-3">Top Courses To Study In Canada</h5>
                <ul className="list-inline hstack gap-3 flex-wrap">
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Engineering
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Biomedical
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Visual Arts
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Business Administration
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Liberal Arts &amp; Science
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Social Science
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Health Care
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Intensive English
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Mathematics
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Computer Science
                    </a>
                  </li>
                </ul>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col xs={12}>
                <h5 className="mb-3">Top Level Programs</h5>
                <ul className="list-inline hstack gap-3 flex-wrap">
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Advance Diploma
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Applied Degree
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      AEC
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Associate Degree
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Bachelor Degree
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Certificate
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Diploma
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Doctorate
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      DEC
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Post Graduate
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      Master
                    </a>
                  </li>
                  <li className="list-inline-item">

                    <a className="btn btn-light btn-sm mb-0" href="#">
                      University Transfer
                    </a>
                  </li>
                </ul>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col xs={12}>
                <div className="table-responsive-md border-0">
                  <Table className="caption-top table-bordered align-middle p-4 mb-0">
                    <caption className="h5 mb-0 bg-primary text-white ps-4 rounded-top">Intake &amp; Deadline</caption>
                    <thead className="border-0">
                      <tr className="border-top-0 table-border-color">
                        <th scope="col">Intake</th>
                        <th scope="col">Months</th>
                        <th scope="col">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      <tr>
                        <td>

                          <span className="text-body">Winter Semester</span>
                        </td>
                        <td>

                          <span className="text-body">November / December</span>
                        </td>
                        <td>

                          <span className="text-body">Jun / July</span>
                        </td>
                      </tr>
                      <tr>
                        <td>

                          <span className="text-body">Spring Semester</span>
                        </td>
                        <td>

                          <span className="text-body">January / February</span>
                        </td>
                        <td>

                          <span className="text-body">August / September</span>
                        </td>
                      </tr>
                      <tr>
                        <td>

                          <span className="text-body">Summer Semester</span>
                        </td>
                        <td>

                          <span className="text-body">April / May</span>
                        </td>
                        <td>

                          <span className="text-body">October / November</span>
                        </td>
                      </tr>
                      <tr>
                        <td>

                          <span className="text-body">Fall Semester</span>
                        </td>
                        <td>

                          <span className="text-body">August / September</span>
                        </td>
                        <td>

                          <span className="text-body">March / April</span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>
            <Row className="g-4 mt-4">
              <h5>Top Universities In Canada</h5>
              {universityData.map((item, idx) => (
                <UniversityCard key={idx} {...item} />
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Details
