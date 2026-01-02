import { Form } from 'react-bootstrap'

const options = [
  'School (11–12)',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Working Professional',
]

const StepEducation = ({ profile, setProfile }: any) => (
  <>
    <h5 className="fw-bold mb-3">Your education level</h5>
    <Form>
      {options.map((opt) => (
        <Form.Check
          key={opt}
          type="radio"
          name="education"
          label={opt}
          checked={profile.educationLevel === opt}
          onChange={() =>
            setProfile({ ...profile, educationLevel: opt })
          }
        />
      ))}
    </Form>
  </>
)

export default StepEducation
