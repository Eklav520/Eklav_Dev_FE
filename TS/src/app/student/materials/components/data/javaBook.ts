import { Book } from "./reactBook"

export const javaBook: Book = {
  id: "java-programming",
  title: "Java Programming",
  subtitle: "Master Java from Scratch",
  author: "Your Name",
  chapters: [
    {
      id: "java-ch1",
      title: "Introduction to Java",
      description: "Basics of Java programming",
      pages: [
        {
          id: "java-page-1",
          title: "What is Java?",
          content: "Java is an object-oriented programming language...",
        }
      ]
    }
  ]
}
