import AdminCreateProblem from '@/app/student/payment-info/components/AdminCreateProblem'
import { lazy } from 'react'
import { Navigate, type RouteProps } from 'react-router-dom'
import RoleRedirect from './RoleRedirect'
import { Material } from 'three/src/Three.Core.js'


// Demos Pages
const DemosDefault = lazy(() => import('@/app/demos/default/home/page'))
const Eduction = lazy(() => import('@/app/demos/education/home/page'))
const Academy = lazy(() => import('@/app/demos/academy/home/page'))
const Course = lazy(() => import('@/app/demos/course/home/page'))
const University = lazy(() => import('@/app/demos/university/home/page'))
const Kindergarten = lazy(() => import('@/app/demos/kindergarten/home/page'))
const Landing = lazy(() => import('@/app/demos/landing/home/page'))
const Tutor = lazy(() => import('@/app/demos/tutor/home/page'))
const School = lazy(() => import('@/app/demos/school/home/page'))
const Abroad = lazy(() => import('@/app/demos/abroad/home/page'))
const Workshop = lazy(() => import('@/app/demos/workshop/home/page'))

// pages
const Categories = lazy(() => import('@/app/pages/course/categories/page'))
const Grid = lazy(() => import('@/app/pages/course/grid/page'))
const Grid2 = lazy(() => import('@/app/pages/course/grid-2/page'))
const List = lazy(() => import('@/app/pages/course/list/page'))
const List2 = lazy(() => import('@/app/pages/course/list-2/page'))
const Detail = lazy(() => import('@/app/pages/course/detail/page'))
const DetailMinimal = lazy(() => import('@/app/pages/course/detail-min/page'))
const DetailAdvance = lazy(() => import('@/app/pages/course/detail-adv/[courseId]/page'))
const DetailModule = lazy(() => import('@/app/pages/course/detail-module/page'))
const VideoPlayer = lazy(() => import('@/app/pages/course/video-player/page'))
const InstructorList = lazy(() => import('@/app/pages/instructors/page'))
const InstructorSingle = lazy(() => import('@/app/pages/instructors/[instructorId]/page'))
const InstructorBecome = lazy(() => import('@/app/pages/become-instructor/page'))
const AbroadSingle = lazy(() => import('@/app/pages/abroad-single/page'))
const WorkshopDetail = lazy(() => import('@/app/pages/workshop-detail/page'))
const EventDetail = lazy(() => import('@/app/pages/event-detail/page'))
const RequestDemo = lazy(() => import('@/app/pages/form/request-demo/page'))
const BookClass = lazy(() => import('@/app/pages/form/book-class/page'))
const RequestAccess = lazy(() => import('@/app/pages/form/request-access/page'))
const AdmissionForm = lazy(() => import('@/app/pages/form/admission-form/page'))

// about pages
const AboutUs = lazy(() => import('@/app/pages/about/about-us/page'))
const ContactUs = lazy(() => import('@/app/pages/about/contact-us/page'))
const BlogGrid = lazy(() => import('@/app/pages/about/blog-grid/page'))
const BlogMasonry = lazy(() => import('@/app/pages/about/blog-masonry/page'))
const Pricing = lazy(() => import('@/app/pages/about/pricing/page'))
const BlogDetail = lazy(() => import('@/app/pages/about/blog-grid/[blogId]/page'))
const PrivacyPolicy = lazy(() => import('@/app/privacy-policy/page'))

//shop
const Shop = lazy(() => import('@/app/shop/page'))
const ProductDetail = lazy(() => import('@/app/shop/product-detail/[productId]/page'))
const Cart = lazy(() => import('@/app/shop/cart/page'))
const Checkout = lazy(() => import('@/app/shop/checkout/page'))
const EmptyCart = lazy(() => import('@/app/shop/empty-cart/page'))
const Wishlist = lazy(() => import('@/app/shop/wishlist/page'))

// help
const HelpCenter = lazy(() => import('@/app/help/center/page'))
const HelpCenterDetails = lazy(() => import('@/app/help/center-detail/page'))

//other
const Faq = lazy(() => import('@/app/faq/page'))
const Error404 = lazy(() => import('@/app/(other)/(error-pages)/error-404/page'))
const ComingSoon = lazy(() => import('@/app/coming-soon/page'))

//Auth
const SignIn = lazy(() => import('@/app/(other)/auth/sign-in/page'))
const SignUp = lazy(() => import('@/app/(other)/auth/sign-up/page'))
const ForgotPassword = lazy(() => import('@/app/(other)/auth/forgot-password/page'))
const DeleteAccountPublic = lazy(() => import('@/app/delete-account/page'))
const HRAcceptInvitePage = lazy(() => import('@/app/hr/accept-invite/page'))

