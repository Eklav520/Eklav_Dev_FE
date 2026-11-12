import PageMetaData from '@/components/PageMetaData'
import CollegeLabsUpload from './components/CollegeLabsUpload'

const CollegeLabsUploadPage = () => {
  // No extra card — the layout's content card is the only frame, as on the other admin pages
  return (
    <>
      <PageMetaData title="College Labs Upload" />
      <CollegeLabsUpload />
    </>
  )
}

export default CollegeLabsUploadPage
