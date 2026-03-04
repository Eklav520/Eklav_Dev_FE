import reactBook from "./reactBook.json"
import { pythonBook } from "./pythonBook"
import { javaBook } from "./javaBook"
import { cssBook } from "./cssBook"
import javascriptBook from "./javascriptBook.json"
import cBook from "./cBook.json"
import { htmlBook } from "./htmlBook"
import { csharpBook } from "./csharpBook"

export const booksMap: Record<string, any> = {
  react: reactBook,
  python: pythonBook,
  java: javaBook,
  css: cssBook,
  javascript: javascriptBook,
  c: cBook,
  html: htmlBook,
  csharp: csharpBook,
}