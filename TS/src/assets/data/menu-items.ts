import type { MegaMenuType, MenuItemType } from '@/types/menu'
import {
  BsBasket,
  BsBasketFill,
  BsBook,
  BsCalculator,
  BsCameraVideo,
  BsCardChecklist,
  BsCaretDownSquare,
  BsCartCheck,
  BsCartCheckFill,
  BsCcSquareFill,
  BsChatDots,
  BsChatSquareText,
  BsCheck,
  BsChevronBarDown,
  BsChevronDoubleRight,
  BsClipboardCheck,
  BsCpu,
  BsCpuFill,
  BsCreditCard2Front,
  BsCreditCard2FrontFill,
  BsFileCheckFill,
  BsFileEarmarkArrowUp,
  BsFileEarmarkPlusFill,
  BsFileEarmarkText,
  BsFiletypeRb,
  BsFolderCheck,
  BsGear,
  BsGraphUp,
  BsGrid,
  BsGridFill,
  BsHouse,
  BsInfoSquareFill,
  BsLightbulb,
  BsLightningCharge,
  BsLock,
  BsMic,
  BsPatchCheck,
  BsPencilSquare,
  BsPeople,
  BsPersonBadgeFill,
  BsPersonWorkspace,
  BsQuestionDiamond,
  BsQuestionLg,
  BsSpeedometer2,
  BsStar,
  BsStarFill,
  BsStopwatch,
  BsTrash,
  BsTrophy,
  BsUiChecksGrid,
  BsUiRadiosGrid,
  BsWallet2,
} from 'react-icons/bs'
import { HiOutlineCodeBracketSquare, HiOutlinePuzzlePiece } from 'react-icons/hi2'

import {
  FaBasketballBall,
  FaBlog,
  FaBriefcase,
  FaChalkboardTeacher,
  FaChartBar,
  FaCog,
  FaEdit,
  FaFacebook,
  FaLinkedinIn,
  FaRegCommentDots,
  FaRegFileAlt,
  FaRegFileCode,
  FaRegFileVideo,
  FaRegGrinBeam,
  FaRegGrinBeamSweat,
  FaRegHandPaper,
  FaRegHandSpock,
  FaRobot,
  FaRunning,
  FaTrashAlt,
  FaUserCog,
} from 'react-icons/fa'
import { FaChartLine, FaUserGraduate, FaUserTie, FaWallet } from 'react-icons/fa6'

import clientUnitLogo1 from '@/assets/images/client/uni-logo-01.svg'
import clientUnitLogo2 from '@/assets/images/client/uni-logo-02.svg'
import clientUnitLogo3 from '@/assets/images/client/uni-logo-03.svg'
import clientUnitLogo4 from '@/assets/images/client/uni-logo-04.svg'
import { FcGoogle } from 'react-icons/fc'

export const CATEGORY_MENU_ITEMS: MenuItemType[] = [
  {
    key: 'category',
    label: 'Category',
    icon: BsUiRadiosGrid,
    children: [
      {
        key: 'development',
        label: 'Development',
        parentKey: 'category',
        children: [
          {
            key: 'web-development',
            label: 'Web Development',
            parentKey: 'development',
            children: [
              {
                key: 'css',
                label: 'CSS',
                parentKey: 'web-development',
              },
              {
                key: 'javaScript',
                label: 'JavaScript',
                parentKey: 'web-development',
              },
              {
                key: 'angular',
                label: 'Angular',
                parentKey: 'web-development',
              },
              {
                key: 'php',
                label: 'PHP',
                parentKey: 'web-development',
              },
              {
                key: 'html',
                label: 'HTML',
                parentKey: 'web-development',
              },
              {
                key: 'react',
                label: 'React',
                parentKey: 'web-development',
              },
            ],
          },
          {
            key: 'data-science',
            label: 'Data Science',
            parentKey: 'development',
          },
          {
            key: 'mobile-development',
            label: 'Mobile Development',
            parentKey: 'development',
          },
          {
            key: 'programming-language',
            label: 'Programming Language',
            parentKey: 'development',
          },
          {
            key: 'software-testing',
            label: 'Software Testing',
            parentKey: 'development',
          },
          {
            key: 'software-engineering',
            label: 'Software Engineering',
            parentKey: 'development',
          },
          {
            key: 'software-development-tools',
            label: 'Software Engineering',
            parentKey: 'development',
          },
        ],
      },
      {
        key: 'design',
        label: 'Design',
        parentKey: 'category',
        isMegaMenu: true,
      },
      {
        key: 'music',
        label: 'Music',
        parentKey: 'category',
      },
      {
        key: 'lifestyle',
        label: 'Lifestyle',
        parentKey: 'category',
      },
      {
        key: 'it-software',
        label: 'It & Software',
        parentKey: 'category',
      },
      {
        key: 'personal-development',
        label: 'Personal Development',
        parentKey: 'category',
      },
      {
        key: 'health-fitness',
        label: 'Health & fitness',
        parentKey: 'category',
      },
      {
        key: 'teaching',
        label: 'Teaching',
        parentKey: 'category',
      },
      {
        key: 'social-science',
        label: 'Social science',
        parentKey: 'category',
      },
      {
        key: 'math-logic',
        label: 'Math & Logic',
        parentKey: 'category',
      },
    ],
  },
]

