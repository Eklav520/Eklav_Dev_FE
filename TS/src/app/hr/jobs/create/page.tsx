import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import {
  FiArrowLeft, FiSave, FiCheck, FiX, FiPlus, FiMinus, FiBriefcase, FiUsers,
  FiDollarSign, FiSettings, FiEye, FiSend, FiShield, FiInfo, FiRefreshCw, FiMapPin, FiFileText,
  FiChevronDown, FiGift, FiEdit,
} from 'react-icons/fi'
import { MdBusiness, MdHome, MdDesktopWindows } from 'react-icons/md'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const ACCENT  = '#4f46e5'
const GREEN   = '#10b981'
const GRAY    = '#64748b'
const BORDER  = '#e2e8f0'
const BG      = '#f8fafc'

// ─── Static option lists ─────────────────────────────────────────────────────
const DEPARTMENT_OPTIONS = ['Engineering', 'Design', 'Product', 'Analytics', 'Sales', 'Marketing', 'Human Resources', 'Operations', 'Finance', 'Other']
const WORK_MODES = ['On-site', 'Hybrid', 'Remote']
const QUALIFICATIONS = ['Any', 'High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD']
const NOTICE_PERIODS = ['Immediate', '15 Days', '30 Days', '60 Days', '90 Days']
const WORK_SHIFTS = ['Day Shift', 'Night Shift', 'Rotational', 'Flexible']
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive Level']
const BENEFITS_OPTIONS = ['Health Insurance', 'Paid Time Off', 'Performance Bonus', 'Flexible Working', 'Provident Fund', 'Gratuity', 'Stock Options', 'Remote Work Allowance']
const REQUIRED_DOC_OPTIONS = ['Resume / CV', 'Cover Letter', 'Portfolio', 'Certificates', 'Other Documents']
const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
]

const STEPS = [
  { key: 'details',      num: 1, title: 'Job Details',      sub: 'Basic information' },
  { key: 'requirements', num: 2, title: 'Requirements',     sub: 'Skills & experience' },
  { key: 'compensation', num: 3, title: 'Compensation',     sub: 'Salary & benefits' },
  { key: 'additional',   num: 4, title: 'Additional',       sub: 'Preferences & more' },
  { key: 'review',       num: 5, title: 'Review',           sub: 'Review & publish' },
] as const

type FormState = {
  title: string; department: string; location: string; reportsTo: string; jobSummary: string
  jobDescription: string; workMode: 'On-site' | 'Hybrid' | 'Remote' | ''
  publishOption: 'now' | 'schedule' | 'draft'; scheduledPublishAt: string
  minExperience: string; maxExperience: string
  requiredSkills: string[]; preferredSkills: string[]; otherRequirements: string[]
  minQualification: string; preferredQualification: string
  mustHave: string[]; niceToHave: string[]
  salaryType: 'Fixed' | 'Negotiable' | 'Not Disclosed'; currency: string
  minSalary: string; maxSalary: string; salaryPeriod: string
  benefits: string[]; otherBenefits: string; showSalaryOnPost: boolean
  workLocationType: 'On-site' | 'Hybrid' | 'Remote'; workLocation: string; remoteWorkPreference: string
  employmentType: string[]; experienceLevel: string[]
  noticePeriod: string; workShift: string; numberOfOpenings: string; applicationDeadline: string
  applyMethod: string; externalApplyUrl: string; applyEmail: string
  requiredDocuments: string[]; customQuestions: string[]
}

const emptyForm: FormState = {
  title: '', department: '', location: '', reportsTo: '', jobSummary: '',
  jobDescription: '', workMode: '',
  publishOption: 'now', scheduledPublishAt: '',
  minExperience: '', maxExperience: '',
  requiredSkills: [], preferredSkills: [], otherRequirements: [],
  minQualification: '', preferredQualification: '',
  mustHave: [], niceToHave: [],
  salaryType: 'Fixed', currency: 'INR',
  minSalary: '', maxSalary: '', salaryPeriod: 'Per Year',
  benefits: [], otherBenefits: '', showSalaryOnPost: false,
  workLocationType: 'On-site', workLocation: '', remoteWorkPreference: '',
  employmentType: [], experienceLevel: [],
  noticePeriod: '', workShift: '', numberOfOpenings: '1', applicationDeadline: '',
  applyMethod: 'Apply with Eklav', externalApplyUrl: '', applyEmail: '',
  requiredDocuments: [], customQuestions: [],
}

const toDateInput = (iso?: string) => (iso ? String(iso).slice(0, 10) : '')
const toDateTimeInput = (iso?: string) => (iso ? String(iso).slice(0, 16) : '')
const numToStr = (n?: number | null) => (n === undefined || n === null ? '' : String(n))

