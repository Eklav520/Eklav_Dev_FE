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
  videos: File;
  description: string;
  caseStudy?: {
    title: string;
    description: string;
    inputExample: string;
    expectedOutput: string;
    boilerplate: string;
  } | null;
};

type UploadVideoPayload = {
  video: string;
  description: string;
  caseStudy?: {
    title: string;
    description: string;
    inputExample: string;
    expectedOutput: string;
    boilerplate: string;
  } | null;
};



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

 const handleSubmit = async () => {
  console.log("🟢 handleSubmit called");
  try {
    setUploadProgress(0);

    // --- Step 1: Upload videos ---
   const uploadedVideos: UploadVideoPayload[] = [];
    for (const videoObj of formData.videos) {
      const file = videoObj.videos;
      const description = videoObj.description;
      const { data } = await axios.post(`${baseURL}/s3/generate-presigned-url`, {
        fileName: file.name,
        fileType: file.type,
      });

      await axios.put(data.uploadUrl, file, {       // ✅ fixed
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      uploadedVideos.push({
        video: data.key,
        description,
        caseStudy: videoObj.caseStudy || null,
      })
    }

    // --- Step 2: Upload image ---
    let uploadedImageKey: string | null = null;
    if (formData.image) {
      const file = formData.image;
      const { data } = await axios.post(`${baseURL}/s3/generate-presigned-url`, {
        fileName: file.name,
        fileType: file.type,
      });

      await axios.put(data.uploadUrl, file, {       // ✅ fixed
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      uploadedImageKey = data.key;
    }

    // --- Step 3: Upload quiz Excel ---
    let uploadedQuizKey: string | null = null;
    if (formData.quizFile) {
      const file = formData.quizFile;
      const { data } = await axios.post(`${baseURL}/s3/generate-presigned-url`, {
        fileName: file.name,
        fileType: file.type,
        folder: "quiz",
      });

      await axios.put(data.uploadUrl, file, {       // ✅ fixed
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total)
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      uploadedQuizKey = data.key;
    }

    // --- Step 4: Build JSON payload ---
    const payload = {
      title: formData.title,
      shortDescription: formData.shortDescription,
      category: formData.category,
      level: formData.level,
      language: formData.language,
      isFeatured: formData.isFeatured,
      duration: formData.duration,
      totalLectures: formData.totalLectures,
      price: formData.price,
      discountPrice: formData.discountPrice,
      description: formData.description,
      image: uploadedImageKey,
      videoUrl: formData.videoUrl,
      features: formData.features,
      addFAQ: formData.addFAQ,
      quizKey: uploadedQuizKey,
      addVideo: uploadedVideos,
    };

    // --- Step 5: Submit JSON ---
    const response = await axios.post(`${baseURL}/courses`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 201) {
      showNotification({
        message: "Successfully Course Created. Redirecting...",
        variant: "success",
      });
      redirectUser();
    } else {
      showNotification({
        message: "Something went wrong during course creation.",
        variant: "danger",
      });
    }
  } catch (error) {
    console.error("Error submitting course:", error);
    showNotification({ message: "Network Failed.", variant: "danger" });
  }
};

  return (
    <section>
      <Container>
        <Row>
          <Col md={8} className="mx-auto text-center">
            <p>
              Use this interface to add a new Course to the portal. Once you are done adding the item it will be reviewed
              for quality. If approved, your course will appear for sale and you will be informed by email.
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
