import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaCode,
  FaFileAlt,
  FaFileContract,
  FaStar,
  FaUsers,
  FaChevronRight,
} from 'react-icons/fa'

type Attachment = {
  fileName?: string
  fileUrl?: string
}

type AiCriterion = {
  criterion: string
  met: boolean
  score: number
  maxScore: number
  feedback: string
}

type AiAnnotation = {
  issue: string
  severity: 'critical' | 'major' | 'minor'
  location: string
  suggestion: string
}

type AiFacultyReport = {
  technicalDepth: string
  effortEstimate: string
  overallAssessment: string
  keyFindings: string[]
  recommendations: string[]
}

type AiEvaluation = {
  score: number | null
  grade: string | null
  summary: string
  relevanceCheck?: { isRelevant: boolean; relevanceScore: number; reason: string }
  criteriaEvaluation: AiCriterion[]
  codeAnnotations?: AiAnnotation[]
  facultyReport?: AiFacultyReport
  strengths: string[]
  improvements: string[]
  evaluatedAt?: string
  verifiedByAdmin?: boolean
  adminFinalScore?: number | null
}

type SubmissionState = {
  _id?: string
  codeLink?: string
  codeDescription?: string
  attachments?: Attachment[]
  status?: 'pending' | 'completed'
  adminReviewStatus?: 'pending' | 'approved' | 'rejected'
  adminFeedback?: string
  aiEvaluation?: AiEvaluation | null
}

type EnrolledStudent = {
  studentId: string
  name: string
  email: string
}

type FreelancingTask = {
  _id: string
  title: string
  description?: string
  highlights?: string
  acceptanceCriteria?: string
  terms?: string
  amount?: number
  startDate?: string
  deadline?: string
  maxStudents?: number
  spotsLeft?: number
  enrolledStudentsDetails?: EnrolledStudent[]
  mySubmission?: SubmissionState
}

type Props = {
  show: boolean
  onHide: () => void
  task: FreelancingTask | null
  token?: string
  baseURL: string
  onSubmitted: () => Promise<void> | void
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [false, 2, 3, 4] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'clean']
  ],
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getDaysLeft = (d?: string | null) => {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  if (diff < 0) return { label: 'Overdue', urgent: true }
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return { label: 'Due today', urgent: true }
  return { label: `${days}d left`, urgent: days <= 3 }
}

