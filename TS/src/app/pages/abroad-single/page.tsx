import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import Banner from './components/Banner'
import Details from './components/Details'
import TopNavigationBar from './components/TopNavigationBar'

const AbroadSinglePage = () => {
  return (
    <>
      <PageMetaData title="Abroad Single" />
      <TopNavigationBar />
      <main>
        <Banner />
        <Details />
        <ActionBox />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default AbroadSinglePage
