import React, { useState, useCallback, useRef } from 'react'
import { Card, Spinner, Alert, Button, ProgressBar, Badge } from 'react-bootstrap'
import { BsCloudUpload, BsFiletypeCsv, BsCheckCircle, BsXCircle, BsInfoCircle, BsDownload } from 'react-icons/bs'
import { FaFileCsv } from 'react-icons/fa'

interface UploadStats {
  totalQuestions?: number
  insertedCount?: number
  skippedCount?: number
  errors?: string[]
}

const CsvUploadForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        
        const headers = lines[0].toLowerCase().split(',')
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null)
    setError(null)
    setUploadStats(null)
    setUploadProgress(0)

    if (!e.target.files || e.target.files.length === 0) return

    const selectedFile = e.target.files[0]

    // Validate file extension
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFile = e.dataTransfer.files[0]
    
    if (!droppedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed')
      return
    }
    
    if (droppedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(droppedFile)
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
      // Validate CSV content before upload
      setUploadProgress(20)
      await validateCSVContent(file)
      setUploadProgress(30)

      // 1️⃣ Get presigned upload URL
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

      // 2️⃣ Upload CSV to S3 with progress tracking
      const xhr = new XMLHttpRequest()
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = 50 + (event.loaded / event.total) * 30
            setUploadProgress(Math.round(percent))
          }
        })
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(true)
          } else {
            reject(new Error('Failed to upload CSV to S3'))
          }
        })
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'text/csv')
        xhr.send(file)
      })
      
      await uploadPromise
      setUploadProgress(80)

      // 3️⃣ Process CSV from S3
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

      // Store upload statistics
      if (processData.stats) {
        setUploadStats({
          totalQuestions: processData.stats.total || processData.stats.processed,
          insertedCount: processData.stats.inserted || processData.stats.success,
          skippedCount: processData.stats.skipped || processData.stats.failed,
          errors: processData.errors || processData.stats.errors
        })
      }

      setMessage(`✅ CSV uploaded & processed successfully! ${processData.message || ''}`)
      setFile(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reset progress after 2 seconds
      setTimeout(() => setUploadProgress(0), 3000)
    } catch (err: any) {
      console.error('CSV upload error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const headers = ['quizTitle', 'topic', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation']
    const sampleRow = [
      'Aptitude Test 1',
      'Quantitative',
      'What is 2 + 2?',
      '3',
      '4',
      '5',
      '6',
      'B',
      'Basic addition problem'
    ]
    
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
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
    <Card
      className={`border rounded-4 shadow-sm p-4 transition-all ${dragActive ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}
      style={{ maxWidth: '620px', margin: '2rem auto' }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <form onSubmit={handleUpload}>
        <div className="text-center mb-4">
          <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
            <FaFileCsv size={40} className="text-primary" />
          </div>
          <h4 className="mb-1">Bulk Upload Aptitude Questions</h4>
          <p className="text-muted small mb-0">Upload CSV file to add multiple questions at once</p>
        </div>

        {/* File Upload Area */}
        <div className="mb-4">
          <label htmlFor="csvFile" className="form-label fw-semibold">
            Choose CSV File
          </label>
          
          <div 
            className={`border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${
              dragActive ? 'border-primary bg-primary bg-opacity-5' : 'border-secondary'
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              id="csvFile"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="d-none"
              disabled={loading}
            />
            
            <BsCloudUpload size={48} className="text-muted mb-3" />
            
            {file ? (
              <div>
                <BsFiletypeCsv size={24} className="text-success mb-2" />
                <p className="mb-0 fw-semibold">{file.name}</p>
                <small className="text-muted">
                  {(file.size / 1024).toFixed(2)} KB
                </small>
                <div className="mt-2">
                  <Badge bg="info" pill>Ready to upload</Badge>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-1">Drag & drop your CSV file here</p>
                <small className="text-muted">or click to browse</small>
                <div className="mt-2">
                  <Badge bg="secondary" pill>CSV only • Max 10MB</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Uploading...</small>
              <small className="text-muted">{uploadProgress}%</small>
            </div>
            <ProgressBar 
              now={uploadProgress} 
              variant="primary" 
              animated 
              striped 
            />
          </div>
        )}

        {/* Upload Stats */}
        {uploadStats && (
          <Alert variant="success" className="mb-3">
            <div className="d-flex align-items-start gap-2">
              <BsCheckCircle size={20} className="flex-shrink-0 mt-1" />
              <div>
                <strong>Upload Summary</strong>
                <div className="mt-1">
                  <Badge bg="success" className="me-2">
                    Inserted: {uploadStats.insertedCount || 0}
                  </Badge>
                  {uploadStats.skippedCount !== undefined && uploadStats.skippedCount > 0 && (
                    <Badge bg="warning" className="me-2">
                      Skipped: {uploadStats.skippedCount}
                    </Badge>
                  )}
                  <Badge bg="info">
                    Total: {uploadStats.totalQuestions || 0}
                  </Badge>
                </div>
                {uploadStats.errors && uploadStats.errors.length > 0 && (
                  <div className="mt-2">
                    <small className="text-warning">
                      <BsInfoCircle className="me-1" />
                      {uploadStats.errors.length} warning(s) encountered
                    </small>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 mb-3">
          <Button
            type="submit"
            variant="primary"
            className="flex-grow-1"
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <BsCloudUpload className="me-2" />
                Upload CSV
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline-secondary"
            onClick={downloadSampleCSV}
            disabled={loading}
          >
            <BsDownload className="me-1" />
            Sample
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <Alert variant="success" className="mb-3" onClose={() => setMessage(null)} dismissible>
            <div className="d-flex align-items-center gap-2">
              <BsCheckCircle size={18} />
              <span>{message}</span>
            </div>
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
            <div className="d-flex align-items-center gap-2">
              <BsXCircle size={18} />
              <span>{error}</span>
            </div>
          </Alert>
        )}

        {/* CSV Format Info */}
        <div className="text-muted small mt-3 pt-2 border-top">
          <div className="d-flex align-items-start gap-2">
            <BsInfoCircle size={14} className="mt-1 flex-shrink-0" />
            <div>
              <strong>Expected CSV columns:</strong>
              <div className="mt-1">
                <code className="bg-light p-1 rounded d-block d-sm-inline-block">
                  quizTitle, topic, question, optionA, optionB, optionC, optionD, correctOptionKey, explanation
                </code>
              </div>
              <ul className="mt-2 mb-0 ps-3">
                <li>First row must be headers (case-sensitive)</li>
                <li>correctOptionKey should be A, B, C, or D</li>
                <li>Maximum 1000 questions per upload</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </Card>
  )
}

export default CsvUploadForm