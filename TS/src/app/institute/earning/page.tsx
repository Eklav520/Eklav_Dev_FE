import PageMetaData from '@/components/PageMetaData'
import EarningBoxes from './components/EarningBoxes'
import MonthEarning from './components/MonthEarning'
import TopEarning from './components/TopEarning'

const EarningPage = () => {
  return (
    <>
      <PageMetaData title="Earning" />
      <EarningBoxes />
      <MonthEarning />
      <TopEarning />
    </>
  )
}

export default EarningPage