const mapJobToForm = (job: any): FormState => ({
  title: job.title || '',
  department: job.department || '',
  location: job.location || '',
  reportsTo: job.reportsTo || '',
  jobSummary: job.jobSummary || '',
  jobDescription: job.jobDescription || '',
  workMode: (job.workMode || '') as FormState['workMode'],
  publishOption: job.status === 'Draft' ? 'draft' : 'now',
  scheduledPublishAt: toDateTimeInput(job.scheduledPublishAt),
  minExperience: numToStr(job.minExperience),
  maxExperience: numToStr(job.maxExperience),
  requiredSkills: job.requiredSkills || [],
  preferredSkills: job.preferredSkills || [],
  otherRequirements: job.otherRequirements || [],
  minQualification: job.minQualification || '',
  preferredQualification: job.preferredQualification || '',
  mustHave: job.mustHave || [],
  niceToHave: job.niceToHave || [],
  salaryType: (job.salaryType || 'Fixed') as FormState['salaryType'],
  currency: job.currency || 'INR',
  minSalary: numToStr(job.minSalary),
  maxSalary: numToStr(job.maxSalary),
  salaryPeriod: job.salaryPeriod || 'Per Year',
  benefits: job.benefits || [],
  otherBenefits: job.otherBenefits || '',
  showSalaryOnPost: !!job.showSalaryOnPost,
  workLocationType: (job.workLocationType || 'On-site') as FormState['workLocationType'],
  workLocation: job.workLocation || '',
  remoteWorkPreference: job.remoteWorkPreference || '',
  employmentType: job.employmentType || [],
  experienceLevel: job.experienceLevel || [],
  noticePeriod: job.noticePeriod || '',
  workShift: job.workShift || '',
  numberOfOpenings: numToStr(job.numberOfOpenings) || '1',
  applicationDeadline: toDateInput(job.applicationDeadline),
  applyMethod: job.applyMethod || 'Apply with Eklav',
  externalApplyUrl: job.externalApplyUrl || '',
  applyEmail: job.applyEmail || '',
  requiredDocuments: job.requiredDocuments || [],
  customQuestions: job.customQuestions || [],
})

// ─── Small building blocks ───────────────────────────────────────────────────
const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
    {children}{required && <span style={{ color: '#ef4444' }}> *</span>}
  </label>
)

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '0 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a', colorScheme: 'light',
}

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />
)

const Select = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, padding: '0 10px' }}>
    <option value="">{placeholder || 'Select...'}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
)

const TagInput = ({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) => {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const commit = () => {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft('')
  }
  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, minHeight: 40, background: '#fff', cursor: 'text' }}
    >
      {value.map(tag => (
        <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#eef2ff', color: ACCENT, fontSize: '0.78rem', fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}>
          {tag}
          <FiX size={12} style={{ cursor: 'pointer' }} onClick={() => onChange(value.filter(t => t !== tag))} />
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{ flex: 1, minWidth: 120, height: 24, border: 'none', outline: 'none', fontSize: '0.82rem', background: 'transparent', color: '#0f172a', colorScheme: 'light' }}
      />
    </div>
  )
}

const BulletListInput = ({ value, onChange, placeholder, max }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; max: number }) => {
  const [draft, setDraft] = useState('')
  const charCount = value.join('').length
  const commit = () => {
    const v = draft.trim()
    if (v) onChange([...value, v])
    setDraft('')
  }
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, background: '#fff' }}>
      {value.length > 0 && (
        <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
          {value.map((item, i) => (
            <li key={i} style={{ fontSize: '0.8rem', color: '#334155', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{item}</span>
              <FiX size={12} style={{ cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }} onClick={() => onChange(value.filter((_, idx) => idx !== i))} />
            </li>
          ))}
        </ul>
      )}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        placeholder={placeholder}
        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.82rem', boxSizing: 'border-box', background: '#fff', color: '#0f172a', colorScheme: 'light' }}
      />
      <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{charCount} / {max}</div>
    </div>
  )
}

const CheckboxGroup = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (opt: string) => void }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
    {options.map(opt => {
      const active = selected.includes(opt)
      return (
        <label key={opt} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8,
          border: `1px solid ${active ? ACCENT : BORDER}`, background: active ? '#eef2ff' : '#fff',
          cursor: 'pointer', fontSize: '0.8rem', color: '#334155', fontWeight: active ? 600 : 400,
        }}>
          <input type="checkbox" checked={active} onChange={() => onToggle(opt)} style={{ accentColor: ACCENT, colorScheme: 'light' }} />
          {opt}
        </label>
      )
    })}
  </div>
)

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, ...style }}>{children}</div>
)

const SectionHeader = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: GRAY, marginTop: 2 }}>{sub}</div>
    </div>
  </div>
)

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

const QuillField = ({ value, onChange, placeholder, max }: { value: string; onChange: (v: string) => void; placeholder: string; max: number }) => (
  <div className="hr-quill-wrapper">
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="hr-quill"
      modules={{
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
      }}
    />
    <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{stripHtml(value).length} / {max}</div>
  </div>
)

const generateJobId = () => `JD-${Math.floor(1000 + Math.random() * 9000)}`

const EXPERIENCE_SLIDER_MAX = 10

