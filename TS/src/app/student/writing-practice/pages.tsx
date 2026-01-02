import { Routes, Route, Navigate } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import WritingPractice from './components/WritingPractice'

const EnglishPractice = () => {
  return (
    <>
      <PageMetaData title="English Practice" />
      <WritingPractice />
    </>
  )
}

export default EnglishPractice
