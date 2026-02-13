import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import CryptoJS from 'crypto-js'
import { useNotificationContext } from '@/context/useNotificationContext'

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'EKLAV@2025'

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email address is required')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email format'
    ),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  fullname: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  phoneNo: yup
    .string()
    .required('Phone number is required')
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
  joiningYear: yup
    .number()
    .required('Joining year is required')
    .min(2000, 'Year must be after 2000')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  department: yup.string().required('Please select your department'),
  college: yup.string().required('Please select your college'),
})

type SignFormFields = yup.InferType<typeof schema>

const useSignUp = () => {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showNotification } = useNotificationContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors, isValid },
  } = useForm<SignFormFields>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/dashboard')
  }

  const signUp = handleSubmit(async (values) => {
    try {
      setLoading(true)
      setSubmitError(null)

      // Validate form before submission
      const isValid = await trigger()
      if (!isValid) {
        throw new Error('Please fix the errors in the form')
      }

      const encryptedPassword = CryptoJS.AES.encrypt(
        values.password,
        SECRET_KEY
      ).toString()

      const encryptedConfirmPassword = CryptoJS.AES.encrypt(
        values.confirmPassword,
        SECRET_KEY
      ).toString()

      const payload = {
        ...values,
        password: encryptedPassword,
        confirmPassword: encryptedConfirmPassword,
        userType: 'student',
        registrationDate: new Date().toISOString(),
        status: 'pending_verification',
      }
      const response = await fetch(`${baseURL}/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      showNotification({ 
        message: 'Account created successfully! Please check your email for verification.', 
        variant: 'success',
      })

      // Store user info in localStorage for immediate access
      localStorage.setItem('user_email', values.email)
      localStorage.setItem('registration_complete', 'true')

      redirectUser()

    } catch (error: any) {
      console.error('Signup error:', error)
      
      const errorMessage = error.message || 
        (error.response?.data?.message) || 
        'Registration failed. Please try again.'
      
      setSubmitError(errorMessage)
      
      showNotification({
        message: errorMessage,
        variant: 'danger',
      })

    } finally {
      setLoading(false)
    }
  })

  return { 
    loading, 
    signUp, 
    control, 
    register, 
    watch, 
    setValue, 
    clearErrors, 
    trigger,
    errors, 
    isValid,
    submitError 
  }
}

export default useSignUp