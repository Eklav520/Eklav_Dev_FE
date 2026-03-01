import { CounterType } from '@/types/other'
import { Col, Row, Spinner } from 'react-bootstrap'
import CountUp from 'react-countup'
import { useEffect, useState } from 'react'
import { FaUserGraduate, FaBookOpen, FaVideo } from 'react-icons/fa'
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
      className={`d-flex justify-content-center align-items-center p-4 bg-${variant} bg-opacity-15 rounded-3`}
    >
      <span className={`display-6 text-${variant} mb-0`}>
        {Icon && <Icon size={56} className="fa-fw" />}
      </span>

      <div className="ms-4">
        <h5 className="mb-0 fw-bold">
          <CountUp end={count} suffix={suffix} delay={0.5} />
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

      if (!res.ok) throw new Error('Failed to fetch profile')

      const data = await res.json()
      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
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
      setCounts(data)
    } catch (err) {
      console.error('Failed to fetch college dashboard counts:', err)
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
      setCounts(data)
    } catch (err) {
      console.error('Failed to fetch global dashboard counts:', err)
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
    if (role === 'admin' || role === 'super_admin') {
      fetchAllCounts()
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
    },
    {
      count: counts.courseCount,
      title: 'Courses Available',
      icon: FaBookOpen,
      variant: 'info',
    },
    {
      count: counts.classCount,
      title: 'Live Classes Scheduled',
      icon: FaVideo,
      variant: 'warning',
    },
  ]

  /* ============================
     LOADING STATE
  ============================ */
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <Row className="g-4">
      {data.map((item, idx) => (
        <Col sm={6} lg={4} key={idx}>
          <CounterCard {...item} />
        </Col>
      ))}
    </Row>
  )
}

export default Counter
