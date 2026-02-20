import { Book } from "./reactBook" // reuse interface

export const pythonBook: Book = {
  id: "python-programming",
  title: "Python Programming",
  subtitle: "Complete Python Guide",
  author: "Your Name",
  chapters: [
    {
      id: "py-ch1",
      title: "Introduction to Python",
      description: "Basics of Python programming",
      pages: [
        {
          id: "py-page-1",
          title: "What is Python?",
          content: "Python is a high-level programming language...",
        },
        {
          id: "py-page-2",
          title: "What is Python2?",
          content: "Python is a high-level programming language...",
        },
        {
          id: "py-page-3",
          title: "What is Python2?",
          content: "Python is a high-level programming language...",
        }
      ]
    }
  ]
}
