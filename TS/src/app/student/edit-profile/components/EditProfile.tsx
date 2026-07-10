import { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import {
  BsPlus, BsX, BsSearch, BsCamera, BsTrash, BsFileText,
  BsEye, BsPencil, BsCheck2, BsTelephone, BsLinkedin,
  BsPersonFill, BsFileEarmarkPdf, BsCloudUpload,
  BsArrowRight, BsCheckCircleFill, BsCircle, BsBookFill,
  BsStarFill, BsEnvelope, BsUpload,
} from 'react-icons/bs';
import { FaCertificate, FaGraduationCap } from 'react-icons/fa';
import { useAuthContext } from '@/context/useAuthContext';
import avatar7 from '@/assets/images/avatar/07.jpg';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const ORANGE = '#ff7a00'
const WHITE  = '#ffffff'
const BG     = '#f8fafc'
const BORDER = '#e2e8f0'
const TEXT   = '#0f172a'
const GRAY   = '#64748b'

const schema = yup.object().shape({
  fullName:     yup.string().required('Full name is required'),
  phoneNo:      yup.string().required('Phone number is required'),
  college:      yup.string().required('College is required'),
  about:        yup.string(),
  designation:  yup.string(),
  experience:   yup.string(),
  education:    yup.array().of(yup.string()),
  achievements: yup.array().of(yup.string()),
  skills:       yup.array().of(yup.string().trim()).max(50, 'Too many skills'),
  joiningYear:  yup.string().nullable(),
  department:   yup.string().nullable(),
})

type ProfileResponse = {
  fullName?: string; email?: string; phoneNo?: string; college?: string
  about?: string; aboutMe?: string; education?: string[]; profileImage?: string
  resume?: string; certifications?: string[]; skills?: string[]
  joiningYear?: string; department?: string; linkedinUrl?: string
  designation?: string; experience?: string; achievements?: string[]
}

/* ── tiny helpers ── */
function SectionCard({ icon, title, action, children, mb = 16, style }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode; mb?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 20, marginBottom: mb, boxSizing: 'border-box', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, marginBottom: 6, display: 'block' }}>{children}</label>
}

function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px', fontSize: 13.5, color: TEXT, background: WHITE, outline: 'none', transition: 'border-color .15s', ...style }}
      onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
    />
  )
}

function Select({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '9px 12px', fontSize: 13.5, color: TEXT, background: WHITE, outline: 'none', transition: 'border-color .15s', appearance: 'none', ...style }}
      onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
      onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
    />
  )
}

function IconInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: ORANGE, fontSize: 15, display: 'flex' }}>{icon}</span>
      <Input {...props} style={{ paddingLeft: 34 }} />
    </div>
  )
}

