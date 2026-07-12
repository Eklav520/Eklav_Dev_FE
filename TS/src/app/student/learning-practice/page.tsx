import React, { useState, useEffect } from "react"
import PageMetaData from "@/components/PageMetaData"
import LearningPractice from "./components/LearningPractice"
import ReadingPractice from "./components/ReadingPractice"
import VocabularyPractice from "./components/VocabularyPractice"
import { useAuthContext } from "@/context/useAuthContext"
import {
  FaHeadphones, FaBookOpen, FaFont, FaArrowRight, FaArrowLeft,
  FaCheckCircle, FaMicrophone, FaClipboardList, FaChartLine,
  FaStar, FaFire, FaBullseye, FaLightbulb, FaBrain, FaLayerGroup,
} from "react-icons/fa"
import boyImg from "@/assets/images/Boy.png"

const ORANGE  = "#ff6b00"
const BLUE    = "#3b82f6"
const PURPLE  = "#8b5cf6"

const READING_TOPICS = [
  "Technology", "Science", "History", "Culture",
  "Business", "Environment", "Sports", "Health",
]

const LISTENING_CATEGORIES = [
  "Conversations", "News", "Interviews", "Podcasts",
  "Lectures", "Stories", "Business",
]

const PRACTICE_CARDS = [
  {
    id: "listening",
    label: "Listening Practice",
    color: ORANGE,
    bg: "#fff7f0",
    Icon: FaHeadphones,
    description: "Listen to real-life conversations, lectures, and discussions. Answer questions and improve your comprehension.",
    features: ["Multiple difficulty levels", "Real-time feedback", "Audio transcripts"],
    btnLabel: "Start Listening",
    hasCategory: true,
  },
  {
    id: "reading",
    label: "Reading Practice",
    color: BLUE,
    bg: "#eff6ff",
    Icon: FaBookOpen,
    description: "Read engaging passages on diverse topics and test your comprehension with interactive questions.",
    features: ["Diverse topics & passages", "Comprehension exercises", "Instant explanations"],
    btnLabel: "Start Reading",
    hasTopic: true,
  },
  {
    id: "vocabulary",
    label: "Vocabulary Practice",
    color: PURPLE,
    bg: "#faf5ff",
    Icon: FaBrain,
    description: "Learn new words in context, strengthen your vocabulary, and test your knowledge with smart quizzes.",
    features: ["Word in context", "Vocabulary quizzes", "Spaced repetition"],
    btnLabel: "Start Vocabulary",
  },
]

const NAV_CARDS = [
  { id: "listening", label: "Listening", color: ORANGE, bg: "#fff7f0", Icon: FaHeadphones, desc: "Improve your listening comprehension with AI-powered audio challenges" },
  { id: "reading",   label: "Reading",   color: BLUE,   bg: "#eff6ff", Icon: FaBookOpen,  desc: "Enhance reading skills with interactive passages and comprehension exercises" },
  { id: "vocabulary",label: "Vocabulary",color: PURPLE, bg: "#faf5ff", Icon: FaBrain,     desc: "Build your vocabulary with contextual learning and smart quizzes" },
]

type PracticeHistory = {
  attemptsUsed: number
  monthlyLimit: number
  summary: { bestScore: number | null; latestScore: number | null }
}

