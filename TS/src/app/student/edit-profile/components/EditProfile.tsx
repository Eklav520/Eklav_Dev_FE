
import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Col, Toast, ToastContainer } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { BsPlus, BsX,BsSearch } from 'react-icons/bs';
import { useAuthContext } from '@/context/useAuthContext';
import avatar7 from '@/assets/images/avatar/07.jpg';
import TextFormInput from '@/components/form/TextFormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNo: yup.string().required('Phone number is required'),
  college: yup.string().required('College is required'),
  about: yup.string(),
  education: yup.array().of(yup.string()),
  skills: yup.array().of(yup.string().trim()).max(50, 'Too many skills'),
  joiningYear: yup.string().nullable(),
  batch: yup.string().nullable(),
})

type ProfileResponse = {
  fullName?: string
  email?: string
  phoneNo?: string
  college?: string
  about?: string
  education?: string[]
  profileImage?: string
  resume?: string
  certifications?: string[]
  skills?: string[]
  joiningYear?: string
  batch?: string
}

const EditProfile = () => {
  const { user } = useAuthContext()
  const token = user?.token

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Existing local state
  const [educationFields, setEducationFields] = useState<string[]>([])
  const [serverImagePath, setServerImagePath] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [name, setName] = useState('Guest')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`

  // NEW: resume + certifications + skills
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [serverResumePath, setServerResumePath] = useState<string | null>(null)
  const [serverCertPaths, setServerCertPaths] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  // ================= College Search (Auto Suggest) =================
  const [collegeQuery, setCollegeQuery] = useState('')
  const [collegeResults, setCollegeResults] = useState<{ _id: string; name: string; address: string; pincode: string; logo?: string }[]>([]);
  const [showCollegeList, setShowCollegeList] = useState(false);
  const yearOptions = Array.from({ length: 5 }, (_, i) => 2021 + i); // 2016–2025
  const branchOptions = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Information Technology', 'AIML', 'Data Science', 'IoT', 'Biomedical', 'Chemical','MCA','Btech'].sort();
  const [selectedCollege, setSelectedCollege] = useState<{
    _id: string
    name: string
    address: string
    pincode: string
  } | null>(null);


  useEffect(() => {
    const fetchColleges = async () => {
      if (collegeQuery.trim().length < 2) {
        setCollegeResults([])
        return
      }
      try {
        const res = await fetch(`${baseURL}/api/colleges/search?q=${collegeQuery}`)
        if (res.ok) {
          const data = await res.json()
          setCollegeResults(data)
        }
      } catch (err) {
        console.error('Error fetching college list:', err)
      }
    }

    const delayDebounce = setTimeout(fetchColleges, 400)
    return () => clearTimeout(delayDebounce)
  }, [collegeQuery, baseURL]);

  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then((profile: ProfileResponse) => {
        setName(profile.fullName || 'Guest')
        reset({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phoneNo: profile.phoneNo || '',
          college: profile.college || '',
          about: profile.about || '',
          education: profile.education || [],
          skills: profile.skills || [],
          joiningYear: profile.joiningYear || '',
          batch: profile.batch || '',
        })

        setCollegeQuery(profile.college || '')
        setEducationFields(profile.education || [])
        setSkills(profile.skills || [])

        if (profile.profileImage) {
          let filename = profile.profileImage.replace(/\\/g, '/')
          if (filename.startsWith('/')) filename = filename.substring(1)
          if (!filename.startsWith('uploads/')) filename = 'uploads/' + filename
          setServerImagePath(`${baseURL}/${filename}`)
        }

        if (profile.resume) {
          let p = profile.resume.replace(/\\/g, '/')
          if (p.startsWith('/')) p = p.substring(1)
          if (!p.startsWith('uploads/')) p = 'uploads/' + p
          setServerResumePath(`${baseURL}/${p}`)
        }

        if (Array.isArray(profile.certifications)) {
          const paths = profile.certifications.map((c) => {
            let p = (c || '').replace(/\\/g, '/')
            if (p.startsWith('/')) p = p.substring(1)
            if (!p.startsWith('uploads/')) p = 'uploads/' + p
            return `${baseURL}/${p}`
          })
          setServerCertPaths(paths)
        }
      })
      .catch((err) => console.error('Error fetching profile:', err))
  }, [token, reset, baseURL])

  // Image change
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    }
  }

  // Resume change (single)
  const onResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const allowedExtensions = ['pdf', 'doc', 'docx'];

      const fileType = file.type;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      if (!allowedTypes.includes(fileType) || !allowedExtensions.includes(fileExtension)) {
        alert('Please upload PDF/DOC/DOCX files.');
        // Clear the input so invalid file is removed
        e.target.value = '';
        return;
      }

      // If file is valid, set the state
      setResumeFile(file);
    }
  };


  // Certs change (multi)
  const onCertsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertFiles(Array.from(e.target.files))
    }
  }

  // Skills helpers
  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (skills.includes(s)) {
      setSkillInput('')
      return
    }
    const next = [...skills, s].slice(0, 50)
    setSkills(next)
    setValue('skills', next)
    setSkillInput('')
  }
  const removeSkill = (s: string) => {
    const next = skills.filter((x) => x !== s)
    setSkills(next)
    setValue('skills', next)
  }

  const onSubmit = async (data: any) => {
    if (!selectedCollege) {
      setToastMessage('Please select a valid college from the list')
      setShowToast(true)
      return
    }

    setIsSaving(true) // 🔥 start spinner

    try {
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('phoneNo', data.phoneNo)
      formData.append('college', data.college)
      formData.append('about', data.about || '')
      formData.append('joiningYear', data.joiningYear)
      formData.append('batch', data.batch)

      educationFields.forEach((edu, idx) =>
        formData.append(`education[${idx}]`, edu)
      )
      skills.forEach((sk, idx) =>
        formData.append(`skills[${idx}]`, sk)
      )

      if (imageFile) formData.append('profileImage', imageFile)
      if (resumeFile) formData.append('resume', resumeFile)
      if (certFiles.length > 0) {
        certFiles.forEach((f) => formData.append('certifications', f))
      }

      const res = await fetch(`${baseURL}/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to update profile')

      const result = await res.json()

      setToastMessage('Profile updated successfully!')
      setShowToast(true)

      setResumeFile(null)
      setCertFiles([])
    } catch (err) {
      console.error(err)
      setToastMessage('Failed to update profile. Please try again.')
      setShowToast(true)
    } finally {
      setIsSaving(false) // ✅ stop spinner
    }
  }


  return (
    <>
      <Card className="bg-transparent border rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h3 className="card-header-title mb-0">Update Profile</h3>
        </CardHeader>
        <CardBody>
          <form className="row g-4" onSubmit={handleSubmit(onSubmit)}>
            <Col xs={12}>
              <label className="form-label">Profile picture</label>
              <div className="d-flex align-items-center">
                <label className="position-relative me-4">
                  <span className="avatar avatar-xl">
                    <img
                      className="avatar-img rounded-circle border border-white border-3 shadow"
                      src={imagePreviewUrl || serverImagePath || avatar7 || fallbackUrl}
                      alt="Profile avatar"
                      onError={(e) => (e.currentTarget.src = fallbackUrl)}
                    />
                  </span>
                  {imagePreviewUrl && (
                    <button
                      type="button"
                      className="uploadremove"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreviewUrl(null)
                      }}>
                      <BsX className="bi bi-x text-white" />
                    </button>
                  )}
                </label>
                <label className="btn btn-primary-soft mb-0">
                  Change
                  <input className="form-control d-none" type="file" accept="image/*" onChange={onImageChange} />
                </label>
              </div>
            </Col>

            <TextFormInput name="fullName" maxLength={30} label="Full name *" control={control} containerClassName="col-md-6" />
            {/*  <TextFormInput name="username" label="Username *" control={control} containerClassName="col-md-6" /> */}
            <TextFormInput name="email" label="Email *" control={control} disabled containerClassName="col-md-6" />
            <TextFormInput name="phoneNo" label="Phone number *" control={control} disabled containerClassName="col-md-6" />
            {/*  <TextFormInput name="location" label="Location *" control={control} containerClassName="col-md-6" /> */}
            {/* <TextFormInput name="college" label="College Name *" control={control} containerClassName="col-md-6" /> */}
            {/* ✅ College autocomplete field */}
            <Col md={6}>
              <label className="form-label fw-semibold">College *</label>

              <div className="position-relative">
                {/* 🔍 Search icon (always visible) */}
                <span
                  className="position-absolute top-50 translate-middle-y text-muted"
                  style={{ left: '12px', zIndex: 2 }}
                >
                  <BsSearch />
                </span>

                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search your college"
                  autoComplete="off"
                  value={collegeQuery}
                  {...register('college')}
                  onChange={(e) => {
                    const val = e.target.value
                    setCollegeQuery(val)
                    setValue('college', val)

                    // invalidate previous selection
                    setSelectedCollege(null)
                    setShowCollegeList(true)
                  }}
                  onFocus={() => {
                    if (collegeQuery.trim().length >= 1) {
                      setShowCollegeList(true)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCollegeList(false), 150)
                  }}
                />

                {/* helper text */}
                {collegeQuery.length === 1 && (
                  <small className="text-muted mt-1 d-block">
                    Start typing to search and select your college
                  </small>
                )}

                {/* Dropdown */}
                {showCollegeList && collegeQuery.trim().length >= 1 && (
                  <ul
                    className="list-group position-absolute w-100 shadow-sm mt-1"
                    style={{ zIndex: 1050 }}
                  >
                    {collegeResults.length > 0 ? (
                      collegeResults.map((college) => (
                        <li
                          key={college._id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e) => {
                            e.preventDefault() // 🔥 prevents input blur before selection

                            const display = `${college.name}, ${college.address}, ${college.pincode}`
                            setCollegeQuery(display)
                            setValue('college', display)
                            setSelectedCollege(college)
                            setShowCollegeList(false)
                          }}
                        >
                          <strong>{college.name}</strong>
                          <br />
                          <small className="text-muted">
                            {college.address}, {college.pincode}
                          </small>
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item text-muted text-center">
                        No colleges found
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </Col>


            {/* Joining Year */}
            <Col md={3}>
              <label className="form-label fw-semibold">Joining Year *</label>
              <select className="form-select" {...register('joiningYear')}>
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Col>

            {/* Batch (Department) */}
            <Col md={3}>
              <label className="form-label fw-semibold">Batch *</label>
              <select className="form-select" {...register('batch')}>
                <option value="">Select Department</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Col>

            <Col xs={12}>
              <label className="form-label">About me</label>
              <textarea maxLength={500} className="form-control" rows={3} {...register('about')} />
            </Col>

            <Col xs={12}>
              <label className="form-label">Education</label>

              {educationFields.map((field, index) => (
                <div key={index} className="d-flex align-items-center mb-2 gap-2">
                  <input
                    className="form-control"
                    maxLength={100}
                    value={field}
                    placeholder={`Education ${index + 1}`}
                    onChange={(e) => {
                      const updated = [...educationFields]
                      updated[index] = e.target.value
                      setEducationFields(updated)
                      setValue('education', updated)
                    }}
                  />

                  {/* ❌ Only show remove button if NOT the first input */}
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        // Remove the selected field but always keep at least one
                        if (educationFields.length > 1) {
                          const updated = educationFields.filter((_, i) => i !== index)
                          setEducationFields(updated)
                          setValue('education', updated)
                        }
                      }}
                      aria-label="Remove education field">
                      <BsX size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-sm btn-light mb-0 mt-1"
                onClick={() => {
                  const updated = [...educationFields, '']
                  setEducationFields(updated)
                  setValue('education', updated)
                }}>
                <BsPlus className="me-1" /> Add more
              </button>
            </Col>

            {/* Resume Upload */}
            <Col xs={12} md={6}>
              <label className="form-label">Resume (PDF/DOC/DOCX)</label>
              <input
                className="form-control"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onResumeChange}
              />
              {serverResumePath && (
                <small className="text-muted d-block mt-1">
                  Current:{' '}
                  <a href={serverResumePath} target="_blank" rel="noreferrer">
                    View resume
                  </a>
                </small>
              )}
            </Col>

            {/* Certifications Upload */}
            <Col xs={12} md={6}>
              <label className="form-label">Certifications (multiple files)</label>
              <input
                className="form-control"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
                onChange={onCertsChange}
              />
              {serverCertPaths?.length > 0 && (
                <small className="text-muted d-block mt-1">
                  Current:
                  <ul className="mb-0 mt-1">
                    {serverCertPaths.map((p, idx) => (
                      <li key={idx}>
                        <a href={p} target="_blank" rel="noreferrer">
                          Certification {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </small>
              )}
            </Col>

            {/* Skills (high-contrast chips) */}
            <Col xs={12}>
              <label className="form-label">Skill sets</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control mb-2"
                  placeholder="e.g. React, Node.js, MongoDB"
                  value={skillInput}
                  maxLength={20} // ✅ limit input to 20 characters
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 20) {
                      setSkillInput(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Add on Enter or comma
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addSkill()
                    }
                    // Backspace on empty input removes last chip
                    if (e.key === 'Backspace' && !skillInput && skills.length) {
                      removeSkill(skills[skills.length - 1])
                    }
                  }}
                  onBlur={() => {
                    // quick add on blur if they typed something
                    if (skillInput.trim()) addSkill()
                  }}
                />
                <button type="button" className="btn btn-sm btn-secondary" onClick={addSkill}>
                  Add
                </button>
              </div>

              {/* Optional hint */}
              <small className="text-muted">Max 20 characters per skill</small>

              <div className="mt-2 d-flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="tag-chip">
                    <span className="tag-text">{s}</span>
                    <button type="button" className="chip-remove" aria-label={`Remove ${s}`} title="Remove" onClick={() => removeSkill(s)}>
                      <BsX size={18} />
                    </button>
                  </span>
                ))}
              </div>

              {errors?.skills && <div className="text-danger small mt-1">{String(errors.skills.message || '')}</div>}
            </Col>

            <div className="d-sm-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-primary mb-0 d-flex align-items-center gap-2"
                disabled={isSaving}
              >
                {isSaving && (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                )}
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>

          </form>
        </CardBody>

        <ToastContainer position="bottom-end" className="p-3">
          <Toast bg="success" onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Card>

      {/* Chip + input styling for dark UI */}
      <style>{`
        /* ===================== Tag & Skill Input (Theme Aware) ===================== */

/* Defaults = LIGHT MODE */
:root{
  --chip-bg: rgba(17, 24, 39, .06);
  --chip-border: rgba(17, 24, 39, .16);
  --chip-text: #111827;
  --chip-remove: #334155;
  --chip-remove-hover-bg: rgba(17, 24, 39, .08);

  --skill-ph: rgba(51, 65, 85, .8);
  --skill-bg: #ffffff;
  --skill-border: #e5e7eb;
  --skill-text: #0f172a;
}

/* DARK MODE (any one selector you use) */
[data-bs-theme="dark"], .dark, .theme-dark{
  --chip-bg: rgba(255, 255, 255, .08);
  --chip-border: rgba(255, 255, 255, .22);
  --chip-text: #e5e7eb;
  --chip-remove: #cbd5e1;
  --chip-remove-hover-bg: rgba(255, 255, 255, .15);

  --skill-ph: #94a3b8;
  --skill-bg: rgba(255,255,255,.06);
  --skill-border: rgba(255,255,255,.18);
  --skill-text: #e5e7eb;
}

/* ---- Text input for adding skills ---- */
.skill-input{
  background: var(--skill-bg) !important;
  color: var(--skill-text) !important;
  border: 1px solid var(--skill-border) !important;
  border-radius: 12px;
  padding: .625rem .875rem;
  box-shadow: none;
}
.skill-input::placeholder{
  color: var(--skill-ph) !important;
  opacity: 1;
}
.skill-input:focus{
  outline: none;
  border-color: rgba(99,102,241,.55) !important;  /* indigo ring */
  box-shadow: 0 0 0 .2rem rgba(99,102,241,.18) !important;
}

/* ---- Tag chip ---- */
.tag-chip{
  display:inline-flex;
  align-items:center;
  gap:.35rem;
  padding:.35rem .6rem;
  border-radius:999px;
  font-size:.85rem;
  font-weight:600;
  color: var(--chip-text);
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  backdrop-filter: blur(6px) saturate(140%);
  -webkit-backdrop-filter: blur(6px) saturate(140%);
}
.tag-chip .tag-text{ line-height:1; }

/* ---- Remove (X) button ---- */
.chip-remove{
  width:22px; height:22px;
  display:inline-flex; align-items:center; justify-content:center;
  border:none; border-radius:999px;
  background:transparent;
  color: var(--chip-remove);
  padding:0; cursor:pointer;
}
.chip-remove:hover{
  background: var(--chip-remove-hover-bg);
  color: var(--chip-text);
}

/* Optional: container spacing for chips row */
.tags-wrap{
  display:flex; flex-wrap:wrap; gap:.5rem;
}
  .skill-input {
  height: calc(2.5rem + 2px); /* matches .form-control-lg */
  font-size: 0.95rem;
  border-radius: 0.375rem; /* same as TextFormInput */
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
  .list-group-item:hover {
  background-color: rgba(99, 102, 241, 0.08);
}

      `}</style>
    </>
  )
}

export default EditProfile
