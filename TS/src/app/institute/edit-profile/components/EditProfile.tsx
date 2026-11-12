import avatar7 from '@/assets/images/avatar/07.jpg'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  FaUserCircle, FaBuilding, FaBriefcase, FaFileAlt, FaGraduationCap, FaCamera, FaCheckCircle,
  FaLock, FaEnvelope, FaPhoneAlt, FaPlus, FaTimes, FaSpinner, FaExclamationTriangle, FaIdBadge,
  FaUpload, FaPen, FaUndo,
} from 'react-icons/fa'
import * as yup from 'yup'
import { useEffect, useState, useRef, type ReactNode } from 'react'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, PageHeader, ProgressBar, initialsOf } from '@/components/admin-ui'

type ProfileFormValues = {
  fullName: string
  email: string
  phoneNo: string
  college?: string | null
  about?: string | null
  joiningYear?: string | null
  department?: string | null
  designation?: string | null
  experience?: string | null
  education: { value: string }[]
  skills: { value: string }[]
  profileImage?: FileList
  resume?: FileList
}

const contactFormSchema = yup.object({
  fullName: yup.string().nullable(),
  email: yup.string().nullable(),
  phoneNo: yup.string().nullable(),
  college: yup.string().nullable(),
  about: yup.string().nullable(),
  joiningYear: yup.string().nullable(),
  department: yup.string().nullable(),
  designation: yup.string().nullable().optional(),
  experience: yup.string().nullable().optional(),
  // Blank rows are allowed — they are dropped on submit (a required rule silently blocked saving)
  education: yup.array().of(yup.object({ value: yup.string().ensure() })).required(),
  skills: yup.array().of(yup.object({ value: yup.string().ensure() })).required(),
  profileImage: yup.mixed().notRequired(),
  resume: yup.mixed().notRequired(),
})

const ABOUT_LIMIT = 600

/* One kit card per group of fields */
const Section = ({ icon: Icon, title, subtitle, children, aside }: {
  icon: typeof FaBuilding; title: string; subtitle?: string; children: ReactNode; aside?: ReactNode
}) => (
  <section className="aui-card ep-card">
    <div className="aui-toolbar">
      <div className="ep-card-title">
        <span className="ep-card-icon"><Icon /></span>
        <div className="aui-toolbar-title">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {aside}
    </div>
    <div className="ep-card-body">{children}</div>
  </section>
)

