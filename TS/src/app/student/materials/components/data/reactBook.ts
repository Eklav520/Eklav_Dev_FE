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

// ===============================
// ENHANCED BOOK DATA
// ===============================

export const reactBook: Book = {
  id: "react-mastery",
  title: "React Mastery",
  subtitle: "Complete Guide from Zero to Hero with Practical Examples",
  author: "React Experts Team",

  chapters: [
    // ===============================
    // CHAPTER 1 – Introduction & Setup
    // ===============================
    {
      id: "ch1-intro",
      title: "Getting Started with React",
      description: "Setup, JSX, and Your First React App",
      pages: [
        {
          id: "ch1-page1",
          title: "What is React? Ecosystem Overview",
          content: `
React is a declarative, efficient, and flexible JavaScript library for building user interfaces.

Key Concepts:
- Component-Based Architecture
- Virtual DOM for Performance
- Unidirectional Data Flow
- JSX Syntax

React Ecosystem:
- Next.js (Full-stack Framework)
- React Router (Navigation)
- Redux/Zustand (State Management)
- React Query (Data Fetching)
- Testing Library (Testing)
          `,
          exampleCode: `
// Your first React component
function Welcome() {
  return <h1>Hello, React Developer!</h1>;
}

// Rendering to DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Welcome />);
          `,
          keyPoints: [
            "React is a library, not a framework",
            "Components are the building blocks",
            "Virtual DOM improves performance",
            "React uses one-way data binding"
          ],
          quiz: [
            {
              question: "What makes React different from vanilla JavaScript?",
              options: [
                "React uses Virtual DOM for efficient updates",
                "React doesn't support components",
                "React can't create SPAs",
                "React is slower than vanilla JS"
              ],
              correctAnswer: 0,
              explanation: "React's Virtual DOM allows efficient updates by minimizing direct DOM manipulation."
            },
            {
              question: "Which of these is NOT part of React's core features?",
              options: [
                "Virtual DOM",
                "Built-in HTTP client",
                "Component-based architecture",
                "JSX syntax"
              ],
              correctAnswer: 1,
              explanation: "React doesn't include a built-in HTTP client; you need to use fetch, axios, or similar libraries."
            }
          ]
        },
        {
          id: "ch1-page2",
          title: "JSX Deep Dive & Transpilation",
          content: `
JSX (JavaScript XML) is a syntax extension that looks like HTML but works with JavaScript.

JSX Rules:
1. Return a single parent element (use Fragment <> </>)
2. Use camelCase for attributes (className, onClick)
3. Close all tags (self-closing: <img />)
4. Embed JavaScript expressions with { }

Transpilation Process:
JSX → React.createElement() → JavaScript Object → DOM Elements
          `,
          exampleCode: `
// JSX Syntax
const element = (
  <div className="container">
    <h1>{user.name}</h1>
    <img src={user.avatar} alt="Profile" />
    <button onClick={handleClick}>Click Me</button>
  </div>
);

// What JSX compiles to
const element = React.createElement(
  'div',
  { className: 'container' },
  React.createElement('h1', null, user.name),
  React.createElement('img', { src: user.avatar, alt: 'Profile' }),
  React.createElement('button', { onClick: handleClick }, 'Click Me')
);
          `,
          keyPoints: [
            "JSX is not HTML - it's syntactic sugar",
            "Every JSX tag must be closed",
            "JavaScript expressions go in curly braces",
            "Babel transpiles JSX to React.createElement"
          ],
          quiz: [
            {
              question: "What's the correct way to add a CSS class in JSX?",
              options: [
                "class='my-class'",
                "className='my-class'",
                "class-name='my-class'",
                "cssClass='my-class'"
              ],
              correctAnswer: 1,
              explanation: "In JSX, we use 'className' instead of 'class' because 'class' is a reserved word in JavaScript."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "What is the role of Babel in React development?",
          options: [
            "To style components",
            "To transpile JSX to JavaScript",
            "To manage state",
            "To handle routing"
          ],
          correctAnswer: 1,
          explanation: "Babel transforms JSX syntax into regular JavaScript that browsers can understand."
        }
      ]
    },

    // ===============================
    // CHAPTER 2 – Components Deep Dive
    // ===============================
    {
      id: "ch2-components",
      title: "Components & Props",
      description: "Understanding different types of components and data flow",
      pages: [
        {
          id: "ch2-page1",
          title: "Functional vs Class Components",
          content: `
React has two main types of components:

Functional Components (Modern Approach):
- Simpler syntax
- Hooks for state and lifecycle
- Less boilerplate
- Better performance

Class Components (Legacy):
- More verbose
- Lifecycle methods
- 'this' keyword required
- State in constructor
          `,
          exampleCode: `
// Functional Component (Modern)
const Greeting = ({ name, age }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Age: {age}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Clicked {count} times
      </button>
    </div>
  );
};

// Class Component (Legacy)
class Greeting extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}!</h1>
        <p>Age: {this.props.age}</p>
        <button onClick={() => this.setState({ 
          count: this.state.count + 1 
        })}>
          Clicked {this.state.count} times
        </button>
      </div>
    );
  }
}
          `,
          quiz: [
            {
              question: "Which type of component is recommended for new React projects?",
              options: [
                "Class components only",
                "Functional components with hooks",
                "Mix of both equally",
                "Neither, use vanilla JS"
              ],
              correctAnswer: 1,
              explanation: "Functional components with hooks are the modern standard as they're simpler and more performant."
            }
          ]
        },
        {
          id: "ch2-page2",
          title: "Props: Data Flow & Validation",
          content: `
Props (Properties) are read-only data passed from parent to child components.

Key Prop Concepts:
- Immutable (cannot be modified by child)
- Can be any JavaScript value
- Children prop for nested content
- Prop drilling problem
- Default props
- PropTypes for validation

Prop Types:
- String: "text"
- Number: {42}
- Boolean: {true}
- Array: {[1,2,3]}
- Object: {{key: 'value'}}
- Function: {() => {}}
          `,
          exampleCode: `
// Component with props
interface UserCardProps {
  name: string;
  age: number;
  isActive: boolean;
  hobbies: string[];
  onUpdate: () => void;
  children?: React.ReactNode;
}

const UserCard: React.FC<UserCardProps> = ({ 
  name, 
  age, 
  isActive, 
  hobbies, 
  onUpdate,
  children 
}) => {
  return (
    <div className={\`card \${isActive ? 'active' : ''}\`}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <ul>
        {hobbies.map(hobby => <li key={hobby}>{hobby}</li>)}
      </ul>
      <button onClick={onUpdate}>Update</button>
      {children}
    </div>
  );
};

// Using the component
<UserCard 
  name="John" 
  age={25} 
  isActive={true}
  hobbies={['coding', 'reading']}
  onUpdate={() => console.log('Updated')}
>
  <p>Additional content</p>
</UserCard>
          `,
          quiz: [
            {
              question: "Can a child component modify its props?",
              options: [
                "Yes, props are mutable",
                "No, props are read-only",
                "Only if using useState",
                "Only in class components"
              ],
              correctAnswer: 1,
              explanation: "Props are immutable and cannot be modified by the child component. They follow the unidirectional data flow pattern."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 3 – State Management Fundamentals
    // ===============================
    {
      id: "ch3-state",
      title: "State Management",
      description: "Managing component state and lifecycle",
      pages: [
        {
          id: "ch3-page1",
          title: "useState Hook - Deep Dive",
          content: `
useState is the most fundamental hook for managing component state.

Key Concepts:
- Returns array [state, setState]
- Triggers re-render when updated
- Can use functional updates
- Lazy initialization for expensive computations
- State batching in React 18

State Patterns:
1. Simple values: useState(0)
2. Objects: useState({ count: 0 })
3. Arrays: useState([])
4. Lazy initial state: useState(() => expensiveComputation())
          `,
          exampleCode: `
import React, { useState } from 'react';

const Counter = () => {
  // Simple state
  const [count, setCount] = useState(0);

  // Object state
  const [user, setUser] = useState({ name: '', age: 0 });

  // Array state
  const [items, setItems] = useState([]);

  // Functional update (safe with previous state)
  const increment = () => {
    setCount(prevCount => prevCount + 1);
    setCount(prevCount => prevCount + 1); // Adds 2 total
  };

  // Updating object state
  const updateUser = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  // Updating array state
  const addItem = (item) => {
    setItems(prev => [...prev, item]);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      
      <input
        value={user.name}
        onChange={(e) => updateUser('name', e.target.value)}
        placeholder="Name"
      />
    </div>
  );
};
          `,
          quiz: [
            {
              question: "What happens when you call setState with the same value?",
              options: [
                "Component always re-renders",
                "React might bail out of re-rendering",
                "It throws an error",
                "The state becomes undefined"
              ],
              correctAnswer: 1,
              explanation: "React uses Object.is comparison and may skip re-rendering if the value hasn't changed."
            },
            {
              question: "Why use functional updates in setState?",
              options: [
                "It's faster",
                "To ensure you're using the latest state when updates are batched",
                "It's required by React",
                "To avoid memory leaks"
              ],
              correctAnswer: 1,
              explanation: "Functional updates use the previous state, ensuring correctness when multiple updates are batched."
            }
          ]
        },
        {
          id: "ch3-page2",
          title: "useReducer for Complex State",
          content: `
useReducer is ideal for complex state logic with multiple sub-values or when next state depends on previous state.

When to use useReducer:
- Complex state objects
- State transitions follow patterns
- Deep updates
- Performance optimization
- Predictable state changes

Reducer Pattern:
- Action: Describes what happened
- Reducer: Pure function that returns new state
- Dispatch: Sends actions to reducer
          `,
          exampleCode: `
// Define state type
type State = {
  count: number;
  step: number;
  lastAction: string;
};

// Define actions
type Action = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' };

// Reducer function
const counterReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + state.step,
        lastAction: 'INCREMENT'
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - state.step,
        lastAction: 'DECREMENT'
      };
    case 'SET_STEP':
      return {
        ...state,
        step: action.payload,
        lastAction: 'SET_STEP'
      };
    case 'RESET':
      return {
        ...state,
        count: 0,
        step: 1,
        lastAction: 'RESET'
      };
    default:
      return state;
  }
};

// Component using useReducer
const CounterWithReducer = () => {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    step: 1,
    lastAction: 'INIT'
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Last Action: {state.lastAction}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        Increment
      </button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>
        Decrement
      </button>
      <input
        type="number"
        value={state.step}
        onChange={(e) => dispatch({ 
          type: 'SET_STEP', 
          payload: Number(e.target.value) 
        })}
      />
      <button onClick={() => dispatch({ type: 'RESET' })}>
        Reset
      </button>
    </div>
  );
};
          `,
          quiz: [
            {
              question: "When should you prefer useReducer over useState?",
              options: [
                "For simple boolean values",
                "When state logic is complex with multiple sub-values",
                "Always, it's better than useState",
                "When you need to avoid re-renders"
              ],
              correctAnswer: 1,
              explanation: "useReducer is better for complex state logic with multiple sub-values or when state transitions depend on previous state."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 4 – useEffect & Side Effects
    // ===============================
    {
      id: "ch4-effects",
      title: "Side Effects & Lifecycle",
      description: "Managing side effects and component lifecycle",
      pages: [
        {
          id: "ch4-page1",
          title: "useEffect Mastery",
          content: `
useEffect handles side effects in functional components.

Side Effects Include:
- Data fetching
- Subscriptions
- Manual DOM manipulations
- Timers (setTimeout, setInterval)
- Event listeners

Dependency Array Patterns:
[] → Run once (mount)
[dep] → Run when dep changes
undefined → Run after every render
cleanup function → Run before unmount/update

Cleanup Pattern:
- Remove event listeners
- Clear timers
- Cancel subscriptions
- Abort fetch requests
          `,
          exampleCode: `
import React, { useState, useEffect } from 'react';

const DataFetcher = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create AbortController for cleanup
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          \`https://api.example.com/users/\${userId}\`,
          { signal: abortController.signal }
        );
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [userId]); // Re-run when userId changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
};

// Timer example with cleanup
const Timer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []); // Empty array = run once

  return <div>Timer: {seconds}s</div>;
};
          `,
          quiz: [
            {
              question: "What's the purpose of the cleanup function in useEffect?",
              options: [
                "To improve performance",
                "To prevent memory leaks by cleaning up subscriptions",
                "To cache data",
                "To re-run the effect"
              ],
              correctAnswer: 1,
              explanation: "Cleanup functions prevent memory leaks by cleaning up subscriptions, timers, and event listeners before the component unmounts or before re-running the effect."
            },
            {
              question: "When does useEffect run with dependency array [count]?",
              options: [
                "Only on mount",
                "On every render",
                "On mount and whenever 'count' changes",
                "Never"
              ],
              correctAnswer: 2,
              explanation: "With [count], the effect runs after the first mount and after every render where 'count' has changed."
            }
          ]
        },
        {
          id: "ch4-page2",
          title: "useLayoutEffect vs useEffect",
          content: `
useLayoutEffect runs synchronously after DOM mutations but before browser paint.

When to use useLayoutEffect:
- Measuring DOM elements
- DOM mutations that need to be visible immediately
- Animations
- Avoiding flicker

Key Difference:
useEffect → Async, after paint (most cases)
useLayoutEffect → Sync, before paint (rare cases)

⚠️ Warning: useLayoutEffect can block visual updates, use useEffect by default.
          `,
          exampleCode: `
import React, { useState, useLayoutEffect, useRef } from 'react';

const Tooltip = ({ text, targetRect }) => {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // useLayoutEffect ensures position is calculated before paint
  useLayoutEffect(() => {
    if (tooltipRef.current && targetRect) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Calculate optimal position
      let top = targetRect.bottom + window.scrollY;
      let left = targetRect.left + window.scrollX;

      // Adjust if tooltip would go off screen
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width;
      }

      setPosition({ top, left });
    }
  }, [targetRect]); // Recalculate when target changes

  if (!targetRect) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: 'black',
        color: 'white',
        padding: '8px',
        borderRadius: '4px'
      }}
    >
      {text}
    </div>
  );
};
          `,
          quiz: [
            {
              question: "When should you use useLayoutEffect instead of useEffect?",
              options: [
                "For all side effects",
                "When you need to measure DOM elements before paint",
                "Never, useEffect is always better",
                "Only for data fetching"
              ],
              correctAnswer: 1,
              explanation: "useLayoutEffect is useful when you need to measure or mutate DOM elements before the browser paints to avoid visual flicker."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 5 – Advanced Hooks
    // ===============================
    {
      id: "ch5-advanced-hooks",
      title: "Advanced Hooks & Performance",
      description: "Optimization hooks and custom hooks",
      pages: [
        {
          id: "ch5-page1",
          title: "useMemo for Expensive Computations",
          content: `
useMemo memoizes expensive calculations to avoid re-computing on every render.

When to use useMemo:
- Expensive calculations
- Maintaining referential equality
- Avoiding unnecessary child re-renders
- Complex data transformations

⚠️ Don't over-optimize! Only use when you measure a performance problem.
          `,
          exampleCode: `
import React, { useMemo, useState } from 'react';

const ExpensiveComponent = ({ numbers, filter }) => {
  const [otherState, setOtherState] = useState(0);

  // Expensive computation - only recalculates when numbers or filter change
  const filteredAndProcessedData = useMemo(() => {
    console.log('Running expensive computation...');
    
    // Simulate expensive operation
    return numbers
      .filter(n => n > filter)
      .map(n => ({
        original: n,
        squared: n * n,
        squareRoot: Math.sqrt(n),
        isPrime: checkIfPrime(n)
      }))
      .sort((a, b) => b.original - a.original);
  }, [numbers, filter]); // Only recompute when these dependencies change

  // Maintaining referential equality
  const config = useMemo(() => ({
    theme: 'dark',
    fontSize: 14,
    colors: ['red', 'blue', 'green']
  }), []); // Same object reference on every render

  return (
    <div>
      <button onClick={() => setOtherState(s => s + 1)}>
        Re-render (State: {otherState})
      </button>
      
      <ul>
        {filteredAndProcessedData.map(item => (
          <li key={item.original}>
            {item.original}² = {item.squared}, √ = {item.squareRoot}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function
const checkIfPrime = (num) => {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
};
          `,
          quiz: [
            {
              question: "What's the main purpose of useMemo?",
              options: [
                "To memoize functions",
                "To memoize expensive calculations",
                "To create refs",
                "To handle side effects"
              ],
              correctAnswer: 1,
              explanation: "useMemo memoizes the result of expensive calculations, only recomputing when dependencies change."
            }
          ]
        },
        {
          id: "ch5-page2",
          title: "useCallback for Function Memoization",
          content: `
useCallback memoizes function references to prevent unnecessary re-renders of child components.

When to use useCallback:
- Passing callbacks to optimized child components
- Functions in useEffect dependencies
- Custom hooks that return functions
- Event handlers that don't need to change

Difference from useMemo:
- useCallback: returns memoized function
- useMemo: returns memoized value
          `,
          exampleCode: `
import React, { useState, useCallback, memo } from 'react';

// Memoized child component
const ExpensiveButton = memo(({ onClick, label }) => {
  console.log(\`Rendering button: \${label}\`);
  return <button onClick={onClick}>{label}</button>;
});

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  const [otherValue, setOtherValue] = useState('');

  // Without useCallback - new function every render
  const handleClickBad = () => {
    console.log('Button clicked');
  };

  // With useCallback - same function reference
  const handleClickGood = useCallback(() => {
    console.log('Button clicked');
    setCount(c => c + 1);
  }, []); // Empty array = function never changes

  // With dependencies - function updates when count changes
  const handleIncrementBy = useCallback((amount) => {
    setCount(c => c + amount);
  }, []); // No dependency on count needed due to functional update

  // Custom hook example with useCallback
  const useCounter = (initialValue = 0) => {
    const [value, setValue] = useState(initialValue);
    
    const increment = useCallback(() => setValue(v => v + 1), []);
    const decrement = useCallback(() => setValue(v => v - 1), []);
    const reset = useCallback(() => setValue(initialValue), [initialValue]);
    
    return { value, increment, decrement, reset };
  };

  const counter = useCounter(10);

  return (
    <div>
      <p>Count: {count}</p>
      
      {/* These buttons won't re-render unnecessarily */}
      <ExpensiveButton onClick={handleClickGood} label="Good Button" />
      <ExpensiveButton onClick={() => counter.increment()} label="Counter" />
      
      <input
        value={otherValue}
        onChange={(e) => setOtherValue(e.target.value)}
      />
    </div>
  );
};
          `,
          quiz: [
            {
              question: "When is useCallback most beneficial?",
              options: [
                "For all functions",
                "When passing callbacks to memoized child components",
                "Never, it's useless",
                "Only for async functions"
              ],
              correctAnswer: 1,
              explanation: "useCallback is most beneficial when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary re-renders."
            }
          ]
        },
        {
          id: "ch5-page3",
          title: "Custom Hooks - Reusable Logic",
          content: `
Custom Hooks allow you to extract component logic into reusable functions.

Rules for Custom Hooks:
- Start with 'use' prefix
- Can call other hooks
- Share logic, not state
- Each instance has isolated state

Common Use Cases:
- Form handling
- Data fetching
- Local storage sync
- Window events
- Animation logic
          `,
          exampleCode: `
import { useState, useEffect, useCallback, useRef } from 'react';

// Hook 1: useLocalStorage - Sync state with localStorage
function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Hook 2: useWindowSize - Track window dimensions
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Hook 3: useFetch - Data fetching with loading/error states
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [url]);

  return { data, loading, error };
}

// Hook 4: useForm - Form handling
function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validate) {
      const validationErrors = validate({ ...values, [name]: value });
      setErrors(validationErrors);
    }
  }, [values, validate]);

  const handleSubmit = useCallback((callback) => async (e) => {
    e.preventDefault();
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    setIsSubmitting(true);
    await callback(values);
    setIsSubmitting(false);
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  };
}

// Component using multiple custom hooks
const UserProfile = () => {
  const [userId, setUserId] = useLocalStorage('userId', 1);
  const windowSize = useWindowSize();
  const { data, loading, error } = useFetch(
    \`https://jsonplaceholder.typicode.com/users/\${userId}\`
  );

  const form = useForm(
    { name: '', email: '' },
    (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name required';
      if (!values.email) errors.email = 'Email required';
      if (values.email && !values.email.includes('@')) {
        errors.email = 'Invalid email';
      }
      return errors;
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Window Size: {windowSize.width}x{windowSize.height}</p>
      
      <form onSubmit={form.handleSubmit((values) => {
        console.log('Submitted:', values);
      })}>
        <input
          name="name"
          value={form.values.name}
          onChange={form.handleChange}
          placeholder="Name"
        />
        {form.errors.name && <span>{form.errors.name}</span>}
        
        <button type="submit" disabled={form.isSubmitting}>
          Submit
        </button>
      </form>
    </div>
  );
};
          `,
          quiz: [
            {
              question: "What's the naming convention for custom hooks?",
              options: [
                "Must start with 'use'",
                "Can be any name",
                "Must end with 'Hook'",
                "Must be camelCase"
              ],
              correctAnswer: 0,
              explanation: "Custom hooks must start with 'use' to follow React conventions and enable the linter to check hook rules."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 6 – Context API & State Management
    // ===============================
    {
      id: "ch6-context",
      title: "Context API & Global State",
      description: "Managing global state without prop drilling",
      pages: [
        {
          id: "ch6-page1",
          title: "Context API Fundamentals",
          content: `
Context provides a way to pass data through the component tree without prop drilling.

When to use Context:
- Theme (dark/light mode)
- User authentication
- Language/locale preferences
- Global UI state (notifications, modals)

Context Flow:
1. Create Context
2. Provide value at top level
3. Consume value anywhere

⚠️ Don't use for everything - it can make component reuse difficult.
          `,
          exampleCode: `
import React, { createContext, useContext, useState } from 'react';

// 1. Create Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. Create Provider Component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Custom hook for consuming context
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 4. Use in components
const ThemedButton = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff',
        padding: '10px 20px',
        border: '1px solid #ccc',
        cursor: 'pointer'
      }}
    >
      Current Theme: {theme}
    </button>
  );
};

const Header = () => {
  return (
    <header>
      <h1>My App</h1>
      <ThemedButton />
    </header>
  );
};

// 5. Wrap app with Provider
const App = () => {
  return (
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
};
          `,
          quiz: [
            {
              question: "What problem does Context API primarily solve?",
              options: [
                "Performance optimization",
                "Prop drilling",
                "Code splitting",
                "Server-side rendering"
              ],
              correctAnswer: 1,
              explanation: "Context API solves prop drilling by allowing data to be passed directly to components without going through every level of the tree."
            }
          ]
        },
        {
          id: "ch6-page2",
          title: "Advanced Context Patterns",
          content: `
Advanced patterns for using Context effectively:

1. Multiple Contexts - Separate concerns
2. Context with useReducer - Redux-like pattern
3. Context composition - Avoid unnecessary re-renders
4. Context selector pattern - Optimize performance

Performance Considerations:
- Context value changes trigger all consumers
- Split contexts by responsibility
- Use memoization for complex values
          `,
          exampleCode: `
import React, { createContext, useContext, useReducer, useMemo, memo } from 'react';

// ===============================
// 1. Multiple Contexts Pattern
// ===============================
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

// ===============================
// 2. Context with useReducer (Redux-like)
// ===============================
interface State {
  user: any | null;
  isLoading: boolean;
  error: string | null;
}

type Action = 
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const initialState: State = {
  user: null,
  isLoading: false,
  error: null
};

const authReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
};

// Create context with reducer
const AuthContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Provider with reducer
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const value = useMemo(() => ({ state, dispatch }), [state]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with actions
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  
  const { state, dispatch } = context;
  
  const actions = useMemo(() => ({
    login: async (credentials: any) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // API call
        const user = await loginAPI(credentials);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },
    logout: () => {
      dispatch({ type: 'LOGOUT' });
    },
    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  }), [dispatch]);
  
  return { ...state, ...actions };
};

// ===============================
// 3. Context Selector Pattern (Optimized)
// ===============================
const createSelectorContext = <T,>() => {
  const Context = createContext<T | undefined>(undefined);
  
  const useSelector = <R,>(selector: (state: T) => R): R => {
    const context = useContext(Context);
    if (!context) throw new Error('Context not found');
    
    // Use useMemo to only update when selected value changes
    return useMemo(() => selector(context), [context, selector]);
  };
  
  return [Context, useSelector] as const;
};

// Usage
const [CountContext, useCountSelector] = createSelectorContext<{
  count: number;
  increment: () => void;
}>();

// Component only re-renders when count changes
const CountDisplay = memo(() => {
  const count = useCountSelector(state => state.count);
  console.log('CountDisplay rendered');
  return <div>Count: {count}</div>;
});

// ===============================
// 4. Compound Context Pattern
// ===============================
interface ToggleContextType {
  on: boolean;
  toggle: () => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

const Toggle: React.FC<{ children: React.ReactNode }> & {
  On: React.FC<{ children: React.ReactNode }>;
  Off: React.FC<{ children: React.ReactNode }>;
  Button: React.FC;
} = ({ children }) => {
  const [on, setOn] = useState(false);
  
  const toggle = useCallback(() => setOn(prev => !prev), []);
  
  const value = useMemo(() => ({ on, toggle }), [on, toggle]);
  
  return (
    <ToggleContext.Provider value={value}>
      {children}
    </ToggleContext.Provider>
  );
};

const ToggleOn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(ToggleContext);
  if (!context) throw new Error('ToggleOn must be used within Toggle');
  
  return context.on ? <>{children}</> : null;
};

const ToggleOff: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(ToggleContext);
  if (!context) throw new Error('ToggleOff must be used within Toggle');
  
  return !context.on ? <>{children}</> : null;
};

const ToggleButton: React.FC = () => {
  const context = useContext(ToggleContext);
  if (!context) throw new Error('ToggleButton must be used within Toggle');
  
  return (
    <button onClick={context.toggle}>
      Toggle: {context.on ? 'ON' : 'OFF'}
    </button>
  );
};

// Assign compound components
Toggle.On = ToggleOn;
Toggle.Off = ToggleOff;
Toggle.Button = ToggleButton;

// Usage of compound context
const CompoundExample = () => {
  return (
    <Toggle>
      <Toggle.On>
        <div>Content is visible</div>
      </Toggle.On>
      <Toggle.Off>
        <div>Content is hidden</div>
      </Toggle.Off>
      <Toggle.Button />
    </Toggle>
  );
};

export { AuthProvider, useAuth, Toggle };
          `,
          quiz: [
            {
              question: "Why should you split contexts by responsibility?",
              options: [
                "It's not necessary",
                "To prevent unnecessary re-renders of unrelated components",
                "To make code look better",
                "To use more files"
              ],
              correctAnswer: 1,
              explanation: "Splitting contexts prevents components from re-rendering when unrelated data changes, improving performance."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 7 – Forms & Validation
    // ===============================
    {
      id: "ch7-forms",
      title: "Forms & Validation",
      description: "Building robust forms with validation",
      pages: [
        {
          id: "ch7-page1",
          title: "Controlled vs Uncontrolled Components",
          content: `
Forms in React can be handled in two ways: controlled and uncontrolled.

Controlled Components:
- React state controls the input
- Real-time validation
- Instant access to values
- More code but more control

Uncontrolled Components:
- DOM controls the input
- Use refs to get values
- Simpler for simple forms
- Better for integration with non-React code

When to use each:
- Controlled: Most cases, complex forms, validation
- Uncontrolled: Simple forms, file inputs, third-party integration
          `,
          exampleCode: `
import React, { useState, useRef } from 'react';

// ===============================
// Controlled Form Example
// ===============================
const ControlledForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    newsletter: false,
    country: 'usa'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\\S+@\\S+\\.\\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      // Submit to API
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
        />
        {errors.username && <span style={{color: 'red'}}>{errors.username}</span>}
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span style={{color: 'red'}}>{errors.email}</span>}
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span style={{color: 'red'}}>{errors.password}</span>}
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            name="newsletter"
            checked={formData.newsletter}
            onChange={handleChange}
          />
          Subscribe to newsletter
        </label>
      </div>
      
      <div>
        <label>Country:</label>
        <select name="country" value={formData.country} onChange={handleChange}>
          <option value="usa">USA</option>
          <option value="uk">UK</option>
          <option value="canada">Canada</option>
        </select>
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
};

// ===============================
// Uncontrolled Form Example
// ===============================
const UncontrolledForm = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Access values from refs
    const username = inputRef.current?.value;
    const file = fileRef.current?.files?.[0];
    
    console.log('Username:', username);
    console.log('File:', file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          ref={inputRef}
          defaultValue="" // Use defaultValue for uncontrolled
        />
      </div>
      
      <div>
        <label>File:</label>
        <input
          type="file"
          ref={fileRef}
        />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
};

// ===============================
// Form with React Hook Form (Recommended)
// ===============================
import { useForm } from 'react-hook-form';

interface FormData {
  username: string;
  email: string;
  age: number;
}

const ReactHookFormExample = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    watch
  } = useForm<FormData>({
    defaultValues: {
      username: '',
      email: ''
    }
  });

  // Watch specific field
  const watchUsername = watch('username');

  const onSubmit = async (data: FormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username:</label>
        <input
          {...register('username', {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Must be at least 3 characters'
            },
            maxLength: {
              value: 20,
              message: 'Cannot exceed 20 characters'
            }
          })}
        />
        {errors.username && (
          <span style={{color: 'red'}}>{errors.username.message}</span>
        )}
        <small>Typing: {watchUsername}</small>
      </div>
      
      <div>
        <label>Email:</label>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /\\S+@\\S+\\.\\S+/,
              message: 'Invalid email format'
            }
          })}
        />
        {errors.email && (
          <span style={{color: 'red'}}>{errors.email.message}</span>
        )}
      </div>
      
      <div>
        <label>Age:</label>
        <input
          type="number"
          {...register('age', {
            required: 'Age is required',
            min: {
              value: 18,
              message: 'Must be at least 18'
            },
            max: {
              value: 100,
              message: 'Must be at most 100'
            }
          })}
        />
        {errors.age && (
          <span style={{color: 'red'}}>{errors.age.message}</span>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
          `,
          quiz: [
            {
              question: "What's the difference between controlled and uncontrolled components?",
              options: [
                "Controlled uses refs, uncontrolled uses state",
                "Controlled uses state, uncontrolled uses refs",
                "They are the same",
                "Controlled is for class components only"
              ],
              correctAnswer: 1,
              explanation: "Controlled components use React state to control form inputs, while uncontrolled components use refs to access DOM values directly."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 8 – React Router & Navigation
    // ===============================
    {
      id: "ch8-routing",
      title: "React Router v6",
      description: "Navigation and routing in React applications",
      pages: [
        {
          id: "ch8-page1",
          title: "React Router Basics",
          content: `
React Router enables navigation between views in a React application without page reload.

Core Components:
- BrowserRouter: Router implementation for browsers
- Routes: Container for route definitions
- Route: Defines a route with path and element
- Link: Navigation link (no page reload)
- NavLink: Link with active state

Key Hooks:
- useNavigate: Programmatic navigation
- useParams: Access URL parameters
- useLocation: Access current URL
- useSearchParams: Handle query parameters
          `,
          exampleCode: `
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
  Outlet
} from 'react-router-dom';

// ===============================
// Basic Setup
// ===============================
const App = () => {
  return (
    <BrowserRouter>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <NavLink 
              to="/about"
              style={({ isActive }) => ({
                color: isActive ? 'red' : 'blue'
              })}
            >
              About
            </NavLink>
          </li>
          <li>
            <Link to="/users">Users</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />}>
          <Route path=":userId" element={<UserDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

// ===============================
// Page Components
// ===============================
const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={() => navigate('/about')}>
        Go to About
      </button>
    </div>
  );
};

const About = () => {
  const location = useLocation();
  
  return (
    <div>
      <h1>About Page</h1>
      <p>Current Path: {location.pathname}</p>
    </div>
  );
};

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || '';
  
  return (
    <div>
      <h1>Users Page</h1>
      
      <input
        value={filter}
        onChange={(e) => setSearchParams({ filter: e.target.value })}
        placeholder="Filter users"
      />
      
      {/* Nested routes render here */}
      <Outlet />
    </div>
  );
};

const UserDetail = () => {
  const { userId } = useParams();
  const location = useLocation();
  
  return (
    <div>
      <h2>User Details: {userId}</h2>
      <p>From: {location.state?.from}</p>
    </div>
  );
};

const NotFound = () => {
  return <h1>404 - Page Not Found</h1>;
};

// ===============================
// Protected Routes
// ===============================
const ProtectedRoute = ({ children }) => {
  const auth = useAuth(); // Custom auth hook
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!auth.user) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [auth.user, navigate]);
  
  return auth.user ? children : null;
};

// Usage
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>

// ===============================
// Lazy Loading Routes
// ===============================
const Dashboard = React.lazy(() => import('./Dashboard'));

<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
          `,
          quiz: [
            {
              question: "What's the difference between Link and NavLink?",
              options: [
                "They're the same",
                "NavLink provides active state styling",
                "Link is for external links",
                "NavLink causes page reload"
              ],
              correctAnswer: 1,
              explanation: "NavLink is a special version of Link that adds styling attributes when it matches the current URL, useful for navigation menus."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 9 – API Integration & Data Fetching
    // ===============================
    {
      id: "ch9-data-fetching",
      title: "Data Fetching & API Integration",
      description: "Fetching data from APIs and managing server state",
      pages: [
        {
          id: "ch9-page1",
          title: "Data Fetching Patterns",
          content: `
Modern data fetching in React requires handling loading states, errors, caching, and race conditions.

Key Concepts:
- Loading states
- Error handling
- Race conditions
- Request cancellation
- Caching strategies
- Optimistic updates

Fetching Approaches:
1. useEffect + fetch (basic)
2. React Query / TanStack Query (recommended)
3. SWR (Stale-While-Revalidate)
4. RTK Query (Redux Toolkit)
          `,
          exampleCode: `
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ===============================
// 1. Basic useEffect Approach
// ===============================
const BasicDataFetching = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.example.com/posts',
          { signal: abortController.signal }
        );
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Render data */}</div>;
};

// ===============================
// 2. Custom Hook for Data Fetching
// ===============================
const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [url]);

  return { data, loading, error };
};

// ===============================
// 3. React Query (TanStack Query) - Recommended
// ===============================
// Setup QueryClient
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// API service
const api = {
  getPosts: () => axios.get('/api/posts'),
  getPost: (id) => axios.get(\`/api/posts/\${id}\`),
  createPost: (data) => axios.post('/api/posts', data),
  updatePost: (id, data) => axios.put(\`/api/posts/\${id}\`, data),
  deletePost: (id) => axios.delete(\`/api/posts/\${id}\`),
};

// Component using React Query
const PostsList = () => {
  const queryClient = useQueryClient();
  
  // Query for fetching posts
  const { 
    data: posts, 
    isLoading, 
    error,
    isFetching 
  } = useQuery({
    queryKey: ['posts'],
    queryFn: api.getPosts,
    select: (response) => response.data,
  });

  // Mutation for creating a post
  const createMutation = useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: api.deletePost,
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['posts']);

      // Optimistically update
      queryClient.setQueryData(['posts'], (old) => {
        return old?.filter(post => post.id !== deletedId);
      });

      return { previousPosts };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      queryClient.setQueryData(['posts'], context.previousPosts);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button 
        onClick={() => createMutation.mutate({ title: 'New Post' })}
        disabled={createMutation.isLoading}
      >
        {createMutation.isLoading ? 'Creating...' : 'Create Post'}
      </button>
      
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <button 
            onClick={() => deleteMutation.mutate(post.id)}
            disabled={deleteMutation.isLoading}
          >
            Delete
          </button>
        </div>
      ))}
      
      {isFetching && <div>Updating...</div>}
    </div>
  );
};

// ===============================
// 4. Infinite Scroll / Pagination
// ===============================
const InfinitePosts = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['infinitePosts'],
    queryFn: ({ pageParam = 1 }) => 
      axios.get('/api/posts', { params: { page: pageParam, limit: 10 } }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;
      return lastPage.data.hasMore ? nextPage : undefined;
    },
  });

  const loadMoreRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'error') return <div>Error</div>;

  return (
    <div>
      {data.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.posts.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </React.Fragment>
      ))}
      
      <div ref={loadMoreRef}>
        {isFetchingNextPage && <div>Loading more...</div>}
      </div>
    </div>
  );
};

// ===============================
// 5. Parallel Queries
// ===============================
const Dashboard = () => {
  // Sequential queries
  const user = useQuery({
    queryKey: ['user'],
    queryFn: api.getUser,
  });

  const posts = useQuery({
    queryKey: ['posts'],
    queryFn: api.getPosts,
    enabled: !!user.data, // Wait for user data
  });

  // Parallel queries
  const users = useQueries({
    queries: [1, 2, 3].map(id => ({
      queryKey: ['user', id],
      queryFn: () => api.getUser(id),
    })),
  });

  return <div>{/* Render */}</div>;
};

// ===============================
// 6. Dependent Queries
// ===============================
const UserPosts = ({ userId }) => {
  // First, get user details
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
  });

  // Then, get user's posts (depends on user data)
  const { data: posts } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => api.getUserPosts(userId),
    enabled: !!user, // Only run after user data is available
  });

  return <div>{/* Render */}</div>;
};
          `,
          quiz: [
            {
              question: "Why should you cancel fetch requests in useEffect cleanup?",
              options: [
                "To improve performance",
                "To prevent memory leaks and race conditions",
                "It's not necessary",
                "To make code look cleaner"
              ],
              correctAnswer: 1,
              explanation: "Canceling fetch requests prevents memory leaks and race conditions where a response might set state on an unmounted component."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 10 – Performance Optimization
    // ===============================
    {
      id: "ch10-performance",
      title: "Performance Optimization",
      description: "Techniques to optimize React applications",
      pages: [
        {
          id: "ch10-page1",
          title: "Code Splitting & Lazy Loading",
          content: `
Code splitting helps reduce initial bundle size by loading code only when needed.

Techniques:
1. Route-based splitting
2. Component-based splitting
3. Library splitting

Benefits:
- Faster initial load
- Better user experience
- Reduced bandwidth usage
- Improved performance scores
          `,
          exampleCode: `
import React, { Suspense, lazy, useState, useTransition, memo, useMemo, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// ===============================
// 1. Code Splitting with React.lazy
// ===============================
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

const App = () => {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div>
        <button onClick={() => setShowHeavy(true)}>
          Load Heavy Component
        </button>
        
        {showHeavy && (
          <Suspense fallback={<div>Loading heavy component...</div>}>
            <HeavyComponent />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

// ===============================
// 2. React.memo for Component Memoization
// ===============================
interface TodoItemProps {
  todo: { id: number; text: string; completed: boolean };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

// Memoized component - only re-renders if props change
const TodoItem = memo(({ todo, onToggle, onDelete }: TodoItemProps) => {
  console.log(\`Rendering TodoItem: \${todo.id}\`);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      borderBottom: '1px solid #eee'
    }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{
        textDecoration: todo.completed ? 'line-through' : 'none',
        flex: 1
      }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.todo.completed === nextProps.todo.completed &&
         prevProps.todo.text === nextProps.todo.text;
});

// Parent component
const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build a project', completed: false },
  ]);
  const [filter, setFilter] = useState('all');

  // Memoized callbacks to maintain referential equality
  const handleToggle = useCallback((id: number) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  const handleDelete = useCallback((id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  // Memoized filtered todos
  const filteredTodos = useMemo(() => {
    console.log('Filtering todos...');
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      
      {filteredTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

// ===============================
// 3. useTransition for Non-Urgent Updates
// ===============================
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Mark this update as non-urgent
    startTransition(() => {
      // Expensive search operation
      const filteredResults = performExpensiveSearch(value);
      setResults(filteredResults);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      
      {isPending && <div>Loading results...</div>}
      
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
};

// ===============================
// 4. Virtualization for Long Lists
// ===============================
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = () => {
  // Generate lots of data
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    text: \`Item \${i}\`
  }));

  // Row renderer
  const Row = ({ index, style }) => (
    <div style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderBottom: '1px solid #eee'
    }}>
      <input type="checkbox" />
      <span style={{ marginLeft: '10px' }}>{items[index].text}</span>
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};

// ===============================
// 5. useDeferredValue for Slow Rendering
// ===============================
const DeferredValueExample = () => {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);

  // This list is expensive to render
  const list = useMemo(() => {
    const items = [];
    for (let i = 0; i < 5000; i++) {
      items.push(
        <div key={i} style={{ padding: '2px' }}>
          {deferredText} - Item {i}
        </div>
      );
    }
    return items;
  }, [deferredText]);

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here..."
      />
      <div style={{ opacity: text !== deferredText ? 0.5 : 1 }}>
        {list}
      </div>
    </div>
  );
};

// ===============================
// 6. Bundle Optimization
// ===============================
// Dynamic imports for libraries
const importMoment = () => import('moment');

// Webpack magic comments
const AdminPanel = lazy(() => import(
  /* webpackChunkName: "admin" */
  /* webpackPrefetch: true */
  './AdminPanel'
));

// Using React.lazy with named exports
const { Component } = await import('./Component');

// Tree shaking - import only what you need
import { debounce } from 'lodash-es'; // Better than import * from 'lodash'
          `,
          quiz: [
            {
              question: "When should you use React.memo?",
              options: [
                "On every component",
                "On components that render often with the same props",
                "Never, it's deprecated",
                "Only on class components"
              ],
              correctAnswer: 1,
              explanation: "React.memo is useful for components that frequently render with the same props to prevent unnecessary re-renders."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 11 – Testing React Applications
    // ===============================
    {
      id: "ch11-testing",
      title: "Testing React Applications",
      description: "Unit testing, integration testing, and E2E testing",
      pages: [
        {
          id: "ch11-page1",
          title: "Testing with Jest & React Testing Library",
          content: `
Testing ensures your application works as expected and prevents regressions.

Testing Types:
- Unit Tests: Test individual components
- Integration Tests: Test component interactions
- E2E Tests: Test full user flows

Tools:
- Jest: Test runner and assertion library
- React Testing Library: Render and interact with components
- Cypress/Playwright: E2E testing
- MSW: Mock Service Worker for API mocking
          `,
          exampleCode: `
// ===============================
// Component to Test
// ===============================
// Counter.tsx
import React, { useState } from 'react';

interface CounterProps {
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

export const Counter: React.FC<CounterProps> = ({ 
  initialCount = 0,
  onCountChange 
}) => {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  const decrement = () => {
    const newCount = count - 1;
    setCount(newCount);
    onCountChange?.(newCount);
  };

  const reset = () => {
    setCount(initialCount);
    onCountChange?.(initialCount);
  };

  return (
    <div>
      <h2 data-testid="count-value">Count: {count}</h2>
      <button onClick={increment} aria-label="increment">
        +
      </button>
      <button onClick={decrement} aria-label="decrement">
        -
      </button>
      <button onClick={reset} aria-label="reset">
        Reset
      </button>
    </div>
  );
};

// ===============================
// Unit Tests
// ===============================
// Counter.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter Component', () => {
  test('renders with initial count 0', () => {
    render(<Counter />);
    
    const countElement = screen.getByTestId('count-value');
    expect(countElement).toHaveTextContent('Count: 0');
  });

  test('increments count when + button is clicked', () => {
    render(<Counter />);
    
    const incrementButton = screen.getByLabelText('increment');
    fireEvent.click(incrementButton);
    
    const countElement = screen.getByTestId('count-value');
    expect(countElement).toHaveTextContent('Count: 1');
  });

  test('decrements count when - button is clicked', () => {
    render(<Counter initialCount={5} />);
    
    const decrementButton = screen.getByLabelText('decrement');
    fireEvent.click(decrementButton);
    
    const countElement = screen.getByTestId('count-value');
    expect(countElement).toHaveTextContent('Count: 4');
  });

  test('resets count when reset button is clicked', () => {
    render(<Counter initialCount={10} />);
    
    // First increment
    const incrementButton = screen.getByLabelText('increment');
    fireEvent.click(incrementButton);
    expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 11');
    
    // Then reset
    const resetButton = screen.getByLabelText('reset');
    fireEvent.click(resetButton);
    expect(screen.getByTestId('count-value')).toHaveTextContent('Count: 10');
  });

  test('calls onCountChange when count changes', () => {
    const handleCountChange = jest.fn();
    render(<Counter onCountChange={handleCountChange} />);
    
    const incrementButton = screen.getByLabelText('increment');
    fireEvent.click(incrementButton);
    
    expect(handleCountChange).toHaveBeenCalledWith(1);
  });
});

// ===============================
// Testing with User Events (More realistic)
// ===============================
describe('Counter with userEvent', () => {
  test('increments and decrements with user interactions', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    const incrementButton = screen.getByLabelText('increment');
    const decrementButton = screen.getByLabelText('decrement');
    const countValue = screen.getByTestId('count-value');
    
    await user.click(incrementButton);
    expect(countValue).toHaveTextContent('Count: 1');
    
    await user.click(incrementButton);
    expect(countValue).toHaveTextContent('Count: 2');
    
    await user.click(decrementButton);
    expect(countValue).toHaveTextContent('Count: 1');
    
    await user.dblClick(incrementButton);
    expect(countValue).toHaveTextContent('Count: 3');
  });
});

// ===============================
// Testing Forms
// ===============================
// LoginForm.tsx
export const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

// LoginForm.test.tsx
describe('LoginForm', () => {
  test('submits form with correct data', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});

// ===============================
// Testing Async Operations
// ===============================
// UserProfile.tsx
export const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

// UserProfile.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users/1', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserProfile', () => {
  test('displays user data after loading', async () => {
    render(<UserProfile userId={1} />);
    
    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for user data to appear
    await screen.findByText('John Doe');
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    // Override handler for this test
    server.use(
      rest.get('/api/users/1', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId={1} />);
    
    await screen.findByText(/Error:/);
  });
});

// ===============================
// Testing Custom Hooks
// ===============================
// useLocalStorage.ts
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

// useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('returns initial value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  test('updates value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('key'))).toBe('updated');
  });

  test('uses function updater', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
  });
});

// ===============================
// Integration Testing
// ===============================
// TodoApp.test.tsx
describe('TodoApp Integration', () => {
  test('complete todo flow', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    
    // Add a todo
    await user.type(screen.getByPlaceholderText('Add todo...'), 'Learn testing');
    await user.click(screen.getByRole('button', { name: /add/i }));
    
    // Verify todo appears
    expect(screen.getByText('Learn testing')).toBeInTheDocument();
    
    // Toggle todo completion
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Learn testing')).toHaveStyle({
      textDecoration: 'line-through'
    });
    
    // Delete todo
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.queryByText('Learn testing')).not.toBeInTheDocument();
  });
});

// ===============================
// E2E Testing with Cypress
// ===============================
/*
// cypress/e2e/todo.cy.js
describe('Todo App', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should add a new todo', () => {
    cy.get('[data-testid="todo-input"]')
      .type('Learn Cypress');
    
    cy.get('[data-testid="add-button"]')
      .click();
    
    cy.contains('Learn Cypress').should('be.visible');
  });

  it('should mark todo as complete', () => {
    cy.contains('Learn Cypress')
      .parent()
      .find('input[type="checkbox"]')
      .check();
    
    cy.contains('Learn Cypress')
      .should('have.css', 'text-decoration')
      .and('include', 'line-through');
  });
});
*/
          `,
          quiz: [
            {
              question: "Why prefer React Testing Library over shallow rendering?",
              options: [
                "It's faster",
                "It tests components more like users interact with them",
                "It requires less setup",
                "It's the only option"
              ],
              correctAnswer: 1,
              explanation: "React Testing Library encourages testing components in a way that resembles how users actually interact with them, leading to more reliable tests."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 12 – Advanced Patterns
    // ===============================
    {
      id: "ch12-advanced",
      title: "Advanced React Patterns",
      description: "Design patterns for scalable React applications",
      pages: [
        {
          id: "ch12-page1",
          title: "Render Props & Compound Components",
          content: `
Advanced patterns for creating flexible and reusable components.

Key Patterns:
1. Render Props: Share code between components using a prop whose value is a function
2. Compound Components: Components that work together to form a cohesive unit
3. HOC (Higher-Order Components): Functions that take a component and return an enhanced component
4. Controlled Props: Give parent control over child state
5. State Reducer: Allow parent to override internal state updates
          `,
          exampleCode: `
import React, { useState, useCallback, cloneElement, Children } from 'react';

// ===============================
// 1. Render Props Pattern
// ===============================
interface DataProviderProps {
  url: string;
  children: (data: {
    data: any;
    loading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ url, children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return <>{children({ data, loading, error })}</>;
};

// Usage
const UserList = () => (
  <DataProvider url="/api/users">
    {({ data, loading, error }) => {
      if (loading) return <div>Loading...</div>;
      if (error) return <div>Error: {error}</div>;
      return (
        <ul>
          {data.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>
      );
    }}
  </DataProvider>
);

// Mouse tracker example
interface MouseTrackerProps {
  render: (position: { x: number; y: number }) => React.ReactNode;
}

const MouseTracker: React.FC<MouseTrackerProps> = ({ render }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onMouseMove={handleMouseMove} style={{ height: '100vh' }}>
      {render(position)}
    </div>
  );
};

// Usage
const App = () => (
  <MouseTracker
    render={({ x, y }) => (
      <h1>Mouse position: {x}, {y}</h1>
    )}
  />
);

// ===============================
// 2. Compound Components Pattern
// ===============================
// Example: Select component
interface SelectContextType {
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select compound components must be used within Select');
  }
  return context;
};

// Main Select component
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> & {
  Option: React.FC<OptionProps>;
  Trigger: React.FC<TriggerProps>;
  Options: React.FC<OptionsProps>;
} = ({ value, onChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  }, [onChange]);

  const contextValue = {
    selectedValue: value,
    onSelect: handleSelect,
    isOpen,
    setIsOpen
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="select-container">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Trigger component
interface TriggerProps {
  children: React.ReactNode;
}

const Trigger: React.FC<TriggerProps> = ({ children }) => {
  const { setIsOpen, selectedValue } = useSelectContext();
  
  return (
    <button 
      className="select-trigger"
      onClick={() => setIsOpen(prev => !prev)}
    >
      {children || selectedValue || 'Select...'}
    </button>
  );
};

// Options container
interface OptionsProps {
  children: React.ReactNode;
}

const Options: React.FC<OptionsProps> = ({ children }) => {
  const { isOpen } = useSelectContext();
  
  if (!isOpen) return null;
  
  return (
    <div className="select-options">
      {children}
    </div>
  );
};

// Option component
interface OptionProps {
  value: string;
  children: React.ReactNode;
}

const Option: React.FC<OptionProps> = ({ value, children }) => {
  const { onSelect, selectedValue } = useSelectContext();
  
  return (
    <div
      className={\`select-option \${selectedValue === value ? 'selected' : ''}\`}
      onClick={() => onSelect(value)}
    >
      {children}
    </div>
  );
};

// Assign compound components
Select.Trigger = Trigger;
Select.Options = Options;
Select.Option = Option;

// Usage
const SelectExample = () => {
  const [color, setColor] = useState('red');

  return (
    <Select value={color} onChange={setColor}>
      <Select.Trigger />
      <Select.Options>
        <Select.Option value="red">Red</Select.Option>
        <Select.Option value="blue">Blue</Select.Option>
        <Select.Option value="green">Green</Select.Option>
      </Select.Options>
    </Select>
  );
};

// ===============================
// 3. Higher-Order Component (HOC) Pattern
// ===============================
// withLoading HOC
interface WithLoadingProps {
  loading?: boolean;
}

const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return ({ loading, ...props }: P & WithLoadingProps) => {
    if (loading) {
      return <div className="loading-spinner">Loading...</div>;
    }
    return <WrappedComponent {...props as P} />;
  };
};

// withAuth HOC
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: P) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      // Check authentication
      const checkAuth = async () => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
      };
      checkAuth();
    }, []);

    if (!isAuthenticated) {
      return <div>Please log in to view this content</div>;
    }

    return <WrappedComponent {...props} />;
  };
};

// withLogger HOC - logs lifecycle events
const withLogger = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return class extends React.Component<P> {
    componentDidMount() {
      console.log(\`\${componentName} mounted\`);
    }

    componentDidUpdate(prevProps: P) {
      console.log(\`\${componentName} updated\`, { prevProps, currentProps: this.props });
    }

    componentWillUnmount() {
      console.log(\`\${componentName} unmounted\`);
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
};

// Usage
interface UserProfileProps {
  username: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ username }) => (
  <div>Hello, {username}!</div>
);

// Compose multiple HOCs
const EnhancedUserProfile = withAuth(
  withLoading(
    withLogger(UserProfile, 'UserProfile')
  )
);

// Usage in app
const App = () => (
  <EnhancedUserProfile 
    username="john_doe" 
    loading={false}
  />
);

// ===============================
// 4. Controlled Props Pattern
// ===============================
interface ToggleProps {
  on?: boolean;
  onChange?: (on: boolean) => void;
  defaultOn?: boolean;
  children?: React.ReactNode;
}

const Toggle: React.FC<ToggleProps> = ({ 
  on: controlledOn,
  onChange,
  defaultOn = false,
  children 
}) => {
  const [internalOn, setInternalOn] = useState(defaultOn);
  
  // Determine if component is controlled
  const isControlled = controlledOn !== undefined;
  const on = isControlled ? controlledOn : internalOn;

  const toggle = useCallback(() => {
    if (isControlled) {
      onChange?.(!on);
    } else {
      setInternalOn(prev => !prev);
    }
  }, [isControlled, on, onChange]);

  // Clone children with toggle functionality
  const childrenWithProps = Children.map(children, child => {
    if (React.isValidElement(child)) {
      return cloneElement(child, { on, toggle });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
};

// ===============================
// 5. State Reducer Pattern
// ===============================
interface State {
  on: boolean;
  timesClicked: number;
}

type Action = 
  | { type: 'toggle' }
  | { type: 'reset' };

const defaultReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'toggle':
      return {
        ...state,
        on: !state.on,
        timesClicked: state.timesClicked + 1
      };
    case 'reset':
      return { on: false, timesClicked: 0 };
    default:
      return state;
  }
};

interface ToggleWithReducerProps {
  reducer?: typeof defaultReducer;
  children: (state: State, dispatch: React.Dispatch<Action>) => React.ReactNode;
}

const ToggleWithReducer: React.FC<ToggleWithReducerProps> = ({ 
  reducer = defaultReducer,
  children 
}) => {
  const [state, dispatch] = useReducer(reducer, {
    on: false,
    timesClicked: 0
  });

  return <>{children(state, dispatch)}</>;
};

// Custom reducer for specific behavior
const customReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'toggle':
      // Prevent toggling after 5 clicks
      if (state.timesClicked >= 5) {
        return state;
      }
      return defaultReducer(state, action);
    default:
      return defaultReducer(state, action);
  }
};

// Usage
const AppWithReducer = () => (
  <ToggleWithReducer reducer={customReducer}>
    {(state, dispatch) => (
      <div>
        <button onClick={() => dispatch({ type: 'toggle' })}>
          Toggle ({state.timesClicked})
        </button>
        <p>Status: {state.on ? 'On' : 'Off'}</p>
        {state.timesClicked >= 5 && (
          <p>Maximum toggles reached!</p>
        )}
      </div>
    )}
  </ToggleWithReducer>
);

// ===============================
// 6. Provider Pattern with Hooks
// ===============================
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type']) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Notification component
const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notification-center">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={\`notification notification-\${notification.type}\`}
        >
          {notification.message}
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

// Usage
const AnyComponent = () => {
  const { addNotification } = useNotification();

  return (
    <button onClick={() => addNotification('Hello!', 'success')}>
      Show Notification
    </button>
  );
};
          `,
          quiz: [
            {
              question: "What's the main advantage of compound components?",
              options: [
                "They're easier to write",
                "They provide more flexibility and better API design",
                "They're faster",
                "They use less memory"
              ],
              correctAnswer: 1,
              explanation: "Compound components provide a more flexible and expressive API by allowing components to work together while maintaining a clean separation of concerns."
            }
          ]
        }
      ]
    },

    // ===============================
    // CHAPTER 13 – TypeScript with React
    // ===============================
    {
      id: "ch13-typescript",
      title: "TypeScript with React",
      description: "Building type-safe React applications",
      pages: [
        {
          id: "ch13-page1",
          title: "TypeScript Fundamentals for React",
          content: `
TypeScript adds static typing to JavaScript, making React apps more reliable and maintainable.

Benefits:
- Type safety at compile time
- Better IDE support
- Self-documenting code
- Catch errors early
- Improved refactoring

Key Concepts:
- Interfaces and Types
- Generics
- Union and Intersection types
- Type narrowing
- Utility types
          `,
          exampleCode: `
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ===============================
// Basic Types
// ===============================

// Primitive types
type UserId = string | number;
type Status = 'idle' | 'loading' | 'success' | 'error';

// Interfaces for objects
interface User {
  id: UserId;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Readonly
  role: 'admin' | 'user' | 'guest'; // Union type
}

// Extending interfaces
interface Admin extends User {
  permissions: string[];
  dashboardAccess: boolean;
}

// Type aliases vs Interfaces
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

// ===============================
// Component Props Typing
// ===============================

// Basic props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}

// Functional component with typed props
const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false,
  size = 'medium',
  children 
}) => {
  const buttonClasses = \`btn btn-\${variant} btn-\${size}\`;
  
  return (
    <button 
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
      {children}
    </button>
  );
};

// Alternative syntax (more explicit)
const ButtonAlt = ({ label, onClick }: ButtonProps): JSX.Element => {
  return <button onClick={onClick}>{label}</button>;
};

// ===============================
// Event Handling
// ===============================

interface FormProps {
  onSubmit: (data: FormData) => void;
}

const Form: React.FC<FormProps> = ({ onSubmit }) => {
  const [value, setValue] = useState<string>('');

  // Typed event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ value });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('Mouse entered', e.clientX, e.clientY);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

// ===============================
// useState with Types
// ===============================

const StateExamples = () => {
  // Type inference (string)
  const [text, setText] = useState('');

  // Explicit typing
  const [count, setCount] = useState<number>(0);
  
  // Union type
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  // Array of objects
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // Complex object with null initial value
  const [user, setUser] = useState<User | null>(null);
  
  // Function in useState
  const [items, setItems] = useState<number[]>(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : [];
  });

  // Type-safe updates
  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false
    };
    setTodos(prev => [...prev, newTodo]);
  };

  return <div>{/* Render */}</div>;
};

// ===============================
// useReducer with Types
// ===============================

// Define state type
interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

// Define action types
type CounterAction = 
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'RESET' }
  | { type: 'SET'; payload: number };

// Reducer with typed state and actions
const counterReducer = (state: CounterState, action: CounterAction): CounterState => {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + action.payload,
        lastUpdated: new Date()
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - action.payload,
        lastUpdated: new Date()
      };
    case 'RESET':
      return {
        count: 0,
        lastUpdated: new Date()
      };
    case 'SET':
      return {
        ...state,
        count: action.payload,
        lastUpdated: new Date()
      };
    default:
      return state;
  }
};

// Usage
const CounterWithReducer: React.FC = () => {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    lastUpdated: null
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT', payload: 1 })}>
        Increment
      </button>
      <button onClick={() => dispatch({ type: 'DECREMENT', payload: 1 })}>
        Decrement
      </button>
      <button onClick={() => dispatch({ type: 'RESET' })}>
        Reset
      </button>
    </div>
  );
};

// ===============================
// useContext with Types
// ===============================

// Define context type
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

// Create context with type
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook with type guard
const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Provider component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const colors = theme === 'light' 
    ? { primary: '#007bff', secondary: '#6c757d', background: '#fff', text: '#333' }
    : { primary: '#0d6efd', secondary: '#6c757d', background: '#333', text: '#fff' };

  const value = { theme, toggleTheme, colors };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Usage
const ThemedComponent: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      <h2>Current theme: {theme}</h2>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

// ===============================
// Generic Components
// ===============================

// Generic List component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage with different types
const NumbersList = () => (
  <List
    items={[1, 2, 3, 4, 5]}
    renderItem={(num) => <span>{num * 2}</span>}
    keyExtractor={(num) => num.toString()}
  />
);

const UsersList = ({ users }: { users: User[] }) => (
  <List
    items={users}
    renderItem={(user) => <div>{user.name} - {user.email}</div>}
    keyExtractor={(user) => user.id.toString()}
  />
);

// ===============================
// useRef with Types
// ===============================

const RefExamples = () => {
  // DOM element ref
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mutable value ref (doesn't trigger re-render)
  const countRef = useRef<number>(0);
  
  // Generic ref
  const divRef = useRef<HTMLDivElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    // Type-safe DOM access
    if (inputRef.current) {
      inputRef.current.value = 'Prefilled';
    }
  }, []);

  return (
    <div ref={divRef}>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
};

// ===============================
// Higher-Order Components with Types
// ===============================

// withLoading HOC
interface WithLoadingProps {
  isLoading?: boolean;
}

function withLoading<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithLoadingComponent(props: T & WithLoadingProps) {
    const { isLoading, ...rest } = props;
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    return <WrappedComponent {...rest as T} />;
  };
}

// Usage
interface DataComponentProps {
  data: string[];
}

const DataComponent: React.FC<DataComponentProps> = ({ data }) => (
  <ul>{data.map(item => <li key={item}>{item}</li>)}</ul>
);

const DataComponentWithLoading = withLoading(DataComponent);

// ===============================
// Utility Types
// ===============================

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
  category: string;
  tags: string[];
}

// Partial - all properties optional
type PartialProduct = Partial<Product>;

// Pick - select specific properties
type ProductPreview = Pick<Product, 'id' | 'name' | 'price'>;

// Omit - exclude specific properties
type ProductWithoutId = Omit<Product, 'id'>;

// Readonly - all properties readonly
type ReadonlyProduct = Readonly<Product>;

// Record - key-value pairs
type ProductCatalog = Record<string, Product>;

// ReturnType - get return type of function
function createUser(name: string, age: number) {
  return { id: Date.now(), name, age, createdAt: new Date() };
}
type CreateUserReturn = ReturnType<typeof createUser>;

// Parameters - get parameter types of function
type CreateUserParams = Parameters<typeof createUser>;

// ===============================
// API Response Types
// ===============================

interface APIResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Usage with fetch
async function fetchUsers(): Promise<APIResponse<User[]>> {
  const response = await fetch('/api/users');
  const data = await response.json();
  return data;
}

// ===============================
// Discriminated Unions
// ===============================

type Shape = 
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      // Exhaustiveness checking
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
          `,
          quiz: [
            {
              question: "What's the main benefit of using TypeScript with React?",
              options: [
                "Faster runtime performance",
                "Smaller bundle size",
                "Type safety and better developer experience",
                "Easier to learn than JavaScript"
              ],
              correctAnswer: 2,
              explanation: "TypeScript provides type safety at compile time, catching errors early and providing better IDE support and documentation."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "Explain the Virtual DOM and how it works.",
      answer: "The Virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React creates a new Virtual DOM tree, compares it with the previous one (diffing), and then efficiently updates only the changed parts in the real DOM (reconciliation).",
      difficulty: "beginner"
    },
    {
      question: "What's the difference between useEffect and useLayoutEffect?",
      answer: "useEffect runs asynchronously after the browser paints, while useLayoutEffect runs synchronously after DOM mutations but before the browser paints. Use useLayoutEffect when you need to measure DOM elements or make visual changes that should be visible immediately to avoid flicker.",
      difficulty: "intermediate"
    },
    {
      question: "How do you optimize performance in a React application?",
      answer: "Performance optimization techniques include: code splitting with React.lazy, memoization with useMemo and useCallback, React.memo for preventing unnecessary re-renders, virtualized lists for long lists, avoiding anonymous functions in render, using proper key props, and implementing shouldComponentUpdate or PureComponent for class components.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the concept of reconciliation in React.",
      answer: "Reconciliation is React's algorithm for updating the DOM efficiently. It compares the new Virtual DOM tree with the previous one and determines the minimum number of changes needed. The diffing algorithm uses heuristics like comparing elements of the same type and using keys to identify stable elements in lists.",
      difficulty: "intermediate"
    },
    {
      question: "What are custom hooks and when would you create one?",
      answer: "Custom hooks are JavaScript functions that start with 'use' and can call other hooks. They allow you to extract component logic into reusable functions. Create custom hooks when you have logic that's repeated across multiple components, like form handling, data fetching, local storage sync, or subscription management.",
      difficulty: "intermediate"
    },
    {
      question: "How does React's context API work and when should you use it?",
      answer: "Context provides a way to pass data through the component tree without prop drilling. It consists of a Provider that supplies data and Consumers that access it. Use it for global data like themes, user authentication, or language preferences, but not for every state need as it can make component reuse difficult.",
      difficulty: "intermediate"
    },
    {
      question: "What's the difference between controlled and uncontrolled components?",
      answer: "Controlled components have their form data handled by React state, with the input value controlled via props and changes handled through events. Uncontrolled components store their own state internally in the DOM, accessed via refs. Controlled components offer more control and validation but require more code.",
      difficulty: "beginner"
    },
    {
      question: "Explain the useReducer hook and when to use it over useState.",
      answer: "useReducer is a hook for managing complex state logic that involves multiple sub-values or when next state depends on previous state. It's preferable over useState when you have complex state transitions, when state logic is hard to test, or when you want to centralize state updates in a reducer function.",
      difficulty: "intermediate"
    },
    {
      question: "What are React keys and why are they important?",
      answer: "Keys are special attributes that help React identify which items have changed, been added, or removed in lists. They should be stable, unique, and consistent between renders. Using proper keys helps React optimize rendering and prevents bugs with component state in dynamic lists.",
      difficulty: "beginner"
    },
    {
      question: "How does React handle events differently than vanilla JavaScript?",
      answer: "React uses synthetic events - a cross-browser wrapper around native events. Synthetic events have the same interface as native events but work consistently across browsers. React events are named using camelCase (onClick) rather than lowercase, and you pass a function as the event handler rather than a string.",
      difficulty: "beginner"
    },
    {
      question: "Explain the concept of lifting state up in React.",
      answer: "Lifting state up means moving shared state to the closest common ancestor of components that need it. This ensures that when the state changes, all components that depend on it will re-render consistently. It's a fundamental pattern for sharing data between components and maintaining a single source of truth.",
      difficulty: "intermediate"
    },
    {
      question: "What are error boundaries and how do you create them?",
      answer: "Error boundaries are React components that catch JavaScript errors anywhere in their child component tree and display fallback UI. They can only be class components that implement either getDerivedStateFromError or componentDidCatch lifecycle methods. They don't catch errors in event handlers, async code, or server-side rendering.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the useMemo and useCallback hooks with examples.",
      answer: "useMemo memoizes expensive calculations, returning the same result unless dependencies change. useCallback memoizes function references, useful when passing callbacks to optimized child components. For example: useMemo(() => expensiveCalculation(data), [data]) and useCallback(() => handleClick(id), [id]).",
      difficulty: "intermediate"
    },
    {
      question: "What's the purpose of React.Fragment?",
      answer: "React.Fragment allows grouping multiple elements without adding extra nodes to the DOM. It's useful when you need to return multiple elements from a component but don't want a wrapper div. The short syntax <> </> can be used. Fragments can also accept keys when mapping collections.",
      difficulty: "beginner"
    },
    {
      question: "How do you handle side effects in React functional components?",
      answer: "Side effects are handled using the useEffect hook. Common side effects include data fetching, subscriptions, timers, and manual DOM manipulations. useEffect accepts a function that contains the side effect and optionally a cleanup function. The dependency array controls when the effect runs.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the difference between props and state.",
      answer: "Props are read-only data passed from parent to child components, while state is internal data managed within a component that can change over time. Props are immutable and cannot be modified by the child, while state can be updated using setState or useState setters, triggering re-renders.",
      difficulty: "beginner"
    },
    {
      question: "What are render props and when would you use them?",
      answer: "Render props is a pattern where a component receives a function as a prop that returns React elements. The component calls this function to render its content, allowing for code reuse and flexible composition. It's useful for sharing behavior between components without inheritance.",
      difficulty: "advanced"
    },
    {
      question: "How does React's strict mode help development?",
      answer: "StrictMode is a tool for highlighting potential problems in an application. It doesn't render any visible UI but activates additional checks and warnings for its descendants. It helps identify unsafe lifecycles, legacy API usage, and unexpected side effects by intentionally double-invoking certain functions.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the concept of code splitting in React.",
      answer: "Code splitting is a technique to split your bundle into smaller chunks that can be loaded on demand. React.lazy allows you to dynamically import components, and Suspense handles the loading state. This improves initial load time by reducing the amount of JavaScript needed for the first render.",
      difficulty: "intermediate"
    },
    {
      question: "What are the new features in React 18?",
      answer: "React 18 introduces concurrent rendering, automatic batching, transitions (useTransition), Suspense improvements, new hooks like useId and useDeferredValue, and streaming server-side rendering. It also includes improvements to StrictMode and TypeScript types.",
      difficulty: "advanced"
    },
    {
      question: "How do you test React components effectively?",
      answer: "React components are typically tested using Jest as the test runner and React Testing Library for rendering and interactions. Tests should focus on behavior rather than implementation details. Use userEvent for simulating user interactions, mock API calls with MSW, and test edge cases like loading and error states.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the concept of portals in React.",
      answer: "Portals provide a way to render children into a DOM node outside the parent component's hierarchy. This is useful for modals, tooltips, and dropdowns that need to break out of overflow:hidden or z-index constraints. Portals still maintain React context and event bubbling.",
      difficulty: "advanced"
    },
    {
      question: "What's the difference between React.memo and useMemo?",
      answer: "React.memo is a higher-order component that memoizes the entire component, preventing re-renders if props haven't changed. useMemo is a hook that memoizes a value. React.memo works at the component level, while useMemo works within a component for specific calculations.",
      difficulty: "intermediate"
    },
    {
      question: "How do you handle forms and validation in React?",
      answer: "Forms can be handled using controlled components with useState or useReducer, or using libraries like React Hook Form or Formik. Validation can be implemented manually with state, or using schema validation with Yup or Zod. Real-time validation, form submission handling, and error display are key considerations.",
      difficulty: "intermediate"
    },
    {
      question: "Explain the concept of higher-order components (HOCs).",
      answer: "Higher-order components are functions that take a component and return an enhanced component. They're a pattern for reusing component logic, such as authentication, logging, or data fetching. HOCs are being replaced by hooks in many cases but are still useful for certain cross-cutting concerns.",
      difficulty: "advanced"
    }
  ],

  finalAssessment: [
    {
      question: "Which hook would you use to perform side effects in a functional component?",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useReducer"
      ],
      correctAnswer: 1,
      explanation: "useEffect is designed specifically for handling side effects like data fetching, subscriptions, and DOM manipulations."
    },
    {
      question: "What's the primary purpose of the key prop in React lists?",
      options: [
        "Styling",
        "Performance optimization and identity tracking",
        "Accessibility",
        "Data binding"
      ],
      correctAnswer: 1,
      explanation: "Keys help React identify which items have changed, been added, or removed, optimizing the reconciliation process."
    },
    {
      question: "When does React re-render a component?",
      options: [
        "When props change",
        "When state changes",
        "When parent re-renders",
        "All of the above"
      ],
      correctAnswer: 3,
      explanation: "React re-renders components when their props or state change, or when their parent component re-renders (unless memoized)."
    },
    {
      question: "What's the correct way to update state based on previous state?",
      options: [
        "setCount(count + 1)",
        "setCount(prevCount => prevCount + 1)",
        "count = count + 1",
        "this.state.count += 1"
      ],
      correctAnswer: 1,
      explanation: "Using a functional update ensures you're working with the most current state, especially important when multiple updates are batched."
    },
    {
      question: "Which pattern is best for avoiding prop drilling?",
      options: [
        "Lifting state up",
        "Using props",
        "Context API",
        "Inline styles"
      ],
      correctAnswer: 2,
      explanation: "Context API is specifically designed to avoid prop drilling by providing a way to pass data through the component tree without manually passing props at every level."
    }
  ]
};