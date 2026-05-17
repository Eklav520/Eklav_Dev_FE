import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Modal } from 'react-bootstrap'
import { BsCloudUpload, BsDownload, BsTrash, BsPeopleFill, BsCheckCircleFill, BsXCircleFill, BsEye, BsFunnel } from 'react-icons/bs'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

/* ── Types ── */
type LabTestCase = { input: string; expectedOutput: string }
type LabProgram = {
  id: string
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  testCases: LabTestCase[]
  branch: string
  year: string
}

type ProgEntry = {
  labId: string
  title: string
  difficulty: string
  completed: boolean
  language: string | null
  submittedAt: string | null
}
type StudentProgress = {
  studentId: string
  name: string
  email: string
  completed: number
  total: number
  percentage: number
  programs: ProgEntry[]
}
type ProgressData = {
  totalPrograms: number
  totalStudents: number
  students: StudentProgress[]
}

type StatusFilter = 'all' | 'complete' | 'inprogress' | 'notstarted'

const REQUIRED_COLUMNS = ['title', 'difficulty', 'description', 'testcase1input', 'testcase1output']
const DIFF_COLOR: Record<string, string> = { Advanced: 'danger', Intermediate: 'warning', Beginner: 'success' }

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'complete', label: '100% Complete' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'notstarted', label: 'Not Started' },
]