export const INSTRUCTOR_MENU_ITEMS: MenuItemType[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: BsSpeedometer2, // speedometer = overview
    url: '/instructor/dashboard',
    parentKey: 'instructor',
  },
  {
    key: 'student-analytics',
    label: 'Student Analytics',
    icon: BsGraphUp,
    url: '/instructor/student-analytics',
    parentKey: 'instructor',
  },
  {
    key: 'students',
    label: 'Students List',
    icon: BsPeople, // people = students
    url: '/instructor/student-list',
    parentKey: 'instructor',
  },
  // Courses (collapsible)
  {
    key: 'courses',
    label: 'Courses Details',
    icon: BsBook, // books = courses
    children: [
      {
        key: 'coursesList',
        label: 'Courses List',
        icon: BsCardChecklist, // list of course cards
        url: '/instructor/manage-course',
        parentKey: 'instructor',
      },
      {
        key: 'MockInterviewList',
        label: 'Mock Interview List',
        icon: BsFileEarmarkText, // file of interview items
        url: '/instructor/course-resume',
        parentKey: 'instructor',
      },
      {
        key: 'CommunicationSkillsList',
        label: 'Communication Skills List',
        icon: BsChatDots, // conversation = comm skills
        url: '/instructor/communication-skills',
        parentKey: 'instructor',
      },
    ],
  },
  // Self Preparation
  {
    key: 'preparation',
    label: 'Self Preparation',
    icon: BsLightbulb, // learning/ideas
    children: [
      {
        key: 'aptitudeQuestionsUpload',
        label: 'Aptitude Questions Upload',
        icon: BsCalculator, // aptitude/math
        url: '/instructor/aptitude-questions-upload',
        parentKey: 'instructor',
      },
      {
        key: 'ProblemStatement',
        label: 'Daily Challenge',
        icon: BsLightningCharge, // daily spark/challenge
        url: '/instructor/problem-statement',
        parentKey: 'instructor',
      },
      {
        key: 'SelfInterview',
        label: 'Self Interview',
        icon: BsMic, // speaking/interview
        url: '/instructor/self-interview',
        parentKey: 'instructor',
      },
      {
        key: 'CompanyInterview',
        label: 'Company Interview',
        icon: BsPersonWorkspace,
        url: '/instructor/Company-interview',
        parentKey: 'instructor',
      },
      {
        key: 'SelfInterviewEvaluation',
        label: 'Self Interview Evaluation',
        icon: BsPatchCheck, // evaluation/verified
        url: '/instructor/self-interview-evalution',
        parentKey: 'instructor',
      },
    ],
  },
  // Other Activities
  {
    key: 'otherActivities',
    label: 'Other Activities',
    icon: BsGrid, // misc/collection
    children: [
      {
        key: 'onlineClasses',
        label: 'Online Classes',
        icon: BsCameraVideo, // live/recorded classes
        url: '/instructor/online-classes',
        parentKey: 'instructor',
      },
      {
        key: 'InterviewDetails',
        label: 'Interview Details Upload',
        icon: BsFileEarmarkArrowUp, // upload interview details
        url: '/instructor/admin-interview-details',
        parentKey: 'instructor',
      },
    ],
  },
  {
    key: 'finalAssessment',
    label: 'Admin Final Assessment',
    icon: BsClipboardCheck, // assessment/checklist
    url: '/instructor/final-assessment',
    parentKey: 'instructor',
  },
  {
    key: 'admin',
    label: 'Admin Chatbox',
    icon: BsPeople, // people = students
    url: '/instructor/admin-chatbox',
    parentKey: 'instructor',
  },
  {
    key: 'collegeDetails',
    label: 'Add College Details',
    icon: FaUserCog, // ⚙️ user with cog
    url: '/instructor/college-details',
    parentKey: 'instructor',
  },
  {
    key: 'couponManagement',
    label: 'Manage Coupons',
    icon: BsCreditCard2Front,
    url: '/instructor/coupon-management',
    parentKey: 'instructor',
  },
  {
    key: 'profile',
    label: 'Edit Profile',
    icon: BsPencilSquare, // edit/profile
    url: '/instructor/edit-profile',
    parentKey: 'instructor',
  },

  {
    key: 'payout',
    label: 'Payout',
    icon: BsWallet2, // wallet = payouts
    url: '/instructor/payout',
    parentKey: 'instructor',
  },
]

