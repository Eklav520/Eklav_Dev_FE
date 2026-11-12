import { Modal } from 'react-bootstrap'
import type { IconType } from 'react-icons'
import {
  FaArrowDown, FaArrowUp, FaBuilding, FaCalendarAlt, FaCheck, FaExclamationTriangle, FaGraduationCap,
  FaListOl, FaMapMarkerAlt, FaMoneyBillWave, FaPlus, FaSpinner, FaTimes, FaTrashAlt, FaUserTie, FaEnvelope,
} from 'react-icons/fa'
import { AdminSelect, type SelectOption } from '@/components/admin-ui'
import type { PlacementDrive, PlacementRound } from './PlacementDriveManagement'

/* Shared form for the Create and Edit placement-drive dialogs */

export type DriveFormValues = {
  companyName: string
  role: string
  pkg: string
  location: string
  driveDate: string
  cutoffScore: number | ''
  cutoffType: 'cgpa' | 'percentage'
  backlogPolicy: 'none' | 'limited' | 'any'
  maxBacklogs: number | ''
  rounds: PlacementRound[]
  status: string
}

export const DEFAULT_ROUNDS: PlacementRound[] = [
  { name: 'Aptitude Test', order: 1 },
  { name: 'Technical Round', order: 2 },
  { name: 'HR Round', order: 3 },
]

export const emptyDriveForm = (): DriveFormValues => ({
  companyName: '',
  role: '',
  pkg: '',
  location: '',
  driveDate: '',
  cutoffScore: '',
  cutoffType: 'cgpa',
  backlogPolicy: 'any',
  maxBacklogs: 1,
  rounds: DEFAULT_ROUNDS.map(r => ({ ...r })),
  status: 'upcoming',
})

export const driveToForm = (drive: PlacementDrive): DriveFormValues => ({
  companyName: drive.companyName,
  role: drive.role || '',
  pkg: drive.package || '',
  location: drive.location || '',
  driveDate: drive.driveDate ? new Date(drive.driveDate).toISOString().split('T')[0] : '',
  cutoffScore: drive.cutoffScore ?? '',
  cutoffType: drive.cutoffType ?? 'cgpa',
  backlogPolicy: drive.backlogPolicy ?? 'any',
  maxBacklogs: drive.maxBacklogs ?? 1,
  rounds: drive.rounds.map(r => ({ ...r })),
  status: drive.status,
})

export const validateDrive = (v: DriveFormValues) => {
  if (!v.companyName.trim()) return 'Company name is required'
  if (v.rounds.length === 0) return 'Add at least one interview round'
  if (v.rounds.some(r => !r.name.trim())) return 'All round names must be filled'
  return ''
}

/* Request body — identical to what the dialogs sent before */
export const driveFormToPayload = (v: DriveFormValues) => ({
  companyName: v.companyName.trim(),
  role: v.role.trim(),
  package: v.pkg.trim(),
  location: v.location.trim(),
  driveDate: v.driveDate || null,
  cutoffScore: v.cutoffScore === '' ? 0 : v.cutoffScore,
  cutoffType: v.cutoffType,
  backlogPolicy: v.backlogPolicy,
  maxBacklogs: v.backlogPolicy === 'limited' ? (v.maxBacklogs === '' ? 1 : v.maxBacklogs) : 0,
  rounds: v.rounds,
  status: v.status,
})

const BACKLOG_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Any backlogs allowed' },
  { value: 'none', label: 'No backlogs allowed' },
  { value: 'limited', label: 'Allow up to N backlogs' },
]

const ROUND_SUGGESTIONS = ['Aptitude Test', 'Coding Test', 'Group Discussion', 'Technical Round', 'Managerial Round', 'HR Round']

const STATUS_COLORS: Record<string, string> = { upcoming: '#f59e0b', ongoing: '#22c55e', completed: '#94a3b8' }

const Label = ({ icon: Icon, children, required, htmlFor }: { icon: IconType; children: React.ReactNode; required?: boolean; htmlFor?: string }) => (
  <label className="aui-label" htmlFor={htmlFor}>
    <Icon className="pdf-label-icon" />
    {children}
    {required ? <span className="pdf-required">Required</span> : <span className="aui-optional">Optional</span>}
  </label>
)

type Props = {
  show: boolean
  onHide: () => void
  icon: IconType
  title: string
  subtitle: string
  values: DriveFormValues
  onChange: (values: DriveFormValues) => void
  statusOptions: SelectOption[]
  error: string
  submitting: boolean
  submitLabel: string
  submittingLabel: string
  onSubmit: () => void
  footerNote?: string
}

