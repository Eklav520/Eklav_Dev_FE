import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

type Attachment = {
  fileName?: string
  fileUrl?: string
}

type SubmissionState = {
  _id?: string
  codeLink?: string
  codeDescription?: string
  attachments?: Attachment[]
  status?: 'pending' | 'completed'
  adminReviewStatus?: 'pending' | 'approved' | 'rejected'
  adminFeedback?: string
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

// Quill toolbar configuration
const QUILL_MODULES = {
  toolbar: [
    [{ header: [false, 2, 3, 4] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'clean']
  ],
};

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const StudentTaskSubmissionWizard = ({ show, onHide, task, token, baseURL, onSubmitted }: Props) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [submittedThisSession, setSubmittedThisSession] = useState(false)
  const [codeLink, setCodeLink] = useState('')
  const [codeDescription, setCodeDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [replaceAttachments, setReplaceAttachments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submission = task?.mySubmission
  const canAccessStep3 = submission?.status === 'completed' || submittedThisSession
  const isEditableStatus = (submission?.adminReviewStatus || 'pending') === 'pending'

  useEffect(() => {
    if (show) {
      setActiveStep(1)
      setSubmittedThisSession(false)
      setSuccess('')
      setError('')
    }
  }, [show, task?._id])

  useEffect(() => {
    if (activeStep === 3 && !canAccessStep3) {
      setActiveStep(2)
    }
  }, [activeStep, canAccessStep3])

  useEffect(() => {
    if (activeStep === 2 && !isEditableStatus) {
      setActiveStep(canAccessStep3 ? 3 : 1)
    }
  }, [activeStep, isEditableStatus, canAccessStep3])

  const adminLabel = useMemo(() => {
    const status = submission?.adminReviewStatus || 'pending'
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    return 'Pending Review'
  }, [submission?.adminReviewStatus])

  const statusClass = useMemo(() => {
    const status = submission?.adminReviewStatus || 'pending'
    if (status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    return 'warning'
  }, [submission?.adminReviewStatus])

  const handleSubmitStep2 = async () => {
    if (!task?._id || !token) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = new FormData()
      payload.append('codeLink', codeLink || submission?.codeLink || '')
      payload.append('codeDescription', codeDescription || submission?.codeDescription || '')
      payload.append('replaceAttachments', String(replaceAttachments))
      files.forEach((f) => payload.append('attachments', f))

      const res = await fetch(`${baseURL}/api/student/freelancing/tasks/${task._id}/submission`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to upload submission')
      }

      setSuccess('✅ Step 2 completed! Your work has been submitted to admin for review.')
      setSubmittedThisSession(true)
      setActiveStep(3)
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
        const exists = merged.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        )
        if (!exists) merged.push(file)
      })
      return merged
    })

    // Reset input so selecting the same file again still triggers onChange
    e.target.value = ''
  }

  const handleRemoveSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen={true}
      centered
      className="student-task-wizard"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <span className="modal-icon">📋</span>
          Task Submission Workflow
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!task ? (
          <Alert variant="warning" className="error-alert">
            <span className="alert-icon">⚠️</span>
            Task not found.
          </Alert>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}>
                <div className="step-circle">1</div>
                <div className="step-label">Task Details</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}>
                <div className="step-circle">2</div>
                <div className="step-label">Submit Work</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${activeStep === 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Review Status</div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert variant="danger" className="error-alert">
                <span className="alert-icon">❌</span>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="success-alert">
                <span className="alert-icon">✅</span>
                {success}
              </Alert>
            )}

            {/* Step 1: Task Details */}
            {activeStep === 1 && (
              <div className="step-content">
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <Badge className={`status-badge status-${submission?.status || 'pending'}`}>
                    {submission?.status === 'completed' ? 'Submitted' : 'Pending Submission'}
                  </Badge>
                </div>

                <div className="info-grid">
                  <div className="info-card">
                    <span className="info-icon">💰</span>
                    <div className="info-content">
                      <label>Budget</label>
                      <strong>{task.amount ? `₹${task.amount.toLocaleString()}` : '—'}</strong>
                    </div>
                  </div>
                  <div className="info-card">
                    <span className="info-icon">📅</span>
                    <div className="info-content">
                      <label>Start Date</label>
                      <strong>{formatDate(task.startDate)}</strong>
                    </div>
                  </div>
                  <div className="info-card">
                    <span className="info-icon">⏰</span>
                    <div className="info-content">
                      <label>Deadline</label>
                      <strong>{formatDate(task.deadline)}</strong>
                    </div>
                  </div>
                  <div className="info-card">
                    <span className="info-icon">👥</span>
                    <div className="info-content">
                      <label>Spots Left</label>
                      <strong>{task.spotsLeft ?? '—'}</strong>
                    </div>
                  </div>
                </div>

                {task.description && (
                  <div className="detail-section">
                    <h6 className="section-title">
                      <span className="section-icon">📝</span>
                      Description
                    </h6>
                    <div className="rich-content" dangerouslySetInnerHTML={{ __html: task.description }} />
                  </div>
                )}

                {task.highlights && (
                  <div className="detail-section">
                    <h6 className="section-title">
                      <span className="section-icon">⭐</span>
                      Key Highlights
                    </h6>
                    <div className="rich-content" dangerouslySetInnerHTML={{ __html: task.highlights }} />
                  </div>
                )}

                {task.acceptanceCriteria && (
                  <div className="detail-section">
                    <h6 className="section-title">
                      <span className="section-icon">✅</span>
                      Acceptance Criteria
                    </h6>
                    <div className="rich-content" dangerouslySetInnerHTML={{ __html: task.acceptanceCriteria }} />
                  </div>
                )}

                {task.terms && (
                  <div className="detail-section">
                    <h6 className="section-title">
                      <span className="section-icon">⚖️</span>
                      Terms & Conditions
                    </h6>
                    <div className="rich-content" dangerouslySetInnerHTML={{ __html: task.terms }} />
                  </div>
                )}

                <div className="detail-section">
                  <h6 className="section-title">
                    <span className="section-icon">👨‍🎓</span>
                    Enrolled Students ({task.enrolledStudentsDetails?.length || 0})
                  </h6>
                  {task.enrolledStudentsDetails && task.enrolledStudentsDetails.length > 0 ? (
                    <div className="student-grid">
                      {task.enrolledStudentsDetails.map((student) => (
                        <div key={student.studentId} className="student-card">
                          <div className="student-avatar">👤</div>
                          <div className="student-info">
                            <strong>{student.name || 'Student'}</strong>
                            <small>{student.email || 'No email'}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No enrolled students found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Upload Work */}
            {activeStep === 2 && (
              <div className="step-content">
                <h3 className="step-title">Submit Your Work</h3>
                <p className="step-description">Provide your code repository link and upload necessary files</p>

                <div className="submission-box">
                  <div className="submission-box-title">Upload Files + Repository</div>
                  <Form.Group className="form-group-modern mb-3">
                    <Form.Label>Upload Files</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleAddFiles}
                      className="file-input-modern"
                      accept=".zip,.rar,.7z,.pdf,.doc,.docx,.png,.jpg,.jpeg,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.sql,.json"
                      disabled={!isEditableStatus}
                    />
                    <Form.Text className="text-muted">
                      Upload code zip/source files, screenshots, and docs (Max 10MB per file). You can select files multiple times.
                    </Form.Text>
                  </Form.Group>

                  {files.length > 0 && (
                    <div className="file-list mt-2 mb-3">
                      <h6>Files to upload ({files.length}):</h6>
                      {files.map((file, idx) => (
                        <div key={idx} className="file-item">
                          <span className="file-icon">📎</span>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="ms-auto py-0 px-2"
                            onClick={() => handleRemoveSelectedFile(idx)}
                            disabled={!isEditableStatus}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Form.Group className="form-group-modern mb-0">
                    <Form.Label>Code Repository / Drive Link</Form.Label>
                    <Form.Control
                      type="url"
                      value={codeLink}
                      onChange={(e) => setCodeLink(e.target.value)}
                      placeholder={submission?.codeLink || 'https://github.com/your-repo or https://drive.google.com/...'}
                      className="form-control-lg"
                      disabled={!isEditableStatus}
                    />
                    <Form.Text className="text-muted">
                      Share the link to your code repository (GitHub, GitLab) or Google Drive folder
                    </Form.Text>
                  </Form.Group>
                </div>

                <Form.Group className="form-group-modern">
                  <Form.Label>Submission Notes</Form.Label>
                  <div className="rich-editor">
                    <ReactQuill
                      theme="snow"
                      value={codeDescription}
                      onChange={setCodeDescription}
                      placeholder="Explain your implementation, approach, and any challenges faced..."
                      modules={QUILL_MODULES}
                      readOnly={!isEditableStatus}
                    />
                  </div>
                </Form.Group>

                <Form.Check
                  type="checkbox"
                  id="replace-attachments"
                  label="Replace existing attachments"
                  checked={replaceAttachments}
                  onChange={(e) => setReplaceAttachments(e.target.checked)}
                  className="custom-checkbox"
                  disabled={!isEditableStatus}
                />

                {submission?.attachments && submission.attachments.length > 0 && (
                  <div className="existing-files">
                    <h6>Previously Uploaded Files</h6>
                    <div className="attachment-list">
                      {submission.attachments.map((a, i) => (
                        <a key={i} href={a.fileUrl} target="_blank" rel="noreferrer" className="attachment-link">
                          <span className="attachment-icon">📄</span>
                          {a.fileName || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="action-buttons">
                  {isEditableStatus ? (
                    <Button
                      className="btn-submit"
                      onClick={handleSubmitStep2}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Submitting Work...
                        </>
                      ) : (
                        'Submit Work for Review'
                      )}
                    </Button>
                  ) : (
                    <Alert variant="info" className="mb-0">
                      Editing is disabled for {submission?.adminReviewStatus || 'current'} status. You can only view details.
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review Status */}
            {activeStep === 3 && (
              <div className="step-content">
                <h3 className="step-title">Admin Review Status</h3>
                <p className="step-description">Check the status of your submission</p>

                <div className="review-status-card">
                  <div className="status-header">
                    <Badge bg={statusClass} className="status-badge-large">
                      {adminLabel}
                    </Badge>
                    <div className="submission-status">
                      Task Status: <strong>{submission?.status === 'completed' ? 'Submitted' : 'Pending'}</strong>
                    </div>
                  </div>

                  {submission?.adminReviewStatus === 'approved' ? (
                    <div className="review-approved">
                      <div className="review-icon">🎉</div>
                      <div className="review-content">
                        <h5>Congratulations! Your submission has been approved.</h5>
                        {submission.adminFeedback && (
                          <div className="review-feedback">
                            <strong>Admin Feedback:</strong>
                            <p>{submission.adminFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : submission?.adminReviewStatus === 'rejected' ? (
                    <div className="review-rejected">
                      <div className="review-icon">📝</div>
                      <div className="review-content">
                        <h5>Your submission needs updates.</h5>
                        {submission.adminFeedback && (
                          <div className="review-feedback">
                            <strong>Admin Feedback:</strong>
                            <p>{submission.adminFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="review-pending">
                      <div className="review-icon">⏳</div>
                      <div className="review-content">
                        <h5>Your submission is pending review.</h5>
                        <p>The admin will review your work and provide feedback soon. Please check back later.</p>
                        {submission?.adminFeedback && (
                          <div className="review-feedback">
                            <strong>Admin Suggestions:</strong>
                            <p>{submission?.adminFeedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {submission?.codeLink && (
                  <div className="submission-details">
                    <h6>Your Submission Details</h6>
                    <div className="detail-item">
                      <strong>Code Link:</strong>
                      <a href={submission.codeLink} target="_blank" rel="noreferrer">{submission.codeLink}</a>
                    </div>
                    {submission.codeDescription && (
                      <div className="detail-item">
                        <strong>Submission Notes:</strong>
                        <div dangerouslySetInnerHTML={{ __html: submission.codeDescription }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-light" onClick={onHide}>
          Close
        </Button>
        {activeStep > 1 && (
          <Button
            variant="outline-orange"
            onClick={() => setActiveStep((activeStep - 1) as 1 | 2 | 3)}
          >
            ← Back
          </Button>
        )}
        {activeStep < 3 && (
          <Button
            className="btn-primary-custom"
            onClick={() => {
              if (activeStep === 1) {
                if (!isEditableStatus && canAccessStep3) {
                  setActiveStep(3)
                } else {
                  setActiveStep(2)
                }
                return
              }

              setActiveStep((activeStep + 1) as 1 | 2 | 3)
            }}
            disabled={activeStep === 2 && !canAccessStep3}
          >
            {activeStep === 1 && !isEditableStatus && canAccessStep3
              ? 'View Review →'
              : activeStep === 2 && !canAccessStep3
                ? 'Submit Step 2 to Continue'
                : 'Next →'}
          </Button>
        )}
      </Modal.Footer>

      <style>{`
        .student-task-wizard .modal-content {
          background: #000000;
          border: none;
          border-radius: 0;
          color: #ffffff;
        }

        .student-task-wizard .modal-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 1.5rem 2rem;
        }

        .student-task-wizard .modal-title {
          color: #ff6b35;
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-icon {
          font-size: 1.5rem;
        }

        .student-task-wizard .modal-body {
          padding: 2rem;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .student-task-wizard .modal-footer {
          border-top: 1px solid #333333;
          padding: 1.5rem 2rem;
          background: #0a0a0a;
          gap: 1rem;
        }

        /* Step Indicator */
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #0a0a0a;
          border-radius: 16px;
          border: 1px solid #222222;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #333333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #888888;
          transition: all 0.3s ease;
        }

        .step.active .step-circle {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
        }

        .step.completed .step-circle {
          background: #28a745;
          border-color: #28a745;
          color: #ffffff;
        }

        .step-label {
          font-size: 0.8rem;
          color: #888888;
          font-weight: 500;
        }

        .step.active .step-label {
          color: #ff6b35;
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: #333333;
          margin: 0 0.5rem;
          margin-bottom: 1.5rem;
        }

        /* Alerts */
        .error-alert, .success-alert {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .success-alert {
          background: rgba(40, 167, 69, 0.1);
          border-color: #28a745;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        /* Step Content */
        .step-content {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333333;
        }

        .task-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff6b35;
          margin: 0;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        .status-badge.status-completed {
          background: #28a745;
        }

        .status-badge.status-pending {
          background: #ffc107;
          color: #000;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          border-color: #ff6b35;
          transform: translateY(-2px);
        }

        .info-icon {
          font-size: 1.5rem;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-content label {
          font-size: 0.75rem;
          color: #888888;
          margin: 0;
        }

        .info-content strong {
          font-size: 1rem;
          color: #ffffff;
        }

        /* Detail Sections */
        .detail-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          color: #ff6b35;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-icon {
          font-size: 1rem;
        }

        .rich-content {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 10px;
          padding: 1rem;
          color: #e0e0e0;
          line-height: 1.6;
        }

        /* Student Grid */
        .student-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.75rem;
        }

        .student-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 10px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }

        .student-card:hover {
          border-color: #ff6b35;
        }

        .student-avatar {
          font-size: 1.5rem;
        }

        .student-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .student-info strong {
          font-size: 0.9rem;
          color: #ffffff;
        }

        .student-info small {
          font-size: 0.75rem;
          color: #ff9a5c;
        }

        /* Form Styles */
        .step-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #888888;
          margin-bottom: 1.5rem;
        }

        .submission-box {
          margin-bottom: 1rem;
          padding: 1rem 1.1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 107, 53, 0.24);
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 107, 53, 0.03));
        }

        .submission-box-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffb08f;
          margin-bottom: 0.65rem;
        }

        .form-group-modern {
          margin-bottom: 1.5rem;
        }

        .form-group-modern .form-label {
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-control-lg, .form-select {
          background: #0a0a0a;
          border: 1px solid #333333;
          color: #ffffff;
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }

        .form-control-lg:focus, .form-select:focus {
          background: #0a0a0a;
          border-color: #ff6b35;
          color: #ffffff;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
        }

        .text-muted {
          color: #888888 !important;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        /* Rich Editor */
        .rich-editor {
          background: #0a0a0a;
          border-radius: 10px;
          overflow: hidden;
        }

        .rich-editor .ql-toolbar {
          background: #0a0a0a;
          border-color: #333333;
        }

        .rich-editor .ql-container {
          min-height: 200px;
          font-size: 0.95rem;
        }

        .rich-editor .ql-editor {
          min-height: 180px;
          color: #ffffff;
        }

        .rich-editor .ql-editor.ql-blank::before {
          color: #666666;
        }

        .rich-editor .ql-stroke {
          stroke: #ffffff;
        }

        .rich-editor .ql-fill {
          fill: #ffffff;
        }

        .rich-editor .ql-picker {
          color: #ffffff;
        }

        .rich-editor .ql-picker-options {
          background: #0a0a0a;
          border-color: #333333;
        }

        /* File Input */
        .file-input-modern {
          background: #0a0a0a;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 10px;
        }

        .file-input-modern::-webkit-file-upload-button {
          background: #ff6b35;
          border: none;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-right: 1rem;
        }

        .file-input-modern::-webkit-file-upload-button:hover {
          background: #ff9a5c;
        }

        /* File List */
        .file-list, .existing-files {
          margin: 1rem 0;
          padding: 1rem;
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 10px;
        }

        .file-list h6, .existing-files h6 {
          color: #ff6b35;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-bottom: 1px solid #222222;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-icon {
          font-size: 1rem;
        }

        .file-name {
          flex: 1;
          color: #ffffff;
        }

        .file-size {
          color: #888888;
          font-size: 0.8rem;
        }

        .attachment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .attachment-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          color: #ff9a5c;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .attachment-link:hover {
          background: rgba(255, 107, 53, 0.1);
          color: #ff6b35;
        }

        .attachment-icon {
          font-size: 1rem;
        }

        /* Checkbox */
        .custom-checkbox {
          margin: 1rem 0;
          color: #ffffff;
        }

        .custom-checkbox .form-check-input {
          background-color: #0a0a0a;
          border-color: #333333;
          width: 1.2rem;
          height: 1.2rem;
          cursor: pointer;
        }

        .custom-checkbox .form-check-input:checked {
          background-color: #ff6b35;
          border-color: #ff6b35;
        }

        .custom-checkbox .form-check-label {
          padding-left: 0.5rem;
          cursor: pointer;
        }

        /* Review Status Card */
        .review-status-card {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border: 1px solid #333333;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333333;
        }

        .status-badge-large {
          font-size: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .submission-status {
          color: #888888;
          font-size: 0.9rem;
        }

        .review-approved, .review-rejected, .review-pending {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .review-icon {
          font-size: 3rem;
        }

        .review-content h5 {
          color: #ff6b35;
          margin-bottom: 0.75rem;
        }

        .review-feedback {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 107, 53, 0.1);
          border-radius: 10px;
        }

        .review-feedback strong {
          color: #ff6b35;
          display: block;
          margin-bottom: 0.5rem;
        }

        .review-feedback p {
          margin: 0;
          color: #e0e0e0;
        }

        /* Submission Details */
        .submission-details {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .submission-details h6 {
          color: #ff6b35;
          margin-bottom: 1rem;
        }

        .detail-item {
          margin-bottom: 1rem;
        }

        .detail-item strong {
          display: block;
          color: #888888;
          margin-bottom: 0.5rem;
        }

        .detail-item a {
          color: #ff9a5c;
          text-decoration: none;
          word-break: break-all;
        }

        .detail-item a:hover {
          text-decoration: underline;
        }

        /* Buttons */
        .btn-submit, .btn-primary-custom {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-submit:hover:not(:disabled), .btn-primary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .btn-outline-orange {
          background: transparent;
          border: 2px solid #ff6b35;
          color: #ff6b35;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-outline-orange:hover:not(:disabled) {
          background: #ff6b35;
          color: #ffffff;
          transform: translateY(-2px);
        }

        .btn-outline-light {
          border: 2px solid #555555;
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
        }

        .btn-outline-light:hover {
          background: #333333;
          border-color: #ff6b35;
          color: #ffffff;
        }

        .action-buttons {
          margin-top: 1.5rem;
          text-align: right;
        }

        /* Scrollbar */
        .student-task-wizard .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .student-task-wizard .modal-body::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .student-task-wizard .modal-body::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 4px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .student-task-wizard .modal-header,
          .student-task-wizard .modal-body,
          .student-task-wizard .modal-footer {
            padding: 1rem;
          }

          .step-indicator {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .step-line {
            display: none;
          }

          .step {
            flex-direction: row;
            width: 100%;
            justify-content: flex-start;
            gap: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .student-grid {
            grid-template-columns: 1fr;
          }

          .review-approved, .review-rejected, .review-pending {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .status-header {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>
    </Modal>
  )
}

export default StudentTaskSubmissionWizard