export const STUDENT_MENU_ITEMS: MenuItemType[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: BsSpeedometer2, // 📊 dashboard/speedometer
    url: '/student/dashboard',
  },

  {
    key: 'LeadershipBoard',
    label: 'Leadership Board',
    icon: BsTrophy, // 🏆 leaderboard/achievement
    url: '/student/leadership-board',
  },
  /* {
    key: 'codeChallenge',
    label: 'Code Challenge',
    icon: BsSpeedometer2,
    url: '/student/code-challenge',
  }, */
  {
    key: 'subscriptions',
    label: 'My Subscriptions',
    icon: BsCardChecklist, // ✅ checklist style
    url: '/student/subscription',
  },

  {
    key: 'courses',
    label: 'Courses',
    icon: BsBook, // 📚 tech-related
    children: [
      { key: 'availableCourses', label: 'Available Courses', icon: BsGridFill, url: '/student/available-courses', parentKey: 'courses' },
      { key: 'enrolledCourses', label: 'Enrolled Courses', icon: FaUserGraduate, url: '/student/course-list', parentKey: 'courses' },
      /* { key: 'communicationSkills', label: 'Communication Skills', icon: FaRegCommentDots, url: '/student/course-resume', parentKey: 'courses' }, */
      /* { key: 'mockInterviewVideos', label: 'Mock Interview Videos', icon: FaRegFileVideo, url: '/student/bookmark', parentKey: 'courses' }, */
    ],
  },

  // --- English Practice (separate) ---
  {
    key: 'englishPractice',
    label: 'English Practice',
    icon: BsChatSquareText, // 💬 different from Courses
    children: [
      {
        key: 'speakingPractice',
        label: 'Speaking Practice',
        icon: BsMic,
        url: '/student/speakingPractice', // 👈 lowercase here
        parentKey: 'englishPractice',
      },
      {
        key: 'justaMinute',
        label: 'Just A Minute',
        icon: BsStopwatch,
        url: '/student/JustaMinute', // 👈 lowercase here
        parentKey: 'englishPractice',
      },
      {
        key: 'learningPractice',
        label: 'Learning Practice',
        icon: FaChalkboardTeacher,
        url: '/student/learningPractice',
        parentKey: 'englishPractice',
      },
      {
        key: 'writingPractice',
        label: 'Writing Practice',
        icon: BsPencilSquare,
        url: '/student/writingPractice',
        parentKey: 'englishPractice',
      },
    ],
  },

  // Preparation parent (collapsible)
  {
    key: 'preparation',
    label: 'Self Preparation',
    icon: BsLightbulb, // 💡 learning/preparation
    children: [
      {
        key: 'aptitude',
        label: 'Aptitude Preparation',
        icon: HiOutlinePuzzlePiece, // ❓ question
        url: '/student/aptitude',
        parentKey: 'preparation',
      },
      /* {
        key: 'quiz',
        label: 'Quiz Practice',
        icon: BsQuestionDiamond, // 🔹 quiz
        url: '/student/quiz',
        parentKey: 'preparation',
      }, */
      {
        key: 'weeklyChallenge',
        label: 'Code Challenge',
        icon: HiOutlineCodeBracketSquare, // 📈 challenge/progress
        url: '/student/problem-statement',
        parentKey: 'preparation',
      },
      {
        key: 'selfInterview',
        label: 'Self Interview with AI',
        icon: FaRobot, // 🤖 AI
        url: '/student/selfInterview',
        parentKey: 'preparation',
      },
      {
        key: 'terminal',
        label: 'Compiler',
        icon: BsCpu, // 💻 CPU/terminal
        url: '/student/terminal',
      },
      /* {
        key: 'attendInterview',
        label: 'Recruitment Assessment with AI',
        icon: FaUserTie, // 👔 interview
        url: '/student/attend-interview',
        parentKey: 'preparation',
      }, */
    ],
  },

  // Extra Activities parent (collapsible)
  {
    key: 'activities',
    label: 'Extra Activities',
    icon: FaRunning, // 🏃‍♂️ activities
    children: [
      // {
      //   key: 'onlineClasses',
      //   label: 'Online Classes',
      //   icon: FaChalkboardTeacher, // 👨‍🏫 online classes
      //   url: '/student/online-classes',
      // },
      {
        key: 'resume',
        label: 'Resume Preparation',
        icon: FaRegFileAlt, // 📄 document
        url: '/student/resume',
      },
      {
        key: 'interviewDetails',
        label: 'Job Posts',
        icon: FaBriefcase, // 💼 jobs
        url: '/student/interview-details',
      },
      /* {
        key: 'materials',
        label: 'Materials',
        icon: FaBriefcase, // 💼 jobs
        url: '/student/materials',
      }, */
      /* {
        key: 'blog',
        label: 'Blog',
        icon: FaBlog, // 📝 blog
        url: '/student/student-Blog',
      }, */
    ],
  },

  {
    key: 'assessment',
    label: 'Final Assessment',
    icon: BsClipboardCheck, // 📝 final assessment
    url: '/student/final-assessment',
  },
  {
    key: 'profile',
    label: 'Update Profile',
    icon: FaUserCog, // ⚙️ user with cog
    url: '/student/edit-profile',
  },
]

