import { FaUserTie } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { AdminPage, PageHeader } from '@/components/admin-ui'
import { UPLOAD_CSS } from '../aptitudeQuestionsUpload/components/UploadParts'
import InterviewQuestions from './components/InterviewQuestions'

const SelfInterview = () => {
  return (
    <AdminPage>
      <PageMetaData title="Self Interview" />
      <PageHeader icon={FaUserTie} title="Self Interview" subtitle="Manage the questions students practise in self interviews" />
      <InterviewQuestions />
      <style>{UPLOAD_CSS}</style>
    </AdminPage>
  )
}

export default SelfInterview
