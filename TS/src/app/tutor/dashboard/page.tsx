import PageMetaData from '@/components/PageMetaData'
import Counter from './components/Counter'


const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Tutor Dashboard" />

      
      <div className="container-lg py-3 bg-body-secondary">
        <div className="mb-2">
          <Counter />
        </div>

      
      </div>
    </>
  )
}

export default DashboardPage