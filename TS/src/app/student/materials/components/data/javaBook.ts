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

export const javaBook: Book = {
  id: "java-mastery",
  title: "Java Mastery",
  subtitle: "Complete Guide from Core Java to Advanced Concepts",
  author: "Enterprise Engineering Experts",

  chapters: [
    // =====================================================
    // CHAPTER 1 – Introduction to Java & JVM
    // =====================================================
    {
      id: "java-ch1",
      title: "Java Fundamentals & JVM",
      description: "Understanding Java architecture, compilation, and execution",
      pages: [
        {
          id: "java-ch1-page1",
          title: "What is Java & How It Works",
          content: `
Java is a high-level, object-oriented, platform-independent programming language.

Java follows the principle:
"Write Once, Run Anywhere"

How Java Works:
1. Write source code (.java)
2. Compile using javac → generates bytecode (.class)
3. JVM executes bytecode

Java Architecture Components:
- JDK (Java Development Kit)
- JRE (Java Runtime Environment)
- JVM (Java Virtual Machine)

The JVM provides:
- Memory management
- Garbage collection
- Security
- Platform independence
          `,
          exampleCode: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
          `,
          keyPoints: [
            "Java is platform independent",
            "Bytecode runs on JVM",
            "JDK includes compiler",
            "JVM handles memory and execution"
          ],
          quiz: [
            {
              question: "Which component executes bytecode?",
              options: ["JDK", "JRE", "JVM", "Compiler"],
              correctAnswer: 2,
              explanation: "JVM executes bytecode."
            }
          ]
        },

        {
          id: "java-ch1-page2",
          title: "Java Memory Model",
          content: `
Java memory is divided into:

1) Heap
   - Stores objects
   - Shared among threads

2) Stack
   - Stores local variables
   - Method calls

3) Method Area
   - Stores class metadata
   - Static variables

Garbage Collector automatically removes unused objects.
          `,
          exampleCode: `
String name = "Java";  // Stored in heap
int age = 25;          // Stored in stack
          `,
          quiz: [
            {
              question: "Where are objects stored?",
              options: ["Stack", "Heap", "CPU", "Disk"],
              correctAnswer: 1,
              explanation: "Objects are stored in heap memory."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 2 – Data Types & Operators
    // =====================================================
    {
      id: "java-ch2",
      title: "Data Types & Operators",
      description: "Primitive types, reference types, and operators",
      pages: [
        {
          id: "java-ch2-page1",
          title: "Primitive & Reference Types",
          content: `
Primitive Types:
- byte, short, int, long
- float, double
- char
- boolean

Reference Types:
- String
- Arrays
- Classes
- Interfaces

Java is strongly typed, meaning type mismatches cause compile-time errors.
          `,
          exampleCode: `
int number = 10;
double price = 99.99;
boolean isActive = true;
String name = "Java";
          `,
          quiz: [
            {
              question: "Which is not primitive?",
              options: ["int", "double", "String", "boolean"],
              correctAnswer: 2,
              explanation: "String is a reference type."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 3 – OOP in Java
    // =====================================================
    {
      id: "java-ch3",
      title: "Object-Oriented Programming",
      description: "Encapsulation, inheritance, polymorphism, abstraction",
      pages: [
        {
          id: "java-ch3-page1",
          title: "Classes & Objects",
          content: `
Java is fully object-oriented.

OOP Principles:
1) Encapsulation – Hide internal data
2) Inheritance – Reuse parent properties
3) Polymorphism – Same method different behavior
4) Abstraction – Hide implementation details

Constructors initialize objects.
          `,
          exampleCode: `
class Person {
    String name;

    Person(String name) {
        this.name = name;
    }

    void greet() {
        System.out.println("Hello " + name);
    }
}
          `,
          quiz: [
            {
              question: "Which keyword refers to current object?",
              options: ["this", "super", "self", "object"],
              correctAnswer: 0,
              explanation: "'this' refers to current object."
            }
          ]
        },

        {
          id: "java-ch3-page2",
          title: "Inheritance & Polymorphism",
          content: `
Inheritance allows one class to inherit another.

Polymorphism allows method overriding and overloading.

Method Overriding:
- Same method name
- Same parameters
- Different implementation

Method Overloading:
- Same method name
- Different parameters
          `,
          exampleCode: `
class Animal {
    void sound() {
        System.out.println("Animal sound");
    }
}

class Dog extends Animal {
    void sound() {
        System.out.println("Bark");
    }
}
          `,
          quiz: [
            {
              question: "Which keyword is used for inheritance?",
              options: ["extends", "implements", "inherit", "super"],
              correctAnswer: 0,
              explanation: "'extends' is used for inheritance."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 4 – Exception Handling
    // =====================================================
    {
      id: "java-ch4",
      title: "Exception Handling",
      description: "Handling runtime errors safely",
      pages: [
        {
          id: "java-ch4-page1",
          title: "Try-Catch-Finally",
          content: `
Java uses exception handling to manage runtime errors.

Structure:
try {
   // code
}
catch(Exception e) {
   // handle
}
finally {
   // always runs
}

Types of Exceptions:
- Checked (IOException)
- Unchecked (NullPointerException)
          `,
          exampleCode: `
try {
    int x = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Cannot divide by zero");
}
          `,
          quiz: [
            {
              question: "Which block always executes?",
              options: ["try", "catch", "finally", "throw"],
              correctAnswer: 2,
              explanation: "finally always executes."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 5 – Collections Framework
    // =====================================================
    {
      id: "java-ch5",
      title: "Collections Framework",
      description: "List, Set, Map and internal working",
      pages: [
        {
          id: "java-ch5-page1",
          title: "List, Set & Map",
          content: `
Java Collections Framework provides data structures.

List:
- Ordered
- Allows duplicates
- Example: ArrayList, LinkedList

Set:
- No duplicates
- Example: HashSet

Map:
- Key-value pairs
- Example: HashMap

HashMap internally uses hashing for storage.
          `,
          exampleCode: `
import java.util.*;

List<String> list = new ArrayList<>();
list.add("Java");

Set<Integer> set = new HashSet<>();
set.add(10);

Map<String, Integer> map = new HashMap<>();
map.put("Age", 25);
          `,
          quiz: [
            {
              question: "Which collection allows duplicates?",
              options: ["Set", "Map", "List", "HashSet"],
              correctAnswer: 2,
              explanation: "List allows duplicates."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 6 – Multithreading
    // =====================================================
    {
      id: "java-ch6",
      title: "Multithreading",
      description: "Thread lifecycle, synchronization, concurrency",
      pages: [
        {
          id: "java-ch6-page1",
          title: "Threads in Java",
          content: `
Multithreading allows concurrent execution of tasks.

Ways to create thread:
1) Extend Thread class
2) Implement Runnable interface

Thread lifecycle:
- New
- Runnable
- Running
- Blocked
- Terminated

Synchronization prevents race conditions.
          `,
          exampleCode: `
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread running");
    }
}

MyThread t = new MyThread();
t.start();
          `,
          quiz: [
            {
              question: "Which method starts a thread?",
              options: ["run()", "start()", "execute()", "init()"],
              correctAnswer: 1,
              explanation: "start() begins thread execution."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "Explain JVM memory structure.",
      answer: "JVM memory includes Heap, Stack, and Method Area. Heap stores objects, stack stores method calls and local variables.",
      difficulty: "intermediate"
    },
    {
      question: "Difference between HashMap and Hashtable?",
      answer: "HashMap is not synchronized and allows null keys. Hashtable is synchronized and does not allow null keys.",
      difficulty: "intermediate"
    },
    {
      question: "What is polymorphism?",
      answer: "Polymorphism allows methods to behave differently based on the object.",
      difficulty: "beginner"
    }
  ],

  finalAssessment: [
    {
      question: "Which keyword is used for inheritance?",
      options: ["extends", "implements", "inherit", "super"],
      correctAnswer: 0,
      explanation: "'extends' enables inheritance."
    },
    {
      question: "Objects are stored in?",
      options: ["Stack", "Heap", "Method Area", "CPU"],
      correctAnswer: 1,
      explanation: "Objects are stored in heap memory."
    }
  ]
};