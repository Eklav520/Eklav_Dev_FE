import { Routes, Route, Navigate } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import SpeakingPractice from './components/SpeakingPractice'
import EnglishTalkPractice from './components/EnglishTalkPractice'
import EnglishVoicePractice from './components/EnglishVoicePractice'

const EnglishPractice = () => {
  return (
    <>
      <PageMetaData title="English Practice" />
     {/*  <SpeakingPractice/> */}
     {/* <EnglishTalkPractice/> */}
    <EnglishVoicePractice/>
    {/* <SpeakingPractice/> */}
    </>
  )
}

export default EnglishPractice
