import { getAllStudents } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { ProgressBar } from 'react-bootstrap'
import { BsEnvelope, BsEye } from 'react-icons/bs'
import { FaBan } from 'react-icons/fa'

const StudentList = () => {
  const studentData = useFetchData(getAllStudents)
  return (
    <div className="table-responsive border-0">
      <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
        <thead>
          <tr>
            <th scope="col" className="border-0 rounded-start">
              Instructor name
            </th>
            <th scope="col" className="border-0">
              Join date
            </th>
            <th scope="col" className="border-0">
              Progress
            </th>
            <th scope="col" className="border-0">
              Courses
            </th>
            <th scope="col" className="border-0">
              Payments
            </th>
            <th scope="col" className="border-0 rounded-end">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {studentData?.map((item, idx) => (
            <tr key={idx}>
              <td>
                <div className="d-flex align-items-center position-relative">
                  <div className="avatar avatar-md">
                    {item.course?.avatar && <img src={item.course.avatar} className="rounded-circle" alt={'avatar'} />}
                  </div>
                  <div className="mb-0 ms-3">
                    <h6 className="mb-0">
                      <a href="#" className="stretched-link">
                        {item.course?.name}
                      </a>
                    </h6>
                    <span className="text-body small">
                      <i className="fas fa-fw fa-map-marker-alt me-1 mt-1" />
                      {item.location}
                    </span>
                  </div>
                </div>
              </td>
              <td> &nbsp;{item.course?.date.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td className="text-center text-sm-start">
                <div className="overflow-hidden">
                  <h6 className="mb-0">{item.progress}%</h6>
                  <ProgressBar
                    variant="primary"
                    now={item.progress}
                    className="progress-sm aos"
                    role="progressbar"
                    data-aos="slide-right"
                    data-aos-delay={200}
                    data-aos-duration={1000}
                    data-aos-easing="ease-in-out"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </td>
              <td>{item.totalCourse}</td>
              <td>${item.payments}</td>
              <td>
                <a href="#" className="btn btn-light btn-round me-1 mb-1 mb-md-0" data-bs-toggle="tooltip" data-bs-placement="top" title="View">
                  <BsEye />
                </a>
                <a href="#" className="btn btn-light btn-round me-1 mb-1 mb-md-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Message">
                  <BsEnvelope />
                </a>
                <button className="btn btn-light btn-round mb-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Block">
                  <FaBan />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StudentList
