"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import { reelsData } from "./reelsData";
import ReelItem from "./ReelItem";
import { useState, useRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FaArrowUp, FaArrowDown, FaTimes } from "react-icons/fa";

interface ReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReelId?: number;
}

export default function ReelsModal({ isOpen, onClose, initialReelId }: ReelsModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeTimeout = useRef<NodeJS.Timeout>();
  const [showNavButtons, setShowNavButtons] = useState(true);
  const navTimeoutRef = useRef<NodeJS.Timeout>();
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  // Find initial index based on reelId
  useEffect(() => {
    if (initialReelId) {
      const index = reelsData.findIndex(reel => reel.id === initialReelId);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [initialReelId]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    setShowNavButtons(true);
    resetNavTimeout();
  };

  // Fixed event handlers with proper Swiper signatures
  const handleTouchStart = (swiper: SwiperType, event: MouseEvent | TouchEvent | PointerEvent) => {
    if ('touches' in event) {
      touchStartY.current = event.touches[0].clientY;
    }
    setIsSwiping(true);
    isScrollingRef.current = false;
    
    if (swipeTimeout.current) {
      clearTimeout(swipeTimeout.current);
    }
    setShowNavButtons(false);
  };

  const handleTouchMove = (swiper: SwiperType, event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!touchStartY.current || !('touches' in event)) return;
    
    const touchY = event.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    // If movement is significant, mark as scrolling
    if (Math.abs(diff) > 10) {
      isScrollingRef.current = true;
    }
  };

  const handleTouchEnd = (swiper: SwiperType, event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!isScrollingRef.current) {
      // If it was a tap, not a scroll, don't change slide
      setIsSwiping(false);
      setShowNavButtons(true);
      resetNavTimeout();
      return;
    }

    swipeTimeout.current = setTimeout(() => {
      setIsSwiping(false);
      setShowNavButtons(true);
      resetNavTimeout();
    }, 300);
    
    touchStartY.current = 0;
    isScrollingRef.current = false;
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isOpen]);

  useEffect(() => {
    return () => {
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100%',
          maxHeight: '90vh',
          position: 'relative',
          borderRadius: isMobile ? '0' : '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 30,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FaTimes size={20} />
        </button>

        <Swiper
          direction="vertical"
          slidesPerView={1}
          mousewheel={{
            forceToAxis: true,
            sensitivity: 0.2,
            releaseOnEdges: true,
            thresholdDelta: 20,
          }}
          speed={400}
          threshold={15}
          touchRatio={0.3}
          touchAngle={45}
          longSwipesRatio={0.2}
          longSwipesMs={300}
          followFinger={true}
          shortSwipes={true}
          longSwipes={true}
          resistance={true}
          resistanceRatio={0.5}
          freeMode={false} // This is the correct property
          modules={[Mousewheel]}
          style={{ height: "100%" }}
          onSlideChange={handleSlideChange}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          allowTouchMove={!isSwiping}
          initialSlide={activeIndex}
          preventClicks={true}
          preventClicksPropagation={true}
          simulateTouch={true}
          slidesPerGroup={1}
          slideToClickedSlide={false}
          loop={false}
          autoHeight={false}
          watchOverflow={true}
          spaceBetween={0}
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
            top: "20px",
            right: "20px",
            zIndex: 30,
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

        {/* Navigation Buttons */}
        <div
          style={{
            position: "absolute",
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
            zIndex: 30,
            opacity: showNavButtons ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: showNavButtons ? "auto" : "none",
          }}
        >
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
              WebkitTapHighlightColor: "transparent",
            }}
            onTouchStart={(e) => e.preventDefault()}
          >
            {isMobile ? "↑" : <FaArrowUp size={20} />}
          </button>

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
            onTouchStart={(e) => e.preventDefault()}
          >
            {isMobile ? "↓" : <FaArrowDown size={20} />}
          </button>
        </div>

        {/* Desktop keyboard hint */}
        {!isMobile && showNavButtons && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              zIndex: 30,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            ↑ ↓ keys • ESC to close
          </div>
        )}

        {/* Mobile hint */}
        {isMobile && showNavButtons && (
          <div
            style={{
              position: "absolute",
              bottom: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              backdropFilter: "blur(4px)",
              whiteSpace: "nowrap",
            }}
          >
            👆 Swipe or tap buttons • ✕ to close
          </div>
        )}
      </div>
    </div>
  );
}