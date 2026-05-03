import React, { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminStudents from './components/AdminStudents'
import AdminResults from './components/AdminResults'


export default function FinalAssessmentDetails() {
  const [view, setView] = useState('quiz') // 'quiz' | 'code' | 'tr' | 'hr'

  return (
    <>
      <PageMetaData title="Admin - Assessments" />
      <AdminResults/>
    </>
  )
}
