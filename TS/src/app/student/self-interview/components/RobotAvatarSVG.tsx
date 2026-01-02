import React from "react";
import "./RobotAvatar.css";

interface Props {
  size?: number;
  status: "idle" | "speaking" | "listening" | "processing";
}

export default function RobotAvatarSVG({ size = 160, status }: Props) {
  return (
    <div
      className={`robot-wrapper robot-${status}`}
      style={{ width: size, height: size }}
    >
      {/* Glow Circle */}
      <div className="robot-glow"></div>

      {/* SVG Robot */}
      <svg
        className="robot-svg"
        viewBox="0 0 200 240"
        style={{ width: size, height: size }}
      >
        {/* Head */}
        <g className="robot-head">
          <rect x="40" y="10" width="120" height="90" rx="20" fill="#111" />

          {/* Eyes */}
          <g className="eyes">
            <circle cx="80" cy="50" r="8" className="eye eye-left" />
            <circle cx="120" cy="50" r="8" className="eye eye-right" />
          </g>

          {/* Mouth (changes by status) */}
          <g className="mouth-group">
            {status === "speaking" ? (
              <rect
                className="mouth-talking"
                x="90"
                y="70"
                width="20"
                height="16"
                rx="4"
              />
            ) : status === "listening" ? (
              <circle cx="100" cy="78" r="10" className="mouth-listening" />
            ) : status === "processing" ? (
              <rect
                x="80"
                y="75"
                width="40"
                height="8"
                rx="4"
                className="mouth-processing"
              />
            ) : (
              <path
                className="mouth-smile"
                d="M80 75 Q100 95 120 75"
                strokeWidth="5"
                fill="none"
              />
            )}
          </g>
        </g>

        {/* Body */}
        <g className="robot-body">
          <rect x="70" y="110" width="60" height="70" rx="20" fill="#fff" />
          <circle cx="100" cy="145" r="15" className="chest-light" />
        </g>

        {/* Left Arm */}
        <g className="robot-arm left-arm">
          <rect x="40" y="110" width="20" height="60" rx="10" fill="#fff" />
          <circle cx="50" cy="175" r="12" fill="#ddd" />
        </g>

        {/* Right Arm (waves during speaking) */}
        <g className="robot-arm right-arm">
          <rect x="140" y="110" width="20" height="60" rx="10" fill="#fff" />
          <circle cx="150" cy="175" r="12" fill="#ddd" />
        </g>
      </svg>

      {/* Status Text */}
      <div className="robot-status-text">
        {status === "speaking"
          ? "AI Speaking..."
          : status === "listening"
          ? "Listening..."
          : status === "processing"
          ? "Processing..."
          : "Ready"}
      </div>
    </div>
  );
}
