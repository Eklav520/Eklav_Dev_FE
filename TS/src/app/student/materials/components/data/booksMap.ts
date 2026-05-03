import reactBook from "./reactBook.json"
import pythonBook from "./pythonBook.json"
import javaBook from "./javaBook.json"
import { cssBook } from "./cssBook"
import javascriptBook from "./javascriptBook.json"
import cBook from "./cBook.json"
import { htmlBook } from "./htmlBook"
import { csharpBook } from "./csharpBook"
import dsaBook from "./dsaBook.json"
import genAI from "./genAI.json"
import dataScience from "./dataScience.json"
import prompt from "./prompt.json"
import mysqlBook from "./mySQL.json"
import node from "./node.json"
import mangoDB from "./mangoDB.json"
import express from "./express.json"


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
  genAI: genAI,
  datascience: dataScience,
  prompt: prompt,
  mysql: mysqlBook,
  node: node,
  mongoDB: mangoDB,
  express: express
}