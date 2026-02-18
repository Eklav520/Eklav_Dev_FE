import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Container, Row, Modal } from 'react-bootstrap'
import { FaStar, FaSlidersH as Sliders, FaCrown, FaAward, FaMedal } from 'react-icons/fa'
import avatarFallback from '@/assets/images/avatar/09.jpg'
import { useAuthContext } from '@/context/useAuthContext'

interface BannerProps {
  toggleOffCanvas: () => void
}

type Sponsor = {
  name: string
  icon?: string
  domain?: string
  tier?: 'platinum' | 'gold' | 'silver'
}

const Banner = ({ toggleOffCanvas }: BannerProps) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user, removeSession } = useAuthContext()
  const token = user?.token

  const [name, setName] = useState('Jagadeesh')
  const [avatarUrl, setAvatarUrl] = useState(avatarFallback)
  const [averageRating, setAverageRating] = useState<number | null>(0)

  // Professional enterprise sponsors with icons - now with color specifications
  const [sponsors, setSponsors] = useState<Sponsor[]>([
    { name: 'TCS', domain: 'tcs.com', tier: 'platinum' },
    { name: 'Infosys', icon: 'simple-icons:infosys', domain: 'infosys.com', tier: 'platinum' },
    { name: 'LTIMindtree', domain: 'ltimindtree.com', tier: 'platinum' },
    { name: 'HCLTech', domain: 'hcltech.com', tier: 'platinum' },
    { name: 'Capgemini', icon: 'simple-icons:capgemini', domain: 'capgemini.com', tier: 'gold' },
    { name: 'AWS', icon: 'simple-icons:amazonaws', domain: 'aws.amazon.com', tier: 'gold' },
    { name: 'Wipro', icon: 'simple-icons:wipro', domain: 'wipro.com', tier: 'gold' },
    { name: 'IBM', icon: 'simple-icons:ibm', domain: 'ibm.com', tier: 'gold' },
    { name: 'Flipkart', icon: 'simple-icons:flipkart', domain: 'flipkart.com', tier: 'silver' },
    { name: 'Citi', icon: 'simple-icons:citi', domain: 'citi.com', tier: 'silver' },
    { name: 'Salesforce', icon: 'simple-icons:salesforce', domain: 'salesforce.com', tier: 'silver' },
  ])

  const [showZoom, setShowZoom] = useState(false)

  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`

  // Color mapping for different sponsor tiers and companies
  const getSponsorColor = (sponsor: Sponsor) => {
    // Company-specific colors
    const companyColors: { [key: string]: string } = {
      TCS: '#3d5a96',
      Infosys: '#007cc3',
      LTIMindtree: '#00a3e0',
      HCLTech: '#0067b3',
      Capgemini: '#ff0000',
      AWS: '#ff9900',
      Wipro: '#00599a',
      IBM: '#054ada',
      Flipkart: '#047bd5',
      Citi: '#0065a3',
      Salesforce: '#00a1e0',
    }

    // Tier-based fallback colors
    const tierColors = {
      platinum: '#e5e4e2',
      gold: '#ffd700',
      silver: '#c0c0c0',
    }

    return companyColors[sponsor.name] || tierColors[sponsor.tier || 'silver']
  }

  // Load sponsors from API
  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const res = await fetch(`${baseURL}/api/public/sponsors`)
        if (!res.ok) return
        const data = await res.json()
        const parsed: Sponsor[] = Array.isArray(data)
          ? data.map((s: any) => ({
              name: s.name || s,
              icon: s.icon,
              domain: s.domain,
              tier: s.tier || 'silver',
            }))
          : []
        if (parsed.length) setSponsors(parsed)
      } catch {
        /* ignore */
      }
    }
    loadSponsors()
  }, [baseURL])

  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) {
          removeSession()
          return
        }
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then((profile) => {
        if (!profile) return
        setName(profile.fullName || 'Guest')
        if (profile.feedback?.length) {
          const ratings = profile.feedback.map((f: any) => f.rating || 0)
          const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
          setAverageRating(avg)
        }
        if (profile.profileImage) {
          let filename = profile.profileImage.replace(/\\/g, '/')
          if (filename.startsWith('/')) filename = filename.substring(1)
          if (!filename.startsWith('uploads/')) filename = 'uploads/' + filename
          setAvatarUrl(`${baseURL}/${filename}`)
        }
      })
      .catch(console.error)
  }, [token, baseURL, removeSession])

  const renderStars = (rating: number) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar key={star} className={`me-1 ${rating >= star ? 'text-warning' : 'text-light opacity-25'}`} size={14} />
        ))}
      </div>
    )
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <FaCrown className="text-platinum me-1" size={12} />
      case 'gold':
        return <FaAward className="text-gold me-1" size={12} />
      case 'silver':
        return <FaMedal className="text-silver me-1" size={12} />
      default:
        return null
    }
  }

  // Render sponsor icon with color
  const renderSponsorIcon = (sponsor: Sponsor) => {
    const color = getSponsorColor(sponsor)

    // Use first two letters of the company name with colored background
    const initials = sponsor.name.replace(/[^A-Z]/g, '').slice(0, 2) || sponsor.name.slice(0, 2)
    return (
      <div
        className="sponsor-initials"
        style={{
          background: color,
          color: getContrastColor(color),
        }}>
        {initials.toUpperCase()}
      </div>
    )
  }

  // Helper function to determine text color based on background
  const getContrastColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Separate sponsors by tier
  const platinumSponsors = useMemo(() => sponsors.filter((s) => s.tier === 'platinum'), [sponsors])
  const goldSponsors = useMemo(() => sponsors.filter((s) => s.tier === 'gold'), [sponsors])
  const silverSponsors = useMemo(() => sponsors.filter((s) => s.tier === 'silver'), [sponsors])

  const marqueeSponsors = useMemo(() => {
    const items = [...goldSponsors, ...silverSponsors]
    return items.length ? [...items, ...items, ...items] : []
  }, [goldSponsors, silverSponsors])

  return (
    <>
      {/* Premium Enterprise Header */}
      <div
        className="enterprise-header"
        style={{
          position: 'relative',
          zIndex: 1, // stays low
        }}>
        {/* Platinum Sponsors - Static Elite Bar */}
        {platinumSponsors.length > 0 && (
          <div className="platinum-bar">
            {/*  <Container>
              <div className="d-flex align-items-center justify-content-between py-2">
                <div className="d-flex align-items-center">
                  <FaCrown className="tier-icon platinum me-2" />
                  <span className="section-label">PLATINUM PARTNERSHIPS</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {platinumSponsors.map((sponsor, index) => (
                    <div key={sponsor.name} className="d-flex align-items-center sponsor-item">
                      <div className="sponsor-content">
                        {renderSponsorIcon(sponsor)}
                        <span className="sponsor-name">{sponsor.name}</span>
                      </div>
                      {index < platinumSponsors.length - 1 && (
                        <div className="separator mx-2">•</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Container> */}
          </div>
        )}

        {/* Main Professional Banner */}
        {/*  <div className="professional-banner">
          <Container>
            <Row className="align-items-center py-4">
              <Col lg={8}>
                <div className="d-flex align-items-center">
        
                  <div className="position-relative me-4">
                    <div
                      className="avatar-profile"
                      onClick={() => setShowZoom(true)}
                    >
                      <img
                        src={avatarUrl || fallbackUrl}
                        alt={name}
                        className="avatar-img"
                        onError={(e) => (e.currentTarget.src = fallbackUrl)}
                      />
                    </div>
                    <div className="status-badge">
                      <FaCrown className="me-1 text-gold" />
                      Elite
                    </div>
                  </div>

              
                  <div className="flex-grow-1">
                    <h1 className="user-name">{name}</h1>
                    <div className="d-flex align-items-center flex-wrap gap-3">
                      {averageRating !== null ? (
                        <div className="d-flex align-items-center rating-section">
                          <span className="rating-value">{averageRating.toFixed(1)}</span>
                          {renderStars(averageRating)}
                          <span className="rating-text">({averageRating.toFixed(1)} rating)</span>
                        </div>
                      ) : (
                        <span className="rating-text">Ready to get rated</span>
                      )}
                      
                      <div className="vertical-divider"></div>
                      
                      <div className="badge-section">
                        <span className="member-badge">
                          <FaAward className="me-2 text-gold" />
                          Elite Member
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              
              </Col>
            </Row>
          </Container>
        </div> 
        <Col lg={4} className="text-lg-end mt-3 mt-lg-0"></Col>

        {/* Gold & Silver Sponsors Marquee */}
        {/* {marqueeSponsors.length > 0 && (
          <div className="corporate-partners-section">
            <Container fluid>
              <div className="d-flex align-items-center py-2">
                <div className="partners-label">
                  <FaAward className="me-2 text-gold" />
                  CORPORATE SPONSORS
                </div>
                <div className="marquee-container flex-grow-1">
                  <div className="marquee-track">
                    {marqueeSponsors.map((sponsor, index) => (
                      <div key={`${sponsor.name}-${index}`} className="marquee-item">
                        <div className="sponsor-content">
                          {renderSponsorIcon(sponsor)}
                          <span className="sponsor-name">{sponsor.name}</span>
                        </div>
                        {getTierIcon(sponsor.tier || 'silver')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Container>
          </div>
        )} */}
      </div>

      {/* Professional Zoom Modal */}
      <Modal show={showZoom} onHide={() => setShowZoom(false)} centered size="lg" className="professional-modal">
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Profile Overview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pt-0">
          <div className="zoom-avatar-container mx-auto">
            <img
              src={avatarUrl || fallbackUrl}
              alt={`${name} - Professional Profile`}
              className="zoom-avatar-img"
              onError={(e) => (e.currentTarget.src = fallbackUrl)}
            />
          </div>
          <h4 className="fw-bold mt-4">{name}</h4>
          <p className="text-muted">Elite Program Member</p>
        </Modal.Body>
      </Modal>

      {/* Professional CSS with colored icons */}
      <style>{`
        .enterprise-header {
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
          background: white;
        }

        /* Color definitions for tier icons */
        .text-platinum { color: #e5e4e2 !important; }
        .text-gold { color: #ff7a00 !important; }
        .text-silver { color: #c0c0c0 !important; }

        /* Platinum Bar */
        .platinum-bar {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-bottom: 3px solid #ff7a00;
        }

        .tier-icon.platinum {
          color: #ff7a00;
        }

        .section-label {
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .sponsor-item {
          transition: all 0.3s ease;
        }

        .sponsor-content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .sponsor-icon {
          opacity: 1;
          transition: transform .2s ease;
          filter: none !important;
        }

        .sponsor-content:hover .sponsor-icon {
          transform: scale(1.1);
          filter: brightness(1.2) !important;
        }

        .sponsor-initials {
          width: 20px;
          height: 20px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .sponsor-name {
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .separator {
          color: #6c757d;
          font-weight: 300;
        }

        /* Main Banner */
        .professional-banner {
          background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 50%, #0f2d6b 100%);
          position: relative;
          overflow: hidden;
        }

        .professional-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.3;
        }

        .avatar-profile {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255,255,255,0.9);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 2;
        }

        .user-name {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .rating-section {
          background: rgba(255,255,255,0.1);
          padding: 8px 12px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .rating-value {
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
          margin-right: 8px;
        }

        .rating-text {
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
          margin-left: 8px;
        }

        .vertical-divider {
          width: 1px;
          height: 30px;
          background: rgba(255,255,255,0.3);
        }

        .member-badge {
          background: rgba(255,255,255,0.9);
          color: #1e3a8a;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .navigation-btn {
          background: white;
          color: #1e3a8a;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .navigation-btn:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Corporate Partners Section */
        .corporate-partners-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-top: 1px solid #dee2e6;
        }

        .partners-label {
          background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
          color: white;
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 0 8px 8px 0;
          min-width: 180px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marquee-container {
          overflow: hidden;
          position: relative;
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: 40px;
          animation: marqueeScroll 40s linear infinite;
          padding-left: 40px;
        }

        .marquee-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          opacity: 0.8;
          transition: all 0.3s ease;
          padding: 6px 10px;
          border-radius: 6px;
        }

        .marquee-item:hover {
          opacity: 1;
          background: rgba(255,255,255,0.5);
          transform: translateY(-1px);
        }

        .marquee-item .sponsor-icon {
          filter: none !important;
        }

        .marquee-item:hover .sponsor-icon {
          transform: scale(1.1);
        }

        .marquee-item .sponsor-initials {
          width: 18px;
          height: 18px;
          font-size: 8px;
          color: white;
          transition: all 0.3s ease;
        }

        .marquee-item:hover .sponsor-initials {
          transform: scale(1.1);
        }

        .marquee-item .sponsor-name {
          color: #495057;
          font-size: 0.8rem;
          font-weight: 600;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .platinum-bar .d-flex {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .avatar-profile {
            width: 80px;
            height: 80px;
          }
          
          .user-name {
            font-size: 1.5rem;
          }
          
          .partners-label {
            min-width: 150px;
            font-size: 0.7rem;
          }
          
          .d-flex.align-items-center.flex-wrap {
            justify-content: center;
            text-align: center;
          }
        }

        @media (max-width: 576px) {
          .professional-banner {
            padding: 1.5rem 0 !important;
          }
          
          .marquee-track {
            gap: 20px;
            padding-left: 20px;
            animation-duration: 30s;
          }
          
          .vertical-divider {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
            overflow-x: auto;
            padding: 10px;
          }
        }

        .enterprise-header {
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
          background: transparent;
          margin-bottom: 0;
        }

        .corporate-partners-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-top: 1px solid #dee2e6;
          margin-bottom: 1rem;
        }
      `}</style>
    </>
  )
}

export default Banner
