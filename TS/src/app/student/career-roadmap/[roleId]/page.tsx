import { useParams, useNavigate } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import RoadmapFlow from '../components/RoadmapFlow'
import { findRoadmapById } from '../data/roadmaps'

const CareerRoadmapDetailPage = () => {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const roadmap = findRoadmapById(roleId ?? '')

  if (!roadmap) {
    return (
      <div className="text-center py-5">
        <h5 className="text-muted">Roadmap not found.</h5>
        <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/student/career-roadmap')}>
          ← Back to Roadmaps
        </button>
      </div>
    )
  }

  return (
    <>
      <PageMetaData title={`${roadmap.title} Roadmap`} />
      <RoadmapFlow roadmap={roadmap} />
    </>
  )
}

export default CareerRoadmapDetailPage
