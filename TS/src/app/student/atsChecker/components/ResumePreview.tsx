import React from "react";
import { ParsedResume, cleanMarkdown } from "./resumeTemplates";

interface ResumePreviewProps {
  parsed: ParsedResume;
  templateId: number;
}

const isBoldLine = (t: string) => /^\*\*[^*]+\*\*/.test(t.trim());
const isBulletLine = (t: string) => /^[-•*]\s/.test(t.trim());

// ── Education card parser ─────────────────────────────────────────────────────
interface EduEntry { degree: string; institution: string; years: string; gpa: string }

const parseEduEntries = (lines: string[]): EduEntry[] => {
  // Group lines by blank-line separators; each group = one qualification
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l.trim()) { if (cur.length) { groups.push(cur); cur = []; } }
    else cur.push(cleanMarkdown(l.trim()));
  }
  if (cur.length) groups.push(cur);

  return groups.map(group => {
    let degree = "", institution = "", years = "", gpa = "";
    for (const line of group) {
      if (/\b(gpa|cgpa|percentage|grade)\b|^\d{2,3}(\.\d+)?%/i.test(line)) {
        gpa = line.replace(/^(gpa|cgpa)\s*:\s*/i, "").trim();
      } else {
        const yr = line.match(/(\d{4}\s*[–\-]\s*(?:\d{4}|present|current)|\d{4})/i);
        if (yr) {
          years = yr[0].trim();
          const inst = line.replace(yr[0], "").replace(/[,\s]+$/, "").trim();
          if (!institution) institution = inst;
        } else {
          if (!degree) degree = line;
          else if (!institution) institution = line;
        }
      }
    }
    return { degree, institution, years, gpa };
  }).filter(e => e.degree);
};

const renderEduSection = (lines: string[], T: number) => {
  const entries = parseEduEntries(lines);
  // Fallback: if no structured entries parsed, just render plain lines
  if (!entries.length) {
    return (
      <div>
        {lines.map((l, i) => renderContent(l, i, T))}
      </div>
    );
  }

  const accent = T === 2 ? "#2563eb" : T === 3 ? "#1e3a5f" : T === 4 ? "#6f42c1" : T === 5 ? "#777" : "#1a1a1a";
  const accentBg = T === 2 ? "#eff6ff" : T === 3 ? "#eef2f7" : T === 4 ? "#f3f0ff" : T === 5 ? "#fafafa" : "#f8f8f8";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            background: accentBg,
            border: `1px solid ${accent}28`,
            borderLeft: `3.5px solid ${accent}`,
            borderRadius: 6,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          {/* Left: degree + institution */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 3 }}>{e.degree}</div>
            {e.institution && (
              <div style={{ fontSize: 10.5, color: "#555", fontStyle: "italic" }}>{e.institution}</div>
            )}
          </div>
          {/* Right: year badge + GPA */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {e.years && (
              <div
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: accent,
                  background: `${accent}18`,
                  padding: "2px 9px",
                  borderRadius: 20,
                  marginBottom: e.gpa ? 4 : 0,
                  whiteSpace: "nowrap",
                }}
              >
                {e.years}
              </div>
            )}
            {e.gpa && (
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                <span style={{ fontWeight: 600, color: accent }}>GPA:</span> {e.gpa}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Generic line renderer ─────────────────────────────────────────────────────
const renderContent = (line: string, idx: number, T: number) => {
  const t = line.trim();
  if (!t) return <div key={idx} style={{ height: 5 }} />;

  if (isBulletLine(t)) {
    const text = cleanMarkdown(t.replace(/^[-•*]\s/, ""));
    return (
      <div key={idx} style={{ display: "flex", gap: 7, marginBottom: 3, paddingLeft: 4 }}>
        <span style={{ color: T === 5 ? "#bbb" : "#666", flexShrink: 0, marginTop: 1 }}>•</span>
        <span style={{ fontSize: 11, color: T === 5 ? "#555" : "#444", lineHeight: 1.6 }}>{text}</span>
      </div>
    );
  }

  if (isBoldLine(t)) {
    const text = cleanMarkdown(t);
    const accentColor =
      T === 2 ? "#2563eb" : T === 3 ? "#1e3a5f" : T === 4 ? "#6f42c1" : "#1a1a1a";
    return (
      <div key={idx} style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 2, marginTop: 5 }}>
        {text}
      </div>
    );
  }

  return (
    <div key={idx} style={{ fontSize: 11, color: T === 5 ? "#555" : "#444", lineHeight: 1.6, marginBottom: 2 }}>
      {cleanMarkdown(line)}
    </div>
  );
};

// ── Detect which contact lines are "role/title" vs actual contact details ─────
const isContactDetail = (s: string) =>
  /[@+\d]/.test(s) || /linkedin|github|http|www|hyderabad|bangalore|india|city|state/i.test(s);

