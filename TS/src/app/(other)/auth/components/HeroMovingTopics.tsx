import { Container } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";

const topicsRow1 = [
  "Reusable Components", "Web Socket", "Node.js", "Testing", "Best Coding Practices",
  "Thread Pool", "Unit Testing", "Polyfills", "Color Contrasts", "TypeScript",
];
const topicsRow2 = [
  "React.Fragment", "Uncontrolled Comp.", "Security Headers", "State Management",
  "Optimizing React Apps", "Mongoose", "Interview Questions", "GraphQL",
];
const topicsRow3 = [
  "Long Polling", "Building Custom Hooks", "Handling Events", "Server Sent Event",
  "MongoDB", "HTTPS", "Error Handling", "Microservices", "Docker",
];

const rowColors = [
  { border: "rgba(255,122,0,0.35)", glow: "#ff7a00", dot: "#ff7a00" },
  { border: "rgba(0,212,255,0.3)",  glow: "#00d4ff", dot: "#00d4ff" },
  { border: "rgba(168,85,247,0.3)", glow: "#a855f7", dot: "#a855f7" },
];

const HeroMovingTopics = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="hmt-section position-relative overflow-hidden">
      <style>{`
        .hmt-section {
          background: #060610;
          padding: 110px 0 100px;
          color: white;
          position: relative;
          isolation: isolate;
          border-top: 1px solid rgba(0,212,255,0.08);
          border-bottom: 1px solid rgba(255,122,0,0.08);
        }
        .hmt-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(255,122,0,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 50%, rgba(0,212,255,0.05) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }
        .hmt-hex-bg {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0L56 16v48L28 80 0 64V16Z' fill='none' stroke='rgba(0,212,255,0.04)' stroke-width='0.5'/%3E%3C/svg%3E");
          background-size: 56px 100px;
          z-index: 0;
          pointer-events: none;
        }
        /* scan line */
        .hmt-section::after {
          content: '';
          position: absolute;
          left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent);
          animation: hmt-scan 6s ease-in-out infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes hmt-scan { 0%{top:0%} 100%{top:100%} }
        @keyframes hmt-fadein { to{opacity:1;transform:translateY(0)} }
        @keyframes hmt-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes hmt-scroll-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }

        /* Badge */
        .hmt-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(0,212,255,0.08); border:1px solid rgba(0,212,255,0.25);
          color:#00d4ff; padding:6px 18px; border-radius:50px;
          font-size:0.72rem; font-weight:700; letter-spacing:0.1em;
          text-transform:uppercase; margin-bottom:24px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:hmt-fadein 0.7s ease-out 0.1s forwards;
        }
        .hmt-badge-dot { width:6px;height:6px;border-radius:50%;background:#00d4ff;
          box-shadow:0 0 8px #00d4ff; animation:hmt-blink 1.5s ease-in-out infinite; }
        @keyframes hmt-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* Title */
        .hmt-title {
          font-size:clamp(2rem,4vw,3rem); font-weight:800; text-align:center;
          line-height:1.2; position:relative; z-index:2;
          opacity:0; transform:translateY(24px);
          animation:hmt-fadein 0.7s ease-out 0.2s forwards;
        }
        .hmt-title-grad {
          background:linear-gradient(90deg,#ff7a00,#ffb347);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .hmt-subtitle {
          text-align:center; color:#6b7a99; max-width:680px;
          margin:16px auto 56px; font-size:1rem; line-height:1.7;
          position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
          animation:hmt-fadein 0.7s ease-out 0.35s forwards;
        }
        .hmt-badge-inline {
          display:inline-block; background:rgba(255,122,0,0.12);
          color:#ff7a00; font-size:0.7rem; font-weight:700;
          padding:3px 12px; border-radius:20px; border:1px solid rgba(255,122,0,0.3);
          margin-left:10px; vertical-align:middle;
        }

        /* Marquee rows */
        .hmt-row-wrap { position:relative; z-index:2; margin-bottom:20px;
          opacity:0; transform:translateY(20px);
        }
        .hmt-row-wrap.vis { animation:hmt-fadein 0.7s ease-out forwards; }
        .hmt-row-wrap:nth-child(1).vis { animation-delay:0.4s }
        .hmt-row-wrap:nth-child(2).vis { animation-delay:0.55s }
        .hmt-row-wrap:nth-child(3).vis { animation-delay:0.7s }

        .hmt-marquee {
          display:flex; overflow:hidden;
          mask-image:linear-gradient(to right,transparent 0%,black 8%,black 92%,transparent 100%);
        }
        .hmt-track { display:flex; gap:14px; will-change:transform; }
        .hmt-track.fwd { animation:hmt-scroll 32s linear infinite; }
        .hmt-track.rev { animation:hmt-scroll-r 28s linear infinite; }
        .hmt-row-wrap:hover .hmt-track { animation-play-state:paused; }

        /* Topic pill */
        .hmt-pill {
          display:flex; align-items:center; gap:8px;
          padding:11px 22px; border-radius:40px; white-space:nowrap;
          font-size:0.85rem; font-weight:600;
          background:rgba(6,6,18,0.9); backdrop-filter:blur(8px);
          border:1px solid; cursor:default; position:relative; overflow:hidden;
          transition:transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hmt-pill::before {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
          transition:left 0.5s ease;
        }
        .hmt-pill:hover::before { left:100%; }
        .hmt-pill:hover { transform:translateY(-3px); }
        .hmt-pill-dot { width:5px;height:5px;border-radius:50%;flex-shrink:0; }

        /* Stats */
        .hmt-stats {
          display:flex; justify-content:center; gap:24px; flex-wrap:wrap;
          margin-top:72px; position:relative; z-index:2;
          opacity:0; transform:translateY(20px);
        }
        .hmt-stats.vis { animation:hmt-fadein 0.7s ease-out 0.85s forwards; }
        .hmt-stat-card {
          text-align:center; padding:22px 32px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:16px; backdrop-filter:blur(12px);
          position:relative; overflow:hidden;
          transition:transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .hmt-stat-card:hover { transform:translateY(-5px); }
        .hmt-stat-top { position:absolute;top:0;left:0;right:0;height:2px;border-radius:16px 16px 0 0; }
        .hmt-stat-num {
          font-size:2.2rem; font-weight:900; line-height:1;
          background:linear-gradient(135deg,#ff7a00,#ffb347);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          margin-bottom:6px;
        }
        .hmt-stat-lbl {
          font-size:0.7rem; color:#4a5568; text-transform:uppercase;
          letter-spacing:0.1em; font-weight:700;
        }

        @media(max-width:768px){
          .hmt-title{font-size:1.8rem}
          .hmt-stats{gap:12px}
          .hmt-stat-card{padding:16px 20px}
          .hmt-stat-num{font-size:1.6rem}
        }
        @media(prefers-reduced-motion:reduce){
          .hmt-track,.hmt-section::after{animation:none}
          .hmt-row-wrap,.hmt-stats,.hmt-title,.hmt-subtitle,.hmt-badge{animation:none;opacity:1;transform:none}
        }
      `}</style>

      <div className="hmt-hex-bg" />

      <Container className="position-relative" style={{ zIndex: 2 }}>
        <div className="text-center">
          <div className="hmt-badge">
            <span className="hmt-badge-dot" />
            KNOWLEDGE MATRIX — LIVE
          </div>
        </div>

        <h2 className="hmt-title">
          Fuel Your Career With{" "}
          <span className="hmt-title-grad">Expert-Crafted Lessons</span>
        </h2>

        <p className="hmt-subtitle">
          Unlock 300+ coding topics designed to take you from beginner to pro.
          Build skills that top companies demand.
          <span className="hmt-badge-inline">Updated Weekly</span>
        </p>

        {[topicsRow1, topicsRow2, topicsRow3].map((row, ri) => (
          <div key={ri} className={`hmt-row-wrap${isVisible ? " vis" : ""}`}>
            <div className="hmt-marquee">
              <div className={`hmt-track ${ri % 2 === 1 ? "rev" : "fwd"}`}>
                {[...row, ...row].map((item, i) => (
                  <div
                    key={i}
                    className="hmt-pill"
                    style={{
                      borderColor: rowColors[ri].border,
                      color: i % 3 === 0 ? rowColors[ri].glow : "#c8d0e0",
                      boxShadow: `0 0 0 0 ${rowColors[ri].glow}`,
                    }}
                  >
                    <span className="hmt-pill-dot" style={{ background: rowColors[ri].dot, boxShadow: `0 0 6px ${rowColors[ri].dot}` }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className={`hmt-stats${isVisible ? " vis" : ""}`}>
          {[
            { num: "300+", lbl: "Topics", color: "#ff7a00", border: "rgba(255,122,0,0.3)" },
            { num: "50+",  lbl: "Projects", color: "#00d4ff", border: "rgba(0,212,255,0.3)" },
            { num: "10K+", lbl: "Learners", color: "#a855f7", border: "rgba(168,85,247,0.3)" },
            { num: "4.8",  lbl: "Rating",   color: "#22d3ee", border: "rgba(34,211,238,0.3)" },
          ].map(({ num, lbl, color, border }) => (
            <div key={lbl} className="hmt-stat-card" style={{ borderColor: border, boxShadow: `0 8px 30px ${color}18` }}>
              <div className="hmt-stat-top" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
              <div className="hmt-stat-num">{num}</div>
              <div className="hmt-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default HeroMovingTopics;