//Instructor
const InstructorDashboard = lazy(() => import('@/app/eklavadmin/dashboard/page'))
const StudentAnalytics = lazy(() => import('@/app/eklavadmin/student-analytics/page'))
const InstructorCourses = lazy(() => import('@/app/eklavadmin/manage-course/page'))
const InternList = lazy(() => import('@/app/eklavadmin/adminIntern/page'))
const InstructorCreateCourse = lazy(() => import('@/app/(other)/instructor/create-course/page'))
const InstructorCourseAdd = lazy(() => import('@/app/(other)/instructor/course-added/page'))
const InstructorCodeChallenge = lazy(() => import('@/app/eklavadmin/codeChallenge/page'))
const AdminChallengeDetail = lazy(() => import('@/app/eklavadmin/codeChallenge/components/AdminChallengeDetail'))
const AdminFinalAssessmentUpload = lazy(() => import('@/app/eklavadmin/final-assessment/page'))
const AdminFinalAssessmentDetails = lazy(() => import('@/app/eklavadmin/final-assessment-details/page'))
const Quiz = lazy(() => import('@/app/eklavadmin/quiz/page'))
const Earnings = lazy(() => import('@/app/eklavadmin/earning/page'))
const StudentsList = lazy(() => import('@/app/eklavadmin/student-list/page'))
const TicketManagement = lazy(() => import('@/app/eklavadmin/ticket-management/page'))
const Orders = lazy(() => import('@/app/eklavadmin/order/page'))
const InstructorReviews = lazy(() => import('@/app/eklavadmin/review/page'))
const Payout = lazy(() => import('@/app/eklavadmin/payout/page'))
const EditProfile = lazy(() => import('@/app/eklavadmin/edit-profile/page'))
const Settings = lazy(() => import('@/app/eklavadmin/setting/page'))
const DeleteAccount = lazy(() => import('@/app/eklavadmin/delete-account/page'))
const MockInterview = lazy(() => import('@/app/eklavadmin/course-resume/page'))
const CommunicationSkills = lazy(() => import('@/app/eklavadmin/communication-skills/page'))
const ProblemStatement = lazy(() => import('@/app/eklavadmin/problem-statement/page'))
const ProblemStatementScore = lazy(() => import('@/app/eklavadmin/dailyChallengeScore/page'))
const AdminSelfInterview = lazy(() => import('@/app/eklavadmin/self-interview/page'))
const AdminCompanyInterview = lazy(() => import('@/app/eklavadmin/company-interviews/page'))
const AdminInterviewDetails = lazy(() => import('@/app/eklavadmin/interview-details/page'))
const ScheduleOnlineClasses = lazy(() => import('@/app/eklavadmin/online-classes/page'))
const AptitudeQuestionsUpload = lazy(() => import('@/app/eklavadmin/aptitudeQuestionsUpload/page'))
const SelfInterviewEvaluation = lazy(() => import('@/app/eklavadmin/self-interview-evaluation/page'))
const StudentQuizResult = lazy(() => import('@/app/eklavadmin/studentQuizresult/page'))
const AdminChatbox = lazy(() => import('@/app/eklavadmin/adminChatPanel/page'))
const AdminReelsUpload = lazy(() => import('@/app/eklavadmin/adminReelsUpload/page'))
const AdminCollegeDetails = lazy(() => import('@/app/eklavadmin/collegeDetails/pages'))
const AdminCouponManagement = lazy(() => import('@/app/eklavadmin/couponManagement/pages'))
const AddInstitute = lazy(() => import('@/app/eklavadmin/instituteDetails/pages'))
const ManageInstituteStudents = lazy(() => import('@/app/eklavadmin/institute-details/page'))
const HRDetailsPage = lazy(() => import('@/app/eklavadmin/hr-details/page'))
const AnnouncementsAdminPage = lazy(() => import('@/app/institute/announcements/page'))

const FacultyAdminPage = lazy(() => import('@/app/institute/facultyAdmin/page'))

const InstituteDashboard = lazy(() => import('@/app/institute/dashboard/page'))
const InstituteCourses = lazy(() => import('@/app/institute//manage-course/page'))
const InstituteOnlineClasses = lazy(() => import('@/app/institute/online-classes/page'))
const InstituteJobOpenings = lazy(() => import('@/app/institute/interview-details/page'))
const InstituteFinalAssessmentUpload = lazy(() => import('@/app/institute/final-assessment/page'))
const InstituteFinalAssessmentResults = lazy(() => import('@/app/institute/final-assessment-details/page'))
const InstituteEditProfile = lazy(() => import('@/app/institute/edit-profile/page'))
const AddStudent = lazy(() => import('@/app/institute/studentDetails/pages'))
const FreelancingPage = lazy(() => import('@/app/institute/freelencing/pages'))
const FreelancingTaskListPage = lazy(() => import('@/app/institute/freelencing/task-list/page'))
const InstituteCollegeLabsUpload = lazy(() => import('@/app/institute/college-labs-upload/page'))
const InstitutePlacementDrives = lazy(() => import('@/app/institute/placement-drives/page'))
const InstituteAptitudeAssessments = lazy(() => import('@/app/institute/aptitudeAssessments/page'))

