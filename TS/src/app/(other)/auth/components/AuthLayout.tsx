import { FC, lazy, Suspense, memo, useEffect, useMemo, useState, useRef } from "react";
import { Col, Container, Row, Carousel, Modal, Button } from "react-bootstrap";
import logo from "@/assets/images/logo_white.png";
import { ChildrenType } from "@/types/component-props";
import useToggle from "@/hooks/useToggle";
import HeroMovingTopics from "./HeroMovingTopics";
import TrustedCompanies from "./TrustedCompanies";
import About from "./About";
import ForgotPassword from "../forgot-password/components/ForgotPassword";
import useTenant from "@/utils/tenant";

// Lazy-loaded components
const Footer = lazy(() => import("./Footer"));
const Banner = lazy(() => import("@/components/StudentLayoutComponents/Banner"));
const TopNavigationBar = lazy(() => import("./TopNavigationBar"));

// Lazy load form components
const SignInForm = lazy(() => import("@/app/(other)/auth/sign-in/components/SignIn"));
const SignUpForm = lazy(() => import("@/app/(other)/auth/sign-up/components/SingUpForm"));

// ========== CONSTANTS & CONFIGURATION ==========
const LAYOUT_CONFIG = {
  logo: {
    desktopWidth: "300px",
    mobileWidth: "230px",
    height: 36,
    width: 140
  },
  form: {
    maxWidth: "720px"
  },
  navigation: {
    height: 64,
    scrollThreshold: 50
  },
  particles: {
    count: 20,
    minSize: 2,
    maxSize: 6,
    minDuration: 15,
    maxDuration: 35,
    baseOpacity: 0.3
  }
} as const;

// ========== VIDEO CONFIGURATION ==========
interface Video {
  url: string;
  embedUrl: string;
  title: string;
  description: string;
  stats: string;
  duration: string;
  category: string;
}

const getVideos = (tenantName: string): Video[] => [
  {
    url: "https://www.youtube.com/watch?v=yQrXkWJtntc",
    embedUrl: "https://www.youtube.com/embed/yQrXkWJtntc",
    title: "Platform Overview",
    description: `Explore how ${tenantName} helps students build industry-ready skills through real-world projects and expert guidance.`,
    stats: "2.5K+ views",
    duration: "3:45",
    category: "Overview"
  },
  {
    url: "https://www.youtube.com/watch?v=TXcLHcsEe8g",
    embedUrl: "https://www.youtube.com/embed/TXcLHcsEe8g",
    title: "Learning Experience",
    description:
      "Understand our interactive learning model and hands-on coding structure with personalized mentorship.",
    stats: "1.8K+ views",
    duration: "4:20",
    category: "Features"
  },
  {
    url: "https://www.youtube.com/watch?v=DvPi5awkLx4",
    embedUrl: "https://www.youtube.com/embed/DvPi5awkLx4",
    title: "Student Success Stories",
    description:
      "See how our learners transformed their careers with structured training and industry-ready skills.",
    stats: "3.2K+ views",
    duration: "5:15",
    category: "Testimonials"
  }
];

