import PageMetaData from '@/components/PageMetaData'
import HelpCenterBanner from './components/HelpCenterBanner'
import HelpCenterDetails from './components/HelpCenterDetails'

const CenterDetailPage = () => {
  return (
    <>
      <PageMetaData title="Help Center Details" />
      <main>
        <HelpCenterBanner />
        <HelpCenterDetails />
      </main>
    </>
  )
}

export default CenterDetailPage
