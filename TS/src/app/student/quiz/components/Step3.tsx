import Stepper from 'bs-stepper'
import { FormEvent } from 'react'

const Step3 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form onSubmit={goToNextStep} id="step-3" role="tabpanel" className="content fade" aria-labelledby="steppertrigger3">
      <h4>Who should join this course?</h4>
      <hr />
      <div className="vstack gap-2">
        <div>
          <input type="radio" className="btn-check" name="ques" id="option111" />
          <label className="btn btn-outline-primary w-100" htmlFor="option111">
            We have cybersecurity insurance coverage
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option222" />
          <label className="btn btn-outline-primary w-100" htmlFor="option222">
            Our dedicated staff will protect us
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option333" />
          <label className="btn btn-outline-primary w-100" htmlFor="option333">
            We give regular training for best practices
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option444" />
          <label className="btn btn-outline-primary w-100" htmlFor="option444">
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

export default Step3
