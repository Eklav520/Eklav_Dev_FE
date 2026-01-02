// Step6AdditionalDetails.tsx
import React from 'react'
import { StepProps } from '../ResumeBuilder'

const Step6AdditionalDetails: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const handleChange = (field: keyof typeof data, index: number, value: string) => {
    const updated = [...(data[field] as string[])]
    updated[index] = value
    setData({ ...data, [field]: updated })
  }

  const addField = (field: keyof typeof data) => {
    const updated = [...(data[field] as string[]), '']
    setData({ ...data, [field]: updated })
  }

  const removeField = (field: keyof typeof data, index: number) => {
    const updated = (data[field] as string[]).filter((_, i) => i !== index)
    setData({ ...data, [field]: updated })
  }

  return (
    <div className="container mt-4">
      <h3>Additional Details</h3>

      <h5>Projects</h5>
      {data.projects.map((proj, i) => (
        <div className="mb-3" key={i}>
          <textarea
            className="form-control"
            rows={3} // adjust as needed
            value={proj}
            onChange={(e) => handleChange('projects', i, e.target.value)}
            placeholder={`Enter project ${i + 1} details...`}
          />
          <div className="d-flex justify-content-end mt-1">
            <button className="btn btn-sm btn-danger" onClick={() => removeField('projects', i)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addField('projects')}>
        + Add Project
      </button>

      {/* Certifications */}
      <h5>Certifications</h5>
      {data.certifications?.map((cert, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={cert} onChange={(e) => handleChange('certifications', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeField('certifications', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addField('certifications')}>
        + Add Certification
      </button>

      {/* Languages */}
      <h5>Languages</h5>
      {data.languages?.map((lang, i) => (
        <div className="input-group mb-2" key={i}>
          <input className="form-control" value={lang} onChange={(e) => handleChange('languages', i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeField('languages', i)}>
            Remove
          </button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={() => addField('languages')}>
        + Add Language
      </button>

      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={goNext}>
          Next
        </button>
      </div>
    </div>
  )
}

export default Step6AdditionalDetails
