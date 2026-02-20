import { reactBook } from "./reactBook"
import { pythonBook } from "./pythonBook"
import { javaBook } from "./javaBook"

export const booksMap: Record<string, any> = {
  react: reactBook,
  python: pythonBook,
  java: javaBook
}