export const APP_MENU_ITEMS: MenuItemType[] = [
  /* {
    key: 'demos',
    label: 'Home',
    isTitle: true,
    children: [
      {
        key: 'default',
        label: 'Home Default',
        url: '/demos/default/home',
        parentKey: 'demos',
      },
      {
        key: 'eduction',
        label: 'Home Eduction',
        url: '/demos/education/home',
        parentKey: 'demos',
      },
      {
        key: 'academy',
        label: 'Home Academy',
        url: '/demos/academy/home',
        parentKey: 'demos',
      },
      {
        key: 'course-home',
        label: 'Home Course',
        url: '/demos/course/home',
        parentKey: 'demos',
      },
      {
        key: 'university',
        label: 'Home University',
        url: '/demos/university/home',
        parentKey: 'demos',
      },
      {
        key: 'kindergarten',
        label: 'Home Kindergarten',
        url: '/demos/kindergarten/home',
        parentKey: 'demos',
      },
      {
        key: 'landing',
        label: 'Home Landing',
        url: '/demos/landing/home',
        parentKey: 'demos',
      },
      {
        key: 'tutor',
        label: 'Home Tutor',
        url: '/demos/tutor/home',
        parentKey: 'demos',
      },
      {
        key: 'school',
        label: 'Home School',
        url: '/demos/school/home',
        parentKey: 'demos',
      },
      {
        key: 'abroad',
        label: 'Home Abroad',
        url: '/demos/abroad/home',
        parentKey: 'demos',
      },
      {
        key: 'workshop',
        label: 'Home Workshop',
        url: '/demos/workshop/home',
        parentKey: 'demos',
      },
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    isTitle: true,
    children: [
      {
        key: 'course',
        label: 'Course',
        parentKey: 'pages',
        children: [
          {
            key: 'categories',
            label: 'Course Categories',
            url: '/pages/course/categories',
            parentKey: 'course',
            divider: true,
          },
          {
            key: 'gridClassic',
            label: 'Course Grid Classic',
            url: '/pages/course/grid',
            parentKey: 'course',
          },
          {
            key: 'minimalClassic',
            label: 'Course Grid Minimal',
            url: '/pages/course/grid-2',
            parentKey: 'course',
            divider: true,
          },
          {
            key: 'listClassic',
            label: 'Course List Classic',
            url: '/pages/course/list',
            parentKey: 'course',
          },
          {
            key: 'listMinimalClassic',
            label: 'Course List Minimal',
            url: '/pages/course/list-2',
            parentKey: 'course',
            divider: true,
          },
          {
            key: 'detailClassic',
            label: 'Course Detail Classic',
            url: '/pages/course/detail',
            parentKey: 'course',
          },
          {
            key: 'minimalDetailClassic',
            label: 'Course Detail Minimal',
            url: '/pages/course/detail-min',
            parentKey: 'course',
          },
          {
            key: 'detailAdvance',
            label: 'Course Detail Advance',
            url: '/pages/course/detail-adv',
            parentKey: 'course',
          },
          {
            key: 'moduleDetail',
            label: 'Course Detail Module',
            url: '/pages/course/detail-module',
            parentKey: 'course',
          },
          {
            key: 'gridClassic',
            label: 'Course Full Screen Video',
            url: '/pages/course/video-player',
            parentKey: 'course',
          },
        ],
      },
      {
        key: 'about',
        label: 'About',
        parentKey: 'pages',
        children: [
          {
            key: 'aboutUs',
            label: 'About Us',
            url: '/pages/about/about-us',
            parentKey: 'about',
          },
          {
            key: 'contactUs',
            label: 'Contact Us',
            url: '/pages/about/contact-us',
            parentKey: 'about',
          },
          {
            key: 'blogGrid',
            label: 'Blog Grid',
            url: '/pages/about/blog-grid',
            parentKey: 'about',
          },
          {
            key: 'blogMasonry',
            label: 'Blog Masonry',
            url: '/pages/about/blog-masonry',
            parentKey: 'about',
          },
          {
            key: 'blogDetail',
            label: 'Blog Detail',
            url: '/pages/about/blog-grid/1003',
            parentKey: 'about',
          },
          {
            key: 'pricing',
            label: 'Pricing',
            url: '/pages/about/pricing',
            parentKey: 'about',
          },
        ],
      },
      {
        key: 'instructorList',
        label: 'Instructor List',
        url: '/pages/instructors',
        parentKey: 'pages',
      },
      {
        key: 'instructorSingle',
        label: 'Instructor Single',
        url: '/pages/instructors/401',
        parentKey: 'pages',
      },
      {
        key: 'instructorBecome',
        label: 'Become an Instructor',
        url: '/pages/become-instructor',
        parentKey: 'pages',
      },
      {
        key: 'abroadSingle',
        label: 'Abroad Single',
        url: '/pages/abroad-single',
        parentKey: 'pages',
      },
      {
        key: 'workshopDetail',
        label: 'Workshop Detail',
        url: '/pages/workshop-detail',
        parentKey: 'pages',
      },
      {
        key: 'eventDetail',
        label: 'Event Detail',
        url: '/pages/event-detail',
        parentKey: 'pages',
      },
      {
        key: 'shop',
        label: 'Shop',
        parentKey: 'pages',
        children: [
          {
            key: 'shopGrid',
            label: 'Shop grid',
            url: '/shop',
            parentKey: 'shop',
          },
          {
            key: 'productDetail',
            label: 'Product detail',
            url: '/shop/product-detail/301',
            parentKey: 'shop',
          },
          {
            key: 'cart',
            label: 'Cart',
            url: '/shop/cart',
            parentKey: 'shop',
          },
          {
            key: 'checkout',
            label: 'Checkout',
            url: '/shop/checkout',
            parentKey: 'shop',
          },
          {
            key: 'emptyCart',
            label: 'Empty Cart',
            url: '/shop/empty-cart',
            parentKey: 'shop',
          },
          {
            key: 'wishlist',
            label: 'Wishlist',
            url: '/shop/wishlist',
            parentKey: 'shop',
          },
        ],
      },
      {
        key: 'help',
        label: 'Help',
        parentKey: 'pages',
        children: [
          {
            key: 'helpCenter',
            label: 'Help Center',
            url: '/help/center',
            parentKey: 'help',
          },
          {
            key: 'helpSingle',
            label: 'Help Center Single',
            url: '/help/center-detail',
            parentKey: 'help',
          },
          {
            key: 'faqs',
            label: 'FAQs',
            url: '/faq',
            parentKey: 'help',
          },
        ],
      },
      {
        key: 'authentication',
        label: 'Authentication',
        parentKey: 'pages',
        children: [
          {
            key: 'signIn',
            label: 'Sign In',
            url: '/auth/sign-in',
            parentKey: 'authentication',
          },
          {
            key: 'signup',
            label: 'Sign Up',
            url: '/auth/sign-up',
            parentKey: 'authentication',
          },
          {
            key: 'forgotPassword',
            label: 'Forgot Password',
            url: '/auth/forgot-password',
            parentKey: 'authentication',
          },
        ],
      },
      {
        key: 'form',
        label: 'Form',
        parentKey: 'pages',
        children: [
          {
            key: 'demoRequest',
            label: 'Request a demo',
            url: '/pages/form/request-demo',
            parentKey: 'form',
          },
          {
            key: 'book',
            label: 'Book a Class',
            url: '/pages/form/book-class',
            parentKey: 'form',
          },
          {
            key: 'freeAccess',
            label: 'Free Access',
            url: '/pages/form/request-access',
            parentKey: 'form',
          },
          {
            key: 'admissionForm',
            label: 'Admission Form',
            url: '/pages/form/admission-form',
            parentKey: 'form',
          },
        ],
      },
      {
        key: 'speciality',
        label: 'Specialty',
        parentKey: 'pages',
        children: [
          {
            key: '404Error',
            label: 'Error 404',
            url: '/error-404',
            parentKey: 'speciality',
          },
          {
            key: 'comingSoon',
            label: 'Coming Soon',
            url: '/coming-soon',
            parentKey: 'speciality',
          },
        ],
      },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    isTitle: true,
    children: [
      {
        key: 'instructor',
        label: 'Instructor',
        icon: FaUserTie,
        parentKey: 'accounts',
        children: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: BsGridFill,
            url: '/instructor/dashboard',
            parentKey: 'instructor',
          },
          {
            key: 'courses',
            label: 'Courses',
            icon: BsBasketFill,
            url: '/instructor/manage-course',
            parentKey: 'instructor',
          },
          {
            key: 'createCourse',
            label: 'Create Course',
            icon: BsFileEarmarkPlusFill,
            url: '/instructor/create-course',
            parentKey: 'instructor',
          },
          {
            key: 'addCourse',
            label: 'Course Added',
            icon: BsFileCheckFill,
            url: '/instructor/course-added',
            parentKey: 'instructor',
          },
          {
            key: 'quiz',
            label: 'Quiz',
            icon: BsQuestionDiamond,
            url: '/instructor/quiz',
            parentKey: 'instructor',
          },
          {
            key: 'earnings',
            label: 'Earnings',
            icon: FaChartLine,
            url: '/instructor/earning',
            parentKey: 'instructor',
          },
          {
            key: 'students',
            label: 'Students',
            icon: FaUserGraduate,
            url: '/instructor/student-list',
            parentKey: 'instructor',
          },
          {
            key: 'orders',
            label: 'Orders',
            icon: BsCartCheckFill,
            url: '/instructor/order',
            parentKey: 'instructor',
          },
          {
            key: 'reviews',
            label: 'Reviews',
            icon: BsStarFill,
            url: '/instructor/review',
            parentKey: 'instructor',
          },
          {
            key: 'payout',
            label: 'Payout',
            icon: FaWallet,
            url: '/instructor/payout',
            parentKey: 'instructor',
          },
        ],
      },
      {
        key: 'student',
        label: 'Student',
        icon: FaUserGraduate,
        parentKey: 'accounts',
        children: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: BsGridFill,
            url: '/student/dashboard',
            parentKey: 'student',
          },
          {
            key: 'subscriptions',
            label: 'My Subscriptions',
            icon: BsCardChecklist,
            url: '/student/subscription',
            parentKey: 'student',
          },
          {
            key: 'courses',
            label: 'Courses',
            icon: BsBasketFill,
            url: '/student/course-list',
            parentKey: 'student',
          },
          {
            key: 'resume',
            label: 'Course Resume',
            icon: FaRegFileAlt,
            url: '/student/course-resume',
            parentKey: 'student',
          },
          {
            key: 'quiz',
            label: 'Quiz',
            icon: BsQuestionDiamond,
            url: '/student/quiz',
            parentKey: 'student',
          },
          {
            key: 'paymentInfo',
            label: 'Payment Info',
            icon: BsCreditCard2FrontFill,
            url: '/student/payment-info',
            parentKey: 'student',
          },
          {
            key: 'wishlist',
            label: 'Wishlist',
            icon: BsCartCheckFill,
            url: '/student/bookmark',
            parentKey: 'student',
          },
        ],
      },
      {
        key: 'admin',
        label: 'Admin',
        icon: FaUserCog,
        url: '/admin/dashboard',
        parentKey: 'accounts',
        divider: true,
      },
      {
        key: 'editProfile',
        label: 'Edit Profile',
        icon: FaEdit,
        url: '/instructor/edit-profile',
        parentKey: 'accounts',
      },
      {
        key: 'setting',
        label: 'Settings',
        icon: FaCog,
        url: '/instructor/setting',
        parentKey: 'accounts',
      },
      {
        key: 'deleteProfile',
        label: 'Delete Profile',
        icon: FaTrashAlt,
        url: '/instructor/delete-account',
        parentKey: 'accounts',
        divider: true,
      },
      {
        key: 'dropdown',
        label: 'Dropdown levels',
        parentKey: 'accounts',
        children: [
          {
            key: 'dropdownEnd',
            label: 'Dropdown (end)',
            parentKey: 'dropdown',
            children: [
              {
                key: 'item-1',
                label: 'Dropdown item',
                parentKey: 'dropdownEnd',
              },
              {
                key: 'item-2',
                label: 'Dropdown item',
                parentKey: 'dropdownEnd',
              },
            ],
          },
          {
            key: 'dropdownItem',
            label: 'Dropdown item',
            parentKey: 'dropdown',
          },
          {
            key: 'dropdownStart',
            label: 'Dropdown (start)',
            parentKey: 'dropdown',
            children: [
              {
                key: 'item-1',
                label: 'Dropdown item',
                parentKey: 'dropdownStart',
              },
              {
                key: 'item-2',
                label: 'Dropdown item',
                parentKey: 'dropdownStart',
              },
            ],
          },
          {
            key: 'dropdownItem1',
            label: 'Dropdown item',
            parentKey: 'dropdown',
          },
        ],
      },
    ],
  }, */
]