// ── Main component ────────────────────────────────────────────────────────────
const ResumePreview: React.FC<ResumePreviewProps> = ({ parsed, templateId: T }) => {
  const font =
    T === 1 || T === 3
      ? "Georgia, 'Times New Roman', serif"
      : T === 5
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : '"Segoe UI", Arial, sans-serif';

  const paper: React.CSSProperties = {
    background: "#fff",
    color: "#222",
    padding: "36px 40px",
    fontFamily: font,
    fontSize: 11,
    lineHeight: 1.5,
    minHeight: "100%",
    width: "100%",
    boxSizing: "border-box",
  };

  // Split contactLines into role/title lines and actual contact detail lines
  const titleLines = parsed.contactLines.filter(l => !isContactDetail(l));
  const detailLines = parsed.contactLines.filter(l => isContactDetail(l));
  const titleStr = titleLines.join("  |  ");
  const contactStr = detailLines.join("  |  ") || parsed.contactLines.join("  |  ");

  // ── Header ──────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (T === 3) {
      return (
        <div style={{ background: "#1e3a5f", margin: "-36px -40px 24px", padding: "28px 40px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: titleStr ? 3 : 6, letterSpacing: 0.5, fontFamily: font }}>{parsed.name || "Resume"}</div>
          {titleStr && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 500, marginBottom: 5 }}>{titleStr}</div>}
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 0.3 }}>{contactStr}</div>
        </div>
      );
    }

    if (T === 4) {
      return (
        <div style={{ background: "linear-gradient(120deg, #6f42c1, #9b6fd4)", margin: "-36px -40px 24px", padding: "28px 40px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: titleStr ? 3 : 6, letterSpacing: 0.5 }}>{parsed.name || "Resume"}</div>
          {titleStr && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 500, marginBottom: 5 }}>{titleStr}</div>}
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", letterSpacing: 0.3 }}>{contactStr}</div>
        </div>
      );
    }

    if (T === 2) {
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 23, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{parsed.name || "Resume"}</div>
          {titleStr && <div style={{ fontSize: 11, color: "#444", fontWeight: 500, marginBottom: 4 }}>{titleStr}</div>}
          <div style={{ fontSize: 10.5, color: "#777", marginBottom: 9 }}>{contactStr}</div>
          <div style={{ height: 3, background: "#2563eb", borderRadius: 2 }} />
        </div>
      );
    }

    if (T === 5) {
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 300, color: "#111", marginBottom: 2, letterSpacing: -0.5 }}>{parsed.name || "Resume"}</div>
          {titleStr && <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{titleStr}</div>}
          <div style={{ fontSize: 10.5, color: "#999", marginBottom: 12 }}>{detailLines.join("  •  ") || contactStr}</div>
          <div style={{ height: 1, background: "#e0e0e0" }} />
        </div>
      );
    }

    // T1 Classic — centered
    return (
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{parsed.name || "Resume"}</div>
        {titleStr && <div style={{ fontSize: 11, color: "#444", fontWeight: 500, marginBottom: 4 }}>{titleStr}</div>}
        <div style={{ fontSize: 10.5, color: "#666", marginBottom: 9 }}>{contactStr}</div>
        <div style={{ height: 1.5, background: "#1a1a1a" }} />
      </div>
    );
  };

  // ── Section heading ──────────────────────────────────────────────────────────
  const renderHeading = (heading: string) => {
    if (T === 1) {
      return (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", borderBottom: "1.5px solid #1a1a1a", paddingBottom: 3, marginTop: 18, marginBottom: 7, letterSpacing: 1.2 }}>
          {heading}
        </div>
      );
    }
    if (T === 2) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 7 }}>
          <div style={{ width: 3.5, height: 15, background: "#2563eb", borderRadius: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: 0.5 }}>{heading}</div>
        </div>
      );
    }
    if (T === 3) {
      return (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a5f", borderBottom: "1.5px solid #1e3a5f", paddingBottom: 3, marginTop: 18, marginBottom: 7 }}>
          {heading}
        </div>
      );
    }
    if (T === 4) {
      return (
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6f42c1", background: "#f3f0ff", padding: "5px 10px", borderRadius: 5, marginTop: 18, marginBottom: 7, display: "inline-block", width: "100%", boxSizing: "border-box" as const }}>
          {heading}
        </div>
      );
    }
    return (
      <div style={{ marginTop: 22, marginBottom: 7 }}>
        <div style={{ height: 1, background: "#e5e5e5", marginBottom: 6 }} />
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.8 }}>{heading}</div>
      </div>
    );
  };

  const EDU_HEADINGS = new Set(["EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC QUALIFICATIONS"]);

  return (
    <div style={paper}>
      {renderHeader()}
      {parsed.sections.map((sec, si) => (
        <div key={si}>
          {renderHeading(sec.heading)}
          {EDU_HEADINGS.has(sec.heading)
            ? renderEduSection(sec.lines, T)
            : sec.lines.map((line, li) => renderContent(line, li, T))
          }
        </div>
      ))}
    </div>
  );
};

export default ResumePreview;
