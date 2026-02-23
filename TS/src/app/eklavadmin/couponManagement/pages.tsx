import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import CouponAdmin from './components/CouponAdmin'

const CouponManagementPage = () => {
  return (
    <>
      <PageMetaData title="Coupon Management" />
      <Card className="bg-transparent border rounded-4">
        <CouponAdmin />
      </Card>
    </>
  )
}

export default CouponManagementPage
