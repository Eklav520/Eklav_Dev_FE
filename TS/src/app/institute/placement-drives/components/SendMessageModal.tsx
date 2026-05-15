import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { FaEnvelope, FaTimesCircle } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import type { PlacementDrive } from './PlacementDriveManagement'

interface DriveStudent {
  _id: string
  studentName: string
  studentEmail: string
  overallStatus: 'in_progress' | 'placed' | 'eliminated'
  isEligible: boolean
}

interface Props {
  show: boolean
  drive: PlacementDrive
  students: DriveStudent[]   // one student = single send; many = bulk
  onHide: () => void
}

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'In Progress',
  placed:      'Placed',
  eliminated:  'Eliminated',
}

const STATUS_COLOR: Record<string, string> = {
  in_progress: '#f59e0b',
  placed:      '#22c55e',
  eliminated:  '#ef4444',
}

function buildTemplate(drive: PlacementDrive, students: DriveStudent[]) {
  const isSingle  = students.length === 1
  const s         = students[0]
  const name      = isSingle ? s.studentName : '{name}'
  const company   = drive.companyName
  const role      = drive.role ? ` for the role of ${drive.role}` : ''
  const pkg       = drive.package ? `\nPackage Offered: ${drive.package}` : ''

  if (isSingle && s.overallStatus === 'placed') {
    return {
      subject: `Congratulations! You are Selected by ${company}`,
      message: `Dear ${name},\n\nWe are delighted to inform you that you have successfully cleared all rounds of the ${company} placement drive${role}.${pkg}\n\nThe placement team will reach out to you shortly with next steps.\n\nWishing you all the best in this exciting journey ahead!`,
    }
  }

  if (isSingle && s.overallStatus === 'eliminated') {
    return {
      subject: `Update on ${company} Placement Drive`,
      message: `Dear ${name},\n\nThank you for participating in the ${company} placement drive. We appreciate the effort and dedication you showed throughout the process.\n\nUnfortunately, you have not been selected at this time. We encourage you to keep learning and improving — there will be more opportunities ahead.\n\nWe wish you all the very best!`,
    }
  }

  // In-progress or bulk
  return {
    subject: `${company} Placement Drive — Important Update`,
    message: `Dear ${name},\n\nThis is an update from the Training & Placement Cell regarding the ${company} placement drive${role}.\n\n[Write your message here]\n\nPlease feel free to reach out if you have any questions.\n\nBest regards,`,
  }
}

