import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import {
  FaBriefcase,
  FaBuilding,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUsers,
  FaTimes,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaLayerGroup,
  FaUserGraduate,
  FaHourglassHalf,
  FaCloudUploadAlt,
  FaFileAlt,
  FaListUl,
  FaArrowLeft,
  FaCheck,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import {
  AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, EmptyState, initialsOf, type SelectOption,
} from '@/components/admin-ui'

interface ExistingJob {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string
  skills: string | string[]
  highlights: string | string[]
  jobType: string
  domain: string
  expiryDate: string
  logo: string
  tag?: string
  isExpired: boolean
}

const EMPTY_FORM = {
  title: '',
  company: '',
  experience: '',
  salary: '',
  location: '',
  skills: '',
  highlights: '',
  jobType: '',
  domain: '',
  expiryDate: '',
  logo: '',
  tag: ''
}

const JOB_TYPES: SelectOption[] = [
  { value: '', label: 'Select job type' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Fresher', label: 'Fresher' },
  { value: 'Experienced', label: 'Experienced' },
]

const DOMAINS: SelectOption[] = [
  { value: '', label: 'Select domain' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Non-Tech', label: 'Non-Tech' },
]

const QUILL_MODULES = {
  toolbar: [
    [{ header: [false, 2, 3] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ]
}

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : Math.ceil((d.getTime() - Date.now()) / 86400000)
}

const FieldLabel: React.FC<{ htmlFor?: string; icon: React.ElementType; children: React.ReactNode; optional?: boolean }> = ({ htmlFor, icon: Icon, children, optional = true }) => (
  <label className="aui-label" htmlFor={htmlFor}>
    <Icon className="jof-label-icon" />
    {children}
    {optional && <span className="aui-optional">Optional</span>}
  </label>
)

const AdminJobForm: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext();
  const token = (user as any)?.token as string | undefined;

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [existingJobs, setExistingJobs] = useState<ExistingJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [jobTableSearch, setJobTableSearch] = useState('')

  const [formData, setFormData] = useState({ ...EMPTY_FORM })

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Active jobs are loaded up front (the header stats use them) and refreshed when opening "Manage Jobs"
  const loadJobs = useCallback(() => {
    if (!token) return
    setLoadingJobs(true)
    fetch(`${baseURL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then((jobs: ExistingJob[]) => setExistingJobs(Array.isArray(jobs) ? jobs.filter(j => !j.isExpired) : []))
      .catch(() => setExistingJobs([]))
      .finally(() => setLoadingJobs(false))
  }, [baseURL, token])

  useEffect(() => { loadJobs() }, [loadJobs])

  const handleJobSelect = (job: ExistingJob) => {
    setSelectedJobId(job._id)
    setFormData({
      title: job.title,
      company: job.company,
      experience: job.experience,
      salary: job.salary,
      location: job.location,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || ''),
      highlights: Array.isArray(job.highlights) ? job.highlights.join('') : (job.highlights || ''),
      jobType: job.jobType,
      domain: job.domain,
      expiryDate: job.expiryDate ? job.expiryDate.split('T')[0] : '',
      logo: job.logo || '',
      tag: job.tag || ''
    })
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
    setShowEditForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setSelectedJobId('')
    setFormData({ ...EMPTY_FORM })
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
  }

  const switchMode = (newMode: 'create' | 'edit') => {
    setMode(newMode)
    setSelectedJobId('')
    setShowEditForm(false)
    setJobTableSearch('')
    setFormData({ ...EMPTY_FORM })
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
    if (newMode === 'edit') loadJobs()
  }

  const filteredTableJobs = existingJobs.filter(j =>
    (j.title || '').toLowerCase().includes(jobTableSearch.toLowerCase()) ||
    (j.company || '').toLowerCase().includes(jobTableSearch.toLowerCase())
  )

  const jobStats = useMemo(() => ({
    active: existingJobs.length,
    internships: existingJobs.filter(j => j.jobType === 'Internship').length,
    fresher: existingJobs.filter(j => j.jobType === 'Fresher').length,
    expiring: existingJobs.filter(j => { const d = daysUntil(j.expiryDate); return d != null && d >= 0 && d <= 7 }).length,
  }), [existingJobs])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const setField = (name: keyof typeof EMPTY_FORM, value: string) =>
    setFormData(prev => ({ ...prev, [name]: value }))

  const addFiles = (files: File[]) => { if (files.length) setAttachments(prev => [...prev, ...files]) }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files ? Array.from(e.target.files) : [])
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files || []))
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const requiredFieldFallbacks = {
    title: 'Untitled Job',
    company: 'Confidential Company',
    jobType: 'Fresher',
    domain: 'Tech',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  }

  // Only ever called from the Post/Update button — pressing Enter in a field must not publish a job
  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const jobPayload = {
        title: formData.title.trim() || requiredFieldFallbacks.title,
        company: formData.company.trim() || requiredFieldFallbacks.company,
        experience: formData.experience,
        salary: formData.salary,
        location: formData.location,
        skills: formData.skills,
        highlights: formData.highlights,
        jobType: formData.jobType || requiredFieldFallbacks.jobType,
        domain: formData.domain || requiredFieldFallbacks.domain,
        expiryDate: formData.expiryDate || requiredFieldFallbacks.expiryDate,
        logo: formData.logo,
        tag: formData.tag
      }

      const payload = new FormData()
      Object.entries(jobPayload).forEach(([key, value]) => {
        payload.append(key, value)
      })
      attachments.forEach(file => payload.append('attachments', file))

      const isEdit = mode === 'edit' && selectedJobId
      const url = isEdit ? `${baseURL}/jobs/${selectedJobId}` : `${baseURL}/jobs`
      const method = isEdit ? 'PUT' : 'POST'

      let response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      })

      let errorData: any = null
      if (!response.ok) {
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const missingRequiredFields =
          errorData?.error === 'Missing required fields' &&
          Array.isArray(errorData?.required)

        // Some production environments fail to parse multipart text fields.
        // Retry with JSON so required fields are correctly parsed server-side.
        if (missingRequiredFields) {
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobPayload)
          })

          if (!response.ok) {
            try {
              errorData = await response.json()
            } catch {
              errorData = null
            }
          }
        }
      }

      if (!response.ok) {
        const message = errorData?.message || errorData?.error || (isEdit ? 'Failed to update job' : 'Failed to create job')
        throw new Error(message)
      }

      if (isEdit) {
        setShowEditForm(false)
        setSelectedJobId('')
        setSuccessMessage('Job updated successfully')
      } else {
        setSuccessMessage('Job posted successfully')
      }
      loadJobs()

      setFormData({ ...EMPTY_FORM })
      setAttachments([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const skillList = formData.skills.split(',').map(s => s.trim()).filter(Boolean)
  const previewExpiry = formData.expiryDate ? daysUntil(formData.expiryDate) : null
  const showForm = mode === 'create' || showEditForm

  const renderForm = () => (
    <div className="jof-layout">
      {/* Form */}
      <form className="aui-card jof-form" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="aui-toolbar">
          <div className="aui-toolbar-title jof-form-title">
            <span className="aui-heading-icon jof-form-icon">{showEditForm ? <FaEdit /> : <FaBriefcase />}</span>
            <div>
              <h3>{showEditForm ? `Editing: ${formData.title || 'Untitled job'}` : 'Post a New Job'}</h3>
              <p>{showEditForm ? (formData.company || 'Update the details and save') : 'Students see this listing on their Jobs page'}</p>
            </div>
          </div>
          {showEditForm && (
            <button type="button" className="aui-btn" onClick={cancelEdit} disabled={loading}>
              <FaArrowLeft size={10} /> Back to jobs
            </button>
          )}
        </div>

        <div className="jof-form-body">
          <div className="jof-section-label">Job Details</div>
          <div className="aui-field-row">
            <div className="aui-field">
              <FieldLabel htmlFor="job-title" icon={FaBriefcase}>Job Title</FieldLabel>
              <input id="job-title" className="aui-input" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior React Developer" />
            </div>
            <div className="aui-field">
              <FieldLabel htmlFor="job-company" icon={FaBuilding}>Company</FieldLabel>
              <input id="job-company" className="aui-input" name="company" value={formData.company} onChange={handleChange} placeholder="Company name" />
            </div>
          </div>
          <div className="aui-field-row">
            <div className="aui-field">
              <FieldLabel icon={FaUsers}>Job Type</FieldLabel>
              <AdminSelect label="Job type" value={formData.jobType} options={JOB_TYPES} onChange={v => setField('jobType', v)} />
            </div>
            <div className="aui-field">
              <FieldLabel icon={FaLayerGroup}>Domain</FieldLabel>
              <AdminSelect label="Domain" value={formData.domain} options={DOMAINS} onChange={v => setField('domain', v)} />
            </div>
          </div>

          <div className="jof-section-label">Compensation, Location &amp; Timeline</div>
          <div className="aui-field-row">
            <div className="aui-field">
              <FieldLabel htmlFor="job-exp" icon={FaClock}>Experience</FieldLabel>
              <input id="job-exp" className="aui-input" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g., 0–2 years" />
            </div>
            <div className="aui-field">
              <FieldLabel htmlFor="job-salary" icon={FaMoneyBillWave}>Salary</FieldLabel>
              <input id="job-salary" className="aui-input" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g., ₹5,00,000 – ₹8,00,000" />
            </div>
          </div>
          <div className="aui-field-row">
            <div className="aui-field">
              <FieldLabel htmlFor="job-location" icon={FaMapMarkerAlt}>Location</FieldLabel>
              <input id="job-location" className="aui-input" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Bangalore, Remote, Hybrid" />
            </div>
            <div className="aui-field">
              <FieldLabel htmlFor="job-expiry" icon={FaCalendarAlt}>Expiry Date</FieldLabel>
              <input id="job-expiry" className="aui-input" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
              <p className="aui-hint">Defaults to 30 days from today if left empty.</p>
            </div>
          </div>
          <div className="aui-field">
            <FieldLabel htmlFor="job-tag" icon={FaTag}>Tag</FieldLabel>
            <input id="job-tag" className="aui-input" name="tag" value={formData.tag} onChange={handleChange} placeholder="e.g., Women Preferred, Urgent Hiring" />
          </div>

          <div className="jof-section-label">Description</div>
          <div className="aui-field">
            <FieldLabel icon={FaListUl}>Key Highlights</FieldLabel>
            <div className="jof-quill">
              <ReactQuill
                theme="snow"
                value={formData.highlights}
                onChange={value => setField('highlights', value)}
                placeholder="Add job highlights, benefits, responsibilities..."
                modules={QUILL_MODULES}
              />
            </div>
          </div>
          <div className="aui-field">
            <FieldLabel htmlFor="job-skills" icon={FaUserGraduate}>Skills</FieldLabel>
            <input id="job-skills" className="aui-input" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB, Python" />
            {skillList.length > 0
              ? <div className="jof-chips">{skillList.map(s => <span key={s} className="aui-badge aui-badge-orange">{s}</span>)}</div>
              : <p className="aui-hint">Separate skills with commas.</p>}
          </div>

          <div className="aui-field">
            <FieldLabel icon={FaFileAlt}>Attachments</FieldLabel>
            <div
              className={`jof-dropzone${dragOver ? ' is-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
            >
              <FaCloudUploadAlt className="jof-dropzone-icon" />
              <strong>Drop files here or <span>browse</span></strong>
              <small>Images or PDF (JD, brochure, poster)</small>
              <input ref={fileInputRef} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" onChange={handleAttachmentChange} />
            </div>
            {attachments.length > 0 && (
              <div className="jof-files">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="jof-file">
                    <FaFileAlt className="jof-file-icon" />
                    <span className="jof-file-name">{file.name}</span>
                    <span className="jof-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    <button type="button" className="aui-icon-btn" onClick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`}><FaTimes size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="jof-actions">
          {showEditForm ? (
            <button key="cancel" type="button" className="aui-btn" onClick={cancelEdit} disabled={loading}>
              <FaTimes size={10} /> Cancel
            </button>
          ) : (
            <button key="reset" type="button" className="aui-btn" onClick={() => { setFormData({ ...EMPTY_FORM }); setAttachments([]) }} disabled={loading}>
              Clear form
            </button>
          )}
          <button key="submit" type="button" className="aui-btn aui-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> {showEditForm ? 'Updating Job…' : 'Posting Job…'}</>
              : <>{showEditForm ? <FaCheck size={11} /> : <FaPlus size={11} />} {showEditForm ? 'Update Job' : 'Post Job'}</>}
          </button>
        </div>
      </form>

      {/* Live preview */}
      <aside className="aui-card jof-preview">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>Student Preview</h3>
            <p>How the listing will look</p>
          </div>
        </div>
        <div className="jof-preview-body">
          <div className="jof-preview-head">
            <span className="jof-logo">{initialsOf(formData.company || formData.title || 'Job')}</span>
            <div className="aui-stack">
              <strong className={formData.title ? '' : 'is-empty'}>{formData.title || 'Job title'}</strong>
              <small>{formData.company || 'Company name'}</small>
            </div>
          </div>
          <div className="jof-chips">
            {formData.jobType && <span className="aui-badge aui-badge-orange">{formData.jobType}</span>}
            {formData.domain && <span className="aui-badge aui-badge-blue">{formData.domain}</span>}
            {formData.tag && <span className="aui-badge aui-badge-purple">{formData.tag}</span>}
          </div>
          <ul className="jof-facts">
            <li><FaMoneyBillWave /> <span className={formData.salary ? '' : 'is-empty'}>{formData.salary || 'Salary not specified'}</span></li>
            <li><FaMapMarkerAlt /> <span className={formData.location ? '' : 'is-empty'}>{formData.location || 'Location not specified'}</span></li>
            <li><FaClock /> <span className={formData.experience ? '' : 'is-empty'}>{formData.experience || 'Experience not specified'}</span></li>
            <li>
              <FaCalendarAlt />
              <span>
                {formData.expiryDate
                  ? <>Apply by {new Date(formData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{previewExpiry != null && previewExpiry >= 0 ? ` · ${previewExpiry} day${previewExpiry === 1 ? '' : 's'} left` : ''}</>
                  : <span className="is-empty">Expires in 30 days</span>}
              </span>
            </li>
          </ul>
          {skillList.length > 0 && (
            <div className="jof-chips">{skillList.map(s => <span key={s} className="aui-badge aui-badge-muted">{s}</span>)}</div>
          )}
          {attachments.length > 0 && <small className="jof-preview-note">{attachments.length} attachment{attachments.length > 1 ? 's' : ''}</small>}
        </div>
      </aside>
    </div>
  )

  return (
    <AdminPage>
      <PageHeader
        icon={FaBriefcase}
        title="Job Openings"
        stats={
          <StatCards
            inline
            loading={loadingJobs && existingJobs.length === 0}
            items={[
              { label: 'Active Jobs', value: jobStats.active, icon: FaBriefcase, tone: 'orange' },
              { label: 'Internships', value: jobStats.internships, icon: FaUserGraduate, tone: 'blue' },
              { label: 'Fresher', value: jobStats.fresher, icon: FaUsers, tone: 'green' },
              { label: 'Expiring ≤ 7 days', value: jobStats.expiring, icon: FaHourglassHalf, tone: 'red' },
            ]}
          />
        }
        actions={
          /* Mode switch — sits beside the stat cards */
          <div className="aui-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'is-active' : ''} onClick={() => switchMode('create')}>
              <FaPlus size={11} /> Post New Job
            </button>
            <button type="button" role="tab" aria-selected={mode === 'edit'} className={mode === 'edit' ? 'is-active' : ''} onClick={() => switchMode('edit')}>
              <FaListUl size={11} /> Manage Jobs <span className="aui-badge aui-badge-muted">{existingJobs.length}</span>
            </button>
          </div>
        }
      />

      {successMessage && <div className="aui-alert jof-alert-success"><FaCheckCircle /> {successMessage}</div>}
      {errorMessage && <div className="aui-alert"><FaExclamationTriangle /> {errorMessage}</div>}

      {mode === 'edit' && !showEditForm && (
        <div className="aui-card">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>Active Jobs</h3>
              <p>Expired jobs are hidden · choose Edit to update a listing</p>
            </div>
            <div className="aui-toolbar-filters">
              <SearchInput value={jobTableSearch} onChange={setJobTableSearch} placeholder="Search by title or company" />
              <span className="aui-count">{filteredTableJobs.length} of {existingJobs.length}</span>
            </div>
          </div>

          {loadingJobs ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" /><span>Loading active jobs…</span></div>
          ) : filteredTableJobs.length === 0 ? (
            existingJobs.length === 0 ? (
              <EmptyState
                icon={FaBriefcase}
                title="No active jobs"
                text="Post a job and it will appear here until it expires."
                action={<button type="button" className="aui-btn aui-btn-primary" onClick={() => switchMode('create')}><FaPlus size={11} /> Post New Job</button>}
              />
            ) : (
              <EmptyState icon={FaSearch} title={`No jobs match “${jobTableSearch}”`} text="Try a different title or company." />
            )
          ) : (
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Domain</th>
                    <th>Location</th>
                    <th>Salary</th>
                    <th>Expires</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableJobs.map((job, idx) => {
                    const days = daysUntil(job.expiryDate)
                    return (
                      <tr key={job._id}>
                        <td className="aui-num">{idx + 1}</td>
                        <td>
                          <div className="aui-person">
                            <span className="jof-logo jof-logo-sm">{initialsOf(job.company || job.title)}</span>
                            <div className="aui-stack">
                              <strong title={job.title}>{job.title}</strong>
                              <small>{job.company}{job.tag ? ` · ${job.tag}` : ''}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="aui-badge aui-badge-orange">{job.jobType || '—'}</span></td>
                        <td><span className="aui-badge aui-badge-muted">{job.domain || '—'}</span></td>
                        <td>{job.location ? <span className="aui-inline-icon"><FaMapMarkerAlt /> {job.location}</span> : <span className="aui-num">—</span>}</td>
                        <td>{job.salary || <span className="aui-num">—</span>}</td>
                        <td>
                          {days == null ? <span className="aui-num">—</span> : (
                            <div className="aui-stack">
                              <strong>{new Date(job.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                              <small className={days <= 3 ? 'jof-soon' : ''}>{days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `in ${days} day${days === 1 ? '' : 's'}`}</small>
                            </div>
                          )}
                        </td>
                        <td className="text-end">
                          <button type="button" className="aui-btn aui-btn-soft aui-btn-sm" onClick={() => handleJobSelect(job)}>
                            <FaEdit /> Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && renderForm()}

      <style>{`
        .jof-alert-success { margin-top: 1.25rem; border-color: rgba(49,216,102,0.3); background: rgba(49,216,102,0.1); color: #86efac; }
        
        .jof-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1rem; align-items: start; margin-top: 1.25rem; }
        .jof-layout > .aui-card { margin-top: 0; }
        .jof-form-title { display: flex; align-items: center; gap: 12px; }
        .jof-form-icon { width: 36px; height: 36px; flex-basis: 36px; font-size: 0.9rem; }
        .jof-form-body { padding: 1.1rem 1.25rem 0.25rem; }
        .jof-section-label { margin: 0.25rem 0 0.85rem; padding-bottom: 0.45rem; border-bottom: 1px solid #1d2023; color: #9da2a8; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
        .jof-section-label:not(:first-child) { margin-top: 0.5rem; }
        .jof-label-icon { color: #ff7a00; font-size: 0.72rem; }
        .jof-actions { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.85rem 1.25rem; border-top: 1px solid #25282b; }
        .jof-chips { display: flex; flex-wrap: wrap; gap: 6px; }

        .jof-quill { overflow: hidden; border: 1px solid #34383d; border-radius: 8px; background: #17191c; }
        .jof-quill:focus-within { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
        .jof-quill .ql-toolbar { border: 0; border-bottom: 1px solid #2a2e33; background: #111315; }
        .jof-quill .ql-container { border: 0; font-family: inherit; font-size: 0.88rem; }
        .jof-quill .ql-editor { min-height: 160px; color: #f1f5f9; line-height: 1.6; }
        .jof-quill .ql-editor.ql-blank::before { color: #5b616a; font-style: normal; }
        .jof-quill .ql-stroke { stroke: #cbd5e1; }
        .jof-quill .ql-fill { fill: #cbd5e1; }
        .jof-quill .ql-picker { color: #cbd5e1; }
        .jof-quill .ql-picker-options { background: #17191c; border-color: #34383d !important; }
        .jof-quill button:hover .ql-stroke, .jof-quill .ql-active .ql-stroke { stroke: #ff9a3c; }

        .jof-dropzone { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 1.3rem 1rem; border: 1.5px dashed #34383d; border-radius: 10px; background: #111315; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .jof-dropzone:hover, .jof-dropzone:focus-visible, .jof-dropzone.is-over { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.05); outline: none; }
        .jof-dropzone-icon { color: #ff7a00; font-size: 1.5rem; }
        .jof-dropzone strong { color: #e5e7eb; font-size: 0.82rem; }
        .jof-dropzone strong span { color: #ff9a3c; text-decoration: underline; }
        .jof-dropzone small { color: #6b7280; font-size: 0.7rem; }
        .jof-files { display: flex; flex-direction: column; gap: 6px; }
        .jof-file { display: flex; align-items: center; gap: 10px; padding: 0.45rem 0.5rem 0.45rem 0.75rem; border: 1px solid #25282b; border-radius: 8px; background: #111315; }
        .jof-file-icon { flex-shrink: 0; color: #ff9a3c; }
        .jof-file-name { min-width: 0; overflow: hidden; color: #e5e7eb; font-size: 0.8rem; text-overflow: ellipsis; white-space: nowrap; }
        .jof-file-size { margin-left: auto; color: #6b7280; font-size: 0.72rem; white-space: nowrap; }

        .jof-logo { display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; border: 1px solid rgba(255,122,0,0.3); border-radius: 12px; background: linear-gradient(135deg, rgba(255,122,0,0.18), rgba(168,85,247,0.14)); color: #ffb15e; font-size: 0.85rem; font-weight: 800; }
        .jof-logo-sm { width: 34px; height: 34px; flex-basis: 34px; border-radius: 9px; font-size: 0.7rem; }
        .jof-soon { color: #f4b43f !important; font-weight: 600; }

        .jof-preview { position: sticky; top: 0; }
        .jof-preview-body { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; }
        .jof-preview-head { display: flex; align-items: center; gap: 0.75rem; }
        .jof-preview-head strong { font-size: 0.95rem !important; white-space: normal !important; }
        .jof-facts { display: flex; flex-direction: column; gap: 0.45rem; margin: 0; padding: 0.65rem 0 0; border-top: 1px solid #1d2023; list-style: none; }
        .jof-facts li { display: flex; align-items: flex-start; gap: 8px; color: #e5e7eb; font-size: 0.78rem; }
        .jof-facts li svg { flex-shrink: 0; margin-top: 3px; color: #ff9a3c; font-size: 0.72rem; }
        .jof-preview .is-empty { color: #5b616a !important; }
        .jof-preview-note { color: #858a90; font-size: 0.72rem; }

        @media (max-width: 1199.98px) {
          .jof-layout { grid-template-columns: 1fr; }
          .jof-preview { position: static; }
        }
      `}</style>
    </AdminPage>
  )
}

export default AdminJobForm
