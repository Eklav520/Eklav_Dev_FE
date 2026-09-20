import React, { useState, useRef, useEffect } from 'react'
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
  FileText, PenLine, Eye, Download, CheckCircle, Circle, ArrowRight, Star, Check,
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
// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const BORDER = 'var(--dash-border, #e5e7eb)'
const GRAY = 'var(--dash-gray, #6b7280)'
const BG = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG = 'var(--dash-card-bg, #ffffff)'
const TEXT = 'var(--dash-text, #0f172a)'

type MainStage = 1 | 2
type SectionKey = 'personal' | 'education' | 'skills' | 'experience' | 'projects' | 'certifications' | 'achievements' | 'additional'

// A4-ish canvas size every template component is authored against (see e.g.
// ResumeClassic.tsx's own maxWidth: 794 / minHeight: 1122) — used to scale the whole
// resume down to fit the narrow sidebar while filling in details, so students can see
// it updating live instead of only at the final Preview & Download step.
const LIVE_PREVIEW_WIDTH = 794
const LIVE_PREVIEW_HEIGHT = 1122

const LivePreview: React.FC<{ Component?: React.FC<{ data: ResumeData }>; data: ResumeData }> = ({ Component, data }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.28)
  // Actual rendered height of the resume content (unscaled) — while a student is still
  // filling in details the page is usually far from full, and reserving the whole A4
  // height up front just leaves a big blank strip under the preview. Sizing the box to
  // the real content (capped at a full page once they fill it up) avoids that.
  const [contentHeight, setContentHeight] = useState(LIVE_PREVIEW_HEIGHT)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateScale = () => setScale(el.offsetWidth / LIVE_PREVIEW_WIDTH)
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const updateHeight = () => setContentHeight(el.scrollHeight)
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [Component])

  if (!Component) return null

  const visibleHeight = Math.max(300, Math.min(contentHeight, LIVE_PREVIEW_HEIGHT))

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: visibleHeight * scale, overflow: 'hidden', transition: 'height 0.15s ease',
        borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff',
      }}
    >
      <div ref={contentRef} className="live-preview-content" style={{ width: LIVE_PREVIEW_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <Component data={data} />
      </div>
      {/* Every template's root div sets an inline minHeight: 1122 (the real A4 page
          height, needed at final download time) — overridden here so scrollHeight
          above reflects actual filled-in content instead of always reading ~1122. */}
      <style>{`.live-preview-content > div { min-height: 0 !important; }`}</style>
    </div>
  )
}

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
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Full access (status === 'approved', same as institute-granted students)
  // OR a standalone "resumeBuilder" module purchase both unlock every
  // template — server-enforced in app.js's POST /generate, not just this flag.
  type ModulePlan = '6months' | '12months'
  const [moduleInfo, setModuleInfo] = useState<{ fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string } | null>(null)
  const [buyingPlan, setBuyingPlan] = useState<ModulePlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<ModulePlan>('12months')
  const [buyError, setBuyError] = useState<string | null>(null)

  const fetchModuleAccess = () => {
    if (!token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        const mod = data.modules?.resumeBuilder
        setModuleInfo({
          fullAccess: !!data.fullAccess,
          active: !!mod?.active,
          plans: { '6months': mod?.plans?.['6months'] ?? 19900, '12months': mod?.plans?.['12months'] ?? 34900 },
          label: mod?.label ?? 'Resume Builder',
        })
      })
      .catch(() => {})
  }
  React.useEffect(fetchModuleAccess, [token, baseURL])

  const hasAccess = moduleInfo ? (moduleInfo.fullAccess || moduleInfo.active) : user?.status?.toLowerCase() === 'approved'
  // Kept as isPending below — TemplateGallery just treats it as "should the
  // free-trial template lock apply", the literal account-status meaning no
  // longer matters.
  const isPending = !hasAccess

  const buyModule = (plan: ModulePlan) => {
    if (!token || buyingPlan) return
    setBuyingPlan(plan)
    setBuyError(null)
    fetch(`${baseURL}/api/student/module-access/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleKey: 'resumeBuilder', plan }),
    })
      .then((r) => r.json())
      .then((order) => {
        if (!order.success) throw new Error(order.message || 'Failed to start payment')
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'Eklav',
          description: order.moduleLabel,
          order_id: order.orderId,
          prefill: { name: user?.fullName || '', email: user?.email || '' },
          theme: { color: '#ff7a00' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${baseURL}/api/student/module-access/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...response, moduleKey: 'resumeBuilder', plan }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed')
              fetchModuleAccess()
            } catch (e: any) {
              setBuyError(e.message || 'Payment verification failed. Contact support.')
            } finally {
              setBuyingPlan(null)
            }
          },
          modal: { ondismiss: () => setBuyingPlan(null) },
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.on('payment.failed', (response: any) => {
          setBuyError(`Payment failed: ${response.error?.description || 'Unknown error'}`)
          setBuyingPlan(null)
        })
        razorpay.open()
      })
      .catch((e) => { setBuyError(e.message || 'Failed to start payment'); setBuyingPlan(null) })
  }

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
    return (
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        isPending={isPending}
        hasAccess={hasAccess}
        moduleInfo={moduleInfo}
        buyingPlan={buyingPlan}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        buyModule={buyModule}
        buyError={buyError}
      />
    )
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
      case 'personal': return <Step1Header {...props} hasPhoto={!!selectedTemplate && templateList[selectedTemplate].hasPhoto} />
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
      <div style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '10px 32px', fontSize: 13, color: GRAY }}>
        Fill in your details step by step. You can save and continue anytime.
      </div>

      {/* ── Section stepper (horizontal) ── */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '16px 24px 0' }}>
        <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {SIDEBAR_SECTIONS.map((s, i) => {
            const isActive = activeSection === s.key
            const isDone = SECTION_KEYS.indexOf(activeSection) > i
            return (
              <React.Fragment key={s.key}>
                {i > 0 && (
                  <div style={{ flex: 1, minWidth: 16, height: 1, background: isDone ? ORANGE : BORDER, margin: '0 6px' }} />
                )}
                <button
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                    color: isActive ? ORANGE : isDone ? TEXT : GRAY,
                    fontSize: 12.5, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: isActive ? ORANGE : isDone ? '#fff7ed' : '#f1f5f9',
                      border: isActive ? 'none' : `1px solid ${isDone ? ORANGE : BORDER}`,
                      color: isActive ? '#fff' : isDone ? ORANGE : GRAY,
                    }}
                  >
                    {isDone ? <Check size={12} /> : s.icon}
                  </span>
                  {s.label}
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* 2-column body */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '16px 24px 20px', display: 'grid', gridTemplateColumns: '1fr 540px', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Center: form + info bar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '28px 28px' }}>
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

          {/* Live Preview — updates as the student types, so they can see the actual
              resume taking shape instead of only checking it at the final review step. */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 14px 16px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={14} color={ORANGE} /> Live Preview
            </h3>
            <LivePreview Component={SelectedTemplateComponent} data={formData} />
          </div>

        </div>
      </div>

      {/* Your Resume Progress + How It Works + Resume Tips — moved below the main form.
          They're reference/status info, not needed front-and-center while actively
          filling in details; the sidebar space they used to take is now the Live Preview. */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>Your Resume Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
              <svg width="62" height="62">
                <circle cx="31" cy="31" r={r} fill="none" stroke={BORDER} strokeWidth="6" />
                <circle cx="31" cy="31" r={r} fill="none" stroke={ORANGE} strokeWidth="6"
                  strokeDasharray={`${(progressPct / 100) * circ} ${circ}`}
                  strokeDashoffset={circ * 0.25} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: TEXT }}>{progressPct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{completedCount} of {PROGRESS_SECTIONS.length} Sections Completed</div>
              {PROGRESS_SECTIONS.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <span style={{ color: item.done ? '#10b981' : BORDER, flexShrink: 0 }}>
                    {item.done ? <CheckCircle size={13} /> : <Circle size={13} />}
                  </span>
                  <span style={{ fontSize: 10, color: item.done ? TEXT : GRAY, fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveSection(nextIncompleteSection())}
            style={{ width: '100%', padding: '8px', border: `1.5px solid ${BORDER}`, borderRadius: 9, background: CARD_BG, color: TEXT, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            Continue Building <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>How It Works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${ORANGE}12`, border: `1px solid ${ORANGE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 1 }}>{i + 1}. {s.title}</div>
                  <div style={{ fontSize: 10, color: GRAY, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>Resume Tips</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {RESUME_TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                  {RESUME_TIP_ICONS[i]}
                </div>
                <span style={{ fontSize: 10, color: GRAY, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder
