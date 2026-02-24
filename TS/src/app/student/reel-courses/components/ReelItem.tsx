"use client";

import { useEffect, useRef, useState } from "react";
import ReelOverlay from "./ReelOverlay";
import ReelActions from "./ReelActions";

interface ReelItemProps {
  reel: {
    id: number;
    topicId: number;
    title: string;
    videoUrl: string;
    likes: number;
    comments?: number;
    shares?: number;
    username?: string;
    userAvatar?: string;
    description?: string;
    music?: string;
  };
  isActive: boolean;
}

const ReelItem = ({ reel, isActive }: ReelItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(error => {
          console.log("Auto-play prevented:", error);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const username = reel.username || `user_${reel.id}`;
  const userAvatar = reel.userAvatar || `https://i.pravatar.cc/150?u=${reel.id}`;
  const description = reel.description || reel.title;
  const music = reel.music || "Original Audio";
  const comments = reel.comments || Math.floor(Math.random() * 50);
  const shares = reel.shares || Math.floor(Math.random() * 30);

  return (
    <div 
      style={{ 
        position: "relative", 
        height: "100%", 
        width: "100%",
        backgroundColor: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        muted={isMuted}
        playsInline
        style={{
          height: "100%",
          width: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />

      <ReelOverlay
        username={username}
        userAvatar={userAvatar}
        description={description}
        music={music}
      />

      <ReelActions
        reelId={reel.id}
        initialLikes={reel.likes}
        comments={comments}
        shares={shares}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
      />

      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "24px",
            zIndex: 20,
          }}
        >
          ▶
        </div>
      )}
    </div>
  );
};

export default ReelItem;