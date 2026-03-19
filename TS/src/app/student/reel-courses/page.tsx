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
  const [loading, setLoading] = useState(true);

  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<any[]>([]);

  // Orange palette
  const orange = {
    primary: "#ff6b00",
    bg: "rgba(255, 107, 0, 0.2)",
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${baseURL}/api/studentSideReels/sections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSections(res.data.sections || []);
      } catch (err) {
        console.error("Failed to fetch sections", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSections();
  }, [token]);

  /* ================= CATEGORIES ================= */
  const categories = [
    "All",
    ...sections
      .filter((s) => s.reelCount > 0)
      .map((s) => s.courseName),
  ];

  /* ================= FILTER ================= */
  const filteredSections =
    activeCategory === "All"
      ? sections
      : sections.filter(
          (s) => s.courseName === activeCategory
        );

  /* ================= OPEN ================= */
  const openReels = (id?: string) => {
    setSelectedReelId(id);
    setIsReelsOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "20px 16px 8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
          Courses
        </h1>
      </div>

      {/* CATEGORY */}
      <div
        style={{
          padding: "12px 16px",
          overflowX: "auto",
          borderBottom: "1px solid #333",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border:
                  activeCategory === cat
                    ? "none"
                    : "1px solid #333",
                background:
                  activeCategory === cat
                    ? orange.primary
                    : "#1a1a1a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div style={{ padding: "16px" }}>
        {loading ? (
          /* 🔥 ORANGE SPINNER */
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "5px solid rgba(255, 107, 0, 0.2)",
                borderTop: "5px solid #ff6b00",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : filteredSections.length === 0 ? (
          /* EMPTY STATE */
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#aaa",
            }}
          >
            No reels available
          </div>
        ) : (
          /* GRID */
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
                  border: "1px solid #333",
                  cursor:
                    section.reelCount > 0
                      ? "pointer"
                      : "default",
                  opacity:
                    section.reelCount > 0 ? 1 : 0.5,
                }}
                onClick={() =>
                  section.reelCount > 0 &&
                  openReels(section._id)
                }
              >
                {/* PREVIEW */}
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
                      top: 10,
                      left: 10,
                      background: orange.primary,
                      padding: "4px 10px",
                      borderRadius: "16px",
                      fontSize: "10px",
                    }}
                  >
                    {section.reelCount} Reels
                  </span>

                  <span style={{ fontSize: "42px" }}>🎬</span>

                  {section.reelCount === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div style={{ padding: "14px" }}>
                  <div style={{ fontWeight: 600 }}>
                    {section.courseName}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                    }}
                  >
                    {section.shortDescription}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
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

                    <FaBookmark size={12} color="#888" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <ReelsModal
        isOpen={isReelsOpen}
        onClose={() => setIsReelsOpen(false)}
        sectionId={selectedReelId}
      />

      {/* 🔥 SPINNER ANIMATION */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}