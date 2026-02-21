import PageMetaData from '@/components/PageMetaData';
import { useAuthContext } from '@/context/useAuthContext';
import { useEffect, useState, useCallback } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    Row,
    Spinner,
} from 'react-bootstrap';
import {
    BsCheckCircleFill,
    BsStarFill,
    BsClock,
    BsShieldCheck,
    BsTagFill,
    BsXCircleFill,
    BsClipboard,
    BsClipboardCheck,
    BsCircleFill,
    BsArrowRight,
    BsLightningCharge,
    BsPeople,
    BsRocket,
} from 'react-icons/bs';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Plan {
    id: string;
    label: string;
    duration: string;
    price: number;
    priceInPaise: number;
    popular?: boolean;
    isFree?: boolean;
    features: string[];
}

interface SubscriptionStatus {
    isActive: boolean;
    plan: string | null;
    startDate: string | null;
    endDate: string | null;
    paymentId: string | null;
    amount: number | null;
}

interface Profile {
    fullName: string;
    email: string;
    college?: string;
    phoneNo: string;
    status: string;
    createdAt: string;
}

interface CouponResult {
    valid: boolean;
    code?: string;
    discountPercent?: number;
    college?: string;
    originalPrice?: number;
    discountedPrice?: number;
    savings?: number;
    error?: string;
}

interface UniversalCoupon {
    code: string;
    discountPercent: number;
    endDate: string;
}

// Orange theme colors
const THEME = {
    primary: '#ff7a00',
    dark: '#e96d00',
    light: '#fff4e6',
    soft: '#ffe8cc',
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)',
    success: '#10b981',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    text: {
        primary: '#1f2937',    // Dark gray for primary text
        secondary: '#4b5563',   // Medium gray for secondary text
        muted: '#6b7280',       // Light gray for muted text
        light: '#9ca3af',       // Very light gray
        white: '#ffffff',       // White text
    }
} as const;

// Free trial plan with features
const FREE_TRIAL: Plan = {
    id: 'free-trial',
    label: 'Free Trial',
    duration: '',
    price: 0,
    priceInPaise: 0,
    isFree: true,
    features: [
        'Limited Access',
        'Basic features included',
        'No credit card required',
        'Access to sample courses',
        'Community support'
    ],
};

// Premium features that are the same for both 6 and 12 month plans
const PREMIUM_FEATURES = [
    'All Courses Access',
    'AI Practice Tools',
    'Mock Interviews',
    '24/7 Support',
    'Certificate on Completion',
    'Leadership Board Access',
    'Code Challenges',
    'Aptitude Preparation',
    'English Practice with AI',
    'Speaking Practice',
    'Writing Practice',
    'Self Interview with AI'
];

