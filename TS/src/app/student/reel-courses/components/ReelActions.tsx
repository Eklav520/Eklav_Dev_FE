"use client";

import { useState } from "react";
import { 
  FaHeart, 
  FaRegHeart, 
  FaCommentDots, 
  FaShare, 
  FaEllipsisH,
  FaVolumeUp,
  FaVolumeMute
} from "react-icons/fa";

interface ReelActionsProps {
  reelId: number;
  initialLikes: number;
  comments: number;
  shares: number;
  isMuted: boolean;
  onMuteToggle: (e: React.MouseEvent) => void;
}

const ReelActions = ({ 
  reelId, 
  initialLikes, 
  comments, 
  shares, 
  isMuted,
  onMuteToggle 
}: ReelActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Open comments for reel:", reelId);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Share reel:", reelId);
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("More options for reel:", reelId);
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 120,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "#fff",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      {/* Like */}
      <div style={{ textAlign: "center" }}>
        <div 
          onClick={handleLike} 
          style={{ 
            cursor: "pointer", 
            marginBottom: 4,
            transform: liked ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        >
          {liked ? 
            <FaHeart size={32} color="#ff3040" /> : 
            <FaRegHeart size={32} />
          }
        </div>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)"
        }}>
          {likesCount}
        </span>
      </div>

      {/* Comment */}
      <div style={{ textAlign: "center" }}>
        <FaCommentDots 
          size={30} 
          style={{ 
            cursor: "pointer", 
            marginBottom: 4,
            transition: "transform 0.2s ease",
          }}
          onClick={handleComment}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
        <span style={{ 
          fontSize: 13, 
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)"
        }}>
          {comments}
        </span>
      </div>

      {/* Share */}
      <div style={{ textAlign: "center" }}>
        <FaShare 
          size={26} 
          style={{ 
            cursor: "pointer", 
            marginBottom: 4,
            transition: "transform 0.2s ease",
          }}
          onClick={handleShare}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
        <span style={{ 
          fontSize: 13, 
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)"
        }}>
          {shares}
        </span>
      </div>

      {/* More Options */}
      <div style={{ textAlign: "center" }}>
        <FaEllipsisH 
          size={20} 
          style={{ 
            cursor: "pointer",
            marginBottom: 4,
            transition: "transform 0.2s ease",
          }}
          onClick={handleMore}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>

      {/* Mute/Unmute */}
      <div 
        style={{ 
          marginTop: 20,
          padding: 10,
          background: "rgba(0,0,0,0.5)",
          borderRadius: "50%",
          cursor: "pointer",
          transition: "all 0.2s ease",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
        onClick={onMuteToggle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.7)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.5)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
      </div>
    </div>
  );
};

export default ReelActions;