const DriveFormModal = ({
  show, onHide, icon: Icon, title, subtitle, values, onChange, statusOptions,
  error, submitting, submitLabel, submittingLabel, onSubmit, footerNote,
}: Props) => {
  const set = <K extends keyof DriveFormValues>(key: K, value: DriveFormValues[K]) => onChange({ ...values, [key]: value })
  const renumber = (rounds: PlacementRound[]) => rounds.map((r, i) => ({ ...r, order: i + 1 }))

  const addRound = (name = '') => set('rounds', renumber([...values.rounds, { name, order: 0 }]))
  const removeRound = (idx: number) => set('rounds', renumber(values.rounds.filter((_, i) => i !== idx)))
  const renameRound = (idx: number, name: string) => set('rounds', values.rounds.map((r, i) => (i === idx ? { ...r, name } : r)))
  const moveRound = (idx: number, dir: -1 | 1) => {
    const next = [...values.rounds]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    set('rounds', renumber(next))
  }

  const suggestions = ROUND_SUGGESTIONS.filter(s => !values.rounds.some(r => r.name.trim().toLowerCase() === s.toLowerCase()))
  const isCgpa = values.cutoffType === 'cgpa'

  return (
    <Modal show={show} onHide={() => !submitting && onHide()} size="xl" centered scrollable dialogClassName="pdf-dialog" contentClassName="pdf-content" backdropClassName="aui-backdrop">
      <div className="aui-page pdf-shell">
        {/* Header */}
        <div className="pdf-head">
          <span className="aui-heading-icon"><Icon /></span>
          <div className="pdf-head-text">
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={onHide} disabled={submitting} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        {/* Body */}
        <form className="pdf-body" onSubmit={(e) => e.preventDefault()} noValidate>
          {error && <div className="aui-alert"><FaExclamationTriangle /> {error}</div>}

          <section className="pdf-section">
            <div className="pdf-section-head"><span>1</span> Company &amp; Role</div>
            <div className="aui-field-row">
              <div className="aui-field">
                <Label icon={FaBuilding} required htmlFor="pd-company">Company Name</Label>
                <input id="pd-company" className={`aui-input${error && !values.companyName.trim() ? ' is-invalid' : ''}`} placeholder="e.g. Infosys" value={values.companyName} onChange={e => set('companyName', e.target.value)} autoFocus />
              </div>
              <div className="aui-field">
                <Label icon={FaUserTie} htmlFor="pd-role">Role / Position</Label>
                <input id="pd-role" className="aui-input" placeholder="e.g. Software Engineer" value={values.role} onChange={e => set('role', e.target.value)} />
              </div>
            </div>
            <div className="aui-field-row">
              <div className="aui-field">
                <Label icon={FaMoneyBillWave} htmlFor="pd-package">Package Offered</Label>
                <input id="pd-package" className="aui-input" placeholder="e.g. 6 LPA" value={values.pkg} onChange={e => set('pkg', e.target.value)} />
              </div>
              <div className="aui-field">
                <Label icon={FaMapMarkerAlt} htmlFor="pd-location">Location</Label>
                <input id="pd-location" className="aui-input" placeholder="e.g. Bangalore" value={values.location} onChange={e => set('location', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="pdf-section">
            <div className="pdf-section-head"><span>2</span> Schedule &amp; Eligibility</div>
            <div className="aui-field-row">
              <div className="aui-field">
                <Label icon={FaCalendarAlt} htmlFor="pd-date">Drive Date</Label>
                <input id="pd-date" type="date" className="aui-input" value={values.driveDate} onChange={e => set('driveDate', e.target.value)} />
              </div>
              <div className="aui-field">
                <label className="aui-label">Status</label>
                <div className="pdf-segment" role="radiogroup" aria-label="Status">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={values.status === opt.value}
                      className={values.status === opt.value ? 'is-active' : ''}
                      onClick={() => set('status', opt.value)}
                    >
                      <i style={{ background: STATUS_COLORS[opt.value] }} />{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="aui-field-row">
              <div className="aui-field">
                <Label icon={FaGraduationCap} htmlFor="pd-cutoff">Minimum {isCgpa ? 'CGPA' : 'Percentage'} (Cutoff)</Label>
                <div className="pdf-cutoff">
                  <div className="pdf-segment pdf-segment-sm" role="radiogroup" aria-label="Eligibility criteria">
                    {(['cgpa', 'percentage'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={values.cutoffType === type}
                        className={values.cutoffType === type ? 'is-active' : ''}
                        onClick={() => onChange({ ...values, cutoffType: type, cutoffScore: '' })}
                      >
                        {type === 'cgpa' ? 'B.Tech CGPA' : 'Percentage'}
                      </button>
                    ))}
                  </div>
                  <div className="pdf-suffix-input">
                    <input
                      id="pd-cutoff"
                      type="number"
                      className="aui-input"
                      min={0}
                      max={isCgpa ? 10 : 100}
                      step={0.1}
                      placeholder={isCgpa ? 'e.g. 7.5' : 'e.g. 60'}
                      value={values.cutoffScore}
                      onChange={e => set('cutoffScore', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                    <span>{isCgpa ? '/ 10' : '%'}</span>
                  </div>
                </div>
                <p className="aui-hint">Leave empty to allow every student.</p>
              </div>
              <div className="aui-field">
                <label className="aui-label">Backlog Policy</label>
                <div className="pdf-backlog">
                  <AdminSelect label="Backlog policy" value={values.backlogPolicy} options={BACKLOG_OPTIONS} onChange={v => set('backlogPolicy', v as DriveFormValues['backlogPolicy'])} />
                  {values.backlogPolicy === 'limited' && (
                    <div className="pdf-suffix-input pdf-max-backlogs">
                      <input
                        type="number"
                        className="aui-input"
                        aria-label="Maximum backlogs"
                        min={1}
                        max={20}
                        step={1}
                        value={values.maxBacklogs}
                        onChange={e => set('maxBacklogs', e.target.value === '' ? '' : parseInt(e.target.value))}
                      />
                      <span>max</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="pdf-section">
            <div className="pdf-section-head">
              <span>3</span> Interview Rounds
              <small>{values.rounds.length} round{values.rounds.length === 1 ? '' : 's'}</small>
              <button type="button" className="aui-btn aui-btn-soft aui-btn-sm pdf-add-round" onClick={() => addRound()}>
                <FaPlus size={9} /> Add Round
              </button>
            </div>

            <ol className="pdf-rounds">
              {values.rounds.map((round, idx) => (
                <li key={idx} className="pdf-round">
                  <span className="pdf-round-num">{round.order}</span>
                  <input
                    className="aui-input"
                    placeholder={`Round ${round.order} name`}
                    value={round.name}
                    onChange={e => renameRound(idx, e.target.value)}
                    aria-label={`Round ${round.order} name`}
                  />
                  <div className="pdf-round-actions">
                    <button type="button" className="aui-icon-btn" onClick={() => moveRound(idx, -1)} disabled={idx === 0} aria-label="Move up"><FaArrowUp size={10} /></button>
                    <button type="button" className="aui-icon-btn" onClick={() => moveRound(idx, 1)} disabled={idx === values.rounds.length - 1} aria-label="Move down"><FaArrowDown size={10} /></button>
                    <button type="button" className="aui-icon-btn pdf-remove" onClick={() => removeRound(idx)} disabled={values.rounds.length <= 1} aria-label="Remove round"><FaTrashAlt size={10} /></button>
                  </div>
                </li>
              ))}
            </ol>

            {suggestions.length > 0 && (
              <div className="pdf-suggest">
                <span><FaListOl size={10} /> Quick add:</span>
                {suggestions.map(s => (
                  <button key={s} type="button" onClick={() => addRound(s)}><FaPlus size={8} /> {s}</button>
                ))}
              </div>
            )}
          </section>
        </form>

        {/* Footer */}
        <div className="pdf-foot">
          {footerNote ? <span className="pdf-foot-note"><FaEnvelope size={11} /> {footerNote}</span> : <span />}
          <div className="pdf-foot-actions">
            <button key="cancel" type="button" className="aui-btn" onClick={onHide} disabled={submitting}>Cancel</button>
            <button key="submit" type="button" className="aui-btn aui-btn-primary" onClick={onSubmit} disabled={submitting}>
              {submitting ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> {submittingLabel}</> : <><FaCheck size={11} /> {submitLabel}</>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .pdf-dialog { max-width: 980px; }
        .pdf-content { overflow: hidden; border: 1px solid #25282b !important; border-radius: 14px !important; background: #0e1012 !important; color: #eceef0; }
        .pdf-shell { display: flex; flex-direction: column; max-height: calc(100vh - 3.5rem); }
        .pdf-head { display: flex; align-items: center; gap: 12px; padding: 1rem 1.25rem; border-bottom: 1px solid #25282b; background: #111315; }
        .pdf-head-text { flex: 1; min-width: 0; }
        .pdf-head h3 { margin: 0; color: #fff; font-size: 1.1rem; font-weight: 750; }
        .pdf-head p { margin: 2px 0 0; color: #858a90; font-size: 0.78rem; }
        .pdf-body { flex: 1; overflow-y: auto; padding: 1.1rem 1.25rem 0.25rem; }
        .pdf-body > .aui-alert { margin-bottom: 1rem; }
        .pdf-section { margin-bottom: 1rem; padding: 1rem 1rem 0.15rem; border: 1px solid #25282b; border-radius: 12px; background: #111315; }
        .pdf-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 0.9rem; color: #fff; font-size: 0.86rem; font-weight: 700; }
        .pdf-section-head > span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,122,0,0.15); color: #ff9a3c; font-size: 0.7rem; font-weight: 800; }
        .pdf-section-head small { color: #858a90; font-size: 0.72rem; font-weight: 500; }
        .pdf-add-round { margin-left: auto; }
        .pdf-label-icon { color: #ff7a00; font-size: 0.72rem; }
        .pdf-required { padding: 1px 7px; border-radius: 99px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.62rem; font-weight: 700; }

        .pdf-segment { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 3px; border: 1px solid #34383d; border-radius: 9px; background: #17191c; }
        .pdf-segment button { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 0.85rem; border: 0; border-radius: 7px; background: none; color: #9aa0a6; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
        .pdf-segment button:hover { color: #fff; }
        .pdf-segment button.is-active { background: #23262a; color: #fff; box-shadow: inset 0 0 0 1px #3a3e43; }
        .pdf-segment button i { width: 7px; height: 7px; border-radius: 50%; }
        .pdf-segment-sm button { height: 32px; padding: 0 0.7rem; font-size: 0.76rem; }
        .pdf-segment-sm button.is-active { background: rgba(255,122,0,0.15); color: #ff9a3c; box-shadow: inset 0 0 0 1px rgba(255,122,0,0.45); }

        .pdf-cutoff { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pdf-suffix-input { position: relative; flex: 1 1 120px; }
        .pdf-suffix-input .aui-input { padding-right: 3rem; }
        .pdf-suffix-input > span { position: absolute; top: 50%; right: 0.8rem; transform: translateY(-50%); color: #858a90; font-size: 0.78rem; pointer-events: none; }
        .pdf-backlog { display: flex; gap: 8px; }
        .pdf-backlog .aui-dropdown { flex: 1; }
        .pdf-max-backlogs { flex: 0 0 110px; }

        .pdf-rounds { display: flex; flex-direction: column; gap: 8px; margin: 0 0 0.85rem; padding: 0; list-style: none; }
        .pdf-round { display: flex; align-items: center; gap: 10px; }
        .pdf-round-num { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; background: linear-gradient(135deg, #ff9a3c, #ff7a00); color: #fff; font-size: 0.74rem; font-weight: 800; }
        .pdf-round .aui-input { flex: 1; min-width: 0; }
        .pdf-round-actions { display: flex; gap: 5px; flex-shrink: 0; }
        .pdf-round-actions .aui-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pdf-remove:hover:not(:disabled) { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .pdf-suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 0.85rem; }
        .pdf-suggest > span { display: inline-flex; align-items: center; gap: 5px; color: #6b7280; font-size: 0.72rem; }
        .pdf-suggest button { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border: 1px dashed #3a3e43; border-radius: 99px; background: none; color: #9ca3af; font-size: 0.72rem; cursor: pointer; }
        .pdf-suggest button:hover { border-color: rgba(255,122,0,0.6); color: #ff9a3c; }

        .pdf-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0.85rem 1.25rem; border-top: 1px solid #25282b; background: #111315; }
        .pdf-foot-note { display: inline-flex; align-items: center; gap: 7px; color: #858a90; font-size: 0.76rem; }
        .pdf-foot-note svg { color: #ff9a3c; }
        .pdf-foot-actions { display: flex; gap: 8px; }

        @media (max-width: 767.98px) {
          .pdf-foot { flex-direction: column; align-items: stretch; }
          .pdf-foot-actions { justify-content: flex-end; }
        }
      `}</style>
    </Modal>
  )
}

export default DriveFormModal