const EditProfile = () => {
  const { user, updateUser } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [skillDraft, setSkillDraft] = useState('')
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const resumeInputRef = useRef<HTMLInputElement | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(contactFormSchema) as any,
    defaultValues: {
      fullName: '', email: '', phoneNo: '', college: '', about: '',
      joiningYear: '', department: '', designation: '', experience: '',
      education: [{ value: '' }], skills: [{ value: '' }],
    },
  })

  const values = watch()

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray<ProfileFormValues, 'education'>({ control, name: 'education' })

  const { fields: skillsFields, append: appendSkill, remove: removeSkill } =
    useFieldArray<ProfileFormValues, 'skills'>({ control, name: 'skills' })

  const loadedValues = useRef<ProfileFormValues | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return
      setIsLoading(true)
      try {
        const res = await axios.get(`${baseURL}/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const profile = res.data
        const next: ProfileFormValues = {
          fullName: profile.fullName || '',
          email: profile.email || '',
          phoneNo: profile.phoneNo || '',
          college: profile.college || '',
          about: profile.aboutMe || '',
          joiningYear: profile.joiningYear || '',
          department: profile.department || '',
          designation: profile.designation || '',
          experience: profile.experience || '',
          education: profile.education?.length ? profile.education.map((v: string) => ({ value: v })) : [{ value: '' }],
          skills: profile.skills?.length ? profile.skills.map((v: string) => ({ value: v })) : [],
        }
        loadedValues.current = next
        reset(next)
        if (profile.profileImage) {
          const imageUrl = profile.profileImage.startsWith('http')
            ? profile.profileImage
            : `${baseURL}/${profile.profileImage.replace(/^\/+/, '')}`
          setPreview(imageUrl)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setIsLoading(false)
        setLoaded(true)
      }
    }
    fetchProfile()
  }, [user, reset, baseURL])

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    setSaved(false)
    setSaveError('')
    try {
      const formData = new FormData()
      formData.append('college', data.college || '')
      formData.append('about', data.about || '')
      formData.append('joiningYear', data.joiningYear || '')
      formData.append('department', data.department || '')
      formData.append('designation', data.designation || '')
      formData.append('experience', data.experience || '')
      formData.append('education', JSON.stringify(data.education.map(e => e.value).filter(v => v.trim())))
      formData.append('skills', JSON.stringify(data.skills.map(s => s.value).filter(v => v.trim())))
      if (data.profileImage?.[0]) formData.append('profileImage', data.profileImage[0])
      if (data.resume?.[0]) formData.append('resume', data.resume[0])

      await axios.put(`${baseURL}/profile`, formData, {
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' },
      })

      // The saved values become the new baseline for "unsaved changes"
      loadedValues.current = { ...data, profileImage: undefined, resume: undefined }
      reset(loadedValues.current)
      setResumeFileName(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      try {
        const updated = await axios.get(`${baseURL}/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        updateUser(updated.data)
      } catch {}
    } catch (err) {
      console.error('Error updating profile:', err)
      setSaveError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const discard = () => {
    if (loadedValues.current) reset(loadedValues.current)
    setResumeFileName(null)
    setSaveError('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setPreview(URL.createObjectURL(e.target.files[0]))
  }

  const addSkill = () => {
    const skill = skillDraft.trim().replace(/,$/, '')
    if (!skill) return
    const exists = (values.skills || []).some(s => s.value.trim().toLowerCase() === skill.toLowerCase())
    if (!exists) appendSkill({ value: skill })
    setSkillDraft('')
  }

  // Profile completeness — what an institute admin profile should have
  const checklist = [
    { label: 'Profile photo', done: !!preview },
    { label: 'Institute name', done: !!values.college?.trim() },
    { label: 'Department', done: !!values.department?.trim() },
    { label: 'Designation', done: !!values.designation?.trim() },
    { label: 'About you', done: !!values.about?.trim() },
    { label: 'Education', done: (values.education || []).some(e => e.value?.trim()) },
  ]
  const completeness = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)
  const imageChanged = !!values.profileImage?.length
  const hasChanges = isDirty || imageChanged || !!resumeFileName

  if (!loaded && isLoading) {
    return (
      <AdminPage>
        <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading profile…</div>
      </AdminPage>
    )
  }

  const { ref: imageRegisterRef, onChange: imageOnChange, ...imageRest } = register('profileImage')
  const { ref: resumeRegisterRef, onChange: resumeOnChange, ...resumeRest } = register('resume')

  return (
    <AdminPage>
      <PageHeader icon={FaUserCircle} title="My Profile" subtitle="Your details as the institute administrator" />

      {saveError && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{saveError}</span>
          <button type="button" className="aui-alert-close" onClick={() => setSaveError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <form className="ep-layout" onSubmit={handleSubmit(onSubmit)}>
        {/* ── Profile summary ── */}
        <aside className="ep-side">
          <div className="aui-card ep-profile">
            <button type="button" className="ep-avatar" onClick={() => imageInputRef.current?.click()} aria-label="Change profile photo">
              {preview
                ? <img src={preview} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatar7 }} />
                : <span className="ep-avatar-initials">{initialsOf(values.fullName || 'A')}</span>}
              <span className="ep-avatar-overlay"><FaCamera /> Change</span>
            </button>
            <input
              type="file"
              accept="image/*"
              className="d-none"
              ref={(el) => { imageRegisterRef(el); imageInputRef.current = el }}
              {...imageRest}
              onChange={(e) => { imageOnChange(e); handleImageChange(e) }}
            />
            <h2>{values.fullName || 'Your name'}</h2>
            <span className="aui-badge aui-badge-orange"><FaIdBadge size={9} /> Institute Admin</span>
            {(values.designation || values.college) && (
              <p className="ep-role">{[values.designation, values.college].filter(Boolean).join(' · ')}</p>
            )}

            <ul className="ep-contact">
              <li><FaEnvelope /> <span>{values.email || '—'}</span></li>
              <li><FaPhoneAlt /> <span>{values.phoneNo || '—'}</span></li>
              {values.department && <li><FaBuilding /> <span>{values.department}</span></li>}
            </ul>

            <button type="button" className="aui-btn aui-btn-sm ep-photo-btn" onClick={() => imageInputRef.current?.click()}>
              <FaCamera size={11} /> {preview ? 'Change photo' : 'Upload photo'}
            </button>
          </div>

          <div className="aui-card ep-complete">
            <div className="ep-complete-head">
              <strong>Profile completeness</strong>
              <span className={completeness === 100 ? 'is-done' : ''}>{completeness}%</span>
            </div>
            <ProgressBar value={completeness} tone={completeness === 100 ? 'green' : 'orange'} label="" />
            <ul>
              {checklist.map(item => (
                <li key={item.label} className={item.done ? 'is-done' : ''}>
                  {item.done ? <FaCheckCircle /> : <span className="ep-dot" />} {item.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Editable sections ── */}
        <div className="ep-main">
          <Section icon={FaLock} title="Account" subtitle="Managed by Eklav — contact support to change these">
            <div className="ep-grid-3">
              {[
                { label: 'Full name', value: values.fullName },
                { label: 'Email address', value: values.email },
                { label: 'Phone number', value: values.phoneNo },
              ].map(f => (
                <div key={f.label} className="aui-field">
                  <label className="aui-label">{f.label}</label>
                  <div className="ep-locked"><FaLock size={10} /> <span>{f.value || '—'}</span></div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={FaBuilding} title="Institute" subtitle="Shown to your students and faculty">
            <div className="aui-field">
              <label className="aui-label" htmlFor="ep-college">College / institute name</label>
              <input id="ep-college" className="aui-input" {...register('college')} placeholder="e.g. Sri Venkateswara College of Engineering" />
            </div>
            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="ep-dept">Department</label>
                <input id="ep-dept" className="aui-input" {...register('department')} placeholder="e.g. Training & Placement Cell" />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="ep-year">With the institute since</label>
                <input id="ep-year" className="aui-input" inputMode="numeric" maxLength={4} {...register('joiningYear')} placeholder="e.g. 2018" />
              </div>
            </div>
          </Section>

          <Section icon={FaBriefcase} title="Role & Experience">
            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="ep-desig">Designation</label>
                <input id="ep-desig" className="aui-input" {...register('designation')} placeholder="e.g. Training & Placement Officer" />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="ep-exp">Experience</label>
                <input id="ep-exp" className="aui-input" {...register('experience')} placeholder="e.g. 12 years" />
              </div>
            </div>
            <div className="aui-field mb-0">
              <label className="aui-label" htmlFor="ep-about">
                About you
                <span className={`ep-counter${(values.about?.length || 0) > ABOUT_LIMIT ? ' is-over' : ''}`}>{values.about?.length || 0} / {ABOUT_LIMIT}</span>
              </label>
              <textarea id="ep-about" className="aui-input ep-textarea" rows={4} {...register('about')} placeholder="A short introduction — your responsibilities, focus areas and goals for your students." />
              {errors.about && <p className="aui-error">{errors.about.message}</p>}
            </div>
          </Section>

          <Section icon={FaGraduationCap} title="Qualifications & Expertise">
            <div className="aui-field">
              <label className="aui-label">Education</label>
              <div className="ep-rows">
                {educationFields.map((item, index) => (
                  <div key={item.id} className="ep-row">
                    <input className="aui-input" {...register(`education.${index}.value` as const)} placeholder="e.g. M.Tech, Computer Science — JNTU, 2012" />
                    {educationFields.length > 1 && (
                      <button type="button" className="aui-icon-btn ep-remove" onClick={() => removeEducation(index)} aria-label="Remove education"><FaTimes size={11} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="aui-btn aui-btn-sm ep-add" onClick={() => appendEducation({ value: '' })}><FaPlus size={10} /> Add qualification</button>
            </div>

            <div className="aui-field mb-0">
              <label className="aui-label" htmlFor="ep-skill">Areas of expertise</label>
              <div className="ep-chips">
                {skillsFields.map((item, index) => values.skills?.[index]?.value?.trim() ? (
                  <span key={item.id} className="ep-chip">
                    {values.skills[index].value}
                    <button type="button" onClick={() => removeSkill(index)} aria-label={`Remove ${values.skills[index].value}`}><FaTimes size={8} /></button>
                  </span>
                ) : null)}
                <input
                  id="ep-skill"
                  className="ep-chip-input"
                  value={skillDraft}
                  onChange={e => setSkillDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() } }}
                  onBlur={addSkill}
                  placeholder={skillsFields.some((_, i) => values.skills?.[i]?.value?.trim()) ? 'Add another…' : 'e.g. Placement training, Data Structures'}
                />
              </div>
              <p className="aui-hint">Press Enter or comma to add</p>
            </div>
          </Section>

          <Section icon={FaFileAlt} title="Documents" subtitle="Optional — attach your CV for records">
            <input
              type="file"
              accept=".pdf"
              className="d-none"
              ref={(el) => { resumeRegisterRef(el); resumeInputRef.current = el }}
              {...resumeRest}
              onChange={(e) => { resumeOnChange(e); if (e.target.files?.[0]) setResumeFileName(e.target.files[0].name) }}
            />
            {resumeFileName ? (
              <div className="ep-file">
                <span className="ep-file-icon"><FaFileAlt /></span>
                <div className="aui-stack"><strong>{resumeFileName}</strong><small>Will be uploaded when you save</small></div>
                <button type="button" className="aui-btn aui-btn-sm" onClick={() => resumeInputRef.current?.click()}>Replace</button>
              </div>
            ) : (
              <button type="button" className="ep-drop" onClick={() => resumeInputRef.current?.click()}>
                <FaUpload /> <span><strong>Upload CV / resume</strong><small>PDF · up to 5 MB</small></span>
              </button>
            )}
          </Section>

          {/* Sticky save bar */}
          <div className={`ep-savebar${hasChanges ? ' is-dirty' : ''}`}>
            <span className="ep-savebar-status">
              {saved
                ? <><FaCheckCircle className="is-ok" /> Profile updated</>
                : hasChanges
                  ? <><FaPen /> You have unsaved changes</>
                  : <><FaCheckCircle className="is-muted" /> All changes saved</>}
            </span>
            <div className="ep-savebar-actions">
              {hasChanges && (
                <button type="button" className="aui-btn" onClick={discard} disabled={isLoading}><FaUndo size={10} /> Discard</button>
              )}
              <button type="submit" className="aui-btn aui-btn-primary" disabled={isLoading || !hasChanges}>
                {isLoading ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .ep-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 1.25rem; align-items: start; margin-top: 1.25rem; }
        .ep-side { position: sticky; top: 0; display: flex; flex-direction: column; gap: 1rem; }
        .ep-side .aui-card, .ep-main > .aui-card:first-child { margin-top: 0; }

        .ep-profile { display: flex; flex-direction: column; align-items: center; padding: 1.5rem 1.25rem 1.25rem; text-align: center; }
        .ep-avatar { position: relative; width: 96px; height: 96px; margin-bottom: 0.85rem; padding: 0; overflow: hidden; border: 2px solid rgba(255,122,0,0.45); border-radius: 50%; background: #25201b; box-shadow: 0 0 0 4px #0e1012, 0 0 0 5px #25282b; cursor: pointer; }
        .ep-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ep-avatar-initials { display: grid; place-items: center; width: 100%; height: 100%; color: #ffb15e; font-size: 1.9rem; font-weight: 800; }
        .ep-avatar-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.68rem; font-weight: 650; opacity: 0; transition: opacity 0.15s; }
        .ep-avatar:hover .ep-avatar-overlay, .ep-avatar:focus-visible .ep-avatar-overlay { opacity: 1; }
        .ep-profile h2 { margin: 0 0 0.45rem; color: #fff; font-size: 1.1rem; font-weight: 750; }
        .ep-role { margin: 0.6rem 0 0; color: #a6abb0; font-size: 0.78rem; line-height: 1.45; }
        .ep-contact { width: 100%; margin: 1rem 0 0; padding: 0.85rem 0 0; border-top: 1px solid #202326; list-style: none; text-align: left; }
        .ep-contact li { display: flex; align-items: center; gap: 9px; padding: 4px 0; color: #c3c7ca; font-size: 0.78rem; }
        .ep-contact li svg { flex: 0 0 auto; color: #6b7280; font-size: 0.72rem; }
        .ep-contact li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ep-photo-btn { width: 100%; justify-content: center; margin-top: 0.85rem; }

        .ep-complete { padding: 1rem 1.1rem; }
        .ep-complete-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.55rem; }
        .ep-complete-head strong { color: #e5e7eb; font-size: 0.82rem; }
        .ep-complete-head span { color: #ff9a3c; font-size: 0.82rem; font-weight: 800; }
        .ep-complete-head span.is-done { color: #45dd75; }
        .ep-complete .aui-progress > span { display: none; }
        .ep-complete ul { margin: 0.75rem 0 0; padding: 0; list-style: none; }
        .ep-complete li { display: flex; align-items: center; gap: 8px; padding: 3px 0; color: #858a90; font-size: 0.76rem; }
        .ep-complete li.is-done { color: #c3c7ca; }
        .ep-complete li svg { color: #45dd75; font-size: 0.72rem; }
        .ep-dot { width: 10px; height: 10px; border: 1.5px solid #4b5056; border-radius: 50%; }

        .ep-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
        .ep-main > .aui-card { margin-top: 0; }
        .ep-card-title { display: flex; align-items: center; gap: 10px; }
        .ep-card-icon { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid rgba(255,122,0,0.3); border-radius: 8px; background: rgba(255,122,0,0.1); color: #ff9a3c; font-size: 0.78rem; }
        .ep-card-body { padding: 1.1rem 1.1rem 0.2rem; }
        .ep-card-body > .aui-field.mb-0, .ep-card-body > :last-child { margin-bottom: 1rem; }
        .ep-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 1rem; }

        .ep-locked { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 0.8rem; overflow: hidden; border: 1px dashed #2c3034; border-radius: 8px; background: #111315; color: #a6abb0; font-size: 0.84rem; }
        .ep-locked svg { flex: 0 0 auto; color: #5b616a; }
        .ep-locked span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ep-textarea { height: auto; min-height: 104px; padding: 0.65rem 0.8rem; line-height: 1.55; resize: vertical; }
        .ep-counter { margin-left: auto; color: #6b7280; font-size: 0.7rem; font-weight: 600; }
        .ep-counter.is-over { color: #fb737a; }

        .ep-rows { display: flex; flex-direction: column; gap: 8px; }
        .ep-row { display: flex; gap: 8px; }
        .ep-remove { height: 40px; width: 40px; }
        .ep-remove:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .ep-add { align-self: flex-start; margin-top: 2px; }

        .ep-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 44px; padding: 6px 8px; border: 1px solid #34383d; border-radius: 8px; background: #17191c; }
        .ep-chips:focus-within { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
        .ep-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 10px; border: 1px solid rgba(255,122,0,0.35); border-radius: 99px; background: rgba(255,122,0,0.1); color: #ffb15e; font-size: 0.76rem; font-weight: 600; }
        .ep-chip button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,0.08); color: inherit; }
        .ep-chip button:hover { background: rgba(251,95,103,0.3); color: #fff; }
        .ep-chip-input { flex: 1; min-width: 160px; height: 28px; border: 0; outline: none; background: transparent; color: #f1f5f9; font-size: 0.84rem; }
        .ep-chip-input::placeholder { color: #5b616a; }

        .ep-drop { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 76px; border: 1.5px dashed #3a3f45; border-radius: 10px; background: #111315; color: #ff9a3c; }
        .ep-drop:hover { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); }
        .ep-drop span { display: flex; flex-direction: column; text-align: left; }
        .ep-drop strong { color: #e5e7eb; font-size: 0.82rem; }
        .ep-drop small { color: #6b7280; font-size: 0.7rem; }
        .ep-file { display: flex; align-items: center; gap: 12px; padding: 0.75rem 0.9rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .ep-file .aui-stack { flex: 1; }
        .ep-file-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 9px; background: rgba(251,95,103,0.12); color: #fb737a; }

        .ep-savebar { position: sticky; bottom: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 1rem; border: 1px solid #25282b; border-radius: 12px; background: rgba(17,19,21,0.92); backdrop-filter: blur(8px); box-shadow: 0 -10px 28px rgba(0,0,0,0.45); }
        .ep-savebar.is-dirty { border-color: rgba(255,122,0,0.4); }
        .ep-savebar-status { display: inline-flex; align-items: center; gap: 8px; color: #c3c7ca; font-size: 0.8rem; }
        .ep-savebar-status svg { color: #ff9a3c; font-size: 0.75rem; }
        .ep-savebar-status svg.is-ok { color: #45dd75; }
        .ep-savebar-status svg.is-muted { color: #4b5056; }
        .ep-savebar-actions { display: flex; gap: 8px; }

        @media (max-width: 991.98px) {
          .ep-layout { grid-template-columns: 1fr; }
          .ep-side { position: static; }
        }
        @media (max-width: 767.98px) {
          .ep-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminPage>
  )
}

export default EditProfile
