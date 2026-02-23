import React from "react";
import roboImage from "@/assets/data/robo.jpeg";

interface RoboAvatarProps {
  isTyping: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

const RoboAvatar: React.FC<RoboAvatarProps> = ({
  isTyping,
  isListening,
  isSpeaking,
}) => {
  return (
    <div className="robo-wrapper">
      <div
        className={`robot-container 
          ${isSpeaking ? "speaking" : ""} 
          ${isListening ? "listening" : ""} 
          ${isTyping ? "thinking" : ""}`}
      >
        <img
          src={roboImage}
          alt="AI Assistant"
          className="robot-image"
        />
      </div>

      <div className="robo-status">
        {isSpeaking && "Speaking..."}
        {isTyping && "Thinking..."}
        {isListening && "Listening..."}
        {!isTyping && !isListening && !isSpeaking && "Ready"}
      </div>

      <style>{`
        .robo-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #121212, #0a0a0a);
          border-radius: 16px;
          color: #fff;
        }

        .robot-container {
          position: relative;
        }

        .robot-image {
          width: 380px;
          animation: breathe 4s ease-in-out infinite;
          transition: transform 0.2s ease;
        }

        /* ===== Idle Breathing ===== */
        @keyframes breathe {
          0%,100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }

        /* ===== Speaking (REAL visible bounce) ===== */
        .robot-container.speaking .robot-image {
          animation: speakMotion 0.45s infinite alternate;
        }

        @keyframes speakMotion {
          from { transform: translateY(0px); }
          to { transform: translateY(-15px); }
        }

        /* ===== Listening ===== */
        .robot-container.listening .robot-image {
          animation: listeningPulse 1s infinite alternate;
          filter: drop-shadow(0 0 25px rgba(76, 175, 80, 0.8));
        }

        @keyframes listeningPulse {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }

        /* ===== Thinking ===== */
        .robot-container.thinking .robot-image {
          animation: thinkingGlow 1.2s infinite;
          filter: drop-shadow(0 0 30px rgba(0, 198, 255, 0.9));
        }

        @keyframes thinkingGlow {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }

        .robo-status {
          margin-top: 20px;
          font-size: 1rem;
          opacity: 0.85;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
};

export default RoboAvatar;