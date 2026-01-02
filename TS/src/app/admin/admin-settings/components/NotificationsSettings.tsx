import { Card, CardBody, CardHeader } from 'react-bootstrap'

const NotificationsSettings = () => {
  return (
    <Card className="shadow">
      <CardHeader className="border-bottom">
        <h5 className="card-header-title">Notifications Settings</h5>
      </CardHeader>
      <CardBody>
        <h6 className="mb-2">Choose type of notifications you want to receive</h6>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy12" defaultChecked />
          <label className="form-check-label" htmlFor="checkPrivacy12">
            Withdrawal activity
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy2" />
          <label className="form-check-label" htmlFor="checkPrivacy2">
            Weekly report
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy3" defaultChecked />
          <label className="form-check-label" htmlFor="checkPrivacy3">
            Password change
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-0">
          <input className="form-check-input" type="checkbox" id="checkPrivacy4" />
          <label className="form-check-label" htmlFor="checkPrivacy4">
            Play sound on a message
          </label>
        </div>
        <h6 className="mb-2 mt-4">Instructor Related Notification</h6>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy11" defaultChecked />
          <label className="form-check-label" htmlFor="checkPrivacy5">
            Joining new instructors
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy5" />
          <label className="form-check-label" htmlFor="checkPrivacy5">
            Notify when the instructorss added new courses
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy6" defaultChecked />
          <label className="form-check-label" htmlFor="checkPrivacy6">
            Notify when instructors update courses
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-0">
          <input className="form-check-input" type="checkbox" id="checkPrivacy7" />
          <label className="form-check-label" htmlFor="checkPrivacy7">
            Course weekly report
          </label>
        </div>
        <h6 className="mb-2 mt-4">Student Related Notification</h6>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy8" defaultChecked />
          <label className="form-check-label" htmlFor="checkPrivacy8">
            Joining new student
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-3">
          <input className="form-check-input" type="checkbox" id="checkPrivacy9" />
          <label className="form-check-label" htmlFor="checkPrivacy9">
            Notify when students purchase new courses
          </label>
        </div>
        <div className="form-check form-switch form-check-md mb-0">
          <input className="form-check-input" type="checkbox" id="checkPrivacy10" />
          <label className="form-check-label" htmlFor="checkPrivacy10">
            Course weekly report
          </label>
        </div>
      </CardBody>
    </Card>
  )
}

export default NotificationsSettings
