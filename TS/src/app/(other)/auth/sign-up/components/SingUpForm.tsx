import IconTextFormInput from '@/components/form/IconTextFormInput'
import { BsEnvelopeFill } from 'react-icons/bs'
import { FaLock } from 'react-icons/fa'
import useSignUp from '../useSignUp'
import { useState } from 'react'
import CaptchaBox from '@/common/CaptchaBox'

const SignUpForm = () => {
  const { signUp, control, register, watch, errors } = useSignUp() // ✅ fixed name
  const [showTerms, setShowTerms] = useState(false)
  const [captchaValid, setCaptchaValid] = useState(false);
  const termsAccepted = watch('terms', false)

  return (
    <form onSubmit={signUp} noValidate> {/* ✅ fixed handler + prevent native validation */}
      {/* Full Name */}
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          maxLength={30}
          minLength={4}
          placeholder="Full Name"
          label="Full Name *"
          name="fullname"
        />
        {errors?.fullname && (
          <small className="text-danger">{errors.fullname.message}</small>
        )}
      </div>

      {/* Email */}
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          placeholder="E-mail"
          label="Email Address *"
          name="email"
        />
        {errors?.email && (
          <small className="text-danger">{errors.email.message}</small>
        )}
      </div>

      {/* Password */}
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={FaLock}
          placeholder="*********"
          label="Password *"
          name="password"
        />
        {errors?.password && (
          <small className="text-danger">{errors.password.message}</small>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={FaLock}
          placeholder="*********"
          label="Confirm Password *"
          name="confirmPassword"
        />
        {errors?.confirmPassword && (
          <small className="text-danger">{errors.confirmPassword.message}</small>
        )}
      </div>

      {/* Phone Number */}
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone Number"
          label="Phone Number *"
          name="phoneNo"
        />
        {errors?.phoneNo && (
          <small className="text-danger">{errors.phoneNo.message}</small>
        )}
      </div>

      <CaptchaBox onValidate={setCaptchaValid} />

      {/* Terms of Service */}
      <div className="mb-4">
        <div className="form-check">
          <input
            type="checkbox"
            className={`form-check-input ${errors?.terms ? 'is-invalid' : ''}`}
            id="checkbox-1"
            {...register('terms')}
          />
          <label className="form-check-label" htmlFor="checkbox-1">
            By signing up, you agree to the{' '}
            <span
              role="button"
              className="text-primary text-decoration-underline"
              onClick={() => setShowTerms(!showTerms)}
            >
              Terms of Service
            </span>
          </label>
        </div>
        {errors?.terms && (
          <small className="text-danger">{errors.terms.message}</small>
        )}

        {showTerms && (
          <div
            className="mt-3 p-3 border rounded bg-light"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            <h6>Terms of Service</h6>
            <p>
              Welcome to our platform. By creating an account, you agree not to
              misuse the service.
            </p>
            <p>
              <strong>1. Usage:</strong> You must not engage in prohibited
              activities...
            </p>
            <p>
              <strong>2. Privacy:</strong> Your data will be protected according
              to our privacy policy...
            </p>
            <p>
              <strong>3. Termination:</strong> We may suspend accounts that
              violate these rules...
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="align-items-center mt-0">
        <div className="d-grid">
          <button
            className="btn btn-primary mb-0"
            type="submit"
            disabled={!termsAccepted || !captchaValid}
          >
            Sign Up
          </button>
        </div>
      </div>
    </form>
  )
}

export default SignUpForm
