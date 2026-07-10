import React, { useState } from 'react'
import { StepProps } from '../ResumeBuilder'
import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = '#6b7280'

const Step5Summary: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const [loading, setLoading] = useState(false)

  const cleanSkills = (data.skills || []).filter(Boolean)
  const cleanExperience = (data.experience || []).filter(Boolean)
  const hasEnoughData = cleanSkills.length > 0 || cleanExperience.length > 0

  const generateSummary = async () => {
    try {
      setLoading(true)
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/generate`, data)
      const raw: string = res.data.summary ?? ''
      const clean = raw
        .split('\n')
        .filter(line => !/^\s*[#]+/.test(line))
        .filter(line => !/^\s*---+\s*$/.test(line))
        .filter(line => !/^\s*\*\*[^*]+\*\*\s*$/.test(line))
        .join(' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
      setData({ ...data, summary: clean })
    } catch {
      alert('Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Professional Summary</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>Write or generate a professional headline for your resume</p>
      </div>

      {/* AI context preview */}
      <div style={{ background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: '#374151', margin: '0 0 10px' }}>AI will generate your summary based on:</p>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: GRAY }}>Skills: </span>
          {cleanSkills.length > 0
            ? cleanSkills.map((s, i) => (
                <span key={i} style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontSize: 11, marginRight: 4, marginBottom: 4 }}>{s}</span>
              ))
            : <span style={{ color: '#ef4444', fontSize: 12 }}>None added</span>
          }
        </div>
        <div style={{ marginBottom: hasEnoughData ? 0 : 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: GRAY }}>Experience: </span>
          {cleanExperience.length > 0
            ? cleanExperience.map((e, i) => (
                <span key={i} style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 10px', fontSize: 11, marginRight: 4, marginBottom: 4 }}>{e}</span>
              ))
            : <span style={{ color: GRAY, fontSize: 12 }}>None added</span>
          }
        </div>
        {!hasEnoughData && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 12, color: '#92400e' }}>
            <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
            Add at least one skill or experience entry to generate a personalised summary.
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={generateSummary}
        disabled={loading || !hasEnoughData}
        style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: loading || !hasEnoughData ? '#d1d5db' : ORANGE, border: 'none', borderRadius: 8, padding: '9px 18px', cursor: loading || !hasEnoughData ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
      >
        {loading
          ? <><span style={{ width: 13, height: 13, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</>
          : <><Sparkles size={14} /> Generate with AI</>
        }
      </button>

      <textarea
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, outline: 'none', color: '#1f2937', background: '#fff', fontFamily: 'inherit', minHeight: 110, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 28 }}
        placeholder="Your professional summary will appear here, or write your own..."
        value={data.summary || ''}
        onChange={(e) => setData({ ...data, summary: e.target.value })}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={goBack} style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer' }}>
          Save & Exit
        </button>
        <button type="button" onClick={goNext} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: ORANGE, border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}>
          Save & Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Step5Summary
