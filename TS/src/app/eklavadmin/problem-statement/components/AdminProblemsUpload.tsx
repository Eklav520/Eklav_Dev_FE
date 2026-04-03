import { useState, useCallback, useRef } from 'react'
import { Card, Button, Form, Alert, Spinner, ProgressBar, Badge, Modal } from 'react-bootstrap'
import { 
  BsCloudUpload, BsFileExcel, BsCheckCircle, BsXCircle, 
  BsInfoCircle, BsDownload, BsTrash, BsEye, BsTable
} from 'react-icons/bs'
import { FaFileExcel } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface UploadStats {
  insertedCount: number
  skippedCount?: number
  totalRows?: number
  errors?: string[]
  duplicateTitles?: string[]
}

const AdminProblemsUpload = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateExcelFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Only Excel files (.xlsx, .xls) are allowed')
      return false
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return false
    }
    
    return true
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setSuccess('')
    setUploadStats(null)
    setUploadProgress(0)
    setPreviewData([])

    if (!e.target.files || e.target.files.length === 0) return

    const selectedFile = e.target.files[0]
    
    if (validateExcelFile(selectedFile)) {
      setFile(selectedFile)
      // Preview file data if needed
      previewExcelFile(selectedFile)
    }
  }, [])

  const previewExcelFile = async (file: File) => {
    // Optional: Preview first few rows of the Excel file
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/preview`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (res.data && res.data.preview) {
        setPreviewData(res.data.preview.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to preview file:', err)
    }
  }

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
    
    if (validateExcelFile(droppedFile)) {
      setFile(droppedFile)
      previewExcelFile(droppedFile)
      setError('')
      setSuccess('')
      setUploadStats(null)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel (.xlsx) file')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      setUploadProgress(10)

      const formData = new FormData()
      formData.append('file', file)
      
      setUploadProgress(30)

      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(30 + (percentCompleted * 0.6))
            }
          },
        }
      )

      setUploadProgress(100)
      
      // Store upload statistics
      setUploadStats({
        insertedCount: res.data.insertedCount || 0,
        skippedCount: res.data.skippedCount || 0,
        totalRows: res.data.totalRows || res.data.insertedCount,
        errors: res.data.errors || [],
        duplicateTitles: res.data.duplicateTitles || []
      })

      setSuccess(`✅ Upload successful! ${res.data.insertedCount} problems added successfully.`)
      setFile(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reset progress after 3 seconds
      setTimeout(() => setUploadProgress(0), 3000)
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to upload Excel file'
      setError(errorMsg)
      setUploadProgress(0)
      
      if (err?.response?.data?.details) {
        setUploadStats({
          insertedCount: 0,
          errors: [err.response.data.details]
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleTemplate = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/api/dashboard/adminProblems/template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      )
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'problems_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSuccess('Sample template downloaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to download template')
      setTimeout(() => setError(''), 3000)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreviewData([])
    setError('')
    setSuccess('')
    setUploadStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      Easy: 'success',
      Medium: 'warning',
      Hard: 'danger'
    }
    return colors[difficulty] || 'secondary'
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <Card.Header className="fw-semibold bg-white border-bottom">
          <div className="d-flex align-items-center gap-2">
            <FaFileExcel size={24} className="text-success" />
            <span>Upload Programming Problems (Excel)</span>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Alerts */}
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
              <div className="d-flex align-items-start gap-2">
                <BsXCircle size={18} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>Upload Failed</strong>
                  <p className="mb-0">{error}</p>
                </div>
              </div>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" onClose={() => setSuccess('')} dismissible className="mb-3">
              <div className="d-flex align-items-start gap-2">
                <BsCheckCircle size={18} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>Success!</strong>
                  <p className="mb-0">{success}</p>
                </div>
              </div>
            </Alert>
          )}

          {/* Upload Stats */}
          {uploadStats && uploadStats.insertedCount > 0 && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-start gap-2">
                <BsInfoCircle size={18} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>Upload Summary</strong>
                  <div className="mt-2">
                    <Badge bg="success" className="me-2">
                      ✓ Inserted: {uploadStats.insertedCount}
                    </Badge>
                    {uploadStats.skippedCount !== undefined && uploadStats.skippedCount > 0 && (
                      <Badge bg="warning" className="me-2">
                        ⚠ Skipped: {uploadStats.skippedCount}
                      </Badge>
                    )}
                    {uploadStats.totalRows && (
                      <Badge bg="info">
                        📊 Total: {uploadStats.totalRows}
                      </Badge>
                    )}
                  </div>
                  {uploadStats.errors && uploadStats.errors.length > 0 && (
                    <div className="mt-2">
                      <small className="text-danger">
                        {uploadStats.errors.length} error(s) encountered
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Uploading...</small>
                <small className="text-muted">{Math.round(uploadProgress)}%</small>
              </div>
              <ProgressBar 
                now={uploadProgress} 
                variant="primary" 
                animated 
                striped 
              />
            </div>
          )}

          {/* File Upload Area */}
          <Form.Group>
            <Form.Label className="fw-semibold">Excel File (.xlsx)</Form.Label>
            
            <div
              className={`border-2 border-dashed rounded-3 p-4 text-center cursor-pointer transition-all ${
                dragActive ? 'border-primary bg-primary bg-opacity-5' : 'border-secondary'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="d-none"
                disabled={loading}
              />
              
              <BsCloudUpload size={48} className="text-muted mb-3" />
              
              {file ? (
                <div>
                  <BsFileExcel size={32} className="text-success mb-2" />
                  <p className="mb-0 fw-semibold">{file.name}</p>
                  <small className="text-muted">
                    {(file.size / 1024).toFixed(2)} KB
                  </small>
                  <div className="mt-2 d-flex justify-content-center gap-2">
                    <Badge bg="success" pill>Ready to upload</Badge>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile()
                      }}
                    >
                      <BsTrash /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-1">Drag & drop your Excel file here</p>
                  <small className="text-muted">or click to browse</small>
                  <div className="mt-2">
                    <Badge bg="secondary" pill>XLSX/XLS only • Max 5MB</Badge>
                  </div>
                </div>
              )}
            </div>

            <Form.Text className="text-muted d-block mt-3">
              <div className="d-flex align-items-start gap-2">
                <BsInfoCircle size={14} className="mt-1 flex-shrink-0" />
                <div>
                  <strong>Required columns:</strong>
                  <ul className="mt-1 mb-0">
                    <li><code>title</code> - Problem title (required, unique)</li>
                    <li><code>desc</code> - Problem description (required)</li>
                    <li><code>difficulty</code> - Easy | Medium | Hard (required)</li>
                    <li><code>testCases</code> - JSON array of test cases (required)</li>
                  </ul>
                  <div className="mt-2">
                    <strong>Optional columns:</strong>
                    <ul className="mt-1 mb-0">
                      <li><code>constraints</code> - Problem constraints</li>
                      <li><code>examples</code> - JSON array of examples</li>
                      <li><code>tags</code> - Comma-separated tags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Form.Text>
          </Form.Group>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">
                  <BsTable className="me-1" />
                  Preview (first 5 rows)
                </small>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="p-0"
                >
                  <BsEye className="me-1" /> View Full Preview
                </Button>
              </div>
              <div className="border rounded-2 p-2 bg-light" style={{ maxHeight: '200px', overflow: 'auto' }}>
                <table className="table table-sm table-bordered mb-0">
                  <thead>
                    <tr>
                      {Object.keys(previewData[0] || {}).slice(0, 5).map((key) => (
                        <th key={key} className="small">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).slice(0, 5).map((value: any, valIdx) => (
                          <td key={valIdx} className="small text-truncate" style={{ maxWidth: '150px' }}>
                            {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value).slice(0, 50)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-4">
            <Button 
              variant="primary" 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="flex-grow-1"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <BsCloudUpload className="me-2" />
                  Upload Excel
                </>
              )}
            </Button>
            
            <Button 
              variant="outline-secondary" 
              onClick={downloadSampleTemplate}
              disabled={loading}
            >
              <BsDownload className="me-1" />
              Template
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsTable className="me-2" />
            File Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value: any, valIdx) => (
                        <td key={valIdx} style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center">No preview data available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .border-dashed {
          border-style: dashed !important;
        }
      `}</style>
    </>
  )
}

export default AdminProblemsUpload