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

export default function ReelsModal({
  isOpen,
  onClose,
  sectionId,
}: ReelsModalProps) {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();

  const [isMobile, setIsMobile] = useState(false);

  /* ================= FETCH REELS ================= */
  useEffect(() => {
    const fetchReels = async () => {
      try {
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
      } catch (err) {
        console.error("Failed to fetch reels", err);
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

        <Swiper
          direction="vertical"
          slidesPerView={1}
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
          {reels.length > 0
            ? `${activeIndex + 1}/${reels.length}`
            : "0/0"}
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
                activeIndex === 0
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(0,0,0,0.7)",
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
      </div>
    </div>
  );
}