const StudentTaskSubmissionWizard = ({ show, onHide, task, token, baseURL, onSubmitted }: Props) => {
  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [codeLink, setCodeLink] = useState('')
  const [codeDescription, setCodeDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [replaceAttachments, setReplaceAttachments] = useState(false)
  const [lockedByRecentSubmit, setLockedByRecentSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submission = task?.mySubmission
  const isReviewPending =
    submission?.status === 'completed' && (!submission?.adminReviewStatus || submission.adminReviewStatus === 'pending')
  const isEditableStatus =
    !submission ||
    submission.status !== 'completed' ||
    submission.adminReviewStatus === 'rejected'
  const isSubmissionLocked = isReviewPending || lockedByRecentSubmit
  const canEditSubmission = isEditableStatus && !isSubmissionLocked

  useEffect(() => {
    if (show) {
      setActiveStep(1)
      setSuccess('')
      setError('')
      setLockedByRecentSubmit(false)
    }
  }, [show, task?._id])

  useEffect(() => {
    if (!submission) { setLockedByRecentSubmit(false); return }
    if (submission.adminReviewStatus === 'rejected') { setLockedByRecentSubmit(false); return }
    if (submission.status === 'completed') setLockedByRecentSubmit(true)
  }, [submission?.status, submission?.adminReviewStatus])

  const reviewStatus = submission?.adminReviewStatus || 'pending'
  const submissionStatus = submission?.status || 'pending'

  const statusConfig = useMemo(() => {
    if (!submission || submissionStatus !== 'completed') {
      return { label: 'To Do', color: '#6b778c', bg: 'rgba(107,119,140,0.15)', border: 'rgba(107,119,140,0.3)' }
    }
    if (reviewStatus === 'approved') {
      return { label: 'Approved', color: '#36b37e', bg: 'rgba(54,179,126,0.12)', border: 'rgba(54,179,126,0.35)' }
    }
    if (reviewStatus === 'rejected') {
      return { label: 'Revision Needed', color: '#de350b', bg: 'rgba(222,53,11,0.12)', border: 'rgba(222,53,11,0.35)' }
    }
    return { label: 'In Review', color: '#0052cc', bg: 'rgba(0,82,204,0.12)', border: 'rgba(0,82,204,0.35)' }
  }, [submission, submissionStatus, reviewStatus])

  const handleSubmitStep2 = async () => {
    if (!task?._id || !token) return
    if (!canEditSubmission) { setError('Submission is locked while waiting for admin review.'); return }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const payload = new FormData()
      payload.append('codeLink', codeLink || submission?.codeLink || '')
      payload.append('codeDescription', codeDescription || submission?.codeDescription || '')
      payload.append('replaceAttachments', String(replaceAttachments))
      files.forEach((f) => payload.append('attachments', f))
      const res = await fetch(`${baseURL}/api/student/freelancing/tasks/${task._id}/submission`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to upload submission')
      setSuccess('Submitted successfully! Your work is now with admin for review.')
      setLockedByRecentSubmit(true)
      setActiveStep(2)
      await onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    if (selected.length === 0) return
    setFiles((prev) => {
      const merged = [...prev]
      selected.forEach((file) => {
        const exists = merged.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
        if (!exists) merged.push(file)
      })
      return merged
    })
    e.target.value = ''
  }

  const handleRemoveSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const daysLeft = getDaysLeft(task?.deadline)

  return (
    <Modal show={show} onHide={onHide} fullscreen={true} centered className="student-task-wizard">
      {/* ── Header ── */}
      <Modal.Header closeButton>
        <div className="wz-header-inner">
          {/* Breadcrumb */}
          <div className="wz-breadcrumb">
            <span>Freelancing</span>
            <FaChevronRight className="wz-breadcrumb-sep" />
            <span>My Tasks</span>
            <FaChevronRight className="wz-breadcrumb-sep" />
            <span className="wz-breadcrumb-current">{task?.title || 'Task'}</span>
          </div>

          {/* Step indicator */}
          <div className="wz-stepper">
            <div className={`wz-step-item ${activeStep === 1 ? 'active' : 'done'}`}>
              <div className="wz-step-circle">
                {activeStep > 1 ? '✓' : '1'}
              </div>
              <span className="wz-step-label">Task Details</span>
            </div>
            <div className="wz-step-line" />
            <div className={`wz-step-item ${activeStep === 2 ? 'active' : ''}`}>
              <div className="wz-step-circle">2</div>
              <span className="wz-step-label">Submit & Review</span>
            </div>
          </div>
        </div>
      </Modal.Header>

      {/* ── Body ── */}
      <Modal.Body className="wz-body">
        {!task ? (
          <div style={{ padding: '2rem' }}>
            <Alert variant="warning">Task not found.</Alert>
          </div>
        ) : (
          <>
            {/* Alerts */}
            {(error || success) && (
              <div className="wz-alerts">
                {error && (
                  <div className="wz-alert wz-alert-error">
                    <span>✕</span> {error}
                  </div>
                )}
                {success && (
                  <div className="wz-alert wz-alert-success">
                    <span>✓</span> {success}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Task Details ── */}
            {activeStep === 1 && (
              <div className="wz-step1">
                {/* Left sidebar */}
                <aside className="wz-sidebar">
                  {/* Status */}
                  <div
                    className="wz-status-chip"
                    style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, color: statusConfig.color }}
                  >
                    <span className="wz-status-dot" style={{ background: statusConfig.color }} />
                    {statusConfig.label}
                  </div>

                  {/* Task title */}
                  <h2 className="wz-sidebar-title">{task.title}</h2>

                  {/* Metadata */}
                  <div className="wz-meta-section">
                    <div className="wz-meta-label">TASK INFO</div>
                    <div className="wz-meta-rows">
                      {task.amount ? (
                        <div className="wz-meta-row">
                          <span className="wz-meta-key">Budget</span>
                          <span className="wz-meta-val wz-orange">₹{task.amount.toLocaleString()}</span>
                        </div>
                      ) : null}
                      {task.startDate && (
                        <div className="wz-meta-row">
                          <span className="wz-meta-key">
                            <FaCalendarAlt className="wz-meta-icon" /> Start
                          </span>
                          <span className="wz-meta-val">{formatDate(task.startDate)}</span>
                        </div>
                      )}
                      {task.deadline && (
                        <div className="wz-meta-row">
                          <span className="wz-meta-key">
                            <FaCalendarAlt className="wz-meta-icon" /> Deadline
                          </span>
                          <span className="wz-meta-val">
                            {formatDate(task.deadline)}
                            {daysLeft && (
                              <span
                                className="wz-days-left"
                                style={{ color: daysLeft.urgent ? '#de350b' : '#888' }}
                              >
                                {daysLeft.label}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {typeof task.spotsLeft !== 'undefined' && (
                        <div className="wz-meta-row">
                          <span className="wz-meta-key">
                            <FaUsers className="wz-meta-icon" /> Spots Left
                          </span>
                          <span className="wz-meta-val">{task.spotsLeft}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enrolled students */}
                  {(task.enrolledStudentsDetails?.length ?? 0) > 0 && (
                    <div className="wz-meta-section">
                      <div className="wz-meta-label">
                        ENROLLED TEAM&nbsp;
                        <span className="wz-meta-count">{task.enrolledStudentsDetails!.length}</span>
                      </div>
                      <div className="wz-students">
                        {task.enrolledStudentsDetails!.map((s) => (
                          <div key={s.studentId} className="wz-student-row">
                            <div className="wz-student-avatar">
                              {(s.name || 'S')[0].toUpperCase()}
                            </div>
                            <div className="wz-student-info">
                              <span className="wz-student-name">{s.name || 'Student'}</span>
                              <span className="wz-student-email">{s.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Score card — shown when evaluation exists */}
                  {submission?.aiEvaluation && submission.aiEvaluation.score !== null && (
                    <div className="wz-score-card">
                      <div className="wz-score-card-header">
                        <span className="wz-score-card-label">✦ AI Score</span>
                        {submission.aiEvaluation.verifiedByAdmin && (
                          <span className="wz-score-card-verified">✓ Verified</span>
                        )}
                      </div>

                      {/* Ring + value */}
                      <div className="wz-score-card-body">
                        {(() => {
                          const displayScore = submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score ?? 0
                          const color = displayScore >= 75 ? '#36b37e' : displayScore >= 50 ? '#ff9a5c' : '#de350b'
                          return (
                            <>
                              <div style={{
                                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                                background: `conic-gradient(${color} ${displayScore * 3.6}deg, #1e1e1e 0deg)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <div style={{
                                  width: 50, height: 50, borderRadius: '50%', background: '#0d0d0d',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 800, color, lineHeight: 1 }}>{displayScore}</span>
                                  <span style={{ fontSize: '0.55rem', color: '#555', lineHeight: 1 }}>/100</span>
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{displayScore}/100</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#7c3aed22', color: '#a78bfa', border: '1px solid #7c3aed44', borderRadius: '4px', padding: '0.05rem 0.45rem' }}>
                                    {submission.aiEvaluation.grade}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#555' }}>
                                  {submission.aiEvaluation.adminFinalScore != null ? 'Admin Adjusted' : 'AI Evaluated'}
                                </div>
                                {/* Relevance indicator */}
                                {submission.aiEvaluation.relevanceCheck && (
                                  <div style={{ fontSize: '0.63rem', marginTop: '0.3rem', color: submission.aiEvaluation.relevanceCheck.isRelevant ? '#36b37e' : '#de350b' }}>
                                    {submission.aiEvaluation.relevanceCheck.isRelevant ? '✓ Relevant' : '⚠ Relevance issue'}
                                  </div>
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Mini summary */}
                      {submission.aiEvaluation.summary && (
                        <div style={{ fontSize: '0.68rem', color: '#888', lineHeight: 1.5, marginTop: '0.55rem', borderTop: '1px solid #1a1a1a', paddingTop: '0.5rem' }}>
                          {submission.aiEvaluation.summary.length > 120
                            ? submission.aiEvaluation.summary.slice(0, 120) + '…'
                            : submission.aiEvaluation.summary}
                        </div>
                      )}

                      <button
                        onClick={() => setActiveStep(2)}
                        style={{ width: '100%', marginTop: '0.6rem', background: 'none', border: '1px solid #2a2a2a', color: '#a78bfa', borderRadius: '6px', padding: '0.3rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        View Full Report →
                      </button>
                    </div>
                  )}

                  {/* Quick action */}
                  <button
                    className="wz-goto-submit"
                    onClick={() => setActiveStep(2)}
                  >
                    {submission?.status === 'completed'
                      ? submission?.adminReviewStatus === 'rejected'
                        ? 'Resubmit Work →'
                        : 'View Submission →'
                      : 'Submit Work →'}
                  </button>
                </aside>

                {/* Right content */}
                <main className="wz-main-content">
                  {!task.description && !task.highlights && !task.acceptanceCriteria && !task.terms && (
                    <div className="wz-no-content">No additional task details provided.</div>
                  )}

                  {task.description && (
                    <section className="wz-content-block">
                      <div className="wz-content-heading">
                        <FaFileAlt className="wz-ch-icon" />
                        Description
                      </div>
                      <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.description }} />
                    </section>
                  )}

                  {task.highlights && (
                    <section className="wz-content-block">
                      <div className="wz-content-heading">
                        <FaStar className="wz-ch-icon" />
                        Key Highlights
                      </div>
                      <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.highlights }} />
                    </section>
                  )}

                  {task.acceptanceCriteria && (
                    <section className="wz-content-block">
                      <div className="wz-content-heading">
                        <FaCheckCircle className="wz-ch-icon" />
                        Acceptance Criteria
                      </div>
                      <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.acceptanceCriteria }} />
                    </section>
                  )}

                  {task.terms && (
                    <section className="wz-content-block">
                      <div className="wz-content-heading">
                        <FaFileContract className="wz-ch-icon" />
                        Terms & Conditions
                      </div>
                      <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.terms }} />
                    </section>
                  )}
                </main>
              </div>
            )}

            {/* ── Step 2: Submit & Review ── */}
            {activeStep === 2 && (
              <div className="wz-step2">
                <div className="wz-step2-grid">
                  {/* Left: upload form */}
                  <div className="wz-submit-col">
                    <div className="wz-col-title">
                      <FaCode className="me-2" style={{ color: '#ff6b35' }} />
                      Your Submission
                    </div>

                    {/* Code link */}
                    <div className="wz-field">
                      <label className="wz-label">Repository / Drive Link</label>
                      <input
                        type="url"
                        className="wz-input"
                        value={codeLink}
                        onChange={(e) => setCodeLink(e.target.value)}
                        placeholder={submission?.codeLink || 'https://github.com/your-repo or Google Drive...'}
                        disabled={!canEditSubmission}
                      />
                      <span className="wz-help">GitHub, GitLab, or Google Drive link to your code</span>
                    </div>

                    {/* File upload */}
                    <div className="wz-field">
                      <label className="wz-label">Upload Files</label>
                      <div className="wz-file-drop">
                        <input
                          type="file"
                          multiple
                          onChange={handleAddFiles}
                          className="wz-file-input"
                          accept=".zip,.rar,.7z,.pdf,.doc,.docx,.png,.jpg,.jpeg,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.sql,.json"
                          disabled={!canEditSubmission}
                          id="wz-file-upload"
                        />
                        <label htmlFor="wz-file-upload" className="wz-file-label">
                          <span className="wz-file-icon">↑</span>
                          <span>Choose files or drag & drop</span>
                          <span className="wz-file-hint">ZIP, PDF, images, source files · Max 10MB each</span>
                        </label>
                      </div>
                    </div>

                    {/* Staged files */}
                    {files.length > 0 && (
                      <div className="wz-file-list">
                        <div className="wz-file-list-title">Files to upload ({files.length})</div>
                        {files.map((file, idx) => (
                          <div key={idx} className="wz-file-item">
                            <span className="wz-file-name">📎 {file.name}</span>
                            <span className="wz-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                            <button
                              className="wz-file-remove"
                              onClick={() => handleRemoveSelectedFile(idx)}
                              disabled={!canEditSubmission}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Previous attachments */}
                    {submission?.attachments && submission.attachments.length > 0 && (
                      <div className="wz-prev-files">
                        <div className="wz-prev-files-title">Previously Uploaded</div>
                        {submission.attachments.map((a, i) => (
                          <a key={i} href={a.fileUrl} target="_blank" rel="noreferrer" className="wz-attachment">
                            📄 {a.fileName || `Attachment ${i + 1}`}
                          </a>
                        ))}
                        <label className="wz-replace-check">
                          <input
                            type="checkbox"
                            checked={replaceAttachments}
                            onChange={(e) => setReplaceAttachments(e.target.checked)}
                            disabled={!canEditSubmission}
                            className="wz-checkbox"
                          />
                          Replace existing attachments with new upload
                        </label>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="wz-field">
                      <label className="wz-label">Submission Notes</label>
                      <div className="wz-quill-wrap">
                        <ReactQuill
                          theme="snow"
                          value={codeDescription}
                          onChange={setCodeDescription}
                          placeholder="Describe your implementation, approach, and challenges..."
                          modules={QUILL_MODULES}
                          readOnly={!canEditSubmission}
                        />
                      </div>
                    </div>

                    {/* Submit action */}
                    <div className="wz-submit-action">
                      {canEditSubmission ? (
                        <button
                          className="wz-btn-submit"
                          onClick={handleSubmitStep2}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <><Spinner animation="border" size="sm" className="me-2" />Submitting...</>
                          ) : reviewStatus === 'rejected' ? (
                            'Re-submit for Review'
                          ) : (
                            'Submit for Review'
                          )}
                        </button>
                      ) : (
                        <div className="wz-locked-notice">
                          {isSubmissionLocked
                            ? '⏳ Submission locked — waiting for admin review.'
                            : 'Editing disabled for current status.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: review status */}
                  <div className="wz-review-col">
                    <div className="wz-col-title">Review Status</div>

                    {/* Status card */}
                    <div
                      className="wz-review-card"
                      style={{ borderLeftColor: statusConfig.color }}
                    >
                      <div className="wz-review-status-row">
                        <span
                          className="wz-review-badge"
                          style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}
                        >
                          <span className="wz-status-dot" style={{ background: statusConfig.color }} />
                          {statusConfig.label}
                        </span>
                        <span className="wz-review-sub">
                          {submissionStatus === 'completed' ? 'Work submitted' : 'Not submitted yet'}
                        </span>
                      </div>

                      {!submission || submissionStatus !== 'completed' ? (
                        <div className="wz-review-body">
                          <div className="wz-review-icon">📤</div>
                          <p className="wz-review-msg">Submit your work on the left to start the review process.</p>
                        </div>
                      ) : reviewStatus === 'approved' ? (
                        <div className="wz-review-body">
                          <div className="wz-review-icon">🎉</div>
                          <p className="wz-review-msg" style={{ color: '#36b37e' }}>
                            Congratulations! Your submission has been approved.
                          </p>
                          {submission.adminFeedback && (
                            <div className="wz-feedback-block wz-feedback-approved">
                              <div className="wz-feedback-label">Admin Feedback</div>
                              <p>{submission.adminFeedback}</p>
                            </div>
                          )}
                        </div>
                      ) : reviewStatus === 'rejected' ? (
                        <div className="wz-review-body">
                          <div className="wz-review-icon">📋</div>
                          <p className="wz-review-msg" style={{ color: '#de350b' }}>
                            Your submission needs revision. Please review the feedback below.
                          </p>
                          {submission.adminFeedback && (
                            <div className="wz-feedback-block wz-feedback-revision">
                              <div className="wz-feedback-label">Admin Feedback</div>
                              <p>{submission.adminFeedback}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="wz-review-body">
                          <div className="wz-review-icon">⏳</div>
                          <p className="wz-review-msg">
                            Your submission is under review. The admin will provide feedback soon.
                          </p>
                          {submission.adminFeedback && (
                            <div className="wz-feedback-block">
                              <div className="wz-feedback-label">Admin Note</div>
                              <p>{submission.adminFeedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Last submission details */}
                    {submission?.codeLink && (
                      <div className="wz-last-sub">
                        <div className="wz-last-sub-title">Your Last Submission</div>
                        <div className="wz-last-sub-row">
                          <span className="wz-last-sub-key">Code Link</span>
                          <a href={submission.codeLink} target="_blank" rel="noreferrer" className="wz-last-sub-link">
                            {submission.codeLink}
                          </a>
                        </div>
                        {submission.codeDescription && (
                          <div className="wz-last-sub-row">
                            <span className="wz-last-sub-key">Submission Notes</span>
                            <div
                              className="wz-rich wz-rich-sm"
                              dangerouslySetInnerHTML={{ __html: submission.codeDescription }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Evaluation Results */}
                    {submission?.aiEvaluation && submission.aiEvaluation.score !== null && (
                      <div className="wz-ai-eval">
                        {/* Header */}
                        <div className="wz-ai-eval-header">
                          <span className="wz-ai-eval-title">✦ AI Evaluation Report</span>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {submission.aiEvaluation.evaluatedAt && (
                              <span style={{ fontSize: '0.62rem', color: '#555' }}>
                                {new Date(submission.aiEvaluation.evaluatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {submission.aiEvaluation.verifiedByAdmin && (
                              <span className="wz-ai-verified">✓ Admin Verified</span>
                            )}
                            {/* PDF export */}
                            <button
                              onClick={() => {
                                const ai = submission.aiEvaluation!
                                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI Evaluation Report</title><style>
                                  body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;line-height:1.6}
                                  h1{color:#7c3aed;font-size:22px;border-bottom:2px solid #7c3aed;padding-bottom:8px}
                                  h2{color:#444;font-size:15px;margin-top:22px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px}
                                  .score-box{background:#f4f4ff;border:2px solid #7c3aed;border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:20px;margin:16px 0}
                                  .score-num{font-size:48px;font-weight:900;color:#7c3aed;line-height:1}
                                  .grade{background:#7c3aed;color:#fff;font-size:18px;font-weight:700;padding:4px 14px;border-radius:6px}
                                  .relevance{padding:10px 14px;border-radius:8px;margin:10px 0;font-size:13px}
                                  .ok{background:#e8faf2;border-left:4px solid #36b37e;color:#1a6b44}
                                  .warn{background:#fff5f5;border-left:4px solid #de350b;color:#a00}
                                  .criterion{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;border-radius:6px;margin-bottom:6px;border:1px solid #eee}
                                  .met{background:#f0faf4;border-left:3px solid #36b37e}
                                  .fail{background:#fff5f5;border-left:3px solid #de350b}
                                  .ann{padding:8px 12px;border-radius:6px;margin-bottom:6px;font-size:13px}
                                  .critical{background:#fff0f0;border-left:3px solid #c00}
                                  .major{background:#fff8f0;border-left:3px solid #e67e22}
                                  .minor{background:#f8f8f8;border-left:3px solid #888}
                                  .tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;margin-right:6px;text-transform:uppercase}
                                  .tag-critical{background:#c00;color:#fff}.tag-major{background:#e67e22;color:#fff}.tag-minor{background:#888;color:#fff}
                                  .col2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
                                  ul{padding-left:20px;margin:6px 0}li{margin-bottom:4px;font-size:13px}
                                  .faculty-box{background:#f9f9ff;border:1px solid #d0c4ff;border-radius:8px;padding:14px 18px;margin:10px 0}
                                  .footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#999}
                                </style></head><body>
                                  <h1>AI Evaluation Report</h1>
                                  <div class="score-box">
                                    <div class="score-num">${ai.adminFinalScore ?? ai.score ?? 0}</div>
                                    <div>
                                      <div style="font-size:13px;color:#555;margin-bottom:4px">out of 100 ${ai.adminFinalScore != null ? '(Admin Adjusted)' : '(AI Score)'}</div>
                                      <span class="grade">${ai.grade ?? '—'}</span>
                                      ${ai.verifiedByAdmin ? '<div style="color:#36b37e;font-weight:700;font-size:13px;margin-top:6px">✓ Verified by Admin</div>' : ''}
                                    </div>
                                  </div>
                                  ${ai.relevanceCheck ? `<div class="relevance ${ai.relevanceCheck.isRelevant ? 'ok' : 'warn'}">
                                    <strong>${ai.relevanceCheck.isRelevant ? '✓ Your submission is relevant to the task' : '⚠ Your submission does not match the task requirements'}</strong><br/>
                                    Relevance Score: ${ai.relevanceCheck.relevanceScore}/100 — ${ai.relevanceCheck.reason}
                                  </div>` : ''}
                                  ${ai.summary ? `<p style="font-style:italic;color:#444;background:#f7f7f7;padding:10px 14px;border-radius:6px;border-left:3px solid #7c3aed">${ai.summary}</p>` : ''}
                                  ${ai.facultyReport?.overallAssessment ? `<h2>Faculty Assessment</h2><div class="faculty-box">
                                    <p>${ai.facultyReport.overallAssessment}</p>
                                    <p><strong>Technical Depth:</strong> ${ai.facultyReport.technicalDepth} &nbsp; <strong>Effort Level:</strong> ${ai.facultyReport.effortEstimate}</p>
                                    ${ai.facultyReport.keyFindings?.length ? `<strong>Key Findings:</strong><ul>${ai.facultyReport.keyFindings.map(f=>`<li>${f}</li>`).join('')}</ul>` : ''}
                                    ${ai.facultyReport.recommendations?.length ? `<strong>Recommendations:</strong><ul>${ai.facultyReport.recommendations.map(r=>`<li>${r}</li>`).join('')}</ul>` : ''}
                                  </div>` : ''}
                                  ${ai.criteriaEvaluation?.length ? `<h2>Criteria Evaluation</h2>${ai.criteriaEvaluation.map(c=>`<div class="criterion ${c.met?'met':'fail'}"><span style="font-size:16px;color:${c.met?'#36b37e':'#de350b'}">${c.met?'✓':'✕'}</span><div style="flex:1"><strong>${c.criterion}</strong><p style="font-size:13px;color:#555;margin:2px 0">${c.feedback}</p></div><span style="font-weight:700;color:${c.met?'#36b37e':'#de350b'}">${c.score}/${c.maxScore}</span></div>`).join('')}` : ''}
                                  ${ai.codeAnnotations?.length ? `<h2>Code Review Annotations</h2>${ai.codeAnnotations.map(a=>`<div class="ann ${a.severity}"><span class="tag tag-${a.severity}">${a.severity}</span><strong>${a.issue}</strong><br/><span style="color:#666;font-size:12px">📍 ${a.location}</span><br/><span style="color:#444;font-size:12px">→ ${a.suggestion}</span></div>`).join('')}` : ''}
                                  <div class="col2">
                                    ${ai.strengths?.length ? `<div><h2 style="color:#36b37e">Strengths</h2><ul>${ai.strengths.map(s=>`<li>${s}</li>`).join('')}</ul></div>` : ''}
                                    ${ai.improvements?.length ? `<div><h2 style="color:#e67e22">Areas to Improve</h2><ul>${ai.improvements.map(s=>`<li>${s}</li>`).join('')}</ul></div>` : ''}
                                  </div>
                                  <div class="footer">Eklav AI Evaluation · ${new Date().toLocaleString('en-IN')}</div>
                                </body></html>`
                                const w = window.open('', '_blank')
                                if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
                              }}
                              style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', borderRadius: '5px', padding: '0.15rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer' }}
                            >
                              📄 PDF
                            </button>
                          </div>
                        </div>

                        {/* Relevance banner */}
                        {submission.aiEvaluation.relevanceCheck && !submission.aiEvaluation.relevanceCheck.isRelevant && (
                          <div style={{ background: '#de350b12', border: '1px solid #de350b44', borderLeft: '3px solid #de350b', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '0.6rem', fontSize: '0.72rem', color: '#ff7070' }}>
                            <strong>⚠ Your submission does not appear to match this task</strong>
                            <div style={{ color: '#cc5555', marginTop: '0.2rem', fontSize: '0.68rem' }}>{submission.aiEvaluation.relevanceCheck.reason}</div>
                          </div>
                        )}
                        {submission.aiEvaluation.relevanceCheck?.isRelevant && (
                          <div style={{ background: '#36b37e0a', border: '1px solid #36b37e33', borderRadius: '6px', padding: '0.3rem 0.65rem', marginBottom: '0.55rem', fontSize: '0.68rem', color: '#36b37e' }}>
                            ✓ Submission is relevant to task · {submission.aiEvaluation.relevanceCheck.relevanceScore}/100
                          </div>
                        )}

                        {/* Score ring */}
                        <div className="wz-ai-score-row">
                          <div
                            className="wz-ai-score-ring"
                            style={{
                              background: `conic-gradient(${
                                (submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score)! >= 75 ? '#36b37e' :
                                (submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score)! >= 50 ? '#ff9a5c' : '#de350b'
                              } ${(submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score)! * 3.6}deg, #1a1a1a 0deg)`,
                            }}
                          >
                            <div className="wz-ai-score-inner">
                              <span className="wz-ai-score-num">
                                {submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="wz-ai-score-label">
                              {submission.aiEvaluation.adminFinalScore != null
                                ? `${submission.aiEvaluation.adminFinalScore}/100`
                                : `${submission.aiEvaluation.score}/100`}
                              <span className="wz-ai-grade">{submission.aiEvaluation.grade}</span>
                            </div>
                            <div className="wz-ai-score-sub">
                              {submission.aiEvaluation.verifiedByAdmin ? 'Admin Verified Score' : 'AI Score'}
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        {submission.aiEvaluation.summary && (
                          <p className="wz-ai-summary">{submission.aiEvaluation.summary}</p>
                        )}

                        {/* Faculty Report */}
                        {submission.aiEvaluation.facultyReport?.overallAssessment && (
                          <div style={{ background: '#0d0a1f', border: '1px solid #2d1f5a', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.65rem' }}>
                            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Faculty Assessment</div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.68rem', color: '#888' }}>Technical Depth: <strong style={{ color: '#a78bfa' }}>{submission.aiEvaluation.facultyReport.technicalDepth}</strong></span>
                              <span style={{ fontSize: '0.68rem', color: '#888' }}>Effort: <strong style={{ color: '#a78bfa' }}>{submission.aiEvaluation.facultyReport.effortEstimate}</strong></span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#bbb', lineHeight: 1.6, marginBottom: '0.5rem' }}>{submission.aiEvaluation.facultyReport.overallAssessment}</div>
                            {submission.aiEvaluation.facultyReport.keyFindings?.length > 0 && (
                              <div style={{ marginBottom: '0.35rem' }}>
                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Key Findings</div>
                                {submission.aiEvaluation.facultyReport.keyFindings.map((f, i) => (
                                  <div key={i} style={{ fontSize: '0.7rem', color: '#999', display: 'flex', gap: '0.3rem', marginBottom: '0.15rem' }}>
                                    <span style={{ color: '#7c3aed', flexShrink: 0 }}>▸</span>{f}
                                  </div>
                                ))}
                              </div>
                            )}
                            {submission.aiEvaluation.facultyReport.recommendations?.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Recommendations</div>
                                {submission.aiEvaluation.facultyReport.recommendations.map((r, i) => (
                                  <div key={i} style={{ fontSize: '0.7rem', color: '#999', display: 'flex', gap: '0.3rem', marginBottom: '0.15rem' }}>
                                    <span style={{ color: '#ff9a5c', flexShrink: 0 }}>→</span>{r}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Criteria */}
                        {submission.aiEvaluation.criteriaEvaluation?.length > 0 && (
                          <div className="wz-ai-criteria">
                            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Criteria Evaluation</div>
                            {submission.aiEvaluation.criteriaEvaluation.map((c, i) => (
                              <div key={i} className="wz-ai-criterion" style={{ borderLeft: `2px solid ${c.met ? '#36b37e' : '#de350b'}` }}>
                                <span className="wz-ai-criterion-icon" style={{ color: c.met ? '#36b37e' : '#de350b' }}>{c.met ? '✓' : '✕'}</span>
                                <div className="wz-ai-criterion-text">
                                  <span className="wz-ai-criterion-name">{c.criterion}</span>
                                  <span className="wz-ai-criterion-fb">{c.feedback}</span>
                                </div>
                                <span className="wz-ai-criterion-score" style={{ color: c.met ? '#36b37e' : '#de350b' }}>{c.score}/{c.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Code Annotations */}
                        {submission.aiEvaluation.codeAnnotations && submission.aiEvaluation.codeAnnotations.length > 0 && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Code Review</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              {submission.aiEvaluation.codeAnnotations.map((a, i) => {
                                const sevColor = a.severity === 'critical' ? '#de350b' : a.severity === 'major' ? '#ff9a5c' : '#888'
                                return (
                                  <div key={i} style={{ background: '#0a0a0a', borderRadius: '5px', padding: '0.45rem 0.6rem', borderLeft: `2px solid ${sevColor}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                                      <span style={{ fontSize: '0.58rem', fontWeight: 700, background: `${sevColor}22`, color: sevColor, borderRadius: '4px', padding: '0.05rem 0.35rem', textTransform: 'uppercase' }}>{a.severity}</span>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ccc' }}>{a.issue}</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: '0.1rem' }}>📍 {a.location}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#888' }}>→ {a.suggestion}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Strengths & Improvements */}
                        {(submission.aiEvaluation.strengths?.length > 0 || submission.aiEvaluation.improvements?.length > 0) && (
                          <div className="wz-ai-sw">
                            {submission.aiEvaluation.strengths?.length > 0 && (
                              <div>
                                <div className="wz-ai-sw-title" style={{ color: '#36b37e' }}>Strengths</div>
                                {submission.aiEvaluation.strengths.map((s, i) => (
                                  <div key={i} className="wz-ai-sw-item"><span style={{ color: '#36b37e' }}>+</span> {s}</div>
                                ))}
                              </div>
                            )}
                            {submission.aiEvaluation.improvements?.length > 0 && (
                              <div>
                                <div className="wz-ai-sw-title" style={{ color: '#ff9a5c' }}>Areas to Improve</div>
                                {submission.aiEvaluation.improvements.map((s, i) => (
                                  <div key={i} className="wz-ai-sw-item"><span style={{ color: '#ff9a5c' }}>→</span> {s}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Awaiting evaluation notice */}
                    {submission && submissionStatus === 'completed' && !submission.aiEvaluation && (
                      <div className="wz-ai-pending">
                        ✦ AI evaluation will appear here once the admin runs the evaluation on your submission.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>

      {/* ── Footer ── */}
      <Modal.Footer className="wz-footer">
        <button className="wz-btn-ghost" onClick={onHide}>Close</button>
        <div className="wz-footer-right">
          {activeStep > 1 && (
            <button className="wz-btn-back" onClick={() => setActiveStep(1)}>
              ← Back
            </button>
          )}
          {activeStep < 2 && (
            <button className="wz-btn-next" onClick={() => setActiveStep(2)}>
              Continue →
            </button>
          )}
        </div>
      </Modal.Footer>

      <style>{`
        /* ── Wizard shell ── */
        .student-task-wizard .modal-content {
          background: #070707;
          border: none;
          border-radius: 0;
          color: #f0f0f0;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .student-task-wizard .modal-header {
          background: #0a0a0a;
          border-bottom: 1px solid #1a1a1a;
          padding: 1rem 1.5rem;
          align-items: flex-start;
          flex-shrink: 0;
        }

        .student-task-wizard .modal-header .btn-close {
          filter: invert(1) brightness(0.55);
          margin-top: 0.25rem;
        }

        .wz-header-inner {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          flex: 1;
          min-width: 0;
        }

        /* Breadcrumb */
        .wz-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.74rem;
          color: #555;
        }

        .wz-breadcrumb-sep {
          font-size: 0.6rem;
          color: #444;
        }

        .wz-breadcrumb-current {
          color: #ccc;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        /* Step indicator */
        .wz-stepper {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .wz-step-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .wz-step-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #666;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .wz-step-item.active .wz-step-circle {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #fff;
          box-shadow: 0 0 12px rgba(255,107,53,0.35);
        }

        .wz-step-item.done .wz-step-circle {
          background: #36b37e;
          border-color: #36b37e;
          color: #fff;
        }

        .wz-step-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #555;
          transition: color 0.2s;
        }

        .wz-step-item.active .wz-step-label { color: #ff6b35; }
        .wz-step-item.done .wz-step-label { color: #36b37e; }

        .wz-step-line {
          width: 60px;
          height: 1px;
          background: #2a2a2a;
          margin: 0 0.75rem;
          flex-shrink: 0;
        }

        /* ── Body ── */
        .wz-body {
          flex: 1;
          overflow: hidden;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
        }

        /* Alerts */
        .wz-alerts {
          padding: 0.75rem 1.5rem 0;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wz-alert {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .wz-alert-error {
          background: rgba(222,53,11,0.1);
          border: 1px solid rgba(222,53,11,0.35);
          color: #ff7760;
        }

        .wz-alert-success {
          background: rgba(54,179,126,0.1);
          border: 1px solid rgba(54,179,126,0.35);
          color: #57d9a3;
        }

        /* ── Step 1 layout ── */
        .wz-step1 {
          flex: 1;
          display: grid;
          grid-template-columns: 320px 1fr;
          overflow: hidden;
          animation: wz-fadein 0.2s ease;
        }

        @keyframes wz-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Sidebar */
        .wz-sidebar {
          background: #0a0a0a;
          border-right: 1px solid #1a1a1a;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .wz-sidebar::-webkit-scrollbar { width: 4px; }
        .wz-sidebar::-webkit-scrollbar-track { background: transparent; }
        .wz-sidebar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

        .wz-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 0.28rem 0.75rem;
          border-radius: 999px;
          width: fit-content;
          margin-bottom: 0.85rem;
        }

        .wz-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .wz-sidebar-title {
          font-size: 1rem;
          font-weight: 700;
          color: #f0f0f0;
          line-height: 1.4;
          margin-bottom: 1.25rem;
        }

        .wz-meta-section {
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #141414;
        }

        .wz-meta-section:last-of-type {
          border-bottom: none;
        }

        .wz-meta-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #444;
          text-transform: uppercase;
          margin-bottom: 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .wz-meta-count {
          background: #1a1a1a;
          color: #666;
          font-size: 0.62rem;
          padding: 0 0.35rem;
          border-radius: 10px;
          letter-spacing: 0;
        }

        .wz-meta-rows {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .wz-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .wz-meta-key {
          font-size: 0.75rem;
          color: #666;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }

        .wz-meta-icon {
          font-size: 0.65rem;
          color: #555;
        }

        .wz-meta-val {
          font-size: 0.78rem;
          color: #ccc;
          font-weight: 500;
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.1rem;
        }

        .wz-orange { color: #ff6b35 !important; font-weight: 700 !important; }

        .wz-days-left {
          font-size: 0.68rem;
          font-weight: 600;
        }

        /* Students */
        .wz-students {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wz-student-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .wz-student-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b35, #ff9a5c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .wz-student-info {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
          min-width: 0;
        }

        .wz-student-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wz-student-email {
          font-size: 0.68rem;
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Quick action button */
        /* AI Score card in sidebar */
        .wz-score-card {
          background: #0d0a1f;
          border: 1px solid #2d1f5a;
          border-radius: 10px;
          padding: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .wz-score-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.65rem;
        }

        .wz-score-card-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .wz-score-card-verified {
          font-size: 0.6rem;
          font-weight: 700;
          color: #36b37e;
          background: #36b37e12;
          border: 1px solid #36b37e44;
          border-radius: 20px;
          padding: 0.08rem 0.4rem;
        }

        .wz-score-card-body {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .wz-goto-submit {
          margin-top: auto;
          background: transparent;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          border-radius: 8px;
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
          width: 100%;
        }

        .wz-goto-submit:hover {
          background: #ff6b35;
          color: #fff;
        }

        /* Main content area */
        .wz-main-content {
          padding: 1.75rem 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .wz-main-content::-webkit-scrollbar { width: 5px; }
        .wz-main-content::-webkit-scrollbar-track { background: transparent; }
        .wz-main-content::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }

        .wz-no-content {
          color: #444;
          font-size: 0.88rem;
          padding: 2rem 0;
          text-align: center;
        }

        .wz-content-block {
          margin-bottom: 0.6rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #111;
        }

        .wz-content-block:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .wz-rich > *:last-child { margin-bottom: 0 !important; }
        .wz-rich ul:last-child, .wz-rich ol:last-child { margin-bottom: 0; }

        .wz-content-heading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 0.85rem;
          padding-left: 0.6rem;
          border-left: 2px solid #ff6b35;
        }

        .wz-ch-icon {
          color: #ff6b35;
          font-size: 0.72rem;
        }

        .wz-rich {
          font-size: 0.88rem;
          color: #bbb;
          line-height: 1.7;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .wz-rich p { margin-bottom: 0.5rem; }
        .wz-rich ul, .wz-rich ol { padding-left: 1.4rem; }
        .wz-rich li { margin-bottom: 0.25rem; }
        .wz-rich strong { color: #e8e8e8; }
        .wz-rich a { color: #ff6b35; }
        .wz-rich h1, .wz-rich h2, .wz-rich h3 { color: #e0e0e0; margin-bottom: 0.5rem; }
        .wz-rich pre, .wz-rich code { white-space: pre-wrap !important; word-break: break-word; }
        .wz-rich img, .wz-rich video { max-width: 100%; height: auto; }

        .wz-rich-sm { font-size: 0.8rem; }

        /* ── Step 2 ── */
        .wz-step2 {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 2rem;
          animation: wz-fadein 0.2s ease;
        }

        .wz-step2::-webkit-scrollbar { width: 5px; }
        .wz-step2::-webkit-scrollbar-track { background: transparent; }
        .wz-step2::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }

        .wz-step2-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
          gap: 1.5rem;
          align-items: start;
        }

        .wz-col-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 1.1rem;
          display: flex;
          align-items: center;
        }

        /* Submit column */
        .wz-submit-col, .wz-review-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wz-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .wz-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #aaa;
        }

        .wz-input {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          color: #f0f0f0;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.18s;
          width: 100%;
        }

        .wz-input:focus { border-color: #ff6b35; }
        .wz-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .wz-input::placeholder { color: #444; }

        .wz-help {
          font-size: 0.72rem;
          color: #555;
        }

        /* File drop zone */
        .wz-file-drop {
          position: relative;
        }

        .wz-file-input {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          pointer-events: none;
        }

        .wz-file-input:not(:disabled) + .wz-file-label {
          cursor: pointer;
        }

        .wz-file-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 1.25rem;
          border: 1px dashed #2a2a2a;
          border-radius: 8px;
          background: #0d0d0d;
          color: #666;
          font-size: 0.8rem;
          text-align: center;
          transition: border-color 0.18s, background 0.18s;
        }

        .wz-file-label:hover {
          border-color: #ff6b35;
          background: rgba(255,107,53,0.05);
          color: #ff6b35;
        }

        .wz-file-icon {
          font-size: 1.5rem;
          font-weight: 300;
          color: #555;
        }

        .wz-file-hint {
          font-size: 0.68rem;
          color: #444;
        }

        /* File list */
        .wz-file-list {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          overflow: hidden;
        }

        .wz-file-list-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 0.5rem 0.85rem;
          background: #111;
          border-bottom: 1px solid #1f1f1f;
        }

        .wz-file-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.85rem;
          border-bottom: 1px solid #141414;
          font-size: 0.8rem;
        }

        .wz-file-item:last-child { border-bottom: none; }

        .wz-file-name { flex: 1; color: #ccc; }
        .wz-file-size { color: #555; font-size: 0.72rem; }

        .wz-file-remove {
          background: none;
          border: none;
          color: #444;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }

        .wz-file-remove:hover { color: #de350b; background: rgba(222,53,11,0.1); }

        /* Previous files */
        .wz-prev-files {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wz-prev-files-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.2rem;
        }

        .wz-attachment {
          font-size: 0.8rem;
          color: #888;
          text-decoration: none;
          padding: 0.3rem 0.5rem;
          border-radius: 5px;
          transition: color 0.15s, background 0.15s;
        }

        .wz-attachment:hover { color: #ff6b35; background: rgba(255,107,53,0.08); }

        .wz-replace-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #666;
          cursor: pointer;
        }

        .wz-checkbox {
          accent-color: #ff6b35;
          width: 14px;
          height: 14px;
        }

        /* Quill */
        .wz-quill-wrap {
          background: #0d0d0d;
          border-radius: 8px;
          overflow: hidden;
        }

        .wz-quill-wrap .ql-toolbar {
          background: #111;
          border-color: #2a2a2a !important;
        }

        .wz-quill-wrap .ql-container {
          border-color: #2a2a2a !important;
          min-height: 160px;
        }

        .wz-quill-wrap .ql-editor {
          min-height: 140px;
          color: #e0e0e0;
          font-size: 0.88rem;
        }

        .wz-quill-wrap .ql-editor.ql-blank::before { color: #555; }
        .wz-quill-wrap .ql-stroke { stroke: #ccc !important; }
        .wz-quill-wrap .ql-fill { fill: #ccc !important; }
        .wz-quill-wrap .ql-picker { color: #ccc !important; }
        .wz-quill-wrap .ql-picker-options { background: #111 !important; border-color: #333 !important; }

        /* Submit action */
        .wz-submit-action { display: flex; flex-direction: column; }

        .wz-btn-submit {
          background: linear-gradient(135deg, #ff6b35, #ff9a5c);
          border: none;
          color: #fff;
          border-radius: 8px;
          padding: 0.7rem 1.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wz-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255,107,53,0.35);
        }

        .wz-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .wz-locked-notice {
          background: rgba(0,82,204,0.08);
          border: 1px solid rgba(0,82,204,0.25);
          color: #6699cc;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Review column */
        .wz-review-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-left: 3px solid #555;
          border-radius: 8px;
          padding: 1.1rem 1.2rem;
        }

        .wz-review-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid #141414;
        }

        .wz-review-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
        }

        .wz-review-sub {
          font-size: 0.72rem;
          color: #555;
        }

        .wz-review-body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .wz-review-icon {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .wz-review-msg {
          font-size: 0.82rem;
          color: #aaa;
          margin: 0;
          line-height: 1.55;
        }

        .wz-feedback-block {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 0.25rem;
        }

        .wz-feedback-approved { border-left: 3px solid #36b37e; }
        .wz-feedback-revision { border-left: 3px solid #de350b; }

        .wz-feedback-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.4rem;
        }

        .wz-feedback-block p {
          font-size: 0.82rem;
          color: #ccc;
          margin: 0;
          line-height: 1.5;
        }

        /* Last submission */
        .wz-last-sub {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 1rem 1.1rem;
        }

        .wz-last-sub-title {
          font-size: 0.68rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.75rem;
        }

        .wz-last-sub-row {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.65rem;
        }

        .wz-last-sub-key {
          font-size: 0.7rem;
          color: #555;
          font-weight: 600;
        }

        .wz-last-sub-link {
          font-size: 0.78rem;
          color: #ff6b35;
          text-decoration: none;
          word-break: break-all;
        }

        .wz-last-sub-link:hover { text-decoration: underline; }

        /* ── Footer ── */
        .student-task-wizard .modal-footer {
          background: #0a0a0a;
          border-top: 1px solid #1a1a1a;
          padding: 0.85rem 1.5rem;
          flex-shrink: 0;
        }

        .wz-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .wz-footer-right {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .wz-btn-ghost {
          background: none;
          border: 1px solid #2a2a2a;
          color: #666;
          border-radius: 7px;
          padding: 0.5rem 1.1rem;
          font-size: 0.82rem;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s;
        }

        .wz-btn-ghost:hover { border-color: #555; color: #aaa; }

        .wz-btn-back {
          background: none;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          border-radius: 7px;
          padding: 0.5rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }

        .wz-btn-back:hover { background: rgba(255,107,53,0.1); }

        .wz-btn-next {
          background: linear-gradient(135deg, #ff6b35, #ff9a5c);
          border: none;
          color: #fff;
          border-radius: 7px;
          padding: 0.5rem 1.4rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
        }

        .wz-btn-next:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(255,107,53,0.35);
        }

        /* ── AI Evaluation (student view) ── */
        .wz-ai-eval {
          background: #0a0a0a;
          border: 1px solid #2a1a4a;
          border-radius: 8px;
          padding: 1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wz-ai-eval-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .wz-ai-eval-title {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #a78bfa;
        }

        .wz-ai-verified {
          font-size: 0.62rem;
          font-weight: 700;
          color: #36b37e;
          background: #36b37e12;
          border: 1px solid #36b37e44;
          border-radius: 20px;
          padding: 0.1rem 0.45rem;
        }

        .wz-ai-score-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .wz-ai-score-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wz-ai-score-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wz-ai-score-num {
          font-size: 0.9rem;
          font-weight: 800;
          color: #fff;
        }

        .wz-ai-score-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .wz-ai-grade {
          font-size: 0.72rem;
          font-weight: 700;
          background: #7c3aed22;
          color: #a78bfa;
          border: 1px solid #7c3aed44;
          border-radius: 4px;
          padding: 0.05rem 0.4rem;
        }

        .wz-ai-score-sub {
          font-size: 0.68rem;
          color: #666;
          margin-top: 0.1rem;
        }

        .wz-ai-summary {
          font-size: 0.75rem;
          color: #aaa;
          line-height: 1.55;
          margin: 0;
          background: #111;
          border-left: 2px solid #7c3aed;
          border-radius: 4px;
          padding: 0.5rem 0.65rem;
        }

        .wz-ai-criteria {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .wz-ai-criterion {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          background: #0d0d0d;
          border-radius: 4px;
          padding: 0.35rem 0.5rem;
          border: 1px solid #1a1a1a;
        }

        .wz-ai-criterion-icon {
          flex-shrink: 0;
          font-size: 0.72rem;
          margin-top: 0.05rem;
        }

        .wz-ai-criterion-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
          min-width: 0;
        }

        .wz-ai-criterion-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #ccc;
        }

        .wz-ai-criterion-fb {
          font-size: 0.66rem;
          color: #666;
        }

        .wz-ai-criterion-score {
          font-size: 0.68rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .wz-ai-sw {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
        }

        .wz-ai-sw-title {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.3rem;
        }

        .wz-ai-sw-item {
          font-size: 0.7rem;
          color: #aaa;
          margin-bottom: 0.15rem;
          line-height: 1.4;
        }

        .wz-ai-pending {
          font-size: 0.72rem;
          color: #555;
          background: #0d0d0d;
          border: 1px dashed #2a1a4a;
          border-radius: 6px;
          padding: 0.65rem 0.85rem;
          font-style: italic;
          line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .wz-step1 { grid-template-columns: 1fr; }
          .wz-sidebar {
            border-right: none;
            border-bottom: 1px solid #1a1a1a;
            max-height: 300px;
          }
          .wz-step2-grid { grid-template-columns: 1fr; }
          .wz-step-line { width: 30px; margin: 0 0.4rem; }
          .wz-breadcrumb-current { max-width: 160px; }
        }

        @media (max-width: 480px) {
          .wz-step-label { display: none; }
          .wz-ai-sw { grid-template-columns: 1fr; }
        }
      `}</style>
    </Modal>
  )
}

export default StudentTaskSubmissionWizard
