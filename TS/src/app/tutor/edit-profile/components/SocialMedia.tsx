import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { BsTwitter } from 'react-icons/bs'
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa'

const SocialMedia = () => {
  return (
    <Col lg={6}>
      <Card className="bg-transparent border rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h5 className="card-header-title mb-0">Social media profile</h5>
        </CardHeader>
        <CardBody>
          <div className="mb-3">
            <label className="form-label">
              <FaFacebook className="fab fa-facebook text-facebook me-2" />
              Enter facebook username
            </label>
            <input className="form-control" type="text" defaultValue="loristev" placeholder="Enter username" />
          </div>
          <div className="mb-3">
            <label className="form-label">
              <BsTwitter className="bi bi-twitter text-twitter me-2" />
              Enter twitter username
            </label>
            <input className="form-control" type="text" defaultValue="loristev" placeholder="Enter username" />
          </div>
          <div className="mb-3">
            <label className="form-label">
              <FaInstagram className="fab fa-instagram text-danger me-2" />
              Enter instagram username
            </label>
            <input className="form-control" type="text" defaultValue="loristev" placeholder="Enter username" />
          </div>
          <div className="mb-3">
            <label className="form-label">
              <FaYoutube className="fab fa-youtube text-youtube me-2" />
              Add your youtube profile URL
            </label>
            <input className="form-control" type="text" defaultValue="https://www.youtube.com/in/Eklav-05620abc" placeholder="Enter username" />
          </div>
          <div className="d-flex justify-content-end mt-4">
            <button type="button" className="btn btn-primary mb-0">
              Save changes
            </button>
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default SocialMedia
