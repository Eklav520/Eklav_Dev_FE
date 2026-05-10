import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer, AlignmentType } from "docx";

export interface ParsedResume {
  name: string;
  contactLines: string[];
  sections: { heading: string; lines: string[] }[];
}

export const TEMPLATES = [
  { id: 1, name: "Classic",   desc: "Traditional black & white", accent: "#1a1a1a", preview: "classic"   },
  { id: 2, name: "Modern",    desc: "Clean with blue accents",   accent: "#2563eb", preview: "modern"    },
  { id: 3, name: "Executive", desc: "Corporate navy header",     accent: "#1e3a5f", preview: "executive" },
  { id: 4, name: "Creative",  desc: "Bold purple gradient",      accent: "#6f42c1", preview: "creative"  },
  { id: 5, name: "Minimal",   desc: "Ultra-clean & spacious",    accent: "#888888", preview: "minimal"   },
];

export const cleanMarkdown = (t: string): string =>
  t
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();

const SECTION_RX =
  /^(EDUCATION|EXPERIENCE|WORK|EMPLOYMENT|SKILLS|TECHNICAL|PROJECTS?|CERTIFICATIONS?|ACHIEVEMENTS?|AWARDS?|SUMMARY|OBJECTIVE|PROFILE|PROFESSIONAL|INTERNSHIP|VOLUNTEER|LANGUAGES?|REFERENCES?|CAREER|HONORS?|PUBLICATIONS?|ACTIVITIES?|CONTACT|HOBBIES?|INTERESTS?|EXTRAS?)\b/i;

const CONTACT_HEADINGS = new Set(["CONTACT INFORMATION", "CONTACT", "PERSONAL INFORMATION", "PERSONAL DETAILS"]);

export const parseResume = (text: string): ParsedResume => {
  const lines = text.split("\n");
  let name = "";
  const contactLines: string[] = [];
  const sections: { heading: string; lines: string[] }[] = [];
  let cur: { heading: string; lines: string[] } | null = null;
  let inContactSection = false;
  let pCount = 0;

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (cur && !inContactSection) cur.lines.push("");
      continue;
    }

    const mdBoldMatch = t.match(/^\*\*([^*]{2,40})\*\*\s*:?\s*$/);
    const mdHeading = mdBoldMatch?.[1]?.trim() ?? "";

    // When inside a CONTACT section, only allow known section keywords to break out
    // (prevents all-caps names like "JAGADEESH KURACHAVEDU" from creating fake sections)
    const byRx = (s: string) => SECTION_RX.test(s) && s.length < 36;
    const isSectionByKeyword =
      (mdHeading && byRx(mdHeading)) ||
      byRx(t);
    const isSectionByAllCaps =
      !inContactSection &&
      /^[A-Z][A-Z\s\/&\-]{4,}$/.test(t) && t.length < 36;
    const isSectionByColon =
      !inContactSection &&
      t.endsWith(":") && /^[A-Z]/.test(t) && t.length < 36 && pCount >= 1;

    const isSection = isSectionByKeyword || isSectionByAllCaps || isSectionByColon;

    if (isSection) {
      // Push previous section only if it has content
      if (cur && (cur.lines.some(l => l.trim()) || !inContactSection)) sections.push(cur);
      const rawHeading = mdHeading || t.replace(/\*\*/g, "").replace(/:$/, "");
      cur = { heading: rawHeading.toUpperCase(), lines: [] };
      inContactSection = CONTACT_HEADINGS.has(cur.heading);
    } else if (inContactSection) {
      // Lines inside CONTACT section → name / contactLines (not section body)
      const clean = cleanMarkdown(t);
      if (!name) name = clean;
      else if (contactLines.length < 6) contactLines.push(clean);
    } else if (pCount < 4 && !cur) {
      const clean = cleanMarkdown(t);
      if (!name) name = clean;
      else contactLines.push(clean);
      pCount++;
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  // Don't push the contact section as a body section
  if (cur && !inContactSection && cur.lines.some(l => l.trim())) sections.push(cur);

  // Deduplicate: merge sections that share the same heading
  const merged: { heading: string; lines: string[] }[] = [];
  for (const sec of sections) {
    const existing = merged.find(s => s.heading === sec.heading);
    if (existing) {
      if (existing.lines.length && sec.lines.length) existing.lines.push("");
      existing.lines.push(...sec.lines);
    } else {
      merged.push({ heading: sec.heading, lines: [...sec.lines] });
    }
  }

  // Remove any lingering empty contact sections
  const cleaned = merged.filter(s => !CONTACT_HEADINGS.has(s.heading) || s.lines.some(l => l.trim()));

  // Enforce canonical section order
  const ORDER = [
    "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "PROFILE",
    "TECHNICAL SKILLS", "SKILLS",
    "WORK EXPERIENCE", "EXPERIENCE", "EMPLOYMENT", "INTERNSHIP",
    "EDUCATION",
    "PROJECTS", "PROJECT",
    "CERTIFICATIONS", "CERTIFICATION",
    "ACHIEVEMENTS", "AWARDS", "HONORS",
    "HOBBIES & INTERESTS", "HOBBIES", "INTERESTS", "ACTIVITIES",
    "LANGUAGES", "VOLUNTEER", "REFERENCES",
  ];
  const orderIndex = (h: string) => {
    const idx = ORDER.indexOf(h);
    return idx === -1 ? 999 : idx;
  };
  cleaned.sort((a, b) => orderIndex(a.heading) - orderIndex(b.heading));

  return { name, contactLines, sections: cleaned };
};

