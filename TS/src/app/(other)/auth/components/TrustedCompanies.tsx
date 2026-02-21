import { Container } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";

// ✅ Import your logos correctly
import accenture from "./logos/accenture.webp";
import adobe from "./logos/Adobe.webp";
import amazon from "./logos/amazon.webp";
import atlassian from "./logos/Atlassian_logo_PNG1.webp";
import cisco from "./logos/Cisco_logo_PNG2.webp";
import flipkart from "./logos/Flipkart_logo_PNG1.webp";
import google from "./logos/google_PNG.webp";
import infosys from "./logos/Infosys_logo_PNG2.webp";
import oracle from "./logos/Oracle_logo_PNG1.webp";
import paytm from "./logos/Paytm_logo_PNG1.webp";
import phonepe from "./logos/PhonePe_Logo_PNG1.webp";
import unacademy from "./logos/unacamedy.webp";
import walmart from "./logos/Walmart_logo_PNG1.webp";
import wipro from "./logos/wipro.webp";
import yahoo from "./logos/Yahoo_logo_PNG1.webp";
import zomato from "./logos/Zomato_logo_PNG1.webp";

const logos = [
  accenture,
  adobe,
  amazon,
  atlassian,
  cisco,
  flipkart,
  google,
  infosys,
  oracle,
  paytm,
  phonepe,
  unacademy,
  walmart,
  wipro,
  yahoo,
  zomato,
];