// ========== UTILITIES ==========
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 20}s`,
    animationDuration: `${LAYOUT_CONFIG.particles.minDuration + Math.random() * (LAYOUT_CONFIG.particles.maxDuration - LAYOUT_CONFIG.particles.minDuration)}s`,
    size: `${LAYOUT_CONFIG.particles.minSize + Math.random() * (LAYOUT_CONFIG.particles.maxSize - LAYOUT_CONFIG.particles.minSize)}px`,
    opacity: LAYOUT_CONFIG.particles.baseOpacity + Math.random() * 0.2
  }));
};

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ========== COMPONENTS ==========

// Loading fallback with minimal footprint
const LoadingFallback = memo(() => null);
LoadingFallback.displayName = 'LoadingFallback';

// Particle effect component
const Particles = memo(({ particles }: { particles: Array<{ id: string; left: string; animationDelay: string; animationDuration: string; size: string; opacity: number }> }) => (
  <>
    {particles.map((particle) => (
      <div
        key={particle.id}
        className="particle"
        style={{
          left: particle.left,
          animationDelay: particle.animationDelay,
          animationDuration: particle.animationDuration,
          width: particle.size,
          height: particle.size,
          opacity: particle.opacity
        }}
        aria-hidden="true"
      />
    ))}
  </>
));
Particles.displayName = 'Particles';

// Scroll effect handler component
const NavigationScrollEffect = memo(() => {
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.fixed-navigation');
      if (!nav) return;

      if (window.scrollY > LAYOUT_CONFIG.navigation.scrollThreshold) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
});
NavigationScrollEffect.displayName = 'NavigationScrollEffect';

// Video Showcase Component
const VideoShowcase: FC<{ tenantName: string }> = ({ tenantName }) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  const videos = getVideos(tenantName);

  const categories: string[] = [
    "all",
    ...Array.from(new Set(videos.map((v) => v.category)))
  ];

  const filteredVideos =
    selectedCategory === "all"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isVideoPlaying) {
            pauseVideo(activeVideoIndex);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (videoRefs.current[activeVideoIndex]) {
      observer.observe(videoRefs.current[activeVideoIndex]!);
    }

    return () => observer.disconnect();
  }, [activeVideoIndex, isVideoPlaying]);


  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  const pauseVideo = (index: number) => {
    if (videoRefs.current[index]) {
      const iframe = videoRefs.current[index];
      iframe?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setIsVideoPlaying(false);
    }
  };

  const playVideo = (index: number) => {
    if (videoRefs.current[index]) {
      const iframe = videoRefs.current[index];
      iframe?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setIsVideoPlaying(true);
    }
  };

  const handleVideoSelect = (index: number) => {
    if (isVideoPlaying && activeVideoIndex !== index) {
      pauseVideo(activeVideoIndex);
    }

    setActiveVideoIndex(index);

    setTimeout(() => {
      playVideo(index);
    }, 100);
  };

  const handleCarouselChange = (index: number) => {
    pauseVideo(activeVideoIndex);
    setActiveVideoIndex(index);
    setIsVideoPlaying(false);
  };

  return (
    <section className="video-showcase w-100">
      <div className="video-showcase-header">
        <h2>See {tenantName} in Action</h2>
        <p>
          Explore how {tenantName} helps students through these featured videos
          and see how we're transforming tech education
        </p>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {categories.map((category: string, index: number) => {
          const label =
            typeof category === "string"
              ? category.charAt(0).toUpperCase() + category.slice(1)
              : "All";

          return (
            <button
              key={category || index}
              className={`category-btn ${selectedCategory === category ? "active" : ""
                }`}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <Container fluid className="px-3 px-xl-4">
        <Carousel
          indicators
          controls
          interval={null}
          activeIndex={activeVideoIndex}
          onSelect={handleCarouselChange}
          pause="hover"
          className="video-carousel"
          wrap={false}
        >
          {(filteredVideos || []).map((video: any, index: any) => {
            return (
              <Carousel.Item key={index}>
                <div className="video-wrapper">
                  <div className="video-container">
                    <div className="ratio ratio-16x9">
                      <iframe
                        ref={(el) => (videoRefs.current[index] = el)}
                        src={`${video.embedUrl}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&controls=1`}
                        title={video.title}
                        allowFullScreen
                        frameBorder="0"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>

                    {/* Overlay */}
                    {!isVideoPlaying && activeVideoIndex === index && (
                      <div
                        className="video-overlay"
                        onClick={() => handleVideoSelect(index)}
                      >
                        <div className="play-button">
                          <svg width="60" height="60" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="28" stroke="#ff9800" strokeWidth="2" />
                            <circle cx="30" cy="30" r="24" fill="#ff9800" fillOpacity="0.2" />
                            <path d="M42 30L24 40V20L42 30Z" fill="#ff9800" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="video-content">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-description">{video.description}</p>

                    <div className="video-meta">
                      <span className="video-category">{video.category}</span>

                      <div className="video-stats">
                        <span>
                          <i className="bi bi-eye"></i> {video.stats}
                        </span>
                        <span>
                          <i className="bi bi-clock"></i> {video.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Carousel.Item>
            );
          })}
        </Carousel>

        {/* 🔥 THUMBNAILS */}
        <div className="video-thumbnails">
          {(filteredVideos || []).map((video: any, index: any) => {
            const videoId = getYouTubeId(video.url);

            return (
              <div
                key={index}
                className={`video-thumb ${index === activeVideoIndex ? "active" : ""
                  }`}
                onClick={() => handleVideoSelect(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleVideoSelect(index)
                }
                style={{
                  backgroundImage: videoId
                    ? `url(https://img.youtube.com/vi/${videoId}/mqdefault.jpg)`
                    : "none",
                }}
              >
                <div className="thumb-overlay">
                  <i className="bi bi-play-circle-fill"></i>
                  <span className="thumb-duration">{video.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

// CSS styles as a separate component
const GlobalStyles = memo(() => (
  <style>
    {`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        overflow-x: hidden;
      }

      .auth-wrapper {
        min-height: 100vh;
        background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
        color: white;
        position: relative;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Animated background elements */
      .auth-wrapper::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: radial-gradient(circle at 20% 50%, rgba(255,152,0,0.03) 0%, transparent 50%);
        pointer-events: none;
        animation: pulseGlow 8s ease-in-out infinite;
      }

      @keyframes pulseGlow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }

      /* Floating particles */
      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255,152,0,0.2);
        border-radius: 50%;
        pointer-events: none;
        animation: float 20s infinite linear;
        will-change: transform;
      }

      @keyframes float {
        from { transform: translateY(100vh) rotate(0deg); }
        to { transform: translateY(-100vh) rotate(360deg); }
      }

      /* Fixed Navigation */
      .fixed-navigation {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1030;
        background: transparent;
        transition: background 0.3s ease, backdrop-filter 0.3s ease;
      }

      .fixed-navigation.scrolled {
        background: rgba(30, 34, 40, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      /* Content offset */
      .content-section {
        padding-top: ${LAYOUT_CONFIG.navigation.height}px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      /* Main container should take full width */
      .content-section .container-fluid {
        width: 100%;
        padding-left: 0;
        padding-right: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      /* Video Showcase Styles */
      .video-showcase {
        width: 100%;
        padding: 40px 0;
        position: relative;
        z-index: 2;
      }

      .video-showcase-header {
        text-align: center;
        margin-bottom: 40px;
      }

      .video-showcase-header h2 {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff 0%, #ff9800 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 16px;
      }

      .video-showcase-header p {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.8);
        max-width: 600px;
        margin: 0 auto;
      }

      /* Category Filters */
      .category-filters {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 40px;
        flex-wrap: wrap;
      }

      .category-btn {
        padding: 8px 24px;
        border: 2px solid rgba(255, 152, 0, 0.3);
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        border-radius: 30px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .category-btn:hover {
        border-color: #ff9800;
        color: #fff;
        transform: translateY(-2px);
      }

      .category-btn.active {
        background: #ff9800;
        border-color: #ff9800;
        color: #fff;
        box-shadow: 0 5px 15px rgba(255, 152, 0, 0.3);
      }

      /* Video Carousel */
      .video-carousel {
        position: relative;
        width: 100%;
        max-width: 900px;
        margin: 0 auto 30px;
      }

      .video-wrapper {
        width: 100%;
        padding: 0 15px;
      }

      .video-container {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        background: #000;
      }

      .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.3s ease;
      }

      .video-overlay:hover {
        background: rgba(0, 0, 0, 0.5);
      }

      .play-button {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      .video-content {
        text-align: center;
        margin-top: 20px;
      }

      .video-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 8px;
      }

      .video-description {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1rem;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto 12px;
      }

      .video-meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .video-category {
        padding: 4px 12px;
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .video-stats {
        display: flex;
        gap: 16px;
        color: #9aa4b2;
        font-size: 0.9rem;
      }

      .video-stats span {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* Carousel Controls */
      .carousel-control-prev,
      .carousel-control-next {
        width: 48px;
        height: 48px;
        background: rgba(255, 152, 0, 0.2);
        border-radius: 50%;
        top: 40%;
        transform: translateY(-50%);
        opacity: 0.8;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 152, 0, 0.3);
        transition: all 0.3s ease;
      }

      .carousel-control-prev {
        left: -60px;
      }

      .carousel-control-next {
        right: -60px;
      }

      .carousel-control-prev:hover,
      .carousel-control-next:hover {
        background: rgba(255, 152, 0, 0.4);
        opacity: 1;
        transform: translateY(-50%) scale(1.1);
      }

      .carousel-indicators {
        margin-bottom: -30px;
      }

      .carousel-indicators [data-bs-target] {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #9aa4b2;
        border: none;
        margin: 0 6px;
        transition: all 0.3s ease;
      }

      .carousel-indicators .active {
        background-color: #ff9800;
        transform: scale(1.3);
      }

      /* Video Thumbnails */
      .video-thumbnails {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 50px;
        flex-wrap: wrap;
        padding: 0 15px;
      }

      .video-thumb {
        width: 120px;
        height: 68px;
        border-radius: 8px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        background-size: cover;
        background-position: center;
        background-color: #2a2f38;
      }

      .video-thumb.active {
        border-color: #ff9800;
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 10px 20px rgba(255, 152, 0, 0.3);
      }

      .thumb-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.3s ease;
      }

      .video-thumb:hover .thumb-overlay {
        opacity: 1;
      }

      .thumb-overlay i {
        color: #ff9800;
        font-size: 24px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }

      .thumb-duration {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 4px;
      }

      /* Hero Moving Topics */
      .hero-moving-topics {
        background: linear-gradient(90deg, #ff9800, #ff6b6b);
        padding: 12px 0;
        overflow: hidden;
        position: relative;
      }

      .trusted-companies {
        background: rgba(255, 255, 255, 0.02);
        padding: 20px 0;
        border-top: 1px solid rgba(255, 152, 0, 0.1);
        border-bottom: 1px solid rgba(255, 152, 0, 0.1);
      }

      /* Auth Modal Styles */
      .auth-modal-dialog {
        max-width: 900px;
        margin: 1.75rem auto;
      }

      @media (max-width: 768px) {
        .auth-modal-dialog {
          margin: 0.5rem;
          max-width: calc(100% - 1rem);
        }
      }

      @media (max-width: 576px) {
        .modal-dialog.auth-modal-dialog {
          margin: 0;
          max-width: 100%;
          min-height: 100%;
        }
        
        .auth-modal-content {
          border-radius: 0 !important;
          min-height: 100vh;
        }
      }

      .auth-modal-content {
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.05);
        background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
        color: #ffffff;
        overflow: hidden;
        box-shadow: 
          0 30px 80px rgba(0,0,0,0.65),
          inset 0 1px 0 rgba(255,255,255,0.04);
        animation: modalFadeIn .25s ease;
      }

      .auth-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.02);
      }

      @media (max-width: 768px) {
        .auth-modal-header {
          padding: 16px 20px;
        }
        
        .auth-modal-title {
          font-size: 1.1rem;
        }
      }

      .auth-close-btn {
        background: rgba(255,255,255,0.08);
        border: none;
        color: #fd692a;
        font-size: 16px;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        transition: all .25s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .auth-close-btn:hover {
        background: #fd692a;
        color: white;
        transform: rotate(90deg) scale(1.05);
      }

      .auth-switch {
        color: #fd692a;
        font-weight: 600;
        cursor: pointer;
        transition: .2s;
      }

      .auth-switch:hover {
        color: #ff8a50;
        text-decoration: underline;
      }

      .modal-backdrop.show {
        backdrop-filter: blur(8px);
        background-color: rgba(2,6,23,0.75);
      }

      @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(.94); }
        to { opacity: 1; transform: scale(1); }
      }

      .nav-login-btn {
        color: #fd692a;
        font-weight: 600;
        background: transparent;
        border: none;
      }

      .nav-login-btn:hover {
        color: #ff8a50;
        text-decoration: underline;
      }

      .nav-signup-btn {
        background: linear-gradient(135deg, #fd692a 0%, #ff8a50 100%);
        border: none;
        color: #ffffff;
        font-weight: 600;
        padding: 0.5rem 1.5rem;
        border-radius: 50px;
        transition: all .25s ease;
      }

      .nav-signup-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(253,105,42,0.35);
      }

      /* Responsive Design */
      @media (max-width: 1200px) {
        .carousel-control-prev {
          left: -20px;
        }
        .carousel-control-next {
          right: -20px;
        }
      }

      @media (max-width: 991px) {
        .video-showcase-header h2 {
          font-size: 2rem;
        }

        .video-showcase-header p {
          font-size: 1rem;
          padding: 0 20px;
        }

        .carousel-control-prev,
        .carousel-control-next {
          display: none;
        }

        .video-thumb {
          width: 100px;
          height: 56px;
        }
      }

      @media (max-width: 768px) {
        .video-showcase {
          padding: 30px 0;
        }

        .video-showcase-header h2 {
          font-size: 1.75rem;
        }

        .video-title {
          font-size: 1.25rem;
        }

        .video-description {
          font-size: 0.9rem;
        }

        .video-meta {
          flex-direction: column;
          gap: 8px;
        }

        .category-btn {
          padding: 6px 18px;
          font-size: 0.85rem;
        }

        .video-thumb {
          width: 80px;
          height: 45px;
        }

        .thumb-overlay i {
          font-size: 20px;
        }
      }

      @media (max-width: 480px) {
        .video-showcase-header h2 {
          font-size: 1.5rem;
        }

        .category-filters {
          gap: 8px;
        }

        .category-btn {
          padding: 5px 14px;
          font-size: 0.8rem;
        }

        .video-stats {
          font-size: 0.8rem;
        }

        .video-thumbnails {
          gap: 8px;
        }

        .video-thumb {
          width: 70px;
          height: 40px;
        }
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .auth-wrapper::before,
        .particle,
        .fixed-navigation,
        .category-btn,
        .video-overlay,
        .video-thumb,
        .play-button,
        .auth-close-btn,
        .nav-signup-btn {
          animation: none;
          transition: none;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .video-overlay {
          background: rgba(0, 0, 0, 0.7);
        }

        .category-btn.active {
          border: 2px solid #fff;
        }
      }
    `}
  </style>
));
GlobalStyles.displayName = 'GlobalStyles';

// ========== MAIN COMPONENT ==========
const AuthLayout: FC<ChildrenType> = ({ children }) => {
  const tenant = useTenant();
  const tenantName = tenant?.name || "Eklav";
  const tenantLogo = tenant?.logo || logo; // fallback to default logo
  const { toggle: toggleOffCanvasMenu } = useToggle();
  const [showModal, setShowModal] = useState(false);
  const [authType, setAuthType] = useState<"signin" | "signup" | "forgot">("signin");

  // Generate particles only once
  const particles = useMemo(() => generateParticles(LAYOUT_CONFIG.particles.count), []);

  const handleOpen = (type: "signin" | "signup" | "forgot") => {
    setAuthType(type);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  useEffect(() => {
    const handleForgot = () => {
      setAuthType("forgot");
      setShowModal(true);
    };

    const handleSignin = () => {
      console.log("Signin event received"); // 👈 DEBUG
      setAuthType("signin");
      setShowModal(true);
    };

    window.addEventListener("openForgot", handleForgot);
    window.addEventListener("openSignin", handleSignin);

    return () => {
      window.removeEventListener("openForgot", handleForgot);
      window.removeEventListener("openSignin", handleSignin);
    };
  }, []);

  // Pass handleOpen to TopNavigationBar via context or props
  // For now, we'll use a custom event or you can modify TopNavigationBar to accept props

  return (
    <main className="auth-wrapper">
      <GlobalStyles />

      {/* Floating particles animation */}
      <Particles particles={particles} />

      {/* Fixed Navigation */}
      <div className="fixed-navigation">
        <Suspense fallback={<LoadingFallback />}>
          <TopNavigationBar onLoginClick={() => handleOpen("signin")} onSignupClick={() => handleOpen("signup")} />
        </Suspense>
      </div>

      {/* Scroll effect handler */}
      <NavigationScrollEffect />

      {/* Main Content */}
      <div className="content-section">
        <Container fluid className="px-0 h-100">
          {/* Top Banner */}
          <Suspense fallback={<LoadingFallback />}>
            <Banner toggleOffCanvas={toggleOffCanvasMenu} />
          </Suspense>
          <About />

          {/* Main Row - Full height */}
          <Row className="g-0 mx-0 min-vh-100">
            {/* Left Section - Branding & Media */}
            <Col
              xs={12}
              lg={12}
              className="d-flex flex-column align-items-center justify-content-start px-4 px-xl-5 position-relative auth-left"
            >
              <VideoShowcase tenantName={tenantName} />
            </Col>
          </Row>

          {/* Footer Components - Full width */}
          <div className="w-100">
            <HeroMovingTopics />
            <TrustedCompanies />
          </div>

          {/* Footer - Full width background */}
          <Suspense fallback={<LoadingFallback />}>
            <Footer />
          </Suspense>
        </Container>
      </div>

      {/* AUTH MODAL */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        backdrop="static"
        size="xl"
        dialogClassName="auth-modal-dialog"
        contentClassName="auth-modal-content"
        fullscreen="sm-down"
      >
        {/* Header */}
        <div className="auth-modal-header">
          <h4 className="mb-0 fw-bold text-white auth-modal-title">
            {authType === "signin"
              ? `Welcome To ${tenantName} 👋`
              : authType === "signup"
                ? `Create Your ${tenantName} Account`
                : "Reset Your Password 🔐"}
          </h4>

          <button className="auth-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <Modal.Body className="p-4 p-md-5">
          <Suspense
            fallback={
              <div className="text-center py-5">
                <span className="spinner-border text-warning" />
              </div>
            }
          >
            {authType === "signin" && <SignInForm />}

            {authType === "signup" && (
              <SignUpForm onSuccess={handleClose} />
            )}

            {authType === "forgot" && <ForgotPassword />}
          </Suspense>
        </Modal.Body>
      </Modal>
    </main>
  );
};

export default memo(AuthLayout);