"use client";

import { useEffect, useState } from "react";
import ReelsModal from "./components/ReelsModal";
import {
  FaPlay, FaChevronRight, FaBookmark, FaSearch, FaFilter,
  FaReact, FaJava, FaPython, FaDatabase, FaNodeJs,
  FaCode, FaShieldAlt, FaRobot, FaLayerGroup, FaDocker,
  FaGitAlt, FaTerminal, FaCss3, FaHtml5, FaAws,
  FaJsSquare, FaLeaf, FaFlask, FaTable,
} from "react-icons/fa";
import { BsLockFill, BsPlayCircleFill, BsTrophyFill } from "react-icons/bs";
import { MdOutlineTimer } from "react-icons/md";
import { VscVscode } from "react-icons/vsc";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";
import reelsImg from "@/assets/images/Reels.png";

const ORANGE = "#ff6b00";

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #ffffff)';
const CARD_BG     = 'var(--dash-card-bg, #ffffff)';
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)';
const PAGE_TEXT   = 'var(--dash-text, #0f172a)';
const PAGE_GRAY   = 'var(--dash-gray, #64748b)';

/* ── keyword → icon + card background gradient ── */
const COURSE_META = [
  { keys: ["react"],              Icon: FaReact,       color: "#61dafb", bg: "linear-gradient(160deg,#0c3d54,#061d2b)" },
  { keys: ["javascript","js"],    Icon: FaJsSquare,    color: "#f7df1e", bg: "linear-gradient(160deg,#2a1f00,#0d0a00)" },
  { keys: ["node"],               Icon: FaNodeJs,      color: "#68a063", bg: "linear-gradient(160deg,#0d2e0b,#040f04)" },
  { keys: ["python"],             Icon: FaPython,      color: "#4ec9b0", bg: "linear-gradient(160deg,#04312a,#01100d)" },
  { keys: ["sql","mysql"],        Icon: FaDatabase,    color: "#c084fc", bg: "linear-gradient(160deg,#1e0a40,#0a0320)" },
  { keys: ["html"],               Icon: FaHtml5,       color: "#e96228", bg: "linear-gradient(160deg,#3d1100,#150600)" },
  { keys: ["css"],                Icon: FaCss3,        color: "#38bdf8", bg: "linear-gradient(160deg,#0a2a40,#040f1a)" },
  { keys: ["git"],                Icon: FaGitAlt,      color: "#f05032", bg: "linear-gradient(160deg,#3d0f0a,#150503)" },
  { keys: ["docker"],             Icon: FaDocker,      color: "#2496ed", bg: "linear-gradient(160deg,#051f40,#010c1a)" },
  { keys: ["api"],                Icon: FaTerminal,    color: "#a3e635", bg: "linear-gradient(160deg,#1a2e04,#090f01)" },
  { keys: ["deep learning","deep"],Icon: FaRobot,      color: "#f472b6", bg: "linear-gradient(160deg,#3d0a26,#15030e)" },
  { keys: ["spring boot"],        Icon: FaLeaf,        color: "#6db33f", bg: "linear-gradient(160deg,#0e2d0a,#040f04)" },
  { keys: ["java"],               Icon: FaJava,        color: "#f97316", bg: "linear-gradient(160deg,#2d1000,#0f0600)" },
  { keys: ["dsa","data str"],     Icon: FaCode,        color: "#a78bfa", bg: "linear-gradient(160deg,#160d3b,#060315)" },
  { keys: ["vscode","vs code"],   Icon: VscVscode,     color: "#0098ff", bg: "linear-gradient(160deg,#00213d,#000d1a)" },
  { keys: ["mongo"],              Icon: FaDatabase,    color: "#47a248", bg: "linear-gradient(160deg,#0d2e0b,#040f04)" },
  { keys: ["flask"],              Icon: FaFlask,       color: "#ffffff", bg: "linear-gradient(160deg,#1a1a2e,#09090f)" },
  { keys: ["postman"],            Icon: FaTerminal,    color: "#ff6c37", bg: "linear-gradient(160deg,#3d1800,#150900)" },
  { keys: ["typescript","ts"],    Icon: FaCode,        color: "#3178c6", bg: "linear-gradient(160deg,#061a36,#020a15)" },
  { keys: ["aws","s3"],           Icon: FaAws,         color: "#ff9900", bg: "linear-gradient(160deg,#2d1f00,#0f0a00)" },
  { keys: ["pandas"],             Icon: FaTable,       color: "#7c3aed", bg: "linear-gradient(160deg,#05012e,#020015)" },
  { keys: ["chatgpt","openai","gpt"], Icon: FaRobot,   color: "#10a37f", bg: "linear-gradient(160deg,#012b22,#000f0c)" },
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

type ModulePlan = "6months" | "12months";

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

  // Full access (status === 'approved') OR a standalone "reels" module
  // purchase unlocks playback — no free trial, fully locked otherwise.
  // Server-enforced in GET /api/studentSideReels/:courseId.
  const [moduleInfo, setModuleInfo] = useState<{ fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string; endDate?: string | null } | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<ModulePlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ModulePlan>("12months");
  const [buyError, setBuyError] = useState<string | null>(null);

  const fetchModuleAccess = () => {
    if (!token) return;
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const mod = data.modules?.reels;
        setModuleInfo({
          fullAccess: !!data.fullAccess,
          active: !!mod?.active,
          plans: { "6months": mod?.plans?.["6months"] ?? 19900, "12months": mod?.plans?.["12months"] ?? 34900 },
          label: mod?.label ?? "Tech Bytes Reels",
          endDate: mod?.endDate ?? null,
        });
      })
      .catch(() => {});
  };
  useEffect(fetchModuleAccess, [token, baseURL]);

  const hasAccess = moduleInfo ? (moduleInfo.fullAccess || moduleInfo.active) : user?.status?.toLowerCase() === "approved";
  const modulePurchased = !!moduleInfo?.active && !moduleInfo?.fullAccess;

  const buyModule = (plan: ModulePlan) => {
    if (!token || buyingPlan) return;
    setBuyingPlan(plan);
    setBuyError(null);
    fetch(`${baseURL}/api/student/module-access/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleKey: "reels", plan }),
    })
      .then(r => r.json())
      .then(order => {
        if (!order.success) throw new Error(order.message || "Failed to start payment");
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Eklav",
          description: order.moduleLabel,
          order_id: order.orderId,
          prefill: { name: (user as any)?.fullName || "", email: user?.email || "" },
          theme: { color: ORANGE },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${baseURL}/api/student/module-access/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...response, moduleKey: "reels", plan }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success) throw new Error(verifyData.message || "Payment verification failed");
              fetchModuleAccess();
            } catch (e: any) {
              setBuyError(e.message || "Payment verification failed. Contact support.");
            } finally {
              setBuyingPlan(null);
            }
          },
          modal: { ondismiss: () => setBuyingPlan(null) },
        };
        const razorpay = new (window as any).Razorpay(options);
        razorpay.on("payment.failed", (response: any) => {
          setBuyError(`Payment failed: ${response.error?.description || "Unknown error"}`);
          setBuyingPlan(null);
        });
        razorpay.open();
      })
      .catch(e => { setBuyError(e.message || "Failed to start payment"); setBuyingPlan(null); });
  };

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

  const isLocked      = (_s: any) => !hasAccess;
  const active        = sections.filter(s => s.reelCount > 0);
  const categories    = ["All", ...active.map(s => s.courseName)];

  const displayed = activeCategory === "All"
    ? sections
    : sections.filter(s => s.courseName === activeCategory);

  const openReels = (id?: string) => {
    if (!hasAccess) return;
    setSelectedReelId(id);
    setIsReelsOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, color: PAGE_TEXT }}>

      {/* ── Header: Tech Bytes + Search + Filter ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "20px 20px 12px" }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: PAGE_TEXT, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            Tech <span style={{ color: ORANGE }}>Bytes</span>
            {!hasAccess && (
              <span title="Unlock this module, or subscribe to a full plan" style={{ fontSize: 11, fontWeight: 800, background: "#fff", color: ORANGE, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${ORANGE}`, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <BsLockFill size={10} /> PREMIUM MODULE
              </span>
            )}
            {modulePurchased && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 20, border: "1.5px solid #86efac", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as const }}>
                <BsTrophyFill size={10} color="#16a34a" />
                Unlocked{moduleInfo?.endDate ? ` — valid until ${new Date(moduleInfo.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
              </span>
            )}
          </h1>
          <div style={{ fontSize: 10, color: PAGE_GRAY, marginTop: 1 }}>Bite-sized reels</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 320, background: CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
            <FaSearch style={{ color: PAGE_GRAY, fontSize: 13 }} />
            <span style={{ fontSize: 13, color: PAGE_GRAY }}>Search topics, technology…</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FaFilter style={{ color: PAGE_GRAY, fontSize: 13 }} />
          </div>
        </div>
      </div>
      {buyError && (
        <div style={{ margin: "0 20px 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "10px 16px", fontSize: 12.5 }}>
          {buyError}
        </div>
      )}

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
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
            <button
              onClick={() => hasAccess && openReels(active[0]?._id)}
              disabled={!hasAccess}
              style={{ background: hasAccess ? ORANGE : "#cbd5e1", color: "#fff", border: "none", borderRadius: 26, padding: "11px 26px", fontSize: 13, fontWeight: 800, cursor: hasAccess ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, boxShadow: hasAccess ? `0 6px 20px ${ORANGE}55` : "none", whiteSpace: "nowrap" as const }}
            >
              {hasAccess ? <><FaPlay style={{ fontSize: 11 }} /> Start Watching</> : <><BsLockFill style={{ fontSize: 11 }} /> Locked — Unlock to Watch</>}
            </button>

            {!hasAccess && (() => {
              const price6 = (moduleInfo?.plans?.["6months"] ?? 19900) / 100;
              const price12 = (moduleInfo?.plans?.["12months"] ?? 34900) / 100;
              const betterValue = price12 / 12 < price6 / 6;
              const isBusy = buyingPlan === selectedPlan;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,107,0,0.3)", borderRadius: 10, padding: 4 }}>
                  {(["6months", "12months"] as ModulePlan[]).map((plan) => {
                    const price = plan === "6months" ? price6 : price12;
                    const active2 = selectedPlan === plan;
                    const highlight = plan === "12months" && betterValue;
                    return (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        style={{
                          position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                          padding: "6px 14px", borderRadius: 7, minWidth: 78,
                          border: active2 ? `1.5px solid ${ORANGE}` : "1.5px solid transparent", cursor: "pointer",
                          background: active2 ? "#fff" : "transparent",
                        }}
                      >
                        {highlight && (
                          <span style={{
                            position: "absolute", top: -8, right: -4, background: "#16a34a", color: "#fff", fontSize: 8.5,
                            fontWeight: 700, letterSpacing: 0.2, borderRadius: 10, padding: "2px 5px", whiteSpace: "nowrap" as const,
                          }}>
                            BEST
                          </span>
                        )}
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: active2 ? ORANGE : "#999", whiteSpace: "nowrap" as const }}>
                          {plan === "6months" ? "6 Months" : "12 Months"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>₹{price}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => buyModule(selectedPlan)}
                    disabled={!!buyingPlan || !moduleInfo}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, background: ORANGE, border: "none", color: "#fff",
                      borderRadius: 7, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, marginLeft: 6,
                      cursor: buyingPlan ? "not-allowed" : "pointer", opacity: buyingPlan && !isBusy ? 0.5 : 1,
                    }}
                  >
                    {isBusy ? "Processing…" : "Buy Now"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Reels image on right */}
        <img
          src={reelsImg}
          alt="Reels preview"
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", height: "100%", width: "auto", objectFit: "contain", zIndex: 2 }}
        />
      </div>

      {/* ── Category Pills ── */}
      <div style={{ overflowX: "auto", overflowY: "hidden", padding: "4px 20px 14px" }}>
        <div style={{ display: "flex", gap: 8, width: "max-content" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "6px 16px", borderRadius: 22,
              border: activeCategory === cat ? "none" : `1px solid ${PAGE_BORDER}`,
              background: activeCategory === cat ? ORANGE : CARD_BG,
              color: activeCategory === cat ? "#fff" : PAGE_TEXT,
              cursor: "pointer", fontSize: 12,
              fontWeight: activeCategory === cat ? 700 : 500,
              whiteSpace: "nowrap", outline: "none",
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Title ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 16px" }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: PAGE_TEXT }}>
          {activeCategory === "All" ? "All Reels" : activeCategory}
        </span>
        <button style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: PAGE_GRAY, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          Latest <FaChevronRight style={{ fontSize: 9, transform: "rotate(90deg)" }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 260 }}>
          <div style={{ width: 42, height: 42, border: `4px solid rgba(255,107,0,0.12)`, borderTop: `4px solid ${ORANGE}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: PAGE_GRAY, fontSize: 13 }}>No reels available</div>
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
