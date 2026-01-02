import avatar7 from '@/assets/images/avatar/07.jpg'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'

const PersonalInformation = () => {
  return (
    <Col xxl={7}>
      <Card className="bg-transparent border rounded-3 h-100">
        <CardHeader className="bg-light border-bottom">
          <h5 className="card-header-title mb-0">Personal Information</h5>
        </CardHeader>
        <CardBody>
          <div className="avatar avatar-xl mb-3">
            <img className="avatar-img rounded-circle border border-white border-3 shadow" src={avatar7} alt="avatar" />
          </div>
          <Row>
            <Col md={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item">
                  <span>Title:</span>
                  &nbsp;<span className="h6 mb-0">Mr.</span>
                </li>
                <li className="list-group-item">
                  <span>Full Name:</span>
                  &nbsp;<span className="h6 mb-0">Louis Ferguson</span>
                </li>
                <li className="list-group-item">
                  <span>User Name:</span>
                  &nbsp;<span className="h6 mb-0">Lousifer</span>
                </li>
                <li className="list-group-item">
                  <span>Mobile Number:</span>
                  &nbsp;<span className="h6 mb-0">+123 456 789 10</span>
                </li>
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item">
                  <span>Email ID:</span>&nbsp;
                  <span className="h6 mb-0">example@gmail.com</span>
                </li>
                <li className="list-group-item">
                  <span>Location:</span>&nbsp;
                  <span className="h6 mb-0">California</span>
                </li>
                <li className="list-group-item">
                  <span>Joining Date:</span>&nbsp;
                  <span className="h6 mb-0">29 Aug 2019</span>
                </li>
              </ul>
            </Col>
            <Col xs={12}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item">
                  <span>Education:</span>
                  &nbsp;<span className="h6 mb-0">Bachelor in Computer Graphics,</span>
                  &nbsp;<span className="h6 mb-0">Masters in Computer Graphics</span>
                </li>
              </ul>
            </Col>
            <Col xs={12}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item d-flex">
                  <span>Description:</span>
                  <p className="h6 mb-0">
                    As it so contrasted oh estimating instrument. Size like body someone had. Are conduct viewing boy minutes warrant the expense
                    Tolerably behavior may admit daughters offending her ask own. Praise effect wishes change way and any wanted. Lively use looked
                    latter regard had. Do he it part more last in
                  </p>
                </li>
              </ul>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Col>
  )
}

export default PersonalInformation
