import React, { useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { FaCheckCircle, FaCloudUploadAlt, FaExclamationTriangle, FaTimes } from 'react-icons/fa'

/* Shared pieces for the CSV and ZIP question uploads (kit styling, dark theme). */

export const Dropzone = ({ accept, hint, icon: FileIcon, file, disabled, onFile, onClear, fileSize }: {
  accept: string
  hint: string
  icon: IconType
  file: File | null
  disabled?: boolean
  onFile: (file: File) => void
  onClear: () => void
  fileSize: (file: File) => string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (files: FileList | null) => { if (files && files[0]) onFile(files[0]) }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="d-none"
        disabled={disabled}
        onChange={e => { pick(e.target.files); e.target.value = '' }}
      />
      {file ? (
        <div className="aqu-file">
          <span className="aqu-file-icon"><FileIcon /></span>
          <div className="aui-stack">
            <strong>{file.name}</strong>
            <small>{fileSize(file)} · ready to upload</small>
          </div>
          <button type="button" className="aui-btn aui-btn-sm" onClick={() => inputRef.current?.click()} disabled={disabled}>Replace</button>
          <button type="button" className="aui-icon-btn" onClick={onClear} disabled={disabled} aria-label="Remove file"><FaTimes size={11} /></button>
        </div>
      ) : (
        <div
          className={`aqu-drop${dragging ? ' is-dragging' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files) }}
        >
          <span className="aqu-drop-icon"><FaCloudUploadAlt /></span>
          <strong>Drop your file here, or <u>browse</u></strong>
          <small>{hint}</small>
        </div>
      )}
    </>
  )
}

export const UploadProgress = ({ value, label }: { value: number; label: string }) => (
  <div className="aqu-progress">
    <div className="aqu-progress-head"><span>{label}</span><b>{value}%</b></div>
    <div className="aqu-progress-track"><span style={{ width: `${value}%` }} /></div>
  </div>
)

export const UploadSummary = ({ inserted, updated, skipped, total, errors }: { inserted?: number; updated?: number; skipped?: number; total?: number; errors?: string[] }) => (
  <div className="aqu-summary">
    <div className="aqu-summary-head"><FaCheckCircle /> Upload complete</div>
    <div className="aqu-summary-tiles">
      <div className="is-green"><strong>{inserted ?? 0}</strong><small>Inserted</small></div>
      {updated != null && <div className="is-blue"><strong>{updated}</strong><small>Updated</small></div>}
      <div className={(skipped ?? 0) > 0 ? 'is-amber' : ''}><strong>{skipped ?? 0}</strong><small>Skipped</small></div>
      {total != null && <div><strong>{total}</strong><small>Total rows</small></div>}
    </div>
    {errors && errors.length > 0 && (
      <div className="aqu-warnings">
        <div><FaExclamationTriangle /> {errors.length} warning{errors.length === 1 ? '' : 's'}</div>
        <ul>
          {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
          {errors.length > 5 && <li>…and {errors.length - 5} more</li>}
        </ul>
      </div>
    )}
  </div>
)

/* Small two-column card: upload on the left, format guide on the right */
export const UploadCard = ({ icon: Icon, title, subtitle, sample, children, guide }: {
  icon: IconType
  title: string
  subtitle: string
  sample: React.ReactNode
  children: React.ReactNode
  guide: React.ReactNode
}) => (
  <div className="aui-card">
    <div className="aui-toolbar">
      <div className="aqu-title">
        <span className="aqu-title-icon"><Icon /></span>
        <div className="aui-toolbar-title">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="aui-toolbar-filters">{sample}</div>
    </div>
    <div className="aqu-grid">
      <div className="aqu-main">{children}</div>
      <aside className="aqu-guide">{guide}</aside>
    </div>
  </div>
)

export const UPLOAD_CSS = `
  .aqu-title { display: flex; align-items: center; gap: 12px; }
  .aqu-title-icon { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid rgba(255,122,0,0.3); border-radius: 10px; background: rgba(255,122,0,0.1); color: #ff9a3c; font-size: 0.95rem; }
  .aqu-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr); }
  .aqu-main { display: flex; flex-direction: column; gap: 14px; padding: 1.2rem; }
  .aqu-guide { padding: 1.2rem; border-left: 1px solid #202326; background: #0c0d0f; border-radius: 0 0 12px 0; }

  .aqu-drop { display: flex; min-height: 180px; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 1.5rem; border: 1.5px dashed #3a3f45; border-radius: 12px; background: #111315; color: #9aa0a6; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .aqu-drop:hover, .aqu-drop:focus-visible, .aqu-drop.is-dragging { border-color: rgba(255,122,0,0.7); background: rgba(255,122,0,0.05); outline: none; }
  .aqu-drop strong { color: #e5e7eb; font-size: 0.9rem; font-weight: 650; }
  .aqu-drop strong u { color: #ff9a3c; text-decoration: none; }
  .aqu-drop small { color: #6b7280; font-size: 0.75rem; }
  .aqu-drop-icon { display: grid; place-items: center; width: 50px; height: 50px; margin-bottom: 4px; border: 1px solid rgba(255,122,0,0.25); border-radius: 14px; background: rgba(255,122,0,0.1); color: #ff7a00; font-size: 1.35rem; }

  .aqu-file { display: flex; align-items: center; gap: 12px; padding: 0.9rem 1rem; border: 1px solid rgba(49,216,102,0.25); border-radius: 12px; background: rgba(49,216,102,0.05); }
  .aqu-file .aui-stack { flex: 1; }
  .aqu-file-icon { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 10px; background: rgba(49,216,102,0.13); color: #45dd75; font-size: 1.1rem; }

  .aqu-progress-head { display: flex; justify-content: space-between; margin-bottom: 6px; color: #a6abb0; font-size: 0.78rem; }
  .aqu-progress-head b { color: #ff9a3c; }
  .aqu-progress-track { height: 8px; overflow: hidden; border-radius: 99px; background: #23262a; }
  .aqu-progress-track span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ff7a00, #ffa53d); transition: width 0.3s ease; }

  .aqu-summary { padding: 0.9rem 1rem; border: 1px solid rgba(49,216,102,0.25); border-radius: 12px; background: rgba(49,216,102,0.05); }
  .aqu-summary-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #45dd75; font-size: 0.86rem; font-weight: 700; }
  .aqu-summary-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
  .aqu-summary-tiles > div { display: flex; flex-direction: column; padding: 0.6rem 0.75rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
  .aqu-summary-tiles strong { color: #fff; font-size: 1.2rem; font-weight: 800; line-height: 1.1; }
  .aqu-summary-tiles small { color: #858a90; font-size: 0.7rem; }
  .aqu-summary-tiles .is-green strong { color: #45dd75; }
  .aqu-summary-tiles .is-amber strong { color: #f4b43f; }
  .aqu-summary-tiles .is-blue strong { color: #38bdf8; }
  .aqu-warnings { margin-top: 10px; color: #f4b43f; font-size: 0.76rem; }
  .aqu-warnings > div { display: flex; align-items: center; gap: 6px; font-weight: 700; }
  .aqu-warnings ul { margin: 6px 0 0; padding-left: 1.1rem; color: #d6c08a; }

  .aqu-actions { display: flex; justify-content: flex-end; gap: 8px; }

  .aqu-guide h4 { margin: 0 0 0.6rem; color: #9da2a8; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
  .aqu-cols { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }
  .aqu-cols code { padding: 3px 8px; border: 1px solid #2c3034; border-radius: 6px; background: #17191c; color: #d1d5db; font-size: 0.72rem; }
  .aqu-cols code.is-key { border-color: rgba(255,122,0,0.35); color: #ffb15e; }
  .aqu-rules { margin: 0; padding-left: 1.1rem; color: #a6abb0; font-size: 0.78rem; line-height: 1.7; }
  .aqu-rules code { color: #ffb15e; font-size: 0.74rem; }
  .aqu-rules b { color: #e5e7eb; }

  @media (max-width: 991.98px) {
    .aqu-grid { grid-template-columns: 1fr; }
    .aqu-guide { border-left: 0; border-top: 1px solid #202326; border-radius: 0 0 12px 12px; }
  }
`
