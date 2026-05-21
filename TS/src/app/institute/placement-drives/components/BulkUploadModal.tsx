import { useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Modal,
  Table,
} from 'react-bootstrap'
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaTimesCircle,
} from 'react-icons/fa'
// FaExclamationTriangle used for not-eligible alert, FaTimesCircle for errors
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import type { PlacementDrive } from './PlacementDriveManagement'

interface Props {
  show: boolean
  drive: PlacementDrive
  onHide: () => void
  onUploaded: () => void
}

interface UploadSummary {
  totalRows: number
  inserted: number
  duplicates: number
  notEligible: number
  errors: number
}

interface ErrorRow {
  row: number
  issue: string
}

const TEMPLATE_HEADERS = [
  'Full Name',
  'Roll Number',
  'Mobile Number',
  'Gender',
  'Personal Mail ID',
  'Branch',
  'SSC CGPA',
  'SSC %',
  'Inter/Diploma CGPA',
  'Inter %',
  'B.Tech CGPA',
  'B.Tech %',
  'Backlogs',
  'Batch',
]

const SAMPLE_ROWS = [
  ['Ravi Kumar', '21CS001', '9876543210', 'Male', 'ravi@example.com', 'CSE', '8.5', '85.00', '7.8', '78.00', '8.0', '75.00', '0', '2024-2025'],
  ['Priya Sharma', '21EC045', '9123456789', 'Female', 'priya@example.com', 'ECE', '7.2', '72.00', '6.8', '68.00', '7.5', '70.00', '1', '2025-2026'],
]

