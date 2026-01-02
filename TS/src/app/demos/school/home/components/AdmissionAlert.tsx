import useToggle from '@/hooks/useToggle'
import { Alert } from 'react-bootstrap'
import { BsXLg } from 'react-icons/bs'

const AdmissionAlert = () => {
  const { isTrue, toggle } = useToggle(true)
  return (
    <Alert
      show={isTrue}
      variant="light"
      className="alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x z-index-99 d-lg-flex justify-content-between align-items-center shadow p-4 col-9 col-md-7 col-xxl-5"
      role="alert">
      <div>
        <h4 className="text-dark">Admissions open!</h4>
        <p className="m-0 pe-3">
          We are so eager to be working with kids and making a difference in their careers. Being a mentor is what we have always wanted to be.
        </p>
      </div>
      <div className="d-flex mt-3 mt-lg-0">
        <button type="button" className="btn btn-success btn-sm mb-0 me-2" onClick={toggle}>
          <span aria-hidden="true">Get Admission</span>
        </button>
        <div className="position-absolute end-0 top-0 mt-n3 me-n3">
          <button type="button" className="btn btn-danger btn-round btn-sm mb-0" onClick={toggle}>
            <span aria-hidden="true">
              <BsXLg />
            </span>
          </button>
        </div>
      </div>
    </Alert>
  )
}

export default AdmissionAlert
