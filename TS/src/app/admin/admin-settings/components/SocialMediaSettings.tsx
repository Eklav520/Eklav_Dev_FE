import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { FaFacebook } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

const SocialMediaSettings = () => {
  return (
    <Card className="shadow">
      <CardHeader className="border-bottom d-sm-flex justify-content-between align-items-center">
        <h5 className="card-header-title mb-0">Social Media Settings</h5>
        <a href="#" className="btn btn-sm btn-primary mb-0">
          Add new
        </a>
      </CardHeader>
      <CardBody>
        <form className="row g-4">
          <Col sm={6}>
            <label className="form-label icons-center">
              <FcGoogle className="me-2" />
              Enter google client ID
            </label>
            <input className="form-control" type="text" />
          </Col>
          <Col sm={6}>
            <label className="form-label">
              <FcGoogle className="me-2" />
              Enter google API
            </label>
            <input className="form-control" type="text" />
          </Col>
          <Col sm={6}>
            <label className="form-label">
              <FaFacebook className="text-facebook me-2" />
              Enter facebook client ID
            </label>
            <input className="form-control" type="text" />
          </Col>
          <Col sm={6}>
            <label className="form-label">
              <FaFacebook className="text-facebook me-2" />
              Enter facebook API
            </label>
            <input className="form-control" type="text" />
          </Col>
          <p className="mb-0">
            <b>In your app set all redirect URL like:</b> <u className="text-primary">https://app.eklav.abc/google/callback</u>
          </p>
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-primary mb-0">
              Update
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default SocialMediaSettings
