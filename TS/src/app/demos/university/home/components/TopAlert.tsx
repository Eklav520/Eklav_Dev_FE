import { Alert, Container } from 'react-bootstrap'

import avatar9 from '@/assets/images/avatar/09.jpg'
import { BsXLg } from 'react-icons/bs'
import useToggle from '@/hooks/useToggle'

const TopAlert = () => {
  const { isTrue, toggle } = useToggle(true)

  return (
    <Container>
      <Alert
        variant="success"
        show={isTrue}
        className="alert-dismissible d-flex justify-content-between align-items-center fade show mt-2 mb-0 rounded-3 pe-2"
        role="alert">
        <div>
          <div className="avatar avatar-xs me-2">
            <img className="avatar-img rounded-circle" src={avatar9} alt="avatar" />
          </div>
          The personality development class starts at 2:00 pm, click to
          <a href="#" className="alert-link">
            Join Now
          </a>
        </div>
        <button onClick={toggle} type="button" className="btn btn-link text-primary-hover mb-0 text-end" data-bs-dismiss="alert" aria-label="Close">
          <BsXLg className="bi bi-x-lg"></BsXLg>
        </button>
      </Alert>
    </Container>
  )
}

export default TopAlert
