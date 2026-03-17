import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import InterviewQuestions from './components/InterviewQuestions'

const SelfInterview = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-4">
        <InterviewQuestions/>
      </Card>
    </>
  )
}

export default SelfInterview
