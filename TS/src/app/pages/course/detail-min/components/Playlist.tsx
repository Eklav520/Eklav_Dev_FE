import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ProgressBar,
  Row,
} from 'react-bootstrap'
import clsx from 'clsx'
import { Fragment } from 'react'
import { FaFacebookF, FaHeadset, FaInstagram, FaLinkedinIn, FaPlay, FaRegEnvelope, FaTwitter } from 'react-icons/fa'

import { currency } from '@/context/constants'
import { BsLockFill, BsPatchCheckFill } from 'react-icons/bs'
import useToggle from '@/hooks/useToggle'
import { useFetchData } from '@/hooks/useFetchData'
import { getAllPlaylist } from '@/helpers/data'
import { PlayListType } from '@/types/other'

import element1 from '@/assets/images/element/01.svg'

const Playlist = () => {
  const { isTrue: isOpen, toggle } = useToggle()
  const playListData = useFetchData<PlayListType[]>(getAllPlaylist)
  return (
    <>
      <Accordion defaultActiveKey="0" className="accordion-icon accordion-bg-light" id="accordionExample2">
        {playListData?.map((playlist, idx) => (
          <AccordionItem eventKey={`${idx}`} className={clsx(playListData.length - 1 != idx ? 'mb-3' : 'mb-0')} key={idx}>
            <AccordionHeader as="h6" className="font-base" id="heading-1">
              <div className="fw-bold rounded collapsed d-block">
                <span className="mb-0">{playlist.title}</span>
                <span className="small d-block mt-1">({playlist.lectures.length} Lectures)</span>
              </div>
            </AccordionHeader>
            <AccordionBody className="mt-3">
              <div className="vstack gap-3">
                <div className="overflow-hidden">
                  <div className="d-flex justify-content-between">
                    <p className="mb-1 h6">
                      {idx == 0 ? '1' : '0'}/{playlist.lectures.length} Completed
                    </p>
                    <h6 className="mb-1 text-end">{idx == 0 ? '30' : '0'}%</h6>
                  </div>
                  <ProgressBar
                    variant="primary"
                    now={idx == 0 ? 30 : 0}
                    className="progress-sm bg-opacity-10 aos"
                    data-aos="slide-right"
                    data-aos-delay={200}
                    data-aos-duration={1000}
                    data-aos-easing="ease-in-out"
                  />
                </div>
                {playlist.lectures.map((lecture, idx) => (
                  <Fragment key={idx}>
                    {lecture.playing ? (
                      <div className="p-2 bg-success bg-opacity-10 rounded-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="position-relative d-flex align-items-center">
                            <Button variant="success" size="sm" className="btn btn-round btn-sm mb-0 stretched-link position-static">
                              <FaPlay className="me-0" size={11} />
                            </Button>
                            <span className="d-inline-block text-truncate ms-2 mb-0 h6 fw-light w-200px">{lecture.title}</span>
                          </div>
                          <p className="mb-0 text-truncate">Playing</p>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="position-relative d-flex align-items-center">
                          {lecture.isPremium ? (
                            <Button variant="light" size="sm" className="btn btn-round mb-0 stretched-link position-static" onClick={toggle}>
                              <BsLockFill size={10.5} />
                            </Button>
                          ) : (
                            <Button variant="danger-soft" size="sm" className="btn btn-round mb-0 stretched-link position-static">
                              <FaPlay className="me-0" size={11} />
                            </Button>
                          )}
                          <span className="d-inline-block text-truncate ms-2 mb-0 h6 fw-light w-200px">{lecture.title}</span>
                        </div>
                        <p className="mb-0 text-truncate">{lecture.time}</p>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </AccordionBody>
          </AccordionItem>
        ))}
      </Accordion>

      <Modal show={isOpen} onHide={toggle} className="fade" size="lg" centered id="exampleModal" tabIndex={-1} aria-hidden="true">
        <ModalHeader className="border-0 bg-transparent" closeButton />
        <ModalBody className="px-5 pb-5 position-relative overflow-hidden">
          <figure className="position-absolute bottom-0 end-0 mb-n4 me-n4 d-none d-sm-block">
            <img src={element1} alt="element" />
          </figure>
          <figure className="position-absolute top-0 end-0 z-index-n1 opacity-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="818.6px"
              height="235.1px"
              viewBox="0 0 818.6 235.1">
              <path
                className="fill-info"
                d="M735,226.3c-5.7,0.6-11.5,1.1-17.2,1.7c-66.2,6.8-134.7,13.7-192.6-16.6c-34.6-18.1-61.4-47.9-87.3-76.7 c-21.4-23.8-43.6-48.5-70.2-66.7c-53.2-36.4-121.6-44.8-175.1-48c-13.6-0.8-27.5-1.4-40.9-1.9c-46.9-1.9-95.4-3.9-141.2-16.5 C8.3,1.2,6.2,0.6,4.2,0H0c3.3,1,6.6,2,10,3c46,12.5,94.5,14.6,141.5,16.5c13.4,0.6,27.3,1.1,40.8,1.9 c53.4,3.2,121.5,11.5,174.5,47.7c26.5,18.1,48.6,42.7,70,66.5c26,28.9,52.9,58.8,87.7,76.9c58.3,30.5,127,23.5,193.3,16.7 c5.8-0.6,11.5-1.2,17.2-1.7c26.2-2.6,55-4.2,83.5-2.2v-1.2C790,222,761.2,223.7,735,226.3z"
              />
            </svg>
          </figure>
          <h2>
            Get Premium Course in <span className="text-success">{currency}800</span>
          </h2>
          <p>Prosperous understood Middletons in conviction an uncommonly do. Supposing so be resolving breakfast am or perfectly.</p>
          <Row className="mb-3 item-collapse">
            <Col sm={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item text-body">

                  <BsPatchCheckFill className="text-success me-1" />
                  High quality Curriculum
                </li>
                <li className="list-group-item text-body">

                  <BsPatchCheckFill className="text-success me-1" />
                  Tuition Assistance
                </li>
                <li className="list-group-item text-body">

                  <BsPatchCheckFill className="text-success me-1" />
                  Diploma course
                </li>
              </ul>
            </Col>
            <Col sm={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item text-body">

                  <BsPatchCheckFill className="text-success me-1" />
                  Intermediate courses
                </li>
                <li className="list-group-item text-body">

                  <BsPatchCheckFill className="text-success me-1" />
                  Over 200 online courses
                </li>
              </ul>
            </Col>
          </Row>
          <a href="#" className="btn btn-lg btn-orange-soft">
            Purchase premium
          </a>
        </ModalBody>
        <ModalFooter className="d-block bg-info">
          <div className="d-sm-flex justify-content-sm-between align-items-center text-center text-sm-start">
            <ul className="list-inline mb-0 social-media-btn mb-2 mb-sm-0">
              <li className="list-inline-item">

                <a className="btn btn-white btn-sm shadow px-2 text-facebook" href="#">
                  <FaFacebookF className="fa-fw" />
                </a>
              </li>
              <li className="list-inline-item">

                <a className="btn btn-white btn-sm shadow px-2 text-instagram" href="#">
                  <FaInstagram className="fa-fw" />
                </a>
              </li>
              <li className="list-inline-item">

                <a className="btn btn-white btn-sm shadow px-2 text-twitter" href="#">
                  <FaTwitter className="fa-fw" />
                </a>
              </li>
              <li className="list-inline-item">

                <a className="btn btn-white btn-sm shadow px-2 text-linkedin" href="#">
                  <FaLinkedinIn className="fa-fw" />
                </a>
              </li>
            </ul>
            <div>
              <p className="mb-1 small">
                <a href="#" className="text-white">
                  <FaRegEnvelope className="fa-fw me-2" />
                  example@gmail.com
                </a>
              </p>
              <p className="mb-0 small">
                <a href="#" className="text-white">
                  <FaHeadset className="fa-fw me-2" />
                  123-456-789
                </a>
              </p>
            </div>
          </div>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default Playlist
