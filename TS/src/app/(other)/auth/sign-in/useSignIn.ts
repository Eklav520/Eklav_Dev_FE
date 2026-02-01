import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import CryptoJS from 'crypto-js'   // ✅ Added

import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'

const SECRET_KEY = 'EKLAV@2025' // ✅ Same key must be in backend

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { saveSession } = useAuthContext()
  const [searchParams] = useSearchParams()
  const { showNotification } = useNotificationContext()

  const loginFormSchema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
  })

  type LoginFormFields = yup.InferType<typeof loginFormSchema>

  const redirectUser = (role: string) => {
    const redirectLink = searchParams.get('redirectTo')

    if (redirectLink) {
      navigate(redirectLink, { replace: true })
      return
    }

    const normalizedRole = role?.toLowerCase()

    if (normalizedRole === 'admin' || normalizedRole === 'collegeadmin') {
      navigate('/instructor/dashboard', { replace: true })
    } else {
      navigate('/student/dashboard', { replace: true })
    }
  }


  const login = handleSubmit(async (values: LoginFormFields) => {
    try {
      setLoading(true)

      const encryptedPassword = CryptoJS.AES.encrypt(values.password, SECRET_KEY).toString()

      const payload = {
        email: values.email,
        password: encryptedPassword,
      }

      const response = await fetch(`${baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.message || 'Login failed')
      }

      if (result.token) {
        saveSession({
          ...(result.user ?? {}),
          token: result.token,
        })

        showNotification({
          message: 'Successfully logged in. Redirecting...',
          variant: 'success',
        })

        redirectUser(result.user?.role || 'student')
      } else {
        throw new Error('Invalid login response')
      }
    } catch (e: any) {
      showNotification({
        message: e?.message || 'Something went wrong during login.',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  })


  return { loading, login, control }
}

export default useSignIn
