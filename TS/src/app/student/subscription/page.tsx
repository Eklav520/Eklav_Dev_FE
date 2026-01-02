import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import { BsPatchCheckFill } from 'react-icons/bs'

interface Profile {
  fullName: string
  email: string
  college?: string
  phoneNo: string
  status: string
  createdAt: string
}

const SubscriptionPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    setLoading(true)
    fetch(`${baseURL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then((data: Profile) => {
        setProfile(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching profile:', err)
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="success" />
      </div>
    )
  }

  const isSubscribed = profile?.status?.toLowerCase() === 'approved'
  const subscriptionDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <>
      <PageMetaData title="Subscription" />
      <Container fluid className="px-0 mt-4">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={9} xl={8}>
            <Card className="card-body bg-transparent border rounded-3 shadow-sm">
              <Row className="g-4 align-items-center justify-content-between">
                <Col xs={12} md={4}>
                  <span>Active Plan</span>
                  <h4 className="fw-semibold">Yearly Premium</h4>
                </Col>

                <Col xs={12} md={4}>
                  <span>Purchase Date</span>
                  <h4 className="fw-semibold">{isSubscribed ? subscriptionDate : 'Not Subscribed'}</h4>
                </Col>

                <Col xs={12} md={4} className="text-md-end text-center">
                  {isSubscribed ? (
                    <Button variant="success" size="lg" className="mb-0 px-5 rounded-pill" disabled>
                      Subscribed
                    </Button>
                  ) : (
                    <Button variant="outline-danger" size="lg" className="mb-0 px-5 rounded-pill" disabled>
                      Unsubscribed
                    </Button>
                  )}
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col md={4}>
                  <h6 className="mb-3 fw-semibold">This plan includes</h6>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Top Tech Courses
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Learn Top 5 Courses Per Year
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Communication Skills
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Mock Interview Videos
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> 24/7 Dedicated Support
                    </li>
                    {/*  <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Vouchers for winners
                    </li> */}
                    {/*  <li className="h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Student Blog for interaction
                    </li> */}
                  </ul>
                </Col>
                <Col md={4}>
                  <h6 className="mb-3 fw-semibold invisible">The plan includes</h6>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Leadership Board
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> English Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Speaking Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Learning Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Writing Practice With AI
                    </li>
                  </ul>
                </Col>

                <Col md={4}>
                  <h6 className="mb-3 fw-semibold invisible">The plan includes</h6>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Aptitude Preparation
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Weekly Challenges
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Self Interview With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Online Classes
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill className="text-success me-2" /> Final Assessment
                    </li>
                  </ul>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default SubscriptionPage
