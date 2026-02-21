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

export const cBook: Book = {
  id: "c-mastery-2024",
  title: "C Programming Mastery 2024",
  subtitle: "Complete Guide from Fundamentals to Advanced Memory Concepts",
  author: "Systems Programming Experts",

  chapters: [
    // =====================================================
    // CHAPTER 1 – Introduction to C & Compilation
    // =====================================================
    {
      id: "c-ch1",
      title: "Introduction to C & Compilation Process",
      description: "Understanding C architecture and how programs are compiled",
      pages: [
        {
          id: "c-ch1-page1",
          title: "What is C & How It Works",
          content: `
C is a procedural, low-level programming language used for system programming, embedded systems, and performance-critical applications.

C is compiled language, meaning:
1. Source code (.c)
2. Preprocessor
3. Compiler
4. Assembler
5. Linker
6. Executable file

C gives direct memory access using pointers.

Advantages:
- Fast execution
- Small memory footprint
- Hardware-level access
          `,
          exampleCode: `
#include <stdio.h>

int main() {
    printf("Hello, C Programming!\\n");
    return 0;
}
          `,
          keyPoints: [
            "C is compiled language",
            "Provides low-level memory access",
            "Used in operating systems",
            "Fast and efficient"
          ],
          quiz: [
            {
              question: "Which step creates executable file?",
              options: ["Compiler", "Assembler", "Linker", "Preprocessor"],
              correctAnswer: 2,
              explanation: "Linker generates final executable."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 2 – Variables, Data Types & Operators
    // =====================================================
    {
      id: "c-ch2",
      title: "Data Types & Operators",
      description: "Understanding primitive data types and operators",
      pages: [
        {
          id: "c-ch2-page1",
          title: "Primitive Data Types",
          content: `
C supports primitive types:

- int (4 bytes)
- char (1 byte)
- float (4 bytes)
- double (8 bytes)

Modifiers:
- short
- long
- signed
- unsigned

Size depends on system architecture.
          `,
          exampleCode: `
int age = 25;
char grade = 'A';
float salary = 25000.50;
          `,
          quiz: [
            {
              question: "Which type stores decimal values?",
              options: ["int", "char", "float", "short"],
              correctAnswer: 2,
              explanation: "float stores decimal values."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 3 – Control Flow
    // =====================================================
    {
      id: "c-ch3",
      title: "Control Statements",
      description: "Conditional and looping constructs",
      pages: [
        {
          id: "c-ch3-page1",
          title: "if-else & switch",
          content: `
C uses conditional statements for decision making.

if-else:
Executes block based on condition.

switch:
Efficient for multiple conditions.

break statement prevents fall-through.
          `,
          exampleCode: `
int num = 2;

if(num == 2) {
    printf("Two");
}

switch(num) {
    case 1: printf("One"); break;
    case 2: printf("Two"); break;
}
          `,
          quiz: [
            {
              question: "Which statement prevents fall-through?",
              options: ["exit", "break", "continue", "stop"],
              correctAnswer: 1,
              explanation: "break prevents fall-through."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 4 – Functions & Storage Classes
    // =====================================================
    {
      id: "c-ch4",
      title: "Functions & Storage Classes",
      description: "Function calls, recursion, and variable storage",
      pages: [
        {
          id: "c-ch4-page1",
          title: "Functions in C",
          content: `
Functions help modular programming.

Types:
- Library functions
- User-defined functions

Storage classes:
- auto
- static
- extern
- register

Recursion allows function to call itself.
          `,
          exampleCode: `
int add(int a, int b) {
    return a + b;
}

int main() {
    printf("%d", add(5,3));
    return 0;
}
          `,
          quiz: [
            {
              question: "Which storage class keeps value between calls?",
              options: ["auto", "static", "extern", "register"],
              correctAnswer: 1,
              explanation: "static retains value."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 5 – Arrays & Strings
    // =====================================================
    {
      id: "c-ch5",
      title: "Arrays & Strings",
      description: "Handling collections of data",
      pages: [
        {
          id: "c-ch5-page1",
          title: "Arrays in C",
          content: `
Array is a collection of similar data types stored in contiguous memory.

Index starts at 0.

Multidimensional arrays represent matrices.
          `,
          exampleCode: `
int arr[3] = {10,20,30};
printf("%d", arr[0]);
          `,
          quiz: [
            {
              question: "Array index starts from?",
              options: ["1", "0", "-1", "Depends"],
              correctAnswer: 1,
              explanation: "C arrays start at index 0."
            }
          ]
        },

        {
          id: "c-ch5-page2",
          title: "Strings in C",
          content: `
Strings are character arrays terminated by null character '\\0'.

Common string functions:
- strlen()
- strcpy()
- strcmp()
- strcat()
          `,
          exampleCode: `
char name[] = "C Programming";
printf("%s", name);
          `,
          quiz: [
            {
              question: "Which character ends string?",
              options: ["\\n", "\\0", "\\t", "EOF"],
              correctAnswer: 1,
              explanation: "Strings end with null character."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 6 – Pointers (Deep Concept)
    // =====================================================
    {
      id: "c-ch6",
      title: "Pointers & Memory Management",
      description: "Understanding memory addresses and dynamic allocation",
      pages: [
        {
          id: "c-ch6-page1",
          title: "Pointers Explained",
          content: `
Pointer stores memory address of another variable.

Why pointers?
- Dynamic memory
- Efficient array handling
- Passing by reference
- Data structures

Dereferencing retrieves value.
          `,
          exampleCode: `
int x = 10;
int *ptr = &x;

printf("%d", *ptr);
          `,
          quiz: [
            {
              question: "What does *ptr mean?",
              options: ["Address", "Dereference", "Multiply", "Pointer name"],
              correctAnswer: 1,
              explanation: "* dereferences pointer."
            }
          ]
        },

        {
          id: "c-ch6-page2",
          title: "Dynamic Memory Allocation",
          content: `
Dynamic memory functions:
- malloc()
- calloc()
- realloc()
- free()

Memory is allocated on heap.

Always free allocated memory to avoid memory leaks.
          `,
          exampleCode: `
int *arr = (int*) malloc(5 * sizeof(int));
free(arr);
          `,
          quiz: [
            {
              question: "Which function frees memory?",
              options: ["delete", "remove", "free", "clear"],
              correctAnswer: 2,
              explanation: "free releases allocated memory."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 7 – Structures & Unions
    // =====================================================
    {
      id: "c-ch7",
      title: "Structures & Unions",
      description: "User-defined data types",
      pages: [
        {
          id: "c-ch7-page1",
          title: "Structures",
          content: `
Structure groups different data types.

Used to model real-world entities.

Memory allocated for all members.
          `,
          exampleCode: `
struct Student {
    char name[20];
    int age;
};
          `,
          quiz: [
            {
              question: "Structure stores?",
              options: ["Same type only", "Different types", "Only int", "Only char"],
              correctAnswer: 1,
              explanation: "Structure stores different types."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 8 – File Handling
    // =====================================================
    {
      id: "c-ch8",
      title: "File Handling",
      description: "Reading and writing files",
      pages: [
        {
          id: "c-ch8-page1",
          title: "Working with Files",
          content: `
File handling functions:
- fopen()
- fclose()
- fprintf()
- fscanf()
- fread()
- fwrite()

Modes:
- r (read)
- w (write)
- a (append)
          `,
          exampleCode: `
FILE *fp = fopen("data.txt", "w");
fprintf(fp, "Hello File");
fclose(fp);
          `,
          quiz: [
            {
              question: "Which mode appends file?",
              options: ["r", "w", "a", "rw"],
              correctAnswer: 2,
              explanation: "'a' appends file."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "What is pointer in C?",
      answer: "Pointer is a variable that stores memory address of another variable.",
      difficulty: "beginner"
    },
    {
      question: "Difference between malloc and calloc?",
      answer: "malloc allocates memory without initialization. calloc initializes memory to zero.",
      difficulty: "intermediate"
    },
    {
      question: "What is memory leak?",
      answer: "Memory leak occurs when allocated memory is not freed.",
      difficulty: "intermediate"
    }
  ],

  finalAssessment: [
    {
      question: "Which symbol is used for pointer?",
      options: ["&", "*", "%", "#"],
      correctAnswer: 1,
      explanation: "* is used to declare pointer."
    },
    {
      question: "Which function allocates memory dynamically?",
      options: ["malloc", "free", "printf", "open"],
      correctAnswer: 0,
      explanation: "malloc allocates memory."
    }
  ]
};