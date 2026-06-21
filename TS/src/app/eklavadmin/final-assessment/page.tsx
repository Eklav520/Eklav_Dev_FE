import { useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import AssessmentConfig from './components/AssessmentConfig'
import { FaCog, FaEdit } from 'react-icons/fa'

export default function FinalAssessmentPage() {
  const [examId, setExamId] = useState<string>("")
  const [examTitle, setExamTitle] = useState<string>("")

  const handleConfigSave = (exam: any) => {
    setExamTitle(exam.title || "")
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '1.5rem' }}>
      <PageMetaData title="Admin - Assessments" />

      <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaCog style={{ color: '#ff6b35', fontSize: '1.1rem' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                {examId ? (
                  <>
                    <span style={{ color: '#ff6b35' }}>Exam:</span>{' '}
                    <span>{examTitle || examId}</span>
                  </>
                ) : 'Assessment Configuration'}
              </div>
              <div style={{ color: '#555', fontSize: '0.75rem' }}>
                {examId ? 'Use "Upload Questions" on each round card to add content' : 'Create a new exam or select an existing one'}
              </div>
            </div>
          </div>
          {examId && (
            <span style={{ background: 'rgba(40,167,69,0.15)', color: '#28a745', fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>

        <AssessmentConfig examId={examId} setExamId={setExamId} onSave={handleConfigSave} />
      </div>
    </div>
  )
}
