import avatar7 from '@/assets/images/avatar/07.jpg'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { BsPlus, BsX } from 'react-icons/bs'
import * as yup from 'yup'

const EditProfile = () => {
  const contactFormSchema = yup.object({
    name: yup.string().required('Please enter your first name'),
    from: yup.string().required('Please enter your first name'),
    location: yup.string().required('Please enter your first name'),
    email: yup.string().email('Please enter valid email').required('Please enter your email'),
    phoneNo: yup.number().required('Please enter your phone number'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(contactFormSchema),
    defaultValues: {
      email: 'example@gmail.com',
      phoneNo: 1234567890,
      location: 'California',
    },
  })

  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <h3 className="card-header-title mb-0">Edit Profile</h3>
      </CardHeader>
      <CardBody>
        <form className="row g-4" onSubmit={handleSubmit(() => {})}>
          <Col xs={12} className="justify-content-center align-items-center">
            <label className="form-label">Profile picture</label>
            <div className="d-flex align-items-center">
              <label className="position-relative me-4" htmlFor="uploadfile-1" title="Replace this pic">
                <span className="avatar avatar-xl">
                  <img id="uploadfile-1-preview" className="avatar-img rounded-circle border border-white border-3 shadow" src={avatar7} alt="" />
                </span>
                <button type="button" className="uploadremove">
                  <BsX className="bi bi-x text-white" />
                </button>
              </label>
              <label className="btn btn-primary-soft mb-0" htmlFor="uploadfile-1">
                Change
              </label>
              <input id="uploadfile-1" className="form-control d-none" type="file" />
            </div>
          </Col>
          <Col xs={12}>
            <label className="form-label">Full name</label>
            <div className="input-group">
              <input type="text" className="form-control" defaultValue="Lori" placeholder="First name" />
              <input type="text" className="form-control" defaultValue="Stevens" placeholder="Last name" />
            </div>
          </Col>
          <Col md={6}>
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text">Eklav.com</span>
              <input type="text" className="form-control" defaultValue="loristev" />
            </div>
          </Col>
          <TextFormInput name="email" label="Email id" control={control} containerClassName="col-md-6" />
          <TextFormInput name="phoneNo" label="Phone number" control={control} containerClassName="col-md-6" />
          <TextFormInput name="location" label="Location" control={control} containerClassName="col-md-6" />
          <Col xs={12}>
            <label className="form-label">About me</label>
            <textarea
              className="form-control"
              rows={3}
              defaultValue={'I’ve found a way to get paid for my favorite hobby, and do so while following my dream of traveling the world.'}
            />
            <div className="form-text">Brief description for your profile.</div>
          </Col>
          <Col xs={12}>
            <label className="form-label">Education</label>
            <input className="form-control mb-2" type="text" defaultValue="Bachelor in Computer Graphics" />
            <input className="form-control mb-2" type="text" defaultValue="Masters in Computer Graphics" />
            <button className="btn btn-sm btn-light mb-0 icon-center">
              <BsPlus className="me-1" />
              Add more
            </button>
          </Col>
          <div className="d-sm-flex justify-content-end">
            <button type="submit" className="btn btn-primary mb-0">
              Save changes
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default EditProfile
