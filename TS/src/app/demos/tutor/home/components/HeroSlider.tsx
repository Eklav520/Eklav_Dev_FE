import TinySlider from '@/components/TinySlider'

import { renderToString } from 'react-dom/server'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'

import avatar7 from '@/assets/images/avatar/07.jpg'
import avatar9 from '@/assets/images/avatar/09.jpg'

const HeroSlider = () => {
  const testimonialSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    autoplay: true,
    mouseDrag: true,
    controls: true,
    edgePadding: 2,
    items: 1,
    nav: false,
  }
  return (
    <div className="tiny-slider arrow-round arrow-dark arrow-hover arrow-xs">
      <TinySlider settings={testimonialSliderSettings}>
        <div>
          <div className="d-md-flex my-2">
            <div className="avatar avatar-lg me-3 flex-shrink-0">
              <img className="avatar-img rounded-circle" src={avatar9} alt="avatar" />
            </div>
            <div className="flex-grow-1 mt-2 mt-md-0">
              <p className="mb-2">
                &quot;Make my life easier and organized conviction For every delay in they Extremity now strangers contained breakfast&quot;
              </p>
              <h6 className="me-3 mb-0">
                Jacqueline Miller <span className="small mb-0 text-body">(Student)</span>
              </h6>
            </div>
          </div>
        </div>
        <div>
          <div className="d-md-flex my-2">
            <div className="avatar avatar-lg me-3 flex-shrink-0">
              <img className="avatar-img rounded-circle" src={avatar7} alt="avatar" />
            </div>
            <div className="flex-grow-1 mt-2 mt-md-0">
              <p className="mb-2">&quot;Creating product become fun conviction For every delay in they Extremity.&quot; </p>
              <h6 className="me-3 mb-0">
                Dennis Barrett <span className="small mb-0 text-body">(Student)</span>
              </h6>
            </div>
          </div>
        </div>
      </TinySlider>
    </div>
  )
}

export default HeroSlider
