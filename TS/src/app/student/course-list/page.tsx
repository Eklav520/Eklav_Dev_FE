import React, { useEffect, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { useProfile } from '@/app/student/dashboard/components/hooks/useProfile'
import CourseCertificate from './components/CourseCertificate'
import {
  FaPlay, FaStar, FaRegStar, FaStarHalfAlt, FaCheck,
  FaBookOpen, FaTrophy, FaClock, FaAward,
  FaThLarge, FaList, FaSearch,
} from 'react-icons/fa'
import { BsCheckCircleFill, BsLightningFill } from 'react-icons/bs'

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

// ─── Types ──────────────────────────────────────────────────────────────────

type EnrolledCourse = {
  _id: string
  name: string
  image: string
  totalLectures: number
  completedLectures: number   // percentage 0–100
  userRating?: number
  courseRating?: { averageRating: number; totalRatings: number }
  shortDescription?: string
  level?: string
  courseType?: string
  duration?: string
  badge?: string
  category?: string[]
  enrolledAt?: string
  lastAccessedAt?: string
  hoursWatched?: number
  hoursTotal?: number
  hoursRemaining?: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const cleanLevel = (v?: string) => {
  if (!v) return ''
  try { const p = JSON.parse(v); return Array.isArray(p) ? p[0] : String(p) } catch { return v }
}

const formatDuration = (duration?: string, progress = 0) => {
  if (!duration) return null
  const totalHrs = parseFloat(String(duration).replace(/[^0-9.]/g, '')) || 0
  if (!totalHrs) return null
  const doneHrs = totalHrs * (progress / 100)
  const dH = Math.floor(doneHrs)
  const dM = Math.round((doneHrs - dH) * 60)
  return { done: `${dH}h${dM > 0 ? ` ${dM}m` : ''}`, total: `${totalHrs}h` }
}

const relativeDate = (iso?: string) => {
  if (!iso) return null
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Stars ──────────────────────────────────────────────────────────────────

const Stars = ({ rating, count }: { rating: number; count: number }) => {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array(full).fill(0).map((_, i) => <FaStar key={`f${i}`} size={12} color="#f59e0b" />)}
      {half && <FaStarHalfAlt size={12} color="#f59e0b" />}
      {Array(empty).fill(0).map((_, i) => <FaRegStar key={`e${i}`} size={12} color="#f59e0b" />)}
      {count > 0 && <span style={{ fontSize: '0.73rem', color: '#64748b', marginLeft: 4 }}>({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count})</span>}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, sub, iconBg }: {
  icon: React.ReactNode; value: string; label: string; sub: string; iconBg: string
}) => (
  <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color: PAGE_TEXT, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.78rem', color: PAGE_TEXT, lineHeight: 1.4 }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: PAGE_GRAY }}>{sub}</div>
    </div>
  </div>
)

// ─── Rate This Course (interactive) ────────────────────────────────────────

const RateStars = ({ value, onChange, size = 13 }: { value: number; onChange: (r: number) => void; size?: number }) => {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(n) }}
          onMouseEnter={() => setHover(n)}
          style={{ cursor: 'pointer', display: 'flex', lineHeight: 0 }}
        >
          {(hover || value) >= n ? <FaStar size={size} color="#f59e0b" /> : <FaRegStar size={size} color="#f59e0b" />}
        </span>
      ))}
    </div>
  )
}

const RateThisCourse = ({ userRating, onRate }: { userRating?: number; onRate: (r: number) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }} onClick={e => e.stopPropagation()}>
    <span style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 600 }}>
      {userRating ? 'Your rating:' : 'Rate this course:'}
    </span>
    <RateStars value={userRating || 0} onChange={onRate} />
  </div>
)

// ─── Course Row ─────────────────────────────────────────────────────────────

