import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import {
  FiBriefcase, FiEye, FiSend, FiCheckCircle, FiAlertCircle, FiArrowLeft,
  FiMapPin, FiClock, FiBriefcase as FiBriefcaseSm, FiUsers, FiUploadCloud, FiX,
} from 'react-icons/fi'
import { FaRegBuilding } from 'react-icons/fa'

const ORANGE = '#ff7a00'
const BORDER = '#e2e8f0'
const TEXT = '#0f172a'
const GRAY = '#64748b'
const BG = '#f8fafc'

type FormState = {
  title: string; company: string; salary: string; location: string
  jobType: string; expiryDate: string; domain: string; tag: string; experience: string
  highlights: string; skills: string
  posterName: string; posterEmail: string; posterPhone: string; posterCompany: string
}

const emptyForm: FormState = {
  title: '', company: '', salary: '', location: '',
  jobType: '', expiryDate: '', domain: '', tag: '', experience: '',
  highlights: '', skills: '',
  posterName: '', posterEmail: '', posterPhone: '', posterCompany: '',
}

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
    {children}{required && <span style={{ color: '#ef4444' }}> *</span>}
  </label>
)

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '0 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  background: '#fff', color: TEXT, colorScheme: 'light',
}

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />
)

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, padding: 20, ...style }}>{children}</div>
)

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()

interface PostJobPageProps {
  // Provided when rendered inside a modal (see PostJobModal below) — swaps
  // the "back to home" navigation for closing the modal instead.
  onClose?: () => void
}

