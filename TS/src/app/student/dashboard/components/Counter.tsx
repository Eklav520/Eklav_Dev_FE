import { CounterType } from '@/types/other'
import { useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import CountUp from 'react-countup'
import { FaBook, FaBriefcase, FaTags } from 'react-icons/fa'

const CounterCard = ({ count, title, icon: Icon, suffix, variant }: CounterType) => {
  return (
    <div className={`d-flex justify-content-center align-items-center p-4 bg-${variant} bg-opacity-15 rounded-3`}>
      <span className={`display-6 text-${variant} mb-0`}>{Icon && <Icon size={56} className="fa-fw" />}</span>
      <div className="ms-4">
        <div className="d-flex">
          <h5 className="purecounter mb-0 fw-bold">
            <CountUp suffix={suffix} end={count} delay={1} />
          </h5>
        </div>
        <span className="mb-0 h6 fw-light">{title}</span>
      </div>
    </div>
  )
}

const Counter = () => {
  const [stats, setStats] = useState({ courses: 0, jobs: 0, categories: 0 })
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') // or from context
        const res = await fetch(`${baseURL}/dashboardStudent`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          const data = await res.json()
          if (data.message?.includes('Session invalid')) {
            alert('Session expired or logged in from another device.')
            localStorage.removeItem('token') // or use context
            window.location.href = '/login'
          }
          return
        }

        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (err) {
        console.error('Error loading dashboard stats', err)
      }
    }

    fetchStats()
  }, [])

  const counterData = [
    { count: stats.courses, title: 'Courses Available', icon: FaBook, variant: 'primary' },
    { count: stats.jobs, title: 'Jobs Posted', icon: FaBriefcase, variant: 'success' },
    { count: stats.categories, title: 'Aptitude Categories', icon: FaTags, variant: 'warning' },
  ]

  return (
    <Row className="mb-4">
      {counterData.map((item, idx) => (
        <Col sm={6} lg={4} className="mb-3" key={idx}>
          <CounterCard {...item} />
        </Col>
      ))}
    </Row>
  )
}

export default Counter
