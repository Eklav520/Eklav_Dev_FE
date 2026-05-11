import React from "react";

const C = "currentColor";
const base = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// 1 — Laptop with blinking cursor
export const TechCoursesIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="4" y="3" width="28" height="21" rx="2.5" stroke={C} strokeWidth="2" {...base} />
    <line x1="9" y1="11" x2="20" y2="11" stroke={C} strokeWidth="1.8" {...base}
      strokeDasharray="11" strokeDashoffset="11"
      style={{ animation: "fDraw .5s .1s ease forwards" }} />
    <line x1="9" y1="15" x2="23" y2="15" stroke={C} strokeWidth="1.8" {...base}
      strokeDasharray="14" strokeDashoffset="14"
      style={{ animation: "fDraw .5s .3s ease forwards" }} />
    <line x1="9" y1="19" x2="16" y2="19" stroke={C} strokeWidth="1.8" {...base}
      strokeDasharray="7" strokeDashoffset="7"
      style={{ animation: "fDraw .5s .5s ease forwards" }} />
    <rect x="17" y="17.5" width="1.5" height="3" rx=".5" fill={C}
      style={{ animation: "fBlink .8s .9s infinite" }} />
    <path d="M1 24l2 4h30l2-4" stroke={C} strokeWidth="2" {...base} />
    <line x1="16" y1="24" x2="20" y2="24" stroke={C} strokeWidth="2" {...base} />
  </svg>
);

// 2 — Open book with glowing lines
export const StudyMaterialIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <path d="M19 8C15 6 9 6 4 8v22c5-2 11-2 15 0" stroke={C} strokeWidth="2" {...base} />
    <path d="M19 8c4-2 10-2 15 0v22c-4-2-10-2-15 0" stroke={C} strokeWidth="2" {...base} />
    <line x1="19" y1="8" x2="19" y2="30" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="14" x2="16" y2="14" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s .0s infinite" }} />
    <line x1="9" y1="18" x2="15" y2="18" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s .4s infinite" }} />
    <line x1="9" y1="22" x2="16" y2="22" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s .8s infinite" }} />
    <line x1="22" y1="14" x2="29" y2="14" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s .2s infinite" }} />
    <line x1="22" y1="18" x2="28" y2="18" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s .6s infinite" }} />
    <line x1="22" y1="22" x2="29" y2="22" stroke={C} strokeWidth="1.5" {...base}
      style={{ animation: "fFade 2s 1.0s infinite" }} />
  </svg>
);

