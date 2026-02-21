import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { useEffect, useState, useCallback } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap'
import {
  BsPatchCheckFill,
  BsCheckCircleFill,
  BsStarFill,
  BsClock,
  BsShieldCheck,
  BsTagFill,
  BsXCircleFill,
} from 'react-icons/bs'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Plan {
  id: string
  label: string
  duration: string
  price: number
  priceInPaise: number
  popular?: boolean
  features: string[]
}

interface SubscriptionStatus {
  isActive: boolean
  plan: string | null
  startDate: string | null
  endDate: string | null
  paymentId: string | null
  amount: number | null
}

interface Profile {
  fullName: string
  email: string
  college?: string
  phoneNo: string
  status: string
  createdAt: string
}

// Brand orange theme colors
const THEME = {
  primary: '#ff7a00',
  dark: '#e96d00',
  light: '#fff4e6',
  soft: '#ffe8cc',
  gradient: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)',
}

interface CouponResult {
  valid: boolean
  code?: string
  discountPercent?: number
  college?: string
  originalPrice?: number
  discountedPrice?: number
  savings?: number
  error?: string
}

const SubscriptionPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null)

  // Fetch plans, subscription status, and profile in parallel
  useEffect(() => {
    if (!token) return

    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/payment/plans`).then((r) => r.json()),
      fetch(`${baseURL}/payment/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([plansData, subData, profileData]) => {
        setPlans(plansData.plans || [])
        setSubscription(subData)
        setProfile(profileData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading data:', err)
        setError('Failed to load subscription data')
        setLoading(false)
      })
  }, [token, baseURL])

  // Validate coupon code
  const validateCoupon = useCallback(
    async (planId?: string) => {
      if (!token || !couponCode.trim()) return

      setCouponLoading(true)
      setCouponResult(null)

      try {
        const res = await fetch(`${baseURL}/payment/validate-coupon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: couponCode.trim(),
            plan: planId || plans[0]?.id || '6months',
          }),
        })
        const data: CouponResult = await res.json()
        setCouponResult(data)
        if (data.valid) {
          setAppliedCoupon(data)
        } else {
          setAppliedCoupon(null)
        }
      } catch {
        setCouponResult({ valid: false, error: 'Failed to validate coupon' })
        setAppliedCoupon(null)
      }
      setCouponLoading(false)
    },
    [token, couponCode, baseURL, plans],
  )

  const removeCoupon = () => {
    setCouponCode('')
    setCouponResult(null)
    setAppliedCoupon(null)
  }

  // Get discounted price for a plan
  const getDiscountedPrice = (plan: Plan) => {
    if (!appliedCoupon?.valid || !appliedCoupon.discountPercent) return null
    const discounted = Math.round(plan.price * (1 - appliedCoupon.discountPercent / 100) * 100) / 100
    return Math.max(discounted, 1) // minimum ₹1
  }

  const handlePayment = useCallback(
    async (plan: Plan) => {
      if (!token || !user) return

      setPaymentLoading(plan.id)
      setError(null)
      setSuccessMsg(null)

      try {
        // Step 1: Create order on backend
        const orderRes = await fetch(`${baseURL}/payment/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: plan.id, couponCode: appliedCoupon?.code || '' }),
        })

        if (!orderRes.ok) {
          const errData = await orderRes.json()
          throw new Error(errData.error || 'Failed to create order')
        }

        const orderData = await orderRes.json()

        // Step 2: Open Razorpay Checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Eklav',
          description: orderData.planLabel,
          order_id: orderData.orderId,
          prefill: {
            name: profile?.fullName || user?.fullName || '',
            email: user?.email || '',
            contact: profile?.phoneNo || user?.phoneNo || '',
          },
          theme: {
            color: THEME.primary,
          },
          handler: async (response: any) => {
            // Step 3: Verify payment on backend
            try {
              const verifyRes = await fetch(`${baseURL}/payment/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: plan.id,
                }),
              })

              if (!verifyRes.ok) {
                const errData = await verifyRes.json()
                throw new Error(errData.error || 'Payment verification failed')
              }

              const verifyData = await verifyRes.json()
              setSuccessMsg('Payment successful! Your subscription is now active.')
              setSubscription({
                isActive: true,
                plan: plan.id,
                startDate: verifyData.subscription.startDate,
                endDate: verifyData.subscription.endDate,
                paymentId: response.razorpay_payment_id,
                amount: plan.price,
              })
            } catch (verifyErr: any) {
              setError(verifyErr.message || 'Payment verification failed. Contact support.')
            }

            setPaymentLoading(null)
          },
          modal: {
            ondismiss: () => {
              setPaymentLoading(null)
            },
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (response: any) => {
          setError(`Payment failed: ${response.error.description}`)
          setPaymentLoading(null)
        })
        rzp.open()
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
        setPaymentLoading(null)
      }
    },
    [token, user, profile, baseURL],
  )

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" style={{ color: THEME.primary }} />
      </div>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <PageMetaData title="Subscription" />

      {/* Scoped styles for orange theme buttons */}
      <style>{`
        .btn-orange {
          background: ${THEME.gradient};
          border: none;
          color: #fff;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-orange:hover:not(:disabled) {
          background: linear-gradient(135deg, ${THEME.dark} 0%, #ff7a00 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(255, 122, 0, 0.35);
          transform: translateY(-1px);
        }
        .btn-orange:disabled {
          background: ${THEME.gradient};
          color: #fff;
          opacity: 0.7;
        }
        .btn-outline-orange {
          background: transparent;
          border: 2px solid ${THEME.primary};
          color: ${THEME.primary};
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-outline-orange:hover:not(:disabled) {
          background: ${THEME.gradient};
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 15px rgba(255, 122, 0, 0.35);
          transform: translateY(-1px);
        }
        .btn-outline-orange:disabled {
          opacity: 0.6;
        }
        .plan-card-popular {
          border: 2px solid ${THEME.primary} !important;
        }
        .text-orange {
          color: ${THEME.primary} !important;
        }
      `}</style>

      <Container fluid className="px-0 mt-4">
        {/* Success / Error Alerts */}
        {successMsg && (
          <Row className="justify-content-center mb-3">
            <Col xs={12} md={10} lg={9} xl={8}>
              <Alert variant="warning" dismissible onClose={() => setSuccessMsg(null)} style={{ background: THEME.light, borderColor: THEME.primary, color: '#333' }}>
                <BsCheckCircleFill className="me-2" style={{ color: THEME.primary }} />
                {successMsg}
              </Alert>
            </Col>
          </Row>
        )}
        {error && (
          <Row className="justify-content-center mb-3">
            <Col xs={12} md={10} lg={9} xl={8}>
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Active Subscription Banner */}
        {subscription?.isActive && (
          <Row className="justify-content-center mb-4">
            <Col xs={12} md={10} lg={9} xl={8}>
              <Card className="border-0 shadow-sm" style={{ background: THEME.gradient }}>
                <Card.Body className="text-white p-4">
                  <Row className="align-items-center">
                    <Col xs={12} md={4}>
                      <div className="d-flex align-items-center mb-2 mb-md-0">
                        <BsShieldCheck size={28} className="me-2" />
                        <div>
                          <small className="opacity-75">Active Plan</small>
                          <h5 className="mb-0 fw-bold">
                            {subscription.plan === '12months' ? '12 Months Premium' : '6 Months Premium'}
                          </h5>
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="d-flex align-items-center mb-2 mb-md-0">
                        <BsClock size={20} className="me-2 opacity-75" />
                        <div>
                          <small className="opacity-75">Valid Until</small>
                          <h6 className="mb-0 fw-semibold">{formatDate(subscription.endDate)}</h6>
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} md={4} className="text-md-end">
                      <span
                        className="d-inline-flex align-items-center px-4 py-2 rounded-pill fw-bold"
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(6px)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          color: '#fff',
                          fontSize: '0.95rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <BsCheckCircleFill className="me-2" /> Subscribed
                      </span>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Plan Cards */}
        <Row className="justify-content-center mb-4">
          <Col xs={12} md={10} lg={9} xl={8}>
            <h4 className="fw-bold mb-1">{subscription?.isActive ? 'Your Plan' : 'Choose a Plan'}</h4>
            <p className="text-muted mb-4">
              {subscription?.isActive
                ? 'You can upgrade or renew your plan when it expires.'
                : 'Select a plan to unlock all premium features.'}
            </p>
          </Col>
        </Row>

        {/* Coupon Code Section */}
        {!subscription?.isActive && (
          <Row className="justify-content-center mb-4">
            <Col xs={12} md={10} lg={9} xl={8}>
              <Card className="border shadow-sm" style={{ borderColor: appliedCoupon ? THEME.primary : undefined }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <BsTagFill style={{ color: THEME.primary }} className="me-2" />
                    <span className="fw-semibold">Have a coupon code?</span>
                  </div>

                  {appliedCoupon?.valid ? (
                    // Applied coupon display
                    <div
                      className="d-flex align-items-center justify-content-between p-3 rounded-3"
                      style={{ background: THEME.light, border: `1px solid ${THEME.soft}` }}
                    >
                      <div>
                        <span className="fw-bold" style={{ color: THEME.primary, fontSize: '1.1rem' }}>
                          {appliedCoupon.code}
                        </span>
                        <span className="ms-2 text-muted">—</span>
                        <span className="ms-2 fw-semibold" style={{ color: THEME.dark }}>
                          {appliedCoupon.discountPercent}% OFF
                        </span>
                        <div className="text-muted small mt-1">
                          Valid for {appliedCoupon.college}
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="text-danger p-0 ms-3"
                        onClick={removeCoupon}
                        title="Remove coupon"
                      >
                        <BsXCircleFill size={20} />
                      </Button>
                    </div>
                  ) : (
                    // Coupon input
                    <>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            if (couponResult) setCouponResult(null)
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                          style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}
                          disabled={couponLoading}
                        />
                        <Button
                          className="btn-outline-orange"
                          onClick={() => validateCoupon()}
                          disabled={!couponCode.trim() || couponLoading}
                          style={{ minWidth: 100 }}
                        >
                          {couponLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </InputGroup>
                      {couponResult && !couponResult.valid && (
                        <div className="text-danger small mt-2">
                          <BsXCircleFill className="me-1" />
                          {couponResult.error}
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        <Row className="justify-content-center g-4 mb-5">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.isActive && subscription.plan === plan.id
            const discountedPrice = getDiscountedPrice(plan)
            const displayPrice = discountedPrice ?? plan.price
            return (
              <Col key={plan.id} xs={12} md={5} lg={4}>
                <Card
                  className={`h-100 shadow-sm position-relative ${plan.popular ? 'plan-card-popular' : 'border'}`}
                  style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {plan.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <Badge className="px-3 py-2 rounded-pill" style={{ background: THEME.gradient, border: 'none' }}>
                        <BsStarFill className="me-1" /> Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card.Body className="p-4 pt-4 d-flex flex-column">
                    <div className="text-center mb-3 mt-2">
                      <h5 className="fw-bold text-dark">{plan.label}</h5>
                      <p className="text-muted small mb-2">{plan.duration} access</p>
                      <div className="d-flex align-items-baseline justify-content-center flex-wrap">
                        {discountedPrice !== null ? (
                          <>
                            <span className="text-muted text-decoration-line-through me-2" style={{ fontSize: '1.1rem' }}>
                              ₹{plan.price}
                            </span>
                            <span className="fs-2 fw-bold" style={{ color: THEME.primary }}>
                              ₹{discountedPrice}
                            </span>
                          </>
                        ) : (
                          <span className="fs-2 fw-bold" style={{ color: THEME.primary }}>₹{plan.price}</span>
                        )}
                        <span className="text-muted ms-1">/ {plan.duration.toLowerCase()}</span>
                      </div>
                      {discountedPrice !== null && (
                        <Badge className="mt-2" style={{ background: THEME.light, color: THEME.dark, border: `1px solid ${THEME.soft}` }}>
                          {appliedCoupon?.discountPercent}% OFF with {appliedCoupon?.code}
                        </Badge>
                      )}
                    </div>

                    <hr />

                    <ul className="list-unstyled flex-grow-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="mb-2 d-flex align-items-start">
                          <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2 mt-1 flex-shrink-0" />
                          <span className="small">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3">
                      {isCurrentPlan ? (
                        <Button size="lg" className="w-100 rounded-pill btn-orange" disabled>
                          <BsCheckCircleFill className="me-2" /> Current Plan
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className={`w-100 rounded-pill ${plan.popular ? 'btn-orange' : 'btn-outline-orange'}`}
                          onClick={() => handlePayment(plan)}
                          disabled={!!paymentLoading || (subscription?.isActive === true)}
                        >
                          {paymentLoading === plan.id ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing...
                            </>
                          ) : subscription?.isActive ? (
                            'Already Subscribed'
                          ) : (
                            `Subscribe - ₹${displayPrice}`
                          )}
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>

        {/* Features Section */}
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={9} xl={8}>
            <Card className="card-body bg-transparent border rounded-3 shadow-sm">
              <h5 className="fw-bold mb-4">What's Included in Premium</h5>
              <Row>
                <Col md={4}>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Top Tech Courses
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Learn Top 5 Courses Per Year
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Communication Skills
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Mock Interview Videos
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> 24/7 Dedicated Support
                    </li>
                  </ul>
                </Col>
                <Col md={4}>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Leadership Board
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> English Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Speaking Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Learning Practice With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Writing Practice With AI
                    </li>
                  </ul>
                </Col>
                <Col md={4}>
                  <ul className="list-unstyled">
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Aptitude Preparation
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Weekly Challenges
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Self Interview With AI
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Online Classes
                    </li>
                    <li className="mb-3 h6 fw-light">
                      <BsPatchCheckFill style={{ color: THEME.primary }} className="me-2" /> Final Assessment
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
