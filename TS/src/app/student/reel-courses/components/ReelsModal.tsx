"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import ReelItem from "./ReelItem";
import { useState, useRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FaArrowUp, FaArrowDown, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";

interface ReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId?: string;
}

interface ReelData {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
}

export default function ReelsModal({
  isOpen,
  onClose,
  sectionId,
}: ReelsModalProps) {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [reels, setReels] = useState<ReelData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const swiperRef = useRef<SwiperType>();

  const [isMobile, setIsMobile] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  /* ================= FETCH REELS ================= */
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${baseURL}/api/studentSideReels/${sectionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setReels(res.data.reels || []);
        setActiveIndex(0);
        setSelectedIndex(null);
      } catch (err) {
        console.error("Failed to fetch reels", err);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId && token && isOpen) {
      fetchReels();
    }
  }, [sectionId, token, isOpen]);

  /* ================= DEVICE CHECK ================= */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ================= BODY SCROLL LOCK ================= */
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    setIsVideoPlaying(true); // new slide always auto-plays
  };

  const handleSelectReel = (index: number) => {
    setActiveIndex(index);
    setSelectedIndex(index);
  };

  const backToList = () => {
    setSelectedIndex(null);
  };

  const goToNext = () => {
    if (swiperRef.current && activeIndex < reels.length - 1) {
      swiperRef.current.slideNext();
    }
  };

  const goToPrev = () => {
    if (swiperRef.current && activeIndex > 0) {
      swiperRef.current.slidePrev();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        zIndex: 9999,
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          height: isMobile ? "100%" : "95vh",
          position: "relative",
          borderRadius: isMobile ? "0" : "12px",
          overflow: "hidden",
        }}
      >
        {/* CLOSE — only shown in player view; list view has its own inline X */}
        {selectedIndex !== null && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 30,
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaTimes size={12} />
          </button>
        )}

        {selectedIndex === null ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#000",
            }}
          >
            {/* Header — X on left, title+count on right in same row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px 10px 10px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              {/* X button inline (replaces the absolute one for list view) */}
              <button
                onClick={onClose}
                style={{
                  flexShrink: 0,
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FaTimes size={13} />
              </button>

              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                  Reels
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {reels.length} video{reels.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="reels-grid-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <style>{`
                .reels-grid-scroll::-webkit-scrollbar { display: none; }
                .reels-grid-scroll { scrollbar-width: none; -ms-overflow-style: none; }
                @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
              `}</style>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: "3px solid rgba(255,107,0,0.2)",
                      borderTop: "3px solid #ff6b00",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                </div>
              ) : reels.length === 0 ? (
                <div
                  style={{
                    color: "#555",
                    textAlign: "center",
                    paddingTop: "60px",
                    fontSize: "14px",
                  }}
                >
                  No videos found in this course.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                  }}
                >
                  {reels.map((reel, index) => (
                    <button
                      key={reel._id}
                      onClick={() => handleSelectReel(index)}
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        cursor: "pointer",
                        position: "relative",
                        aspectRatio: "9/16",
                        overflow: "hidden",
                        display: "block",
                        width: "100%",
                      }}
                    >
                      {/* Thumbnail – video poster or gradient fallback */}
                      <video
                        src={reel.videoUrl}
                        preload="metadata"
                        muted
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          background: "#111",
                        }}
                      />

                      {/* Dark overlay on hover feel */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%)",
                        }}
                      />

                      {/* Play icon top-right (Instagram Reels marker) */}
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 7,
                          color: "#fff",
                          fontSize: 13,
                          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
                        }}
                      >
                        ▶
                      </div>

                      {/* Title at bottom */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "4px 6px",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "left",
                          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                        }}
                      >
                        {reel.title || `Reel ${index + 1}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* TOP BAR — X button (absolute) + ← List + progress in one 46px row */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 46,
                display: "flex",
                alignItems: "center",
                paddingLeft: 46,   // leave room for the X button
                paddingRight: 10,
                gap: 8,
                zIndex: 30,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
              }}
            >
              <button
                onClick={backToList}
                style={{
                  height: "28px",
                  borderRadius: "14px",
                  background: "rgba(0,0,0,0.5)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  padding: "0 10px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ← List
              </button>

              <div style={{ flex: 1 }} />

              {/* PROGRESS */}
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                }}
              >
                {reels.length > 0 ? `${activeIndex + 1}/${reels.length}` : "0/0"}
              </div>
            </div>

            {/* VIDEO AREA — starts exactly below the top bar */}
            <div
              style={{
                position: "absolute",
                top: 46, bottom: 0, left: 0, right: 0,
              }}
            >
              <Swiper
                direction="vertical"
                slidesPerView={1}
                initialSlide={activeIndex}
                mousewheel={{ forceToAxis: true }}
                modules={[Mousewheel]}
                style={{ height: "100%" }}
                onSlideChange={handleSlideChange}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
              >
                {reels.map((reel, index) => (
                  <SwiperSlide key={reel._id}>
                    <ReelItem
                      reel={reel}
                      isActive={index === activeIndex}
                      onPlayStateChange={index === activeIndex ? setIsVideoPlaying : undefined}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* NAVIGATION — inside video area, hidden while playing */}
              <div
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  zIndex: 30,
                  opacity: isVideoPlaying ? 0 : 1,
                  pointerEvents: isVideoPlaying ? "none" : "auto",
                  transition: "opacity 0.25s ease",
                }}
              >
                <button
                  onClick={goToPrev}
                  disabled={activeIndex === 0}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: activeIndex === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.65)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaArrowUp size={14} />
                </button>

                <button
                  onClick={goToNext}
                  disabled={activeIndex === reels.length - 1}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: activeIndex === reels.length - 1 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.65)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaArrowDown size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}