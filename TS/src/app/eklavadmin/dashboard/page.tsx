import { useState } from 'react'
import { Col, Modal, Row } from 'react-bootstrap'
import {
  FaBookOpen, FaChartBar, FaLanguage, FaRobot, FaClipboardList, FaFileAlt, FaCode, FaImage, FaHeadphones
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import StudentReports from '@/components/dashboard/StudentReports'
import ModuleReport from '@/components/dashboard/moduleOverview/ModuleReport'
import EklavAssistant from '@/components/dashboard/EklavAssistant'
import SiteBannerUpload from '@/components/dashboard/SiteBannerUpload'
import PageMetaData from '@/components/PageMetaData'
import DailyEngagement from '@/components/dashboard/DailyEngagement'
import DailyTimePerformers from '@/components/dashboard/DailyTimePerformers'
import CourseEnrollmentTrend from '@/components/dashboard/CourseEnrollmentTrend'
import CourseEnrollmentFull from '@/components/dashboard/CourseEnrollmentFull'
import EnglishPracticeWidget from '@/components/dashboard/EnglishPracticeWidget'
import EnglishPracticeFull from '@/components/dashboard/EnglishPracticeFull'
import AIInterviewWidget from '@/components/dashboard/AIInterviewWidget'
import AIInterviewFull from '@/components/dashboard/AIInterviewFull'
import AssessmentWidget from '@/components/dashboard/AssessmentWidget'
import AssessmentFull from '@/components/dashboard/AssessmentFull'
import CodeChallengeWidget from '@/components/dashboard/CodeChallengeWidget'
import CodeChallengeFull from '@/components/dashboard/CodeChallengeFull'

/* ─── Tab definitions ────────────────────────────────────── */
const TABS = [
  { key: 'student-reports',   label: 'Student Reports',    icon: FaFileAlt,       color: '#ef4444' },
  { key: 'daily-engagement',  label: 'Daily Engagement',   icon: FaChartBar,      color: '#f59e0b' },
  { key: 'course-enrollment', label: 'Course Progress',    icon: FaBookOpen,      color: '#3b82f6' },
  { key: 'ai-interview',      label: 'AI Based Interview', icon: FaRobot,         color: '#a855f7' },
  { key: 'english-practice',  label: 'English Practice',   icon: FaLanguage,      color: '#22c55e' },
  { key: 'lsrw-practice',     label: 'LSRW Practice',      icon: FaHeadphones,    color: '#14b8a6' },
  { key: 'assessments',       label: 'Assessments',        icon: FaClipboardList, color: '#06b6d4' },
  { key: 'code-challenge',    label: 'Code Challenge',     icon: FaCode,          color: '#6366f1' },
  // Landing-page banner & events — Eklav admins only (tutors share this page)
  { key: 'banner',            label: 'Banner',             icon: FaImage,         color: '#ff7a00' },
] as const

type TabKey   = (typeof TABS)[number]['key']
type ModalKey = 'daily-engagement' | 'course-enrollment' | 'english-practice' | 'ai-interview' | 'assessments' | 'code-challenge' | null

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  // Same as the institute dashboard: the layout's content card is the only frame,
  // so sections use its full width instead of a padded, centred container
  page: {
    background: 'transparent',
    minHeight: '100vh',
    color: '#fff',
    margin: '-0.5rem -0.75rem 0',
    padding: '0 0 2rem',
  } as React.CSSProperties,

  tabStrip: {
    display: 'flex',
    marginTop: '1.75rem',
    borderBottom: '1px solid #1e1e1e',
    overflowX: 'auto' as const,
    gap: 0,
    scrollbarWidth: 'none' as const,
  } as React.CSSProperties,
  tabBtn: (active: boolean, _color?: string): React.CSSProperties => ({
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '0.7rem 0.5rem 0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    flex: 1,
    fontSize: '0.83rem',
    fontWeight: active ? 700 : 500,
    color: active ? '#fff' : '#555',
    transition: 'color 0.18s',
  }),
  tabIndicator: (color: string): React.CSSProperties => ({
    position: 'absolute',
    bottom: 0,
    left: '10%',
    width: '80%',
    height: 2.5,
    borderRadius: 2,
    background: color,
  }),
  tabDot: (color: string): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),

  content: {
    paddingTop: '1.75rem',
    minHeight: 380,
  } as React.CSSProperties,

  infoCard: {
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 14,
    padding: '1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  iconBox: {
    width: 46, height: 46, borderRadius: 12,
    background: 'rgba(255,107,0,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem', flexShrink: 0,
  } as React.CSSProperties,
  infoTitle:  { color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 2 } as React.CSSProperties,
  infoSub:    { color: '#555', fontSize: '0.76rem', marginBottom: '1rem' } as React.CSSProperties,
  infoDesc:   { color: '#888', fontSize: '0.81rem', lineHeight: 1.65, flex: 1, marginBottom: '1.25rem' } as React.CSSProperties,
  btn: {
    background: '#ff6b00', border: 'none', color: '#fff',
    fontWeight: 600, borderRadius: 8,
    padding: '9px 0', width: '100%', fontSize: '0.85rem', cursor: 'pointer',
  } as React.CSSProperties,

  comingSoon: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 360, gap: '1.1rem', textAlign: 'center' as const,
  } as React.CSSProperties,

  modalHeader: {
    background: '#111', borderBottom: '1px solid #2a2a2a',
    color: '#fff', padding: '1.25rem 1.75rem',
  } as React.CSSProperties,
  modalBody: {
    background: '#0d0d0d', padding: '1.75rem',
  } as React.CSSProperties,
}


