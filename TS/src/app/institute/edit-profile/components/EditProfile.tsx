import avatar7 from '@/assets/images/avatar/07.jpg'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  BsPlus, BsX, BsPersonFill, BsBuildingFill, BsBriefcaseFill,
  BsFileEarmarkTextFill, BsLightningChargeFill, BsBookFill,
  BsCameraFill, BsCheckCircleFill, BsLockFill,
} from 'react-icons/bs'
import * as yup from 'yup'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

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
  education: yup.array().of(yup.object({ value: yup.string().required() })).required(),
  skills: yup.array().of(yup.object({ value: yup.string().required() })).required(),
  profileImage: yup.mixed().notRequired(),
  resume: yup.mixed().notRequired(),
})

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div className="ep-section-header">
    <div className="ep-section-icon">{icon}</div>
    <div>
      <div className="ep-section-title">{title}</div>
      {subtitle && <div className="ep-section-sub">{subtitle}</div>}
    </div>
  </div>
)

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="ep-locked-field">
    <div className="ep-locked-label">
      <BsLockFill size={10} className="me-1" style={{ opacity: 0.5 }} />
      {label}
    </div>
    <div className="ep-locked-value">{value || '—'}</div>
  </div>
)

const EditProfile = () => {
  const { user, updateUser } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    register,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(contactFormSchema) as any,
    defaultValues: {
      fullName: '', email: '', phoneNo: '', college: '', about: '',
      joiningYear: '', department: '', designation: '', experience: '',
      education: [{ value: '' }], skills: [{ value: '' }],
    },
  })

  const watchedValues = watch(['fullName', 'email', 'phoneNo'])

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray<ProfileFormValues, 'education'>({ control, name: 'education' })

  const { fields: skillsFields, append: appendSkill, remove: removeSkill } =
    useFieldArray<ProfileFormValues, 'skills'>({ control, name: 'skills' })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return
      setIsLoading(true)
      try {
        const res = await axios.get(`${baseURL}/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        const profile = res.data
        reset({
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
          skills: profile.skills?.length ? profile.skills.map((v: string) => ({ value: v })) : [{ value: '' }],
        })
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
      }
    }
    fetchProfile()
  }, [user, reset, baseURL])

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true)
    setSaved(false)
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
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setPreview(URL.createObjectURL(e.target.files[0]))
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFileName(e.target.files[0].name)
  }

  const initials = (watchedValues[0] || 'A').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  if (isLoading && !preview && !watchedValues[0]) {
    return (
      <div className="ep-loading">
        <div className="ep-loading-spinner" />
        <span>Loading profile…</span>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── Banner + Avatar ── */}
        <div className="ep-banner">
          <div className="ep-banner-bg" />
          <div className="ep-banner-inner">
            <div className="ep-avatar" onClick={() => imageInputRef.current?.click()}>
              {preview
                ? <img src={preview} alt="Profile" onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatar7 }} />
                : <div className="ep-avatar-initials">{initials}</div>
              }
              <div className="ep-avatar-overlay">
                <BsCameraFill size={16} />
                <span>Change</span>
              </div>
            </div>
            {(() => {
              const { ref: registerRef, onChange: rhfOnChange, ...profileImageRest } = register('profileImage')
              return (
                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  ref={(el) => { registerRef(el); imageInputRef.current = el }}
                  {...profileImageRest}
                  onChange={(e) => { rhfOnChange(e); handleImageChange(e) }}
                />
              )
            })()}
            <div className="ep-banner-meta">
              <div className="ep-banner-name">{watchedValues[0] || 'Your Name'}</div>
              <div className="ep-banner-chips">
                <span className="ep-chip ep-chip-role">Institute Admin</span>
                <span className="ep-chip ep-chip-photo" onClick={() => imageInputRef.current?.click()}>
                  <BsCameraFill size={11} /> Update Photo
                </span>
              </div>
              <div className="ep-banner-email">{watchedValues[1] || ''}</div>
            </div>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="ep-body">

          {/* Account Information (locked) */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsPersonFill />}
              title="Account Information"
              subtitle="These fields are managed by the system and cannot be changed"
            />
            <div className="ep-grid ep-grid-3">
              <LockedField label="Full Name" value={watchedValues[0]} />
              <LockedField label="Email Address" value={watchedValues[1]} />
              <LockedField label="Phone Number" value={watchedValues[2]} />
            </div>
          </div>

          <div className="ep-divider" />

          {/* Institute Details */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsBuildingFill />}
              title="Institute Details"
              subtitle="Information about your institution"
            />
            <div className="ep-grid ep-grid-2">
              <div className="ep-field">
                <label className="ep-label">College / Institute Name</label>
                <input className="ep-input" {...register('college')} placeholder="e.g., IIT Bombay" />
              </div>
              <div className="ep-field">
                <label className="ep-label">Department</label>
                <input className="ep-input" {...register('department')} placeholder="e.g., Computer Science" />
              </div>
              <div className="ep-field">
                <label className="ep-label">Joining Year</label>
                <input className="ep-input" {...register('joiningYear')} placeholder="e.g., 2020" />
              </div>
            </div>
          </div>

          <div className="ep-divider" />

          {/* Professional Info */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsBriefcaseFill />}
              title="Professional Information"
              subtitle="Your role and experience details"
            />
            <div className="ep-grid ep-grid-2">
              <div className="ep-field">
                <label className="ep-label">Designation</label>
                <input className="ep-input" {...register('designation')} placeholder="e.g., Senior Full Stack Developer" />
              </div>
              <div className="ep-field">
                <label className="ep-label">Experience</label>
                <input className="ep-input" {...register('experience')} placeholder="e.g., 12 Years" />
              </div>
            </div>
          </div>

          <div className="ep-divider" />

          {/* About */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsPersonFill />}
              title="About"
              subtitle="A brief description about yourself"
            />
            <div className="ep-field">
              <label className="ep-label">Bio</label>
              <textarea
                className="ep-textarea"
                rows={4}
                {...register('about')}
                placeholder="Tell us about your background, expertise, and goals…"
              />
              {errors.about && <div className="ep-error">{errors.about.message}</div>}
            </div>
          </div>

          <div className="ep-divider" />

          {/* Education */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsBookFill />}
              title="Education"
              subtitle="Your academic qualifications"
            />
            <div className="ep-field">
              {educationFields.map((item, index) => (
                <div key={item.id} className="ep-tag-row">
                  <input
                    className="ep-input"
                    {...register(`education.${index}.value` as const)}
                    placeholder="e.g., B.Tech in Computer Science — IIT Bombay, 2020"
                  />
                  {educationFields.length > 1 && (
                    <button type="button" className="ep-remove-btn" onClick={() => removeEducation(index)}>
                      <BsX size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="ep-add-btn" onClick={() => appendEducation({ value: '' })}>
                <BsPlus size={16} /> Add Education
              </button>
            </div>
          </div>

          <div className="ep-divider" />

          {/* Skills */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsLightningChargeFill />}
              title="Skills"
              subtitle="Technologies and tools you work with"
            />
            <div className="ep-field">
              {skillsFields.map((item, index) => (
                <div key={item.id} className="ep-tag-row">
                  <input
                    className="ep-input"
                    {...register(`skills.${index}.value` as const)}
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                  {skillsFields.length > 1 && (
                    <button type="button" className="ep-remove-btn" onClick={() => removeSkill(index)}>
                      <BsX size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="ep-add-btn" onClick={() => appendSkill({ value: '' })}>
                <BsPlus size={16} /> Add Skill
              </button>
            </div>
          </div>

          <div className="ep-divider" />

          {/* Documents */}
          <div className="ep-section">
            <SectionHeader
              icon={<BsFileEarmarkTextFill />}
              title="Documents"
              subtitle="Upload your resume or CV"
            />
            <div className="ep-upload-zone" onClick={() => document.getElementById('ep-resume-input')?.click()}>
              <BsFileEarmarkTextFill size={28} style={{ color: '#ff7a00', opacity: 0.8 }} />
              <div className="ep-upload-text">
                {resumeFileName
                  ? <><strong>{resumeFileName}</strong><br /><span>Click to replace</span></>
                  : <><strong>Click to upload resume</strong><br /><span>PDF format · Max 5 MB</span></>
                }
              </div>
              <input
                id="ep-resume-input"
                type="file"
                accept=".pdf"
                className="d-none"
                {...register('resume')}
                onChange={handleResumeChange}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="ep-footer">
            {saved && (
              <div className="ep-success">
                <BsCheckCircleFill size={15} />
                Profile updated successfully
              </div>
            )}
            <button type="submit" className="ep-save-btn" disabled={isLoading}>
              {isLoading
                ? <><span className="ep-spinner" /> Saving…</>
                : 'Save Changes'
              }
            </button>
          </div>
        </div>
      </form>

      <style>{`
        /* ── Container ── */
        .ep-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px 0; color: #6b7280; font-size: 0.9rem; }
        .ep-loading-spinner { width: 22px; height: 22px; border: 2px solid #1f1f1f; border-top-color: #ff7a00; border-radius: 50%; animation: ep-spin 0.7s linear infinite; }

        /* ── Banner ── */
        .ep-banner { position: relative; border-radius: 16px 16px 0 0; overflow: hidden; border: 1px solid #1f1f1f; border-bottom: none; }
        .ep-banner-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #1c0900 0%, #2e1500 55%, #111 100%); }
        .ep-banner-bg::after { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff7a00' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
        .ep-banner-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 24px; padding: 28px 32px; }

        /* ── Avatar ── */
        .ep-avatar { width: 88px; height: 88px; border-radius: 50%; border: 2.5px solid #ff7a0044; box-shadow: 0 0 0 4px #1a1a1a, 0 8px 28px rgba(0,0,0,0.7); cursor: pointer; position: relative; overflow: hidden; background: linear-gradient(135deg, #ff7a00, #ff4500); flex-shrink: 0; }
        .ep-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ep-avatar-initials { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .ep-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #fff; font-size: 0.65rem; font-weight: 600; opacity: 0; transition: opacity 0.2s; }
        .ep-avatar:hover .ep-avatar-overlay { opacity: 1; }

        /* ── Banner meta ── */
        .ep-banner-meta { flex: 1; min-width: 0; }
        .ep-banner-name { font-size: 1.35rem; font-weight: 800; color: #f9fafb; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 10px; }
        .ep-banner-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 7px; }
        .ep-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 0.71rem; font-weight: 600; letter-spacing: 0.02em; }
        .ep-chip-role { background: #ff7a0020; border: 1px solid #ff7a0045; color: #ff9a40; }
        .ep-chip-photo { background: #ffffff08; border: 1px solid #ffffff15; color: #9ca3af; cursor: pointer; transition: all 0.15s; }
        .ep-chip-photo:hover { border-color: #ff7a0055; color: #ff9a40; background: #ff7a0010; }
        .ep-banner-email { font-size: 0.8rem; color: #6b7280; }

        /* ── Body ── */
        .ep-body { background: #0d0d0d; border: 1px solid #1f1f1f; border-top: none; border-radius: 0 0 16px 16px; padding: 8px 0 0; }

        /* ── Section ── */
        .ep-section { padding: 28px 32px; }
        .ep-section-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 22px; }
        .ep-section-icon { width: 36px; height: 36px; border-radius: 10px; background: #ff7a0015; border: 1px solid #ff7a0030; color: #ff7a00; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; margin-top: 1px; }
        .ep-section-title { font-size: 0.95rem; font-weight: 700; color: #f3f4f6; line-height: 1.3; }
        .ep-section-sub { font-size: 0.78rem; color: #6b7280; margin-top: 2px; }
        .ep-divider { border: none; border-top: 1px solid #161616; margin: 0; }

        /* ── Grid ── */
        .ep-grid { display: grid; gap: 16px; }
        .ep-grid-2 { grid-template-columns: repeat(2, 1fr); }
        .ep-grid-3 { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 768px) { .ep-grid-2, .ep-grid-3 { grid-template-columns: 1fr; } }

        /* ── Locked field ── */
        .ep-locked-field { background: #080808; border: 1px solid #1a1a1a; border-radius: 10px; padding: 12px 14px; }
        .ep-locked-label { font-size: 0.7rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; display: flex; align-items: center; }
        .ep-locked-value { font-size: 0.88rem; color: #6b7280; font-weight: 500; }

        /* ── Fields ── */
        .ep-field { display: flex; flex-direction: column; gap: 6px; }
        .ep-label { font-size: 0.78rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .ep-input { background: #111; border: 1px solid #222; border-radius: 10px; padding: 10px 14px; color: #f3f4f6; font-size: 0.88rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; }
        .ep-input::placeholder { color: #4b5563; }
        .ep-input:focus { border-color: #ff7a0066; box-shadow: 0 0 0 3px #ff7a0015; }
        .ep-textarea { background: #111; border: 1px solid #222; border-radius: 10px; padding: 12px 14px; color: #f3f4f6; font-size: 0.88rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; resize: vertical; font-family: inherit; }
        .ep-textarea::placeholder { color: #4b5563; }
        .ep-textarea:focus { border-color: #ff7a0066; box-shadow: 0 0 0 3px #ff7a0015; }
        .ep-error { font-size: 0.75rem; color: #f87171; margin-top: 4px; }

        /* ── Tag rows (education / skills) ── */
        .ep-tag-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .ep-tag-row .ep-input { flex: 1; }
        .ep-remove-btn { width: 38px; height: 38px; min-width: 38px; border-radius: 8px; border: 1px solid #2c2c2c; background: #141414; color: #6b7280; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .ep-remove-btn:hover { border-color: #ef4444; background: #1a0808; color: #ef4444; }
        .ep-add-btn { display: inline-flex; align-items: center; gap: 5px; background: #141414; border: 1px dashed #2c2c2c; border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; color: #9ca3af; cursor: pointer; transition: all 0.15s; margin-top: 2px; }
        .ep-add-btn:hover { border-color: #ff7a00; color: #ff7a00; background: #ff7a0008; }

        /* ── Upload zone ── */
        .ep-upload-zone { border: 1.5px dashed #2c2c2c; border-radius: 12px; background: #090909; padding: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .ep-upload-zone:hover { border-color: #ff7a0066; background: #ff7a0008; }
        .ep-upload-text strong { font-size: 0.88rem; color: #d1d5db; font-weight: 600; }
        .ep-upload-text span { font-size: 0.76rem; color: #6b7280; }
        .ep-upload-text { display: flex; flex-direction: column; gap: 3px; }

        /* ── Footer ── */
        .ep-footer { padding: 20px 32px 28px; display: flex; align-items: center; justify-content: flex-end; gap: 16px; border-top: 1px solid #161616; margin-top: 8px; }
        .ep-success { display: flex; align-items: center; gap: 7px; font-size: 0.83rem; color: #34d399; font-weight: 500; }
        .ep-save-btn { background: linear-gradient(135deg, #ff7a00, #ff5500); border: none; border-radius: 10px; padding: 10px 28px; color: #fff; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.02em; box-shadow: 0 4px 14px #ff7a0033; }
        .ep-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .ep-save-btn:not(:disabled):hover { opacity: 0.9; transform: translateY(-1px); }
        .ep-spinner { width: 14px; height: 14px; border: 2px solid #ffffff55; border-top-color: #fff; border-radius: 50%; animation: ep-spin 0.6s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

export default EditProfile
