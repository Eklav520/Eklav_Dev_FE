import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import Sticky from 'react-sticky-el'

const ProductImageWrapper = ({ children }: ChildrenType) => {
  const { width } = useViewPort()
  return (
    <Sticky
      disabled={width <= 992}
      topOffset={80}
      bottomOffset={0}
      boundaryElement="div.row"
      hideOnBoundaryHit={false}
      stickyStyle={{ transition: '0.2s all linear' }}>
      {children}
    </Sticky>
  )
}

export default ProductImageWrapper