//Student
const StudentFreelancing = lazy(() => import('@/app/student/freelencing/pages'))
const LeadershipBoard = lazy(() => import('@/app/student/leadership-board/page'))
const StudentDashboard = lazy(() => import('@/app/student/dashboard/page'))
const StudentChallengeList = lazy(() => import('@/app/student/code-challenge/page'))
const Subscription = lazy(() => import('@/app/student/subscription/page'))
const StudentCourseList = lazy(() => import('@/app/student/course-list/page'))
const StudentRaiseTicket = lazy(() => import('@/app/student/raise-ticket/page'))
const CourseResume = lazy(() => import('@/app/student/course-resume/page'))
const StudentQuiz = lazy(() => import('@/app/student/quiz/page'))
const PaymentInfo = lazy(() => import('@/app/student/payment-info/page'))
const ProblemStatements = lazy(() => import('@/app/student/problem-statement/page'))
const ProblemStatementSubmit = lazy(() => import('@/app/student/problem-statement-submit/[id]/page'))
const Terminal = lazy(() => import('@/app/student/terminal/page'))
const StudentWishlist = lazy(() => import('@/app/student/bookmark/page'))
const StudentEditProfile = lazy(() => import('@/app/student/edit-profile/page'))
const StudentSetting = lazy(() => import('@/app/student/setting/page'))
const StudentDeleteAccount = lazy(() => import('@/app/student/delete-account/page'))
const SelfInterview = lazy(() => import('@/app/student/self-interview/page'))
const StudentFinalAssessment = lazy(() => import('@/app/student/final-assessment/page'))
const AvailableCourses = lazy(() => import('@/app/student/available-courses/page'))
const IntershipsList = lazy(() => import('@/app/student/Internships/page'))
const IntershipsApplied = lazy(() => import('@/app/student/Internships/page'))
const Reels = lazy(() => import('@/app/student/reel-courses/page'))
const Materials = lazy(() => import('@/app/student/materials/page'))
const InterviewDetails = lazy(() => import('@/app/student/interview-details/page'))
const Aptitude = lazy(() => import('@/app/student/Aptitude Preparation/page'))
const Resume = lazy(() => import('@/app/student/resume-preparation/page'))
const Atschecker = lazy(() => import('@/app/student/atsChecker/pages'))
const StudentBlog = lazy(() => import('@/app/student/student-Blog/page'))
const OnlineClasses = lazy(() => import('@/app/student/online-classes/page'))
const AttendInterview = lazy(() => import('@/app/student/attend-interview/page'))
const SpeakingPractice = lazy(() => import('@/app/student/speaking-practice/page'))
const JustAMinute = lazy(() => import('@/app/student/just-a-minute/page'))
const LearningPractice = lazy(() => import('@/app/student/learning-practice/page'))
const WritingPractice = lazy(() => import('@/app/student/writing-practice/pages'))
const StudentCollegeLabs = lazy(() => import('@/app/student/college-labs/page'))
const StudentAchievements = lazy(() => import('@/app/student/achievements/page'))
const StudentPlacement = lazy(() => import('@/app/student/placement/page'))
const StudentCompanyRounds = lazy(() => import('@/app/student/company-rounds/pages'))
const StudentCompanyDetails = lazy(() => import('@/app/student/company-rounds/pages'))
const StudentCompanyList = lazy(() => import('@/app/student/company-rounds/pages'))
const CareerRoadmap = lazy(() => import('@/app/student/career-roadmap/page'))
const CareerRoadmapDetail = lazy(() => import('@/app/student/career-roadmap/[roleId]/page'))
//const BlogDetail = lazy(() => import('@/app/student/blog-details/[blogId]/page'))

//Admin
const AdminDashboard = lazy(() => import('@/app/admin/dashboard/page'))
const AllCourses = lazy(() => import('@/app/admin/all-courses/page'))
const CourseCategory = lazy(() => import('@/app/admin/course-category/page'))
const CourseDetail = lazy(() => import('@/app/admin/course-detail/page'))
const AdminStudents = lazy(() => import('@/app/admin/students/page'))
const AdminInstructors = lazy(() => import('@/app/admin/instructors/page'))
const AdminInstructorsDetails = lazy(() => import('@/app/admin/instructor-detail/page'))
const AdminInstructorRequests = lazy(() => import('@/app/admin/instructor-requests/page'))
const AdminReviews = lazy(() => import('@/app/admin/reviews/page'))
const AdminEarnings = lazy(() => import('@/app/admin/earnings/page'))
const AdminSettings = lazy(() => import('@/app/admin/admin-settings/page'))
const NotFound = lazy(() => import('@/app/admin/error-404/page'))

// ✅ Tutor Dashboard
const TutorDashboard = lazy(() => import('@/app/tutor/dashboard/page'))
const TutorOnline = lazy(() => import('@/app/tutor/online-classes/page'))
const TutorEditProfile = lazy(() => import('@/app/tutor/edit-profile/page'))
// ✅ Tutor Earnings
const TutorEarnings = lazy(() => import('@/app/tutor/earning/page'))
const TutorPayout = lazy(() => import('@/app/tutor/payout/page'))

// ✅ Tutor Students
const TutorStudentsList = lazy(() => import('@/app/tutor/student-list/page'))

// ✅ Tutor Profile

const TutorSettings = lazy(() => import('@/app/tutor/setting/page'))
const TutorDeleteAccount = lazy(() => import('@/app/tutor/delete-account/page'))





export type RoutesProps = {
  path: RouteProps['path']
  name: string
  element: RouteProps['element']
  exact?: boolean
}

const initialRoutes: RoutesProps[] = [
  {
    path: '/',
    name: 'root',
    element: <RoleRedirect />,
  },
]

