import React, { useState } from 'react'
import StudentCompanyList from './components/StudentCompanyList'
import StudentInterviewRounds from './components/StudentInterviewRounds'
import { useAuthContext } from '@/context/useAuthContext'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  userId: string
  role?: string
  email?: string
  exp?: number
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  let studentId: string | null = null
  try {
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token)
      studentId = decoded.userId
    }
  } catch (error) {
    console.error('❌ Invalid token:', error)
  }

  if (!studentId) {
    return <p className="text-danger">❌ Invalid or expired session. Please login again.</p>
  }

  return (
    <div className="container-fluid px-4 ">
      {!selectedCompany ? (
        <StudentCompanyList onSelectCompany={setSelectedCompany} />
      ) : (
        <StudentInterviewRounds company={selectedCompany} studentId={studentId} />
      )}
    </div>
  )
}

export default StudentDashboard
