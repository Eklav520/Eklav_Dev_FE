import React, { useState } from 'react'
import { Card, Spinner, Alert } from 'react-bootstrap'

const CsvUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null)
    setError(null)

    if (!e.target.files || e.target.files.length === 0) return

    const selectedFile = e.target.files[0]

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Only CSV files are allowed')
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      // ===============================
      // 1️⃣ Get presigned upload URL
      // ===============================
      const presignRes = await fetch(
        `${baseURL}/s3/generate-aptitude-presigned-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
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

      // ===============================
      // 2️⃣ Upload CSV to S3
      // ===============================
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'text/csv',
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload CSV to S3')
      }

      // ===============================
      // 3️⃣ Process CSV from S3
      // ===============================
      const processRes = await fetch(
        `${baseURL}/upload-questions-csv`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl }),
        }
      )

      const processData = await processRes.json()

      if (!processRes.ok) {
        throw new Error(processData.message || 'CSV processing failed')
      }

      setMessage('✅ CSV uploaded & processed successfully!')
      setFile(null)
    } catch (err: any) {
      console.error('CSV upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      className="border bg-light rounded-4 shadow-sm p-4"
      style={{ maxWidth: '520px', margin: '2rem auto' }}
    >
      <form onSubmit={handleUpload}>
        <h4 className="text-center mb-4">📤 Bulk Upload Aptitude Questions</h4>

        <div className="mb-3">
          <label htmlFor="csvFile" className="form-label fw-semibold">
            Choose CSV File
          </label>
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="form-control"
            disabled={loading}
          />
        </div>

        <div className="d-grid gap-2 mb-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Uploading...
              </>
            ) : (
              'Upload CSV'
            )}
          </button>
        </div>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="text-muted small text-center mt-3">
          <strong>Expected CSV columns:</strong>
          <br />
          quizTitle, topic, question, optionA, optionB, optionC, optionD,
          correctOptionKey, explanation
        </div>
      </form>
    </Card>
  )
}

export default CsvUploadForm
