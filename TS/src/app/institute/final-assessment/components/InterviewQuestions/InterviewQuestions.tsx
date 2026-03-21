import React, { useState } from 'react'
import { Form, Button, Alert, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { 
  FaFileExcel, 
  FaUpload, 
  FaDownload, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaDatabase,
  FaPlus,
  FaTrash
} from 'react-icons/fa'

type IQProps = {
  apiBase?: 'tr' | 'hr';
};

const AdminInterviewQuestionsUpload: React.FC<IQProps> = ({ apiBase = 'tr' }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | {
    success?: boolean
    message?: string
    error?: string
    processed?: number
    inserted?: number
    updated?: number
    skipped?: number
  }>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null)
    setFile(e.target.files?.[0] || null)
  }

  const handleUpload = async () => {
    if (!file) return
    if (!token) {
      setResult({ success: false, error: 'Not authenticated' })
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('excelFile', file)

      const res = await fetch(`${baseURL}/admin/${apiBase}/upload-questions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ success: false, error: e?.message || 'Upload failed' })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = [
      'Topic,Question',
      'React,What is a virtual DOM in React?',
      'React,What are React hooks?',
      'JavaScript,Explain closures in JavaScript.',
      'HTML,What are semantic HTML elements?',
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${apiBase.toUpperCase()}_InterviewQuestionsTemplate.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTitle = () => {
    return apiBase === 'tr' ? 'Technical Interview Questions' : 'HR Interview Questions'
  }

  return (
    <div className="interview-upload-container">
      <div className="upload-wrapper">
        {/* Header */}
        <div className="upload-header">
          <div className="header-icon-wrapper">
            <FaFileExcel className="header-icon" />
          </div>
          <div className="header-text">
            <h4 className="upload-title">{getTitle()}</h4>
            <p className="upload-subtitle">Upload Excel file with interview questions</p>
          </div>
        </div>

        {/* Template Download */}
        <div className="template-section">
          <div className="template-info">
            <FaDownload className="template-icon" />
            <span>Expected headers: <code>Topic</code> | <code>Question</code></span>
          </div>
          <Button 
            variant="link" 
            className="template-download-btn"
            onClick={downloadTemplate}
          >
            <FaDownload className="me-2" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div className="file-upload-area">
          <Form.Group controlId="excelFileInput">
            <Form.Label className="upload-label">
              <FaFileExcel className="label-icon" />
              Select Excel File (.xlsx / .xls)
            </Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={onFile}
              className="file-input"
            />
            <small className="file-hint">
              Supported formats: .xlsx, .xls | Maximum file size: 10MB
            </small>
          </Form.Group>

          {file && (
            <div className="selected-file">
              <FaFileExcel className="file-icon" />
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="upload-action">
          <Button 
            className="upload-btn"
            onClick={handleUpload} 
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner-icon" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload Questions
              </>
            )}
          </Button>
        </div>

        {/* Result Alert */}
        {result && (
          <Alert
            className={`result-alert ${result.success ? 'success-alert' : 'error-alert'}`}
            variant={result.success ? 'success' : 'danger'}
          >
            <div className="alert-header">
              {result.success ? (
                <FaCheckCircle className="alert-icon success" />
              ) : (
                <FaTimesCircle className="alert-icon error" />
              )}
              <span className="alert-message">
                {result.message || result.error || (result.success ? 'Upload completed successfully!' : 'Upload failed.')}
              </span>
            </div>
            
            {(result.processed !== undefined ||
              result.inserted !== undefined ||
              result.updated !== undefined ||
              result.skipped !== undefined) && (
              <div className="stats-grid">
                {result.processed !== undefined && (
                  <div className="stat-item">
                    <FaDatabase className="stat-icon" />
                    <div>
                      <span className="stat-label">Processed</span>
                      <span className="stat-value">{result.processed}</span>
                    </div>
                  </div>
                )}
                {result.inserted !== undefined && (
                  <div className="stat-item">
                    <FaPlus className="stat-icon success" />
                    <div>
                      <span className="stat-label">Inserted</span>
                      <span className="stat-value">{result.inserted}</span>
                    </div>
                  </div>
                )}
                {result.updated !== undefined && (
                  <div className="stat-item">
                    <FaDatabase className="stat-icon info" />
                    <div>
                      <span className="stat-label">Updated</span>
                      <span className="stat-value">{result.updated}</span>
                    </div>
                  </div>
                )}
                {result.skipped !== undefined && (
                  <div className="stat-item">
                    <FaTrash className="stat-icon warning" />
                    <div>
                      <span className="stat-label">Skipped</span>
                      <span className="stat-value">{result.skipped}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Alert>
        )}
      </div>

      <style>{`
        .interview-upload-container {
          background: transparent;
          width: 100%;
        }

        .upload-wrapper {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
        }

        /* Header */
        .upload-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .header-icon-wrapper {
          width: 48px;
          height: 48px;
          background: rgba(255, 122, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon {
          font-size: 1.75rem;
          color: #ff7a00;
        }

        .header-text {
          flex: 1;
        }

        .upload-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .upload-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        /* Template Section */
        .template-section {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .template-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #e5e5e5;
          font-size: 0.9rem;
        }

        .template-icon {
          color: #ff7a00;
          font-size: 1rem;
        }

        .template-info code {
          background: #1a1a1a;
          color: #ff7a00;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .template-download-btn {
          color: #ff7a00;
          text-decoration: none;
          padding: 0.375rem 1rem;
          border: 1px solid #ff7a00;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .template-download-btn:hover {
          background: #ff7a00;
          color: #000000;
          text-decoration: none;
        }

        /* File Upload Area */
        .file-upload-area {
          margin-bottom: 1.5rem;
        }

        .upload-label {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .label-icon {
          font-size: 0.9rem;
        }

        .file-input {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .file-input:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .file-input::file-selector-button {
          background: #2c2c2c;
          border: none;
          color: #ffffff;
          padding: 0.375rem 1rem;
          border-radius: 6px;
          margin-right: 1rem;
          cursor: pointer;
        }

        .file-input::file-selector-button:hover {
          background: #3a3a3a;
        }

        .file-hint {
          color: #6c757d;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          display: block;
        }

        .selected-file {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 0.75rem;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-icon {
          color: #ff7a00;
          font-size: 1.25rem;
        }

        .file-name {
          color: #ffffff;
          font-weight: 500;
          flex: 1;
        }

        .file-size {
          color: #8a8a8a;
          font-size: 0.8rem;
        }

        /* Upload Button */
        .upload-action {
          margin-bottom: 1.5rem;
        }

        .upload-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          width: 100%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Result Alert */
        .result-alert {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .success-alert {
          background: rgba(40, 167, 69, 0.1);
          border-left-color: #28a745;
        }

        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border-left-color: #dc3545;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        .alert-icon.success {
          color: #28a745;
        }

        .alert-icon.error {
          color: #dc3545;
        }

        .alert-message {
          color: #ffffff;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }

        .stat-icon {
          font-size: 1rem;
          color: #ff7a00;
        }

        .stat-icon.success {
          color: #28a745;
        }

        .stat-icon.info {
          color: #17a2b8;
        }

        .stat-icon.warning {
          color: #ffc107;
        }

        .stat-item div {
          flex: 1;
        }

        .stat-label {
          display: block;
          color: #8a8a8a;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          display: block;
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .upload-wrapper {
            padding: 1rem;
          }

          .template-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .template-download-btn {
            width: 100%;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-item {
            padding: 0.75rem;
          }

          .upload-header {
            flex-direction: column;
            text-align: center;
          }

          .header-icon-wrapper {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminInterviewQuestionsUpload