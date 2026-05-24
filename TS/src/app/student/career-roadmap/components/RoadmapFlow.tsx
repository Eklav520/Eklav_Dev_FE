import React, { useEffect, useMemo, useState } from 'react'
import { Button, Modal, ProgressBar, Spinner, Tab, Tabs, Toast, ToastContainer } from 'react-bootstrap'
import {
  FaArrowRight,
  FaCheck,
  FaChartBar,
  FaHammer,
  FaInfoCircle,
  FaLanguage,
  FaLock,
  FaPlay,
  FaRegClock,
  FaStar,
  FaTable,
} from 'react-icons/fa'
import { BsArrowLeft } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { type CareerRoadmap, type RoadmapStep } from '../data/roadmaps'

/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
interface FullCourse {
  _id: string
  title: string
  shortDescription?: string
  description?: string
  image?: string
  category?: string[] | string
  level?: string[] | string
  language?: string[] | string
  duration?: string
  totalLectures?: string
  features?: string | string[]
  previewVideo?: string
  price?: string
  discountPrice?: string
  courseType?: 'free' | 'paid'
  courseStatus?: 'active' | 'coming-soon'
  averageRating?: number
  totalRatings?: number
  videos?: { _id?: string; video?: string; url?: string; description?: string; progress?: number }[]
}

interface StepWithCourse extends RoadmapStep {
  matchedCourse: FullCourse | null
  status: 'enrolled' | 'available' | 'coming_soon'
}

interface FlatStep extends StepWithCourse {
  sectionId: string
  sectionTitle: string
  isFirstInSection: boolean
}

/* ─────────────────────────────────────────────────
   Course matching
───────────────────────────────────────────────── */
function matchCourse(courses: FullCourse[], step: RoadmapStep): FullCourse | null {
  const kws = [step.name.toLowerCase(), ...step.searchKeywords.map((k) => k.toLowerCase())]
  for (const c of courses) {
    const title = c.title.toLowerCase()
    const cats = Array.isArray(c.category)
      ? c.category.map((x: string) => x.toLowerCase())
      : typeof c.category === 'string'
        ? [c.category.toLowerCase()]
        : []
    for (const kw of kws) {
      if (title.includes(kw) || kw.includes(title)) return c
      if (cats.some((cat) => cat.includes(kw) || kw.includes(cat))) return c
      const kwWords = kw.split(/\s+/).filter((w) => w.length > 3)
      if (kwWords.some((w) => title.split(/\s+/).includes(w))) return c
    }
  }
  return null
}

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
const clean = (v?: string | string[]): string => {
  if (!v) return ''
  if (Array.isArray(v)) return v.join(', ')
  return v.replace(/^"+|"+$/g, '')
}

