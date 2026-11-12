import { useEffect, useState } from 'react'
import { FaEdit } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import type { PlacementDrive } from './PlacementDriveManagement'
import DriveFormModal, { emptyDriveForm, driveToForm, validateDrive, driveFormToPayload, type DriveFormValues } from './DriveForm'

interface Props {
  show: boolean
  drive: PlacementDrive
  onHide: () => void
  onSaved: () => void
}

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]

const EditDriveModal = ({ show, drive, onHide, onSaved }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [values, setValues] = useState<DriveFormValues>(emptyDriveForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Prefill from drive prop whenever modal opens
  useEffect(() => {
    if (show && drive) {
      setValues(driveToForm(drive))
      setError('')
    }
  }, [show, drive])

  const handleSubmit = async () => {
    const problem = validateDrive(values)
    if (problem) { setError(problem); return }

    setSubmitting(true)
    setError('')
    try {
      await axios.patch(
        `${baseURL}/api/placement-drives/${drive._id}`,
        driveFormToPayload(values),
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      onSaved()
      onHide()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DriveFormModal
      show={show}
      onHide={onHide}
      icon={FaEdit}
      title="Edit Placement Drive"
      subtitle={[drive.companyName, drive.role].filter(Boolean).join(' · ')}
      values={values}
      onChange={setValues}
      statusOptions={STATUS_OPTIONS}
      error={error}
      submitting={submitting}
      submitLabel="Save Changes"
      submittingLabel="Saving…"
      onSubmit={handleSubmit}
    />
  )
}

export default EditDriveModal
