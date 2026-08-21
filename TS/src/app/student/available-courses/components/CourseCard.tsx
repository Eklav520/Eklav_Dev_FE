import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Spinner, Toast, ToastContainer } from 'react-bootstrap'
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

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this modal re-themes along with
// the rest of the portal without needing its own theme plumbing.
const PAGE_BG     = 'var(--dash-page-bg, #f1f5f9)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const CourseCard = ({ course, open, openMarketInsight, onClose, onCloseMarketInsight, hideCard }: {
  course: CourseType
  open?: boolean
  openMarketInsight?: boolean
  onClose?: () => void
  onCloseMarketInsight?: () => void
  hideCard?: boolean
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { isTrue: isWishlisted, toggle } = useToggle()
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [showMarketInsight, setShowMarketInsight] = useState(false)

  useEffect(() => { if (open !== undefined) setShowDetails(open) }, [open])
  useEffect(() => { if (openMarketInsight !== undefined) setShowMarketInsight(openMarketInsight) }, [openMarketInsight])

  const handleCloseDetails = () => { setShowDetails(false); setMiniInsight(null); setShowInlineVideo(false); onClose?.() }
  const handleCloseMarketInsight = () => { setShowMarketInsight(false); onCloseMarketInsight?.() }
  const { user } = useAuthContext()
  const token = user?.token
  const [showPreview, setShowPreview] = useState(false)
  const status = user?.status?.toLowerCase()
  const courseType = course?.courseType?.toLowerCase()

  const isApproved = status === 'approved'
  const courseStatus = course?.courseStatus?.toLowerCase()
  const isComingSoon = courseStatus === 'coming-soon'
  const [enrolling, setEnrolling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'Overview' | 'Curriculum' | 'Instructor' | 'Reviews' | 'Q&A'>('Overview')
  const [showInlineVideo, setShowInlineVideo] = useState(false)
  const [miniInsight, setMiniInsight] = useState<{ jobs?: string; salary?: string; companies?: string[]; status?: string } | null>(null)

  useEffect(() => {
    if (!showDetails || !token || miniInsight) return
    const courseId = course._id
    fetch(`${baseURL}/courses/${courseId}/market-insight`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.marketScope || d.companiesUsing) {
          setMiniInsight({
            jobs: d.jobRoles?.length ? `${d.jobRoles.length * 200}+` : '2,400+',
            salary: d.salaryEntry && d.salaryMid ? `₹${d.salaryEntry}–${d.salaryMid}` : '₹6–12 LPA',
            companies: d.companiesUsing?.slice(0, 5) ?? [],
            status: d.marketStatus ?? '',
          })
        }
      })
      .catch(() => {})
  }, [showDetails, token, course._id])

  // Full-plan (approved) students get every course included — no per-course
  // payment. Everyone else can still buy any single paid course on its own,
  // so "paid" no longer blocks on account status here.
  const canEnroll = true

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
  const enrollFree = async (courseId: string) => {
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
  }

  const enrollPaid = async (courseId: string) => {
    const orderRes = await fetch(`${baseURL}/courses/${courseId}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const order = await orderRes.json()
    if (!orderRes.ok || !order.success) {
      throw new Error(order.message || 'Failed to start payment')
    }

    await new Promise<void>((resolve, reject) => {
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Eklav',
        description: order.courseTitle,
        order_id: order.orderId,
        prefill: { email: user?.email || '' },
        theme: { color: '#ff7a00' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${baseURL}/courses/${courseId}/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed')
            setEnrolledCourseIds((prev) => [...prev, courseId])
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
            resolve()
          } catch (e) {
            reject(e)
          }
        },
        modal: { ondismiss: () => resolve() },
      }
      const razorpay = new (window as any).Razorpay(options)
      razorpay.on('payment.failed', (response: any) => {
        reject(new Error(response.error?.description || 'Payment failed'))
      })
      razorpay.open()
    })
  }

  const handleEnroll = async (courseId: string) => {
    if (!token) return alert('Please log in to enroll.')

    try {
      setEnrolling(true)
      // Full-plan students already have every course included — just
      // register the enrollment, no charge, regardless of this course's price.
      if (isApproved || effectivePrice <= 0) {
        await enrollFree(courseId)
      } else {
        await enrollPaid(courseId)
      }
    } catch (e: any) {
      alert(e?.message || 'Error enrolling')
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
      {!hideCard && <div className="cc2-card h-100 d-flex flex-column">

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
      </div>}

      {/* ═══ VIEW DETAILS MODAL — Marketplace 3-Panel Layout ═══ */}
      <Modal show={!isComingSoon && showDetails} onHide={handleCloseDetails} fullscreen backdrop="static" keyboard={false} animation={false} className="cd-modal">
        <Modal.Body className="p-0" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: PAGE_BG, overflow: 'hidden' }}>

          {/* Toast */}
          <ToastContainer position="top-end" className="p-3" style={{ position: 'fixed', zIndex: 99999 }}>
            <Toast bg="success" show={showSuccess} onClose={() => setShowSuccess(false)} delay={3000} autohide>
              <Toast.Body className="text-white d-flex align-items-center gap-2"><FaCheck /> Successfully Enrolled</Toast.Body>
            </Toast>
          </ToastContainer>

          {/* ── TOP BAR ── */}
          <div style={{ background: CARD_BG, borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', height: 50, flexShrink: 0 }}>
            {/* Breadcrumb — same fixed width as left panel so tabs always align with center panel */}
            <div style={{ width: 380, minWidth: 380, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: PAGE_GRAY, borderRight: `1px solid ${PAGE_BORDER}`, height: '100%', flexShrink: 0, overflow: 'hidden' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Home</span>
              <span>›</span>
              <span style={{ whiteSpace: 'nowrap' }}>All Courses</span>
              <span>›</span>
              <span style={{ color: PAGE_TEXT, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {categories[0] ? clean(categories[0]) : 'Course'}
              </span>
            </div>
            {/* Tabs — equally divide the remaining center width, with dividers */}
            <div style={{ display: 'flex', height: '100%', flex: 1, minWidth: 0 }}>
              {(['Overview', 'Curriculum', 'Instructor', 'Reviews', 'Q&A'] as const).map((tab, idx, arr) => (
                <div key={tab} style={{ display: 'flex', alignItems: 'stretch', height: '100%', flex: 1, minWidth: 0 }}>
                  <button onClick={() => setActiveTab(tab)} style={{
                    background: 'transparent', border: 'none',
                    borderBottom: activeTab === tab ? '2.5px solid #ff7a00' : '2.5px solid transparent',
                    color: activeTab === tab ? '#ff7a00' : PAGE_GRAY,
                    fontWeight: activeTab === tab ? 700 : 500,
                    fontSize: '0.84rem', flex: 1, minWidth: 0, textAlign: 'center', padding: 0, cursor: 'pointer', whiteSpace: 'nowrap', height: '100%',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}>
                    {tab}{tab === 'Reviews' && totalRatings > 0 ? ` (${totalRatings > 999 ? `${(totalRatings / 1000).toFixed(1)}K` : totalRatings})` : ''}
                  </button>
                  {idx < arr.length - 1 && (
                    <div style={{ width: 1, background: PAGE_BORDER, alignSelf: 'center', height: 16, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
            {/* Right zone — same fixed width as the right panel below, so its border lines up */}
            <div style={{ width: 310, minWidth: 310, maxWidth: 310, height: '100%', borderLeft: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={handleCloseDetails} style={{
                background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: '50%', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: PAGE_TEXT, fontSize: '1.15rem', flexShrink: 0, marginRight: 16,
              }} aria-label="Close">×</button>
            </div>
          </div>

          {/* ── 3-PANEL BODY ── */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

            {/* ── LEFT PANEL — same width as breadcrumb (380px) ── */}
            <div style={{ width: 380, minWidth: 380, maxWidth: 380, background: CARD_BG, borderRight: `1px solid ${PAGE_BORDER}`, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }} className="cd-panel-scroll">

              {/* Thumbnail / Inline Video Player */}
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#000', width: '100%', height: 180, flexShrink: 0 }}>
                {showInlineVideo && previewUrl ? (
                  /* ── Inline video player ── */
                  previewUrl.includes('youtube') || previewUrl.includes('youtu.be') ? (
                    <iframe
                      src={previewUrl.replace('watch?v=', 'embed/') + '?autoplay=1'}
                      title="Course Preview"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                    />
                  )
                ) : (
                  /* ── Thumbnail with play overlay ── */
                  <>
                    <img
                      src={imgSrc}
                      onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = fallbackSrc }}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Play button — only when preview exists */}
                    {previewUrl ? (
                      <div
                        onClick={() => setShowInlineVideo(true)}
                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.28)', cursor: 'pointer' }}>
                        <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,122,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(255,122,0,0.45)' }}>
                          <FaPlay color="#fff" size={16} style={{ marginLeft: 2 }} />
                        </div>
                        <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                          Preview available
                        </span>
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>No preview available</span>
                      </div>
                    )}
                    {/* Type badge top-left */}
                    {(badge?.text || courseType) && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        background: badge?.text ? '#f59e0b' : courseType === 'paid' ? '#ff7a00' : '#16a34a',
                        color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px',
                        borderRadius: 20, letterSpacing: '0.3px',
                      }}>
                        {badge?.text || (courseType === 'paid' ? 'Premium' : 'Free')}
                      </span>
                    )}
                  </>
                )}
                {/* Stop video button */}
                {showInlineVideo && (
                  <button
                    onClick={() => setShowInlineVideo(false)}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', zIndex: 10 }}
                  >×</button>
                )}
              </div>

              {/* Title */}
              <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.95rem', lineHeight: 1.4, margin: 0 }}>{title}</h6>

              {/* Short description */}
              {shortDescription && (
                <p style={{ fontSize: '0.77rem', color: PAGE_GRAY, margin: 0, lineHeight: 1.55 }}>
                  {shortDescription.replace(/<[^>]*>/g, '').slice(0, 130)}{shortDescription.replace(/<[^>]*>/g, '').length > 130 ? '…' : ''}
                </p>
              )}

              {/* Rating + enrolled */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {averageRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {renderStarRating(averageRating, false, 13)}
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f59e0b' }}>{averageRating.toFixed(1)}</span>
                    <span style={{ color: PAGE_GRAY, fontSize: '0.74rem' }}>({totalRatings > 999 ? `${(totalRatings / 1000).toFixed(1)}K` : totalRatings} Reviews)</span>
                  </div>
                )}
                {totalRatings > 0 && (
                  <div style={{ fontSize: '0.73rem', color: PAGE_GRAY, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaBriefcase size={10} color="#94a3b8" />
                    Enrolled by {(totalRatings * 7).toLocaleString('en-IN')} students
                  </div>
                )}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {level && (
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, background: 'rgba(255,122,0,0.08)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 20, padding: '3px 10px' }}>
                    {clean(level)}
                  </span>
                )}
                <span style={{ fontSize: '0.67rem', fontWeight: 700, background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 10px' }}>
                  Certificate
                </span>
                {badge?.text && (
                  <span style={{ fontSize: '0.67rem', fontWeight: 700, background: 'rgba(234,179,8,0.1)', color: '#b45309', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 20, padding: '3px 10px' }}>
                    {badge.text}
                  </span>
                )}
              </div>

              {/* Price */}
              {hasOriginalPrice && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: effectivePrice === 0 ? '#16a34a' : PAGE_TEXT }}>
                    {effectivePrice === 0 ? 'Free' : `₹${formatRupee(effectivePrice)}`}
                  </span>
                  {hasValidDiscount && <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{formatRupee(rawPrice)}</span>}
                </div>
              )}

              {/* Enroll CTA */}
              {enrolledCourseIds.includes(_id) ? (
                <div style={{ background: 'rgba(255,122,0,0.06)', border: '1.5px solid rgba(255,122,0,0.35)', borderRadius: 10, padding: '11px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FaCheck size={11} color="#fff" />
                    </div>
                    <div>
                      <div style={{ color: '#ff7a00', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2 }}>Already Enrolled</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: 2 }}>You are enrolled in this course</div>
                    </div>
                  </div>
                </div>
              ) : (() => {
                const needsPayment = !isApproved && effectivePrice > 0
                return (
                  <button
                    onClick={() => handleEnroll(_id)}
                    disabled={enrolling}
                    style={{
                      background: '#ff7a00', border: 'none', borderRadius: 10,
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                      padding: '12px', cursor: enrolling ? 'not-allowed' : 'pointer',
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 16px rgba(255,122,0,0.32)',
                      transition: 'all 0.15s',
                      opacity: enrolling ? 0.75 : 1,
                    }}>
                    {enrolling
                      ? <><Spinner animation="border" size="sm" /> {needsPayment ? 'Processing...' : 'Enrolling...'}</>
                      : needsPayment ? `Pay ₹${formatRupee(effectivePrice)} & Enroll` : 'Enroll Now'}
                  </button>
                )
              })()}

              {/* Wishlist + Share */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={toggle} style={{ flex: 1, background: 'transparent', border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, color: PAGE_TEXT, fontSize: '0.76rem', fontWeight: 600, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {isWishlisted ? <FaHeart color="#ef4444" size={12} /> : <FaRegHeart size={12} />} Add to Wishlist
                </button>
                <button style={{ flex: 0, background: 'transparent', border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, color: PAGE_TEXT, fontSize: '0.76rem', fontWeight: 600, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <FaCode size={11} /> Share
                </button>
              </div>

              {/* Market Insight mini box */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1040 100%)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FaChartLine size={13} color="#818cf8" />
                    <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>Market Insight</span>
                  </div>
                  {(miniInsight?.status || true) && (
                    <span style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 20, color: '#4ade80', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px' }}>
                      {miniInsight?.status || 'In Demand'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <FaBriefcase size={9} color="#818cf8" />
                      <span style={{ color: '#6b7280', fontSize: '0.62rem', fontWeight: 600 }}>Jobs Available</span>
                    </div>
                    <div style={{ color: '#ff7a00', fontWeight: 800, fontSize: '1rem' }}>{miniInsight?.jobs || '2,400+'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <FaChartLine size={9} color="#22c55e" />
                      <span style={{ color: '#6b7280', fontSize: '0.62rem', fontWeight: 600 }}>Average Salary</span>
                    </div>
                    <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.82rem' }}>{miniInsight?.salary || '₹6–12 LPA'}</div>
                  </div>
                </div>
                {/* Top Hiring Companies */}
                {(miniInsight?.companies?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#6b7280', fontSize: '0.62rem', fontWeight: 600, marginBottom: 6 }}>TOP HIRING COMPANIES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {miniInsight!.companies!.map((c, i) => {
                        const colors = ['#4f46e5','#0891b2','#059669','#b45309','#be185d']
                        return (
                          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 8px', color: '#d1d5db', fontSize: '0.7rem', fontWeight: 500 }}>
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: colors[i % colors.length], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.5rem', fontWeight: 800, flexShrink: 0 }}>{c.charAt(0)}</span>
                            {c}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowMarketInsight(true)}
                  style={{ width: '100%', background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.76rem', padding: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FaChartLine size={11} /> View Detailed Market Insight →
                </button>
              </div>
            </div>

            {/* ── CENTER PANEL ── */}
            <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }} className="cd-panel-scroll">
              <div style={{ flex: 1, padding: '24px 28px' }}>

                {/* Overview tab */}
                {activeTab === 'Overview' && (
                  <div>
                    <h5 style={{ fontWeight: 700, color: PAGE_TEXT, marginBottom: 16 }}>About this course</h5>
                    <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, padding: '20px 24px', color: PAGE_TEXT, lineHeight: 1.8, fontSize: '0.87rem' }}>
                      {description ? (
                        <div dangerouslySetInnerHTML={{ __html: cleanDescription }} />
                      ) : (
                        <p style={{ color: PAGE_GRAY, margin: 0 }}>{shortDescription || 'No description available.'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Curriculum tab — flat list, no accordion */}
                {activeTab === 'Curriculum' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <h5 style={{ fontWeight: 700, color: PAGE_TEXT, marginBottom: 4 }}>Course Curriculum</h5>
                      <p style={{ color: PAGE_GRAY, fontSize: '0.79rem', margin: 0 }}>
                        {videos.length} {videos.length === 1 ? 'Lecture' : 'Lectures'}{duration ? ` • ${duration} Total Length` : ''}
                      </p>
                    </div>

                    {videos.length > 0 ? (
                      <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                        {videos.map((video, index) => {
                          const label = video.description || `Lecture ${index + 1}`
                          return (
                            <div
                              key={getVideoId(video, index)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '13px 18px',
                                borderBottom: index < videos.length - 1 ? `1px solid ${PAGE_BORDER}` : 'none',
                                background: CARD_BG,
                              }}
                            >
                              {/* Play icon */}
                              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FaPlay size={9} color="#94a3b8" style={{ marginLeft: 1 }} />
                              </div>
                              {/* Label */}
                              <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500, color: PAGE_TEXT, minWidth: 0 }}>
                                {index + 1}. {label}
                              </span>
                              {/* Progress or lock */}
                              {typeof video.progress === 'number' && video.progress > 0 ? (
                                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, flexShrink: 0 }}>{video.progress}%</span>
                              ) : (
                                <IoLockClosedOutline size={13} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '48px 0', color: PAGE_GRAY }}>
                        <FaPlay size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>No curriculum available yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Other tabs placeholder */}
                {(activeTab === 'Instructor' || activeTab === 'Reviews' || activeTab === 'Q&A') && (
                  <div style={{ textAlign: 'center', padding: '64px 0', color: PAGE_GRAY }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'Instructor' ? '👨‍🏫' : activeTab === 'Reviews' ? '⭐' : '💬'}</div>
                    <p style={{ fontWeight: 600, color: PAGE_TEXT, marginBottom: 4 }}>{activeTab}</p>
                    <p style={{ fontSize: '0.82rem', margin: 0 }}>Coming soon</p>
                  </div>
                )}
              </div>

              {/* Bottom trust strip */}
              <div style={{ flexShrink: 0, borderTop: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '14px 24px' }}>
                {[
                  { icon: '🛡️', title: '30-Day Money Back Guarantee', sub: 'No Questions Asked' },
                  { icon: '♾️', title: 'Lifetime Access', sub: 'Learn at your own pace' },
                  { icon: '👥', title: 'Trusted by 50,000+ Students', sub: '4.7/5 Average Rating' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: i < 2 ? `1px solid ${PAGE_BORDER}` : 'none' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: PAGE_TEXT }}>{item.title}</div>
                      <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ width: 310, minWidth: 310, maxWidth: 310, background: CARD_BG, borderLeft: `1px solid ${PAGE_BORDER}`, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }} className="cd-panel-scroll">

              {/* This Course Includes */}
              <div>
                <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem', marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${PAGE_BORDER}` }}>This Course Includes</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {([
                    { icon: '▶', text: `${duration || '—'} Hr on-demand video`, color: '#ff7a00' },
                    { icon: '≡', text: `${totalLectures || videos.length || 0} Lectures`, color: '#ff7a00' },
                    { icon: '⏱', text: 'Full Lifetime Access', color: '#ff7a00' },
                    { icon: '📱', text: 'Access on Mobile & TV', color: '#ff7a00' },
                    { icon: '✓', text: 'Certificate of Completion', color: '#ff7a00' },
                  ] as { icon: string; text: string; color: string }[]).map(({ icon, text, color }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: `rgba(255,122,0,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color, flexShrink: 0, fontWeight: 700 }}>{icon}</span>
                      <span style={{ fontSize: '0.78rem', color: PAGE_TEXT }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Details */}
              <div>
                <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem', marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${PAGE_BORDER}` }}>Course Details</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { label: 'Level', value: clean(level) || 'All Levels' },
                    { label: 'Duration', value: duration || 'N/A' },
                    { label: 'Language', value: clean(language) || 'English' },
                    { label: 'Certificate', value: 'Yes' },
                    ...(hasOriginalPrice ? [{ label: 'Price', value: effectivePrice === 0 ? 'Free' : `₹${formatRupee(effectivePrice)}` }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: PAGE_GRAY }}>{label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: PAGE_TEXT, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What you'll learn */}
              {courseFeatures.length > 0 && (
                <div>
                  <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem', marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${PAGE_BORDER}` }}>What you'll learn</h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {courseFeatures.map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <FaCheck size={10} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: '0.77rem', color: PAGE_TEXT, lineHeight: 1.5 }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          {!previewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', gap: 12 }}>
              <FaPlay size={40} style={{ opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No preview video available for this course.</p>
            </div>
          ) : previewUrl.includes('youtube') || previewUrl.includes('youtu.be') ? (
            <div className="ratio ratio-16x9">
              <iframe src={previewUrl.replace('watch?v=', 'embed/')} title="Course Preview" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          ) : (
            <video src={previewUrl} controls autoPlay style={{ width: '100%', height: '100%' }} />
          )}
        </Modal.Body>
      </Modal>

      <style>{`
/* ── Detail modal fullscreen ── */
.cd-modal .modal-dialog { margin: 0; width: 100vw; max-width: 100vw; height: 100vh; }
.cd-modal .modal-content { width: 100vw; height: 100vh; border-radius: 0; border: none; overflow: hidden; }
.cd-modal .modal-body { padding: 0; overflow: hidden; }

/* ── Hide scrollbars on all panels but keep scroll functional ── */
.cd-panel-scroll { scrollbar-width: none; -ms-overflow-style: none; }
.cd-panel-scroll::-webkit-scrollbar { display: none; }

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
        onHide={handleCloseMarketInsight}
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
  salarySource?: 'adzuna' | 'ai_estimate'
  salarySampleSize?: number
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
  liveJobs?: { title: string; company: string; location: string; salary: string | null; applyUrl: string; postedAt: string | null }[]
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
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid #1e1e1e', fontSize: '0.65rem', color: '#4b5563' }}>
                      {data.salarySource === 'adzuna'
                        ? `📡 Based on ${data.salarySampleSize || 'live'} real job postings (Adzuna, India)`
                        : '🤖 AI estimate — not sourced from live job market data'}
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

                {/* ══ SECTION 7 — Live job openings ══ */}
                {data.liveJobs && data.liveJobs.length > 0 && (
                  <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.15rem' }}>💼 Live job openings</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.85rem' }}>Real, currently open roles for this technology (via Adzuna, India)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {data.liveJobs.map((job, i) => (
                        <a
                          key={i}
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                            background: '#1a1a1a', border: '1px solid #252525', borderRadius: '10px',
                            padding: '0.65rem 0.9rem', textDecoration: 'none',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                            <div style={{ color: '#8b8f98', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                              {job.company} · {job.location}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                            {job.salary && (
                              <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>{job.salary}</span>
                            )}
                            <span style={{ color: '#3b82f6', fontSize: '0.72rem', fontWeight: 700 }}>Apply →</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══ SECTION 8 — Certifications ══ */}
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
