import PageMetaData from '@/components/PageMetaData'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'

const SettingPage = () => {
  return (
    <>
      <PageMetaData title="Setting" />
      <div className="border rounded-3">
        <Row>
          <Col xs={12}>
            <Card className="card bg-transparent">
              <CardHeader className="bg-transparent border-bottom">
                <h3 className="card-header-title">Settings</h3>
              </CardHeader>
              <CardBody>
                <h5 className="mb-4">Profile Settings</h5>
                <div className="form-check form-switch form-check-md">
                  <input className="form-check-input" type="checkbox" role="switch" id="profilePublic" defaultChecked />
                  <label className="form-check-label" htmlFor="profilePublic">
                    Your profile&apos;s public visibility
                  </label>
                </div>
                <hr />
                <h5 className="card-header-title">Notifications Settings</h5>
                <p className="mb-2 mt-3">Choose type of notifications you want to receive</p>
                <div className="form-check form-switch form-check-md mb-3">
                  <input className="form-check-input" type="checkbox" id="checkPrivacy1" defaultChecked />
                  <label className="form-check-label" htmlFor="checkPrivacy1">
                    Notify me via email when logging in
                  </label>
                </div>
                <div className="form-check form-switch form-check-md mb-3">
                  <input className="form-check-input" type="checkbox" id="checkPrivacy2" />
                  <label className="form-check-label" htmlFor="checkPrivacy2">
                    Send SMS confirmation for all online payments
                  </label>
                </div>
                <div className="form-check form-switch form-check-md mb-3">
                  <input className="form-check-input" type="checkbox" id="checkPrivacy3" defaultChecked />
                  <label className="form-check-label" htmlFor="checkPrivacy3">
                    Check which device(s) access your account
                  </label>
                </div>
                <div className="form-check form-switch form-check-md mb-3">
                  <input className="form-check-input" type="checkbox" id="checkPrivacy4" />
                  <label className="form-check-label" htmlFor="checkPrivacy4">
                    Show your profile publicly
                  </label>
                </div>
                <div className="d-sm-flex justify-content-end">
                  <button type="button" className="btn btn-sm btn-primary me-2 mb-0">
                    Save changes
                  </button>
                  <Button size="sm" variant="outline-secondary" className="mb-0">
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default SettingPage
