import element3Img from '@/assets/images/element/03.svg'
import PageMetaData from '@/components/PageMetaData'
import { Col, Row } from 'react-bootstrap'
//import { FaFacebookF, FaGoogle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import SingUpForm from './components/SingUpForm'

const SignUpPage = () => {
  return (
    <>
      <PageMetaData title="Sign-Up" />
      <AuthLayout>
        <Col xs={12} lg={6} className="m-auto">
          <Row className="my-5">
            <Col sm={10} xl={8} className="m-auto">
              <img src={element3Img} className="w-auto h-40px mb-2 ms-0" alt="element" />
              <h2>Sign up for your account!</h2>
              <p className="lead mb-4">Nice to see you! Please Sign up with your account.</p>
              <SingUpForm />
              <Row>
                <div className="position-relative my-4">
                  <hr />
                  <p className="small position-absolute top-50 start-50 translate-middle bg-body px-5">Or</p>
                </div>
                {/* <Col xxl={6} className="d-grid">
                  <a href="#" className="btn bg-google mb-2 mb-xxl-0">
                    <FaGoogle className="text-white me-2" />
                    Signup with Google
                  </a>
                </Col>
                <Col xxl={6} className="d-grid">
                  <a href="#" className="btn bg-facebook mb-0">
                    <FaFacebookF className="me-2" />
                    Signup with Facebook
                  </a>
                </Col> */}
              </Row>
              <div className="mt-4 text-center">
                <span>
                  Already have an account?<Link to="/auth/sign-in"> Sign in here</Link>
                </span>
              </div>
            </Col>
          </Row>
        </Col>
      </AuthLayout>
    </>
  )
}

export default SignUpPage