const DualRangeSlider = ({ min, max, onChangeMin, onChangeMax }: { min: number; max: number; onChangeMin: (v: number) => void; onChangeMax: (v: number) => void }) => {
  const pctMin = (min / EXPERIENCE_SLIDER_MAX) * 100
  const pctMax = (max / EXPERIENCE_SLIDER_MAX) * 100
  return (
    <div>
      <div className="dual-range-track" style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: BORDER, borderRadius: 2 }} />
        <div style={{ position: 'absolute', height: 4, background: ACCENT, borderRadius: 2, left: `${pctMin}%`, right: `${100 - pctMax}%` }} />
        <input
          type="range" min={0} max={EXPERIENCE_SLIDER_MAX} step={1} value={min}
          onChange={e => onChangeMin(Math.min(Number(e.target.value), max))}
          className="dual-range-input"
        />
        <input
          type="range" min={0} max={EXPERIENCE_SLIDER_MAX} step={1} value={max}
          onChange={e => onChangeMax(Math.max(Number(e.target.value), min))}
          className="dual-range-input"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {['0 Years', '2', '4', '6', '8', '10+'].map(t => (
          <span key={t} style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

const Row = ({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 18 }}>{children}</div>
)

const summaryRow = (label: string, value?: string) => (
  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 8 }}>
    <span style={{ color: GRAY }}>{label}</span>
    <span style={{ color: '#0f172a', fontWeight: 600, maxWidth: 130, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
  </div>
)

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' }

const formatSalary = (v: string, currency: string) => {
  const n = Number(v)
  if (!v || Number.isNaN(n)) return ''
  return n.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')
}

const CompensationPreview = ({ form }: { form: FormState }) => {
  const symbol = CURRENCY_SYMBOLS[form.currency] || form.currency
  const hasRange = form.salaryType !== 'Not Disclosed' && form.minSalary && form.maxSalary
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <FiDollarSign size={15} color={ACCENT} />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Compensation Preview</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        {form.salaryType === 'Not Disclosed' ? (
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Not Disclosed</div>
        ) : hasRange ? (
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: ACCENT }}>
            {symbol}{formatSalary(form.minSalary, form.currency)} - {symbol}{formatSalary(form.maxSalary, form.currency)}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: GRAY }}>Add a salary range to preview</div>
        )}
        {hasRange && (
          <>
            <div style={{ fontSize: '0.76rem', color: '#334155', marginTop: 4, fontWeight: 600 }}>{form.salaryPeriod || 'Per Year'}</div>
            <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>Total Annual CTC (Estimated)</div>
          </>
        )}
      </div>
      {form.benefits.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Benefits ({form.benefits.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.benefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#334155' }}>
                <FiCheck size={13} color={ACCENT} /> {b}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12, paddingTop: 10, textAlign: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>This preview is how candidates will see it.</span>
      </div>
    </Card>
  )
}

const TIPS: Record<number, string[]> = {
  1: ['Use a clear, specific job title', 'Pick the department candidates will recognize', 'Keep the summary concise but informative'],
  2: ['Be specific about must-have skills', 'Add relevant experience range', 'Mention qualifications clearly', 'Include both must-have and nice-to-have', 'This helps attract the right candidates'],
  3: ['Competitive salary ranges attract more applicants', 'List all real benefits candidates receive', 'Consider showing the salary range publicly'],
  4: ['Add workplace and employment details to set clear expectations.', 'Use required documents to get relevant information from candidates.', 'Custom questions help you understand candidates better.', 'Review everything before publishing the job.'],
}

const HRCreateJobPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [error, setError] = useState('')
  const [jobIdPreview, setJobIdPreview] = useState(() => editId ? `JD-${editId.slice(-5).toUpperCase()}` : generateJobId())
  const [loadingJob, setLoadingJob] = useState(!!editId)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!editId || !baseURL || !token) return
    setLoadingJob(true)
    setLoadError('')
    fetch(`${baseURL}/jobs/${editId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => null)
          throw new Error(err?.error || 'Failed to load job')
        }
        return r.json()
      })
      .then(job => {
        setForm(mapJobToForm(job))
        setJobIdPreview(`JD-${(job._id || editId).slice(-5).toUpperCase()}`)
      })
      .catch(e => setLoadError(e?.message || 'Failed to load job'))
      .finally(() => setLoadingJob(false))
  }, [editId, baseURL, token])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const toggleIn = (key: keyof FormState, opt: string) => {
    setForm(f => {
      const arr = f[key] as unknown as string[]
      const next = arr.includes(opt) ? arr.filter(o => o !== opt) : [...arr, opt]
      return { ...f, [key]: next as any }
    })
  }

  const stepValid = useMemo(() => {
    if (step === 1) {
      return !!(form.title.trim() && form.department && form.location.trim() && form.employmentType[0] && form.workMode && form.experienceLevel[0])
    }
    return true
  }, [step, form.title, form.department, form.location, form.employmentType, form.workMode, form.experienceLevel])

  const submit = async (status: 'Draft' | 'Active') => {
    if (!form.title.trim()) { setError('Job Title is required'); setStep(1); return }
    setSaving(status === 'Draft' ? 'draft' : 'publish')
    setError('')
    try {
      const payload = new FormData()
      const data: Record<string, any> = { ...form, status }
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) payload.append(k, v.join(','))
        else payload.append(k, String(v ?? ''))
      })

      const res = await fetch(editId ? `${baseURL}/jobs/${editId}` : `${baseURL}/jobs`, {
        method: editId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save job')
      }
      navigate('/hr/jobs')
    } catch (e: any) {
      setError(e?.message || 'Failed to save job')
    } finally {
      setSaving(null)
    }
  }

  const resolvePublishStatus = (): 'Draft' | 'Active' => (form.publishOption === 'now' ? 'Active' : 'Draft')

  const goNext = () => { if (step < 5) setStep(step + 1) }
  const goBack = () => { if (step > 1) setStep(step - 1); else navigate('/hr/jobs') }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button onClick={() => navigate('/hr/jobs')} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}>
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>{editId ? 'Edit Job' : 'Create Job'}</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: GRAY }}>{editId ? 'Update the details of this job posting.' : 'Fill in the details to create a new job posting.'}</p>
          </div>
        </div>
        <button onClick={() => submit('Draft')} disabled={saving !== null || loadingJob} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          <FiSave size={14} /> {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
        </button>
      </div>

      {loadingJob && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: GRAY, fontSize: '0.85rem' }}>
          Loading job details…
        </div>
      )}

      {!loadingJob && loadError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.85rem', padding: '14px 18px', borderRadius: 10, marginBottom: 16 }}>
          {loadError} <button onClick={() => navigate('/hr/jobs')} style={{ marginLeft: 8, color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Back to Jobs</button>
        </div>
      )}

      {!loadingJob && !loadError && (
      <>
      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'flex-start', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 24px', marginBottom: 20 }}>
        {STEPS.map((s, i) => {
          const isDone = s.num < step
          const isActive = s.num === step
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
              <div
                onClick={() => setStep(s.num)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? GREEN : isActive ? ACCENT : '#fff',
                  border: isDone || isActive ? 'none' : `1.5px solid ${BORDER}`,
                  color: isDone || isActive ? '#fff' : GRAY, fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {isDone ? <FiCheck size={16} /> : s.num}
                </div>
                <div style={{ display: window.innerWidth < 1024 ? 'none' : 'block' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? ACCENT : '#0f172a', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: '0.68rem', color: GRAY, whiteSpace: 'nowrap' }}>{s.sub}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 12px', background: isDone ? GREEN : BORDER, minWidth: 24 }} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>
      )}

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>
        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <SectionHeader icon={<FiBriefcase size={18} />} title="Basic Information" sub="Provide the basic details about the job position." />
              <Row>
                <div>
                  <Label required>Job Title</Label>
                  <TextInput value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Frontend Developer" />
                </div>
                <div>
                  <Label>Job ID (Auto-generated)</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextInput value={jobIdPreview} readOnly style={{ background: '#f8fafc', color: GRAY }} />
                    {!editId && (
                      <button onClick={() => setJobIdPreview(generateJobId())} title="Regenerate" style={{ width: 40, height: 40, border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiRefreshCw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </Row>
              <Row cols={3}>
                <div>
                  <Label required>Department</Label>
                  <Select value={form.department} onChange={v => set('department', v)} options={DEPARTMENT_OPTIONS} placeholder="Select department" />
                </div>
                <div>
                  <Label required>Location</Label>
                  <div style={{ position: 'relative' }}>
                    <FiMapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <TextInput value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore, India" style={{ paddingLeft: 32 }} />
                  </div>
                </div>
                <div>
                  <Label required>Job Type</Label>
                  <Select value={form.employmentType[0] || ''} onChange={v => set('employmentType', v ? [v] : [])} options={EMPLOYMENT_TYPES} placeholder="Select job type" />
                </div>
              </Row>
              <Row>
                <div>
                  <Label required>Work Mode</Label>
                  <Select value={form.workMode} onChange={v => set('workMode', v as FormState['workMode'])} options={WORK_MODES} placeholder="Select work mode" />
                </div>
                <div>
                  <Label required>Experience Level</Label>
                  <Select value={form.experienceLevel[0] || ''} onChange={v => set('experienceLevel', v ? [v] : [])} options={EXPERIENCE_LEVELS} placeholder="Select experience level" />
                </div>
              </Row>
              <div>
                <Label required>Job Summary</Label>
                <div style={{ fontSize: '0.74rem', color: GRAY, marginBottom: 6, marginTop: -4 }}>A brief overview of the role and key responsibilities.</div>
                <QuillField value={form.jobSummary} onChange={v => set('jobSummary', v)} placeholder="Write a short summary about this role..." max={500} />
              </div>
            </Card>

            <Card>
              <SectionHeader icon={<FiFileText size={18} />} title="Job Description" sub="Describe the role, responsibilities, and what you're looking for." />
              <div>
                <Label required>Detailed Description</Label>
                <QuillField value={form.jobDescription} onChange={v => set('jobDescription', v)} placeholder="Write the detailed job description..." max={2000} />
              </div>
            </Card>
          </div>
        ) : (
        <Card>
          {step === 2 && (
            <>
              <SectionHeader icon={<FiUsers size={18} />} title="Requirements (Skills & Experience)" sub="Define the skills, experience, and qualifications required for this role." />
              <Row>
                <div>
                  <Label required>Minimum Experience</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextInput type="number" min={0} value={form.minExperience} onChange={e => set('minExperience', e.target.value)} placeholder="0" style={{ flex: 1 }} />
                    <div style={{ width: 110 }}><Select value="Years" onChange={() => {}} options={['Years']} /></div>
                  </div>
                </div>
                <div>
                  <Label>Maximum Experience</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextInput type="number" min={0} value={form.maxExperience} onChange={e => set('maxExperience', e.target.value)} placeholder="0" style={{ flex: 1 }} />
                    <div style={{ width: 110 }}><Select value="Years" onChange={() => {}} options={['Years']} /></div>
                  </div>
                </div>
              </Row>
              <div style={{ marginBottom: 18 }}>
                <Label required>Required Skills</Label>
                <TagInput value={form.requiredSkills} onChange={v => set('requiredSkills', v)} placeholder="Add skill and press Enter" />
              </div>
              <Row>
                <div>
                  <Label>Preferred Skills</Label>
                  <TagInput value={form.preferredSkills} onChange={v => set('preferredSkills', v)} placeholder="Add skill and press Enter" />
                </div>
                <div>
                  <Label>Other Requirements</Label>
                  <TagInput value={form.otherRequirements} onChange={v => set('otherRequirements', v)} placeholder="Add requirement" />
                </div>
              </Row>
              <Row>
                <div>
                  <Label>Minimum Qualification</Label>
                  <Select value={form.minQualification} onChange={v => set('minQualification', v)} options={QUALIFICATIONS} />
                </div>
                <div>
                  <Label>Preferred Qualification</Label>
                  <Select value={form.preferredQualification} onChange={v => set('preferredQualification', v)} options={QUALIFICATIONS} />
                </div>
              </Row>
              <div style={{ marginBottom: 18 }}>
                <Label>Years of Experience (Range)</Label>
                <DualRangeSlider
                  min={Number(form.minExperience) || 0}
                  max={Number(form.maxExperience) || 0}
                  onChangeMin={v => set('minExperience', String(v))}
                  onChangeMax={v => set('maxExperience', String(v))}
                />
              </div>
              <Row>
                <div>
                  <Label>Must Have</Label>
                  <BulletListInput value={form.mustHave} onChange={v => set('mustHave', v)} placeholder="Add must-have requirement" max={1000} />
                </div>
                <div>
                  <Label>Nice To Have</Label>
                  <BulletListInput value={form.niceToHave} onChange={v => set('niceToHave', v)} placeholder="Add nice-to-have requirement" max={1000} />
                </div>
              </Row>
            </>
          )}

          {step === 3 && (
            <>
              <SectionHeader icon={<FiDollarSign size={18} />} title="Compensation (Salary & Benefits)" sub="Define the salary range and additional benefits for this role." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 18 }}>
                <div>
                  <Label required>Salary Range Type</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {([
                      { key: 'Fixed', title: 'Fixed Salary', sub: 'Set a fixed minimum and maximum salary' },
                      { key: 'Negotiable', title: 'Salary Negotiable', sub: 'Salary is negotiable' },
                      { key: 'Not Disclosed', title: 'Not Disclosed', sub: 'Do not show salary on the job post' },
                    ] as const).map(opt => (
                      <label key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                        <input type="radio" checked={form.salaryType === opt.key} onChange={() => set('salaryType', opt.key)} style={{ accentColor: ACCENT, marginTop: 3, colorScheme: 'light' }} />
                        <span>{opt.title}<br /><span style={{ fontSize: '0.7rem', color: GRAY }}>{opt.sub}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Label>Currency</Label>
                    <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inputStyle, padding: '0 10px' }}>
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {form.salaryType !== 'Not Disclosed' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <Label required>Minimum Salary</Label>
                          <TextInput type="number" value={form.minSalary} onChange={e => set('minSalary', e.target.value)} placeholder="8,00,000" />
                        </div>
                        <div>
                          <Label required>Maximum Salary</Label>
                          <TextInput type="number" value={form.maxSalary} onChange={e => set('maxSalary', e.target.value)} placeholder="12,00,000" />
                        </div>
                      </div>
                      <div>
                        <Label>Salary Period</Label>
                        <Select value={form.salaryPeriod} onChange={v => set('salaryPeriod', v)} options={['Per Year', 'Per Month']} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <Label>Additional Benefits</Label>
                <CheckboxGroup options={BENEFITS_OPTIONS} selected={form.benefits} onToggle={opt => toggleIn('benefits', opt)} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <Label>Other Benefits (Optional)</Label>
                <TextInput value={form.otherBenefits} onChange={e => set('otherBenefits', e.target.value.slice(0, 200))} placeholder="e.g. Learning & Development, Meal Allowance" />
                <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{form.otherBenefits.length} / 200</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.showSalaryOnPost} onChange={e => set('showSalaryOnPost', e.target.checked)} style={{ accentColor: ACCENT, marginTop: 2, colorScheme: 'light' }} />
                <span>Show salary range on job post<br /><span style={{ fontSize: '0.72rem', color: GRAY }}>When enabled, salary range will be visible to candidates.</span></span>
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <SectionHeader icon={<FiSettings size={18} />} title="Additional Preferences & Settings" sub="Add job preferences, workplace details, and application settings." />
              <Row>
                <div>
                  <Label required>Job Location Type</Label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {([
                      { key: 'On-site', icon: <MdBusiness size={20} />, sub: 'Work from office' },
                      { key: 'Hybrid', icon: <MdHome size={20} />, sub: 'Combination of office and remote' },
                      { key: 'Remote', icon: <MdDesktopWindows size={20} />, sub: 'Work from anywhere' },
                    ] as const).map(opt => {
                      const active = form.workLocationType === opt.key
                      return (
                        <div key={opt.key} onClick={() => set('workLocationType', opt.key)} style={{
                          flex: 1, position: 'relative', border: `1.5px solid ${active ? ACCENT : BORDER}`, borderRadius: 10, padding: '12px 10px',
                          cursor: 'pointer', background: active ? '#eef2ff' : '#fff',
                        }}>
                          {active && (
                            <div style={{ position: 'absolute', top: 8, right: 8, width: 14, height: 14, borderRadius: '50%', border: `2px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
                            </div>
                          )}
                          <div style={{ color: active ? ACCENT : '#64748b', marginBottom: 8 }}>{opt.icon}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{opt.key}</div>
                          <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>{opt.sub}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <Label required>Work Location</Label>
                  <div style={{ position: 'relative' }}>
                    <FiMapPin size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <TextInput value={form.workLocation} onChange={e => set('workLocation', e.target.value)} placeholder="e.g. Bangalore, Karnataka, India" style={{ paddingLeft: 32, paddingRight: form.workLocation ? 56 : 32 }} />
                    {form.workLocation && (
                      <FiX size={13} style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} onClick={() => set('workLocation', '')} />
                    )}
                    <FiChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Label>Remote Work Preference</Label>
                    <Select value={form.remoteWorkPreference} onChange={v => set('remoteWorkPreference', v)} options={['Flexible (Employee can choose)', 'Fixed days in office', 'Fully remote']} />
                  </div>
                </div>
              </Row>
              <Row>
                <div>
                  <Label required>Employment Type</Label>
                  <CheckboxGroup options={EMPLOYMENT_TYPES} selected={form.employmentType} onToggle={opt => toggleIn('employmentType', opt)} />
                </div>
                <div>
                  <Label required>Experience Level</Label>
                  <CheckboxGroup options={EXPERIENCE_LEVELS} selected={form.experienceLevel} onToggle={opt => toggleIn('experienceLevel', opt)} />
                </div>
              </Row>
              <Row cols={4}>
                <div>
                  <Label>Notice Period</Label>
                  <Select value={form.noticePeriod} onChange={v => set('noticePeriod', v)} options={NOTICE_PERIODS} />
                </div>
                <div>
                  <Label>Work Shift</Label>
                  <Select value={form.workShift} onChange={v => set('workShift', v)} options={WORK_SHIFTS} />
                </div>
                <div>
                  <Label required>Number of Openings</Label>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 8, height: 40 }}>
                    <button onClick={() => set('numberOfOpenings', String(Math.max(1, Number(form.numberOfOpenings || 1) - 1)))} style={{ width: 36, height: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#334155' }}><FiMinus size={13} /></button>
                    <input value={form.numberOfOpenings} onChange={e => set('numberOfOpenings', e.target.value.replace(/\D/g, ''))} style={{ flex: 1, border: 'none', outline: 'none', textAlign: 'center', fontSize: '0.85rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }} />
                    <button onClick={() => set('numberOfOpenings', String(Number(form.numberOfOpenings || 1) + 1))} style={{ width: 36, height: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#334155' }}><FiPlus size={13} /></button>
                  </div>
                </div>
                <div>
                  <Label>Application Deadline (Optional)</Label>
                  <TextInput type="date" value={form.applicationDeadline} onChange={e => set('applicationDeadline', e.target.value)} />
                </div>
              </Row>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18, marginTop: 4 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Application Settings</div>
                <div style={{ fontSize: '0.78rem', color: GRAY, marginBottom: 14 }}>Configure how candidates can apply and customize the application process.</div>
                <Row>
                  <div>
                    <Label required>How should candidates apply?</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['Apply with Eklav', 'Redirect to external website', 'Email Applications'].map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                          <input type="radio" checked={form.applyMethod === opt} onChange={() => set('applyMethod', opt)} style={{ accentColor: ACCENT, marginTop: 3, colorScheme: 'light' }} />
                          <span>
                            {opt}<br />
                            <span style={{ fontSize: '0.7rem', color: GRAY }}>
                              {opt === 'Apply with Eklav' ? 'Candidates will apply using Eklav platform' : opt === 'Redirect to external website' ? 'Redirect candidates to your career page or website' : 'Receive applications on your email'}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {form.applyMethod === 'Redirect to external website' && (
                      <TextInput value={form.externalApplyUrl} onChange={e => set('externalApplyUrl', e.target.value)} placeholder="https://yourcompany.com/careers/job" style={{ marginTop: 8 }} />
                    )}
                    {form.applyMethod === 'Email Applications' && (
                      <TextInput type="email" value={form.applyEmail} onChange={e => set('applyEmail', e.target.value)} placeholder="hr@yourcompany.com" style={{ marginTop: 8 }} />
                    )}
                  </div>
                  <div>
                    <Label>Required Documents</Label>
                    <CheckboxGroup options={REQUIRED_DOC_OPTIONS} selected={form.requiredDocuments} onToggle={opt => toggleIn('requiredDocuments', opt)} />
                  </div>
                </Row>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label>Custom Questions (Optional)</Label>
                    <button onClick={() => set('customQuestions', [...form.customQuestions, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: ACCENT, border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      <FiPlus size={13} /> Add Question
                    </button>
                  </div>
                  {form.customQuestions.map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <TextInput value={q} onChange={e => {
                        const next = [...form.customQuestions]; next[i] = e.target.value; set('customQuestions', next)
                      }} placeholder={`Question ${i + 1}`} />
                      <button onClick={() => set('customQuestions', form.customQuestions.filter((_, idx) => idx !== i))} style={{ width: 40, height: 40, border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <SectionHeader icon={<FiEye size={18} />} title="Review Your Job Details" sub="Please review all the information before publishing the job." />
                <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.76rem', fontWeight: 600, color: ACCENT, cursor: 'pointer', flexShrink: 0 }}>
                  <FiEdit size={12} /> Edit
                </button>
              </div>

              {[
                {
                  icon: <FiBriefcase size={15} />, title: 'Job Details', jump: 1, cols: 5,
                  rows: [
                    ['Job Title', form.title, 1], ['Department', form.department, 1], ['Location', form.location, 1],
                    ['Job Type', form.employmentType[0], 1], ['Work Mode', form.workMode, 1],
                    ['Experience Level', form.experienceLevel[0], 1], ['Reports To', form.reportsTo, 1],
                    ['Job ID', jobIdPreview, 1], ['Job Summary', stripHtml(form.jobSummary), 2],
                  ],
                },
                {
                  icon: <FiUsers size={15} />, title: 'Requirements (Skills & Experience)', jump: 2, cols: 5,
                  rows: [
                    ['Min. Experience', form.minExperience && `${form.minExperience} Years`, 1],
                    ['Max. Experience', form.maxExperience && `${form.maxExperience} Years`, 1],
                    ['Key Skills', form.requiredSkills.join(', '), 1],
                    ['Qualification', form.minQualification, 1],
                    ['Preferred Qualification', form.preferredQualification, 1],
                  ],
                },
                {
                  icon: <FiDollarSign size={15} />, title: 'Compensation (Salary & Benefits)', jump: 3, cols: 5,
                  rows: [
                    ['Salary Type', form.salaryType === 'Fixed' ? 'Fixed' : form.salaryType, 1],
                    ['Salary Range', form.salaryType !== 'Not Disclosed' && form.minSalary && form.maxSalary ? `${CURRENCY_SYMBOLS[form.currency] || ''}${formatSalary(form.minSalary, form.currency)} - ${CURRENCY_SYMBOLS[form.currency] || ''}${formatSalary(form.maxSalary, form.currency)}` : undefined, 1],
                    ['Salary Period', form.salaryPeriod, 1],
                    ['Currency', form.currency, 1],
                    ['Benefits', form.benefits.length ? `Benefits (${form.benefits.length})` : undefined, 1, form.benefits.join(', ')],
                  ],
                },
                {
                  icon: <FiSettings size={15} />, title: 'Additional Preferences & Settings', jump: 4, cols: 5,
                  rows: [
                    ['Work Location', form.workLocation, 1], ['Employment Type', form.employmentType.join(', '), 1],
                    ['Work Shift', form.workShift, 1], ['Notice Period', form.noticePeriod, 1],
                    ['Application Deadline', form.applicationDeadline, 1],
                  ],
                },
                {
                  icon: <FiFileText size={15} />, title: 'Application Settings', jump: 4, cols: 4,
                  rows: [
                    ['How to Apply', form.applyMethod, 1],
                    ['Required Documents', form.requiredDocuments.join(', '), 1],
                    ['Custom Questions', form.customQuestions.length ? `${form.customQuestions.length} Questions` : undefined, 1],
                    ['Application Limit', 'Unlimited', 1],
                  ],
                },
              ].map(section => (
                <div key={section.title} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      <span style={{ color: ACCENT }}>{section.icon}</span> {section.title}
                    </div>
                    <button onClick={() => setStep(section.jump)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 10px', fontSize: '0.74rem', fontWeight: 600, color: ACCENT, cursor: 'pointer' }}>
                      <FiEdit size={12} /> Edit
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.cols}, 1fr)`, gap: 10 }}>
                    {section.rows.map(([label, value, span, title]) => (
                      <div key={label} style={{ gridColumn: `span ${span || 1}`, overflow: 'hidden' }} title={title !== undefined ? String(title) : undefined}>
                        <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
        )}

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 1 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <FiSend size={15} color={ACCENT} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Publish Settings</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: GRAY, marginBottom: 14 }}>Choose how you want to publish this job.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {([
                  { key: 'now', title: 'Publish Now', sub: 'Make this job live immediately' },
                  { key: 'schedule', title: 'Schedule for Later', sub: 'Choose a future date and time' },
                  { key: 'draft', title: 'Save as Draft', sub: 'Save and publish later' },
                ] as const).map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input type="radio" checked={form.publishOption === opt.key} onChange={() => set('publishOption', opt.key)} style={{ accentColor: ACCENT, marginTop: 3, colorScheme: 'light' }} />
                    <span>{opt.title}<br /><span style={{ fontSize: '0.7rem', color: GRAY }}>{opt.sub}</span></span>
                  </label>
                ))}
                {form.publishOption === 'schedule' && (
                  <TextInput type="datetime-local" value={form.scheduledPublishAt} onChange={e => set('scheduledPublishAt', e.target.value)} style={{ marginTop: 2 }} />
                )}
              </div>
            </Card>
          )}

          {step === 3 && <CompensationPreview form={form} />}

          {step !== 1 && step !== 3 && step !== 5 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FiInfo size={15} color={ACCENT} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Tips</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(TIPS[step] || []).map((t, i) => (
                  <li key={i} style={{ fontSize: '0.76rem', color: '#475569' }}>{t}</li>
                ))}
              </ul>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 12 }}>Job Summary</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {STEPS.slice(0, 4).map(s => (
                  <div key={s.key} onClick={() => setStep(s.num)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', cursor: 'pointer' }}>
                    <span style={{ fontSize: '0.8rem', color: s.num === step ? ACCENT : s.num < step ? '#0f172a' : GRAY, fontWeight: s.num === step ? 700 : 500 }}>{s.title}</span>
                    {s.num < step ? <FiCheck size={15} color={GREEN} /> : s.num === step ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: ACCENT }} /> : <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${BORDER}` }} />}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '0.8rem', color: GRAY, fontWeight: 500 }}>Review</span>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${BORDER}` }} />
                </div>
              </div>
            </Card>
          )}

          {(step === 1 || step === 2) && (
          <Card>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 10 }}>Job Summary</span>
            <div>
              {summaryRow('Job Title', form.title)}
              {summaryRow('Department', form.department)}
              {summaryRow('Location', form.location)}
              {summaryRow('Job Type', form.employmentType[0])}
              {summaryRow('Experience Level', form.experienceLevel[0])}
              {summaryRow('Work Mode', form.workMode)}
            </div>
            {step === 2 && (
              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 10 }}>
                {summaryRow('Skills', form.requiredSkills.join(', '))}
                {summaryRow('Min. Experience', form.minExperience && `${form.minExperience} Years`)}
                {summaryRow('Max. Experience', form.maxExperience && `${form.maxExperience} Years`)}
                {summaryRow('Qualification', form.minQualification)}
              </div>
            )}
            {step === 1 && (
              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 10 }}>
                {summaryRow('Applications', '0')}
                {summaryRow('Posted On', '—')}
                <div style={{ textAlign: 'center', padding: '10px 0 2px', color: '#c7d2fe' }}>
                  <FiBriefcase size={30} />
                  <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 6 }}>Fill in the details to see the summary</div>
                </div>
              </div>
            )}
          </Card>
          )}

          {step === 5 && (
            <>
              <Card style={{ background: '#eef2ff', border: `1px solid #c7d2fe` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <FiSend size={15} color={ACCENT} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Publish Your Job</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 12 }}>You're all set! Publish your job post and start receiving applications.</div>
                <button onClick={() => submit(resolvePublishStatus())} disabled={saving !== null} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving === 'publish' ? 'Publishing…' : <>Publish Job Now <FiSend size={13} /></>}
                </button>
              </Card>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <FiShield size={15} color={GREEN} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Secure & Compliant</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: GRAY }}>Your job post will follow our platform guidelines and visibility settings.</div>
              </Card>
            </>
          )}
          {step === 2 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiInfo size={15} color={ACCENT} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Next Step</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: GRAY, marginBottom: 12 }}>
                Next, you'll define {STEPS[step]?.sub.toLowerCase()}.
              </div>
              <button onClick={goNext} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: ACCENT, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                Go to {STEPS[step]?.title} <FiArrowLeft size={12} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </Card>
          )}

          {step === 4 && (
            <Card style={{ background: '#eef2ff', border: '1px solid #c7d2fe', textAlign: 'center' }}>
              <FiGift size={26} color={ACCENT} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Almost there!</div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>You're just one step away from publishing your job post.</div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
          <FiArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => submit('Draft')} disabled={saving !== null} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            Save as Draft
          </button>
          {step < 5 ? (
            <button onClick={goNext} disabled={!stepValid} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: stepValid ? 'pointer' : 'default', opacity: stepValid ? 1 : 0.5 }}>
              Next <FiArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          ) : (
            <button onClick={() => submit(resolvePublishStatus())} disabled={saving !== null} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving === 'publish' ? (editId ? 'Saving…' : 'Publishing…') : editId ? <>Save Changes <FiSend size={13} /></> : <>Publish Job Now <FiSend size={13} /></>}
            </button>
          )}
        </div>
      </div>
      </>
      )}

      <style>{`
        .hr-quill-wrapper .hr-quill { background: #fff; border-radius: 8px; overflow: hidden; }
        .hr-quill-wrapper .ql-toolbar.ql-snow { border: 1px solid ${BORDER}; border-bottom: none; border-radius: 8px 8px 0 0; background: #f8fafc; }
        .hr-quill-wrapper .ql-container.ql-snow { border: 1px solid ${BORDER}; border-radius: 0 0 8px 8px; font-family: inherit; }
        .hr-quill-wrapper .ql-editor { min-height: 110px; font-size: 0.84rem; }
        .hr-quill-wrapper .ql-editor.ql-blank::before { color: #94a3b8; font-style: normal; font-size: 0.84rem; }

        .dual-range-input { position: absolute; left: 0; width: 100%; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; }
        .dual-range-input::-webkit-slider-runnable-track { -webkit-appearance: none; background: transparent; }
        .dual-range-input::-webkit-slider-thumb {
          -webkit-appearance: none; pointer-events: auto; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 3px solid ${ACCENT}; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .dual-range-input::-moz-range-track { background: transparent; }
        .dual-range-input::-moz-range-thumb {
          pointer-events: auto; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 3px solid ${ACCENT}; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

export default HRCreateJobPage
