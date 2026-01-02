import { Fragment } from 'react'
import { Button, Col, Row } from 'react-bootstrap'

import { commentsData } from '../data'
import CommentPost from './CommentPost'

const Comments = () => {
  return (
    <Row className="mt-4">
      <Col md={7}>
        <h3>3 comments</h3>
        {commentsData.map((comment, idx) => (
          <Fragment key={idx}>
            <div className="my-4 d-flex">
              <img className="avatar avatar-md rounded-circle me-3" src={comment.avatar} alt="avatar" />
              <div>
                <div className="mb-2">
                  <h5 className="m-0">{comment.name}</h5>
                  <span className="me-3 small">
                    {comment.createdAt.toLocaleDateString()} at {comment.createdAt.toLocaleTimeString()}
                  </span>
                </div>
                <p>{comment.comment}</p>
                <Button size="sm" variant="light" className="mb-0">
                  Reply
                </Button>
              </div>
            </div>
            {comment.reply &&
              comment.reply.map((reply, idx) => (
                <div className="my-4 d-flex ps-2 ps-md-4" key={idx}>
                  <img className="avatar avatar-md rounded-circle me-3" src={reply.avatar} alt="avatar" />
                  <div>
                    <div className="mb-2">
                      <h5 className="m-0">{reply.name}</h5>
                      <span className="me-3 small">
                        {reply.createdAt.toLocaleDateString()} at {reply.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{reply.comment}</p>
                    <Button variant="light" size="sm" className="mb-0">
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
          </Fragment>
        ))}
      </Col>
      <Col md={5}>
        <h3 className="mt-3 mt-sm-0">Your Views Please!</h3>
        <small>Your email address will not be published. Required fields are marked *</small>
        <CommentPost />
      </Col>
    </Row>
  )
}
export default Comments
