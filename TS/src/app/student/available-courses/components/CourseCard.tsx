import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, CardTitle, Modal, Tab, Tabs, ProgressBar, CardHeader, Row, Col, Spinner, Toast, ToastContainer } from 'react-bootstrap'
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
  FaChartLine,
  FaListUl,
  FaCheck,
  FaBriefcase,
  FaCode,
  FaBuilding,
} from 'react-icons/fa'
import { IoLockClosedOutline } from 'react-icons/io5'
import ReactApexChart from 'react-apexcharts'

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
  const [showMarketInsight, setShowMarketInsight] = useState(false)
  const { user } = useAuthContext()
  const token = user?.token
  const [showPreview, setShowPreview] = useState(false)
  const status = user?.status?.toLowerCase()
  const courseType = course?.courseType?.toLowerCase()

  const isApproved = status === 'approved'
  const isPending = status === 'pending'
  const courseStatus = course?.courseStatus?.toLowerCase()
  const isComingSoon = courseStatus === 'coming-soon'
  const [enrolling, setEnrolling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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

  const rawPrice = Number(price)
  const rawDiscountPrice = Number(discountPrice)
  const hasOriginalPrice =
    price !== undefined &&
    price !== null &&
    String(price).trim() !== '' &&
    !Number.isNaN(rawPrice)
  const hasDiscountPrice =
    discountPrice !== undefined &&
    discountPrice !== null &&
    String(discountPrice).trim() !== '' &&
    !Number.isNaN(rawDiscountPrice)

  const hasValidDiscount =
    hasOriginalPrice &&
    hasDiscountPrice &&
    rawDiscountPrice > 0
  const effectivePrice = hasValidDiscount
    ? Math.max(rawPrice - rawDiscountPrice, 0)
    : rawPrice
  const discountAmount = hasValidDiscount
    ? Math.max(rawDiscountPrice, 0)
    : 0
  const formatRupee = (value: number) => value.toLocaleString('en-IN')

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

    try {
      setEnrolling(true)

      const response = await fetch(`${baseURL}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (response.ok) {
        setEnrolledCourseIds((prev) => [...prev, courseId])

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert('Enroll failed: ' + data.message)
      }
    } catch {
      alert('Error enrolling')
    } finally {
      setEnrolling(false)
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


  const imgSrc = image
    ? (image.includes('s3.') || image.startsWith('http')
        ? image
        : `https://eklav-videos.s3.eu-north-1.amazonaws.com/images/${image}`)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`

  const fallbackSrc = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Course')}`

  return (
    <>
      {/* ═══════════════════ CARD ═══════════════════ */}
      <div className="cc2-card h-100 d-flex flex-column">

        {/* ── Thumbnail ── */}
        <div className="cc2-thumb-wrap">
          <img
            src={imgSrc}
            onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = fallbackSrc }}
            className="cc2-thumb"
            alt={title}
          />
          {/* gradient overlay */}
          <div className="cc2-thumb-overlay" />

          {/* Type pill — top-left */}
          <span className={`cc2-pill cc2-pill--${isComingSoon ? 'soon' : courseType === 'paid' ? 'paid' : 'free'}`}>
            {isComingSoon ? 'Coming Soon' : courseType === 'paid' ? 'Premium' : 'Free'}
          </span>

          {/* Custom badge — top-right */}
          {badge?.text && (
            <span className="cc2-custom-badge">{badge.text}</span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="cc2-body d-flex flex-column flex-grow-1">

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="cc2-cats">
              {categories.slice(0, 2).map((c, i) => (
                <span key={i} className="cc2-cat-chip">{clean(c)}</span>
              ))}
              {categories.length > 2 && (
                <span className="cc2-cat-chip cc2-cat-chip--more">+{categories.length - 2}</span>
              )}
            </div>
          )}

          {/* Title */}
          <h6 className="cc2-title">{title}</h6>

          {/* Description */}
          <p className="cc2-desc">{shortDescription || 'No description available.'}</p>

          {/* Divider */}
          <div className="cc2-divider" />

          {/* Rating row + Market Insight button */}
          <div className="cc2-rating-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {averageRating > 0 ? (
                <>
                  <div className="cc2-stars">{renderStarRating(averageRating, false, 11)}</div>
                  <span className="cc2-rating-val">{averageRating.toFixed(1)}</span>
                  <span className="cc2-rating-count">({totalRatings})</span>
                </>
              ) : (
                <span className="cc2-no-rating">No ratings yet</span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMarketInsight(true) }}
              style={{
                background: 'linear-gradient(135deg,#1e1b4b,#3730a3)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: '6px',
                color: '#c7d2fe',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 9px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.03em',
                boxShadow: '0 1px 4px rgba(99,102,241,0.25)',
                transition: 'all 0.15s',
              }}
              title="AI-powered Market Insight"
            >
              <FaChartLine size={9} /> Market Insight
            </button>
          </div>

          {/* Meta: duration + lectures + level */}
          <div className="cc2-meta">
            {duration && (
              <span className="cc2-meta-item">
                <FaRegClock size={11} />
                {duration}
              </span>
            )}
            <span className="cc2-meta-item">
              <FaTable size={11} />
              {totalLectures || videos.length || 0} lectures
            </span>
            {level && (
              <span className="cc2-meta-item">
                <FaChartBar size={11} />
                {clean(level)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="cc2-divider" />

          {/* Price + Button row */}
          <div className="cc2-footer mt-auto">
            {(hasOriginalPrice || hasDiscountPrice) ? (
              <div className="cc2-price">
                <span className="cc2-price-now">₹{formatRupee(effectivePrice)}</span>
                {hasValidDiscount && (
                  <>
                    <span className="cc2-price-was">₹{formatRupee(rawPrice)}</span>
                    <span className="cc2-price-save">Save ₹{formatRupee(discountAmount)}</span>
                  </>
                )}
              </div>
            ) : (
              <div />
            )}

            <Button
              size="sm"
              disabled={isComingSoon}
              className={`cc2-btn ${isComingSoon ? 'cc2-btn--disabled' : ''}`}
              onClick={() => { if (!isComingSoon) setShowDetails(true) }}
            >
              {isComingSoon
                ? <><IoLockClosedOutline size={12} /> Locked</>
                : <><FaInfoCircle size={12} /> View Details</>
              }
            </Button>
          </div>

        </div>
      </div>

      {/* MODAL */}
      <Modal show={!isComingSoon && showDetails} onHide={() => setShowDetails(false)} size="xl" fullscreen scrollable className="cc-modal-fullscreen">
        {/* Floating Close Button */}
        <button type="button" className="cc-close-btn" onClick={() => setShowDetails(false)} aria-label="Close">
          ×
        </button>

        <Modal.Body className="p-0">
          <ToastContainer
            position="top-end"
            className="p-3"
            style={{ position: 'fixed', zIndex: 99999 }}
          >
            <Toast
              bg="success"
              show={showSuccess}
              onClose={() => setShowSuccess(false)}
              delay={3000}
              autohide
            >
              <Toast.Body className="text-white d-flex align-items-center gap-2">
                <FaCheck /> Successfully Enrolled
              </Toast.Body>
            </Toast>
          </ToastContainer>
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
                        {hasValidDiscount ? (
                          <>
                            <span className="text-decoration-line-through opacity-75 me-2">
                              ₹{formatRupee(rawPrice)}
                            </span>
                            <span className="text-success">
                              ₹{formatRupee(effectivePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-success">₹{formatRupee(rawPrice)}</span>
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
                                  {hasValidDiscount ? (
                                    <>
                                      <span className="text-success me-2">₹{formatRupee(effectivePrice)}</span>
                                      <span className="text-muted text-decoration-line-through ">₹{formatRupee(rawPrice)}</span>
                                    </>
                                  ) : (
                                    <span className="text-success">₹{formatRupee(rawPrice)}</span>
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
                              className="w-100 mt-3 d-flex justify-content-center align-items-center gap-2"
                              onClick={() => handleEnroll(_id)}
                              disabled={
                                enrolledCourseIds.includes(_id) ||
                                !canEnroll ||
                                enrolling
                              }
                            >
                              {enrolling ? (
                                <>
                                  <Spinner animation="border" size="sm" />
                                  Enrolling...
                                </>
                              ) : enrolledCourseIds.includes(_id) ? (
                                'Already Enrolled'
                              ) : !canEnroll && courseType === 'paid' && isPending ? (
                                'Premium Required'
                              ) : (
                                'Enroll Now'
                              )}
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

/* ═══ Modal utility classes (kept for the detail modal) ═══ */
.modal-fullscreen { padding-right: 0 !important; }
.cc-content { max-width:1200px; margin:0 auto; padding-left:1rem; padding-right:1rem; }
.orange-progress .progress-bar { background-color:#ff7a00 !important; }
.cc-card { background-color:#0f0f0f; border:1px solid rgba(255,122,0,0.15); border-radius:14px; }
.cc-card.key-features { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:14px; }
.cc-card.key-features h6 { font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:#e5e7eb; }
.cc-desc p { margin-bottom:.8rem; color:#e5e7eb; }
.cc-desc ul { padding-left:1rem; }
.cc-card .list-group-item { background:transparent; border-color:rgba(255,255,255,.08); padding:1rem 1.25rem; display:flex; align-items:center; }
.badge.bg-dark-subtle.text-body { background:rgba(255,255,255,.06)!important; border:1px solid rgba(255,255,255,.12); color:#e5e7eb!important; padding:.35rem .65rem; border-radius:999px; font-weight:600; }
.feature-item { padding:0.45rem 0.6rem; border-radius:10px; transition:all 0.2s ease; }
.feature-item:hover { background:rgba(0,255,128,0.06); transform:translateY(-1px); }
.feature-icon { width:28px; height:28px; min-width:28px; border-radius:50%; background:rgba(0,255,128,0.15); display:flex; align-items:center; justify-content:center; color:#22c55e; font-size:0.8rem; margin-top:2px; }
.feature-text { color:#f1f5f9; font-size:0.9rem; line-height:1.4; }
@media (max-width: 768px) {
  .cc2-thumb-wrap { height: 150px; }
}

/* ═══════════════════════════════════════════
   COURSE CARD v2 — Professional Dark Theme
═══════════════════════════════════════════ */

/* ── Card shell ── */
.cc2-card {
  background: #131313;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  cursor: pointer;
}
.cc2-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255,122,0,0.45);
  box-shadow: 0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,122,0,0.15);
}

/* ── Thumbnail ── */
.cc2-thumb-wrap {
  position: relative;
  height: 186px;
  overflow: hidden;
  background: #1c1c1c;
  flex-shrink: 0;
}
.cc2-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.4s ease;
}
.cc2-card:hover .cc2-thumb {
  transform: scale(1.04);
}
.cc2-thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.08) 0%,
    rgba(0,0,0,0.55) 100%
  );
  pointer-events: none;
}

/* ── Pills on image ── */
.cc2-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 50px;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
  border: 1px solid transparent;
}
.cc2-pill--paid {
  background: rgba(255,122,0,0.85);
  border-color: rgba(255,122,0,0.5);
  color: #fff;
}
.cc2-pill--free {
  background: rgba(34,197,94,0.85);
  border-color: rgba(34,197,94,0.5);
  color: #fff;
}
.cc2-pill--soon {
  background: rgba(100,116,139,0.85);
  border-color: rgba(100,116,139,0.5);
  color: #fff;
}
.cc2-custom-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 50px;
  background: rgba(0,0,0,0.55);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  backdrop-filter: blur(6px);
}

/* ── Body ── */
.cc2-body {
  padding: 1rem 1.1rem 1rem;
}

/* ── Category chips ── */
.cc2-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 0.55rem;
}
.cc2-cat-chip {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding: 2px 9px;
  border-radius: 50px;
  background: rgba(255,122,0,0.1);
  border: 1px solid rgba(255,122,0,0.25);
  color: #ff8c30;
  white-space: nowrap;
}
.cc2-cat-chip--more {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.12);
  color: #888;
}

/* ── Title ── */
.cc2-title {
  font-size: 0.93rem;
  font-weight: 700;
  color: #f0f0f0;
  line-height: 1.35;
  margin-bottom: 0.4rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Description ── */
.cc2-desc {
  font-size: 0.78rem;
  color: #7a7a7a;
  line-height: 1.5;
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Divider ── */
.cc2-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 0.65rem 0;
}

/* ── Rating ── */
.cc2-rating-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.5rem;
}
.cc2-stars { display: flex; align-items: center; }
.cc2-rating-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: #f59e0b;
}
.cc2-rating-count {
  font-size: 0.72rem;
  color: #555;
}
.cc2-no-rating {
  font-size: 0.72rem;
  color: #444;
  font-style: italic;
}

/* ── Meta row ── */
.cc2-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 0;
}
.cc2-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #666;
}
.cc2-meta-item svg { color: #ff7a00; flex-shrink: 0; }

/* ── Footer: price + button ── */
.cc2-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.cc2-price { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .cc2-price-now {
    font-size: 1rem;
    font-weight: 800;
    color: #22c55e;
  }
  .cc2-price-was {
    font-size: 0.75rem;
    color: #555;
    text-decoration: line-through;
  }
  .cc2-price-save {
    font-size: 0.75rem;
    color: #facc15;
    background: rgba(250,204,21,0.12);
    border-radius: 999px;
    padding: 2px 8px;
    margin-left: 0.25rem;
    white-space: nowrap;
}

/* ── Action button ── */
.cc2-btn {
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  padding: 6px 16px !important;
  border-radius: 8px !important;
  border: 1.5px solid #ff7a00 !important;
  background: transparent !important;
  color: #ff7a00 !important;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  transition: all 0.18s ease !important;
}
.cc2-btn:hover:not(:disabled) {
  background: #ff7a00 !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(255,122,0,0.35);
}
.cc2-btn--disabled,
.cc2-btn:disabled {
  background: rgba(255,255,255,0.03) !important;
  border-color: rgba(255,255,255,0.1) !important;
  color: rgba(255,255,255,0.3) !important;
  cursor: not-allowed !important;
  opacity: 1 !important;
}

      `}</style>

      {/* Market Insight Modal */}
      <MarketInsightModal
        courseId={_id}
        courseTitle={title}
        show={showMarketInsight}
        onHide={() => setShowMarketInsight(false)}
      />

    </>
  )
}

/* ─── Trend Chart ────────────────────────────────────────── */
function TrendChart({ labels, historical, projection }: {
  labels: string[]
  historical: number[]
  projection: number[]
}) {
  // All labels = 12 historical + 6 projection
  const allLabels = labels.length > 0 ? labels : [
    ...historical.map((_, i) => `M${i + 1}`),
    ...projection.map((_, i) => `P${i + 1}`),
  ]

  // Historical series: 12 values then nulls for projection months
  const historicalData = [
    ...historical,
    ...Array(projection.length).fill(null),
  ]

  // Projection series: nulls for 11 months, then connect from last historical point, then projection values
  const projectionData = [
    ...Array(historical.length - 1).fill(null),
    historical[historical.length - 1], // bridge
    ...projection,
  ]

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
      sparkline: { enabled: false },
    },
    colors: ['#3b82f6', '#f59e0b'],
    stroke: { curve: 'smooth', width: [2.5, 2], dashArray: [0, 5] },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.4,
        opacityFrom: 0.18,
        opacityTo: 0.01,
      },
    },
    markers: {
      size: [3, 3],
      colors: ['#3b82f6', '#f59e0b'],
      strokeColors: '#0d0d0d',
      strokeWidth: 2,
      hover: { size: 5 },
    },
    xaxis: {
      categories: allLabels,
      labels: { style: { colors: '#4b5563', fontSize: '10px' }, rotate: -35, rotateAlways: false },
      tickAmount: 9,
      axisBorder: { color: '#1f2937' },
      axisTicks: { color: '#1f2937' },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: { style: { colors: '#4b5563', fontSize: '10px' }, formatter: (v: number) => `${Math.round(v)}` },
    },
    grid: { borderColor: '#1a1a1a', strokeDashArray: 4, padding: { left: 4, right: 8 } },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v: number | null) => v !== null && v !== undefined ? `${Math.round(v)} / 100` : '—' },
    },
    legend: { show: false },
    annotations: {
      xaxis: [{
        x: allLabels[historical.length - 1] ?? '',
        borderColor: '#374151',
        strokeDashArray: 4,
        label: {
          text: 'Today',
          style: { color: '#9ca3af', fontSize: '10px', background: '#111', padding: { left: 4, right: 4, top: 2, bottom: 2 } },
        },
      }],
    },
  }

  const series = [
    { name: 'Past Demand', data: historicalData },
    { name: 'Forecast',    data: projectionData },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#3b82f6' }}>
          <span style={{ width: 16, height: 3, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} /> Past 12 months
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b' }}>
          <span style={{ width: 16, height: 3, background: '#f59e0b', display: 'inline-block', borderRadius: 2, opacity: 0.8 }} /> 6-month forecast
        </span>
      </div>
      <ReactApexChart options={options} series={series} type="area" height={220} />
    </div>
  )
}

/* ─── Industry Donut Chart ───────────────────────────────── */
function IndustryDonutChart({ data }: { data: { name: string; percentage: number }[] }) {
  const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#6b7280', '#f59e0b']
  const options: ApexCharts.ApexOptions = {
    chart: { type: 'donut', background: 'transparent', toolbar: { show: false } },
    labels: data.map(d => `${d.name} ${d.percentage}%`),
    colors: COLORS,
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: '#9ca3af' },
      markers: { size: 7 },
      itemMargin: { horizontal: 8, vertical: 3 },
    },
    plotOptions: { pie: { donut: { size: '65%' } } },
    stroke: { width: 2, colors: ['#0d0d0d'] },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v}%` } },
  }
  return <ReactApexChart options={options} series={data.map(d => d.percentage)} type="donut" height={220} />
}

/* ─── Top Areas Horizontal Bar Chart ─────────────────────── */
function TopAreasChart({ data }: { data: { area: string; percentage: number }[] }) {
  const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#f59e0b', '#0891b2', '#be185d']
  const options: ApexCharts.ApexOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, distributed: true } },
    colors: COLORS,
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.map(d => d.area),
      labels: {
        style: { colors: '#6b7280', fontSize: '10px' },
        formatter: (v: string) => `${v}%`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '11px' } } },
    grid: { borderColor: '#1a1a1a', strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v}%` } },
  }
  return <ReactApexChart options={options} series={[{ data: data.map(d => d.percentage) }]} type="bar" height={Math.max(160, data.length * 30 + 40)} />
}

/* ─── Market Insight Modal ───────────────────────────────── */
interface MarketInsightData {
  marketStatus: string
  marketScope: string
  marketGrowth: string
  demandScore?: number
  marketSizeEstimate?: string
  avgSalaryBoost?: string
  companiesUsing: string[]
  jobRoles: string[]
  keySkills: string[]
  salaryEntry: string
  salaryMid: string
  salarySenior: string
  topCities?: string[]
  industrySectors?: string[]
  careerPath?: string[]
  certifications?: string[]
  remotePercentage?: string
  industryBreakdown?: { name: string; percentage: number }[]
  sectorDemandIndex?: { sector: string; score: number }[]
  topJobAreas?: { area: string; percentage: number }[]
  trendLabels?: string[]
  trendHistorical?: number[]
  trendProjection?: number[]
  fromCache: boolean
  lastFetched?: string
}

function MarketInsightModal({ courseId, courseTitle, show, onHide }: {
  courseId: string
  courseTitle: string
  show: boolean
  onHide: () => void
}) {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const [data, setData] = useState<MarketInsightData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !user?.token) return
    setLoading(true)
    setError('')
    fetch(`${baseURL}/courses/${courseId}/market-insight`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.message && !d.marketScope) throw new Error(d.message); setData(d) })
      .catch(e => setError(e.message || 'Failed to load insight'))
      .finally(() => setLoading(false))
  }, [show, courseId])

  const statusConfig: Record<string, { color: string; emoji: string; bg: string; border: string }> = {
    'In Demand':  { color: '#22c55e', emoji: '🟢', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)' },
    'Emerging':   { color: '#3b82f6', emoji: '🔵', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    'Niche':      { color: '#f59e0b', emoji: '🟡', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    'Declining':  { color: '#ef4444', emoji: '🔴', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)' },
  }

  const sc = statusConfig[data?.marketStatus ?? ''] ?? { color: '#888', emoji: '⚪', bg: 'rgba(136,136,136,0.12)', border: 'rgba(136,136,136,0.35)' }

  /* ── inline style helpers ── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    ...extra,
  })

  const sectionLabel = (extra?: React.CSSProperties): React.CSSProperties => ({
    color: '#6366f1',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.6rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    ...extra,
  })

  return (
    <>
      <style>{`
        .mi-full-modal .modal-dialog { margin: 0 !important; width: 100vw !important; max-width: 100vw !important; height: 100vh !important; }
        .mi-full-modal .modal-content { width: 100vw; height: 100vh; border-radius: 0 !important; background: #0a0a0a; border: none; display: flex; flex-direction: column; }
        .mi-full-modal .modal-body { padding: 0; flex: 1; min-height: 0; display: flex; overflow: hidden; }
        .mi-modal-backdrop.modal-backdrop { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); background: rgba(0,0,0,0.65) !important; opacity: 1 !important; }
      `}</style>

      <Modal show={show} onHide={onHide} backdropClassName="mi-modal-backdrop" className="mi-full-modal" dialogClassName="mi-full-dialog">

        {/* ══════════ HEADER (40px-ish) ══════════ */}
        <div style={{
          height: '52px',
          flexShrink: 0,
          background: '#0d0d0d',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <FaChartLine size={16} color="#6366f1" style={{ flexShrink: 0 }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Market Intelligence</span>
            <span style={{ color: '#374151', fontSize: '0.95rem' }}> — </span>
            <span style={{
              color: '#a855f7',
              fontSize: '0.85rem',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{courseTitle}</span>
          </div>
          <button
            onClick={onHide}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#9ca3af',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              flexShrink: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ══════════ BODY (sidebar + content) ══════════ */}
        <Modal.Body>

          {/* ── LEFT SIDEBAR (30%) ── */}
          <div style={{
            width: '30%',
            flexShrink: 0,
            background: '#0d0d0d',
            borderRight: '1px solid #1a1a1a',
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>

            {/* Course title in sidebar */}
            <div>
              <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Course</div>
              <div style={{ color: '#e5e7eb', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>{courseTitle}</div>
            </div>

            {/* Status badge */}
            {(data || loading) && (
              <div>
                <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Market Status</div>
                {loading ? (
                  <div style={{ height: '36px', background: '#1a1a1a', borderRadius: '999px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ) : data ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    color: sc.color,
                    borderRadius: '999px',
                    padding: '0.4rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}>
                    {sc.emoji} {data.marketStatus}
                  </span>
                ) : null}
              </div>
            )}

            {/* Market Scope */}
            {(data || loading) && (
              <div>
                <div style={sectionLabel()}>Market Scope</div>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[100, 85, 90, 70].map((w, i) => (
                      <div key={i} style={{ height: '10px', background: '#1a1a1a', borderRadius: '4px', width: `${w}%` }} />
                    ))}
                  </div>
                ) : data ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{data.marketScope}</p>
                ) : null}
              </div>
            )}

            {/* Market Growth highlight */}
            {data && !loading && data.marketGrowth && (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
              }}>
                <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Market Growth</div>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaChartBar size={13} /> {data.marketGrowth}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* AI / cache badge at bottom */}
            {data && !loading && (
              <div style={{ marginTop: 'auto' }}>
                <div style={{
                  background: '#111',
                  border: '1px solid #1f1f1f',
                  borderRadius: '8px',
                  padding: '0.55rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: '#555',
                }}>
                  <span style={{ fontSize: '0.85rem' }}>{data.fromCache ? '⚡' : '🤖'}</span>
                  <span>{data.fromCache ? 'Cached result' : 'AI Generated'}</span>
                  <span style={{ marginLeft: 'auto', color: '#333' }}>· refreshes every 45 days</span>
                </div>
                {data.lastFetched && (
                  <div style={{ color: '#333', fontSize: '0.68rem', marginTop: '0.4rem', paddingLeft: '0.2rem' }}>
                    Last fetched: {new Date(data.lastFetched).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT CONTENT (70%) ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minWidth: 0,
          }}>

            {/* ── Loading state ── */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.75rem', color: '#555' }}>
                <Spinner animation="border" style={{ color: '#6366f1', width: '2rem', height: '2rem', borderWidth: '3px' }} />
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Analyzing market data with AI…</div>
                <div style={{ fontSize: '0.78rem', color: '#374151' }}>This may take a few seconds</div>
              </div>
            )}

            {/* ── Error state ── */}
            {error && !loading && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '1.25rem', color: '#f87171', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Data state ── */}
            {data && !loading && (
              <>
                {/* ══ SECTION 1 — OVERVIEW stat cards ══ */}
                <div>
                  <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>OVERVIEW</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.65rem' }}>
                    {[
                      { label: 'Market Size',     value: data.marketSizeEstimate || '—',    sub: data.marketGrowth || '',      subColor: '#22c55e' },
                      { label: 'Demand Score',     value: `${data.demandScore ?? '—'}/100`,  sub: data.marketStatus || '',      subColor: sc.color },
                      { label: 'Companies Hiring', value: String(data.companiesUsing.length), sub: 'Active recruiters',         subColor: '#6366f1' },
                      { label: 'Job Roles',        value: String(data.jobRoles.length),       sub: 'Distinct positions',        subColor: '#a855f7' },
                      { label: 'Avg Salary Boost', value: data.avgSalaryBoost || '—',        sub: 'Post-certification',        subColor: '#f59e0b' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                        <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.45rem' }}>{s.label}</div>
                        <div style={{ color: '#f0f0f0', fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
                        {s.sub && <div style={{ color: s.subColor, fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>↑ {s.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ══ SECTION 2 — Market Demand Trend chart ══ */}
                {Array.isArray(data.trendHistorical) && data.trendHistorical.length > 0 && (
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ marginBottom: '0.2rem', color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700 }}>Market demand trend — {courseTitle}</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.75rem' }}>Demand index trajectory (past 12 months + 6-month forecast)</div>
                    <TrendChart labels={data.trendLabels ?? []} historical={data.trendHistorical} projection={data.trendProjection ?? []} />
                  </div>
                )}

                {/* ══ SECTION 3 — Donut + Horizontal bar ══ */}
                {((data.industryBreakdown && data.industryBreakdown.length > 0) || (data.topJobAreas && data.topJobAreas.length > 0)) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                    {/* Industries donut */}
                    {data.industryBreakdown && data.industryBreakdown.length > 0 && (
                      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Industries using this skill</div>
                        <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.5rem' }}>By hiring share</div>
                        <IndustryDonutChart data={data.industryBreakdown} />
                      </div>
                    )}

                    {/* Top job areas horizontal bar */}
                    {data.topJobAreas && data.topJobAreas.length > 0 && (
                      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Top job areas</div>
                        <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.75rem' }}>Learner demand by subject</div>
                        <TopAreasChart data={data.topJobAreas} />
                      </div>
                    )}
                  </div>
                )}

                {/* ══ SECTION 4 — Sector Demand Index ══ */}
                {data.sectorDemandIndex && data.sectorDemandIndex.length > 0 && (
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Sector demand index</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '1rem' }}>Hiring demand score per sector for certified professionals (out of 100)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {data.sectorDemandIndex.map(({ sector, score }) => {
                        const color = score >= 80 ? '#3b82f6' : score >= 60 ? '#22c55e' : '#f59e0b'
                        return (
                          <div key={sector} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: '#9ca3af', fontSize: '0.78rem', textAlign: 'right' }}>{sector}</span>
                            <div style={{ height: '10px', background: '#1a1a1a', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ color: '#e5e7eb', fontSize: '0.78rem', fontWeight: 700 }}>{score}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ══ SECTION 5 — Salary + Cities + Career + Certifications ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                  {/* Salary card */}
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Salary range · India</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.8rem' }}>Annual package in LPA</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { label: 'Entry Level',  value: data.salaryEntry,  color: '#3b82f6', fill: 33 },
                        { label: 'Mid Level',    value: data.salaryMid,    color: '#a855f7', fill: 66 },
                        { label: 'Senior Level', value: data.salarySenior, color: '#22c55e', fill: 100 },
                      ].map(tier => (
                        <div key={tier.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{tier.label}</span>
                            <span style={{ color: tier.color, fontWeight: 700, fontSize: '0.82rem' }}>{tier.value}</span>
                          </div>
                          <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${tier.fill}%`, background: tier.color, borderRadius: '999px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Career path */}
                  {data.careerPath && data.careerPath.length > 0 && (
                    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                      <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Career progression path</div>
                      <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.8rem' }}>From fresher to senior</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {data.careerPath.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `rgba(249,115,22,${1 - i * 0.15})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}>{i + 1}</div>
                              {i < data.careerPath!.length - 1 && <div style={{ width: '2px', flex: 1, background: 'rgba(249,115,22,0.15)', minHeight: '14px', margin: '2px 0' }} />}
                            </div>
                            <div style={{ paddingBottom: i < data.careerPath!.length - 1 ? '0.55rem' : 0 }}>
                              <span style={{ color: '#d1d5db', fontSize: '0.78rem', lineHeight: 1.5 }}>{step}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ══ SECTION 6 — Subject areas + Target sectors / companies ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                  {/* Key Skills */}
                  {data.keySkills.length > 0 && (
                    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                      <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Subject areas</div>
                      <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.75rem' }}>Topics covered across catalog</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {(() => {
                          const chipColors = [
                            { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#93c5fd' },
                            { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#86efac' },
                            { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', color: '#c084fc' },
                            { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' },
                            { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#fca5a5' },
                            { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.3)', color: '#5eead4' },
                          ]
                          return data.keySkills.map((skill, i) => {
                            const c = chipColors[i % chipColors.length]
                            return (
                              <span key={skill} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '0.3rem 0.7rem', color: c.color, fontSize: '0.75rem', fontWeight: 600 }}>{skill}</span>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Companies + Cities */}
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>Target sectors & companies</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.75rem' }}>Industries placing certified learners</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.65rem' }}>
                      {data.companiesUsing.map((company, i) => {
                        const avatarColors = ['#4f46e5','#0891b2','#059669','#b45309','#be185d','#7c3aed','#1d4ed8','#15803d']
                        const ac = avatarColors[i % avatarColors.length]
                        return (
                          <span key={company} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '8px', padding: '0.28rem 0.6rem', color: '#d1d5db', fontSize: '0.75rem', fontWeight: 500 }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: ac, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.58rem', fontWeight: 800, flexShrink: 0 }}>{company.charAt(0).toUpperCase()}</span>
                            {company}
                          </span>
                        )
                      })}
                    </div>
                    {data.topCities && data.topCities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {data.topCities.map(city => (
                          <span key={city} style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '0.28rem 0.65rem', color: '#7dd3fc', fontSize: '0.73rem', fontWeight: 500 }}>📍 {city}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ══ SECTION 7 — Certifications ══ */}
                {data.certifications && data.certifications.length > 0 && (
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>🎓 Recommended Certifications</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.75rem' }}>Credentials that boost employability</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                      {data.certifications.map((cert, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                          <span style={{ color: '#facc15', flexShrink: 0 }}>🏅</span>
                          <span style={{ color: '#d1d5db', fontSize: '0.78rem', lineHeight: 1.4 }}>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default CourseCard
