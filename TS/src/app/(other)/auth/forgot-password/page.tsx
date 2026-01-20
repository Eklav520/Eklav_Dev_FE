import PageMetaData from '@/components/PageMetaData'
import AuthLayout from '../components/AuthLayout'
import ForgotPassword from './components/ForgotPassword'

const ForgotPasswordPage = () => {
  return (
    <>
      <PageMetaData title="Forgot Password" />

      <AuthLayout>

        <span className="fs-1">🤔</span>

        <h1 className="fs-2 fw-bold mb-2">
          Forgot Password?
        </h1>

        <p className="text-muted mb-4">
          To receive a new password, enter your email address below.
        </p>

        {/* Card */}
        <div className="card border-0 shadow-sm w-100">
          <div className="card-body p-4 p-lg-5">
            <ForgotPassword />
          </div>
        </div>

      </AuthLayout>
    </>
  )
}

export default ForgotPasswordPage
