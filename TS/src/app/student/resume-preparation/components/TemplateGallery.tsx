import React, { useState } from 'react';
import { templateList, TemplateKey } from './templateList';

type TemplateGalleryProps = {
  onSelectTemplate: (id: TemplateKey) => void;
  isPending?: boolean;
};

const ACCENTS: Record<TemplateKey, { bg: string; bar: string; badge: string }> = {
  classic:   { bg: '#fafafa',  bar: '#1a1a1a', badge: '#1a1a1a' },
  modern:    { bg: '#eff6ff',  bar: '#1d4ed8', badge: '#1d4ed8' },
  executive: { bg: '#f0f4f8',  bar: '#1e2d3d', badge: '#1e2d3d' },
  elegant:   { bg: '#f8fafc',  bar: '#0f172a', badge: '#3b82f6' },
  creative:  { bg: '#f0fdfa',  bar: '#0d9488', badge: '#0d9488' },
  corporate: { bg: '#f0f6ff',  bar: '#2563eb', badge: '#2563eb' },
  accent:    { bg: '#f0f9ff',  bar: '#0e7490', badge: '#0e7490' },
};

// Mini resume preview mockup per template
const MiniPreview: React.FC<{ id: TemplateKey }> = ({ id }) => {
  const a = ACCENTS[id];
  const isExecutive = id === 'executive';
  const isModern    = id === 'modern';
  const isCreative  = id === 'creative';
  const isCorporate = id === 'corporate';
  const isAccent    = id === 'accent';

  return (
    <div style={{ width: '100%', height: 160, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      {/* Header band */}
      {(isModern || isCreative) ? (
        <div style={{ background: a.bar, padding: '10px 12px 8px' }}>
          <div style={{ height: 8, width: 100, background: 'rgba(255,255,255,0.9)', borderRadius: 3, marginBottom: 4 }} />
          <div style={{ height: 5, width: 60, background: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[55, 40, 50].map((w, i) => <div key={i} style={{ height: 3, width: w, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />)}
          </div>
        </div>
      ) : isExecutive ? (
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Sidebar */}
          <div style={{ width: '32%', background: a.bar, padding: '10px 8px', flexShrink: 0 }}>
            <div style={{ height: 7, width: '80%', background: 'rgba(255,255,255,0.9)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 4, width: '60%', background: 'rgba(59,130,246,0.7)', borderRadius: 2, marginBottom: 10 }} />
            {[100, 85, 90, 70, 80].map((w, i) => <div key={i} style={{ height: 3, width: `${w}%`, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 4 }} />)}
          </div>
          {/* Content */}
          <div style={{ flex: 1, padding: '10px 10px', background: '#fff' }}>
            {['70%', '90%', '75%', '85%', '65%', '80%'].map((w, i) => (
              <div key={i} style={{ height: 3, width: w, background: i === 0 ? '#1e2d3d' : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
            ))}
          </div>
        </div>
      ) : isCorporate ? (
        /* Corporate: full-width header + left main + right sidebar */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '8px 10px', borderBottom: `2px solid ${a.bar}` }}>
            <div style={{ height: 8, width: 90, background: a.bar, borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 4, width: 60, background: '#64748b', borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <div style={{ width: '64%', padding: '8px 8px', borderRight: '1px solid #e2e8f0' }}>
              {['85%', '70%', '90%', '75%', '65%'].map((w, i) => (
                <div key={i} style={{ height: 3, width: w, background: i % 3 === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
              ))}
            </div>
            <div style={{ flex: 1, padding: '8px 6px', background: '#f8fafc' }}>
              {['90%', '75%', '80%', '65%'].map((w, i) => (
                <div key={i} style={{ height: 3, width: w, background: i === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
              ))}
            </div>
          </div>
        </div>
      ) : isAccent ? (
        /* Accent: narrow left sidebar + wide right column */
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '30%', background: '#f0f9ff', borderRight: `2px solid ${a.bar}`, padding: '8px 6px', flexShrink: 0 }}>
            <div style={{ height: 4, width: '80%', background: a.bar, borderRadius: 2, marginBottom: 8 }} />
            {[90, 75, 85, 70, 80].map((w, i) => <div key={i} style={{ height: 3, width: `${w}%`, background: `${a.bar}50`, borderRadius: 2, marginBottom: 4 }} />)}
          </div>
          <div style={{ flex: 1, padding: '8px 8px' }}>
            <div style={{ height: 10, width: '75%', background: '#164e63', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 4, width: 60, background: `${a.bar}30`, borderRadius: 10, marginBottom: 8, border: `1px solid ${a.bar}50` }} />
            {['90%', '75%', '85%', '70%'].map((w, i) => (
              <div key={i} style={{ height: 3, width: w, background: i === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
            ))}
          </div>
        </div>
      ) : (
        /* Classic / Elegant */
        <div style={{ padding: '12px 14px', background: a.bg }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ height: 8, width: 100, background: a.bar, borderRadius: 2, margin: '0 auto 4px' }} />
            <div style={{ height: 3, width: 150, background: '#e5e7eb', borderRadius: 2, margin: '0 auto' }} />
          </div>
          <div style={{ height: 1, background: a.bar, marginBottom: 8 }} />
          {['80%', '95%', '70%', '88%', '75%'].map((w, i) => (
            <div key={i} style={{ height: 3, width: w, background: i % 3 === 0 ? a.bar : '#e2e8f0', borderRadius: 2, marginBottom: 5 }} />
          ))}
        </div>
      )}

      {/* Skill pills preview at bottom (for classic/modern/creative/elegant) */}
      {!isExecutive && !isCorporate && !isAccent && (
        <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', gap: 4 }}>
          {['React', 'CSS', 'JS'].map((s, i) => (
            <span key={i} style={{ fontSize: 8, background: `${a.badge}18`, color: a.badge, border: `1px solid ${a.badge}40`, borderRadius: 20, padding: '1px 6px', fontWeight: 700, fontFamily: 'Arial,sans-serif' }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, isPending = false }) => {
  const [hovered, setHovered] = useState<TemplateKey | null>(null);

  return (
    <div style={{ padding: '40px 24px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{ fontWeight: 800, color: '#f0f0f0', marginBottom: 8, fontSize: 26 }}>Choose Your Resume Template</h2>
        <p style={{ color: '#888', fontSize: 14 }}>7 professionally designed layouts — pick one and start building</p>
      </div>

      {/* Pending trial banner */}
      {isPending && (
        <div style={{
          maxWidth: 900, margin: '0 auto 24px',
          background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ccc',
        }}>
          <span style={{ color: '#ff6b35', fontSize: 15 }}>🔒</span>
          <span>
            <strong style={{ color: '#ff6b35' }}>Trial access:</strong>{' '}
            You can use the <strong>Classic</strong> template for free. Enroll to unlock all templates.
          </span>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
        {(Object.entries(templateList) as [TemplateKey, typeof templateList[TemplateKey]][]).map(([key, { label, description }]) => {
          const a = ACCENTS[key];
          const isLocked = isPending && key !== 'classic';
          const isHov = hovered === key && !isLocked;
          return (
            <div
              key={key}
              style={{
                width: 250,
                background: '#16161e',
                border: `1.5px solid ${isLocked ? '#222' : isHov ? a.badge : '#2a2a32'}`,
                borderRadius: 14,
                padding: '16px 16px 18px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                transition: 'all 0.22s ease',
                transform: isHov ? 'translateY(-5px)' : 'none',
                boxShadow: isHov ? `0 12px 32px ${a.badge}30` : '0 2px 8px rgba(0,0,0,0.3)',
                opacity: isLocked ? 0.5 : 1,
                position: 'relative',
              }}
              onMouseEnter={() => !isLocked && setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => !isLocked && onSelectTemplate(key)}
            >
              {/* Lock badge */}
              {isLocked && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  background: 'rgba(0,0,0,0.6)', borderRadius: '50%',
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12 }}>🔒</span>
                </div>
              )}

              {/* Mini preview */}
              <div style={{ marginBottom: 12, filter: isLocked ? 'grayscale(1)' : 'none' }}>
                <MiniPreview id={key} />
              </div>

              {/* Label + badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: isLocked ? '#555' : '#f0f0f0' }}>{label}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, background: `${isLocked ? '#333' : a.badge}22`, color: isLocked ? '#555' : a.badge, border: `1px solid ${isLocked ? '#333' : a.badge}44`, borderRadius: 20, padding: '2px 8px' }}>
                  {isLocked ? 'LOCKED' : 'TEMPLATE'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#666', margin: '0 0 14px', lineHeight: 1.5 }}>{description}</p>

              <button
                disabled={isLocked}
                style={{
                  width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                  background: isLocked ? '#222' : isHov ? a.badge : '#2a2a32',
                  color: isLocked ? '#444' : '#fff',
                  fontWeight: 700, fontSize: 13,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {isLocked ? '🔒 Enroll to unlock' : 'Use This Template'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateGallery;
