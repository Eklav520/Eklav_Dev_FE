import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminResults from './components/AdminResults'
import { useAuthContext } from '@/context/useAuthContext'
import { FaChartBar, FaInfoCircle, FaSpinner } from 'react-icons/fa'

const roundColors: Record<string, { bg: string; color: string; border: string }> = {
  mcq:     { bg: 'rgba(255,122,0,0.15)',   color: '#ff7a00', border: 'rgba(255,122,0,0.3)' },
  coding:  { bg: 'rgba(40,167,69,0.15)',   color: '#28a745', border: 'rgba(40,167,69,0.3)' },
  tr:      { bg: 'rgba(23,162,184,0.15)',  color: '#17a2b8', border: 'rgba(23,162,184,0.3)' },
  hr:      { bg: 'rgba(253,126,20,0.15)',  color: '#fd7e14', border: 'rgba(253,126,20,0.3)' },
  english: { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
}
const roundLabels: Record<string, string> = {
  mcq: 'MCQ Quiz', coding: 'Code Challenge', tr: 'Technical Round', hr: 'HR Round', english: 'English',
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function FinalAssessmentDetails() {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [examList, setExamList] = useState<any[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [viewExamId, setViewExamId] = useState<string | null>(null)
  const [viewRoundType, setViewRoundType] = useState<string | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoadingExams(true)
    fetch(`${baseURL}/api/assessment/admin/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setExamList(d.exams || []))
      .catch(() => {})
      .finally(() => setLoadingExams(false))
  }, [token, baseURL])

  const selectedExam = examList.find(e => e._id === viewExamId)

  return (
    <>
      <PageMetaData title="Admin - Assessment Results" />

      <div style={{ background: '#000', minHeight: '100vh', padding: '1.5rem' }}>

        {/* Existing Exams Table */}
        <div style={{
          background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 16,
          overflow: 'hidden', marginBottom: '2rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#0a0a0a,#000)',
            borderBottom: '1px solid #ff6b35', padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h5 style={{ color: '#ff6b35', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
                Existing Exams
              </h5>
              <p style={{ color: '#8a8a8a', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                Click "View Results" to see student submissions for each exam
              </p>
            </div>
            <span style={{
              background: 'rgba(255,107,53,0.15)', color: '#ff6b35',
              border: '1px solid rgba(255,107,53,0.3)', borderRadius: 20,
              padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700,
            }}>
              {examList.length} exam{examList.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingExams ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8a8a8a' }}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
              Loading exams...
            </div>
          ) : examList.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2rem', color: '#555' }}>
              <FaInfoCircle />
              <span>No exams created yet</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#111', borderBottom: '1px solid #2c2c2c' }}>
                    <th style={{ padding: '0.85rem 1rem', color: '#ff6b35', fontWeight: 600, textAlign: 'left', width: 40 }}>#</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#ff6b35', fontWeight: 600, textAlign: 'left' }}>Exam Title</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#ff6b35', fontWeight: 600, textAlign: 'left' }}>Target Batch</th>
                    <th style={{ padding: '0.85rem 1rem', color: '#ff6b35', fontWeight: 600, textAlign: 'left' }}>Scheduled Rounds &amp; Results</th>
                  </tr>
                </thead>
                <tbody>
                  {examList.map((exam, idx) => (
                    <tr key={exam._id} style={{ borderBottom: '1px solid #1a1a1a' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#111')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', color: '#555', verticalAlign: 'top', paddingTop: '1.1rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', paddingTop: '1.1rem' }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{exam.title}</span>
                        {exam.description && (
                          <div style={{ color: '#777', fontSize: '0.75rem', marginTop: 3 }}>
                            {exam.description.length > 70 ? exam.description.slice(0, 70) + '…' : exam.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top', paddingTop: '1.1rem' }}>
                        {((exam.branch?.length > 0) || (exam.joiningYear?.length > 0)) ? (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {(exam.branch || []).map((b: string) => (
                              <span key={b} style={{ background: 'rgba(255,122,0,0.12)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{b}</span>
                            ))}
                            {(exam.joiningYear || []).map((y: string) => (
                              <span key={y} style={{ background: 'rgba(253,126,20,0.12)', color: '#fd7e14', border: '1px solid rgba(253,126,20,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{y}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#555', fontSize: '0.75rem' }}>All Batches</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {exam.rounds?.map((r: any) => {
                            const c = roundColors[r.roundType] || roundColors.mcq
                            const label = roundLabels[r.roundType] || r.roundType
                            return (
                              <div key={r.roundType} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e',
                                borderRadius: 8, padding: '0.45rem 0.75rem', gap: 12,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                  <span style={{
                                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                                    borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
                                    whiteSpace: 'nowrap', flexShrink: 0,
                                  }}>
                                    {label}
                                  </span>
                                  {r.startDateTime && (
                                    <span style={{ color: '#666', fontSize: '0.73rem', whiteSpace: 'nowrap' }}>
                                      {fmtDate(r.startDateTime)}
                                      <span style={{ color: '#444', margin: '0 5px' }}>→</span>
                                      {fmtDate(r.endDateTime)}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => { setViewExamId(exam._id); setViewRoundType(r.roundType); setShowResultsModal(true) }}
                                  style={{
                                    background: c.bg, border: `1px solid ${c.border}`,
                                    color: c.color, padding: '0.3rem 0.85rem', borderRadius: 6,
                                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    whiteSpace: 'nowrap', flexShrink: 0,
                                  }}
                                >
                                  <FaChartBar style={{ fontSize: '0.6rem' }} /> View Results
                                </button>
                              </div>
                            )
                          })}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                            <button
                              onClick={() => { setViewExamId(exam._id); setViewRoundType(null); setShowResultsModal(true) }}
                              style={{
                                background: 'transparent', border: 'none',
                                color: '#555', padding: '0.2rem 0.5rem', borderRadius: 4,
                                fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                textDecoration: 'underline', textUnderlineOffset: 3,
                              }}
                            >
                              <FaChartBar style={{ fontSize: '0.6rem' }} /> View All Rounds
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Modal */}
        <Modal
          show={showResultsModal}
          onHide={() => { setShowResultsModal(false); setViewExamId(null); setViewRoundType(null) }}
          fullscreen
          className="exam-results-fullmodal"
        >
          <Modal.Header
            closeButton
            style={{ background: '#0a0a0a', borderBottom: '1px solid #ff6b35', padding: '1rem 1.5rem' }}
          >
            <Modal.Title style={{ color: '#ff6b35', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
              <FaChartBar />
              {selectedExam?.title || 'Exam'} —{' '}
              {viewRoundType
                ? (roundLabels[viewRoundType] || viewRoundType.toUpperCase()) + ' Results'
                : 'All Round Results'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: '#0a0a0a', padding: 0, overflow: 'auto' }}>
            {showResultsModal && viewExamId && (
              <AdminResults
                defaultExamId={viewExamId}
                hideHeader
                hideExamSelector
                filterRoundType={viewRoundType || ''}
              />
            )}
          </Modal.Body>
        </Modal>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .exam-results-fullmodal .modal-content { background: #0a0a0a; border: none; }
          .exam-results-fullmodal .btn-close { filter: invert(1); }
        `}</style>
      </div>
    </>
  )
}
