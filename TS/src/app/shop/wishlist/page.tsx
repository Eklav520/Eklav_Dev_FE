import PageMetaData from '@/components/PageMetaData'
import Banner from './components/Banner'
import WishlistCart from './components/WishlistCart'

const WishlistPage = () => {
  return (
    <>
      <PageMetaData title="Wishlist" />
      <main>
        <Banner />
        <WishlistCart />
      </main>
    </>
  )
}

export default WishlistPage
