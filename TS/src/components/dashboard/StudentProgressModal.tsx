import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaTimes } from 'react-icons/fa'
import { profileImageUrl, sName, type Report, type Student } from './studentReportData'
import StudentProgressView from './StudentProgressView'

/* Admin popup: full-screen progress report for one student. The rows themselves live in
   StudentProgressView, which the student's own dashboard also uses. */

const StudentProgressModal = ({ student, show, onHide, fetchReport }: {
  student: Student | null
  show: boolean
  onHide: () => void
  fetchReport: (studentId: string, from?: string, to?: string) => Promise<Report | null>
}) => {
  const [report, setReport] = useState<Report | null>(null)
  useEffect(() => { setReport(null) }, [student?._id])

  const r = report
  const avatar = r?.student.profileImage ? profileImageUrl(r.student.profileImage) : ''
  const name = r?.student.name || (student ? sName(student) : 'Student')

  return (
    <Modal show={show} onHide={onHide} fullscreen contentClassName="aui-modal spx-modal" backdropClassName="aui-backdrop">
      <div className="aui-modal-head spx-head">
        <span className="spx-avatar">{avatar ? <img src={avatar} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} /> : null}<b>{name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</b></span>
        <div>
          <h3>{name} <span className="spx-head-sub">· Progress report</span></h3>
          <p>{[r?.student.email || student?.email, r?.student.rollNumber || student?.rollNumber, r?.student.branch || student?.branch].filter(Boolean).join(' · ')}</p>
          {r?.student.college && <p className="spx-college" title={r.student.college}>{r.student.college.split(',')[0].trim()}</p>}
        </div>
        <button type="button" className="aui-icon-btn" onClick={onHide} aria-label="Close"><FaTimes size={12} /></button>
      </div>

      <div className="aui-modal-body spx-body">
        {show && student && (
          <StudentProgressView studentId={student._id} name={name} fetchReport={fetchReport} theme="dark" onLoaded={setReport} />
        )}
      </div>

      <style>{`
        .spx-modal { border: 0 !important; border-radius: 0 !important; background: #08090a !important; }
        .spx-head { position: sticky; top: 0; z-index: 3; flex-wrap: wrap; padding: 0.85rem 1.5rem !important; }
        .spx-head h3 { font-size: 1.1rem !important; }
        .spx-head > div:nth-child(2) { flex: 1 1 320px; min-width: 0; }
        .spx-head > .aui-icon-btn { margin-left: auto; }
        .spx-head-sub { color: #6b7280; font-weight: 500; }
        .spx-head .spx-college { margin-top: 1px !important; color: #ffb15e !important; font-size: 0.74rem !important; font-weight: 600; }
        .spx-avatar { position: relative; display: grid; place-items: center; width: 46px; height: 46px; flex: 0 0 46px; overflow: hidden; border: 1px solid rgba(255,122,0,0.35); border-radius: 50%; background: rgba(255,122,0,0.12); color: #ffb15e; font-size: 0.85rem; }
        .spx-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .spx-body { padding: 1.25rem 1.5rem 2rem !important; background: #08090a; }
      `}</style>
    </Modal>
  )
}

export default StudentProgressModal
