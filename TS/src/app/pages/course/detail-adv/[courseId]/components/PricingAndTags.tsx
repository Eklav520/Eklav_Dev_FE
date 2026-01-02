import React, { useEffect, useState } from 'react'
import { Button, Card, Col, Row, Form } from 'react-bootstrap'
import Sticky from 'react-sticky-el'
import useViewPort from '@/hooks/useViewPort'
import { useAuthContext } from '@/context/useAuthContext'

type Discussion = {
  _id: string
  content: string
  userId: { email: string }
  createdAt: string
  replies?: Discussion[] // nested replies
}

const ReplyInput = ({ onAddReply, loading }: { onAddReply: (reply: string) => void; loading: boolean }) => {
  const [reply, setReply] = useState('')

  const handleSubmit = () => {
    if (reply.trim() !== '') {
      onAddReply(reply.trim())
      setReply('')
    }
  }

  return (
    <div className="mt-2">
      <Form.Control size="sm" placeholder="Write your reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
      <Button size="sm" variant="outline-primary" className="mt-1" onClick={handleSubmit} disabled={loading || reply.trim() === ''}>
        {loading ? 'Sending...' : 'Reply'}
      </Button>
    </div>
  )
}

const Comment = ({ comment, onAddReply }: { comment: Discussion; onAddReply: (parentId: string, reply: string) => void }) => {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)

  const handleAddReply = async (replyText: string) => {
    setLoadingReply(true)
    await onAddReply(comment._id, replyText)
    setLoadingReply(false)
    setShowReplyInput(false)
  }

  return (
    <li className="mb-3 border-bottom pb-2">
      <div>
        <strong>{comment.userId.email}</strong>:
        <br />
        {comment.content}
        <br />
        <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
      </div>
      <Button size="sm" variant="link" className="p-0 mt-1" onClick={() => setShowReplyInput((prev) => !prev)}>
        {showReplyInput ? 'Cancel' : 'Reply'}
      </Button>
      {showReplyInput && <ReplyInput onAddReply={handleAddReply} loading={loadingReply} />}
      {comment.replies && comment.replies.length > 0 && (
        <ul className="list-unstyled ms-4 mt-2">
          {comment.replies.map((reply) => (
            <Comment key={reply._id} comment={reply} onAddReply={onAddReply} />
          ))}
        </ul>
      )}
    </li>
  )
}

const PriceCard = ({ onAddComment, loading, disabled }: { onAddComment: (comment: string) => void; loading: boolean; disabled: boolean }) => {
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim() !== '') {
      onAddComment(comment.trim())
      setComment('')
    }
  }

  return (
    <Card className="card-body border p-4">
      <div className="d-flex justify-content-between align-items-center">
        <h3 className="fw-bold mb-0 me-2">Add Comments</h3>
      </div>
      {/* Large textarea */}
      <div className="mt-3 d-flex align-items-start gap-2">
        <Form.Control
          as="textarea"
          rows={1}
          placeholder="Write your comment here..."
          value={comment}
          maxLength={500}
          onChange={(e) => setComment(e.target.value)}
          disabled={disabled}
          style={{ resize: 'none', minWidth: '0', flex: 1 }}
        />
        <Button variant="success" size="sm" onClick={handleSubmit} disabled={loading || comment.trim() === ''}>
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </Card>
  )
}

