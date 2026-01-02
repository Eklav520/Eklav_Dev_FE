import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const WebsiteSettings = () => {
  const websiteSettingsFormSchema = yup.object({
    name: yup.string().required('Please enter your first name'),
    copyrights: yup.string().required('Please enter site copyrights'),
    email: yup.string().email('Please enter valid email').required('Please enter your email'),
    supportEmail: yup.string().email('Please enter valid email').required('Please enter your email'),
    phoneNo: yup.number().required('Please enter your phone number'),
    description: yup.string().required('Please enter your description'),
    address: yup.string().required('Please enter your address'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(websiteSettingsFormSchema),
  })

  return (
    <Card className="shadow">
      <CardHeader className="border-bottom">
        <h5 className="card-header-title">Website Settings</h5>
      </CardHeader>
      <CardBody>
        <form className="row g-4 align-items-center" onSubmit={handleSubmit(() => {})}>
          <Col lg={4}>
            <TextFormInput name="name" placeholder="Site Name" label="Site Name" control={control} />
            <div className="form-text">Enter Website Name. It Display in Website and Email.</div>
          </Col>

          <Col lg={4}>
            <TextFormInput name="copyrights" label="Site Copyrights" placeholder="Site Copyrights" control={control} />
            <div className="form-text">Using for Contact and Send Email</div>
          </Col>
          <Col lg={4}>
            <TextFormInput name="email" label="Site Email" placeholder="Site Email" control={control} />
            <div className="form-text">For Copyrights Text</div>
          </Col>
          <Col xs={12}>
            <TextAreaFormInput name="description" label="Site Description" control={control} />
            <div className="form-text">For write brief description of your organization, or a Website.</div>
          </Col>
          <Col lg={6}>
            <TextFormInput name="phoneNo" placeholder="Contact Phone" label="Contact Phone" control={control} />
            <div className="form-text">Using for Contact and Support</div>
          </Col>
          <Col lg={6}>
            <TextFormInput name="supportEmail" label="Support Email" placeholder="Support Email" control={control} />
            <div className="form-text">For Support Email</div>
          </Col>
          <Col lg={6}>
            <label className="form-label">Allow Registration</label>
            <div className="d-sm-flex">
              <div className="form-check radio-bg-light me-4">
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" defaultChecked />
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  Enable
                </label>
              </div>
              <div className="form-check radio-bg-light me-4">
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" />
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Disable
                </label>
              </div>
              <div className="form-check radio-bg-light">
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault3" />
                <label className="form-check-label" htmlFor="flexRadioDefault3">
                  On Request
                </label>
              </div>
            </div>
          </Col>
          <Col xs={12}>
            <TextAreaFormInput name="address" label="Contact Address" control={control} />
            <div className="form-text">Enter support Address</div>
          </Col>
          <div className="d-sm-flex justify-content-end">
            <button type="submit" className="btn btn-primary mb-0">
              Update
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default WebsiteSettings
