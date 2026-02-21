import { useEffect, useState } from 'react'
import { Form, Button, Card, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

interface Props {
  onStart: (
    interviewId: string,
    questions: string[],
    totalQuestions: number,
    title: string,
    options?: {
      interviewType: 'resume'
      attemptId: string
      attemptNumber: number
    }
  ) => void
}


const ResumeInterviewSelection = ({ onStart }: Props) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loadingLimit, setLoadingLimit] = useState(true)

  useEffect(() => {
    if (!token) return

    const fetchRemaining = async () => {
      try {
        const res = await fetch(`${baseURL}/api/resume-based-interview/remaining`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        setRemaining(data.used)
      } catch (err) {
        console.error('Remaining fetch failed', err)
      } finally {
        setLoadingLimit(false)
      }
    }

    fetchRemaining()
  }, [baseURL, token])

  /* ================= UPLOAD RESUME ================= */

  const uploadResume = async (file: File) => {
    setUploading(true)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch(`${baseURL}/api/resume-based-interview/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setInterviewId(data.interviewId)
    } catch (err: any) {
      alert(err.message || 'Resume upload failed')
    } finally {
      setUploading(false)
    }
  }

  /* ================= START INTERVIEW ================= */

  const startResumeInterview = async () => {
    if (!interviewId) return
    setStarting(true)

    try {
      const res = await fetch(`${baseURL}/api/resume-based-interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interviewId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      onStart(
        data.interviewId,
        data.questions,
        data.totalQuestions,
        data.title,
        {
          interviewType: 'resume',
          attemptId: data.attemptId,
          attemptNumber: data.attemptNumber,
        }
      )

      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start interview')

      if (err.message?.includes('limit')) {
        setRemaining(0)
      }
    } finally {
      setStarting(false)
    }
  }

  /* ================= UI ================= */

  return (
    <Card
      className="border-0 rounded-4 shadow-sm"
      style={{
        border: '1px solid rgba(255,122,0,0.15)',
      }}
    >
      <Card.Body className="p-4">

        {/* Title */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold mb-0">
            🎯 Upload Latest Resume
          </h5>

          {!loadingLimit && remaining !== null && (
            <div
              className="px-3 py-1 rounded-pill small fw-semibold"
              style={{
                background: remaining === 0
                  ? 'rgba(200,200,200,0.2)'
                  : 'rgba(255,122,0,0.1)',
                color: remaining === 0 ? '#999' : '#ff7a00',
                border: '1px solid rgba(255,122,0,0.3)',
              }}
            >
              Monthly Attempts: {remaining} / 5
            </div>
          )}
        </div>

        {/* File Upload */}
        <Form.Control
          type="file"
          accept=".pdf,.doc,.docx"
          className="mt-2"
          style={{
            borderRadius: '8px',
            border: '1px solid rgba(255,122,0,0.3)',
          }}
          disabled={uploading || remaining === 0}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) uploadResume(file)
          }}
        />

        {/* Uploading Spinner */}
        {uploading && (
          <div className="mt-3 text-center">
            <Spinner
              size="sm"
              style={{ color: '#ff7a00' }}
            />{' '}
            Uploading resume...
          </div>
        )}

        {/* Upload Success */}
        {interviewId && (
          <div
            className="mt-3 text-center fw-semibold"
            style={{ color: '#ff7a00' }}
          >
            ✅ Resume uploaded & analyzed
          </div>
        )}

        {/* Start Button */}
        <Button
          className="mt-4 w-100 fw-semibold"
          size="lg"
          disabled={
            !interviewId ||
            uploading ||
            starting ||
            !remaining ||
            remaining <= 0
          }
          onClick={startResumeInterview}
          style={{
            backgroundColor: remaining && remaining > 0 ? '#ff7a00' : '#ccc',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            transition: 'all 0.3s ease',
            cursor: remaining && remaining > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {starting ? (
            <>
              <Spinner size="sm" style={{ marginRight: 6 }} />
              Starting Interview...
            </>
          ) : remaining && remaining > 0 ? (
            '🎤 Start Interview'
          ) : (
            '🚫 Monthly Limit Reached'
          )}
        </Button>

      </Card.Body>
    </Card>
  )

}

export default ResumeInterviewSelection