const PopularTags = ({ comments, onAddReply }: { comments: Discussion[]; onAddReply: (parentId: string, reply: string) => void }) => {
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({})

  const handleReplyChange = (id: string, value: string) => {
    setReplyContent((prev) => ({ ...prev, [id]: value }))
  }

  const handleReplySubmit = (id: string) => {
    const content = replyContent[id]?.trim()
    if (content) {
      onAddReply(id, content)
      setReplyContent((prev) => ({ ...prev, [id]: '' }))
    }
  }

  return (
    <Card className="card-body border p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <h6 className="fw-bold mb-3">Comments</h6>

      {comments.length === 0 ? (
        <p className="text-muted">No comments yet.</p>
      ) : (
        <ul className="list-unstyled">
          {comments.map((comment) => (
            <li key={comment._id} className="mb-4 border-bottom pb-3">
              {/* Comment Author */}
              <div className="fw-semibold text-primary mb-1">{comment.userId?.email || 'User'}</div>

              {/* Comment Content */}
              <div className="ms-3 mb-2">{comment.content}</div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <ul className="list-unstyled ms-4 mt-2">
                  {comment.replies.map((reply) => (
                    <li key={reply._id} className="mb-2">
                      <div className="fw-semibold text-success">{reply.userId?.email || 'User'}</div>
                      <div className="ms-3">{reply.content}</div>
                      {/* Uncomment if you want timestamp */}
                      {/* <small className="text-muted">{new Date(reply.createdAt).toLocaleString()}</small> */}
                    </li>
                  ))}
                </ul>
              )}

              {/* Reply input */}
              <div className="mt-2 ms-4">
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Write a reply..."
                  maxLength={500}
                  value={replyContent[comment._id] || ''}
                  onChange={(e) => handleReplyChange(comment._id, e.target.value)}
                  className="mb-1"
                />
                <Button variant="outline-success" size="sm" onClick={() => handleReplySubmit(comment._id)}>
                  Reply
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const PricingAndTags = ({ courseId }: { courseId: string }) => {
  const { width } = useViewPort()
  const [comments, setComments] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const { user } = useAuthContext()
  const token = user?.token

  const baseURL = import.meta.env.VITE_API_BASE_URL; // replace with your backend

  useEffect(() => {
    const fetchComments = async () => {
      setFetching(true)
      try {
        const res = await fetch(`${baseURL}/discussions/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) throw new Error('Failed to fetch discussions')
        const data = await res.json()
        setComments(data)
      } catch (error) {
        console.error(error)
      } finally {
        setFetching(false)
      }
    }

    if (courseId) fetchComments()
  }, [courseId])

  const handleAddComment = async (newComment: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId, content: newComment }),
      })
      if (!res.ok) throw new Error('Failed to post discussion')
      const data = await res.json()
      setComments((prev) => [data.discussion, ...prev])
    } catch (error) {
      console.error(error)
      alert('Failed to add comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddReply = async (parentId: string, reply: string) => {
    try {
      const res = await fetch(`${baseURL}/discussions/${parentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: reply }),
      })
      if (!res.ok) throw new Error('Failed to post reply')
      const data = await res.json()

      // Update the comments state with the new reply nested under parent
      const updateReplies = (comments: Discussion[]): Discussion[] => {
        return comments.map((cmt) => {
          if (cmt._id === parentId) {
            return {
              ...cmt,
              replies: cmt.replies ? [data.reply, ...cmt.replies] : [data.reply],
            }
          } else if (cmt.replies) {
            return { ...cmt, replies: updateReplies(cmt.replies) }
          }
          return cmt
        })
      }

      setComments((prev) => updateReplies(prev))
    } catch (error) {
      console.error(error)
      alert('Failed to add reply. Please try again.')
    }
  }

  {
    /* <Sticky
      disabled={width <= 768}
      topOffset={80}
      bottomOffset={0}
      boundaryElement="div.row"
      hideOnBoundaryHit={false}
      stickyStyle={{ transition: '0.2s all linear' }}>
      
    </Sticky> */
  }

  return (
    <div className="my-3">
      <Row className="g-2">
        <Col md={6} xl={12}>
          <PriceCard onAddComment={handleAddComment} loading={loading} disabled={fetching} />
        </Col>
        <Col md={6} xl={12}>
          <PopularTags comments={comments} onAddReply={handleAddReply} />
        </Col>
      </Row>
    </div>
  )
}

export default PricingAndTags