// ─── Education entry parser (shared by PDF + DOCX) ───────────────────────────
interface EduEntry { degree: string; institution: string; years: string; gpa: string }

// Degree-level keywords used to detect start of a new education entry
const EDU_DEGREE_RX = /^(b\.?tech|m\.?tech|b\.?e\b|m\.?e\b|b\.?sc|m\.?sc|bca|mca|mba|ssc|10th|12th|intermediate|hsc|ph\.?d|diploma|b\.?com|m\.?com|bachelor|master|b\.?a\b|m\.?a\b|higher secondary|secondary school|secondary|pg |ug )/i;

const parseEduGroup = (group: string[]): EduEntry => {
  let degree = "", institution = "", years = "", gpa = "";
  for (const line of group) {
    const t = line.trim();
    if (!t) continue;
    if (/\b(gpa|cgpa|grade|percentage)\b|\d{2,3}(\.\d+)?%/i.test(t)) {
      gpa = t.replace(/^(gpa|cgpa|grade|percentage)\s*:\s*/i, "").trim();
    } else {
      const yr = t.match(/(\d{4}\s*[–\-–to]\s*(?:\d{4}|present|current)|\b\d{4}\b)/i);
      if (yr) {
        years = yr[0].trim();
        const rest = t.replace(yr[0], "").replace(/[,\s|–\-]+/g, " ").trim();
        if (rest && !institution) institution = rest;
      } else {
        if (!degree) degree = t;
        else if (!institution) institution = t;
      }
    }
  }
  return { degree, institution, years, gpa };
};

export const parseEduEntries = (lines: string[]): EduEntry[] => {
  const nonEmpty = lines.filter(l => l.trim());
  if (!nonEmpty.length) return [];

  // Try blank-line-separated groups first
  const blankGroups: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l.trim()) { if (cur.length) { blankGroups.push(cur); cur = []; } }
    else cur.push(cleanMarkdown(l.trim()));
  }
  if (cur.length) blankGroups.push(cur);

  // If only one big group (no blank separators), re-split by degree keywords
  let groups = blankGroups;
  if (blankGroups.length === 1 && blankGroups[0].length > 2) {
    const degreeGroups: string[][] = [];
    let dCur: string[] = [];
    for (const line of blankGroups[0]) {
      if (EDU_DEGREE_RX.test(line) && dCur.length) {
        degreeGroups.push(dCur);
        dCur = [line];
      } else {
        dCur.push(line);
      }
    }
    if (dCur.length) degreeGroups.push(dCur);
    if (degreeGroups.length > 1) groups = degreeGroups;
  }

  return groups.map(parseEduGroup).filter(e => e.degree);
};

const EDU_HEADINGS = new Set(["EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC QUALIFICATIONS"]);

