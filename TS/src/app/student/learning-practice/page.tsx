import React, { useState } from "react"
import PageMetaData from "@/components/PageMetaData"
import LearningPractice from "./components/LearningPractice"
import ReadingPractice from "./components/ReadingPractice"
import VocabularyPractice from "./components/VocabularyPractice"
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

const STATS = [
  { label: "Monthly Attempts", value: "0 / 30", sub: "30 attempts remaining",  color: ORANGE,  Icon: FaBullseye },
  { label: "Best Score",       value: "--",      sub: "No attempts yet",        color: BLUE,    Icon: FaStar    },
  { label: "Overall Progress", value: "0%",      sub: "Keep practicing!",       color: "#22c55e", Icon: FaChartLine },
  { label: "Streak",           value: "0 Days",  sub: "Start your streak today!", color: "#f59e0b", Icon: FaFire },
]

const EnglishPractice = () => {
  const [view, setView]           = useState<"overview" | "listening" | "reading" | "vocabulary">("overview")
  const [activeTopic, setActiveTopic] = useState("Technology")

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
              {PRACTICE_CARDS.map(({ id, label, color, bg, Icon: PIcon, description, features, btnLabel, hasTopic }) => (
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
                    {features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <FaCheckCircle style={{ color, fontSize: 13, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                      </div>
                    ))}

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

            {/* Stats Row */}
            <div style={{ padding: "24px 28px 32px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {STATS.map(({ label, value, sub, color, Icon: SIcon }) => (
                <div key={label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SIcon style={{ color, fontSize: 20 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</div>
                  </div>
                </div>
              ))}
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
