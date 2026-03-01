import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import AddVideos from './AddVideos'
import { FaTimes } from 'react-icons/fa'
import { BsPlusCircle } from 'react-icons/bs'

type VideoItem = {
  _id?: string
  file?: File
  url?: string
  video?: string
  description: string
  type: 'file' | 'url'
}

const CourseResumeCard = () => {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [newVideos, setNewVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${baseURL}/mock/videos`)
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const handleAddVideo = (vid: any) => {
    setNewVideos((prev) => [...prev, vid])
  }

  const handleUploadAll = async () => {
    setLoading(true)
    try {
      const uploadedVideos: any[] = []
      const urlUploads: any[] = []

      for (const vid of newVideos) {
        if (vid.type === 'file' && vid.file) {
          const file = vid.file

          // FIX 1: use uploadUrl (NOT url)
          const { uploadUrl, fileUrl } = await fetch(`${baseURL}/s3/generate-presigned-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              folder: 'mock',
            }),
          }).then((res) => res.json())

          // FIX 2: upload to uploadUrl
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
          })

          uploadedVideos.push({
            video: fileUrl,
            description: vid.description,
            type: 'file',
          })
        } else if (vid.type === 'url') {
          urlUploads.push({
            video: vid.url,
            description: vid.description,
            type: 'url',
          })
        }
      }

      const res = await fetch(`${baseURL}/mock/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...uploadedVideos, ...urlUploads]),
      })

      const saved = await res.json()
      setVideos((prev) => [...prev, ...saved])
      setNewVideos([])
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (videoId: any) => {
    try {
      const res = await fetch(`${baseURL}/mock/videos/${videoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')

      setVideos((prev) => prev.filter((vid) => vid._id !== videoId))
    } catch (err) {
      console.error('Failed to delete video:', err)
      alert('Failed to delete video')
    }
  }

  return (
    <Card className="border">
      {/* Uploaded Videos */}
      <CardHeader className="border-bottom">
        <CardBody>
          <Row className="g-3">
            {videos.map((vid) => (
              <Col key={vid._id} xs={12} sm={6} md={4} lg={4}>
                <div className="border rounded p-2 h-100 d-flex flex-column text-center">
                  {vid.type === 'url' ? (
                    <iframe
                      src={vid.video}
                      title={vid.description}
                      width="100%"
                      height="200"
                      className="mb-2 rounded"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      className="mb-2 rounded"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                      src={vid.video} // ✅ use direct S3 URL
                    />
                  )}

                  <p className="mb-2 small" style={{ minHeight: '2.5em' }}>
                    {vid.description}
                  </p>

                  <div className="d-flex justify-content-center">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(vid._id)} disabled={loading}>
                      <FaTimes />
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </CardBody>
      </CardHeader>

      {/* New Video Form */}
      <CardBody>
        <AddVideos onAddVideo={handleAddVideo} />
        {newVideos.length > 0 && (
          <>
            <h6 className="mt-3">Pending Uploads:</h6>
            {newVideos.map((vid, idx) => (
              <div key={idx}>
                <p>
                  {vid.type === 'file' ? vid.file?.name : vid.url} — {vid.description}
                </p>
              </div>
            ))}

            <Button variant="success" className="mt-2" onClick={handleUploadAll} disabled={loading}>
              <BsPlusCircle className="me-2" />
              Upload All Videos
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default CourseResumeCard
