import React, { useEffect, useState, useRef } from "react";

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
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0]);
  const [bodyPosition, setBodyPosition] = useState({ x: 0, y: 0, rotate: 0 });
  const [step, setStep] = useState(0);
  const animationRef = useRef<number>();

  // Complex body movement system
  useEffect(() => {
    let startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      
      if (isSpeaking) {
        // Speaking: Animated gesturing, slight bouncing, head nodding
        setBodyPosition({
          x: Math.sin(elapsed * 3) * 2, // Reduced movement
          y: Math.sin(elapsed * 6) * 1.5, // Reduced bouncing
          rotate: Math.sin(elapsed * 2) * 1.5, // Reduced rotation
        });
        setStep(prev => (prev + 0.1) % (Math.PI * 2));
      } 
      else if (isListening) {
        // Listening: Leaning forward slightly, head tilted, still
        setBodyPosition({
          x: Math.sin(elapsed * 0.5) * 0.5, // Reduced sway
          y: 1, // Reduced lean
          rotate: 2, // Reduced tilt
        });
        setStep(prev => (prev + 0.02) % (Math.PI * 2));
      } 
      else if (isTyping) {
        // Typing: Small rapid movements, focused stance
        setBodyPosition({
          x: Math.sin(elapsed * 8) * 0.5, // Reduced movement
          y: Math.sin(elapsed * 4) * 0.5,
          rotate: Math.sin(elapsed * 10) * 0.3,
        });
        setStep(prev => (prev + 0.3) % (Math.PI * 2));
      } 
      else {
        // Idle: Gentle breathing motion
        setBodyPosition({
          x: 0,
          y: Math.sin(elapsed * 2) * 1.5, // Reduced breathing
          rotate: 0,
        });
        setStep(prev => (prev + 0.05) % (Math.PI * 2));
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking, isListening, isTyping]);

  // Audio levels for speaking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevels(
          Array.from({ length: 5 }, () => Math.random() * 80 + 20)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevels([0, 0, 0, 0, 0]);
    }
  }, [isSpeaking]);

  // Calculate arm positions based on state
  const getArmTransform = (side: 'left' | 'right') => {
    const direction = side === 'left' ? -1 : 1;
    
    if (isSpeaking) {
      // Speaking: Gesturing arms
      const gestureAmount = Math.sin(step * 2) * 20; // Reduced movement
      return {
        shoulder: direction * 10 + gestureAmount * direction,
        elbow: 15 + Math.sin(step * 3) * 10, // Reduced
        hand: Math.sin(step * 4) * 5, // Reduced
      };
    }
    else if (isListening) {
      // Listening: Arms slightly forward, palms up (receiving position)
      return {
        shoulder: direction * 8,
        elbow: 35, // Reduced
        hand: 10, // Reduced
      };
    }
    else if (isTyping) {
      // Typing: Arms bent, hands down (typing position)
      return {
        shoulder: direction * 15,
        elbow: 55 + Math.sin(step * 10) * 3, // Reduced
        hand: 20 + Math.sin(step * 15) * 3, // Reduced
      };
    }
    else {
      // Idle: Arms relaxed at sides
      return {
        shoulder: direction * 3,
        elbow: 3,
        hand: 0,
      };
    }
  };

  // Calculate leg positions for walking/bouncing
  const getLegTransform = (side: 'left' | 'right') => {
    const direction = side === 'left' ? -1 : 1;
    const phase = side === 'left' ? 0 : Math.PI;
    
    if (isSpeaking) {
      // Speaking: Slight bouncing/stepping in place
      const bounce = Math.sin(step * 2 + phase) * 3; // Reduced
      return {
        hip: bounce,
        knee: 3 + Math.abs(bounce) * 0.5, // Reduced
        ankle: bounce * 0.3,
      };
    }
    else if (isListening) {
      // Listening: Solid stance, slight weight shift
      const weightShift = Math.sin(step * 0.5 + phase) * 2; // Reduced
      return {
        hip: weightShift,
        knee: 1,
        ankle: weightShift * 0.2,
      };
    }
    else if (isTyping) {
      // Typing: Still but tense
      return {
        hip: 0,
        knee: 1,
        ankle: Math.sin(step * 8) * 0.5, // Reduced
      };
    }
    else {
      // Idle: Gentle sway
      return {
        hip: Math.sin(step * 0.5 + phase) * 1, // Reduced
        knee: 0,
        ankle: Math.sin(step * 0.5 + phase) * 0.5, // Reduced
      };
    }
  };

  const leftArm = getArmTransform('left');
  const rightArm = getArmTransform('right');
  const leftLeg = getLegTransform('left');
  const rightLeg = getLegTransform('right');

  return (
    <div className="robo-avatar-container">
      {/* Main Robot with Full Body Movement - COMPACT VERSION */}
      <div 
        className="robot compact"
        style={{
          transform: `translate(${bodyPosition.x}px, ${bodyPosition.y}px) rotate(${bodyPosition.rotate}deg)`,
        }}
      >
        {/* Head with Independent Movement - SMALLER */}
        <div 
          className="robot-head"
          style={{
            transform: `rotate(${isListening ? 3 : isSpeaking ? Math.sin(step * 4) * 1 : 0}deg)`,
          }}
        >
          <div className="antenna">
            <div className={`antenna-ball ${isListening ? "active-listening" : ""} ${isSpeaking ? "active-speaking" : ""} ${isTyping ? "active-thinking" : ""}`} />
            <div className="antenna-rod" />
          </div>
          
          {/* Face Plate - SMALLER */}
          <div className="face-plate">
            {/* Eyes with movement - SMALLER */}
            <div className="eyes">
              <div className="eye left">
                <div className={`eye-lid ${isTyping ? "thinking-blink" : ""}`} />
                <div 
                  className={`pupil ${isSpeaking ? "speaking-pupil" : ""} ${isListening ? "listening-pupil" : ""}`}
                  style={{
                    transform: `translate(${isListening ? Math.sin(step * 2) * 2 : 0}px, ${isListening ? Math.cos(step * 2) * 1 : 0}px)`,
                  }}
                >
                  <div className="eye-glow" />
                </div>
              </div>
              <div className="eye right">
                <div className={`eye-lid ${isTyping ? "thinking-blink" : ""}`} />
                <div 
                  className={`pupil ${isSpeaking ? "speaking-pupil" : ""} ${isListening ? "listening-pupil" : ""}`}
                  style={{
                    transform: `translate(${isListening ? Math.sin(step * 2 + 0.5) * 2 : 0}px, ${isListening ? Math.cos(step * 2 + 0.5) * 1 : 0}px)`,
                  }}
                >
                  <div className="eye-glow" />
                </div>
              </div>
            </div>

            {/* Mouth Section - SMALLER */}
            <div className="mouth-section">
              {isSpeaking ? (
                <div className="voice-visualizer">
                  {audioLevels.map((level, i) => (
                    <div 
                      key={i} 
                      className="voice-bar"
                      style={{ 
                        height: `${level * 0.7}%`, // Reduced height
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              ) : isListening ? (
                <div className="listening-wave">
                  <div className="wave-circle" style={{ animationDelay: '0s' }} />
                  <div className="wave-circle" style={{ animationDelay: '0.2s' }} />
                  <div className="wave-circle" style={{ animationDelay: '0.4s' }} />
                </div>
              ) : isTyping ? (
                <div className="thinking-dots">
                  <span style={{ animationDelay: '0s' }}>.</span>
                  <span style={{ animationDelay: '0.2s' }}>.</span>
                  <span style={{ animationDelay: '0.4s' }}>.</span>
                </div>
              ) : (
                <div className="neutral-mouth">
                  <div className="mouth-line" />
                </div>
              )}
            </div>

            {/* Cheek LEDs */}
            <div className="cheek-led left" />
            <div className="cheek-led right" />
          </div>

          {/* Neck with flex - SMALLER */}
          <div 
            className="neck"
            style={{
              transform: `rotate(${isListening ? 1 : 0}deg)`,
            }}
          >
            <div className="neck-ring" />
            <div className="neck-ring" />
          </div>
        </div>

        {/* Body/Torso with movement - SMALLER */}
        <div 
          className="robot-body"
          style={{
            transform: `rotate(${isSpeaking ? Math.sin(step * 2) * 0.5 : 0}deg)`,
          }}
        >
          {/* Chest Display - COMPACT */}
          <div className="chest-display">
            <div className="display-screen">
              <div className={`status-light ${isListening ? "active" : ""}`} />
              <div className="display-text">
                {isSpeaking && "SPK"}
                {isListening && "LST"}
                {isTyping && "CPU"}
                {!isSpeaking && !isListening && !isTyping && "RDY"}
              </div>
              <div className={`status-light ${isSpeaking ? "active" : ""}`} />
            </div>
            
            {/* Energy Cores - SMALLER */}
            <div className="energy-cores">
              <div className={`core ${isListening ? "pulse" : ""}`} />
              <div className={`core ${isSpeaking ? "pulse" : ""}`} />
              <div className={`core ${isTyping ? "pulse" : ""}`} />
            </div>
          </div>

          {/* Shoulder Pads - SMALLER */}
          <div className="shoulder left" />
          <div className="shoulder right" />

          {/* Arms with Full Movement - SHORTER */}
          <div className="arms">
            {/* Left Arm */}
            <div 
              className="arm left"
              style={{
                transform: `
                  rotate(${leftArm.shoulder}deg)
                  translateY(${Math.abs(leftArm.shoulder) * 0.3}px)
                `,
              }}
            >
              <div className="upper-arm">
                <div 
                  className="arm-joint"
                  style={{
                    transform: `rotate(${leftArm.elbow}deg)`,
                  }}
                />
              </div>
              <div 
                className="forearm"
                style={{
                  transform: `rotate(${leftArm.elbow}deg)`,
                }}
              >
                <div 
                  className="hand"
                  style={{
                    transform: `rotate(${leftArm.hand}deg)`,
                  }}
                >
                  <div className="finger" />
                  <div className="finger" />
                </div>
              </div>
            </div>
            
            {/* Right Arm */}
            <div 
              className="arm right"
              style={{
                transform: `
                  rotate(${rightArm.shoulder}deg)
                  translateY(${Math.abs(rightArm.shoulder) * 0.3}px)
                `,
              }}
            >
              <div className="upper-arm">
                <div 
                  className="arm-joint"
                  style={{
                    transform: `rotate(${rightArm.elbow}deg)`,
                  }}
                />
              </div>
              <div 
                className="forearm"
                style={{
                  transform: `rotate(${rightArm.elbow}deg)`,
                }}
              >
                <div 
                  className="hand"
                  style={{
                    transform: `rotate(${rightArm.hand}deg)`,
                  }}
                >
                  <div className="finger" />
                  <div className="finger" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Waist/Hip Section - SMALLER */}
        <div 
          className="waist"
          style={{
            transform: `rotate(${isSpeaking ? Math.sin(step * 2) * 1 : 0}deg)`,
          }}
        >
          <div className="hip-joint" />
          <div className="hip-joint" />
        </div>

        {/* Legs with Full Movement - SHORTER */}
        <div className="legs">
          {/* Left Leg */}
          <div 
            className="leg left"
            style={{
              transform: `
                rotate(${leftLeg.hip}deg)
                translateY(${Math.abs(leftLeg.hip) * 0.2}px)
              `,
            }}
          >
            <div className="thigh">
              <div 
                className="knee-joint"
                style={{
                  transform: `rotate(${leftLeg.knee}deg)`,
                }}
              />
            </div>
            <div 
              className="calf"
              style={{
                transform: `rotate(${leftLeg.knee}deg)`,
              }}
            >
              <div 
                className="ankle-joint"
                style={{
                  transform: `rotate(${leftLeg.ankle}deg)`,
                }}
              />
              <div 
                className="foot"
                style={{
                  transform: `rotate(${leftLeg.ankle}deg)`,
                }}
              >
                <div className="toe" />
              </div>
            </div>
          </div>
          
          {/* Right Leg */}
          <div 
            className="leg right"
            style={{
              transform: `
                rotate(${rightLeg.hip}deg)
                translateY(${Math.abs(rightLeg.hip) * 0.2}px)
              `,
            }}
          >
            <div className="thigh">
              <div 
                className="knee-joint"
                style={{
                  transform: `rotate(${rightLeg.knee}deg)`,
                }}
              />
            </div>
            <div 
              className="calf"
              style={{
                transform: `rotate(${rightLeg.knee}deg)`,
              }}
            >
              <div 
                className="ankle-joint"
                style={{
                  transform: `rotate(${rightLeg.ankle}deg)`,
                }}
              />
              <div 
                className="foot"
                style={{
                  transform: `rotate(${rightLeg.ankle}deg)`,
                }}
              >
                <div className="toe" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar - COMPACT */}
      <div className="status-bar">
        <div className={`status-indicator ${isListening ? "listening" : ""}`}>
          <div className="indicator-light" />
          <span>MIC</span>
        </div>
        <div className={`status-indicator ${isSpeaking ? "speaking" : ""}`}>
          <div className="indicator-light" />
          <span>SPK</span>
        </div>
        <div className={`status-indicator ${isTyping ? "thinking" : ""}`}>
          <div className="indicator-light" />
          <span>CPU</span>
        </div>
      </div>

      <style>{`
        .robo-avatar-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #1a1e2a 0%, #0d0f15 100%);
          border-radius: 24px;
          padding: 10px;
          font-family: 'Courier New', monospace;
          overflow: hidden;
        }

        /* Robot Container - COMPACT */
        .robot {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 200px; /* Reduced from 280px */
          filter: drop-shadow(0 15px 15px rgba(0, 0, 0, 0.6));
          transition: transform 0.05s linear;
          transform-origin: center bottom;
        }

        /* COMPACT VERSION - All sizes reduced by ~30% */
        .compact .robot-head {
          width: 120px; /* Reduced from 160px */
          margin-bottom: -8px;
        }

        .compact .face-plate {
          width: 120px;
          height: 100px; /* Reduced from 140px */
        }

        .compact .eyes {
          padding: 15px 15px 0;
        }

        .compact .eye {
          width: 35px; /* Reduced from 45px */
          height: 35px;
        }

        .compact .pupil {
          width: 100%;
          height: 100%;
        }

        .compact .eye-glow {
          width: 12px;
          height: 12px;
          top: 3px;
          left: 3px;
        }

        .compact .mouth-section {
          margin-top: 0;
          height: 25px;
        }

        .compact .cheek-led {
          bottom: 15px;
          width: 6px;
          height: 6px;
        }

        .compact .neck-ring {
          width: 30px; /* Reduced from 40px */
          height: 6px;
        }

        .compact .robot-body {
          width: 150px; /* Reduced from 200px */
          padding: 10px 0 5px;
        }

        .compact .chest-display {
          padding: 5px;
        }

        .compact .display-screen {
          padding: 5px;
          margin-bottom: 8px;
        }

        .compact .display-text {
          font-size: 10px; /* Reduced from 14px */
        }

        .compact .status-light {
          width: 8px;
          height: 8px;
        }

        .compact .energy-cores {
          gap: 8px;
        }

        .compact .core {
          width: 18px; /* Reduced from 25px */
          height: 18px;
        }

        .compact .shoulder {
          width: 25px; /* Reduced from 35px */
          height: 18px;
          top: -8px;
        }

        .compact .shoulder.left { left: -10px; }
        .compact .shoulder.right { right: -10px; }

        .compact .arm.left { left: -25px; }
        .compact .arm.right { right: -25px; }

        .compact .upper-arm {
          width: 22px; /* Reduced from 30px */
          height: 45px; /* Reduced from 60px */
        }

        .compact .forearm {
          width: 22px;
          height: 35px; /* Reduced from 50px */
        }

        .compact .hand {
          bottom: -8px;
        }

        .compact .finger {
          width: 4px;
          height: 10px; /* Reduced from 15px */
        }

        .compact .waist {
          width: 110px; /* Reduced from 150px */
          height: 15px;
        }

        .compact .hip-joint {
          width: 15px;
          height: 15px;
        }

        .compact .legs {
          gap: 25px; /* Reduced from 40px */
        }

        .compact .leg {
          width: 32px; /* Reduced from 45px */
        }

        .compact .thigh {
          height: 35px; /* Reduced from 50px */
        }

        .compact .calf {
          height: 35px; /* Reduced from 50px */
        }

        .compact .knee-joint {
          width: 15px;
          height: 8px;
          bottom: -6px;
        }

        .compact .ankle-joint {
          width: 15px;
          height: 6px;
          bottom: -6px;
        }

        .compact .foot {
          width: 28px; /* Reduced from 40px */
          height: 8px;
          bottom: -8px;
        }

        .compact .toe {
          width: 5px;
          height: 4px;
        }

        .compact .arm-joint {
          width: 12px;
          height: 12px;
          bottom: -6px;
        }

        /* Status Bar - COMPACT */
        .status-bar {
          display: flex;
          gap: 15px;
          margin-top: 15px;
          background: #0f172a;
          padding: 8px 15px;
          border-radius: 20px;
          border: 2px solid #4a5a6e;
          transform: scale(0.9);
        }

        .status-indicator {
          font-size: 10px;
        }

        /* Head Section */
        .robot-head {
          position: relative;
          z-index: 10;
          transition: transform 0.1s ease;
          transform-origin: center bottom;
        }

        /* Antenna */
        .antenna {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
        }

        .antenna-ball {
          width: 12px;
          height: 12px;
          background: #ffd700;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
          transition: all 0.3s ease;
          margin-bottom: 2px;
          animation: antenna-wiggle 2s ease-in-out infinite;
        }

        @keyframes antenna-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .antenna-ball.active-listening {
          background: #4ade80;
          box-shadow: 0 0 15px #4ade80;
          animation: pulse 1s ease infinite, antenna-wiggle 2s ease-in-out infinite;
        }

        .antenna-ball.active-speaking {
          background: #60a5fa;
          box-shadow: 0 0 15px #60a5fa;
          animation: pulse 0.5s ease infinite, antenna-wiggle 2s ease-in-out infinite;
        }

        .antenna-ball.active-thinking {
          background: #fbbf24;
          box-shadow: 0 0 15px #fbbf24;
          animation: pulse 0.8s ease infinite, antenna-wiggle 2s ease-in-out infinite;
        }

        .antenna-rod {
          width: 3px;
          height: 15px;
          background: linear-gradient(90deg, #94a3b8, #64748b);
          border-radius: 2px;
        }

        /* Face Plate */
        .face-plate {
          background: linear-gradient(145deg, #334155, #1e2937);
          border-radius: 30px 30px 20px 20px;
          border: 2px solid #475569;
          position: relative;
          box-shadow: inset 0 -3px 0 #0f172a, inset 0 3px 8px rgba(255, 255, 255, 0.1);
        }

        /* Eyes */
        .eyes {
          display: flex;
          justify-content: space-around;
        }

        .eye {
          background: #0f172a;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          border: 2px solid #475569;
        }

        .eye-lid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #1e2937 0%, transparent 100%);
          z-index: 2;
          animation: blink 4s ease-in-out infinite;
        }

        .eye-lid.thinking-blink {
          animation: think-blink 0.8s ease-in-out infinite;
        }

        .pupil {
          width: 100%;
          height: 100%;
          background: #60a5fa;
          border-radius: 50%;
          position: relative;
          transition: all 0.1s ease;
        }

        .speaking-pupil {
          animation: speak-pupil 0.3s ease-in-out infinite;
        }

        .listening-pupil {
          transition: transform 0.1s ease;
        }

        .eye-glow {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          filter: blur(2px);
        }

        /* Cheek LEDs */
        .cheek-led {
          position: absolute;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 4px #ef4444;
        }

        .cheek-led.left {
          left: 10px;
          animation: cheek-pulse 2s ease-in-out infinite;
        }

        .cheek-led.right {
          right: 10px;
          animation: cheek-pulse 2s ease-in-out infinite 0.5s;
        }

        @keyframes cheek-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Mouth Section */
        .mouth-section {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .voice-visualizer {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 20px;
        }

        .voice-bar {
          width: 4px;
          background: #60a5fa;
          border-radius: 2px;
          transition: height 0.05s ease;
          box-shadow: 0 0 8px #60a5fa;
          animation: bar-pulse 0.2s ease-in-out infinite;
        }

        @keyframes bar-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .listening-wave {
          display: flex;
          gap: 3px;
          align-items: center;
        }

        .wave-circle {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: wave 1s ease infinite;
        }

        .thinking-dots {
          color: #fbbf24;
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          display: flex;
          gap: 2px;
        }

        .thinking-dots span {
          animation: thinking 1.4s ease infinite;
        }

        .neutral-mouth {
          width: 30px;
          height: 3px;
        }

        .mouth-line {
          width: 100%;
          height: 100%;
          background: #64748b;
          border-radius: 2px;
        }

        /* Neck */
        .neck {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
          transition: transform 0.1s ease;
        }

        .neck-ring {
          background: #475569;
          border-radius: 3px;
          border-bottom: 1px solid #1e2937;
        }

        /* Body */
        .robot-body {
          background: linear-gradient(145deg, #2a3440, #1a1f2a);
          border-radius: 20px 20px 15px 15px;
          position: relative;
          border: 2px solid #4a5a6e;
          box-shadow: inset 0 -3px 0 #0f172a;
          transition: transform 0.1s ease;
          transform-origin: center top;
        }

        /* Chest Display */
        .chest-display {
          padding: 5px;
        }

        .display-screen {
          background: #0f172a;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #4a5a6e;
        }

        .status-light.active {
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
          animation: pulse 1s ease infinite;
        }

        .display-text {
          color: #4ade80;
          font-weight: bold;
          letter-spacing: 1px;
          text-shadow: 0 0 3px rgba(74, 222, 128, 0.5);
        }

        /* Energy Cores */
        .energy-cores {
          display: flex;
          justify-content: center;
        }

        .core {
          background: linear-gradient(145deg, #4a5a6e, #2a3440);
          border-radius: 50%;
          border: 1px solid #64748b;
          transition: all 0.3s ease;
        }

        .core.pulse {
          animation: core-pulse 0.8s ease infinite;
        }

        .core:nth-child(1).pulse { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
        .core:nth-child(2).pulse { background: #60a5fa; box-shadow: 0 0 10px #60a5fa; }
        .core:nth-child(3).pulse { background: #fbbf24; box-shadow: 0 0 10px #fbbf24; }

        /* Shoulders */
        .shoulder {
          position: absolute;
          background: #2a3440;
          border: 2px solid #4a5a6e;
          border-radius: 10px;
        }

        /* Arms */
        .arms {
          position: relative;
          width: 100%;
          height: 70px;
        }

        .arm {
          position: absolute;
          top: 15px;
          transition: transform 0.05s linear;
          transform-origin: top center;
          z-index: 5;
        }

        .upper-arm {
          background: linear-gradient(145deg, #2a3440, #1a1f2a);
          border-radius: 10px;
          border: 2px solid #4a5a6e;
          position: relative;
        }

        .arm-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: #64748b;
          border-radius: 50%;
          border: 1px solid #4a5a6e;
          transition: transform 0.05s linear;
        }

        .forearm {
          background: linear-gradient(145deg, #1a1f2a, #0f172a);
          border-radius: 8px;
          margin-top: 3px;
          border: 2px solid #4a5a6e;
          position: relative;
          transition: transform 0.05s linear;
          transform-origin: top center;
        }

        .hand {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
          transition: transform 0.05s linear;
        }

        .finger {
          background: #64748b;
          border-radius: 2px;
          border: 1px solid #4a5a6e;
          animation: finger-curl 2s ease-in-out infinite;
        }

        @keyframes finger-curl {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.8); }
        }

        /* Waist */
        .waist {
          background: linear-gradient(145deg, #2a3440, #1a1f2a);
          border-radius: 10px;
          margin: 3px 0;
          border: 2px solid #4a5a6e;
          display: flex;
          justify-content: space-around;
          align-items: center;
          transition: transform 0.1s ease;
        }

        .hip-joint {
          background: #64748b;
          border-radius: 50%;
          border: 1px solid #4a5a6e;
        }

        .hip-joint:first-child {
          animation: hip-rotate 3s ease-in-out infinite;
        }

        .hip-joint:last-child {
          animation: hip-rotate 3s ease-in-out infinite 0.5s;
        }

        @keyframes hip-rotate {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        /* Legs */
        .legs {
          display: flex;
          margin-top: 3px;
        }

        .leg {
          transition: transform 0.05s linear;
          transform-origin: top center;
        }

        .thigh {
          background: linear-gradient(145deg, #2a3440, #1a1f2a);
          border-radius: 10px 10px 3px 3px;
          border: 2px solid #4a5a6e;
          position: relative;
        }

        .knee-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: #64748b;
          border-radius: 3px;
          border: 1px solid #4a5a6e;
          transition: transform 0.05s linear;
        }

        .calf {
          background: linear-gradient(145deg, #1a1f2a, #0f172a);
          border-radius: 3px 3px 10px 10px;
          margin-top: 3px;
          border: 2px solid #4a5a6e;
          position: relative;
          transition: transform 0.05s linear;
          transform-origin: top center;
        }

        .ankle-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: #64748b;
          border-radius: 3px;
          border: 1px solid #4a5a6e;
          transition: transform 0.05s linear;
        }

        .foot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(145deg, #2a3440, #1a1f2a);
          border-radius: 4px;
          border: 1px solid #4a5a6e;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: transform 0.05s linear;
        }

        .toe {
          width: 4px;
          height: 3px;
          background: #64748b;
          border-radius: 2px;
          animation: toe-wiggle 2s ease-in-out infinite;
        }

        @keyframes toe-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }

        /* Status Bar */
        .status-bar {
          display: flex;
          background: #0f172a;
          border-radius: 20px;
          border: 1px solid #4a5a6e;
          position: relative;
          overflow: hidden;
        }

        .status-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: scan 3s linear infinite;
        }

        @keyframes scan {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #64748b;
          font-weight: bold;
          transition: all 0.3s ease;
          position: relative;
        }

        .status-indicator .indicator-light {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4a5a6e;
          transition: all 0.3s ease;
        }

        .status-indicator.listening {
          color: #4ade80;
        }
        .status-indicator.listening .indicator-light {
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
          animation: pulse 1s ease infinite;
        }

        .status-indicator.speaking {
          color: #60a5fa;
        }
        .status-indicator.speaking .indicator-light {
          background: #60a5fa;
          box-shadow: 0 0 8px #60a5fa;
          animation: pulse 0.5s ease infinite;
        }

        .status-indicator.thinking {
          color: #fbbf24;
        }
        .status-indicator.thinking .indicator-light {
          background: #fbbf24;
          box-shadow: 0 0 8px #fbbf24;
          animation: pulse 0.8s ease infinite;
        }

        /* Animations */
        @keyframes blink {
          0%, 48%, 52%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }

        @keyframes think-blink {
          0%, 45%, 55%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }

        @keyframes speak-pupil {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.9); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes core-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px currentColor; }
          50% { transform: scale(1.1); box-shadow: 0 0 15px currentColor; }
        }

        @keyframes wave {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes thinking {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};

export default RoboAvatar;