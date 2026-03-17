import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import SelfInterviewEvaluationDetails from './components/selfInterviewEvaluationDetails'



const SelfInterviewEvaluation = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-4">
        <SelfInterviewEvaluationDetails/>
      </Card>
    </>
  )
}

export default SelfInterviewEvaluation
