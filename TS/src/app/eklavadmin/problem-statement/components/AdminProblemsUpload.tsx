import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaCloudUploadAlt, FaDownload, FaExclamationTriangle, FaFileExcel, FaSpinner, FaTable, FaTimes, FaCheckCircle } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import { Dropzone, UploadCard, UploadProgress, UploadSummary } from '../../aptitudeQuestionsUpload/components/UploadParts'

interface UploadStats {
  insertedCount: number
  skippedCount?: number
  totalRows?: number
  errors?: string[]
  duplicateTitles?: string[]
}

const REQUIRED = [
  { col: 'title', note: 'Problem title (unique)' },
  { col: 'desc', note: 'Problem description' },
  { col: 'difficulty', note: 'Easy | Medium | Hard' },
  { col: 'testCases', note: 'JSON array of test cases' },
]
const OPTIONAL = [
  { col: 'constraints', note: 'Problem constraints' },
  { col: 'examples', note: 'JSON array of examples' },
  { col: 'tags', note: 'Comma-separated tags' },
]

const cell = (value: any, max = 60) => {
  const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')
  return text.length > max ? `${text.slice(0, max)}…` : text
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
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

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

  const previewExcelFile = async (file: File) => {
    // Preview the first few rows of the Excel file
    const formData = new FormData()
    formData.append('file', file)
    setPreviewLoading(true)
    try {
      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/preview`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data && res.data.preview) {
        setPreviewData(res.data.preview.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to preview file:', err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const acceptFile = (selectedFile: File) => {
    setError('')
    setSuccess('')
    setUploadStats(null)
    setUploadProgress(0)
    setPreviewData([])
    if (validateExcelFile(selectedFile)) {
      setFile(selectedFile)
      previewExcelFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel (.xlsx) file')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      setUploadStats(null)
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
              setUploadProgress(Math.round(30 + (percentCompleted * 0.6)))
            }
          },
        }
      )

      setUploadProgress(100)
      setUploadStats({
        insertedCount: res.data.insertedCount || 0,
        skippedCount: res.data.skippedCount || 0,
        totalRows: res.data.totalRows || res.data.insertedCount,
        errors: res.data.errors || [],
        duplicateTitles: res.data.duplicateTitles || [],
      })
      setSuccess(`${res.data.insertedCount} problem${res.data.insertedCount === 1 ? '' : 's'} added.`)
      setFile(null)
      setPreviewData([])
      setTimeout(() => setUploadProgress(0), 1500)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to upload Excel file')
      setUploadProgress(0)
      if (err?.response?.data?.details) {
        setUploadStats({ insertedCount: 0, errors: [err.response.data.details] })
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleTemplate = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/api/dashboard/adminProblems/template`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      )
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'problems_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download template')
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreviewData([])
    setError('')
    setSuccess('')
    setUploadStats(null)
  }

  const previewCols = Object.keys(previewData[0] || {})
  const warnings = [
    ...(uploadStats?.errors || []),
    ...(uploadStats?.duplicateTitles || []).map(t => `Duplicate title skipped: ${t}`),
  ]

  return (
    <>
      <UploadCard
        icon={FaFileExcel}
        title="Upload Problems"
        subtitle="Add coding problems with their test cases from an Excel sheet"
        sample={<button type="button" className="aui-btn" onClick={downloadSampleTemplate} disabled={loading}><FaDownload size={11} /> Download template</button>}
        guide={
          <>
            <h4>Required columns</h4>
            <ul className="psu-cols">
              {REQUIRED.map(c => <li key={c.col}><code className="is-key">{c.col}</code><span>{c.note}</span></li>)}
            </ul>
            <h4 style={{ marginTop: '1rem' }}>Optional columns</h4>
            <ul className="psu-cols">
              {OPTIONAL.map(c => <li key={c.col}><code>{c.col}</code><span>{c.note}</span></li>)}
            </ul>
            <p className="aui-hint" style={{ marginTop: '0.9rem' }}>Excel (.xlsx / .xls) · max 5 MB. Titles must be unique; repeats are skipped.</p>
          </>
        }
      >
        {error && (
          <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
            <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
          </div>
        )}

        <Dropzone
          accept=".xlsx,.xls"
          hint="XLSX / XLS · max 5 MB"
          icon={FaFileExcel}
          file={file}
          disabled={loading}
          onFile={acceptFile}
          onClear={clearFile}
          fileSize={f => `${(f.size / 1024).toFixed(1)} KB`}
        />

        {/* First rows of the sheet, so mistakes show before uploading */}
        {file && (previewLoading || previewData.length > 0) && (
          <div className="psu-preview">
            <div className="psu-preview-head">
              <span><FaTable /> Preview · first {previewData.length || 5} rows</span>
              {previewData.length > 0 && <button type="button" className="aui-btn aui-btn-sm" onClick={() => setShowPreview(true)}>View all columns</button>}
            </div>
            {previewLoading ? (
              <div className="aui-empty psu-preview-loading"><FaSpinner className="aui-spin" /> Reading file…</div>
            ) : (
              <div className="aui-table-scroll">
                <table className="aui-table">
                  <thead><tr>{previewCols.slice(0, 5).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>{previewCols.slice(0, 5).map(k => <td key={k} title={cell(row[k], 400)}>{cell(row[k], 40)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <UploadProgress value={uploadProgress} label={uploadProgress < 90 ? 'Uploading file…' : 'Saving problems…'} />
        )}

        {uploadStats && (uploadStats.insertedCount > 0 || warnings.length > 0) && (
          <UploadSummary inserted={uploadStats.insertedCount} skipped={uploadStats.skippedCount} total={uploadStats.totalRows} errors={warnings} />
        )}
        {success && !uploadStats && <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{success}</span></div>}

        <div className="aqu-actions">
          <button type="button" className="aui-btn aui-btn-primary" onClick={handleUpload} disabled={!file || loading}>
            {loading ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Uploading…</> : <><FaCloudUploadAlt /> Upload Excel</>}
          </button>
        </div>
      </UploadCard>

      {/* Full preview */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered scrollable contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-page psu-modal">
          <div className="aui-modal-head">
            <span className="aui-heading-icon"><FaTable /></span>
            <div>
              <h3>File preview</h3>
              <p>{file?.name} · first {previewData.length} rows, all columns</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={() => setShowPreview(false)} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body psu-modal-body">
            <div className="aui-table-scroll psu-modal-scroll">
              <table className="aui-table">
                <thead><tr>{previewCols.map(k => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      {previewCols.map(k => (
                        <td key={k} className="psu-full-cell">
                          {typeof row[k] === 'object' && row[k] !== null ? <pre>{JSON.stringify(row[k], null, 2)}</pre> : String(row[k] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setShowPreview(false)}>Close</button>
          </div>
        </div>
      </Modal>

      <style>{`
        .psu-cols { margin: 0; padding: 0; list-style: none; }
        .psu-cols li { display: flex; align-items: center; gap: 10px; padding: 5px 0; border-bottom: 1px dashed #202326; color: #a6abb0; font-size: 0.78rem; }
        .psu-cols li:last-child { border-bottom: 0; }
        .psu-cols code { min-width: 92px; padding: 2px 8px; border: 1px solid #2c3034; border-radius: 6px; background: #17191c; color: #d1d5db; font-size: 0.72rem; }
        .psu-cols code.is-key { border-color: rgba(255,122,0,0.35); color: #ffb15e; }
        .psu-preview { overflow: hidden; border: 1px solid #25282b; border-radius: 12px; }
        .psu-preview-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0.55rem 0.8rem; border-bottom: 1px solid #25282b; background: #111315; color: #a6abb0; font-size: 0.76rem; font-weight: 650; }
        .psu-preview-head span { display: inline-flex; align-items: center; gap: 6px; }
        .psu-preview .aui-table-scroll { border-radius: 0; }
        .psu-preview .aui-table td { font-size: 0.74rem; white-space: nowrap; }
        .psu-preview-loading { padding: 1.2rem; flex-direction: row; }
        .psu-modal { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .psu-modal-body { padding: 0; }
        .psu-modal-scroll { border-radius: 0; }
        .psu-full-cell { max-width: 320px; font-size: 0.74rem !important; vertical-align: top !important; word-break: break-word; }
        .psu-full-cell pre { margin: 0; color: #c3c7ca; font-size: 0.7rem; white-space: pre-wrap; }
      `}</style>
    </>
  )
}

export default AdminProblemsUpload
