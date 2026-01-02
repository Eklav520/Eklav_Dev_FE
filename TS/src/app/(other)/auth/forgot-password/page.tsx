import PageMetaData from '@/components/PageMetaData'
import { Col, Row } from 'react-bootstrap'
import AuthLayout from '../components/AuthLayout'
import ForgotPassword from './components/ForgotPassword'

const ForgotPasswordPage = () => {
  return (
    <>
      <PageMetaData title="Forgot-Password" />
      <AuthLayout>
        <Col xs={12} lg={6} className="d-flex justify-content-center">
          <Row className="my-5">
            <Col sm={10} xl={12} className="m-auto">
              <span className="mb-0 fs-1">🤔</span>
              <h1 className="fs-2">Forgot Password?</h1>
              <h5 className="fw-light mb-4">To receive a new password, enter your email address below.</h5>
              <ForgotPassword />
            </Col>
          </Row>
        </Col>
      </AuthLayout>
    </>
  )
}

export default ForgotPasswordPage
