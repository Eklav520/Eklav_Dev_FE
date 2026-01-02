import { Card } from 'react-bootstrap'

type CareerCardProps = {
  title: string
}

const CareerCard: React.FC<CareerCardProps> = ({ title }) => {
  return (
    <Card className="p-3 shadow-sm mb-3">
      <h6 className="fw-bold">{title}</h6>
      <p className="text-muted mb-0">
        A good alternative based on your profile
      </p>
    </Card>
  )
}

export default CareerCard
