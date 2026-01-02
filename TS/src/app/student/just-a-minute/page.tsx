import { Routes, Route, Navigate } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import SpeakingPractice from './components/SpeakingPractice'

const EnglishPractice = () => {
  return (
    <>
      <PageMetaData title="English Practice" />
     <SpeakingPractice/>
    </>
  )
}

export default EnglishPractice
