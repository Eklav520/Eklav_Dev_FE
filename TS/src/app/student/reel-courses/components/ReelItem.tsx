"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReelOverlay from "./ReelOverlay";
import ReelActions from "./ReelActions";
import { useAuthContext } from "@/context/useAuthContext";

interface ReelItemProps {
  reel: {
    _id: string;
    title: string;
    videoUrl: string;
    description?: string;
    stats?: {
      likes?: number;
    };
    commentsCount?: number;
  };
  isActive: boolean;
}

interface Profile {
  fullName: string;
  profileImage?: string;
}

const ReelItem = ({ reel, isActive }: ReelItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${baseURL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
      } catch (error) {
        console.error("Profile fetch failed");
      }
    };

    fetchProfile();
  }, [token]);

  /* ================= AUTO PLAY ================= */
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();

    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        backgroundColor: "#000",
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
        playsInline
        preload="metadata"
        style={{
          height: "100%",
          width: "100%",
          objectFit: "cover",
        }}
      />

      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />

      <ReelOverlay
        username={profile?.fullName || "User"}
        userAvatar={profile?.profileImage || ""}
        description={reel.description || reel.title}
        music="Original Audio"
      />

      <ReelActions
        reelId={reel._id}
        initialLikes={reel.stats?.likes || 0}
        comments={reel.commentsCount || 0}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
        token={token}
        baseURL={baseURL}
      />

      {!isPlaying && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color: "#fff",
          }}
        >
          ▶
        </div>
      )}
    </div>
  );
};

export default ReelItem;