const downloadTemplate = () => {
  const csv = [TEMPLATE_HEADERS, ...SAMPLE_ROWS]
    .map((row) => row.join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'placement_students_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const BulkUploadModal = ({ show, drive, onHide, onUploaded }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [errors, setErrors] = useState<ErrorRow[]>([])
  const [uploadError, setUploadError] = useState('')

  const handleFile = (f: File) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    if (!allowed.includes(f.type) && !f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadError('Only Excel (.xlsx, .xls) or CSV files are accepted')
      return
    }
    setFile(f)
    setSummary(null)
    setErrors([])
    setUploadError('')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post(
        `${baseURL}/api/placement-drives/${drive._id}/students/bulk`,
        form,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      setSummary(res.data.summary)
      setErrors(res.data.errors || [])
      onUploaded()
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setSummary(null)
    setErrors([])
    setUploadError('')
  }

  const handleClose = () => {
    reset()
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      fullscreen
      contentClassName="bg-dark text-white"
    >
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title>
          Bulk Students Upload
          <span className="text-muted fs-6 ms-2">— {drive.companyName}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">

        {/* Template download */}
        <div
          className="d-flex align-items-center justify-content-between p-3 mb-4 rounded"
          style={{ background: '#111', border: '1px solid #2a2a2a' }}
        >
          <div>
            <div className="fw-semibold mb-1">Required Columns</div>
            <div className="d-flex flex-wrap gap-2">
              {TEMPLATE_HEADERS.map((h) => (
                <Badge key={h} bg="secondary" style={{ fontSize: '0.75rem' }}>
                  {h}
                </Badge>
              ))}
            </div>
            <div className="text-muted small mt-2">
              Cutoff: {drive.cutoffType === 'percentage' ? 'B.Tech %' : 'B.Tech CGPA'} &lt; <strong className="text-warning">
                {Number.isInteger(drive.cutoffScore) ? drive.cutoffScore : drive.cutoffScore.toFixed(1)}
                {drive.cutoffType === 'percentage' ? '%' : ''}
              </strong> will be marked not eligible.
              {' '}Backlogs: <strong className="text-warning">
                {drive.backlogPolicy === 'none'
                  ? 'No backlogs allowed'
                  : drive.backlogPolicy === 'limited'
                  ? `Max ${drive.maxBacklogs} backlog${drive.maxBacklogs === 1 ? '' : 's'} allowed`
                  : 'Any backlogs OK'}
              </strong>.
            </div>
          </div>
          <Button
            variant="outline-light"
            size="sm"
            onClick={downloadTemplate}
            className="ms-3 flex-shrink-0"
          >
            <FaDownload className="me-2" />
            Download Template
          </Button>
        </div>

        {/* Drop zone */}
        {!summary && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#ff7a00' : file ? '#22c55e' : '#444'}`,
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(255,122,0,0.05)' : '#0d0d0d',
              transition: 'all 0.2s',
              marginBottom: 24,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <FaFileExcel size={40} color="#22c55e" className="mb-3" />
                <div className="fw-semibold text-success fs-5">{file.name}</div>
                <div className="text-muted small mt-1">
                  {(file.size / 1024).toFixed(1)} KB — Click to change file
                </div>
              </>
            ) : (
              <>
                <FaCloudUploadAlt size={48} color="#555" className="mb-3" />
                <div className="fw-semibold fs-5">
                  Drag & drop your Excel / CSV file here
                </div>
                <div className="text-muted mt-1">or click to browse</div>
                <div className="text-muted small mt-2">Supports .xlsx, .xls, .csv</div>
              </>
            )}
          </div>
        )}

        {uploadError && (
          <Alert variant="danger" className="mb-3">
            <FaTimesCircle className="me-2" />
            {uploadError}
          </Alert>
        )}

        {/* Upload Result Summary */}
        {summary && (
          <div className="mb-4">
            <div className="fw-semibold fs-5 mb-3">Upload Complete</div>
            <div className="d-flex gap-3 flex-wrap mb-4">
              <SummaryCard label="Total Rows" value={summary.totalRows} color="#aaa" />
              <SummaryCard label="Enrolled" value={summary.inserted} color="#22c55e" />
              <SummaryCard label="Not Eligible" value={summary.notEligible} color="#ff7a00" />
              <SummaryCard label="Duplicates" value={summary.duplicates} color="#f59e0b" />
              <SummaryCard label="Errors" value={summary.errors} color="#ef4444" />
            </div>

            {summary.inserted > 0 && (
              <Alert variant="success" className="d-flex align-items-center gap-2">
                <FaCheckCircle />
                {summary.inserted} student(s) enrolled and notified via email.
              </Alert>
            )}

            {summary.notEligible > 0 && (
              <Alert variant="warning" className="d-flex align-items-center gap-2">
                <FaExclamationTriangle />
                {summary.notEligible} student(s) are below the cutoff {drive.cutoffType === 'percentage' ? 'B.Tech percentage' : 'B.Tech CGPA'} ({Number.isInteger(drive.cutoffScore) ? drive.cutoffScore : drive.cutoffScore.toFixed(1)}{drive.cutoffType === 'percentage' ? '%' : ''}) and marked as <strong className="ms-1">Not Eligible</strong>. They are enrolled but cannot participate in rounds.
              </Alert>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div>
                <div className="text-danger fw-semibold mb-2">
                  <FaTimesCircle className="me-2" />
                  Row Errors
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <Table size="sm" variant="dark" className="mb-0">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((e, i) => (
                        <tr key={i}>
                          <td>{e.row}</td>
                          <td className="text-danger">{e.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            <Button variant="outline-secondary" size="sm" className="mt-3" onClick={reset}>
              Upload Another File
            </Button>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-secondary">
        <Button variant="secondary" onClick={handleClose}>
          {summary ? 'Close' : 'Cancel'}
        </Button>
        {!summary && (
          <Button
            disabled={!file || uploading}
            onClick={handleUpload}
            style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff', fontWeight: 600 }}
          >
            {uploading ? 'Uploading...' : 'Upload & Enroll Students'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) => (
  <div
    style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 10,
      padding: '12px 20px',
      minWidth: 110,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {label}
    </div>
  </div>
)

export default BulkUploadModal
