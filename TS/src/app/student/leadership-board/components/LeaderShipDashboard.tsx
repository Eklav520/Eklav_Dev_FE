import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Col, Form, Row, Badge, Spinner, Alert, Button } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaSearch, FaCrown, FaTrophy, FaMedal, FaAward } from 'react-icons/fa'

const ITEMS_PER_PAGE = 5
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

type ApiStudent = {
  _id: string
  fullName?: string
  username?: string
  college?: string
  email?: string
  profileImage?: string
  score: number
  skills?: string[]
}

type UIStudent = {
  id: string
  name: string
  score: number
  bio: string
  badges: string[]
  profileImage?: string
  skills: string[]
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <FaCrown />
    case 2:
      return <FaTrophy />
    case 3:
      return <FaMedal />
    default:
      return <FaAward />
  }
}

const Leaderboard: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const [students, setStudents] = useState<UIStudent[]>([])

  // theme reactive
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    const attr = document.documentElement.getAttribute('data-bs-theme')
    if (attr) return attr === 'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-bs-theme') {
          const val = root.getAttribute('data-bs-theme')
          setIsDarkMode(val === 'dark')
        }
      }
    })
    mo.observe(root, { attributes: true, attributeFilter: ['data-bs-theme'] })
    const mm = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    const onMedia = (e: MediaQueryListEvent | MediaQueryList) => {
      if (!root.getAttribute('data-bs-theme')) setIsDarkMode(Boolean((e as MediaQueryList).matches))
    }
    if (mm) {
      if (typeof mm.addEventListener === 'function') mm.addEventListener('change', onMedia as any)
      else if (typeof mm.addListener === 'function') mm.addListener(onMedia as any)
    }
    return () => {
      mo.disconnect()
      if (mm) {
        if (typeof mm.removeEventListener === 'function') mm.removeEventListener('change', onMedia as any)
        else if (typeof mm.removeListener === 'function') mm.removeListener(onMedia as any)
      }
    }
  }, [])

  // fetch leaderboard
  useEffect(() => {
    let abort = false
    const fetchLeaderboard = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/profiles/leaderboard?limit=200`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: { count: number; items: ApiStudent[] } = await res.json()

        const mapped: UIStudent[] = (data.items || []).map((p) => {
          const scoreNum = Math.max(0, Math.min(100, Number(p.score) || 0))
          const name = p.fullName?.trim() ? p.fullName : p.username || 'Unknown'
          const bio = p.college || p.email || ''
          const skills = Array.isArray(p.skills) ? p.skills.filter(Boolean).slice(0, 3) : []
          return {
            id: p._id,
            name,
            score: scoreNum,
            bio,
            skills,
            badges: scoreNum >= 90 ? ['Top Scorer'] : scoreNum >= 75 ? ['Great Performer'] : scoreNum >= 60 ? ['Consistent'] : ['Keep Going'],
            profileImage: p.profileImage,
          }
        })

        mapped.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        if (!abort) setStudents(mapped)
      } catch (e: any) {
        console.error(e)
        if (!abort) setError(e?.message || 'Failed to load leaderboard')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    fetchLeaderboard()
    return () => {
      abort = true
    }
  }, [token])

  // search + pagination
  const filteredStudents = useMemo(
    () =>
      students
        .filter((s) => {
          if (s.score <= 0) return false
          const q = searchTerm.toLowerCase()
          return (
            s.name.toLowerCase().includes(q) ||
            s.bio.toLowerCase().includes(q) ||
            s.skills.some((sk) => sk.toLowerCase().includes(q))
          )
        })
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    [students, searchTerm],
  )

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE))
    if (currentPage > maxPage) {
      setCurrentPage(1)
    }
  }, [filteredStudents.length, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))
  const gotoPage = (n: number) => setCurrentPage(Math.min(Math.max(1, n), totalPages))

  // colors
  const pageBg = isDarkMode ? '#0f1315' : '#f6f8fb'
  const containerBg = isDarkMode ? '#111418' : '#ffffff'
  const rowBg = isDarkMode ? 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.01))' : '#fff'
  const subtleBorderDark = 'rgba(255,255,255,0.06)'
  const subtleBorderLight = 'rgba(16,24,40,0.06)'
  const nameColor = isDarkMode ? '#ffffff' : '#0f1724'
  const metaColor = isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,36,0.6)'
  const mutedText = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,36,0.45)'
  const scoreColor = '#ff7a00'
  const badgePrimary = isDarkMode ? { backgroundColor: '#0b74d6', color: '#fff' } : { backgroundColor: '#0d6efd', color: '#fff' }
  const badgeSecondary = isDarkMode ? { backgroundColor: '#6c6f73', color: '#fff' } : { backgroundColor: '#8b8f95', color: '#fff' }
  const skillChipStyle = isDarkMode
    ? { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.16)' }
    : { backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid rgba(16,24,40,0.08)' }
  const pointsBoxBg = isDarkMode ? 'linear-gradient(180deg,#0f1416,#0a0c0d)' : '#ffffff'
  const pointsBoxBorder = isDarkMode ? subtleBorderDark : subtleBorderLight
  const pointsBoxShadow = isDarkMode ? '0 8px 30px rgba(5,8,10,0.6)' : '0 6px 18px rgba(16,24,40,0.06)'
  const topScorerBadgeStyle = isDarkMode
    ? {
        background: 'linear-gradient(180deg, rgba(255,122,0,0.25), rgba(255,122,0,0.12))',
        color: '#ffb066',
        border: '1px solid rgba(255,122,0,0.5)',
        boxShadow: '0 4px 14px rgba(255,122,0,0.25)',
      }
    : {
        background: 'linear-gradient(180deg, #fff2e6, #ffd9bf)',
        color: '#cc5200',
        border: '1px solid #ffb380',
        boxShadow: '0 6px 16px rgba(255,122,0,0.2)',
      }

  return (
    <div style={{ background: pageBg, padding: '12px 4px', borderRadius: 12 }}>
      <Card className="border-0" style={{ background: 'transparent' }}>
        <CardHeader className="border-0 pb-0 bg-transparent">
          <Row className="align-items-center g-3">
            <Col xs={12} md={6}>
              <div className="d-flex flex-column">
                <h3
                  className="mb-1 fw-bold d-flex flex-wrap align-items-center gap-2"
                  style={{
                    color: '#ff7a00',
                    fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
                  }}
                >
                  Leadership Board
                  <Badge bg="warning" text="dark" style={{ fontSize: '0.55rem', padding: '0.35rem 0.5rem' }}>
                    Premium version will enable to attend the exams
                  </Badge>
                </h3>
                <small style={{ color: mutedText, fontSize: 'clamp(0.75rem, 3vw, 0.85rem)' }}>
                  Top performing students
                </small>
              </div>
            </Col>

            <Col xs={12} md={6}>
              <Form className="rounded position-relative" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="form-control pe-5"
                  type="search"
                  placeholder="Search by name, college, or skill..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  style={{
                    borderRadius: '30px',
                    background: isDarkMode ? '#0b0d0e' : '#fff',
                    border: isDarkMode ? `1px solid ${subtleBorderDark}` : `1px solid ${subtleBorderLight}`,
                    color: isDarkMode ? 'rgba(255,255,255,0.92)' : '#0f1724',
                    paddingRight: 48,
                    fontSize: 'clamp(0.85rem, 3vw, 0.9rem)',
                    padding: '0.6rem 1rem',
                  }}
                />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0"
                  type="submit"
                  aria-label="Search"
                  style={{ right: '12px' }}>
                  <FaSearch style={{ 
                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,36,0.55)', 
                    fontSize: 'clamp(0.85rem, 3vw, 0.9rem)' 
                  }} />
                </button>
              </Form>
            </Col>
          </Row>
        </CardHeader>

        <CardBody className="pt-3 px-2 px-md-3" style={{ background: 'transparent' }}>
          {loading && (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" role="status" />
            </div>
          )}
          {!!error && !loading && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Row className="g-2 g-md-3">
              <Col xs={12}>
                <div className="p-2 p-md-3 rounded-4" style={{ background: containerBg, borderRadius: 12 }}>
                  {paginatedStudents.length === 0 ? (
                    <div className="text-center py-4" style={{ color: mutedText }}>
                      No students found
                    </div>
                  ) : (
                    paginatedStudents.map((stu, idx) => {
                      const rank = startIndex + idx + 1
                      const initials = stu.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      const leftBorderColor =
                        rank === 1 ? '#f6c700' : rank === 2 ? '#9aa0a6' : rank === 3 ? '#cd7f32' : isDarkMode ? '#2f3336' : '#e6e9ee'

                      const avatarUrl = stu.profileImage
                        ? stu.profileImage.startsWith('/uploads')
                          ? `${API_BASE}${stu.profileImage}`
                          : stu.profileImage
                        : ''

                      return (
                        <div
                          key={stu.id}
                          className="student-row leaderboard-row d-flex flex-column mb-2 p-3 rounded-4"
                          style={{
                            background: rowBg,
                            borderLeft: `4px solid ${leftBorderColor}`,
                            transition: 'transform 0.15s ease',
                            border: `1px solid ${isDarkMode ? subtleBorderDark : subtleBorderLight}`,
                            gap: '8px',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                          
                          {/* Top Row: Rank, Avatar, Name, and Score */}
                          <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                              {/* Rank Icon */}
                              <div
                                className="rank-icon"
                                style={{
                                  width: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: leftBorderColor,
                                  flexShrink: 0,
                                  marginRight: 8,
                                }}
                              >
                                {rank <= 3 ? (
                                  <div style={{ fontSize: 'clamp(0.9rem, 3vw, 1.1rem)' }}>
                                    {getRankIcon(rank)}
                                  </div>
                                ) : (
                                  <span className="fw-bold" style={{ color: mutedText, fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>
                                    {rank}
                                  </span>
                                )}
                              </div>

                              {/* Avatar */}
                              <div
                                className="me-2 me-md-3"
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f1f3f5',
                                  color: isDarkMode ? '#fff' : '#222',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'transparent'}`,
                                  overflow: 'hidden',
                                  position: 'relative',
                                  flexShrink: 0,
                                }}>
                                {avatarUrl && avatarUrl.trim() !== '' ? (
                                  <img
                                    src={avatarUrl}
                                    alt={stu.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    onError={(e) => {
                                      ; (e.currentTarget as HTMLImageElement).style.display = 'none'
                                      const initialsEl = e.currentTarget.parentElement?.querySelector('.initials') as HTMLElement
                                      if (initialsEl) initialsEl.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="initials"
                                  style={{
                                    display: !avatarUrl ? 'flex' : 'none',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                  {initials}
                                </span>
                              </div>

                              {/* Name and Rank Info */}
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div className="fw-semibold text-truncate" style={{ 
                                  color: nameColor, 
                                  fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)', 
                                  lineHeight: 1.2 
                                }}>
                                  {stu.name}
                                </div>
                                <div className="small text-truncate" style={{ 
                                  color: metaColor, 
                                  fontSize: 'clamp(0.7rem, 2.8vw, 0.8rem)' 
                                }}>
                                  {ordinal(rank)} place • {stu.bio || 'Student'}
                                </div>
                              </div>
                            </div>

                            {/* Score Box */}
                            <div
                              aria-hidden
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 6px',
                                borderRadius: 8,
                                minWidth: '65px',
                                height: '46px',
                                boxShadow: pointsBoxShadow,
                                border: `1px solid ${pointsBoxBorder}`,
                                background: pointsBoxBg,
                                flexShrink: 0,
                                marginLeft: '6px',
                              }}>
                              <div style={{ fontSize: '8px', color: mutedText, whiteSpace: 'nowrap' }}>Score/100</div>
                              <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 4vw, 18px)', color: scoreColor }}>
                                {Math.round(stu.score)}
                              </div>
                            </div>
                          </div>

                          {/* Middle Row: Badges */}
                          <div className="d-flex flex-wrap align-items-center gap-1 w-100">
                            {rank === 1 && stu.score > 0 && (
                              <span
                                className="top-scorer-badge d-inline-flex align-items-center"
                                style={{
                                  ...topScorerBadgeStyle,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 999,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  letterSpacing: 0.2,
                                  lineHeight: 1,
                                }}
                                title="Top Scorer">
                                <FaCrown style={{ marginRight: 4, fontSize: '0.6rem' }} />
                                Top Scorer
                              </span>
                            )}

                            {stu.badges
                              .filter((b) => b.toLowerCase() !== 'top scorer')
                              .map((badge, i) => (
                                <Badge
                                  key={`badge-${i}`}
                                  bg={undefined}
                                  className="badge-compact"
                                  style={{
                                    fontSize: '0.6rem',
                                    padding: '0.2rem 0.4rem',
                                    fontWeight: 600,
                                    letterSpacing: 0.1,
                                    borderRadius: 999,
                                    ...(i % 2 === 0 ? badgePrimary : badgeSecondary),
                                  }}>
                                  {badge}
                                </Badge>
                              ))}
                          </div>

                          {/* Bottom Row: Skills */}
                          {!!stu.skills.length && (
                            <div className="w-100">
                              <div className="small" style={{ 
                                color: mutedText, 
                                marginBottom: '4px', 
                                fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)' 
                              }}>
                                Skills:
                              </div>
                              <div className="d-flex flex-wrap gap-1">
                                {stu.skills.map((skill, i) => (
                                  <Badge
                                    key={`skill-${i}`}
                                    bg={undefined}
                                    style={{
                                      fontSize: 'clamp(0.6rem, 2.3vw, 0.7rem)',
                                      padding: '0.2rem 0.5rem',
                                      fontWeight: 600,
                                      borderRadius: 999,
                                      ...skillChipStyle,
                                    }}>
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </Col>
            </Row>
          )}

          {!loading && !error && filteredStudents.length > 0 && (
            <div
              className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 mt-md-4 pt-2 pt-md-3"
              style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(16,24,40,0.04)'}` }}>
              <p className="mb-2 mb-sm-0 small" style={{ 
                color: mutedText, 
                fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)' 
              }}>
                Showing <strong style={{ color: isDarkMode ? '#fff' : '#0f1724' }}>{filteredStudents.length}</strong> student
                {filteredStudents.length !== 1 ? 's' : ''}
              </p>
              
              {/* Mobile-friendly pagination */}
              <nav aria-label="Page navigation bottom">
                <ul className="pagination pagination-sm mb-0" style={{ gap: 2 }}>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-start-pill" 
                      onClick={goPrev} 
                      disabled={currentPage === 1} 
                      style={{ 
                        padding: '0.3rem 0.5rem',
                        minWidth: '32px',
                        fontSize: '0.8rem'
                      }}>
                      <FaAngleLeft />
                    </button>
                  </li>
                  
                  {/* Show fewer page numbers on mobile */}
                  {[...Array(totalPages)].slice(0, 3).map((_, idx) => (
                    <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => gotoPage(idx + 1)} 
                        style={{ 
                          padding: '0.3rem 0.5rem', 
                          minWidth: '32px',
                          fontSize: '0.8rem'
                        }}>
                        {idx + 1}
                      </button>
                    </li>
                  ))}
                  
                  {totalPages > 3 && (
                    <>
                      <li className="page-item disabled">
                        <button className="page-link" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                          ...
                        </button>
                      </li>
                      <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => gotoPage(totalPages)} 
                          style={{ 
                            padding: '0.3rem 0.5rem', 
                            minWidth: '32px',
                            fontSize: '0.8rem'
                          }}>
                          {totalPages}
                        </button>
                      </li>
                    </>
                  )}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link rounded-end-pill"
                      onClick={goNext}
                      disabled={currentPage === totalPages}
                      style={{ 
                        padding: '0.3rem 0.5rem',
                        minWidth: '32px',
                        fontSize: '0.8rem'
                      }}>
                      <FaAngleRight />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </CardBody>
      </Card>

      <style>{`
        .rank-icon svg {
          font-size: 1rem;
        }

        .pagination .page-link {
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .top-scorer-badge {
          transition: box-shadow .2s ease, transform .12s ease;
        }

        .top-scorer-badge:hover {
          box-shadow: 0 6px 22px rgba(255,215,0,0.22);
          transform: translateY(-1px);
        }

        /* Mobile-specific responsive styles */
        @media (max-width: 768px) {
          .leaderboard-row {
            padding: 12px !important;
            margin-bottom: 8px !important;
          }

          .rank-icon {
            min-width: 24px !important;
          }

          .rank-icon svg {
            font-size: 0.9rem !important;
          }

          .rank-icon span {
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 576px) {
          .leaderboard-row {
            padding: 10px !important;
          }

          .rank-icon {
            min-width: 22px !important;
          }

          .rank-icon svg {
            font-size: 0.8rem !important;
          }

          .rank-icon span {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 400px) {
          .leaderboard-row {
            padding: 8px !important;
          }

          .leaderboard-row > div:first-child > div:first-child > div:nth-child(2) {
            width: 32px !important;
            height: 32px !important;
            margin-right: 6px !important;
          }

          .leaderboard-row > div:first-child > div:last-child {
            min-width: 55px !important;
            height: 40px !important;
            padding: 2px 4px !important;
          }

          .leaderboard-row > div:first-child > div:last-child div:first-child {
            font-size: 7px !important;
          }

          .leaderboard-row > div:first-child > div:last-child div:last-child {
            font-size: 13px !important;
          }
        }

        /* Ensure text truncation works */
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Prevent horizontal overflow */
        .leaderboard-row {
          box-sizing: border-box;
          width: 100%;
        }

        .pagination .page-item.active .page-link {
          background-color: #ff7a00 !important;
          border-color: #ff7a00 !important;
          color: #fff !important;
        }

        .pagination .page-link:hover {
          color: #ff7a00;
        }

        .form-control:focus {
          border-color: #ff7a00 !important;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25) !important;
        }

        /* Touch-friendly improvements */
        .page-link {
          touch-action: manipulation;
          cursor: pointer;
          user-select: none;
        }

        .page-link:active {
          transform: scale(0.95);
        }

        /* Better spacing for mobile */
        .gap-2 {
          gap: 0.5rem !important;
        }

        @media (max-width: 576px) {
          .gap-2 {
            gap: 0.35rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Leaderboard