export const MEGA_MENU_ITEMS: MegaMenuType = {
  getStarted: [
    {
      label: 'Market research',
    },
    {
      label: 'Advertising',
    },
    {
      label: 'Consumer behavior',
    },
    {
      label: 'Digital marketing',
    },
    {
      label: 'Marketing ethics',
    },
    {
      label: 'Social media marketing',
    },
    {
      label: 'Public relations',
    },
    {
      label: 'Advertising',
    },
    {
      label: 'Decision science',
    },
    { label: 'SEO' },
    {
      label: 'Business marketing',
    },
  ],
  degree: [
    {
      image: clientUnitLogo1,
      label: 'Contact management',
      description: 'Speedily say has suitable disposal add boy. On forth doubt miles of child.',
    },
    {
      image: clientUnitLogo2,
      label: 'Sales pipeline',
      description: 'Speedily say has suitable disposal add boy. On forth doubt miles of child.',
    },
    {
      image: clientUnitLogo3,
      label: 'Security & Permission',
      description: 'Speedily say has suitable disposal add boy. On forth doubt miles of child.',
    },
    {
      image: clientUnitLogo1,
      label: 'Andeerson Campus',
      description: 'Bachelor of computer science',
    },
    {
      image: clientUnitLogo4,
      label: 'University of South California',
      description: 'Masters of business development.',
    },
  ],
  certificate: [
    {
      label: 'Google SEO certificate',
      description: 'No prerequisites',
      icon: FcGoogle,
      iconClass: 'text-google-icon',
    },
    {
      label: 'Business Development Executive(BDE)',
      description: 'No prerequisites',
      icon: FaLinkedinIn,
      iconClass: 'text-linkedin',
    },
    {
      label: 'Facebook social media marketing',
      description: 'Expert advice',
      icon: FaFacebook,
      iconClass: 'text-facebook',
    },
    {
      label: 'Creative graphics design',
      description: 'No prerequisites',
      icon: FaBasketballBall,
      iconClass: 'text-dribbble',
    },
  ],
}

