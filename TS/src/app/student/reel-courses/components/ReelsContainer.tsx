"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import { reelsData } from "./reelsData";
import ReelItem from "./ReelItem";
import { useState, useRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function ReelsContainer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeTimeout = useRef<NodeJS.Timeout>();
  const [showNavButtons, setShowNavButtons] = useState(true);
  const navTimeoutRef = useRef<NodeJS.Timeout>();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    setShowNavButtons(true);
    resetNavTimeout();
  };

  const handleTouchStart = () => {
    setIsSwiping(true);
    if (swipeTimeout.current) {
      clearTimeout(swipeTimeout.current);
    }
    setShowNavButtons(false);
  };

  const handleTouchEnd = () => {
    swipeTimeout.current = setTimeout(() => {
      setIsSwiping(false);
      setShowNavButtons(true);
      resetNavTimeout();
    }, 300);
  };

  const resetNavTimeout = () => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
    }
    navTimeoutRef.current = setTimeout(() => {
      setShowNavButtons(false);
    }, 3000);
  };

  const goToNext = () => {
    if (swiperRef.current && activeIndex < reelsData.length - 1) {
      swiperRef.current.slideNext();
    }
  };

  const goToPrev = () => {
    if (swiperRef.current && activeIndex > 0) {
      swiperRef.current.slidePrev();
    }
  };

  // Keyboard navigation (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMobile && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        if (e.key === "ArrowUp") goToPrev();
        if (e.key === "ArrowDown") goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isMobile]);

  useEffect(() => {
    return () => {
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        background: "transparent",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ 
        width: "100%", 
        maxWidth: "430px", 
        position: "relative",
        height: "100%",
      }}>
        <Swiper
          direction="vertical"
          slidesPerView={1}
          mousewheel={!isMobile ? {
            forceToAxis: true,
            sensitivity: 0.3,
            releaseOnEdges: true,
          } : false}
          speed={400}
          threshold={20}
          touchRatio={0.5}
          resistance={true}
          resistanceRatio={0.3}
          modules={[Mousewheel]}
          style={{ height: "100%" }}
          onSlideChange={handleSlideChange}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          allowTouchMove={!isSwiping}
        >
          {reelsData.map((reel, index) => (
            <SwiperSlide key={reel.id}>
              <ReelItem 
                reel={reel} 
                isActive={index === activeIndex}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Progress indicator */}
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "15px",
            zIndex: 10,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "500",
            backdropFilter: "blur(4px)",
          }}
        >
          {activeIndex + 1}/{reelsData.length}
        </div>

        {/* Navigation Buttons - Mobile Optimized */}
        <div
          style={{
            position: "absolute",
            // Different positioning for mobile vs desktop
            ...(isMobile ? {
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              flexDirection: "row",
            } : {
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              flexDirection: "column",
            }),
            display: "flex",
            gap: isMobile ? "30px" : "12px",
            zIndex: 20,
            opacity: showNavButtons ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: showNavButtons ? "auto" : "none",
          }}
        >
          {/* Up/Previous Button */}
          <button
            onClick={goToPrev}
            disabled={activeIndex === 0}
            style={{
              width: isMobile ? "56px" : "44px",
              height: isMobile ? "56px" : "44px",
              borderRadius: "50%",
              background: activeIndex === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
              border: "2px solid rgba(255,255,255,0.3)",
              color: activeIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeIndex === 0 ? "not-allowed" : "pointer",
              backdropFilter: "blur(4px)",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              WebkitTapHighlightColor: "transparent", // Remove tap highlight on mobile
            }}
            onMouseEnter={(e) => {
              if (!isMobile && activeIndex > 0) {
                e.currentTarget.style.background = "rgba(0,0,0,0.9)";
                e.currentTarget.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile && activeIndex > 0) {
                e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            onTouchStart={(e) => {
              // Prevent default to avoid double tap zoom on mobile
              e.preventDefault();
            }}
            title={isMobile ? "Previous" : "Previous Reel (↑)"}
          >
            {isMobile ? "↑" : <FaArrowUp size={20} />}
          </button>

          {/* Down/Next Button */}
          <button
            onClick={goToNext}
            disabled={activeIndex === reelsData.length - 1}
            style={{
              width: isMobile ? "56px" : "44px",
              height: isMobile ? "56px" : "44px",
              borderRadius: "50%",
              background: activeIndex === reelsData.length - 1 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
              border: "2px solid rgba(255,255,255,0.3)",
              color: activeIndex === reelsData.length - 1 ? "rgba(255,255,255,0.3)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: activeIndex === reelsData.length - 1 ? "not-allowed" : "pointer",
              backdropFilter: "blur(4px)",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isMobile && activeIndex < reelsData.length - 1) {
                e.currentTarget.style.background = "rgba(0,0,0,0.9)";
                e.currentTarget.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile && activeIndex < reelsData.length - 1) {
                e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
            }}
            title={isMobile ? "Next" : "Next Reel (↓)"}
          >
            {isMobile ? "↓" : <FaArrowDown size={20} />}
          </button>
        </div>

        {/* Keyboard hint - Only show on desktop */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              zIndex: 15,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              opacity: showNavButtons ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}
          >
            ↑ ↓ keys
          </div>
        )}

        {/* Mobile swipe hint */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 15,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
              opacity: showNavButtons ? 0.8 : 0,
              transition: "opacity 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            👆 Swipe up/down or tap buttons
          </div>
        )}
      </div>
    </div>
  );
}