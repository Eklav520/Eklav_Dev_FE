import about4Img from '@/assets/images/about/04.jpg'
import galleryImg from '@/assets/images/element/gallery.svg'
import GlightBox from '@/components/GlightBox'
import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaPlay } from 'react-icons/fa'

const Step2 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }
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
                  <input className="form-control stretched-link" type="file" name="my-image" id="image" accept="image/gif, image/jpeg, image/png" />
                </span>
              </label>
              <p className="small mb-0 mt-2">
                <b>Note:</b> Only JPG, JPEG and PNG. Our suggested dimensions are 600px * 450px. Larger image will be cropped to 4:3 to fit our
                thumbnails/previews.
              </p>
            </div>
          </div>
          <div className="d-sm-flex justify-content-end mt-2">
            <button type="button" className="btn btn-sm btn-danger-soft mb-3">
              Remove image
            </button>
          </div>
        </Col>
        <Col xs={12}>
          <h5>Upload video</h5>
          <Col xs={12} className=" mt-4 mb-5">
            <label className="form-label">Video URL</label>
            <input className="form-control" type="text" placeholder="Enter video url" />
          </Col>
          <div className="position-relative my-4">
            <hr />
            <p className="small position-absolute top-50 start-50 translate-middle bg-body px-3 mb-0">Or</p>
          </div>
          <Col xs={12}>
            <label className="form-label">Upload video</label>
            <div className="input-group mb-3">
              <input type="file" className="form-control" id="inputGroupFile01" />
              <label className="input-group-text">.mp4</label>
            </div>
            <div className="input-group mb-3">
              <input type="file" className="form-control" id="inputGroupFile02" />
              <label className="input-group-text">.WebM</label>
            </div>
            <div className="input-group mb-3">
              <input type="file" className="form-control" id="inputGroupFile03" />
              <label className="input-group-text">.OGG</label>
            </div>
          </Col>
          <h5 className="mt-4">Video preview</h5>
          <div className="position-relative">
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
          </div>
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