/* ── main component ── */
const EditProfile = () => {
  const { user } = useAuthContext()
  const token   = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const { control, register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {},
  })

  const [educationFields, setEducationFields]       = useState<string[]>([])
  const [achievementFields, setAchievementFields]   = useState<string[]>([])
  const [editingAchIdx, setEditingAchIdx]           = useState<number | null>(null)
  const [editingEduIdx, setEditingEduIdx]       = useState<number | null>(null)
  const [serverImagePath, setServerImagePath]   = useState<string | null>(null)
  const [showToast, setShowToast]               = useState(false)
  const [toastMessage, setToastMessage]         = useState('')
  const [toastVariant, setToastVariant]         = useState<'success' | 'danger'>('success')
  const [name, setName]                         = useState('Guest')
  const [imageFile, setImageFile]               = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl]   = useState<string | null>(null)
  const [resumeFile, setResumeFile]             = useState<File | null>(null)
  const [isSaving, setIsSaving]                 = useState(false)
  const [docTab, setDocTab]                     = useState<'resume' | 'certifications'>('resume')
  const [serverResumePath, setServerResumePath] = useState<string | null>(null)
  const [certEntries, setCertEntries]           = useState<{ name: string; file: File | null; serverPath: string | null }[]>([])
  const [skills, setSkills]                     = useState<string[]>([])
  const [skillInput, setSkillInput]             = useState('')
  const [linkedinUrl, setLinkedinUrl]           = useState('')
  const [profileEmail, setProfileEmail]         = useState('')
  const [collegeQuery, setCollegeQuery]         = useState('')
  const [collegeResults, setCollegeResults]     = useState<{ _id: string; name: string; address: string; pincode: string }[]>([])
  const [showCollegeList, setShowCollegeList]   = useState(false)

  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`

  const yearOptions       = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const departmentOptions = ['Computer Science and Engineering','Electronics and Communication Engineering','Electrical and Electronics Engineering','Mechanical Engineering','Civil Engineering','Information Technology','Artificial Intelligence and Machine Learning','Data Science','Internet of Things','Biomedical Engineering','Chemical Engineering','Master of Computer Applications','Bachelor of Technology'].sort()

  /* watched values for completion + preview */
  const [wName, wPhone, wCollege, wYear, wDept, wAbout] =
    watch(['fullName','phoneNo','college','joiningYear','department','about'])

  const completionSections = [
    { label: 'Personal Information', done: !!(wName && profileEmail && wPhone) },
    { label: 'Academic Information', done: !!(wCollege && wYear && wDept) },
    { label: 'About Me',             done: !!((wAbout ?? '').trim().length > 0) },
    { label: 'Education',            done: educationFields.length > 0 && !!educationFields[0]?.trim() },
    { label: 'Achievements',         done: achievementFields.length > 0 && !!achievementFields[0]?.trim() },
    { label: 'Documents',            done: !!(serverResumePath || resumeFile) },
    { label: 'Skills',               done: skills.length > 0 },
  ]
  const doneCnt = completionSections.filter(s => s.done).length
  const pct     = Math.round((doneCnt / completionSections.length) * 100)

  /* ── college search ── */
  useEffect(() => {
    const fn = async () => {
      if (collegeQuery.trim().length < 2) { setCollegeResults([]); return }
      try {
        const res = await fetch(`${baseURL}/api/colleges/search?q=${collegeQuery}`)
        if (res.ok) setCollegeResults(await res.json())
      } catch {}
    }
    const t = setTimeout(fn, 400)
    return () => clearTimeout(t)
  }, [collegeQuery, baseURL])

  /* ── fetch profile ── */
  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((profile: ProfileResponse) => {
        setName(profile.fullName || 'Guest')
        setProfileEmail(profile.email || '')
        reset({
          fullName: profile.fullName||'', phoneNo: profile.phoneNo||'',
          college: profile.college||'', about: profile.aboutMe || profile.about||'',
          designation: profile.designation||'', experience: profile.experience||'',
          education: profile.education||[], achievements: profile.achievements||[],
          skills: profile.skills||[], joiningYear: profile.joiningYear||'', department: profile.department||''
        })
        setCollegeQuery(profile.college || '')
        setEducationFields(profile.education || [])
        setAchievementFields(profile.achievements || [])
        setSkills(profile.skills || [])
        setLinkedinUrl(profile.linkedinUrl || '')
        if (profile.profileImage) {
          const clean = profile.profileImage.replace(/\\/g, '/')
          setServerImagePath(`${baseURL}${clean}`)
        }
        if (profile.resume) {
          let p = profile.resume.replace(/\\/g, '/')
          if (p.startsWith('/')) p = p.substring(1)
          if (!p.startsWith('uploads/')) p = 'uploads/' + p
          setServerResumePath(`${baseURL}/${p}`)
        }
        if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
          setCertEntries(profile.certifications.map((c, i) => {
            let p = (c||'').replace(/\\/g, '/')
            if (p.startsWith('/')) p = p.substring(1)
            if (!p.startsWith('uploads/')) p = 'uploads/' + p
            return { name: `Certification ${i + 1}`, file: null, serverPath: `${baseURL}/${p}` }
          }))
        }
      })
      .catch(err => console.error('Error fetching profile:', err))
  }, [token, reset, baseURL])

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { setImageFile(e.target.files[0]); setImagePreviewUrl(URL.createObjectURL(e.target.files[0])) }
  }

  const onResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const allowed = ['pdf','doc','docx']
    if (!allowed.includes(file.name.split('.').pop()?.toLowerCase() || '')) {
      setToastMessage('Please upload PDF/DOC/DOCX files.'); setToastVariant('danger'); setShowToast(true)
      e.target.value = ''; return
    }
    setResumeFile(file)
  }



  const addSkill = () => {
    const s = skillInput.trim(); if (!s || skills.includes(s)) { setSkillInput(''); return }
    const next = [...skills, s].slice(0, 50)
    setSkills(next); setValue('skills', next); setSkillInput('')
  }
  const removeSkill = (s: string) => { const next = skills.filter(x => x !== s); setSkills(next); setValue('skills', next) }

  const onSubmitError = (errors: any) => {
    const first = Object.values(errors)[0] as any
    const msg = first?.message || 'Please fill in all required fields'
    setToastMessage(msg); setToastVariant('danger'); setShowToast(true)
  }

  const onSubmit = async (data: any) => {
    if (!data.college?.trim()) {
      setToastMessage('Please select a valid college from the list'); setToastVariant('danger'); setShowToast(true); return
    }
    setIsSaving(true)
    try {
      const fd = new FormData()
      fd.append('fullName',    data.fullName)
      fd.append('email',       profileEmail)
      fd.append('phoneNo',     data.phoneNo)
      fd.append('college',     data.college)
      fd.append('aboutMe',     data.about || '')
      fd.append('joiningYear', data.joiningYear)
      fd.append('department',  data.department)
      fd.append('designation', data.designation || '')
      fd.append('experience',  data.experience || '')
      if (linkedinUrl) fd.append('linkedinUrl', linkedinUrl)
      educationFields.forEach((edu, i) => fd.append(`education[${i}]`, edu))
      achievementFields.forEach((ach, i) => fd.append(`achievements[${i}]`, ach))
      skills.forEach((sk, i)           => fd.append(`skills[${i}]`, sk))
      if (imageFile)          fd.append('profileImage', imageFile)
      if (resumeFile)         fd.append('resume', resumeFile)
      certEntries.forEach((entry, i) => {
        fd.append(`certificationNames[${i}]`, entry.name)
        if (entry.file) fd.append('certifications', entry.file)
        else if (entry.serverPath) fd.append(`existingCertifications[${i}]`, entry.serverPath)
      })

      const res = await fetch(`${baseURL}/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd })
      if (!res.ok) throw new Error()
      setToastMessage('Profile updated successfully!'); setToastVariant('success'); setShowToast(true)
      setResumeFile(null)
      setCertEntries(prev => prev.map(e => ({ ...e, file: null })))
    } catch {
      setToastMessage('Failed to update profile. Please try again.'); setToastVariant('danger'); setShowToast(true)
    } finally { setIsSaving(false) }
  }

  const profileImg = imagePreviewUrl || serverImagePath || avatar7

  /* ── resume filename helper ── */
  const resumeFileName = resumeFile?.name || (serverResumePath ? serverResumePath.split('/').pop() : null)

  return (
    <div className="edit-profile-light" style={{ background: BG, minHeight: '100vh', padding: '20px 24px' }}>

      {/* ── Page Header ── */}
      <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BsPersonFill style={{ fontSize: 22, color: ORANGE }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>Update Your Profile</h2>
            <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>Keep your profile updated to get better opportunities and recommendations.</p>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${ORANGE}`, background: WHITE, color: ORANGE, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <BsEye /> View Public Profile <BsArrowRight />
        </button>
      </div>

      {/* ── 2-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ════ LEFT — main form ════ */}
        <form onSubmit={handleSubmit(onSubmit, onSubmitError)}>

          {/* Profile Picture + Personal Info */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
            {/* Profile Pic */}
            <div style={{ width: 230, flexShrink: 0, background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '20px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, alignSelf: 'flex-start' }}>Profile Picture</span>
              <div style={{ position: 'relative', marginTop: 4 }}>
                <img
                  src={profileImg}
                  alt="Profile"
                  onError={e => (e.currentTarget.src = fallbackUrl)}
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${ORANGE}`, display: 'block', boxShadow: `0 4px 16px ${ORANGE}33`, filter: 'brightness(0.82) contrast(1.08)' }}
                />
                <label style={{ position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
                  <BsCamera style={{ color: '#fff', fontSize: 14 }} />
                  <input className="d-none" type="file" accept="image/*" onChange={onImageChange} />
                </label>
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.6 }}>JPG, PNG or WEBP<br />Max size: 5MB</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${ORANGE}`, color: ORANGE, background: WHITE, borderRadius: 9, padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                <BsUpload style={{ fontSize: 13 }} /> Change Photo
                <input className="d-none" type="file" accept="image/*" onChange={onImageChange} />
              </label>
              {(imagePreviewUrl || serverImagePath) && (
                <button type="button"
                  onClick={() => { setImageFile(null); setImagePreviewUrl(null); setServerImagePath(null) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BsTrash style={{ fontSize: 12 }} /> Remove
                </button>
              )}
            </div>

            {/* Personal Information */}
            <SectionCard icon={<BsPersonFill style={{ color: ORANGE, fontSize: 16 }} />} title="Personal Information" mb={0} style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <Input {...register('fullName')} placeholder="Your full name" />
                  {errors.fullName && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block' }}>{errors.fullName.message}</span>}
                </div>
                <div>
                  <FieldLabel>Email Address *</FieldLabel>
                  <IconInput icon={<BsEnvelope />} value={profileEmail} readOnly style={{ background: '#f8fafc', color: GRAY, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <FieldLabel>Phone Number *</FieldLabel>
                  <IconInput icon={<BsTelephone />} type="tel" placeholder="+91 XXXXX XXXXX" {...register('phoneNo')} />
                  {errors.phoneNo && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block' }}>{errors.phoneNo.message}</span>}
                </div>
                <div>
                  <FieldLabel>LinkedIn Profile</FieldLabel>
                  <IconInput icon={<BsLinkedin />} type="url" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Designation</FieldLabel>
                  <Input {...register('designation')} placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <FieldLabel>Experience</FieldLabel>
                  <Input {...register('experience')} placeholder="e.g. 2 years, Fresher" />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Academic Information */}
          <SectionCard icon={<FaGraduationCap style={{ color: ORANGE, fontSize: 17 }} />} title="Academic Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 140px 1fr', gap: 14 }}>
              {/* College */}
              <div>
                <FieldLabel>College *</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: ORANGE, fontSize: 14, display: 'flex' }}><BsSearch /></span>
                  <Input
                    style={{ paddingLeft: 32 }}
                    placeholder="Search your college"
                    autoComplete="off"
                    value={collegeQuery}
                    {...register('college')}
                    onChange={e => { setCollegeQuery(e.target.value); setValue('college', e.target.value); setShowCollegeList(true) }}
                    onFocus={() => { if (collegeQuery.trim().length >= 1) setShowCollegeList(true) }}
                    onBlur={() => setTimeout(() => setShowCollegeList(false), 150)}
                  />
                  {collegeQuery && (
                    <button type="button" onClick={() => { setCollegeQuery(''); setValue('college', '') }}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: GRAY, cursor: 'pointer', display: 'flex' }}>
                      <BsX />
                    </button>
                  )}
                  {showCollegeList && collegeQuery.trim().length >= 1 && (
                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, marginTop: 4, padding: 0, listStyle: 'none', zIndex: 1000, maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.10)' }}>
                      {collegeResults.length > 0 ? collegeResults.map(c => (
                        <li key={c._id} onMouseDown={e => { e.preventDefault(); const disp = `${c.name}, ${c.address}, ${c.pincode}`; setCollegeQuery(disp); setValue('college', disp); setShowCollegeList(false) }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fff7ed')}
                          onMouseLeave={e => (e.currentTarget.style.background = WHITE)}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: GRAY }}>{c.address}, {c.pincode}</div>
                        </li>
                      )) : <li style={{ padding: '10px 14px', color: GRAY, fontSize: 13, textAlign: 'center' }}>No colleges found</li>}
                    </ul>
                  )}
                </div>
              </div>
              {/* Joining Year */}
              <div>
                <FieldLabel>Joining Year *</FieldLabel>
                <Select {...register('joiningYear')}>
                  <option value="">Select Year</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              {/* Department */}
              <div>
                <FieldLabel>Department *</FieldLabel>
                <Select {...register('department')}>
                  <option value="">Select Department</option>
                  {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* About Me */}
          <SectionCard icon={<BsFileText style={{ color: ORANGE, fontSize: 16 }} />} title="About Me"
            action={<span style={{ fontSize: 12, color: GRAY }}>{(wAbout || '').length} / 500</span>}>
            <textarea
              rows={6}
              maxLength={500}
              placeholder="Tell us about yourself, your interests, and career goals..."
              {...register('about')}
              style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, color: TEXT, background: WHITE, outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
              onFocus={e => (e.currentTarget.style.borderColor = ORANGE)}
              onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
            />
          </SectionCard>

          {/* Achievements */}
          <SectionCard icon={<BsStarFill style={{ color: ORANGE, fontSize: 15 }} />} title="Achievements"
            action={
              <button type="button" onClick={() => { setAchievementFields([...achievementFields, '']); setEditingAchIdx(achievementFields.length) }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: ORANGE, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                <BsPlus style={{ fontSize: 16 }} /> Add Achievement
              </button>
            }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {achievementFields.map((field, idx) => (
                <div key={idx}>
                  {editingAchIdx === idx ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Input
                        value={field}
                        maxLength={200}
                        placeholder="e.g. Winner - State Level Hackathon 2024"
                        onChange={e => { const u = [...achievementFields]; u[idx] = e.target.value; setAchievementFields(u); setValue('achievements', u) }}
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => setEditingAchIdx(null)}
                        style={{ width: 34, height: 36, borderRadius: 8, background: '#f0fdf4', border: `1px solid #bbf7d0`, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <BsCheck2 />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                      <BsStarFill style={{ color: ORANGE, fontSize: 13, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{field || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Empty — click edit</span>}</span>
                      <button type="button" onClick={() => setEditingAchIdx(idx)}
                        style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', padding: 4, display: 'flex' }}><BsPencil /></button>
                      <button type="button" onClick={() => { const u = achievementFields.filter((_, i) => i !== idx); setAchievementFields(u); setValue('achievements', u) }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, display: 'flex' }}><BsTrash /></button>
                    </div>
                  )}
                </div>
              ))}
              {achievementFields.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12.5, padding: '12px 0' }}>No achievements added yet.</div>
              )}
            </div>
          </SectionCard>

          {/* Education + Skills — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>

            {/* Education */}
            <SectionCard icon={<BsBookFill style={{ color: ORANGE, fontSize: 15 }} />} title="Education" mb={0}
              action={
                <button type="button" onClick={() => { setEducationFields([...educationFields, '']); setEditingEduIdx(educationFields.length) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: ORANGE, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                  <BsPlus style={{ fontSize: 16 }} /> Add Education
                </button>
              }
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {educationFields.map((field, idx) => (
                  <div key={idx}>
                    {editingEduIdx === idx ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Input
                          value={field}
                          maxLength={120}
                          placeholder="e.g. B.Tech - CSE, RV College, 2022 - Present"
                          onChange={e => { const u = [...educationFields]; u[idx] = e.target.value; setEducationFields(u); setValue('education', u) }}
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setEditingEduIdx(null)}
                          style={{ width: 34, height: 36, borderRadius: 8, background: '#f0fdf4', border: `1px solid #bbf7d0`, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <BsCheck2 />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {field ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>
                                {field.split(',')[0]?.trim() || field}
                              </div>
                              {field.includes(',') && (
                                <div style={{ fontSize: 11.5, color: GRAY, marginTop: 2 }}>{field.split(',').slice(1).join(',').trim()}</div>
                              )}
                              {/* year badge */}
                              {/\d{4}/.test(field) && (() => {
                                const m = field.match(/(\d{4}\s*[-–]\s*(\d{4}|Present))/i)
                                return m ? <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10.5, fontWeight: 700, background: '#dbeafe', color: '#2563eb', borderRadius: 20, padding: '2px 10px' }}>{m[0]}</span> : null
                              })()}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Empty — click edit to fill in</span>
                          )}
                        </div>
                        <button type="button" onClick={() => setEditingEduIdx(idx)}
                          style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}><BsPencil /></button>
                        {idx > 0 && (
                          <button type="button" onClick={() => { const u = educationFields.filter((_, i) => i !== idx); setEducationFields(u); setValue('education', u) }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}><BsTrash /></button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {educationFields.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12.5, padding: '20px 0' }}>No education added yet.</div>
                )}
              </div>
            </SectionCard>

            {/* Skills */}
            <SectionCard icon={<BsStarFill style={{ color: ORANGE, fontSize: 15 }} />} title="Skills" mb={0}
              action={<span style={{ fontSize: 11, color: GRAY }}>{skills.length}/50 skills</span>}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* Skills content */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Input
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  maxLength={20}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() }
                    if (e.key === 'Backspace' && !skillInput && skills.length) removeSkill(skills[skills.length - 1])
                  }}
                  onBlur={() => { if (skillInput.trim()) addSkill() }}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addSkill}
                  style={{ background: ORANGE, border: 'none', borderRadius: 10, padding: '0 20px', color: WHITE, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BsPlus style={{ fontSize: 16 }} /> Add Skill
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map(s => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7ed', border: `1.5px solid #fed7aa`, borderRadius: 20, padding: '5px 12px', fontSize: 12.5, fontWeight: 600, color: ORANGE }}>
                    {s}
                    <button type="button" onClick={() => removeSkill(s)}
                      style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', display: 'flex', padding: 0, opacity: 0.7 }}>
                      <BsX style={{ fontSize: 15 }} />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && <span style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>No skills added yet. Type above and press Enter.</span>}
              </div>
              {errors?.skills && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{String(errors.skills.message || '')}</div>}
            </SectionCard>
          </div>

          {/* Documents — full width */}
          <SectionCard icon={<BsFileEarmarkPdf style={{ color: ORANGE, fontSize: 16 }} />} title="Documents">
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `2px solid ${BORDER}`, marginBottom: 16 }}>
                {(['resume', 'certifications'] as const).map(tab => {
                  const isActive = docTab === tab
                  const label = tab === 'resume' ? 'Resume Upload' : `Certification Upload${certEntries.length > 0 ? ` (${certEntries.length})` : ''}`
                  return (
                    <button key={tab} type="button" onClick={() => setDocTab(tab)} style={{
                      background: 'none', border: 'none', borderBottom: isActive ? `2.5px solid ${ORANGE}` : '2.5px solid transparent',
                      marginBottom: -2, padding: '8px 16px', fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? ORANGE : GRAY, cursor: 'pointer', transition: 'all .15s'
                    }}>{label}</button>
                  )
                })}
              </div>

              {/* Resume Tab */}
              {docTab === 'resume' && (
                <div>
                  {resumeFileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${BORDER}`, marginBottom: 10 }}>
                      <BsFileEarmarkPdf style={{ color: '#ef4444', fontSize: 18, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumeFileName}</span>
                      {serverResumePath && <a href={serverResumePath} target="_blank" rel="noreferrer" style={{ color: ORANGE, display: 'flex' }}><BsEye /></a>}
                      <button type="button" onClick={() => { setResumeFile(null); setServerResumePath(null) }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><BsTrash /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: `1.5px dashed ${BORDER}`, borderRadius: 12, padding: '28px 12px', cursor: 'pointer', textAlign: 'center' }}>
                      <BsCloudUpload style={{ fontSize: 30, color: ORANGE }} />
                      <span style={{ fontSize: 13, color: GRAY }}>Drag & drop your resume here or</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>Choose File</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>PDF, DOC, DOCX (Max 10MB)</span>
                      <input type="file" className="d-none" accept=".pdf,.doc,.docx" onChange={onResumeChange} />
                    </label>
                  )}
                </div>
              )}

              {/* Certifications Tab */}
              {docTab === 'certifications' && (
                <div>
                  {/* Cert entries list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: certEntries.length > 0 ? 12 : 0 }}>
                    {certEntries.map((entry, i) => (
                      <div key={i} style={{ border: `1.5px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', background: '#fafafa' }}>
                        {/* Name row */}
                        <div style={{ marginBottom: 8 }}>
                          <FieldLabel>Certification Name *</FieldLabel>
                          <Input
                            value={entry.name}
                            placeholder="e.g. AWS Certified Developer"
                            onChange={e => { const u = [...certEntries]; u[i] = { ...u[i], name: e.target.value }; setCertEntries(u) }}
                          />
                        </div>
                        {/* File row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {entry.file || entry.serverPath ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: WHITE, borderRadius: 9, border: `1px solid #e9d5ff` }}>
                              <FaCertificate style={{ color: '#7c3aed', fontSize: 14, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 12, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.file ? entry.file.name : 'Uploaded file'}
                              </span>
                              {entry.serverPath && !entry.file && (
                                <a href={entry.serverPath} target="_blank" rel="noreferrer" style={{ color: ORANGE, display: 'flex' }}><BsEye style={{ fontSize: 13 }} /></a>
                              )}
                              <label style={{ cursor: 'pointer', color: ORANGE, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                Change
                                <input type="file" className="d-none" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                  onChange={e => { if (e.target.files?.[0]) { const u = [...certEntries]; u[i] = { ...u[i], file: e.target.files![0] }; setCertEntries(u) } }} />
                              </label>
                            </div>
                          ) : (
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1.5px dashed #e9d5ff`, borderRadius: 9, cursor: 'pointer', background: WHITE }}>
                              <BsUpload style={{ color: '#7c3aed', fontSize: 14 }} />
                              <span style={{ fontSize: 12.5, color: GRAY }}>Upload certificate file</span>
                              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>PDF, PNG, JPG, DOC</span>
                              <input type="file" className="d-none" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                onChange={e => { if (e.target.files?.[0]) { const u = [...certEntries]; u[i] = { ...u[i], file: e.target.files![0] }; setCertEntries(u) } }} />
                            </label>
                          )}
                          <button type="button" onClick={() => setCertEntries(certEntries.filter((_, j) => j !== i))}
                            style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BsTrash style={{ fontSize: 13 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Certification button */}
                  <button type="button"
                    onClick={() => setCertEntries([...certEntries, { name: '', file: null, serverPath: null }])}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${BORDER}`, borderRadius: 12, padding: '12px 0', background: WHITE, color: ORANGE, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <BsPlus style={{ fontSize: 18 }} /> Add Certification
                  </button>
                </div>
              )}
            </SectionCard>

          {/* ── Footer actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <button type="button" onClick={() => window.location.reload()}
              style={{ border: `1.5px solid ${BORDER}`, background: WHITE, color: GRAY, borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              Reset Changes
            </button>
            <button type="submit" disabled={isSaving}
              style={{ background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 28px', color: WHITE, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? <Spinner size="sm" animation="border" /> : <BsCheck2 />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile Completion */}
          <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: '18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BsStarFill style={{ color: ORANGE, fontSize: 14 }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Profile Completion</span>
            </div>
            {/* Circle — green fill + orange leading dot */}
            {(() => {
              const R2 = 51, CX = 62, CY = 62, SW = 10
              const C = 2 * Math.PI * R2
              const greenLen = C * pct / 100
              const greenOffset = C * (1 - pct / 100)
              const tipLen = Math.min(16, greenLen * 0.5)
              const orangeOffset = greenOffset + tipLen / 2
              return (
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', width: 124, margin: '0 auto 16px' }}>
              <svg width="124" height="124" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={CX} cy={CY} r={R2} fill="none" stroke="#eef2f7" strokeWidth={SW} />
                {pct > 0 && (
                  <circle cx={CX} cy={CY} r={R2} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={greenOffset}
                    style={{ transition: 'stroke-dashoffset .5s ease' }} />
                )}
                {pct > 0 && pct < 100 && tipLen > 0 && (
                  <circle cx={CX} cy={CY} r={R2} fill="none" stroke={ORANGE} strokeWidth={SW} strokeLinecap="round"
                    strokeDasharray={`${tipLen} ${C - tipLen}`}
                    strokeDashoffset={orangeOffset}
                    style={{ transition: 'stroke-dashoffset .5s ease' }} />
                )}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: TEXT, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: GRAY, fontWeight: 600, marginTop: 2 }}>Complete</div>
              </div>
            </div>
              )
            })()}
            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {completionSections.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {s.done
                    ? <BsCheckCircleFill style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }} />
                    : <BsCircle         style={{ color: '#d1d5db', fontSize: 14, flexShrink: 0 }} />}
                  <span style={{ fontSize: 12.5, color: s.done ? TEXT : '#9ca3af', fontWeight: s.done ? 700 : 400 }}>{s.label}</span>
                </div>
              ))}
            </div>
            {pct < 100 && (
              <div style={{ marginTop: 11, padding: '7px 11px', background: '#fff7ed', borderRadius: 9, fontSize: 11.5, color: ORANGE, fontWeight: 600 }}>
                Great! Complete your {completionSections.find(s => !s.done)?.label?.toLowerCase()} to make it {Math.round(pct + 100/completionSections.length)}%
              </div>
            )}
          </div>

          {/* Profile Preview */}
          <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BsEye style={{ color: ORANGE, fontSize: 16 }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Profile Preview</span>
            </div>
            <p style={{ fontSize: 11.5, color: GRAY, marginBottom: 14 }}>This is how others will see your profile</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img src={profileImg} alt="" onError={e => (e.currentTarget.src = fallbackUrl)}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ORANGE}` }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {wName || 'Your Name'}
                  <span style={{ fontSize: 14, color: ORANGE }}>⭐</span>
                </div>
                <div style={{ fontSize: 11.5, color: GRAY }}>{wDept ? wDept.split(' ').slice(0,3).join(' ') : 'Your Department'}</div>
                {wCollege && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{wCollege.split(',')[0]}</div>}
              </div>
            </div>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {skills.slice(0, 4).map(s => (
                  <span key={s} style={{ background: '#f1f5f9', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: GRAY }}>{s}</span>
                ))}
              </div>
            )}
            {wAbout && <p style={{ fontSize: 12, color: GRAY, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{wAbout}</p>}
            <button type="button" style={{ width: '100%', border: `1.5px solid ${ORANGE}`, background: WHITE, color: ORANGE, borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              View Full Profile <BsArrowRight />
            </button>
          </div>

        </div>
      </div>

      {/* force light theme — override any Bootstrap dark-mode leakage */}
      <style>{`
        .edit-profile-light input,
        .edit-profile-light select,
        .edit-profile-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }
        .edit-profile-light input:disabled,
        .edit-profile-light select:disabled {
          background-color: #f8fafc !important;
          color: #64748b !important;
        }
      `}</style>

      {/* Custom toast — bottom-right, inline styled */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toastVariant === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1.5px solid ${toastVariant === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,.12)',
          minWidth: 260, maxWidth: 360,
          animation: 'ep-toast-in .25s ease',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: toastVariant === 'success' ? '#22c55e' : '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {toastVariant === 'success'
              ? <BsCheckCircleFill style={{ color: WHITE, fontSize: 17 }} />
              : <span style={{ color: WHITE, fontSize: 17, fontWeight: 800 }}>✕</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: toastVariant === 'success' ? '#15803d' : '#b91c1c' }}>
              {toastVariant === 'success' ? 'Saved Successfully!' : 'Save Failed'}
            </div>
            <div style={{ fontSize: 12, color: toastVariant === 'success' ? '#166534' : '#991b1b', marginTop: 2 }}>
              {toastMessage}
            </div>
          </div>
          <button onClick={() => setShowToast(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: GRAY, fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>
            ×
          </button>
        </div>
      )}
      <style>{`@keyframes ep-toast-in { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

export default EditProfile
