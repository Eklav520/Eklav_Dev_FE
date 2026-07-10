import React, { useState } from 'react'
import TemplateGallery from './TemplateGallery'
import { TemplateKey, templateList } from './templateList'
import { ResumeData } from './ResumeData'
import Step1Header from './steps/Step1Header'
import Step2Experience from './steps/Step2Experience'
import Step3Achievements from './steps/Step3Achievements'
import Step4Education from './steps/Step3Education'
import Step5Skills from './steps/Step4Skills'
import Step7Additional from './steps/Step6AdditionalDetails'
import Step8Preview from './steps/Step7FinalReview'
import { useAuthContext } from '@/context/useAuthContext'
import TopProgressBar from './TopProgressBar'
import {
  User, GraduationCap, Zap, Briefcase, FolderOpen, Award, Trophy, MoreHorizontal,
  FileText, PenLine, Eye, Download, CheckCircle, Circle, ArrowRight, Star,
} from 'lucide-react'
import { BsFileEarmarkPerson, BsBook, BsBriefcase } from 'react-icons/bs'

const HOW_IT_WORKS = [
  { icon: <FileText size={15} />, title: 'Choose a Template',    desc: 'Pick a template that suits your profile' },
  { icon: <PenLine size={15} />, title: 'Fill In Your Details',  desc: 'Add your personal, education, skills & experience' },
  { icon: <Eye size={15} />,     title: 'Preview & Customize',   desc: 'Review your resume and make changes' },
  { icon: <Download size={15} />,title: 'Download Resume',       desc: 'Download in PDF format and apply' },
]

const RESUME_TIPS = [
  'Keep your resume to 1–2 pages.',
  'Use clear headings and bullet points.',
  'Highlight your skills and achievements.',
  'Tailor your resume for each job application.',
]

const RESUME_TIP_ICONS = [
  <BsFileEarmarkPerson size={13} />,
  <BsBook size={13} />,
  <Star size={13} />,
  <BsBriefcase size={13} />,
]

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = '#6b7280'
const BG = '#f8fafc'

type MainStage = 1 | 2
type SectionKey = 'personal' | 'education' | 'skills' | 'experience' | 'projects' | 'certifications' | 'achievements' | 'additional'

const SIDEBAR_SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'personal', label: 'Personal Information', icon: <User size={15} /> },
  { key: 'education', label: 'Education', icon: <GraduationCap size={15} /> },
  { key: 'skills', label: 'Skills', icon: <Zap size={15} /> },
  { key: 'experience', label: 'Experience', icon: <Briefcase size={15} /> },
  { key: 'projects', label: 'Projects', icon: <FolderOpen size={15} /> },
  { key: 'certifications', label: 'Certifications', icon: <Award size={15} /> },
  { key: 'achievements', label: 'Achievements', icon: <Trophy size={15} /> },
  { key: 'additional', label: 'Additional Information', icon: <MoreHorizontal size={15} /> },
]

const SECTION_KEYS: SectionKey[] = ['personal', 'education', 'skills', 'experience', 'projects', 'certifications', 'achievements', 'additional']

export interface StepProps {
  data: ResumeData
  setData: React.Dispatch<React.SetStateAction<ResumeData>>
  goNext: () => void
  goBack?: () => void
}

