import React, { useState } from 'react'
import { templateList, TemplateKey } from './templateList'
import { FileText, PenLine, Eye, Download, Lightbulb, CheckCircle, Circle, ChevronDown, ArrowRight, Lock, Star } from 'lucide-react'
import { BsFileEarmarkPerson, BsBook, BsBriefcase } from 'react-icons/bs'
import TopProgressBar from './TopProgressBar'

type ModulePlan = '6months' | '12months'

type TemplateGalleryProps = {
  onSelectTemplate: (id: TemplateKey) => void
  isPending?: boolean
  hasAccess: boolean
  moduleInfo: { fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string } | null
  buyingPlan: ModulePlan | null
  selectedPlan: ModulePlan
  setSelectedPlan: (plan: ModulePlan) => void
  buyModule: (plan: ModulePlan) => void
  buyError: string | null
}

/* ── Template display config ─────────────────────────────────── */
const TEMPLATE_META: Record<TemplateKey, { label: string; category: 'ATS Friendly' | 'Modern' | 'Creative' | 'Professional' }> = {
  classic:   { label: 'Classic Clean',       category: 'ATS Friendly'  },
  modern:    { label: 'Modern Professional',  category: 'ATS Friendly'  },
  executive: { label: 'Executive Style',      category: 'ATS Friendly'  },
  elegant:   { label: 'Simple & Elegant',     category: 'Modern'        },
  creative:  { label: 'Creative Minimal',     category: 'Creative'      },
  corporate: { label: 'Two Column',           category: 'ATS Friendly'  },
  accent:    { label: 'Student Resume',       category: 'ATS Friendly'  },
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  'ATS Friendly':  { color: '#7c3aed', bg: '#f5f3ff' },
  'Modern':        { color: '#0891b2', bg: '#ecfeff' },
  'Creative':      { color: '#d97706', bg: '#fffbeb' },
  'Professional':  { color: '#059669', bg: '#f0fdf4' },
}

const ACCENTS: Record<TemplateKey, { bar: string; bg: string }> = {
  classic:   { bg: '#fafafa',  bar: '#1a1a1a' },
  modern:    { bg: '#eff6ff',  bar: '#1d4ed8' },
  executive: { bg: '#f0f4f8',  bar: '#1e2d3d' },
  elegant:   { bg: '#f8fafc',  bar: '#0f172a' },
  creative:  { bg: '#f0fdfa',  bar: '#0d9488' },
  corporate: { bg: '#f0f6ff',  bar: '#2563eb' },
  accent:    { bg: '#f0f9ff',  bar: '#0e7490' },
}

