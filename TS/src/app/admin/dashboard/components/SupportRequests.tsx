import { supportRequestsData } from '@/assets/data/products'
import { colorVariants } from '@/context/constants'
import { SupportRequestsType } from '@/types/other'
import { timeSince } from '@/utils/date'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { Fragment } from 'react/jsx-runtime'

const SupportRequestsCard = ({ description, name, time, image }: SupportRequestsType) => {
  var randomItem = colorVariants[Math.floor(Math.random() * colorVariants.length)]

  return (
    <>
      <div className="d-flex justify-content-between position-relative">
        <div className="d-sm-flex">
          <div className="avatar avatar-md flex-shrink-0">
            {image ? (
              <img className="avatar-img rounded-circle" src={image} alt="avatar" />
            ) : (
              <div className={`avatar-img rounded-circle bg-${randomItem} bg-opacity-10`}>
                <span className={`position-absolute top-50 text-${randomItem} start-50 translate-middle fw-bold`}>
                  {name.charAt(0)}
                  {description.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ms-0 ms-sm-2 mt-2 mt-sm-0">
            <h6 className="mb-0">
              <a href="#" className="stretched-link">
                {name}
              </a>
            </h6>
            <p className="mb-0">{description}</p>
            <span className="small">{timeSince(time)} </span>
          </div>
        </div>
      </div>
    </>
  )
}

const SupportRequests = () => {
  return (
    <Col xxl={4}>
      <Card className="shadow h-100">
        <CardHeader className="border-bottom d-flex justify-content-between align-items-center p-4">
          <h5 className="card-header-title">Support Requests</h5>
          <Link to="#" className="btn btn-link p-0 mb-0">
            View all
          </Link>
        </CardHeader>
        <CardBody className="p-4">
          {supportRequestsData.map((item, idx) => (
            <Fragment key={idx}>
              <SupportRequestsCard {...item} />
              {supportRequestsData.length - 1 != idx && <hr />}
            </Fragment>
          ))}
        </CardBody>
      </Card>
    </Col>
  )
}

export default SupportRequests
