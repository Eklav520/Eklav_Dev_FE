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

  // ✅ NEW
  status?: 'pending' | 'uploading' | 'success' | 'failed'
  progress?: number
  s3Key?: string
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
  courseType: 'free' | 'paid'
  courseStatus: 'active' | 'coming-soon'
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
    courseType: 'free',
    courseStatus: 'active',
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
  const [courseId, setCourseId] = useState<string | null>(null)


  useEffect(() => {
    stepperInstance?.to(2)
    stepperInstance?.to(1)
  }, [stepperInstance])

  const redirectUser = () => {
    const redirectLink = searchParams.get('redirectTo')
    if (redirectLink) navigate(redirectLink)
    else navigate('/instructor/edit-profile')
  }

  const uploadToS3WithProgress = (
    file: File,
    options: {
      courseTitle: string
      assetType: 'video' | 'image' | 'preview' | 'quiz'
    },
    onProgress: (percent: number) => void,
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1️⃣ Get presigned POST (NEW PAYLOAD)
        const { data } = await axios.post(`${baseURL}/s3/presign/course`, {
          fileName: file.name,
          fileType: file.type,
          courseTitle: options.courseTitle,
          assetType: options.assetType,
        })

        // 2️⃣ Build form data
        const formData = new FormData()
        Object.entries(data.fields).forEach(([k, v]) => {
          formData.append(k, v as string)
        })
        formData.append('file', file)

        // 3️⃣ Upload with progress
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
            resolve(data.key) // ✅ S3 KEY with auto folder
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

  const createCourseOnly = async (
    imageKey: string | null,
    previewKey: string | null,
    quizKey: string | null
  ) => {
    const res = await axios.post(`${baseURL}/courses`, {
      title: formData.title,
      shortDescription: formData.shortDescription,
      category: formData.category,
      level: formData.level,
      language: formData.language,
      isFeatured: formData.isFeatured,
      duration: formData.duration,
      totalLectures: formData.totalLectures,
      courseType: formData.courseType,
      courseStatus: formData.courseStatus,
      price: formData.price,
      discountPrice: formData.discountPrice,
      description: formData.description,
      image: imageKey,
      previewVideo: previewKey,
      quizKey,
      videoUrl: formData.videoUrl,
      addFAQ: formData.addFAQ,
      features: formData.features,
    })

    return res.data.course._id
  }

  const uploadSingleLessonVideo = async (
    video: VideoUpload,
    index: number,
    courseId: string
  ) => {
    try {
      setFormData(prev => {
        const list = [...prev.videos]
        list[index].status = 'uploading'
        return { ...prev, videos: list }
      })

      const s3Key = await uploadToS3WithProgress(
        video.videos,
        { courseTitle: formData.title, assetType: 'video' },
        (percent) => {
          setFormData(prev => {
            const list = [...prev.videos]
            list[index].progress = percent
            return { ...prev, videos: list }
          })
        }
      )

      await axios.post(`${baseURL}/courses/${courseId}/video`, {
        videoKey: s3Key,
        description: video.description,
        caseStudy: video.caseStudy || null,
      })

      setFormData(prev => {
        const list = [...prev.videos]
        list[index].status = 'success'
        list[index].s3Key = s3Key
        return { ...prev, videos: list }
      })

      setUploadedVideoCount(c => c + 1)
      return true
    } catch {
      setFormData(prev => {
        const list = [...prev.videos]
        list[index].status = 'failed'
        return { ...prev, videos: list }
      })
      return false
    }
  }
  const uploadLessonVideosSequentially = async (courseId: string) => {
    for (let i = 0; i < formData.videos.length; i++) {
      const v = formData.videos[i]
      if (v.status === 'success') continue

      const ok = await uploadSingleLessonVideo(v, i, courseId)
      if (!ok) break
    }
  }

  const retryFailedVideos = async () => {
    if (!courseId) return
    await uploadLessonVideosSequentially(courseId)
  }




  const handleSubmit = async () => {
    try {

      if (courseId) {
        showNotification({
          message: 'Course already created. Use Retry if needed.',
          variant: 'info',
        })
        return
      }

      if (!courseId) {
        setUploadedVideoCount(0)
      }

      setUploadProgress(0)

      // 1️⃣ Upload image
      let imageKey = null
      if (formData.image) {
        imageKey = await uploadToS3WithProgress(
          formData.image,
          { courseTitle: formData.title, assetType: 'image' },
          setUploadProgress
        )
      }

      // 2️⃣ Upload preview video
      let previewKey = null
      if (formData.previewVideo) {
        previewKey = await uploadToS3WithProgress(
          formData.previewVideo,
          { courseTitle: formData.title, assetType: 'preview' },
          setUploadProgress
        )
      }

      // 3️⃣ Upload quiz
      let quizKey = null
      if (formData.quizFile) {
        quizKey = await uploadToS3WithProgress(
          formData.quizFile,
          { courseTitle: formData.title, assetType: 'quiz' },
          setUploadProgress
        )
      }

      // 4️⃣ Create course FIRST
      const createdCourseId = await createCourseOnly(imageKey, previewKey, quizKey)
      setCourseId(createdCourseId)


      // 5️⃣ Upload lesson videos SEQUENTIALLY
      await uploadLessonVideosSequentially(createdCourseId)

      showNotification({ message: 'Course created successfully', variant: 'success' })
      navigate('/instructor/manage-course')
    } catch (err) {
      showNotification({ message: 'Upload failed', variant: 'danger' })
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
      
<Card className="bg-white border-0 shadow-sm rounded-3 mb-5 overflow-hidden">
  <div id="stepper" ref={stepperRef} className="bs-stepper">
    <CardHeader className="bg-light-subtle border-bottom px-4 px-lg-5 py-4">
      <div className="bs-stepper-header" role="tablist">
        <div className="step" data-target="#step-1">
          <div className="d-flex flex-column align-items-center">
            <button type="button" className="btn btn-link step-trigger p-0 mb-2">
              <div className="bs-stepper-circle d-flex align-items-center justify-content-center">
                <span className="fw-medium">1</span>
              </div>
            </button>
            <h6 className="bs-stepper-label text-nowrap fs-6 fw-medium text-secondary">Course Details</h6>
          </div>
        </div>
        <div className="bs-stepper-line flex-grow-1 mx-3 d-none d-md-block">
          <div className="bs-stepper-line-inner"></div>
        </div>
        <div className="step" data-target="#step-2">
          <div className="d-flex flex-column align-items-center">
            <button type="button" className="btn btn-link step-trigger p-0 mb-2">
              <div className="bs-stepper-circle d-flex align-items-center justify-content-center">
                <span className="fw-medium">2</span>
              </div>
            </button>
            <h6 className="bs-stepper-label text-nowrap fs-6 fw-medium text-secondary">Course Media</h6>
          </div>
        </div>
        <div className="bs-stepper-line flex-grow-1 mx-3 d-none d-md-block">
          <div className="bs-stepper-line-inner"></div>
        </div>
        <div className="step" data-target="#step-4">
          <div className="d-flex flex-column align-items-center">
            <button type="button" className="btn btn-link step-trigger p-0 mb-2">
              <div className="bs-stepper-circle d-flex align-items-center justify-content-center">
                <span className="fw-medium">3</span>
              </div>
            </button>
            <h6 className="bs-stepper-label text-nowrap fs-6 fw-medium text-secondary">Additional Info</h6>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardBody className="p-4 p-lg-5">
      <div className="bs-stepper-content">
        <Step1 stepperInstance={stepperInstance} formData={formData} setFormData={setFormData} />
        <Step2 stepperInstance={stepperInstance} formData={formData} setFormData={setFormData} />
        <Step4
          stepperInstance={stepperInstance}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          retryFailedVideos={retryFailedVideos}
          uploadProgress={uploadProgress}
          uploadedVideoCount={uploadedVideoCount}
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
