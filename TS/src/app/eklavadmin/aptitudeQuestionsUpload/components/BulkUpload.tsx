import React, { useState } from 'react'
import { FaCloudUploadAlt, FaDownload, FaExclamationTriangle, FaFileCsv, FaSpinner, FaTimes } from 'react-icons/fa'
import { Dropzone, UploadCard, UploadProgress, UploadSummary } from './UploadParts'

interface UploadStats {
  totalQuestions?: number
  insertedCount?: number
  skippedCount?: number
  errors?: string[]
}

const CSV_COLUMNS = ['quizTitle', 'topic', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation']

const CsvUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const validateCSVContent = async (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n')

        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'))
          return
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
        const requiredColumns = [
          'quiztitle', 'topic', 'question', 'optiona', 'optionb',
          'optionc', 'optiond', 'correctoptionkey', 'explanation'
        ]

        const missingColumns = requiredColumns.filter(col => !headers.includes(col))

        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`))
          return
        }

        resolve(true)
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const acceptFile = (selectedFile: File) => {
    setError(null)
    setUploadStats(null)
    setDoneMessage(null)
    setUploadProgress(0)

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setUploadStats(null)
    setDoneMessage(null)
    setUploadProgress(10)

    try {
      // Validate CSV content before upload
      setUploadProgress(20)
      await validateCSVContent(file)
      setUploadProgress(30)

      // 1. Get presigned upload URL
      const presignRes = await fetch(
        `${baseURL}/s3/generate-aptitude-presigned-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `aptitude_${Date.now()}_${file.name}`,
            fileType: file.type || 'text/csv',
            folder: 'csv/aptitude',
          }),
        }
      )

      if (!presignRes.ok) {
        const err = await presignRes.json()
        throw new Error(err.message || 'Failed to generate upload URL')
      }

      const { uploadUrl, fileUrl } = await presignRes.json()
      setUploadProgress(50)

      // 2. Upload CSV to S3 with progress tracking
      const xhr = new XMLHttpRequest()
      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round(50 + (event.loaded / event.total) * 30))
          }
        })
        xhr.addEventListener('load', () => (xhr.status === 200 ? resolve(true) : reject(new Error('Failed to upload CSV to S3'))))
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'text/csv')
        xhr.send(file)
      })
      setUploadProgress(80)

      // 3. Process CSV from S3
      const processRes = await fetch(
        `${baseURL}/upload-questions-csv`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl }),
        }
      )

      const processData = await processRes.json()
      setUploadProgress(100)

      if (!processRes.ok) {
        throw new Error(processData.message || 'CSV processing failed')
      }

      setUploadStats(processData.stats ? {
        totalQuestions: processData.stats.total || processData.stats.processed,
        insertedCount: processData.stats.inserted || processData.stats.success,
        skippedCount: processData.stats.skipped || processData.stats.failed,
        errors: processData.errors || processData.stats.errors,
      } : {})
      setDoneMessage(processData.message || null)
      setFile(null)
      setTimeout(() => setUploadProgress(0), 1500)
    } catch (err: any) {
      console.error('CSV upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleRow = ['Aptitude Test 1', 'Quantitative', 'What is 2 + 2?', '3', '4', '5', '6', 'B', 'Basic addition problem']
    const csvContent = [CSV_COLUMNS.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_aptitude_questions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <UploadCard
      icon={FaFileCsv}
      title="Text Questions"
      subtitle="Add multiple-choice aptitude questions in bulk from a CSV file"
      sample={<button type="button" className="aui-btn" onClick={downloadSampleCSV} disabled={loading}><FaDownload size={11} /> Download sample CSV</button>}
      guide={
        <>
          <h4>Required columns</h4>
          <div className="aqu-cols">
            {CSV_COLUMNS.map(col => <code key={col} className={col === 'correctOptionKey' ? 'is-key' : ''}>{col}</code>)}
          </div>
          <h4>Rules</h4>
          <ul className="aqu-rules">
            <li>The first row must be the column headers</li>
            <li><code>correctOptionKey</code> is <b>A</b>, <b>B</b>, <b>C</b> or <b>D</b></li>
            <li>Up to <b>1,000</b> questions per upload · max <b>10 MB</b></li>
          </ul>
        </>
      }
    >
      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <Dropzone
        accept=".csv"
        hint="CSV only · max 10 MB"
        icon={FaFileCsv}
        file={file}
        disabled={loading}
        onFile={acceptFile}
        onClear={() => { setFile(null); setError(null) }}
        fileSize={f => `${(f.size / 1024).toFixed(1)} KB`}
      />

      {uploadProgress > 0 && uploadProgress < 100 && (
        <UploadProgress value={uploadProgress} label={uploadProgress < 30 ? 'Checking columns…' : uploadProgress < 80 ? 'Uploading file…' : 'Processing questions…'} />
      )}

      {uploadStats && (
        <UploadSummary inserted={uploadStats.insertedCount} skipped={uploadStats.skippedCount} total={uploadStats.totalQuestions} errors={uploadStats.errors} />
      )}
      {doneMessage && !error && <p className="aui-hint">{doneMessage}</p>}

      <div className="aqu-actions">
        <button type="button" className="aui-btn aui-btn-primary" onClick={handleUpload} disabled={!file || loading}>
          {loading ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Uploading…</> : <><FaCloudUploadAlt /> Upload CSV</>}
        </button>
      </div>
    </UploadCard>
  )
}

export default CsvUploadForm
