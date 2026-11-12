import React, { useRef, useState } from "react";
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import { FaArrowDown, FaArrowUp, FaCheck, FaCloudUploadAlt, FaExclamationTriangle, FaListOl, FaPlus, FaRegBuilding, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { CompanyLogo, ROUND_OPTIONS, roundTitle } from './shared'

const renumber = (rounds: any[]) => rounds.map((r: any, i: number) => ({ ...r, order: i + 1 }));

const Step1 = ({ formData, setFormData }: any) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const logoInput = useRef<HTMLInputElement>(null);
  const [customRound, setCustomRound] = useState("");
  const [customError, setCustomError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLogoError("");
    setLogoUploading(true);
    try {
      const body = new FormData();
      body.append("logo", file);

      const res = await fetch(`${baseURL}/api/company-interview/upload-logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
        body,
      });
      const data = await res.json();

      if (data.success && data.logoUrl) {
        setFormData((prev: any) => ({ ...prev, logoUrl: data.logoUrl }));
      } else {
        setLogoError(data.error || "Failed to upload logo");
      }
    } catch (err) {
      setLogoError("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const togglePredefined = (value: string) => {
    setFormData((prev: any) => {
      const rounds = prev.rounds || [];
      if (rounds.some((r: any) => r.roundType === value)) {
        return { ...prev, rounds: renumber(rounds.filter((r: any) => r.roundType !== value)) };
      }
      return {
        ...prev,
        rounds: [...rounds, { roundName: value, roundType: value, duration: "", questionCount: "", order: rounds.length + 1 }],
      };
    });
  };

  const handleAddCustomRound = () => {
    const name = customRound.trim();
    if (!name) return;
    const exists = (formData.rounds || []).some((r: any) =>
      r.roundName.toLowerCase() === name.toLowerCase() || roundTitle(r).toLowerCase() === name.toLowerCase());
    if (exists) { setCustomError(`"${name}" is already in the list.`); return; }

    setFormData((prev: any) => ({
      ...prev,
      rounds: [
        ...(prev.rounds || []),
        { roundName: name, roundType: "CUSTOM", duration: "", questionCount: "", order: (prev.rounds?.length || 0) + 1 },
      ],
    }));
    setCustomRound("");
    setCustomError("");
  };

  const handleRoundChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      rounds: prev.rounds.map((r: any, i: number) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const moveRound = (index: number, dir: -1 | 1) => {
    setFormData((prev: any) => {
      const rounds = [...prev.rounds];
      const target = index + dir;
      if (target < 0 || target >= rounds.length) return prev;
      [rounds[index], rounds[target]] = [rounds[target], rounds[index]];
      return { ...prev, rounds: renumber(rounds) };
    });
  };

  const handleDeleteRound = (index: number) => {
    setFormData((prev: any) => ({ ...prev, rounds: renumber(prev.rounds.filter((_: any, i: number) => i !== index)) }));
  };

  if (!formData) return null;
  const rounds: any[] = formData.rounds || [];
  const totalMinutes = rounds.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

  return (
    <div className="ci-form">
      {/* Company details */}
      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aqu-title">
            <span className="aqu-title-icon"><FaRegBuilding /></span>
            <div className="aui-toolbar-title">
              <h3>Company details</h3>
              <p>What students see on the company card</p>
            </div>
          </div>
        </div>

        <div className="ci-details">
          <div className="ci-logo-box">
            <span className="aui-label">Logo <span className="aui-optional">Optional</span></span>
            <div className="ci-logo-drop">
              <CompanyLogo src={formData.logoUrl} name={formData.companyName} size={84} />
              <input ref={logoInput} type="file" accept="image/*" className="d-none" onChange={handleLogoUpload} disabled={logoUploading} />
              <div className="ci-logo-btns">
                <button type="button" className="aui-btn aui-btn-sm" onClick={() => logoInput.current?.click()} disabled={logoUploading}>
                  {logoUploading ? <FaSpinner className="aui-spin" /> : <FaCloudUploadAlt />} {formData.logoUrl ? 'Replace' : 'Upload'}
                </button>
                {formData.logoUrl && !logoUploading && (
                  <button type="button" className="aui-icon-btn" title="Remove logo" onClick={() => setFormData((prev: any) => ({ ...prev, logoUrl: '' }))}>
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
              <small className="aui-hint">PNG or SVG with a transparent background looks best</small>
            </div>
            {logoError && <p className="aui-error">{logoError}</p>}
          </div>

          <div className="ci-fields">
            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="ci-company">Company name <span className="ci-req">*</span></label>
                <input id="ci-company" className="aui-input" name="companyName" placeholder="e.g. Amazon" value={formData.companyName || ""} onChange={handleChange} />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="ci-title">Title</label>
                <input id="ci-title" className="aui-input" name="title" placeholder="e.g. SDE-1 Off Campus Drive 2026" value={formData.title || ""} onChange={handleChange} />
              </div>
            </div>
            <div className="ci-field-row3">
              <div className="aui-field">
                <label className="aui-label" htmlFor="ci-role">Role</label>
                <input id="ci-role" className="aui-input" name="role" placeholder="e.g. Software Engineer" value={formData.role || ""} onChange={handleChange} />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="ci-package">Package</label>
                <input id="ci-package" className="aui-input" name="package" placeholder="e.g. 12 LPA" value={formData.package || ""} onChange={handleChange} />
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="ci-location">Location</label>
                <input id="ci-location" className="aui-input" name="location" placeholder="e.g. Bengaluru" value={formData.location || ""} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="aui-field ci-desc">
            <span className="aui-label">Description <span className="aui-optional">Optional</span></span>
            <div className="quill-editor-wrapper">
              <ReactQuill
                theme="snow"
                value={formData.description || ""}
                onChange={(value) => setFormData((prev: any) => ({ ...prev, description: value }))}
                placeholder="About the company, eligibility, what the drive looks like…"
                className="custom-quill"
                modules={{
                  toolbar: [
                    [{ header: [false, 2, 3] }],
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hiring rounds */}
      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aqu-title">
            <span className="aqu-title-icon"><FaListOl /></span>
            <div className="aui-toolbar-title">
              <h3>Hiring rounds <span className="ci-req">*</span></h3>
              <p>Pick the rounds in this drive, then set their order and timing. Blank question count uses the number uploaded</p>
            </div>
          </div>
          {rounds.length > 0 && (
            <div className="aui-toolbar-filters">
              <span className="aui-count">{rounds.length} round{rounds.length === 1 ? '' : 's'}{totalMinutes ? ` · ${totalMinutes} min` : ''}</span>
            </div>
          )}
        </div>

        <div className="ci-rounds-body">
          <div className="aui-section-label">Common rounds</div>
          <div className="ci-chips">
            {ROUND_OPTIONS.map((round) => {
              const on = rounds.some((r: any) => r.roundType === round.value);
              return (
                <button key={round.value} type="button" className={`ci-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => togglePredefined(round.value)}>
                  <span className="ci-chip-box">{on ? <FaCheck size={9} /> : <FaPlus size={8} />}</span>
                  {round.label}
                </button>
              );
            })}
          </div>

          <div className="ci-custom">
            <input
              className="aui-input"
              placeholder="Add a custom round, e.g. Machine Test"
              value={customRound}
              onChange={(e) => { setCustomRound(e.target.value); setCustomError(""); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRound(); } }}
            />
            <button type="button" className="aui-btn aui-btn-soft" onClick={handleAddCustomRound} disabled={!customRound.trim()}>
              <FaPlus size={10} /> Add round
            </button>
          </div>
          {customError && <p className="aui-error ci-custom-err"><FaExclamationTriangle /> {customError}</p>}

          {rounds.length === 0 ? (
            <div className="ci-rounds-empty">No rounds yet. Choose from the common rounds above or add your own.</div>
          ) : (
            <div className="ci-round-list">
              <div className="ci-round-head">
                <span>Round</span><span>Duration</span><span title="Shown to students; leave blank to use the number uploaded">Question count</span><span />
              </div>
              {rounds.map((round: any, index: number) => (
                <div key={`${round.roundType}-${round.roundName}`} className="ci-round-row">
                  <div className="ci-round-name">
                    <span className="ci-order">{round.order}</span>
                    <div className="aui-stack">
                      <strong>{roundTitle(round)}</strong>
                      <small>{round.roundType === 'CUSTOM' ? 'Custom round' : round.roundType === 'MCQ' ? 'Multiple choice' : round.roundType === 'CODING' ? 'Coding problems' : 'Question & answer'}</small>
                    </div>
                  </div>
                  <label className="ci-suffix-input">
                    <input
                      className="aui-input"
                      type="number"
                      min={0}
                      placeholder="—"
                      value={round.duration}
                      onChange={(e) => handleRoundChange(index, 'duration', e.target.value)}
                      aria-label={`${roundTitle(round)} duration in minutes`}
                    />
                    <span>min</span>
                  </label>
                  <label className="ci-suffix-input">
                    <input
                      className="aui-input"
                      type="number"
                      min={0}
                      placeholder="Auto"
                      value={round.questionCount}
                      onChange={(e) => handleRoundChange(index, 'questionCount', e.target.value)}
                      aria-label={`${roundTitle(round)} number of questions`}
                    />
                    <span>qs</span>
                  </label>
                  <div className="ci-round-actions">
                    <button type="button" className="aui-icon-btn" title="Move up" onClick={() => moveRound(index, -1)} disabled={index === 0}><FaArrowUp size={10} /></button>
                    <button type="button" className="aui-icon-btn" title="Move down" onClick={() => moveRound(index, 1)} disabled={index === rounds.length - 1}><FaArrowDown size={10} /></button>
                    <button type="button" className="aui-icon-btn ci-del" title="Remove round" onClick={() => handleDeleteRound(index)}><FaTrash size={10} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ci-form { display: flex; flex-direction: column; gap: 1rem; }
        .ci-req { color: #ff7a00; }
        .ci-details { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 0 1.4rem; padding: 1.2rem; }
        .ci-logo-box { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.15rem; }
        .ci-logo-drop { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 1rem 0.75rem; border: 1px dashed #3a3f45; border-radius: 12px; background: #111315; text-align: center; }
        .ci-logo-drop .ci-logo { border-radius: 16px; }
        .ci-logo-btns { display: flex; gap: 6px; }
        .ci-fields { min-width: 0; }
        .ci-field-row3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 1rem; }
        .ci-desc { grid-column: 1 / -1; margin-bottom: 0; }

        .ci-rounds-body { padding: 1.2rem; }
        .ci-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0.5rem 0 1rem; }
        .ci-chip { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 0.85rem 0 0.55rem; border: 1px solid #2c3034; border-radius: 99px; background: #141618; color: #c3c7ca; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
        .ci-chip:hover { border-color: #454a50; color: #fff; }
        .ci-chip.is-on { border-color: rgba(255,122,0,0.55); background: rgba(255,122,0,0.1); color: #ffb15e; }
        .ci-chip-box { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid #3a3f45; border-radius: 50%; color: #858a90; }
        .ci-chip.is-on .ci-chip-box { border-color: #ff7a00; background: #ff7a00; color: #fff; }
        .ci-custom { display: flex; gap: 8px; max-width: 560px; }
        .ci-custom .aui-btn { height: 40px; }
        .ci-custom-err { display: flex; align-items: center; gap: 6px; margin-top: 6px; }

        .ci-rounds-empty { margin-top: 1rem; padding: 1.2rem; border: 1px dashed #2c3034; border-radius: 10px; color: #6b7280; font-size: 0.8rem; text-align: center; }
        .ci-round-list { margin-top: 1.2rem; overflow: hidden; border: 1px solid #25282b; border-radius: 12px; }
        .ci-round-head, .ci-round-row { display: grid; grid-template-columns: minmax(0, 1fr) 130px 130px 112px; align-items: center; gap: 12px; padding: 0.6rem 0.9rem; }
        .ci-round-head { background: #111315; color: #858a90; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
        .ci-round-row { border-top: 1px solid #202326; }
        .ci-round-row:hover { background: #0f1113; }
        .ci-round-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .ci-round-name strong { color: #eceef0; font-size: 0.84rem; }
        .ci-round-name small { color: #6b7280; font-size: 0.7rem; }
        .ci-order { display: grid; place-items: center; width: 26px; height: 26px; flex: 0 0 26px; border-radius: 8px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.76rem; font-weight: 800; }
        .ci-suffix-input { position: relative; display: flex; align-items: center; margin: 0; }
        .ci-suffix-input .aui-input { height: 34px; padding-right: 2.4rem; }
        .ci-suffix-input span { position: absolute; right: 0.7rem; color: #6b7280; font-size: 0.72rem; pointer-events: none; }
        .ci-round-actions { display: flex; justify-content: flex-end; gap: 4px; }
        .ci-round-actions .aui-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .quill-editor-wrapper { overflow: hidden; border: 1px solid #34383d; border-radius: 8px; background: #17191c; }
        .custom-quill .ql-toolbar { border: none; border-bottom: 1px solid #2c3034; background: #111315; }
        .custom-quill .ql-container { min-height: 150px; border: none; background: #17191c; font-size: 0.86rem; }
        .custom-quill .ql-editor { min-height: 150px; color: #f1f5f9; }
        .custom-quill .ql-editor.ql-blank::before { color: #5b616a; font-style: normal; }
        .custom-quill .ql-stroke { stroke: #c3c7ca; }
        .custom-quill .ql-fill { fill: #c3c7ca; }
        .custom-quill .ql-picker { color: #c3c7ca; }
        .custom-quill .ql-picker-options { border-color: #2c3034 !important; background: #17191c; }
        .custom-quill .ql-toolbar button:hover .ql-stroke, .custom-quill .ql-toolbar .ql-active .ql-stroke { stroke: #ff7a00; }
        .custom-quill .ql-toolbar button:hover .ql-fill, .custom-quill .ql-toolbar .ql-active .ql-fill { fill: #ff7a00; }

        @media (max-width: 991.98px) {
          .ci-details { grid-template-columns: 1fr; }
          .ci-logo-box { margin-bottom: 1.15rem; }
          .ci-field-row3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 767.98px) {
          .ci-round-head { display: none; }
          .ci-round-row { grid-template-columns: 1fr 1fr; }
          .ci-round-name { grid-column: 1 / -1; }
          .ci-round-actions { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
};

export default Step1;
