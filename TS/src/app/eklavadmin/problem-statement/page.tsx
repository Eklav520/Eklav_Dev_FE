import { useState } from 'react'
import { FaCode, FaFileExcel, FaRobot } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { AdminPage, PageHeader, Tabs } from '@/components/admin-ui'
import { UPLOAD_CSS } from '../aptitudeQuestionsUpload/components/UploadParts'
import AdminProblemsUpload from './components/AdminProblemsUpload'
import AdminSolutionRunner from './components/AdminSolutionRunner'

type ViewMode = 'upload' | 'solutions'

const ProblemStatement = () => {
  const [view, setView] = useState<ViewMode>('upload')

  return (
    <AdminPage>
      <PageMetaData title="Coding Problems" />

      <PageHeader
        icon={FaCode}
        title="Coding Problems"
        subtitle="Upload problem statements and verify them with AI-generated solutions"
        actions={
          <Tabs<ViewMode>
            value={view}
            onChange={setView}
            items={[
              { value: 'upload', label: 'Upload Problems', icon: FaFileExcel },
              { value: 'solutions', label: 'AI Solutions & Tests', icon: FaRobot },
            ]}
          />
        }
      />

      {view === 'upload' ? <AdminProblemsUpload /> : <AdminSolutionRunner />}

      <style>{UPLOAD_CSS}</style>
    </AdminPage>
  )
}

export default ProblemStatement
