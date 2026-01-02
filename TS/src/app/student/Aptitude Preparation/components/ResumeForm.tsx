import React from 'react'
import { ResumeData } from './ResumeData'
import axios from 'axios';

type ResumeFormProps = {
  data: ResumeData
  setData: (updated: ResumeData) => void
}

const ResumeForm: React.FC<ResumeFormProps> = ({ data, setData }) => {
  const handleChange = (field: keyof ResumeData, value: any) => {
    setData({ ...data, [field]: value })
  }

  const handleArrayChange = (field: keyof ResumeData, index: number, value: string) => {
    const updatedArray = [...(data[field] as string[])]
    updatedArray[index] = value
    setData({ ...data, [field]: updatedArray })
  }

  const addArrayField = (field: keyof ResumeData) => {
    const updatedArray = [...(data[field] as string[]), '']
    setData({ ...data, [field]: updatedArray })
  }

  const removeArrayField = (field: keyof ResumeData, index: number) => {
    const updatedArray = (data[field] as string[]).filter((_, i) => i !== index)
    setData({ ...data, [field]: updatedArray })
  }

  return (
    <>
      <input className="form-control my-2" placeholder="Full Name" value={data.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
      <input className="form-control my-2" placeholder="Email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} />
      <input className="form-control my-2" placeholder="Phone" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} />
      <input className="form-control my-2" placeholder="LinkedIn" value={data.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} />
      <input className="form-control my-2" placeholder="Role" value={data.role} onChange={(e) => handleChange('role', e.target.value)} />
      <textarea
        className="form-control my-2"
        placeholder="Objective"
        value={data.objective}
        onChange={(e) => handleChange('objective', e.target.value)}
      />

      <button
        className="btn btn-primary my-2"
        onClick={async () => {
          try {
            const response = await axios.post('http://localhost:3000/generate', data)
            handleChange('summary', response.data.summary)
            alert('Summary generated successfully!')
          } catch (err) {
            alert('Failed to generate summary')
          }
        }}>
        Generate AI Summary
      </button>

      <textarea
        className="form-control my-2"
        placeholder="Summary (Generated)"
        value={data.summary}
        onChange={(e) => handleChange('summary', e.target.value)}
      />
      <h5>Skills</h5>
      {data.skills.map((skill, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={skill} onChange={(e) => handleArrayChange('skills', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeArrayField('skills', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addArrayField('skills')}>
        + Add Skill
      </button>

      <h5>Education</h5>
      {data.education.map((edu, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={edu} onChange={(e) => handleArrayChange('education', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeArrayField('education', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addArrayField('education')}>
        + Add Education
      </button>

      <h5>Experience</h5>
      {data.experience.map((exp, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={exp} onChange={(e) => handleArrayChange('experience', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeArrayField('experience', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addArrayField('experience')}>
        + Add Experience
      </button>

      <h5>Projects</h5>
      {data.projects.map((proj, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={proj} onChange={(e) => handleArrayChange('projects', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeArrayField('projects', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addArrayField('projects')}>
        + Add Project
      </button>
    </>
  )
}

export default ResumeForm
