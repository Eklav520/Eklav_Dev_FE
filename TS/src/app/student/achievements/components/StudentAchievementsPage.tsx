import React, { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import { Search, SlidersHorizontal, Heart, Star, Trophy, Award, Crown, GraduationCap, Briefcase, Activity, Sparkles, BookOpen } from 'lucide-react'
import achievementsImg from '@/assets/images/Achivements.png'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const ORANGE = '#ff7a00'
const TEXT   = '#0f172a'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const ACHIEVE_STYLE: Record<string, { color: string; icon: React.ReactNode; bg: string; badgeBg: string; gradient: string }> = {
  academic:        { color: '#d97706', icon: <GraduationCap size={13} />, bg: '#fef3c7', badgeBg: '#fde68a', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  sports:          { color: '#059669', icon: <Trophy      size={13} />, bg: '#bbf7d0', badgeBg: '#86efac', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  placement:       { color: '#2563eb', icon: <Briefcase   size={13} />, bg: '#bfdbfe', badgeBg: '#93c5fd', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  extracurricular: { color: '#db2777', icon: <Sparkles    size={13} />, bg: '#fbcfe8', badgeBg: '#f9a8d4', gradient: 'linear-gradient(135deg,#ec4899,#db2777)' },
  certification:   { color: '#7c3aed', icon: <BookOpen    size={13} />, bg: '#ddd6fe', badgeBg: '#c4b5fd', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  general:         { color: '#ff7a00', icon: <Star        size={13} />, bg: '#fed7aa', badgeBg: '#fdba74', gradient: 'linear-gradient(135deg,#ff7a00,#e85d00)' },
}

const CATEGORIES = ['all', 'academic', 'placement', 'sports', 'extracurricular', 'certification', 'general']

const CAT_LABELS: Record<string, string> = {
  all: 'All', academic: 'Academic', placement: 'Placement',
  sports: 'Sports', extracurricular: 'Extracurricular',
  certification: 'Certification', general: 'General',
}


const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/* ── Trophy graphic ─────────────────────────────────────────── */
function TrophyGraphic() {
  return (
    <svg width="210" height="190" viewBox="0 0 210 190" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Confetti */}
      <rect x="18" y="10" width="10" height="10" rx="1.5" fill="#64B5F6" transform="rotate(-25 18 10)" opacity="0.95" />
      <rect x="164" y="7"  width="9"  height="9"  rx="1.5" fill="#FF7043" transform="rotate(22 164 7)"   opacity="0.95" />
      <circle cx="180" cy="44" r="5.5" fill="#81C784" opacity="0.95" />
      <rect x="177" y="80"  width="11" height="5"  rx="2.5" fill="#FFD54F" transform="rotate(42 177 80)"  opacity="0.95" />
      <circle cx="10"  cy="54" r="5"   fill="#F06292" opacity="0.95" />
      <rect x="5"   y="92"  width="8"  height="5"  rx="2.5" fill="#CE93D8" transform="rotate(-22 5 92)"    opacity="0.95" />
      <rect x="186" y="112" width="7"  height="7"  rx="1.5" fill="#4DD0E1" transform="rotate(16 186 112)" opacity="0.95" />
      <circle cx="16"  cy="116" r="4"   fill="#FF7043" opacity="0.95" />
      <rect x="26" y="148" width="6"  height="13" rx="3"   fill="#64B5F6" transform="rotate(-10 26 148)"  opacity="0.95" />
      <circle cx="170" cy="148" r="4.5"  fill="#F06292" opacity="0.95" />
      <rect x="156" y="9"  width="7"  height="7"  rx="1.5" fill="#81C784" transform="rotate(-32 156 9)"   opacity="0.95" />
      <circle cx="36"  cy="16"  r="4"   fill="#FFD54F" opacity="0.95" />
      <rect x="170" y="20"  width="6"  height="6"  rx="1"   fill="#F06292" transform="rotate(12 170 20)"  opacity="0.9"  />
      <circle cx="28"  cy="38"  r="3"   fill="#CE93D8" opacity="0.85" />
      <circle cx="188" cy="75"  r="3.5" fill="#FF7043" opacity="0.85" />
      <rect x="190" y="140" width="8" height="4" rx="2" fill="#81C784" transform="rotate(-20 190 140)" opacity="0.9" />

      {/* === TROPHY === */}

      {/* Base shadow */}
      <ellipse cx="105" cy="156" rx="46" ry="6" fill="rgba(0,0,0,0.13)" />

      {/* Base lower tier */}
      <rect x="65"  y="141" width="80" height="12" rx="6"   fill="#9A6500" />
      <rect x="65"  y="141" width="80" height="8"  rx="6"   fill="#C07800" />
      <rect x="68"  y="142" width="74" height="4"  rx="4"   fill="#E49500" />

      {/* Base upper tier */}
      <rect x="76"  y="133" width="58" height="10" rx="4"   fill="#B07200" />
      <rect x="76"  y="133" width="58" height="7"  rx="4"   fill="#D48C00" />
      <rect x="79"  y="134" width="52" height="4"  rx="3"   fill="#F0A500" />

      {/* Stem */}
      <rect x="92"  y="116" width="26" height="19" rx="3"   fill="#B07200" />
      <rect x="92"  y="116" width="26" height="13" rx="3"   fill="#D48C00" />
      <rect x="94"  y="117" width="11" height="11" rx="2"   fill="#F5B800" opacity="0.45" />

      {/* Cup body – shadow depth */}
      <path d="M 62 22 L 148 22 C 157 30,157 62,148 90 C 141 108,124 118,105 118 C 86 118,69 108,62 90 C 53 62,53 30,62 22 Z" fill="#8B6000" opacity="0.35" />

      {/* Cup body – dark gold */}
      <path d="M 64 20 L 146 20 C 154 28,155 60,146 88 C 139 106,122 116,105 116 C 88 116,71 106,64 88 C 55 60,56 28,64 20 Z" fill="#C07800" />

      {/* Cup body – mid gold */}
      <path d="M 66 20 L 144 20 C 152 27,153 58,144 86 C 137 104,121 114,105 114 C 89 114,73 104,66 86 C 57 58,58 27,66 20 Z" fill="#E09000" />

      {/* Cup body – bright gold */}
      <path d="M 68 20 L 142 20 C 149 26,150 57,142 84 C 135 102,119 112,105 112 C 91 112,75 102,68 84 C 60 57,61 26,68 20 Z" fill="#F5A800" />

      {/* Cup highlight – left sheen */}
      <path d="M 73 24 L 88 24 L 83 92 Q 75 83,73 68 Z" fill="#FFE082" opacity="0.45" />

      {/* Cup highlight – soft left glow */}
      <path d="M 75 27 C 75 24,84 21,92 21 L 91 80 C 83 78,75 67,75 56 Z" fill="#FFE082" opacity="0.25" />

      {/* Top rim */}
      <ellipse cx="105" cy="20" rx="40" ry="9"   fill="#C07800" />
      <ellipse cx="105" cy="20" rx="37" ry="7.5" fill="#E09000" />
      <ellipse cx="105" cy="20" rx="33" ry="6"   fill="#F5A800" />
      <ellipse cx="105" cy="20" rx="27" ry="4"   fill="#FFB300" />
      <ellipse cx="105" cy="20" rx="20" ry="2.5" fill="#FFD54F" opacity="0.7" />

      {/* Left handle – shadow */}
      <path d="M 68 44 C 38 44,36 94,68 94" stroke="#9A6500" strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* Left handle – mid gold */}
      <path d="M 68 44 C 42 44,40 92,68 94" stroke="#D48C00" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Left handle – highlight */}
      <path d="M 68 44 C 46 45,45 89,68 94"  stroke="#F5B800" strokeWidth="4"  fill="none" strokeLinecap="round" />

      {/* Right handle – shadow */}
      <path d="M 142 44 C 172 44,174 94,142 94" stroke="#9A6500" strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* Right handle – mid gold */}
      <path d="M 142 44 C 168 44,170 92,142 94" stroke="#D48C00" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* Star on cup (5-pointed, white) */}
      <polygon
        points="105,46 109.7,62 124,62.3 112.6,71 116.8,86.2 105,78 93.2,86.2 97.4,71 86,62.3 100.3,62"
        fill="white"
        opacity="0.96"
      />
      {/* Star soft inner glow */}
      <polygon
        points="105,51 108.5,62 120,62.2 111,69.5 114.3,80.5 105,74 95.7,80.5 99,69.5 90,62.2 101.5,62"
        fill="rgba(255,245,180,0.38)"
      />

      {/* === BANNER === */}
      {/* Banner shadow */}
      <path d="M 24 171 L 42 163 L 168 163 L 186 171 L 168 179 L 42 179 Z" fill="rgba(0,0,0,0.08)" />

      {/* Left swallowtail */}
      <path d="M 22 168 L 44 160 L 44 176 Z" fill="#9A6500" />
      <path d="M 24 168 L 44 160.5 L 44 175.5 Z" fill="#C07800" />

      {/* Right swallowtail */}
      <path d="M 188 168 L 166 160 L 166 176 Z" fill="#9A6500" />
      <path d="M 186 168 L 166 160.5 L 166 175.5 Z" fill="#C07800" />

      {/* Banner body */}
      <rect x="42" y="160" width="126" height="16" fill="#B07200" />
      <rect x="42" y="160" width="126" height="12" fill="#D08C00" />
      <rect x="42" y="161" width="126" height="7"  fill="#E8A000" />

      {/* Banner text */}
      <text
        x="105" y="171"
        textAnchor="middle"
        fill="#4A2800"
        fontSize="10.5"
        fontWeight="800"
        fontFamily='"Segoe UI", system-ui, Arial, sans-serif'
        letterSpacing="0.5"
      >
        Keep Shining! ★
      </text>
    </svg>
  )
}

