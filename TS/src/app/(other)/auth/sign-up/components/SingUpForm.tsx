import { useState, useEffect, useRef } from 'react'
import { Col, Row, Alert, ProgressBar } from 'react-bootstrap'
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaGraduationCap,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle
} from 'react-icons/fa'
import FormInput from './FormInput'
import useSignUp from '../useSignUp'
import CaptchaBox from '@/common/CaptchaBox'
import PasswordStrengthMeter from './PasswordStrengthMeter'
import TermsModal from './TermsModal'
import CollegeSearch from './CollegeSearch'
import './SignUpForm.css'

const SignUpForm = () => {
  const {
    signUp,
    control,
    register,
    watch,
    errors,
    loading,
    setValue,
    clearErrors
  } = useSignUp()

  const [step, setStep] = useState(1)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [captchaValid, setCaptchaValid] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  const termsAccepted = watch('terms', false)
  const password = watch('password', '')
  const email = watch('email', '')
  const fullname = watch('fullname', '')

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const departmentOptions = [
    'Computer Science and Engineering',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Artificial Intelligence and Machine Learning',
    'Data Science',
    'Internet of Things',
    'Biomedical Engineering',
    'Chemical Engineering',
    'Master of Computer Applications',
    'Bachelor of Technology'
  ].sort()

  const validateStep1 = () => {
    return !errors.fullname && !errors.email && !errors.password && !errors.confirmPassword
  }

  const validateStep2 = () => {
    return !errors.phoneNo && !errors.joiningYear && !errors.department && !errors.college
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }
  const handleCollegeSelect = (college: any | null) => {
    if (!college) {
      setValue('college', '', { shouldValidate: true })
      return
    }

    const fullValue = `${college.name}, ${college.address}, ${college.pincode}`

    setValue('college', fullValue, { shouldValidate: true })
    clearErrors('college')
  }

  const getProgress = () => {
    return step === 1 ? 50 : 100
  }

  return (
    <form ref={formRef} onSubmit={signUp} noValidate className="signup-form">
      {/* Progress Indicator */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted small">
            Step {step} of 2
          </span>
          <span className="small fw-semibold">
            {step === 1 ? 'Account Details' : 'Academic Details'}
          </span>
        </div>
        <ProgressBar
          now={getProgress()}
          style={{
            backgroundColor: 'rgba(253,105,42,.15)'
          }}
          className="mb-3"
        >
          <ProgressBar
            now={getProgress()}
            style={{ backgroundColor: '#fd692a' }}
          />
        </ProgressBar>

      </div>

      {/* Step 1: Account Details */}
      {step === 1 && (
        <div className="step-content">
          <h5 className="mb-4 fw-semibold">
            <FaUser className="me-2" />
            Account Information
          </h5>

          <Row>
            <Col md={12} className="mb-3">
              <FormInput
                control={control}
                name="fullname"
                label="Full Name"
                placeholder="Enter your full name"
                icon={<FaUser />}
                required
                error={errors.fullname}
              />
            </Col>

            <Col md={12} className="mb-3">
              <FormInput
                control={control}
                name="email"
                label="Email Address"
                type="email"
                placeholder="professional@example.com"
                icon={<FaEnvelope />}
                required
                error={errors.email}
                hint=""
              />
            </Col>

            <Col md={6} className="mb-3">
              <FormInput
                control={control}
                name="password"
                label="Password"
                type="password"
                placeholder="Create a strong password"
                icon={<FaLock />}
                required
                error={errors.password}
              />
              {password && (
                <PasswordStrengthMeter
                  password={password}
                  onScoreChange={setPasswordScore}
                />
              )}
            </Col>

            <Col md={6} className="mb-3">
              <FormInput
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                icon={<FaLock />}
                required
                error={errors.confirmPassword}
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn px-4"
              style={{
                backgroundColor: '#fd692a',
                borderColor: '#fd692a',
                color: '#fff'
              }}

              onClick={nextStep}
              disabled={!validateStep1() || passwordScore < 3}
            >
              Continue
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Academic Details */}
      {step === 2 && (
        <div className="step-content">
          <h5 className="mb-4 fw-semibold">
            <FaGraduationCap className="me-2" />
            Academic Information
          </h5>

          <Row>
            <Col md={6} className="mb-3">
              <FormInput
                control={control}
                name="phoneNo"
                label="Phone Number"
                type="tel"
                placeholder="+91 9876543210"
                icon={<FaPhone />}
                maxLength={10}
                required
                error={errors.phoneNo}
              />
            </Col>

            <Col md={6} className="mb-3">
              <div className="form-group">
                <label className="form-label fw-semibold">
                  <FaCalendarAlt className="me-2" />
                  Joining Year *
                </label>
                <select
                  className={`form-select ${errors?.joiningYear ? 'is-invalid' : ''}`}
                  {...register('joiningYear')}
                >
                  <option value="">Select Year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors?.joiningYear && (
                  <small className="text-danger mt-1">{errors.joiningYear.message}</small>
                )}
              </div>
            </Col>

            <Col md={6} className="mb-3">
              <div className="form-group">
                <label className="form-label fw-semibold">
                  <FaGraduationCap className="me-2" />
                  Department *
                </label>
                <select
                  className={`form-select ${errors?.department ? 'is-invalid' : ''}`}
                  {...register('department')}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors?.department && (
                  <small className="text-danger mt-1">{errors.department.message}</small>
                )}
              </div>
            </Col>

            <Col md={12} className="mb-3">
              <div className="form-group">
                <label className="form-label fw-semibold">
                  <FaBuilding className="me-2" />
                  College/University *
                </label>
                <CollegeSearch
                  onSelect={handleCollegeSelect}
                  error={errors.college}
                  value={watch('college')}
                />
              </div>
            </Col>
          </Row>

          {/* CAPTCHA */}
          <div className="my-4">
            <CaptchaBox onValidate={setCaptchaValid} />
          </div>

          {/* Terms & Conditions */}
          <div className="mt-4">
            <div className="form-check">
              <input
                type="checkbox"
                className={`form-check-input ${errors?.terms ? 'is-invalid' : ''}`}
                id="termsCheckbox"
                {...register('terms')}
              />
              <label className="form-check-label" htmlFor="termsCheckbox">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-decoration-none p-0 border-0 bg-transparent"
                  style={{ color: '#fd692a' }}

                  onClick={() => setShowTermsModal(true)}
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  className="text-decoration-none p-0 border-0 bg-transparent"
                  style={{ color: '#fd692a' }}

                  onClick={() => setShowTermsModal(true)}
                >
                  Privacy Policy
                </button>
              </label>
              {errors?.terms && (
                <small className="text-danger d-block mt-1">
                  {errors.terms.message}
                </small>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="d-flex justify-content-between align-items-center mt-5">
            <button
              type="button"
              className="btn"
              style={{
                borderColor: '#fd692a',
                color: '#fd692a',
                background: 'transparent'
              }}

              onClick={prevStep}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back
            </button>

            <button
              type="submit"
              className="btn px-5"
              style={{
                backgroundColor: '#fd692a',
                borderColor: '#fd692a',
                color: '#fff'
              }}

              disabled={loading || !termsAccepted || !captchaValid}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    style={{ color: '#fff' }}
                  ></span>

                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <FaCheckCircle className="ms-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      <TermsModal
        show={showTermsModal}
        onHide={() => setShowTermsModal(false)}
        onAccept={() => {
          setValue('terms', true, { shouldValidate: true })
          setShowTermsModal(false)
        }}
      />
    </form>
  )
}

export default SignUpForm