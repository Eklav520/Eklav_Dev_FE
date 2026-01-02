import PageMetaData from '@/components/PageMetaData'
import AdmissionFrom from './components/AdmissionFrom'
import Footer from './components/Footer'
import TopNavigationBar from './components/TopNavigationBar'

const AdmissionFromPage = () => {
  return (
    <>
      <PageMetaData title="Admission From" />
      <TopNavigationBar />
      <AdmissionFrom />
      <Footer />
    </>
  )
}

export default AdmissionFromPage