// 3 — Video camera with pulsing record dot
export const OnlineClassesIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="2" y="11" width="22" height="16" rx="3" stroke={C} strokeWidth="2" {...base} />
    <path d="M24 15l12-6v20l-12-6" stroke={C} strokeWidth="2" {...base} />
    <circle cx="8" cy="14" r="2.5" fill={C}
      style={{ animation: "fPulse 1.2s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
  </svg>
);

// 4 — Robot head with blinking eyes and smile
export const ChittiRoboIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="6" y="13" width="26" height="20" rx="3" stroke={C} strokeWidth="2" {...base} />
    <rect x="13" y="3" width="12" height="9" rx="2" stroke={C} strokeWidth="2" {...base} />
    <line x1="19" y1="12" x2="19" y2="13" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <circle cx="14" cy="22" r="2.5" fill={C}
      style={{ animation: "fBlink 2.8s 0s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <circle cx="24" cy="22" r="2.5" fill={C}
      style={{ animation: "fBlink 2.8s .15s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <path d="M14 28q5 4 10 0" stroke={C} strokeWidth="2" fill="none" {...base} />
    <line x1="3" y1="22" x2="6" y2="22" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="22" x2="35" y2="22" stroke={C} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5 — Envelope with flying @ symbol
export const EmailPracticeIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="3" y="9" width="32" height="22" rx="3" stroke={C} strokeWidth="2" {...base} />
    <path d="M3 12l16 11 16-11" stroke={C} strokeWidth="2" {...base} />
    <circle cx="19" cy="20" r="4" stroke={C} strokeWidth="1.5"
      style={{ animation: "fPulse 2s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <path d="M23 18q2 2 0 4" stroke={C} strokeWidth="1.5" strokeLinecap="round"
      style={{ animation: "fPulse 2s .3s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
  </svg>
);

// 6 — Microphone with bouncing equaliser bars
export const JamIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="14" y="2" width="10" height="16" rx="5" stroke={C} strokeWidth="2" {...base} />
    <path d="M7 18a12 12 0 0 0 24 0" stroke={C} strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="19" y1="30" x2="19" y2="36" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <line x1="13" y1="36" x2="25" y2="36" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <rect x="3" y="17" width="3" height="8" rx="1.5" fill={C}
      style={{ animation: "fBar .7s 0s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "bottom" }} />
    <rect x="32" y="17" width="3" height="8" rx="1.5" fill={C}
      style={{ animation: "fBar .7s .2s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "bottom" }} />
  </svg>
);

// 7 — Person silhouette + AI pulsing nodes
export const VirtualInterviewIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <circle cx="13" cy="10" r="6" stroke={C} strokeWidth="2" />
    <path d="M2 34c0-8 5-12 11-12s11 4 11 12" stroke={C} strokeWidth="2" {...base} fill="none" />
    <circle cx="30" cy="11" r="2.5" fill={C}
      style={{ animation: "fPulse 1.6s 0s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <circle cx="35" cy="20" r="2" fill={C}
      style={{ animation: "fPulse 1.6s .3s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <circle cx="29" cy="28" r="2" fill={C}
      style={{ animation: "fPulse 1.6s .6s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <line x1="30" y1="13.5" x2="34" y2="18" stroke={C} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"
      style={{ animation: "fFade 1.6s .2s infinite" }} />
    <line x1="35" y1="22" x2="31" y2="26" stroke={C} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"
      style={{ animation: "fFade 1.6s .5s infinite" }} />
  </svg>
);

// 8 — Brain with lightning bolt
export const AptitudeIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <path d="M19 4c-8 0-14 5.5-14 13 0 5.5 3.5 10 8.5 12l-.5 5h12l-.5-5C29.5 27 33 22.5 33 17c0-7.5-6-13-14-13z"
      stroke={C} strokeWidth="2" {...base} />
    <path d="M21 9l-5 10h6l-4 10" stroke={C} strokeWidth="2.2" {...base}
      style={{ animation: "fBlink 1.8s infinite" }} />
  </svg>
);

// 9 — Code brackets </> with blinking cursor
export const CodeAIIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <path d="M13 10L6 19l7 9" stroke={C} strokeWidth="2.5" {...base} />
    <path d="M25 10l7 9-7 9" stroke={C} strokeWidth="2.5" {...base} />
    <line x1="22" y1="8" x2="16" y2="30" stroke={C} strokeWidth="2" strokeLinecap="round"
      strokeDasharray="24" strokeDashoffset="24"
      style={{ animation: "fDraw 1s .6s forwards" }} />
    <rect x="17" y="17" width="2" height="5" rx="1" fill={C}
      style={{ animation: "fBlink .75s infinite" }} />
  </svg>
);

// 10 — Document with lines drawing in
export const ResumeIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <path d="M8 4h17l7 7v25H8z" stroke={C} strokeWidth="2" {...base} />
    <path d="M25 4v7h7" stroke={C} strokeWidth="2" {...base} />
    <line x1="13" y1="17" x2="25" y2="17" stroke={C} strokeWidth="1.8" strokeLinecap="round"
      strokeDasharray="12" strokeDashoffset="12"
      style={{ animation: "fDraw .5s .5s forwards" }} />
    <line x1="13" y1="21" x2="22" y2="21" stroke={C} strokeWidth="1.8" strokeLinecap="round"
      strokeDasharray="9" strokeDashoffset="9"
      style={{ animation: "fDraw .5s .7s forwards" }} />
    <line x1="13" y1="25" x2="26" y2="25" stroke={C} strokeWidth="1.8" strokeLinecap="round"
      strokeDasharray="13" strokeDashoffset="13"
      style={{ animation: "fDraw .5s .9s forwards" }} />
  </svg>
);

// 11 — Briefcase with sparkle
export const JobVacanciesIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="3" y="14" width="32" height="20" rx="3" stroke={C} strokeWidth="2" {...base} />
    <path d="M14 14V10c0-2 2-3 5-3s5 1 5 3v4" stroke={C} strokeWidth="2" {...base} />
    <line x1="3" y1="22" x2="35" y2="22" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <line x1="19" y1="18" x2="19" y2="26" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <circle cx="30" cy="8" r="1.5" fill={C}
      style={{ animation: "fPulse 1.5s infinite", transformBox: "fill-box", transformOrigin: "center" }} />
    <line x1="30" y1="4" x2="30" y2="6" stroke={C} strokeWidth="1.5" strokeLinecap="round"
      style={{ animation: "fPulse 1.5s infinite" }} />
    <line x1="30" y1="10" x2="30" y2="12" stroke={C} strokeWidth="1.5" strokeLinecap="round"
      style={{ animation: "fPulse 1.5s infinite" }} />
    <line x1="26" y1="8" x2="28" y2="8" stroke={C} strokeWidth="1.5" strokeLinecap="round"
      style={{ animation: "fPulse 1.5s infinite" }} />
    <line x1="32" y1="8" x2="34" y2="8" stroke={C} strokeWidth="1.5" strokeLinecap="round"
      style={{ animation: "fPulse 1.5s infinite" }} />
  </svg>
);

// 12 — Calendar with animated checkmark loop
export const AssessmentIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="3" y="7" width="32" height="28" rx="3" stroke={C} strokeWidth="2" {...base} />
    <line x1="3" y1="15" x2="35" y2="15" stroke={C} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="3" x2="12" y2="11" stroke={C} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="26" y1="3" x2="26" y2="11" stroke={C} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M11 25l6 6 10-11" stroke={C} strokeWidth="2.5" {...base}
      strokeDasharray="26" strokeDashoffset="26"
      style={{ animation: "fCheckLoop 3s 0.5s ease infinite" }} />
  </svg>
);