const EnglishPractice = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [view, setView]           = useState<"overview" | "listening" | "reading" | "vocabulary">("overview")
  const [activeTopic, setActiveTopic] = useState("Technology")
  const [activeCategory, setActiveCategory] = useState("Conversations")
  const [listeningStats, setListeningStats] = useState<PracticeHistory | null>(null)
  const [readingStats, setReadingStats]     = useState<PracticeHistory | null>(null)

  useEffect(() => {
    if (!token || !baseURL) return
    const headers = { Authorization: `Bearer ${token}` }
    fetch(`${baseURL}/learning/listening/history`, { headers })
      .then(r => r.json()).then(setListeningStats).catch(() => {})
    fetch(`${baseURL}/learning/reading/history`, { headers })
      .then(r => r.json()).then(setReadingStats).catch(() => {})
  }, [token, baseURL])

  const goTo = (id: string) => setView(id as typeof view)
  const goBack = () => setView("overview")

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <PageMetaData title="English Practice" />

      {/* ── Left Sidebar ── */}
      <div style={{ width: 260, background: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", padding: "24px 14px", gap: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 8, paddingLeft: 6 }}>English Practice</div>
        {NAV_CARDS.map(({ id, label, color, bg, Icon: NavIcon, desc }) => (
          <div
            key={id}
            onClick={() => goTo(id)}
            style={{
              background: view === id ? color + "10" : "#fff",
              border: `1.5px solid ${view === id ? color + "55" : "#f1f5f9"}`,
              borderRadius: 14, padding: "14px 14px 10px", cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: view === id ? `0 4px 16px ${color}20` : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <NavIcon style={{ color, fontSize: 18 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: view === id ? color : "#0f172a" }}>{label}</div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
            <button
              onClick={e => { e.stopPropagation(); goTo(id) }}
              style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${color}40`, background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FaArrowRight style={{ color, fontSize: 11 }} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {view === "overview" ? (
          <div>
            {/* Hero Banner */}
            <div style={{
              background: "linear-gradient(120deg, #fffbf5 0%, #fff5e8 55%, #ffecd4 100%)",
              borderBottom: "1px solid #fde8c8",
              padding: "32px 36px 0",
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              minHeight: 190, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: 0, left: "45%", top: 0, bottom: 0, opacity: 0.14, backgroundImage: "radial-gradient(circle, #cc5500 1.5px, transparent 1.5px)", backgroundSize: "18px 18px", pointerEvents: "none" }} />
              <div style={{ zIndex: 2, paddingBottom: 28 }}>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.1 }}>English Practice</h1>
                <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px" }}>Practice daily. Improve steadily. Excel confidently.</p>
                <div style={{ display: "flex", gap: 20 }}>
                  {[
                    { Icon: FaBullseye, label: "AI-Powered",    sub: "Smart learning"       },
                    { Icon: FaChartLine,label: "Track Progress", sub: "See your improvement" },
                    { Icon: FaLayerGroup,label:"Personalized",   sub: "Learn at your pace"  },
                  ].map(({ Icon: BIcon, label, sub }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BIcon style={{ color: ORANGE, fontSize: 18, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{label}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <img src={boyImg} alt="English practice" style={{ height: 175, width: "auto", objectFit: "contain", alignSelf: "flex-end", zIndex: 2, flexShrink: 0 }} />
            </div>

            {/* Practice Cards */}
            <div style={{ padding: "28px 28px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {PRACTICE_CARDS.map(({ id, label, color, bg, Icon: PIcon, description, features, btnLabel, hasTopic, hasCategory }: any) => (
                <div key={id} style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* Card top icon area */}
                  <div style={{ background: bg, padding: "24px 24px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff", boxShadow: `0 4px 16px ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PIcon style={{ color, fontSize: 26 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{description}</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ padding: "16px 20px", flex: 1 }}>
                    {features.map((f: string) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <FaCheckCircle style={{ color, fontSize: 13, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                      </div>
                    ))}

                    {/* Listening — Choose a Category */}
                    {hasCategory && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Choose a Category</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {LISTENING_CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setActiveCategory(cat)}
                              style={{
                                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                background: activeCategory === cat ? color : "#f8fafc",
                                color: activeCategory === cat ? "#fff" : "#64748b",
                                border: `1px solid ${activeCategory === cat ? color : "#e2e8f0"}`,
                                transition: "all 0.15s",
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reading — Choose a Topic */}
                    {hasTopic && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Choose a Topic</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {READING_TOPICS.map(topic => (
                            <button
                              key={topic}
                              onClick={() => setActiveTopic(topic)}
                              style={{
                                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                background: activeTopic === topic ? color : "#f8fafc",
                                color: activeTopic === topic ? "#fff" : "#64748b",
                                border: `1px solid ${activeTopic === topic ? color : "#e2e8f0"}`,
                                transition: "all 0.15s",
                              }}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Start button */}
                  <div style={{ padding: "0 20px 20px" }}>
                    <button
                      onClick={() => goTo(id)}
                      style={{
                        width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                        background: color, color: "#fff", fontWeight: 700, fontSize: 14,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: `0 4px 14px ${color}35`,
                      }}
                    >
                      <PIcon style={{ fontSize: 14 }} /> {btnLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row — Listening + Reading live data */}
            <div style={{ padding: "24px 28px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Listening Stats */}
              {[
                { label: "Listening", color: ORANGE, bg: "#fff7f0", Icon: FaHeadphones, stats: listeningStats },
                { label: "Reading",   color: BLUE,   bg: "#eff6ff", Icon: FaBookOpen,   stats: readingStats   },
              ].map(({ label, color, bg, Icon: SIcon, stats }) => {
                const attempts  = stats?.attemptsUsed ?? 0
                const limit     = stats?.monthlyLimit ?? 30
                const bestScore = stats?.summary?.bestScore
                const lastScore = stats?.summary?.latestScore
                const pct       = Math.round((attempts / limit) * 100)
                return (
                  <div key={label} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                    {/* Card header */}
                    <div style={{ background: bg, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid " + color + "20" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${color}25` }}>
                        <SIcon style={{ color, fontSize: 17 }} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color }}>{label} Practice</div>
                      <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>This Month</div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                      {/* Attempts */}
                      <div style={{ padding: "16px 18px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Attempts</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                          {attempts}<span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>/{limit}</span>
                        </div>
                        <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{limit - attempts} remaining</div>
                      </div>

                      {/* Best Score */}
                      <div style={{ padding: "16px 18px", borderRight: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Best Score</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: bestScore !== null && bestScore !== undefined ? color : "#94a3b8", lineHeight: 1 }}>
                            {bestScore !== null && bestScore !== undefined ? bestScore : "--"}
                          </div>
                          {bestScore !== null && bestScore !== undefined && <span style={{ fontSize: 13, color: "#94a3b8" }}>%</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>
                          {bestScore !== null && bestScore !== undefined
                            ? bestScore >= 80 ? "Excellent" : bestScore >= 60 ? "Good" : "Keep going"
                            : "No attempts yet"}
                        </div>
                      </div>

                      {/* Last Score */}
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Last Score</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: lastScore !== null && lastScore !== undefined ? "#0f172a" : "#94a3b8", lineHeight: 1 }}>
                            {lastScore !== null && lastScore !== undefined ? lastScore : "--"}
                          </div>
                          {lastScore !== null && lastScore !== undefined && <span style={{ fontSize: 13, color: "#94a3b8" }}>%</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>
                          {lastScore !== null && lastScore !== undefined ? "Most recent" : "No attempts yet"}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        ) : (
          /* ── Practice Component View ── */
          <div>
            <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "16px 28px", display: "flex", alignItems: "center", gap: 14 }}>
              <button
                onClick={goBack}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}
              >
                <FaArrowLeft style={{ fontSize: 11 }} /> Back
              </button>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {view === "listening" ? "Listening" : view === "reading" ? "Reading" : "Vocabulary"} Practice
                </div>
                {view === "reading" && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Topic: <strong style={{ color: BLUE }}>{activeTopic}</strong></div>
                )}
              </div>
            </div>
            <div style={{ padding: "20px 28px" }}>
              {view === "listening"  && <LearningPractice />}
              {view === "reading"    && <ReadingPractice />}
              {view === "vocabulary" && <VocabularyPractice />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnglishPractice
