import React, { useRef } from 'react'
import { StepProps } from '../ResumeBuilder'
import { Trash2, ArrowRight, User } from 'lucide-react'

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = 'var(--dash-gray, #6b7280)'
// Reads the same --dash-* CSS vars StudentLayout sets for dark mode.
// Input fields stay intentionally fixed white/light (always legible);
// only heading/label text sitting directly on the theme-following card needs to adapt.
const TEXT = 'var(--dash-text, #111827)'
const CARD_BG = 'var(--dash-card-bg, #ffffff)'
const MAX_SUMMARY = 200

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: `1px solid ${BORDER}`,
  borderRadius: 8, fontSize: 13, outline: 'none', color: '#1f2937',
  background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
}

const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 5, display: 'block',
}

const Step1Header: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (field: string, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }))

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setData((prev) => ({ ...prev, profilePhoto: url }))
  }

  const removePhoto = () => setData((prev) => ({ ...prev, profilePhoto: '' }))

  const summaryLen = (data.summary || '').length

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Personal Information</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>Add your basic information</p>
      </div>

      {/* Row 1: Full Name | Professional Title | Profile Photo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        <div>
          <label style={lbl}>Full Name <span style={{ color: ORANGE }}>*</span></label>
          <input
            style={inp} placeholder="Full Name"
            value={data.fullName}
            onChange={(e) => set('fullName', e.target.value)}
          />
        </div>

        <div>
          <label style={lbl}>Professional Title</label>
          <input
            style={inp} placeholder="Full Stack Developer"
            value={data.role || ''}
            onChange={(e) => set('role', e.target.value)}
          />
        </div>

        {/* Profile Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 130 }}>
          <label style={{ ...lbl, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>Profile Photo</label>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: '#f3f4f6', border: `2px solid ${BORDER}`,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {data.profilePhoto ? (
              <img src={data.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} color="#d1d5db" />
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                fontSize: 11, fontWeight: 600, color: ORANGE, background: '#fff',
                border: `1.5px solid ${ORANGE}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              }}
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={removePhoto}
              style={{
                fontSize: 11, color: '#ef4444', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 6, padding: '5px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />
          <span style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.4 }}>
            JPG, PNG or WEBP (Max 2MB)
          </span>
        </div>
      </div>

      {/* Row 2: Email | Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Email Address <span style={{ color: ORANGE }}>*</span></label>
          <input
            style={inp} type="email" placeholder="you@gmail.com"
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div>
          <label style={lbl}>Phone Number <span style={{ color: ORANGE }}>*</span></label>
          <input
            style={inp} type="tel" placeholder="+91 98765 43210"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Location | LinkedIn | Portfolio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Location <span style={{ color: ORANGE }}>*</span></label>
          <input
            style={inp} placeholder="Bengaluru, Karnataka, India"
            value={data.location || data.city || ''}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>
        <div>
          <label style={lbl}>LinkedIn Profile</label>
          <input
            style={inp} placeholder="https://linkedin.com/in/..."
            value={data.linkedin || ''}
            onChange={(e) => set('linkedin', e.target.value)}
          />
        </div>
        <div>
          <label style={lbl}>Portfolio / Website</label>
          <input
            style={inp} placeholder="https://yoursite.dev"
            value={data.portfolio || ''}
            onChange={(e) => set('portfolio', e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 28 }}>
        <label style={lbl}>Summary / Professional Headline</label>
        <div style={{ position: 'relative' }}>
          <textarea
            style={{ ...inp, minHeight: 96, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Passionate Full Stack Developer with strong problem-solving skills and experience in building modern web applications."
            value={data.summary || ''}
            maxLength={MAX_SUMMARY}
            onChange={(e) => set('summary', e.target.value)}
          />
          <span style={{
            position: 'absolute', bottom: 10, right: 12,
            fontSize: 11, color: summaryLen > MAX_SUMMARY * 0.9 ? ORANGE : '#9ca3af',
          }}>
            {summaryLen} / {MAX_SUMMARY}
          </span>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 16, borderTop: `1px solid ${BORDER}`,
      }}>
        <button
          type="button"
          onClick={goBack}
          style={{
            fontSize: 13, fontWeight: 600, color: TEXT, background: CARD_BG,
            border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer',
          }}
        >
          Save & Exit
        </button>
        <button
          type="button"
          onClick={goNext}
          style={{
            fontSize: 13, fontWeight: 700, color: '#fff', background: ORANGE,
            border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
          }}
        >
          Save & Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Step1Header
