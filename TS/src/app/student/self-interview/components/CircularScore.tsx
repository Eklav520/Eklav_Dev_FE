import React from "react";

interface Props {
  score: number; // example: 8 -> 80%
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const CircularScore: React.FC<Props> = ({
  score,
  size = 70,
  strokeWidth = 6,
  label = "AI Score",
}) => {
  const percentage = Math.min(Math.max(score * 10, 0), 100); // 8 → 80%
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="text-center">
      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        {/* Background ring */}
        <circle
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Animated foreground progress ring */}
        <circle
          stroke="#7A3CFF"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.6s ease",
          }}
        />

        {/* Center icon */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fill="#7A3CFF"
        >
          👤
        </text>
      </svg>

      {/* Score text */}
      <div style={{ marginTop: "6px", fontWeight: 600, fontSize: "16px" }}>
        {percentage}%
      </div>
      <small className="text-muted">{label}</small>
    </div>
  );
};

export default CircularScore;
