import React from "react";

const GlowMic = ({ listening = false, size = 64 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: listening
          ? "#2f2f2f"
          : "#2f2f2f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        // perfect shadow matching bootstrap buttons
        boxShadow: listening
          ? "0 0 18px rgba(106, 144, 255, 0.6)"
          : "0 6px 18px rgba(0,0,0,0.16)",

        border: listening
          ? "2px solid rgba(106,144,255,0.65)"
          : "2px solid #3c3c3c",

        transition: "all 0.3s ease-in-out",
      }}
    >
      <i
        className="bi bi-mic-fill"
        style={{
          fontSize: size * 0.45, // icon scale perfect
          color: listening ? "white" : "rgba(180,180,180,0.85)",
          transition: "0.25s ease",
        }}
      ></i>
    </div>
  );
};

export default GlowMic;
