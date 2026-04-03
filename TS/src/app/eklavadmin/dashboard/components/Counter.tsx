import { CounterType } from '@/types/other'
import { Col, Row, Spinner, Alert } from 'react-bootstrap'
import CountUp from 'react-countup'
import { useEffect, useState } from 'react'
import { FaUserGraduate, FaBookOpen, FaVideo, FaExclamationTriangle } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ============================
   COUNTER CARD
============================ */
const CounterCard = ({
  count,
  title,
  icon: Icon,
  suffix,
  variant,
}: CounterType) => {
  return (
    <div
      className={`d-flex justify-content-center align-items-center p-4 bg-${variant} bg-opacity-15 rounded-3 h-100 transition-all`}
      style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span className={`display-6 text-${variant} mb-0`}>
        {Icon && <Icon size={56} className="fa-fw" />}
      </span>

      <div className="ms-4">
        <h5 className="mb-0 fw-bold">
          <CountUp 
            end={count} 
            suffix={suffix} 
            delay={0.5}
            duration={2}
            enableScrollSpy
            scrollSpyOnce
          />
        </h5>
        <span className="mb-0 h6 fw-light">{title}</span>
      </div>
    </div>
  )
}

/* ============================
   COUNTER COMPONENT
============================ */
const Counter = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const [counts, setCounts] = useState({
    studentCount: 0,
    courseCount: 0,
    classCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  /* ============================
     FETCH PROFILE
  ============================ */
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized access')
        throw new Error('Failed to fetch profile')
      }

      const data = await res.json()
      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
      setError('Failed to load user profile')
      setLoading(false)
    }
  }

  /* ============================
     FETCH COUNTS (COLLEGE)
  ============================ */
  const fetchCollegeCounts = async (collegeName: string) => {
    try {
      const res = await fetch(
        `${baseURL}/dashboardAdmin?college=${encodeURIComponent(collegeName)}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )

      if (!res.ok) throw new Error('Failed to fetch dashboard counts')

      const data = await res.json()
      setCounts({
        studentCount: data.studentCount || 0,
        courseCount: data.courseCount || 0,
        classCount: data.classCount || 0,
      })
    } catch (err) {
      console.error('Failed to fetch college dashboard counts:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  /* ============================
     FETCH COUNTS (ALL COLLEGES)
  ============================ */
  const fetchAllCounts = async () => {
    try {
      const res = await fetch(`${baseURL}/dashboardAdmin`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch dashboard counts')

      const data = await res.json()
      setCounts({
        studentCount: data.studentCount || 0,
        courseCount: data.courseCount || 0,
        classCount: data.classCount || 0,
      })
    } catch (err) {
      console.error('Failed to fetch global dashboard counts:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  /* ============================
     INITIAL LOAD
  ============================ */
  useEffect(() => {
    if (user?.token) {
      fetchProfile()
    } else {
      setLoading(false)
      setError('Please log in to view dashboard')
    }
  }, [user?.token])

  /* ============================
     ROLE-BASED COUNTS FETCH
  ============================ */
  useEffect(() => {
    if (!role) return

    // College Admin → college-specific dashboard
    if (role === 'college_admin' && college) {
      fetchCollegeCounts(college)
    }
    // Admin / Super Admin → global dashboard
    else if (role === 'admin' || role === 'super_admin') {
      fetchAllCounts()
    }
    // For other roles or missing college
    else {
      setLoading(false)
    }
  }, [role, college])

  /* ============================
     UI DATA
  ============================ */
  const data = [
    {
      count: counts.studentCount,
      title: 'Students Available',
      icon: FaUserGraduate,
      variant: 'success',
      suffix: '',
    },
    {
      count: counts.courseCount,
      title: 'Courses Available',
      icon: FaBookOpen,
      variant: 'info',
      suffix: '',
    },
    {
      count: counts.classCount,
      title: 'Live Classes Scheduled',
      icon: FaVideo,
      variant: 'warning',
      suffix: '',
    },
  ]

  /* ============================
     LOADING STATE
  ============================ */
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Loading dashboard statistics...</p>
      </div>
    )
  }

  /* ============================
     ERROR STATE
  ============================ */
  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        <FaExclamationTriangle size={24} className="mb-2" />
        <p>{error}</p>
        <button 
          className="btn btn-sm btn-outline-danger mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </Alert>
    )
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <>
      <Row className="g-4">
        {data.map((item, idx) => (
          <Col sm={6} lg={4} key={idx}>
            <CounterCard {...item} />
          </Col>
        ))}
      </Row>
      
      {/* Optional: Role indicator */}
      {role && (
        <div className="text-end mt-3">
          <small className="text-muted">
            Viewing as: <span className="text-capitalize">{role.replace('_', ' ')}</span>
            {college && ` • ${college}`}
          </small>
        </div>
      )}
    </>
  )
}

export default Counter