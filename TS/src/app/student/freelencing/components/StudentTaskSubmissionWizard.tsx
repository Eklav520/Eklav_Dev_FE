import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaCloudUploadAlt,
  FaCommentAlt,
  FaEye,
  FaExclamationCircle,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaLink,
  FaQuestionCircle,
  FaTimes,
  FaUpload,
} from 'react-icons/fa'

type Attachment = { fileName?: string; fileUrl?: string }

type AiEvaluation = {
  score: number | null
  grade: string | null
  summary: string
  criteriaEvaluation: unknown[]
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

type EnrolledStudent = { studentId: string; name: string; email: string }

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
  taskIndex?: number
  totalTasks?: number
}

const WORKFLOW_STEPS = [
  { key: 'start',      label: 'Start Task',   subLabel: (active: boolean, done: boolean) => done ? 'Completed' : active ? 'In Progress' : 'Pending' },
  { key: 'submit',     label: 'Submit Work',  subLabel: (active: boolean, done: boolean) => done ? 'Submitted'  : active ? 'In Progress' : 'Pending' },
  { key: 'review',     label: 'Under Review', subLabel: (_a: boolean, done: boolean) => done ? 'Reviewed' : 'Pending' },
  { key: 'needs_work', label: 'Needs Work',   subLabel: (_a: boolean, done: boolean) => done ? 'Done' : 'Pending' },
  { key: 'completed',  label: 'Completed',    subLabel: (_a: boolean, done: boolean) => done ? 'Done' : 'Pending' },
]

const REVIEW_CYCLE = [
  { icon: FaUpload,        label: 'Submit Work',    desc: 'Upload your work and comments' },
  { icon: FaEye,           label: 'Under Review',   desc: 'Mentor will review your submission' },
  { icon: FaExclamationCircle, label: 'Needs Work', desc: 'Work on feedback and improve' },
  { icon: FaUpload,        label: 'Resubmit',       desc: 'Update your work and resubmit' },
  { icon: FaCheckCircle,   label: 'Approved',       desc: 'Mentor approves your work' },
]

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatDateTime = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getDaysLeft = (d?: string | null) => {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  if (diff < 0) return { label: 'Overdue', urgent: true }
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return { label: 'Due today', urgent: true }
  return { label: `${days} days left`, urgent: days <= 3 }
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return { Icon: FaFilePdf, color: '#ef4444' }
  if (['doc', 'docx'].includes(ext)) return { Icon: FaFileWord, color: '#3b82f6' }
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FaFileExcel, color: '#22c55e' }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { Icon: FaFileArchive, color: '#f59e0b' }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return { Icon: FaFileImage, color: '#8b5cf6' }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'sql', 'json', 'html', 'css'].includes(ext)) return { Icon: FaFileCode, color: '#06b6d4' }
  return { Icon: FaFileAlt, color: '#64748b' }
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ORANGE = '#ff6b35'

