import React, { useState } from 'react'
import { Card } from 'react-bootstrap'

const CsvUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Please select a CSV file')
      return
    }

    try {
      // Step 1: Ask backend for presigned URL
      const presignRes = await fetch(`${baseURL}/s3/generate-presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'text/csv',
          folder: 'csv/apptitude'
        })
      })
      const { uploadUrl, fileUrl } = await presignRes.json()

      // Step 2: Upload file directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'text/csv' },
        body: file
      })

      // Step 3: Inform backend (so it parses the CSV from S3)
      const processRes = await fetch(`${baseURL}/upload-questions-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })   // 👈 send only the URL now
      })

      const data = await processRes.json()
      if (processRes.ok) {
        setMessage('CSV uploaded & processed successfully!')
      } else {
        setMessage('Processing failed: ' + data.message)
      }
    } catch (error) {
      console.error('Upload error', error)
      setMessage('Upload error. Please try again.')
    }
  }

  return (
    <Card className="border bg-light rounded-4 shadow-sm p-4" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <form onSubmit={handleUpload}>
        <h4 className="text-center mb-4">📤 Bulk Upload Questions (CSV)</h4>

        <div className="mb-3">
          <label htmlFor="csvFile" className="form-label fw-semibold">Choose CSV File</label>
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>

        <div className="d-grid gap-2 mb-3">
          <button type="submit" className="btn btn-primary" disabled={!file}>
            Upload CSV
          </button>
        </div>

        {message && (
          <div className="alert alert-info py-2 px-3">{message}</div>
        )}

        <div className="text-muted small text-center">
          <strong>CSV format:</strong> Category, Topic, Question, Answer, Explanation
        </div>
      </form>
    </Card>
  )
}

export default CsvUploadForm