export const demosRoutes: RoutesProps[] = [
  {
    path: '/demos/default/home',
    name: 'Demos',
    element: <DemosDefault />,
  },
  {
    path: '/demos/education/home',
    name: 'Home Eduction',
    element: <Eduction />,
  },
  {
    path: '/demos/academy/home',
    name: 'Home Academy',
    element: <Academy />,
  },
  {
    path: '/demos/course/home',
    name: 'Home Course',
    element: <Course />,
  },
  {
    path: '/demos/university/home',
    name: 'Home University',
    element: <University />,
  },
  {
    path: '/demos/kindergarten/home',
    name: 'Home Kindergarten',
    element: <Kindergarten />,
  },
  {
    path: '/demos/landing/home',
    name: 'Home Landing',
    element: <Landing />,
  },
  {
    path: '/demos/tutor/home',
    name: 'Home Tutor',
    element: <Tutor />,
  },
  {
    path: '/demos/school/home',
    name: 'Home School',
    element: <School />,
  },
  {
    path: '/demos/abroad/home',
    name: 'Home Abroad',
    element: <Abroad />,
  },
  {
    path: '/demos/workshop/home',
    name: 'Home Workshop',
    element: <Workshop />,
  },
]

const pagesRoutes: RoutesProps[] = [
  {
    path: '/pages/course/categories',
    name: 'Course Categories',
    element: <Categories />,
  },
  {
    path: '/pages/course/grid',
    name: 'Course Grid Classic',
    element: <Grid />,
  },
  {
    path: '/pages/course/grid-2',
    name: 'Course Grid Minimal',
    element: <Grid2 />,
  },
  {
    path: '/pages/course/list',
    name: 'Course List Classic',
    element: <List />,
  },
  {
    path: '/pages/course/list-2',
    name: 'Course List Minimal',
    element: <List2 />,
  },
  {
    path: '/pages/course/detail',
    name: 'Course Detail Classic',
    element: <Detail />,
  },
  {
    path: '/pages/course/detail-min',
    name: 'Course  Detail Minimal',
    element: <DetailMinimal />,
  },
  {
    path: '/pages/course/detail-adv/:courseId',
    name: 'Course Detail Advance',
    element: <DetailAdvance />,
  },
  {
    path: '/pages/about/blog-grid/:blogId',
    name: 'Blog',
    element: <BlogDetail />,
  },
  {
    path: '/pages/course/detail-module',
    name: 'Course Detail Module',
    element: <DetailModule />,
  },
  {
    path: '/pages/course/video-player',
    name: 'Course Full Screen Video',
    element: <VideoPlayer />,
  },
  {
    path: '/pages/about/about-us',
    name: 'About Us',
    element: <AboutUs />,
  },
  {
    path: '/pages/about/contact-us',
    name: 'Contact Us',
    element: <ContactUs />,
  },
  {
    path: '/pages/about/blog-grid',
    name: 'Blog Grid',
    element: <BlogGrid />,
  },
  {
    path: '/pages/about/blog-masonry',
    name: 'Blog Masonry',
    element: <BlogMasonry />,
  },
  /* {
    path: '/pages/about/blog-grid/:blogId',
    name: 'Blog Detail',
    element: <BlogDetail />,
  }, */
  {
    path: '/pages/about/pricing',
    name: 'Pricing',
    element: <Pricing />,
  },
  {
    path: '/pages/instructors',
    name: 'Instructor List',
    element: <InstructorList />,
  },
  {
    path: '/pages/instructors/:instructorId',
    name: 'Instructor Single',
    element: <InstructorSingle />,
  },
  {
    path: '/pages/become-instructor',
    name: 'Become an Instructor',
    element: <InstructorBecome />,
  },
  {
    path: '/pages/abroad-single',
    name: 'Abroad Single',
    element: <AbroadSingle />,
  },
  {
    path: '/pages/workshop-detail',
    name: 'Workshop Detail',
    element: <WorkshopDetail />,
  },
  {
    path: '/pages/event-detail',
    name: 'Event Detail',
    element: <EventDetail />,
  },
  {
    path: '/pages/form/request-demo',
    name: 'Request a demo',
    element: <RequestDemo />,
  },
  {
    path: '/pages/form/book-class',
    name: 'Book a Class',
    element: <BookClass />,
  },
  {
    path: '/pages/form/request-access',
    name: 'Free Access',
    element: <RequestAccess />,
  },
  {
    path: '/pages/form/admission-form',
    name: 'Admission Form',
    element: <AdmissionForm />,
  },
]

export const shopRoutes: RoutesProps[] = [
  {
    path: '/shop',
    name: 'Shop grid',
    element: <Shop />,
  },
  {
    path: '/shop/product-detail/:eventId',
    name: 'Product detail',
    element: <ProductDetail />,
  },
  {
    path: '/shop/cart',
    name: 'Product detail',
    element: <Cart />,
  },
  {
    path: '/shop/checkout',
    name: 'Checkout',
    element: <Checkout />,
  },
  {
    path: '/shop/empty-cart',
    name: 'Empty Cart',
    element: <EmptyCart />,
  },
  {
    path: '/shop/wishlist',
    name: 'Wishlist',
    element: <Wishlist />,
  },
]

const helpRoutes: RoutesProps[] = [
  {
    path: '/help/center',
    name: 'Help Center',
    element: <HelpCenter />,
  },
  {
    path: '/help/center-detail',
    name: 'Help Center Single',
    element: <HelpCenterDetails />,
  },
]

const otherRoutes: RoutesProps[] = [
  {
    path: '/faq',
    name: 'FAQs',
    element: <Faq />,
  },
  {
    path: '/error-404',
    name: 'Error 404',
    element: <Error404 />,
  },
  {
    path: '/coming-soon',
    name: 'Coming Soon',
    element: <ComingSoon />,
  },
  {
    path: '/instructor/create-course',
    name: 'Create Course',
    element: <InstructorCreateCourse />,
  },
]

