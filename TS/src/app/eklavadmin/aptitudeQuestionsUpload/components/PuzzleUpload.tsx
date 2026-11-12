import React, { useState } from 'react'
import { FaCloudUploadAlt, FaDownload, FaExclamationTriangle, FaFileArchive, FaSpinner, FaTimes } from 'react-icons/fa'
import { Dropzone, UploadCard, UploadProgress, UploadSummary } from './UploadParts'

interface UploadStats {
  total?: number
  inserted?: number
  skipped?: number
  errors?: string[]
}

const PUZZLE_COLUMNS = ['quizTitle', 'topic', 'question', 'questionImage', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation']

const PuzzleUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const acceptFile = (selected: File) => {
    setError(null)
    setUploadStats(null)
    setDoneMessage(null)
    setUploadProgress(0)

    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP files are allowed')
      return
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100 MB')
      return
    }
    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setUploadStats(null)
    setDoneMessage(null)
    setUploadProgress(10)

    try {
      // 1. Get presigned URL for ZIP
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

      // 2. Upload ZIP to S3
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

      // 3. Tell backend to process the ZIP
      const processRes = await fetch(`${baseURL}/upload-puzzle-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      })

      const processData = await processRes.json()
      setUploadProgress(100)

      if (!processRes.ok) throw new Error(processData.message || 'ZIP processing failed')

      setUploadStats(processData.stats ? {
        total: processData.stats.total,
        inserted: processData.stats.inserted,
        skipped: processData.stats.skipped,
        errors: processData.errors,
      } : {})
      setDoneMessage(processData.message || null)
      setFile(null)
      setTimeout(() => setUploadProgress(0), 1500)
    } catch (err: any) {
      console.error('Puzzle ZIP upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const rows = [
      ['Puzzle Test 1', 'Visual Reasoning', 'What shape completes the pattern?', 'q1.png', 'Triangle', 'Circle', 'Square', 'Pentagon', 'B', 'The shape with no corners is a circle'],
      ['Puzzle Test 1', 'Visual Reasoning', 'Which colour is dominant in the image?', 'q2.jpg', 'Red', 'Blue', 'Green', 'Yellow', 'A', 'The dominant colour in the image is red'],
    ]
    const csvContent = [PUZZLE_COLUMNS.join(','), ...rows.map((r) => r.join(','))].join('\n')
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
    <UploadCard
      icon={FaFileArchive}
      title="Puzzle Questions"
      subtitle="Image-based questions: upload one ZIP with the images and a questions.csv"
      sample={<button type="button" className="aui-btn" onClick={downloadSampleCSV} disabled={loading}><FaDownload size={11} /> Download sample CSV</button>}
      guide={
        <>
          <h4>How to prepare the ZIP</h4>
          <ol className="aqu-rules">
            <li>Create a file named exactly <code>questions.csv</code></li>
            <li>Put every image (PNG / JPG / WEBP) in the <b>same folder</b> as the CSV</li>
            <li><code>questionImage</code> must match the image file name exactly, e.g. <code>q1.png</code></li>
            <li><code>question</code> is optional, a short caption next to the image</li>
            <li>Zip the folder and upload; questions are saved in CSV row order</li>
          </ol>
          <h4 style={{ marginTop: '1rem' }}>questions.csv columns</h4>
          <div className="aqu-cols">
            {PUZZLE_COLUMNS.map(col => <code key={col} className={col === 'questionImage' || col === 'correctOptionKey' ? 'is-key' : ''}>{col}</code>)}
          </div>
        </>
      }
    >
      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <Dropzone
        accept=".zip"
        hint="ZIP only · max 100 MB"
        icon={FaFileArchive}
        file={file}
        disabled={loading}
        onFile={acceptFile}
        onClear={() => { setFile(null); setError(null) }}
        fileSize={f => `${(f.size / 1024 / 1024).toFixed(2)} MB`}
      />

      {uploadProgress > 0 && uploadProgress < 100 && (
        <UploadProgress value={uploadProgress} label={uploadProgress < 75 ? 'Uploading ZIP…' : 'Processing questions…'} />
      )}

      {uploadStats && (
        <UploadSummary inserted={uploadStats.inserted} skipped={uploadStats.skipped} total={uploadStats.total} errors={uploadStats.errors} />
      )}
      {doneMessage && !error && <p className="aui-hint">{doneMessage}</p>}

      <div className="aqu-actions">
        <button type="button" className="aui-btn aui-btn-primary" onClick={handleUpload} disabled={!file || loading}>
          {loading ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Processing…</> : <><FaCloudUploadAlt /> Upload ZIP</>}
        </button>
      </div>
    </UploadCard>
  )
}

export default PuzzleUploadForm
