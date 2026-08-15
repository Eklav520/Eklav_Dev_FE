import { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaArrowRight } from "react-icons/fa";
import logoLight from "@/assets/images/logo_white.png";
import {
  TechCoursesIcon, StudyMaterialIcon, ATSCheckerIcon, ChittiRoboIcon,
  EmailPracticeIcon, JamIcon, AIMockInterviewIcon, AptitudeIcon,
  CodeAIIcon, ResumeIcon, JobVacanciesIcon, AssessmentIcon,
  OnlineClassesIcon, VirtualInterviewIcon,
} from "./FeatureIcons";
import { useNavigate } from "react-router-dom";
import "./About.css";
import useTenant from "@/utils/tenant";
import SiteBannerStrip from "./SiteBannerStrip";
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

/* ── Success Stories ── */
type PublicStory = { _id: string; studentName: string; story: string; rating: number };

const StoryStars = ({ rating }: { rating: number }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} style={{ color: n <= rating ? "#fbbf24" : "rgba(255,255,255,0.18)", fontSize: "0.9rem" }}>★</span>
    ))}
  </div>
);

const SuccessStoriesSection = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${baseURL}/success-stories/public`)
      .then((r) => (r.ok ? r.json() : { stories: [] }))
      .then((data) => setStories(Array.isArray(data?.stories) ? data.stories : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (stories.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % stories.length), 5000);
    return () => clearInterval(t);
  }, [stories.length]);

  if (stories.length === 0) return null;
  const s = stories[idx];

  return (
    <div style={{ marginTop: "3rem", width: "100%", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
      <div className="neo-section-badge" style={{ marginBottom: "1rem" }}>SUCCESS STORIES</div>

      <div style={{ position: "relative" }}>
        <div
          key={s._id}
          style={{
            background: "rgba(255,255,255,0.045)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "1.8rem",
            backdropFilter: "blur(6px)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StoryStars rating={s.rating} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.94rem", lineHeight: 1.8, margin: "1rem 0 1.3rem" }}>
            "{s.story}"
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#ff7a00,#ff944d)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0,
            }}>
              {s.studentName?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{s.studentName}</span>
          </div>
        </div>

        {stories.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + stories.length) % stories.length)}
              aria-label="Previous story"
              style={{
                position: "absolute", top: "50%", left: -18, transform: "translateY(-50%)",
                width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(15,15,20,0.85)", color: "#fff", cursor: "pointer", fontSize: "1rem",
              }}
            >&#8249;</button>
            <button
              onClick={() => setIdx((i) => (i + 1) % stories.length)}
              aria-label="Next story"
              style={{
                position: "absolute", top: "50%", right: -18, transform: "translateY(-50%)",
                width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(15,15,20,0.85)", color: "#fff", cursor: "pointer", fontSize: "1rem",
              }}
            >&#8250;</button>
          </>
        )}
      </div>

      {stories.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "1rem" }}>
          {stories.map((story, i) => (
            <button
              key={story._id}
              onClick={() => setIdx(i)}
              aria-label={`Go to story ${i + 1}`}
              style={{
                width: i === idx ? 20 : 7, height: 7, borderRadius: 4, border: "none", padding: 0,
                background: i === idx ? "#ff7a00" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Typewriter ── */
const TypewriterText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'hold' | 'erasing' | 'wait'>('typing');

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'typing') {
      if (displayed.length < text.length) {
        t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 110);
      } else {
        t = setTimeout(() => setPhase('hold'), 2200);
      }
    } else if (phase === 'hold') {
      t = setTimeout(() => setPhase('erasing'), 0);
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        t = setTimeout(() => setDisplayed(text.slice(0, displayed.length - 1)), 70);
      } else {
        t = setTimeout(() => setPhase('typing'), 600);
      }
    }
    return () => clearTimeout(t);
  }, [displayed, phase, text]);

  return <>{displayed}<span className="tw-cursor">|</span></>;
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
  const [featIdx, setFeatIdx] = useState(0);
  // Hide the "Next-Gen E-Learning Platform" badge when the site banner is
  // actually showing above it — saves vertical space instead of stacking both.
  const [bannerVisible, setBannerVisible] = useState(false);

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

  useEffect(() => {
    const t = setInterval(() => setFeatIdx(i => (i + 1) % features.length), 2800);
    return () => clearInterval(t);
  }, [features.length]);

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
              {!bannerVisible && (
                <div className="neo-badge">
                  <span className="neo-badge-dot" />
                  Next-Gen E-Learning Platform
                </div>
              )}

              <h1 className="neo-title">
                About{" "}
                <span className="neo-gradient-text">
                  <TypewriterText text={normalized} />
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

              <SiteBannerStrip onVisibleChange={setBannerVisible} />

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

                {/* Orbit 1 — small inner planets */}
                <div className="univ-planet p-o1 p-o1-1 si-orange psz-sm"><TechCoursesIcon /><span className="sat-label">Courses</span></div>
                <div className="univ-planet p-o1 p-o1-2 si-lime   psz-sm"><CodeAIIcon /><span className="sat-label">Code AI</span></div>

                {/* Orbit 2 — medium planets */}
                <div className="univ-planet p-o2 p-o2-1 si-cyan   psz-md"><ATSCheckerIcon /><span className="sat-label">ATS Checker</span></div>
                <div className="univ-planet p-o2 p-o2-2 si-pink   psz-sm"><AIMockInterviewIcon /><span className="sat-label">AI Mock Interview</span></div>
                <div className="univ-planet p-o2 p-o2-3 si-yellow psz-md"><AssessmentIcon /><span className="sat-label">Assessment</span></div>

                {/* Orbit 3 — larger planets */}
                <div className="univ-planet p-o3 p-o3-1 si-purple psz-lg"><StudyMaterialIcon /><span className="sat-label">Material</span></div>
                <div className="univ-planet p-o3 p-o3-2 si-red    psz-sm"><EmailPracticeIcon /><span className="sat-label">Email</span></div>
                <div className="univ-planet p-o3 p-o3-3 si-sky    psz-md"><JamIcon /><span className="sat-label">JAM</span></div>

                {/* Orbit 4 — outer largest planets, Jobs gets Saturn ring */}
                <div className="univ-planet p-o4 p-o4-1 si-teal   psz-lg"><ChittiRoboIcon /><span className="sat-label">Chitti AI</span></div>
                <div className="univ-planet p-o4 p-o4-2 si-indigo psz-sm"><ResumeIcon /><span className="sat-label">Resume</span></div>
                <div className="univ-planet p-o4 p-o4-3 si-green  psz-lg planet-saturn"><JobVacanciesIcon /><span className="sat-label">Jobs</span></div>
                <div className="univ-planet p-o4 p-o4-4 si-amber  psz-md planet-ringed"><AptitudeIcon /><span className="sat-label">Aptitude</span></div>

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

          <div className="cfl-scene">
            <div className="cfl-track">
              {([-2, -1, 0, 1, 2] as const).map((offset) => {
                const idx = ((featIdx + offset) % features.length + features.length) % features.length;
                const f = features[idx];
                const pos = offset < 0 ? `cfl-n${Math.abs(offset)}` : `cfl-${offset}`;
                return (
                  <div
                    key={offset}
                    className={`cfl-card ${pos}`}
                    style={{ "--card-color": f.color } as React.CSSProperties}
                    onClick={() => setFeatIdx(idx)}
                  >
                    <div className="cfl-card-top-line" />
                    <div className="glass-card-icon" style={{ color: f.color }}>{f.icon}</div>
                    <h3 className="glass-card-title">{f.title}</h3>
                    <p className="glass-card-desc">{f.description}</p>
                  </div>
                );
              })}
            </div>

            <button className="feat-nav feat-nav-prev" onClick={() => setFeatIdx(i => (i - 1 + features.length) % features.length)}>&#8249;</button>
            <button className="feat-nav feat-nav-next" onClick={() => setFeatIdx(i => (i + 1) % features.length)}>&#8250;</button>

            <div className="feat-dots">
              {features.map((_, i) => (
                <button key={i} className={`feat-dot${i === featIdx ? " active" : ""}`} onClick={() => setFeatIdx(i)} />
              ))}
            </div>
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

            <SuccessStoriesSection />

            <button
              className="neo-cta-btn"
              style={{ marginTop: "2.5rem" }}
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