export const ADMIN_MENU_ITEMS: MenuItemType[] = [
  {
    key: 'admin',
    label: 'Dashboard',
    icon: BsHouse,
    url: '/admin/dashboard',
  },
  {
    key: 'pages',
    isTitle: true,
    label: 'Pages',
  },
  {
    key: 'courses',
    label: 'Courses',
    icon: BsBasket,
    children: [
      {
        key: 'all-courses',
        label: 'All Courses',
        parentKey: 'courses',
        url: '/admin/all-courses',
      },
      {
        key: 'course-category',
        label: 'Course Category',
        url: '/admin/course-category',
        parentKey: 'courses',
      },
      {
        key: 'course-detail',
        label: 'Course Detail',
        url: '/admin/course-detail',
        parentKey: 'courses',
      },
    ],
  },
  {
    key: 'students',
    label: 'Students',
    icon: FaUserGraduate,
    url: '/admin/students',
  },
  {
    key: 'instructors',
    label: 'Instructors',
    icon: FaUserTie,
    children: [
      {
        key: 'instructors',
        label: 'Instructors',
        url: '/admin/instructors',
        parentKey: 'instructors',
      },
      {
        key: 'instructor-detail',
        label: 'Instructor Detail',
        url: '/admin/instructor-detail',
        parentKey: 'instructors',
      },
      {
        key: 'instructor-requests',
        label: 'Instructor Requests',
        url: '/admin/instructor-requests',
        parentKey: 'instructors',
        badge: '2',
      },
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: FaRegCommentDots,
    url: '/admin/reviews',
  },
  {
    key: 'earnings',
    label: 'Earnings',
    icon: FaChartBar,
    url: '/admin/earnings',
  },
  {
    key: 'admin-settings',
    label: 'Admin Settings',
    icon: FaUserCog,
    url: '/admin/admin-settings',
  },
  {
    key: 'authentication',
    label: 'Authentication',
    icon: BsLock,
    children: [
      {
        key: 'sign-up',
        label: 'Sign Up',
        url: '/auth/sign-up',
        parentKey: 'authentication',
      },
      {
        key: 'sign-in',
        label: 'Sign In',
        url: '/auth/sign-in',
        parentKey: 'authentication',
      },
      {
        key: 'forgot-password',
        label: 'Forgot Password',
        url: '/auth/forgot-password',
        parentKey: 'authentication',
      },
      {
        key: 'error-404',
        label: 'Error 404',
        url: '/admin/not-found',
        parentKey: 'authentication',
      },
    ],
  },
]
