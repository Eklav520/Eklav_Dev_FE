import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import InterviewModalLayout from './components/InterviewModalLayout'

const SelfInterview = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      {/* <Card className="bg-transparent border rounded-4 mb-4">
      <InterviewDetails /> 
       
      </Card> */}
      <InterviewModalLayout />
    </>
  )
}

export default SelfInterview
