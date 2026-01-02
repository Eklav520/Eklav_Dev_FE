import { useState } from 'react'
import { Form, Button } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

const baseURL = import.meta.env.VITE_API_BASE_URL

const CommentBox = ({
  problemId,
  onSuccess,
}: {
  problemId: number
  onSuccess: () => void
}) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [text, setText] = useState('')
  const [type, setType] = useState('Question')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!text.trim() || !token) return

    setLoading(true)
    try {
      await axios.post(
        `${baseURL}/api/code-challenge/discussions`,
        { problemId, text, type },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setText('')
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Comment Input */}
      <Form.Control
        as="textarea"
        rows={3}               // 🔽 reduced height
        size="sm"              // 🔽 compact
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type comment here..."
        className="mb-2"
      />

      {/* Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Select
          size="sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: 130 }}   // 🔽 reduced width
        >
          <option>Question</option>
          <option>Hint</option>
          <option>Clarification</option>
        </Form.Select>

        <Button
          size="sm"               // 🔽 smaller button
          variant="success"
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </>
  )
}

export default CommentBox
