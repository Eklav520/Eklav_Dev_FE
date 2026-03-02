import { useEffect, useState, useRef } from 'react'
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

const MAX_MONTHLY = 5
const TRIAL_MAX = 2
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

const ResumeInterviewSelection = ({ onStart }: Props) => {

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const token = user?.token
  const status = user?.status?.toLowerCase()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [interviewId, setInterviewId] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)

  const [used, setUsed] = useState<number>(0)
  const [loadingLimit, setLoadingLimit] = useState(true)

  const [validFile, setValidFile] = useState(false)
  const [fileError, setFileError] = useState('')

  const maxAllowed =
    status === 'pending' ? TRIAL_MAX : MAX_MONTHLY

  const remaining = Math.max(maxAllowed - used, 0)


  useEffect(() => {

    if (!token) return

    const fetchRemaining = async () => {

      try {

        const res = await fetch(
          `${baseURL}/api/resume-based-interview/remaining`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await res.json()

        setUsed(data.used || 0)

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

      const res = await fetch(
        `${baseURL}/api/resume-based-interview/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setInterviewId(data.interviewId)

    } catch (err: any) {

      setFileError(err.message || 'Resume upload failed')
      setValidFile(false)

    } finally {

      setUploading(false)

    }
  }


  /* ================= FILE VALIDATION ================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0]

    setValidFile(false)
    setInterviewId(null)
    setFileError('')

    if (!file) return

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {

      setFileError('Only PDF, DOC or DOCX allowed')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {

      setFileError('File must be 3 MB or smaller')
      e.target.value = ''
      return
    }

    setValidFile(true)

    uploadResume(file)

  }


  /* ================= START INTERVIEW ================= */

  const startResumeInterview = async () => {

    if (!interviewId) return

    if (remaining <= 0) {

      alert(
        status === 'pending'
          ? 'You have used your trial attempts.'
          : 'You reached your monthly limit.'
      )

      return
    }

    setStarting(true)

    try {

      const res = await fetch(
        `${baseURL}/api/resume-based-interview/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interviewId }),
        }
      )

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)


      /* START INTERVIEW */

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


      /* UPDATE ATTEMPTS */

      if (typeof data.used === 'number') {
        setUsed(data.used)
      } else {
        setUsed(prev => prev + 1)
      }


      /* RESET UPLOADER */

      setInterviewId(null)
      setValidFile(false)
      setFileError('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }


    } catch (err: any) {

      alert(err.message || 'Failed to start interview')

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


        <div className="d-flex justify-content-between align-items-center mb-3">

          <h5 className="fw-semibold mb-0">
            🎯 Upload Latest Resume
          </h5>

          {!loadingLimit && (

            <div
              className="px-3 py-1 rounded-pill small fw-semibold"
              style={{
                background:
                  remaining === 0
                    ? 'rgba(200,200,200,0.2)'
                    : 'rgba(255,122,0,0.1)',

                color:
                  remaining === 0
                    ? '#999'
                    : '#ff7a00',

                border:
                  '1px solid rgba(255,122,0,0.3)',
              }}
            >

              {status === 'pending'
                ? `Trial Attempts: ${used} / ${TRIAL_MAX}`
                : `Monthly Attempts: ${used} / ${MAX_MONTHLY}`}

            </div>

          )}

        </div>


        <Form.Control
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="mt-2"
          style={{
            borderRadius: '8px',
            border: '1px solid rgba(255,122,0,0.3)',
          }}
          disabled={uploading || remaining <= 0}
          onChange={handleFileChange}
        />


        <div className="small mt-1" style={{ color: '#aaa' }}>
          Max file size: 3 MB (PDF, DOC, DOCX)
        </div>


        {fileError && (
          <div className="small mt-1" style={{ color: '#ff6b6b' }}>
            {fileError}
          </div>
        )}


        {uploading && (
          <div className="mt-3 text-center">
            <Spinner size="sm" style={{ color: '#ff7a00' }} />
            {' '}Uploading resume...
          </div>
        )}


        {interviewId && !uploading && (
          <div
            className="mt-3 text-center fw-semibold"
            style={{ color: '#ff7a00' }}
          >
            ✅ Resume uploaded & analyzed
          </div>
        )}


        <Button
          className="mt-4 w-100 fw-semibold"
          size="lg"
          disabled={
            !validFile ||
            !interviewId ||
            uploading ||
            starting ||
            remaining <= 0
          }
          onClick={startResumeInterview}
          style={{
            backgroundColor:
              remaining > 0
                ? '#ff7a00'
                : '#ccc',

            border: 'none',
            borderRadius: '10px',
            padding: '12px',

            cursor:
              remaining > 0
                ? 'pointer'
                : 'not-allowed',
          }}
        >

          {starting ? (
            <>
              <Spinner size="sm" style={{ marginRight: 6 }} />
              Starting Interview...
            </>
          ) : remaining > 0 ? (
            '🎤 Start Interview'
          ) : (
            status === 'pending'
              ? '🚫 Free Limit Reached'
              : '🚫 Monthly Limit Reached'
          )}

        </Button>

      </Card.Body>

    </Card>
  )
}

export default ResumeInterviewSelection