import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaCheckCircle,
  FaClipboardList,
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFileExcel,
  FaFlask,
  FaHourglassHalf,
  FaInfoCircle,
  FaPercentage,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUserGraduate,
  FaUsers,
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import {
  AdminPage, PageHeader, StatCards, Tabs, SearchInput, AdminSelect, TableFooter, EmptyState, ProgressBar,
  toOptions, initialsOf, type SelectOption,
} from '@/components/admin-ui'

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

type Tab = 'upload' | 'progress'
type StatusFilter = 'all' | 'complete' | 'inprogress' | 'notstarted'

const REQUIRED_COLUMNS = ['title', 'difficulty', 'description', 'testcase1input', 'testcase1output']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'IT', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Biomedical']
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']
const DIFF_BADGE: Record<string, string> = { Beginner: 'aui-badge-green', Intermediate: 'aui-badge-amber', Advanced: 'aui-badge-red' }
const PAGE_SIZES = [10, 25, 50]

const fmt = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusOf = (pct: number): StatusFilter => (pct >= 100 ? 'complete' : pct > 0 ? 'inprogress' : 'notstarted')
const completionBadge = (pct: number) => (pct >= 100 ? 'aui-badge-green' : pct > 0 ? 'aui-badge-amber' : 'aui-badge-muted')

const DifficultyBadge = ({ value }: { value: string }) => (
  <span className={`aui-badge ${DIFF_BADGE[value] || 'aui-badge-muted'}`}>{value || '—'}</span>
)