/* ─── Page ───────────────────────────────────────────────── */
const DashboardPage = () => {
  const { user } = useAuthContext()
  const isAdmin = user?.role === 'admin'
  const visibleTabs = TABS.filter(tab => tab.key !== 'banner' || isAdmin)
  const [activeTab, setActiveTab] = useState<TabKey>('student-reports')
  const [openModal, setOpenModal] = useState<ModalKey>(null)

  return (
    <>
      <PageMetaData title="Admin Dashboard" />

      <div style={S.page}>
        <div className="container-fluid px-0">

          {/* ── Tab bar ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {visibleTabs.map(({ key, label, icon: Icon, color }) => {
              const active = activeTab === key
              return (
                <button key={key} onClick={() => setActiveTab(key)} style={{ position: 'relative', flex: '1 0 auto', justifyContent: 'center', background: 'none', border: 'none', padding: '0.65rem 1rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#555', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
                  <Icon size={13} color={active ? color : '#3a3a3a'} />
                  {label}
                  {active && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: color, borderRadius: 2 }} />}
                </button>
              )
            })}
          </div>

          {/* ── Tab content ───────────────────────────── */}
          <div style={S.content}>

            {/* Daily Engagement */}
            {activeTab === 'daily-engagement' && (
              <ModuleReport apiBase="/api/adminDashboardCharts">
                <DailyEngagement apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

            {/* Course Enrollment */}
            {activeTab === 'course-enrollment' && (
              <ModuleReport apiBase="/api/adminDashboardCharts">
                <CourseEnrollmentFull apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

            {/* AI Based Interview */}
            {activeTab === 'ai-interview' && (
              <ModuleReport apiBase="/api/adminDashboardCharts">
                <AIInterviewFull apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

            {/* English Practice */}
            {activeTab === 'english-practice' && (
              <ModuleReport apiBase="/api/adminDashboardCharts">
                <EnglishPracticeFull apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

            {/* LSRW Practice — structured LSRW tests, its own tab */}
            {activeTab === 'lsrw-practice' && (
              <ModuleReport apiBase="/api/adminDashboardCharts">
                <EnglishPracticeFull apiBase="/api/adminDashboardCharts" view="lsrw" />
              </ModuleReport>
            )}

            {/* Banner — landing page hero banner & events (admin only) */}
            {activeTab === 'banner' && isAdmin && (
              <SiteBannerUpload />
            )}

            {/* Student Reports */}
            {activeTab === 'student-reports' && (
              <StudentReports apiBase="/api/admin/students" />
            )}

            {/* Assessments */}
            {activeTab === 'assessments' && (
              <ModuleReport apiBase="/api/adminDashboardCharts" icon={FaClipboardList} title="Assessments" subtitle="Exam results by round: who passed, who needs help and every student’s score">
                <AssessmentFull apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

            {/* Code Challenge */}
            {activeTab === 'code-challenge' && (
              <ModuleReport apiBase="/api/adminDashboardCharts" icon={FaCode} title="Code Challenge" subtitle="Coding problems solved by difficulty, daily trend and student-wise progress">
                <CodeChallengeFull apiBase="/api/adminDashboardCharts" />
              </ModuleReport>
            )}

          </div>
        </div>
      </div>

      {/* Daily Engagement — Full Screen Modal */}
      <Modal show={openModal === 'daily-engagement'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaChartBar size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Daily Engagement</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <DailyEngagement apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* Course Enrollment — Full Screen Modal */}
      <Modal show={openModal === 'course-enrollment'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaBookOpen size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Course Enrollment</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <CourseEnrollmentFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* English Practice — Full Screen Modal */}
      <Modal show={openModal === 'english-practice'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaLanguage size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>English Practice</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <EnglishPracticeFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* AI Interview — Full Screen Modal */}
      <Modal show={openModal === 'ai-interview'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaRobot size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>AI Based Interview</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <AIInterviewFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* Assessments — Full Screen Modal */}
      <Modal show={openModal === 'assessments'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaClipboardList size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Assessments</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <AssessmentFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* Code Challenge — Full Screen Modal */}
      <Modal show={openModal === 'code-challenge'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaCode size={18} color="#6366f1" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Code Challenge</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <CodeChallengeFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* Eklav AI — ask questions about student performance */}
      {isAdmin && <EklavAssistant apiBase="/api/admin/assistant" />}
    </>
  )
}

export default DashboardPage
