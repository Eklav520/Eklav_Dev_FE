import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { BsCheckCircleFill } from 'react-icons/bs'
import { linkedAccount, LinkedType } from '../data'

const LinkedData = ({ description, icon: Icon, isActive, name, variant }: LinkedType) => {
  return (
    <div className={`position-relative mb-4 d-sm-flex ${isActive && 'bg-success border-success'}  bg-opacity-10 border  p-3 rounded`}>
      <h2 className="fs-1 mb-0 me-3">

        <Icon className={variant} />
      </h2>
      <div>
        {isActive && (
          <div className="position-absolute top-0 start-100 translate-middle bg-white rounded-circle lh-1 h-20px">
            <BsCheckCircleFill className="bi bi-check-circle-fill text-success fs-5" />
          </div>
        )}
        <h6 className="mb-1">{name}</h6>
        <p className="mb-1 small">{description}</p>
        {isActive ? (
          <button type="button" className="btn btn-sm btn-danger mb-0">
            Invoke
          </button>
        ) : (
          <button type="button" className="btn btn-sm btn-primary mb-0">
            Connect {name}
          </button>
        )}
        <a href="#" className="btn btn-sm btn-link text-body mb-0">
          Learn more
        </a>
      </div>
    </div>
  )
}

const LinkedAccount = () => {
  return (
    <Col lg={6}>
      <Card className="bg-transparent border rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h5 className="card-header-title mb-0">Linked account</h5>
        </CardHeader>
        {linkedAccount.map((item, idx) => (
          <CardBody className="pb-0" key={idx}>
            <LinkedData {...item} />
          </CardBody>
        ))}
      </Card>
    </Col>
  )
}

export default LinkedAccount
