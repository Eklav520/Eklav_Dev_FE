import Stepper from 'bs-stepper'
import { FormEvent } from 'react'

const Step4 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form onSubmit={goToNextStep} id="step-4" role="tabpanel" className="content fade" aria-labelledby="steppertrigger4">
      <h4>What are the T&amp;C for this program?</h4>
      <hr />
      <div className="vstack gap-2">
        <div>
          <input type="radio" className="btn-check" name="ques" id="option1111" />
          <label className="btn btn-outline-primary w-100" htmlFor="option1111">
            We have cybersecurity insurance coverage
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option2222" />
          <label className="btn btn-outline-primary w-100" htmlFor="option2222">
            Our dedicated staff will protect us
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option3333" />
          <label className="btn btn-outline-primary w-100" htmlFor="option3333">
            We give regular training for best practices
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option4444" />
          <label className="btn btn-outline-primary w-100" htmlFor="option4444">
            Third-party vendor protection
          </label>
        </div>
      </div>
      <div className="d-flex justify-content-center mt-3">
        <button type="submit" className="btn btn-success next-btn mb-0">
          View result
        </button>
      </div>
    </form>
  )
}

export default Step4
