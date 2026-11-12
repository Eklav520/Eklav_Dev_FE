import { useEffect, useState } from 'react'
import { FaBuilding } from 'react-icons/fa'

/* Predefined round types; a predefined round stores its type as roundName, so admin screens
   show these labels instead */
export const ROUND_OPTIONS = [
  { label: 'Aptitude Test', value: 'MCQ' },
  { label: 'Coding Round', value: 'CODING' },
  { label: 'Technical Interview', value: 'TR' },
  { label: 'HR Interview', value: 'HR' },
  { label: 'Group Discussion', value: 'GD' },
  { label: 'Case Study', value: 'CASE_STUDY' },
  { label: 'System Design', value: 'SYSTEM_DESIGN' },
  { label: 'Managerial Round', value: 'MANAGERIAL' },
]

export const roundTitle = (round: { roundName?: string; roundType?: string }) =>
  (round.roundType !== 'CUSTOM' && ROUND_OPTIONS.find(o => o.value === round.roundType)?.label) || round.roundName || 'Round'

export const CompanyLogo = ({ src, name, size = 36 }: { src?: string; name: string; size?: number }) => {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const initial = (name || '').trim().charAt(0).toUpperCase()
  return (
    <span className="ci-logo" style={{ width: size, height: size, flexBasis: size }}>
      {src && !failed
        ? <img src={src} alt={name} onError={() => setFailed(true)} />
        : <span className="ci-logo-fallback" style={{ fontSize: size * 0.42 }}>{initial || <FaBuilding />}</span>}
    </span>
  )
}
