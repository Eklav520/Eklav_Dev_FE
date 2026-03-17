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

  /* ============================
     MAIN LOAD (SINGLE FLOW)
  ============================ */
  useEffect(() => {
    if (!user?.token) {
      setLoading(false)
      return
    }

    const loadDashboard = async () => {
      try {
        // ✅ Step 1: Fetch profile
        const profileRes = await fetch(`${baseURL}/profile`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })

        if (!profileRes.ok) throw new Error('Profile fetch failed')

        const profile = await profileRes.json()

        console.log("PROFILE:", profile)

        const role = profile.role
        const instituteId = profile.instituteId

        // ✅ Step 2: Fetch counts based on role

        // 🔹 Institute Admin
        if (role === 'instituteAdmin' && instituteId) {
          const res = await fetch(
            `${baseURL}/dashboardAdmin?instituteId=${instituteId}`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          )

          if (!res.ok) throw new Error('Institute dashboard fetch failed')

          const data = await res.json()
          setCounts(data)
        }

        // 🔹 Platform Admin
        else if (role === 'admin' || role === 'super_admin') {
          const res = await fetch(`${baseURL}/dashboardAdmin`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          })

          if (!res.ok) throw new Error('Admin dashboard fetch failed')

          const data = await res.json()
          setCounts(data)
        }

        // 🔹 Other roles (student etc.)
        else {
          console.warn("No dashboard for role:", role)
        }

      } catch (err) {
        console.error('Dashboard load failed:', err)
      } finally {
        setLoading(false) // ✅ ALWAYS stop spinner
      }
    }

    loadDashboard()
  }, [user?.token, baseURL])

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