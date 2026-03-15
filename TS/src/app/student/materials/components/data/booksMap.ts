import reactBook from "./reactBook.json"
import pythonBook from "./pythonBook.json"
import javaBook from "./javaBook.json"
import { cssBook } from "./cssBook"
import javascriptBook from "./javascriptBook.json"
import cBook from "./cBook.json"
import { htmlBook } from "./htmlBook"
import { csharpBook } from "./csharpBook"
import dsaBook from "./dsaBook.json"


export const booksMap: Record<string, any> = {
  react: reactBook,
  python: pythonBook,
  java: javaBook,
  css: cssBook,
  javascript: javascriptBook,
  c: cBook,
  html: htmlBook,
  csharp: csharpBook,
  dsa: dsaBook,
}