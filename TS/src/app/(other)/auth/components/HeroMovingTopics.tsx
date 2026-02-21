import { Container } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";

const topicsRow1 = [
  "Reusable Components",
  "Web Socket",
  "Node",
  "Testing",
  "Best Coding Practices",
  "Thread Pool",
  "Unit Testing",
  "Polyfills",
  "Color Contrasts",
];

const topicsRow2 = [
  "React.Fragment",
  "Uncontrolled Comp.",
  "Security Headers",
  "State Management",
  "Optimizing React Apps",
  "Mongoose",
  "Interview Questions",
];

const topicsRow3 = [
  "Long Polling",
  "Building Custom Hooks",
  "Handling Events",
  "Server Sent Event",
  "MongoDB",
  "HTTPS",
  "Error Handling",
];

const HeroMovingTopics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="hero-section position-relative overflow-hidden">
      <style>{`
      
      .hero-section {
        background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
        padding: 100px 0;
        color: white;
        position: relative;
        isolation: isolate;
      }

      /* Animated gradient orbs matching the theme */
      .hero-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 30%, rgba(255,152,0,0.03) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(255,152,0,0.03) 0%, transparent 50%);
        pointer-events: none;
        z-index: 1;
        animation: pulseGlow 8s ease-in-out infinite;
      }

      @keyframes pulseGlow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }

      /* Floating particles */
      .particle {
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(255, 152, 0, 0.15);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
      }

      .hero-title {
        font-size: 48px;
        font-weight: 700;
        text-align: center;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out forwards;
      }

      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .hero-highlight {
        background: linear-gradient(90deg, #ff9800, #ffb74d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        position: relative;
        display: inline-block;
      }

      .hero-highlight::after {
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

      @keyframes slideIn {
        to { transform: scaleX(1); }
      }

      .hero-subtitle {
        text-align: center;
        color: #9aa4b2;
        max-width: 800px;
        margin: 20px auto 60px;
        font-size: 18px;
        line-height: 1.6;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.2s forwards;
      }

      /* Marquee Container */
      .marquee-container {
        position: relative;
        z-index: 2;
        margin-bottom: 30px;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.4s forwards;
      }

      .marquee-container:nth-child(4) {
        animation-delay: 0.5s;
      }

      .marquee-container:nth-child(5) {
        animation-delay: 0.6s;
      }

      .marquee {
        display: flex;
        overflow: hidden;
        position: relative;
        mask-image: linear-gradient(
          to right,
          transparent 0%,
          black 10%,
          black 90%,
          transparent 100%
        );
      }

      .marquee-content {
        display: flex;
        gap: 16px;
        animation: scroll 30s linear infinite;
        will-change: transform;
      }

      .marquee.reverse .marquee-content {
        animation-direction: reverse;
      }

      /* Pause animation on hover */
      .marquee-container:hover .marquee-content {
        animation-play-state: paused;
      }

      @keyframes scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      /* Topic Box Styling - Updated with orange theme */
      .topic-box {
        background: rgba(30, 34, 40, 0.8);
        backdrop-filter: blur(5px);
        padding: 14px 24px;
        border-radius: 30px;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 152, 0, 0.1);
        color: #e0e4f0;
        position: relative;
        overflow: hidden;
        cursor: default;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      /* Shine effect */
      .topic-box::before {
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
      }

      .topic-box:hover::before {
        left: 100%;
      }

      .topic-box:hover {
        background: linear-gradient(135deg, #2a2f38, #1e2228);
        border-color: rgba(255, 152, 0, 0.3);
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 12px 24px rgba(255, 152, 0, 0.15);
        color: white;
      }

      /* Active state animation */
      .topic-box:active {
        transform: translateY(-2px) scale(1.02);
      }

      /* Counter badge - Updated to orange */
      .topic-count {
        display: inline-block;
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        margin-left: 10px;
        border: 1px solid rgba(255, 152, 0, 0.2);
      }

      /* Stats section - Updated to orange gradient */
      .stats-container {
        display: flex;
        justify-content: center;
        gap: 60px;
        margin-top: 70px;
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.8s ease-out 0.8s forwards;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 5px;
        background: linear-gradient(135deg, #ff9800, #ffb74d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .stat-label {
        color: #9aa4b2;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Decorative elements - Updated to orange theme */
      .floating-icon {
        position: absolute;
        font-size: 24px;
        opacity: 0.03;
        pointer-events: none;
        z-index: 1;
        animation: float 8s ease-in-out infinite;
        color: #ff9800;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }

      @media (max-width: 768px) {
        .hero-title {
          font-size: 32px;
        }

        .hero-subtitle {
          font-size: 16px;
          padding: 0 20px;
        }

        .topic-box {
          padding: 10px 18px;
          font-size: 13px;
        }

        .stats-container {
          gap: 30px;
          flex-wrap: wrap;
        }

        .marquee {
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }
      }

      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .hero-title,
        .hero-subtitle,
        .marquee-container,
        .stats-container,
        .topic-box,
        .marquee-content {
          animation: none;
          transform: none;
        }
        
        .marquee-content {
          animation-play-state: paused;
        }
      }
      `}</style>

      {/* Floating particles */}
      {isVisible && [...Array(15)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            opacity: 0.1 + Math.random() * 0.2
          }}
        />
      ))}

      {/* Decorative floating icons - Updated emojis */}
      <div className="floating-icon" style={{ top: '10%', left: '5%' }}>⚡</div>
      <div className="floating-icon" style={{ bottom: '15%', right: '8%' }}>🚀</div>
      <div className="floating-icon" style={{ top: '30%', right: '12%' }}>💡</div>

      <Container className="position-relative" style={{ zIndex: 2 }}>
        {/* Heading */}
        <h1 className="hero-title">
          Fuel Your Career With Expert-Crafted{" "}
          <span className="hero-highlight">Lessons</span>
        </h1>

        <p className="hero-subtitle">
          Unlock 300+ coding topics designed to take you from beginner to pro.
          Start your journey today and build skills that truly matter.
          <span className="topic-count ms-3">Updated Weekly</span>
        </p>

        {/* Moving Rows */}
        <div className="marquee-container">
          <div className="marquee">
            <div className="marquee-content">
              {[...topicsRow1, ...topicsRow1].map((item, i) => (
                <div key={`row1-${i}`} className="topic-box" title={`Learn ${item}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="marquee-container">
          <div className="marquee reverse">
            <div className="marquee-content">
              {[...topicsRow2, ...topicsRow2].map((item, i) => (
                <div key={`row2-${i}`} className="topic-box" title={`Master ${item}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="marquee-container">
          <div className="marquee">
            <div className="marquee-content">
              {[...topicsRow3, ...topicsRow3].map((item, i) => (
                <div key={`row3-${i}`} className="topic-box" title={`Explore ${item}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">300+</div>
            <div className="stat-label">Topics</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Learners</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.8</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HeroMovingTopics;