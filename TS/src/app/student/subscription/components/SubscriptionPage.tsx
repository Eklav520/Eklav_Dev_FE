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
    BsDatabase,
    BsHddStack,
    BsShieldLock,
    BsFolderSymlink,
    BsPlusCircle,
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

// Orange glassy theme colors
const THEME = {
    primary: '#ff8a4c',
    secondary: '#ff6b2b',
    accent: '#ffb347',
    dark: '#e85d1c',
    light: '#fff1e6',
    soft: '#ffe4d6',
    glow: 'rgba(255, 139, 76, 0.3)',
    gradient: 'linear-gradient(145deg, #ff8a4c 0%, #ff6b2b 100%)',
    gradientGlow: 'linear-gradient(145deg, #ff9a5c 0%, #ff7b3b 100%)',
    glass: 'rgba(255, 255, 255, 0.9)',
    glassDark: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(255, 139, 76, 0.2)',
    shadow: '0 25px 40px -12px rgba(255, 107, 43, 0.25)',
    text: {
        primary: '#2d2d2d',
        secondary: '#4a4a4a',
        muted: '#6f6f6f',
        light: '#8f8f8f',
        white: '#ffffff',
        orange: '#ff6b2b',
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
        'No payment required',
        'Access to sample courses',
        'Community support',
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
    'Self Interview with AI',
];

const SubscriptionPage = () => {
    const { user, refreshUser } = useAuthContext();
    //const { user, updateUser } = useAuthContext();
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

    console.log('profile',profile)

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
                    key: orderData.key,
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
                            })

                            await refreshUser()

                            // 🔥 Also update local profile state
                            const profileRes = await fetch(`${baseURL}/profile`, {
                                headers: { Authorization: `Bearer ${token}` },
                            })

                            const profileData = await profileRes.json()
                            setProfile(profileData)
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

    /*  const refreshUserProfile = async () => {
         const profileRes = await fetch(`${baseURL}/profile`, {
             headers: {
                 Authorization: `Bearer ${token}`,
             },
         })
 
         if (!profileRes.ok) throw new Error('Failed to refresh profile')
 
         const profileData = await profileRes.json()
 
         updateUser(profileData)  // 🔥 real backend data
     } */

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
          background: linear-gradient(135deg, #fff9f5 0%, #fff2e8 100%);
        }

        /* Orange Glassmorphism Effects */
        .glass-card {
          background: ${THEME.glass};
          backdrop-filter: blur(10px);
          border: 1px solid ${THEME.border};
          border-radius: 32px;
          box-shadow: ${THEME.shadow};
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.7s ease;
        }

        .glass-card:hover::before {
          left: 100%;
        }

        .glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: ${THEME.primary};
          box-shadow: 0 30px 50px -15px ${THEME.glow};
        }

        .glass-card.popular {
          background: ${THEME.glassDark};
          border: 2px solid ${THEME.primary};
          box-shadow: 0 30px 50px -15px ${THEME.glow};
        }

        /* Popular Badge */
        .popular-badge {
          position: absolute;
          top: 24px;
          right: 24px;
          background: ${THEME.gradient};
          color: white;
          padding: 8px 20px;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 10px 20px -5px ${THEME.glow};
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        /* Plan Header with Orange Glow */
        .plan-header {
          text-align: center;
          padding: 24px 24px 16px;
          border-bottom: 2px dashed ${THEME.border};
        }

        .plan-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: ${THEME.gradient};
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2.5rem;
          box-shadow: 0 15px 25px -8px ${THEME.glow};
          transform: rotate(0deg);
          transition: transform 0.3s ease;
        }

        .glass-card:hover .plan-icon {
          transform: rotate(5deg) scale(1.05);
        }

        .plan-title {
          font-size: 2rem;
          font-weight: 800;
          color: ${THEME.text.primary};
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }

        .plan-subtitle {
          color: ${THEME.text.orange};
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Price Section */
        .price-section {
          text-align: center;
          padding: 20px 24px;
          background: linear-gradient(145deg, ${THEME.light}, transparent);
        }

        .price {
          font-size: 3.5rem;
          font-weight: 800;
          color: ${THEME.text.primary};
          line-height: 1;
        }

        .price small {
          font-size: 1.2rem;
          font-weight: 500;
          color: ${THEME.text.muted};
        }

        .price-period {
          color: ${THEME.text.muted};
          font-size: 1rem;
          font-weight: 500;
          display: block;
          margin-top: 4px;
        }

        .original-price {
          font-size: 1.2rem;
          color: ${THEME.text.light};
          text-decoration: line-through;
          margin-right: 8px;
        }

        .discount-badge {
          background: ${THEME.gradient};
          color: white;
          padding: 6px 16px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
          margin-top: 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        /* Features List */
        .features-list {
          padding: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          color: ${THEME.text.secondary};
          font-size: 0.95rem;
        }

        .feature-icon-wrapper {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          color: ${THEME.primary};
          flex-shrink: 0;
        }

        .feature-item svg {
          width: 20px;
          height: 20px;
        }

        .more-features {
          display: flex;
          align-items: center;
          padding: 8px 0;
          color: ${THEME.primary};
          font-size: 0.95rem;
          font-weight: 600;
        }

        .more-features svg {
          color: ${THEME.primary};
          margin-right: 12px;
          font-size: 1.2rem;
        }

        /* Action Button */
        .plan-action {
          padding: 0 24px 24px;
        }

        .btn-plan {
          width: 100%;
          padding: 16px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
          border: none;
          background: ${THEME.gradient};
          color: white;
          box-shadow: 0 10px 20px -5px ${THEME.glow};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-plan::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .btn-plan:hover::before {
          left: 100%;
        }

        .btn-plan:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 30px -8px ${THEME.glow};
        }

        .btn-plan:disabled {
          opacity: 0.7;
          transform: none;
        }

        .btn-plan-outline {
          background: transparent;
          border: 2px solid ${THEME.primary};
          color: ${THEME.primary};
          box-shadow: none;
        }

        .btn-plan-outline:hover {
          background: ${THEME.gradient};
          color: white;
          border-color: transparent;
        }

        /* Active Subscription Banner */
        .active-banner {
          background: ${THEME.gradient};
          border-radius: 60px;
          padding: 20px 30px;
          color: white;
          box-shadow: 0 20px 30px -10px ${THEME.glow};
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        .active-banner-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .active-banner-item svg {
          font-size: 2rem;
          opacity: 0.9;
        }

        .active-banner-item .label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .active-banner-item .value {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .active-status-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 40px;
          padding: 12px 30px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
        }

        /* Coupon Styles */
        .coupon-section {
          background: ${THEME.glass};
          backdrop-filter: blur(10px);
          border-radius: 30px;
          padding: 30px;
          border: 1px solid ${THEME.border};
          box-shadow: ${THEME.shadow};
        }

        .coupon-chip {
          background: white;
          border: 1px solid ${THEME.border};
          border-radius: 50px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 5px 15px rgba(255, 107, 43, 0.1);
        }

        .coupon-chip:hover {
          transform: translateY(-3px);
          border-color: ${THEME.primary};
          box-shadow: 0 15px 25px -8px ${THEME.glow};
        }

        .coupon-code {
          font-weight: 700;
          letter-spacing: 1px;
          color: ${THEME.primary};
        }

        .coupon-badge {
          background: ${THEME.gradient};
          color: white;
          padding: 4px 12px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .coupon-input-group {
          background: white;
          border-radius: 60px;
          padding: 5px;
          border: 1px solid ${THEME.border};
          box-shadow: 0 5px 15px rgba(255, 107, 43, 0.1);
        }

        .coupon-input {
          border: none;
          background: transparent;
          padding: 12px 20px;
          font-weight: 600;
          letter-spacing: 1px;
          color: ${THEME.text.primary};
        }
        
        .coupon-input::placeholder {
            color: #666 !important;
            opacity: 1 !important;
            }

            .coupon-input {
            color: #222 !important;
            }

        .coupon-input:focus {
          outline: none;
          box-shadow: none;
          background: transparent;
        }

        .coupon-apply-btn {
          background: ${THEME.gradient};
          border: none;
          border-radius: 50px !important;
          padding: 12px 30px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
        }

        .coupon-apply-btn:hover {
          transform: translateX(5px);
          box-shadow: 0 10px 20px -5px ${THEME.glow};
        }

        .applied-coupon {
          background: ${THEME.light};
          border-radius: 50px;
          padding: 15px 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid ${THEME.primary};
        }

        /* Features Header - Made White */
        .features-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .features-header h2 {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${THEME.text.primary};
          margin-bottom: 0.5rem;
        }

        .features-header p {
          color: ${THEME.text.secondary};
          font-size: 1.2rem;
          opacity: 0.9;
        }

        /* Feature Cards */
        .feature-card {
          background: white;
          border: 1px solid ${THEME.border};
          border-radius: 32px;
          padding: 2rem;
          height: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px -10px rgba(255, 107, 43, 0.1);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -12px ${THEME.glow};
          border-color: ${THEME.primary};
        }

        .feature-card h4 {
          color: ${THEME.text.primary};
          font-weight: 700;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .feature-card .feature-item {
          color: ${THEME.text.secondary};
          padding: 6px 0;
        }

        .feature-card .feature-icon-wrapper {
          color: ${THEME.primary};
        }

        /* Responsive */
        @media (max-width: 768px) {
          .price {
            font-size: 2.5rem;
          }
          
          .plan-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
          }
          
          .active-banner {
            flex-direction: column;
            text-align: center;
          }
          
          .active-banner-item {
            width: 100%;
            justify-content: center;
          }
        }

        .features-header-text {
            text-align: center;
            }

            .features-header-text h2 {
            font-weight: 800;
            margin-bottom: 0.5rem;
            font-size: 2rem;
            color: white;
            }

            .features-header-text p {
            color: #ddd;
            font-size: 1.1rem;
            }
      `}</style>

            <Container className="py-5">
                {/* Active Subscription Banner */}
                {subscription?.isActive && (
                    <Row className="justify-content-center mb-5">
                        <Col xs={12} lg={10}>
                            <div className="active-banner d-flex align-items-center justify-content-between flex-wrap gap-4">
                                <div className="active-banner-item">
                                    <BsShieldCheck />
                                    <div>
                                        <div className="label">Active Plan</div>
                                        <div className="value">
                                            {subscription.plan === '12months' ? '12 Months Premium' :
                                                subscription.plan === '6months' ? '6 Months Premium' :
                                                    'Premium Plan'}
                                        </div>
                                    </div>
                                </div>
                                <div className="active-banner-item">
                                    <BsClock />
                                    <div>
                                        <div className="label">Valid Until</div>
                                        <div className="value">{formatDate(subscription.endDate)}</div>
                                    </div>
                                </div>
                                <span className="active-status-badge">
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
                        <Col xs={12} lg={8}>
                            <div className="coupon-section text-center">
                                <h4 className="mb-4" style={{ color: THEME.text.orange, fontWeight: 700 }}>
                                    <BsTagFill className="me-2" />
                                    Exclusive Offers
                                </h4>

                                {/* Available Coupons */}
                                {universalCoupons.length > 0 && !appliedCoupon && (
                                    <div className="d-flex justify-content-center flex-wrap gap-3 mb-4">
                                        {universalCoupons.map((coupon) => (
                                            <div
                                                key={coupon.code}
                                                className="coupon-chip"
                                                onClick={() => copyToClipboard(coupon.code)}
                                            >
                                                <span className="coupon-code">{coupon.code}</span>
                                                <span className="coupon-badge">{coupon.discountPercent}% OFF</span>
                                                {copiedCode === coupon.code ? (
                                                    <BsClipboardCheck style={{ color: '#10b981' }} />
                                                ) : (
                                                    <BsClipboard style={{ color: THEME.text.light }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Coupon Input */}
                                {appliedCoupon?.valid ? (
                                    <div className="applied-coupon">
                                        <div>
                                            <span className="fw-bold" style={{ color: THEME.primary }}>
                                                {appliedCoupon.code}
                                            </span>
                                            <span className="mx-3 text-muted">•</span>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                {appliedCoupon.discountPercent}% OFF
                                            </span>
                                        </div>
                                        <Button
                                            variant="link"
                                            className="text-danger p-0"
                                            onClick={removeCoupon}
                                        >
                                            <BsXCircleFill size={20} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="d-flex coupon-input-group">
                                        <Form.Control
                                            type="text"
                                            placeholder="ENTER COUPON CODE"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase());
                                                if (couponResult) setCouponResult(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                                            className="coupon-input"
                                            disabled={couponLoading}
                                        />
                                        <Button
                                            className="coupon-apply-btn"
                                            onClick={() => validateCoupon()}
                                            disabled={!couponCode.trim() || couponLoading}
                                        >
                                            {couponLoading ? <Spinner size="sm" /> : 'Apply'}
                                        </Button>
                                    </div>
                                )}

                                {couponResult && !couponResult.valid && (
                                    <div className="text-danger small mt-3">
                                        <BsXCircleFill className="me-1" />
                                        {couponResult.error}
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Plan Cards - Redesigned with Orange Glassy Look */}
                <Row className="g-4 justify-content-center">
                    {allPlans.map((plan, index) => {
                        const isCurrentPlan = subscription?.isActive && subscription.plan === plan.id;
                        const discountedPrice = getDiscountedPrice(plan);
                        const displayPrice = discountedPrice ?? plan.price;

                        // Map icons based on plan
                        const PlanIcon = index === 0 ? BsLightningCharge : index === 1 ? BsPeople : BsRocket;

                        return (
                            <Col key={plan.id} xs={12} md={6} lg={4}>
                                <Card className={`glass-card ${plan.popular ? 'popular' : ''} ${plan.isFree ? 'bg-white' : ''}`}>
                                    {plan.popular && (
                                        <div className="popular-badge">
                                            <BsStarFill size={16} />
                                            Most Popular
                                        </div>
                                    )}

                                    {/* Plan Header with Icon */}
                                    <div className="plan-header">
                                        <div className="plan-icon">
                                            <PlanIcon />
                                        </div>
                                        <h3 className="plan-title">{plan.label}</h3>
                                        {plan.duration && (
                                            <div className="plan-subtitle">{plan.duration} Access</div>
                                        )}
                                    </div>

                                    {/* Price Section */}
                                    <div className="price-section">
                                        {plan.isFree ? (
                                            <div className="price">Free</div>
                                        ) : (
                                            <>
                                                <div>
                                                    {discountedPrice && (
                                                        <span className="original-price">₹{plan.price}</span>
                                                    )}
                                                    <span className="price">
                                                        ₹{displayPrice}
                                                        <small>.00</small>
                                                    </span>
                                                </div>
                                                <span className="price-period">/{plan.duration.toLowerCase()}</span>
                                                {discountedPrice && (
                                                    <div className="discount-badge">
                                                        Save {appliedCoupon?.discountPercent}%
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    <div className="features-list">
                                        {plan.features?.slice(0, 6).map((feature, idx) => (
                                            <div key={idx} className="feature-item">
                                                <div className="feature-icon-wrapper">
                                                    <BsCheckCircleFill />
                                                </div>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                        {plan.features && plan.features.length > 6 && (
                                            <div className="more-features">
                                                <BsPlusCircle />
                                                <span>+{plan.features.length - 6} more features</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="plan-action">
                                        {isCurrentPlan ? (
                                            <Button className="btn-plan" disabled>
                                                <BsCheckCircleFill className="me-2" />
                                                Current Plan
                                            </Button>
                                        ) : plan.isFree ? (
                                            <Button
                                                className="btn-plan btn-plan-outline"
                                                onClick={() => window.location.href = '/student/dashboard'}
                                                disabled={subscription?.isActive}
                                            >
                                                {subscription?.isActive ? 'Already Subscribed' : 'Start Free Trial'}
                                            </Button>
                                        ) : (
                                            <Button
                                                className={`btn-plan ${!plan.popular ? 'btn-plan-outline' : ''}`}
                                                onClick={() => handlePayment(plan)}
                                                disabled={!!paymentLoading || subscription?.isActive}
                                            >
                                                {paymentLoading === plan.id ? (
                                                    <>
                                                        <Spinner animation="border" size="sm" className="me-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Select Plan
                                                        <BsArrowRight className="ms-2" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Features Section - Fixed Visibility */}
                <Row className="mt-5 pt-4">
                    <Col xs={12}>
                        <div className="features-header-text">
                            <h2>Everything You Get</h2>
                            <p>All premium plans include these core features</p>
                        </div>
                    </Col>

                    <Row className="g-4">
                        <Col md={4}>
                            <div className="feature-card">
                                <div className="plan-icon" style={{ width: 60, height: 60, fontSize: '1.8rem', marginBottom: 20 }}>
                                    <BsFolderSymlink />
                                </div>
                                <h4>Learning & Courses</h4>
                                {['Top Tech Courses', 'Unlimited Access', 'Communication Skills', 'Mock Interviews', '24/7 Support'].map((item, idx) => (
                                    <div key={idx} className="feature-item">
                                        <div className="feature-icon-wrapper">
                                            <BsCheckCircleFill />
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>

                        <Col md={4}>
                            <div className="feature-card">
                                <div className="plan-icon" style={{ width: 60, height: 60, fontSize: '1.8rem', marginBottom: 20 }}>
                                    <BsHddStack />
                                </div>
                                <h4>AI-Powered Tools</h4>
                                {['AI Practice Tools', 'Leadership Board', 'English Practice', 'Speaking Practice', 'Writing Practice'].map((item, idx) => (
                                    <div key={idx} className="feature-item">
                                        <div className="feature-icon-wrapper">
                                            <BsCheckCircleFill />
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>

                        <Col md={4}>
                            <div className="feature-card">
                                <div className="plan-icon" style={{ width: 60, height: 60, fontSize: '1.8rem', marginBottom: 20 }}>
                                    <BsShieldLock />
                                </div>
                                <h4>Assessment & Prep</h4>
                                {['Aptitude Prep', 'Code Challenges', 'AI Interview', 'Online Classes', 'Final Assessment'].map((item, idx) => (
                                    <div key={idx} className="feature-item">
                                        <div className="feature-icon-wrapper">
                                            <BsCheckCircleFill />
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Row>
            </Container>
        </>
    );
};

export default SubscriptionPage;