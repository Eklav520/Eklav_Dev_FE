import { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaArrowRight } from "react-icons/fa";
import logoLight from "@/assets/images/logo_white.png";
import {
  TechCoursesIcon, StudyMaterialIcon, OnlineClassesIcon, ChittiRoboIcon,
  EmailPracticeIcon, JamIcon, VirtualInterviewIcon, AptitudeIcon,
  CodeAIIcon, ResumeIcon, JobVacanciesIcon, AssessmentIcon,
} from "./FeatureIcons";
import { useNavigate } from "react-router-dom";
import "./About.css";
import useTenant from "@/utils/tenant";
import avatar1 from "@/assets/images/avatar/01.jpg";
import avatar2 from "@/assets/images/avatar/02.jpg";
import avatar3 from "@/assets/images/avatar/03.jpg";
import avatar4 from "@/assets/images/avatar/04.jpg";

type AboutProps = { onStartJourneyClick?: () => void };
type Course = { _id: string; title: string; image?: string };

/* ── Particle Canvas ── */
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#ff7a00", "#00d4ff", "#a855f7", "#22d3ee", "#fb923c"];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.55 + 0.2,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,122,0,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grd.addColorStop(0, p.color + "66");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
};

/* ── Course Marquee ── */
const CourseMarquee = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch(`${baseURL}/courses/public/list`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Course[]) => { if (Array.isArray(data)) setCourses(data.filter((c) => c.image)); })
      .catch(() => {});
  }, []);

  if (courses.length === 0) return null;
  const items = [...courses, ...courses];

  return (
    <div className="neo-marquee-wrap">
      <div className="neo-marquee-track">
        {items.map((c, i) => {
          const imgSrc = c.image?.startsWith("http") ? c.image : c.image ? `${baseURL}/uploads/${c.image}` : null;
          return (
            <div className="neo-marquee-card" key={`${c._id}-${i}`}>
              {imgSrc ? (
                <img src={imgSrc} alt={c.title} className="neo-marquee-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="neo-marquee-placeholder">{c.title.charAt(0).toUpperCase()}</div>
              )}
              <p className="neo-marquee-title">{c.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main About ── */
const About = ({ onStartJourneyClick }: AboutProps) => {
  const navigate = useNavigate();
  const tenant = useTenant();

  const tenantName = tenant?.name || "Eklav";
  const normalized = tenantName.charAt(0).toUpperCase() + tenantName.slice(1).toLowerCase();
  const first2 = normalized.slice(0, 2);
  const rest = normalized.slice(2);
  const isCoreDataLabs = tenant?.name === "coredatalabs" || window?.location?.hostname === "coredatalabs.eklav.in";
  const students = [avatar1, avatar2, avatar3, avatar4];

  const features = [
    { icon: <TechCoursesIcon />, title: "Top Tech Courses", description: "Unlimited access to premium tech courses curated by industry experts.", color: "#ff7a00" },
    { icon: <StudyMaterialIcon />, title: "Modern Study Material", description: "Access updated and comprehensive study materials for all subjects.", color: "#00d4ff" },
    { icon: <OnlineClassesIcon />, title: "Online Classes with Industry Experts", description: "Learn directly from professionals working in top companies.", color: "#a855f7" },
    { icon: <ChittiRoboIcon />, title: "English Speaking Practice with Chitti Robo", description: "Improve your English fluency with our AI-powered speaking assistant.", color: "#22d3ee" },
    { icon: <EmailPracticeIcon />, title: "Email Practices", description: "Master professional email writing with real-world scenarios.", color: "#ff7a00" },
    { icon: <JamIcon />, title: "JAM", description: "Practice Just A Minute sessions to improve spontaneous speaking.", color: "#00d4ff" },
    { icon: <VirtualInterviewIcon />, title: "Virtual Interview with AI", description: "Experience realistic interview simulations with instant AI feedback.", color: "#a855f7" },
    { icon: <AptitudeIcon />, title: "Aptitude Unlimited", description: "Endless aptitude practice with adaptive difficulty levels.", color: "#22d3ee" },
    { icon: <CodeAIIcon />, title: "Learn Code with AI Tutor", description: "Get personalized coding guidance from our AI tutor.", color: "#ff7a00" },
    { icon: <ResumeIcon />, title: "Resume Preparation", description: "Create ATS-friendly resumes with expert guidance.", color: "#00d4ff" },
    { icon: <JobVacanciesIcon />, title: "Job Vacancies", description: "Access exclusive job opportunities and placement drives.", color: "#a855f7" },
    { icon: <AssessmentIcon />, title: "Assessment Every Month Like Industry Based", description: "Take monthly industry-standard assessments to track your progress.", color: "#22d3ee" },
  ];

  return (
    <div className="futuristic-about">
      {/* ── HERO ── */}
      <section className="neo-hero">
        <ParticleCanvas />

        {/* Grid overlay */}
        <div className="neo-grid-overlay" />

        <Container fluid className="px-4 px-xl-5" style={{ position: "relative", zIndex: 1 }}>
          <Row className="align-items-center g-4">

            {/* Left: Text */}
            <Col lg={5} xl={5} className="neo-hero-left">
              <div className="neo-badge">
                <span className="neo-badge-dot" />
                Next-Gen E-Learning Platform
              </div>

              <h1 className="neo-title">
                About{" "}
                <span className="neo-gradient-text">
                  {first2}{rest}
                </span>
              </h1>

              <p className="neo-subtitle">
                <strong style={{ color: "#fff" }}>{first2}{rest}</strong> is a modern{" "}
                <strong style={{ color: "#ff7a00" }}>All-in-One E-Learning Platform</strong>{" "}
                designed to help students move from{" "}
                <strong style={{ color: "#00d4ff" }}>Campus to Career</strong>.
              </p>

              {isCoreDataLabs && (
                <p className="neo-subtitle" style={{ color: "#a855f7" }}>
                  <strong>AI Strategy &amp; Advanced Data Science Partner</strong> — Supporting
                  global AI companies with talent intelligence and scalable solutions for 12+ years.
                </p>
              )}

              <p className="neo-desc">
                Powerful learning tools, AI practice systems, and real industry training — all at an affordable cost.
              </p>

              <div className="neo-tags">
                {["Learn with Experts", "Practice with AI", "Get Placed", "Gain Knowledge"].map((t) => (
                  <span key={t} className="neo-tag">{t}</span>
                ))}
              </div>

              <CourseMarquee />

              <button
                className="neo-cta-btn"
                onClick={() => onStartJourneyClick ? onStartJourneyClick() : navigate("/auth/sign-in")}
              >
                <span>Start Your Journey</span>
                <FaArrowRight className="neo-cta-icon" />
              </button>
            </Col>

            {/* Right: Holographic Universe */}
            <Col lg={7} xl={7} className="neo-hero-right">
              <div className="holo-display">

                {/* Hex grid background */}
                <div className="hex-grid" />

                {/* Radial glow backdrop */}
                <div className="holo-radial-glow" />

                {/* Solar system orbit SVG lines — all tilt=-10°, same plane perspective */}
                <svg className="universe-svg" viewBox="0 0 960 560" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="480" cy="246" rx="150" ry="70"  transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,180,0,0.45)"   strokeWidth="1.2"/>
                  <ellipse cx="480" cy="246" rx="235" ry="110" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,122,0,0.35)"   strokeWidth="1"/>
                  <ellipse cx="480" cy="246" rx="320" ry="150" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(0,212,255,0.28)"   strokeWidth="1" strokeDasharray="6,4"/>
                  <ellipse cx="480" cy="246" rx="400" ry="188" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(168,85,247,0.22)"  strokeWidth="1"/>
                  <ellipse cx="480" cy="246" rx="445" ry="210" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3,7"/>
                </svg>

                {/* Orbit 1 */}
                <div className="univ-planet p-o1 p-o1-1 si-orange"><TechCoursesIcon /><span className="sat-label">Courses</span></div>
                <div className="univ-planet p-o1 p-o1-2 si-lime"><CodeAIIcon /><span className="sat-label">Code AI</span></div>

                {/* Orbit 2 */}
                <div className="univ-planet p-o2 p-o2-1 si-cyan"><OnlineClassesIcon /><span className="sat-label">Live Class</span></div>
                <div className="univ-planet p-o2 p-o2-2 si-pink"><VirtualInterviewIcon /><span className="sat-label">Interview</span></div>
                <div className="univ-planet p-o2 p-o2-3 si-yellow"><AssessmentIcon /><span className="sat-label">Assessment</span></div>

                {/* Orbit 3 */}
                <div className="univ-planet p-o3 p-o3-1 si-purple"><StudyMaterialIcon /><span className="sat-label">Study</span></div>
                <div className="univ-planet p-o3 p-o3-2 si-red"><EmailPracticeIcon /><span className="sat-label">Email</span></div>
                <div className="univ-planet p-o3 p-o3-3 si-sky"><JamIcon /><span className="sat-label">JAM</span></div>

                {/* Orbit 4 */}
                <div className="univ-planet p-o4 p-o4-1 si-teal"><ChittiRoboIcon /><span className="sat-label">Chitti AI</span></div>
                <div className="univ-planet p-o4 p-o4-2 si-indigo"><ResumeIcon /><span className="sat-label">Resume</span></div>
                <div className="univ-planet p-o4 p-o4-3 si-green"><JobVacanciesIcon /><span className="sat-label">Jobs</span></div>
                <div className="univ-planet p-o4 p-o4-4 si-amber"><AptitudeIcon /><span className="sat-label">Aptitude</span></div>

                {/* Central orb */}
                <div className="orb-center">
                  <div className="orb-atm orb-atm-1" />
                  <div className="orb-atm orb-atm-2" />
                  <div className="orb-atm orb-atm-3" />
                  <div className="orb-core">
                    <img src={logoLight} alt="Eklav" className="orb-logo" />
                  </div>
                </div>


              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── FEATURES ── */}
      <section className="neo-features">
        <div className="neo-grid-overlay" style={{ opacity: 0.3 }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="neo-section-header">
            <div className="neo-section-badge">PLATFORM CAPABILITIES</div>
            <h2 className="neo-section-title">
              What Makes{" "}
              <span className="neo-gradient-text">{first2}{rest}</span>{" "}
              Different
            </h2>
            <p className="neo-section-subtitle">
              Comprehensive learning ecosystem designed for your success
            </p>
          </div>

          <div className="neo-features-grid">
            {features.map((f, i) => (
              <div className="glass-card" key={i} style={{ "--card-color": f.color } as React.CSSProperties}>
                <div className="glass-card-glow" />
                <div className="glass-card-icon">{f.icon}</div>
                <h3 className="glass-card-title">{f.title}</h3>
                <p className="glass-card-desc">{f.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── MISSION ── */}
      <section className="neo-mission">
        <ParticleCanvas />
        <div className="neo-grid-overlay" />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="mission-glass-panel">
            <div className="mission-corner mission-tl" />
            <div className="mission-corner mission-tr" />
            <div className="mission-corner mission-bl" />
            <div className="mission-corner mission-br" />
            <div className="neo-section-badge" style={{ marginBottom: "1rem" }}>OUR MISSION</div>
            <h2 className="neo-section-title">Empowering Every Student</h2>
            <p className="mission-text-neo">
              Our goal is to build a powerful digital learning ecosystem where students can learn skills,
              practice with AI, prepare for interviews, and gain real project experience — all within a
              single platform.
            </p>
            <button
              className="neo-cta-btn"
              onClick={() => onStartJourneyClick ? onStartJourneyClick() : navigate("/auth/sign-in")}
            >
              <span>Begin Your Mission</span>
              <FaArrowRight className="neo-cta-icon" />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default About;
