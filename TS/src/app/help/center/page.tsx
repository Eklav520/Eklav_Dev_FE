import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import HelpCenterBanner from './components/HelpCenterBanner'
import PopularArticles from './components/PopularArticles'
import RecommendedTopics from './components/RecommendedTopics'

const HelpCenterPage = () => {
  return (
    <>
      <PageMetaData title="Help Center" />
      <main>
        <HelpCenterBanner />
        {/* <RecommendedTopics />
        <PopularArticles /> */}
        
      </main>
    </>
  )
}

export default HelpCenterPage
