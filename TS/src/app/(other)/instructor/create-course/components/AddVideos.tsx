import { useState } from 'react'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddVideos = ({ onAddVideo }: { 
  onAddVideo: (vid: { 
    videos: File, 
    description: string,
    caseStudy?: {
      title: string,
      description: string,
      inputExample: string,
      expectedOutput: string,
      boilerplate: string
    } 
  }) => void 
}) => {

  const [isOpen, setIsOpen] = useState(false)
  const [videos, setVideos] = useState<File | null>(null)
  const [description, setDescription] = useState('')

  // NEW — Case study fields
  const [hasCaseStudy, setHasCaseStudy] = useState(false)
  const [caseStudy, setCaseStudy] = useState({
    title: "",
    description: "",
    inputExample: "",
    expectedOutput: "",
    boilerplate: ""
  })

  const toggle = () => setIsOpen(!isOpen)

  const handleSave = () => {
    if (videos && description.trim()) {
      const payload: any = { videos, description }

      if (hasCaseStudy) payload.caseStudy = caseStudy

      onAddVideo(payload)

      // Reset
      setVideos(null)
      setDescription('')
      setCaseStudy({
        title: "",
        description: "",
        inputExample: "",
        expectedOutput: "",
        boilerplate: ""
      })
      setHasCaseStudy(false)

      toggle()
    }
  }

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle}>
        <BsPlusCircle className="me-2" />
        Add Video
      </Button>

      <Modal show={isOpen} onHide={toggle}>
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white">Add Video</h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" onClick={toggle}>
            <BsXLg />
          </button>
        </ModalHeader>

        <ModalBody>
          <form className="row text-start g-3">
            <Col xs={12}>
              <label className="form-label">Video File</label>
              <input
                type="file"
                className="form-control"
                accept="video/mp4,video/webm,video/ogg"
                onChange={(e) => setVideos(e.target.files?.[0] || null)}
              />
            </Col>

            <Col xs={12}>
              <label className="form-label mt-3">Video Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Col>

            {/* ---- CASE STUDY TOGGLE ---- */}
            <Col xs={12} className="mt-3">
              <label className="form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={hasCaseStudy}
                  onChange={() => setHasCaseStudy(!hasCaseStudy)} 
                />
                <span className="form-check-label">Add Case Study for This Topic</span>
              </label>
            </Col>

            {hasCaseStudy && (
              <>
                <Col xs={12}>
                  <label className="form-label">Case Study Title</label>
                  <input
                    className="form-control"
                    type="text"
                    value={caseStudy.title}
                    onChange={(e) => setCaseStudy({ ...caseStudy, title: e.target.value })}
                  />
                </Col>

                <Col xs={12}>
                  <label className="form-label mt-2">Case Study Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={caseStudy.description}
                    onChange={(e) => setCaseStudy({ ...caseStudy, description: e.target.value })}
                  />
                </Col>

                <Col xs={12}>
                  <label className="form-label mt-2">Input Example</label>
                  <input
                    className="form-control"
                    type="text"
                    value={caseStudy.inputExample}
                    onChange={(e) => setCaseStudy({ ...caseStudy, inputExample: e.target.value })}
                  />
                </Col>

                <Col xs={12}>
                  <label className="form-label mt-2">Expected Output</label>
                  <input
                    className="form-control"
                    type="text"
                    value={caseStudy.expectedOutput}
                    onChange={(e) => setCaseStudy({ ...caseStudy, expectedOutput: e.target.value })}
                  />
                </Col>

                <Col xs={12}>
                  <label className="form-label mt-2">Boilerplate Code</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={caseStudy.boilerplate}
                    onChange={(e) => setCaseStudy({ ...caseStudy, boilerplate: e.target.value })}
                  />
                </Col>
              </>
            )}

          </form>
        </ModalBody>

        <ModalFooter>
          <button className="btn btn-danger-soft" onClick={toggle}>Close</button>
          <button className="btn btn-success" onClick={handleSave}>Save Video</button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddVideos
