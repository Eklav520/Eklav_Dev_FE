import Footer from '@/components/Footer'
import { getInstructorById } from '@/helpers/data'
import { InstructorType } from '@/types/other'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import InstructorDetails from './components/InstructorDetails'
import TopNavigationBar from './components/TopNavigationBar'
import PageMetaData from '@/components/PageMetaData'

const InstructorDetail = () => {
  const [instructor, setInstructor] = useState<InstructorType>()
  const { instructorId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      if (instructorId) {
        const data = await getInstructorById(instructorId)
        if (data) setInstructor(data)
        else navigate('/error-404')
      }
    })()
  }, [])

  return (
    <>
      <PageMetaData title={instructor?.id ?? 'Instructors Details'} />
      <TopNavigationBar />
      <main>
        <InstructorDetails />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default InstructorDetail
