import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import { useNotificationContext } from '@/context/useNotificationContext'

const schema = yup.object({
  role: yup
    .string()
    .oneOf(['student', 'tutor'])
    .default('student'),

  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email address is required'),

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
    .min(2)
    .max(50)
    .matches(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),

  phoneNo: yup
    .string()
    .required('Phone number is required')
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),

  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions'),

  joiningYear: yup
    .number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value
    )
    .notRequired(),

  department: yup
    .string()
    .nullable()
    .notRequired(),

  college: yup
    .string()
    .nullable()
    .notRequired(),
})

type SignFormFields = yup.InferType<typeof schema>

const useSignUp = (onSuccess?: () => void) => {
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
    formState: { errors },
  } = useForm<SignFormFields>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

   const redirectUser = () => {
    if (onSuccess) {
      onSuccess();  // 👈 closes modal
    } else {
      redirectUser();
    }
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/auth/sign-in')
  }

  const signUp = handleSubmit(async (values) => {
    try {
      setLoading(true)
      setSubmitError(null)

      const isValid = await trigger()
      if (!isValid) {
        throw new Error('Please fix the errors in the form')
      }

      // Remove confirmPassword before sending
      const { confirmPassword, ...rest } = values

      const payload = {
        ...rest,
        fullname: values.fullname.trim(),
        email: values.email.toLowerCase().trim(),
        role: values.role || 'student',
        college: values.college || null,
      }

      const response = await fetch(`${baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      showNotification({
        message:
          'Account created successfully! Please wait for approval if required.',
        variant: 'success',
      })

      localStorage.setItem('user_email', values.email)
      localStorage.setItem('registration_complete', 'true')

      redirectUser()
    } catch (error: any) {
      const errorMessage =
        error.message || 'Registration failed. Please try again.'

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
    submitError,
  }
}

export default useSignUp