const ResumeBuilder: React.FC = () => {
  const { user } = useAuthContext()
  const isPending = (user?.status || '').trim().toLowerCase() === 'pending'

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null)
  const [mainStage, setMainStage] = useState<MainStage>(1)
  const [activeSection, setActiveSection] = useState<SectionKey>('personal')
  const [comeFromPreview, setComeFromPreview] = useState(false)

  const [formData, setFormData] = useState<ResumeData>({
    fullName: '', surname: '', city: '', country: '', pinCode: '', location: '',
    phone: '', email: '', linkedin: '', portfolio: '', profilePhoto: '',
    objective: '', role: '',
    skills: [], education: [], experience: [], achievements: [],
    projects: [], certifications: [], languages: [], hobbies: [], summary: '',
  })

  const handleSelectTemplate = (id: TemplateKey) => {
    setSelectedTemplate(id)
    if (comeFromPreview) {
      setMainStage(2)
      setComeFromPreview(false)
    } else {
      setMainStage(1)
    }
  }

  const handleChangeTemplate = () => {
    setComeFromPreview(true)
    setSelectedTemplate(null)
  }

  if (!selectedTemplate) {
    return <TemplateGallery onSelectTemplate={handleSelectTemplate} isPending={isPending} />
  }

  const SelectedTemplateComponent = templateList[selectedTemplate]?.component

  const goNextSection = () => {
    const idx = SECTION_KEYS.indexOf(activeSection)
    if (idx < SECTION_KEYS.length - 1) {
      setActiveSection(SECTION_KEYS[idx + 1])
    } else {
      setMainStage(2)
    }
  }

  const goPrevSection = () => {
    const idx = SECTION_KEYS.indexOf(activeSection)
    if (idx > 0) {
      setActiveSection(SECTION_KEYS[idx - 1])
    } else {
      setSelectedTemplate(null)
    }
  }

  const renderSectionForm = () => {
    const props = { data: formData, setData: setFormData, goNext: goNextSection, goBack: goPrevSection }
    switch (activeSection) {
      case 'personal': return <Step1Header {...props} />
      case 'experience': return <Step2Experience {...props} />
      case 'achievements': return <Step3Achievements {...props} />
      case 'education': return <Step4Education {...props} />
      case 'skills': return <Step5Skills {...props} />
      case 'projects': return <Step7Additional {...props} mode="projects" />
      case 'certifications': return <Step7Additional {...props} mode="certifications" />
      case 'additional': return <Step7Additional {...props} mode="languages" />
      default: return null
    }
  }

  /* ── Preview / Download stage ── */
  if (mainStage === 2) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <TopProgressBar stage={2} templateLabel={templateList[selectedTemplate]?.label} />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>
          <Step8Preview
            data={formData}
            goBack={() => setMainStage(1)}
            onChangeTemplate={handleChangeTemplate}
            SelectedTemplateComponent={SelectedTemplateComponent}
          />
        </div>
      </div>
    )
  }

  /* ── Fill Your Details stage ── */
  const PROGRESS_SECTIONS = [
    { label: 'Personal Information', done: !!(formData.fullName.trim() && formData.email.trim()) },
    { label: 'Education',            done: formData.education.some(e => e.trim()) },
    { label: 'Skills',               done: formData.skills.some(s => s.trim()) },
    { label: 'Experience',           done: formData.experience.some(e => e.trim()) },
    { label: 'Projects',             done: formData.projects.some(p => p.trim()) },
  ]
  const completedCount = PROGRESS_SECTIONS.filter(s => s.done).length
  const progressPct    = Math.round((completedCount / PROGRESS_SECTIONS.length) * 100)
  const r = 28, circ = 2 * Math.PI * r

  const nextIncompleteSection = (): SectionKey => {
    const sectionMap: Record<string, SectionKey> = {
      'Personal Information': 'personal',
      'Education': 'education',
      'Skills': 'skills',
      'Experience': 'experience',
      'Projects': 'projects',
    }
    const incomplete = PROGRESS_SECTIONS.find(s => !s.done)
    return incomplete ? sectionMap[incomplete.label] : 'additional'
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <TopProgressBar stage={mainStage} templateLabel={templateList[selectedTemplate]?.label} />

      {/* subtitle */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '10px 32px', fontSize: 13, color: GRAY }}>
        Fill in your details step by step. You can save and continue anytime.
      </div>

      {/* 3-column body */}
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '200px 1fr 270px', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Left nav sidebar ── */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '8px 0', position: 'sticky', top: 20 }}>
          {SIDEBAR_SECTIONS.map((s) => {
            const isActive = activeSection === s.key
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: isActive ? '#fff7ed' : 'transparent',
                  border: 'none', borderLeft: isActive ? `3px solid ${ORANGE}` : '3px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  color: isActive ? ORANGE : '#374151',
                  fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.15s',
                }}
              >
                <span style={{ color: isActive ? ORANGE : GRAY, flexShrink: 0 }}>{s.icon}</span>
                {s.label}
              </button>
            )
          })}
        </div>

        {/* ── Center: form + info bar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '28px 28px' }}>
            {renderSectionForm()}
          </div>
          {/* info bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d4ed8' }}>
            <span style={{ fontSize: 15 }}>ℹ</span>
            You can update your information anytime. All changes will be saved automatically.
          </div>
        </div>

        {/* ── Right info sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* How It Works */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>How It Works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HOW_IT_WORKS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${ORANGE}12`, border: `1px solid ${ORANGE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 1 }}>{i + 1}. {s.title}</div>
                    <div style={{ fontSize: 10, color: GRAY, lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Resume Progress */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Your Resume Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
                <svg width="62" height="62">
                  <circle cx="31" cy="31" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="31" cy="31" r={r} fill="none" stroke={ORANGE} strokeWidth="6"
                    strokeDasharray={`${(progressPct / 100) * circ} ${circ}`}
                    strokeDashoffset={circ * 0.25} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{progressPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{completedCount} of {PROGRESS_SECTIONS.length} Sections Completed</div>
                {PROGRESS_SECTIONS.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ color: item.done ? '#10b981' : '#d1d5db', flexShrink: 0 }}>
                      {item.done ? <CheckCircle size={13} /> : <Circle size={13} />}
                    </span>
                    <span style={{ fontSize: 10, color: item.done ? '#0f172a' : GRAY, fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveSection(nextIncompleteSection())}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${BORDER}`, borderRadius: 9, background: '#fff', color: '#0f172a', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              Continue Building <ArrowRight size={13} />
            </button>
          </div>

          {/* Resume Tips */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Resume Tips</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {RESUME_TIPS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                    {RESUME_TIP_ICONS[i]}
                  </div>
                  <span style={{ fontSize: 10, color: GRAY, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, fontSize: 11, cursor: 'pointer', padding: '8px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All Tips <ArrowRight size={12} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder
