import { useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import AssessmentConfig from './components/AssessmentConfig'
import { FaClipboardCheck, FaCheckCircle } from 'react-icons/fa'
import { AdminPage, PageHeader } from '@/components/admin-ui'

export default function FinalAssessmentPage() {
  const [examId, setExamId] = useState<string>("")
  const [examTitle, setExamTitle] = useState<string>("")

  const handleExamIdChange = (id: string) => {
    setExamId(id)
  }

  const handleConfigSave = (exam: any) => {
    setExamTitle(exam.title || "")
  }

  return (
    <AdminPage>
      <PageMetaData title="Admin - Assessments" />

      <PageHeader
        icon={FaClipboardCheck}
        title={examId ? <>Exam: <span style={{ color: '#ff9a3c' }}>{examTitle || 'Selected exam'}</span></> : 'Assessment Configuration'}
        subtitle={examId
          ? 'Edit the details below, then use each round’s Upload Questions button to add content'
          : 'Create a new exam or select an existing one to edit'}
        actions={examId ? <span className="aui-badge aui-badge-green"><FaCheckCircle /> Saved</span> : undefined}
      />

      <AssessmentConfig examId={examId} setExamId={handleExamIdChange} onSave={handleConfigSave} />
    </AdminPage>
  )
}
