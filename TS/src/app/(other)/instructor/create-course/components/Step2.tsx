import galleryImg from '@/assets/images/element/gallery.svg'
import Stepper from 'bs-stepper'
import { FormEvent, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaEdit, FaPlay, FaTimes } from 'react-icons/fa'
import AddVideos from './AddVideos'

const Step2 = ({
  stepperInstance,
  formData,
  setFormData,
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }
  const [tempUrl, setTempUrl] = useState('')
  const [tempDesc, setTempDesc] = useState('')
  return (
    <form id="step-2" onSubmit={goToNextStep} role="tabpanel" className="content fade" aria-labelledby="steppertrigger2">
      <h4>Course media</h4>
      <hr />
      <Row>
        <Col xs={12}>
          <div className="text-center justify-content-center align-items-center p-4 p-sm-5 border border-2 border-dashed position-relative rounded-3">
            <img src={galleryImg} className="h-50px" alt="gallery" />
            <div>
              <h6 className="my-2">
                Upload course image here, or
                <a href="#!" className="text-primary">
                  Browse
                </a>
              </h6>
              <label style={{ cursor: 'pointer' }}>
                <span>
                  <input
                    className="form-control stretched-link"
                    type="file"
                    name="my-image"
                    id="image"
                    accept="image/gif, image/jpeg, image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFormData((prev: any) => ({ ...prev, image: file }))
                    }}
                  />
                </span>
              </label>
              <p className="small mb-0 mt-2">
                <b>Note:</b> Only JPG, JPEG and PNG. Our suggested dimensions are 600px * 450px. Larger image will be cropped to 4:3 to fit our
                thumbnails/previews.
              </p>
            </div>
          </div>
          <div className="d-sm-flex justify-content-end mt-2">
            <button type="button" className="btn btn-sm btn-danger-soft mb-3" onClick={() => setFormData((prev: any) => ({ ...prev, image: null }))}>
              Remove image
            </button>
          </div>
        </Col>
        <Col xs={12}>
          {/*  <Col xs={12} className=" mt-4 mb-5">
            <label className="form-label">Video URL</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter video url"
              onChange={(e) => setFormData((prev: any) => ({ ...prev, videoUrl: e.target.value }))}
            />
          </Col> */}
          <Col xs={12} className="mt-4 mb-3">
            <label className="form-label">Add Video URL with Description</label>
            <Row className="g-2">
              <Col md={6}>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter video URL"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Description"
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={() => {
                    if (tempUrl.trim()) {
                      setFormData((prev: any) => ({
                        ...prev,
                        videoUrl: [...prev.videoUrl, { url: tempUrl, description: tempDesc }],
                      }))
                      setTempUrl('')
                      setTempDesc('')
                    }
                  }}>
                  Add
                </button>
              </Col>
            </Row>
          </Col>

          {/* Show list of added video URLs */}
          {formData.videoUrl.map((vid: any, index: number) => (
            <div key={index} className="border p-2 rounded my-2 d-flex justify-content-between align-items-center">
              <div>
                <strong>URL:</strong> {vid.url} <br />
                <strong>Description:</strong> {vid.description}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  setFormData((prev: any) => ({
                    ...prev,
                    videoUrl: prev.videoUrl.filter((_: any, i: number) => i !== index),
                  }))
                }}>
                <FaTimes />
              </button>
            </div>
          ))}

          <div className="position-relative my-4">
            <hr />
            <p className="small position-absolute top-50 start-50 translate-middle bg-body px-3 mb-0">Or</p>
          </div>
          <Row className=" g-4">
            <Col xs={12} className="">
              <div className="bg-light border rounded p-2 p-sm-4">
                <div className="d-sm-flex justify-content-sm-between align-items-center mb-3">
                  <h5 className="mb-2 mb-sm-0">Upload Videos</h5>
                  <AddVideos
                    onAddVideo={(vid) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        videos: [
                          ...prev.videos,
                          {
                            ...vid,
                            status: 'pending',
                            progress: 0,
                          },
                        ]

                      }))
                    }
                  />
                </div>
                <Row className=" g-4">
                  {(formData.videos || []).map((vid: any, index: number) => (
                    <Col xs={12} key={index}>
                      <div className="bg-body p-3 p-sm-4 border rounded">
                        <div className="d-sm-flex justify-content-sm-between align-items-center mb-2">
                          <h6 className="mb-0">
                            <video
                              width="300"
                              controls
                              src={URL.createObjectURL(vid.videos)}
                            />

                          </h6>
                          <div className="align-middle">
                            <button
                              className="btn btn-sm btn-danger-soft btn-round mb-0"
                              onClick={() =>
                                setFormData((prev: any) => ({
                                  ...prev,
                                  videos: prev.videos.filter((_: any, i: number) => i !== index),
                                }))
                              }>
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                        <p>Description: {vid.description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
          {/* <h5 className="mt-4">Video preview</h5> */}
          {/* <div className="position-relative">
            {formData.image ? (
              <img src={URL.createObjectURL(formData.image)} className="rounded-4" alt="Uploaded preview" />
            ) : (
              <img src={about4Img} className="rounded-4" alt="Default preview" />
            )}
            <img src={about4Img} className="rounded-4" alt={'about4Img'} />
            <div className="position-absolute top-50 start-50 translate-middle">
              <GlightBox
                href="https://www.youtube.com/embed/tXHviS-4ygo"
                className="btn btn-lg text-danger btn-round btn-white-shadow mb-0"
                data-glightbox
                data-gallery="video-tour">
                <FaPlay />
              </GlightBox>
            </div>
          </div> */}
        </Col>
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-secondary prev-btn mb-0">Previous</button>
          <button className="btn btn-primary next-btn mb-0">Next</button>
        </div>
      </Row>
    </form>
  )
}

export default Step2