export const authRoutes: RoutesProps[] = [
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/delete-account',
    name: 'Delete Account',
    element: <DeleteAccountPublic />,
  },
  {
    path: '/hr/accept-invite/:token',
    name: 'HR Accept Invite',
    element: <HRAcceptInvitePage />,
  },
  {
    path: '/auth/sign-in',
    name: 'Sign In',
    element: <SignIn />,
  },
  {
    path: '/auth/sign-up',
    name: 'Sign Up',
    element: <SignUp />,
  },
  {
    path: '/auth/forgot-password',
    name: 'Forgot Password',
    element: <ForgotPassword />,
  },
]

export const tutorRoutes: RoutesProps[] = [
  { path: '/tutor/dashboard', name: 'Dashboard', element: <TutorDashboard /> },
  { path: '/tutor/student-list', name: 'Students', element: <TutorStudentsList /> },
  { path: '/tutor/earning', name: 'Earnings', element: <TutorEarnings /> },
  { path: '/tutor/payout', name: 'Payout', element: <TutorPayout /> },
  { path: 'tutor/online-classes', name: 'Online-Classes', element: <TutorOnline/>},
  { path: '/tutor/edit-profile', name: 'Edit Profile', element: <TutorEditProfile /> },
  { path: '/tutor/setting', name: 'Settings', element: <TutorSettings /> },
  { path: '/tutor/delete-account', name: 'Delete Account', element: <TutorDeleteAccount /> },
]


export const EklavAdminRoutes: RoutesProps[] = [
  {
    path: '/eklavadmin/dashboard',
    name: 'Dashboard',
    element: <InstructorDashboard />,
  },
  {
    path: '/eklavadmin/student-analytics',
    name: 'Student Analytics',
    element: <StudentAnalytics />,
  },
  {
    path: '/eklavadmin/manage-course',
    name: 'Courses',
    element: <InstructorCourses />,
  },
   {
    path: '/eklavadmin/intern-list',
    name: 'Intern List',
    element: <InternList />,
  },
  {
    path: '/eklavadmin/course-added',
    name: 'Course Added',
    element: <InstructorCourseAdd />,
  },
  {
    path: '/eklavadmin/quiz',
    name: 'Quiz',
    element: <Quiz />,
  },
  {
    path: '/eklavadmin/aptitude-questions-upload',
    name: 'Aptitude Question Upload',
    element: <AptitudeQuestionsUpload />,
  },
  {
    path: '/eklavadmin/code-challenge',
    name: 'Code Challenge',
    element: <InstructorCodeChallenge />,
  },
  {
    path: '/eklavadmin/challenges/:id',
    name: 'Challenge Detail',
    element: <AdminChallengeDetail />,
  },
  {
    path: '/eklavadmin/finalassessmentupload',
    name: 'Admin Final Assessment',
    element: <AdminFinalAssessmentUpload />,
  },
  {
    path: '/eklavadmin/final-assessment-details',
    name: 'Admin Final Assessment Details',
    element: <AdminFinalAssessmentDetails />,
  },
  {
    path: '/eklavadmin/student-list',
    name: 'Students List',
    element: <StudentsList />,
  },
  {
    path: '/eklavadmin/ticket-management',
    name: 'Ticket Management',
    element: <TicketManagement />,
  },
  {
    path: '/eklavadmin/student-quiz-result',
    name: 'Students Quiz Result',
    element: <StudentQuizResult />,
  },
  {
    path: '/eklavadmin/online-classes',
    name: 'Schedule OnlineClasses',
    element: <ScheduleOnlineClasses />,
  },
  {
    path: '/eklavadmin/order',
    name: 'Orders',
    element: <Orders />,
  },
  {
    path: '/eklavadmin/review',
    name: 'Reviews',
    element: <InstructorReviews />,
  },
  {
    path: '/eklavadmin/payout',
    name: 'Payout',
    element: <Payout />,
  },
  {
    path: '/eklavadmin/edit-profile',
    name: 'Edit Profile',
    element: <EditProfile />,
  },
  {
    path: '/eklavadmin/setting',
    name: 'Settings',
    element: <Settings />,
  },
  {
    path: '/eklavadmin/delete-account',
    name: 'Admin',
    element: <DeleteAccount />,
  },
  {
    path: '/eklavadmin/course-resume',
    name: 'Course Resume',
    element: <MockInterview />,
  },
  {
    path: '/eklavadmin/communication-skills',
    name: 'Communication Skills',
    element: <CommunicationSkills />,
  },
  {
    path: '/eklavadmin/problem-statement',
    name: 'Daily Challenge',
    element: <ProblemStatement />,
  },
  {
    path: '/eklavadmin/problem-statement-score',
    name: 'Daily Challenge Score',
    element: <ProblemStatementScore />,
  },
  {
    path: '/eklavadmin/self-interview',
    name: 'Self Interview',
    element: <AdminSelfInterview />,
  },
  {
    path: '/eklavadmin/self-interview-evalution',
    name: 'Self Interview Evaluation',
    element: <SelfInterviewEvaluation />,
  },
  {
    path: '/eklavadmin/company-interview',
    name: 'Company Interview',
    element: <AdminCompanyInterview />,
  },
  {
    path: '/eklavadmin/admin-interview-details',
    name: 'Interview Details',
    element: <AdminInterviewDetails />,
  },
  {
    path: '/eklavadmin/college-details',
    name: 'College Details',
    element: <AdminCollegeDetails />,
  },
  {
    path: '/eklavadmin/coupon-management',
    name: 'Coupon Management',
    element: <AdminCouponManagement />,
  },
   {
    path: '/eklavadmin/institute-details',
    name: 'Add Institute',
    element: <AddInstitute />,
  },
  {
    path: '/eklavadmin/manage-institute-students',
    name: 'Manage Institute Students',
    element: <ManageInstituteStudents />,
  },
  {
    path: '/eklavadmin/hr-details',
    name: 'HR Management',
    element: <HRDetailsPage />,
  },
  {
    path: '/eklavadmin/admin-chatbox',
    name: 'Admin Chatbox',
    element: <AdminChatbox />,
  },
  {
    path: '/eklavadmin/admin-reels',
    name: 'Admin Reels',
    element: <AdminReelsUpload />,
  },
  {
    path: '/eklavadmin/announcements',
    name: 'Achievements',
    element: <AnnouncementsAdminPage />,
  },
]

