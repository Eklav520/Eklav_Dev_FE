import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useMemo, useState } from 'react'
import { FaAngleLeft, FaAngleRight, FaSearch, FaStar, FaRegClock, FaChartLine, FaGlobe, FaListUl } from 'react-icons/fa'
import { BsSortDown } from 'react-icons/bs'
import CourseCard from './CourseCard'

interface Course {
  image: any
  totalLectures: number
  _id: string
  title: string
  description: string
  shortDescription?: string
  videos: { url: string; description: string }[]
  averageRating?: number
  totalRatings?: number
  category?: string[] | string
  level?: string
  language?: string
  duration?: string
  features?: string
  price?: string
  discountPrice?: string
  isFeatured?: string
  badge?: { text?: string; class?: string }
  updatedAt?: string
  createdAt?: string
  courseType?: string
  courseStatus?: string
}

const ACCENT = '#ff7a00'
const SORT_OPTIONS = ['Most Popular', 'Newest', 'Highest Rated', 'Oldest']
const ITEMS_PER_PAGE = 8

const getCategories = (category?: string[] | string): string[] => {
  if (!category) return []
  if (Array.isArray(category)) return category.map(c => c.replace(/"/g, '').trim()).filter(Boolean)
  try {
    const p = JSON.parse(category)
    return Array.isArray(p) ? p.map((c: string) => c.replace(/"/g, '').trim()).filter(Boolean) : [String(p).replace(/"/g, '').trim()]
  } catch {
    return category.split(',').map(c => c.replace(/"/g, '').trim()).filter(Boolean)
  }
}

const CourseThumbnail = ({ course }: { course: Course }) => {
  const imgSrc = course.image
    ? (course.image.includes('s3.') || course.image.startsWith('http')
      ? course.image
      : `https://eklav-videos.s3.eu-north-1.amazonaws.com/images/${course.image}`)
    : null
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title || 'Course')}`
  const [failed, setFailed] = useState(false)

  return (
    <div style={{ width: 160, minWidth: 160, height: 120, borderRadius: 10, overflow: 'hidden', background: '#1c1c1c', flexShrink: 0 }}>
      <img
        src={!failed && imgSrc ? imgSrc : fallback}
        onError={() => setFailed(true)}
        alt={course.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}

const formatCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)

const StarRating = ({ rating, count }: { rating: number; count: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <FaStar size={14} color="#f59e0b" />
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{rating.toFixed(1)}</span>
    </div>
    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({formatCount(count)} Reviews)</span>
  </div>
)

// Each course row with separate state for both modals
const CourseRowItem = ({ course }: { course: any }) => {
  const [openDetails, setOpenDetails] = useState(false)
  const [openMarket, setOpenMarket] = useState(false)
  const cats = getCategories(course.category)
  const rating = course.averageRating || 0
  const reviewCount = course.totalRatings || 0

  const lang = (() => {
    const l = course.language
    if (!l) return ''
    if (Array.isArray(l)) return l[0] || ''
    try { const p = JSON.parse(l); return Array.isArray(p) ? p[0] : String(p) }
    catch { return String(l).replace(/[\[\]"]/g, '').trim() }
  })()

  const price = course.price ? `₹${Number(course.price).toLocaleString('en-IN')}` : ''
  const lectures = course.totalLectures ? String(course.totalLectures) : (course.videos?.length ? String(course.videos.length) : '')

  const cardCourse = {
    ...course,
    totalLectures: course.totalLectures != null ? String(course.totalLectures) : String(course.videos?.length ?? 0),
    videos: (course.videos || []).map((v: any, idx: number) => ({
      _id: v?._id ?? String(idx), url: v?.url, video: v?.video,
      description: v?.description ?? '', progress: v?.progress,
    })),
  }

  return (
    <>
      <div
        style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24,
          transition: 'box-shadow 0.18s, border-color 0.18s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.09)'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'
        }}
      >
        {/* Thumbnail */}
        <CourseThumbnail course={course} />

        {/* Middle: title, description, badges */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h6 style={{
            fontSize: '0.93rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.35,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as any,
          }}>
            {course.title}
          </h6>
          <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.55, maxHeight: '2.4em', overflow: 'hidden' }}>
            {(() => {
              const raw = course.shortDescription || course.description || ''
              const stripped = raw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
              return stripped.length > 130 ? stripped.slice(0, 130) + '…' : stripped || 'No description available.'
            })()}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {course.level && (
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,122,0,0.1)', color: ACCENT, border: `1px solid rgba(255,122,0,0.3)`, borderRadius: 20, padding: '2px 10px' }}>
                {course.level}
              </span>
            )}
            {cats.slice(0, 2).map((c, i) => (
              <span key={i} style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 10px' }}>
                {c}
              </span>
            ))}
            {lang && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px' }}>
                <FaGlobe size={9} /> {lang}
              </span>
            )}
          </div>
        </div>

        {/* Right: 2×2 stats grid + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>

          {/* 2×2 stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '105px 88px', rowGap: 12 }}>

            {/* Row 1 — Rating | Hours */}
            <div style={{ paddingRight: 16, borderRight: '1px solid #e2e8f0' }}>
              {rating > 0
                ? <StarRating rating={rating} count={reviewCount} />
                : <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>No ratings</div>
              }
            </div>
            <div style={{ paddingLeft: 16 }}>
              {course.duration ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaRegClock size={13} color={ACCENT} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                      {String(course.duration).replace(/[^0-9.]+/g, '') || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Hours</div>
                </>
              ) : <div />}
            </div>

            {/* Row 2 — Lectures | Price */}
            <div style={{ paddingRight: 16, borderRight: '1px solid #e2e8f0' }}>
              {lectures ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaListUl size={11} color={ACCENT} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{lectures}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Lectures</div>
                </>
              ) : <div />}
            </div>
            <div style={{ paddingLeft: 16 }}>
              {price ? (
                <>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>{price}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Price</div>
                </>
              ) : <div />}
            </div>

          </div>

          <button
            onClick={() => setOpenMarket(true)}
            style={{
              background: 'transparent', border: `1.5px solid ${ACCENT}`, borderRadius: 8,
              color: ACCENT, fontSize: '0.75rem', fontWeight: 700,
              padding: '7px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ACCENT; (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = ACCENT }}
          >
            <FaChartLine size={11} /> Market Insight
          </button>

          <button
            onClick={() => setOpenDetails(true)}
            style={{
              background: ACCENT, border: 'none', borderRadius: 8,
              color: '#fff', fontSize: '0.75rem', fontWeight: 700,
              padding: '7px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            View Details →
          </button>
        </div>
      </div>

      {/* CourseCard renders modals only (card UI hidden via hideCard prop) */}
      <CourseCard
        course={cardCourse}
        hideCard
        open={openDetails}
        openMarketInsight={openMarket}
        onClose={() => setOpenDetails(false)}
        onCloseMarketInsight={() => setOpenMarket(false)}
      />
    </>
  )
}

const CoursesList = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [courses, setCourses] = useState<Course[]>([])
  const { user } = useAuthContext()
  const token = user?.token
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Most Popular')
  const [showSortMenu, setShowSortMenu] = useState(false)

  useEffect(() => {
    if (!token) return
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${baseURL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const withRatings = await Promise.all(
          data.map(async (course: Course) => {
            try {
              const r = await fetch(`${baseURL}/courses/${course._id}/ratings`, { headers: { Authorization: `Bearer ${token}` } })
              if (r.ok) {
                const rd = await r.json()
                return { ...course, averageRating: rd.averageRating, totalRatings: rd.ratingCount }
              }
              return { ...course, averageRating: 0, totalRatings: 0 }
            } catch { return { ...course, averageRating: 0, totalRatings: 0 } }
          })
        )
        setCourses(withRatings)
      } catch { setCourses([]) }
      finally { setLoading(false) }
    }
    fetchCourses()
  }, [baseURL, token])

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    courses.forEach(c => getCategories(c.category).forEach(cat => cats.add(cat)))
    return ['All', ...Array.from(cats).slice(0, 8)]
  }, [courses])

  const extraCategories = useMemo(() => {
    const cats = new Set<string>()
    courses.forEach(c => getCategories(c.category).forEach(cat => cats.add(cat)))
    return Array.from(cats).slice(8)
  }, [courses])

  const filtered = useMemo(() => {
    let list = courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.shortDescription || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = activeCategory === 'All' || getCategories(c.category).some(cat =>
        cat.toLowerCase() === activeCategory.toLowerCase()
      )
      return matchSearch && matchCat
    })
    if (sortBy === 'Highest Rated') list = [...list].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    else if (sortBy === 'Newest') list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    else if (sortBy === 'Oldest') list = [...list].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    else list = [...list].sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0))
    return list
  }, [courses, searchTerm, activeCategory, sortBy])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const goTo = (p: number) => {
    setCurrentPage(Math.max(1, Math.min(p, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }, [currentPage, totalPages])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div className="spinner-border" style={{ color: ACCENT }} role="status" />
      <p style={{ marginTop: 12, color: '#64748b' }}>Loading courses...</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>All Courses</h4>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Explore our wide range of courses and start learning today!</p>
      </div>

      {/* Category tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1) }}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                background: activeCategory === cat ? ACCENT : '#fff',
                color: activeCategory === cat ? '#fff' : '#475569',
                boxShadow: activeCategory === cat ? `0 2px 8px ${ACCENT}44` : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              {cat}
            </button>
          ))}
          {extraCategories.length > 0 && (
            <button style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#475569', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              More ▾
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FaSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: ACCENT }} />
            <input
              type="search"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.82rem', background: '#fff', color: '#0f172a', outline: 'none', width: 200 }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(s => !s)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, background: '#fff', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <BsSortDown size={14} /> Sort: <strong>{sortBy}</strong> ▾
            </button>
            {showSortMenu && (
              <>
                <div onClick={() => setShowSortMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt}
                      onClick={() => { setSortBy(opt); setShowSortMenu(false); setCurrentPage(1) }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: '0.82rem', border: 'none', background: sortBy === opt ? '#fff7ed' : 'transparent', color: sortBy === opt ? ACCENT : '#475569', fontWeight: sortBy === opt ? 700 : 400, cursor: 'pointer' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Course rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paginated.map(course => (
          <CourseRowItem key={course._id} course={course} />
        ))}
      </div>

      {paginated.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          No courses found{searchTerm ? ` matching "${searchTerm}"` : ''}.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 28 }}>
          <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaAngleLeft size={13} />
          </button>

          {pageNumbers.map((p, i) =>
            p === '...'
              ? <span key={`dots-${i}`} style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0 4px' }}>...</span>
              : (
                <button key={p} onClick={() => goTo(p as number)}
                  style={{ width: 34, height: 34, borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, border: currentPage === p ? 'none' : '1px solid #e2e8f0', background: currentPage === p ? ACCENT : '#fff', color: currentPage === p ? '#fff' : '#475569', cursor: 'pointer' }}>
                  {p}
                </button>
              )
          )}

          <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaAngleRight size={13} />
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.78rem', color: '#94a3b8' }}>
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} courses
        </p>
      )}
    </div>
  )
}

export default CoursesList
