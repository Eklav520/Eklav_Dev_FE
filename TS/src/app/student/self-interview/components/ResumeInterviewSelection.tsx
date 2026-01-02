import { useEffect, useState } from 'react'
import { Form, Button, Card, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

interface Props {
  onStart: (interviewId: string, questions: string[], totalQuestions: number, title: string) => void
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
        setRemaining(data.remaining)
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

      onStart(data.interviewId, data.questions, data.totalQuestions, data.title)
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
    <Card className="bg-body text-body border rounded-4 p-4">
      <h5 className="mb-2">🎯 Upload Latest Resume</h5>
      <Form.Control
        type="file"
        accept=".pdf,.doc,.docx"
        className="mt-2"
        disabled={uploading || remaining === 0}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (file) uploadResume(file)
        }}
      />

      {uploading && (
        <div className="mt-3 text-center">
          <Spinner size="sm" /> Uploading resume...
        </div>
      )}

      {interviewId && <div className="mt-3 text-success text-center">✅ Resume uploaded & analyzed</div>}

      {!loadingLimit && remaining !== null && (
        <div className="text-center small mt-2">
          <span className="text-muted">Monthly Attempts Left:</span>{' '}
          <strong className={remaining === 0 ? 'text-danger' : 'text-success'}>{remaining} / 5</strong>
        </div>
      )}

      <Button
        className="mt-4 w-100"
        size="lg"
        variant="success"
        disabled={!interviewId || uploading || starting || remaining === 0}
        onClick={startResumeInterview}>
        {starting ? (
          <>
            <Spinner size="sm" /> Starting Interview...
          </>
        ) : (
          '🎤 Start Interview'
        )}
      </Button>
    </Card>
  )
}

export default ResumeInterviewSelection
