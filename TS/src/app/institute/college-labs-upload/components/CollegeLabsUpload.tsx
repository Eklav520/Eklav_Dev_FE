import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Table } from 'react-bootstrap'
import { BsCloudUpload, BsDownload, BsTrash } from 'react-icons/bs'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

type LabTestCase = {
  input: string
  expectedOutput: string
}

type LabProgram = {
  id: string
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  testCases: LabTestCase[]
}

const REQUIRED_COLUMNS = ['title', 'difficulty', 'description', 'testcase1input', 'testcase1output']

const CollegeLabsUpload = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [programs, setPrograms] = useState<LabProgram[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const totalPrograms = useMemo(() => programs.length, [programs])

  const normalizeDifficulty = (value: string): LabProgram['difficulty'] => {
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'advanced') return 'Advanced'
    if (normalized === 'intermediate') return 'Intermediate'
    return 'Beginner'
  }

  const validateColumns = (row: Record<string, any>) => {
    const keys = Object.keys(row || {}).map((k) => k.toLowerCase().trim())
    const missing = REQUIRED_COLUMNS.filter((col) => !keys.includes(col))
    return missing
  }

  const fetchPrograms = async () => {
    if (!token) return

    const res = await fetch(`${baseURL}/api/institute/college-labs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch labs')
    }

    setPrograms(Array.isArray(data.data) ? data.data : [])
  }

  const getCellValue = (row: Record<string, any>, key: string) => {
    const matchedKey = Object.keys(row).find((k) => k.toLowerCase().trim() === key.toLowerCase())
    if (!matchedKey) return ''
    return String(row[matchedKey] ?? '').trim()
  }

  const handleBulkFile = async (file: File) => {
    try {
      setError('')
      setMessage('')

      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, {
        defval: '',
        raw: false,
      })

      if (!rows.length) {
        setError('File is empty. Please upload at least one lab row.')
        return
      }

      const missingColumns = validateColumns(rows[0])
      if (missingColumns.length) {
        setError(`Missing required columns: ${missingColumns.join(', ')}`)
        return
      }

      const mapped: LabProgram[] = rows
        .map((row, index) => {
          const title = getCellValue(row, 'title')
          const difficulty = normalizeDifficulty(getCellValue(row, 'difficulty'))
          const description = getCellValue(row, 'description')

          const testCases: LabTestCase[] = []
          for (let i = 1; i <= 5; i += 1) {
            const input = getCellValue(row, `testcase${i}input`)
            const expectedOutput = getCellValue(row, `testcase${i}output`)

            if (input && expectedOutput) {
              testCases.push({ input, expectedOutput })
            }
          }

          if (!title || testCases.length === 0) {
            return null
          }

          return {
            id: `${Date.now()}-${index}`,
            title,
            difficulty,
            description,
            testCases,
          }
        })
        .filter(Boolean) as LabProgram[]

      if (!mapped.length) {
        setError('No valid rows found. Ensure title and at least one test case pair are filled.')
        return
      }

      setPrograms(mapped)
      setSelectedFile(file)
      setSelectedFileName(file.name)
      setMessage(`Validated ${mapped.length} rows. Click "Upload Bulk File" to save.`)
    } catch (e) {
      setError('Failed to parse file. Please upload a valid Excel/CSV file.')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleBulkFile(file)
  }

  const removeProgram = (id: string) => {
    setPrograms((prev) => prev.filter((program) => program.id !== id))
  }

  const clearAll = () => {
    setPrograms([])
    setSelectedFileName('')
    setSelectedFile(null)
    setMessage('Cleared current bulk list.')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadBulkFile = async () => {
    if (!token) {
      setError('Login required to upload labs.')
      return
    }
    if (!selectedFile) {
      setError('Please choose a valid file first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setMessage('Generating secure upload URL...')

      const presignRes = await fetch(`${baseURL}/api/institute/college-labs/generate-presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      })

      const presignData = await presignRes.json()
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.message || 'Failed to create upload URL')
      }

      setMessage('Uploading file to S3...')
      const putRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        body: selectedFile,
      })

      if (!putRes.ok) {
        throw new Error('Failed to upload file to S3')
      }

      setMessage('Processing uploaded file...')
      const processRes = await fetch(`${baseURL}/api/institute/college-labs/process-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl: presignData.fileUrl }),
      })

      const processData = await processRes.json()
      if (!processRes.ok || !processData.success) {
        throw new Error(processData.message || 'Failed to process uploaded file')
      }

      await fetchPrograms()

      setMessage(
        `Upload complete: ${processData.stats?.validRows || 0} processed, ${processData.stats?.skippedRows || 0} skipped.`
      )
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!token) return

    fetchPrograms().catch((err) => setError(err.message || 'Failed to load labs'))
  }, [token])

  const downloadTemplate = () => {
    const templateRows = [
      {
        title: 'File Handling Program',
        difficulty: 'Beginner',
        description: 'Create a program to read and write data into a text file.',
        testCase1Input: 'hello',
        testCase1Output: 'HELLO',
        testCase2Input: 'world',
        testCase2Output: 'WORLD',
      },
      {
        title: 'OOP Inheritance Lab',
        difficulty: 'Intermediate',
        description: 'Build a class hierarchy for student and faculty models.',
        testCase1Input: 'Student',
        testCase1Output: 'Role:Student',
        testCase2Input: 'Faculty',
        testCase2Output: 'Role:Faculty',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Labs')
    XLSX.writeFile(workbook, 'college_labs_template.xlsx')
  }

  return (
    <div className="college-labs-upload">
      <div className="header-row">
        <div>
          <h4>College Lab Programs Upload</h4>
          <p>Upload lab programs in bulk using Excel or CSV.</p>
        </div>
        <Badge bg="dark" className="count-badge">
          Total: {totalPrograms}
        </Badge>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
          {error}
        </Alert>
      )}

      {message && (
        <Alert variant="info" onClose={() => setMessage('')} dismissible className="mb-3">
          {message}
        </Alert>
      )}

      <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
          className="d-none"
        />
        <BsCloudUpload className="upload-icon" />
        <div>
          <div className="upload-title">Click to upload bulk labs file</div>
          <div className="upload-subtitle">Supported: .xlsx, .xls, .csv</div>
          <div className="upload-subtitle">Required columns: title, difficulty, description, testcase1input, testcase1output</div>
          {!!selectedFileName && <div className="selected-file">Selected: {selectedFileName}</div>}
        </div>
      </div>

      <div className="actions">
        <Button variant="outline-light" onClick={downloadTemplate}>
          <BsDownload className="me-2" /> Download Template
        </Button>
        <Button variant="warning" onClick={uploadBulkFile} disabled={!selectedFile || uploading}>
          {uploading ? 'Uploading...' : 'Upload Bulk File'}
        </Button>
        <Button variant="outline-danger" onClick={clearAll}>
          <BsTrash className="me-2" /> Clear All
        </Button>
      </div>

      <div className="table-wrap">
        <Table responsive bordered hover variant="dark" className="mb-0">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Description</th>
              <th>Test Cases</th>
              <th style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-secondary py-4">
                  No lab programs added yet.
                </td>
              </tr>
            ) : (
              programs.map((program) => (
                <tr key={program.id}>
                  <td>{program.title}</td>
                  <td>
                    <Badge bg={program.difficulty === 'Advanced' ? 'danger' : program.difficulty === 'Intermediate' ? 'warning' : 'success'}>
                      {program.difficulty}
                    </Badge>
                  </td>
                  <td>{program.description || '-'}</td>
                  <td>
                    <div className="testcase-preview">
                      <Badge bg="info" className="mb-1">{program.testCases.length} cases</Badge>
                      <div className="testcase-line">Input: {program.testCases[0]?.input || '-'}</div>
                      <div className="testcase-line">Expected: {program.testCases[0]?.expectedOutput || '-'}</div>
                    </div>
                  </td>
                  <td>
                    <Button size="sm" variant="outline-danger" onClick={() => removeProgram(program.id)}>
                      <BsTrash />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <style>{`
        .college-labs-upload {
          padding: 1.25rem;
          background: #0a0a0a;
          border-radius: 1rem;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .header-row h4 {
          color: #ff7a00;
          margin: 0;
          font-weight: 700;
        }

        .header-row p {
          margin: 0.25rem 0 0;
          color: #9ca3af;
        }

        .upload-box {
          border: 1px dashed #4b5563;
          border-radius: 0.75rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          cursor: pointer;
          background: #101215;
          transition: all 0.2s ease;
        }

        .upload-box:hover {
          border-color: #ff7a00;
          background: #15181d;
        }

        .upload-icon {
          font-size: 1.6rem;
          color: #ff7a00;
        }

        .upload-title {
          color: #f9fafb;
          font-weight: 600;
        }

        .upload-subtitle {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .selected-file {
          color: #34d399;
          font-size: 0.85rem;
          margin-top: 0.15rem;
        }

        .count-badge {
          border: 1px solid #2c2c2c;
          color: #ff7a00;
        }

        .actions {
          margin-top: 0.9rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .table-wrap {
          margin-top: 1rem;
          border: 1px solid #2c2c2c;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .testcase-preview {
          min-width: 180px;
        }

        .testcase-line {
          color: #cbd5e1;
          font-size: 0.78rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        @media (max-width: 900px) {
          .header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .actions {
            width: 100%;
            justify-content: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default CollegeLabsUpload
