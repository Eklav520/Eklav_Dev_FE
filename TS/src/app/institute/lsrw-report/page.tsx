import PageMetaData from '@/components/PageMetaData'
import LSRWPracticeFull from '@/components/dashboard/LSRWPracticeFull'

const LSRWReportPage = () => {
  return (
    <>
      <PageMetaData title="LSRW Section Report" />
      <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#fff', padding: '2rem 1.5rem' }}>
        <LSRWPracticeFull apiBase="/api/institute" />
      </div>
    </>
  )
}

export default LSRWReportPage
