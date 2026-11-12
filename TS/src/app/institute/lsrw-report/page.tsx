import PageMetaData from '@/components/PageMetaData'
import LSRWPracticeFull from '@/components/dashboard/LSRWPracticeFull'

const LSRWReportPage = () => {
  return (
    <>
      <PageMetaData title="LSRW Section Report" />
      {/* Sits directly in the layout's content card, like the other admin pages */}
      <LSRWPracticeFull apiBase="/api/institute" />
    </>
  )
}

export default LSRWReportPage
