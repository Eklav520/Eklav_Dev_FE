import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import AllListedBooks from './components/AllListedBooks'
import Banner from './components/Banner'

const ShopPage = () => {
  return (
    <>
      <PageMetaData title="Shop" />
      <main>
        <Banner />
        <AllListedBooks />
        <ActionBox />
      </main>
    </>
  )
}

export default ShopPage