// ─── PDF Download ────────────────────────────────────────────────────────────
export const downloadResumePdf = (
  parsed: ParsedResume,
  templateId: number,
  fileName: string
): void => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 15;
  const W = 180;
  let y = 15;
  const T = templateId;

  type RGB = [number, number, number];
  const ACCENT: RGB =
    T === 2
      ? [37, 99, 235]
      : T === 3
      ? [30, 58, 95]
      : T === 4
      ? [111, 66, 193]
      : T === 5
      ? [120, 120, 120]
      : [26, 26, 26];

  const chk = (need = 12) => {
    if (y + need > 278) {
      doc.addPage();
      y = 15;
    }
  };

  const setFont = (bold: boolean, size: number, col: RGB) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(col[0], col[1], col[2]);
  };

  const printLines = (s: string, x: number, sz: number, bold: boolean, col: RGB, maxW = W) => {
    setFont(bold, sz, col);
    const lines = doc.splitTextToSize(s.trim() || " ", maxW);
    lines.forEach((l: string) => {
      chk(sz * 0.42);
      doc.text(l, x, y);
      y += sz * 0.39;
    });
  };

  const hline = (col: RGB, lw = 0.35) => {
    doc.setDrawColor(col[0], col[1], col[2]);
    doc.setLineWidth(lw);
    doc.line(M, y, M + W, y);
  };

  // ── HEADER ──────────────────────────────────────────────────────────────────
  if (T === 3 || T === 4) {
    const barH = T === 3 ? 28 : 32;
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(0, 0, 210, barH, "F");
    y = T === 3 ? 12 : 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(parsed.name || "Resume", 105, y, { align: "center" });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(parsed.contactLines.join("  |  "), 105, y, { align: "center" });
    y = barH + 8;
  } else if (T === 2) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.setTextColor(26, 26, 26);
    doc.text(parsed.name || "Resume", M, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(parsed.contactLines.join("  |  "), M, y);
    y += 4;
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(M, y, W, 0.9, "F");
    y += 7;
  } else if (T === 5) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(26, 26, 26);
    doc.text(parsed.name || "Resume", M, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(parsed.contactLines.join("  •  "), M, y);
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(M, y, M + W, y);
    y += 7;
  } else {
    // T1 Classic
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(26, 26, 26);
    doc.text(parsed.name || "Resume", 105, y, { align: "center" });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(parsed.contactLines.join("  |  "), 105, y, { align: "center" });
    y += 5;
    hline([26, 26, 26], 0.4);
    y += 6;
  }

  // ── SECTIONS ────────────────────────────────────────────────────────────────
  for (const sec of parsed.sections) {
    chk(16);
    if (T === 1) {
      y += 3;
      printLines(sec.heading, M, 11, true, [26, 26, 26]);
      y += 1;
      hline([26, 26, 26], 0.3);
      y += 4;
    } else if (T === 2) {
      y += 3;
      doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.rect(M, y - 3.5, 2.5, 5.5, "F");
      printLines(sec.heading, M + 5, 11, true, ACCENT);
      y += 2;
    } else if (T === 3) {
      y += 3;
      printLines(sec.heading, M, 11, true, ACCENT);
      y += 1;
      hline(ACCENT, 0.4);
      y += 4;
    } else if (T === 4) {
      y += 3;
      doc.setFillColor(243, 240, 255);
      doc.rect(M - 2, y - 4.5, W + 4, 7.5, "F");
      printLines(sec.heading, M, 11, true, ACCENT);
      y += 3;
    } else {
      // Minimal
      y += 5;
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(M, y - 2, M + W, y - 2);
      printLines(sec.heading, M, 8, false, [150, 150, 150] as RGB);
      y += 3;
    }

    if (EDU_HEADINGS.has(sec.heading)) {
      // ── Education: card-style rows ─────────────────────────────────────────
      const entries = parseEduEntries(sec.lines);
      for (const e of entries) {
        chk(14);
        const rowH = 12;
        // Tinted background row
        doc.setFillColor(...(
          T === 2 ? [239, 246, 255] : T === 3 ? [238, 242, 247] : T === 4 ? [243, 240, 255] : [248, 248, 248]
        ) as [number, number, number]);
        doc.rect(M, y - 4, W, rowH, "F");
        // Left accent bar
        doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
        doc.rect(M, y - 4, 2.5, rowH, "F");

        // Degree (bold)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(26, 26, 26);
        doc.text(e.degree, M + 5, y);

        // Institution (right-aligned, italic)
        if (e.institution) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          const instText = doc.splitTextToSize(e.institution, W * 0.55);
          doc.text(instText[0], M + 5, y + 4.5);
        }

        // Year badge (right side)
        if (e.years) {
          const yr = e.years;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
          doc.text(yr, M + W - 2, y, { align: "right" });
        }

        // GPA below year
        if (e.gpa) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`GPA: ${e.gpa}`, M + W - 2, y + 4.5, { align: "right" });
        }

        y += rowH + 3;
      }
    } else {
      for (const line of sec.lines) {
        const t = line.trim();
        if (!t) {
          y += 2;
          continue;
        }
        chk(6);
        const isBullet = /^[-•*]\s/.test(t);
        const isBoldLabel = /^\*\*[^*]+\*\*/.test(t);
        const cleaned = cleanMarkdown(t);

        if (isBullet) {
          const bText = cleanMarkdown(t.replace(/^[-•*]\s/, ""));
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(60, 60, 60);
          const wrapped = doc.splitTextToSize(bText, W - 7);
          wrapped.forEach((wl: string, wi: number) => {
            chk(5);
            if (wi === 0) doc.text("•", M + 2, y);
            doc.text(wl, M + 6, y);
            y += 4.8;
          });
        } else if (isBoldLabel) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          const wrapped = doc.splitTextToSize(cleaned, W);
          wrapped.forEach((wl: string) => {
            chk(5);
            doc.text(wl, M, y);
            y += 5;
          });
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(60, 60, 60);
          const wrapped = doc.splitTextToSize(cleaned, W);
          wrapped.forEach((wl: string) => {
            chk(5);
            doc.text(wl, M, y);
            y += 4.8;
          });
        }
      }
    }
    y += 4;
  }

  doc.save(`${fileName}_template${T}.pdf`);
};

