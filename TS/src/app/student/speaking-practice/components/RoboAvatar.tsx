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
      const elapsed = (now - startTime) / 1000;
      
      if (isSpeaking) {
        setBodyPosition({
          x: Math.sin(elapsed * 3) * 2,
          y: Math.sin(elapsed * 6) * 1.5,
          rotate: Math.sin(elapsed * 2) * 1.5,
        });
        setStep(prev => (prev + 0.1) % (Math.PI * 2));
      } 
      else if (isListening) {
        setBodyPosition({
          x: Math.sin(elapsed * 0.5) * 0.5,
          y: 1,
          rotate: 2,
        });
        setStep(prev => (prev + 0.02) % (Math.PI * 2));
      } 
      else if (isTyping) {
        setBodyPosition({
          x: Math.sin(elapsed * 8) * 0.5,
          y: Math.sin(elapsed * 4) * 0.5,
          rotate: Math.sin(elapsed * 10) * 0.3,
        });
        setStep(prev => (prev + 0.3) % (Math.PI * 2));
      } 
      else {
        setBodyPosition({
          x: 0,
          y: Math.sin(elapsed * 2) * 1.5,
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
      const gestureAmount = Math.sin(step * 2) * 20;
      return {
        shoulder: direction * 10 + gestureAmount * direction,
        elbow: 15 + Math.sin(step * 3) * 10,
        hand: Math.sin(step * 4) * 5,
      };
    }
    else if (isListening) {
      return {
        shoulder: direction * 8,
        elbow: 35,
        hand: 10,
      };
    }
    else if (isTyping) {
      return {
        shoulder: direction * 15,
        elbow: 55 + Math.sin(step * 10) * 3,
        hand: 20 + Math.sin(step * 15) * 3,
      };
    }
    else {
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
      const bounce = Math.sin(step * 2 + phase) * 3;
      return {
        hip: bounce,
        knee: 3 + Math.abs(bounce) * 0.5,
        ankle: bounce * 0.3,
      };
    }
    else if (isListening) {
      const weightShift = Math.sin(step * 0.5 + phase) * 2;
      return {
        hip: weightShift,
        knee: 1,
        ankle: weightShift * 0.2,
      };
    }
    else if (isTyping) {
      return {
        hip: 0,
        knee: 1,
        ankle: Math.sin(step * 8) * 0.5,
      };
    }
    else {
      return {
        hip: Math.sin(step * 0.5 + phase) * 1,
        knee: 0,
        ankle: Math.sin(step * 0.5 + phase) * 0.5,
      };
    }
  };

  const leftArm = getArmTransform('left');
  const rightArm = getArmTransform('right');
  const leftLeg = getLegTransform('left');
  const rightLeg = getLegTransform('right');

  return (
    <div className="robo-avatar-container">
      <div className="avatar-content">
        <div 
          className="robot compact"
          style={{
            transform: `translate(${bodyPosition.x}px, ${bodyPosition.y}px) rotate(${bodyPosition.rotate}deg)`,
          }}
        >
          {/* Head */}
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
            
            <div className="face-plate">
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

              <div className="mouth-section">
                {isSpeaking ? (
                  <div className="voice-visualizer">
                    {audioLevels.map((level, i) => (
                      <div 
                        key={i} 
                        className="voice-bar"
                        style={{ 
                          height: `${level * 0.7}%`,
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

              <div className="cheek-led left" />
              <div className="cheek-led right" />
            </div>

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

          {/* Body */}
          <div 
            className="robot-body"
            style={{
              transform: `rotate(${isSpeaking ? Math.sin(step * 2) * 0.5 : 0}deg)`,
            }}
          >
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
              
              <div className="energy-cores">
                <div className={`core ${isListening ? "pulse" : ""}`} />
                <div className={`core ${isSpeaking ? "pulse" : ""}`} />
                <div className={`core ${isTyping ? "pulse" : ""}`} />
              </div>
            </div>

            <div className="shoulder left" />
            <div className="shoulder right" />

            <div className="arms">
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

          <div 
            className="waist"
            style={{
              transform: `rotate(${isSpeaking ? Math.sin(step * 2) * 1 : 0}deg)`,
            }}
          >
            <div className="hip-joint" />
            <div className="hip-joint" />
          </div>

          <div className="legs">
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
      </div>

      <style>{`
        .robo-avatar-container {
          height: 100%;
          min-height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
          border-radius: 24px;
          padding: 20px;
          font-family: 'Courier New', monospace;
          overflow: hidden;
        }

        .avatar-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        /* Robot Container - COMPACT */
        .robot {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
          filter: drop-shadow(0 15px 15px rgba(255, 122, 0, 0.3));
          transition: transform 0.05s linear;
          transform-origin: center bottom;
        }

        /* Head Section */
        .robot-head {
          position: relative;
          z-index: 10;
          transition: transform 0.1s ease;
          transform-origin: center bottom;
        }

        .compact .robot-head {
          width: 130px;
          margin-bottom: -8px;
        }

        .compact .face-plate {
          width: 130px;
          height: 110px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 30px 30px 20px 20px;
          border: 2px solid #ff7a00;
          position: relative;
          box-shadow: inset 0 -3px 0 #2c2c2c, inset 0 3px 8px rgba(255, 122, 0, 0.2);
        }

        .compact .eyes {
          padding: 18px 18px 0;
          display: flex;
          justify-content: space-around;
        }

        .compact .eye {
          width: 38px;
          height: 38px;
          background: #000000;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          border: 2px solid #ff7a00;
        }

        .compact .pupil {
          width: 100%;
          height: 100%;
          background: #ff7a00;
          border-radius: 50%;
          position: relative;
          transition: all 0.1s ease;
        }

        .compact .eye-glow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          top: 4px;
          left: 4px;
          filter: blur(2px);
        }

        .compact .mouth-section {
          margin-top: 8px;
          height: 28px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .compact .cheek-led {
          position: absolute;
          bottom: 18px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff7a00;
          box-shadow: 0 0 4px #ff7a00;
        }

        .compact .cheek-led.left { left: 12px; }
        .compact .cheek-led.right { right: 12px; }

        .compact .neck {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
        }

        .compact .neck-ring {
          width: 32px;
          height: 6px;
          background: #ff7a00;
          border-radius: 3px;
          border-bottom: 1px solid #2c2c2c;
        }

        /* Antenna */
        .antenna {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
        }

        .antenna-ball {
          width: 14px;
          height: 14px;
          background: #ff7a00;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 122, 0, 0.5);
          transition: all 0.3s ease;
          margin-bottom: 2px;
          animation: antenna-wiggle 2s ease-in-out infinite;
        }

        .antenna-ball.active-listening {
          background: #28a745;
          box-shadow: 0 0 15px #28a745;
        }

        .antenna-ball.active-speaking {
          background: #ff7a00;
          box-shadow: 0 0 15px #ff7a00;
        }

        .antenna-ball.active-thinking {
          background: #ffc107;
          box-shadow: 0 0 15px #ffc107;
        }

        .antenna-rod {
          width: 3px;
          height: 16px;
          background: linear-gradient(90deg, #ff7a00, #ff944d);
          border-radius: 2px;
        }

        /* Body */
        .compact .robot-body {
          width: 160px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 20px 20px 15px 15px;
          position: relative;
          border: 2px solid #ff7a00;
          padding: 10px 0 5px;
          box-shadow: inset 0 -3px 0 #2c2c2c;
        }

        .compact .chest-display {
          padding: 5px;
        }

        .compact .display-screen {
          background: #000000;
          border-radius: 6px;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #ff7a00;
        }

        .compact .status-light {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2c2c2c;
        }

        .compact .status-light.active {
          background: #ff7a00;
          box-shadow: 0 0 10px #ff7a00;
          animation: pulse 1s ease infinite;
        }

        .compact .display-text {
          color: #ff7a00;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .compact .energy-cores {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
        }

        .compact .core {
          width: 20px;
          height: 20px;
          background: #2c2c2c;
          border-radius: 50%;
          border: 1px solid #ff7a00;
        }

        .compact .core.pulse {
          animation: core-pulse 0.8s ease infinite;
        }

        .compact .core:nth-child(1).pulse { background: #28a745; box-shadow: 0 0 10px #28a745; }
        .compact .core:nth-child(2).pulse { background: #ff7a00; box-shadow: 0 0 10px #ff7a00; }
        .compact .core:nth-child(3).pulse { background: #ffc107; box-shadow: 0 0 10px #ffc107; }

        /* Shoulders */
        .compact .shoulder {
          position: absolute;
          width: 28px;
          height: 20px;
          background: #1a1a1a;
          border: 2px solid #ff7a00;
          border-radius: 10px;
          top: -8px;
        }

        .compact .shoulder.left { left: -12px; }
        .compact .shoulder.right { right: -12px; }

        /* Arms */
        .compact .arms {
          position: relative;
          width: 100%;
          height: 70px;
        }

        .compact .arm {
          position: absolute;
          top: 15px;
          transition: transform 0.05s linear;
          transform-origin: top center;
          z-index: 5;
        }

        .compact .arm.left { left: -28px; }
        .compact .arm.right { right: -28px; }

        .compact .upper-arm {
          width: 24px;
          height: 48px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 10px;
          border: 2px solid #ff7a00;
          position: relative;
        }

        .compact .arm-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          background: #ff7a00;
          border-radius: 50%;
          bottom: -6px;
          border: 1px solid #ff944d;
        }

        .compact .forearm {
          width: 24px;
          height: 38px;
          background: linear-gradient(145deg, #0a0a0a, #000000);
          border-radius: 8px;
          margin-top: 3px;
          border: 2px solid #ff7a00;
          position: relative;
          transition: transform 0.05s linear;
          transform-origin: top center;
        }

        .compact .hand {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -8px;
          display: flex;
          gap: 3px;
        }

        .compact .finger {
          width: 4px;
          height: 12px;
          background: #ff7a00;
          border-radius: 2px;
          border: 1px solid #ff944d;
        }

        /* Waist */
        .compact .waist {
          width: 120px;
          height: 16px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 10px;
          margin: 3px 0;
          border: 2px solid #ff7a00;
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        .compact .hip-joint {
          width: 16px;
          height: 16px;
          background: #ff7a00;
          border-radius: 50%;
          border: 1px solid #ff944d;
        }

        /* Legs */
        .compact .legs {
          display: flex;
          gap: 28px;
          margin-top: 3px;
        }

        .compact .leg {
          width: 35px;
          transition: transform 0.05s linear;
          transform-origin: top center;
        }

        .compact .thigh {
          height: 38px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 10px 10px 3px 3px;
          border: 2px solid #ff7a00;
          position: relative;
        }

        .compact .knee-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 8px;
          background: #ff7a00;
          border-radius: 3px;
          bottom: -6px;
          border: 1px solid #ff944d;
        }

        .compact .calf {
          height: 38px;
          background: linear-gradient(145deg, #0a0a0a, #000000);
          border-radius: 3px 3px 10px 10px;
          margin-top: 3px;
          border: 2px solid #ff7a00;
          position: relative;
        }

        .compact .ankle-joint {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 6px;
          background: #ff7a00;
          border-radius: 3px;
          bottom: -6px;
          border: 1px solid #ff944d;
        }

        .compact .foot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -8px;
          width: 30px;
          height: 8px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 4px;
          border: 1px solid #ff7a00;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .compact .toe {
          width: 5px;
          height: 4px;
          background: #ff7a00;
          border-radius: 2px;
        }

        /* Status Bar */
        .status-bar {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          background: #0a0a0a;
          padding: 10px 20px;
          border-radius: 20px;
          border: 1px solid #ff7a00;
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
          background: linear-gradient(90deg, transparent, rgba(255, 122, 0, 0.2), transparent);
          animation: scan 3s linear infinite;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8a8a8a;
          font-weight: bold;
          transition: all 0.3s ease;
          font-size: 11px;
          position: relative;
        }

        .status-indicator .indicator-light {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2c2c2c;
          transition: all 0.3s ease;
        }

        .status-indicator.listening {
          color: #28a745;
        }
        .status-indicator.listening .indicator-light {
          background: #28a745;
          box-shadow: 0 0 8px #28a745;
          animation: pulse 1s ease infinite;
        }

        .status-indicator.speaking {
          color: #ff7a00;
        }
        .status-indicator.speaking .indicator-light {
          background: #ff7a00;
          box-shadow: 0 0 8px #ff7a00;
          animation: pulse 0.5s ease infinite;
        }

        .status-indicator.thinking {
          color: #ffc107;
        }
        .status-indicator.thinking .indicator-light {
          background: #ffc107;
          box-shadow: 0 0 8px #ffc107;
          animation: pulse 0.8s ease infinite;
        }

        /* Voice Visualizer */
        .voice-visualizer {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 22px;
        }

        .voice-bar {
          width: 5px;
          background: #ff7a00;
          border-radius: 2px;
          transition: height 0.05s ease;
          box-shadow: 0 0 8px #ff7a00;
        }

        .listening-wave {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .wave-circle {
          width: 7px;
          height: 7px;
          background: #28a745;
          border-radius: 50%;
          animation: wave 1s ease infinite;
        }

        .thinking-dots {
          color: #ffc107;
          font-size: 20px;
          font-weight: bold;
          line-height: 1;
          display: flex;
          gap: 3px;
        }

        .thinking-dots span {
          animation: thinking 1.4s ease infinite;
        }

        .neutral-mouth {
          width: 32px;
          height: 4px;
        }

        .mouth-line {
          width: 100%;
          height: 100%;
          background: #ff7a00;
          border-radius: 2px;
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes core-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes wave {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes thinking {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }

        @keyframes antenna-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        @keyframes scan {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        @keyframes blink {
          0%, 48%, 52%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }

        @keyframes speak-pupil {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.9); }
        }

        /* Eye animations */
        .eye-lid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #2c2c2c 0%, transparent 100%);
          z-index: 2;
          animation: blink 4s ease-in-out infinite;
        }

        .eye-lid.thinking-blink {
          animation: think-blink 0.8s ease-in-out infinite;
        }

        @keyframes think-blink {
          0%, 45%, 55%, 100% { transform: translateY(0); }
          50% { transform: translateY(-100%); }
        }

        .speaking-pupil {
          animation: speak-pupil 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RoboAvatar;