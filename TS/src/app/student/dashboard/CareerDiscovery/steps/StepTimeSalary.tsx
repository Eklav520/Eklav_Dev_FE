import { Form } from 'react-bootstrap'

const StepTimeSalary = ({ profile, setProfile }: any) => (
  <>
    <h5 className="fw-bold mb-3">Time & Salary Goal</h5>

    <Form.Group className="mb-3">
      <Form.Label>Daily time available</Form.Label>
      <Form.Select
        value={profile.dailyTime}
        onChange={(e) =>
          setProfile({ ...profile, dailyTime: e.target.value })
        }>
        <option value="">Select</option>
        <option>&lt; 1 hour</option>
        <option>1–2 hours</option>
        <option>3–4 hours</option>
        <option>Full-time</option>
      </Form.Select>
    </Form.Group>

    <Form.Group>
      <Form.Label>Target annual salary</Form.Label>
      <Form.Select
        value={profile.targetSalary}
        onChange={(e) =>
          setProfile({ ...profile, targetSalary: e.target.value })
        }>
        <option value="">Select</option>
        <option>₹5–8 LPA</option>
        <option>₹8–15 LPA</option>
        <option>₹15–25 LPA</option>
        <option>₹25+ LPA</option>
        <option>I want clarity, not salary</option>
      </Form.Select>
    </Form.Group>
  </>
)

export default StepTimeSalary
