import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import CryptoJS from 'crypto-js'
import { useNotificationContext } from '@/context/useNotificationContext'

const SECRET_KEY = 'EKLAV@2025'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm Password is required'),
  fullname: yup.string().required('Full name is required'),
  phoneNo: yup.string().required('Phone number is required'),
  terms: yup.boolean().oneOf([true], 'Accept terms'),
  joiningYear: yup
    .number()
    .transform((value, originalValue) => {
      // Convert empty string to undefined so validation can catch it
      return originalValue === '' ? undefined : value
    })
    .required('Joining year is required')
    .typeError('Joining year is required'),
  batch: yup.string().required('Batch is required'),
  college: yup.string().required('College is required'),
})

type SignFormFields = yup.InferType<typeof schema>

const useSignUp = () => {
  const [loading, setLoading] = useState(false)
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
    formState: { errors },
  } = useForm<SignFormFields>({ resolver: yupResolver(schema) })

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/')
  }

  const signUp = handleSubmit(async (values) => {
    try {
      setLoading(true)

      const encryptedPassword = CryptoJS.AES.encrypt(
        values.password || '',
        SECRET_KEY
      ).toString()

      const encryptedConfirmPassword = CryptoJS.AES.encrypt(
        values.confirmPassword || '',
        SECRET_KEY
      ).toString()

      const payload = {
        ...values,
        password: encryptedPassword,
        confirmPassword: encryptedConfirmPassword,
      }

      console.log('🟢 Sending encrypted payload:', payload)

      const response = await fetch(`${baseURL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) throw new Error('Signup failed')

      const result = await response.json()
      console.log('✅ Signup success:', result)

      showNotification({ message: 'Successfully Signed Up!', variant: 'success' })
      redirectUser()
    } catch (e: any) {
      console.error('❌ Signup error:', e)
      showNotification({
        message: e?.message || 'Signup failed',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  })

  return { loading, signUp, control, register, watch, setValue, clearErrors, errors }
}

export default useSignUp