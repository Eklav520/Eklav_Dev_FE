import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'

const EmailChange = () => {
  return (
    <Col lg={6}>
      <Card className="bg-transparent border rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h5 className="card-header-title mb-0">Update email</h5>
        </CardHeader>
        <CardBody>
          <p>
            Your current email address is <span className="text-primary">example@gmail.com</span>
          </p>
          <form>
            <label className="form-label">Enter your new email id</label>
            <input className="form-control" type="email" placeholder="Enter new email" />
            <div className="d-flex justify-content-end mt-4">
              <button type="button" className="btn btn-primary mb-0">
                Update email
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Col>
  )
}

export default EmailChange
