import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import { Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsXLg } from 'react-icons/bs'
import { activeLogsIpData, ActiveLogsIpType } from '../data'

const ActiveLogCard = ({ browser, ip, time }: ActiveLogsIpType) => {
  const { removeSession } = useAuthContext()

  return (
    <tr>
      <td>{browser}</td>
      <td>{ip}</td>
      <td>{time.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
      <td>
        <button className="btn btn-sm btn-danger-soft me-1 mb-1 mb-md-0" onClick={removeSession}>
          Sign out
        </button>
      </td>
    </tr>
  )
}

const AccountSetting = () => {
  const { isTrue: isOpen, toggle } = useToggle()

  return (
    <>
      <div className="bg-light rounded-3 p-4 mb-3">
        <div className="d-md-flex justify-content-between align-items-center">
          <div>
            <h6 className="h5">Activity Logs</h6>
            <p className="mb-1 mb-md-0">You can save your all activity logs including unusual activity detected.</p>
          </div>
          <div className="form-check form-switch form-check-md mb-0">
            <input className="form-check-input" type="checkbox" id="checkPrivacy1" defaultChecked />
          </div>
        </div>
      </div>
      <div className="bg-light rounded-3 p-4 mb-3">
        <div className="d-md-flex justify-content-between align-items-center">
          <div>
            <h6 className="h5">Change Password</h6>
            <p className="mb-1 mb-md-0">Set a unique password to protect your account.</p>
          </div>
          <div>
            <Button onClick={toggle} className="btn btn-primary mb-1" data-bs-toggle="modal" data-bs-target="#changePassword">
              Change Password
            </Button>
            <p className="mb-0 small h6">Last change 10 Aug 2020</p>
          </div>
        </div>
      </div>
      <div className="bg-light rounded-3 p-4">
        <div className="d-md-flex justify-content-between align-items-center">
          <div>
            <h6 className="h5">2 Step Verification</h6>
            <p className="mb-1 mb-md-0">
              Secure your account with 2 Step security. When it is activated you will need to enter not only your password, but also a special code
              using app. You can receive this code by in mobile app.
            </p>
          </div>
          <div className="form-check form-switch form-check-md mb-0">
            <input className="form-check-input" type="checkbox" id="checkPrivacy13" defaultChecked />
          </div>
        </div>
      </div>
      <Card className="border mt-4">
        <CardHeader className="border-bottom">
          <h5 className="card-header-title">Active Logs</h5>
        </CardHeader>
        <CardBody>
          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Browser
                  </th>
                  <th scope="col" className="border-0">
                    IP
                  </th>
                  <th scope="col" className="border-0">
                    Time
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeLogsIpData.map((item, idx) => (
                  <ActiveLogCard key={idx} {...item} />
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <Modal
        onHide={toggle}
        show={isOpen}
        className="fade"
        id="changePassword"
        tabIndex={-1}
        aria-labelledby="changePasswordLabel"
        aria-hidden="true">
        <ModalHeader className="modal-header bg-dark">
          <h5 className="modal-title text-white" id="changePasswordLabel">
            Change Password
          </h5>
          <button onClick={toggle} type="button" className="btn btn-sm btn-light mb-0 ms-auto" data-bs-dismiss="modal" aria-label="Close">
            <BsXLg />
          </button>
        </ModalHeader>
        <ModalBody className="modal-body">
          <form className="row">
            <p className="mb-2">Your password has expired, Please choose a new passowrd</p>
            <Col xs={12}>
              <label className="form-label">
                Old Password <span className="text-danger">*</span>
              </label>
              <input type="Password" className="form-control" placeholder="Enter old password" />
            </Col>
            <p className="mb-2 mt-4">Your password must be at least eight characters and cannot contain space.</p>
            <Col xs={12} className="mb-3">
              <label className="form-label">
                New Passowrd <span className="text-danger">*</span>
              </label>
              <input type="password" className="form-control" placeholder="Enter new passowrd" />
            </Col>
            <Col xs={12}>
              <label className="form-label">
                Confirm Passowrd <span className="text-danger">*</span>
              </label>
              <input type="password" className="form-control" placeholder="Enter confirm passowrd" />
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={toggle} className="btn btn-danger-soft my-0" data-bs-dismiss="modal">
            Close
          </button>
          <button type="button" className="btn btn-success my-0">
            Change Password
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AccountSetting
