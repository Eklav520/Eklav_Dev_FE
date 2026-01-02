import { ProgressBar } from 'react-bootstrap'

const ProgressStepper = ({
  steps,
  currentStep,
}: {
  steps: string[]
  currentStep: number
}) => {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="mb-4">
      <ProgressBar now={progress} />
      <small className="text-muted">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
      </small>
    </div>
  )
}

export default ProgressStepper