const CourseRow = ({ course, onRate, onCertificate }: { course: EnrolledCourse; onRate: (courseId: string, rating: number) => void; onCertificate: (course: EnrolledCourse) => void }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const pct = Math.round(course.completedLectures)
  const isCompleted = pct >= 100
  const hasStarted = pct > 0
  const level = cleanLevel(course.level)
  const lastAccessed = relativeDate(course.lastAccessedAt)

  // Hours display — prefer API-computed values, fall back to local calc
  const hoursTotal = course.hoursTotal ?? 0
  const hoursWatched = course.hoursWatched ?? 0
  const showHours = hoursTotal > 0
  const fmtHrs = (h: number) => {
    const wH = Math.floor(h); const wM = Math.round((h - wH) * 60)
    return `${wH}h${wM > 0 ? ` ${wM}m` : ''}`
  }

  const imgSrc = course.image?.startsWith('http')
    ? course.image
    : `${baseURL}/uploads/${course.image}`

  const progressColor = isCompleted ? '#16a34a' : '#ff7a00'

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

      {/* Thumbnail */}
      <div style={{ width: 140, minWidth: 140, height: 95, borderRadius: 10, overflow: 'hidden', background: '#1e293b', flexShrink: 0, position: 'relative' }}>
        <img
          src={imgSrc}
          alt={course.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.name)}` }}
        />
        {course.badge && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: '#ff7a00', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            {course.badge}
          </span>
        )}
      </div>

      {/* Course Info — flex:1 fills all remaining space */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.93rem', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {course.name}
        </h6>
        {course.shortDescription && (
          <p style={{ fontSize: '0.73rem', color: PAGE_GRAY, margin: '0 0 8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {course.shortDescription.replace(/<[^>]*>/g, '')}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 7 }}>
          {level && (
            <span style={{ fontSize: '0.67rem', fontWeight: 600, background: 'rgba(255,122,0,0.1)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 20, padding: '2px 9px' }}>
              {level}
            </span>
          )}
          <span style={{ fontSize: '0.67rem', fontWeight: 600, background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '2px 9px' }}>
            Certificate
          </span>
        </div>
        {(course.courseRating?.totalRatings ?? 0) > 0 && (
          <Stars rating={course.courseRating!.averageRating} count={course.courseRating!.totalRatings} />
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: PAGE_BORDER, alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Progress — fixed width */}
      <div style={{ width: 210, minWidth: 210, flexShrink: 0 }}>
        <div style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Progress</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: showHours ? 2 : 4 }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: progressColor, lineHeight: 1 }}>{pct}%</span>
        </div>
        {showHours && (
          <div style={{ fontSize: '0.71rem', color: PAGE_GRAY, marginBottom: 5 }}>
            {fmtHrs(hoursWatched)} / {fmtHrs(hoursTotal)}
          </div>
        )}
        {!showHours && (
          <div style={{ fontSize: '0.71rem', color: PAGE_GRAY, marginBottom: 5 }}>{course.totalLectures} lectures total</div>
        )}
        {/* Progress bar */}
        <div style={{ height: 5, background: PAGE_BORDER, borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: progressColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        {lastAccessed && (
          <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>Last accessed: <strong style={{ color: PAGE_GRAY }}>{lastAccessed}</strong></div>
        )}
        <RateThisCourse userRating={course.userRating} onRate={r => onRate(course._id, r)} />
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: PAGE_BORDER, alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Actions — single button only */}
      <div style={{ flexShrink: 0, minWidth: 170, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isCompleted ? (
          <>
            <a href={`/pages/course/detail-adv/${course._id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{ background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.82rem', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                <FaCheck size={11} /> Completed
              </button>
            </a>
            <button
              onClick={() => onCertificate(course)}
              style={{ background: '#fff7ed', border: '1px solid rgba(255,122,0,0.3)', borderRadius: 8, color: '#ff7a00', fontWeight: 700, fontSize: '0.78rem', padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
            >
              <FaAward size={12} /> Get Certificate
            </button>
          </>
        ) : (
          <a href={`/pages/course/detail-adv/${course._id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.82rem', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', boxShadow: '0 4px 14px rgba(255,122,0,0.28)' }}>
              <FaPlay size={10} /> {hasStarted ? 'Continue Learning' : 'Start Learning'}
            </button>
          </a>
        )}
      </div>
    </div>
  )
}


// ─── Course Grid Card ────────────────────────────────────────────────────────

const CourseGridCard = ({ course, onRate, onCertificate }: { course: EnrolledCourse; onRate: (courseId: string, rating: number) => void; onCertificate: (course: EnrolledCourse) => void }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const pct = Math.round(course.completedLectures)
  const isCompleted = pct >= 100
  const hasStarted = pct > 0
  const level = cleanLevel(course.level)
  const lastAccessed = relativeDate(course.lastAccessedAt)
  const hoursTotal = course.hoursTotal ?? 0
  const hoursWatched = course.hoursWatched ?? 0
  const showHours = hoursTotal > 0
  const fmtHrs = (h: number) => {
    const wH = Math.floor(h); const wM = Math.round((h - wH) * 60)
    return `${wH}h${wM > 0 ? ` ${wM}m` : ''}`
  }
  const imgSrc = course.image?.startsWith('http')
    ? course.image
    : `${baseURL}/uploads/${course.image}`
  const progressColor = isCompleted ? '#16a34a' : '#ff7a00'

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

      {/* Thumbnail */}
      <div style={{ width: '100%', height: 160, position: 'relative', background: '#1e293b', flexShrink: 0 }}>
        <img src={imgSrc} alt={course.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.name)}` }} />
        {course.badge && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff7a00', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            {course.badge}
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: PAGE_BORDER }}>
          <div style={{ height: '100%', width: `${pct}%`, background: progressColor, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
        <h6 style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem', margin: 0, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {course.name}
        </h6>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {level && (
            <span style={{ fontSize: '0.63rem', fontWeight: 600, background: 'rgba(255,122,0,0.1)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 20, padding: '2px 8px' }}>
              {level}
            </span>
          )}
          <span style={{ fontSize: '0.63rem', fontWeight: 600, background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '2px 8px' }}>
            Certificate
          </span>
        </div>

        {(course.courseRating?.totalRatings ?? 0) > 0 && (
          <Stars rating={course.courseRating!.averageRating} count={course.courseRating!.totalRatings} />
        )}

        {/* Progress info */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: progressColor }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: PAGE_BORDER, borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: progressColor, borderRadius: 99 }} />
          </div>
          {showHours ? (
            <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>{fmtHrs(hoursWatched)} / {fmtHrs(hoursTotal)}</div>
          ) : (
            <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>{course.totalLectures} lectures</div>
          )}
          {lastAccessed && (
            <div style={{ fontSize: '0.65rem', color: PAGE_GRAY, marginTop: 3 }}>Last: <strong style={{ color: PAGE_GRAY }}>{lastAccessed}</strong></div>
          )}
          <RateThisCourse userRating={course.userRating} onRate={r => onRate(course._id, r)} />
        </div>

        {/* Button */}
        <a href={`/pages/course/detail-adv/${course._id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginTop: 4 }}>
          <button style={{ background: isCompleted ? '#16a34a' : '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.78rem', padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
            {isCompleted ? <><FaCheck size={10} /> Completed</> : <><FaPlay size={9} /> {hasStarted ? 'Continue' : 'Start Learning'}</>}
          </button>
        </a>
        {isCompleted && (
          <button
            onClick={() => onCertificate(course)}
            style={{ background: '#fff7ed', border: '1px solid rgba(255,122,0,0.3)', borderRadius: 8, color: '#ff7a00', fontWeight: 700, fontSize: '0.74rem', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
          >
            <FaAward size={11} /> Get Certificate
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const CourseListPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const { profile } = useProfile()

  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [certificateCourse, setCertificateCourse] = useState<EnrolledCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'inprogress' | 'completed' | 'wishlist'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState('Recent Access')
  const [searchTerm, setSearchTerm] = useState('')
  const [myRank, setMyRank] = useState<{ rank: number | null; total: number } | null>(null)

  const inProgressCourses = enrolledCourses.filter(c => c.completedLectures > 0 && c.completedLectures < 100)
  const completedCourses = enrolledCourses.filter(c => c.completedLectures >= 100)

  const filteredCourses = enrolledCourses.filter(c => {
    const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeTab === 'inprogress') return matchSearch && c.completedLectures > 0 && c.completedLectures < 100
    if (activeTab === 'completed') return matchSearch && c.completedLectures >= 100
    return matchSearch
  })

  // Compute total learning hours
  const totalLearningHrs = enrolledCourses.reduce((acc, c) => {
    const totalHrs = parseFloat(String(c.duration || '0').replace(/[^0-9.]/g, '')) || 0
    return acc + totalHrs * (c.completedLectures / 100)
  }, 0)
  const totalH = Math.floor(totalLearningHrs)
  const totalM = Math.round((totalLearningHrs - totalH) * 60)

  const fetchEnrolledCourses = async () => {
    setLoading(true)
    setError(null)
    try {
      const [enrollRes, ratingsRes, rankRes] = await Promise.all([
        fetch(`${baseURL}/enrollments/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/courses/ratings/my-ratings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/courses/my-course-rank`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!enrollRes.ok) throw new Error('Failed to fetch enrollments')
      const enrolledData = await enrollRes.json()
      const ratingsData = ratingsRes.ok ? await ratingsRes.json() : []
      if (rankRes.ok) {
        const rankData = await rankRes.json()
        setMyRank({ rank: rankData.rank ?? null, total: rankData.total ?? 0 })
      }

      const ratingsMap: Record<string, number> = {}
      ratingsData.forEach((r: any) => { ratingsMap[r.courseId?._id || r.courseId] = r.rating })

      const formatted: EnrolledCourse[] = enrolledData
        .filter((e: any) => e.courseId)
        .map((e: any) => {
          const c = e.courseId
          const courseId = c._id
          const courseImage = c.image?.startsWith('http') ? c.image : `${baseURL}/uploads/${c.image}`
          return {
            _id: courseId,
            name: c.title || c.name || 'Untitled',
            image: courseImage,
            totalLectures: Number(c.totalLectures || 0),
            completedLectures: Number(e.courseProgress || 0),
            userRating: ratingsMap[courseId],
            courseRating: e.courseRating || { averageRating: c.averageRating || 0, totalRatings: c.totalRatings || 0 },
            shortDescription: c.shortDescription || '',
            level: c.level || '',
            courseType: c.courseType || 'free',
            duration: c.duration || '',
            badge: c.badge?.text || c.isFeatured === 'true' ? 'Bestseller' : '',
            category: Array.isArray(c.category) ? c.category : [],
            enrolledAt: e.createdAt || e.enrolledAt || '',
            lastAccessedAt: e.lastAccessedAt || '',
            hoursWatched: e.hoursWatched ?? 0,
            hoursTotal: e.hoursTotal ?? 0,
            hoursRemaining: e.hoursRemaining ?? 0,
          }
        })

      setEnrolledCourses(formatted)
    } catch (err) {
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchEnrolledCourses() }, [token])

  const handleRate = async (courseId: string, rating: number) => {
    const prev = enrolledCourses
    setEnrolledCourses(cs => cs.map(c => c._id === courseId ? { ...c, userRating: rating } : c))
    try {
      const res = await fetch(`${baseURL}/courses/${courseId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating }),
      })
      if (!res.ok) throw new Error('Failed to submit rating')

      const ratingsRes = await fetch(`${baseURL}/courses/${courseId}/ratings`)
      if (ratingsRes.ok) {
        const { averageRating, ratingCount } = await ratingsRes.json()
        setEnrolledCourses(cs => cs.map(c => c._id === courseId
          ? { ...c, courseRating: { averageRating, totalRatings: ratingCount } }
          : c))
      }
    } catch {
      setEnrolledCourses(prev)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner-border" role="status" style={{ width: 48, height: 48, color: '#ff7a00' }} />
        <p style={{ marginTop: 16, color: PAGE_GRAY }}>Loading your courses...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h5 style={{ color: '#dc3545' }}>Something went wrong</h5>
        <p style={{ color: '#64748b' }}>{error}</p>
        <button onClick={fetchEnrolledCourses} style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, padding: '10px 24px', cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )

  // Counts live only in the Stats Row cards below — the tabs themselves
  // don't repeat them, to avoid showing the same numbers twice on screen.
  const tabs = [
    { key: 'all', label: 'All Courses' },
    { key: 'inprogress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'wishlist', label: 'Wishlist' },
  ] as const

  return (
    <>
      <PageMetaData title="My Enrolled Courses" />

      <div style={{ padding: '4px 0 24px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontWeight: 800, color: PAGE_TEXT, margin: 0 }}>My Enrolled Courses</h4>
          <p style={{ color: PAGE_GRAY, fontSize: '0.85rem', margin: '4px 0 0' }}>Continue your learning journey</p>
        </div>

        {/* ── Tabs + Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  border: activeTab === tab.key ? 'none' : `1.5px solid ${PAGE_BORDER}`,
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === tab.key ? '#ff7a00' : CARD_BG,
                  color: activeTab === tab.key ? '#fff' : PAGE_TEXT,
                  transition: 'all 0.15s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: PAGE_GRAY }} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                style={{ border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: '0.8rem', color: PAGE_TEXT, background: CARD_BG, outline: 'none', width: 200 }}
              />
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              {([['grid', <FaThLarge size={13} />], ['list', <FaList size={13} />]] as [string, React.ReactNode][]).map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode as any)}
                  style={{ padding: '7px 11px', border: 'none', background: viewMode === mode ? '#ff7a00' : CARD_BG, color: viewMode === mode ? '#fff' : PAGE_GRAY, cursor: 'pointer' }}>
                  {icon}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: PAGE_TEXT }}>
              <span style={{ fontWeight: 600 }}>Sort by:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '6px 28px 6px 10px', fontSize: '0.8rem', color: PAGE_TEXT, background: CARD_BG, cursor: 'pointer', outline: 'none', appearance: 'none' }}>
                {['Recent Access', 'Newest', 'Progress', 'Alphabetical'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard
            icon={<FaBookOpen size={20} color="#ff7a00" />}
            value={String(enrolledCourses.length)}
            label="Enrolled Courses"
            sub="Keep learning!"
            iconBg="rgba(255,122,0,0.1)"
          />
          <StatCard
            icon={<BsLightningFill size={20} color="#ff7a00" />}
            value={String(inProgressCourses.length)}
            label="In Progress"
            sub="Keep it up!"
            iconBg="rgba(255,122,0,0.1)"
          />
          <StatCard
            icon={<BsCheckCircleFill size={20} color="#7c3aed" />}
            value={String(completedCourses.length)}
            label="Completed"
            sub="Great job!"
            iconBg="rgba(124,58,237,0.1)"
          />
          <StatCard
            icon={<FaClock size={20} color="#ff7a00" />}
            value={totalH > 0 ? `${totalH}h ${totalM}m` : '—'}
            label="Total Learning Time"
            sub="This Month"
            iconBg="rgba(255,122,0,0.1)"
          />
          <StatCard
            icon={<FaTrophy size={20} color="#eab308" />}
            value={myRank?.rank ? `#${myRank.rank}` : '—'}
            label="Your Rank"
            sub={myRank?.rank ? `Out of ${myRank.total} · by time & completions` : 'Enroll & learn to get ranked!'}
            iconBg="rgba(234,179,8,0.1)"
          />
        </div>

        {/* ── Course List ── */}
        {filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: PAGE_GRAY }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h5 style={{ color: PAGE_TEXT, marginBottom: 8 }}>
              {searchTerm ? 'No courses match your search' : activeTab === 'wishlist' ? 'Your wishlist is empty' : 'No courses here yet'}
            </h5>
            <p style={{ fontSize: '0.85rem' }}>
              {activeTab === 'all' ? "You haven't enrolled in any courses yet." : ''}
            </p>
            {activeTab === 'all' && (
              <button onClick={() => (window.location.href = '/student/available-courses')}
                style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, padding: '10px 24px', cursor: 'pointer', marginTop: 8 }}>
                Browse Courses
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {filteredCourses.map(course => (
              <CourseGridCard key={course._id} course={course} onRate={handleRate} onCertificate={setCertificateCourse} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredCourses.map(course => (
              <CourseRow key={course._id} course={course} onRate={handleRate} onCertificate={setCertificateCourse} />
            ))}
          </div>
        )}
      </div>

      {certificateCourse && (
        <CourseCertificate
          studentName={profile?.fullName || profile?.name || 'Student'}
          courseName={certificateCourse.name}
          courseId={certificateCourse._id}
          studentId={profile?.userId || profile?._id || ''}
          completionDate={certificateCourse.lastAccessedAt}
          onClose={() => setCertificateCourse(null)}
        />
      )}
    </>
  )
}

export default CourseListPage
