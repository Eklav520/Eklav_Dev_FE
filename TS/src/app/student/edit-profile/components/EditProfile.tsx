import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Col, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import {
  BsPlus,
  BsX,
  BsSearch,
  BsCamera,
  BsTrash,
  BsFileText,
  BsBriefcase,
  BsFileEarmarkPdf,  // For PDF file icon
  BsFileEarmarkText, // For document icon
  BsAward,           // Alternative for certificate
  BsTrophy,          // Alternative for certificate
  BsPatchCheck       // Alternative for certificate
} from 'react-icons/bs';
import { useAuthContext } from '@/context/useAuthContext';
import avatar7 from '@/assets/images/avatar/07.jpg';
import TextFormInput from '@/components/form/TextFormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaCertificate } from 'react-icons/fa';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNo: yup.string().required('Phone number is required'),
  college: yup.string().required('College is required'),
  about: yup.string(),
  education: yup.array().of(yup.string()),
  skills: yup.array().of(yup.string().trim()).max(50, 'Too many skills'),
  joiningYear: yup.string().nullable(),
  department: yup.string().nullable(),
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
  department?: string
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

  const [educationFields, setEducationFields] = useState<string[]>([])
  const [serverImagePath, setServerImagePath] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success')
  const [name, setName] = useState('Guest')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [certFiles, setCertFiles] = useState<File[]>([])
  const [serverResumePath, setServerResumePath] = useState<string | null>(null)
  const [serverCertPaths, setServerCertPaths] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const [collegeQuery, setCollegeQuery] = useState('')
  const [collegeResults, setCollegeResults] = useState<{ _id: string; name: string; address: string; pincode: string; logo?: string }[]>([]);
  const [showCollegeList, setShowCollegeList] = useState(false);

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const departmentOptions = ['Computer Science and Engineering', 'Electronics and Communication Engineering', 'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning', 'Data Science', 'Internet of Things', 'Biomedical Engineering', 'Chemical Engineering', 'Master of Computer Applications', 'Bachelor of Technology'].sort();
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
          department: profile.department || '',
        })

        setCollegeQuery(profile.college || '')
        setEducationFields(profile.education || [])
        setSkills(profile.skills || [])

        if (profile.profileImage) {
          const cleanPath = profile.profileImage.replace(/\\/g, '/')
          const finalUrl = `${baseURL}${cleanPath}`
          setServerImagePath(finalUrl)
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

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    }
  }

  const onResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['pdf', 'doc', 'docx'];

      const fileType = file.type;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

      if (!allowedTypes.includes(fileType) || !allowedExtensions.includes(fileExtension)) {
        setToastMessage('Please upload PDF/DOC/DOCX files.')
        setToastVariant('danger')
        setShowToast(true)
        e.target.value = '';
        return;
      }

      setResumeFile(file);
    }
  };

  const onCertsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertFiles(Array.from(e.target.files))
    }
  }

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
    if (!data.college || data.college.trim() === '') {
      setToastMessage('Please select a valid college from the list')
      setToastVariant('danger')
      setShowToast(true)
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('phoneNo', data.phoneNo)
      formData.append('college', data.college)
      formData.append('about', data.about || '')
      formData.append('joiningYear', data.joiningYear)
      formData.append('department', data.department)

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
      setToastVariant('success')
      setShowToast(true)

      setResumeFile(null)
      setCertFiles(null as any)
    } catch (err) {
      console.error(err)
      setToastMessage('Failed to update profile. Please try again.')
      setToastVariant('danger')
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="edit-profile-container">
      <Card className="profile-card">
        <CardHeader className="profile-card-header">
          <div className="header-content">
            <div className="header-left">
              <BsBriefcase className="header-icon" />
              <div>
                <h3 className="header-title">Update Profile</h3>
                <p className="header-subtitle">Manage your personal information and documents</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="profile-card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Profile Picture */}
            <Col xs={12} className="mb-4">
              <label className="form-label-custom">Profile Picture</label>
              <div className="profile-picture-section">
                <div className="avatar-container">
                  <div className="avatar-wrapper">
                    <img
                      className="avatar-image"
                      src={imagePreviewUrl || serverImagePath || avatar7 || fallbackUrl}
                      alt="Profile avatar"
                      onError={(e) => (e.currentTarget.src = fallbackUrl)}
                    />
                    {imagePreviewUrl && (
                      <button
                        type="button"
                        className="avatar-remove-btn"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreviewUrl(null)
                        }}
                      >
                        <BsTrash />
                      </button>
                    )}
                    <label className="avatar-upload-btn">
                      <BsCamera />
                      <input className="d-none" type="file" accept="image/*" onChange={onImageChange} />
                    </label>
                  </div>
                </div>
              </div>
            </Col>

            {/* Personal Information */}
            <div className="form-section">
              <h6 className="section-title">Personal Information</h6>
              <div className="row g-4">
                <TextFormInput name="fullName" maxLength={30} label="Full Name *" control={control} containerClassName="col-md-6" />
                <TextFormInput name="email" label="Email Address *" control={control} disabled containerClassName="col-md-6" />
                <TextFormInput name="phoneNo" label="Phone Number *" control={control} disabled containerClassName="col-md-6" />
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h6 className="section-title">Academic Information</h6>
              <div className="row g-4">
                {/* College Autocomplete */}
                <Col md={6}>
                  <label className="form-label-custom">College *</label>
                  <div className="position-relative">
                    <span className="search-icon">
                      <BsSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control-custom"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Search your college"
                      autoComplete="off"
                      value={collegeQuery}
                      {...register('college')}
                      onChange={(e) => {
                        const val = e.target.value
                        setCollegeQuery(val)
                        setValue('college', val)
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
                    {showCollegeList && collegeQuery.trim().length >= 1 && (
                      <ul className="college-dropdown">
                        {collegeResults.length > 0 ? (
                          collegeResults.map((college) => (
                            <li
                              key={college._id}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                const display = `${college.name}, ${college.address}, ${college.pincode}`
                                setCollegeQuery(display)
                                setValue('college', display)
                                setSelectedCollege(college)
                                setShowCollegeList(false)
                              }}
                            >
                              <strong>{college.name}</strong>
                              <small>{college.address}, {college.pincode}</small>
                            </li>
                          ))
                        ) : (
                          <li className="text-center text-muted">No colleges found</li>
                        )}
                      </ul>
                    )}
                  </div>
                </Col>

                <Col md={3}>
                  <label className="form-label-custom">Joining Year *</label>
                  <select className="form-select-custom" {...register('joiningYear')}>
                    <option value="">Select Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </Col>

                <Col md={3}>
                  <label className="form-label-custom">Department *</label>
                  <select className="form-select-custom" {...register('department')}>
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </Col>
              </div>
            </div>

            {/* About Me */}
            <div className="form-section">
              <h6 className="section-title">About Me</h6>
              <textarea
                className="form-control-custom"
                rows={4}
                {...register('about')}
                placeholder="Tell us about yourself, your interests, and career goals..."
              />
            </div>

            {/* Education */}
            <div className="form-section">
              <h6 className="section-title">Education</h6>
              {educationFields.map((field, index) => (
                <div key={index} className="education-field">
                  <input
                    className="form-control-custom"
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
                  {index > 0 && (
                    <button
                      type="button"
                      className="remove-education-btn"
                      onClick={() => {
                        if (educationFields.length > 1) {
                          const updated = educationFields.filter((_, i) => i !== index)
                          setEducationFields(updated)
                          setValue('education', updated)
                        }
                      }}
                    >
                      <BsX />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-more-btn"
                onClick={() => {
                  const updated = [...educationFields, '']
                  setEducationFields(updated)
                  setValue('education', updated)
                }}
              >
                <BsPlus className="me-1" /> Add Education
              </button>
            </div>

            {/* Resume & Certifications */}
            <div className="form-section">
              <h6 className="section-title">Documents</h6>
              <div className="row g-4">
                <Col md={6}>
                  <label className="form-label-custom">
                    <BsFileText className="me-1" /> Resume (PDF/DOC/DOCX)
                  </label>
                  <input
                    className="form-control-custom"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={onResumeChange}
                  />
                  {serverResumePath && (
                    <small className="form-hint">
                      Current: <a href={serverResumePath} target="_blank" rel="noreferrer" className="file-link">View resume</a>
                    </small>
                  )}
                </Col>

                <Col md={6}>
                  <label className="form-label-custom">
                    <FaCertificate className="me-1" /> Certifications (Multiple files)
                  </label>
                  <input
                    className="form-control-custom"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={onCertsChange}
                  />
                  {serverCertPaths?.length > 0 && (
                    <small className="form-hint">
                      Current certifications:
                      <ul className="cert-list">
                        {serverCertPaths.map((p, idx) => (
                          <li key={idx}>
                            <a href={p} target="_blank" rel="noreferrer">Certification {idx + 1}</a>
                          </li>
                        ))}
                      </ul>
                    </small>
                  )}
                </Col>
              </div>
            </div>

            {/* Skills */}
            <div className="form-section">
              <h6 className="section-title">Skills</h6>
              <div className="skills-input-wrapper">
                <input
                  className="skill-input-custom"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  maxLength={20}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) {
                      setSkillInput(e.target.value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addSkill()
                    }
                    if (e.key === 'Backspace' && !skillInput && skills.length) {
                      removeSkill(skills[skills.length - 1])
                    }
                  }}
                  onBlur={() => {
                    if (skillInput.trim()) addSkill()
                  }}
                />
                <button type="button" className="add-skill-btn" onClick={addSkill}>
                  Add
                </button>
              </div>
              <small className="form-hint">Max 20 characters per skill. Press Enter or comma to add.</small>

              <div className="skills-container">
                {skills.map((s) => (
                  <span key={s} className="skill-chip">
                    <span className="skill-text">{s}</span>
                    <button type="button" className="chip-remove" onClick={() => removeSkill(s)}>
                      <BsX />
                    </button>
                  </span>
                ))}
              </div>
              {errors?.skills && <div className="text-danger small mt-1">{String(errors.skills.message || '')}</div>}
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSaving}
              >
                {isSaving && <Spinner size="sm" animation="border" className="me-2" />}
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardBody>

        <ToastContainer position="bottom-end" className="p-3">
          <Toast
            bg={toastVariant}
            onClose={() => setShowToast(false)}
            show={showToast}
            delay={3000}
            autohide
            className={`toast-custom toast-${toastVariant}`}
          >
            <Toast.Body>{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Card>

      <style>{`
        .edit-profile-container {
          background: #222529;
          min-height: 100vh;
          padding: 1rem;
        }

        .profile-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
        }

        .profile-card-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .profile-card-body {
          padding: 1.5rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-title {
          color: #ff7a00;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-label-custom {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .form-control-custom, .form-select-custom {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 8px;
          width: 100%;
          transition: all 0.2s ease;
        }

        .form-control-custom:focus, .form-select-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          outline: none;
        }

        .form-control-custom::placeholder {
          color: #6c757d;
        }

        .form-hint {
          color: #6c757d;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          display: block;
        }

        .file-link {
          color: #ff7a00;
          text-decoration: none;
        }

        .file-link:hover {
          color: #ff944d;
          text-decoration: underline;
        }

        .cert-list {
          margin-top: 0.5rem;
          padding-left: 1rem;
        }

        .cert-list li {
          margin-bottom: 0.25rem;
        }

        /* Profile Picture */
        .profile-picture-section {
          display: flex;
          justify-content: center;
        }

        .avatar-container {
          position: relative;
        }

        .avatar-wrapper {
          position: relative;
          display: inline-block;
        }

        .avatar-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #ff7a00;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .avatar-remove-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #dc3545;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .avatar-remove-btn:hover {
          background: #c82333;
          transform: scale(1.05);
        }

        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ff7a00;
          border: none;
          color: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .avatar-upload-btn:hover {
          background: #ff944d;
          transform: scale(1.05);
        }

        /* College Search */
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #ff7a00;
        }

        .college-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          margin-top: 4px;
          padding: 0;
          list-style: none;
          z-index: 1000;
          max-height: 250px;
          overflow-y: auto;
        }

        .college-dropdown li {
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 1px solid #2c2c2c;
        }

        .college-dropdown li:last-child {
          border-bottom: none;
        }

        .college-dropdown li:hover {
          background: rgba(255, 122, 0, 0.1);
        }

        .college-dropdown strong {
          display: block;
          color: #ffffff;
        }

        .college-dropdown small {
          color: #8a8a8a;
          font-size: 0.75rem;
        }

        /* Education Fields */
        .education-field {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .education-field .form-control-custom {
          flex: 1;
        }

        .remove-education-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #dc3545;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-education-btn:hover {
          background: #c82333;
        }

        .add-more-btn {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid #ff7a00;
          color: #ff7a00;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .add-more-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        /* Skills */
        .skills-input-wrapper {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .skill-input-custom {
          flex: 1;
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 8px;
        }

        .skill-input-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          outline: none;
        }

        .add-skill-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .add-skill-btn:hover {
          transform: translateY(-1px);
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .skill-chip {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid rgba(255, 122, 0, 0.3);
          border-radius: 20px;
          padding: 0.375rem 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #ff7a00;
        }

        .skill-text {
          font-weight: 500;
        }

        .chip-remove {
          background: transparent;
          border: none;
          color: #ff7a00;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
        }

        .chip-remove:hover {
          color: #ffffff;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .submit-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Toast */
        .toast-custom.toast-success {
          background: #28a745;
        }

        .toast-custom.toast-danger {
          background: #dc3545;
        }

        .toast-custom .toast-body {
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-card-body {
            padding: 1rem;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .skills-input-wrapper {
            flex-direction: column;
          }

          .add-skill-btn {
            width: 100%;
          }

          .form-actions {
            justify-content: stretch;
          }

          .submit-btn {
            width: 100%;
          }

          .education-field {
            flex-direction: column;
          }

          .remove-education-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default EditProfile