/* ── Detail modal ───────────────────────────────────────────── */
function DetailModal({ item, onClose }: { item: any; onClose: () => void }) {
  const a = ACHIEVE_STYLE[item.category] || ACHIEVE_STYLE.general
  const [zoomedImg, setZoomedImg] = useState<string | null>(null)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {zoomedImg && (
        <div onClick={e => { e.stopPropagation(); setZoomedImg(null) }} style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out',
        }}>
          <img src={zoomedImg} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
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
        <div style={{ position: 'relative', background: a.gradient, minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 36px 24px' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)',
            borderRadius: '50%', width: 36, height: 36, color: '#fff',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: .6, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {a.icon} {item.category}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginLeft: 'auto' }}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1.3 }}>{item.title}</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex' }}>
          <div style={{ width: 260, flexShrink: 0, background: '#fafafa', borderRight: '1px solid #f0f0f0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              {item.studentPic
                ? <img src={item.studentPic} onClick={e => { e.stopPropagation(); setZoomedImg(item.studentPic) }} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${a.color}`, marginBottom: 10, cursor: 'zoom-in' }} />
                : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${a.color}22`, border: `3px solid ${a.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: a.color, margin: '0 auto 10px' }}>{item.studentName?.charAt(0)}</div>
              }
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{item.studentName}</div>
              {item.studentEmail && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.studentEmail}</div>}
              <div style={{ marginTop: 10, background: `${a.color}14`, color: a.color, border: `1px solid ${a.color}33`, borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, display: 'inline-block', textTransform: 'uppercase', letterSpacing: .5 }}>
                {item.category}
              </div>
            </div>
            {item.imageUrl && (
              <img src={item.imageUrl} onClick={e => { e.stopPropagation(); setZoomedImg(item.imageUrl) }} style={{ width: '100%', borderRadius: 14, objectFit: 'cover', boxShadow: '0 4px 18px rgba(0,0,0,.10)', cursor: 'zoom-in' }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: '28px 36px', overflowY: 'auto' }}>
            <div style={{ fontSize: 15, color: '#333', lineHeight: 2, wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: item.description }} />
          </div>
        </div>

        <div style={{ padding: '14px 36px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', background: '#fafafa' }}>
          <button onClick={onClose} style={{ background: a.gradient, border: 'none', borderRadius: 10, padding: '10px 28px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Achievement card ───────────────────────────────────────── */
function AchievementCard({ item, onRead, onLike, userId }: { item: any; onRead: () => void; onLike: (id: string) => void; userId?: string }) {
  const s = ACHIEVE_STYLE[item.category] || ACHIEVE_STYLE.general
  const liked = userId ? item.likes?.some((id: any) => id.toString() === userId) : false
  const likeCount = item.likes?.length || 0
  const [hov, setHov] = useState(false)
  const postedBy = item.postedBy || item.addedBy || item.publishedBy

  return (
    <div
      onClick={onRead}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${hov ? s.color + '60' : BORDER}`,
        background: '#fff', cursor: 'pointer',
        transition: 'transform .22s, box-shadow .22s, border-color .22s',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 12px 32px ${s.color}22` : '0 2px 8px rgba(0,0,0,.06)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Tinted top area with student photo */}
      <div style={{ background: s.bg, padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 108, overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -14, left: -14, width: 52, height: 52, borderRadius: '50%', background: `${s.color}22`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -10, right: -10, width: 40, height: 40, borderRadius: '50%', background: `${s.color}18`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 14, left: 18, width: 7, height: 7, borderRadius: '50%', background: s.color, opacity: 0.25, pointerEvents: 'none' }} />
        {/* Star */}
        <span style={{ position: 'absolute', top: 10, right: 12, color: s.color, opacity: 0.75 }}><Star size={18} fill={s.color} /></span>
        {/* Profile — colored outer ring + white inner ring */}
        <div style={{ borderRadius: '50%', padding: 3, background: s.color, boxShadow: `0 4px 14px ${s.color}55` }}>
          <div style={{ borderRadius: '50%', padding: 2, background: '#fff' }}>
            {item.studentPic
              ? <img src={item.studentPic} alt={item.studentName} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: s.color }}>
                  {item.studentName?.charAt(0)?.toUpperCase() || '?'}
                </div>
            }
          </div>
        </div>
      </div>

      {/* White content area */}
      <div style={{ flex: 1, padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Category + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: `${s.color}18`, color: s.color, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, border: `1px solid ${s.color}30` }}>
            #{item.category}
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </div>

        {/* Description */}
        {item.description && (
          <div style={{ fontSize: 11.5, color: GRAY, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {stripHtml(item.description)}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginTop: 'auto', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: s.color, flexShrink: 0 }}>
              {(postedBy || item.studentName)?.charAt(0)?.toUpperCase() || 'F'}
            </div>
            <span style={{ fontSize: 11, color: GRAY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              By {postedBy || item.studentName}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onLike(item._id) }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            <Heart size={13} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#94a3b8'} />
            <span style={{ fontSize: 11, fontWeight: 700, color: liked ? '#ef4444' : '#94a3b8' }}>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface TopRanker {
  _id: string
  name: string
  email: string
  profileImage: string | null
  branch: string | null
  rollNumber: string | null
  rank: number
  rankTotal: number
  score: number
  updatedAt: string | null
}

/* ── Main page ──────────────────────────────────────────────── */
export default function StudentAchievementsPage() {
  const { user } = useAuthContext()
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<any>(null)
  const [topRankers, setTopRankers] = useState<TopRanker[]>([])
  const [rankersLoading, setRankersLoading] = useState(true)
  const [achieveTab, setAchieveTab] = useState<'all' | 'institute' | 'global'>('all')
  const [mainView, setMainView] = useState<'achievements' | 'rankers'>('rankers')

  useEffect(() => {
    if (!user?.token) return
    // Fetch achievements
    fetch(`${baseURL}/api/institute/achievements`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(d => setAchievements(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch top 25 institute rankers
    fetch(`${baseURL}/dashboard/top-rankers?limit=25`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTopRankers(d.rankers || []) })
      .catch(() => {})
      .finally(() => setRankersLoading(false))
  }, [user?.token])

  const handleLike = async (id: string) => {
    if (!user?.token) return
    try {
      const res = await fetch(`${baseURL}/api/institute/achievements/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      }).then(r => r.json())
      if (res.success) {
        const uid = user.id || user.userId
        setAchievements(prev => prev.map(a =>
          a._id === id ? { ...a, likes: res.liked
            ? [...(a.likes || []), uid]
            : (a.likes || []).filter((l: any) => l.toString() !== uid)
          } : a
        ))
      }
    } catch {}
  }

  const filtered = achievements.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory
    const matchSearch = !search || a.studentName?.toLowerCase().includes(search.toLowerCase()) || a.title?.toLowerCase().includes(search.toLowerCase())
    const matchTab = achieveTab === 'all' || (achieveTab === 'global' ? a.isGlobal === true : a.isGlobal === false)
    return matchCat && matchSearch && matchTab
  }).slice(0, 25)

  const counts: Record<string, number> = { all: achievements.length }
  CATEGORIES.slice(1).forEach(c => { counts[c] = achievements.filter(a => a.category === c).length })


  return (
    <>
      <style>{`
        @keyframes ach-spin { to { transform: rotate(360deg); } }
        .ach-search:focus { outline: none; border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px rgba(255,122,0,.12) !important; }
        .ach-chip:hover { opacity: .85; }
      `}</style>

      {modal && <DetailModal item={modal} onClose={() => setModal(null)} />}

      <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

        {/* ── Main 2-column grid (banner is inside left col so sidebar aligns to top) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ minWidth: 0 }}>

            {/* ── Hero Banner ── */}
            <div style={{ background: 'linear-gradient(135deg, #ffb347 0%, #f07020 100%)', borderRadius: 20, padding: '20px 24px 0', position: 'relative', overflow: 'hidden', marginBottom: 16, minHeight: 180 }}>

              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -50, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 180, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />

              {/* Bar chart watermark */}
              <div style={{ position: 'absolute', right: 340, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: 5, opacity: 0.12, pointerEvents: 'none' }}>
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} style={{ width: 14, height: h, background: '#fff', borderRadius: '3px 3px 0 0' }} />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                {/* Left: icon + text + stats */}
                <div style={{ flex: 1, paddingBottom: 20 }}>
                  {/* Trophy badge top-left */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Trophy size={18} color="#fff" />
                  </div>

                  <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 4px', lineHeight: 1.2 }}>Student Achievements</h1>
                  <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                    Celebrating the milestones, hard work and dedication<br />of our amazing students.
                  </p>

                  {/* Stats pills — 4 fixed */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {([
                      { Icon: Trophy,       value: achievements.length,          label: 'Total Achievements'   },
                      { Icon: Star,         value: counts['general'] || 0,        label: 'General Achievements' },
                      { Icon: Activity,     value: '25',                          label: 'Top Rankers'          },
                      { Icon: Award,        value: '78%',                         label: 'Participation Rate'   },
                    ] as { Icon: React.ElementType; value: string | number; label: string }[]).map(({ Icon: PIcon, value, label }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(8px)', minWidth: 100 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <PIcon size={13} color="rgba(255,255,255,0.9)" />
                          <Activity size={11} color="rgba(255,255,255,0.6)" />
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', fontWeight: 600, marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Achievements image */}
                <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                  <img
                    src={achievementsImg}
                    alt="Achievements"
                    style={{ height: 240, width: 'auto', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
                  />
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '10px 14px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Search */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="ach-search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or title..."
                    style={{ width: 190, padding: '7px 10px 7px 28px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT, background: '#f8fafc', transition: 'border-color .2s, box-shadow .2s' }}
                  />
                </div>

                {/* Category chips — horizontal scroll */}
                <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto', alignItems: 'center', scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(cat => {
                    const s = cat === 'all' ? null : ACHIEVE_STYLE[cat]
                    const isActive = activeCategory === cat
                    const cnt = counts[cat] || 0
                    return (
                      <button
                        key={cat}
                        className="ach-chip"
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 11.5, fontWeight: isActive ? 700 : 500,
                          border: `1.5px solid ${isActive ? (s?.color || ORANGE) : BORDER}`,
                          background: isActive ? (s ? s.badgeBg : '#fff7ed') : '#fff',
                          color: isActive ? (s?.color || ORANGE) : GRAY,
                          transition: 'all .18s', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        {cat === 'all' ? '✨' : s?.icon} {CAT_LABELS[cat]} {cnt > 0 ? `(${cnt})` : ''}
                      </button>
                    )
                  })}
                </div>

                {/* Filter btn */}
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: GRAY, fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                  <SlidersHorizontal size={12} /> Filter
                </button>
              </div>
            </div>

            {/* ── Section heading + view tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: TEXT, margin: 0 }}>
                    {mainView === 'achievements' ? 'Recent Achievements' : 'Top 25 Institute Rankers'}
                  </h2>
                  <div style={{ height: 3, width: 36, background: ORANGE, borderRadius: 4 }} />
                </div>
                {mainView === 'rankers' && topRankers.length > 0 && topRankers[0].updatedAt && (
                  <span style={{ fontSize: 10, color: GRAY, background: '#f1f5f9', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>
                    Updated {new Date(topRankers[0].updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* Main view toggle */}
                <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
                  {([
                    { key: 'rankers',      icon: <Crown  size={12} />, label: 'Top 25 Rankers' },
                    { key: 'achievements', icon: <Trophy size={12} />, label: 'Achievements' },
                  ] as const).map(v => (
                    <button key={v.key} onClick={() => setMainView(v.key as 'achievements' | 'rankers')} style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, transition: 'all .18s',
                      background: mainView === v.key ? '#fff' : 'transparent',
                      color: mainView === v.key ? ORANGE : GRAY,
                      boxShadow: mainView === v.key ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>{v.icon}{v.label}</button>
                  ))}
                </div>

                {/* Achievement sub-tabs (only in achievements view) */}
                {mainView === 'achievements' && (
                  <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
                    {([
                      { key: 'all',       label: 'All' },
                      { key: 'institute', label: 'Institute' },
                      { key: 'global',    label: 'Admin Posted' },
                    ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setAchieveTab(tab.key)} style={{
                        padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 11.5, fontWeight: 700, transition: 'all .18s',
                        background: achieveTab === tab.key ? '#fff' : 'transparent',
                        color: achieveTab === tab.key ? ORANGE : GRAY,
                        boxShadow: achieveTab === tab.key ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
                      }}>{tab.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Content ── */}
            {mainView === 'rankers' ? (
              /* ── Rankers view — same card grid ── */
              rankersLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #f1f5f9', borderTop: `3px solid ${ORANGE}`, borderRadius: '50%', animation: 'ach-spin .8s linear infinite', margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Loading institute rankers…</div>
                </div>
              ) : topRankers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: ORANGE, opacity: 0.6 }}><Award size={48} /></div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', marginBottom: 6 }}>No rankings yet</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Ranks are computed nightly. Check back tomorrow.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 16 }}>
                  {topRankers.map(ranker => {
                    const RANK_PALETTE = [
                      { color: '#F59E0B', bg: '#fef3c7' }, // 1 — gold
                      { color: '#64748b', bg: '#e2e8f0' }, // 2 — silver
                      { color: '#C97B2F', bg: '#fed7aa' }, // 3 — bronze
                      { color: '#2563eb', bg: '#bfdbfe' }, // 4 — blue
                      { color: '#059669', bg: '#bbf7d0' }, // 5 — green
                      { color: '#7c3aed', bg: '#ddd6fe' }, // 6 — purple
                      { color: '#db2777', bg: '#fbcfe8' }, // 7 — pink
                      { color: '#0891b2', bg: '#a5f3fc' }, // 8 — cyan
                      { color: '#65a30d', bg: '#d9f99d' }, // 9 — lime
                      { color: '#dc2626', bg: '#fecaca' }, // 10 — red
                    ]
                    const palette = RANK_PALETTE[(ranker.rank - 1) % RANK_PALETTE.length]
                    const color = palette.color
                    const bg    = palette.bg
                    const badge = ranker.rank === 1 ? <Crown size={18} color={color} />
                                : ranker.rank === 2 ? <Trophy size={18} color={color} />
                                : ranker.rank === 3 ? <Award size={18} color={color} />
                                : <span style={{ fontSize: 11, fontWeight: 800, color }}>#{ranker.rank}</span>
                    return (
                      <div key={ranker._id} style={{ borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${color}30`, background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: `0 2px 8px ${color}18`, transition: 'transform .22s, box-shadow .22s' }}>
                        {/* Tinted top */}
                        <div style={{ background: bg, padding: '20px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 108, overflow: 'hidden' }}>
                          {/* Decorative blobs */}
                          <div style={{ position: 'absolute', top: -14, left: -14, width: 52, height: 52, borderRadius: '50%', background: `${color}22`, pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', bottom: -10, right: -10, width: 40, height: 40, borderRadius: '50%', background: `${color}18`, pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', top: 14, left: 18, width: 7, height: 7, borderRadius: '50%', background: color, opacity: 0.25, pointerEvents: 'none' }} />
                          {/* Rank icon top-right */}
                          <span style={{ position: 'absolute', top: 10, right: 12, lineHeight: 1, display: 'flex' }}>{badge}</span>
                          {/* Profile — colored outer ring + white inner ring */}
                          <div style={{ borderRadius: '50%', padding: 3, background: color, boxShadow: `0 4px 14px ${color}55` }}>
                            <div style={{ borderRadius: '50%', padding: 2, background: '#fff' }}>
                              {ranker.profileImage
                                ? <img src={ranker.profileImage} alt={ranker.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                                : <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color }}>
                                    {ranker.name.charAt(0).toUpperCase()}
                                  </div>
                              }
                            </div>
                          </div>
                        </div>
                        {/* White content — same layout as AchievementCard */}
                        <div style={{ flex: 1, padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Rank badge + score */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ background: `${color}18`, color, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.4, border: `1px solid ${color}30` }}>
                              RANK #{ranker.rank}
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{ranker.score}% score</span>
                          </div>
                          {/* Name */}
                          <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {ranker.name}
                          </div>
                          {/* Branch / roll */}
                          <div style={{ fontSize: 11.5, color: GRAY, lineHeight: 1.5 }}>
                            {ranker.branch || 'Student'}
                            {ranker.rollNumber && <span style={{ color: '#94a3b8' }}> · {ranker.rollNumber}</span>}
                          </div>
                          {/* Score bar */}
                          <div style={{ background: '#f1f5f9', borderRadius: 10, height: 4, marginTop: 2 }}>
                            <div style={{ width: `${Math.min(ranker.score, 100)}%`, height: '100%', background: color, borderRadius: 10, opacity: 0.8 }} />
                          </div>
                          {/* Footer */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 8, marginTop: 'auto', borderTop: `1px solid ${BORDER}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color, flexShrink: 0 }}>
                                {ranker.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 11, color: GRAY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                                {ranker.name.split(' ')[0]}
                              </span>
                            </div>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color, background: `${color}14`, borderRadius: 20, padding: '2px 8px', flexShrink: 0, whiteSpace: 'nowrap' }}>#{ranker.rank} of {ranker.rankTotal}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #f1f5f9', borderTop: `3px solid ${ORANGE}`, borderRadius: '50%', animation: 'ach-spin .8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Loading achievements...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 16, border: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: ORANGE, opacity: 0.6 }}><Trophy size={48} /></div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', marginBottom: 6 }}>
                  {search || activeCategory !== 'all' ? 'No achievements match your filters' : 'No achievements yet'}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, margin: '0 auto' }}>
                  {search || activeCategory !== 'all'
                    ? 'Try adjusting your search or category filter.'
                    : 'Student achievements will appear here once added by the institute.'}
                </div>
                {(search || activeCategory !== 'all') && (
                  <button onClick={() => { setSearch(''); setActiveCategory('all') }} style={{ marginTop: 16, padding: '8px 22px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 16 }}>
                  {filtered.map(item => (
                    <AchievementCard
                      key={item._id}
                      item={item}
                      onRead={() => setModal(item)}
                      onLike={handleLike}
                      userId={user?.id || user?.userId}
                    />
                  ))}
                </div>

                {/* View All */}
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <button style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: '10px 32px', fontSize: 13, fontWeight: 700, color: GRAY, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    View All Achievements →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top Rankers */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: '0 0 2px' }}>Top Rankers</h3>
                  <div style={{ fontSize: 10, color: GRAY }}>Institute leaderboard · Top 5</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>View All</button>
              </div>

              {rankersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 8 }}>
                  <div style={{ width: 18, height: 18, border: `2px solid #f1f5f9`, borderTop: `2px solid ${ORANGE}`, borderRadius: '50%', animation: 'ach-spin .8s linear infinite' }} />
                  <span style={{ fontSize: 12, color: GRAY }}>Loading rankers…</span>
                </div>
              ) : topRankers.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: ORANGE, opacity: 0.5 }}><Award size={24} /></div>
                  Ranks not yet computed.<br />Check back after the nightly update.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topRankers.slice(0, 5).map((ranker, i) => {
                    const SIDEBAR_PALETTE = ['#F59E0B','#64748b','#C97B2F','#2563eb','#059669']
                    const rc = SIDEBAR_PALETTE[i] || ORANGE
                    return (
                      <div
                        key={ranker._id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 10, background: `${rc}0d`, transition: 'background .15s' }}
                      >
                        {/* Rank badge */}
                        <div style={{ width: 26, height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: rc }}>
                          {i === 0 ? <Crown size={16} /> : i === 1 ? <Trophy size={16} /> : i === 2 ? <Award size={16} /> : <span style={{ fontSize: 11 }}>{ranker.rank}</span>}
                        </div>

                        {/* Avatar */}
                        {ranker.profileImage
                          ? <img src={ranker.profileImage} alt={ranker.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${rc}`, flexShrink: 0 }} />
                          : <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${rc}22`, border: `2px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: rc, flexShrink: 0 }}>
                              {ranker.name.charAt(0).toUpperCase()}
                            </div>
                        }

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ranker.name}</div>
                          <div style={{ fontSize: 10, color: GRAY, marginTop: 1 }}>
                            {ranker.branch ? ranker.branch : 'Score:'} <span style={{ fontWeight: 600, color: rc }}>{ranker.score}%</span>
                          </div>
                        </div>

                        {/* Score pill */}
                        <div style={{ flexShrink: 0, background: `${rc}18`, border: `1px solid ${rc}44`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: rc }}>
                          #{ranker.rank}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Achievement Categories */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: 0 }}>Achievement Categories</h3>
                <button style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CATEGORIES.slice(1).map(cat => {
                  const s = ACHIEVE_STYLE[cat]
                  const cnt = counts[cat] || 0
                  if (cnt === 0) return null
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: activeCategory === cat ? s.badgeBg : 'none', border: 'none', borderRadius: 10, padding: '6px 8px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background .18s' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: s.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                        {s.icon}
                      </div>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: TEXT }}>{CAT_LABELS[cat]}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{cnt}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Congratulations */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: '0 0 6px' }}>Congratulations! 🎉</h3>
                  <p style={{ fontSize: 12, color: GRAY, lineHeight: 1.55, margin: '0 0 14px' }}>
                    Keep up the great work and achieve more milestones.
                  </p>
                  <button style={{ background: ORANGE, border: 'none', borderRadius: 10, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,122,0,.3)' }}>
                    Share Your Achievement 🎁
                  </button>
                </div>
                <div style={{ fontSize: 42, flexShrink: 0, lineHeight: 1 }}>🎁</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
