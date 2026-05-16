import { useState } from 'react'
import { Card, Col, Modal, Row } from 'react-bootstrap'
import { FaBookOpen, FaChartBar } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import DailyEngagement from '@/components/dashboard/DailyEngagement'
import DailyTimePerformers from '@/components/dashboard/DailyTimePerformers'
import CourseEnrollmentTrend from '@/components/dashboard/CourseEnrollmentTrend'
import CourseEnrollmentFull from '@/components/dashboard/CourseEnrollmentFull'
import Counter from './components/Counter'

const S = {
  page: {
    background: '#0d0d0d',
    minHeight: '100vh',
    color: '#fff',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,
  sectionTitle: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.1rem',
    letterSpacing: '0.03em',
    marginBottom: '1rem',
  } as React.CSSProperties,
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
    height: '100%',
  } as React.CSSProperties,
  iconBox: {
    background: 'rgba(255, 107, 0, 0.15)',
    borderRadius: '10px',
    padding: '12px',
    display: 'inline-flex',
  } as React.CSSProperties,
  moduleTitle: {
    color: '#fff',
    fontWeight: 600,
    fontSize: '1rem',
    marginBottom: '2px',
  } as React.CSSProperties,
  moduleSubtitle: {
    color: '#888',
    fontSize: '0.78rem',
  } as React.CSSProperties,
  moduleDesc: {
    color: '#aaa',
    fontSize: '0.82rem',
    lineHeight: 1.6,
    marginBottom: '1.25rem',
  } as React.CSSProperties,
  btn: {
    background: '#ff6b00',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '8px 0',
    width: '100%',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  divider: {
    borderColor: '#2a2a2a',
    margin: '2rem 0 1.5rem',
  } as React.CSSProperties,
  comingSoonCard: {
    background: '#141414',
    border: '1px dashed #2a2a2a',
    borderRadius: '14px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    textAlign: 'center' as const,
    padding: '2rem',
    minHeight: '180px',
  } as React.CSSProperties,
  modalHeader: {
    background: '#111',
    borderBottom: '1px solid #2a2a2a',
    color: '#fff',
    padding: '1.25rem 1.75rem',
  } as React.CSSProperties,
  modalBody: {
    background: '#0d0d0d',
    padding: '1.75rem',
  } as React.CSSProperties,
}

type ModalKey = 'daily-engagement' | 'course-enrollment' | null

const DashboardPage = () => {
  const [openModal, setOpenModal] = useState<ModalKey>(null)

  return (
    <>
      <PageMetaData title="Admin Dashboard" />

      <div style={S.page}>
        <div className="container-lg">

          {/* Overview Stats */}
          <Counter />

          {/* Divider */}
          <hr style={S.divider} />

          {/* ── Daily Engagement Section ──────────────── */}
          <p style={S.sectionTitle}>Daily Engagement</p>

          <Row className="g-3">

            {/* Daily Time Spent — live widget */}
            <Col md={12} lg={8}>
              <DailyTimePerformers apiBase="/api/adminDashboardCharts" />
            </Col>

            {/* Daily Engagement — module card */}
            <Col md={12} lg={4}>
              <Card style={S.card}>
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div style={S.iconBox}>
                      <FaChartBar size={22} color="#ff6b00" />
                    </div>
                    <div>
                      <div style={S.moduleTitle}>Daily Engagement</div>
                      <div style={S.moduleSubtitle}>Student activity tracking</div>
                    </div>
                  </div>
                  <p style={{ ...S.moduleDesc, flex: 1 }}>
                    Track how many students are active today, who hasn't logged in, and view a 7-day activity trend with detailed records.
                  </p>
                  <button style={S.btn} onClick={() => setOpenModal('daily-engagement')}>
                    Full Details
                  </button>
                </Card.Body>
              </Card>
            </Col>

          </Row>

          {/* ── Course Enrollment Section ─────────────── */}
          <hr style={S.divider} />
          <p style={S.sectionTitle}>Course Enrollment</p>

          <Row className="g-3">
            <Col md={12}>
              <CourseEnrollmentTrend
                apiBase="/api/adminDashboardCharts"
                onFullDetails={() => setOpenModal('course-enrollment')}
              />
            </Col>
          </Row>

        </div>
      </div>

      {/* Daily Engagement — Full Screen Modal */}
      <Modal
        show={openModal === 'daily-engagement'}
        onHide={() => setOpenModal(null)}
        fullscreen
      >
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaChartBar size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
              Daily Engagement
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <DailyEngagement apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

      {/* Course Enrollment — Full Screen Modal */}
      <Modal
        show={openModal === 'course-enrollment'}
        onHide={() => setOpenModal(null)}
        fullscreen
      >
        <Modal.Header closeButton style={S.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaBookOpen size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
              Course Enrollment
            </Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={S.modalBody}>
          <CourseEnrollmentFull apiBase="/api/adminDashboardCharts" />
        </Modal.Body>
      </Modal>

    </>
  )
}

export default DashboardPage
