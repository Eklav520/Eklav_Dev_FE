import { useState } from 'react'
import axios from 'axios'
import { Form, Button } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FiCornerUpLeft, FiMessageSquare, FiThumbsUp } from 'react-icons/fi'

const baseURL = import.meta.env.VITE_API_BASE_URL

const DiscussionItem = ({ discussion, onUpdate }: { discussion: any; onUpdate: () => void }) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const like = async () => {
    await axios.patch(`${baseURL}/api/code-challenge/discussions/${discussion._id}/like`)
    onUpdate()
  }

  const submitReply = async () => {
    if (!replyText.trim() || !token) return

    setReplyLoading(true)
    try {
      await axios.post(
        `${baseURL}/api/code-challenge/discussions/${discussion._id}/reply`,
        { text: replyText },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setReplyText('')
      setShowReply(false)
      onUpdate()
    } finally {
      setReplyLoading(false)
    }
  }

  return (
    <div className="py-3 border-bottom">
      {/* ---- Header ---- */}
      <div className="d-flex justify-content-between">
        <span className="fw-semibold text-primary">{discussion.userId?.name || 'User'}</span>
        <span className="text-muted small">{new Date(discussion.createdAt).toLocaleString()}</span>
      </div>

      {/* ---- Comment ---- */}
      <div className="mt-2">{discussion.text}</div>

      {/* ---- Actions ---- */}
      <div className="d-flex gap-3 mt-2 text-muted small align-items-center">
        <span role="button" onClick={like} className="d-flex align-items-center gap-1">
          <FiThumbsUp size={14} /> {discussion.likes}
        </span>

        <span className="d-flex align-items-center gap-1">
          <FiMessageSquare size={14} /> {discussion.replies.length}
        </span>

        <span role="button" className="d-flex align-items-center gap-1 cursor-pointer" onClick={() => setShowReply(!showReply)}>
          <FiCornerUpLeft size={14} /> Reply
        </span>
      </div>

      {/* ---- Reply Box ---- */}
      {showReply && (
        <div className="mt-3">
          <Form.Control
            as="textarea"
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="mb-2"
          />

          <div className="d-flex gap-2">
            <Button size="sm" variant="success" onClick={submitReply} disabled={replyLoading}>
              {replyLoading ? 'Replying...' : 'Reply'}
            </Button>

            <Button size="sm" variant="outline-secondary" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ---- Replies List ---- */}
      {discussion.replies.length > 0 && (
        <div className="mt-3 ms-4">
          {discussion.replies.map((r: any, idx: number) => (
            <div key={idx} className="mb-2">
              <div className="fw-semibold small">{r.userId?.name || 'User'}</div>
              <div className="text-muted small">{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DiscussionItem
