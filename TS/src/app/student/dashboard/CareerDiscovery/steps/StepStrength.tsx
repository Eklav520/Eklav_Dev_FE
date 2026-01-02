import { Form } from 'react-bootstrap'

const options = [
  'Logical problem solving',
  'Math & numbers',
  'Creativity & design',
  'Communication & planning',
  'Still exploring',
]

const StepStrength = ({ profile, setProfile }: any) => (
  <>
    <h5 className="fw-bold mb-3">Which best describes you?</h5>
    <Form>
      {options.map((opt) => (
        <Form.Check
          key={opt}
          type="radio"
          label={opt}
          checked={profile.strength === opt}
          onChange={() => setProfile({ ...profile, strength: opt })}
        />
      ))}
    </Form>
  </>
)

export default StepStrength
