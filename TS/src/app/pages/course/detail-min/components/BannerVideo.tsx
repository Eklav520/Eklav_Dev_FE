// import dynamic from 'next/dynamic'
import { Button, Col, Container, Offcanvas, OffcanvasBody, OffcanvasHeader, Row } from 'react-bootstrap'
import { BsCameraVideo } from 'react-icons/bs'

import useToggle from '@/hooks/useToggle'
import useViewPort from '@/hooks/useViewPort'
import Playlist from './Playlist'
import 'plyr-react/plyr.css'
import Plyr from 'plyr-react'

const BannerVideo = () => {
  const { width } = useViewPort()
  const { isTrue: isOpen, toggle } = useToggle()

  return (
    <>
      <section className="py-0 pb-lg-5">
        <Container>
          <Row className="g-3">
            <Col xs={12}>
              <div className="video-player rounded-3">
                <Plyr
                  playsInline
                  crossOrigin="anonymous"
                  controls
                  source={{
                    tracks: [
                      { kind: 'captions', label: 'English', src: '/videos/en.vtt', srcLang: 'en', default: true },
                      { kind: 'captions', label: 'French', src: '/videos/fr.vtt', srcLang: 'fr' },
                    ],
                    type: 'video',
                    poster: '/videos/poster.jpg',
                    sources: [
                      { src: '/videos/360p.mp4', size: 360 },
                      { src: '/videos/720p.mp4', size: 720 },
                      { src: '/videos/1080p.mp4', size: 1080 },
                    ],
                  }}
                />
              </div>
            </Col>
            <Col xs={12} className="d-lg-none">
              <Button variant="primary" className="mb-3" type="button" onClick={toggle}>
                <BsCameraVideo className="me-1" /> Playlist
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
      {width < 992 && (
        <Offcanvas
          show={isOpen}
          onHide={toggle}
          placement="end"
          className="offcanvas-lg"
          tabIndex={-1}
          id="offcanvasSidebar"
          aria-labelledby="offcanvasSidebarLabel">
          <OffcanvasHeader className="bg-dark" closeButton closeVariant="white">
            <h5 className="offcanvas-title text-white" id="offcanvasSidebarLabel">
              Course playlist
            </h5>
          </OffcanvasHeader>
          <OffcanvasBody className="p-3 p-lg-0">
            <Col xs={12}>
              <Playlist />
            </Col>
          </OffcanvasBody>
        </Offcanvas>
      )}
    </>
  )
}

export default BannerVideo
