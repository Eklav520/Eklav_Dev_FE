import PageMetaData from '@/components/PageMetaData'
import { Card, CardBody, CardHeader } from 'react-bootstrap'

const DeleteAccountPage = () => {
  return (
    <>
      <PageMetaData title="Delete Account" />
      <Card className="border bg-transparent rounded-3 mb-0">
        <CardHeader className="bg-transparent border-bottom">
          <h3 className="card-header-title mb-0">Deactivate Account</h3>
        </CardHeader>
        <CardBody>
          <h6>Before you go...</h6>
          <ul>
            <li>
              Take a backup of your data <a href="#">Here</a>
            </li>
            <li>If you delete your account, you will lose your all data.</li>
          </ul>
          <div className="form-check form-check-md my-4">
            <input className="form-check-input" type="checkbox" id="deleteaccountCheck" />
            <label className="form-check-label" htmlFor="deleteaccountCheck">
              Yes, I&apos;d like to delete my account
            </label>
          </div>
          <a href="#" className="btn btn-success-soft mb-2 mb-sm-0 me-1">
            Keep my account
          </a>
          <a href="#" className="btn btn-danger mb-0">
            Delete my account
          </a>
        </CardBody>
      </Card>
    </>
  )
}

export default DeleteAccountPage
