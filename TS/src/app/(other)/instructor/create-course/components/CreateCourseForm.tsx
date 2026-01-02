import useBSStepper from '@/hooks/useBSStepper'
import { useEffect, useRef, useState } from 'react'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'react-bootstrap'
import Step1 from './Step1'
import Step2 from './Step2'
import Step4 from './Step4'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

type VideoUpload = {
  videos: File
  description: string
  caseStudy?: {
    title: string
    description: string
    inputExample: string
    expectedOutput: string
    boilerplate: string
  } | null
}

type UploadVideoPayload = {
  video: string
  description: string
  caseStudy?: {
    title: string
    description: string
    inputExample: string
    expectedOutput: string
    boilerplate: string
  } | null
}

type CourseFormData = {
  title: string
  shortDescription: string
  category: string[]
  level: string[]
  language: string[]
  isFeatured: boolean
  duration: string
  totalLectures: string
  price: string
  discountPrice: string
  description: string
  image: File | null
  videoUrl: { url: string; description: string }[]
  videos: VideoUpload[]
  previewVideo: File | null // ✅ ADD
  previewVideoUrl?: string | null
  addFAQ: { question: string; answer: string }[]
  features: string[]
  quizFile: File | null
}

const CreateCourseForm = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const stepperRef = useRef<HTMLDivElement | null>(null)
  const stepperInstance = useBSStepper(stepperRef)
  const { showNotification } = useNotificationContext()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // ADD STATE
  const [uploadedVideoCount, setUploadedVideoCount] = useState<number>(0)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    shortDescription: '',
    category: [],
    level: [],
    language: [],
    isFeatured: false,
    duration: '',
    totalLectures: '',
    price: '',
    discountPrice: '',
    description: '',
    image: null,
    videoUrl: [],
    videos: [],
    previewVideo: null, // ✅ ADD
    previewVideoUrl: null, // ✅ ADD
    addFAQ: [],
    features: [],
    quizFile: null,
  })

  useEffect(() => {
    stepperInstance?.to(2)
    stepperInstance?.to(1)
  }, [stepperInstance])

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/instructor/edit-profile')
  }

  const uploadToS3WithProgress = (file: File, folder: string, onProgress: (percent: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1️⃣ Get presigned POST
        const { data } = await axios.post(`${baseURL}/s3/generate-presigned-url`, {
          fileName: file.name,
          fileType: file.type,
          folder,
        })

        // 2️⃣ Build form data
        const formData = new FormData()
        Object.entries(data.fields).forEach(([k, v]) => {
          formData.append(k, v as string)
        })
        formData.append('file', file)

        // 3️⃣ Upload with XHR (for progress)
        const xhr = new XMLHttpRequest()
        xhr.open('POST', data.uploadUrl)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            onProgress(percent)
          }
        }

        xhr.onload = () => {
          if (xhr.status === 204 || xhr.status === 201) {
            resolve(data.key)
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))

        xhr.send(formData)
      } catch (err) {
        reject(err)
      }
    })
  }

  const handleSubmit = async () => {
    try {
      setUploadProgress(0)
      setUploadedVideoCount(0) // ✅ RESET COUNT

      // ======================
      // Upload videos
      // ======================
      const uploadedVideos: UploadVideoPayload[] = []

      for (let i = 0; i < formData.videos.length; i++) {
        const videoObj = formData.videos[i]
        const file = videoObj.videos

        const videoKey = await uploadToS3WithProgress(file, 'videos', (percent) => {
          setUploadProgress(percent)
        })

        // ✅ INCREMENT AFTER EACH SUCCESSFUL UPLOAD
        setUploadedVideoCount((prev) => prev + 1)

        uploadedVideos.push({
          video: videoKey,
          description: videoObj.description,
          caseStudy: videoObj.caseStudy || null,
        })
      }

      // ======================
      // Upload image
      // ======================
      let uploadedImageKey: string | null = null
      if (formData.image) {
        uploadedImageKey = await uploadToS3WithProgress(formData.image, 'images', setUploadProgress)
      }

      // ======================
      // Upload preview video
      // ======================
      let uploadedPreviewVideoKey: string | null = null
      if (formData.previewVideo) {
        uploadedPreviewVideoKey = await uploadToS3WithProgress(formData.previewVideo, 'preview-videos', setUploadProgress)
      }

      // ======================
      // Upload quiz file
      // ======================
      let uploadedQuizKey: string | null = null
      if (formData.quizFile) {
        uploadedQuizKey = await uploadToS3WithProgress(formData.quizFile, 'quiz', setUploadProgress)
      }

      // ======================
      // Submit course
      // ======================
      await axios.post(`${baseURL}/courses`, {
        ...formData,
        image: uploadedImageKey,
        previewVideo: uploadedPreviewVideoKey,
        quizKey: uploadedQuizKey,
        addVideo: uploadedVideos,
      })

      showNotification({
        message: 'Course created successfully',
        variant: 'success',
      })

      // ✅ REDIRECT AFTER SUCCESS
      navigate('/instructor/manage-course')
    } catch (err) {
      console.error(err)
      showNotification({
        message: 'Upload failed',
        variant: 'danger',
      })
    }
  }

  return (
    <section>
      <Container>
        <Row>
          <Col md={8} className="mx-auto text-center">
            <p>
              Use this interface to add a new Course to the portal. Once you are done adding the item it will be reviewed for quality. If approved,
              your course will appear for sale and you will be informed by email.
            </p>
          </Col>
        </Row>
        <Card className="bg-transparent border rounded-3 mb-5">
          <div id="stepper" ref={stepperRef} className="bs-stepper stepper-outline">
            <CardHeader className="bg-light border-bottom px-lg-5">
              <div className="bs-stepper-header" role="tablist">
                <div className="step" data-target="#step-1">
                  <div className="d-grid text-center align-items-center">
                    <button type="button" className="btn btn-link step-trigger mb-0">
                      <span className="bs-stepper-circle">1</span>
                    </button>
                    <h6 className="bs-stepper-label d-none d-md-block">Course details</h6>
                  </div>
                </div>
                <div className="line" />
                <div className="step" data-target="#step-2">
                  <div className="d-grid text-center align-items-center">
                    <button type="button" className="btn btn-link step-trigger mb-0">
                      <span className="bs-stepper-circle">2</span>
                    </button>
                    <h6 className="bs-stepper-label d-none d-md-block">Course media</h6>
                  </div>
                </div>
                <div className="line" />
                <div className="step" data-target="#step-4">
                  <div className="d-grid text-center align-items-center">
                    <button type="button" className="btn btn-link step-trigger mb-0">
                      <span className="bs-stepper-circle">3</span>
                    </button>
                    <h6 className="bs-stepper-label d-none d-md-block">Additional information</h6>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="bs-stepper-content">
                <Step1 stepperInstance={stepperInstance} formData={formData} setFormData={setFormData} />
                <Step2 stepperInstance={stepperInstance} formData={formData} setFormData={setFormData} />
                <Step4
                  stepperInstance={stepperInstance}
                  formData={formData}
                  setFormData={setFormData}
                  handleSubmit={handleSubmit}
                  uploadProgress={uploadProgress}
                  uploadedVideoCount={uploadedVideoCount} // ✅ ADD
                />
              </div>
            </CardBody>
          </div>
        </Card>
      </Container>
    </section>
  )
}

export default CreateCourseForm
