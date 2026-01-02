import { Col } from 'react-bootstrap'
import Playlist from './Playlist'
import useViewPort from '@/hooks/useViewPort'

const AllPlayList = () => {
  const { width } = useViewPort()
  return (
    <>
      {width >= 992 && (
        <Col xs={12}>
          <Playlist />
        </Col>
      )}
    </>
  )
}

export default AllPlayList
