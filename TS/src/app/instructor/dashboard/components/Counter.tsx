import { CounterType } from '@/types/other'
import { Col, Row } from 'react-bootstrap'
import CountUp from 'react-countup'
import { counterData } from '../data'
import { useEffect, useState } from 'react'
import {Spinner } from 'react-bootstrap'
import { FaUserGraduate, FaBookOpen, FaVideo } from 'react-icons/fa'

const CounterCard = ({ count, title, icon: Icon, suffix, variant }: CounterType) => {
  return (
    <div className={`d-flex justify-content-center align-items-center p-4 bg-${variant} bg-opacity-15 rounded-3`}>
    <span className={`display-6 text-${variant} mb-0`}>
      {Icon && <Icon size={56} className="fa-fw" />}
    </span>
    <div className="ms-4">
      <div className="d-flex">
        <h5 className="mb-0 fw-bold">
          <CountUp end={count} suffix={suffix} delay={0.5} />
        </h5>
      </div>
      <span className="mb-0 h6 fw-light">{title}</span>
    </div>
  </div>
  )
}

const Counter = () => {
  const [counts, setCounts] = useState({
    studentCount: 0,
    courseCount: 0,
    classCount: 0
  })
  const [loading, setLoading] = useState(true)

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${baseURL}/dashboardAdmin`)
        const data = await res.json()
        setCounts(data)
      } catch (err) {
        console.error('Failed to fetch admin counts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

   const data = [
    { count: counts.studentCount, title: 'Students Available', icon: FaUserGraduate, variant: 'success' },
    { count: counts.courseCount, title: 'Courses Available', icon: FaBookOpen, variant: 'info' },
    { count: counts.classCount, title: 'Live Classes Scheduled', icon: FaVideo, variant: 'warning' }
  ]

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

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
