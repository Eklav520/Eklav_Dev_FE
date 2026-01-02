import PageMetaData from '@/components/PageMetaData'
import DailyChallenge from './components/DailyChallenge'
import MySubmissions from './components/MySubmissions'
import CodingChallenge from './components/CodingChallenge'


const ProblemStatement = () => {
  return (
    <>
      <PageMetaData title="Problem Statement" />
     <CodingChallenge/>
     {/*  <DailyChallenge/> */}
    </>
  )
}

export default ProblemStatement
