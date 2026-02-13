import { useEffect, useState } from 'react'
import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'react-bootstrap'
import { BsPlusCircle, BsXLg, BsTrash } from 'react-icons/bs'

interface CaseStudy {
  title: string
  description: string
  inputExample: string
  expectedOutput: string
  boilerplate: string
}

interface VideoItem {
  file: File
  previewUrl: string
  description: string
  caseStudy?: CaseStudy
}

const AddVideos = ({
  onAddVideos,
}: {
  onAddVideos: (videos: VideoItem[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [videoItems, setVideoItems] = useState<VideoItem[]>([])
  const [bulkDescription, setBulkDescription] = useState('')

  const toggle = () => setIsOpen((v) => !v)

  /* -----------------------------
     FILE SELECT
  ------------------------------ */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const newItems: VideoItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      description: '',
      caseStudy: undefined,
    }))

    setVideoItems(newItems)
  }

  /* -----------------------------
     CLEANUP OBJECT URLS
  ------------------------------ */
  useEffect(() => {
    return () => {
      videoItems.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl)
      )
    }
  }, [videoItems])

  /* -----------------------------
     UPDATE DESCRIPTION
  ------------------------------ */
  const updateVideoDescription = (index: number, description: string) => {
    setVideoItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, description } : item
      )
    )
  }

  /* -----------------------------
     UPDATE CASE STUDY
  ------------------------------ */
  const updateVideoCaseStudy = (index: number, caseStudy?: CaseStudy) => {
    setVideoItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, caseStudy } : item
      )
    )
  }

  /* -----------------------------
     REMOVE VIDEO
  ------------------------------ */
  const removeVideoItem = (index: number) => {
    setVideoItems((items) => {
      URL.revokeObjectURL(items[index].previewUrl)
      return items.filter((_, i) => i !== index)
    })
  }

  /* -----------------------------
     BULK DESCRIPTION
  ------------------------------ */
  const handleBulkDescription = () => {
    if (!bulkDescription.trim()) return

    setVideoItems((items) =>
      items.map((item) => ({
        ...item,
        description: bulkDescription.trim(),
      }))
    )

    setBulkDescription('')
  }

  /* -----------------------------
     SAVE
  ------------------------------ */
  const handleSave = () => {
    const validVideos = videoItems.filter(
      (v) => v.file && v.description.trim()
    )

    if (!validVideos.length) return

    onAddVideos(validVideos)

    setVideoItems([])
    setBulkDescription('')
    toggle()
  }

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle}>
        <BsPlusCircle className="me-2" />
        Add Videos
      </Button>

      <Modal
        show={isOpen}
        onHide={toggle}
        fullscreen
        backdrop="static"
        keyboard={false}
      >
        {/* HEADER */}
        <ModalHeader className="bg-dark text-white sticky-top">
          <h5 className="mb-0">Add Multiple Videos</h5>
          <button
            type="button"
            className="btn btn-sm btn-light ms-auto"
            onClick={toggle}
          >
            <BsXLg />
          </button>
        </ModalHeader>

        {/* BODY */}
        <ModalBody className="p-4">
          <div className="row">
            {/* LEFT PANEL */}
            <Col md={4} className="border-end">
              <div className="sticky-top" style={{ top: '90px' }}>
                <h6 className="mb-3">Bulk Operations</h6>

                <input
                  type="file"
                  className="form-control mb-3"
                  accept="video/mp4,video/webm,video/ogg"
                  multiple
                  onChange={handleFileSelect}
                />

                <div className="input-group mb-3">
                  <input
                    className="form-control"
                    placeholder="Apply description to all"
                    value={bulkDescription}
                    onChange={(e) => setBulkDescription(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleBulkDescription}
                    disabled={!bulkDescription.trim()}
                  >
                    Apply
                  </button>
                </div>

                <div className="bg-light rounded p-3">
                  <div className="d-flex justify-content-between">
                    <span>Total Videos</span>
                    <strong>{videoItems.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>With Description</span>
                    <strong>
                      {videoItems.filter((v) => v.description.trim()).length}
                    </strong>
                  </div>
                </div>
              </div>
            </Col>

            {/* RIGHT PANEL */}
            <Col md={8}>
              {videoItems.map((item, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <div>
                        <h6 className="mb-1">{item.file.name}</h6>
                        <small className="text-muted">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </small>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeVideoItem(index)}
                      >
                        <BsTrash />
                      </button>
                    </div>

                    <video
                      src={item.previewUrl}
                      className="w-100 rounded mb-2"
                      style={{ height: 160, objectFit: 'cover' }}
                      controls
                    />

                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows={2}
                      placeholder="Enter description"
                      value={item.description}
                      onChange={(e) =>
                        updateVideoDescription(index, e.target.value)
                      }
                    />

                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!item.caseStudy}
                        onChange={(e) =>
                          updateVideoCaseStudy(
                            index,
                            e.target.checked
                              ? {
                                  title: '',
                                  description: '',
                                  inputExample: '',
                                  expectedOutput: '',
                                  boilerplate: '',
                                }
                              : undefined
                          )
                        }
                      />
                      <label className="form-check-label">
                        Add Case Study
                      </label>
                    </div>

                    {item.caseStudy && (
                      <div className="border-top pt-3">
                        <input
                          className="form-control form-control-sm mb-2"
                          placeholder="Title"
                          value={item.caseStudy.title}
                          onChange={(e) =>
                            updateVideoCaseStudy(index, {
                              ...item.caseStudy!,
                              title: e.target.value,
                            })
                          }
                        />

                        <textarea
                          className="form-control form-control-sm mb-2"
                          rows={2}
                          placeholder="Description"
                          value={item.caseStudy.description}
                          onChange={(e) =>
                            updateVideoCaseStudy(index, {
                              ...item.caseStudy!,
                              description: e.target.value,
                            })
                          }
                        />

                        <div className="row g-2">
                          <Col xs={6}>
                            <input
                              className="form-control form-control-sm"
                              placeholder="Input Example"
                              value={item.caseStudy.inputExample}
                              onChange={(e) =>
                                updateVideoCaseStudy(index, {
                                  ...item.caseStudy!,
                                  inputExample: e.target.value,
                                })
                              }
                            />
                          </Col>
                          <Col xs={6}>
                            <input
                              className="form-control form-control-sm"
                              placeholder="Expected Output"
                              value={item.caseStudy.expectedOutput}
                              onChange={(e) =>
                                updateVideoCaseStudy(index, {
                                  ...item.caseStudy!,
                                  expectedOutput: e.target.value,
                                })
                              }
                            />
                          </Col>
                        </div>

                        <textarea
                          className="form-control form-control-sm mt-2"
                          rows={2}
                          placeholder="Boilerplate Code"
                          value={item.caseStudy.boilerplate}
                          onChange={(e) =>
                            updateVideoCaseStudy(index, {
                              ...item.caseStudy!,
                              boilerplate: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Col>
          </div>
        </ModalBody>

        {/* FOOTER */}
        <ModalFooter className="sticky-bottom bg-white">
          <Button variant="outline-secondary" onClick={toggle}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              videoItems.length === 0 ||
              videoItems.every((v) => !v.description.trim())
            }
          >
            Add {videoItems.length} Video(s)
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddVideos
