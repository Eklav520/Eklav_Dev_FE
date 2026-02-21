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

export const pythonBook: Book = {
  id: "python-mastery-2024",
  title: "Python Mastery 2024",
  subtitle: "Complete Guide from Fundamentals to Advanced Programming",
  author: "Software Engineering Experts",

  chapters: [
    // =====================================================
    // CHAPTER 1 – Python Fundamentals
    // =====================================================
    {
      id: "py-ch1",
      title: "Python Fundamentals",
      description: "Understanding Python syntax, variables, and execution model",
      pages: [
        {
          id: "py-ch1-page1",
          title: "Introduction to Python & How It Works",
          content: `
Python is a high-level, interpreted, dynamically typed programming language known for readability and simplicity.

Key Characteristics:
- Interpreted (executed line by line)
- Dynamically typed
- Object-oriented
- Cross-platform
- Large ecosystem of libraries

How Python Runs:
1. Source code (.py file)
2. Compiled into bytecode (.pyc)
3. Executed by Python Virtual Machine (PVM)

Python uses automatic memory management and garbage collection.
          `,
          exampleCode: `
print("Hello, Python!")

name = "Alice"
age = 25
print(name, age)
          `,
          keyPoints: [
            "Python is interpreted",
            "Uses bytecode execution",
            "Dynamically typed language",
            "Has automatic memory management"
          ],
          quiz: [
            {
              question: "Python is a?",
              options: ["Compiled only", "Interpreted", "Assembly", "Markup"],
              correctAnswer: 1,
              explanation: "Python is primarily interpreted."
            }
          ]
        },

        {
          id: "py-ch1-page2",
          title: "Variables & Data Types",
          content: `
Python variables are dynamically typed, meaning you do not declare types explicitly.

Primitive Data Types:
- int
- float
- bool
- str

Complex Data Types:
- list
- tuple
- set
- dict

Python is strongly typed — type errors occur if incompatible operations are performed.
          `,
          exampleCode: `
x = 10
y = 3.14
name = "Python"
is_active = True

numbers = [1,2,3]
user = {"name": "Alice", "age": 25}
          `,
          quiz: [
            {
              question: "Which type is immutable?",
              options: ["list", "dict", "tuple", "set"],
              correctAnswer: 2,
              explanation: "Tuple is immutable."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 2 – Control Flow
    // =====================================================
    {
      id: "py-ch2",
      title: "Control Flow",
      description: "Conditional statements and loops",
      pages: [
        {
          id: "py-ch2-page1",
          title: "Conditional Statements",
          content: `
Python uses indentation to define code blocks.

if-elif-else structure allows conditional execution.

Comparison operators:
==, !=, >, <, >=, <=

Logical operators:
and, or, not
          `,
          exampleCode: `
age = 18

if age >= 18:
    print("Adult")
elif age > 12:
    print("Teenager")
else:
    print("Child")
          `,
          quiz: [
            {
              question: "Python uses what to define blocks?",
              options: ["Braces", "Indentation", "Semicolons", "Parentheses"],
              correctAnswer: 1,
              explanation: "Python uses indentation."
            }
          ]
        },

        {
          id: "py-ch2-page2",
          title: "Loops",
          content: `
Python supports:
- for loop
- while loop

for loop works with iterables.
while loop executes while condition is true.

Break and continue modify loop behavior.
          `,
          exampleCode: `
for i in range(5):
    print(i)

count = 0
while count < 3:
    print(count)
    count += 1
          `,
          quiz: [
            {
              question: "range(5) generates?",
              options: ["1-5", "0-4", "0-5", "1-4"],
              correctAnswer: 1,
              explanation: "range(5) generates 0 to 4."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 3 – Functions & Scope
    // =====================================================
    {
      id: "py-ch3",
      title: "Functions & Scope",
      description: "Function definitions, arguments, and closures",
      pages: [
        {
          id: "py-ch3-page1",
          title: "Functions in Python",
          content: `
Functions are defined using the 'def' keyword.

Types of arguments:
- Positional
- Keyword
- Default
- Variable-length (*args, **kwargs)

Python supports first-class functions.
          `,
          exampleCode: `
def greet(name):
    return f"Hello {name}"

print(greet("Alice"))
          `,
          quiz: [
            {
              question: "What does *args represent?",
              options: ["Dictionary", "Tuple", "List", "String"],
              correctAnswer: 1,
              explanation: "*args collects arguments into a tuple."
            }
          ]
        },

        {
          id: "py-ch3-page2",
          title: "Closures & Lambda",
          content: `
A closure occurs when a nested function remembers outer variables.

Lambda functions are anonymous functions.

Closures allow data hiding and functional programming patterns.
          `,
          exampleCode: `
def outer():
    x = 10
    def inner():
        return x
    return inner

closure_func = outer()
print(closure_func())
          `,
          quiz: [
            {
              question: "Lambda functions are?",
              options: ["Named", "Anonymous", "Compiled", "Static"],
              correctAnswer: 1,
              explanation: "Lambda functions are anonymous."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 4 – Object-Oriented Programming
    // =====================================================
    {
      id: "py-ch4",
      title: "Object-Oriented Programming",
      description: "Classes, inheritance, polymorphism",
      pages: [
        {
          id: "py-ch4-page1",
          title: "Classes & Objects",
          content: `
Python is an object-oriented language.

OOP Concepts:
- Encapsulation
- Inheritance
- Polymorphism
- Abstraction

__init__ is constructor method.
self refers to instance.
          `,
          exampleCode: `
class Person:
    def __init__(self, name):
        self.name = name

    def greet(self):
        print("Hello", self.name)

p = Person("Alice")
p.greet()
          `,
          quiz: [
            {
              question: "__init__ is?",
              options: ["Destructor", "Constructor", "Function", "Loop"],
              correctAnswer: 1,
              explanation: "__init__ is constructor."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 5 – Error Handling & Exceptions
    // =====================================================
    {
      id: "py-ch5",
      title: "Error Handling",
      description: "Exception handling and debugging",
      pages: [
        {
          id: "py-ch5-page1",
          title: "Try-Except Blocks",
          content: `
Python handles errors using exceptions.

Structure:
try
except
finally
else

Custom exceptions can be created.
          `,
          exampleCode: `
try:
    x = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
finally:
    print("Execution complete")
          `,
          quiz: [
            {
              question: "finally block executes?",
              options: ["Only on error", "Never", "Always", "Sometimes"],
              correctAnswer: 2,
              explanation: "finally always executes."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "Explain Python memory management.",
      answer: "Python uses automatic memory management with reference counting and a garbage collector to remove cyclic references.",
      difficulty: "intermediate"
    },
    {
      question: "Difference between list and tuple?",
      answer: "Lists are mutable, tuples are immutable.",
      difficulty: "beginner"
    },
    {
      question: "What is GIL in Python?",
      answer: "Global Interpreter Lock allows only one thread to execute Python bytecode at a time.",
      difficulty: "advanced"
    }
  ],

  finalAssessment: [
    {
      question: "Which keyword defines a function?",
      options: ["function", "def", "lambda", "fun"],
      correctAnswer: 1,
      explanation: "Functions are defined using 'def'."
    },
    {
      question: "Which data type is mutable?",
      options: ["tuple", "int", "list", "str"],
      correctAnswer: 2,
      explanation: "Lists are mutable."
    }
  ]
};