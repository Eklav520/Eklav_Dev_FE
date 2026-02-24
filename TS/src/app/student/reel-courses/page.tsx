"use client";

import { useState } from "react";
import ReelsModal from "./components/ReelsModal";
import { FaPlay } from "react-icons/fa";

export default function HomePage() {
  const [isReelsOpen, setIsReelsOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<number>();
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Open reels with specific reel
  const openReels = (reelId?: number, topic?: string) => {
    setSelectedReelId(reelId);
    setSelectedTopic(topic || "");
    setIsReelsOpen(true);
  };

  const reelsCategories = [
    {
      id: 1,
      title: "React Reels",
      topic: "react",
      description: "Learn React in short, engaging videos",
      color: "#61DAFB",
      bgColor: "rgba(97, 218, 251, 0.1)",
      icon: "⚛️",
      reelCount: 2,
    },
    {
      id: 2,
      title: "JAVA Reels",
      topic: "java",
      description: "Master Java programming fundamentals",
      color: "#f89820",
      bgColor: "rgba(248, 152, 32, 0.1)",
      icon: "☕",
      reelCount: 2,
    },
    {
      id: 3,
      title: "JavaScript Reels",
      topic: "javascript",
      description: "Modern JavaScript tips and tricks",
      color: "#F7DF1E",
      bgColor: "rgba(247, 223, 30, 0.1)",
      icon: "🟨",
      reelCount: 0,
    },
    {
      id: 4,
      title: "Python Reels",
      topic: "python",
      description: "Python for beginners to pro",
      color: "#3776AB",
      bgColor: "rgba(55, 118, 171, 0.1)",
      icon: "🐍",
      reelCount: 0,
    },
  ];

return (
  <div
    style={{
      minHeight: "100vh",
      background: "#f9fafb",
      padding: "0",
      fontFamily: "Inter, sans-serif",
    }}
  >
    {/* 🔥 HERO SECTION */}
  {/* 🔥 COMPACT HERO SECTION */}
<div
  style={{
    background: "linear-gradient(135deg, #ff6b00, #ff8c42)",
    padding: "10px 5px", // reduced from 60px
    color: "#fff",
  }}
>
  <div
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}
  >
    <h1
      style={{
        fontSize: "28px", // reduced from 36px
        fontWeight: 700,
        marginBottom: "8px",
      }}
    >
      Learn Faster with Short Reels
    </h1>

    <p
      style={{
        fontSize: "16px",
        opacity: 0.9,
        maxWidth: "600px",
        margin: 0,
      }}
    >
      Master development concepts in bite-sized videos.
      Start learning instantly.
    </p>
  </div>
</div>

    {/* 📚 CATEGORY SECTION */}
   <div style={{ padding: "40px 24px 60px" }}>
     
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "28px",
        }}
      >
        {reelsCategories.map((category) => (
          <div
            key={category.id}
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              border: "1px solid #f1f1f1",
              transition: "all 0.25s ease",
              cursor: category.reelCount > 0 ? "pointer" : "default",
              opacity: category.reelCount > 0 ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (category.reelCount > 0) {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 16px 32px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(0,0,0,0.06)";
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "rgba(255,107,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                }}
              >
                {category.icon}
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    margin: 0,
                    color: "#111",
                  }}
                >
                  {category.title}
                </h3>

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color:
                      category.reelCount > 0 ? "#ff6b00" : "#999",
                  }}
                >
                  {category.reelCount > 0
                    ? `${category.reelCount} Reels Available`
                    : "Coming Soon"}
                </span>
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: "15px",
                color: "#555",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              {category.description}
            </p>

            {/* CTA Button */}
            {category.reelCount > 0 ? (
              <button
                onClick={() =>
                  openReels(category.id, category.topic)
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#ff6b00",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e65c00";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ff6b00";
                }}
              >
                <FaPlay size={14} />
                Watch Now
              </button>
            ) : (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#f1f1f1",
                  color: "#aaa",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "not-allowed",
                }}
              >
                Not Available
              </button>
            )}
          </div>
        ))}
      </div>
    </div>

    <ReelsModal
      isOpen={isReelsOpen}
      onClose={() => setIsReelsOpen(false)}
      initialReelId={selectedReelId}
    />
  </div>
);
}