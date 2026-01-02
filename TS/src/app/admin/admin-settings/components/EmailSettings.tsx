import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { FaEdit } from 'react-icons/fa'
import * as yup from 'yup'
import { editEmailTemplateData, EditEmailTemplateType } from '../data'

const EditEmailTemplateData = ({ title }: EditEmailTemplateType) => {
  return (
    <Col md={6} xxl={4}>
      <div className="bg-light rounded-3 d-flex justify-content-between align-items-center p-2">
        <h6 className="mb-0">
          <a href="#">{title}</a>
        </h6>
        <a href="#" className="btn btn-sm btn-round btn-dark flex-shrink-0 mb-0">
          <FaEdit />
        </a>
      </div>
    </Col>
  )
}

const EmailSettings = () => {
  const editEmailFormSchema = yup.object({
    smtpHost: yup.string().required('Please enter your SMTP HOST'),
    smtpPort: yup.string().required('Please enter your SMTP Port'),
    smtpSecure: yup.string().required('Please enter your SMTP Secure'),
    smtpUsername: yup.string().required('Please enter your SMTP Username'),
    smtpPassword: yup.string().required('Please enter your SMTP Password'),
    emailAddress: yup.string().email('Please enter valid email').required('Please enter your Email From Address'),
    emailName: yup.string().email('Please enter valid email').required('Please enter your Email From Name'),
    emailExternal: yup.string().email('Please enter valid email').required('Please enter your Email External Email'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(editEmailFormSchema),
  })

  return (
    <Card className="shadow">
      <CardHeader className="border-bottom">
        <h5 className="card-header-title mb-0">Email Settings</h5>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(() => {})}>
          <Row className="g-4">
            <Col xl={8}>
              <label className="form-label">Choose Email Drive</label>
              <div className="d-sm-flex justify-content-sm-between align-items-center">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="flexRadioEmail" id="flexRadioEmail1" />
                  <label className="form-check-label" htmlFor="flexRadioEmail1">
                    Send Mail
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="flexRadioEmail" id="flexRadioEmail2" defaultChecked />
                  <label className="form-check-label" htmlFor="flexRadioEmail2">
                    SMTP
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="flexRadioEmail" id="flexRadioEmail3" />
                  <label className="form-check-label" htmlFor="flexRadioEmail3">
                    Mail
                  </label>
                </div>
              </div>
            </Col>
            <TextFormInput name="smtpHost" containerClassName="col-md-6" label="SMTP HOST" control={control} />
            <TextFormInput name="smtpPort" containerClassName="col-md-6 col-xl-3" label="SMTP Port" control={control} />
            <TextFormInput name="smtpSecure" containerClassName="col-md-6 col-xl-3" label="SMTP Secure" control={control} />
            <TextFormInput name="smtpSecure" containerClassName="col-md-6" label="SMTP Username" control={control} />
            <TextFormInput name="smtpPassword" containerClassName="col-md-6" label="SMTP Password" control={control} />
            <TextFormInput name="emailAddress" containerClassName="col-md-6" label="Email From Address" control={control} />
            <TextFormInput name="emailName" containerClassName="col-md-6" label="Email From Name" control={control} />
            <Col lg={6}>
              <label className="form-label">Email Send To</label>
              <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
                <option>Email Send to</option>
                <option>All Admin</option>
                <option>Instructors</option>
                <option>Students</option>
                <option>Visitors</option>
              </ChoicesFormInput>
            </Col>
            <TextFormInput name="emailExternal" containerClassName="col-md-6" label="Email External Email" control={control} />
          </Row>
          <Row className="g-4 mt-4">
            <div className="d-sm-flex justify-content-between align-items-center">
              <h5 className="mb-0">Edit Email Template</h5>
              <Button variant="primary" size="sm" className="mb-0">
                Add Template
              </Button>
            </div>

            {editEmailTemplateData.map((item, idx) => (
              <EditEmailTemplateData key={idx} {...item} />
            ))}
            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary mb-0">
                Update
              </button>
            </div>
          </Row>
        </form>
      </CardBody>
    </Card>
  )
}

export default EmailSettings
