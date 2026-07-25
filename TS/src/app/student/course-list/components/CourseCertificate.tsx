import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { FaTimes, FaDownload, FaRegCalendarAlt } from 'react-icons/fa'
import logo from '@/assets/images/logo_black.png'

interface Props {
  studentName: string
  courseName: string
  courseId: string
  studentId: string
  completionDate?: string
  onClose: () => void
}

// Stable (non-random) certificate ID derived from the course + student IDs,
// so re-downloading the same certificate always yields the same ID.
const hashSuffix = (a: string, b: string) => {
  let h = 0
  const s = `${a}${b}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return String(h % 100000).padStart(5, '0')
}

// ─── Certified seal badge (scalloped ring + laurel wreath + stars + ribbons) ─
// Classic "coin edge" technique: a ring of small overlapping circles reads as
// a smooth scalloped border, unlike a distorted sine-wave polygon (sharp gear
// teeth) which is what the first attempt produced.
const coinScallops = (cx: number, cy: number, radius: number, bumpR: number, count: number) => {
  const bumps = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    bumps.push(<circle key={i} cx={cx + radius * Math.cos(a)} cy={cy + radius * Math.sin(a)} r={bumpR} />)
  }
  return bumps
}

const starPoints = (cx: number, cy: number, rOuter: number, rInner: number) => {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

// A slim laurel branch: small tapered leaves following an arc, plus a thin
// stem tracing the same arc underneath them.
const laurelBranch = (cx: number, cy: number, startDeg: number, endDeg: number, count: number, radius: number, key: string) => {
  const arcPoint = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
  }
  const [sx, sy] = arcPoint(startDeg)
  const [ex, ey] = arcPoint(endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  const leaves = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const deg = startDeg + (endDeg - startDeg) * t
    const [x, y] = arcPoint(deg)
    const scale = 0.55 + 0.45 * t
    leaves.push(
      <ellipse
        key={`${key}-${i}`}
        cx={x} cy={y} rx={6.5 * scale} ry={2.6 * scale}
        fill="#f4c869" stroke="#c9962f" strokeWidth={0.5}
        transform={`rotate(${deg + 100} ${x} ${y})`}
      />
    )
  }
  return (
    <g>
      <path d={`M ${sx} ${sy} A ${radius} ${radius} 0 ${large} ${sweep} ${ex} ${ey}`} fill="none" stroke="#d4a24c" strokeWidth={1} />
      {leaves}
    </g>
  )
}

const CertificateBadge = ({ size = 92 }: { size?: number }) => (
  <svg viewBox="0 0 200 290" width={size} height={size * 1.45}>
    <defs>
      <radialGradient id="ringGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#f8dda0" />
        <stop offset="100%" stopColor="#c9962f" />
      </radialGradient>
      <radialGradient id="innerGrad" cx="50%" cy="32%" r="78%">
        <stop offset="0%" stopColor="#22314a" />
        <stop offset="100%" stopColor="#0b1120" />
      </radialGradient>
      <linearGradient id="ribbonL" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff9c4d" />
        <stop offset="100%" stopColor="#f2622f" />
      </linearGradient>
      <linearGradient id="ribbonR" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f2622f" />
        <stop offset="100%" stopColor="#c94d1a" />
      </linearGradient>
    </defs>

    {/* Ribbon tails — rotated OUTWARD (away from center) so the two tips
        diverge like an open "V" instead of swinging toward each other and
        crossing into an "X" (that was a rotation-sign bug in the last pass:
        for the LEFT ribbon a positive angle swings its tip further left —
        away from center — and vice versa for the right one). */}
    <g transform="translate(83,150) rotate(12)">
      <path d="M -20,0 L 20,0 L 20,100 L 0,80 L -20,100 Z" fill="url(#ribbonL)" />
      <path d="M -3,4 L 5,4 L 2,90 L -3,90 Z" fill="#00000022" />
    </g>
    <g transform="translate(117,150) rotate(-12)">
      <path d="M -20,0 L 20,0 L 20,100 L 0,80 L -20,100 Z" fill="url(#ribbonR)" />
      <path d="M -5,4 L 3,4 L -2,90 L -7,90 Z" fill="#00000022" />
    </g>

    {/* Scalloped gold outer edge (coin-edge technique) */}
    <g fill="url(#ringGrad)">{coinScallops(100, 100, 76, 13, 26)}</g>
    <circle cx={100} cy={100} r={68} fill="url(#ringGrad)" />
    {/* Thin gold ring + inner navy disc */}
    <circle cx={100} cy={100} r={80} fill="none" stroke="#e8c98a" strokeWidth={1.5} opacity={0.6} />
    <circle cx={100} cy={100} r={62} fill="url(#innerGrad)" stroke="#f4c869" strokeWidth={1.5} />

    {/* Laurel wreath */}
    {laurelBranch(100, 100, 165, 250, 6, 47, 'l')}
    {laurelBranch(100, 100, 15, -70, 6, 47, 'r')}

    {/* Stars */}
    <polygon points={starPoints(78, 62, 4, 1.6)} fill="#f4c869" />
    <polygon points={starPoints(100, 55, 5, 2)} fill="#f4c869" />
    <polygon points={starPoints(122, 62, 4, 1.6)} fill="#f4c869" />

    {/* Text */}
    <text x="100" y="96" textAnchor="middle" fill="#f4c869" fontSize="13" fontFamily="'Great Vibes', 'Playfair Display', cursive" >Eklav</text>
    <text x="100" y="113" textAnchor="middle" fill="#f8dda0" fontSize="11" fontWeight="800" letterSpacing="1.2" fontFamily="'Segoe UI', Arial, sans-serif">CERTIFIED</text>
  </svg>
)

const CourseCertificate: React.FC<Props> = ({ studentName, courseName, courseId, studentId, completionDate, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

  const dateObj = completionDate ? new Date(completionDate) : new Date()
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const isoDate = dateObj.toISOString().slice(0, 10)
  const certificateId = `EKLAV-${isoDate}-${hashSuffix(courseId, studentId)}`

  useEffect(() => {
    QRCode.toDataURL(`Eklav Certificate ${certificateId} — ${studentName} — ${courseName}`, { width: 160, margin: 0, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [certificateId, studentName, courseName])

  useEffect(() => {
    const linkId = 'eklav-cert-font'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@700;800&display=swap'
      document.head.appendChild(link)
    }
    ;(document as any).fonts?.ready?.then(() => setFontsReady(true)).catch(() => setFontsReady(true))
    const t = setTimeout(() => setFontsReady(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'pt', [960, 678])
      pdf.addImage(imgData, 'PNG', 0, 0, 960, 678)
      pdf.save(`${studentName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_Certificate.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      {/* Always-visible close button, pinned to the viewport so it stays
          reachable even when the tall certificate card is scrolled. */}
      <button
        onClick={onClose}
        title="Close"
        style={{
          position: 'fixed', top: 18, right: 22, zIndex: 501,
          width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        }}
      >
        <FaTimes size={16}/>
      </button>

      <div style={{ background: '#1e293b', borderRadius: 16, padding: 20, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>Your Certificate</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
            <FaTimes size={18}/>
          </button>
        </div>

        {/* Certificate canvas — captured by html2canvas */}
        <div style={{ overflow: 'auto', maxWidth: '90vw' }}>
          <div
            ref={certRef}
            style={{
              width: 960, height: 678, position: 'relative', background: '#fffdfb',
              fontFamily: "'Playfair Display', Georgia, serif", boxSizing: 'border-box',
              padding: 26,
            }}
          >
            {/* Outer gold border */}
            <div style={{ position: 'absolute', inset: 10, border: '2px solid #d4a24c', borderRadius: 4 }} />
            <div style={{ position: 'absolute', inset: 16, border: '1px solid #e8c98a', borderRadius: 2 }} />

            {/* Corner decorations — built in SVG (not stacked CSS clip-path
                triangles) so the thin gold "pinstripe" accent lines running
                through the navy band can be placed exactly: a line parallel
                to the corner's diagonal at any depth is simply (size,0) to
                (0,size), no rotation/trig guessing needed. Same nested-
                triangle logic as before (a smaller polygon painted later
                covers the corner-ward part of the previous one, so the
                layer meant to fill the tip — orange — is smallest/last). */}
            {[
              { corner: 'tl' as const },
              { corner: 'br' as const },
            ].map(({ corner }) => {
              const isTL = corner === 'tl'
              const posStyle: React.CSSProperties = isTL ? { top: 0, left: 0 } : { bottom: 0, right: 0 }
              const pt = (size: number) => isTL ? `${size},0 0,0 0,${size}` : `${150 - size},150 150,150 150,${150 - size}`
              const line = (size: number) => isTL ? { x1: size, y1: 0, x2: 0, y2: size } : { x1: 150 - size, y1: 150, x2: 150, y2: 150 - size }
              return (
                <svg key={corner} width="150" height="150" viewBox="0 0 150 150" style={{ position: 'absolute', ...posStyle }}>
                  <polygon points={pt(140)} fill="#d4a24c" />
                  <polygon points={pt(130)} fill="#0f172a" />
                  <polygon points={pt(106)} fill="#d4a24c" />
                  <polygon points={pt(98)} fill="#ff7a00" />
                  {/* Thin gold pinstripe accents through the navy band */}
                  <line {...line(112)} stroke="#f4c869" strokeWidth={1} />
                  <line {...line(122)} stroke="#f4c869" strokeWidth={1} />
                </svg>
              )
            })}

            {/* Small ornamental corner brackets — a hollow square with short
                tick marks, sitting at all four true corners of the frame. */}
            {[
              { top: 14, left: 14, rot: 0 },
              { top: 14, right: 14, rot: 90 },
              { bottom: 14, right: 14, rot: 180 },
              { bottom: 14, left: 14, rot: 270 },
            ].map((p, i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', ...p, transform: `rotate(${p.rot}deg)`, zIndex: 4 }}>
                <rect x="6" y="6" width="8" height="8" fill="none" stroke="#d4a24c" strokeWidth="1" />
                <line x1="0" y1="6" x2="4" y2="6" stroke="#d4a24c" strokeWidth="1" />
                <line x1="6" y1="0" x2="6" y2="4" stroke="#d4a24c" strokeWidth="1" />
              </svg>
            ))}

            {/* Ribbon top-right — SVG shape (not CSS clip-path + border,
                which can't selectively omit the top edge) so the outline
                traces only the left/right/bottom-notch edges, matching the
                reference where the top blends into the navy header bar. */}
            <div style={{ position: 'absolute', top: 0, right: 60, width: 88, height: 142, zIndex: 3 }}>
              <svg width="88" height="142" viewBox="0 0 88 142" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <linearGradient id="ribbonTopGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f8dda0" />
                    <stop offset="100%" stopColor="#cf9a3f" />
                  </linearGradient>
                </defs>
                <path d="M0,0 L88,0 L88,142 L44,120 L0,142 Z" fill="url(#ribbonTopGrad)" />
                {/* Stroke only the left / right / notch edges — no top line */}
                <path d="M0,0 L0,142 L44,120 L88,142 L88,0" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <div style={{
                position: 'relative', color: '#3a2a06', fontSize: 11, fontWeight: 700,
                textAlign: 'center', lineHeight: 1.4, padding: '13px 8px 0', fontFamily: "'Segoe UI', Arial, sans-serif",
              }}>
                ★<br/>Building<br/>Future<br/>Ready
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <svg width="9" height="9" viewBox="0 0 12 12">
                    <path d="M6,1 C9,3 9,9 6,11 C3,9 3,3 6,1 Z" fill="#3a2a06" transform="rotate(-55 6 6)" />
                  </svg>
                  Skills
                  <svg width="9" height="9" viewBox="0 0 12 12">
                    <path d="M6,1 C9,3 9,9 6,11 C3,9 3,3 6,1 Z" fill="#3a2a06" transform="rotate(55 6 6)" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
              <img src={logo} alt="Eklav" style={{ height: 42, objectFit: 'contain' }} crossOrigin="anonymous" />

              <div style={{ marginTop: 16, fontSize: 42, fontWeight: 800, letterSpacing: 6, color: '#111827' }}>CERTIFICATE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ width: 40, height: 1, background: '#ff7a00' }} />
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 4, color: '#ff7a00', fontFamily: "'Segoe UI', Arial, sans-serif" }}>OF COMPLETION</span>
                <span style={{ width: 40, height: 1, background: '#ff7a00' }} />
              </div>

              <div style={{ marginTop: 18, fontSize: 13, color: '#334155', fontFamily: "'Segoe UI', Arial, sans-serif" }}>This is to certify that</div>

              <div style={{
                marginTop: 8, fontSize: 46, color: '#ff7a00', lineHeight: 1,
                fontFamily: fontsReady ? "'Great Vibes', cursive" : "'Segoe UI', Arial, sans-serif",
                fontStyle: fontsReady ? 'normal' : 'italic',
                borderBottom: '1px dotted #cbd5e1', paddingBottom: 6, minWidth: 320, textAlign: 'center',
              }}>
                {studentName}
              </div>

              <div style={{ marginTop: 12, fontSize: 13, color: '#334155', fontFamily: "'Segoe UI', Arial, sans-serif" }}>has successfully completed the course</div>
              <div style={{ marginTop: 4, fontSize: 19, fontWeight: 800, color: '#ff7a00' }}>{courseName}</div>

              <div style={{ marginTop: 10, maxWidth: 560, textAlign: 'center', fontSize: 11.5, color: '#475569', lineHeight: 1.5, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                offered by Eklav and has demonstrated the required knowledge and skills to successfully complete all course requirements.
              </div>

              {/* Signatures + badge */}
              <div style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 60px 6px' }}>
                <div style={{ textAlign: 'center', width: 160 }}>
                  <div style={{ fontFamily: fontsReady ? "'Great Vibes', cursive" : 'inherit', fontSize: 22, color: '#111827' }}>Jagadeesh<span style={{ margin: '0 8px' }}>&amp;</span>Natraj</div>
                  <div style={{ borderTop: '1px solid #94a3b8', marginTop: 4, paddingTop: 5, fontSize: 10.5, fontWeight: 700, color: '#111827', fontFamily: "'Segoe UI', Arial, sans-serif" }}>CEO &amp; Co-Founder</div>
                  <div style={{ fontSize: 9.5, color: '#64748b', fontFamily: "'Segoe UI', Arial, sans-serif" }}>Eklav EdTech</div>
                </div>

                {/* Badge (ribbons are baked into the SVG) */}
                <div style={{ display: 'flex', flexShrink: 0, marginTop: -6 }}>
                  <CertificateBadge size={128} />
                </div>

                <div style={{ textAlign: 'center', width: 160 }}>
                  <div style={{ fontFamily: fontsReady ? "'Great Vibes', cursive" : 'inherit', fontSize: 24, color: '#111827' }}>Eklav Team</div>
                  <div style={{ borderTop: '1px solid #94a3b8', marginTop: 4, paddingTop: 5, fontSize: 10.5, fontWeight: 700, color: '#111827', fontFamily: "'Segoe UI', Arial, sans-serif" }}>Head of Learning</div>
                  <div style={{ fontSize: 9.5, color: '#64748b', fontFamily: "'Segoe UI', Arial, sans-serif" }}>Eklav EdTech</div>
                </div>
              </div>

              {/* Footer: QR + cert ID / date */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 100px 0 60px', marginTop: -16, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: 46, height: 46, border: '1.5px solid #ff7a00', borderRadius: 4, padding: 2 }} />}
                  <div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>Certificate ID</div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#ff7a00' }}>{certificateId}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,122,0,0.12)', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaRegCalendarAlt size={13}/>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: '#64748b' }}>Date of Completion</div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#ff7a00' }}>{dateStr}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ff7a00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: '0.85rem', fontWeight: 700, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1 }}
          >
            <FaDownload size={13}/> {downloading ? 'Generating…' : 'Download Certificate (PDF)'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CourseCertificate
