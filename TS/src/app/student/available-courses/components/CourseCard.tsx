import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, CardTitle, Modal, Tab, Tabs, ProgressBar, CardHeader, Row, Col } from 'react-bootstrap'
import {
  FaHeart,
  FaRegClock,
  FaRegHeart,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTable,
  FaInfoCircle,
  FaPlay,
  FaLanguage,
  FaChartBar,
  FaListUl,
  FaCheck,
} from 'react-icons/fa'
import { IoLockClosedOutline } from 'react-icons/io5'

type CourseType = {
  _id: string
  title: string
  shortDescription?: string
  category?: string[] | string
  level?: string
  language?: string
  duration?: string
  lectures?: string
  rating?: { star: number }
  image: string
  badge?: { text?: string; class?: string }
  description?: string
  totalLectures: string
  features?: string
  previewVideo?: string
  videos?: Array<{
    _id?: string
    video?: string
    url?: string
    description?: string
    progress?: number
  }>
  price?: string
  discountPrice?: string
  isFeatured?: string
  averageRating?: number
  totalRatings?: number
  courseType?: 'free' | 'paid'
  courseStatus?: 'active' | 'comingsoon'
}

const CourseCard = ({ course }: { course: CourseType }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { isTrue: isWishlisted, toggle } = useToggle()
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const { user } = useAuthContext()
  const token = user?.token
  const [showPreview, setShowPreview] = useState(false)
  const status = user?.status?.toLowerCase()
  const courseType = course?.courseType?.toLowerCase()

  const isApproved = status === 'approved'
  const isPending = status === 'pending'
  const courseStatus = course?.courseStatus?.toLowerCase()
  const isComingSoon = courseStatus === 'coming-soon'

  const canEnroll =
    courseType === 'free'
      ? true // free course always allowed
      : courseType === 'paid'
        ? isApproved // paid only allowed if approved
        : true

  const {
    duration,
    image,
    totalLectures,
    title,
    shortDescription,
    _id,
    description,
    category,
    level,
    language,
    features,
    videos = [],
    previewVideo,
    price,
    discountPrice,
    averageRating = 0,
    totalRatings = 0,
    badge,
  } = course

  // Modal hero image logic
  const [heroOk, setHeroOk] = useState(true)
  const hasImg = !!(image && String(image).trim())
  const showHero = hasImg && heroOk

  // helpers
  const getVideoUrl = (v: any) => v?.video || v?.url || ''
  const getVideoId = (v: any, i: number) => v?._id || `video-${i}`
  const categories: string[] = useMemo(() => {
    if (!category) return []
    if (Array.isArray(category)) return category
    if (typeof category === 'string') {
      try {
        const p = JSON.parse(category)
        return Array.isArray(p) ? p : [String(p)]
      } catch {
        return [category.replace(/"/g, '')]
      }
    }
    return []
  }, [category])
  // ✅ Robust feature normalization
  const courseFeatures: string[] = useMemo(() => {
    if (!features) return []
    if (Array.isArray(features)) return features // already array from DB

    // Handle JSON or comma-separated string
    try {
      const parsed = JSON.parse(features)
      if (Array.isArray(parsed)) return parsed
    } catch {
      if (typeof features === 'string') {
        return features.split(',').map((f) => f.trim())
      }
    }

    return typeof features === 'string' ? [features.trim()] : []
  }, [features])

  const clean = (s?: string | string[]) => {
    if (!s) return ''
    if (Array.isArray(s)) return s.join(', ') // join array into a string
    return s.replace(/^"+|"+$/g, '')
  }

  const previewUrl = useMemo(() => {
    return previewVideo?.trim() || ''
  }, [previewVideo])

  // effects
  useEffect(() => {
    if (!token) {
      setEnrolledCourseIds([])
      return
    }
    ; (async () => {
      try {
        const res = await fetch(`${baseURL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const ids = data.filter((e: any) => e?.courseId).map((e: any) => e.courseId._id)
        setEnrolledCourseIds(ids)
      } catch {
        setEnrolledCourseIds([])
      }
    })()
  }, [user, baseURL, token])

  // actions
  const handleEnroll = async (courseId: string) => {
    if (!token) return alert('Please log in to enroll.')

    if (!canEnroll) {
      if (courseType === 'paid' && isPending) {
        return alert('Upgrade to Premium to enroll in paid courses.')
      }
      return alert('You are not allowed to enroll in this course.')
    }

    if (enrolledCourseIds.length >= 5)
      return alert('You can only enroll in up to 5 courses.')

    try {
      const response = await fetch(`${baseURL}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (response.ok)
        setEnrolledCourseIds((prev) => [...prev, courseId])
      else alert('Enroll failed: ' + data.message)
    } catch {
      alert('Error enrolling')
    }
  }

  // Function to render star rating
  const renderStarRating = (ratingValue: number, showText: boolean = false, size: number = 12) => {
    const fullStars = Math.floor(ratingValue)
    const hasHalfStar = ratingValue % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="d-flex align-items-center gap-1">
        <div className="d-flex align-items-center">
          {Array(fullStars)
            .fill(0)
            .map((_, i) => (
              <FaStar key={`full-${i}`} className="text-warning" size={size} />
            ))}
          {hasHalfStar && <FaStarHalfAlt className="text-warning" size={size} />}
          {Array(emptyStars)
            .fill(0)
            .map((_, i) => (
              <FaRegStar key={`empty-${i}`} className="text-warning" size={size} />
            ))}
        </div>
        {showText && ratingValue > 0 && <span className="fw-semibold text-white ms-1">{ratingValue.toFixed(1)}</span>}
        {showText && totalRatings > 0 && (
          <span className="text-white-75 small ms-1">
            ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
          </span>
        )}
      </div>
    )
  }

  const cleanDescription = (description ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();


  return (
    <>
      {/* CARD */}
      <Card className="course-card h-100 d-flex flex-column overflow-hidden">
        <div className="position-relative cc-image-wrapper">
          <img
            src={
              image
                ? image.includes('s3.') || image.startsWith('http')
                  ? image
                  : `https://eklav-videos.s3.eu-north-1.amazonaws.com/images/${image}`
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`
            }
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.onerror = null
              img.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`
            }}
            className="card-img-top course-thumb"
            alt="Course image"
          />
          {badge?.text && (
            <Badge bg="" className={`cc-badge position-absolute top-2 start-2 ${badge.class || ''}`}>
              {badge.text}
            </Badge>
          )}
          <div className="cc-top-actions">
            <span
              className="cc-type-badge"
              style={{
                backgroundColor: isComingSoon
                  ? '#6c757d'
                  : courseType === 'paid'
                    ? '#ff7a00'
                    : '#ff7a00'
              }}
            >
              {isComingSoon
                ? 'COMING SOON'
                : courseType === 'paid'
                  ? 'PREMIUM'
                  : 'FREE'}
            </span>
          </div>
        </div>

        <CardBody className="pb-3 d-flex flex-column">
          <CardTitle className="fw-semibold d-flex align-items-center gap-2">
            {/* <a href={`/pages/course/detail-adv/${_id}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-body">
            </a> */}
            {title}
          </CardTitle>

          <p className="mb-2 text-truncate-2 text-secondary" title={shortDescription}>
            {shortDescription || 'No description.'}
          </p>

          {averageRating > 0 ? (
            <div className="mb-2 d-flex align-items-center">
              {renderStarRating(averageRating, false, 12)}
              <span className="ms-2 text-muted small">
                {averageRating.toFixed(1)} ({totalRatings})
              </span>
            </div>
          ) : (
            <div className="mb-2 text-muted small">No ratings yet</div>
          )}

          <div className="mt-auto pt-2">

            {/* Row 1: Duration & Lectures */}
            <div className="d-flex justify-content-between align-items-center small text-secondary mb-2">

              <div className="d-flex align-items-center gap-1">
                <FaRegClock size={14} style={{ color: '#ff7a00' }} />
                <span>{duration || 'N/A'} Duration</span>
              </div>

              <div className="d-flex align-items-center gap-1">
                <FaTable size={14} style={{ color: '#ff7a00' }} />
                <span>{totalLectures || videos.length || 0} lectures</span>
              </div>

            </div>

            {/* Row 2: View Details Button */}
            <Button
              size="sm"
              disabled={isComingSoon}
              className={`cc-details-btn d-flex align-items-center gap-2 ${isComingSoon ? 'cc-disabled-btn' : ''}`}
              onClick={() => {
                if (isComingSoon) return;
                setShowDetails(true);
              }}
            >
              {isComingSoon ? (
                <>
                  <IoLockClosedOutline size={14} />
                  Coming Soon
                </>
              ) : (
                <>
                  <FaInfoCircle size={14} />
                  View Details
                </>
              )}
            </Button>

          </div>
        </CardBody>
      </Card>

      {/* MODAL */}
      <Modal show={!isComingSoon && showDetails} onHide={() => setShowDetails(false)} size="xl" fullscreen scrollable className="cc-modal-fullscreen">
        {/* Floating Close Button */}
        <button type="button" className="cc-close-btn" onClick={() => setShowDetails(false)} aria-label="Close">
          ×
        </button>

        <Modal.Body className="p-0">
          <div className="cc-modal-wrapper">
            {/* HERO */}
            <div className={`cc-hero ${showHero ? '' : 'no-img'}`}>
              {showHero && (
                <img
                  src={
                    image
                      ? image.includes('s3.') || image.startsWith('http')
                        ? image
                        : `https://eklav-videos.s3.eu-north-1.amazonaws.com/images/${image}`
                      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`
                  }
                  onError={() => setHeroOk(false)}
                  alt="Course banner"
                  className="cc-hero-img"
                />
              )}

              <div className="cc-hero-overlay" />

              <div className="cc-hero-inner container-xxl">
                {categories.length > 0 && (
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    {categories.slice(0, 3).map((c, i) => (
                      <span key={i} className="badge rounded-pill cc-chip">
                        {clean(c)}
                      </span>
                    ))}
                    {categories.length > 3 && <span className="badge rounded-pill cc-chip">+{categories.length - 3}</span>}
                  </div>
                )}

                {/* Glassy header title block */}
                <div className="cc-glass-block">
                  <h1 className="cc-title mb-1">{title}</h1>
                  <p className="mb-2 cc-subtitle">{shortDescription || 'No description available.'}</p>

                  <div className="d-flex flex-wrap gap-3 small fw-semibold text-white-75 align-items-center">
                    <div>
                      <FaRegClock className="me-1" /> {duration || 'N/A'}
                    </div>
                    <div>
                      <FaTable className="me-1" /> {totalLectures || videos.length || 0} lectures
                    </div>

                    {averageRating > 0 ? (
                      <div className="d-inline-flex align-items-center">{renderStarRating(averageRating, true, 14)}</div>
                    ) : (
                      <div className="text-white-75">No ratings yet</div>
                    )}

                    {price && (
                      <div>
                        {discountPrice ? (
                          <>
                            <span className="text-decoration-line-through opacity-75 me-2">
                              ₹{discountPrice}
                            </span>
                            <span className="text-success">
                              ₹{price}
                            </span>
                          </>
                        ) : (
                          <span className="text-success">₹{price}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {previewUrl && (
                    <Button
                      size="sm"
                      variant="light"
                      className="fw-semibold d-inline-flex align-items-center gap-2 mt-2"
                      onClick={() => setShowPreview(true)}>
                      <FaPlay /> Preview
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Tabs */}
            <div className="cc-tabs-wrap">
              <div className="cc-content">
                <Tabs defaultActiveKey="overview" className="cc-tabs">
                  {/* Overview tab */}
                  <Tab
                    eventKey="overview"
                    title={
                      <span className="d-flex align-items-center gap-2">
                        <FaInfoCircle size={14} /> Overview
                      </span>
                    }>
                    <div className="cc-section container-xxl">
                      <div className="row g-4">
                        {/* Left */}
                        <div className="col-lg-3">
                          <div className="cc-card p-3">
                            <h6 className="mb-3">Course Information</h6>
                            <div className="d-grid gap-2 small">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="text-secondary d-flex align-items-center gap-2">
                                  <FaRegClock className="text-primary" /> Duration
                                </span>
                                <span className="fw-semibold">{duration || 'N/A'}</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="text-secondary d-flex align-items-center gap-2">
                                  <FaTable className="text-success" /> Lectures
                                </span>
                                <span className="fw-semibold">{totalLectures || videos.length || 0}</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="text-secondary d-flex align-items-center gap-2">
                                  <FaChartBar className="text-info" /> Level
                                </span>
                                <span className="fw-semibold">{clean(level) || 'All Levels'}</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="text-secondary d-flex align-items-center gap-2">
                                  <FaLanguage className="text-warning" /> Language
                                </span>
                                <span className="fw-semibold">{clean(language) || 'English'}</span>
                              </div>

                              {/* Rating in Course Information */}
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="text-secondary d-flex align-items-center gap-2">
                                  <FaStar className="text-warning" /> Rating
                                </span>
                                <span className="fw-semibold">
                                  {averageRating > 0 ? (
                                    <span className="d-flex align-items-center gap-1">
                                      {averageRating.toFixed(1)}
                                      <FaStar className="text-warning small" />
                                      <span className="text-muted small">({totalRatings})</span>
                                    </span>
                                  ) : (
                                    'No ratings'
                                  )}
                                </span>
                              </div>
                            </div>

                            {price && (
                              <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between">
                                <span className="text-secondary">Price</span>
                                <span className="fw-bold">
                                  {discountPrice ? (
                                    <>
                                      <span className="text-success me-2">₹{price}</span>
                                      <span className="text-muted text-decoration-line-through ">₹{discountPrice}</span>
                                    </>
                                  ) : (
                                    <span className="text-success">₹{price}</span>
                                  )}
                                </span>
                              </div>
                            )}

                            <Button
                              style={{
                                backgroundColor: canEnroll ? '#ff7a00' : '#ccc',
                                borderColor: canEnroll ? '#ff7a00' : '#ccc',
                                color: '#fff',
                              }}
                              className="w-100 mt-3"
                              onClick={() => handleEnroll(_id)}
                              disabled={
                                enrolledCourseIds.includes(_id) ||
                                !canEnroll
                              }
                            >
                              {enrolledCourseIds.includes(_id)
                                ? 'Already Enrolled'
                                : !canEnroll && courseType === 'paid' && isPending
                                  ? 'Premium Required'
                                  : 'Enroll Now'}
                            </Button>
                          </div>
                          {courseFeatures.length > 0 && (
                            <Card className="mt-4 cc-card key-features">
                              <CardHeader className="bg-transparent border-0 pb-0">
                                <h6 className="mb-0 d-flex align-items-center gap-2">✨ Key Features</h6>
                              </CardHeader>

                              <CardBody className="pt-3">
                                <ul className="list-unstyled mb-0">
                                  {courseFeatures.map((feature, i) => (
                                    <li key={i} className="d-flex align-items-start gap-3 mb-2 feature-item">
                                      <span className="feature-icon">
                                        <FaCheck />
                                      </span>
                                      <span className="feature-text">{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardBody>
                            </Card>
                          )}
                        </div>

                        {/* Right */}
                        <div className="col-lg-9">
                          <div className="cc-card p-4">
                            <h5 className="mb-3">About this course</h5>
                            <div className="cc-desc">
                              {description ? (
                                <div dangerouslySetInnerHTML={{ __html: cleanDescription }} />
                              ) : (
                                <p className="text-muted">{shortDescription || 'No description available.'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab>

                  {/* Curriculum Tab */}
                  <Tab
                    eventKey="curriculum"
                    title={
                      <span className="d-flex align-items-center gap-2">
                        <FaPlay size={14} /> Curriculum ({videos.length})
                      </span>
                    }>
                    <div className="cc-section container-xxl">
                      {videos.length > 0 ? (
                        <div className="cc-card p-0 overflow-hidden">
                          <div className="list-group list-group-flush">
                            {videos.map((video, index) => (
                              <div
                                key={getVideoId(video, index)}
                                className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-3">
                                  <span className="badge rounded-pill bg-secondary">{index + 1}</span>
                                  <div>
                                    <h6 className="mb-1">Module {index + 1}</h6>
                                    <p className="mb-0 text-muted small">{video.description || 'Video module'}</p>
                                  </div>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                  {typeof video.progress === 'number' && (
                                    <div style={{ minWidth: 160 }}>
                                      <ProgressBar
                                        now={video.progress}
                                        style={{
                                          backgroundColor: '#2a2a2a',
                                        }}
                                        variant=""
                                        className="orange-progress"
                                        label={`${video.progress}%`} />
                                    </div>
                                  )}
                                  <span className="badge rounded-pill bg-dark-subtle text-body d-inline-flex align-items-center gap-1 px-3 py-2">
                                    <IoLockClosedOutline /> Locked
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <FaPlay size={48} className="mb-2" />
                          <p>No modules available yet.</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* ================= PREVIEW VIDEO MODAL ================= */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} centered size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Course Preview</Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0 bg-black">
          {previewUrl?.includes('youtube') || previewUrl?.includes('youtu.be') ? (
            <div className="ratio ratio-16x9">
              <iframe src={previewUrl.replace('watch?v=', 'embed/')} title="Course Preview" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          ) : (
            <video src={previewUrl} controls autoPlay style={{ width: '100%', height: '100%' }} />
          )}
        </Modal.Body>
      </Modal>

      <style>{`
/* ============== Card ============== */
.cc-badge{
  top:.75rem; left:.75rem;
  background:rgba(0,0,0,.65); color:#fff;
  padding:.35rem .6rem; border-radius:999px;
  font-weight:600; font-size:.75rem;
}
.cc-heart-btn{
  position:absolute; right:.75rem; top:.75rem;
  width:36px; height:36px; border-radius:999px;
  border:1px solid rgba(255,255,255,.35);
  background:rgba(0,0,0,.35); color:#fff;
  display:inline-flex; align-items:center; justify-content:center;
  backdrop-filter:blur(6px) saturate(130%);
}
.cc-heart-btn:hover{ background:rgba(0,0,0,.5); }

/* ============== Floating Close Button ============== */
.cc-close-btn {
  position: fixed;            /* ✅ KEY FIX */
  top: 16px;
  right: 16px;
  z-index: 1090;              /* higher than modal (1055) */
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.35);
  background: rgba(0,0,0,.6);
  color: #fff;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.cc-close-btn:hover {
  background: rgba(0,0,0,.65);
  transform: scale(1.05);
}

/* ============== Modal (FIXED SCROLLING) ============== */
.cc-modal-fullscreen {
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  margin: 0;
}

.cc-modal-fullscreen .modal-content {
  height: 100%;
  border-radius: 16px;
  overflow: visible; 
}
.cc-modal-fullscreen .modal-body {
  overflow-y: auto;
  padding: 0;
}

/* ============== Modal Wrapper ============== */
.cc-modal-wrapper{ 
  display: flex; 
  flex-direction: column; 
  min-height: 0;
  height: 100%;
}

/* ============== Hero ============== */
.cc-hero{ 
  position:relative; 
  aspect-ratio:16/6; 
  min-height:280px; 
  max-height:320px; 
  overflow:hidden; 
  flex: 0 0 auto;
}
.cc-hero-img{ 
  position:absolute; 
  inset:0; 
  width:100%; 
  height:100%; 
  object-fit:cover; 
  transform:scale(1.02); 
  filter:brightness(.75) saturate(105%); 
}
.cc-hero.no-img{
  background:
    radial-gradient(1200px 600px at 20% 0%, rgba(255,255,255,.06), rgba(255,255,255,0) 60%),
    linear-gradient(180deg, #15171b 0%, #0f1115 100%);
}
.cc-hero-overlay{ 
  position:absolute; 
  inset:0; 
  background:linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.55) 70%, rgba(0,0,0,.85) 100%); 
  pointer-events:none; 
}
.cc-hero-inner{ 
  position:relative; 
  z-index:2; 
  height:100%; 
  display:flex; 
  flex-direction:column; 
  justify-content:center; 
  padding:1.5rem 1rem; 
  max-width:1000px; 
}

/* Glassy header title block */
.cc-glass-block{
  display:flex; 
  flex-direction:column; 
  gap:.35rem;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.16);
  box-shadow:0 12px 40px rgba(0,0,0,.35);
  backdrop-filter:blur(12px) saturate(125%);
  -webkit-backdrop-filter:blur(12px) saturate(125%);
  border-radius:16px; 
  padding:1rem 1rem;
}

/* Chips */
.cc-chip{
  background:rgba(255,255,255,.10)!important; 
  color:#fff;
  border:1px solid rgba(255,255,255,.22);
  backdrop-filter:blur(8px) saturate(150%);
  font-size:0.75rem; 
  padding:0.3rem 0.6rem;
}

/* Titles */
.cc-title{ 
  font-size:clamp(1.5rem,2.5vw,2.2rem); 
  color:#fff;
  font-weight:700; 
  letter-spacing:.2px; 
  line-height:1.2; 
}
.cc-subtitle{ 
  color:rgba(255,255,255,.85); 
  margin:0; 
  font-size:0.95rem; 
}

/* ============== Tabs (sticky) ============== */
.cc-tabs-wrap{ 
  position:sticky; 
  top:0; 
  z-index:5; 
  background:linear-gradient(180deg,rgba(18,18,20,1),rgba(18,18,20,.96)); 
  border-bottom:1px solid rgba(255,255,255,.06); 
  flex: 0 0 auto;
}
.cc-tabs-wrap .container-xxl{ padding-left:1rem; padding-right:1rem; }
.cc-tabs.nav-tabs{ border-bottom:none; display:flex; gap:0.5rem; align-items:center; padding:.25rem 0; }
.cc-tabs .nav-link{ color:#cbd5e1; font-weight:600; border:none; padding:.5rem .7rem; border-bottom:2px solid transparent; font-size:0.9rem; }
.cc-tabs .nav-link:hover{ color:#fff; }
.cc-tabs .nav-link.active{ color:#fff; background:transparent; border-bottom-color:#3b82f6; }

/* ============== Sections & Cards ============== */
.cc-section{ 
  padding:1rem 0 2rem 0; 
  flex: 1 1 auto; 
  min-height: 0;
  overflow-y: auto;
}
.cc-card{ 
 background-color: #0f0f0f;
  border: 1px solid rgba(255, 122, 0, 0.15);
  border-radius:14px; 
}
.cc-desc p{ margin-bottom:.8rem; color:#e5e7eb; }
.cc-desc ul{ padding-left:1rem; }

/* Curriculum rows */
.cc-card .list-group-item{ 
  background:transparent; 
  border-color:rgba(255,255,255,.08); 
  padding:1rem 1.25rem; 
  display:flex; 
  align-items:center; 
}
.cc-card .list-group-item .badge.rounded-pill.bg-secondary{ 
  width:28px; 
  height:28px; 
  display:inline-flex; 
  align-items:center; 
  justify-content:center; 
  font-weight:700; 
}
.badge.bg-dark-subtle.text-body{ 
  background:rgba(255,255,255,.06)!important; 
  border:1px solid rgba(255,255,255,.12); 
  color:#e5e7eb!important; 
  padding:.35rem .65rem; 
  border-radius:999px; 
  font-weight:600; 
}

/* Card thumbnail */
.course-thumb{ width:100%; aspect-ratio: 16/14; object-fit: cover; }

.cc-image-wrapper {
  position: relative;
  overflow: hidden;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

/* Utilities */
.top-2{ top:.5rem; } .start-2{ left:.5rem; }

/* Responsive */
@media (max-width: 768px) {
  .cc-hero { aspect-ratio:16/7; min-height:240px; }
  .cc-hero-inner { padding:1rem; }
  .cc-title { font-size:1.3rem; }
  .cc-subtitle { font-size:0.9rem; }
  .cc-modal-fullscreen {
    max-width: 100vw;
    max-height: 100vh;
    height: 100vh;
    margin: 0;
  }
}
  .cc-card {
   background-color: #0f0f0f;
  border: 1px solid rgba(255, 122, 0, 0.15);
  border-radius: 10px;
}

.cc-card ul li:hover {
  background-color: rgba(0, 255, 128, 0.05);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

.cc-card h6 {
  letter-spacing: 0.5px;
}

/* --- Key Features Style Improvement --- */
.cc-card.key-features {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.cc-card.key-features h6 {
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #e5e7eb;
}

.feature-item {
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.feature-item:hover {
  background: rgba(0, 255, 128, 0.06);
  transform: translateY(-1px);
}
  .feature-icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: rgba(0, 255, 128, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-size: 0.8rem;
  margin-top: 2px;
}
.feature-text {
  color: #f1f5f9;
  font-size: 0.9rem;
  line-height: 1.4;
}
  .modal-fullscreen {
  padding-right: 0 !important;
}

.cc-content {
  max-width: 1200px;     /* readable width */
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.orange-progress .progress-bar {
  background-color: #ff7a00 !important;
}

/* ===== Course Card Border Enhancement ===== */
.course-card {
  background-color: #111111;
  border: 1px solid rgba(255, 122, 0, 0.18);
  border-radius: 14px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.course-card:hover {
  border-color: #ff7a00;
  box-shadow: 0 8px 24px rgba(255, 122, 0, 0.25);
  transform: translateY(-4px);
}
  /* ===== Top Right Actions (Badge + Heart) ===== */
.cc-top-actions {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
}

.cc-type-badge {
  background-color: #ff7a00;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 50px;
  letter-spacing: 0.6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}
 
/* Normal button */
.cc-details-btn {
  padding: 6px 14px !important;
  font-size: 0.8rem !important;
  border-radius: 8px !important;
  border: 1px solid #ff7a00;
  color: #ff7a00;
  background: transparent;
  font-weight: 600;
  transition: all 0.2s ease;
}

/* Hover */
.cc-details-btn:hover:not(:disabled) {
  background: #ff7a00;
}

/* Disabled Coming Soon style */
.cc-disabled-btn,
.cc-details-btn:disabled {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.45) !important;
  cursor: not-allowed !important;
  opacity: 1 !important; /* override bootstrap fade */
}
      `}</style>
    </>
  )
}

export default CourseCard