const PostJobPage: React.FC<PostJobPageProps> = ({ onClose }) => {
  const navigate = useNavigate()
  const goBack = onClose ?? (() => navigate('/'))
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [form, setForm] = useState<FormState>(emptyForm)
  const [attachments, setAttachments] = useState<File[]>([])
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    setAttachments(prev => [...prev, ...selected])
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.company.trim() || !form.posterName.trim() || !form.posterEmail.trim() || !form.posterPhone.trim()) {
      setError('Please fill in Job Title, Company, and your contact details (Name, Email, Phone).')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([k, v]) => payload.append(k, v))
      payload.append('website', honeypot) // honeypot — always empty for real users
      attachments.forEach(file => payload.append('attachments', file))

      const res = await fetch(`${baseURL}/jobs/public-submit`, { method: 'POST', body: payload })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to submit job')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: onClose ? '100%' : '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '48px 40px', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <FiCheckCircle size={30} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: TEXT, marginBottom: 8 }}>Submitted for Review</h2>
          <p style={{ fontSize: '0.9rem', color: GRAY, lineHeight: 1.7, marginBottom: 24 }}>
            Thanks! Your job posting has been submitted. Our team will review it and it will go live to students once approved.
            We may reach out to <strong>{form.posterEmail}</strong> if we need anything else.
          </p>
          <button
            onClick={goBack}
            style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {onClose ? 'Close' : 'Back to Home'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: onClose ? '100%' : '100vh', background: BG }}>
      {/* Top bar — sticky so the close button stays reachable while the form scrolls */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!onClose && (
            <button onClick={goBack} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}>
              <FiArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: TEXT }}>Post a New Job</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: GRAY }}>Fill in the details below to post your job and find the right candidates.</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}>
            <FiX size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 1440, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8 }}>
              <FiAlertCircle size={15} /> {error}
            </div>
          )}

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FiBriefcase color={ORANGE} size={16} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Job Information</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <Label required>Job Title</Label>
                <TextInput value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., Senior React Developer" />
              </div>
              <div>
                <Label>Salary</Label>
                <TextInput value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g., ₹5,00,000 - ₹8,00,000" />
              </div>
              <div>
                <Label required>Company</Label>
                <TextInput value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <Label>Location</Label>
                <TextInput value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g., Bangalore, Remote, Hybrid" />
              </div>
              <div>
                <Label>Job Type</Label>
                <select value={form.jobType} onChange={e => set('jobType', e.target.value)} style={{ ...inputStyle, padding: '0 10px' }}>
                  <option value="">Select job type</option>
                  <option>Internship</option>
                  <option>Fresher</option>
                  <option>Experienced</option>
                </select>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <TextInput type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </div>
              <div>
                <Label>Domain</Label>
                <select value={form.domain} onChange={e => set('domain', e.target.value)} style={{ ...inputStyle, padding: '0 10px' }}>
                  <option value="">Select domain</option>
                  <option>Tech</option>
                  <option>Non-Tech</option>
                </select>
              </div>
              <div>
                <Label>Tag</Label>
                <TextInput value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="e.g., Women Preferred, Urgent Hiring" />
              </div>
              <div>
                <Label>Experience</Label>
                <TextInput value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g., 0-2 years, 3-5 years" />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Label>Key Highlights</Label>
              <div className="post-job-quill" style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                <ReactQuill
                  theme="snow"
                  value={form.highlights}
                  onChange={v => set('highlights', v)}
                  placeholder="Add job highlights, benefits, responsibilities..."
                  modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
                />
              </div>
              <style>{`.post-job-quill .ql-container { min-height: 220px; } .post-job-quill .ql-editor { min-height: 220px; }`}</style>
              <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{stripHtml(form.highlights).length} / 2000 characters</div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <Label>Skills (comma separated)</Label>
              <TextInput value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, MongoDB, Python" />
              <small style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>Enter skills separated by commas</small>
            </div>
          </Card>

          {/* Poster contact — required since there's no login to verify who's posting */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FaRegBuilding color={ORANGE} size={15} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Your Contact Details</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: GRAY, margin: '2px 0 14px' }}>
              We'll use this only to verify your submission before it goes live — it won't be shown to students.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Label required>Your Name</Label>
                <TextInput value={form.posterName} onChange={e => set('posterName', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label required>Your Email</Label>
                <TextInput type="email" value={form.posterEmail} onChange={e => set('posterEmail', e.target.value)} placeholder="you@company.com" />
              </div>
              <div>
                <Label required>Your Phone</Label>
                <TextInput type="tel" value={form.posterPhone} onChange={e => set('posterPhone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Your Company (if different)</Label>
                <TextInput value={form.posterCompany} onChange={e => set('posterCompany', e.target.value)} placeholder="Recruiting agency, etc." />
              </div>
            </div>
            {/* Honeypot — hidden from real users via CSS, bots that auto-fill every field trip it */}
            <div style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
              <label>Website</label>
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FiUploadCloud color={ORANGE} size={16} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: TEXT }}>Attachments (Images/PDF)</span>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: '28px 12px', cursor: 'pointer', color: GRAY, fontSize: '0.82rem' }}>
              <FiUploadCloud size={22} color="#94a3b8" />
              Drag and drop your files here or <span style={{ color: ORANGE, fontWeight: 700 }}>Choose Files</span>
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" onChange={handleAttachmentChange} style={{ display: 'none' }} />
            </label>
            <small style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6, display: 'block' }}>You can upload multiple images or PDF files. Max file size: 10MB each.</small>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {attachments.map((file, i) => (
                  <div key={`${file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    <FiX size={13} style={{ cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }} onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: ORANGE, color: '#fff', border: 'none', borderRadius: 10,
              padding: '13px 0', fontSize: '0.9rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
            }}
          >
            <FiSend size={15} /> {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>

        {/* Right: live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FiEye color={ORANGE} size={15} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: TEXT }}>Live Preview</span>
            </div>

            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <div style={{ background: 'linear-gradient(135deg,#ff7a00,#ff944d)', height: 44 }} />
              <div style={{ padding: 16, marginTop: -30 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: ORANGE, fontSize: '1.1rem', marginBottom: 10 }}>
                  {(form.company || 'C').charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: TEXT, marginBottom: 8 }}>{form.company || 'Company Name'}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: 10 }}>{form.title || 'Job Title'}</div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.72rem', color: GRAY, marginBottom: 10 }}>
                  {form.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={11} />{form.location}</span>}
                  {form.experience && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={11} />{form.experience}</span>}
                  {form.jobType && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiBriefcaseSm size={11} />{form.jobType}</span>}
                </div>

                {form.salary && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT }}>{form.salary}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 8px' }}>Pending Review</span>
                  </div>
                )}

                {form.skills && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {form.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5).map(s => (
                      <span key={s} style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', background: BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '2px 9px' }}>{s}</span>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FiUsers color={ORANGE} size={15} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: TEXT }}>Job Summary</span>
            </div>
            {[
              ['Company', form.company], ['Job Type', form.jobType], ['Domain', form.domain],
              ['Experience', form.experience], ['Location', form.location],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 9 }}>
                <span style={{ color: GRAY }}>{label}</span>
                <span style={{ color: TEXT, fontWeight: 600, maxWidth: 150, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
              </div>
            ))}
          </Card>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 14, fontSize: '0.78rem', color: '#9a3412', lineHeight: 1.6 }}>
            💡 Tip: Provide clear job details and highlights to attract the right candidates. Submissions are reviewed before they go live to students.
          </div>
        </div>
      </form>
    </div>
  )
}

export default PostJobPage
