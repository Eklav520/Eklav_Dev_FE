"use client";

import { useState } from "react";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaEllipsisH,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import CommentsDrawer from "./CommentsDrawer";

interface ReelActionsProps {
  reelId: string;
  initialLikes: number;
  comments: number;
  isMuted: boolean;
  onMuteToggle: (e: React.MouseEvent) => void;
  token?: string;
  baseURL: string;
}

const ReelActions = ({
  reelId,
  initialLikes,
  comments,
  isMuted,
  onMuteToggle,
  token,
  baseURL,
}: ReelActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await axios.patch(
        `${baseURL}/api/studentSideReels/${reelId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLiked(res.data.liked);
      setLikesCount(res.data.likes);
    } catch (err) {
      console.error("Like failed");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        bottom: 110,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        alignItems: "center",
        color: "#fff",
        zIndex: 10,
      }}
    >
      {/* Like */}
      <div style={{ textAlign: "center" }}>
        <div onClick={handleLike} style={{ cursor: "pointer" }}>
          {liked ? (
            <FaHeart size={26} color="#ff3040" />
          ) : (
            <FaRegHeart size={26} />
          )}
        </div>
        <span style={{ fontSize: 12, opacity: 0.9 }}>
          {likesCount}
        </span>
      </div>

      {/* Comment */}
      <div style={{ textAlign: "center" }}>
        <FaCommentDots
          size={24}
          style={{ cursor: "pointer" }}
          onClick={() => setIsCommentsOpen(true)}
        />
      </div>

      {/* More */}
      <FaEllipsisH
        size={18}
        style={{ cursor: "pointer", opacity: 0.8 }}
      />

      {/* Mute */}
      <div
        style={{
          marginTop: 16,
          padding: 8,
          background: "rgba(0,0,0,0.45)",
          borderRadius: "50%",
          cursor: "pointer",
        }}
        onClick={onMuteToggle}
      >
        {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
      </div>
      <CommentsDrawer
        reelId={reelId}
        token={token}
        baseURL={baseURL}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />
    </div>
  );
};

export default ReelActions;