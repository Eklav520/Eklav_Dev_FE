"use client";

import { useEffect, useState } from "react";
import ReelsModal from "./components/ReelsModal";
import {
  FaPlay, FaChevronRight, FaBookmark, FaSearch, FaFilter,
  FaReact, FaJava, FaPython, FaDatabase, FaNodeJs,
  FaCode, FaShieldAlt, FaRobot, FaLayerGroup, FaDocker,
  FaGitAlt, FaTerminal,
} from "react-icons/fa";
import {
  SiJavascript, SiSpringboot, SiMysql, SiMongodb,
  SiTypescript, SiFlask, SiAwsamplify, SiPandas,
  SiCss3, SiHtml5, SiOpenai,
} from "react-icons/si";
import { BsLockFill, BsPlayCircleFill } from "react-icons/bs";
import { MdOutlineTimer } from "react-icons/md";
import { VscVscode } from "react-icons/vsc";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";
import reelsImg from "@/assets/images/Reels.png";

const ORANGE = "#ff6b00";

/* ── keyword → icon + card background gradient ── */
const COURSE_META = [
  { keys: ["react"],              Icon: FaReact,       color: "#61dafb", bg: "linear-gradient(160deg,#0c3d54,#061d2b)" },
  { keys: ["javascript","js"],    Icon: SiJavascript,  color: "#f7df1e", bg: "linear-gradient(160deg,#2a1f00,#0d0a00)" },
  { keys: ["node"],               Icon: FaNodeJs,      color: "#68a063", bg: "linear-gradient(160deg,#0d2e0b,#040f04)" },
  { keys: ["python"],             Icon: FaPython,      color: "#4ec9b0", bg: "linear-gradient(160deg,#04312a,#01100d)" },
  { keys: ["sql","mysql"],        Icon: SiMysql,       color: "#c084fc", bg: "linear-gradient(160deg,#1e0a40,#0a0320)" },
  { keys: ["html"],               Icon: SiHtml5,       color: "#e96228", bg: "linear-gradient(160deg,#3d1100,#150600)" },
  { keys: ["css"],                Icon: SiCss3,        color: "#38bdf8", bg: "linear-gradient(160deg,#0a2a40,#040f1a)" },
  { keys: ["git"],                Icon: FaGitAlt,      color: "#f05032", bg: "linear-gradient(160deg,#3d0f0a,#150503)" },
  { keys: ["docker"],             Icon: FaDocker,      color: "#2496ed", bg: "linear-gradient(160deg,#051f40,#010c1a)" },
  { keys: ["api"],                Icon: FaTerminal,    color: "#a3e635", bg: "linear-gradient(160deg,#1a2e04,#090f01)" },
  { keys: ["deep learning","deep"],Icon: FaRobot,      color: "#f472b6", bg: "linear-gradient(160deg,#3d0a26,#15030e)" },
  { keys: ["spring boot"],        Icon: SiSpringboot,  color: "#6db33f", bg: "linear-gradient(160deg,#0e2d0a,#040f04)" },
  { keys: ["java"],               Icon: FaJava,        color: "#f97316", bg: "linear-gradient(160deg,#2d1000,#0f0600)" },
  { keys: ["dsa","data str"],     Icon: FaCode,        color: "#a78bfa", bg: "linear-gradient(160deg,#160d3b,#060315)" },
  { keys: ["vscode","vs code"],   Icon: VscVscode,     color: "#0098ff", bg: "linear-gradient(160deg,#00213d,#000d1a)" },
  { keys: ["mongo"],              Icon: SiMongodb,     color: "#47a248", bg: "linear-gradient(160deg,#0d2e0b,#040f04)" },
  { keys: ["flask"],              Icon: SiFlask,       color: "#ffffff", bg: "linear-gradient(160deg,#1a1a2e,#09090f)" },
  { keys: ["postman"],            Icon: FaTerminal,    color: "#ff6c37", bg: "linear-gradient(160deg,#3d1800,#150900)" },
  { keys: ["typescript","ts"],    Icon: SiTypescript,  color: "#3178c6", bg: "linear-gradient(160deg,#061a36,#020a15)" },
  { keys: ["aws","s3"],           Icon: SiAwsamplify,  color: "#ff9900", bg: "linear-gradient(160deg,#2d1f00,#0f0a00)" },
  { keys: ["pandas"],             Icon: SiPandas,      color: "#150458", bg: "linear-gradient(160deg,#05012e,#020015)" },
  { keys: ["chatgpt","openai","gpt"], Icon: SiOpenai,  color: "#10a37f", bg: "linear-gradient(160deg,#012b22,#000f0c)" },
  { keys: ["interview"],          Icon: FaLayerGroup,  color: "#34d399", bg: "linear-gradient(160deg,#043d22,#01150b)" },
  { keys: ["ai","ml","machine"],  Icon: FaRobot,       color: "#c084fc", bg: "linear-gradient(160deg,#220a40,#0a0320)" },
  { keys: ["cyber","security"],   Icon: FaShieldAlt,   color: "#f87171", bg: "linear-gradient(160deg,#3d0808,#150303)" },
  { keys: ["database","db"],      Icon: FaDatabase,    color: "#06b6d4", bg: "linear-gradient(160deg,#042030,#010c12)" },
];