const SendMessageModal = ({ show, drive, students, onHide }: Props) => {
  const { user }  = useAuthContext()
  const baseURL   = import.meta.env.VITE_API_BASE_URL

  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState<number | null>(null)
  const [failed, setFailed]     = useState<{ email: string; error: string }[]>([])
  const [error, setError]       = useState('')

  useEffect(() => {
    if (show && students.length > 0) {
      const tpl = buildTemplate(drive, students)
      setSubject(tpl.subject)
      setMessage(tpl.message)
      setSent(null)
      setFailed([])
      setError('')
    }
  }, [show, students.length])

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await axios.post(
        `${baseURL}/api/placement-drives/${drive._id}/message`,
        {
          studentIds: students.map((s) => s._id),
          subject:    subject.trim(),
          message:    message.trim(),
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      setSent(res.data.sent)
      setFailed(res.data.failed || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const isBulk   = students.length > 1
  const isSingle = students.length === 1

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      contentClassName="bg-dark text-white"
      centered
    >
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title style={{ fontSize: '1rem' }}>
          <FaEnvelope className="me-2" style={{ color: '#ff7a00' }} />
          {isBulk ? `Send Email to ${students.length} Students` : 'Send Email'}
          <span className="text-muted fs-6 ms-2">— {drive.companyName}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>

        {/* Recipients */}
        <div className="mb-3">
          <div
            style={{
              fontSize: '0.72rem', color: '#888', textTransform: 'uppercase',
              letterSpacing: '0.4px', marginBottom: 8,
            }}
          >
            To
          </div>
          <div className="d-flex flex-wrap gap-2">
            {isSingle ? (
              <RecipientChip student={students[0]} />
            ) : (
              students.slice(0, 8).map((s) => <RecipientChip key={s._id} student={s} />)
            )}
            {isBulk && students.length > 8 && (
              <span
                style={{
                  background: '#222', border: '1px solid #333', borderRadius: 20,
                  padding: '3px 10px', fontSize: '0.75rem', color: '#888',
                }}
              >
                +{students.length - 8} more
              </span>
            )}
          </div>
        </div>

        <hr style={{ borderColor: '#2a2a2a' }} />

        {sent !== null ? (
          /* Result state */
          <div className="text-center py-4">
            {sent === 0 ? (
              /* Full failure */
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>
                  Failed to Send
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  No emails were delivered.
                </div>
              </>
            ) : failed.length > 0 ? (
              /* Partial success */
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
                  Partially Sent
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  Delivered to <strong style={{ color: '#fff' }}>{sent}</strong> student{sent !== 1 ? 's' : ''},{' '}
                  <strong style={{ color: '#ef4444' }}>{failed.length}</strong> failed.
                </div>
              </>
            ) : (
              /* Full success */
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>
                  Email{sent !== 1 ? 's' : ''} Sent!
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  Successfully delivered to <strong style={{ color: '#fff' }}>{sent}</strong> student{sent !== 1 ? 's' : ''}.
                </div>
              </>
            )}

            {failed.length > 0 && (
              <div className="mt-3 text-start" style={{ maxHeight: 120, overflowY: 'auto' }}>
                {failed.map((f, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 rounded mb-1"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.76rem' }}
                  >
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{f.email}</span>
                    <span className="text-muted ms-2">{f.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                <FaTimesCircle className="me-2" />{error}
              </Alert>
            )}

            {/* Subject */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.8rem', color: '#aaa' }}>Subject</Form.Label>
              <Form.Control
                className="bg-black text-white border-secondary"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </Form.Group>

            {/* Message */}
            <Form.Group className="mb-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 0 }}>
                  Message
                </Form.Label>
                {isBulk && (
                  <span style={{ fontSize: '0.72rem', color: '#666' }}>
                    Use <code style={{ color: '#ff7a00' }}>{'{name}'}</code> to personalise each email with the student's name
                  </span>
                )}
              </div>
              <Form.Control
                as="textarea"
                rows={10}
                className="bg-black text-white border-secondary"
                style={{ fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
              />
            </Form.Group>

            {isBulk && (
              <div
                className="mt-2 px-3 py-2 rounded"
                style={{ background: 'rgba(255,122,0,0.07)', border: '1px solid rgba(255,122,0,0.2)', fontSize: '0.78rem', color: '#ccc' }}
              >
                <strong style={{ color: '#ff7a00' }}>Bulk send:</strong> The same email will be sent to all {students.length} selected students.
                Each email will replace <code style={{ color: '#ff7a00' }}>{'{name}'}</code> with the individual student's name.
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-secondary">
        <Button variant="secondary" onClick={onHide}>
          {sent !== null ? 'Close' : 'Cancel'}
        </Button>
        {sent === null && (
          <Button
            disabled={sending}
            onClick={handleSend}
            style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff', fontWeight: 600 }}
          >
            <FaEnvelope className="me-2" />
            {sending
              ? 'Sending...'
              : isBulk
              ? `Send to ${students.length} Students`
              : 'Send Email'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

const RecipientChip = ({ student }: { student: DriveStudent }) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: 20, padding: '3px 10px',
    }}
  >
    <div
      style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        background: STATUS_COLOR[student.overallStatus] + '33',
        border: `1px solid ${STATUS_COLOR[student.overallStatus]}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.55rem', fontWeight: 700,
        color: STATUS_COLOR[student.overallStatus],
      }}
    >
      {student.studentName.charAt(0).toUpperCase()}
    </div>
    <div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0' }}>
        {student.studentName}
      </span>
      <span
        style={{
          marginLeft: 6, fontSize: '0.65rem',
          color: STATUS_COLOR[student.overallStatus],
        }}
      >
        {STATUS_LABEL[student.overallStatus]}
      </span>
    </div>
  </div>
)

export default SendMessageModal
