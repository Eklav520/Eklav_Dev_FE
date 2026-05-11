import React, { useState } from 'react'
import Step1Header from './steps/Step1Header'
import Step2Experience from './steps/Step2Experience'
import Step3Achievements from './steps/Step3Achievements'
import Step4Education from './steps/Step3Education'
import Step5Skills from './steps/Step4Skills'
import Step6Summary from './steps/Step5Summary'
import Step7Additional from './steps/Step6AdditionalDetails'
import Step8Preview from './steps/Step7FinalReview'
import { ResumeData } from './ResumeData'
import TemplateGallery from './TemplateGallery'
import { TemplateKey, templateList } from './templateList'
import './resume-builder.css'
import { Container } from 'react-bootstrap'

export interface StepProps {
  data: ResumeData
  setData: React.Dispatch<React.SetStateAction<ResumeData>>
  goNext: () => void
  goBack?: () => void
}

const stepLabels = ['Header', 'Experience', 'Achievements', 'Education', 'Skills', 'Summary', 'Extras', 'Preview']

const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null)

  const [formData, setFormData] = useState<ResumeData>({
    fullName: '',
    surname: '',
    city: '',
    country: '',
    pinCode: '',
    phone: '',
    email: '',
    experience: [],
    achievements: [],
    education: [],
    skills: [],
    summary: '',
    projects: [],
    certifications: [],
    languages: [],
  })

  const goNext = () => setStep((s) => Math.min(s + 1, stepLabels.length))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <Step1Header data={formData} setData={setFormData} goNext={goNext} />
      case 2:
        return <Step2Experience data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 3:
        return <Step3Achievements data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 4:
        return <Step4Education data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 5:
        return <Step5Skills data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 6:
        return <Step6Summary data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 7:
        return <Step7Additional data={formData} setData={setFormData} goNext={goNext} goBack={goBack} />
      case 8:
        return (
          <Step8Preview
            data={formData}
            goBack={goBack}
            SelectedTemplateComponent={selectedTemplate ? templateList[selectedTemplate].component : undefined}
          />
        )
      default:
        return null
    }
  }

  if (!selectedTemplate) {
    return <TemplateGallery onSelectTemplate={setSelectedTemplate} />
  }

  const SelectedTemplateComponent = selectedTemplate ? templateList[selectedTemplate].component : null

  return (
    <Container fluid className="resume-builder-page">
      <div className="container-fluid py-4 resume-builder-content">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>Template:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0', background: '#1e1e28', border: '1px solid #2a2a32', borderRadius: 8, padding: '4px 14px' }}>
              {templateList[selectedTemplate].label}
            </span>
          </div>
          <button
            style={{ fontSize: 12, fontWeight: 600, color: '#ff6b35', background: 'transparent', border: '1px solid #ff6b3540', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}
            onClick={() => setSelectedTemplate(null)}
          >
            ← Change Template
          </button>
        </div>
        {/* Stepper */}
        <div className="d-flex justify-content-between align-items-center mb-4 position-relative" style={{ maxWidth: 1000, margin: '0 auto' }}>
          {stepLabels.map((label, index) => {
            const current = index + 1
            const isActive = step === current
            const isCompleted = step > current

            return (
              <div key={index} className="flex-grow-1 position-relative d-flex flex-column align-items-center">
                {/* Connector Line */}
                {index < stepLabels.length - 1 && (
                  <div
                    className="position-absolute top-50 start-100"
                    style={{
                      height: 2,
                      width: '100%',
                      backgroundColor: step > current ? '#198754' : '#dee2e6',
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                    isActive ? 'bg-primary' : isCompleted ? 'bg-success' : 'bg-secondary'
                  }`}
                  style={{
                    width: 30,
                    height: 30,
                    zIndex: 1,
                    fontSize: 13,
                  }}>
                  {isCompleted ? '✔' : current}
                </div>

                {/* Step Label */}
                <small className={`${isActive ? 'text-primary fw-bold' : 'text-muted'}`} style={{ fontSize: 12 }}>
                  {label}
                </small>
              </div>
            )
          })}
        </div>

        {/* Content Row */}
        <div className="row g-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {/* Left: Form */}
          <div className="col-md-6">
            <div className="bg-white p-4 shadow rounded h-100">{renderStepComponent()}</div>
          </div>

          {/* Right: Live Template Preview */}
          <div className="col-md-6">
            <div className="bg-white p-4 shadow rounded overflow-auto" style={{ maxHeight: '85vh' }}>
              {SelectedTemplateComponent && <SelectedTemplateComponent data={formData} />}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default ResumeBuilder
