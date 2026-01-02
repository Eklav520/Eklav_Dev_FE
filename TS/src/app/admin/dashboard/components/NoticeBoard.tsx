import { noticeBoard } from '@/assets/data/other'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { NoticeBoardType } from '@/types/other'
import { timeSince } from '@/utils/date'
import { Fragment } from 'react'
import { Button, Card, CardBody, CardFooter, CardHeader, Col } from 'react-bootstrap'

const NoticeBoardCard = ({ description, icon: Icon, time, title, variant }: NoticeBoardType) => {
  return (
    <div className="d-flex justify-content-between position-relative">
      <div className="d-sm-flex">
        <div className={`icon-lg bg-${variant} bg-opacity-10 text-${variant} rounded-2 flex-shrink-0`}>{Icon && <Icon className="fs-5" />}</div>
        <div className="ms-0 ms-sm-3 mt-2 mt-sm-0">
          <h6 className="mb-0">
            <a href="#" className="stretched-link">
              {title}
            </a>
          </h6>
          <p className="mb-0">{description}</p>
          <span className="small">{timeSince(time)}</span>
        </div>
      </div>
    </div>
  )
}

const NoticeBoard = () => {
  return (
    <Col lg={6} xxl={4}>
      <Card className="shadow h-100">
        <CardHeader className="border-bottom p-4">
          <h5 className="card-header-title">Notice board</h5>
        </CardHeader>
        <CardBody className="p-4">
          <SimplebarReactClient className="custom-scrollbar h-300px">
            {noticeBoard.map((item, idx) => (
              <Fragment key={idx}>
                <NoticeBoardCard {...item} />
                {noticeBoard.length - 1 != idx && <hr />}
              </Fragment>
            ))}
          </SimplebarReactClient>
        </CardBody>
        <CardFooter className="border-top">
          <div className="alert alert-success d-flex align-items-center mb-0 py-2">
            <div>
              <small className="mb-0">45 more notices listed</small>
            </div>
            <div className="ms-auto">
              <Button size="sm" variant="success-soft" className="mb-0" href="#!">

                View all
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Col>
  )
}

export default NoticeBoard
