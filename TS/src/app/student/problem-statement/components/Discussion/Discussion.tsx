import { useEffect, useState } from 'react'
import CommentBox from './CommentBox'
import DiscussionItem from './DiscussionItem'
import Pagination from '../Pagination'
import axios from 'axios'

type DiscussionType = {
  _id: string
  userId: { name: string }
  text: string
  likes: number
  replies: any[]
  createdAt: string
}

const PAGE_SIZE = 5
const baseURL = import.meta.env.VITE_API_BASE_URL

const Discussion = ({ problemId }: { problemId: number }) => {
  const [data, setData] = useState<DiscussionType[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchDiscussions = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/code-challenge/discussions`, {
        params: { problemId, page, limit: PAGE_SIZE },
      })

      setData(res.data?.discussions || [])
      setTotal(res.data?.total || 0)
    } catch (err) {
      console.error('Discussion fetch failed', err)
      setData([])
      setTotal(0)
    }
  }

  useEffect(() => {
    fetchDiscussions()
  }, [page, problemId])

  useEffect(() => {
    setPage(1)
  }, [problemId])

  return (
    <>
      {/* Header */}
      <h6 className="fw-semibold mb-2">💬 Discussion ({total})</h6>

      {/* Comment box */}
      <CommentBox problemId={problemId} onSuccess={fetchDiscussions} />

      {/* Discussion list */}
      {data.length > 0 ? (
        data.map((d) => <DiscussionItem key={d._id} discussion={d} onUpdate={fetchDiscussions} />)
      ) : (
        <div className="text-muted small py-2">No discussions yet. Be the first to ask a question.</div>
      )}

      {/* Pagination (Right aligned & compact) */}
      {total > PAGE_SIZE && (
        <div className="d-flex justify-content-end mt-2">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
        </div>
      )}
    </>
  )
}

export default Discussion