export const InstituteAdminRoutes: RoutesProps[] = [

  {
    path: '/institute/dashboard',
    name: 'Dashboard',
    element: <InstituteDashboard />,
  },

  {
    path: '/institute/manage-courses',
    name: 'Manage Courses',
    element: <InstituteCourses />,
  },

 

  {
    path: '/institute/online-classes',
    name: 'Online Classes',
    element: <InstituteOnlineClasses />,
  },

  {
    path: '/institute/job-openings',
    name: 'Job Openings',
    element: <InstituteJobOpenings />,
  },

  {
    path: '/institute/final-assessment-upload',
    name: 'Final Assessment Upload',
    element: <InstituteFinalAssessmentUpload />,
  },
  {
    path: '/institute/final-assessment-results',
    name: 'Final Assessment Results',
    element: <InstituteFinalAssessmentResults />,
  },

  {
    path: '/institute/student-list',
    name: 'Students Details',
    element: <AddStudent/>,
  },

  {
    path: '/institute/freelencing',
    name: 'Freelencing',
    element: <FreelancingPage/>,
  },

  {
    path: '/institute/freelencing/tasks',
    name: 'Freelencing Tasks',
    element: <FreelancingTaskListPage/>,
  },

  {
    path: '/institute/college-labs-upload',
    name: 'College Labs Upload',
    element: <InstituteCollegeLabsUpload />,
  },

  {
    path: '/institute/placement-drives',
    name: 'Placement Drives',
    element: <InstitutePlacementDrives />,
  },

  {
    path: '/institute/edit-profile',
    name: 'Edit Profile',
    element: <InstituteEditProfile />,
  },

  {
    path: '/institute/faculty-admin',
    name: 'Faculty Admin',
    element: <FacultyAdminPage />,
  },

  {
    path: '/institute/announcements',
    name: 'Achievements',
    element: <AnnouncementsAdminPage />,
  },
  {
    path: '/institute/aptitude-assessments',
    name: 'Aptitude Assessments',
    element: <InstituteAptitudeAssessments />,
  },

]

export const facultyAdminRoutes: RoutesProps[] = [
  {
    path: '/faculty-admin/dashboard',
    name: 'Faculty Admin Dashboard',
    element: <FacultyAdminPage />,
  },
]

