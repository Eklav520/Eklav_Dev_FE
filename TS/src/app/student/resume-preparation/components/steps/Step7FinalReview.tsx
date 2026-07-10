import React, { useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
import { ResumeData } from '../ResumeData'
import { Download, ArrowLeft, CheckCircle, Eye, Printer, LayoutTemplate } from 'lucide-react'

interface Step7FinalReviewProps {
  data: ResumeData
  goBack: () => void
  onChangeTemplate?: () => void
  SelectedTemplateComponent?: React.FC<{ data: ResumeData }>
}

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = '#6b7280'

const Step7FinalReview: React.FC<Step7FinalReviewProps> = ({ data, goBack, onChangeTemplate, SelectedTemplateComponent }) => {
  const resumeRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!resumeRef.current) return
    setDownloading(true)
    try {
      await html2pdf()
        .from(resumeRef.current)
        .set({
          margin: 0.5,
          filename: `${data.fullName || 'Resume'}_Resume.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .save()
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '16px 20px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={18} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Resume Ready!</div>
            <div style={{ fontSize: 12, color: GRAY }}>Review your resume below before downloading</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={goBack}
            style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Edit Details
          </button>
          {onChangeTemplate && (
            <button
              type="button"
              onClick={onChangeTemplate}
              style={{ fontSize: 13, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1.5px solid ${ORANGE}40`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LayoutTemplate size={14} /> Change Template
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            style={{ fontSize: 13, fontWeight: 600, color: GRAY, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Printer size={14} /> Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: downloading ? '#fdba74' : ORANGE, border: 'none', borderRadius: 8, padding: '9px 20px', cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}
          >
            {downloading
              ? <><span style={{ width: 13, height: 13, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</>
              : <><Download size={14} /> Download PDF</>
            }
          </button>
        </div>
      </div>

      {/* ── Resume preview ── */}
      <div style={{ background: '#e5e7eb', borderRadius: 12, padding: '28px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 780 }}>
          {/* Preview label */}
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600, color: GRAY, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', zIndex: 1 }}>
            <Eye size={11} /> Preview
          </div>

          {/* Actual resume */}
          <div
            ref={resumeRef}
            style={{ background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', minHeight: 600 }}
          >
            {SelectedTemplateComponent
              ? <SelectedTemplateComponent data={data} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: GRAY, gap: 8 }}>
                  <Eye size={32} color="#d1d5db" />
                  <span style={{ fontSize: 14 }}>No template selected</span>
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '14px 20px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <p style={{ fontSize: 13, color: GRAY, margin: 0 }}>
          Looks good? Download your resume and start applying!
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: ORANGE, border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}
        >
          <Download size={14} /> Download Resume
        </button>
      </div>
    </div>
  )
}

export default Step7FinalReview
