import { useState } from 'react'
import { Col, Modal, Row } from 'react-bootstrap'
import {
  FaBookOpen, FaChartBar, FaLanguage, FaRobot, FaClipboardList, FaFileAlt,
} from 'react-icons/fa'
import StudentReports from '@/components/dashboard/StudentReports'
import PageMetaData from '@/components/PageMetaData'
import Counter from './components/Counter'
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

/* ─── Tab definitions ────────────────────────────────────── */
const TABS = [
  { key: 'daily-engagement',  label: 'Daily Engagement',   icon: FaChartBar,      color: '#f59e0b' },
  { key: 'course-enrollment', label: 'Course Progress',  icon: FaBookOpen,      color: '#3b82f6' },
  { key: 'ai-interview',      label: 'AI Based Interview', icon: FaRobot,         color: '#a855f7' },
  { key: 'english-practice',  label: 'English Practice',   icon: FaLanguage,      color: '#22c55e' },
  { key: 'student-reports',   label: 'Student Reports',    icon: FaFileAlt,       color: '#ef4444' },
  { key: 'assessments',       label: 'Assessments',        icon: FaClipboardList, color: '#06b6d4' },
] as const

type TabKey   = (typeof TABS)[number]['key']
type ModalKey = 'daily-engagement' | 'course-enrollment' | 'english-practice' | 'ai-interview' | 'assessments' | null

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  page: {
    background: '#0d0d0d',
    minHeight: '100vh',
    color: '#fff',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,

  /* Tab bar */
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

  /* Content */
  content: {
    paddingTop: '1.75rem',
    minHeight: 380,
  } as React.CSSProperties,

  /* Info card (right side of widget rows) */
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
  infoTitle: {
    color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 2,
  } as React.CSSProperties,
  infoSub: {
    color: '#555', fontSize: '0.76rem', marginBottom: '1rem',
  } as React.CSSProperties,
  infoDesc: {
    color: '#888', fontSize: '0.81rem', lineHeight: 1.65, flex: 1,
    marginBottom: '1.25rem',
  } as React.CSSProperties,
  btn: {
    background: '#ff6b00', border: 'none', color: '#fff',
    fontWeight: 600, borderRadius: 8,
    padding: '9px 0', width: '100%', fontSize: '0.85rem', cursor: 'pointer',
  } as React.CSSProperties,

  /* Coming soon */
  comingSoon: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 360, gap: '1.1rem', textAlign: 'center' as const,
  } as React.CSSProperties,

  /* Modal */
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
  const [activeTab, setActiveTab] = useState<TabKey>('daily-engagement')
  const [openModal, setOpenModal] = useState<ModalKey>(null)

  return (
    <>
      <PageMetaData title="Institute Dashboard" />

      <div style={S.page}>
        <div className="container-lg">

          {/* Stats */}
          <Counter />

          {/* ── Tab bar ───────────────────────────────── */}
          <div style={S.tabStrip}>
            {TABS.map(({ key, label, icon: Icon, color }) => {
              const active = activeTab === key
              return (
                <button key={key} style={S.tabBtn(active, color)} onClick={() => setActiveTab(key)}>
                  {active
                    ? <div style={S.tabDot(color)} />
                    : <Icon size={13} color="#3a3a3a" />
                  }
                  {label}
                  {active && <div style={S.tabIndicator(color)} />}
                </button>
              )
            })}
          </div>

          {/* ── Tab content ───────────────────────────── */}
          <div style={S.content}>

            {/* Daily Engagement */}
            {activeTab === 'daily-engagement' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <DailyTimePerformers apiBase="/api/institute" />
                </Col>
                <Col md={12} lg={4}>
                  <div style={S.infoCard}>
                    <div style={S.iconBox}><FaChartBar size={20} color="#ff6b00" /></div>
                    <div style={S.infoTitle}>Daily Engagement</div>
                    <div style={S.infoSub}>Student activity tracking</div>
                    <p style={S.infoDesc}>
                      Track how many students are active today, who hasn't logged in, and view a 7-day activity trend with detailed records.
                    </p>
                    <button style={S.btn} onClick={() => setOpenModal('daily-engagement')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {/* Course Enrollment */}
            {activeTab === 'course-enrollment' && (
              <Row className="g-3">
                <Col md={12}>
                  <CourseEnrollmentTrend
                    apiBase="/api/institute"
                    onFullDetails={() => setOpenModal('course-enrollment')}
                  />
                </Col>
              </Row>
            )}

            {/* AI Based Interview */}
            {activeTab === 'ai-interview' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <AIInterviewWidget apiBase="/api/institute" />
                </Col>
                <Col md={12} lg={4}>
                  <div style={S.infoCard}>
                    <div style={S.iconBox}><FaRobot size={20} color="#ff6b00" /></div>
                    <div style={S.infoTitle}>AI Based Interview</div>
                    <div style={S.infoSub}>Topic Based · Resume Based</div>
                    <p style={S.infoDesc}>
                      Track student participation in AI-powered mock interviews. See how many students practiced topic-based and resume-based interviews this month, with attempt counts and scores.
                    </p>
                    <button style={S.btn} onClick={() => setOpenModal('ai-interview')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {/* English Practice */}
            {activeTab === 'english-practice' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <EnglishPracticeWidget apiBase="/api/institute" />
                </Col>
                <Col md={12} lg={4}>
                  <div style={S.infoCard}>
                    <div style={S.iconBox}><FaLanguage size={20} color="#ff6b00" /></div>
                    <div style={S.infoTitle}>English Practice</div>
                    <div style={S.infoSub}>Speaking · Writing · Reading · Listening · JAM</div>
                    <p style={S.infoDesc}>
                      Track student participation across all English skills — see who has practiced, their best scores, and which skills have the highest and lowest engagement.
                    </p>
                    <button style={S.btn} onClick={() => setOpenModal('english-practice')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {/* Student Reports */}
            {activeTab === 'student-reports' && (
              <StudentReports apiBase="/api/institute" />
            )}

            {/* Assessments */}
            {activeTab === 'assessments' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <AssessmentWidget apiBase="/api/institute" />
                </Col>
                <Col md={12} lg={4}>
                  <div style={S.infoCard}>
                    <div style={S.iconBox}><FaClipboardList size={20} color="#ff6b00" /></div>
                    <div style={S.infoTitle}>Assessments</div>
                    <div style={S.infoSub}>MCQ · Coding · TR · HR</div>
                    <p style={S.infoDesc}>
                      Track student performance across all assessment rounds. See top and low scorers for each exam, pass rates, and detailed per-student round-wise scores.
                    </p>
                    <button style={S.btn} onClick={() => setOpenModal('assessments')}>Full Details</button>
                  </div>
                </Col>
              </Row>
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
          <DailyEngagement apiBase="/api/institute" />
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
          <CourseEnrollmentFull apiBase="/api/institute" />
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
          <EnglishPracticeFull apiBase="/api/institute" />
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
          <AIInterviewFull apiBase="/api/institute" />
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
          <AssessmentFull apiBase="/api/institute" />
        </Modal.Body>
      </Modal>

    </>
  )
}

export default DashboardPage