// ─── DOCX Download ───────────────────────────────────────────────────────────
export const downloadResumeDocx = async (
  parsed: ParsedResume,
  templateId: number,
  fileName: string
): Promise<void> => {
  const T = templateId;
  const ACCENT_HEX =
    T === 2 ? "2563eb" : T === 3 ? "1e3a5f" : T === 4 ? "6f42c1" : T === 5 ? "888888" : "1a1a1a";
  const ACCENT_LIGHT =
    T === 4 ? "f3f0ff" : T === 2 ? "eff6ff" : T === 3 ? "eef2f7" : "f5f5f5";

  const children: Paragraph[] = [];

  const isHeaderFilled = T === 3 || T === 4;

  // Name
  children.push(
    new Paragraph({
      alignment:
        T === 1 || isHeaderFilled ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: parsed.name || "Resume",
          bold: true,
          size: T === 5 ? 44 : 40,
          color: isHeaderFilled ? "FFFFFF" : "1a1a1a",
          font: "Calibri",
        }),
      ],
      ...(isHeaderFilled
        ? { shading: { type: "clear" as const, color: "auto", fill: ACCENT_HEX } }
        : {}),
    })
  );

  // Contact line
  if (parsed.contactLines.length) {
    children.push(
      new Paragraph({
        alignment:
          T === 1 || isHeaderFilled ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: parsed.contactLines.join("  |  "),
            size: 18,
            color: isHeaderFilled ? "DDDDDD" : "666666",
            font: "Calibri",
          }),
        ],
        ...(isHeaderFilled
          ? { shading: { type: "clear" as const, color: "auto", fill: ACCENT_HEX } }
          : {}),
      })
    );
  }

  for (const sec of parsed.sections) {
    // Section heading
    children.push(
      new Paragraph({
        spacing: { before: 280, after: 80 },
        border:
          T === 1 || T === 3
            ? { bottom: { style: "single" as const, size: 6, color: ACCENT_HEX } }
            : undefined,
        shading:
          T === 4
            ? { type: "clear" as const, color: "auto", fill: ACCENT_LIGHT }
            : undefined,
        children: [
          new TextRun({
            text: sec.heading,
            bold: true,
            size: 24,
            color: ACCENT_HEX,
            font: "Calibri",
            allCaps: T === 1 || T === 5,
          }),
        ],
      })
    );

    for (const line of sec.lines) {
      const t = line.trim();
      if (!t) {
        children.push(new Paragraph({ children: [] }));
        continue;
      }
      const isBullet = /^[-•*]\s/.test(t);
      const isBoldLabel = /^\*\*[^*]+\*\*/.test(t);
      const cleaned = cleanMarkdown(t);

      children.push(
        new Paragraph({
          ...(isBullet ? { bullet: { level: 0 } } : {}),
          spacing: { after: 50 },
          children: [
            new TextRun({
              text: isBullet ? cleanMarkdown(t.replace(/^[-•*]\s/, "")) : cleaned,
              size: 20,
              bold: isBoldLabel,
              color: isBoldLabel ? ACCENT_HEX : "333333",
              font: "Calibri",
            }),
          ],
        })
      );
    }
  }

  const docx = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}_template${T}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