const imgSrc = (image?: string, title?: string) =>
  image && (image.includes('s3.') || image.startsWith('http'))
    ? image
    : image
      ? `https://eklav-videos.s3.eu-north-1.amazonaws.com/images/${image}`
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`

/* ─────────────────────────────────────────────────
   Course Quick-View Modal
───────────────────────────────────────────────── */
const CourseModal = ({
  course,
  enrolledIds,
  onEnroll,
  onClose,
  accentColor,
}: {
  course: FullCourse
  enrolledIds: Set<string>
  onEnroll: (id: string) => Promise<void>
  onClose: () => void
  accentColor: string
}) => {
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(enrolledIds.has(course._id))
  const [toast, setToast] = useState(false)
  const [imgOk, setImgOk] = useState(true)
  const src = imgSrc(course.image, course.title)
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title)}`
  const videos = course.videos ?? []

  const rawPrice = Number(course.price)
  const rawDiscount = Number(course.discountPrice)
  const hasDiscount = !isNaN(rawDiscount) && rawDiscount > 0 && !isNaN(rawPrice)
  const effectivePrice = hasDiscount ? Math.max(rawPrice - rawDiscount, 0) : rawPrice
  const fmt = (n: number) => n.toLocaleString('en-IN')

  const handleEnroll = async () => {
    setEnrolling(true)
    await onEnroll(course._id)
    setEnrolled(true)
    setEnrolling(false)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const categories: string[] = Array.isArray(course.category)
    ? course.category
    : typeof course.category === 'string'
      ? [course.category.replace(/"/g, '')]
      : []

  const features: string[] = Array.isArray(course.features)
    ? course.features
    : typeof course.features === 'string'
      ? course.features.split(',').map((f) => f.trim())
      : []

  return (
    <Modal show onHide={onClose} size="xl" fullscreen scrollable className="rm-course-modal">
      <button className="rm-modal-close" onClick={onClose}>×</button>
      <Modal.Body className="p-0">
        <ToastContainer position="top-end" className="p-3" style={{ position: 'fixed', zIndex: 99999 }}>
          <Toast bg="success" show={toast} onClose={() => setToast(false)} delay={3000} autohide>
            <Toast.Body className="text-white d-flex align-items-center gap-2">
              <FaCheck /> Enrolled successfully!
            </Toast.Body>
          </Toast>
        </ToastContainer>

        {/* Hero */}
        <div className="rm-hero" style={!imgOk ? { background: 'linear-gradient(135deg, #0f1115, #1a1f2e)' } : {}}>
          {imgOk && (
            <img src={src} onError={() => setImgOk(false)} className="rm-hero-img" alt={course.title} />
          )}
          <div className="rm-hero-overlay" />
          <div className="rm-hero-inner">
            {categories.length > 0 && (
              <div className="d-flex gap-2 flex-wrap mb-2">
                {categories.slice(0, 3).map((c, i) => (
                  <span key={i} className="rm-chip">{clean(c)}</span>
                ))}
              </div>
            )}
            <div className="rm-glass">
              <h2 className="rm-hero-title">{course.title}</h2>
              <p className="rm-hero-sub">{course.shortDescription || ''}</p>
              <div className="d-flex flex-wrap gap-3 small fw-semibold align-items-center" style={{ color: 'rgba(255,255,255,.75)' }}>
                {course.duration && <span><FaRegClock className="me-1" />{course.duration}</span>}
                <span><FaTable className="me-1" />{course.totalLectures || videos.length || 0} lectures</span>
                {course.averageRating && course.averageRating > 0 && (
                  <span><FaStar className="me-1 text-warning" />{course.averageRating.toFixed(1)} ({course.totalRatings})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rm-tabs-wrap">
          <div className="rm-content">
            <Tabs defaultActiveKey="overview" className="rm-tabs">
              {/* Overview */}
              <Tab eventKey="overview" title={<span className="d-flex align-items-center gap-2"><FaInfoCircle size={13} /> Overview</span>}>
                <div className="rm-section">
                  <div className="row g-4">
                    {/* Sidebar */}
                    <div className="col-lg-3">
                      <div className="rm-card p-3">
                        <h6 className="mb-3">Course Info</h6>
                        <div className="d-grid gap-2 small">
                          {[
                            { icon: <FaRegClock className="text-primary" />, label: 'Duration', value: course.duration || 'N/A' },
                            { icon: <FaTable className="text-success" />, label: 'Lectures', value: course.totalLectures || videos.length || 0 },
                            { icon: <FaChartBar className="text-info" />, label: 'Level', value: clean(course.level) || 'All Levels' },
                            { icon: <FaLanguage className="text-warning" />, label: 'Language', value: clean(course.language) || 'English' },
                          ].map(({ icon, label, value }) => (
                            <div key={label} className="d-flex align-items-center justify-content-between">
                              <span className="text-secondary d-flex align-items-center gap-2">{icon} {label}</span>
                              <span className="fw-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                        {course.price && (
                          <div className="mt-3 pt-3 border-top">
                            {hasDiscount ? (
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-success fs-5">₹{fmt(effectivePrice)}</span>
                                <span className="text-muted text-decoration-line-through small">₹{fmt(rawPrice)}</span>
                              </div>
                            ) : (
                              <span className="fw-bold text-success">₹{fmt(rawPrice)}</span>
                            )}
                          </div>
                        )}
                        <Button
                          className="w-100 mt-3"
                          style={{ backgroundColor: enrolled ? '#22c55e' : accentColor, borderColor: enrolled ? '#22c55e' : accentColor }}
                          disabled={enrolled || enrolling}
                          onClick={handleEnroll}
                        >
                          {enrolling ? <><Spinner size="sm" className="me-2" />Enrolling...</> : enrolled ? <><FaCheck className="me-1" />Enrolled</> : 'Enroll Now'}
                        </Button>
                      </div>

                      {features.length > 0 && (
                        <div className="rm-card p-3 mt-3">
                          <h6 className="mb-3">✨ Key Features</h6>
                          <ul className="list-unstyled mb-0">
                            {features.map((f, i) => (
                              <li key={i} className="d-flex align-items-start gap-2 mb-2">
                                <FaCheck style={{ color: accentColor, marginTop: 3, flexShrink: 0 }} />
                                <span className="small" style={{ color: '#d1d5db' }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="col-lg-9">
                      <div className="rm-card p-4">
                        <h5 className="mb-3">About this course</h5>
                        {course.description ? (
                          <div className="rm-desc" dangerouslySetInnerHTML={{ __html: course.description.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() }} />
                        ) : (
                          <p style={{ color: '#94a3b8' }}>{course.shortDescription || 'No description available.'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              {/* Curriculum */}
              <Tab eventKey="curriculum" title={<span className="d-flex align-items-center gap-2"><FaPlay size={13} /> Curriculum ({videos.length})</span>}>
                <div className="rm-section">
                  {videos.length > 0 ? (
                    <div className="rm-card overflow-hidden p-0">
                      {enrolled && videos.some((v) => typeof v.progress === 'number') && (
                        <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
                          <div className="d-flex justify-content-between mb-1 small" style={{ color: '#94a3b8' }}>
                            <span>Overall Progress</span>
                            <span>
                              {Math.round(videos.filter((v) => (v.progress ?? 0) >= 100).length / videos.length * 100)}%
                            </span>
                          </div>
                          <ProgressBar
                            now={videos.filter((v) => (v.progress ?? 0) >= 100).length / videos.length * 100}
                            style={{ height: 6, backgroundColor: '#1e2535' }}
                          >
                            <div
                              className="progress-bar"
                              style={{ width: `${videos.filter((v) => (v.progress ?? 0) >= 100).length / videos.length * 100}%`, backgroundColor: accentColor }}
                            />
                          </ProgressBar>
                        </div>
                      )}
                      <div className="list-group list-group-flush">
                        {videos.map((video, idx) => {
                          const prog = video.progress ?? 0
                          const done = prog >= 100
                          return (
                            <div key={video._id ?? idx} className="rm-video-row">
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className="rm-video-num"
                                  style={{ borderColor: done ? accentColor : '#2d3348', color: done ? accentColor : '#64748b' }}
                                >
                                  {done ? <FaCheck size={10} style={{ color: accentColor }} /> : idx + 1}
                                </div>
                                <div>
                                  <p className="mb-0 fw-semibold small" style={{ color: '#e2e8f0' }}>
                                    Module {idx + 1}
                                  </p>
                                  <p className="mb-0" style={{ fontSize: 12, color: '#64748b' }}>
                                    {video.description || 'Video module'}
                                  </p>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                {typeof video.progress === 'number' && (
                                  <div style={{ minWidth: 140 }}>
                                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: 11, color: '#64748b' }}>
                                      <span>Progress</span>
                                      <span>{prog}%</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, backgroundColor: '#1e2535', overflow: 'hidden' }}>
                                      <div style={{ width: `${prog}%`, height: '100%', backgroundColor: done ? accentColor : '#f59e0b', borderRadius: 2 }} />
                                    </div>
                                  </div>
                                )}
                                {!enrolled && (
                                  <span className="rm-locked"><FaLock size={10} /> Locked</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5" style={{ color: '#475569' }}>
                      <FaPlay size={40} className="mb-3" />
                      <p>No curriculum modules available yet.</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────
   Step Node
───────────────────────────────────────────────── */
const StepNode = ({
  step,
  color,
  isRTL = false,
}: {
  step: StepWithCourse
  color: string
  isRTL?: boolean
}) => {
  const isProject = step.stepType === 'project'
  const hasCourse = !!step.matchedCourse
  const isEnrolled = step.status === 'enrolled'

  const dotColor = isEnrolled ? color : hasCourse ? color + '88' : '#2d3348'
  const borderColor = isEnrolled ? color : hasCourse ? color + '66' : '#242b3d'
  const borderStyle = isProject ? 'dashed' : 'solid'
  const arrowColor = hasCourse ? color : '#3d4459'

  return (
    <div className="rm-step-col" style={{ cursor: 'default' }}>
      {/* Node box */}
      <div
        className="rm-node"
        style={{
          border: `1.5px ${borderStyle} ${borderColor}`,
          boxShadow: isEnrolled ? `0 0 16px ${color}30, inset 0 0 20px ${color}08` : 'none',
        }}
      >
        <div className="d-flex align-items-center justify-content-center gap-2">
          {isRTL && (
            <span style={{ color: arrowColor, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>‹</span>
          )}
          <span className="rm-node-title" style={{ textAlign: 'center' }}>
            {isProject && <FaHammer style={{ color: '#f59e0b', marginRight: 6, fontSize: 11, flexShrink: 0 }} />}
            {step.name}
          </span>
          {!isRTL && (
            <span style={{ color: arrowColor, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
          )}
        </div>

        {isProject && (
          <span className="rm-project-badge" style={{ borderColor: '#f59e0b44', color: '#f59e0b' }}>
            🔨 Project
          </span>
        )}
      </div>

      {/* Status dot */}
      <div
        className="rm-dot"
        style={{ backgroundColor: dotColor, boxShadow: isEnrolled ? `0 0 8px ${color}` : 'none' }}
      />

      {/* Subtopics */}
      <div className="rm-pills">
        {step.subtopics.slice(0, 4).map((sub, i) => (
          <span key={i} className="rm-pill">
            {sub.length > 18 ? sub.slice(0, 16) + '…' : sub}
          </span>
        ))}
      </div>

      {/* Enrolled badge */}
      {isEnrolled && (
        <div className="rm-enrolled-badge" style={{ backgroundColor: color + '22', borderColor: color + '44', color }}>
          <FaCheck size={9} className="me-1" /> Enrolled
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
const N_PER_ROW = 4

interface RoadmapFlowProps {
  roadmap: CareerRoadmap
}

const RoadmapFlow = ({ roadmap }: RoadmapFlowProps) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const navigate = useNavigate()

  const [courses, setCourses] = useState<FullCourse[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<{ id: string; title: string; steps: StepWithCourse[] }[]>([])

  useEffect(() => {
    if (!token) { setLoading(false); return }

    Promise.all([
      fetch(`${baseURL}/courses`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${baseURL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => []),
    ])
      .then(([coursesData, enrollData]) => {
        const cs: FullCourse[] = Array.isArray(coursesData) ? coursesData : []
        setCourses(cs)
        const ids = new Set<string>(
          (Array.isArray(enrollData) ? enrollData : [])
            .filter((e: any) => e?.courseId)
            .map((e: any) => e.courseId._id as string)
        )
        setEnrolledIds(ids)
      })
      .catch(() => { setCourses([]); setEnrolledIds(new Set()) })
      .finally(() => setLoading(false))
  }, [baseURL, token])

  useEffect(() => {
    if (loading) return
    const mapped = roadmap.sections.map((sec) => ({
      ...sec,
      steps: sec.steps.map((step) => {
        const matched = matchCourse(courses, step)
        const status: 'enrolled' | 'available' | 'coming_soon' = !matched
          ? 'coming_soon'
          : enrolledIds.has(matched._id)
            ? 'enrolled'
            : 'available'
        return { ...step, matchedCourse: matched, status }
      }),
    }))
    setSections(mapped)
  }, [courses, enrolledIds, roadmap, loading])

  /* Flatten all steps into rows of N_PER_ROW */
  const flatSteps = useMemo<FlatStep[]>(() => {
    const result: FlatStep[] = []
    sections.forEach((sec) => {
      sec.steps.forEach((step, idx) => {
        result.push({ ...step, sectionId: sec.id, sectionTitle: sec.title, isFirstInSection: idx === 0 })
      })
    })
    return result
  }, [sections])

  const rows = useMemo<FlatStep[][]>(() => {
    const result: FlatStep[][] = []
    for (let i = 0; i < flatSteps.length; i += N_PER_ROW) {
      result.push(flatSteps.slice(i, i + N_PER_ROW))
    }
    return result
  }, [flatSteps])

  const allSteps = flatSteps
  const enrolledCount = allSteps.filter((s) => s.status === 'enrolled').length
  const availableCount = allSteps.filter((s) => s.matchedCourse).length
  const totalCount = allSteps.length
  const progressPct = totalCount > 0 ? Math.round((enrolledCount / totalCount) * 100) : 0

  const color = roadmap.color

  const getConnColor = (from: FlatStep, to: FlatStep): string => {
    if (from.status === 'enrolled' && to.status === 'enrolled') return color
    if (from.status === 'enrolled') return color + '88'
    if (to.status === 'available') return color + '44'
    return '#242b3d'
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(13, 17, 23, 0.85)',
        zIndex: 9999,
      }}>
        <Spinner animation="border" style={{ color: roadmap.color, width: 48, height: 48 }} />
        <p style={{ color: '#64748b', marginTop: 16, margin: '16px 0 0', fontSize: 14 }}>Building your roadmap…</p>
      </div>
    )
  }

  return (
    <>
      <div className="rm-root">
        {/* ── Header ── */}
        <div className="rm-header">
          <button className="rm-back-btn" onClick={() => navigate('/student/career-roadmap')}>
            <BsArrowLeft className="me-1" /> All Roadmaps
          </button>

          <div className="d-flex justify-content-between align-items-start flex-wrap gap-4 mt-2">
            <div>
              <div className="rm-type-badge" style={{ backgroundColor: roadmap.color + '22', color: roadmap.color }}>
                {roadmap.type}
              </div>
              <h1 className="rm-title mt-2">
                {roadmap.title.split(' ').slice(0, -1).join(' ')}{' '}
                <span style={{ color: roadmap.color, fontStyle: 'italic' }}>
                  {roadmap.title.split(' ').slice(-1)[0]}
                </span>
              </h1>
              <p className="rm-subtitle">{roadmap.longDescription}</p>
            </div>

            <div className="rm-progress-card" style={{ borderColor: roadmap.color + '33' }}>
              <div className="rm-progress-num" style={{ color: roadmap.color }}>{progressPct}%</div>
              <div className="rm-progress-label">Completed</div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: '#1e2535', overflow: 'hidden', width: 80, marginTop: 8 }}>
                <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: roadmap.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
              <div className="rm-progress-sub">{enrolledCount} / {totalCount} topics enrolled</div>
            </div>
          </div>

          {/* Legend */}
          <div className="d-flex align-items-center gap-4 mt-3 flex-wrap">
            {[
              { dot: '#2d3348', label: 'Not started', dim: true },
              { dot: roadmap.color + '66', label: 'Available course', dim: false },
              { dot: roadmap.color, label: 'Enrolled', dim: false },
              { border: '#f59e0b', label: 'Project step', isProject: true },
            ].map(({ dot, border, label, isProject }) => (
              <div key={label} className="d-flex align-items-center gap-2">
                {isProject ? (
                  <div style={{ width: 14, height: 14, border: `1.5px dashed ${border}`, borderRadius: 2 }} />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
                )}
                <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
              </div>
            ))}
            <div className="ms-auto" style={{ color: '#64748b', fontSize: 13 }}>
              <strong style={{ color: '#e2e8f0' }}>{availableCount}</strong> of{' '}
              <strong style={{ color: '#e2e8f0' }}>{totalCount}</strong> topics in platform
            </div>
          </div>
        </div>

        {/* ── Flow ── */}
        <div className="rm-flow-body">
          {/* Running boy */}
          <div className="rm-runner" key={roadmap.id}>
            <span className="rm-runner-icon">🏃</span>
          </div>

          {rows.map((row, rowIdx) => {
            const isRTL = rowIdx % 2 === 1
            const isLastRow = rowIdx === rows.length - 1
            const firstStep = row[0]
            const lastStep = row[row.length - 1]

            /* Show section label when a new section starts at this row's first step */
            const sectionLabel = firstStep?.isFirstInSection ? firstStep.sectionTitle : undefined

            const incomingColor = firstStep?.status === 'enrolled'
              ? color
              : firstStep?.matchedCourse ? color + '55' : color + '33'

            const dropColor = lastStep?.status === 'enrolled' ? color : color + '77'

            return (
              <div key={rowIdx} className="rm-row-block">
                {/* Section label */}
                {sectionLabel && (
                  <div className="rm-section-label-row">
                    <div className="rm-h-line" />
                    <div className="rm-section-label">{sectionLabel}</div>
                    <div className="rm-h-line" />
                  </div>
                )}

                {/* Full-width node row — no scroll */}
                <div className="rm-node-row" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>

                  {/* START indicator — only first row */}
                  {rowIdx === 0 && (
                    <div className="rm-start-col">
                      <span className="rm-start-text">START</span>
                      <div className="rm-start-dot" style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }} />
                      <div className="rm-start-stem" style={{ backgroundColor: color + '88' }} />
                    </div>
                  )}

                  {/* Incoming connector */}
                  <div className="rm-connector" style={{ backgroundColor: incomingColor }} />

                  {/* Nodes + inter-connectors */}
                  {row.map((step, stepIdx) => (
                    <React.Fragment key={step.id}>
                      <StepNode step={step} color={color} isRTL={isRTL} />
                      {stepIdx < row.length - 1 && (
                        <div className="rm-connector" style={{ backgroundColor: getConnColor(step, row[stepIdx + 1]) }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Snake turn — vertical drop on trailing side, outside the row */}
                {!isLastRow && (
                  <div
                    className="rm-snake-drop"
                    style={{ justifyContent: isRTL ? 'flex-start' : 'flex-end' }}
                  >
                    <div className="rm-snake-drop-inner">
                      {/* Horizontal arm connecting from node row to vertical bar */}
                      <div className="rm-snake-arm" style={{ backgroundColor: dropColor }} />
                      {/* Vertical bar + arrowhead */}
                      <div className="rm-v-bar" style={{ backgroundColor: dropColor }}>
                        <div className="rm-v-arrow" style={{
                          borderTop: `13px solid ${dropColor}`,
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* CTA */}
          <div
            className="rm-cta"
            style={{
              background: `linear-gradient(135deg, ${roadmap.color}14, ${roadmap.color}06)`,
              borderColor: roadmap.color + '30',
            }}
          >
            <div>
              <h6 className="fw-bold mb-1" style={{ color: '#e2e8f0' }}>Ready to start?</h6>
              <p className="mb-0" style={{ color: '#94a3b8', fontSize: 13 }}>
                {availableCount > 0
                  ? `${availableCount} course${availableCount !== 1 ? 's' : ''} available on the platform.`
                  : 'Browse all available courses to begin your journey.'}
              </p>
            </div>
            <Button
              onClick={() => navigate('/student/available-courses')}
              style={{ backgroundColor: roadmap.color, borderColor: roadmap.color, fontWeight: 600 }}
            >
              Browse All Courses <FaArrowRight className="ms-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* Root */
        .rm-root {
          background: #0d1117;
          border-radius: 16px;
          overflow: hidden;
          font-family: inherit;
        }

        /* Header */
        .rm-header {
          padding: 28px 36px 24px;
          border-bottom: 1px solid #1a2035;
        }
        .rm-back-btn {
          background: none;
          border: none;
          color: #475569;
          font-size: 13px;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: color 0.2s;
        }
        .rm-back-btn:hover { color: #94a3b8; }

        .rm-type-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .rm-title {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.1;
          margin: 0;
        }
        .rm-subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 8px 0 0;
          max-width: 560px;
          line-height: 1.6;
        }

        /* Progress Card */
        .rm-progress-card {
          background: rgba(255,255,255,.03);
          border: 1px solid;
          border-radius: 12px;
          padding: 16px 20px;
          text-align: center;
          min-width: 140px;
          flex-shrink: 0;
        }
        .rm-progress-num { font-size: 32px; font-weight: 800; line-height: 1; }
        .rm-progress-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
        .rm-progress-sub { color: #475569; font-size: 11px; margin-top: 6px; }

        /* Flow body */
        .rm-flow-body {
          padding: 32px 36px 40px;
          position: relative;
        }

        /* Each row block */
        .rm-row-block {
          margin-bottom: 0;
        }

        /* Section label row */
        .rm-section-label-row {
          display: flex;
          align-items: center;
          margin: 16px 0 20px;
        }
        .rm-h-line { flex: 1; height: 1px; background: #1e2535; }
        .rm-section-label {
          padding: 5px 22px;
          border: 1px dashed #2d3a50;
          border-radius: 20px;
          color: #4e6080;
          font-size: 11px;
          letter-spacing: 0.14em;
          font-weight: 700;
          margin: 0 20px;
          white-space: nowrap;
          text-transform: uppercase;
          background: #0d1117;
        }

        /* Node row — full width, NO horizontal scroll */
        .rm-node-row {
          display: flex;
          align-items: flex-start;
          width: 100%;
        }

        /* START indicator */
        .rm-start-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          padding-top: 0;
        }
        .rm-start-text {
          font-size: 9px;
          color: #475569;
          letter-spacing: 0.12em;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .rm-start-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .rm-start-stem {
          width: 2px;
          height: 12px;
          border-radius: 1px;
          margin-top: 2px;
        }

        /* Connector line */
        .rm-connector {
          height: 2px;
          flex: 1 0 16px;
          align-self: flex-start;
          margin-top: 27px;
          transition: background-color 0.3s;
          min-width: 16px;
        }

        /* Step column */
        .rm-step-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          flex: 0 0 auto;
          width: calc(25% - 36px);
          min-width: 140px;
          max-width: 220px;
        }

        /* Node box */
        .rm-node {
          width: 100%;
          background: #0f1520;
          border-radius: 8px;
          padding: 12px 14px;
          transition: all 0.2s;
          position: relative;
        }
        .rm-node-title {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1.3;
          word-break: break-word;
          flex: 1;
        }

        /* Project badge */
        .rm-project-badge {
          display: inline-block;
          margin-top: 6px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px dashed;
          letter-spacing: 0.04em;
        }

        /* Status dot */
        .rm-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 8px;
          flex-shrink: 0;
        }

        /* Subtopic pills */
        .rm-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
          justify-content: center;
          padding: 0 4px;
        }
        .rm-pill {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 10px;
          background: #131b2a;
          border: 1px solid #1e2a3a;
          color: #475569;
          white-space: nowrap;
        }

        /* Enrolled badge */
        .rm-enrolled-badge {
          margin-top: 6px;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          letter-spacing: 0.04em;
        }

        /* Snake turn connector */
        .rm-snake-drop {
          display: flex;
          padding: 0 0 8px;
          margin-top: 0;
        }
        .rm-snake-drop-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px;
        }
        .rm-snake-arm {
          width: 2px;
          height: 0;
          /* arm is handled by the v-bar starting immediately */
        }
        .rm-v-bar {
          width: 3px;
          height: 56px;
          border-radius: 2px;
          position: relative;
          margin-top: -2px;
        }
        .rm-v-arrow {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
        }

        /* Running boy */
        .rm-runner {
          position: absolute;
          left: 14px;
          top: 0;
          z-index: 20;
          pointer-events: none;
          animation: rmTravel 3.2s cubic-bezier(0.4, 0, 0.55, 1) forwards;
        }
        .rm-runner-icon {
          display: block;
          font-size: 22px;
          line-height: 1;
          transform: scaleX(-1);
          animation: rmBounce 0.32s infinite ease-in-out;
        }
        @keyframes rmTravel {
          0%   { top: 10px; }
          100% { top: calc(100% - 48px); }
        }
        @keyframes rmBounce {
          0%, 100% { transform: scaleX(-1) translateY(0px); }
          50%       { transform: scaleX(-1) translateY(-5px); }
        }

        /* CTA */
        .rm-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 20px 24px;
          border-radius: 12px;
          border: 1px solid;
          margin-top: 16px;
        }

        /* ─── Course Modal ─── */
        .rm-course-modal { width: 100vw; max-width: 100vw; height: 100vh; margin: 0; }
        .rm-course-modal .modal-content { height: 100%; border-radius: 0; overflow: hidden; }
        .rm-course-modal .modal-body { overflow-y: auto; padding: 0; }

        .rm-modal-close {
          position: fixed;
          top: 16px; right: 16px;
          z-index: 1090;
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(0,0,0,.65);
          color: #fff;
          font-size: 1.4rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s;
        }
        .rm-modal-close:hover { transform: scale(1.08); }

        .rm-hero {
          position: relative;
          aspect-ratio: 16/5;
          min-height: 260px;
          max-height: 300px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .rm-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.7); }
        .rm-hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.8) 100%); }
        .rm-hero-inner { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem 1.5rem; }
        .rm-chip { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: #fff; border-radius: 20px; font-size: .72rem; padding: 3px 10px; font-weight: 600; }
        .rm-glass { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(12px); border-radius: 12px; padding: .85rem 1rem; display: flex; flex-direction: column; gap: .3rem; }
        .rm-hero-title { color: #fff; font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800; margin: 0; }
        .rm-hero-sub { color: rgba(255,255,255,.8); font-size: .9rem; margin: 0; }

        .rm-tabs-wrap { background: #0f1115; border-bottom: 1px solid rgba(255,255,255,.06); position: sticky; top: 0; z-index: 5; }
        .rm-content { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .rm-tabs.nav-tabs { border-bottom: none; display: flex; gap: .4rem; padding: .3rem 0; }
        .rm-tabs .nav-link { color: #94a3b8; font-weight: 600; border: none; padding: .5rem .8rem; border-bottom: 2px solid transparent; font-size: .88rem; }
        .rm-tabs .nav-link.active { color: #fff; background: transparent; border-bottom-color: #3b82f6; }

        .rm-section { padding: 1.25rem 0 2rem; max-width: 1200px; margin: 0 auto; }

        .rm-card { background: #0f1115; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; }

        .rm-desc p { color: #d1d5db; margin-bottom: .8rem; }
        .rm-desc ul { padding-left: 1.2rem; }

        .rm-video-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,.06);
          flex-wrap: wrap;
          gap: .75rem;
        }
        .rm-video-row:last-child { border-bottom: none; }

        .rm-video-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1.5px solid;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0;
        }

        .rm-locked {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600;
          padding: .3rem .75rem;
          border-radius: 999px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #64748b;
        }

        @media (max-width: 900px) {
          .rm-header { padding: 20px; }
          .rm-flow-body { padding: 20px 16px 32px; }
          .rm-title { font-size: 26px; }
          .rm-step-col { min-width: 120px; width: calc(25% - 24px); }
          .rm-node { padding: 10px 10px; }
          .rm-node-title { font-size: 12px; }
        }
      `}</style>
    </>
  )
}

export default RoadmapFlow
