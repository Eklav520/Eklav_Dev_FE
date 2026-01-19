import PageMetaData from '@/components/PageMetaData'
import Chart from './components/Chart'
import Counter from './components/Counter'

const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Instructor Dashboard" />

      <div className="container-lg py-3 bg-body-secondary">
        <div className="mb-2">
          <Counter />
        </div>

        <div>
          <Chart />
        </div>
      </div>
    </>
  )
}

export default DashboardPage
