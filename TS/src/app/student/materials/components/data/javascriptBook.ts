// ===============================
// Define TypeScript interfaces
// ===============================

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface Page {
  id: string;
  title: string;
  content: string;
  exampleCode?: string;
  videoUrl?: string;
  quiz?: Quiz[];
  keyPoints?: string[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  pages: Page[];
  chapterQuiz?: Quiz[]; // Quiz covering entire chapter
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  chapters: Chapter[];
  interviewQuestions?: InterviewQuestion[];
  finalAssessment?: Quiz[]; // Comprehensive final quiz
}

export const javascriptBook: Book = {
  id: "javascript-mastery-2024",
  title: "JavaScript Mastery 2024",
  subtitle: "From Fundamentals to Advanced Concepts with Real Examples",
  author: "Frontend Experts Team",

  chapters: [
    // ===============================
    // CHAPTER 1 – JavaScript Basics
    // ===============================
    {
      id: "js-ch1",
      title: "JavaScript Fundamentals",
      description: "Variables, data types, and basic syntax",
      pages: [
        {
          id: "js-ch1-page1",
          title: "Introduction to JavaScript",
          content: `
JavaScript is a dynamic, interpreted programming language used to build interactive web applications.

Key Features:
- Runs in the browser and Node.js
- Dynamically typed
- Prototype-based
- Event-driven
          `,
          exampleCode: `
console.log("Hello, JavaScript!");

let name = "John";
const age = 25;
var city = "New York";

console.log(name, age, city);
          `,
          keyPoints: [
            "JavaScript runs in browser and server",
            "Use let and const instead of var",
            "JavaScript is dynamically typed"
          ],
          quiz: [
            {
              question: "Which keyword is block scoped?",
              options: ["var", "let", "const", "Both let and const"],
              correctAnswer: 3,
              explanation: "Both let and const are block-scoped."
            }
          ]
        },
        {
          id: "js-ch1-page2",
          title: "Data Types",
          content: `
Primitive Types:
- String
- Number
- Boolean
- Null
- Undefined
- Symbol
- BigInt

Reference Types:
- Object
- Array
- Function
          `,
          exampleCode: `
let str = "Hello";
let num = 42;
let isActive = true;
let arr = [1,2,3];
let obj = { name: "John" };
          `,
          quiz: [
            {
              question: "Which is NOT a primitive type?",
              options: ["String", "Boolean", "Object", "Number"],
              correctAnswer: 2,
              explanation: "Object is a reference type."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 2 – Functions & Scope
    // ===============================
    {
      id: "js-ch2",
      title: "Functions & Scope",
      description: "Understanding functions, scope, and closures",
      pages: [
        {
          id: "js-ch2-page1",
          title: "Functions in JavaScript",
          content: `
Functions are reusable blocks of code.

Types:
- Function Declaration
- Function Expression
- Arrow Functions
          `,
          exampleCode: `
function greet(name) {
  return "Hello " + name;
}

const add = (a, b) => a + b;

console.log(add(2, 3));
          `,
          quiz: [
            {
              question: "Arrow functions do NOT have?",
              options: ["this binding", "Parameters", "Return value", "Scope"],
              correctAnswer: 0,
              explanation: "Arrow functions do not have their own 'this'."
            }
          ]
        },
        {
          id: "js-ch2-page2",
          title: "Closures",
          content: `
A closure is created when a function remembers its outer variables even after the outer function has finished executing.
          `,
          exampleCode: `
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  };
}

const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
          `,
          quiz: [
            {
              question: "What is a closure?",
              options: [
                "A loop",
                "Function remembering outer scope",
                "An object",
                "A variable"
              ],
              correctAnswer: 1,
              explanation: "Closures remember outer scope variables."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 3 – Arrays & Objects
    // ===============================
    {
      id: "js-ch3",
      title: "Arrays & Objects",
      description: "Working with collections and object properties",
      pages: [
        {
          id: "js-ch3-page1",
          title: "Array Methods",
          content: `
Important array methods:
- map()
- filter()
- reduce()
- forEach()
- find()
          `,
          exampleCode: `
const numbers = [1,2,3,4];

const doubled = numbers.map(n => n * 2);
const even = numbers.filter(n => n % 2 === 0);

console.log(doubled);
console.log(even);
          `,
          quiz: [
            {
              question: "Which method transforms each element?",
              options: ["map", "filter", "reduce", "forEach"],
              correctAnswer: 0,
              explanation: "map transforms elements."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 4 – Asynchronous JavaScript
    // ===============================
    {
      id: "js-ch4",
      title: "Asynchronous JavaScript",
      description: "Callbacks, Promises, Async/Await",
      pages: [
        {
          id: "js-ch4-page1",
          title: "Promises",
          content: `
A Promise represents a value that may be available now, later, or never.

States:
- Pending
- Fulfilled
- Rejected
          `,
          exampleCode: `
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Done!"), 1000);
});

promise.then(result => console.log(result));
          `,
          quiz: [
            {
              question: "Which method handles promise success?",
              options: ["catch()", "then()", "finally()", "resolve()"],
              correctAnswer: 1,
              explanation: "then() handles fulfilled promises."
            }
          ]
        },
        {
          id: "js-ch4-page2",
          title: "Async/Await",
          content: `
Async/Await simplifies working with promises.
          `,
          exampleCode: `
async function fetchData() {
  const response = await fetch("https://api.example.com");
  const data = await response.json();
  console.log(data);
}
          `,
          quiz: [
            {
              question: "What does await do?",
              options: [
                "Stops execution permanently",
                "Waits for promise resolution",
                "Loops code",
                "Creates promise"
              ],
              correctAnswer: 1,
              explanation: "await pauses execution until promise resolves."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 5 – DOM Manipulation
    // ===============================
    {
      id: "js-ch5",
      title: "DOM Manipulation",
      description: "Interacting with HTML elements",
      pages: [
        {
          id: "js-ch5-page1",
          title: "Selecting & Modifying Elements",
          content: `
DOM allows JavaScript to manipulate HTML.

Common methods:
- document.getElementById
- querySelector
- addEventListener
          `,
          exampleCode: `
const btn = document.querySelector("button");

btn.addEventListener("click", () => {
  document.body.style.background = "lightblue";
});
          `,
          quiz: [
            {
              question: "Which method selects first matching element?",
              options: [
                "getElementById",
                "querySelector",
                "getElementsByClassName",
                "selectAll"
              ],
              correctAnswer: 1,
              explanation: "querySelector selects the first matching element."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "Explain closures in JavaScript.",
      answer: "A closure is when a function remembers variables from its outer scope even after the outer function has finished executing.",
      difficulty: "beginner"
    },
    {
      question: "What is the difference between var, let, and const?",
      answer: "var is function-scoped, let and const are block-scoped. const cannot be reassigned.",
      difficulty: "beginner"
    },
    {
      question: "Explain event loop in JavaScript.",
      answer: "The event loop handles asynchronous operations by pushing callbacks into the call stack when it is empty.",
      difficulty: "intermediate"
    }
  ],

  finalAssessment: [
    {
      question: "Which method converts JSON string to object?",
      options: [
        "JSON.stringify()",
        "JSON.parse()",
        "toObject()",
        "parseJSON()"
      ],
      correctAnswer: 1,
      explanation: "JSON.parse() converts JSON string into object."
    },
    {
      question: "Which keyword creates block-scoped variable?",
      options: ["var", "let", "const", "Both let and const"],
      correctAnswer: 3,
      explanation: "Both let and const are block-scoped."
    }
  ]
};