/* ── Component ── */
const CollegeLabsUpload = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  /* saved programs */
  const [programs, setPrograms] = useState<LabProgram[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [programSearch, setProgramSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [programPage, setProgramPage] = useState(1)
  const [programPageSize, setProgramPageSize] = useState(10)
  const [programToDelete, setProgramToDelete] = useState<LabProgram | null>(null)
  const [deleting, setDeleting] = useState(false)

  /* upload — file is validated locally first, then sent to S3 and processed */
  const [branch, setBranch] = useState('CSE')
  const currentYear = new Date().getFullYear()
  const JOINING_YEARS = Array.from({ length: 8 }, (_, i) => String(currentYear - i))
  const [year, setYear] = useState(String(currentYear - 2))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<LabProgram[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* student progress */
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [studentPage, setStudentPage] = useState(1)
  const [studentPageSize, setStudentPageSize] = useState(10)

  /* student detail modal */
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
    setPrograms(Array.isArray(data.data) ? data.data.map((p: any) => ({ ...p, id: p._id || p.id, testCases: p.testCases || [] })) : [])
  }

  const resetFile = () => {
    setSelectedFile(null); setPreview([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBulkFile = async (file: File) => {
    try {
      setError(''); setMessage('')
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false })
      if (!rows.length) { resetFile(); setError('File is empty.'); return }
      const missingColumns = validateColumns(rows[0])
      if (missingColumns.length) { resetFile(); setError(`Missing required columns: ${missingColumns.join(', ')}`); return }

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

      setPreview(mapped); setSelectedFile(file)
    } catch {
      resetFile()
      setError('Failed to parse file. Please upload a valid Excel/CSV file.')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleBulkFile(file)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]; if (file) handleBulkFile(file)
  }

  // Confirmed from the in-app dialog (replaces the browser confirm box)
  const removeProgram = async () => {
    if (!programToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`${baseURL}/api/institute/college-labs/${programToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.message || 'Failed to delete program')
        return
      }
      setPrograms(prev => prev.filter(p => p.id !== programToDelete.id))
      setMessage(`"${programToDelete.title}" deleted.`)
    } catch {
      setError('Failed to delete program')
    } finally {
      setDeleting(false); setProgramToDelete(null)
    }
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
      resetFile()
    } catch (err: any) {
      setMessage('')
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

  /* ── Derived data ── */
  const programBranches = useMemo(() => [...new Set(programs.map(p => p.branch).filter(Boolean))].sort(), [programs])
  const programYears = useMemo(() => [...new Set(programs.map(p => p.year).filter(Boolean))].sort().reverse(), [programs])

  const filteredPrograms = useMemo(() => {
    const q = programSearch.trim().toLowerCase()
    return programs.filter(p =>
      (!q || p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) &&
      (!diffFilter || p.difficulty === diffFilter) &&
      (!branchFilter || p.branch === branchFilter) &&
      (!yearFilter || p.year === yearFilter))
  }, [programs, programSearch, diffFilter, branchFilter, yearFilter])

  const students = progressData?.students ?? []

  const statusCounts = useMemo(() => {
    const counts = { all: students.length, complete: 0, inprogress: 0, notstarted: 0 }
    students.forEach(s => { counts[statusOf(s.percentage)] += 1 })
    return counts
  }, [students])

  const statusOptions: SelectOption[] = [
    { value: 'all', label: `All students (${statusCounts.all})` },
    { value: 'complete', label: `Completed (${statusCounts.complete})` },
    { value: 'inprogress', label: `In progress (${statusCounts.inprogress})` },
    { value: 'notstarted', label: `Not started (${statusCounts.notstarted})` },
  ]

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter(s =>
      (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || statusOf(s.percentage) === statusFilter))
  }, [students, search, statusFilter])

  const avgCompletion = useMemo(() => {
    if (!students.length) return 0
    return Math.round(students.reduce((acc, s) => acc + s.percentage, 0) / students.length)
  }, [students])

  const pagedPrograms = filteredPrograms.slice((programPage - 1) * programPageSize, programPage * programPageSize)
  const pagedStudents = filteredStudents.slice((studentPage - 1) * studentPageSize, studentPage * studentPageSize)

  const modalPrograms = useMemo(() => {
    if (!modalStudent) return []
    if (modalFilter === 'done') return modalStudent.programs.filter(p => p.completed)
    if (modalFilter === 'todo') return modalStudent.programs.filter(p => !p.completed)
    return modalStudent.programs
  }, [modalStudent, modalFilter])

  /* ── Effects ── */
  useEffect(() => {
    if (!token) return
    fetchPrograms().catch(err => setError(err.message || 'Failed to load labs')).finally(() => setProgramsLoading(false))
    fetchProgress() // header stats need it on either tab
  }, [token]) // eslint-disable-line

  useEffect(() => { setProgramPage(1) }, [programSearch, diffFilter, branchFilter, yearFilter, programPageSize])
  useEffect(() => { setStudentPage(1) }, [search, statusFilter, studentPageSize])

  const programFiltersActive = !!(programSearch || diffFilter || branchFilter || yearFilter)
  const clearProgramFilters = () => { setProgramSearch(''); setDiffFilter(''); setBranchFilter(''); setYearFilter('') }

  /* ── Render ── */
  return (
    <AdminPage className="cl-page">
      <PageHeader
        icon={FaFlask}
        title="College Labs"
        stats={
          <StatCards
            inline
            items={[
              { label: 'Lab Programs', value: programsLoading ? '—' : programs.length, icon: FaClipboardList, tone: 'orange' },
              { label: 'Students', value: progressData ? progressData.totalStudents : '—', icon: FaUsers, tone: 'blue' },
              { label: 'Avg Completion', value: progressData ? `${avgCompletion}%` : '—', icon: FaPercentage, tone: 'green' },
              { label: 'Fully Completed', value: progressData ? statusCounts.complete : '—', icon: FaTrophy, tone: 'purple' },
            ]}
          />
        }
        actions={
          <Tabs<Tab>
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: 'upload', label: 'Lab Programs', icon: FaCloudUploadAlt, count: programs.length },
              { value: 'progress', label: 'Student Progress', icon: FaUserGraduate, count: progressData?.totalStudents ?? '—' },
            ]}
          />
        }
      />

      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {message && (
        <div className={`aui-alert ${uploading ? 'aui-alert-info' : 'aui-alert-success'}`}>
          {uploading ? <FaSpinner className="aui-spin" /> : <FaCheckCircle />} <span>{message}</span>
          {!uploading && <button type="button" className="aui-alert-close" onClick={() => setMessage('')} aria-label="Dismiss"><FaTimes size={11} /></button>}
        </div>
      )}

      {/* ── LAB PROGRAMS TAB ── */}
      {activeTab === 'upload' && (
        <>
          <div className="aui-card">
            <div className="aui-toolbar">
              <div className="aui-toolbar-title">
                <h3>Bulk Upload</h3>
                <p>Add lab programs from an Excel or CSV file</p>
              </div>
              <div className="aui-toolbar-filters">
                <button type="button" className="aui-btn" onClick={downloadTemplate}><FaDownload size={11} /> Download Template</button>
              </div>
            </div>

            <div className="cl-upload">
              {/* Step 1 — batch tag */}
              <div className="cl-step">
                <div className="cl-step-head"><span>1</span> Choose the batch</div>
                <div className="aui-field">
                  <label className="aui-label">Branch</label>
                  <AdminSelect label="Branch" value={branch} options={BRANCHES.map(b => ({ value: b, label: b }))} onChange={setBranch} />
                </div>
                <div className="aui-field">
                  <label className="aui-label">Joining Year</label>
                  <AdminSelect label="Joining year" value={year} options={JOINING_YEARS.map(y => ({ value: y, label: y }))} onChange={setYear} />
                </div>
                <p className="aui-hint cl-tag-hint">
                  <FaInfoCircle /> <span>Programs will be assigned to <b>{branch}</b> students who joined in <b>{year}</b>.</span>
                </p>
              </div>

              {/* Step 2 — file */}
              <div className="cl-step">
                <div className="cl-step-head"><span>2</span> Add the file</div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} className="d-none" />
                {selectedFile ? (
                  <div className="cl-file">
                    <span className="cl-file-icon"><FaFileExcel /></span>
                    <div className="aui-stack">
                      <strong>{selectedFile.name}</strong>
                      <small>{(selectedFile.size / 1024).toFixed(1)} KB · {preview.length} program{preview.length === 1 ? '' : 's'} found</small>
                    </div>
                    <span className="aui-badge aui-badge-green aui-badge-dot">Validated</span>
                    <button type="button" className="aui-icon-btn" onClick={resetFile} disabled={uploading} aria-label="Remove file"><FaTimes size={11} /></button>
                  </div>
                ) : (
                  <div
                    className={`cl-drop${dragging ? ' is-dragging' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                  >
                    <span className="cl-drop-icon"><FaCloudUploadAlt /></span>
                    <strong>Drop your file here, or <u>browse</u></strong>
                    <small>.xlsx, .xls or .csv</small>
                  </div>
                )}
                <div className="cl-columns">
                  <span>Required columns</span>
                  {REQUIRED_COLUMNS.map(col => <code key={col}>{col}</code>)}
                  <span className="cl-columns-opt">Up to 5 test cases: testcase2input … testcase5output</span>
                </div>
              </div>
            </div>

            {preview.length > 0 && (
              <>
                <div className="cl-preview-head">
                  <span>Preview</span>
                  <small>{preview.length} program{preview.length === 1 ? '' : 's'} ready to upload</small>
                </div>
                <div className="aui-table-scroll cl-preview-scroll">
                  <table className="aui-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Program</th>
                        <th style={{ width: 130 }}>Difficulty</th>
                        <th style={{ width: 120 }}>Test Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((p, i) => (
                        <tr key={p.id}>
                          <td className="aui-num">{i + 1}</td>
                          <td>
                            <div className="aui-stack cl-program">
                              <strong>{p.title}</strong>
                              {p.description && <small title={p.description}>{p.description}</small>}
                            </div>
                          </td>
                          <td><DifficultyBadge value={p.difficulty} /></td>
                          <td><span className="aui-badge aui-badge-purple">{p.testCases.length} case{p.testCases.length === 1 ? '' : 's'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="cl-upload-foot">
              <span className="aui-hint">
                {selectedFile ? <>Uploading tags every program with <b>{branch} · {year}</b></> : 'Choose a file to preview the programs before uploading'}
              </span>
              <div className="cl-upload-actions">
                <button type="button" className="aui-btn" onClick={resetFile} disabled={!selectedFile || uploading}>Clear</button>
                <button type="button" className="aui-btn aui-btn-primary" onClick={uploadBulkFile} disabled={!selectedFile || uploading}>
                  {uploading ? <><FaSpinner className="aui-spin cl-spin-light" /> Uploading…</> : <><FaCloudUploadAlt /> Upload {preview.length || ''} Program{preview.length === 1 ? '' : 's'}</>}
                </button>
              </div>
            </div>
          </div>

          <div className="aui-card">
            <div className="aui-toolbar">
              <div className="aui-toolbar-title">
                <h3>Lab Programs</h3>
                <p>{programFiltersActive ? `${filteredPrograms.length} of ${programs.length} programs` : `${programs.length} program${programs.length === 1 ? '' : 's'} uploaded`}</p>
              </div>
              <div className="aui-toolbar-filters">
                <SearchInput value={programSearch} onChange={setProgramSearch} placeholder="Search programs…" />
                <AdminSelect label="Difficulty" value={diffFilter} options={toOptions('All levels', DIFFICULTIES)} onChange={setDiffFilter} />
                <AdminSelect label="Branch" value={branchFilter} options={toOptions('All branches', programBranches)} onChange={setBranchFilter} />
                <AdminSelect label="Year" value={yearFilter} options={toOptions('All years', programYears)} onChange={setYearFilter} />
              </div>
            </div>

            {programsLoading ? (
              <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading lab programs…</div>
            ) : filteredPrograms.length === 0 ? (
              programs.length === 0
                ? <EmptyState icon={FaClipboardList} title="No lab programs yet" text="Upload an Excel or CSV file above to add programs for a branch and batch." />
                : <EmptyState icon={FaClipboardList} title="No programs match" text="Try a different search or filter." action={<button type="button" className="aui-btn aui-btn-sm" onClick={clearProgramFilters}>Clear filters</button>} />
            ) : (
              <>
                <div className="aui-table-scroll">
                  <table className="aui-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Program</th>
                        <th style={{ width: 130 }}>Difficulty</th>
                        <th style={{ width: 170 }}>Batch</th>
                        <th style={{ width: 120 }}>Test Cases</th>
                        <th style={{ width: 80 }} className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPrograms.map((p, i) => (
                        <tr key={p.id}>
                          <td className="aui-num">{(programPage - 1) * programPageSize + i + 1}</td>
                          <td>
                            <div className="aui-stack cl-program">
                              <strong>{p.title}</strong>
                              {p.description && <small title={p.description}>{p.description}</small>}
                            </div>
                          </td>
                          <td><DifficultyBadge value={p.difficulty} /></td>
                          <td>
                            <div className="cl-batch">
                              <span className="aui-badge aui-badge-blue">{p.branch || '—'}</span>
                              <span className="aui-badge aui-badge-muted">{p.year || '—'}</span>
                            </div>
                          </td>
                          <td><span className="aui-badge aui-badge-purple">{p.testCases.length} case{p.testCases.length === 1 ? '' : 's'}</span></td>
                          <td className="text-end">
                            <button type="button" className="aui-icon-btn cl-delete" onClick={() => setProgramToDelete(p)} title="Delete program" aria-label={`Delete ${p.title}`}><FaTrash size={11} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TableFooter
                  page={programPage}
                  pageSize={programPageSize}
                  total={filteredPrograms.length}
                  onPageChange={setProgramPage}
                  pageSizeOptions={PAGE_SIZES}
                  onPageSizeChange={setProgramPageSize}
                  noun="programs"
                />
              </>
            )}
          </div>
        </>
      )}

      {/* ── STUDENT PROGRESS TAB ── */}
      {activeTab === 'progress' && (
        <div className="aui-card">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>Student Progress</h3>
              <p>Programs completed by each student</p>
            </div>
            <div className="aui-toolbar-filters">
              <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
              <AdminSelect label="Status" value={statusFilter} options={statusOptions} onChange={v => setStatusFilter(v as StatusFilter)} />
              <button type="button" className="aui-btn" onClick={fetchProgress} disabled={progressLoading}>
                <FaSyncAlt size={11} className={progressLoading ? 'aui-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {progressError && <div className="aui-alert cl-card-alert"><FaExclamationTriangle /> <span>{progressError}</span></div>}

          {progressLoading && !progressData ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading student progress…</div>
          ) : !progressData ? (
            <EmptyState icon={FaUserGraduate} title="Progress not loaded" text="Click Refresh to load student progress." />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={FaUserGraduate}
              title={students.length ? 'No students match' : 'No students yet'}
              text={students.length ? 'Try a different search or status.' : 'Students appear here once lab programs are assigned to their batch.'}
            />
          ) : (
            <>
              <div className="aui-table-scroll">
                <table className="aui-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>Student</th>
                      <th style={{ width: 240 }}>Progress</th>
                      <th style={{ width: 170 }}>Programs</th>
                      <th style={{ width: 110 }}>Completion</th>
                      <th style={{ width: 100 }} className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedStudents.map((s, i) => (
                      <tr key={s.studentId}>
                        <td className="aui-num">{(studentPage - 1) * studentPageSize + i + 1}</td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(s.name)}</span>
                            <div className="aui-stack">
                              <strong>{s.name}</strong>
                              <small>{s.email}</small>
                            </div>
                          </div>
                        </td>
                        <td><ProgressBar value={s.percentage} label={`${s.completed}/${s.total}`} /></td>
                        <td>
                          <span className="cl-split">
                            <b className="is-done">{s.completed}</b> done <i>·</i> <b className="is-left">{s.total - s.completed}</b> left
                          </span>
                        </td>
                        <td><span className={`aui-badge ${completionBadge(s.percentage)}`}>{s.percentage}%</span></td>
                        <td className="text-end">
                          <button type="button" className="aui-btn aui-btn-sm aui-btn-soft" onClick={() => { setModalStudent(s); setModalFilter('all') }}>
                            <FaEye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TableFooter
                page={studentPage}
                pageSize={studentPageSize}
                total={filteredStudents.length}
                onPageChange={setStudentPage}
                pageSizeOptions={PAGE_SIZES}
                onPageSizeChange={setStudentPageSize}
                noun="students"
              />
            </>
          )}
        </div>
      )}

      {/* ── STUDENT DETAIL MODAL ── */}
      <Modal show={!!modalStudent} onHide={() => setModalStudent(null)} centered scrollable dialogClassName="cl-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop">
        {modalStudent && (() => {
          const doneCount = modalStudent.programs.filter(p => p.completed).length
          const todoCount = modalStudent.programs.length - doneCount
          return (
            <div className="aui-page cl-modal">
              <div className="aui-modal-head">
                <span className="aui-avatar cl-modal-avatar">{initialsOf(modalStudent.name)}</span>
                <div>
                  <h3>{modalStudent.name}</h3>
                  <p>{modalStudent.email}</p>
                </div>
                <button type="button" className="aui-icon-btn" onClick={() => setModalStudent(null)} aria-label="Close"><FaTimes size={12} /></button>
              </div>

              <div className="aui-modal-body">
                <div className="aui-tiles">
                  <div className="aui-tile">
                    <div className="aui-tile-head"><span className="aui-tile-icon cl-tone-green"><FaCheckCircle /></span> Completed</div>
                    <div className="aui-tile-value">{doneCount}<small>programs</small></div>
                  </div>
                  <div className="aui-tile">
                    <div className="aui-tile-head"><span className="aui-tile-icon cl-tone-red"><FaHourglassHalf /></span> Pending</div>
                    <div className="aui-tile-value">{todoCount}<small>programs</small></div>
                  </div>
                  <div className="aui-tile">
                    <div className="aui-tile-head"><span className="aui-tile-icon cl-tone-orange"><FaPercentage /></span> Completion</div>
                    <ProgressBar value={modalStudent.percentage} label={`${modalStudent.percentage}%`} />
                    <div className="aui-tile-foot">{modalStudent.completed} of {modalStudent.total} programs</div>
                  </div>
                </div>

                <div className="cl-modal-bar">
                  <span className="aui-section-label">Programs</span>
                  <Tabs
                    small
                    label="Program status"
                    value={modalFilter}
                    onChange={setModalFilter}
                    items={[
                      { value: 'all', label: 'All', count: modalStudent.programs.length },
                      { value: 'done', label: 'Completed', count: doneCount },
                      { value: 'todo', label: 'Pending', count: todoCount },
                    ]}
                  />
                </div>

                <div className="aui-card cl-modal-table">
                  {modalPrograms.length === 0 ? (
                    <EmptyState icon={FaClipboardList} title="Nothing here" text={modalFilter === 'done' ? 'No programs completed yet.' : 'No programs to show.'} />
                  ) : (
                    <div className="aui-table-scroll">
                      <table className="aui-table">
                        <thead>
                          <tr>
                            <th style={{ width: 44 }}>#</th>
                            <th>Program</th>
                            <th style={{ width: 120 }}>Difficulty</th>
                            <th style={{ width: 110 }}>Status</th>
                            <th style={{ width: 110 }}>Language</th>
                            <th style={{ width: 125 }}>Completed On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalPrograms.map((prog, idx) => (
                            <tr key={prog.labId}>
                              <td className="aui-num">{idx + 1}</td>
                              <td className="cl-modal-title">{prog.title}</td>
                              <td><DifficultyBadge value={prog.difficulty} /></td>
                              <td>
                                {prog.completed
                                  ? <span className="aui-badge aui-badge-green aui-badge-dot">Done</span>
                                  : <span className="aui-badge aui-badge-red aui-badge-dot">Pending</span>}
                              </td>
                              <td>{prog.language ? <span className="aui-badge aui-badge-blue">{prog.language}</span> : <span className="aui-num">—</span>}</td>
                              <td className="aui-num">{fmt(prog.submittedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="aui-modal-foot">
                <button type="button" className="aui-btn" onClick={() => setModalStudent(null)}>Close</button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal show={!!programToDelete} onHide={() => !deleting && setProgramToDelete(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-page">
          <div className="aui-modal-body cl-confirm">
            <span className="cl-confirm-icon"><FaTrash /></span>
            <h3>Delete this program?</h3>
            <p><b>{programToDelete?.title}</b> will be removed from the {programToDelete?.branch} · {programToDelete?.year} labs. This can’t be undone.</p>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setProgramToDelete(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-danger" onClick={removeProgram} disabled={deleting}>
              {deleting ? <><FaSpinner className="aui-spin" /> Deleting…</> : <><FaTrash size={11} /> Delete Program</>}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .cl-page .aui-alert { margin-top: 1.25rem; margin-bottom: 0; }

        /* Upload card */
        .cl-upload { display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr); gap: 1.25rem; padding: 1.1rem; }
        .cl-step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 0.85rem; color: #fff; font-size: 0.85rem; font-weight: 700; }
        .cl-step-head span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,122,0,0.15); color: #ff9a3c; font-size: 0.7rem; font-weight: 800; }
        .cl-step .aui-field { margin-bottom: 0.85rem; }
        .cl-tag-hint { display: flex; gap: 7px; align-items: flex-start; line-height: 1.45; }
        .cl-tag-hint svg { flex: 0 0 auto; margin-top: 2px; color: #ff9a3c; }
        .cl-tag-hint b { color: #e5e7eb; }

        .cl-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 150px; padding: 1.25rem; border: 1.5px dashed #3a3f45; border-radius: 12px; background: #111315; color: #9aa0a6; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .cl-drop:hover, .cl-drop:focus-visible, .cl-drop.is-dragging { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); outline: none; }
        .cl-drop strong { color: #e5e7eb; font-size: 0.88rem; font-weight: 650; }
        .cl-drop strong u { color: #ff9a3c; text-decoration: none; }
        .cl-drop small { color: #6b7280; font-size: 0.74rem; }
        .cl-drop-icon { display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 4px; border: 1px solid rgba(255,122,0,0.25); border-radius: 13px; background: rgba(255,122,0,0.1); color: #ff7a00; font-size: 1.25rem; }

        .cl-file { display: flex; align-items: center; gap: 12px; min-height: 76px; padding: 0.85rem 1rem; border: 1px solid rgba(49,216,102,0.25); border-radius: 12px; background: rgba(49,216,102,0.05); }
        .cl-file .aui-stack { flex: 1; }
        .cl-file-icon { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 10px; background: rgba(49,216,102,0.13); color: #45dd75; font-size: 1.1rem; }

        .cl-columns { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 0.8rem; color: #6b7280; font-size: 0.72rem; }
        .cl-columns > span:first-child { margin-right: 2px; color: #9da2a8; font-weight: 650; }
        .cl-columns code { padding: 2px 7px; border: 1px solid #2c3034; border-radius: 6px; background: #17191c; color: #d1d5db; font-size: 0.7rem; }
        .cl-columns-opt { flex-basis: 100%; }

        .cl-preview-head { display: flex; align-items: baseline; gap: 10px; padding: 0.7rem 1.1rem; border-top: 1px solid #25282b; background: #111315; }
        .cl-preview-head span { color: #fff; font-size: 0.82rem; font-weight: 700; }
        .cl-preview-head small { color: #858a90; font-size: 0.74rem; }
        .cl-preview-scroll { max-height: 300px; overflow-y: auto; border-radius: 0; border-top: 1px solid #25282b; }
        .cl-preview-scroll thead th { position: sticky; top: 0; z-index: 1; background: #17191b; }

        .cl-upload-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.8rem 1.1rem; border-top: 1px solid #25282b; }
        .cl-upload-foot b { color: #e5e7eb; }
        .cl-upload-actions { display: flex; gap: 8px; }
        .cl-spin-light { color: #fff; }

        /* Tables */
        .cl-program { max-width: 520px; }
        .cl-program small { white-space: nowrap; }
        .cl-batch { display: flex; gap: 6px; }
        .cl-delete:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .cl-split { color: #858a90; font-size: 0.76rem; white-space: nowrap; }
        .cl-split b { font-weight: 700; }
        .cl-split .is-done { color: #45dd75; }
        .cl-split .is-left { color: #fb737a; }
        .cl-split i { margin: 0 3px; color: #3f444a; font-style: normal; }
        .cl-card-alert { margin: 0.8rem !important; }

        /* Student modal */
        .cl-dialog { max-width: 960px; }
        .cl-modal { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .cl-modal-avatar { width: 42px; height: 42px; flex-basis: 42px; font-size: 0.85rem; }
        .cl-modal .aui-tile .aui-progress { margin-top: 2px; }
        .cl-tone-green { background: rgba(49,216,102,0.13); color: #45dd75; }
        .cl-tone-red { background: rgba(251,95,103,0.13); color: #fb737a; }
        .cl-tone-orange { background: rgba(255,122,0,0.13); color: #ff9a3c; }
        .cl-modal-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin: 1.1rem 0 0.65rem; }
        .cl-modal-bar .aui-section-label { margin: 0; }
        .cl-modal-table { margin-top: 0 !important; overflow: hidden; }
        .cl-modal-table .aui-table-scroll { border-radius: 12px; }
        .cl-modal-title { color: #eceef0 !important; font-weight: 600; }

        /* Delete confirm */
        .cl-confirm { padding: 1.5rem 1.5rem 1.1rem; text-align: center; }
        .cl-confirm-icon { display: inline-grid; place-items: center; width: 48px; height: 48px; margin-bottom: 0.75rem; border: 1px solid rgba(251,95,103,0.3); border-radius: 14px; background: rgba(251,95,103,0.12); color: #fb737a; font-size: 1.05rem; }
        .cl-confirm h3 { margin: 0 0 0.4rem; color: #fff; font-size: 1.05rem; font-weight: 750; }
        .cl-confirm p { margin: 0; color: #9aa0a6; font-size: 0.82rem; line-height: 1.5; }
        .cl-confirm p b { color: #e5e7eb; }

        @media (max-width: 991.98px) {
          .cl-upload { grid-template-columns: 1fr; }
        }
        @media (max-width: 575.98px) {
          .cl-upload-foot { flex-direction: column; align-items: stretch; }
          .cl-upload-actions { justify-content: flex-end; }
        }
      `}</style>
    </AdminPage>
  )
}

export default CollegeLabsUpload
