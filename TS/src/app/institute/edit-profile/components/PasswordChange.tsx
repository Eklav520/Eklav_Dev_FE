import PasswordFormInput from '@/components/form/PasswordFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Card, CardHeader, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const PasswordChange = () => {
  const passwordFormSchema = yup.object({
    currentPassword: yup.string().required('Please enter your password'),
    password: yup.string().required('Please enter your password'),
    newPassword: yup.string().required('Please enter your new password'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(passwordFormSchema),
  })

  return (
    <Col lg={6}>
      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h5 className="card-header-title mb-0">Update password</h5>
        </CardHeader>
        <form onSubmit={handleSubmit(() => {})} className="card-body">
          <PasswordFormInput
            name="currentPassword"
            placeholder="Enter current password"
            label="Current password"
            control={control}
            containerClassName="mb-3"
          />
          <PasswordFormInput
            name="newPassword"
            placeholder="Enter new password"
            label="Enter new password"
            control={control}
            containerClassName="mb-3"
          />
          <PasswordFormInput name="password" placeholder="Enter new password" label="Confirm new password" control={control} />
          <div className="d-flex justify-content-end mt-4">
            <button type="submit" className="btn btn-primary mb-0">
              Change password
            </button>
          </div>
        </form>
      </Card>
    </Col>
  )
}

export default PasswordChange
