import PageMetaData from '@/components/PageMetaData';
import cupponboxImg from '@/assets/images/Cupponbox.png';
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

    // Confetti
    const [showConfetti, setShowConfetti] = useState(false);
    const triggerConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2800);
    };

    // Countdown timer for first universal coupon
    const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });
    useEffect(() => {
        if (!universalCoupons.length) return;
        const end = new Date(universalCoupons[0].endDate).getTime();
        const tick = () => {
            const diff = end - Date.now();
            if (diff <= 0) { setCountdown({ d: '00', h: '00', m: '00', s: '00' }); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown({
                d: String(d).padStart(2, '0'),
                h: String(h).padStart(2, '0'),
                m: String(m).padStart(2, '0'),
                s: String(s).padStart(2, '0'),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [universalCoupons]);

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
                if (data.valid) triggerConfetti();
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

    const OG = '#ff7a00'
    const OG2 = '#ff6020'
    const GRAD = `linear-gradient(135deg, ${OG}, ${OG2})`

    // Reads the same --dash-* CSS vars StudentLayout sets for dark mode
    // (light-mode values as fallback), so this page re-themes along with
    // the rest of the portal without needing its own theme plumbing.
    const PAGE_TEXT = 'var(--dash-text, #1a1a1a)'
    const PAGE_GRAY = 'var(--dash-gray, #6f6f6f)'
    const PAGE_CARD_BG = 'var(--dash-card-bg, #ffffff)'
    const PAGE_BORDER = 'var(--dash-border, #ebebeb)'
    const PAGE_BG = 'var(--dash-page-bg, #f9f9f9)'

    return (
        <>
            <PageMetaData title="Subscription" />

            <style>{`
        body {
          background: #f1f3f8;
        }

        /* Orange Glassmorphism Effects */
        .glass-card {
          background: ${PAGE_CARD_BG};
          border: 1px solid ${PAGE_BORDER};
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(255,107,43,0.15);
          border-color: ${THEME.primary};
        }

        .glass-card.popular {
          background: ${PAGE_CARD_BG};
          border: 2px solid ${THEME.primary};
          box-shadow: 0 8px 32px rgba(255,107,43,0.18);
        }

        /* Popular Badge */
        .popular-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: ${THEME.gradient};
          color: white;
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 16px -5px ${THEME.glow};
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        /* Plan Header */
        .plan-header {
          text-align: center;
          padding: 28px 20px 16px;
        }

        .plan-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 18px;
          background: ${THEME.gradient};
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          box-shadow: 0 8px 20px -6px ${THEME.glow};
          transition: transform 0.3s ease;
        }

        .glass-card:hover .plan-icon {
          transform: scale(1.06);
        }

        .plan-title {
          font-size: clamp(1.4rem, 4vw, 1.75rem);
          font-weight: 800;
          color: ${PAGE_TEXT};
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .plan-subtitle {
          color: ${THEME.secondary};
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        /* Price Section */
        .price-section {
          text-align: center;
          padding: 0 20px 8px;
        }

        .price-box {
          background: #fff4ec;
          border-radius: 14px;
          padding: 18px 16px 14px;
          margin-bottom: 4px;
        }

        .price {
          font-size: clamp(2.2rem, 8vw, 3.2rem);
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1;
        }

        .price small {
          font-size: clamp(0.85rem, 2.5vw, 1rem);
          font-weight: 500;
          color: #888;
        }

        .price-period {
          color: #888;
          font-size: 0.88rem;
          font-weight: 500;
          display: block;
          margin-top: 6px;
        }

        .original-price {
          font-size: clamp(1rem, 3vw, 1.2rem);
          color: ${THEME.text.light};
          text-decoration: line-through;
          margin-right: 8px;
        }

        .discount-badge {
          background: ${THEME.gradient};
          color: white;
          padding: 4px 12px;
          border-radius: 30px;
          font-weight: 600;
          font-size: clamp(0.8rem, 2.5vw, 0.9rem);
          display: inline-block;
          margin-top: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        /* Features List */
        .features-list {
          padding: 12px 20px 8px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          padding: 6px 0;
          color: ${THEME.text.secondary};
          font-size: clamp(0.85rem, 2.5vw, 0.95rem);
        }

        .feature-icon-wrapper {
          width: 20px;
          height: 20px;
          margin-right: 10px;
          color: ${THEME.primary};
          flex-shrink: 0;
        }

        .feature-item svg {
          width: 16px;
          height: 16px;
        }

        .more-features {
          display: flex;
          align-items: center;
          padding: 6px 0;
          color: ${THEME.primary};
          font-size: clamp(0.85rem, 2.5vw, 0.95rem);
          font-weight: 600;
        }

        .more-features svg {
          color: ${THEME.primary};
          margin-right: 10px;
          font-size: 1.1rem;
        }

        /* Action Button */
        .plan-action {
          padding: 8px 20px 24px;
        }

        .btn-plan {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.3px;
          border: none;
          background: ${THEME.gradient};
          color: white;
          box-shadow: 0 4px 14px -4px ${THEME.glow};
          transition: all 0.25s ease;
        }

        .btn-plan:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -6px ${THEME.glow};
          opacity: 0.92;
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
          border-radius: 30px;
          padding: 20px;
          color: white;
          box-shadow: 0 20px 30px -10px ${THEME.glow};
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        .active-banner-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .active-banner-item svg {
          font-size: 1.8rem;
          opacity: 0.9;
          flex-shrink: 0;
        }

        .active-banner-item .label {
          font-size: 0.85rem;
          opacity: 0.9;
          margin-bottom: 2px;
        }

        .active-banner-item .value {
          font-size: clamp(1rem, 4vw, 1.3rem);
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .active-status-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 30px;
          padding: 10px 24px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          width: 100%;
          justify-content: center;
        }

        /* Coupon Styles */
        .coupon-section {
          background: ${THEME.glass};
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 24px 16px;
          border: 1px solid ${THEME.border};
          box-shadow: ${THEME.shadow};
        }

        .coupon-chip {
          background: white;
          border: 1px solid ${THEME.border};
          border-radius: 40px;
          padding: 10px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 5px 15px rgba(255, 107, 43, 0.1);
          width: 100%;
          justify-content: center;
        }

        .coupon-chip:hover {
          transform: translateY(-2px);
          border-color: ${THEME.primary};
          box-shadow: 0 12px 20px -8px ${THEME.glow};
        }

        .coupon-code {
          font-weight: 700;
          letter-spacing: 1px;
          color: ${THEME.primary};
          font-size: clamp(0.85rem, 3vw, 1rem);
        }

        .coupon-badge {
          background: ${THEME.gradient};
          color: white;
          padding: 4px 10px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .coupon-input-group {
          background: white;
          border-radius: 50px;
          padding: 4px;
          border: 1px solid ${THEME.border};
          box-shadow: 0 5px 15px rgba(255, 107, 43, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (min-width: 576px) {
          .coupon-input-group {
            flex-direction: row;
          }
        }

        .coupon-input {
          border: none;
          background: transparent;
          padding: 12px 16px;
          font-weight: 600;
          letter-spacing: 1px;
          color: ${THEME.text.primary};
          font-size: clamp(0.85rem, 3vw, 1rem);
          width: 100%;
        }
        
        .coupon-input::placeholder {
            color: #666 !important;
            opacity: 1 !important;
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
          padding: 12px 24px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          width: 100%;
        }

        @media (min-width: 576px) {
          .coupon-apply-btn {
            width: auto;
          }
        }

        .coupon-apply-btn:hover {
          transform: translateX(5px);
          box-shadow: 0 10px 20px -5px ${THEME.glow};
        }

        .applied-coupon {
          background: ${THEME.light};
          border-radius: 40px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid ${THEME.primary};
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Features Header */
        .features-header-text {
            text-align: center;
        }

        .features-header-text h2 {
            font-weight: 800;
            margin-bottom: 0.5rem;
            font-size: clamp(1.8rem, 5vw, 2.5rem);
            color: ${PAGE_TEXT};
        }

        .features-header-text p {
            color: ${PAGE_GRAY};
            font-size: clamp(0.95rem, 3vw, 1.1rem);
        }

        /* Feature Cards */
        .feature-card {
          background: white;
          border: 1px solid ${THEME.border};
          border-radius: 24px;
          padding: 24px 20px;
          height: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px -10px rgba(255, 107, 43, 0.1);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px ${THEME.glow};
          border-color: ${THEME.primary};
        }

        .feature-card h4 {
          color: ${THEME.text.primary};
          font-weight: 700;
          margin-bottom: 1.2rem;
          font-size: clamp(1.2rem, 4vw, 1.3rem);
        }

        .feature-card .feature-item {
          color: ${THEME.text.secondary};
          padding: 5px 0;
          font-size: clamp(0.85rem, 2.5vw, 0.95rem);
        }

        .feature-card .feature-icon-wrapper {
          color: ${THEME.primary};
        }

        /* Container padding for mobile */
        .container {
          padding-left: 16px;
          padding-right: 16px;
        }

        /* Row gap for mobile */
        .row {
          --bs-gutter-y: 1rem;
        }

        @media (min-width: 768px) {
          .row {
            --bs-gutter-y: 1.5rem;
          }
        }

        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(-320px) rotate(720deg) scale(0.4); opacity: 0; }
        }
        @keyframes confetti-side {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(var(--tx)) translateY(-260px) rotate(540deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confetti-side 2.4s ease-out forwards;
          pointer-events: none;
        }
      `}</style>

            {/* ── Confetti burst ── */}
            {showConfetti && (
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
                    {Array.from({ length: 48 }).map((_, i) => {
                        const colors = ['#ff7a00','#ff3d00','#ffd600','#00c853','#2979ff','#e040fb','#f06292','#00bcd4','#ffab40'];
                        const color = colors[i % colors.length];
                        const tx = `${(Math.random() - 0.5) * 600}px`;
                        const delay = `${Math.random() * 0.5}s`;
                        const size = 6 + Math.random() * 10;
                        const left = `${10 + Math.random() * 80}%`;
                        const isCircle = i % 3 === 0;
                        return (
                            <div key={i} className="confetti-piece" style={{
                                left, bottom: '40%',
                                width: size, height: isCircle ? size : size * 0.5,
                                background: color,
                                borderRadius: isCircle ? '50%' : 2,
                                animationDelay: delay,
                                ['--tx' as any]: tx,
                            }} />
                        );
                    })}
                </div>
            )}

            {/* ── Page wrapper ── */}
            <div style={{ padding: '12px 20px', fontFamily: '"Segoe UI", sans-serif' }}>

                {/* ── Title ── */}
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <h2 style={{ fontWeight: 800, color: PAGE_TEXT, fontSize: '1.6rem', marginBottom: 2 }}>
                        ✦ Choose Your Plan ✦
                    </h2>
                    <p style={{ color: PAGE_GRAY, fontSize: '0.85rem', margin: 0 }}>
                        Unlock all features and accelerate your learning journey with Eklav.
                    </p>
                </div>

                {/* ── Active Plan Banner ── */}
                {subscription?.isActive && (
                    <div style={{
                        background: GRAD,
                        borderRadius: 16,
                        padding: '14px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginBottom: 14,
                        color: 'white',
                        boxShadow: '0 6px 20px rgba(255,107,43,0.3)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <BsShieldCheck size={28} style={{ opacity: 0.9 }} />
                            <div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: 2 }}>Active Plan</div>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>
                                    {subscription.plan === '12months' ? '12 Months Premium'
                                        : subscription.plan === '6months' ? '6 Months Premium'
                                        : 'Premium Plan'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <BsClock size={24} style={{ opacity: 0.9 }} />
                            <div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: 2 }}>Valid Until</div>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>{formatDate(subscription.endDate)}</div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.18)',
                            border: '2px solid rgba(255,255,255,0.55)',
                            borderRadius: 50,
                            padding: '9px 30px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.95rem',
                        }}>
                            <BsCheckCircleFill />
                            Active
                        </div>
                    </div>
                )}

                {/* ── Coupon Section (only when not subscribed) ── */}
                {!subscription?.isActive && (
                    <div style={{ marginBottom: 20 }}>
                        {/* Banner */}
                        {universalCoupons.length > 0 && (
                            <div style={{
                                background: '#fff8f3',
                                borderRadius: 16,
                                border: '1px solid #ffe0c8',
                                padding: '20px 28px',
                                marginBottom: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 24,
                                flexWrap: 'wrap',
                                boxShadow: '0 2px 12px rgba(255,122,0,0.07)',
                            }}>
                                {/* Gift image */}
                                <img src={cupponboxImg} alt="Offer" style={{ height: 90, objectFit: 'contain', flexShrink: 0 }} />

                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 180 }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #ffd4b0', borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
                                        <BsTagFill style={{ color: OG, fontSize: 11 }} />
                                        <span style={{ color: OG, fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.5 }}>LIMITED TIME OFFER</span>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a', marginBottom: 4 }}>Unlock Premium. Save More.</div>
                                    <div style={{ color: '#888', fontSize: '0.85rem' }}>Get an exclusive discount on all premium plans.<br />Hurry, offer ends soon!</div>
                                </div>

                                {/* Coupon codes + timer */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
                                    {universalCoupons.map((coupon) => (
                                        <div key={coupon.code}>
                                            <div style={{
                                                border: `1.5px dashed ${OG}`, borderRadius: 12,
                                                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                                                background: 'white', cursor: 'pointer',
                                            }} onClick={() => copyToClipboard(coupon.code)}>
                                                <div style={{ flex: 1, textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: OG, letterSpacing: 1 }}>{coupon.code}</div>
                                                    <div style={{ fontSize: '0.68rem', color: '#999', letterSpacing: 0.5 }}>COUPON CODE</div>
                                                </div>
                                                <div style={{ width: 1, background: '#ffd4b0', alignSelf: 'stretch' }} />
                                                <div style={{ flex: 1, textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: OG }}>{coupon.discountPercent}% OFF</div>
                                                    <div style={{ fontSize: '0.68rem', color: '#999', letterSpacing: 0.5 }}>ON ALL PLANS</div>
                                                </div>
                                                <div>
                                                    {copiedCode === coupon.code
                                                        ? <BsClipboardCheck style={{ color: '#10b981', fontSize: 16 }} />
                                                        : <BsClipboard style={{ color: '#bbb', fontSize: 16 }} />}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, fontSize: '0.8rem', color: '#555' }}>
                                                <BsClock style={{ color: OG, fontSize: 13 }} />
                                                <span>Offer ends in</span>
                                                <span style={{ color: OG, fontWeight: 700 }}>{countdown.d}d : {countdown.h}h : {countdown.m}m : {countdown.s}s</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coupon input */}
                        <div style={{
                            background: PAGE_CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '18px 20px',
                            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BsTagFill style={{ color: OG, fontSize: 18 }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.95rem' }}>Have a coupon code?</div>
                                    <div style={{ color: PAGE_GRAY, fontSize: '0.78rem' }}>Enter your code to get the best discount</div>
                                </div>
                            </div>

                            {appliedCoupon?.valid ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff4ec', borderRadius: 40, padding: '10px 16px', border: `1px solid ${OG}` }}>
                                    <span><strong style={{ color: OG }}>{appliedCoupon.code}</strong> <span style={{ color: '#aaa' }}>•</span> <span style={{ color: '#10b981', fontWeight: 600 }}>{appliedCoupon.discountPercent}% OFF</span></span>
                                    <Button variant="link" className="text-danger p-0" onClick={removeCoupon}><BsXCircleFill size={18} /></Button>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', gap: 8, background: PAGE_BG, borderRadius: 50, padding: '4px 4px 4px 16px', border: `1px solid ${PAGE_BORDER}`, minWidth: 220 }}>
                                    <Form.Control type="text" placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponResult) setCouponResult(null); }}
                                        onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
                                        disabled={couponLoading}
                                        style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', outline: 'none', boxShadow: 'none', padding: 0, color: PAGE_TEXT, fontWeight: 700, letterSpacing: 1 }}
                                    />
                                    <button onClick={() => validateCoupon()} disabled={!couponCode.trim() || couponLoading}
                                        style={{ background: GRAD, border: 'none', borderRadius: 50, padding: '10px 24px', color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {couponLoading ? <Spinner size="sm" /> : 'Apply'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {couponResult && !couponResult.valid && (
                            <div style={{ color: '#dc2626', fontSize: '0.83rem', marginTop: 6, paddingLeft: 4 }}>
                                <BsXCircleFill style={{ marginRight: 4 }} />{couponResult.error}
                            </div>
                        )}

                        {/* Trust badges */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginTop: 12, background: PAGE_CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, overflow: 'hidden' }}>
                            {[
                                { icon: <BsTagFill style={{ color: OG, fontSize: 18 }} />, title: 'Best Prices Guaranteed', sub: 'Get the lowest price on all plans' },
                                { icon: <BsShieldCheck style={{ color: OG, fontSize: 18 }} />, title: 'Secure & Safe Payment', sub: '100% secure transactions' },
                                { icon: <BsPeople style={{ color: OG, fontSize: 18 }} />, title: '24/7 Support', sub: "We're here to help anytime" },
                            ].map((item, i, arr) => (
                                <div key={i} style={{
                                    flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                                    borderRight: i < arr.length - 1 ? `1px solid ${PAGE_BORDER}` : 'none',
                                }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: PAGE_TEXT }}>{item.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: PAGE_GRAY }}>{item.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.75rem', marginTop: 8 }}>
                            <BsShieldCheck style={{ marginRight: 4 }} />Your data is safe and encrypted
                        </div>
                    </div>
                )}

                {/* ── Alerts ── */}
                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                {successMsg && <Alert variant="success" className="mb-3">{successMsg}</Alert>}

                {/* ── Plan Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {allPlans.map((plan, index) => {
                        const isCurrentPlan = subscription?.isActive && subscription.plan === plan.id
                        const discountedPrice = getDiscountedPrice(plan)
                        const displayPrice = discountedPrice ?? plan.price
                        const PlanIcon = index === 0 ? BsLightningCharge : index === 1 ? BsPeople : BsRocket

                        return (
                            <div key={plan.id} style={{
                                background: PAGE_CARD_BG,
                                borderRadius: 18,
                                border: plan.popular ? `2px solid ${OG}` : `1px solid ${PAGE_BORDER}`,
                                padding: '24px 20px 20px',
                                position: 'relative',
                                boxShadow: plan.popular
                                    ? '0 6px 24px rgba(255,107,43,0.15)'
                                    : '0 2px 12px rgba(0,0,0,0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                {/* Popular badge */}
                                {plan.popular && (
                                    <div style={{
                                        position: 'absolute', top: -14, right: 18,
                                        background: GRAD, color: 'white',
                                        padding: '5px 14px', borderRadius: 30,
                                        fontSize: '0.78rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        boxShadow: '0 4px 12px rgba(255,107,43,0.4)',
                                    }}>
                                        <BsStarFill size={11} /> Most Popular
                                    </div>
                                )}

                                {/* Icon */}
                                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                    <div style={{
                                        width: 54, height: 54,
                                        background: isCurrentPlan ? 'linear-gradient(135deg, #10b981, #059669)' : GRAD,
                                        borderRadius: 15,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 22,
                                        boxShadow: isCurrentPlan ? '0 4px 14px rgba(16,185,129,0.35)' : '0 4px 14px rgba(255,107,43,0.35)',
                                    }}>
                                        <PlanIcon />
                                    </div>
                                </div>

                                {/* Plan name + subtitle */}
                                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                    <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: PAGE_TEXT, margin: '0 0 3px' }}>
                                        {plan.label}
                                    </h3>
                                    {plan.duration && (
                                        <div style={{ color: OG, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                            {plan.duration} Access
                                        </div>
                                    )}
                                </div>

                                {/* Price box */}
                                <div style={{
                                    background: '#fff4ec',
                                    borderRadius: 12,
                                    padding: '10px 14px',
                                    textAlign: 'center',
                                    marginBottom: 10,
                                }}>
                                    {plan.isFree ? (
                                        <div style={{ fontWeight: 900, fontSize: '2rem', color: '#1a1a1a', lineHeight: 1 }}>Free</div>
                                    ) : (
                                        <>
                                            {discountedPrice && (
                                                <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '0.85rem', marginRight: 6 }}>₹{plan.price}</span>
                                            )}
                                            <div style={{ lineHeight: 1 }}>
                                                <span style={{ fontWeight: 900, fontSize: '2rem', color: '#1a1a1a' }}>₹{displayPrice}</span>
                                                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#888' }}>.00</span>
                                            </div>
                                            <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 3 }}>/{plan.duration.toLowerCase()}</div>
                                            {discountedPrice && (
                                                <div style={{ display: 'inline-block', background: GRAD, color: 'white', padding: '2px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, marginTop: 6 }}>
                                                    Save {appliedCoupon?.discountPercent}%
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Features */}
                                <div style={{ flex: 1, marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 6px' }}>
                                    {plan.features?.map((feature, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', color: PAGE_GRAY, fontSize: '0.78rem' }}>
                                            <BsCheckCircleFill style={{ color: OG, flexShrink: 0, fontSize: 11 }} />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Button */}
                                {isCurrentPlan ? (
                                    <button disabled style={{
                                        width: '100%', padding: '10px', borderRadius: 10,
                                        background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                                        fontWeight: 700, border: 'none',
                                        cursor: 'not-allowed', fontSize: '0.88rem',
                                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                                    }}>
                                        <BsShieldCheck style={{ marginRight: 6 }} />
                                        Current Plan
                                    </button>
                                ) : plan.isFree ? (
                                    <button
                                        onClick={() => { window.location.href = '/student/dashboard' }}
                                        disabled={!!subscription?.isActive}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: 10,
                                            background: 'transparent', border: `2px solid ${OG}`,
                                            color: OG, fontWeight: 700, cursor: subscription?.isActive ? 'not-allowed' : 'pointer',
                                            fontSize: '0.88rem', opacity: subscription?.isActive ? 0.6 : 1,
                                        }}>
                                        {subscription?.isActive ? 'Already Subscribed' : 'Start Free Trial'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePayment(plan)}
                                        disabled={!!paymentLoading || !!subscription?.isActive}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: 10,
                                            background: GRAD, color: 'white',
                                            fontWeight: 700, border: 'none',
                                            cursor: (!!paymentLoading || subscription?.isActive) ? 'not-allowed' : 'pointer',
                                            opacity: (!!paymentLoading || subscription?.isActive) ? 0.7 : 1,
                                            fontSize: '0.88rem',
                                            boxShadow: '0 4px 12px rgba(255,107,43,0.35)',
                                        }}>
                                        {paymentLoading === plan.id ? (
                                            <><Spinner animation="border" size="sm" style={{ marginRight: 6 }} />Processing...</>
                                        ) : 'Choose Plan'}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    );
};

export default SubscriptionPage;