export const studentRoutes: RoutesProps[] = [
  {
    path: '/student/leadership-board',
    name: 'LeadershipBoard',
    element: <LeadershipBoard />,
  },
  {
    path: '/student/dashboard',
    name: 'Dashboard',
    element: <StudentDashboard />,
  },
  {
    path: '/student/code-challenge',
    name: 'CodeChallenge',
    element: <StudentChallengeList />,
  },
  {
    path: '/student/subscription',
    name: 'Subscription',
    element: <Subscription />,
  },
  {
    path: '/student/online-classes',
    name: 'OnlineClasses',
    element: <OnlineClasses />,
  },
  {
    path: '/student/freelancing',
    name: 'Internship',
    element: <StudentFreelancing />,
  },
  {
    path: '/student/freelancing/available-tasks',
    name: 'Internship Available Tasks',
    element: <StudentFreelancing />,
  },
  {
    path: '/student/freelancing/my-tasks',
    name: 'Internship My Tasks',
    element: <StudentFreelancing />,
  },
  {
    path: '/student/available-courses',
    name: 'Available Courses',
    element: <AvailableCourses />,
  },
  {
    path: '/student/interships',
    name: 'Interships',
    element: <IntershipsList/>,
  },
    {
    path: '/student/applied',
    name: 'Interships',
    element: <IntershipsApplied/>,
  },
  {
    path: '/student/reels',
    name: 'Reels Courses',
    element: <Reels />,
  },
  {
    path: '/student/materials',
    name: 'Materials',
    element: <Materials />,
  },
  {
    path: '/student/course-list',
    name: 'Courses',
    element: <StudentCourseList />,
  },
  {
    path: '/student/raise-ticket',
    name: 'Raise a Ticket',
    element: <StudentRaiseTicket />,
  },
  {
    path: '/student/course-resume',
    name: 'Course Resume',
    element: <CourseResume />,
  },
  {
    path: '/student/quiz',
    name: 'Quiz',
    element: <StudentQuiz />,
  },
  {
    path: '/student/payment-info',
    name: 'Payment Info',
    element: <PaymentInfo />,
  },
  {
    path: '/student/problem-statement',
    name: 'Daily Challange',
    element: <ProblemStatements />,
  },
   {
    path: '/student/problem-statement-submit/:id',
    name: 'Problem Statement Submit',
    element: <ProblemStatementSubmit />,
  },
  /* {
    path: '/student/terminal',
    name: 'Problem Statement Submit',
    element: <Terminal />,
  }, */
  {
    path: '/student/bookmark',
    name: 'Wishlist',
    element: <StudentWishlist />,
  },
  {
    path: '/student/aptitude',
    name: 'Aptitude',
    element: <Aptitude />,
  },
  {
    path: '/student/resume',
    name: 'Resume Prepare',
    element: <Resume />,
  },
  {
    path: '/student/ats-checker',
    name: 'ATS Checker',
    element: <Atschecker />,
  },
  {
    path: '/student/selfInterview',
    name: 'Self Interview',
    element: <SelfInterview />,
  },
  {
    path: '/student/final-assessment',
    name: 'Final Assessment',
    element: <StudentFinalAssessment />,
  },
  {
    path: '/student/edit-profile',
    name: 'Update Profile',
    element: <StudentEditProfile />,
  },
  {
    path: '/student/interview-details',
    name: 'Interview Details',
    element: <InterviewDetails />,
  },
  {
    path: '/student/setting',
    name: 'Setting',
    element: <StudentSetting />,
  },
  {
    path: '/student/delete-account',
    name: 'Delete Account',
    element: <StudentDeleteAccount />,
  },
  {
    path: '/student/student-Blog',
    name: 'Blog',
    element: <StudentBlog />,
  },
   {
    path: '/student/attend-interview',
    name: 'AttendInterviewss',
    element: <AttendInterview />,
  },
  {
    path:'/student/SpeakingPractice',
    name: 'SpeakingPractice',
    element: <SpeakingPractice/>
  },
  {
    path:'/student/JustAMinute',
    name: 'JustAMinute',
    element: <JustAMinute/>
  },
  {
    path:'/student/LearningPractice',
    name: 'LearningPractice',
    element: <LearningPractice/>
  },
  {
    path:'/student/WritingPractice',
    name: 'WritingPractice',
    element: <WritingPractice/>
  },
  {
    path: '/student/college-labs',
    name: 'College Labs',
    element: <StudentCollegeLabs />,
  },
  {
    path: '/student/company-rounds',
    name: 'Company Rounds',
    element: <StudentCompanyRounds />,
  },
  {
    path: '/student/company-rounds/:id',
    name: 'Company Round Details',
    element: <StudentCompanyDetails />,
  },
  {
    path: '/student/company-list',
    name: 'Company List',
    element: <StudentCompanyList />,
  },
  {
    path: '/student/placement',
    name: 'Placement Board',
    element: <StudentPlacement />,
  },
  {
    path: '/student/career-roadmap',
    name: 'Career Roadmap',
    element: <CareerRoadmap />,
  },
  {
    path: '/student/career-roadmap/:roleId',
    name: 'Career Roadmap Detail',
    element: <CareerRoadmapDetail />,
  },
  {
    path: '/student/achievements',
    name: 'Achievements',
    element: <StudentAchievements />,
  },
]

export const adminRoutes: RoutesProps[] = [
  {
    path: '/admin/dashboard',
    name: 'Admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/all-courses',
    name: 'All Courses',
    element: <AllCourses />,
  },
  {
    path: '/admin/course-category',
    name: 'Course Category',
    element: <CourseCategory />,
  },
  {
    path: '/admin/course-detail',
    name: 'Course Detail',
    element: <CourseDetail />,
  },
  {
    path: '/admin/students',
    name: 'Students',
    element: <AdminStudents />,
  },
  {
    path: '/admin/instructors',
    name: 'Instructors',
    element: <AdminInstructors />,
  },
  {
    path: '/admin/instructor-detail',
    name: 'Instructor Detail',
    element: <AdminInstructorsDetails />,
  },
  {
    path: '/admin/instructor-requests',
    name: 'Instructor Requests',
    element: <AdminInstructorRequests />,
  },
  {
    path: '/admin/reviews',
    name: 'Reviews',
    element: <AdminReviews />,
  },
  {
    path: '/admin/earnings',
    name: 'Earnings',
    element: <AdminEarnings />,
  },
  {
    path: '/admin/admin-settings',
    name: 'Admin Settings',
    element: <AdminSettings />,
  },
  {
    path: '/admin/not-found',
    name: 'Not Found',
    element: <NotFound />,
  },
]

