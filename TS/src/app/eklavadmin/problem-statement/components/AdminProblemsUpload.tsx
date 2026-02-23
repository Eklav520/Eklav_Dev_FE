import { useState } from 'react'
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

const AdminProblemsUpload = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel (.xlsx) file')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post(
        `${baseURL}/api/dashboard/adminProblems/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(`Uploaded successfully. ${res.data.insertedCount} problems added`)
      setFile(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload Excel file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="fw-semibold">
        Upload Programming Problems (Excel)
      </Card.Header>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form.Group>
          <Form.Label>Excel File (.xlsx)</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx,.xls"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFile(e.target.files?.[0] || null)
            }}
          />

          <Form.Text className="text-muted d-block mt-2">
            <b>Required columns:</b><br />
            • <code>title</code><br />
            • <code>desc</code><br />
            • <code>difficulty</code> (Easy | Medium | Hard)<br />
            • <code>testCases</code> (JSON array)
          </Form.Text>
        </Form.Group>

        <Button className="mt-3" onClick={handleUpload} disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Uploading...
            </>
          ) : (
            'Upload Excel'
          )}
        </Button>
      </Card.Body>
    </Card>
  )
}

export default AdminProblemsUpload
