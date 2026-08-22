import React from 'react'
import { useParams } from 'react-router-dom'
import StudentCompanyInterviewPage from './components/StudentCompanyInterviewPage'
import CompanyGridPage from './components/CompanyGridPage'

const CompanyRoundsPage = () => {
  const { id } = useParams<{ id: string }>()
  return id ? <StudentCompanyInterviewPage companyFilter={id} /> : <CompanyGridPage />
}

export default CompanyRoundsPage
