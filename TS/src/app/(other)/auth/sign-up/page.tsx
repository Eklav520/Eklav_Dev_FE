import element3Img from '@/assets/images/element/03.svg'
import PageMetaData from '@/components/PageMetaData'
import { Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import SignUpForm from './components/SingUpForm'
import { Suspense } from 'react'

const SignUpPage = () => {
  return (
    <>
      <PageMetaData title="Sign Up" />
      <AuthLayout>
        {/* Heading */}
        <h2 className="mb-1 text-center">Create your account</h2>
        <p className="text-muted mb-4 text-center">
          Join us and start your learning journey 🚀
        </p>

        {/* Card */}
        <div className="card border-0 shadow-sm w-100">
          <div className="card-body p-4 p-lg-5">
            <Suspense
              fallback={
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading form...</p>
                </div>
              }
            >
              <SignUpForm />
            </Suspense>
            {/* Sign In Link */}
            <div className="text-center mt-4">
              <p className="mb-0 text-muted">
                Already have an account?{' '}
                <Link to="/auth/sign-in" className="fw-semibold">
                  Sign In
                </Link>
              </p>
            </div>

          </div>
        </div>

      </AuthLayout>
    </>
  )
}

export default SignUpPage
