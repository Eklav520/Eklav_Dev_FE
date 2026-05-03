"use client";

import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

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
  isMuted,
  onMuteToggle,
}: ReelActionsProps) => {
  return (
    <div
      style={{
        position: "absolute",
        right: 10,
        bottom: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#fff",
        zIndex: 10,
      }}
    >
      {/* Mute */}
      <div
        style={{
          padding: 8,
          background: "rgba(0,0,0,0.45)",
          borderRadius: "50%",
          cursor: "pointer",
        }}
        onClick={onMuteToggle}
      >
        {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
      </div>
    </div>
  );
};

export default ReelActions;