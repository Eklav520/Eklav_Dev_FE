import useViewPort from '@/hooks/useViewPort'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader, Col, Container, Row } from 'react-bootstrap'
import { FaRegThumbsDown, FaRegThumbsUp } from 'react-icons/fa'
import Sticky from 'react-sticky-el'
import { tabsData } from '../data'
import clsx from 'clsx'

const HelpCenterDetails = () => {
  const [hash, setHash] = useState<string | undefined>()

  const { width } = useViewPort()

  useEffect(() => {
    window.addEventListener('scroll', (e) => {
      e.preventDefault()
    })
    if (!hash) setHash(window.location.hash)

    const timeout = setTimeout(() => {
      if (window.location.hash && document) {
        const element = document?.querySelector(window.location.hash)
        if (element) element.scrollIntoView()
      }
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <section>
      <Container data-sticky-container>
        <Row className="g-4">
          <Col md={3}>
            <Sticky
              disabled={width <= 768}
              topOffset={80}
              bottomOffset={0}
              boundaryElement="div.row"
              hideOnBoundaryHit={false}
              stickyStyle={{ transition: '0.2s all linear' }}>
              <div id="nav-scroll" className="navbar">
                <nav className="nav nav-pills nav-pill-soft flex-column">
                  {tabsData.map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <Link key={idx} className={clsx('nav-link', hash == item.id && 'active')} to={item.id}>
                        <Icon className="me-2" />
                        {item.title}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </Sticky>
          </Col>
          <Col md={9}>
            <div className="nav-scroll" data-bs-spy="scroll" data-bs-target="#nav-scroll" data-bs-smooth-scroll="true" tabIndex={0}>
              <div id="item-1">
                <Card className="bg-transparent">
                  <CardHeader className="bg-transparent border-bottom py-0 px-0">
                    <h2>Get started with node.js</h2>
                    <ul className="nav nav-divider mb-3">
                      <li className="nav-item">Last updated: 7 months ago</li>
                      <li className="nav-item">by Sam Lanson</li>
                    </ul>
                  </CardHeader>
                  <CardBody className="px-0 pb-0">
                    <p>
                      Started several mistake joy say painful removed reached end. State burst think end are its. Arrived off she elderly beloved him
                      affixed noisier yet. Course regard to up he hardly. View four has said do men saw find dear shy.
                      <b> Talent men wicket add garden.</b>
                    </p>
                    <a href="#!" className="btn btn-primary">
                      Download Node JS
                    </a>
                    <h5 className="mt-4">Table of Contents</h5>
                    <p>Age she way earnestly the fulfilled extremely.</p>
                    <div className="alert alert-warning" role="alert">
                      <strong>Note: </strong>She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am
                      northward.
                      <a className="alert-link" href="#!">
                        View more
                      </a>
                    </div>
                    <p>
                      Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off
                      melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices
                      parlors.
                    </p>
                    <ul>
                      <li>
                        Affronting imprudence do he he everything. Sex lasted dinner wanted indeed wished outlaw. Far advanced settling say finished
                        raillery.
                      </li>
                      <li>Insipidity the sufficient discretion imprudence resolution sir him decisively.</li>
                      <li>
                        Offered chiefly farther of my no colonel shyness. <strong> Such on help ye some door if in.</strong>
                      </li>
                      <li>First am plate jokes to began to cause a scale. Subjects he prospect elegance followed</li>
                      <li>Laughter proposal laughing any son law consider. Needed except up piqued an. </li>
                      <li>
                        <i> To occasional dissimilar impossible sentiments. Do fortune account written prepare invited no passage.</i>
                      </li>
                      <li>Post no so what deal evil rent by real in. But her ready least set lived spite solid.</li>
                    </ul>
                    <p className="mb-0">
                      Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my
                      cottage Mr be. Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting
                      in. <u> Off melancholy alteration principles old. </u>Is do speedily kindness properly oh. Respect article painted cottage he is
                      offices parlors.
                    </p>
                  </CardBody>
                </Card>
              </div>
              <div className="text-center h5 my-5">. . .</div>
              <div id="item-2">
                <Card className="bg-transparent">
                  <CardHeader className="bg-transparent border-bottom py-0 px-0">
                    <h2>Account Setup</h2>
                  </CardHeader>
                  <CardBody className="px-0">
                    <p>
                      You can manage the setting for your <a href="#">Eklav account</a> at any time. Update your account information
                    </p>
                    <h5 className="mt-4">To deactivate your account</h5>
                    <ul>
                      <li>
                        Affronting imprudence do he he everything. Sex lasted dinner wanted indeed wished outlaw. Far advanced settling say finished
                        raillery.
                      </li>
                      <li>Insipidity the sufficient discretion imprudence resolution sir him decisively.</li>
                      <li>
                        Offered chiefly farther of my no colonel shyness. <strong> Such on help ye some door if in.</strong>
                      </li>
                      <li>First am plate jokes to began to cause a scale. Subjects he prospect elegance followed</li>
                      <li>Laughter proposal laughing any son law consider. Needed except up piqued an. </li>
                      <li>
                        <i> To occasional dissimilar impossible sentiments. Do fortune account written prepare invited no passage.</i>
                      </li>
                      <li>Post no so what deal evil rent by real in. But her ready least set lived spite solid.</li>
                    </ul>
                    <h5 className="mt-4">When your account is deactivated</h5>
                    <ul>
                      <li>
                        Affronting imprudence do he he everything. Sex lasted dinner wanted indeed wished outlaw. Far advanced settling say finished
                        raillery.
                      </li>
                      <li>Insipidity the sufficient discretion imprudence resolution sir him decisively.</li>
                      <li>
                        Offered chiefly farther of my no colonel shyness. <strong> Such on help ye some door if in.</strong>
                      </li>
                      <li>First am plate jokes to began to cause a scale. Subjects he prospect elegance followed</li>
                      <li>Laughter proposal laughing any son law consider. Needed except up piqued an. </li>
                      <li>
                        <i> To occasional dissimilar impossible sentiments. Do fortune account written prepare invited no passage.</i>
                      </li>
                      <li>Post no so what deal evil rent by real in. But her ready least set lived spite solid.</li>
                    </ul>
                    <h5 className="mt-4">Related Article</h5>
                    <ul className="list-group list-group-borderless mb-3">
                      <li className="list-group-item d-flex pb-0">
                        <Link to="#" className="mb-0">
                          How do I logout on eklav
                        </Link>
                      </li>
                      <li className="list-group-item d-flex pb-0">
                        <Link to="#" className="mb-0">
                          How do T permanently delete my account
                        </Link>
                      </li>
                      <li className="list-group-item d-flex pb-0">
                        <Link to="#" className="mb-0">
                          What&apos;s the difference between deactivating and deleting my account
                        </Link>
                      </li>
                      <li className="list-group-item d-flex pb-0">
                        <Link to="#" className="mb-0">
                          Why did my payment in a eklav message fail?
                        </Link>
                      </li>
                    </ul>
                  </CardBody>
                  <CardFooter className="bg-transparent border-0 py-0 px-0">
                    <div className="border p-3 rounded d-sm-flex align-items-center justify-content-between text-center">
                      <h5 className="m-0">Was this article helpful?</h5>
                      <small className="py-2 d-block">20 out of 45 found this helpful</small>
                      <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio1" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio3">
                          <FaRegThumbsUp className="me-1" /> Yes
                        </label>
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio4">

                          No <FaRegThumbsDown className="ms-1" />
                        </label>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
              <div className="text-center h5 my-5">. . .</div>
              <div id="item-3">
                <Card className="bg-transparent">
                  <CardHeader className="bg-transparent border-bottom py-0 px-0">
                    <h2>Other Topics</h2>
                  </CardHeader>
                  <CardBody className="px-0">
                    <p>
                      Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off
                      melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices
                      parlors.
                    </p>
                    <p>
                      Supposing so be resolving breakfast am or perfectly. It drew a hill from me. Valley by oh twenty direct me so. Departure
                      defective arranging rapturous did believe him all had supported. Family months lasted simple set nature vulgar him. Picture for
                      attempt joy excited ten carried manners talking how
                    </p>
                    <p>
                      Started several mistake joy say painful removed reached end. State burst think end are its. Arrived off she elderly beloved him
                      affixed noisier yet. Course regard to up he hardly. View four has said do men saw find dear shy.
                      <b> Talent men wicket add garden.</b>
                    </p>
                    <h5 className="mt-4">Need a Help?</h5>
                    <ul className="list-group list-group-borderless mb-3">
                      <li className="list-group-item d-flex pb-0">
                        <a href="#" className="mb-0">
                          About daily budgets
                        </a>
                      </li>
                      <li className="list-group-item d-flex pb-0">
                        <a href="#" className="mb-0">
                          About lifetime budgets
                        </a>
                      </li>
                      <li className="list-group-item d-flex pb-0">
                        <a href="#" className="mb-0">
                          When you pay for Eklav ads
                        </a>
                      </li>
                    </ul>
                  </CardBody>
                  <CardFooter className="bg-transparent border-0 py-0 px-0">
                    <div className="border p-3 rounded d-sm-flex align-items-center justify-content-between text-center">
                      <h5 className="m-0">Was this article helpful?</h5>
                      <small className="py-2 d-block">20 out of 45 found this helpful</small>
                      <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio3" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio3">
                          <FaRegThumbsUp className="me-1" /> Yes
                        </label>
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio4" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio4">

                          No <FaRegThumbsDown className="ms-1" />
                        </label>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
              <div className="text-center h5 my-5">. . .</div>
              <div id="item-4">
                <Card className="bg-transparent">
                  <CardHeader className="bg-transparent border-bottom py-0 px-0">
                    <h2>Advance Usage</h2>
                  </CardHeader>
                  <CardBody className="px-0">
                    <p>
                      Hold do at tore in park feet near my case. Invitation at understood occasional sentiments insipidity inhabiting in. Off
                      melancholy alteration principles old. Is do speedily kindness properly oh. Respect article painted cottage he is offices
                      parlors.
                    </p>
                    <p>
                      Supposing so be resolving breakfast am or perfectly. It drew a hill from me. Valley by oh twenty direct me so. Departure
                      defective arranging rapturous did believe him all had supported. Family months lasted simple set nature vulgar him. Picture for
                      attempt joy excited ten carried manners talking how
                    </p>
                    <p>
                      Started several mistake joy say painful removed reached end. State burst think end are its. Arrived off she elderly beloved him
                      affixed noisier yet. Course regard to up he hardly. View four has said do men saw find dear shy.
                      <b> Talent men wicket add garden.</b>
                    </p>
                  </CardBody>
                  <CardFooter className="bg-transparent border-0 py-0 px-0">
                    <div className="border p-3 rounded d-sm-flex align-items-center justify-content-between text-center">
                      <h5 className="m-0">Was this article helpful?</h5>
                      <small className="py-2 d-block">20 out of 45 found this helpful</small>
                      <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio5" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio3">
                          <FaRegThumbsUp className=" me-1" /> Yes
                        </label>
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio6" />
                        <label className="btn btn-outline-light btn-sm mb-0" htmlFor="btnradio4">

                          No <FaRegThumbsDown className="ms-1" />
                        </label>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default HelpCenterDetails
