// ===============================
// Define TypeScript interfaces
// ===============================

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
}

export interface Page {
  id: string;
  title: string;
  content: string;
  exampleCode?: string;
  videoUrl?: string;
  quiz?: Quiz[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  pages: Page[];
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  chapters: Chapter[];
  interviewQuestions?: InterviewQuestion[]; // ✅ NEW
}

// ===============================
// BOOK DATA
// ===============================

export const reactBook: Book = {
  id: "react-mastery",
  title: "React Mastery",
  subtitle: "From Fundamentals to Advanced Concepts",
  author: "Your Name Here",

  chapters: [

    // ===============================
    // CHAPTER 1 – React Fundamentals
    // ===============================
    {
      id: "react-ch1",
      title: "React Fundamentals",
      description: "Core building blocks of React",
      pages: [
        {
          id: "page-1-1",
          title: "What is React & Why React?",
          content: `
React is a JavaScript library for building user interfaces.
It uses a component-based architecture and a Virtual DOM.
          `,
          exampleCode: `
function App() {
  return <h1>Hello React</h1>;
}
          `,
          quiz: [
            {
              question: "What makes React fast?",
              options: [
                "Virtual DOM",
                "Direct DOM manipulation",
                "Server-side rendering only",
                "jQuery engine"
              ],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "page-1-2",
          title: "JSX Deep Dive",
          content: `
JSX allows writing HTML inside JavaScript.
It gets transpiled into React.createElement().
          `,
          exampleCode: `
const element = <h1>Hello JSX</h1>;
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 3 – Hooks
    // ===============================
    {
      id: "react-ch3",
      title: "State Management & Hooks",
      description: "Understanding useState and useEffect",
      pages: [
        {
          id: "page-3-2",
          title: "useEffect Hook",
          content: `
useEffect handles side effects like API calls and subscriptions.
          `,
          exampleCode: `
useEffect(() => {
  console.log("Mounted");
}, []);
          `,
          quiz: [
            {
              question: "When does useEffect run with [] dependency?",
              options: [
                "On every render",
                "Only on first mount",
                "On state change",
                "Never"
              ],
              correctAnswer: 1
            },
            {
              question: "useEffect is mainly used for?",
              options: [
                "Styling",
                "Side effects",
                "Routing",
                "Redux"
              ],
              correctAnswer: 1
            }
          ]
        }
      ]
    }

  ],

  // ===============================
  // INTERVIEW QUESTIONS (END OF COURSE)
  // ===============================

  interviewQuestions: [
    {
      question: "What is Virtual DOM?",
      answer:
        "Virtual DOM is a lightweight copy of the real DOM that React uses to efficiently update UI by comparing changes before applying them to the real DOM."
    },
    {
      question: "What are Hooks in React?",
      answer:
        "Hooks allow functional components to use state and lifecycle features like useState, useEffect, useContext, etc."
    },
    {
      question: "What is the difference between useMemo and useCallback?",
      answer:
        "useMemo memoizes a computed value, while useCallback memoizes a function reference."
    },
    {
      question: "What is reconciliation in React?",
      answer:
        "Reconciliation is the process React uses to update the DOM efficiently by comparing previous and current virtual DOM trees."
    },
    {
      question: "What is prop drilling?",
      answer:
        "Prop drilling is passing props through multiple levels of components. It can be avoided using Context API."
    }
  ]
};
