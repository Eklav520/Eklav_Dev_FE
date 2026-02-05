import IconTextFormInput from '@/components/form/IconTextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { BsEnvelopeFill } from 'react-icons/bs'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import CaptchaBox from '@/common/CaptchaBox'

// 0. Define form types
type ForgotPasswordForm = {
  email: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

// 1. Unified validation schema
const fullSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),

  currentPassword: yup.string().when('$isReset', {
    is: true,
    then: (schema) => schema.required('Current password is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  newPassword: yup.string().when('$isReset', {
    is: true,
    then: (schema) => schema.min(6, 'Minimum 6 characters').required('New password is required'),
    otherwise: (schema) => schema.notRequired(),
  }),

  confirmPassword: yup.string().when('$isReset', {
    is: true,
    then: (schema) => schema.required('Please confirm your new password').oneOf([yup.ref('newPassword')], 'Passwords must match'),
    otherwise: (schema) => schema.notRequired(),
  }),
})

const ForgotPassword = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [stage, setStage] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaValid, setCaptchaValid] = useState(false)

  const navigate = useNavigate()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(fullSchema, { context: { isReset: stage === 'reset' } }),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setMessage('')
    setError('')

    if (stage === 'email' && !captchaValid) {
      setError('Please verify the captcha first.')
      return
    }

    setLoading(true)

    try {
      if (stage === 'email') {
        const res = await fetch(`${baseURL}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.message)

        setEmail(data.email)
        setStage('reset')
        setCaptchaValid(false) // Reset captcha state
        setMessage('Temporary password sent to your email.')
        reset({ email: data.email })
      } else {
        const res = await fetch(`${baseURL}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.message)

        setMessage('Password updated successfully.')
        setStage('email')
        reset()
        setTimeout(() => navigate('/auth/sign-in'), 2000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {stage === 'email' ? (
        <>
          {/* Email Input */}
          <div className="mb-4">
            <IconTextFormInput
              control={control}
              icon={BsEnvelopeFill}
              placeholder="E-mail"
              label="Email Address *"
              name="email"
            />
            <small className="text-danger">{errors.email?.message}</small>
          </div>

          {/* 🔥 Captcha Box ONLY in email stage */}
          <CaptchaBox onValidate={setCaptchaValid} />

          {/* Error if captcha not verified */}
          {!captchaValid && <small className="text-danger">Please complete captcha verification</small>}
        </>
      ) : (
        <>
          <div className="mb-3">
            <label>Current Password (from email)</label>
            <input {...register('currentPassword')} type="password" className="form-control" />
            <small className="text-danger">{errors.currentPassword?.message}</small>
          </div>

          <div className="mb-3">
            <label>New Password</label>
            <input {...register('newPassword')} type="password" className="form-control" />
            <small className="text-danger">{errors.newPassword?.message}</small>
          </div>

          <div className="mb-3">
            <label>Confirm Password</label>
            <input {...register('confirmPassword')} type="password" className="form-control" />
            <small className="text-danger">{errors.confirmPassword?.message}</small>
          </div>
        </>
      )}

      {message && <p className="text-success">{message}</p>}
      {error && <p className="text-danger">{error}</p>}

      <div className="d-grid">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || (stage === 'email' && !captchaValid)}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : stage === 'email' ? (
            'Send Reset Email'
          ) : (
            'Update Password'
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <span>
          Already have an account? <Link to="/auth/sign-in">Sign in here</Link>
        </span>
      </div>
    </form>
  )
}

export default ForgotPassword
