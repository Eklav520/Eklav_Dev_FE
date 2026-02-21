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
It follows a component-based architecture and uses Virtual DOM for fast UI updates.

Key Concepts:
- Single Page Applications (SPA)
- Declarative UI
- Reusable Components
- Virtual DOM
- Unidirectional Data Flow
          `,
          exampleCode: `
function App() {
  return <h1>Hello React</h1>;
}
          `,
          quiz: [
            {
              question: "React is mainly used for?",
              options: [
                "Building user interfaces",
                "Database management",
                "Backend APIs",
                "Operating systems"
              ],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "page-1-2",
          title: "JSX Deep Dive",
          content: `
JSX allows writing HTML-like syntax inside JavaScript.
It gets transpiled into React.createElement().

Rules:
- One parent element
- Use className instead of class
- Expressions inside {}
          `,
          exampleCode: `
const element = <h1>Hello JSX</h1>;
          `
        },
        {
          id: "page-1-3",
          title: "Components & Props",
          content: `
Components are reusable UI blocks.

Props allow passing data from parent to child.
Props are read-only.
          `,
          exampleCode: `
function Greeting({ name }) {
  return <h1>Hello {name}</h1>;
}
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 2 – State & Events
    // ===============================
    {
      id: "react-ch2",
      title: "State & Event Handling",
      description: "Managing dynamic data in React",
      pages: [
        {
          id: "page-2-1",
          title: "useState Hook",
          content: `
useState allows functional components to manage state.

- Triggers re-render on update
- Accepts initial value
- Can use functional updates
          `,
          exampleCode: `
const [count, setCount] = useState(0);

<button onClick={() => setCount(count + 1)}>
  Increment
</button>
          `,
          quiz: [
            {
              question: "What happens when state updates?",
              options: [
                "Component re-renders",
                "Page refreshes",
                "Nothing happens",
                "App crashes"
              ],
              correctAnswer: 0
            }
          ]
        },
        {
          id: "page-2-2",
          title: "Controlled Components",
          content: `
Controlled components use state to control form inputs.

- value prop
- onChange handler
          `,
          exampleCode: `
<input 
  value={name} 
  onChange={(e) => setName(e.target.value)} 
/>
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 3 – Hooks Deep Dive
    // ===============================
    {
      id: "react-ch3",
      title: "Advanced Hooks",
      description: "Understanding side effects and optimization",
      pages: [
        {
          id: "page-3-1",
          title: "useEffect Hook",
          content: `
useEffect handles side effects:
- API calls
- Subscriptions
- Timers
- Cleanup

Dependency Array:
[] → Runs once
[dep] → Runs on dependency change
          `,
          exampleCode: `
useEffect(() => {
  console.log("Component Mounted");
  return () => console.log("Cleanup");
}, []);
          `
        },
        {
          id: "page-3-2",
          title: "useMemo vs useCallback",
          content: `
useMemo → Memoizes computed value
useCallback → Memoizes function reference

Used to optimize performance.
          `,
          exampleCode: `
const memoizedValue = useMemo(() => computeValue(), [dep]);
const memoizedFn = useCallback(() => {}, [dep]);
          `
        },
        {
          id: "page-3-3",
          title: "useRef Hook",
          content: `
useRef:
- Access DOM directly
- Persist values without re-render
          `,
          exampleCode: `
const inputRef = useRef(null);
<input ref={inputRef} />
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 4 – Context API
    // ===============================
    {
      id: "react-ch4",
      title: "Context API & Global State",
      description: "Avoid prop drilling using Context",
      pages: [
        {
          id: "page-4-1",
          title: "Creating Context",
          content: `
Context API allows global state management without prop drilling.

Steps:
- Create Context
- Provide value
- Consume using useContext
          `,
          exampleCode: `
const ThemeContext = createContext();

<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 5 – Routing
    // ===============================
    {
      id: "react-ch5",
      title: "React Router",
      description: "Navigation in Single Page Applications",
      pages: [
        {
          id: "page-5-1",
          title: "Basic Routing",
          content: `
React Router enables navigation without page reload.

Important Hooks:
- useNavigate
- useParams
          `,
          exampleCode: `
<Route path="/dashboard" element={<Dashboard />} />
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 6 – API Integration
    // ===============================
    {
      id: "react-ch6",
      title: "API Integration",
      description: "Fetching and managing backend data",
      pages: [
        {
          id: "page-6-1",
          title: "Fetching Data",
          content: `
Use fetch or axios for API calls.
Handle loading and error states properly.
          `,
          exampleCode: `
useEffect(() => {
  fetch("/api/data")
    .then(res => res.json())
    .then(data => console.log(data));
}, []);
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 7 – Performance Optimization
    // ===============================
    {
      id: "react-ch7",
      title: "Performance Optimization",
      description: "Optimizing React Applications",
      pages: [
        {
          id: "page-7-1",
          title: "React.memo & Lazy Loading",
          content: `
React.memo prevents unnecessary re-renders.

Lazy loading improves performance using dynamic imports.
          `,
          exampleCode: `
const Page = React.lazy(() => import('./Page'));
          `
        }
      ]
    },

    // ===============================
    // CHAPTER 8 – TypeScript with React
    // ===============================
    {
      id: "react-ch8",
      title: "TypeScript with React",
      description: "Strong typing in React applications",
      pages: [
        {
          id: "page-8-1",
          title: "Typing Props & State",
          content: `
TypeScript improves reliability by adding static types.

- Interface for props
- Generics
- Union types
          `,
          exampleCode: `
interface Props {
  name: string;
}

const Greeting: React.FC<Props> = ({ name }) => {
  return <h1>{name}</h1>;
};
          `
        }
      ]
    }

  ],

  interviewQuestions: [
    {
      question: "What is Virtual DOM?",
      answer:
        "Virtual DOM is a lightweight copy of the real DOM that React uses to efficiently update UI by comparing changes before applying them to the real DOM."
    },
    {
      question: "What is reconciliation?",
      answer:
        "Reconciliation is the process of comparing old and new virtual DOM trees and updating only changed parts."
    },
    {
      question: "Difference between controlled and uncontrolled components?",
      answer:
        "Controlled components use React state to control form inputs. Uncontrolled components rely on DOM references."
    },
    {
      question: "What is prop drilling?",
      answer:
        "Passing props through multiple component levels. It can be avoided using Context API."
    },
    {
      question: "Explain useMemo vs useCallback.",
      answer:
        "useMemo memoizes computed values. useCallback memoizes function references."
    }
  ]
};