const SubscriptionPage = () => {
    const { user } = useAuthContext();
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const token = user?.token;

    // State
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

    // Universal coupons
    const [universalCoupons, setUniversalCoupons] = useState<UniversalCoupon[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Add the same premium features to all paid plans
    const plansWithFeatures = plans.map((plan) => ({
        ...plan,
        features: PREMIUM_FEATURES // Same features for all paid plans
    }));

    // All display plans (including free trial)
    const allPlans: Plan[] = [FREE_TRIAL, ...plansWithFeatures];

    // Fetch data
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [plansRes, subRes, profileRes, universalRes] = await Promise.all([
                    fetch(`${baseURL}/payment/plans`),
                    fetch(`${baseURL}/payment/subscription-status`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${baseURL}/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${baseURL}/api/coupons/universal`),
                ]);

                const [plansData, subData, profileData, universalData] = await Promise.all([
                    plansRes.json(),
                    subRes.json(),
                    profileRes.json(),
                    universalRes.json(),
                ]);

                setPlans(plansData.plans || []);
                setSubscription(subData);
                setProfile(profileData);
                setUniversalCoupons(Array.isArray(universalData) ? universalData : []);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load subscription data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, baseURL]);

    // Validate coupon
    const validateCoupon = useCallback(
        async (planId?: string) => {
            if (!token || !couponCode.trim()) return;

            setCouponLoading(true);
            setCouponResult(null);

            try {
                const response = await fetch(`${baseURL}/payment/validate-coupon`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        code: couponCode.trim(),
                        plan: planId || plans[0]?.id || '6months',
                    }),
                });

                const data: CouponResult = await response.json();
                setCouponResult(data);
                setAppliedCoupon(data.valid ? data : null);
            } catch {
                setCouponResult({ valid: false, error: 'Failed to validate coupon' });
                setAppliedCoupon(null);
            } finally {
                setCouponLoading(false);
            }
        },
        [token, couponCode, baseURL, plans]
    );

    const removeCoupon = () => {
        setCouponCode('');
        setCouponResult(null);
        setAppliedCoupon(null);
    };

    const getDiscountedPrice = (plan: Plan) => {
        if (!appliedCoupon?.valid || !appliedCoupon.discountPercent || plan.isFree) return null;
        const discounted = Math.round(plan.price * (1 - appliedCoupon.discountPercent / 100) * 100) / 100;
        return Math.max(discounted, 1);
    };

    const handlePayment = useCallback(
        async (plan: Plan) => {
            if (!token || !user) return;

            setPaymentLoading(plan.id);
            setError(null);
            setSuccessMsg(null);

            try {
                const orderResponse = await fetch(`${baseURL}/payment/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        plan: plan.id,
                        couponCode: appliedCoupon?.code || ''
                    }),
                });

                if (!orderResponse.ok) {
                    const errorData = await orderResponse.json();
                    throw new Error(errorData.error || 'Failed to create order');
                }

                const orderData = await orderResponse.json();

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
                    theme: { color: THEME.primary },
                    handler: async (response: any) => {
                        try {
                            const verifyResponse = await fetch(`${baseURL}/payment/verify`, {
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
                            });

                            if (!verifyResponse.ok) {
                                const errorData = await verifyResponse.json();
                                throw new Error(errorData.error || 'Payment verification failed');
                            }

                            const verifyData = await verifyResponse.json();
                            setSuccessMsg('Payment successful! Your subscription is now active.');
                            setSubscription({
                                isActive: true,
                                plan: plan.id,
                                startDate: verifyData.subscription.startDate,
                                endDate: verifyData.subscription.endDate,
                                paymentId: response.razorpay_payment_id,
                                amount: plan.price,
                            });
                        } catch (error: any) {
                            setError(error.message || 'Payment verification failed. Contact support.');
                        } finally {
                            setPaymentLoading(null);
                        }
                    },
                    modal: {
                        ondismiss: () => setPaymentLoading(null),
                    },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.on('payment.failed', (response: any) => {
                    setError(`Payment failed: ${response.error.description}`);
                    setPaymentLoading(null);
                });
                razorpay.open();
            } catch (error: any) {
                setError(error.message || 'Something went wrong');
                setPaymentLoading(null);
            }
        },
        [token, user, profile, baseURL, appliedCoupon]
    );

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setCouponCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" style={{ color: THEME.primary }} />
            </Container>
        );
    }

    return (
        <>
            <PageMetaData title="Subscription" />

            <style>{`
        body {
          background-color: #f3f4f6;
        }
        
        .btn-primary-custom {
          background: ${THEME.gradient};
          border: none;
          color: #fff;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          transition: all 0.3s ease;
        }
        .btn-primary-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(255, 122, 0, 0.4);
        }
        .btn-outline-custom {
          background: transparent;
          border: 2px solid ${THEME.primary};
          color: ${THEME.primary};
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          transition: all 0.3s ease;
        }
        .btn-outline-custom:hover:not(:disabled) {
          background: ${THEME.gradient};
          border-color: transparent;
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(255, 122, 0, 0.4);
        }
        .btn-outline-custom:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .plan-card {
          border: 1px solid ${THEME.border};
          border-radius: 1.5rem;
          transition: all 0.3s ease;
          background: ${THEME.cardBg};
          height: 100%;
          overflow: hidden;
        }
        .plan-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -15px rgba(255, 122, 0, 0.3);
          border-color: ${THEME.primary};
        }
        .plan-card-popular {
          border: 2px solid ${THEME.primary};
          box-shadow: 0 10px 30px -10px rgba(255, 122, 0, 0.3);
        }
        .popular-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: ${THEME.gradient};
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 1;
        }
        .price-tag {
          font-size: 2.5rem;
          font-weight: 700;
          color: ${THEME.text.primary};
        }
        .price-period {
          color: ${THEME.text.muted};
          font-size: 1rem;
          font-weight: 400;
        }
        .feature-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 0;
          color: ${THEME.text.secondary};
        }
        .feature-icon {
          color: ${THEME.primary};
          margin-right: 0.75rem;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .coupon-chip {
          background: ${THEME.light};
          border: 1px solid ${THEME.border};
          border-radius: 2rem;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: ${THEME.text.secondary};
        }
        .coupon-chip:hover {
          border-color: ${THEME.primary};
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.1);
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${THEME.text.primary};
          margin-bottom: 0.5rem;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .section-subtitle {
          color: ${THEME.text.muted};
          font-size: 1.25rem;
          margin-bottom: 2rem;
          font-weight: 400;
        }
        .free-trial-card {
          background: linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%);
          border: 1px solid ${THEME.soft};
        }
        .free-trial-card .price-tag {
          color: ${THEME.primary};
        }
        .active-plan-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          color: #fff;
          padding: 0.5rem 1.5rem;
          border-radius: 2rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .feature-grid-card {
          border: none;
          border-radius: 1rem;
          transition: all 0.2s;
          height: 100%;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .feature-grid-card:hover {
          background: white;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .feature-grid-card .feature-item {
          color: ${THEME.text.secondary};
        }
        .feature-grid-card h5 {
          color: ${THEME.primary};
          font-weight: 700;
          margin-bottom: 1.25rem;
          font-size: 1.25rem;
        }
        .text-muted-custom {
          color: ${THEME.text.muted};
        }
        .card-title-custom {
          color: ${THEME.text.primary};
          font-weight: 700;
          font-size: 1.5rem;
        }
        .header-section {
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          padding: 3rem 0;
          border-radius: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .features-header-section {
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          padding: 2rem 0;
          border-radius: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .active-plan-single-box {
          background: ${THEME.gradient};
          border-radius: 1rem;
          padding: 1.25rem 2rem;
          box-shadow: 0 10px 25px -5px rgba(255, 122, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .active-plan-info {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .active-plan-info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }
        .active-plan-info-item .label {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }
        .active-plan-info-item .value {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: white;
          line-height: 1.3;
        }
        .active-plan-status {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 2rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .active-plan-single-box {
            flex-direction: column;
            align-items: flex-start;
          }
          .active-plan-info {
            flex-direction: column;
            gap: 1rem;
            width: 100%;
          }
          .active-plan-info-item {
            width: 100%;
          }
          .active-plan-status {
            align-self: flex-start;
          }
        }
      `}</style>

            <Container className="py-4">
                {/* Header Section with clean background */}
                <Row className="justify-content-center mb-4">
                    {/* <Col xs={12} md={10} lg={8} className="text-center">
            <div className="header-section px-4">
              <h1 className="section-title">Choose Your Plan</h1>
              <p className="section-subtitle">Select the perfect plan for your learning journey</p>
            </div>
          </Col> */}
                </Row>

                {/* Alerts */}
                <Row className="justify-content-center mb-4">
                    <Col xs={12} md={10} lg={8}>
                        {successMsg && (
                            <Alert
                                variant="success"
                                dismissible
                                onClose={() => setSuccessMsg(null)}
                                className="d-flex align-items-center border-0 shadow-sm"
                                style={{ background: '#d1fae5', color: '#065f46' }}
                            >
                                <BsCheckCircleFill className="me-2 flex-shrink-0" />
                                {successMsg}
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)} className="border-0 shadow-sm">
                                {error}
                            </Alert>
                        )}
                    </Col>
                </Row>

                {/* Active Subscription - Single Box */}
                {subscription?.isActive && (
                    <Row className="justify-content-center mb-5">
                        <Col xs={12} md={10} lg={8}>
                            <div className="active-plan-single-box">
                                <div className="active-plan-info">
                                    {/* Plan Info */}
                                    <div className="active-plan-info-item">
                                        <BsShieldCheck size={28} />
                                        <div>
                                            <div className="label">Active Plan</div>
                                            <div className="value">
                                                {subscription.plan === '12months' ? '12 Months Premium' :
                                                    subscription.plan === '6months' ? '6 Months Premium' :
                                                        'Premium Plan'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Validity Info */}
                                    <div className="active-plan-info-item">
                                        <BsClock size={24} />
                                        <div>
                                            <div className="label">Valid Until</div>
                                            <div className="value">{formatDate(subscription.endDate)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Status Badge */}
                                <span className="active-plan-status">
                                    <BsCheckCircleFill />
                                    Active
                                </span>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Coupon Section */}
                {!subscription?.isActive && (
                    <Row className="justify-content-center mb-5">
                        <Col xs={12} md={10} lg={8}>
                            {/* Available Coupons */}
                            {universalCoupons.length > 0 && !appliedCoupon && (
                                <div className="mb-4">
                                    <h6 className="fw-semibold mb-3" style={{ color: THEME.text.primary }}>Available Coupons</h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        {universalCoupons.map((coupon) => (
                                            <div
                                                key={coupon.code}
                                                className="coupon-chip"
                                                onClick={() => copyToClipboard(coupon.code)}
                                                title="Click to copy and apply"
                                            >
                                                <span className="fw-bold" style={{ color: THEME.primary }}>
                                                    {coupon.code}
                                                </span>
                                                <Badge style={{ background: THEME.gradient }}>
                                                    {coupon.discountPercent}% OFF
                                                </Badge>
                                                {copiedCode === coupon.code ? (
                                                    <BsClipboardCheck style={{ color: THEME.success }} />
                                                ) : (
                                                    <BsClipboard style={{ color: THEME.text.light }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Coupon Input */}
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <BsTagFill style={{ color: THEME.primary }} className="me-2" />
                                        <span className="fw-semibold" style={{ color: THEME.text.primary }}>Have a coupon code?</span>
                                    </div>

                                    {appliedCoupon?.valid ? (
                                        <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: THEME.light }}>
                                            <div>
                                                <span className="fw-bold" style={{ color: THEME.primary }}>{appliedCoupon.code}</span>
                                                <span className="mx-2 text-muted-custom">—</span>
                                                <span className="fw-semibold" style={{ color: THEME.success }}>{appliedCoupon.discountPercent}% OFF</span>
                                            </div>
                                            <Button variant="link" className="text-danger p-0" onClick={removeCoupon}>
                                                <BsXCircleFill size={20} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value.toUpperCase());
                                                        if (couponResult) setCouponResult(null);
                                                    }}
                                                    onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                                                    style={{ textTransform: 'uppercase', color: THEME.text.primary }}
                                                    disabled={couponLoading}
                                                />
                                                <Button
                                                    className="btn-primary-custom"
                                                    onClick={() => validateCoupon()}
                                                    disabled={!couponCode.trim() || couponLoading}
                                                >
                                                    {couponLoading ? <Spinner animation="border" size="sm" /> : 'Apply'}
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

                {/* Plan Cards */}
                <Row className="g-4 justify-content-center">
                    {allPlans.map((plan, index) => {
                        const isCurrentPlan = subscription?.isActive && subscription.plan === plan.id;
                        const discountedPrice = getDiscountedPrice(plan);
                        const displayPrice = discountedPrice ?? plan.price;

                        return (
                            <Col key={plan.id} xs={12} md={6} lg={4}>
                                <Card className={`plan-card position-relative ${plan.popular ? 'plan-card-popular' : ''} ${plan.isFree ? 'free-trial-card' : ''}`}>
                                    {plan.popular && (
                                        <div className="popular-badge">
                                            <BsStarFill size={14} />
                                            Most Popular
                                        </div>
                                    )}

                                    <Card.Body className="p-4">
                                        {/* Plan Header */}
                                        <div className="text-center mb-4">
                                            <div className="mb-3">
                                                {index === 0 ? (
                                                    <BsLightningCharge size={40} style={{ color: THEME.primary }} />
                                                ) : index === 1 ? (
                                                    <BsPeople size={40} style={{ color: THEME.primary }} />
                                                ) : (
                                                    <BsRocket size={40} style={{ color: THEME.primary }} />
                                                )}
                                            </div>
                                            <h3 className="card-title-custom mb-1">{plan.label}</h3>
                                            {plan.duration && (
                                                <p className="text-muted-custom mb-3">
                                                    {plan.duration} Access
                                                </p>
                                            )}

                                            {/* Price */}
                                            <div className="mb-3">
                                                {plan.isFree ? (
                                                    <span className="price-tag">Free</span>
                                                ) : (
                                                    <>
                                                        {discountedPrice ? (
                                                            <>
                                                                <span className="text-muted-custom text-decoration-line-through fs-5 me-2">
                                                                    ₹{plan.price}
                                                                </span>
                                                                <span className="price-tag">₹{discountedPrice}</span>
                                                            </>
                                                        ) : (
                                                            <span className="price-tag">₹{plan.price}</span>
                                                        )}
                                                        <span className="price-period ms-2">/{plan.duration.toLowerCase()} + GST </span>
                                                    </>
                                                )}
                                            </div>

                                            {discountedPrice && (
                                                <Badge className="px-3 py-2 rounded-pill" style={{ background: THEME.gradient }}>
                                                    Save {appliedCoupon?.discountPercent}%
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Features - Show first 8 features for better visibility */}
                                        <div className="mb-4">
                                            {plan.features?.slice(0, 8).map((feature, idx) => (
                                                <div key={idx} className="feature-item">
                                                    <BsCheckCircleFill className="feature-icon" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                            {plan.features && plan.features.length > 8 && (
                                                <div className="feature-item text-muted-custom">
                                                    <BsCircleFill className="feature-icon" style={{ fontSize: '0.5rem' }} />
                                                    <span>+{plan.features.length - 8} more features</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {isCurrentPlan ? (
                                            <Button className="w-100 btn-primary-custom" disabled>
                                                <BsCheckCircleFill className="me-2" />
                                                Current Plan
                                            </Button>
                                        ) : plan.isFree ? (
                                            <Button
                                                className="w-100 btn-outline-custom"
                                                onClick={() => window.location.href = '/signup'}
                                                disabled={subscription?.isActive}
                                            >
                                                {subscription?.isActive ? 'Already Subscribed' : 'Start Free Trial'}
                                            </Button>
                                        ) : (
                                            <Button
                                                className={`w-100 ${plan.popular ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                                                onClick={() => handlePayment(plan)}
                                                disabled={!!paymentLoading || subscription?.isActive}
                                            >
                                                {paymentLoading === plan.id ? (
                                                    <>
                                                        <Spinner animation="border" size="sm" className="me-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    `Choose Plan - ₹${displayPrice}`
                                                )}
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Features Section */}
                <Row className="mt-5 pt-4">
                    <Col xs={12} className="text-center mb-4">
                        <div className="features-header-section px-4">
                            <h2 className="section-title">Everything you get</h2>
                            <p className="section-subtitle">All premium plans include these core features</p>
                        </div>
                    </Col>

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="feature-grid-card">
                                <Card.Body className="p-4">
                                    <h5>Learning & Courses</h5>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Top Tech Courses</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Unlimited Access</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Communication Skills</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Mock Interviews</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>24/7 Support</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-grid-card">
                                <Card.Body className="p-4">
                                    <h5>AI-Powered Tools</h5>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>AI Practice Tools</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Leadership Board</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>English Practice</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Speaking Practice</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Writing Practice</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-grid-card">
                                <Card.Body className="p-4">
                                    <h5>Assessment & Prep</h5>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Aptitude Prep</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Code Challenges</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>AI Interview</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Online Classes</span>
                                    </div>
                                    <div className="feature-item">
                                        <BsCheckCircleFill className="feature-icon" />
                                        <span>Final Assessment</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                </Row>
            </Container>
        </>
    );
};

export default SubscriptionPage;