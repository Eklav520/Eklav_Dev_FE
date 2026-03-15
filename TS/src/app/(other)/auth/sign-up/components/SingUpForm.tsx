import { useState, useRef } from 'react'
import { Col, Row } from 'react-bootstrap'
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaCheckCircle
} from 'react-icons/fa'

import FormInput from './FormInput'
import useSignUp from '../useSignUp'
import CaptchaBox from '@/common/CaptchaBox'
import PasswordStrengthMeter from './PasswordStrengthMeter'
import TermsModal from './TermsModal'
import './SignUpForm.css'


interface SignUpFormProps {
  onSuccess?: () => void
}

type Role = 'student' | 'tutor'

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const {
    signUp,
    control,
    register,
    watch,
    errors,
    loading,
    setValue
  } = useSignUp(onSuccess)

  const formRef = useRef<HTMLFormElement>(null)

  const [role, setRole] = useState<Role>('student')
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [captchaValid, setCaptchaValid] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)

  const password = watch('password', '')
  const termsAccepted = watch('terms', false)

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setValue('role', newRole)
  }

  return (
    <form ref={formRef} onSubmit={signUp} noValidate className="signup-form">

      <div className="role-switcher">
        <button
          type="button"
          className={`role-btn ${role === 'student' ? 'active' : ''}`}
          onClick={() => handleRoleChange('student')}
        >
          Student
        </button>

        <button
          type="button"
          className={`role-btn ${role === 'tutor' ? 'active' : ''}`}
          onClick={() => handleRoleChange('tutor')}
        >
          Tutor
        </button>
      </div>
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
            label="Email"
            type="email"
            placeholder="example@email.com"
            icon={<FaEnvelope />}
            required
            error={errors.email}
          />
        </Col>

        <Col md={6} className="mb-3">
          <FormInput
            control={control}
            name="password"
            label="Password"
            type="password"
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
            icon={<FaLock />}
            required
            error={errors.confirmPassword}
          />
        </Col>

        <Col md={12} className="mb-3">
          <FormInput
            control={control}
            name="phoneNo"
            label="Phone Number"
            type="tel"
            placeholder="+91 9876543210"
            icon={<FaPhone />}
            required
            error={errors.phoneNo}
          />
        </Col>
      </Row>

      {/* CAPTCHA */}
      <div className="my-3">
        <CaptchaBox onValidate={setCaptchaValid} />
      </div>

      {/* TERMS */}
      <div className="form-check mb-4">
        <input
          type="checkbox"
          className="form-check-input"
          {...register('terms')}
        />

        <label className="form-check-label">
          I agree to the{' '}
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => setShowTermsModal(true)}
          >
            Terms & Conditions
          </button>
        </label>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        className="btn w-100"
        style={{
          backgroundColor: '#fd692a',
          borderColor: '#fd692a',
          color: '#fff'
        }}
        disabled={loading || !termsAccepted || !captchaValid || passwordScore < 3}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
        <FaCheckCircle className="ms-2" />
      </button>

      {/* TERMS MODAL */}
      <TermsModal
        show={showTermsModal}
        onHide={() => setShowTermsModal(false)}
        onAccept={() => {
          setValue('terms', true)
          setShowTermsModal(false)
        }}
      />
    </form>
  )
}

export default SignUpForm