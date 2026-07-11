import React, { useState, useEffect, useRef } from 'react'

interface Props { isSpeaking: boolean; isListening: boolean; isTyping: boolean }

const AnimatedRobotSVG: React.FC<Props> = ({ isSpeaking, isListening, isTyping }) => {
  const [mouthH,   setMouthH]   = useState(0)
  const [eyeBlink, setEyeBlink] = useState(false)
  const [bodyY,    setBodyY]    = useState(0)
  const raf = useRef<number>()
  const t0  = useRef(Date.now())

  useEffect(() => {
    if (isSpeaking) {
      const id = setInterval(() => setMouthH(4 + Math.random() * 12), 85)
      return () => clearInterval(id)
    }
    setMouthH(0)
  }, [isSpeaking])

  useEffect(() => {
    const next = () => {
      const id = setTimeout(() => {
        setEyeBlink(true)
        setTimeout(() => { setEyeBlink(false); next() }, 130)
      }, 3000 + Math.random() * 2200)
      return id
    }
    const id = next(); return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const loop = () => {
      const t = (Date.now() - t0.current) / 1000
      setBodyY(Math.sin(t * 1.4) * 4)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [])

  return (
    <svg viewBox="0 0 280 360" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id="g_head" cx="38%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#dce0ed"/>
        </radialGradient>
        <radialGradient id="g_body" cx="42%" cy="26%" r="70%">
          <stop offset="0%"   stopColor="#f4f6fb"/>
          <stop offset="100%" stopColor="#cdd1e2"/>
        </radialGradient>
        <radialGradient id="g_arm" cx="28%" cy="45%" r="72%">
          <stop offset="0%"   stopColor="#eef0f8"/>
          <stop offset="100%" stopColor="#c6c8d8"/>
        </radialGradient>
        <radialGradient id="g_joint" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#e8eaf4"/>
          <stop offset="100%" stopColor="#b8bcd0"/>
        </radialGradient>
        <linearGradient id="g_eye" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffe97a"/>
          <stop offset="40%"  stopColor="#ff8c00"/>
          <stop offset="100%" stopColor="#c84000"/>
        </linearGradient>
        <filter id="f_eye" x="-70%" y="-160%" width="240%" height="420%">
          <feGaussianBlur stdDeviation="5.5" result="b1"/>
          <feGaussianBlur stdDeviation="2.5" result="b2"/>
          <feMerge>
            <feMergeNode in="b1"/>
            <feMergeNode in="b1"/>
            <feMergeNode in="b2"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="f_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="f_shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#00000020"/>
        </filter>
      </defs>

      <g transform={`translate(0,${bodyY})`} filter="url(#f_shadow)">

        {/* ── Antenna ── */}
        <line x1="140" y1="12" x2="140" y2="42" stroke="#e07000" strokeWidth="4.5" strokeLinecap="round"/>
        <circle cx="140" cy="7"  r="11" fill="#ff8c00" filter="url(#f_glow)"/>
        <circle cx="140" cy="7"  r="5.5" fill="#ffdd44"/>

        {/* ── Halo ring (subtle) ── */}
        <rect x="53" y="37" width="174" height="136" rx="46"
          fill="none" stroke="#ff8c00" strokeWidth="5" opacity="0.25"/>

        {/* ── Left ear ── */}
        <rect x="38" y="78" width="24" height="38" rx="12"
          fill="url(#g_head)" stroke="#d8dced" strokeWidth="1.5"/>
        <circle cx="50" cy="97"  r="9"   fill="none" stroke="#ff8c00" strokeWidth="2.5" opacity="0.7"/>
        <circle cx="50" cy="97"  r="4"   fill="#ff8c00" opacity="0.45" filter="url(#f_glow)"/>

        {/* ── Right ear ── */}
        <rect x="218" y="78" width="24" height="38" rx="12"
          fill="url(#g_head)" stroke="#d8dced" strokeWidth="1.5"/>
        <circle cx="230" cy="97"  r="9"   fill="none" stroke="#ff8c00" strokeWidth="2.5" opacity="0.7"/>
        <circle cx="230" cy="97"  r="4"   fill="#ff8c00" opacity="0.45" filter="url(#f_glow)"/>

        {/* ── Head ── */}
        <rect x="58" y="42" width="164" height="130" rx="46"
          fill="url(#g_head)" stroke="#d8dced" strokeWidth="1.5"/>
        <ellipse cx="118" cy="62" rx="48" ry="19" fill="rgba(255,255,255,0.52)" transform="rotate(-12,118,62)"/>

        {/* ── Dark face screen ── */}
        <rect x="76" y="60" width="128" height="96" rx="26"
          fill="#090b17" stroke="#181b2e" strokeWidth="1.5"/>
        {/* orange edge glow on screen */}
        <rect x="76" y="60" width="128" height="96" rx="26"
          fill="none" stroke="#ff8c00" strokeWidth="1" opacity="0.22"/>
        {/* screen top sheen */}
        <ellipse cx="134" cy="70" rx="40" ry="9" fill="rgba(255,255,255,0.05)"/>

        {/* ── Left eye (horizontal slot) ── */}
        {eyeBlink ? (
          <rect x="82" y="85" width="50" height="5" rx="2.5" fill="#ff8800" filter="url(#f_eye)"/>
        ) : (
          <>
            <rect x="82" y="78" width="50" height="20" rx="10"
              fill="url(#g_eye)" filter="url(#f_eye)"/>
            <rect x="89" y="82" width="22" height="10" rx="5" fill="#fff4aa" opacity="0.5"/>
            <circle cx="91" cy="84" r="3" fill="white" opacity="0.72"/>
          </>
        )}

        {/* ── Right eye (horizontal slot) ── */}
        {eyeBlink ? (
          <rect x="148" y="85" width="50" height="5" rx="2.5" fill="#ff8800" filter="url(#f_eye)"/>
        ) : (
          <>
            <rect x="148" y="78" width="50" height="20" rx="10"
              fill="url(#g_eye)" filter="url(#f_eye)"/>
            <rect x="155" y="82" width="22" height="10" rx="5" fill="#fff4aa" opacity="0.5"/>
            <circle cx="157" cy="84" r="3" fill="white" opacity="0.72"/>
          </>
        )}

        {/* ── Mouth ── */}
        {isSpeaking ? (
          <g>
            <rect x="122" y={121 - mouthH * 0.5} width="36" height={mouthH} rx="9" fill="#0e0700"/>
            <rect x="122" y={121 - mouthH * 0.5} width="36" height={mouthH} rx="9"
              fill="none" stroke="#ff8c00" strokeWidth="2"/>
            {mouthH > 7 && <ellipse cx="140" cy="121" rx="13" ry={mouthH * 0.4} fill="#ff9933" opacity="0.4"/>}
          </g>
        ) : isListening ? (
          <ellipse cx="140" cy="122" rx="15" ry="4.5" fill="#c06000" opacity="0.6"/>
        ) : (
          <path d="M 120 118 Q 140 134 160 118"
            fill="none" stroke="#ff8c00" strokeWidth="3.5" strokeLinecap="round"/>
        )}

        {/* ── Neck ── */}
        <rect x="122" y="168" width="36" height="26" rx="10"
          fill="url(#g_body)" stroke="#caced0" strokeWidth="1.5"/>
        {/* neck sheen */}
        <rect x="128" y="171" width="18" height="5" rx="2.5" fill="rgba(255,255,255,0.5)"/>

        {/* ── Body ── */}
        <rect x="66" y="188" width="148" height="114" rx="32"
          fill="url(#g_body)" stroke="#caced0" strokeWidth="1.5"/>
        <ellipse cx="140" cy="198" rx="56" ry="9" fill="rgba(255,255,255,0.5)"/>
        <rect x="80"  y="212" width="120" height="3" rx="1.5" fill="#ff8c00" opacity="0.18"/>

        {/* E badge */}
        <circle cx="140" cy="248" r="28" fill="#ff8c00" filter="url(#f_glow)"/>
        <circle cx="140" cy="248" r="28" fill="none" stroke="#cc5500" strokeWidth="1.5"/>
        <text x="140" y="258" textAnchor="middle" fill="#fff"
          fontSize="26" fontWeight="900" fontFamily="Arial,sans-serif">E</text>

        {/* ── Left shoulder joint ── */}
        <circle cx="70" cy="210" r="15" fill="url(#g_joint)" stroke="#b4b8cc" strokeWidth="1.5"/>
        <circle cx="70" cy="210" r="8"  fill="none" stroke="#ff8c00" strokeWidth="2.5" opacity="0.65"/>

        {/* ── Left half-arm ── */}
        <g transform="rotate(18, 70, 210)">
          <rect x="14" y="203" width="58" height="17" rx="8.5"
            fill="url(#g_arm)" stroke="#bcc0d0" strokeWidth="1.3"/>
          <ellipse cx="36" cy="211" rx="14" ry="5" fill="rgba(255,255,255,0.35)"/>
        </g>

        {/* ── Right shoulder joint ── */}
        <circle cx="210" cy="210" r="15" fill="url(#g_joint)" stroke="#b4b8cc" strokeWidth="1.5"/>
        <circle cx="210" cy="210" r="8"  fill="none" stroke="#ff8c00" strokeWidth="2.5" opacity="0.65"/>

        {/* ── Right half-arm ── */}
        <g transform="rotate(-18, 210, 210)">
          <rect x="208" y="203" width="58" height="17" rx="8.5"
            fill="url(#g_arm)" stroke="#bcc0d0" strokeWidth="1.3"/>
          <ellipse cx="234" cy="211" rx="14" ry="5" fill="rgba(255,255,255,0.35)"/>
        </g>


        {/* ── Speaking / listening ring ── */}
        {isSpeaking && (
          <rect x="50" y="34" width="180" height="144" rx="50"
            fill="none" stroke="#ff8c00" strokeWidth="3.5"
            style={{ animation: 'rPulse .65s ease-in-out infinite alternate' }}/>
        )}
        {isListening && (
          <rect x="50" y="34" width="180" height="144" rx="50"
            fill="none" stroke="#22c55e" strokeWidth="2.5"
            style={{ animation: 'rPulse 1s ease-in-out infinite alternate' }}/>
        )}

      </g>

      <style>{`
        @keyframes rPulse {
          from { opacity: 0.12; }
          to   { opacity: 0.7;  }
        }
      `}</style>
    </svg>
  )
}

export default AnimatedRobotSVG