const TrustedCompanies = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section 
      ref={sectionRef} 
      className="trusted-section position-relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <style>{`

      .trusted-section {
        background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
        padding: 100px 0;
        color: white;
        overflow: hidden;
        position: relative;
        isolation: isolate;
      }

      /* Animated gradient background */
      .trusted-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,152,0,0.05) 0%, transparent 50%),
                    radial-gradient(circle at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(255,152,0,0.03) 0%, transparent 50%);
        pointer-events: none;
        z-index: 1;
        transition: background 0.1s ease;
      }

      /* Floating particles */
      .particle {
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(255, 152, 0, 0.2);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
        animation: floatParticle 15s infinite linear;
      }

      @keyframes floatParticle {
        from { transform: translateY(100vh) rotate(0deg); }
        to { transform: translateY(-100vh) rotate(360deg); }
      }

      /* Glowing orb effect */
      .glow-orb {
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(255,152,0,0.1) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(50px);
        animation: orbFloat 20s ease-in-out infinite;
        z-index: 1;
      }

      @keyframes orbFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(5%, 5%) scale(1.1); }
        50% { transform: translate(-5%, 10%) scale(0.9); }
        75% { transform: translate(10%, -5%) scale(1.05); }
      }

      .trusted-badge {
        display: inline-block;
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
        padding: 10px 24px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1px;
        margin-bottom: 25px;
        border: 1px solid rgba(255, 152, 0, 0.2);
        backdrop-filter: blur(5px);
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out forwards;
      }

      .trusted-title {
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 20px;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.2s forwards;
      }

      .trusted-highlight {
        background: linear-gradient(90deg, #ff9800, #ffb74d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        position: relative;
        display: inline-block;
      }

      .trusted-highlight::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #ff9800, #ffb74d);
        transform: scaleX(0);
        transform-origin: left;
        animation: slideIn 0.6s ease-out 0.5s forwards;
      }

      .trusted-subtitle {
        color: #9aa4b2;
        max-width: 800px;
        margin-bottom: 60px;
        font-size: 18px;
        line-height: 1.7;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.3s forwards;
      }

      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideIn {
        to { transform: scaleX(1); }
      }

      /* ---------------- LOGO MARQUEE ---------------- */

      .logo-marquee {
        position: relative;
        overflow: hidden;
        padding: 20px 0;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.4s forwards;
      }

      .logo-track {
        display: flex;
        gap: 60px;
        width: max-content;
        animation: scrollLogos 35s linear infinite;
        will-change: transform;
      }

      .logo-marquee:hover .logo-track {
        animation-play-state: paused;
      }

      @keyframes scrollLogos {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      /* Uniform Logo Box */
      .logo-item {
        width: 160px;
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(30, 34, 40, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(255, 152, 0, 0.05);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      /* Shine effect */
      .logo-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 152, 0, 0.1),
          transparent
        );
        transition: left 0.5s ease;
        z-index: 2;
      }

      .logo-item:hover::before {
        left: 100%;
      }

      /* Image styling - FIXED: Colored by default, enhanced on hover */
      .logo-item img {
        max-height: 50px;
        max-width: 120px;
        object-fit: contain;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
        
        /* REMOVED grayscale - logos are colored by default */
        filter: none;
        opacity: 0.9;
      }

      /* Enhanced effect on hover - brighter, larger, with glow */
      .logo-item:hover img {
        opacity: 1;
        transform: scale(1.15);
        filter: drop-shadow(0 0 8px rgba(255, 152, 0, 0.5));
      }

      .logo-item:hover {
        background: rgba(40, 45, 55, 0.8);
        border-color: rgba(255, 152, 0, 0.4);
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 15px 30px rgba(255, 152, 0, 0.2);
      }

      /* Edge fade effect - enhanced */
      .logo-marquee::before,
      .logo-marquee::after {
        content: "";
        position: absolute;
        top: 0;
        width: 200px;
        height: 100%;
        z-index: 3;
        pointer-events: none;
      }

      .logo-marquee::before {
        left: 0;
        background: linear-gradient(to right, #1e2228 0%, transparent 100%);
      }

      .logo-marquee::after {
        right: 0;
        background: linear-gradient(to left, #1e2228 0%, transparent 100%);
      }

      /* Stats counter */
      .stats-row {
        display: flex;
        justify-content: center;
        gap: 60px;
        margin-top: 80px;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.6s forwards;
      }

      .stat-item {
        text-align: center;
        padding: 20px 30px;
        background: rgba(30, 34, 40, 0.5);
        border-radius: 16px;
        border: 1px solid rgba(255, 152, 0, 0.1);
        backdrop-filter: blur(5px);
        transition: all 0.3s ease;
      }

      .stat-item:hover {
        transform: translateY(-5px);
        border-color: rgba(255, 152, 0, 0.3);
        box-shadow: 0 10px 30px rgba(255, 152, 0, 0.1);
      }

      .stat-number {
        font-size: 36px;
        font-weight: 700;
        background: linear-gradient(135deg, #ff9800, #ffb74d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 5px;
      }

      .stat-label {
        color: #9aa4b2;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Trust indicators */
      .trust-badges {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 40px;
        flex-wrap: wrap;
      }

      .trust-badge-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #9aa4b2;
        font-size: 14px;
      }

      .trust-badge-item i {
        color: #ff9800;
        font-size: 18px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .trusted-title {
          font-size: 32px;
        }

        .trusted-subtitle {
          font-size: 16px;
          padding: 0 20px;
        }

        .logo-item {
          width: 130px;
          height: 70px;
        }

        .logo-item img {
          max-height: 35px;
          max-width: 100px;
        }

        .stats-row {
          gap: 20px;
          flex-wrap: wrap;
        }

        .stat-item {
          padding: 15px 20px;
          min-width: 120px;
        }

        .logo-marquee::before,
        .logo-marquee::after {
          width: 80px;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .logo-track,
        .particle,
        .glow-orb,
        .trusted-section::before {
          animation: none;
        }
      }
      `}</style>

      {/* Floating particles */}
      {isVisible && [...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 15}s`,
          }}
        />
      ))}

      {/* Glowing orbs */}
      <div className="glow-orb" style={{ top: '10%', left: '5%' }} />
      <div className="glow-orb" style={{ bottom: '10%', right: '5%', width: '400px', height: '400px' }} />

      <Container className="position-relative" style={{ zIndex: 2 }}>
        <div className="trusted-badge">
          <i className="bi bi-building me-2"></i>
          TOP COMPANIES WHERE OUR STUDENTS WORK
        </div>

        <h2 className="trusted-title">
          Trusted By Leading{" "}
          <span className="trusted-highlight">Companies</span>
        </h2>

        <p className="trusted-subtitle">
          Our students have gone on to build careers at some of the world's
          most renowned organizations. Their success is proof that the skills
          you gain here open doors to top opportunities across the industry.
        </p>

        {/* Moving Logos */}
        <div className="logo-marquee">
          <div className="logo-track">
            {[...logos, ...logos].map((logo, i) => (
              <div 
                key={i} 
                className="logo-item"
              >
                <img 
                  src={logo} 
                  alt="company logo"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="trust-badges">
          <div className="trust-badge-item">
            <i className="bi bi-shield-check"></i>
            <span>Verified Placements</span>
          </div>
          <div className="trust-badge-item">
            <i className="bi bi-star-fill"></i>
            <span>4.8/5 Rating</span>
          </div>
          <div className="trust-badge-item">
            <i className="bi bi-people-fill"></i>
            <span>5000+ Hired</span>
          </div>
          <div className="trust-badge-item">
            <i className="bi bi-building"></i>
            <span>100+ Partners</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Placement Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Hiring Partners</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15LPA</div>
            <div className="stat-label">Avg. Package</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TrustedCompanies;