function getMeta(name: string, idx: number) {
  const lower = name.toLowerCase();
  for (const m of COURSE_META) {
    if (m.keys.some(k => lower.includes(k))) return m;
  }
  const fb = [
    { Icon: FaCode,      color: "#f59e0b", bg: "linear-gradient(160deg,#2d1500,#0f0800)" },
    { Icon: FaDatabase,  color: "#06b6d4", bg: "linear-gradient(160deg,#042030,#010c12)" },
    { Icon: FaLayerGroup,color: "#a78bfa", bg: "linear-gradient(160deg,#160d3b,#060315)" },
  ];
  return { ...fb[idx % fb.length], keys: [] };
}

function fmtViews(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

/* ══ Portrait Reel Card ══ */
function ReelCard({ section, idx, isLocked, onClick }: {
  section: any; idx: number; isLocked: boolean; onClick: () => void;
}) {
  const m = getMeta(section.courseName, idx);
  const Icon = m.Icon;
  const views = fmtViews(section.reelCount * 312 + idx * 97);
  const dur = `0:${40 + (idx % 18)}`;
  const clickable = !isLocked && section.reelCount > 0;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: m.bg,
        cursor: clickable ? "pointer" : "default",
        opacity: isLocked ? 0.45 : section.reelCount === 0 ? 0.5 : 1,
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        aspectRatio: "3/4",
      }}
    >
      {/* Top badges row */}
      <div style={{ position: "absolute", top: 9, left: 9, right: 9, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
        <div style={{ background: m.color + "28", border: `1px solid ${m.color}55`, borderRadius: 6, padding: "3px 9px", fontSize: 10, color: m.color, fontWeight: 700 }}>
          {section.reelCount} Reels
        </div>
        <div style={{ background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 3 }}>
          <MdOutlineTimer style={{ fontSize: 11 }} />{dur}
        </div>
      </div>

      {/* Lock */}
      {isLocked && (
        <div style={{ position: "absolute", top: 9, right: 9, background: "rgba(0,0,0,0.55)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <BsLockFill style={{ color: "#aaa", fontSize: 12 }} />
        </div>
      )}

      {/* Icon area — center */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 140 }}>
        <Icon style={{ fontSize: 72, color: m.color, filter: `drop-shadow(0 0 28px ${m.color}99)` }} />
        {section.reelCount === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#888" }}>Coming Soon</div>
        )}
      </div>

      {/* Bottom info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 10, lineHeight: 1.35 }}>
          {section.courseName}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#777" }}>
            <BsPlayCircleFill style={{ color: ORANGE, fontSize: 12 }} />
            {views}
          </div>
          <FaBookmark style={{ color: "#333", fontSize: 12 }} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ PAGE ══════════════════ */
export default function ReelCoursesPage() {
  const [isReelsOpen, setIsReelsOpen]       = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string>();
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading]               = useState(true);
  const [sections, setSections]             = useState<any[]>([]);

  const { user } = useAuthContext();
  const token    = user?.token;
  const baseURL  = import.meta.env.VITE_API_BASE_URL;
  const isPending = user?.status?.toLowerCase() === "pending";

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/api/studentSideReels/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSections(res.data.sections || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const freeSectionId = sections.find(s => s.reelCount > 0)?._id;
  const isLocked      = (s: any) => isPending && s._id !== freeSectionId;
  const active        = sections.filter(s => s.reelCount > 0);
  const categories    = ["All", ...active.map(s => s.courseName)];

  const displayed = activeCategory === "All"
    ? sections
    : sections.filter(s => s.courseName === activeCategory);

  const openReels = (id?: string) => { setSelectedReelId(id); setIsReelsOpen(true); };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#0f172a" }}>

      {/* ── Header: Tech Bytes + Search + Filter ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "20px 20px 12px" }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "#0f172a", whiteSpace: "nowrap" }}>
            Tech <span style={{ color: ORANGE }}>Bytes</span>
          </h1>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>Bite-sized reels</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 320, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
            <FaSearch style={{ color: "#94a3b8", fontSize: 13 }} />
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Search topics, technology…</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FaFilter style={{ color: "#64748b", fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div style={{ overflowX: "auto", padding: "4px 20px 14px" }}>
        <div style={{ display: "flex", gap: 8, width: "max-content" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "6px 16px", borderRadius: 22,
              border: activeCategory === cat ? "none" : "1px solid #e2e8f0",
              background: activeCategory === cat ? ORANGE : "#f8fafc",
              color: activeCategory === cat ? "#fff" : "#374151",
              cursor: "pointer", fontSize: 12,
              fontWeight: activeCategory === cat ? 700 : 500,
              whiteSpace: "nowrap", outline: "none",
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{ margin: "0 20px 22px", borderRadius: 22, overflow: "hidden", position: "relative", minHeight: 190,
        background: "linear-gradient(120deg, #fffaf5 0%, #fff3e0 55%, #ffe0b2 100%)" }}>
        <div style={{ position: "absolute", top: -50, right: -30, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,107,0,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "55%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,107,0,0.05)", pointerEvents: "none" }} />

        {/* Text */}
        <div style={{ padding: "28px 28px", position: "relative", zIndex: 2, maxWidth: "52%" }}>
          <div style={{ fontSize: 11, color: "#b45309", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            ✦ Learn. Code. Grow.
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, color: "#0f172a", marginBottom: 10 }}>
            Big Concepts.<br />
            <span style={{ color: ORANGE }}>Bite-sized</span> Learning.
          </div>
          <div style={{ fontSize: 12.5, color: "#78350f", marginBottom: 22, lineHeight: 1.6 }}>
            Quick tech insights to upgrade your skills,<br />one reel at a time.
          </div>
          <button
            onClick={() => openReels(freeSectionId)}
            style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 26, padding: "11px 26px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 6px 20px ${ORANGE}55` }}
          >
            <FaPlay style={{ fontSize: 11 }} /> Start Watching
          </button>
        </div>

        {/* Reels image on right */}
        <img
          src={reelsImg}
          alt="Reels preview"
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", height: "100%", width: "auto", objectFit: "contain", zIndex: 2 }}
        />
      </div>

      {/* ── Pending Banner ── */}
      {isPending && (
        <div style={{ margin: "0 20px 14px", background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)", borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#64748b" }}>
          <BsLockFill style={{ color: ORANGE, flexShrink: 0 }} />
          <span><strong style={{ color: ORANGE }}>Trial access:</strong> 1 free course. Enroll to unlock all.</span>
        </div>
      )}

      {/* ── Section Title ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 16px" }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
          {activeCategory === "All" ? "All Reels" : activeCategory}
        </span>
        <button style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          Latest <FaChevronRight style={{ fontSize: 9, transform: "rotate(90deg)" }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 260 }}>
          <div style={{ width: 42, height: 42, border: `4px solid rgba(255,107,0,0.12)`, borderTop: `4px solid ${ORANGE}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 13 }}>No reels available</div>
      ) : (
        <div style={{ padding: "0 20px 40px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {displayed.map((s, i) => (
            <ReelCard key={s._id} section={s} idx={i} isLocked={isLocked(s)} onClick={() => openReels(s._id)} />
          ))}
        </div>
      )}

      <ReelsModal isOpen={isReelsOpen} onClose={() => setIsReelsOpen(false)} sectionId={selectedReelId} />

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        ::-webkit-scrollbar { display:none }
      `}</style>
    </div>
  );
}
