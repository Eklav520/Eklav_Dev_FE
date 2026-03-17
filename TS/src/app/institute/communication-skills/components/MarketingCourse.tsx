import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import AddVideos from './AddVideos'
import { FaTimes } from 'react-icons/fa'
import { BsPlusCircle } from 'react-icons/bs'

const CourseResumeCard = () => {
  const [videos, setVideos] = useState<any[]>([]) // already uploaded
  const [newVideos, setNewVideos] = useState<any[]>([]) // pending uploads
  const [loading, setLoading] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${baseURL}/communicationSkills/videos`)
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const handleAddVideo = (vid: { file: File; description: string }) => {
    setNewVideos((prev) => [...prev, vid])
  }

  const handleUploadAll = async () => {
    setLoading(true)
    try {
      const uploadedVideos: any[] = []

      for (const vid of newVideos) {
        const file = vid.file

        // Step 1: ask backend for presigned URL
        const { uploadUrl, fileUrl } = await fetch(`${baseURL}/s3/generate-presigned-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            folder: 'commskills', // 👈 ensure stored in commskills folder
          }),
        }).then((res) => res.json())

        // Step 2: upload file to S3 using presigned URL
        await fetch(uploadUrl, {
          method: 'PUT',

          body: file,
        })

        // Step 3: use returned fileUrl (not manual string build)
        uploadedVideos.push({
          video: fileUrl,
          description: vid.description,
          type: 'file',
        })
      }

      // Step 4: save metadata in DB
      const res = await fetch(`${baseURL}/communicationSkills/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadedVideos),
      })

      if (!res.ok) throw new Error('Upload failed')

      const saved = await res.json()
      setVideos((prev) => [...prev, ...saved])
      setNewVideos([])
    } catch (err) {
      console.error('Bulk upload failed:', err)
      alert('Failed to upload videos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      const res = await fetch(`${baseURL}/communicationSkills/videos/${videoId}`, {
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
              <Col key={vid._id} xs={12} sm={6} md={4} lg={3}>
                <div className="border rounded p-2 h-100 d-flex flex-column align-items-center text-center">
                  <video
                    width="260"
                    controls
                    className="mb-2 rounded"
                    src={vid.video} // ✅ direct fileUrl from DB
                  />
                  <p className="mb-2 small text-truncate" title={vid.description}>
                    {vid.description}
                  </p>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(vid._id)} disabled={loading}>
                    <FaTimes />
                  </Button>
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
                  {vid.file.name} — {vid.description}
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
