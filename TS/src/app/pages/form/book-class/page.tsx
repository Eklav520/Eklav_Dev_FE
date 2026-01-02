import PageMetaData from '@/components/PageMetaData'
import BookClass from './componets/BookClass'
import Footer from './componets/Footer'
import TopNavigationBar from './componets/TopNavigationBar'

const BookClassPage = () => {
  return (
    <>
      <PageMetaData title="Book Class" />
      <div>
        <TopNavigationBar />
        <BookClass />
        <Footer />
      </div>
    </>
  )
}

export default BookClassPage
