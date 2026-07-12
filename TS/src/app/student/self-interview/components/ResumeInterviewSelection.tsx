import { useEffect, useState, useRef } from 'react'
import { Form, Button, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaUpload, FaCheckCircle, FaMicrophone, FaBan } from 'react-icons/fa'

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

  resumeLimits?: {
    used: number
    remaining: number
    limit: number
  }
}

const MAX_MONTHLY = 5
const TRIAL_MAX = 2
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

const ResumeInterviewSelection = ({ onStart , resumeLimits}: Props) => {

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const token = user?.token
  const status = user?.status?.toLowerCase()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [interviewId, setInterviewId] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)

  //const [used, setUsed] = useState<number>(0)
  const [loadingLimit, setLoadingLimit] = useState(true)

  const [validFile, setValidFile] = useState(false)
  const [fileError, setFileError] = useState('')

const used = resumeLimits?.used ?? 0
const remainingFromAPI = resumeLimits?.remaining

const maxAllowed =
  status === 'pending' ? TRIAL_MAX : MAX_MONTHLY

const remaining =
  remainingFromAPI !== undefined
    ? remainingFromAPI
    : Math.max(maxAllowed - used, 0)

/* 
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
 */

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

      /* if (typeof data.used === 'number') {
        setUsed(data.used)
      } else {
        setUsed(prev => prev + 1)
      } */


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

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>


        <div className="d-flex justify-content-between align-items-center mb-3">

          <h5 className="fw-semibold mb-0" style={{ color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaUpload size={13} style={{ color: '#ff7a00' }} /> Upload Latest Resume
          </h5>

          {resumeLimits && (

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


        <style>{`
          .resume-file-input::file-selector-button {
            background: #f1f5f9 !important;
            border: none !important;
            border-right: 1.5px solid #e2e8f0 !important;
            color: #0f172a !important;
            font-weight: 600;
            padding: 0.5rem 1rem;
            cursor: pointer;
            border-radius: 6px 0 0 6px;
            transition: background 0.15s;
          }
          .resume-file-input:hover::file-selector-button,
          .resume-file-input::file-selector-button:hover {
            background: #e2e8f0 !important;
            color: #0f172a !important;
          }
        `}</style>
        <Form.Control
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="mt-2 resume-file-input"
          style={{
            borderRadius: '8px',
            border: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
          }}
          disabled={uploading || remaining <= 0}
          onChange={handleFileChange}
        />


        <div className="small mt-1" style={{ color: '#64748b' }}>
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
            style={{ color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <FaCheckCircle size={14} /> Resume uploaded & analyzed
          </div>
        )}


        <Button
          className="w-100 fw-semibold"
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
            marginTop: 'auto',
            backgroundColor: remaining > 0 ? '#2563eb' : '#ccc',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            cursor: remaining > 0 ? 'pointer' : 'not-allowed',
          }}
        >

          {starting ? (
            <>
              <Spinner size="sm" style={{ marginRight: 6 }} />
              Starting Interview...
            </>
          ) : remaining > 0 ? (
            <><FaMicrophone size={14} style={{ marginRight: 8 }} />Start Interview</>
          ) : (
            <><FaBan size={14} style={{ marginRight: 8 }} />{status === 'pending' ? 'Free Limit Reached' : 'Monthly Limit Reached'}</>
          )}

        </Button>

      </div>

    </div>
  )
}

export default ResumeInterviewSelection