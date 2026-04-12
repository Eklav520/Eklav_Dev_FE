// StudentTaskSubmissionWizard.tsx  –  Simple status-driven task workspace
import { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'

// ─── Types ────────────────────────────────────────────────────────────────────

type Attachment = { fileName?: string; fileUrl?: string }

type SubmissionState = {
  _id?: string
  codeLink?: string
  codeDescription?: string
  attachments?: Attachment[]
  status?: 'pending' | 'completed'
  adminReviewStatus?: 'pending' | 'approved' | 'rejected'
  adminFeedback?: string
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const isPast = (d?: string | null) => !!d && new Date(d) < new Date()

// ─── Conversation thread helpers ──────────────────────────────────────────────

type ThreadMsg = { role: 'student' | 'admin'; text: string; ts: Date | null; idx: number }
type ThreadChain = { student: ThreadMsg; admin: ThreadMsg | null }

const SEP_STUDENT = /===STUDENT\[(\d+)\]:([^=]*)===\n?/
const SEP_ADMIN   = /===ADMIN\[(\d+)\]:([^=]*)===\n?/

const parseField = (str: string | undefined, role: 'student' | 'admin'): ThreadMsg[] => {
  if (!str?.trim()) return []
  const sep = role === 'student' ? SEP_STUDENT : SEP_ADMIN
  const parts = str.split(new RegExp(sep.source, 'g'))
  const result: ThreadMsg[] = []
  if (parts[0].trim()) result.push({ role, text: parts[0].trim(), ts: null, idx: 0 })
  for (let i = 1; i < parts.length; i += 3) {
    const idx = parseInt(parts[i], 10)
    const tsStr = parts[i + 1]
    const text = (parts[i + 2] || '').trim()
    if (!isNaN(idx) && text) result.push({ role, text, ts: new Date(tsStr), idx })
  }
  return result
}

/** Group messages into chains: each student message paired with its admin reply (if any) */
const buildThread = (codeDesc?: string, adminFeedback?: string): ThreadChain[] => {
  const students = parseField(codeDesc, 'student')
  const admins = parseField(adminFeedback, 'admin')
  const adminMap = new Map(admins.map((a) => [a.idx, a]))
  return students.map((s) => ({
    student: s,
    admin: adminMap.get(s.idx) || null,
  }))
}

const fmtTs = (ts: Date | null) => {
  if (!ts || isNaN(ts.getTime())) return ''
  return ts.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Component ────────────────────────────────────────────────────────────────

const StudentTaskSubmissionWizard = ({
  show,
  onHide,
  task,
  token,
  baseURL,
  onSubmitted,
}: Props) => {
  const sub = task?.mySubmission

  type Stage = 'draft' | 'under_review' | 'approved' | 'rejected'
  const serverStage: Stage =
    !sub || sub.status === 'pending'
      ? 'draft'
      : sub.adminReviewStatus === 'approved'
      ? 'approved'
      : sub.adminReviewStatus === 'rejected'
      ? 'rejected'
      : 'under_review'

  const [justSubmitted, setJustSubmitted] = useState(false)
  const stage: Stage = justSubmitted ? 'under_review' : serverStage

  const [codeLink, setCodeLink] = useState('')
  const [notes, setNotes] = useState('')
  const [replyToAdmin, setReplyToAdmin] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) {
      setCodeLink(sub?.codeLink || '')
      setNotes('')           // always empty — history shown in thread panel
      setReplyToAdmin('')
      setFiles([])
      setError('')
      setJustSubmitted(false)
    }
  }, [show, task?._id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => {
      const merged = [...prev]
      selected.forEach((f) => {
        if (!merged.some((x) => x.name === f.name && x.size === f.size)) merged.push(f)
      })
      return merged
    })
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!task?._id || !token) return
    if (!codeLink.trim()) {
      setError('Please enter your GitHub or Drive link.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('codeLink', codeLink.trim())

      // Build this message entry (notes + optional reply)
      let newEntry = notes.trim()
      if (replyToAdmin.trim()) newEntry += `\n\n[Reply to admin]: ${replyToAdmin.trim()}`

      // Append to existing conversation history when resubmitting
      const existingDesc = sub?.codeDescription || ''
      let appendedDesc: string
      if (stage === 'rejected' && existingDesc) {
        // Count existing student messages to get next index
        const existingStudents = (existingDesc.match(/===STUDENT\[(\d+)\]:/g) || []).length
        const nextIdx = existingStudents
        const ts = new Date().toISOString()
        appendedDesc = `${existingDesc}\n===STUDENT[${nextIdx}]:${ts}===\n${newEntry}`
      } else {
        const ts = new Date().toISOString()
        appendedDesc = `===STUDENT[0]:${ts}===\n${newEntry}`
      }

      fd.append('codeDescription', appendedDesc)
      fd.append('replaceAttachments', files.length > 0 ? 'true' : 'false')
      files.forEach((f) => fd.append('attachments', f))
      const res = await fetch(
        `${baseURL}/api/student/freelancing/tasks/${task._id}/submission`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Submission failed')
      setJustSubmitted(true)
      await onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const doneUpTo =
    stage === 'draft' ? 0 :
    stage === 'under_review' ? 2 :
    stage === 'approved' ? 4 :
    1

  const STEPS = ['Applied', 'Work Submitted', 'Under Review', 'Completed']

  const dotState = (i: number): 'done' | 'warn' | 'active' | 'idle' => {
    if (stage === 'rejected' && i === 2) return 'warn'
    if (i < doneUpTo) return 'done'
    if (i === doneUpTo - 1 && stage !== 'approved') return 'active'
    return 'idle'
  }

  const dotLabel = (i: number) => {
    const s = dotState(i)
    if (s === 'done') return '✓'
    if (s === 'warn') return '!'
    return String(i + 1)
  }

  return (
    <Modal show={show} onHide={onHide} fullscreen centered className="stw-modal">
      <Modal.Header closeButton className="stw-mh">
        <div className="stw-title-row">
          <h5 className="stw-task-name">{task?.title || 'Task'}</h5>
          <span className={`stw-status-pill pill-${stage}`}>
            {stage === 'draft' && '📝 Not Submitted'}
            {stage === 'under_review' && '🕐 Under Review'}
            {stage === 'approved' && '✅ Approved'}
            {stage === 'rejected' && '🔄 Needs Revision'}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body className="stw-body">
        {!task ? (
          <p className="stw-empty">Task not found.</p>
        ) : (
          <>
            {/* Progress Track */}
            <div className="stw-progress-wrap">
              <div className="stw-track">
                {STEPS.map((label, i) => (
                  <div key={label} className="stw-track-step">
                    <div className={`stw-dot dot-${dotState(i)}`}>{dotLabel(i)}</div>
                    <span className={`stw-dot-label ${dotState(i) !== 'idle' ? 'active-lbl' : ''}`}>
                      {label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className={`stw-line ${i < doneUpTo - 1 ? 'line-done' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="stw-alert err">❌  {error}</div>}

            {/* Two-column layout */}
            <div className="stw-two-col-wrapper">
              {/* LEFT COLUMN: Submission Form + Metadata */}
              <div className="stw-col-left">
                {/* Metadata Cards */}
                <div className="stw-metadata-stack">
                  {task.amount && (
                    <div className="stw-meta-card">
                      <span className="meta-icon">💰</span>
                      <div className="meta-content">
                        <span className="meta-label">Budget</span>
                        <span className="meta-value orange">₹{task.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <div className="stw-meta-card">
                    <span className="meta-icon">⏰</span>
                    <div className="meta-content">
                      <span className="meta-label">Deadline</span>
                      <span className={`meta-value ${isPast(task.deadline) ? 'red' : ''}`}>
                        {fmtDate(task.deadline)}{isPast(task.deadline) ? ' (Passed)' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Form - Draft Stage */}
                {stage === 'draft' && (
                  <div className="stw-card submit-card">
                    <h6 className="stw-card-title">📎 Submit Your Work</h6>
                    <p className="stw-card-hint">
                      Push your code to GitHub (or upload to Drive) and paste the link below.
                    </p>
                    <Form.Group className="stw-field">
                      <Form.Label className="stw-label">
                        GitHub / Drive Link <span className="req">*</span>
                      </Form.Label>
                      <Form.Control
                        type="url"
                        value={codeLink}
                        onChange={(e) => setCodeLink(e.target.value)}
                        placeholder="https://github.com/yourname/repo-name"
                        className="stw-input"
                      />
                    </Form.Group>
                    <Form.Group className="stw-field">
                      <Form.Label className="stw-label">Submission Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Briefly explain what you built, your approach, or anything the reviewer should know…"
                        className="stw-input"
                      />
                    </Form.Group>
                    <div className="stw-field">
                      <label className="stw-label">
                        Attach Files <span className="stw-optional">(optional)</span>
                      </label>
                      <div className="stw-drop-zone" onClick={() => fileRef.current?.click()}>
                        <span>📁 Click to select files</span>
                        <small>.zip · .pdf · .png · .jpg · .docx — max 10 MB each</small>
                      </div>
                      <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange}
                        accept=".zip,.rar,.7z,.pdf,.doc,.docx,.png,.jpg,.jpeg" />
                      {files.length > 0 && (
                        <div className="stw-file-list">
                          {files.map((f, i) => (
                            <div key={i} className="stw-file-row">
                              <span>📎 {f.name} <small className="stw-fsize">({(f.size / 1024).toFixed(0)} KB)</small></span>
                              <button className="stw-rm" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button className="stw-submit-btn" onClick={handleSubmit} disabled={submitting}>
                      {submitting
                        ? <><Spinner size="sm" className="me-2" />Submitting…</>
                        : '🚀 Submit for Review'}
                    </Button>
                  </div>
                )}

                {/* Resubmit Form - Rejected Stage */}
                {stage === 'rejected' && (() => {
                  return (
                    <div className="stw-card submit-card">
                      <div className="stw-update-form-header">
                        <span className="stw-update-icon">✏️</span>
                        <div>
                          <h6 className="stw-card-title" style={{ margin: 0 }}>Your Updated Work</h6>
                          <p className="stw-card-hint" style={{ margin: '0.2rem 0 0' }}>
                            Fix the issues and resubmit.
                          </p>
                        </div>
                      </div>

                      <Form.Group className="stw-field">
                        <Form.Label className="stw-label">
                          Updated GitHub / Drive Link <span className="req">*</span>
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={codeLink}
                          onChange={(e) => setCodeLink(e.target.value)}
                          placeholder="https://github.com/yourname/repo-name"
                          className="stw-input"
                        />
                      </Form.Group>

                      <Form.Group className="stw-field">
                        <Form.Label className="stw-label">What You Changed</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Describe each change you made…"
                          className="stw-input"
                        />
                      </Form.Group>

                      <Form.Group className="stw-field">
                        <Form.Label className="stw-label">
                          💬 Reply to Admin
                          <span className="stw-optional"> — questions or clarifications</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={replyToAdmin}
                          onChange={(e) => setReplyToAdmin(e.target.value)}
                          placeholder={`e.g. "I fixed point 1 and 2. For point 3, I did X instead because…"`}
                          className="stw-input"
                        />
                      </Form.Group>

                      <div className="stw-field">
                        <label className="stw-label">
                          Upload New Files <span className="stw-optional">(optional – replaces previous)</span>
                        </label>
                        <div className="stw-drop-zone" onClick={() => fileRef.current?.click()}>
                          <span>📁 Click to select files</span>
                          <small>.zip · .pdf · .png · .jpg · .docx — max 10 MB each</small>
                        </div>
                        <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange}
                          accept=".zip,.rar,.7z,.pdf,.doc,.docx,.png,.jpg,.jpeg" />
                        {files.length > 0 && (
                          <div className="stw-file-list">
                            {files.map((f, i) => (
                              <div key={i} className="stw-file-row">
                                <span>📎 {f.name} <small className="stw-fsize">({(f.size / 1024).toFixed(0)} KB)</small></span>
                                <button className="stw-rm" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button className="stw-submit-btn resubmit" onClick={handleSubmit} disabled={submitting}>
                        {submitting
                          ? <><Spinner size="sm" className="me-2" />Sending updates…</>
                          : '📤 Resubmit for Review'}
                      </Button>
                    </div>
                  )
                })()}

                {/* Status for Under Review and Approved */}
                {(stage === 'under_review' || stage === 'approved') && (
                  <div className="stw-card status-card">
                    {stage === 'under_review' && (
                      <div className="stw-waiting-banner">
                        <span className="stw-waiting-icon">⏳</span>
                        <div>
                          <h5>Under Review</h5>
                          <p>The admin is reviewing your work.</p>
                        </div>
                      </div>
                    )}
                    {stage === 'approved' && (
                      <div className="stw-approved-banner">
                        <span className="stw-big-icon">🎉</span>
                        <div>
                          <h4>Approved!</h4>
                          <p>Great work! Your submission has been approved.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Task Details + Conversation */}
              <div className="stw-col-right">
                {/* Task Details Card */}
                <div className="stw-details-card">
                  {task.description && (
                    <div className="stw-detail-section">
                      <h6 className="stw-detail-title">📝 Description</h6>
                      <div className="stw-detail-content" dangerouslySetInnerHTML={{ __html: task.description }} />
                    </div>
                  )}
                  {task.acceptanceCriteria && (
                    <div className="stw-detail-section">
                      <h6 className="stw-detail-title">✅ Acceptance Criteria</h6>
                      <div className="stw-detail-content" dangerouslySetInnerHTML={{ __html: task.acceptanceCriteria }} />
                    </div>
                  )}
                  {task.highlights && (
                    <div className="stw-detail-section">
                      <h6 className="stw-detail-title">⭐ Highlights</h6>
                      <div className="stw-detail-content" dangerouslySetInnerHTML={{ __html: task.highlights }} />
                    </div>
                  )}
                  {task.terms && (
                    <div className="stw-detail-section">
                      <h6 className="stw-detail-title">📋 Terms & Conditions</h6>
                      <div className="stw-detail-content" dangerouslySetInnerHTML={{ __html: task.terms }} />
                    </div>
                  )}
                </div>

                {/* Conversation Thread */}
                <div className="stw-convo-section">
                  {/* Draft: Show submission preview */}
                  {stage === 'draft' && (
                    <div className="stw-draft-preview">
                      <span className="preview-icon">👀</span>
                      <p>Your submission will appear here once you submit.</p>
                    </div>
                  )}

                  {/* Under Review: Show conversation */}
                  {stage === 'under_review' && (() => {
                    const chains = buildThread(sub?.codeDescription, sub?.adminFeedback)
                    return (
                      <>
                        {sub?.codeLink && (
                          <div className="stw-link-row">
                            <span className="stw-link-label">🔗 Your Submission</span>
                            <a href={sub.codeLink} target="_blank" rel="noreferrer" className="stw-link">{sub.codeLink}</a>
                          </div>
                        )}
                        {chains.length > 0 ? (
                          <div className="stw-thread">
                            <div className="stw-thread-label">💬 Conversation</div>
                            {chains.map((chain, i) => (
                              <div key={i} className="stw-chain">
                                <div className="stw-bubble stw-bubble-student">
                                  <div className="stw-bubble-header">
                                    <span className="stw-bubble-role">🧑‍💻 You</span>
                                    {chain.student.ts && <span className="stw-bubble-time">{fmtTs(chain.student.ts)}</span>}
                                  </div>
                                  <p className="stw-bubble-text">{chain.student.text}</p>
                                </div>
                                {chain.admin && (
                                  <div className="stw-bubble stw-bubble-admin stw-admin-reply">
                                    <div className="stw-bubble-header">
                                      <span className="stw-bubble-role">👨‍💼 Admin</span>
                                      {chain.admin.ts && <span className="stw-bubble-time">{fmtTs(chain.admin.ts)}</span>}
                                    </div>
                                    <p className="stw-bubble-text">{chain.admin.text}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {(sub?.attachments?.length ?? 0) > 0 && (
                          <div className="stw-att-list">
                            <strong>Uploaded Files:</strong>
                            {sub!.attachments!.map((a, i) => (
                              <a key={i} href={a.fileUrl} target="_blank" rel="noreferrer" className="stw-att-link">
                                📄 {a.fileName || `File ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {/* Approved: Show full conversation */}
                  {stage === 'approved' && (() => {
                    const chains = buildThread(sub?.codeDescription, sub?.adminFeedback)
                    return (
                      <>
                        {sub?.codeLink && (
                          <div className="stw-link-row">
                            <span className="stw-link-label">🔗 Your Submission</span>
                            <a href={sub.codeLink} target="_blank" rel="noreferrer" className="stw-link">{sub.codeLink}</a>
                          </div>
                        )}
                        {chains.length > 0 ? (
                          <div className="stw-thread">
                            <div className="stw-thread-label">💬 Full Conversation</div>
                            {chains.map((chain, i) => (
                              <div key={i} className="stw-chain">
                                <div className="stw-bubble stw-bubble-student">
                                  <div className="stw-bubble-header">
                                    <span className="stw-bubble-role">🧑‍💻 You</span>
                                    {chain.student.ts && <span className="stw-bubble-time">{fmtTs(chain.student.ts)}</span>}
                                  </div>
                                  <p className="stw-bubble-text">{chain.student.text}</p>
                                </div>
                                {chain.admin && (
                                  <div className="stw-bubble stw-bubble-admin stw-admin-reply">
                                    <div className="stw-bubble-header">
                                      <span className="stw-bubble-role">👨‍💼 Admin</span>
                                      {chain.admin.ts && <span className="stw-bubble-time">{fmtTs(chain.admin.ts)}</span>}
                                    </div>
                                    <p className="stw-bubble-text">{chain.admin.text}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )
                  })()}

                  {/* Rejected: Show conversation */}
                  {stage === 'rejected' && (() => {
                    const chains = buildThread(sub?.codeDescription, sub?.adminFeedback)
                    return (
                      <div className="stw-revision-section">
                        <div className="stw-revision-header">
                          <div className="stw-revision-badge">🔄 Needs Revision</div>
                          <p className="stw-revision-hint">
                            Review the admin's feedback and resubmit on the left.
                          </p>
                        </div>
                        {chains.length > 0 ? (
                          <div className="stw-thread">
                            <div className="stw-thread-label">💬 Conversation History</div>
                            {chains.map((chain, i) => (
                              <div key={i} className="stw-chain">
                                <div className="stw-bubble stw-bubble-student">
                                  <div className="stw-bubble-header">
                                    <span className="stw-bubble-role">🧑‍💻 You</span>
                                    {chain.student.ts && <span className="stw-bubble-time">{fmtTs(chain.student.ts)}</span>}
                                  </div>
                                  <p className="stw-bubble-text">{chain.student.text}</p>
                                </div>
                                {chain.admin && (
                                  <div className="stw-bubble stw-bubble-admin stw-admin-reply">
                                    <div className="stw-bubble-header">
                                      <span className="stw-bubble-role">👨‍💼 Admin</span>
                                      {chain.admin.ts && <span className="stw-bubble-time">{fmtTs(chain.admin.ts)}</span>}
                                    </div>
                                    <p className="stw-bubble-text">{chain.admin.text}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="stw-footer">
        <Button variant="outline-light" className="stw-close-btn" onClick={onHide}>Close</Button>
      </Modal.Footer>

      <style>{`
        .stw-modal .modal-content {
          background: #050505;
          border: none;
          color: #fff;
        }
        .stw-mh {
          background: #0a0a0a;
          border-bottom: 2px solid #ff6b35;
          padding: 1rem 1.5rem;
        }
        .stw-mh .btn-close { filter: invert(1) brightness(0.7); }
        .stw-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          width: 100%;
        }
        .stw-task-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ff6b35;
          margin: 0;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stw-status-pill {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pill-draft        { background: rgba(255,193,7,0.15);  color: #ffd460; border: 1px solid rgba(255,193,7,0.4); }
        .pill-under_review { background: rgba(33,150,243,0.15); color: #64b5f6; border: 1px solid rgba(33,150,243,0.4); }
        .pill-approved     { background: rgba(40,167,69,0.15);  color: #4ad46d; border: 1px solid rgba(40,167,69,0.4); }
        .pill-rejected     { background: rgba(255,107,53,0.15); color: #ff8c5a; border: 1px solid rgba(255,107,53,0.4); }
        .stw-body { padding: 1.25rem 1.5rem; overflow-y: auto; }
        .stw-footer {
          background: #0a0a0a;
          border-top: 1px solid #1a1a1a;
          padding: 0.9rem 1.5rem;
        }
        .stw-close-btn {
          border-color: #444;
          color: #bbb;
          font-size: 0.85rem;
          padding: 0.4rem 1.2rem;
          border-radius: 8px;
        }
        .stw-close-btn:hover { border-color: #ff6b35; color: #ff6b35; background: transparent; }
        .stw-empty { color: #666; text-align: center; padding: 3rem; }

        /* Progress */
        .stw-progress-wrap {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 1rem 1.25rem 0.5rem;
          margin-bottom: 1.25rem;
        }
        .stw-track { display: flex; align-items: flex-start; }
        .stw-track-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        .stw-line {
          position: absolute;
          top: 16px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #2a2a2a;
          z-index: 0;
        }
        .stw-line.line-done { background: #28a745; }
        .stw-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          border: 2px solid #2a2a2a;
          background: #111;
          color: #555;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .dot-done   { background: #28a745 !important; border-color: #28a745 !important; color: #fff !important; }
        .dot-active { background: #ff6b35 !important; border-color: #ff6b35 !important; color: #fff !important;
                      box-shadow: 0 0 12px rgba(255,107,53,0.4); }
        .dot-warn   { background: #ffc107 !important; border-color: #ffc107 !important; color: #000 !important; }
        .stw-dot-label {
          font-size: 0.65rem;
          color: #555;
          text-align: center;
          margin-top: 0.4rem;
          line-height: 1.2;
          padding: 0 2px;
        }
        .stw-dot-label.active-lbl { color: #ccc; }

        /* Chips */
        .stw-chips { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
        .stw-chip {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
          padding: 0.5rem 0.9rem;
          min-width: 110px;
        }
        .chip-lbl { font-size: 0.68rem; color: #666; }
        .chip-val { font-size: 0.9rem; font-weight: 600; color: #ccc; }
        .chip-val.orange { color: #ff6b35; }
        .chip-val.red    { color: #ff6060; }

        /* Alert */
        .stw-alert { padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1rem; }
        .stw-alert.err { background: rgba(220,53,69,0.1); border: 1px solid #dc3545; color: #ff7b7b; }

        /* Card */
        .stw-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .stw-card-title { font-size: 0.95rem; font-weight: 600; color: #ff6b35; margin-bottom: 0.4rem; }
        .stw-card-hint { font-size: 0.82rem; color: #888; margin-bottom: 1.25rem; line-height: 1.5; }

        /* Fields */
        .stw-field { margin-bottom: 1.1rem; }
        .stw-label { display: block; font-size: 0.85rem; font-weight: 500; color: #bbb; margin-bottom: 0.4rem; }
        .stw-optional { color: #555; font-weight: 400; font-size: 0.78rem; }
        .req { color: #ff6b35; }
        .stw-input {
          background: #111 !important;
          border: 1px solid #2a2a2a !important;
          color: #fff !important;
          border-radius: 10px !important;
          font-size: 0.88rem !important;
          transition: border-color 0.2s;
        }
        .stw-input:focus {
          border-color: #ff6b35 !important;
          box-shadow: 0 0 0 3px rgba(255,107,53,0.15) !important;
          background: #111 !important;
          color: #fff !important;
        }
        .stw-input::placeholder { color: #444 !important; }

        /* File drop */
        .stw-drop-zone {
          background: #0d0d0d;
          border: 1.5px dashed #2a2a2a;
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          color: #777;
          font-size: 0.85rem;
        }
        .stw-drop-zone:hover { border-color: #ff6b35; color: #ff9060; }
        .stw-drop-zone small { font-size: 0.75rem; color: #555; }
        .stw-file-list { margin-top: 0.6rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .stw-file-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
          font-size: 0.82rem;
          color: #ccc;
        }
        .stw-fsize { color: #555; margin-left: 0.3rem; }
        .stw-rm { background: none; border: none; color: #666; font-size: 0.8rem; cursor: pointer; padding: 0 0.3rem; transition: color 0.2s; }
        .stw-rm:hover { color: #ff6060; }

        /* Submit btn */
        .stw-submit-btn {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.92rem;
          font-weight: 600;
          border-radius: 10px;
          background: linear-gradient(135deg, #ff6b35, #ff9a5c) !important;
          border: none !important;
          color: #fff !important;
          margin-top: 0.5rem;
          transition: opacity 0.2s;
        }
        .stw-submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .stw-submit-btn:disabled { opacity: 0.55; }
        .stw-submit-btn.resubmit { background: linear-gradient(135deg, #1976d2, #42a5f5) !important; }

        /* Waiting banner */
        .stw-waiting-banner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(33,150,243,0.08);
          border: 1px solid rgba(33,150,243,0.25);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .stw-waiting-icon { font-size: 2rem; flex-shrink: 0; }

          /* ── Conversation Thread with Nested Replies ── */
          .stw-thread {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1rem;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 0.5rem;
          }
          .stw-thread::-webkit-scrollbar { width: 5px; }
          .stw-thread::-webkit-scrollbar-track { background: transparent; }
          .stw-thread::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
          .stw-thread::-webkit-scrollbar-thumb:hover { background: #444; }
          .stw-thread-label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #555;
            margin-bottom: 0.25rem;
          }
          .stw-chain {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .stw-bubble {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            gap: 0.2rem;
          }
          .stw-bubble-student { align-self: flex-start; align-items: flex-start; }
          .stw-bubble-admin   { align-self: flex-start; align-items: flex-start; }
          .stw-admin-reply {
            margin-left: 2.5rem;
            opacity: 0.95;
          }
          .stw-bubble-header {
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          .stw-bubble-role { font-size: 0.7rem; font-weight: 600; }
          .stw-bubble-student .stw-bubble-role { color: #ff9a5c; }
          .stw-bubble-admin   .stw-bubble-role { color: #64b5f6; }
          .stw-bubble-time { font-size: 0.62rem; color: #555; }
          .stw-bubble-text {
            margin: 0;
            font-size: 0.83rem;
            line-height: 1.55;
            padding: 0.6rem 0.85rem;
            border-radius: 12px;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .stw-bubble-student .stw-bubble-text {
            background: rgba(255,107,53,0.12);
            border: 1px solid rgba(255,107,53,0.25);
            color: #f0c0a0;
            border-bottom-right-radius: 3px;
          }
          .stw-bubble-admin .stw-bubble-text {
            background: rgba(33,150,243,0.1);
            border: 1px solid rgba(33,150,243,0.25);
            color: #a8d0f5;
            border-bottom-left-radius: 3px;
          }
        .stw-waiting-banner h5 { color: #64b5f6; font-size: 1rem; margin-bottom: 0.3rem; }
        .stw-waiting-banner p { color: #888; font-size: 0.83rem; margin: 0; }

        /* Submitted work */
        .stw-submitted-block {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1rem;
        }
        .stw-link-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .stw-link-label { font-size: 0.82rem; color: #888; white-space: nowrap; }
        .stw-link { font-size: 0.82rem; color: #ff9a5c; word-break: break-all; text-decoration: none; }
        .stw-link:hover { color: #ff6b35; text-decoration: underline; }
        .stw-notes-box {
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.82rem;
          color: #bbb;
          margin-top: 0.5rem;
        }
        .stw-notes-box strong { color: #ccc; display: block; margin-bottom: 0.3rem; }
        .stw-notes-box p { white-space: pre-wrap; margin: 0; }
        .stw-att-list { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .stw-att-list strong { font-size: 0.82rem; color: #ccc; display: block; margin-bottom: 0.25rem; }
        .stw-att-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: #ff9a5c;
          text-decoration: none;
          padding: 0.3rem 0.6rem;
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 6px;
          width: fit-content;
        }
        .stw-att-link:hover { border-color: #ff6b35; color: #ff6b35; }

        /* Approved */
        .stw-approved-banner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: rgba(40,167,69,0.08);
          border: 1px solid rgba(40,167,69,0.3);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .stw-big-icon { font-size: 2.5rem; flex-shrink: 0; }
        .stw-approved-banner h4 { color: #4ad46d; font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
        .stw-feedback-box {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.83rem;
        }
        .fb-approved { background: rgba(40,167,69,0.1); border: 1px solid rgba(40,167,69,0.3); color: #aee8bb; }
        .stw-feedback-box strong { display: block; margin-bottom: 0.3rem; color: inherit; }
        .stw-feedback-box p { margin: 0; }

        /* Rejected – revision header */
        .stw-revision-header { margin-bottom: 1rem; }
        .stw-revision-badge {
          display: inline-block;
          background: rgba(255,107,53,0.15);
          border: 1px solid rgba(255,107,53,0.4);
          color: #ff8c5a;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 0.3rem 0.85rem;
          border-radius: 999px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.3px;
        }
        .stw-revision-hint { font-size: 0.83rem; color: #888; margin: 0; line-height: 1.5; }



        /* Previous submission */
        .stw-prev-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .stw-prev-header {
          background: #111;
          border-bottom: 1px solid #1f1f1f;
          padding: 0.6rem 1rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #888;
        }
        .stw-prev-body { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }

        /* Update form header */
        .stw-update-form-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1.1rem;
          padding-bottom: 0.9rem;
          border-bottom: 1px solid #1a1a1a;
        }
        .stw-update-icon { font-size: 1.4rem; flex-shrink: 0; }

        /* ── Two-Column Layout ── */
        .stw-two-col-wrapper {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 1.5rem;
          min-height: 500px;
        }

        .stw-col-left {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .stw-col-left::-webkit-scrollbar {
          width: 6px;
        }

        .stw-col-left::-webkit-scrollbar-track {
          background: transparent;
        }

        .stw-col-left::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }

        .stw-col-left::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Metadata Stack on Left */
        .stw-metadata-stack {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stw-meta-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }

        .meta-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .meta-content {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .meta-label {
          font-size: 0.7rem;
          color: #888;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .meta-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #e0e0e0;
        }

        .meta-value.orange {
          color: #ff9a5c;
        }

        .meta-value.red {
          color: #ff6b6b;
        }

        /* Submit and status cards on left */
        .submit-card,
        .status-card {
          border: 1.5px solid rgba(255,107,53,0.3);
        }

        .status-card {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Right Column */
        .stw-col-right {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .stw-col-right::-webkit-scrollbar {
          width: 6px;
        }

        .stw-col-right::-webkit-scrollbar-track {
          background: transparent;
        }

        .stw-col-right::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }

        .stw-col-right::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Task Details Card */
        .stw-details-card {
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stw-detail-section {
          border-bottom: 1px solid #1a1a1a;
          padding-bottom: 1rem;
        }

        .stw-detail-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .stw-detail-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ff9a5c;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .stw-detail-content {
          font-size: 0.85rem;
          color: #d0d0d0;
          line-height: 1.6;
        }

        .stw-detail-content p {
          margin-bottom: 0.5rem;
        }

        .stw-detail-content p:last-child {
          margin-bottom: 0;
        }

        .stw-detail-content ul,
        .stw-detail-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        /* Conversation Section */
        .stw-convo-section {
          background: #0d0d0d;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stw-draft-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #666;
          text-align: center;
        }

        .preview-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          opacity: 0.6;
        }

        .stw-revision-section {
          padding: 0;
        }

        /* Responsive Two-Column */
        @media (max-width: 1024px) {
          .stw-two-col-wrapper {
            grid-template-columns: 1fr 1.2fr;
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .stw-two-col-wrapper {
            grid-template-columns: 1fr;
            gap: 1rem;
            min-height: auto;
          }

          .stw-col-left,
          .stw-col-right {
            padding-right: 0;
          }
        }

        @media (max-width: 576px) {
          .stw-body { padding: 1rem; }
          .stw-dot { width: 26px; height: 26px; font-size: 0.7rem; }
          .stw-line { top: 13px; }
          .stw-dot-label { font-size: 0.58rem; }
          .stw-task-name { font-size: 0.95rem; }

          .stw-two-col-wrapper {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .stw-col-left,
          .stw-col-right {
            padding-right: 0;
          }

          .stw-details-card,
          .stw-convo-section {
            padding: 1rem;
          }

          .stw-detail-title {
            font-size: 0.78rem;
          }

          .stw-detail-content {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </Modal>
  )
}

export default StudentTaskSubmissionWizard
