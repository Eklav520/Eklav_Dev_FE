import { Alert, Button } from 'react-bootstrap'

import useToggle from '@/hooks/useToggle'

import element27 from '@/assets/images/element/27.svg'

const CookieAlertBox = () => {
  const { isTrue, toggle } = useToggle(true)
  return (
    <Alert
      show={isTrue}
      onClose={toggle}
      dismissible
      className="alert-light fade show position-fixed start-0 bottom-0 z-index-99 rounded-3 shadow p-4 ms-3 mb-3 col-10 col-md-4 col-lg-3 col-xxl-2"
      role="alert">
      <div className="text-dark text-center">
        <img src={element27} className="h-50px mb-3" alt="cookie" />
        <p className="mb-0">
          This website stores cookies on your computer. To find out more about the cookies we use, see our
          <a className="text-dark" href="#">
            <u> Privacy Policy</u>
          </a>
        </p>
        <div className="mt-3">
          <Button variant="success-soft" type="button" className="btn-sm mb-0 me-1" aria-label="Close" onClick={toggle}>
            <span aria-hidden="true">Accept</span>
          </Button>
          <Button variant="danger-soft" type="button" className="btn-sm mb-0" aria-label="Close" onClick={toggle}>
            <span aria-hidden="true">Decline</span>
          </Button>
        </div>
      </div>
    </Alert>
  )
}

export default CookieAlertBox
