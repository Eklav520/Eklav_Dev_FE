import Stepper from 'bs-stepper'
import { FormEvent } from 'react'

const Step1 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form id="step-1" onSubmit={goToNextStep} role="tabpanel" className="content show fade" aria-labelledby="steppertrigger1">
      <h4>How do you protect your business against cyber-crime?</h4>
      <hr />
      <div className="vstack gap-2">
        <div>
          <input type="radio" className="btn-check" name="ques" id="option1" />
          <label className="btn btn-outline-primary w-100" htmlFor="option1">
            We have cybersecurity insurance coverage
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option2" />
          <label className="btn btn-outline-primary w-100" htmlFor="option2">
            Our dedicated staff will protect us
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option3" />
          <label className="btn btn-outline-primary w-100" htmlFor="option3">
            We give regular training for best practices
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option4" />
          <label className="btn btn-outline-primary w-100" htmlFor="option4">
            Third-party vendor protection
          </label>
        </div>
      </div>
      <div className="d-flex justify-content-center mt-3">
        <button type="submit" className="btn btn-primary next-btn mb-0">
          Next question
        </button>
      </div>
    </form>
  )
}

export default Step1
