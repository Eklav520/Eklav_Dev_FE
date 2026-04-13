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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          height: "100%",
          maxHeight: "90vh",
          position: "relative",
          borderRadius: isMobile ? "0" : "12px",
          overflow: "hidden",
        }}
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 30,
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: "2px solid rgba(255,255,255,0.3)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaTimes size={20} />
        </button>

        {selectedIndex === null ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#000",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "62px 16px 14px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                Reels
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                {reels.length} video{reels.length !== 1 ? "s" : ""}
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
            <button
              onClick={backToList}
              style={{
                position: "absolute",
                top: "20px",
                left: "70px",
                zIndex: 30,
                height: "40px",
                borderRadius: "20px",
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "0 14px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Back to list
            </button>

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
                  <ReelItem reel={reel} isActive={index === activeIndex} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* PROGRESS */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                zIndex: 30,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              {reels.length > 0 ? `${activeIndex + 1}/${reels.length}` : "0/0"}
            </div>

            {/* NAVIGATION */}
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                zIndex: 30,
              }}
            >
              <button
                onClick={goToPrev}
                disabled={activeIndex === 0}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background:
                    activeIndex === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaArrowUp />
              </button>

              <button
                onClick={goToNext}
                disabled={activeIndex === reels.length - 1}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background:
                    activeIndex === reels.length - 1
                      ? "rgba(0,0,0,0.3)"
                      : "rgba(0,0,0,0.7)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaArrowDown />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}