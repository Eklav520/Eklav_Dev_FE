import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import DriveFormModal, { emptyDriveForm, validateDrive, driveFormToPayload, type DriveFormValues } from './DriveForm'

interface Props {
  show: boolean
  onHide: () => void
  onCreated: (eligibleCount: number) => void
}

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
]

const CreateDriveModal = ({ show, onHide, onCreated }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [values, setValues] = useState<DriveFormValues>(emptyDriveForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setValues(emptyDriveForm())
    setError('')
  }

  const handleSubmit = async () => {
    const problem = validateDrive(values)
    if (problem) { setError(problem); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await axios.post(
        `${baseURL}/api/placement-drives`,
        driveFormToPayload(values),
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      resetForm()
      onCreated(res.data.eligibleCount)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create drive')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onHide()
  }

  return (
    <DriveFormModal
      show={show}
      onHide={handleClose}
      icon={FaPlus}
      title="New Placement Drive"
      subtitle="Set the company, eligibility and rounds — eligible students are notified automatically"
      values={values}
      onChange={setValues}
      statusOptions={STATUS_OPTIONS}
      error={error}
      submitting={submitting}
      submitLabel="Create Drive & Notify Students"
      submittingLabel="Creating…"
      onSubmit={handleSubmit}
      footerNote="Eligible students will receive an email about this drive"
    />
  )
}

export default CreateDriveModal
