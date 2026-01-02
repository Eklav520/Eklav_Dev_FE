import Stepper from 'bs-stepper'
import { FormEvent } from 'react'

const Step2 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form id="step-2" onSubmit={goToNextStep} role="tabpanel" className="content fade" aria-labelledby="steppertrigger2">
      <h4>What is SEO?</h4>
      <hr />
      <div className="vstack gap-2">
        <div>
          <input type="radio" className="btn-check" name="ques" id="option11" />
          <label className="btn btn-outline-primary w-100" htmlFor="option11">
            We have cybersecurity insurance coverage
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option22" />
          <label className="btn btn-outline-primary w-100" htmlFor="option22">
            Our dedicated staff will protect us
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option33" />
          <label className="btn btn-outline-primary w-100" htmlFor="option33">
            We give regular training for best practices
          </label>
        </div>
        <div>
          <input type="radio" className="btn-check" name="ques" id="option44" />
          <label className="btn btn-outline-primary w-100" htmlFor="option44">
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

export default Step2
