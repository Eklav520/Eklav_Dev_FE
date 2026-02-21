import { reactBook } from "./reactBook"
import { pythonBook } from "./pythonBook"
import { javaBook } from "./javaBook"
import {cssBook } from "./cssBook"
import { javascriptBook } from "./javascriptBook"
import { cBook } from "./cBook"
import { htmlBook } from "./htmlBook"

export const booksMap: Record<string, any> = {
  react: reactBook,
  python: pythonBook,
  java: javaBook,
  css: cssBook,
  javascript: javascriptBook,
  c: cBook,
  html: htmlBook,
}
