import { Button } from 'react-bootstrap'
import { CareerProfile } from '../../career'

const options = [
  'Software Development',
  'AI / Data Science',
  'Cyber Security',
  'Electronics / Embedded',
  'UI / UX Design',
  'Management / Business',
  'Not sure yet',
]

const StepInterests = ({ profile, setProfile }: any) => {
  const toggle = (item: string) => {
    const exists = profile.interests.includes(item)
    if (!exists && profile.interests.length === 3) return

    setProfile({
      ...profile,
      interests: exists
        ? profile.interests.filter((i: string) => i !== item)
        : [...profile.interests, item],
    })
  }

  return (
    <>
      <h5 className="fw-bold mb-3">What are you interested in?</h5>
      <div className="d-flex flex-wrap gap-2">
        {options.map((item) => (
          <Button
            key={item}
            variant={
              profile.interests.includes(item) ? 'primary' : 'outline-primary'
            }
            onClick={() => toggle(item)}>
            {item}
          </Button>
        ))}
      </div>
    </>
  )
}

export default StepInterests
