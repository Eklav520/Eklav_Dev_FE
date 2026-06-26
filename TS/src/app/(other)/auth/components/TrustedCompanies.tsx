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
      className="tc-section position-relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .tc-section {
          background: #060610;
          padding: 110px 0 100px;
          color: white;
          position: relative;
          isolation: isolate;
          border-top: 1px solid rgba(168,85,247,0.08);
          border-bottom: 1px solid rgba(0,212,255,0.08);
        }
        .tc-section::before {
          content:'';
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%,rgba(168,85,247,0.07) 0%,transparent 55%),
            radial-gradient(ellipse at ${100-mousePosition.x}% ${100-mousePosition.y}%,rgba(0,212,255,0.05) 0%,transparent 55%);
          pointer-events:none; z-index:0; transition:background 0.15s ease;
        }
        .tc-hex {
          position:absolute; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0L56 16v48L28 80 0 64V16Z' fill='none' stroke='rgba(168,85,247,0.04)' stroke-width='0.5'/%3E%3C/svg%3E");
          background-size:56px 100px; z-index:0; pointer-events:none;
        }
        @keyframes tc-fadein { to{opacity:1;transform:translateY(0)} }
        @keyframes tc-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .tc-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3);
          color:#a855f7; padding:6px 18px; border-radius:50px;
          font-size:0.7rem; font-weight:700; letter-spacing:0.1em;
          text-transform:uppercase; margin-bottom:24px;
          position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:tc-fadein 0.7s ease-out 0.1s forwards;
        }
        .tc-badge-dot {
          width:6px;height:6px;border-radius:50%;background:#a855f7;
          box-shadow:0 0 8px #a855f7; animation:hmt-blink 1.5s ease-in-out infinite;
        }
        .tc-title {
          font-size:clamp(2rem,4vw,3rem); font-weight:800; line-height:1.2;
          text-align:left; margin-bottom:16px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:tc-fadein 0.7s ease-out 0.2s forwards;
        }
        .tc-title-grad {
          background:linear-gradient(90deg,#ff7a00,#ffb347);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .tc-subtitle {
          color:#6b7a99; font-size:0.95rem; line-height:1.7; margin-bottom:52px;
          max-width:580px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:tc-fadein 0.7s ease-out 0.3s forwards;
        }

        /* Logo marquee */
        .tc-marquee-wrap {
          position:relative; overflow:hidden; padding:12px 0; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:tc-fadein 0.7s ease-out 0.45s forwards;
        }
        .tc-marquee-wrap::before,.tc-marquee-wrap::after {
          content:''; position:absolute; top:0; width:200px; height:100%;
          z-index:3; pointer-events:none;
        }
        .tc-marquee-wrap::before { left:0; background:linear-gradient(to right,#060610,transparent); }
        .tc-marquee-wrap::after  { right:0; background:linear-gradient(to left,#060610,transparent); }
        .tc-track {
          display:flex; gap:20px; width:max-content;
          animation:tc-scroll 40s linear infinite; will-change:transform;
        }
        .tc-marquee-wrap:hover .tc-track { animation-play-state:paused; }
        .tc-logo-card {
          width:150px; height:80px; display:flex; align-items:center; justify-content:center;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
          border-radius:14px; position:relative; overflow:hidden;
          transition:all 0.4s ease; flex-shrink:0;
        }
        .tc-logo-card::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(168,85,247,0.06),transparent,rgba(0,212,255,0.06));
          opacity:0; transition:opacity 0.4s ease;
        }
        .tc-logo-card:hover::before { opacity:1; }
        .tc-logo-card:hover {
          border-color:rgba(168,85,247,0.4);
          box-shadow:0 0 20px rgba(168,85,247,0.15);
          transform:translateY(-4px);
        }
        .tc-logo-card img {
          max-height:45px; max-width:110px; object-fit:contain;
          filter:brightness(0.85) saturate(0.7);
          transition:all 0.4s ease; position:relative; z-index:1;
        }
        .tc-logo-card:hover img {
          filter:brightness(1.1) saturate(1.2);
          transform:scale(1.1);
        }

        /* Trust pills */
        .tc-trust-row {
          display:flex; justify-content:center; gap:16px; flex-wrap:wrap;
          margin-top:44px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:tc-fadein 0.7s ease-out 0.6s forwards;
        }
        .tc-trust-pill {
          display:flex; align-items:center; gap:8px;
          padding:8px 20px; border-radius:40px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          color:#6b7a99; font-size:0.78rem; font-weight:600;
          backdrop-filter:blur(6px);
        }
        .tc-trust-pill i { color:#ff7a00; font-size:14px; }

        /* Stats */
        .tc-stats {
          display:grid; grid-template-columns:repeat(4,1fr); gap:16px;
          margin-top:64px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
        }
        .tc-stats.vis { animation:tc-fadein 0.7s ease-out 0.75s forwards; }
        .tc-stat {
          text-align:center; padding:24px 16px;
          background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:16px; backdrop-filter:blur(8px);
          position:relative; overflow:hidden;
          transition:transform 0.3s ease, border-color 0.3s ease;
        }
        .tc-stat:hover { transform:translateY(-5px); }
        .tc-stat-bar { position:absolute;top:0;left:0;right:0;height:2px;border-radius:16px 16px 0 0; }
        .tc-stat-num {
          font-size:2rem; font-weight:900; line-height:1; margin-bottom:6px;
        }
        .tc-stat-lbl {
          font-size:0.65rem; color:#4a5568; text-transform:uppercase;
          letter-spacing:0.1em; font-weight:700;
        }

        @media(max-width:768px){
          .tc-title{text-align:center}
          .tc-subtitle{margin:0 auto 40px; text-align:center}
          .tc-badge{margin:0 auto 24px}
          .tc-stats{grid-template-columns:repeat(2,1fr)}
          .tc-logo-card{width:120px;height:65px}
          .tc-logo-card img{max-height:35px;max-width:90px}
          .tc-marquee-wrap::before,.tc-marquee-wrap::after{width:60px}
        }
        @media(prefers-reduced-motion:reduce){
          .tc-track{animation:none}
          .tc-badge,.tc-title,.tc-subtitle,.tc-marquee-wrap,.tc-trust-row,.tc-stats{animation:none;opacity:1;transform:none}
        }
      `}</style>

      <div className="tc-hex" />

      <Container className="position-relative" style={{ zIndex: 2 }}>
        <div className="tc-badge">
          <span className="tc-badge-dot" />
          TOP COMPANIES WHERE OUR STUDENTS WORK
        </div>

        <h2 className="tc-title">
          Trusted By Leading{" "}
          <span className="tc-title-grad">Companies</span>
        </h2>

        <p className="tc-subtitle">
          Our students have built careers at some of the world's most renowned
          organizations — proof that the skills you gain here open doors to top
          opportunities across the industry.
        </p>

        <div className="tc-marquee-wrap">
          <div className="tc-track">
            {[...logos, ...logos].map((logo, i) => (
              <div key={i} className="tc-logo-card">
                <img src={logo} alt="company logo" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="tc-trust-row">
          {[
            { icon: "bi-shield-check", label: "Verified Placements" },
            { icon: "bi-star-fill",    label: "4.8/5 Rating" },
            { icon: "bi-people-fill",  label: "5000+ Hired" },
            { icon: "bi-building",     label: "100+ Partners" },
          ].map(({ icon, label }) => (
            <div key={label} className="tc-trust-pill">
              <i className={`bi ${icon}`} />
              {label}
            </div>
          ))}
        </div>

        <div className={`tc-stats${isVisible ? " vis" : ""}`}>
          {[
            { num: "95%",   lbl: "Placement Rate", color: "#ff7a00", border: "rgba(255,122,0,0.4)" },
            { num: "50+",   lbl: "Hiring Partners", color: "#00d4ff", border: "rgba(0,212,255,0.4)" },
            { num: "15LPA", lbl: "Avg. Package",    color: "#a855f7", border: "rgba(168,85,247,0.4)" },
            { num: "24/7",  lbl: "Support",         color: "#22d3ee", border: "rgba(34,211,238,0.4)" },
          ].map(({ num, lbl, color, border }) => (
            <div key={lbl} className="tc-stat" style={{ borderColor: border, boxShadow: `0 8px 28px ${color}14` }}>
              <div className="tc-stat-bar" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
              <div className="tc-stat-num" style={{ background: `linear-gradient(135deg,${color},#fff)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
              <div className="tc-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default TrustedCompanies;