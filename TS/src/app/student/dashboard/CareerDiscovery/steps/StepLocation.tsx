import { Button } from 'react-bootstrap'

const options = ['India', 'US', 'Europe', 'Japan', 'Open to anywhere']

const StepLocation = ({ profile, setProfile }: any) => {
  const toggle = (loc: string) => {
    setProfile({
      ...profile,
      locations: profile.locations.includes(loc)
        ? profile.locations.filter((l: string) => l !== loc)
        : [...profile.locations, loc],
    })
  }

  return (
    <>
      <h5 className="fw-bold mb-3">Preferred work location</h5>
      <div className="d-flex flex-wrap gap-2">
        {options.map((loc) => (
          <Button
            key={loc}
            variant={
              profile.locations.includes(loc)
                ? 'primary'
                : 'outline-primary'
            }
            onClick={() => toggle(loc)}>
            {loc}
          </Button>
        ))}
      </div>
    </>
  )
}

export default StepLocation