const StudentTaskSubmissionWizard = ({ show, onHide, task, token, baseURL, onSubmitted, taskIndex, totalTasks }: Props) => {
  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [codeLink, setCodeLink] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [replaceAttachments, setReplaceAttachments] = useState(false)
  const [lockedByRecentSubmit, setLockedByRecentSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submission = task?.mySubmission
  const isReviewPending = submission?.status === 'completed' && (!submission?.adminReviewStatus || submission.adminReviewStatus === 'pending')
  const isEditableStatus = !submission || submission.status !== 'completed' || submission.adminReviewStatus === 'rejected'
  const isSubmissionLocked = isReviewPending || lockedByRecentSubmit
  const canEditSubmission = isEditableStatus && !isSubmissionLocked

  useEffect(() => {
    if (show) { setActiveStep(1); setSuccess(''); setError(''); setLockedByRecentSubmit(false) }
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
      return { label: 'New Task', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' }
    }
    if (reviewStatus === 'approved') return { label: 'Completed', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }
    if (reviewStatus === 'rejected') return { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' }
    return { label: 'In Progress', color: ORANGE, bg: 'rgba(255,107,53,0.1)', border: 'rgba(255,107,53,0.25)' }
  }, [submission, submissionStatus, reviewStatus])

  const workflowStepIndex = useMemo(() => {
    if (lockedByRecentSubmit) return 2
    if (!submission || submissionStatus !== 'completed') return activeStep === 1 ? 0 : 1
    if (reviewStatus === 'approved') return 4
    if (reviewStatus === 'rejected') return 3
    return 2
  }, [submission, submissionStatus, reviewStatus, activeStep, lockedByRecentSubmit])

  const taskXofY = typeof taskIndex === 'number' && typeof totalTasks === 'number'
    ? `Task ${taskIndex + 1} of ${totalTasks}` : null

  const daysLeft = getDaysLeft(task?.deadline)

  const handleSubmit = async () => {
    if (!task?._id || !token) return
    if (!canEditSubmission) { setError('Submission is locked while waiting for admin review.'); return }
    const hasNotes = notes.trim().length > 0
    const hasFiles = files.length > 0
    const hasPriorAttachments = (submission?.attachments?.length ?? 0) > 0 && !replaceAttachments
    if (!hasNotes && !hasFiles && !hasPriorAttachments) {
      setError('Please add a comment or attach at least one file before submitting.')
      return
    }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const payload = new FormData()
      payload.append('codeLink', codeLink || submission?.codeLink || '')
      payload.append('codeDescription', notes || submission?.codeDescription || '')
      payload.append('replaceAttachments', String(replaceAttachments))
      files.forEach(f => payload.append('attachments', f))
      const res = await fetch(`${baseURL}/api/student/freelancing/tasks/${task._id}/submission`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: payload,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to upload submission')
      setSuccess('Submitted successfully! Your work is now with admin for review.')
      setLockedByRecentSubmit(true)
      await onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const addFiles = (selected: File[]) => {
    setFiles(prev => {
      const merged = [...prev]
      selected.forEach(file => {
        if (!merged.some(f => f.name === file.name && f.size === file.size)) merged.push(file)
      })
      return merged
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (canEditSubmission && e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files))
  }

  if (!show) return null

  const progressPct = Math.round((workflowStepIndex / (WORKFLOW_STEPS.length - 1)) * 100)

  return (
    <div className="wz-overlay" onClick={e => { if (e.target === e.currentTarget) onHide() }}>
      <div className="wz-modal">

        {/* Header */}
        <div className="wz-header">
          {/* Breadcrumb row */}
          <div className="wz-header-top">
            <div className="wz-breadcrumb">
              <span>My Internship</span>
              <FaChevronRight className="wz-bc-sep" />
              <span>My Tasks</span>
              <FaChevronRight className="wz-bc-sep" />
              <span className="wz-bc-cur">{activeStep === 1 ? 'Task Details' : 'Submit Work'}</span>
            </div>
            <button className="wz-close-btn" onClick={onHide}><FaTimes /></button>
          </div>

          {/* Main header: left content + right status card */}
          <div className="wz-header-main">

            {/* Left: info boxes + stepper */}
            <div className="wz-header-left">

              {/* Three info boxes */}
              <div className="wz-info-boxes">
                {/* Box 1 — Task info */}
                <div className="wz-info-box wz-info-box-main">
                  <div className="wz-task-icon">
                    <FaFileCode style={{ fontSize: 18, color: '#3b82f6' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h1 className="wz-task-title">{task?.title || 'Task Details'}</h1>
                      {taskXofY && <span className="wz-xofy">{taskXofY}</span>}
                    </div>
                    {task?.description && (
                      <div className="wz-task-desc">{(() => { const t = stripHtml(task.description!); return t.length > 90 ? t.slice(0, 90) + '...' : t })()}</div>
                    )}
                    <div className="wz-task-tags">
                      <span className="wz-tag wz-tag-blue">Web Development</span>
                      <span className="wz-tag wz-tag-green">Beginner</span>
                      <span className="wz-tag" style={{ color: statusConfig.color, background: statusConfig.bg, border: `1px solid ${statusConfig.border}` }}>{statusConfig.label}</span>
                    </div>
                  </div>
                </div>

                {/* Box 2 — Deadline */}
                <div className="wz-info-box">
                  <div className="wz-info-box-label">Deadline</div>
                  <div className="wz-info-box-value">{task?.deadline ? formatDateTime(task.deadline) : '—'}</div>
                  {daysLeft && (
                    <div className="wz-info-box-sub" style={{ color: daysLeft.urgent ? '#ef4444' : ORANGE }}>{daysLeft.label}</div>
                  )}
                </div>

                {/* Box 3 — Overall Progress */}
                <div className="wz-info-box">
                  <div className="wz-info-box-label">Overall Progress</div>
                  <div className="wz-info-box-value">{progressPct}%</div>
                  <div className="wz-progress-bar-bg" style={{ marginTop: 8 }}>
                    <div className="wz-progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Stepper */}
              <div className="wz-stepper-wrap">
                <div className="wz-stepper-label">Submission Flow</div>
                <div className="wz-stepper">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isDone = idx < workflowStepIndex
                    const isActive = idx === workflowStepIndex
                    return (
                      <React.Fragment key={step.key}>
                        {idx > 0 && <div className={`wz-stepper-line${isDone ? ' done' : isActive ? ' active' : ''}`} />}
                        <div className="wz-step-col">
                          <div className={`wz-step-node${isActive ? ' active' : isDone ? ' done' : ' pending'}`}>
                            {isDone ? <FaCheckCircle style={{ fontSize: 12 }} /> : <span>{idx + 1}</span>}
                          </div>
                          <span className={`wz-step-lbl${isActive ? ' active' : isDone ? ' done' : ''}`}>{step.label}</span>
                          <span className={`wz-step-sub${isActive ? ' active' : isDone ? ' done' : ''}`}>{step.subLabel(isActive, isDone)}</span>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Task Status card — spans full height of left */}
            <div className="wz-header-right-card">
              <div className="wz-hrc-section">
                <div className="wz-hrc-title">Task Status</div>
                <div className="wz-status-badge" style={{ background: statusConfig.bg, border: `1.5px solid ${statusConfig.border}`, color: statusConfig.color }}>
                  <span className="wz-status-dot" style={{ background: statusConfig.color }} />
                  {statusConfig.label}
                </div>
              </div>
              <div className="wz-hrc-divider" />
              {task?.startDate && (
                <div className="wz-hrc-date-row">
                  <div className="wz-hrc-date-icon" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <FaCalendarAlt style={{ color: '#6366f1', fontSize: 11 }} />
                  </div>
                  <div>
                    <div className="wz-hrc-date-key">Start Date</div>
                    <div className="wz-hrc-date-val">{formatDateTime(task.startDate)}</div>
                  </div>
                </div>
              )}
              <div className="wz-hrc-divider" />
              {task?.deadline && (
                <div className="wz-hrc-date-row">
                  <div className="wz-hrc-date-icon" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <FaCalendarAlt style={{ color: '#f59e0b', fontSize: 11 }} />
                  </div>
                  <div>
                    <div className="wz-hrc-date-key">Deadline</div>
                    <div className="wz-hrc-date-val">{formatDateTime(task.deadline)}</div>
                    {daysLeft && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: daysLeft.urgent ? '#ef4444' : ORANGE, marginTop: 2 }}>{daysLeft.label}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Body */}
        <div className="wz-body">
          {!task ? (
            <div style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>Task not found.</div>
          ) : (
            <div className="wz-content-grid">

              {/* Left panel */}
              <div className="wz-left-panel">
              <div className="wz-left-card">
                {(error || success) && (
                  <div style={{ marginBottom: 16 }}>
                    {error && <div className="wz-alert wz-alert-error"><FaTimes style={{ flexShrink: 0 }} /> {error}</div>}
                    {success && <div className="wz-alert wz-alert-success"><FaCheckCircle style={{ flexShrink: 0 }} /> {success}</div>}
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="wz-task-details">
                    {!task.description && !task.highlights && !task.acceptanceCriteria && !task.terms && (
                      <div style={{ color: '#94a3b8', fontSize: 13, padding: '2rem 0', textAlign: 'center' }}>No additional task details provided.</div>
                    )}
                    {task.description && (
                      <section className="wz-content-block">
                        <div className="wz-content-heading"><FaFileAlt className="wz-ch-icon" /> Description</div>
                        <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.description }} />
                      </section>
                    )}
                    {task.highlights && (
                      <section className="wz-content-block">
                        <div className="wz-content-heading"><FaFileAlt className="wz-ch-icon" /> Key Highlights</div>
                        <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.highlights }} />
                      </section>
                    )}
                    {task.acceptanceCriteria && (
                      <section className="wz-content-block">
                        <div className="wz-content-heading"><FaCheckCircle className="wz-ch-icon" /> Acceptance Criteria</div>
                        <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.acceptanceCriteria }} />
                      </section>
                    )}
                    {task.terms && (
                      <section className="wz-content-block">
                        <div className="wz-content-heading"><FaFileAlt className="wz-ch-icon" /> Terms &amp; Conditions</div>
                        <div className="wz-rich" dangerouslySetInnerHTML={{ __html: task.terms }} />
                      </section>
                    )}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="wz-submit-panel">
                    <div className="wz-submit-title">Submit Your Work</div>
                    <div className="wz-submit-subtitle">Upload your work and add comments for the mentor.</div>

                    {isSubmissionLocked && (
                      <div className="wz-info-banner">
                        <FaQuestionCircle style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Submission under review</strong>
                          <p>Your work has been submitted and is being reviewed by the mentor. You'll be notified once feedback is available.</p>
                        </div>
                      </div>
                    )}

                    {/* Repo link */}
                    <div className="wz-field">
                      <label className="wz-label">Repository / Drive Link <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                      <div className="wz-input-wrap">
                        <FaLink className="wz-input-icon" />
                        <input
                          type="url"
                          className="wz-input"
                          value={codeLink}
                          onChange={e => setCodeLink(e.target.value)}
                          placeholder={submission?.codeLink || 'https://github.com/your-repo or Google Drive link...'}
                          disabled={!canEditSubmission}
                        />
                      </div>
                    </div>

                    {/* File upload */}
                    <div className="wz-field">
                      <label className="wz-label">Your Work / Attachments</label>
                      <div
                        className={`wz-drop-zone${dragging ? ' dragging' : ''}${!canEditSubmission ? ' disabled' : ''}`}
                        onDragOver={e => { e.preventDefault(); if (canEditSubmission) setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => canEditSubmission && fileInputRef.current?.click()}
                      >
                        <FaCloudUploadAlt className="wz-drop-icon" />
                        <div className="wz-drop-text">Drag &amp; drop files here or click to browse</div>
                        <div className="wz-drop-hint">You can upload files (zip, pdf, doc, excel, images, etc.)</div>
                        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                          onChange={handleFileChange} disabled={!canEditSubmission}
                          accept=".zip,.rar,.7z,.pdf,.doc,.docx,.png,.jpg,.jpeg,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.sql,.json,.xls,.xlsx"
                        />
                      </div>
                      {files.length > 0 && (
                        <div className="wz-file-list">
                          {files.map((file, idx) => {
                            const { Icon, color } = getFileIcon(file.name)
                            return (
                              <div key={idx} className="wz-file-item">
                                <Icon style={{ color, fontSize: 18, flexShrink: 0 }} />
                                <span className="wz-file-name">{file.name}</span>
                                <span className="wz-file-size">{fmtSize(file.size)}</span>
                                <button className="wz-file-remove" onClick={() => setFiles(p => p.filter((_, i) => i !== idx))} disabled={!canEditSubmission}><FaTimes /></button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {submission?.attachments && submission.attachments.length > 0 && (
                        <div className="wz-prev-files">
                          <div className="wz-prev-title">Previously Uploaded</div>
                          {submission.attachments.map((a, i) => {
                            const { Icon, color } = getFileIcon(a.fileName || '')
                            return (
                              <a key={i} href={a.fileUrl} target="_blank" rel="noreferrer" className="wz-file-item" style={{ textDecoration: 'none' }}>
                                <Icon style={{ color, fontSize: 18, flexShrink: 0 }} />
                                <span className="wz-file-name">{a.fileName || `Attachment ${i + 1}`}</span>
                              </a>
                            )
                          })}
                          <label className="wz-replace-check">
                            <input type="checkbox" checked={replaceAttachments} onChange={e => setReplaceAttachments(e.target.checked)} disabled={!canEditSubmission} />
                            Replace existing attachments with new upload
                          </label>
                        </div>
                      )}
                      <div className="wz-file-note">*You can upload multiple files (Max size per file: 25MB)</div>
                    </div>

                    {/* Notes */}
                    <div className="wz-field">
                      <label className="wz-label"><FaCommentAlt style={{ marginRight: 5 }} /> Comments / Notes for Mentor <span className="wz-required">*</span></label>
                      <textarea
                        className="wz-textarea"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Describe your implementation, approach, challenges faced..."
                        disabled={!canEditSubmission}
                        maxLength={1000}
                        rows={5}
                      />
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{notes.length} / 1000</div>
                    </div>

                    {submission?.adminFeedback && (
                      <div className={`wz-feedback-banner${reviewStatus === 'approved' ? ' approved' : ' rejected'}`}>
                        <div className="wz-fb-label">{reviewStatus === 'approved' ? '✓ Admin Feedback' : '✏ Revision Required'}</div>
                        <p>{submission.adminFeedback}</p>
                      </div>
                    )}

                    {!canEditSubmission && (
                      <div className="wz-locked-notice">⏳ Submission locked — waiting for admin review.</div>
                    )}

                    {/* Review cycle */}
                    <div className="wz-cycle-section">
                      <div className="wz-cycle-title">Submission &amp; Review Cycle</div>
                      <div className="wz-cycle-steps">
                        {REVIEW_CYCLE.map((c, i) => (
                          <div key={c.label} className="wz-cycle-step">
                            <div className="wz-cycle-icon-wrap">
                              <c.icon style={{ fontSize: 15, color: '#64748b' }} />
                            </div>
                            <div className="wz-cycle-label">{c.label}</div>
                            <div className="wz-cycle-desc">{c.desc}</div>
                            {i < REVIEW_CYCLE.length - 1 && <div className="wz-cycle-arrow">→</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>{/* /wz-left-card */}
              </div>

              {/* Right sidebar */}
              <aside className="wz-sidebar">

                {/* Task Timeline */}
                <div className="wz-sb-card">
                  <div className="wz-sb-card-title">Task Timeline</div>
                  <div className="wz-timeline">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isDone = idx < workflowStepIndex
                      const isActive = idx === workflowStepIndex
                      return (
                        <div key={step.key} className="wz-tl-item">
                          <div className="wz-tl-spine">
                            <div className={`wz-tl-dot${isActive ? ' active' : isDone ? ' done' : ' pending'}`}>
                              {isDone ? <FaCheckCircle style={{ fontSize: 8 }} /> : isActive ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} /> : null}
                            </div>
                            {idx < WORKFLOW_STEPS.length - 1 && <div className={`wz-tl-line${isDone ? ' done' : ''}`} />}
                          </div>
                          <div className="wz-tl-content">
                            <span className={`wz-tl-label${isActive ? ' active' : isDone ? ' done' : ' pending'}`}>{step.label}</span>
                            <span className={`wz-tl-sub${isActive ? ' active' : isDone ? ' done' : ''}`}>
                              {isDone ? (idx === 0 ? `${formatDate(task.startDate)}` : 'Completed') : isActive ? 'You are here' : 'Pending review from mentor'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </aside>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wz-footer">
          <button className="wz-btn-ghost" onClick={onHide}>
            {activeStep === 2 ? 'Cancel' : 'Close'}
          </button>
          <div className="wz-footer-right">
            {activeStep === 1 && (
              <button className="wz-btn-continue" onClick={() => setActiveStep(2)}>
                {submission?.status === 'completed'
                  ? reviewStatus === 'rejected' ? 'Resubmit Work →' : 'View Submission →'
                  : 'Continue →'}
              </button>
            )}
            {activeStep === 2 && canEditSubmission && (
              <button className="wz-btn-continue" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Spinner animation="border" size="sm" style={{ marginRight: 6 }} />Submitting...</> : 'Submit for Review →'}
              </button>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .wz-overlay {
          position: fixed; inset: 0; z-index: 1060;
          background: rgba(15,23,42,0.55);
          display: flex; align-items: stretch; justify-content: stretch;
        }
        .wz-modal {
          background: #f1f5f9; border-radius: 0;
          width: 100%; height: 100%;
          display: flex; flex-direction: column; overflow: hidden;
        }

        /* Header */
        .wz-header {
          background: #f1f5f9; border-bottom: none; padding: 16px 24px 0; flex-shrink: 0;
        }
        .wz-header-top {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .wz-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; }
        .wz-bc-sep { font-size: 9px; color: #cbd5e1; }
        .wz-bc-cur { color: #475569; font-weight: 600; }
        .wz-close-btn {
          background: none; border: 1px solid #e2e8f0; color: #64748b; cursor: pointer;
          width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; transition: all 0.15s;
        }
        .wz-close-btn:hover { background: #f1f5f9; color: #0f172a; }

        /* Header two-column layout */
        .wz-header-main { display: flex; align-items: stretch; gap: 12px; margin-bottom: 0; }
        .wz-header-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; }

        /* Right status card */
        .wz-header-right-card {
          width: 220px; flex-shrink: 0; box-sizing: border-box;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
        }
        .wz-hrc-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 8px; }
        .wz-hrc-section { display: flex; flex-direction: column; }
        .wz-hrc-divider { height: 1px; background: #f1f5f9; }
        .wz-hrc-date-row { display: flex; align-items: flex-start; gap: 10px; }
        .wz-hrc-date-icon {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
        }
        .wz-hrc-date-key { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
        .wz-hrc-date-val { font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px; }

        /* Stepper wrap */
        .wz-stepper-wrap {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 10px 20px; margin-top: 12px;
        }
        .wz-stepper-label { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }

        /* Three info boxes */
        .wz-info-boxes {
          display: flex; align-items: stretch; gap: 0;
          border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;
        }
        .wz-info-box {
          padding: 14px 20px; display: flex; flex-direction: column; justify-content: center;
          border-right: 1px solid #e2e8f0; flex-shrink: 0; min-width: 180px;
        }
        .wz-info-box:last-child { border-right: none; }
        .wz-info-box-main { display: flex; flex-direction: row; align-items: center; gap: 14px; flex: 1; min-width: 0; flex-shrink: 1; }
        .wz-info-box-label { font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px; }
        .wz-info-box-value { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3; }
        .wz-info-box-sub { font-size: 12px; font-weight: 700; margin-top: 3px; }
        .wz-task-icon {
          width: 44px; height: 44px; border-radius: 10px; background: #eff6ff; border: 1px solid #bfdbfe;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .wz-task-title { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; line-height: 1.3; }
        .wz-xofy {
          font-size: 11px; color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 2px 10px; white-space: nowrap; font-weight: 600;
        }
        .wz-task-desc { font-size: 11px; color: #64748b; margin: 3px 0 6px; line-height: 1.5; }
        .wz-task-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .wz-tag {
          font-size: 10px; font-weight: 700; border-radius: 20px; padding: 2px 10px;
          border: 1px solid transparent;
        }
        .wz-tag-blue { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
        .wz-tag-green { color: #16a34a; background: #f0fdf4; border-color: #bbf7d0; }
        .wz-progress-bar-bg { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; width: 100%; }
        .wz-progress-bar-fill { height: 100%; background: linear-gradient(90deg, ${ORANGE}, #ff9a5c); border-radius: 999px; transition: width 0.4s; }
        .wz-status-badge {
          display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 12px; font-weight: 700;
          padding: 7px 12px; border-radius: 10px; white-space: nowrap; width: 100%; letter-spacing: 0.3px;
        }
        .wz-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Stepper */
        .wz-stepper {
          display: flex; align-items: flex-start;
          overflow-x: auto; scrollbar-width: none;
          padding: 2px 0 6px 0; gap: 0;
        }
        .wz-stepper::-webkit-scrollbar { display: none; }
        .wz-stepper-line {
          flex: 1; height: 2px; background: #e2e8f0;
          margin-top: 14px; min-width: 24px;
          transition: background 0.3s; flex-shrink: 1;
        }
        .wz-stepper-line.done { background: #22c55e; }
        .wz-stepper-line.active { background: linear-gradient(90deg, #22c55e, ${ORANGE}); }
        .wz-step-col {
          display: flex; flex-direction: column; align-items: center;
          gap: 5px; flex-shrink: 0; min-width: 88px;
        }
        .wz-step-node {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0; transition: all 0.25s;
        }
        .wz-step-node.done { background: #22c55e; color: #fff; }
        .wz-step-node.active { background: ${ORANGE}; color: #fff; box-shadow: 0 0 0 5px rgba(255,107,53,0.15); }
        .wz-step-node.pending { background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0; }
        .wz-step-lbl {
          font-size: 12px; font-weight: 700; color: #94a3b8;
          white-space: nowrap; transition: color 0.2s; text-align: center;
        }
        .wz-step-lbl.active { color: ${ORANGE}; }
        .wz-step-lbl.done { color: #0f172a; }
        .wz-step-sub {
          font-size: 11px; color: #cbd5e1; white-space: nowrap;
          font-weight: 500; text-align: center;
        }
        .wz-step-sub.active { color: ${ORANGE}; }
        .wz-step-sub.done { color: #22c55e; }

        /* Body */
        .wz-body { flex: 1; overflow: hidden; padding: 12px 24px 16px; }
        .wz-content-grid {
          height: 100%; display: grid;
          grid-template-columns: 1fr 220px;
          gap: 12px; overflow: hidden;
        }

        /* Left panel — scroll wrapper only, no padding */
        .wz-left-panel {
          overflow-y: auto; overflow-x: hidden; padding: 0;
          height: 100%;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .wz-left-panel::-webkit-scrollbar { width: 4px; }
        .wz-left-panel::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
        /* Inner card matches Submission Flow box */
        .wz-left-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 8px 20px 20px; box-sizing: border-box;
        }

        /* Task detail content */
        .wz-content-block { margin-bottom: 0; padding-bottom: 14px; padding-top: 14px; border-bottom: 1px solid #f1f5f9; }
        .wz-content-block:first-child { padding-top: 4px; }
        .wz-content-block:last-child { border-bottom: none; padding-bottom: 0; }
        .wz-content-heading {
          display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800;
          letter-spacing: 0.4px; text-transform: uppercase; color: ${ORANGE}; margin-bottom: 12px;
          padding-left: 10px; border-left: 3px solid ${ORANGE};
        }
        .wz-ch-icon { color: ${ORANGE}; font-size: 13px; }
        .wz-rich { font-size: 13px; color: #374151; line-height: 1.75; word-break: break-word; }
        .wz-rich p { margin-bottom: 6px; }
        .wz-rich ul, .wz-rich ol { padding-left: 20px; }
        .wz-rich li { margin-bottom: 3px; }
        .wz-rich strong { color: #0f172a; }
        .wz-rich a { color: ${ORANGE}; }
        .wz-rich h1,.wz-rich h2,.wz-rich h3 { color: #0f172a; margin-bottom: 6px; }

        /* Submit panel */
        .wz-submit-panel { display: flex; flex-direction: column; gap: 18px; }
        .wz-submit-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .wz-submit-subtitle { font-size: 12px; color: #64748b; margin-top: -10px; }
        .wz-alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; }
        .wz-alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .wz-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
        .wz-info-banner {
          display: flex; gap: 10px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 12px 14px;
        }
        .wz-info-banner strong { font-size: 12px; color: #5b21b6; display: block; margin-bottom: 3px; }
        .wz-info-banner p { font-size: 11px; color: #7c3aed; margin: 0; line-height: 1.5; }
        .wz-field { display: flex; flex-direction: column; gap: 6px; }
        .wz-label { font-size: 12px; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 4px; }
        .wz-required { color: #ef4444; }
        .wz-input-wrap { position: relative; }
        .wz-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 13px; }
        .wz-input {
          width: 100%; padding: 9px 12px 9px 36px; border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 13px; color: #0f172a; background: #fff; outline: none; transition: border-color 0.18s;
        }
        .wz-input:focus { border-color: ${ORANGE}; }
        .wz-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .wz-input::placeholder { color: #cbd5e1; }
        .wz-drop-zone {
          border: 2px dashed #cbd5e1; border-radius: 10px; background: #f8fafc;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 28px 16px; gap: 6px; cursor: pointer; transition: all 0.18s; text-align: center;
        }
        .wz-drop-zone:hover:not(.disabled) { border-color: ${ORANGE}; background: #fff8f5; }
        .wz-drop-zone.dragging { border-color: ${ORANGE}; background: #fff8f5; }
        .wz-drop-zone.disabled { cursor: not-allowed; opacity: 0.6; }
        .wz-drop-icon { font-size: 24px; color: #94a3b8; }
        .wz-drop-text { font-size: 13px; font-weight: 600; color: #374151; }
        .wz-drop-hint { font-size: 11px; color: #94a3b8; }
        .wz-file-list { border: 1px solid #e2e8f0; border-radius: 9px; overflow: hidden; background: #fff; }
        .wz-file-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 14px;
          border-bottom: 1px solid #f1f5f9; font-size: 12px; cursor: default;
        }
        .wz-file-item:last-child { border-bottom: none; }
        .wz-file-name { flex: 1; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wz-file-size { color: #94a3b8; font-size: 11px; white-space: nowrap; }
        .wz-file-remove {
          background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 3px 5px;
          border-radius: 4px; transition: all 0.15s; font-size: 11px;
        }
        .wz-file-remove:hover { color: #ef4444; background: #fef2f2; }
        .wz-prev-files { border: 1px solid #e2e8f0; border-radius: 9px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 8px; }
        .wz-prev-title { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .wz-replace-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; cursor: pointer; }
        .wz-file-note { font-size: 11px; color: #94a3b8; }
        .wz-textarea {
          width: 100%; padding: 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 13px; color: #0f172a; background: #fff; outline: none; resize: vertical;
          transition: border-color 0.18s; font-family: inherit; line-height: 1.6;
        }
        .wz-textarea:focus { border-color: ${ORANGE}; }
        .wz-textarea:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .wz-textarea::placeholder { color: #cbd5e1; }
        .wz-feedback-banner { border-radius: 9px; padding: 12px 14px; }
        .wz-feedback-banner.approved { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .wz-feedback-banner.rejected { background: #fef2f2; border: 1px solid #fecaca; }
        .wz-fb-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
        .wz-feedback-banner.approved .wz-fb-label { color: #16a34a; }
        .wz-feedback-banner.rejected .wz-fb-label { color: #dc2626; }
        .wz-feedback-banner p { font-size: 12px; color: #374151; margin: 0; line-height: 1.5; }
        .wz-submit-actions { display: flex; gap: 10px; align-items: center; }
        .wz-btn-cancel {
          background: #fff; border: 1.5px solid #e2e8f0; color: #374151;
          border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.18s;
        }
        .wz-btn-cancel:hover { border-color: #94a3b8; }
        .wz-btn-submit {
          flex: 1; background: ${ORANGE}; border: none; color: #fff;
          border-radius: 8px; padding: 10px 24px; font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .wz-btn-submit:hover:not(:disabled) { background: #f05a22; box-shadow: 0 4px 14px rgba(255,107,53,0.3); }
        .wz-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .wz-locked-notice { flex: 1; background: #f5f3ff; border: 1px solid #ddd6fe; color: #7c3aed; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
        .wz-review-note {
          display: flex; align-items: center; gap: 8px; background: #f5f3ff; border: 1px solid #ddd6fe;
          border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #5b21b6; font-weight: 500;
        }

        /* Review cycle */
        .wz-cycle-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .wz-cycle-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
        .wz-cycle-steps { display: flex; align-items: flex-start; gap: 0; flex-wrap: wrap; }
        .wz-cycle-step { display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; min-width: 80px; position: relative; }
        .wz-cycle-icon-wrap {
          width: 36px; height: 36px; border-radius: 9px; background: #f1f5f9; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
        }
        .wz-cycle-label { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 3px; }
        .wz-cycle-desc { font-size: 10px; color: #94a3b8; line-height: 1.4; }
        .wz-cycle-arrow {
          position: absolute; right: -8px; top: 10px; font-size: 14px; color: #cbd5e1; font-weight: 700;
        }

        /* Sidebar */
        .wz-sidebar {
          background: #f1f5f9; border-left: none; padding: 0; overflow-y: auto;
          height: 100%;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .wz-sidebar::-webkit-scrollbar { width: 3px; }
        .wz-sidebar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
        .wz-sb-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
        .wz-sb-card-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 10px; }
        .wz-sb-date-row { display: flex; align-items: flex-start; gap: 10px; }
        .wz-sb-date-icon-wrap {
          width: 28px; height: 28px; border-radius: 7px; background: #fff; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
        }
        .wz-sb-date-key { font-size: 11px; color: #94a3b8; font-weight: 600; }
        .wz-sb-date-val { font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px; }

        /* Timeline */
        .wz-timeline { display: flex; flex-direction: column; }
        .wz-tl-item { display: flex; gap: 10px; }
        .wz-tl-spine { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 18px; }
        .wz-tl-dot {
          width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 8px; flex-shrink: 0; transition: all 0.25s;
        }
        .wz-tl-dot.done { background: #22c55e; color: #fff; }
        .wz-tl-dot.active { background: #3b82f6; color: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
        .wz-tl-dot.pending { background: #f1f5f9; border: 1.5px solid #e2e8f0; }
        .wz-tl-line { width: 2px; flex: 1; min-height: 20px; background: #e2e8f0; margin: 2px 0; transition: background 0.25s; border-radius: 1px; }
        .wz-tl-line.done { background: #22c55e; }
        .wz-tl-content { padding: 0 0 14px 0; }
        .wz-tl-label { font-size: 12px; font-weight: 700; display: block; transition: color 0.25s; }
        .wz-tl-label.active { color: #3b82f6; }
        .wz-tl-label.done { color: #0f172a; }
        .wz-tl-label.pending { color: #94a3b8; }
        .wz-tl-sub { font-size: 10px; color: #94a3b8; display: block; margin-top: 2px; line-height: 1.4; }
        .wz-tl-sub.active { color: #3b82f6; }
        .wz-tl-sub.done { color: #64748b; }
        .wz-view-details-btn {
          display: inline-flex; align-items: center; gap: 6px; background: none; border: none;
          color: ${ORANGE}; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0; transition: gap 0.15s;
        }
        .wz-view-details-btn:hover { gap: 10px; }
        .wz-help-card { background: #fff8f5; border-color: rgba(255,107,53,0.2); }
        .wz-help-text { font-size: 11px; color: #64748b; line-height: 1.5; margin: 0 0 10px 0; }
        .wz-ask-mentor-btn {
          background: ${ORANGE}; border: none; color: #fff; border-radius: 7px;
          padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.18s; width: 100%;
        }
        .wz-ask-mentor-btn:hover { background: #f05a22; }

        /* Footer */
        .wz-footer {
          background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 10px 24px; flex-shrink: 0;
          display: flex; justify-content: space-between; align-items: center;
        }
        .wz-footer-right { display: flex; gap: 10px; }
        .wz-btn-ghost {
          background: transparent; border: none; color: #64748b;
          border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: color 0.15s;
        }
        .wz-btn-ghost:hover { color: #0f172a; }
        .wz-btn-continue {
          background: ${ORANGE}; border: none; color: #fff; border-radius: 8px;
          padding: 9px 24px; font-size: 13px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: all 0.18s; white-space: nowrap;
        }
        .wz-btn-continue:hover:not(:disabled) { background: #f05a22; box-shadow: 0 4px 14px rgba(255,107,53,0.3); }
        .wz-btn-continue:disabled { opacity: 0.55; cursor: not-allowed; }

        @media (max-width: 768px) {
          .wz-modal { border-radius: 0; height: 100%; }
          .wz-body { padding: 0 12px; }
          .wz-content-grid { grid-template-columns: 1fr; gap: 0; }
          .wz-sidebar { border-top: 1px solid #e2e8f0; max-height: 280px; padding: 12px 0; }
          .wz-header-main { flex-direction: column; }
          .wz-header-right-card { width: 100%; }
          .wz-title-right { width: 100%; justify-content: space-between; }
          .wz-cycle-arrow { display: none; }
        }
        @media (max-width: 480px) {
          .wz-step-lbl, .wz-step-sub { display: none; }
          .wz-header { padding: 12px 16px 0; }
          .wz-left-panel { padding: 14px 16px; }
        }
      `}</style>
    </div>
  )
}

export default StudentTaskSubmissionWizard
