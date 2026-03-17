import PageMetaData from '@/components/PageMetaData'
import Inner from './components/Inner'
import UploadAptitudeQuestion from './components/UploadAptitudeQuestion'

const QuizPage = () => {
  return (
    <>
      <PageMetaData title="Quiz" />
      <Inner />
      <UploadAptitudeQuestion/>
     {/*  <Student /> */}
    </>
  )
}

export default QuizPage
