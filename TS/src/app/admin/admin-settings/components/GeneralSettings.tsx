import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'

const GeneralSettings = () => {
  return (
    <Card className="shadow">
      <CardHeader className="border-bottom">
        <h5 className="card-header-title">General Settings</h5>
      </CardHeader>
      <CardBody>
        <form className="row g-4">
          <Col xs={12}>
            <label className="form-label">Main Site URL</label>
            <input type="text" className="form-control" placeholder="Site URL" />
            <div className="form-text">Set your main website url.</div>
          </Col>
          <Col lg={6}>
            <label className="form-label">Select Currency</label>
            <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
              <option>Select Currency</option>
              <option>USD</option>
              <option>Indian Rupee</option>
              <option>Euro</option>
              <option>British Pound</option>
            </ChoicesFormInput>
            <div className="form-text">Select currency as per Country</div>
          </Col>
          <Col lg={6}>
            <label className="form-label">Select Language</label>
            <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
              <option>Select Language</option>
              <option>English</option>
              <option>Hindi</option>
              <option>German</option>
              <option>Spanish</option>
            </ChoicesFormInput>
            <div className="form-text">Select language as per Country</div>
          </Col>
          <Col lg={3}>
            <label className="form-label">Maintainance mode</label>
            <div className="form-check form-switch form-check-lg mb-0">
              <input className="form-check-input mt-0 price-toggle me-2" type="checkbox" id="flexSwitchCheckDefault" />
              <label className="form-check-label mt-1" htmlFor="flexSwitchCheckDefault">
                Make Site Offline
              </label>
            </div>
          </Col>
          <Col lg={9}>
            <label className="form-label">Maintainance Text</label>
            <textarea className="form-control" rows={3} defaultValue={''} />
            <div className="form-text">
              Admin login on maintenance mode:
              <a href="#" className="ms-2">
                http://example.xyz/admin/login
              </a>
            </div>
          </Col>
          <div className="d-sm-flex justify-content-end">
            <button type="button" className="btn btn-primary mb-0">
              Update
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default GeneralSettings
