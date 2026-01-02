import { useState } from 'react'
import { Card, Button, Container } from 'react-bootstrap'
import ProgressStepper from './ProgressStepper'
import StepInterests from './steps/StepInterests'
import StepEducation from './steps/StepEducation'
import StepStrength from './steps/StepStrength'
import StepTimeSalary from './steps/StepTimeSalary'
import StepLocation from './steps/StepLocation'
import { CareerProfile } from '../career'

type CareerDiscoveryProps = {
  onComplete: (profile: CareerProfile) => void
}

const steps = [
  'Interests',
  'Education',
  'Strength',
  'Time & Salary',
  'Location',
]

const CareerDiscovery: React.FC<CareerDiscoveryProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const [profile, setProfile] = useState<CareerProfile>({
    interests: [],
    educationLevel: '',
    strength: '',
    dailyTime: '',
    targetSalary: '',
    locations: [],
  })

  const next = () => setCurrentStep((s) => s + 1)
  const back = () => setCurrentStep((s) => s - 1)

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return profile.interests.length > 0
      case 1:
        return !!profile.educationLevel
      case 2:
        return !!profile.strength
      case 3:
        return !!profile.dailyTime && !!profile.targetSalary
      case 4:
        return profile.locations.length > 0
      default:
        return false
    }
  }

  /* 🔥 FIXED: CALL onComplete */
  const submitProfile = () => {
    console.log('Submitting Career Profile:', profile)
    onComplete(profile)
  }

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Card className="p-4 shadow-lg" style={{ width: '100%', maxWidth: 720 }}>
        <h3 className="fw-bold text-center mb-2">
          Discover Your Career Path
        </h3>
        <p className="text-muted text-center mb-4">
          Answer a few questions to get your personalized roadmap
        </p>

        <ProgressStepper steps={steps} currentStep={currentStep} />

        {currentStep === 0 && (
          <StepInterests profile={profile} setProfile={setProfile} />
        )}
        {currentStep === 1 && (
          <StepEducation profile={profile} setProfile={setProfile} />
        )}
        {currentStep === 2 && (
          <StepStrength profile={profile} setProfile={setProfile} />
        )}
        {currentStep === 3 && (
          <StepTimeSalary profile={profile} setProfile={setProfile} />
        )}
        {currentStep === 4 && (
          <StepLocation profile={profile} setProfile={setProfile} />
        )}

        <div className="d-flex justify-content-between mt-4">
          <Button
            variant="secondary"
            disabled={currentStep === 0}
            onClick={back}>
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button disabled={!isStepValid()} onClick={next}>
              Next
            </Button>
          ) : (
            <Button
              variant="success"
              disabled={!isStepValid()}
              onClick={submitProfile}>
              Generate My Career Path
            </Button>
          )}
        </div>
      </Card>
    </Container>
  )
}

export default CareerDiscovery
