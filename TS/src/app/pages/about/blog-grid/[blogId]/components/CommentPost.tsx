import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const CommentPost = () => {
  const formSchema = yup.object({
    name: yup.string().required('Please enter your name'),
    email: yup.string().email('please enter valid email').required('Please enter your email'),
    comment: yup.string().required('Please enter your comment'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(formSchema),
  })
  return (
    <form className="row g-3 mt-2 mb-5" onSubmit={handleSubmit(() => {})}>
      <TextFormInput name="name" label="Name *" containerClassName="col-lg-6" control={control} />
      <TextFormInput name="email" label="Email *" type="email" containerClassName="col-lg-6" control={control} />
      <TextAreaFormInput name="comment" rows={3} label="Your Comment *" control={control} containerClassName="col-12" />
      <Col xs={12}>
        <Button variant="primary" type="submit" className="mb-0">
          Post comment
        </Button>
      </Col>
    </form>
  )
}
export default CommentPost