/* ── Mini preview ────────────────────────────────────────────── */
const MiniPreview: React.FC<{ id: TemplateKey }> = ({ id }) => {
  const a = ACCENTS[id]
  const isExecutive = id === 'executive'
  const isModern    = id === 'modern'
  const isCreative  = id === 'creative'
  const isCorporate = id === 'corporate'
  const isAccent    = id === 'accent'

  return (
    <div style={{ width: '100%', height: 140, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      {(isModern || isCreative) ? (
        <div style={{ background: a.bar, padding: '10px 12px 8px' }}>
          <div style={{ height: 7, width: 90, background: 'rgba(255,255,255,.9)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ height: 4, width: 55, background: 'rgba(255,255,255,.5)', borderRadius: 2, marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 5 }}>
            {[50, 38, 46].map((w, i) => <div key={i} style={{ height: 3, width: w, background: 'rgba(255,255,255,.35)', borderRadius: 2 }} />)}
          </div>
        </div>
      ) : isExecutive ? (
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '32%', background: a.bar, padding: '10px 8px', flexShrink: 0 }}>
            <div style={{ height: 7, width: '80%', background: 'rgba(255,255,255,.9)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 3, width: '60%', background: 'rgba(59,130,246,.7)', borderRadius: 2, marginBottom: 10 }} />
            {[100, 85, 90, 70].map((w, i) => <div key={i} style={{ height: 3, width: `${w}%`, background: 'rgba(255,255,255,.2)', borderRadius: 2, marginBottom: 4 }} />)}
          </div>
          <div style={{ flex: 1, padding: '10px 10px' }}>
            {['70%', '90%', '75%', '85%', '65%'].map((w, i) => (
              <div key={i} style={{ height: 3, width: w, background: i === 0 ? '#1e2d3d' : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
            ))}
          </div>
        </div>
      ) : isCorporate ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '8px 10px', borderBottom: `2px solid ${a.bar}` }}>
            <div style={{ height: 7, width: 80, background: a.bar, borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 3, width: 55, background: '#64748b', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ width: '64%', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
              {['85%', '70%', '90%', '75%'].map((w, i) => (
                <div key={i} style={{ height: 3, width: w, background: i % 3 === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
              ))}
            </div>
            <div style={{ flex: 1, padding: '8px 6px', background: '#f8fafc' }}>
              {['90%', '75%', '80%'].map((w, i) => (
                <div key={i} style={{ height: 3, width: w, background: i === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
              ))}
            </div>
          </div>
        </div>
      ) : isAccent ? (
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '30%', background: '#f0f9ff', borderRight: `2px solid ${a.bar}`, padding: '8px 6px', flexShrink: 0 }}>
            <div style={{ height: 4, width: '80%', background: a.bar, borderRadius: 2, marginBottom: 8 }} />
            {[90, 75, 85, 70].map((w, i) => <div key={i} style={{ height: 3, width: `${w}%`, background: `${a.bar}50`, borderRadius: 2, marginBottom: 4 }} />)}
          </div>
          <div style={{ flex: 1, padding: '8px' }}>
            <div style={{ height: 9, width: '75%', background: '#164e63', borderRadius: 2, marginBottom: 4 }} />
            {['90%', '75%', '85%', '70%'].map((w, i) => (
              <div key={i} style={{ height: 3, width: w, background: i === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 14px', background: a.bg }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ height: 7, width: 90, background: a.bar, borderRadius: 2, margin: '0 auto 4px' }} />
            <div style={{ height: 3, width: 130, background: '#e5e7eb', borderRadius: 2, margin: '0 auto' }} />
          </div>
          <div style={{ height: 1, background: a.bar, marginBottom: 8 }} />
          {['80%', '95%', '70%', '88%'].map((w, i) => (
            <div key={i} style={{ height: 3, width: w, background: i % 3 === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
          ))}
        </div>
      )}
      {!isExecutive && !isCorporate && !isAccent && (
        <div style={{ position: 'absolute', bottom: 7, left: 10, display: 'flex', gap: 4 }}>
          {['React', 'CSS', 'JS'].map((s, i) => (
            <span key={i} style={{ fontSize: 7, background: `${a.bar}18`, color: a.bar, border: `1px solid ${a.bar}40`, borderRadius: 20, padding: '1px 5px', fontWeight: 700 }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const FILTERS = ['All Templates', 'ATS Friendly', 'Modern', 'Creative', 'Professional'] as const
type Filter = typeof FILTERS[number]

const RESUME_TIPS = [
  'Keep your resume to 1-2 pages.',
  'Use clear headings and bullet points.',
  'Highlight your skills and achievements.',
  'Tailor your resume for each job application.',
]

const HOW_IT_WORKS = [
  { icon: <FileText size={16} />,  title: 'Choose a Template', desc: 'Pick a template that suits your profile' },
  { icon: <PenLine size={16} />,   title: 'Fill In Your Details', desc: 'Add your personal, education, skills & experience' },
  { icon: <Eye size={16} />,       title: 'Preview & Customize', desc: 'Review your resume and make changes' },
  { icon: <Download size={16} />,  title: 'Download Resume', desc: 'Download in PDF format and apply' },
]

const RESUME_TIP_ICONS = [
  <BsFileEarmarkPerson size={13} />,
  <BsBook size={13} />,
  <Star size={13} />,
  <BsBriefcase size={13} />,
]

/* ── Main component ──────────────────────────────────────────── */
const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate, isPending = false, hasAccess, moduleInfo, buyingPlan, selectedPlan, setSelectedPlan, buyModule, buyError,
}) => {
  const [hovered, setHovered] = useState<TemplateKey | null>(null)
  const [activeFilter, setActiveFilter] = useState<Filter>('All Templates')
  const [selectedKey, setSelectedKey] = useState<TemplateKey | null>(null)

  const allKeys = Object.keys(templateList) as TemplateKey[]
  const filtered = allKeys.filter(k => {
    if (activeFilter === 'All Templates') return true
    return TEMPLATE_META[k].category === activeFilter
  })

  const ORANGE = '#ff7a00'
  // Reads the same --dash-* CSS vars StudentLayout sets for dark mode
  // (light-mode values as fallback), so this page re-themes with the portal.
  // MiniPreview (the paper resume mockup) intentionally stays fixed light.
  const TEXT   = 'var(--dash-text, #0f172a)'
  const GRAY   = 'var(--dash-gray, #64748b)'
  const BORDER = 'var(--dash-border, #e2e8f0)'
  const CARD_BG = 'var(--dash-card-bg, #ffffff)'
  const PAGE_BG = 'var(--dash-page-bg, #f8fafc)'

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* ── Top header ── */}
      <div style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '20px 28px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: TEXT, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            Resume Preparation
            {!hasAccess && (
              <span title="Unlock this module, or subscribe to a full plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: ORANGE, fontSize: '0.85rem', fontWeight: 700 }}>
                <Lock size={13} />(Premium Module)
              </span>
            )}
          </h1>
          <p style={{ fontSize: '0.82rem', color: GRAY, margin: 0 }}>Choose a template, fill in your details and create your professional resume in minutes.</p>
        </div>

        {!hasAccess && (() => {
          const price6 = (moduleInfo?.plans?.['6months'] ?? 19900) / 100
          const price12 = (moduleInfo?.plans?.['12months'] ?? 34900) / 100
          const betterValue = price12 / 12 < price6 / 6
          const isBusy = buyingPlan === selectedPlan
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#fff7ed', border: '1px solid #f0d9c0', borderRadius: 10, padding: 4, flexShrink: 0 }}>
              {(['6months', '12months'] as const).map((plan) => {
                const price = plan === '6months' ? price6 : price12
                const active = selectedPlan === plan
                const highlight = plan === '12months' && betterValue
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                      padding: '6px 14px', borderRadius: 7, minWidth: 78,
                      border: active ? `1.5px solid ${ORANGE}` : '1.5px solid transparent', cursor: 'pointer',
                      background: active ? '#fff' : 'transparent',
                    }}
                  >
                    {highlight && (
                      <span style={{
                        position: 'absolute', top: -8, right: -4, background: '#16a34a', color: '#fff', fontSize: 8.5,
                        fontWeight: 700, letterSpacing: 0.2, borderRadius: 10, padding: '2px 5px', whiteSpace: 'nowrap',
                      }}>
                        BEST
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? ORANGE : '#999', whiteSpace: 'nowrap' }}>
                      {plan === '6months' ? '6 Months' : '12 Months'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>₹{price}</span>
                  </button>
                )
              })}
              <button
                onClick={() => buyModule(selectedPlan)}
                disabled={!!buyingPlan || !moduleInfo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: ORANGE, border: 'none', color: '#fff',
                  borderRadius: 7, padding: '9px 18px', fontSize: 12.5, fontWeight: 700, marginLeft: 6,
                  cursor: buyingPlan ? 'not-allowed' : 'pointer', opacity: buyingPlan && !isBusy ? 0.5 : 1,
                }}
              >
                {isBusy ? 'Processing…' : <>Buy Now <ArrowRight size={13} /></>}
              </button>
            </div>
          )
        })()}
      </div>
      {buyError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, margin: '10px 28px 0' }}>
          {buyError}
        </div>
      )}
      <TopProgressBar stage={0} templateLabel={selectedKey ? TEMPLATE_META[selectedKey].label : undefined} />

      {/* ── Body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, padding: '20px 28px', maxWidth: 1300, margin: '0 auto' }}>

        {/* ── LEFT: template grid ── */}
        <div>
          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: TEXT, margin: 0 }}>Choose a Resume Template</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: '6px 16px', fontSize: '0.78rem', fontWeight: 600, color: GRAY, cursor: 'pointer' }}>
                <Lightbulb size={14} color="#f59e0b" /> Tips for a Great Resume
              </button>
              <button
                disabled={!selectedKey}
                onClick={() => selectedKey && onSelectTemplate(selectedKey)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: selectedKey ? ORANGE : '#f1f5f9',
                  border: 'none', borderRadius: 20, padding: '8px 20px',
                  fontSize: '0.8rem', fontWeight: 700,
                  color: selectedKey ? '#fff' : '#b0b8c4',
                  cursor: selectedKey ? 'pointer' : 'not-allowed',
                  transition: 'all .2s',
                  boxShadow: selectedKey ? '0 2px 10px rgba(255,122,0,0.3)' : 'none',
                }}
              >
                {selectedKey ? 'Next: Fill Your Details' : 'Select a Template'} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${activeFilter === f ? ORANGE : BORDER}`,
                  background: activeFilter === f ? `${ORANGE}0f` : CARD_BG,
                  color: activeFilter === f ? ORANGE : GRAY,
                  fontWeight: activeFilter === f ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Pending banner */}
          {isPending && (
            <div style={{ background: '#fff7ed', border: `1px solid ${ORANGE}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#92400e' }}>
              <Lock size={15} color={ORANGE} />
              <span><strong>Trial access:</strong> You can use the <strong>Classic Clean</strong> template for free. Enroll to unlock all templates.</span>
            </div>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16 }}>
            {filtered.map(key => {
              const meta = TEMPLATE_META[key]
              const cat = CATEGORY_COLORS[meta.category]
              const isLocked = isPending && key !== 'classic'
              const isHov = hovered === key && !isLocked
              const isSelected = selectedKey === key

              return (
                <div
                  key={key}
                  onMouseEnter={() => !isLocked && setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => !isLocked && setSelectedKey(key)}
                  style={{
                    background: CARD_BG,
                    border: `1.5px solid ${isSelected ? ORANGE : isHov ? `${ORANGE}80` : BORDER}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all .22s',
                    transform: (isHov || isSelected) ? 'translateY(-4px)' : 'none',
                    boxShadow: isSelected ? `0 10px 28px rgba(255,122,0,.22)` : isHov ? `0 10px 28px rgba(255,122,0,.10)` : '0 1px 4px rgba(0,0,0,.06)',
                    opacity: isLocked ? 0.55 : 1,
                    position: 'relative',
                  }}
                >
                  {/* Selected badge */}
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: ORANGE, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={13} color="#fff" />
                    </div>
                  )}

                  {/* Lock badge */}
                  {isLocked && !isSelected && (
                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(0,0,0,0.55)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={12} color="#fff" />
                    </div>
                  )}

                  {/* Preview */}
                  <div style={{ padding: '10px 10px 0', filter: isLocked ? 'grayscale(1)' : 'none' }}>
                    <MiniPreview id={key} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: TEXT, marginBottom: 5 }}>{meta.label}</div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cat.color, background: cat.bg, borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>
                      {meta.category}
                    </span>
                    <button
                      disabled={isLocked}
                      onClick={e => { e.stopPropagation(); if (!isLocked) setSelectedKey(key) }}
                      style={{
                        width: '100%', padding: '7px', borderRadius: 8,
                        border: `1.5px solid ${isSelected ? ORANGE : isLocked ? BORDER : ORANGE}`,
                        background: isSelected ? ORANGE : isHov ? `${ORANGE}10` : CARD_BG,
                        color: isSelected ? '#fff' : isLocked ? GRAY : ORANGE,
                        fontWeight: 700, fontSize: '0.75rem',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'all .18s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}
                    >
                      {isLocked
                        ? <><Lock size={11} /> Locked</>
                        : isSelected
                        ? <><CheckCircle size={12} /> Selected</>
                        : 'Select'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* View More */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button style={{ background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 20, padding: '9px 28px', fontSize: '0.82rem', fontWeight: 600, color: GRAY, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              View More Templates <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {/* ── RIGHT sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* How It Works */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: '0 0 14px' }}>How It Works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {HOW_IT_WORKS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ORANGE}10`, border: `1px solid ${ORANGE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT, marginBottom: 2 }}>{i + 1}. {s.title}</div>
                    <div style={{ fontSize: '0.68rem', color: GRAY, lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Resume Progress */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: '0 0 14px' }}>Your Resume Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              {/* Donut */}
              <div style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
                <svg width="70" height="70">
                  <circle cx="35" cy="35" r="28" fill="none" stroke={BORDER} strokeWidth="7" />
                  <circle cx="35" cy="35" r="28" fill="none" stroke="#7c3aed" strokeWidth="7"
                    strokeDasharray={`${(40 / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                    strokeDashoffset={2 * Math.PI * 28 * 0.25} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: TEXT }}>40%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT, marginBottom: 2 }}>2 of 5 Sections Completed</div>
                {[
                  { label: 'Personal Information', done: true },
                  { label: 'Education', done: true },
                  { label: 'Skills', done: false },
                  { label: 'Experience', done: false },
                  { label: 'Projects', done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ flexShrink: 0, color: item.done ? '#10b981' : BORDER }}>
                      {item.done ? <CheckCircle size={14} /> : <Circle size={14} />}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: item.done ? TEXT : GRAY, fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button style={{ width: '100%', padding: '9px', border: `1.5px solid ${BORDER}`, borderRadius: 10, background: CARD_BG, color: TEXT, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Continue Building <ArrowRight size={14} />
            </button>
          </div>

          {/* Resume Tips */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT, margin: '0 0 14px' }}>Resume Tips</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RESUME_TIPS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, flexShrink: 0 }}>
                    {RESUME_TIP_ICONS[i]}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: GRAY, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
            <button style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', padding: '10px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All Tips <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default TemplateGallery
