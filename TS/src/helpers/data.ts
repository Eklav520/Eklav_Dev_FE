import {
  blogsData,
  courseResumeData,
  eventScheduleData,
  playListData,
  pricingPlans,
  studentData,
  studentReviewData,
  testimonialData,
  userReviewData,
} from '@/assets/data/other'
import { booksData, collegesData, courseCategories, coursesData, eventsData, instructorsData } from '@/assets/data/products'
import type {
  BlogType,
  BookType,
  CategoryType,
  CollegeType,
  CourseResumeType,
  CourseType,
  EventScheduleType,
  EventType,
  InstructorType,
  PlayListType,
  PricingType,
  ReviewType,
  StudentType,
  TestimonialType,
} from '@/types/other'
import { sleep } from '@/utils/promise'

export const getAllCourses = async (): Promise<CourseType[]> => {
  await sleep()
  return coursesData
}

export const getAllEvents = async (): Promise<EventType[]> => {
  await sleep()
  return eventsData
}

export const getAllInstructors = async (): Promise<InstructorType[]> => {
  await sleep()
  return instructorsData
}
export const getInstructorById = async (id: InstructorType['id']): Promise<InstructorType | undefined> => {
  const data = instructorsData.find((instructor) => instructor.id == id)
  await sleep()
  return data
}

export const getAllColleges = async (): Promise<CollegeType[]> => {
  await sleep()
  return collegesData
}

export const getAllBooks = async (): Promise<BookType[]> => {
  await sleep()
  return booksData
}

export const getProductById = async (id: BookType['id']): Promise<BookType | undefined> => {
  const data = booksData.find((product) => product.id == id)
  await sleep()
  return data
}

export const getAllEventSchedule = async (): Promise<EventScheduleType[]> => {
  await sleep()
  return eventScheduleData
}

export const getAllStudents = async (): Promise<StudentType[]> => {
  const data = studentData.map((student) => {
    const course = coursesData.find((course) => course.id === student.courseId)
    return {
      ...student,
      course,
    }
  })
  await sleep()
  return data
}

export const getAllCategories = async (): Promise<CategoryType[]> => {
  await sleep()
  return courseCategories
}

export const getAllUserReviews = async (): Promise<ReviewType[]> => {
  await sleep()
  return userReviewData
}
export const getAllStudentsReviews = async (): Promise<ReviewType[]> => {
  await sleep()
  return studentReviewData
}
export const getAllPlaylist = async (): Promise<PlayListType[]> => {
  await sleep()
  return playListData
}

export const getAllBlogs = async (): Promise<BlogType[]> => {
  await sleep()
  return blogsData
}

export const getAllPricingPlans = async (): Promise<PricingType[]> => {
  await sleep()
  return pricingPlans
}

export const getBlogById = async (id: any): Promise<BlogType | undefined> => {
  const data = blogsData.find((blog) => blog.id == id)
  await sleep()
  return data
}

export const getAllTestimonials = async (): Promise<TestimonialType[]> => {
  const data = testimonialData.map((testimonial) => {
    const course = coursesData.find((course) => course.id === testimonial.courseId)
    return {
      ...testimonial,
      course,
    }
  })
  await sleep()
  return data
}

export const getAllCourseResume = async (): Promise<CourseResumeType[]> => {
  const data = courseResumeData.map((courseResume) => {
    const course = coursesData.find((course) => course.id === courseResume.courseId)
    return {
      ...courseResume,
      course,
    }
  })
  await sleep()
  return data
}
