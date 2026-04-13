import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AtsChecker from './components/ATSChecker'

const AtsCheckerPage = () => {
  return (
    <>
      <PageMetaData title="ATS Checker" />
      <Card className="bg-transparent border rounded-4">
         <AtsChecker/>
      </Card>
    </>
  )
}

export default AtsCheckerPage
