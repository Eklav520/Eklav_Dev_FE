import PageMetaData from '@/components/PageMetaData'
import ProblemList from './components/ProblemList'
import AdminCreateProblem from './components/AdminCreateProblem'
import ProblemDetail from './components/ProblemDetail'

const PaymentInfoPage = () => {
  return (
    <>
      <PageMetaData title="Payment Info" />
      <ProblemList />
      <AdminCreateProblem />
      <ProblemDetail />
    </>
  )
}

export default PaymentInfoPage