const fmt = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Component ── */
const CollegeLabsUpload = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  /* upload tab state */
  const [programs, setPrograms] = useState<LabProgram[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [branch, setBranch] = useState('CSE')
  const [year, setYear] = useState('3rd Year')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const totalPrograms = useMemo(() => programs.length, [programs])

  /* progress tab state */
  const [activeTab, setActiveTab] = useState<'upload' | 'progress'>('upload')
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  /* modal state */
  const [modalStudent, setModalStudent] = useState<StudentProgress | null>(null)
  const [modalFilter, setModalFilter] = useState<'all' | 'done' | 'todo'>('all')

  /* ── Upload helpers ── */
  const normalizeDifficulty = (value: string): LabProgram['difficulty'] => {
    const n = String(value || '').trim().toLowerCase()
    if (n === 'advanced') return 'Advanced'
    if (n === 'intermediate') return 'Intermediate'
    return 'Beginner'
  }

  const validateColumns = (row: Record<string, any>) => {
    const keys = Object.keys(row || {}).map(k => k.toLowerCase().trim())
    return REQUIRED_COLUMNS.filter(col => !keys.includes(col))
  }

  const getCellValue = (row: Record<string, any>, key: string) => {
    const matched = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase())
    return matched ? String(row[matched] ?? '').trim() : ''
  }

  const fetchPrograms = async () => {
    if (!token) return
    const res = await fetch(`${baseURL}/api/institute/college-labs`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch labs')
    setPrograms(Array.isArray(data.data) ? data.data : [])
  }

  const handleBulkFile = async (file: File) => {
    try {
      setError(''); setMessage('')
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false })
      if (!rows.length) { setError('File is empty.'); return }
      const missingColumns = validateColumns(rows[0])
      if (missingColumns.length) { setError(`Missing required columns: ${missingColumns.join(', ')}`); return }

      const mapped: LabProgram[] = rows.map((row, index) => {
        const title = getCellValue(row, 'title')
        const difficulty = normalizeDifficulty(getCellValue(row, 'difficulty'))
        const description = getCellValue(row, 'description')
        const testCases: LabTestCase[] = []
        for (let i = 1; i <= 5; i++) {
          const input = getCellValue(row, `testcase${i}input`)
          const expectedOutput = getCellValue(row, `testcase${i}output`)
          if (input && expectedOutput) testCases.push({ input, expectedOutput })
        }
        if (!title) return null
        return { id: `${Date.now()}-${index}`, title, difficulty, description, testCases, branch, year }
      }).filter(Boolean) as LabProgram[]

      setPrograms(mapped); setSelectedFile(file); setSelectedFileName(file.name)
      setMessage(`Validated ${mapped.length} rows. Click "Upload Bulk File" to save.`)
    } catch {
      setError('Failed to parse file. Please upload a valid Excel/CSV file.')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleBulkFile(file)
  }

  const removeProgram = (id: string) => setPrograms(prev => prev.filter(p => p.id !== id))
  const clearAll = () => {
    setPrograms([]); setSelectedFileName(''); setSelectedFile(null)
    setMessage('Cleared current bulk list.')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadBulkFile = async () => {
    if (!token) { setError('Login required.'); return }
    if (!selectedFile) { setError('Please choose a file first.'); return }
    try {
      setUploading(true); setError(''); setMessage('Generating secure upload URL...')
      const presignRes = await fetch(`${baseURL}/api/institute/college-labs/generate-presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: selectedFile.name, fileType: selectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok || !presignData.success) throw new Error(presignData.message || 'Failed to create upload URL')

      setMessage('Uploading file to S3...')
      const putRes = await fetch(presignData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' }, body: selectedFile })
      if (!putRes.ok) throw new Error('Failed to upload file to S3')

      setMessage('Processing uploaded file...')
      const processRes = await fetch(`${baseURL}/api/institute/college-labs/process-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileUrl: presignData.fileUrl, branch, year }),
      })
      const processData = await processRes.json()
      if (!processRes.ok || !processData.success) throw new Error(processData.message || 'Failed to process uploaded file')

      await fetchPrograms()
      setMessage(`Upload complete: ${processData.stats?.validRows || 0} processed, ${processData.stats?.skippedRows || 0} skipped.`)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed')
    } finally { setUploading(false) }
  }

  const downloadTemplate = () => {
    const rows = [
      { title: 'File Handling Program', difficulty: 'Beginner', description: 'Read/write data to a text file.', testCase1Input: 'hello', testCase1Output: 'HELLO' },
      { title: 'OOP Inheritance Lab', difficulty: 'Intermediate', description: 'Build a class hierarchy.', testCase1Input: 'Student', testCase1Output: 'Role:Student' },
    ]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Labs')
    XLSX.writeFile(wb, 'college_labs_template.xlsx')
  }

  /* ── Progress helpers ── */
  const fetchProgress = async () => {
    if (!token) return
    try {
      setProgressLoading(true); setProgressError('')
      const res = await fetch(`${baseURL}/api/institute/college-labs/student-progress`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load progress')
      setProgressData(data)
    } catch (err: any) {
      setProgressError(err.message || 'Failed to load student progress')
    } finally { setProgressLoading(false) }
  }

  const filteredStudents = useMemo(() => {
    if (!progressData) return []
    const q = search.toLowerCase()
    return progressData.students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'complete' ? s.percentage === 100 :
        statusFilter === 'inprogress' ? s.percentage > 0 && s.percentage < 100 :
        statusFilter === 'notstarted' ? s.percentage === 0 : true
      return matchSearch && matchStatus
    })
  }, [progressData, search, statusFilter])

  const avgCompletion = useMemo(() => {
    if (!progressData?.students.length) return 0
    const sum = progressData.students.reduce((acc, s) => acc + s.percentage, 0)
    return Math.round(sum / progressData.students.length)
  }, [progressData])

  const modalPrograms = useMemo(() => {
    if (!modalStudent) return []
    if (modalFilter === 'done') return modalStudent.programs.filter(p => p.completed)
    if (modalFilter === 'todo') return modalStudent.programs.filter(p => !p.completed)
    return modalStudent.programs
  }, [modalStudent, modalFilter])

  /* ── Effects ── */
  useEffect(() => {
    if (!token) return
    fetchPrograms().catch(err => setError(err.message || 'Failed to load labs'))
  }, [token])

  useEffect(() => {
    if (activeTab === 'progress' && !progressData && !progressLoading) fetchProgress()
  }, [activeTab])

  /* ── Render ── */
  return (
    <div className="college-labs-upload" onClick={() => setShowFilterMenu(false)}>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <BsCloudUpload className="me-2" /> Upload Labs
        </button>
        <button className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
          <BsPeopleFill className="me-2" /> Student Progress
        </button>
      </div>

      {/* ── UPLOAD TAB ── */}
      {activeTab === 'upload' && (
        <>
          <div className="header-row">
            <div>
              <h4>College Lab Programs Upload</h4>
              <p>Upload lab programs in bulk using Excel or CSV.</p>
            </div>
            <Badge bg="dark" className="count-badge">Total: {totalPrograms}</Badge>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">{error}</Alert>}
          {message && <Alert variant="info" onClose={() => setMessage('')} dismissible className="mb-3">{message}</Alert>}

          {/* Branch + Year selectors */}
          <div className="branch-year-row">
            <div className="by-field">
              <label className="by-label">Branch</label>
              <select className="by-select" value={branch} onChange={e => setBranch(e.target.value)}>
                {['CSE', 'ECE', 'EEE', 'IT', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Biomedical'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="by-field">
              <label className="by-label">Year</label>
              <select className="by-select" value={year} onChange={e => setYear(e.target.value)}>
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="by-info">
              <span className="by-badge">{branch}</span>
              <span className="by-sep">·</span>
              <span className="by-badge">{year}</span>
              <span className="by-hint">Programs in this upload will be tagged to the selected branch &amp; year</span>
            </div>
          </div>

          <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} className="d-none" />
            <BsCloudUpload className="upload-icon" />
            <div>
              <div className="upload-title">Click to upload bulk labs file</div>
              <div className="upload-subtitle">Supported: .xlsx, .xls, .csv</div>
              <div className="upload-subtitle">Required: title, difficulty, description, testcase1input, testcase1output</div>
              {!!selectedFileName && <div className="selected-file">Selected: {selectedFileName}</div>}
            </div>
          </div>

          <div className="actions">
            <Button variant="outline-light" onClick={downloadTemplate}><BsDownload className="me-2" />Download Template</Button>
            <Button variant="warning" onClick={uploadBulkFile} disabled={!selectedFile || uploading}>{uploading ? 'Uploading...' : 'Upload Bulk File'}</Button>
            <Button variant="outline-danger" onClick={clearAll}><BsTrash className="me-2" />Clear All</Button>
          </div>

          <div className="pro-table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Title</th>
                  <th style={{ width: 130 }}>Difficulty</th>
                  <th style={{ width: 90 }}>Branch</th>
                  <th style={{ width: 100 }}>Year</th>
                  <th>Description</th>
                  <th style={{ width: 110 }}>Test Cases</th>
                  <th style={{ width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr><td colSpan={7} className="pro-table-empty">No lab programs added yet.</td></tr>
                ) : programs.map(p => (
                  <tr key={p.id} className="pro-table-row">
                    <td>
                      <span className="pro-table-title">{p.title}</span>
                    </td>
                    <td>
                      <span className={`diff-tag diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                    </td>
                    <td>
                      <span className="by-tag by-tag-branch">{p.branch || '—'}</span>
                    </td>
                    <td>
                      <span className="by-tag by-tag-year">{p.year || '—'}</span>
                    </td>
                    <td className="pro-table-desc">{p.description || '—'}</td>
                    <td>
                      <span className="tc-count">{p.testCases.length} cases</span>
                    </td>
                    <td className="pro-table-action">
                      <button className="del-btn" onClick={() => removeProgram(p.id)} title="Remove"><BsTrash size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── STUDENT PROGRESS TAB ── */}
      {activeTab === 'progress' && (
        <div className="progress-tab">
          <div className="header-row" style={{ marginBottom: '1rem' }}>
            <div>
              <h4>Student Progress</h4>
              <p>See how many programs each student has completed.</p>
            </div>
            <Button size="sm" variant="outline-warning" onClick={fetchProgress} disabled={progressLoading}>
              {progressLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {progressError && <Alert variant="danger" onClose={() => setProgressError('')} dismissible className="mb-3">{progressError}</Alert>}
          {progressLoading && <div className="text-center py-5 text-secondary">Loading student progress...</div>}

          {!progressLoading && progressData && (
            <>
              {/* Summary cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-value">{progressData.totalPrograms}</div>
                  <div className="summary-label">Total Programs</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value">{progressData.totalStudents}</div>
                  <div className="summary-label">Total Students</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value" style={{ color: avgCompletion >= 75 ? '#34d399' : avgCompletion >= 40 ? '#f59e0b' : '#f87171' }}>
                    {avgCompletion}%
                  </div>
                  <div className="summary-label">Avg Completion</div>
                </div>
              </div>

              {/* Search + Filter row */}
              <div className="search-filter-row" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  className="progress-search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="filter-wrap">
                  <button
                    className="filter-btn"
                    onClick={e => { e.stopPropagation(); setShowFilterMenu(v => !v) }}
                  >
                    <BsFunnel size={13} className="me-1" />
                    {STATUS_FILTER_OPTIONS.find(o => o.value === statusFilter)?.label}
                  </button>
                  {showFilterMenu && (
                    <div className="filter-menu">
                      {STATUS_FILTER_OPTIONS.map(opt => (
                        <div
                          key={opt.value}
                          className={`filter-item ${statusFilter === opt.value ? 'active' : ''}`}
                          onClick={() => { setStatusFilter(opt.value); setShowFilterMenu(false) }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Student table */}
              <div className="pro-table-wrap">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th style={{ width: 220 }}>Progress</th>
                      <th style={{ width: 130 }}>Completed</th>
                      <th style={{ width: 90 }}>Score</th>
                      <th style={{ width: 100 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={5} className="pro-table-empty">No students found.</td></tr>
                    ) : filteredStudents.map(s => {
                      const pct = s.percentage
                      const barColor = pct === 100 ? '#34d399' : pct > 0 ? '#f59e0b' : '#6b7280'
                      const scoreStyle = pct === 100
                        ? { background: '#052e16', color: '#34d399', border: '1px solid #166534' }
                        : pct > 0
                        ? { background: '#1c1200', color: '#fbbf24', border: '1px solid #78350f' }
                        : { background: '#111', color: '#6b7280', border: '1px solid #2c2c2c' }
                      return (
                        <tr key={s.studentId} className="pro-table-row">
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">{s.name.charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="pro-table-title">{s.name}</div>
                                <div className="pro-table-sub">{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="prog-bar-wrap-cell">
                              <div className="prog-bar-bg">
                                <div className="prog-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                              </div>
                              <span className="prog-fraction">{s.completed}/{s.total}</span>
                            </div>
                          </td>
                          <td>
                            <div className="completed-cell">
                              <span className="completed-done" style={{ color: '#34d399' }}>{s.completed} done</span>
                              <span className="completed-sep">·</span>
                              <span className="completed-todo" style={{ color: '#f87171' }}>{s.total - s.completed} left</span>
                            </div>
                          </td>
                          <td>
                            <span className="score-badge" style={scoreStyle}>{pct}%</span>
                          </td>
                          <td className="pro-table-action">
                            <button className="view-btn" onClick={() => { setModalStudent(s); setModalFilter('all') }}>
                              <BsEye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!progressLoading && !progressData && !progressError && (
            <div className="text-center py-5 text-secondary">Click Refresh to load student progress.</div>
          )}
        </div>
      )}

      {/* ── PROGRAM DETAIL MODAL ── */}
      <Modal show={!!modalStudent} onHide={() => setModalStudent(null)} centered contentClassName="modal-pro" dialogClassName="modal-75" backdropClassName="modal-blur-backdrop">
        {modalStudent && (() => {
          const doneCount = modalStudent.programs.filter(p => p.completed).length
          const todoCount = modalStudent.programs.filter(p => !p.completed).length
          const pct = modalStudent.percentage
          const barColor = pct === 100 ? '#34d399' : pct > 0 ? '#f59e0b' : '#6b7280'
          const initials = modalStudent.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
          return (
            <>
              {/* Header */}
              <div className="mpro-header">
                <div className="mpro-avatar">{initials}</div>
                <div className="mpro-identity">
                  <div className="mpro-name">{modalStudent.name}</div>
                  <div className="mpro-email">{modalStudent.email}</div>
                </div>
                <button className="mpro-close" onClick={() => setModalStudent(null)}>×</button>
              </div>

              {/* Stats strip */}
              <div className="mpro-stats">
                <div className="mpro-stat">
                  <span className="mpro-stat-val" style={{ color: '#34d399' }}>{doneCount}</span>
                  <span className="mpro-stat-lbl">Completed</span>
                </div>
                <div className="mpro-stat-divider" />
                <div className="mpro-stat">
                  <span className="mpro-stat-val" style={{ color: '#f87171' }}>{todoCount}</span>
                  <span className="mpro-stat-lbl">Pending</span>
                </div>
                <div className="mpro-stat-divider" />
                <div className="mpro-stat">
                  <span className="mpro-stat-val" style={{ color: barColor }}>{pct}%</span>
                  <span className="mpro-stat-lbl">Completion</span>
                </div>
                <div className="mpro-bar-wrap">
                  <div className="mpro-bar-track">
                    <div className="mpro-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <span className="mpro-bar-label">{modalStudent.completed} / {modalStudent.total}</span>
                </div>
              </div>

              {/* Filter pills */}
              <div className="mpro-pills">
                {(['all', 'done', 'todo'] as const).map(f => (
                  <button
                    key={f}
                    className={`mpro-pill ${modalFilter === f ? 'active' : ''}`}
                    onClick={() => setModalFilter(f)}
                  >
                    {f === 'all' ? `All  ${modalStudent.programs.length}` : f === 'done' ? `Completed  ${doneCount}` : `Pending  ${todoCount}`}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="mpro-table-wrap">
                <table className="mpro-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Program Title</th>
                      <th style={{ width: 115 }}>Difficulty</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 100 }}>Language</th>
                      <th style={{ width: 125 }}>Completed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalPrograms.length === 0 ? (
                      <tr><td colSpan={6} className="mpro-empty">No programs to show.</td></tr>
                    ) : modalPrograms.map((prog, idx) => (
                      <tr key={prog.labId} className={prog.completed ? 'row-done' : 'row-todo'}>
                        <td className="mpro-num">{idx + 1}</td>
                        <td className="mpro-title">{prog.title}</td>
                        <td>
                          <span className={`diff-tag diff-${(prog.difficulty || '').toLowerCase()}`}>{prog.difficulty}</span>
                        </td>
                        <td>
                          {prog.completed
                            ? <span className="status-done"><BsCheckCircleFill size={11} /> Done</span>
                            : <span className="status-pending"><BsXCircleFill size={11} /> Pending</span>}
                        </td>
                        <td className="mpro-lang">{prog.language || '—'}</td>
                        <td className="mpro-date">{fmt(prog.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mpro-footer">
                <button className="mpro-close-btn" onClick={() => setModalStudent(null)}>Close</button>
              </div>
            </>
          )
        })()}
      </Modal>

      <style>{`
        .college-labs-upload { padding: 1.25rem; background: #0a0a0a; border-radius: 1rem; }

        /* Tabs */
        .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid #2c2c2c; padding-bottom: 0.5rem; }
        .tab-btn { background: transparent; border: none; color: #9ca3af; font-size: 0.88rem; font-weight: 600; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; transition: all 0.15s; }
        .tab-btn:hover { color: #ff7a00; background: #15181d; }
        .tab-btn.active { color: #ff7a00; background: #1a1000; border: 1px solid #ff7a0055; }

        /* Branch + Year selectors */
        .branch-year-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 0.85rem 1.1rem; background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 10px; flex-wrap: wrap; }
        .by-field { display: flex; flex-direction: column; gap: 4px; }
        .by-label { color: #6b7280; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .by-select { background: #141414; border: 1px solid #2a2a2a; color: #e5e7eb; border-radius: 8px; padding: 6px 12px; font-size: 0.83rem; cursor: pointer; outline: none; min-width: 130px; }
        .by-select:focus { border-color: #ff7a00; }
        .by-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-left: 0.5rem; }
        .by-badge { background: #1a1000; border: 1px solid #ff7a0044; color: #ff7a00; border-radius: 6px; padding: 3px 10px; font-size: 0.73rem; font-weight: 700; }
        .by-sep { color: #333; }
        .by-hint { color: #444; font-size: 0.7rem; margin-left: 0.25rem; }
        .by-tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
        .by-tag-branch { background: #0c1a2e; color: #60a5fa; border: 1px solid #1e3a5f; }
        .by-tag-year { background: #1a0e00; color: #fb923c; border: 1px solid #7c2d12; }

        /* Upload tab */
        .header-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1rem; }
        .header-row h4 { color: #ff7a00; margin: 0; font-weight: 700; }
        .header-row p { margin: 0.25rem 0 0; color: #9ca3af; }
        .upload-box { border: 1px dashed #4b5563; border-radius: 0.75rem; padding: 1rem; display: flex; align-items: center; gap: 0.9rem; cursor: pointer; background: #101215; transition: all 0.2s; }
        .upload-box:hover { border-color: #ff7a00; background: #15181d; }
        .upload-icon { font-size: 1.6rem; color: #ff7a00; }
        .upload-title { color: #f9fafb; font-weight: 600; }
        .upload-subtitle { color: #9ca3af; font-size: 0.85rem; }
        .selected-file { color: #34d399; font-size: 0.85rem; margin-top: 0.15rem; }
        .count-badge { border: 1px solid #2c2c2c; color: #ff7a00; }
        .actions { margin-top: 0.9rem; display: flex; justify-content: flex-end; gap: 0.5rem; }

        /* ── Pro Table (shared) ── */
        .pro-table-wrap { margin-top: 1rem; border: 1px solid #1f1f1f; border-radius: 12px; overflow: hidden; background: #0d0d0d; }
        .pro-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .pro-table thead { background: #111; }
        .pro-table th { padding: 0.7rem 1rem; color: #6b7280; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #1f1f1f; white-space: nowrap; }
        .pro-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #141414; vertical-align: middle; }
        .pro-table tbody tr:last-child td { border-bottom: none; }
        .pro-table-row { transition: background 0.12s; }
        .pro-table-row:hover td { background: #111 !important; }
        .pro-table-title { color: #e5e7eb; font-weight: 600; font-size: 0.85rem; }
        .pro-table-sub { color: #6b7280; font-size: 0.75rem; margin-top: 2px; }
        .pro-table-desc { color: #9ca3af; font-size: 0.82rem; max-width: 340px; }
        .pro-table-action { text-align: center; }
        .pro-table-empty { text-align: center; color: #4b5563; padding: 2.5rem !important; font-size: 0.85rem; }

        /* Upload table extras */
        .tc-wrap { display: flex; flex-direction: column; gap: 3px; }
        .tc-count { display: inline-block; background: #0c2a3a; color: #38bdf8; border: 1px solid #0e4c6a; border-radius: 10px; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; margin-bottom: 3px; }
        .tc-line { font-size: 0.75rem; color: #9ca3af; display: flex; gap: 5px; }
        .tc-lbl { color: #4b5563; font-weight: 700; min-width: 22px; }
        .del-btn { background: #1a0505; border: 1px solid #7f1d1d; color: #f87171; border-radius: 7px; padding: 5px 9px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .del-btn:hover { background: #3b0a0a; border-color: #f87171; color: #fca5a5; }

        /* Progress table extras */
        .student-cell { display: flex; align-items: center; gap: 10px; }
        .student-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #ff7a00, #ff4500); color: #fff; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .prog-bar-wrap-cell { display: flex; align-items: center; gap: 8px; }
        .prog-bar-bg { flex: 1; height: 6px; background: #1f1f1f; border-radius: 4px; overflow: hidden; }
        .prog-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
        .prog-fraction { font-size: 0.72rem; color: #6b7280; white-space: nowrap; }
        .completed-cell { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; font-weight: 600; }
        .completed-sep { color: #3f3f3f; }
        .score-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
        .view-btn { background: #0a1929; border: 1px solid #1e4976; color: #60a5fa; border-radius: 7px; padding: 5px 12px; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; }
        .view-btn:hover { background: #112240; border-color: #60a5fa; color: #93c5fd; }

        /* Progress tab */
        .summary-cards { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .summary-card { flex: 1; background: #101215; border: 1px solid #2c2c2c; border-radius: 10px; padding: 0.9rem 1.2rem; text-align: center; }
        .summary-value { font-size: 1.6rem; font-weight: 800; color: #ff7a00; }
        .summary-label { font-size: 0.72rem; color: #9ca3af; margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Search + Filter */
        .search-filter-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center; }
        .progress-search { flex: 1; background: #101215; border: 1px solid #2c2c2c; border-radius: 8px; padding: 0.5rem 0.9rem; color: #f9fafb; font-size: 0.88rem; outline: none; }
        .progress-search:focus { border-color: #ff7a00; }
        .filter-wrap { position: relative; }
        .filter-btn { background: #101215; border: 1px solid #2c2c2c; border-radius: 8px; padding: 0.48rem 0.9rem; color: #d1d5db; font-size: 0.82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; white-space: nowrap; transition: all 0.15s; }
        .filter-btn:hover { border-color: #ff7a00; color: #ff7a00; }
        .filter-menu { position: absolute; right: 0; top: calc(100% + 4px); background: #1a1a1a; border: 1px solid #2c2c2c; border-radius: 8px; z-index: 100; min-width: 160px; overflow: hidden; box-shadow: 0 8px 24px #00000066; }
        .filter-item { padding: 0.5rem 1rem; font-size: 0.82rem; color: #d1d5db; cursor: pointer; transition: background 0.1s; }
        .filter-item:hover { background: #252525; color: #fff; }
        .filter-item.active { background: #1a1000; color: #ff7a00; font-weight: 600; }


        /* ── Backdrop blur ── */
        .modal-blur-backdrop { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); background: rgba(0,0,0,0.7) !important; opacity: 1 !important; }

        /* ── Modal size ── */
        .modal-75 { width: 75vw !important; max-width: 75vw !important; }
        .modal-75 .modal-pro { height: 75vh; display: flex; flex-direction: column; }

        /* ── Pro Modal shell ── */
        .modal-pro { background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 16px !important; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.8); }

        /* Header */
        .mpro-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid #1a1a1a; background: linear-gradient(135deg, #111 0%, #0d0d0d 100%); position: relative; }
        .mpro-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #ff7a00, #ff4500); color: #fff; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 0 3px #1a1000; }
        .mpro-identity { flex: 1; min-width: 0; }
        .mpro-name { color: #f9fafb; font-weight: 700; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mpro-email { color: #6b7280; font-size: 0.78rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mpro-close { background: none; border: none; color: #6b7280; font-size: 1.4rem; line-height: 1; cursor: pointer; padding: 0 0.25rem; transition: color 0.15s; }
        .mpro-close:hover { color: #f9fafb; }

        /* Stats strip */
        .mpro-stats { display: flex; align-items: center; gap: 0; padding: 0.85rem 1.5rem; background: #0a0a0a; border-bottom: 1px solid #1a1a1a; }
        .mpro-stat { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
        .mpro-stat-val { font-size: 1.3rem; font-weight: 800; line-height: 1.1; }
        .mpro-stat-lbl { font-size: 0.68rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
        .mpro-stat-divider { width: 1px; height: 36px; background: #1f1f1f; margin: 0 1rem; }
        .mpro-bar-wrap { flex: 1; margin-left: 1.5rem; display: flex; flex-direction: column; gap: 6px; }
        .mpro-bar-track { height: 6px; background: #1f1f1f; border-radius: 4px; overflow: hidden; }
        .mpro-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .mpro-bar-label { font-size: 0.72rem; color: #6b7280; text-align: right; }

        /* Filter pills */
        .mpro-pills { display: flex; gap: 0.5rem; padding: 0.85rem 1.5rem 0.5rem; background: #0a0a0a; }
        .mpro-pill { background: #111; border: 1px solid #222; border-radius: 20px; padding: 0.28rem 0.9rem; font-size: 0.78rem; font-weight: 600; color: #9ca3af; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .mpro-pill:hover { color: #f9fafb; border-color: #3f3f3f; }
        .mpro-pill.active { color: #ff7a00; border-color: #ff7a00; background: #1a0e00; }

        /* Table */
        .mpro-table-wrap { flex: 1; overflow-y: auto; background: #0a0a0a; min-height: 0; }
        .mpro-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .mpro-table thead { position: sticky; top: 0; z-index: 2; background: #111; }
        .mpro-table th { padding: 0.6rem 0.9rem; color: #6b7280; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1f1f1f; white-space: nowrap; }
        .mpro-table td { padding: 0.65rem 0.9rem; border-bottom: 1px solid #141414; vertical-align: middle; }
        .mpro-table tbody tr { transition: background 0.12s; }
        .mpro-table tbody tr:hover td { background: #111 !important; }
        .row-done td { background: #050e05; }
        .row-todo td { background: #0a0a0a; }
        .mpro-num { color: #3f3f3f; text-align: center; font-size: 0.75rem; font-weight: 600; }
        .mpro-title { color: #e5e7eb; font-weight: 500; }
        .mpro-lang { color: #60a5fa; font-size: 0.78rem; }
        .mpro-date { color: #6b7280; font-size: 0.76rem; white-space: nowrap; }
        .mpro-empty { text-align: center; color: #4b5563; padding: 2rem !important; }

        /* Difficulty tags */
        .diff-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        .diff-beginner { background: #052e16; color: #4ade80; }
        .diff-intermediate { background: #1c1200; color: #fbbf24; }
        .diff-advanced { background: #1f0a0a; color: #f87171; }

        /* Status */
        .status-done { display: inline-flex; align-items: center; gap: 5px; color: #34d399; font-weight: 600; font-size: 0.78rem; }
        .status-pending { display: inline-flex; align-items: center; gap: 5px; color: #f87171; font-weight: 600; font-size: 0.78rem; }

        /* Footer */
        .mpro-footer { display: flex; justify-content: flex-end; padding: 0.85rem 1.5rem; background: #0a0a0a; border-top: 1px solid #1a1a1a; }
        .mpro-close-btn { background: #1a1a1a; border: 1px solid #2c2c2c; color: #9ca3af; border-radius: 8px; padding: 0.4rem 1.2rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .mpro-close-btn:hover { background: #252525; color: #f9fafb; border-color: #3f3f3f; }

        @media (max-width: 900px) {
          .header-row { flex-direction: column; align-items: flex-start; }
          .actions { width: 100%; flex-direction: column; }
          .summary-cards { flex-direction: column; }
          .search-filter-row { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  )
}

export default CollegeLabsUpload
