import React, { useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/* ── type configs ──────────────────────────────────────────── */
const ANNOUNCE_STYLE: Record<string, { border: string; badge: string; badgeBg: string; icon: string; headerBg: string }> = {
  urgent:  { border: '#ef4444', badge: '#ef4444', badgeBg: 'rgba(239,68,68,.12)',  icon: '🚨', headerBg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  event:   { border: '#3b82f6', badge: '#3b82f6', badgeBg: 'rgba(59,130,246,.12)', icon: '📅', headerBg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  holiday: { border: '#10b981', badge: '#10b981', badgeBg: 'rgba(16,185,129,.12)', icon: '🎉', headerBg: 'linear-gradient(135deg,#10b981,#059669)' },
  info:    { border: '#ff7a00', badge: '#ff7a00', badgeBg: 'rgba(255,122,0,.12)',  icon: '📢', headerBg: 'linear-gradient(135deg,#ff7a00,#e85d00)' },
  general: { border: '#8b5cf6', badge: '#8b5cf6', badgeBg: 'rgba(139,92,246,.12)', icon: '📌', headerBg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
}

const ACHIEVE_STYLE: Record<string, { color: string; icon: string; bg: string }> = {
  academic:        { color: '#f59e0b', icon: '🎓', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  sports:          { color: '#10b981', icon: '🏆', bg: 'linear-gradient(135deg,#10b981,#059669)' },
  placement:       { color: '#3b82f6', icon: '💼', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  extracurricular: { color: '#ec4899', icon: '🌟', bg: 'linear-gradient(135deg,#ec4899,#db2777)' },
  certification:   { color: '#8b5cf6', icon: '📜', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  general:         { color: '#ff7a00', icon: '⭐', bg: 'linear-gradient(135deg,#ff7a00,#e85d00)' },
}

/* ── Detail modal (3/4 screen) ─────────────────────────────── */
function DetailModal({ item, type, onClose }: { item: any; type: 'announce' | 'achieve'; onClose: () => void }) {
  const s = type === 'announce' ? ANNOUNCE_STYLE[item.type] || ANNOUNCE_STYLE.general : null
  const a = type === 'achieve'  ? ACHIEVE_STYLE[item.category] || ACHIEVE_STYLE.general : null
  const accentBg = s ? s.headerBg : a!.bg
  const icon     = s ? s.icon     : a!.icon
  const [zoomedImg, setZoomedImg] = useState<string | null>(null)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* ── Image zoom overlay ── */}
      {zoomedImg && (
        <div onClick={e => { e.stopPropagation(); setZoomedImg(null) }} style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out',
        }}>
          <img src={zoomedImg} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,.6)', objectFit: 'contain' }} />
          <button onClick={e => { e.stopPropagation(); setZoomedImg(null) }} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
            borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}
      <div onClick={e => e.stopPropagation()} style={{
        width: '75vw', maxHeight: '88vh',
        background: '#fff', borderRadius: 24,
        overflowX: 'hidden', overflowY: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 100px rgba(0,0,0,.3)',
      }}>

        {/* ── Hero banner ── */}
        <div style={{ position: 'relative', background: accentBg, minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 36px 24px' }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />

          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)',
            borderRadius: '50%', width: 36, height: 36, color: '#fff',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>×</button>

          {/* Badge + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: .6, textTransform: 'uppercase', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)' }}>
              {icon} {type === 'announce' ? item.type : item.category}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginLeft: 'auto' }}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1.3 }}>{item.title}</h2>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex' }}>

          {/* Left pane – image / student card */}
          {(item.imageUrl || type === 'achieve') && (
            <div style={{ width: 260, flexShrink: 0, background: '#fafafa', borderRight: '1px solid #f0f0f0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowX: 'hidden' }}>
              {type === 'achieve' && (
                <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                  {item.studentPic
                    ? <img src={item.studentPic} onClick={e => { e.stopPropagation(); setZoomedImg(item.studentPic) }} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${a?.color}`, marginBottom: 10, cursor: 'zoom-in' }} />
                    : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${a?.color}22`, border: `3px solid ${a?.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: a?.color, margin: '0 auto 10px' }}>{item.studentName?.charAt(0)}</div>
                  }
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{item.studentName}</div>
                  {item.studentEmail && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.studentEmail}</div>}
                  <div style={{ marginTop: 10, background: `${a?.color}14`, color: a?.color, border: `1px solid ${a?.color}33`, borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, display: 'inline-block', textTransform: 'uppercase', letterSpacing: .5 }}>
                    {item.category}
                  </div>
                </div>
              )}
              {item.imageUrl && (
                <img src={item.imageUrl} onClick={e => { e.stopPropagation(); setZoomedImg(item.imageUrl) }} style={{ width: '100%', borderRadius: 14, objectFit: 'cover', boxShadow: '0 4px 18px rgba(0,0,0,.10)', cursor: 'zoom-in', transition: 'transform .2s', }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              )}
            </div>
          )}

          {/* Right pane – rich text */}
          <div style={{ flex: 1, minWidth: 0, padding: '28px 36px', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ fontSize: 15, color: '#333', lineHeight: 2, fontFamily: 'inherit', wordBreak: 'break-word', overflowWrap: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: item.description }} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 36px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', background: '#fafafa' }}>
          <button onClick={onClose} style={{ background: accentBg, border: 'none', borderRadius: 10, padding: '10px 28px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Type decoration config ────────────────────────────────── */
const TYPE_DECOS: Record<string, { emojis: string[]; bg: string; solid: string }> = {
  urgent:  { emojis: ['🚨','⚡','🔥'], bg: 'linear-gradient(145deg,#ef4444,#b91c1c)', solid: '#ef4444' },
  event:   { emojis: ['🎉','🎊','🥂'], bg: 'linear-gradient(145deg,#3b82f6,#1d4ed8)', solid: '#3b82f6' },
  holiday: { emojis: ['🌸','🌺','🌼'], bg: 'linear-gradient(145deg,#ec4899,#be185d)', solid: '#ec4899' },
  info:    { emojis: ['📢','💡','✨'], bg: 'linear-gradient(145deg,#f59e0b,#b45309)', solid: '#f59e0b' },
  general: { emojis: ['⭐','🌟','💫'], bg: 'linear-gradient(145deg,#8b5cf6,#6d28d9)', solid: '#8b5cf6' },
}

/* ── Banner: Wave ──────────────────────────────────────────── */
function BannerWave({ item, onRead }: { item: any; onRead: () => void }) {
  const d = TYPE_DECOS[item.type] || TYPE_DECOS.general
  return (
    <div onClick={onRead}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 48px rgba(0,0,0,.18)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 6px 24px rgba(0,0,0,.10)' }}
      style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 230, display: 'flex', flexDirection: 'row', boxShadow: '0 6px 24px rgba(0,0,0,.10)', transition: 'transform .22s, box-shadow .22s' }}
    >
      {/* Left: image panel */}
      <div style={{ width: 220, flexShrink: 0, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' }} />
        {item.imageUrl
          ? <img src={item.imageUrl} style={{ width: 155, height: 195, objectFit: 'cover', borderRadius: 16, border: '3px solid #fff', boxShadow: '0 6px 22px rgba(0,0,0,.14)', position: 'relative', zIndex: 1 }} />
          : <span style={{ fontSize: 60, position: 'relative', zIndex: 1, opacity: .25 }}>{d.emojis[0]}</span>
        }
      </div>
      {/* Right: colored content panel */}
      <div style={{ flex: 1, background: d.bg, padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 22, opacity: .5, pointerEvents: 'none' }}>{d.emojis[1]}</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(255,255,255,.22)', color: '#fff', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '2px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>{d.emojis[0]} {item.type}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginLeft: 'auto' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {item.subtitle && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>{item.subtitle}</div>}
          <div className="ek-clamp ek-clamp-2" style={{ fontWeight: 800, fontSize: 19, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,.15)' }}>{item.title}</div>
          {item.description && <div className="ek-clamp ek-clamp-3" style={{ fontSize: 13, color: 'rgba(255,255,255,.82)', marginTop: 6, maxHeight: 62 }}>{stripHtml(item.description)}</div>}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.22)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '6px 18px', width: 'fit-content' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Read more →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Banner: Bold ──────────────────────────────────────────── */
function BannerBold({ item, onRead }: { item: any; onRead: () => void }) {
  const d = TYPE_DECOS[item.type] || TYPE_DECOS.general
  return (
    <div onClick={onRead}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 20px 48px ${d.solid}44` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = `0 6px 24px ${d.solid}28` }}
      style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 230, display: 'flex', flexDirection: 'row', boxShadow: `0 6px 24px ${d.solid}28`, transition: 'transform .22s, box-shadow .22s' }}
    >
      {/* Left: image panel */}
      <div style={{ width: 220, flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {item.imageUrl
          ? <img src={item.imageUrl} style={{ width: 155, height: 195, objectFit: 'cover', borderRadius: 16, border: '3px solid #fff', boxShadow: '0 6px 22px rgba(0,0,0,.14)' }} />
          : <span style={{ fontSize: 64, opacity: .2 }}>{d.emojis[0]}</span>
        }
      </div>
      {/* Right: colored content panel */}
      <div style={{ flex: 1, background: d.bg, padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', fontSize: 90, opacity: .10, lineHeight: 1, right: -10, bottom: -10, pointerEvents: 'none', userSelect: 'none' }}>{d.emojis[0]}</span>
        <span style={{ position: 'absolute', top: 10, right: 14, fontSize: 20, opacity: .6, pointerEvents: 'none' }}>{d.emojis[1]}</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: 'rgba(255,255,255,.22)', color: '#fff', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '2px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .7, textTransform: 'uppercase' }}>{item.type}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginLeft: 'auto' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {item.subtitle && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>{item.subtitle}</div>}
          <div className="ek-clamp ek-clamp-2" style={{ fontWeight: 900, fontSize: 20, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 6px rgba(0,0,0,.15)' }}>{item.title}</div>
          {item.description && <div className="ek-clamp ek-clamp-3" style={{ fontSize: 12, color: 'rgba(255,255,255,.78)', marginTop: 6, maxHeight: 56 }}>{stripHtml(item.description)}</div>}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '6px 20px', width: 'fit-content' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>More Info →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Banner: Dark ──────────────────────────────────────────── */
function BannerDark({ item, onRead }: { item: any; onRead: () => void }) {
  const d = TYPE_DECOS[item.type] || TYPE_DECOS.general
  return (
    <div onClick={onRead}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 48px rgba(0,0,0,.35)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 6px 24px rgba(0,0,0,.20)' }}
      style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 230, display: 'flex', flexDirection: 'row', boxShadow: '0 6px 24px rgba(0,0,0,.20)', transition: 'transform .22s, box-shadow .22s' }}
    >
      {/* Left: image panel */}
      <div style={{ width: 220, flexShrink: 0, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {item.imageUrl
          ? <img src={item.imageUrl} style={{ width: 155, height: 195, objectFit: 'cover', borderRadius: 16, border: '3px solid rgba(255,255,255,.35)', boxShadow: '0 6px 22px rgba(0,0,0,.35)', position: 'relative', zIndex: 1 }} />
          : <span style={{ fontSize: 60, filter: `drop-shadow(0 0 20px ${d.solid})`, opacity: .6 }}>{d.emojis[0]}</span>
        }
      </div>
      {/* Right: dark colored content panel */}
      <div style={{ flex: 1, background: 'linear-gradient(145deg,#1e293b,#0f172a)', padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, borderRadius: '50%', background: d.solid, filter: 'blur(50px)', opacity: .25, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 20, opacity: .5, pointerEvents: 'none' }}>{d.emojis[2]}</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: `${d.solid}28`, color: d.solid, border: `1px solid ${d.solid}55`, borderRadius: 20, padding: '2px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase' }}>{d.emojis[0]} {item.type}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginLeft: 'auto' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {item.subtitle && <div style={{ fontSize: 11, fontWeight: 600, color: d.solid, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>{item.subtitle}</div>}
          <div className="ek-clamp ek-clamp-2" style={{ fontWeight: 800, fontSize: 17, color: '#f1f5f9', lineHeight: 1.3 }}>{item.title}</div>
          {item.description && <div className="ek-clamp ek-clamp-3" style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 5, maxHeight: 56 }}>{stripHtml(item.description)}</div>}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', background: `${d.solid}22`, border: `1.5px solid ${d.solid}66`, borderRadius: 20, padding: '5px 16px', width: 'fit-content' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.solid }}>Read more →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Banner: Minimal ───────────────────────────────────────── */
function BannerMinimal({ item, onRead }: { item: any; onRead: () => void }) {
  const d = TYPE_DECOS[item.type] || TYPE_DECOS.general
  return (
    <div onClick={onRead}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 40px ${d.solid}33` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 18px rgba(0,0,0,.08)' }}
      style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 230, display: 'flex', flexDirection: 'row', boxShadow: '0 4px 18px rgba(0,0,0,.08)', transition: 'transform .22s, box-shadow .22s' }}
    >
      {/* Left: image panel */}
      <div style={{ width: 220, flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRight: `4px solid ${d.solid}` }}>
        {item.imageUrl
          ? <img src={item.imageUrl} style={{ width: 155, height: 195, objectFit: 'cover', borderRadius: 16, border: '3px solid #fff', boxShadow: '0 6px 22px rgba(0,0,0,.14)' }} />
          : <span style={{ fontSize: 58, opacity: .2 }}>{d.emojis[0]}</span>
        }
      </div>
      {/* Right: colored content panel */}
      <div style={{ flex: 1, background: d.bg, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -25, right: -25, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', top: 14, right: 16, fontSize: 18, opacity: .55, pointerEvents: 'none' }}>{d.emojis[2]}</span>
        <span style={{ position: 'absolute', bottom: 14, right: 48, fontSize: 16, opacity: .45, pointerEvents: 'none' }}>{d.emojis[1]}</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(255,255,255,.22)', color: '#fff', border: '1px solid rgba(255,255,255,.35)', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase' }}>{d.emojis[0]} {item.type}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginLeft: 'auto' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {item.subtitle && <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.85)', letterSpacing: .4, marginBottom: 4 }}>{item.subtitle}</div>}
          <div className="ek-clamp ek-clamp-2" style={{ fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,.12)' }}>{item.title}</div>
          {item.description && <div className="ek-clamp ek-clamp-3" style={{ fontSize: 12, color: 'rgba(255,255,255,.78)', marginTop: 4, maxHeight: 56 }}>{stripHtml(item.description)}</div>}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 20, padding: '5px 14px', width: 'fit-content' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Read more →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Announcement card (template dispatcher) ───────────────── */
function AnnouncementCard({ item, onRead }: { item: any; onRead: () => void }) {
  switch (item.template) {
    case 'wave':    return <BannerWave    item={item} onRead={onRead} />
    case 'bold':    return <BannerBold    item={item} onRead={onRead} />
    case 'dark':    return <BannerDark    item={item} onRead={onRead} />
    case 'minimal': return <BannerMinimal item={item} onRead={onRead} />
    default:        return <BannerMinimal item={item} onRead={onRead} />
  }
}

/* ── Achievement card ──────────────────────────────────────── */
function AchievementCard({ item, onRead }: { item: any; onRead: () => void }) {
  const s = ACHIEVE_STYLE[item.category] || ACHIEVE_STYLE.general
  return (
    <div
      onClick={onRead}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 20px 48px ${s.color}44` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = `0 6px 24px ${s.color}28` }}
      style={{ borderRadius: 20, overflow: 'hidden', boxShadow: `0 6px 24px ${s.color}28`, display: 'flex', flexDirection: 'row', height: 230, cursor: 'pointer', transition: 'transform .22s, box-shadow .22s' }}
    >
      {/* Left: student photo on gradient */}
      <div style={{ width: 220, flexShrink: 0, background: s.bg, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '20px 16px' }}>
        <div style={{ position: 'absolute', top: -25, left: -25, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', top: 12, right: 14, fontSize: 20, opacity: .65, pointerEvents: 'none' }}>{s.icon}</span>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {item.studentPic
            ? <img src={item.studentPic} alt={item.studentName} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,.7)', boxShadow: '0 6px 20px rgba(0,0,0,.25)' }} />
            : <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.22)', border: '3px solid rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}>
                {item.studentName?.charAt(0)?.toUpperCase() || '?'}
              </div>
          }
          <span style={{ position: 'absolute', bottom: -2, right: -2, background: '#fff', border: `2px solid ${s.color}`, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</span>
        </div>

        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,.25)', position: 'relative', zIndex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.studentName}</div>
        {item.studentEmail && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.studentEmail}</div>}
      </div>

      {/* Right: white content panel */}
      <div style={{ flex: 1, background: '#fff', padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`, borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .7, textTransform: 'uppercase' }}>
              {s.icon} {item.category}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="ek-clamp ek-clamp-2" style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', lineHeight: 1.3, marginBottom: 8 }}>
            {item.title}
          </div>
          {item.description && (
            <div className="ek-clamp ek-clamp-3" style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxHeight: 62 }}>
              {stripHtml(item.description)}
            </div>
          )}
        </div>
        <div style={{ display: 'inline-flex', background: s.bg, borderRadius: 20, padding: '6px 18px', width: 'fit-content', boxShadow: `0 3px 12px ${s.color}44` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>View Details →</span>
        </div>
      </div>
    </div>
  )
}

/* ── Carousel hook ─────────────────────────────────────────── */
function useCarousel(total: number, groupSize: number, interval = 4000) {
  const [idx, setIdx] = useState(0)
  const timer = useRef<any>(null)
  const totalGroups = Math.ceil(total / groupSize)

  // Reset to slide 0 whenever the dataset changes (e.g. tab switch)
  useEffect(() => { setIdx(0) }, [total, groupSize])

  const next = () => setIdx(i => (i + 1) % totalGroups)
  const prev = () => setIdx(i => (i - 1 + totalGroups) % totalGroups)

  useEffect(() => {
    if (totalGroups <= 1) return
    timer.current = setInterval(next, interval)
    return () => clearInterval(timer.current)
  }, [total, groupSize, totalGroups])

  const pause  = () => clearInterval(timer.current)
  const resume = () => { if (totalGroups > 1) timer.current = setInterval(next, interval) }

  return { idx, setIdx, next, prev, totalGroups, pause, resume }
}

/* ── Carousel panel ────────────────────────────────────────── */
function CarouselPanel({ items, type, groupSize }: {
  items: any[]
  type: 'announce' | 'achieve'
  groupSize: number
}) {
  const { idx, setIdx, next, prev, totalGroups, pause, resume } = useCarousel(items.length, groupSize)
  const [modal, setModal] = useState<any>(null)
  const group = items.slice(idx * groupSize, idx * groupSize + groupSize)

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#ccc', fontSize: 14 }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{type === 'announce' ? '📢' : '🏆'}</div>
      No {type === 'announce' ? 'announcements' : 'achievements'} yet
    </div>
  )

  return (
    <>
      {modal && <DetailModal item={modal} type={type} onClose={() => setModal(null)} />}

      <div onMouseEnter={pause} onMouseLeave={resume} style={{ position: 'relative', padding: '0 36px' }}>
        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: groupSize === 2 ? '1fr 1fr' : groupSize === 3 ? 'repeat(3,1fr)' : 'minmax(0,840px)',
          gap: 20,
          justifyContent: 'center',
          width: '100%',
        }}>
          {group.map((item: any) => (
            <div key={item._id} style={{ minWidth: 0, overflow: 'hidden' }}>
              {type === 'announce'
                ? <AnnouncementCard item={item} onRead={() => setModal(item)} />
                : <AchievementCard  item={item} onRead={() => setModal(item)} />
              }
            </div>
          ))}
        </div>

        {/* Arrows */}
        {totalGroups > 1 && (
          <>
            <button onClick={prev} style={arrowBtn('left')}>‹</button>
            <button onClick={next} style={arrowBtn('right')}>›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {totalGroups > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {Array.from({ length: totalGroups }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 24 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
              background: i === idx ? '#ff7a00' : '#e5e7eb',
              transition: 'all .3s',
            }} />
          ))}
        </div>
      )}
    </>
  )
}

const arrowBtn = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute',
  top: '45%',
  [side]: -4,
  transform: 'translateY(-50%)',
  background: '#fff',
  border: '1.5px solid #e5e7eb',
  borderRadius: '50%',
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 22,
  color: '#ff7a00',
  boxShadow: '0 2px 10px rgba(0,0,0,.12)',
  zIndex: 2,
  lineHeight: 1,
})

/* ── Main section ──────────────────────────────────────────── */
export default function AnnouncementsAchievementsSection() {
  const { user } = useAuthContext()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [achievements,  setAchievements]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'announcements' | 'achievements'>('announcements')

  useEffect(() => {
    if (!user?.token) return
    const h = { Authorization: `Bearer ${user.token}` }
    Promise.all([
      fetch(`${baseURL}/api/institute/announcements`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/api/institute/achievements`,  { headers: h }).then(r => r.json()),
    ]).then(([a, b]) => {
      setAnnouncements(a.data || [])
      setAchievements(b.data  || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.token])

  const active = tab === 'announcements' ? announcements : achievements
  const groupSize = active.length >= 6 ? 3 : active.length >= 3 ? 2 : 1

  if (!loading && announcements.length === 0 && achievements.length === 0) return null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      padding: '28px 32px',
      boxShadow: '0 4px 24px rgba(0,0,0,.06)',
      marginTop: 24,
      border: '2px solid #ff7a00',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ek-clamp { display: -webkit-box !important; -webkit-box-orient: vertical !important; overflow: hidden; }
        .ek-clamp-2 { -webkit-line-clamp: 2; }
        .ek-clamp-3 { -webkit-line-clamp: 3; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>📣 Announcements & Achievements</h2>
          <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>Stay updated with the latest from your institute</p>
        </div>

        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, gap: 4 }}>
          {(['announcements', 'achievements'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'all .2s',
              background: tab === t ? '#ff7a00' : 'transparent',
              color: tab === t ? '#fff' : '#888',
              boxShadow: tab === t ? '0 2px 8px rgba(255,122,0,.3)' : 'none',
            }}>
              {t === 'announcements' ? `📢 Announcements (${announcements.length})` : `🏆 Achievements (${achievements.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f3f4f6', borderTop: '3px solid #ff7a00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading...
        </div>
      ) : (
        <CarouselPanel
          items={active}
          type={tab === 'announcements' ? 'announce' : 'achieve'}
          groupSize={groupSize}
        />
      )}
    </div>
  )
}
