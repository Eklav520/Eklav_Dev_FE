"use client";

import { useEffect, useState } from "react";
import ReelsModal from "./components/ReelsModal";
import { FaBookmark } from "react-icons/fa";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";

export default function HomePage() {
  const [isReelsOpen, setIsReelsOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string>();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<any[]>([]);

  // Orange color palette
  const orange = {
    primary: "#ff6b00",
    light: "#ff8c42",
    dark: "#e65c00",
    bg: "rgba(255, 107, 0, 0.2)",
    lightBg: "rgba(255, 107, 0, 0.1)",
  };

  /* ================= FETCH SECTIONS ================= */
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/api/studentSideReels/sections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSections(res.data.sections);
      } catch (err) {
        console.error("Failed to fetch sections", err);
      }
    };

    if (token) fetchSections();
  }, [token]);

  /* ================= DYNAMIC CATEGORIES ================= */
  const categories = [
    "All",
    ...sections
      .filter((section) => section.reelCount > 0)
      .map((section) => `${section.courseName}`),
  ];

  /* ================= FILTERED SECTIONS ================= */
  const filteredSections =
    activeCategory === "All"
      ? sections
      : sections.filter(
          (section) =>
            `${section.courseName}` === activeCategory
        );

  /* ================= OPEN REELS ================= */
  const openReels = (reelId?: string) => {
    setSelectedReelId(reelId);
    setIsReelsOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#ffffff",
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "20px 16px 8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          Courses
        </h1>
      </div>

      {/* CATEGORY CHIPS */}
      <div
        style={{
          padding: "12px 16px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          background: "#000000",
          borderBottom: "1px solid #333333",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border:
                  activeCategory === category
                    ? "none"
                    : "1px solid #333333",
                background:
                  activeCategory === category
                    ? orange.primary
                    : "#1a1a1a",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow:
                  activeCategory === category
                    ? `0 2px 8px ${orange.primary}80`
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== category) {
                  e.currentTarget.style.background = orange.bg;
                  e.currentTarget.style.borderColor = orange.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== category) {
                  e.currentTarget.style.background = "#1a1a1a";
                  e.currentTarget.style.borderColor = "#333333";
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* COURSES GRID */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {filteredSections.map((section) => (
            <div
              key={section._id}
              style={{
                background: "#1a1a1a",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #333333",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                cursor:
                  section.reelCount > 0 ? "pointer" : "default",
                opacity:
                  section.reelCount > 0 ? 1 : 0.5,
                transition: "0.2s",
              }}
              onClick={() =>
                section.reelCount > 0 &&
                openReels(section._id)
              }
            >
              {/* Preview */}
              <div
                style={{
                  height: "140px",
                  background: `linear-gradient(135deg, ${orange.primary}40, ${orange.primary}20)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: orange.primary,
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {section.reelCount} Reels
                </span>

                <span style={{ fontSize: "42px" }}>
                  🎬
                </span>

                {section.reelCount === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Coming Soon
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "14px" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  {section.courseName}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#aaaaaa",
                    marginBottom: "10px",
                  }}
                >
                  {section.shortDescription}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: section.isActive
                        ? "#00ff88"
                        : "#ff4d4f",
                    }}
                  >
                    {section.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <FaBookmark size={12} color="#888888" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ReelsModal
        isOpen={isReelsOpen}
        onClose={() => setIsReelsOpen(false)}
        sectionId={selectedReelId}
      />
    </div>
  );
}