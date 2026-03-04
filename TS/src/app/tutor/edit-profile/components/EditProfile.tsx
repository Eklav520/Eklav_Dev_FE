import avatar7 from '@/assets/images/avatar/07.jpg'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { useForm, useFieldArray } from 'react-hook-form'
import { BsPlus, BsX } from 'react-icons/bs'
import * as yup from 'yup'
import { useEffect, useState } from 'react'
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

  designation?: string | null      // ✅ NEW
  experience?: string | null       // ✅ NEW

  education: string[]
  skills: string[]
  profileImage?: FileList
  resume?: FileList
}
/* ✅ Only validate editable fields */
const contactFormSchema = yup.object({
  fullName: yup.string().nullable(),
  email: yup.string().nullable(),
  phoneNo: yup.string().nullable(),
  college: yup.string().nullable(),
  about: yup.string().nullable(),
  joiningYear: yup.string().nullable(),
  department: yup.string().nullable(),

  designation: yup.string().nullable(),   // ✅ NEW
  experience: yup.string().nullable(),    // ✅ NEW

  education: yup.array().of(yup.string().required()).required(),
  skills: yup.array().of(yup.string().required()).required(),
  profileImage: yup.mixed().notRequired(),
  resume: yup.mixed().notRequired(),
})

const EditProfile = () => {
  const { user, setUser } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(contactFormSchema) as any,
    defaultValues: {
      fullName: '',
      email: '',
      phoneNo: '',
      college: '',
      about: '',
      joiningYear: '',
      department: '',
      designation: '',     // ✅ NEW
      experience: '',      // ✅ NEW
      education: [''],
      skills: [''],
    },
  })

  // useFieldArray with explicit generics so `name` is a valid key of ProfileFormValues
  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation
  } = useFieldArray<ProfileFormValues, 'education'>({
    control,
    name: 'education',
  })

  const {
    fields: skillsFields,
    append: appendSkill,
    remove: removeSkill
  } = useFieldArray<ProfileFormValues, 'skills'>({
    control,
    name: 'skills',
  })

  /* ===============================
     Fetch Profile
  =============================== */
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

          designation: profile.designation || '',   // ✅ NEW
          experience: profile.experience || '',    // ✅ NEW

          education: profile.education?.length ? profile.education : [''],
          skills: profile.skills?.length ? profile.skills : [''],
        })

        if (profile.profileImage) {
          const imageUrl = profile.profileImage.startsWith("http")
            ? profile.profileImage
            : `${baseURL}/${profile.profileImage.replace(/^\/+/, "")}`

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

  /* ===============================
     Submit (Only Editable Fields)
  =============================== */
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true)
      const formData = new FormData()

      // Filter out empty values
      const education = data.education.filter(edu => edu.trim() !== '')
      const skills = data.skills.filter(skill => skill.trim() !== '')

      // ❗ DO NOT send fullName, email, phoneNo
      formData.append('college', data.college || '')
      formData.append('about', data.about || '')
      formData.append('joiningYear', data.joiningYear || '')
      formData.append('department', data.department || '')
      formData.append('designation', data.designation || '')
      formData.append('experience', data.experience || '')
      formData.append('education', JSON.stringify(education))
      formData.append('skills', JSON.stringify(skills))

      if (data.profileImage?.[0]) {
        formData.append('profileImage', data.profileImage[0])
      }

      if (data.resume?.[0]) {
        formData.append('resume', data.resume[0])
      }

      await axios.put(`${baseURL}/profile`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      // 🔄 Fetch updated profile
      const updated = await axios.get(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      // 🔄 Update context
      setUser((prev: any) => ({
        ...prev,
        ...updated.data
      }))

      alert("Profile updated successfully")
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  if (isLoading && !preview) {
    return (
      <Card className="bg-transparent border rounded-3">
        <CardBody className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <h3 className="card-header-title mb-0">Edit Profile</h3>
      </CardHeader>

      <CardBody>
        <form className="row g-4" onSubmit={handleSubmit(onSubmit)}>

          {/* Profile Image */}
          <Col xs={12}>
            <label className="form-label">Profile picture</label>
            <div className="d-flex align-items-center">
              <span className="avatar avatar-xl me-3">
                <img
                  className="avatar-img rounded-circle border border-3 shadow"
                  src={preview || avatar7}
                  alt="Profile"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = avatar7
                  }}
                />
              </span>
              <div className="flex-grow-1">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  {...register('profileImage')}
                  onChange={handleImageChange}
                />
                <small className="text-muted">
                  JPG, GIF or PNG. Max size 2MB
                </small>
              </div>
            </div>
          </Col>

          {/* ❌ Disabled Core Fields */}
          <TextFormInput
            name="fullName"
            label="Full Name"
            control={control}
            containerClassName="col-md-6"
            disabled
          />

          <TextFormInput
            name="email"
            label="Email"
            control={control}
            containerClassName="col-md-6"
            disabled
          />

          <TextFormInput
            name="phoneNo"
            label="Phone Number"
            control={control}
            containerClassName="col-md-6"
            disabled
          />

          {/* Editable Fields */}
          <TextFormInput
            name="college"
            label="College"
            control={control}
            containerClassName="col-md-6"
          />

          <TextFormInput
            name="joiningYear"
            label="Joining Year"
            control={control}
            containerClassName="col-md-6"
            placeholder="e.g., 2020"
          />

          <TextFormInput
            name="department"
            label="Department"
            control={control}
            containerClassName="col-md-6"
          />

          <TextFormInput
            name="designation"
            label="Designation"
            control={control}
            containerClassName="col-md-6"
            placeholder="e.g., Senior Full Stack Developer"
          />

          <TextFormInput
            name="experience"
            label="Experience"
            control={control}
            containerClassName="col-md-6"
            placeholder="e.g., 12 Years"
          />

          <Col xs={12}>
            <label className="form-label">About</label>
            <textarea
              className="form-control"
              rows={4}
              {...register('about')}
              placeholder="Tell us about yourself..."
            />
            {errors.about && (
              <div className="text-danger small mt-1">{errors.about.message}</div>
            )}
          </Col>

          {/* Education */}
          <Col xs={12}>
            <label className="form-label">Education</label>
            {educationFields.map((item, index) => (
              <div key={item.id} className="d-flex mb-2">
                <input
                  className="form-control me-2"
                  {...register(`education.${index}` as const)}
                  placeholder="e.g., B.Tech in Computer Science"
                />
                {educationFields.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeEducation(index)}
                  >
                    <BsX size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-light mt-2"
              onClick={() => appendEducation('')}
            >
              <BsPlus className="me-1" />
              Add Education
            </button>
          </Col>

          {/* Skills */}
          <Col xs={12}>
            <label className="form-label">Skills</label>
            {skillsFields.map((item, index) => (
              <div key={item.id} className="d-flex mb-2">
                <input
                  className="form-control me-2"
                  {...register(`skills.${index}` as const)}
                  placeholder="e.g., JavaScript, React, Node.js"
                />
                {skillsFields.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeSkill(index)}
                  >
                    <BsX size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-light mt-2"
              onClick={() => appendSkill('')}
            >
              <BsPlus className="me-1" />
              Add Skill
            </button>
          </Col>

          {/* Resume Upload */}
          <Col xs={12}>
            <label className="form-label">Resume (PDF)</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf"
              {...register('resume')}
            />
            <small className="text-muted">
              Upload your resume in PDF format. Max size 5MB
            </small>
          </Col>

          <div className="d-sm-flex justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default EditProfile