// ── HR Routes ──────────────────────────────────────────────
const HRDashboard = lazy(() => import('@/app/hr/dashboard/page'))
const HRJobsPage  = lazy(() => import('@/app/hr/jobs/page'))
const HRCreateJobPage = lazy(() => import('@/app/hr/jobs/create/page'))
const HRCandidatesPage = lazy(() => import('@/app/hr/candidates/page'))
const HRPipelinePage = lazy(() => import('@/app/hr/pipeline/page'))
const HRManagePipelinePage = lazy(() => import('@/app/hr/pipeline/manage/page'))
const HRAddStagePage = lazy(() => import('@/app/hr/pipeline/stages/create/page'))
const HRInterviewsPage = lazy(() => import('@/app/hr/interviews/page'))
const HRAssessmentsPage = lazy(() => import('@/app/hr/assessments/page'))
const HRTeamPage = lazy(() => import('@/app/hr/team/page'))
const HRMyInterviewsPage = lazy(() => import('@/app/hr/my-interviews/page'))
const HRFeedbackGivenPage = lazy(() => import('@/app/hr/my-interviews/feedback/page'))
const HRFeedbackFormPage = lazy(() => import('@/app/hr/my-interviews/feedback-form/page'))
const HRSchedulePage = lazy(() => import('@/app/hr/my-interviews/schedule/page'))
const HRInterviewerCandidatesComingSoon = lazy(() => import('@/app/hr/my-interviews/candidates/page'))
const HRReportsComingSoon = lazy(() => import('@/app/hr/my-interviews/reports/page'))
const HRDocumentsComingSoon = lazy(() => import('@/app/hr/my-interviews/documents/page'))
const HRInterviewerSettingsComingSoon = lazy(() => import('@/app/hr/my-interviews/settings/page'))
const HRSettingsPage = lazy(() => import('@/app/hr/settings/page'))
const HRCompanyProfilePage = lazy(() => import('@/app/hr/company-profile/page'))
const HRApprovalsPage = lazy(() => import('@/app/hr/approvals/page'))
const HROperationsPage = lazy(() => import('@/app/hr/operations/page'))
const HMDashboardPage = lazy(() => import('@/app/hr/hiring-manager/dashboard/page'))
const HMJobsComingSoon = lazy(() => import('@/app/hr/hiring-manager/jobs/page'))
const HMCandidatesComingSoon = lazy(() => import('@/app/hr/hiring-manager/candidates/page'))
const HMFeedbackComingSoon = lazy(() => import('@/app/hr/hiring-manager/feedback/page'))
const HMReportsComingSoon = lazy(() => import('@/app/hr/hiring-manager/reports/page'))
const HMProfileComingSoon = lazy(() => import('@/app/hr/hiring-manager/profile/page'))

export const hrRoutes: RoutesProps[] = [
  { path: '/hr/dashboard',   name: 'HR Dashboard',    element: <HRDashboard /> },
  { path: '/hr/jobs',        name: 'HR Jobs',         element: <HRJobsPage /> },
  { path: '/hr/jobs/create', name: 'HR Create Job',   element: <HRCreateJobPage /> },
  { path: '/hr/candidates',  name: 'HR Candidates',   element: <HRCandidatesPage /> },
  { path: '/hr/pipeline',    name: 'HR Pipeline',     element: <HRPipelinePage /> },
  { path: '/hr/pipeline/manage',        name: 'HR Manage Pipeline', element: <HRManagePipelinePage /> },
  { path: '/hr/pipeline/stages/create', name: 'HR Add Stage',       element: <HRAddStagePage /> },
  { path: '/hr/interviews', name: 'HR Interviews',    element: <HRInterviewsPage /> },
  { path: '/hr/assessments', name: 'HR Assessments',  element: <HRAssessmentsPage /> },
  { path: '/hr/team',       name: 'HR Team Members',  element: <HRTeamPage /> },
  { path: '/hr/my-interviews',           name: 'HR My Interviews Dashboard', element: <HRMyInterviewsPage /> },
  { path: '/hr/my-interviews/feedback',  name: 'HR Feedback Given',          element: <HRFeedbackGivenPage /> },
  { path: '/hr/my-interviews/feedback-form/:interviewId', name: 'HR Feedback Form', element: <HRFeedbackFormPage /> },
  { path: '/hr/my-interviews/schedule',  name: 'HR Interviewer Schedule',    element: <HRSchedulePage /> },
  { path: '/hr/my-interviews/candidates', name: 'HR Interviewer Candidates', element: <HRInterviewerCandidatesComingSoon /> },
  { path: '/hr/my-interviews/reports',   name: 'HR Interviewer Reports',     element: <HRReportsComingSoon /> },
  { path: '/hr/my-interviews/documents', name: 'HR Interviewer Documents',   element: <HRDocumentsComingSoon /> },
  { path: '/hr/my-interviews/settings',  name: 'HR Interviewer Settings',    element: <HRInterviewerSettingsComingSoon /> },
  { path: '/hr/settings',   name: 'HR Settings',       element: <HRSettingsPage /> },
  { path: '/hr/company-profile', name: 'HR Company Profile', element: <HRCompanyProfilePage /> },
  { path: '/hr/approvals',  name: 'HR Approvals',      element: <HRApprovalsPage /> },
  { path: '/hr/operations', name: 'HR Operations',     element: <HROperationsPage /> },
  { path: '/hr/hiring-manager/dashboard',  name: 'Hiring Manager Dashboard',  element: <HMDashboardPage /> },
  { path: '/hr/hiring-manager/jobs',       name: 'Hiring Manager My Jobs',    element: <HMJobsComingSoon /> },
  { path: '/hr/hiring-manager/candidates', name: 'Hiring Manager Candidates', element: <HMCandidatesComingSoon /> },
  { path: '/hr/hiring-manager/feedback',   name: 'Hiring Manager Feedback',   element: <HMFeedbackComingSoon /> },
  { path: '/hr/hiring-manager/reports',    name: 'Hiring Manager Reports',    element: <HMReportsComingSoon /> },
  { path: '/hr/hiring-manager/profile',    name: 'Hiring Manager Profile',    element: <HMProfileComingSoon /> },
]

export const appRoutes = [...initialRoutes, ...demosRoutes, ...otherRoutes, ...pagesRoutes, ...helpRoutes,]
