import { Routes, Route, Navigate } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import SubscriptionPage from './components/SubscriptionPage'


const EnglishPractice = () => {
  return (
    <>
      <PageMetaData title="SubscriptionPage" />
    <SubscriptionPage/>
    </>
  )
}

export default EnglishPractice
