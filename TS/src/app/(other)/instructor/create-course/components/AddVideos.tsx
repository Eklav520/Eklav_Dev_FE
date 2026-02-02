import { useState } from 'react'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg, BsTrash } from 'react-icons/bs'

interface VideoItem {
  file: File
  description: string
  caseStudy?: {
    title: string
    description: string
    inputExample: string
    expectedOutput: string
    boilerplate: string
  }
}

const AddVideos = ({ 
  onAddVideos 
}: { 
  onAddVideos: (videos: VideoItem[]) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [videoItems, setVideoItems] = useState<VideoItem[]>([])
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const toggle = () => setIsOpen(!isOpen)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Create video items for each selected file
    const newVideoItems = files.map(file => ({
      file,
      description: '',
      caseStudy: undefined
    }))
    
    setSelectedFiles(files)
    setVideoItems(newVideoItems)
  }

  const updateVideoDescription = (index: number, description: string) => {
    const updatedItems = [...videoItems]
    updatedItems[index].description = description
    setVideoItems(updatedItems)
  }

  const updateVideoCaseStudy = (index: number, caseStudy: any) => {
    const updatedItems = [...videoItems]
    updatedItems[index].caseStudy = caseStudy
    setVideoItems(updatedItems)
  }

  const removeVideoItem = (index: number) => {
    const updatedFiles = [...selectedFiles]
    const updatedItems = [...videoItems]
    
    updatedFiles.splice(index, 1)
    updatedItems.splice(index, 1)
    
    setSelectedFiles(updatedFiles)
    setVideoItems(updatedItems)
  }

  const handleBulkDescription = () => {
    if (description.trim()) {
      const updatedItems = videoItems.map(item => ({
        ...item,
        description: description.trim()
      }))
      setVideoItems(updatedItems)
      setDescription('')
    }
  }

  const handleSave = () => {
    if (videoItems.length > 0) {
      const validVideos = videoItems.filter(item => 
        item.file && item.description.trim()
      )
      
      if (validVideos.length > 0) {
        onAddVideos(validVideos)
        
        // Reset
        setVideoItems([])
        setSelectedFiles([])
        setDescription('')
        
        toggle()
      }
    }
  }

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle}>
        <BsPlusCircle className="me-2" />
        Add Videos
      </Button>

      <Modal show={isOpen} onHide={toggle} size="xl" centered>
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white">Add Multiple Videos</h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" onClick={toggle}>
            <BsXLg />
          </button>
        </ModalHeader>

        <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="row">
            {/* Left Side: Bulk Operations */}
            <Col md={4} className="border-end pe-4">
              <div className="sticky-top" style={{ top: '1rem' }}>
                <h6 className="text-dark mb-3">Bulk Operations</h6>
                
                {/* Bulk File Selection */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Select Videos</label>
                  <div className="border rounded p-3 text-center">
                    <input
                      type="file"
                      className="form-control"
                      accept="video/mp4,video/webm,video/ogg"
                      multiple
                      onChange={handleFileSelect}
                      id="videoUpload"
                    />
                    <label htmlFor="videoUpload" className="btn btn-outline-primary w-100 mt-2">
                      Choose Videos
                    </label>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2">
                        <small className="text-success">
                          {selectedFiles.length} video(s) selected
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bulk Description */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Apply Description to All</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter description for all videos"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={handleBulkDescription}
                      disabled={!description.trim()}
                    >
                      Apply
                    </button>
                  </div>
                  <small className="text-muted">
                    This will apply to all videos below
                  </small>
                </div>

                {/* Summary */}
                <div className="bg-light rounded p-3">
                  <h6 className="text-dark">Summary</h6>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Total Videos:</span>
                    <strong>{videoItems.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>With Description:</span>
                    <strong>{videoItems.filter(v => v.description.trim()).length}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Total Size:</span>
                    <strong>
                      {(
                        selectedFiles.reduce((acc, file) => acc + file.size, 0) / 
                        (1024 * 1024)
                      ).toFixed(2)} MB
                    </strong>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Side: Individual Video Configuration */}
            <Col md={8} className="ps-4">
              {selectedFiles.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="fas fa-video fa-3x text-muted"></i>
                  </div>
                  <h5 className="text-dark">No videos selected</h5>
                  <p className="text-muted">
                    Select videos from the left panel to configure them
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {videoItems.map((item, index) => (
                    <Col xs={12} key={index}>
                      <div className="card border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1 text-truncate" style={{ maxWidth: '300px' }}>
                                {item.file.name}
                              </h6>
                              <small className="text-muted">
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                              </small>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeVideoItem(index)}
                            >
                              <BsTrash size={14} />
                            </button>
                          </div>

                          {/* Video Preview */}
                          <div className="mb-3">
                            <video
                              className="rounded w-100"
                              src={URL.createObjectURL(item.file)}
                              style={{ height: '150px', objectFit: 'cover' }}
                              controls
                            />
                          </div>

                          {/* Individual Description */}
                          <div className="mb-3">
                            <label className="form-label small">Description for this video</label>
                            <textarea
                              className="form-control form-control-sm"
                              rows={2}
                              placeholder="Enter description"
                              value={item.description}
                              onChange={(e) => updateVideoDescription(index, e.target.value)}
                            />
                          </div>

                          {/* Case Study Toggle */}
                          <div className="form-check mb-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`caseStudy-${index}`}
                              checked={!!item.caseStudy}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateVideoCaseStudy(index, {
                                    title: "",
                                    description: "",
                                    inputExample: "",
                                    expectedOutput: "",
                                    boilerplate: ""
                                  })
                                } else {
                                  updateVideoCaseStudy(index, undefined)
                                }
                              }}
                            />
                            <label className="form-check-label small" htmlFor={`caseStudy-${index}`}>
                              Add Case Study
                            </label>
                          </div>

                          {/* Case Study Fields */}
                          {item.caseStudy && (
                            <div className="border-top pt-3 mt-2">
                              <h6 className="small fw-medium mb-2">Case Study Details</h6>
                              <div className="row g-2">
                                <Col xs={12}>
                                  <input
                                    className="form-control form-control-sm mb-2"
                                    placeholder="Title"
                                    value={item.caseStudy.title}
                                    onChange={(e) => updateVideoCaseStudy(index, {
                                      ...item.caseStudy!,
                                      title: e.target.value
                                    })}
                                  />
                                </Col>
                                <Col xs={12}>
                                  <textarea
                                    className="form-control form-control-sm mb-2"
                                    rows={2}
                                    placeholder="Description"
                                    value={item.caseStudy.description}
                                    onChange={(e) => updateVideoCaseStudy(index, {
                                      ...item.caseStudy!,
                                      description: e.target.value
                                    })}
                                  />
                                </Col>
                                <Col xs={6}>
                                  <input
                                    className="form-control form-control-sm mb-2"
                                    placeholder="Input Example"
                                    value={item.caseStudy.inputExample}
                                    onChange={(e) => updateVideoCaseStudy(index, {
                                      ...item.caseStudy!,
                                      inputExample: e.target.value
                                    })}
                                  />
                                </Col>
                                <Col xs={6}>
                                  <input
                                    className="form-control form-control-sm mb-2"
                                    placeholder="Expected Output"
                                    value={item.caseStudy.expectedOutput}
                                    onChange={(e) => updateVideoCaseStudy(index, {
                                      ...item.caseStudy!,
                                      expectedOutput: e.target.value
                                    })}
                                  />
                                </Col>
                                <Col xs={12}>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    placeholder="Boilerplate Code"
                                    value={item.caseStudy.boilerplate}
                                    onChange={(e) => updateVideoCaseStudy(index, {
                                      ...item.caseStudy!,
                                      boilerplate: e.target.value
                                    })}
                                  />
                                </Col>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  ))}
                </div>
              )}
            </Col>
          </div>
        </ModalBody>

        <ModalFooter className="border-top">
          <button className="btn btn-outline-secondary" onClick={toggle}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={videoItems.length === 0 || videoItems.every(v => !v.description.trim())}
          >
            Add {videoItems.length} Video(s)
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddVideos