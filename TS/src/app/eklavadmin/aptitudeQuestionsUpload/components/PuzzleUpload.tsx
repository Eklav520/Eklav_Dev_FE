import React, { useState, useCallback, useRef } from 'react'
import { Card, Spinner, Alert, Button, ProgressBar, Badge } from 'react-bootstrap'
import { BsCloudUpload, BsCheckCircle, BsXCircle, BsInfoCircle, BsDownload, BsFileZip } from 'react-icons/bs'
import { FaFileArchive } from 'react-icons/fa'

interface UploadStats {
  total?: number
  inserted?: number
  skipped?: number
  errors?: string[]
}

const PuzzleUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null)
    setError(null)
    setUploadStats(null)
    setUploadProgress(0)

    if (!e.target.files || e.target.files.length === 0) return
    const selected = e.target.files[0]

    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP files are allowed')
      return
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100 MB')
      return
    }
    setFile(selected)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const dropped = e.dataTransfer.files[0]
    if (!dropped) return

    if (!dropped.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP files are allowed')
      return
    }
    if (dropped.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100 MB')
      return
    }

    setFile(dropped)
    setMessage(null)
    setError(null)
    setUploadStats(null)
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setMessage(null)
    setError(null)
    setUploadStats(null)
    setUploadProgress(10)

    try {
      // 1️⃣ Get presigned URL for ZIP
      const presignRes = await fetch(`${baseURL}/s3/generate-aptitude-presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `puzzle_${Date.now()}_${file.name}`,
          fileType: 'application/zip',
          folder: 'puzzles/zip',
        }),
      })

      if (!presignRes.ok) {
        const err = await presignRes.json()
        throw new Error(err.message || 'Failed to generate upload URL')
      }

      const { uploadUrl, fileUrl } = await presignRes.json()
      setUploadProgress(20)

      // 2️⃣ Upload ZIP to S3
      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(20 + Math.round((ev.loaded / ev.total) * 50))
          }
        })
        xhr.addEventListener('load', () => (xhr.status === 200 ? resolve() : reject(new Error('Failed to upload ZIP to S3'))))
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', 'application/zip')
        xhr.send(file)
      })
      setUploadProgress(75)

      // 3️⃣ Tell backend to process the ZIP
      const processRes = await fetch(`${baseURL}/upload-puzzle-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      })

      const processData = await processRes.json()
      setUploadProgress(100)

      if (!processRes.ok) throw new Error(processData.message || 'ZIP processing failed')

      if (processData.stats) {
        setUploadStats({
          total: processData.stats.total,
          inserted: processData.stats.inserted,
          skipped: processData.stats.skipped,
          errors: processData.errors,
        })
      }

      setMessage(`✅ Puzzle questions uploaded successfully! ${processData.message || ''}`)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setUploadProgress(0), 3000)
    } catch (err: any) {
      console.error('Puzzle ZIP upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const headers = ['quizTitle', 'topic', 'question', 'questionImage', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation']
    const rows = [
      ['Puzzle Test 1', 'Visual Reasoning', 'What shape completes the pattern?', 'q1.png', 'Triangle', 'Circle', 'Square', 'Pentagon', 'B', 'The shape with no corners is a circle'],
      ['Puzzle Test 1', 'Visual Reasoning', 'Which colour is dominant in the image?', 'q2.jpg', 'Red', 'Blue', 'Green', 'Yellow', 'A', 'The dominant colour in the image is red'],
    ]
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_puzzle_questions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card
      className={`border rounded-4 shadow-sm p-4 ${dragActive ? 'border-warning bg-warning bg-opacity-10' : 'bg-light'}`}
      style={{ maxWidth: '620px', margin: '2rem auto' }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <form onSubmit={handleUpload}>
        <div className="text-center mb-4">
          <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
            <FaFileArchive size={40} className="text-warning" />
          </div>
          <h4 className="mb-1">Bulk Upload Puzzle Questions</h4>
          <p className="text-muted small mb-0">Upload a ZIP file containing your images + questions.csv</p>
        </div>

        {/* Drop Zone */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Choose ZIP File</label>
          <div
            className={`border-2 border-dashed rounded-3 p-4 text-center ${dragActive ? 'border-warning bg-warning bg-opacity-5' : 'border-secondary'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="d-none"
              disabled={loading}
            />
            <BsCloudUpload size={48} className="text-muted mb-3" />
            {file ? (
              <div>
                <BsFileZip size={24} className="text-warning mb-2" />
                <p className="mb-0 fw-semibold">{file.name}</p>
                <small className="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                <div className="mt-2">
                  <Badge bg="warning" text="dark" pill>Ready to upload</Badge>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-1">Drag & drop your ZIP file here</p>
                <small className="text-muted">or click to browse</small>
                <div className="mt-2">
                  <Badge bg="secondary" pill>ZIP only • Max 100 MB</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">
                {uploadProgress < 75 ? 'Uploading ZIP…' : 'Processing questions…'}
              </small>
              <small className="text-muted">{uploadProgress}%</small>
            </div>
            <ProgressBar now={uploadProgress} variant="warning" animated striped />
          </div>
        )}

        {/* Stats */}
        {uploadStats && (
          <Alert variant="success" className="mb-3">
            <div className="d-flex align-items-start gap-2">
              <BsCheckCircle size={20} className="flex-shrink-0 mt-1" />
              <div>
                <strong>Upload Summary</strong>
                <div className="mt-1">
                  <Badge bg="success" className="me-2">Inserted: {uploadStats.inserted ?? 0}</Badge>
                  {(uploadStats.skipped ?? 0) > 0 && (
                    <Badge bg="warning" text="dark" className="me-2">Skipped: {uploadStats.skipped}</Badge>
                  )}
                  <Badge bg="info">Total: {uploadStats.total ?? 0}</Badge>
                </div>
                {uploadStats.errors && uploadStats.errors.length > 0 && (
                  <ul className="mt-2 mb-0 ps-3 small text-warning">
                    {uploadStats.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {uploadStats.errors.length > 5 && <li>…and {uploadStats.errors.length - 5} more</li>}
                  </ul>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Buttons */}
        <div className="d-flex gap-2 mb-3">
          <Button type="submit" variant="warning" className="flex-grow-1 text-dark fw-semibold" disabled={!file || loading}>
            {loading ? (
              <><Spinner size="sm" animation="border" className="me-2" />Processing…</>
            ) : (
              <><BsCloudUpload className="me-2" />Upload ZIP</>
            )}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={downloadSampleCSV} disabled={loading}>
            <BsDownload className="me-1" />Sample CSV
          </Button>
        </div>

        {message && (
          <Alert variant="success" className="mb-3" onClose={() => setMessage(null)} dismissible>
            <div className="d-flex align-items-center gap-2">
              <BsCheckCircle size={18} /><span>{message}</span>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
            <div className="d-flex align-items-center gap-2">
              <BsXCircle size={18} /><span>{error}</span>
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-muted small mt-3 pt-2 border-top">
          <div className="d-flex align-items-start gap-2">
            <BsInfoCircle size={14} className="mt-1 flex-shrink-0" />
            <div style={{ width: '100%' }}>
              <strong>How to prepare your ZIP:</strong>
              <ol className="mt-1 mb-2 ps-3">
                <li>Create a file named exactly <code>questions.csv</code> with these columns:</li>
              </ol>

              {/* Column reference table */}
              <div style={{ overflowX: 'auto', marginLeft: '1rem' }}>
                <table style={{ fontSize: '0.68rem', borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#e9ecef' }}>
                      {['quizTitle', 'topic', 'question', 'questionImage', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation'].map(col => (
                        <th key={col} style={{ padding: '4px 8px', border: '1px solid #dee2e6', whiteSpace: 'nowrap', fontWeight: 700, color: '#212529' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {['Puzzle Test 1', 'Visual Reasoning', 'What shape?', 'q1.png', 'Triangle', 'Circle', 'Square', 'Pentagon', 'B', 'No corners'].map((val, i) => (
                        <td key={i} style={{ padding: '3px 8px', border: '1px solid #dee2e6', color: '#6c757d', whiteSpace: 'nowrap' }}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <ol className="mt-2 mb-0 ps-3" start={2}>
                <li>Put all image files (PNG / JPG / WEBP) in the <strong>same folder</strong> as the CSV</li>
                <li><code>questionImage</code> must match the filename exactly (e.g. <code>q1.png</code>)</li>
                <li><code>question</code> is optional — add a short text caption if needed alongside the image</li>
                <li>ZIP everything and upload — questions are saved in CSV row order</li>
              </ol>
            </div>
          </div>
        </div>
      </form>
    </Card>
  )
}

export default PuzzleUploadForm
