
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
export const csharpBook: Book = {
  id: "csharp-mastery-2024",
  title: "C# Mastery 2024",
  subtitle: "Complete Guide from Beginner to Professional .NET Developer",
  author: "C# Development Experts",

  chapters: [

    // =====================================================
    // CHAPTER 1 – Introduction to C# and .NET
    // =====================================================
    {
      id: "csharp-ch1",
      title: "Introduction to C# and .NET",
      description: "Understanding C#, .NET ecosystem, and development environment",
      pages: [
        {
          id: "csharp-ch1-page1",
          title: "What is C#?",
          content: `
C# (pronounced C-Sharp) is a modern, object-oriented programming language developed by Microsoft.

Key Characteristics:
- Strongly typed
- Object-oriented
- Component-oriented
- Type-safe
- Interoperable
- Garbage-collected

C# runs on .NET Framework/Core and is used for:
- Desktop applications (Windows Forms, WPF)
- Web applications (ASP.NET)
- Mobile apps (Xamarin/MAUI)
- Games (Unity)
- Cloud services
- Microservices

.NET Ecosystem:
- .NET Framework (Windows-only)
- .NET Core (Cross-platform)
- .NET 5/6/7/8 (Unified platform)
          `,
          exampleCode: `
using System;

namespace MyFirstApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, C# World!");
            
            // Simple input/output
            Console.Write("Enter your name: ");
            string name = Console.ReadLine();
            Console.WriteLine($"Welcome, {name}!");
        }
    }
}
          `,
          keyPoints: [
            "C# is object-oriented and type-safe",
            "Runs on .NET platform",
            "Garbage-collected memory management",
            "Cross-platform with .NET Core/5+",
            "Used for various application types"
          ],
          quiz: [
            {
              question: "What is C# primarily used for?",
              options: [
                "Only web development",
                "Multiple platforms including desktop, web, mobile, and games",
                "Only Windows desktop apps",
                "Database management only"
              ],
              correctAnswer: 1,
              explanation: "C# is versatile and used for desktop, web, mobile, games, and cloud applications."
            }
          ]
        },
        {
          id: "csharp-ch1-page2",
          title: "Setting Up Development Environment",
          content: `
Setting up C# development environment:

1. Visual Studio (Windows/Mac)
   - Community Edition (Free)
   - Professional/Enterprise (Paid)
   - Includes all necessary tools

2. Visual Studio Code + .NET SDK
   - Lightweight, cross-platform
   - Requires C# extensions
   - Free and open-source

3. .NET SDK Installation
   - Download from dotnet.microsoft.com
   - Includes runtime and CLI tools
   - Cross-platform support

4. Essential Tools:
   - NuGet Package Manager
   - Git for version control
   - SQL Server (optional)
          `,
          exampleCode: `
// Using .NET CLI to create projects
// Command line commands:

// Create new console app
// dotnet new console -n MyConsoleApp

// Create new web API
// dotnet new webapi -n MyWebAPI

// Create new class library
// dotnet new classlib -n MyLibrary

// Run the application
// dotnet run

// Add NuGet package
// dotnet add package Newtonsoft.Json
          `,
          quiz: [
            {
              question: "Which command creates a new console application using .NET CLI?",
              options: [
                "dotnet create console",
                "dotnet new console",
                "dotnet new app",
                "dotnet console new"
              ],
              correctAnswer: 1,
              explanation: "The correct command is 'dotnet new console' to create a new console application."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 2 – C# Fundamentals
    // =====================================================
    {
      id: "csharp-ch2",
      title: "C# Fundamentals",
      description: "Basic syntax, data types, operators, and control structures",
      pages: [
        {
          id: "csharp-ch2-page1",
          title: "Variables and Data Types",
          content: `
C# supports various data types:

Value Types:
- int (32-bit integer)
- long (64-bit integer)
- float (32-bit floating point)
- double (64-bit floating point)
- decimal (128-bit precise decimal)
- bool (true/false)
- char (16-bit Unicode character)
- struct (custom value types)

Reference Types:
- string (text)
- class (objects)
- interface
- array
- delegate

Type Declaration:
- Explicit typing: int age = 25;
- Implicit typing: var name = "John"; (compile-time inferred)

Constants: const double PI = 3.14159;
          `,
          exampleCode: `
using System;

class Program
{
    static void Main()
    {
        // Value types
        int age = 30;
        long population = 7800000000;
        float price = 19.99f;  // 'f' suffix required
        double precise = 123.456789;
        decimal money = 199.99m;  // 'm' suffix for decimal
        bool isValid = true;
        char grade = 'A';
        
        // Reference types
        string name = "John Doe";
        int[] numbers = { 1, 2, 3, 4, 5 };
        
        // Type conversion
        int intValue = 100;
        double doubleValue = intValue;  // Implicit conversion
        int convertedBack = (int)doubleValue;  // Explicit cast
        
        // Nullable types
        int? nullableInt = null;
        
        // Default values
        int defaultInt = default;  // 0
        bool defaultBool = default;  // false
        string defaultString = default;  // null
        
        Console.WriteLine($"Name: {name}, Age: {age}");
        Console.WriteLine($"Total: {money:C}");  // Currency format
    }
}
          `,
          quiz: [
            {
              question: "Which of the following is a value type in C#?",
              options: [
                "string",
                "int",
                "object",
                "class"
              ],
              correctAnswer: 1,
              explanation: "int is a value type, while string, object, and class are reference types."
            }
          ]
        },
        {
          id: "csharp-ch2-page2",
          title: "Operators and Expressions",
          content: `
C# operators categorized:

Arithmetic Operators:
+  -  *  /  % (modulus)

Comparison Operators:
==  !=  <  >  <=  >=

Logical Operators:
&& (AND)  || (OR)  ! (NOT)

Assignment Operators:
=  +=  -=  *=  /=  %=

Increment/Decrement:
++  -- (prefix/postfix)

Bitwise Operators:
&  |  ^  ~  <<  >>

Ternary Operator:
condition ? trueValue : falseValue

Null-coalescing:
?? (null coalescing)
?. (null conditional)

Operator Precedence:
1. Postfix (x++, x--)
2. Unary (++x, --x, !)
3. Multiplicative (*, /, %)
4. Additive (+, -)
5. Relational (<, >, <=, >=)
6. Equality (==, !=)
7. Logical AND (&&)
8. Logical OR (||)
9. Assignment (=, +=, etc.)
          `,
          exampleCode: `
using System;

class Program
{
    static void Main()
    {
        // Arithmetic
        int a = 10, b = 3;
        Console.WriteLine($"a + b = {a + b}");  // 13
        Console.WriteLine($"a - b = {a - b}");  // 7
        Console.WriteLine($"a * b = {a * b}");  // 30
        Console.WriteLine($"a / b = {a / b}");  // 3 (integer division)
        Console.WriteLine($"a % b = {a % b}");  // 1 (remainder)
        
        // Comparison and Logical
        bool isAdult = true;
        bool hasLicense = false;
        
        if (isAdult && hasLicense)
            Console.WriteLine("Can drive");
        else if (isAdult && !hasLicense)
            Console.WriteLine("Get a license first");
            
        // Ternary operator
        int age = 20;
        string status = age >= 18 ? "Adult" : "Minor";
        
        // Null coalescing
        string name = null;
        string displayName = name ?? "Unknown";  // "Unknown"
        
        // Null conditional
        int? length = name?.Length;  // null, not exception
        
        // Compound assignment
        int counter = 5;
        counter += 3;  // counter = 8
        counter *= 2;  // counter = 16
    }
}
          `,
          quiz: [
            {
              question: "What is the result of 10 % 3 in C#?",
              options: [
                "3",
                "3.33",
                "1",
                "0"
              ],
              correctAnswer: 2,
              explanation: "The modulus operator (%) returns the remainder of division: 10 divided by 3 equals 3 with remainder 1."
            }
          ]
        },
        {
          id: "csharp-ch2-page3",
          title: "Control Flow Statements",
          content: `
Control flow statements in C#:

Conditional Statements:
- if, else if, else
- switch statement
- switch expression (C# 8+)

Looping Statements:
- for loop
- foreach loop
- while loop
- do-while loop

Jump Statements:
- break
- continue
- return
- goto (avoid when possible)
- throw

Pattern Matching (C# 7+):
- Type patterns
- Constant patterns
- Relational patterns
- Logical patterns
          `,
          exampleCode: `
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // If-else statement
        int score = 85;
        char grade;
        
        if (score >= 90)
            grade = 'A';
        else if (score >= 80)
            grade = 'B';
        else if (score >= 70)
            grade = 'C';
        else if (score >= 60)
            grade = 'D';
        else
            grade = 'F';
            
        Console.WriteLine($"Grade: {grade}");
        
        // Switch statement
        string day = "Monday";
        switch (day)
        {
            case "Monday":
            case "Tuesday":
            case "Wednesday":
            case "Thursday":
            case "Friday":
                Console.WriteLine("Weekday");
                break;
            case "Saturday":
            case "Sunday":
                Console.WriteLine("Weekend");
                break;
            default:
                Console.WriteLine("Invalid day");
                break;
        }
        
        // Switch expression (C# 8+)
        string cardType = "visa";
        string message = cardType switch
        {
            "visa" => "Visa card accepted",
            "mastercard" => "Mastercard accepted",
            "amex" => "American Express accepted",
            _ => "Unknown card type"
        };
        
        // For loop
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine($"For loop iteration: {i}");
        }
        
        // Foreach loop
        List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
        foreach (string name in names)
        {
            Console.WriteLine($"Hello, {name}!");
        }
        
        // While loop
        int count = 0;
        while (count < 3)
        {
            Console.WriteLine($"While loop: {count}");
            count++;
        }
        
        // Do-while loop
        int num = 0;
        do
        {
            Console.WriteLine($"Do-while: {num}");
            num++;
        } while (num < 3);
        
        // Pattern matching examples
        object obj = "Hello World";
        
        // Type pattern
        if (obj is string str)
        {
            Console.WriteLine($"String length: {str.Length}");
        }
        
        // Switch with patterns
        object value = 42;
        string result = value switch
        {
            int i when i > 0 => "Positive integer",
            int i when i < 0 => "Negative integer",
            int i => "Zero",
            string s => $"String: {s}",
            null => "Null value",
            _ => "Unknown type"
        };
    }
}
          `,
          quiz: [
            {
              question: "Which loop is guaranteed to execute at least once?",
              options: [
                "for loop",
                "while loop",
                "do-while loop",
                "foreach loop"
              ],
              correctAnswer: 2,
              explanation: "do-while loop checks condition after execution, so it always executes at least once."
            }
          ]
        },
        {
          id: "csharp-ch2-page4",
          title: "Arrays and Collections",
          content: `
Arrays in C#:
- Fixed size, same type elements
- Single-dimensional: int[] arr = new int[5];
- Multidimensional: int[,] matrix = new int[3,3];
- Jagged arrays: int[][] jagged = new int[3][];

Collection Types:

System.Collections.Generic (Recommended):
- List<T> – Dynamic array
- Dictionary<TKey, TValue> – Key-value pairs
- HashSet<T> – Unique elements
- Queue<T> – FIFO collection
- Stack<T> – LIFO collection
- LinkedList<T> – Doubly linked list

System.Collections (Legacy, non-generic):
- ArrayList
- Hashtable
- Queue
- Stack

LINQ (Language Integrated Query):
- Query collections using SQL-like syntax
- Extension methods: Where, Select, OrderBy, etc.
          `,
          exampleCode: `
using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        // Arrays
        int[] numbers = new int[5] { 1, 2, 3, 4, 5 };
        string[] names = { "Alice", "Bob", "Charlie" };
        
        Console.WriteLine($"First number: {numbers[0]}");
        Console.WriteLine($"Array length: {numbers.Length}");
        
        // Multidimensional array
        int[,] matrix = new int[2, 3]
        {
            { 1, 2, 3 },
            { 4, 5, 6 }
        };
        Console.WriteLine($"Element [1,1]: {matrix[1, 1]}");  // 5
        
        // Jagged array
        int[][] jagged = new int[3][];
        jagged[0] = new int[] { 1, 2 };
        jagged[1] = new int[] { 3, 4, 5 };
        jagged[2] = new int[] { 6, 7, 8, 9 };
        
        // List<T>
        List<int> numberList = new List<int>();
        numberList.Add(10);
        numberList.Add(20);
        numberList.AddRange(new[] { 30, 40, 50 });
        numberList.Remove(20);
        
        // Dictionary
        Dictionary<string, int> ages = new Dictionary<string, int>
        {
            { "Alice", 25 },
            { "Bob", 30 }
        };
        ages.Add("Charlie", 35);
        
        if (ages.ContainsKey("Alice"))
        {
            Console.WriteLine($"Alice's age: {ages["Alice"]}");
        }
        
        // HashSet
        HashSet<int> uniqueNumbers = new HashSet<int>();
        uniqueNumbers.Add(1);
        uniqueNumbers.Add(2);
        uniqueNumbers.Add(1);  // Duplicate, ignored
        
        // Queue
        Queue<string> queue = new Queue<string>();
        queue.Enqueue("First");
        queue.Enqueue("Second");
        string first = queue.Dequeue();  // "First"
        
        // Stack
        Stack<string> stack = new Stack<string>();
        stack.Push("Bottom");
        stack.Push("Top");
        string top = stack.Pop();  // "Top"
        
        // LINQ examples
        List<int> scores = new List<int> { 85, 92, 78, 95, 88 };
        
        // Query syntax
        var highScores = from score in scores
                        where score >= 90
                        orderby score descending
                        select score;
        
        // Method syntax
        var average = scores.Average();
        var max = scores.Max();
        var topThree = scores.OrderByDescending(s => s).Take(3);
        
        Console.WriteLine($"Average: {average}, Max: {max}");
        Console.WriteLine("High scores: " + string.Join(", ", highScores));
        
        // Dictionary iteration
        foreach (var kvp in ages)
        {
            Console.WriteLine($"{kvp.Key}: {kvp.Value}");
        }
    }
}
          `,
          quiz: [
            {
              question: "Which collection type ensures all elements are unique?",
              options: [
                "List<T>",
                "Dictionary<TKey, TValue>",
                "HashSet<T>",
                "Queue<T>"
              ],
              correctAnswer: 2,
              explanation: "HashSet<T> stores unique elements and automatically rejects duplicates."
            }
          ]
        },
        {
          id: "csharp-ch2-page5",
          title: "Methods and Parameters",
          content: `
Methods in C#:

Method Components:
- Access modifier (public, private, etc.)
- Return type (void or data type)
- Method name
- Parameters (optional)
- Method body

Parameter Types:
- Value parameters (default)
- Reference parameters (ref)
- Output parameters (out)
- Parameter arrays (params)

Method Overloading:
- Same name, different parameters
- Different number or types of parameters

Optional Parameters:
- Default values can be provided
- Named arguments (C# 4+)

Local Functions (C# 7+):
- Methods inside methods
- Can access outer variables

Expression-bodied Members (C# 6+):
- Concise syntax for simple methods
          `,
          exampleCode: `
using System;

class Calculator
{
    static void Main()
    {
        // Method calls
        int sum = Add(10, 20);
        Console.WriteLine($"Sum: {sum}");
        
        // Out parameter
        if (TryParse("123", out int result))
        {
            Console.WriteLine($"Parsed: {result}");
        }
        
        // Ref parameter
        int value = 5;
        DoubleIt(ref value);
        Console.WriteLine($"Doubled: {value}");  // 10
        
        // Params array
        int total = SumAll(1, 2, 3, 4, 5);
        Console.WriteLine($"Total: {total}");  // 15
        
        // Optional parameters
        PrintMessage("Hello");
        PrintMessage("Hello", 3);  // Print 3 times
        
        // Named arguments
        CreatePerson(name: "John", age: 30, city: "New York");
        
        // Local function
        int Multiply(int x, int y) => x * y;
        Console.WriteLine($"Local function result: {Multiply(5, 3)}");
    }
    
    // Basic method
    static int Add(int a, int b)
    {
        return a + b;
    }
    
    // Out parameter
    static bool TryParse(string input, out int result)
    {
        result = 0;
        try
        {
            result = int.Parse(input);
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    // Ref parameter
    static void DoubleIt(ref int number)
    {
        number *= 2;
    }
    
    // Params array
    static int SumAll(params int[] numbers)
    {
        int sum = 0;
        foreach (int num in numbers)
        {
            sum += num;
        }
        return sum;
    }
    
    // Optional parameters
    static void PrintMessage(string message, int times = 1)
    {
        for (int i = 0; i < times; i++)
        {
            Console.WriteLine(message);
        }
    }
    
    // Named arguments demonstration
    static void CreatePerson(string name, int age, string city)
    {
        Console.WriteLine($"{name}, {age}, from {city}");
    }
    
    // Expression-bodied method
    static int Square(int x) => x * x;
    
    // Method overloading
    static int Add(int a, int b, int c)
    {
        return a + b + c;
    }
    
    static double Add(double a, double b)
    {
        return a + b;
    }
}
          `,
          quiz: [
            {
              question: "What's the difference between ref and out parameters?",
              options: [
                "They are exactly the same",
                "ref requires variable initialization before passing, out doesn't",
                "out requires initialization, ref doesn't",
                "ref is for value types only"
              ],
              correctAnswer: 1,
              explanation: "ref parameters must be initialized before passing, while out parameters don't require initialization and must be assigned in the method."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 3 – Object-Oriented Programming (OOP) in C#
    // =====================================================
    {
      id: "csharp-ch3",
      title: "Object-Oriented Programming in C#",
      description: "Comprehensive coverage of OOP principles with practical examples",
      pages: [
        {
          id: "csharp-ch3-page1",
          title: "Classes and Objects",
          content: `
Classes and Objects in C#:

Class Definition:
- Blueprint for creating objects
- Contains fields, properties, methods, events
- Can have constructors, destructors
- Supports inheritance and polymorphism

Object Creation:
- Using 'new' keyword
- Object initializers
- Factory methods

Access Modifiers:
- public – Accessible everywhere
- private – Accessible only within same class
- protected – Accessible in derived classes
- internal – Accessible within same assembly
- protected internal – Protected OR internal
- private protected – Protected AND internal (C# 7.2+)

Static Members:
- Shared across all instances
- Accessed via class name
- Static classes cannot be instantiated

Partial Classes:
- Split class definition across files
- Useful for code generation
          `,
          exampleCode: `
using System;

namespace OOPDemo
{
    // Class definition
    public class Person
    {
        // Fields (private by convention)
        private string _name;
        private int _age;
        private static int _totalCount;
        
        // Properties with getters and setters
        public string Name
        {
            get { return _name; }
            set 
            { 
                if (!string.IsNullOrWhiteSpace(value))
                    _name = value; 
                else
                    throw new ArgumentException("Name cannot be empty");
            }
        }
        
        // Auto-implemented property
        public int Age 
        { 
            get { return _age; }
            set 
            { 
                if (value >= 0 && value <= 150)
                    _age = value;
                else
                    throw new ArgumentException("Invalid age");
            }
        }
        
        // Read-only property
        public bool IsAdult => Age >= 18;
        
        // Static property
        public static int TotalCount => _totalCount;
        
        // Constructors
        public Person()
        {
            _totalCount++;
            Console.WriteLine("Default constructor called");
        }
        
        public Person(string name) : this()
        {
            Name = name;
        }
        
        public Person(string name, int age) : this(name)
        {
            Age = age;
        }
        
        // Methods
        public void Introduce()
        {
            Console.WriteLine($"Hi, I'm {Name} and I'm {Age} years old.");
        }
        
        // Static method
        public static void ShowTotalCount()
        {
            Console.WriteLine($"Total persons created: {_totalCount}");
        }
        
        // Destructor (finalizer)
        ~Person()
        {
            _totalCount--;
            Console.WriteLine($"Person {Name} destroyed");
        }
    }
    
    // Static class example
    public static class MathUtilities
    {
        public static double PI = 3.14159;
        
        public static double CalculateCircleArea(double radius)
        {
            return PI * radius * radius;
        }
    }
    
    // Partial class example
    public partial class Employee
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
    
    public partial class Employee
    {
        public void DisplayInfo()
        {
            Console.WriteLine($"Employee {Id}: {Name}");
        }
    }
    
    class Program
    {
        static void Main()
        {
            // Object creation
            Person person1 = new Person();  // Default constructor
            person1.Name = "Alice";
            person1.Age = 25;
            
            // Object initializer syntax
            Person person2 = new Person 
            { 
                Name = "Bob", 
                Age = 30 
            };
            
            // Constructor with parameters
            Person person3 = new Person("Charlie", 35);
            
            // Using methods
            person1.Introduce();
            person2.Introduce();
            person3.Introduce();
            
            // Using static members
            Console.WriteLine($"PI value: {MathUtilities.PI}");
            double area = MathUtilities.CalculateCircleArea(5);
            Console.WriteLine($"Circle area: {area}");
            
            Person.ShowTotalCount();  // Should show 3
            
            // Using partial class
            Employee emp = new Employee { Id = 1, Name = "David" };
            emp.DisplayInfo();
            
            // Null check and property access
            Person person4 = null;
            string name = person4?.Name ?? "Unknown";
            Console.WriteLine($"Person4 name: {name}");
        }
    }
}
          `,
          quiz: [
            {
              question: "What is the default access modifier for class members in C#?",
              options: [
                "public",
                "private",
                "internal",
                "protected"
              ],
              correctAnswer: 1,
              explanation: "Class members (fields, methods, etc.) are private by default if no access modifier is specified."
            }
          ]
        },
        {
          id: "csharp-ch3-page2",
          title: "Encapsulation and Properties",
          content: `
Encapsulation in C#:

Encapsulation Principles:
- Hide internal state
- Control access through methods/properties
- Maintain data integrity
- Reduce complexity

Properties in C#:
- Get accessor (read)
- Set accessor (write)
- Init accessor (C# 9+) – set only during initialization
- Computed properties
- Expression-bodied properties

Property Types:
- Auto-implemented properties
- Full properties with backing fields
- Read-only properties
- Write-only properties (rare)
- Static properties

Indexers:
- Allow object to be indexed like an array
- Define using 'this' keyword

Access Modifiers for Properties:
- Can have different access for get/set
- Example: public get, private set

Data Validation:
- Validate in property setters
- Throw exceptions for invalid data
- Use nullable reference types
          `,
          exampleCode: `
using System;
using System.Collections.Generic;

namespace EncapsulationDemo
{
    public class BankAccount
    {
        // Private backing fields
        private string _accountNumber;
        private decimal _balance;
        private readonly List<string> _transactionHistory;
        
        // Auto-implemented property
        public string AccountHolderName { get; set; }
        
        // Read-only property with private set
        public string AccountNumber 
        { 
            get { return _accountNumber; }
            private set { _accountNumber = value; }
        }
        
        // Property with validation
        public decimal Balance
        {
            get { return _balance; }
            private set 
            { 
                if (value < 0)
                    throw new ArgumentException("Balance cannot be negative");
                _balance = value;
            }
        }
        
        // Computed property
        public bool IsOverdrawn => Balance < 0;
        
        // Read-only property
        public IReadOnlyList<string> TransactionHistory => _transactionHistory.AsReadOnly();
        
        // Static property
        private static decimal _interestRate = 0.02m;
        public static decimal InterestRate
        {
            get { return _interestRate; }
            set 
            { 
                if (value < 0 || value > 1)
                    throw new ArgumentException("Invalid interest rate");
                _interestRate = value;
            }
        }
        
        // Constructor
        public BankAccount(string accountHolderName, decimal initialDeposit)
        {
            AccountHolderName = accountHolderName;
            AccountNumber = GenerateAccountNumber();
            Balance = initialDeposit;
            _transactionHistory = new List<string>();
            AddTransaction($"Account created with initial deposit: {initialDeposit:C}");
        }
        
        // Methods that maintain encapsulation
        public void Deposit(decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Deposit amount must be positive");
                
            Balance += amount;
            AddTransaction($"Deposited: {amount:C}");
        }
        
        public bool Withdraw(decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Withdrawal amount must be positive");
                
            if (amount > Balance + 500)  // Allow $500 overdraft
                return false;
                
            Balance -= amount;
            AddTransaction($"Withdrawn: {amount:C}");
            return true;
        }
        
        private void AddTransaction(string description)
        {
            _transactionHistory.Add($"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {description}");
        }
        
        private string GenerateAccountNumber()
        {
            return $"ACC-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }
        
        // Indexer example
        public string this[int index]
        {
            get 
            { 
                if (index >= 0 && index < _transactionHistory.Count)
                    return _transactionHistory[index];
                throw new IndexOutOfRangeException();
            }
        }
        
        // Property with init accessor (C# 9+)
        public string BranchCode { get; init; }
    }
    
    // Record type example (C# 9+) - immutable by default
    public record Customer
    {
        public string FirstName { get; init; }
        public string LastName { get; init; }
        public string Email { get; init; }
        
        public string FullName => $"{FirstName} {LastName}";
    }
    
    class Program
    {
        static void Main()
        {
            // Creating account
            var account = new BankAccount("John Doe", 1000m)
            {
                BranchCode = "BR001"  // Init-only property
            };
            
            // Using properties
            Console.WriteLine($"Account: {account.AccountNumber}");
            Console.WriteLine($"Holder: {account.AccountHolderName}");
            Console.WriteLine($"Balance: {account.Balance:C}");
            
            // Deposit and withdraw
            account.Deposit(500m);
            account.Withdraw(200m);
            
            Console.WriteLine($"New Balance: {account.Balance:C}");
            Console.WriteLine($"Overdrawn? {account.IsOverdrawn}");
            
            // Access transactions via indexer
            Console.WriteLine("\nLast transaction:");
            Console.WriteLine(account[^1]);  // Last transaction using index from end (C# 8+)
            
            // Display all transactions
            Console.WriteLine("\nTransaction History:");
            foreach (var transaction in account.TransactionHistory)
            {
                Console.WriteLine(transaction);
            }
            
            // Static property usage
            Console.WriteLine($"\nCurrent interest rate: {BankAccount.InterestRate:P}");
            BankAccount.InterestRate = 0.03m;
            Console.WriteLine($"New interest rate: {BankAccount.InterestRate:P}");
            
            // Record usage
            var customer = new Customer
            {
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@email.com"
            };
            
            Console.WriteLine($"\nCustomer: {customer.FullName}");
            Console.WriteLine($"Email: {customer.Email}");
            
            // With expression (records support non-destructive mutation)
            var updatedCustomer = customer with { Email = "jane.smith@newdomain.com" };
        }
    }
}
          `,
          quiz: [
            {
              question: "What is the purpose of encapsulation in OOP?",
              options: [
                "To make all data public",
                "To hide internal state and control access",
                "To increase code complexity",
                "To prevent inheritance"
              ],
              correctAnswer: 1,
              explanation: "Encapsulation hides internal state and provides controlled access through methods/properties, ensuring data integrity."
            }
          ]
        },
        {
          id: "csharp-ch3-page3",
          title: "Inheritance",
          content: `
Inheritance in C#:

Inheritance Concepts:
- Establish parent-child relationship
- Code reuse through base classes
- 'is-a' relationship
- Single inheritance (class can inherit from one base class)
- Multiple interface implementation

Base Class (Parent):
- Contains common functionality
- Can be abstract or concrete
- Marked with 'virtual' for overriding

Derived Class (Child):
- Inherits all non-private members
- Can override virtual methods
- Adds specialized functionality
- Uses ':' syntax

Keywords:
- base – Access base class members
- virtual – Method can be overridden
- override – Override virtual method
- sealed – Prevent further overriding
- new – Hide base class member
- abstract – Must be overridden

Object Class:
- All classes inherit from System.Object
- Provides ToString(), Equals(), GetHashCode()
          `,
          exampleCode: `
using System;

namespace InheritanceDemo
{
    // Base class
    public abstract class Animal
    {
        public string Name { get; set; }
        public int Age { get; set; }
        
        public Animal(string name, int age)
        {
            Name = name;
            Age = age;
        }
        
        // Virtual method - can be overridden
        public virtual void MakeSound()
        {
            Console.WriteLine("Some animal sound");
        }
        
        // Abstract method - must be implemented by derived classes
        public abstract void Move();
        
        // Common method
        public void Eat()
        {
            Console.WriteLine($"{Name} is eating");
        }
        
        // Override Object.ToString()
        public override string ToString()
        {
            return $"{Name} ({Age} years old)";
        }
    }
    
    // Derived class
    public class Dog : Animal
    {
        public string Breed { get; set; }
        
        public Dog(string name, int age, string breed) : base(name, age)
        {
            Breed = breed;
        }
        
        // Override virtual method
        public override void MakeSound()
        {
            Console.WriteLine($"{Name} says: Woof! Woof!");
        }
        
        // Implement abstract method
        public override void Move()
        {
            Console.WriteLine($"{Name} is running on four legs");
        }
        
        // Specialized method
        public void Fetch()
        {
            Console.WriteLine($"{Name} is fetching the ball");
        }
    }
    
    public class Cat : Animal
    {
        public bool IsIndoor { get; set; }
        
        public Cat(string name, int age, bool isIndoor) : base(name, age)
        {
            IsIndoor = isIndoor;
        }
        
        public override void MakeSound()
        {
            Console.WriteLine($"{Name} says: Meow!");
        }
        
        public override void Move()
        {
            Console.WriteLine($"{Name} is gracefully walking");
        }
        
        public void Scratch()
        {
            Console.WriteLine($"{Name} is scratching");
        }
    }
    
    // Sealed class - cannot be inherited
    public sealed class GoldenRetriever : Dog
    {
        public GoldenRetriever(string name, int age) : base(name, age, "Golden Retriever")
        {
        }
        
        // Sealed override - cannot be overridden further
        public sealed override void MakeSound()
        {
            Console.WriteLine($"{Name} gives a friendly woof!");
        }
    }
    
    // Multiple interface implementation
    public interface ISwimmable
    {
        void Swim();
    }
    
    public interface IFlyable
    {
        void Fly();
    }
    
    public class Duck : Animal, ISwimmable, IFlyable
    {
        public Duck(string name, int age) : base(name, age)
        {
        }
        
        public override void MakeSound()
        {
            Console.WriteLine($"{Name} says: Quack!");
        }
        
        public override void Move()
        {
            Console.WriteLine($"{Name} is waddling");
        }
        
        public void Swim()
        {
            Console.WriteLine($"{Name} is swimming");
        }
        
        public void Fly()
        {
            Console.WriteLine($"{Name} is flying");
        }
    }
    
    // Constructor inheritance demonstration
    public class Vehicle
    {
        public string Brand { get; set; }
        public string Model { get; set; }
        
        public Vehicle()
        {
            Console.WriteLine("Vehicle default constructor");
        }
        
        public Vehicle(string brand, string model)
        {
            Brand = brand;
            Model = model;
            Console.WriteLine($"Vehicle parameterized constructor: {brand} {model}");
        }
    }
    
    public class Car : Vehicle
    {
        public int NumberOfDoors { get; set; }
        
        public Car() : base()  // Calls base default constructor
        {
            Console.WriteLine("Car default constructor");
        }
        
        public Car(string brand, string model, int doors) : base(brand, model)
        {
            NumberOfDoors = doors;
            Console.WriteLine($"Car parameterized constructor: {doors} doors");
        }
    }
    
    class Program
    {
        static void Main()
        {
            // Polymorphic usage
            Animal[] animals = new Animal[]
            {
                new Dog("Buddy", 3, "Labrador"),
                new Cat("Whiskers", 2, true),
                new Duck("Donald", 1)
            };
            
            foreach (Animal animal in animals)
            {
                Console.WriteLine($"\n{animal}");  // Calls ToString()
                animal.MakeSound();
                animal.Move();
                animal.Eat();
                
                // Type checking and casting
                if (animal is Dog dog)
                {
                    dog.Fetch();
                }
                else if (animal is Cat cat)
                {
                    cat.Scratch();
                }
                else if (animal is Duck duck)
                {
                    duck.Swim();
                    duck.Fly();
                }
            }
            
            // Constructor chaining
            Console.WriteLine("\n--- Constructor Chaining ---");
            Car car1 = new Car();
            Car car2 = new Car("Toyota", "Camry", 4);
            
            // Sealed class
            GoldenRetriever golden = new GoldenRetriever("Max", 2);
            golden.MakeSound();
            
            // Using 'as' operator for safe casting
            Dog maybeDog = animals[0] as Dog;
            if (maybeDog != null)
            {
                Console.WriteLine($"\nFound a dog: {maybeDog.Name}");
            }
            
            // is operator with pattern matching
            if (animals[1] is Cat { IsIndoor: true } indoorCat)
            {
                Console.WriteLine($"\n{indoorCat.Name} is an indoor cat");
            }
        }
    }
}
          `,
          quiz: [
            {
              question: "Can a C# class inherit from multiple classes?",
              options: [
                "Yes, C# supports multiple inheritance",
                "No, C# supports only single inheritance for classes",
                "Only if they're interfaces",
                "Only with the 'multiple' keyword"
              ],
              correctAnswer: 1,
              explanation: "C# supports single inheritance for classes (one base class) but multiple interface implementation."
            }
          ]
        },
        {
          id: "csharp-ch3-page4",
          title: "Polymorphism",
          content: `
Polymorphism in C#:

Polymorphism Concepts:
- Many forms of the same behavior
- Compile-time (static) polymorphism
- Runtime (dynamic) polymorphism

Compile-time Polymorphism:
- Method overloading
- Operator overloading

Runtime Polymorphism:
- Method overriding (virtual/override)
- Achieved through inheritance and interfaces
- Base class reference to derived object

Virtual Methods:
- Marked with 'virtual' keyword
- Can be overridden in derived classes
- Provide default implementation

Abstract Methods:
- No implementation in base class
- Must be overridden in derived class
- Class must be abstract

Method Hiding (new):
- Hide base class method without overriding
- Creates new method with same name
- Use 'new' keyword explicitly

Dynamic Polymorphism:
- Achieved via 'dynamic' keyword (C# 4+)
- Runtime binding of method calls

Operator Overloading:
- Define behavior for operators (+, -, etc.)
- Must be static methods
          `,
          exampleCode: `
using System;
using System.Collections.Generic;

namespace PolymorphismDemo
{
    // Base class with virtual methods
    public abstract class Shape
    {
        public string Name { get; set; }
        
        public Shape(string name)
        {
            Name = name;
        }
        
        // Abstract method - must be overridden
        public abstract double CalculateArea();
        
        // Virtual method - can be overridden
        public virtual double CalculatePerimeter()
        {
            return 0; // Default implementation
        }
        
        // Method to demonstrate polymorphism
        public virtual void DisplayInfo()
        {
            Console.WriteLine($"Shape: {Name}");
        }
        
        // Operator overloading example
        public static Shape operator +(Shape a, Shape b)
        {
            return new CompositeShape($"{a.Name} + {b.Name}", a, b);
        }
    }
    
    // Derived class - Circle
    public class Circle : Shape
    {
        public double Radius { get; set; }
        
        public Circle(string name, double radius) : base(name)
        {
            Radius = radius;
        }
        
        public override double CalculateArea()
        {
            return Math.PI * Radius * Radius;
        }
        
        public override double CalculatePerimeter()
        {
            return 2 * Math.PI * Radius;
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"  Type: Circle, Radius: {Radius}");
            Console.WriteLine($"  Area: {CalculateArea():F2}");
            Console.WriteLine($"  Perimeter: {CalculatePerimeter():F2}");
        }
    }
    
    // Derived class - Rectangle
    public class Rectangle : Shape
    {
        public double Width { get; set; }
        public double Height { get; set; }
        
        public Rectangle(string name, double width, double height) : base(name)
        {
            Width = width;
            Height = height;
        }
        
        public override double CalculateArea()
        {
            return Width * Height;
        }
        
        public override double CalculatePerimeter()
        {
            return 2 * (Width + Height);
        }
        
        public override void DisplayInfo()
        {
            base.DisplayInfo();
            Console.WriteLine($"  Type: Rectangle, Width: {Width}, Height: {Height}");
            Console.WriteLine($"  Area: {CalculateArea():F2}");
            Console.WriteLine($"  Perimeter: {CalculatePerimeter():F2}");
        }
        
        // Method hiding (not overriding)
        public new void DisplayInfo(string prefix)
        {
            Console.WriteLine($"{prefix} Rectangle: {Name} ({Width}x{Height})");
        }
    }
    
    // Composite shape for operator overloading
    public class CompositeShape : Shape
    {
        private Shape _shape1;
        private Shape _shape2;
        
        public CompositeShape(string name, Shape shape1, Shape shape2) : base(name)
        {
            _shape1 = shape1;
            _shape2 = shape2;
        }
        
        public override double CalculateArea()
        {
            return _shape1.CalculateArea() + _shape2.CalculateArea();
        }
        
        public override void DisplayInfo()
        {
            Console.WriteLine($"\nComposite Shape: {Name}");
            Console.WriteLine("Components:");
            _shape1.DisplayInfo();
            _shape2.DisplayInfo();
            Console.WriteLine($"Total Area: {CalculateArea():F2}");
        }
    }
    
    // Method overloading demonstration
    public class Calculator
    {
        // Overloaded methods - compile-time polymorphism
        public int Add(int a, int b)
        {
            Console.WriteLine("Adding two integers");
            return a + b;
        }
        
        public int Add(int a, int b, int c)
        {
            Console.WriteLine("Adding three integers");
            return a + b + c;
        }
        
        public double Add(double a, double b)
        {
            Console.WriteLine("Adding two doubles");
            return a + b;
        }
        
        public string Add(string a, string b)
        {
            Console.WriteLine("Concatenating strings");
            return a + b;
        }
        
        // Generic method
        public T Add<T>(T a, T b) where T : struct
        {
            Console.WriteLine($"Adding generic types: {typeof(T)}");
            dynamic da = a;
            dynamic db = b;
            return da + db;
        }
    }
    
    // Interface-based polymorphism
    public interface IDrawable
    {
        void Draw();
    }
    
    public class Triangle : Shape, IDrawable
    {
        public double SideA { get; set; }
        public double SideB { get; set; }
        public double SideC { get; set; }
        
        public Triangle(string name, double a, double b, double c) : base(name)
        {
            SideA = a;
            SideB = b;
            SideC = c;
        }
        
        public override double CalculateArea()
        {
            // Heron's formula
            double s = (SideA + SideB + SideC) / 2;
            return Math.Sqrt(s * (s - SideA) * (s - SideB) * (s - SideC));
        }
        
        public override double CalculatePerimeter()
        {
            return SideA + SideB + SideC;
        }
        
        public void Draw()
        {
            Console.WriteLine($"Drawing triangle {Name}");
        }
    }
    
    class Program
    {
        static void Main()
        {
            Console.WriteLine("=== Polymorphism Demonstration ===\n");
            
            // Runtime polymorphism - base class reference to derived objects
            List<Shape> shapes = new List<Shape>
            {
                new Circle("Circle1", 5),
                new Rectangle("Rect1", 4, 6),
                new Triangle("Tri1", 3, 4, 5)
            };
            
            Console.WriteLine("Processing shapes polymorphically:");
            foreach (Shape shape in shapes)
            {
                shape.DisplayInfo();
                Console.WriteLine();
            }
            
            // Method overloading
            Console.WriteLine("=== Method Overloading ===");
            Calculator calc = new Calculator();
            Console.WriteLine($"Add(int, int): {calc.Add(5, 3)}");
            Console.WriteLine($"Add(int, int, int): {calc.Add(5, 3, 2)}");
            Console.WriteLine($"Add(double, double): {calc.Add(5.5, 3.2)}");
            Console.WriteLine($"Add(string, string): {calc.Add("Hello ", "World")}");
            
            // Operator overloading
            Console.WriteLine("\n=== Operator Overloading ===");
            Circle smallCircle = new Circle("Small", 2);
            Rectangle bigRect = new Rectangle("Big", 5, 8);
            Shape combined = smallCircle + bigRect;
            combined.DisplayInfo();
            
            // Method hiding demonstration
            Console.WriteLine("\n=== Method Hiding ===");
            Rectangle rect = new Rectangle("Rect2", 3, 4);
            rect.DisplayInfo();  // Virtual method
            rect.DisplayInfo("HIDDEN:");  // Hidden method
            
            // Interface-based polymorphism
            Console.WriteLine("\n=== Interface Polymorphism ===");
            Triangle triangle = new Triangle("Tri2", 3, 4, 5);
            IDrawable drawable = triangle;
            drawable.Draw();  // Interface method
            
            // Generic method polymorphism
            Console.WriteLine("\n=== Generic Method ===");
            Console.WriteLine($"Generic Add: {calc.Add(10, 20)}");
            
            // Dynamic polymorphism
            Console.WriteLine("\n=== Dynamic Polymorphism ===");
            dynamic dynamicShape = new Circle("Dynamic", 10);
            Console.WriteLine($"Dynamic shape area: {dynamicShape.CalculateArea():F2}");
            
            // Covariance and Contravariance
            Console.WriteLine("\n=== Covariance and Contravariance ===");
            // Covariance - can use more derived type
            IEnumerable<Shape> shapeList = new List<Circle>();  // OK
            
            // Contravariance - can use less derived type
            Action<Shape> shapeAction = (s) => Console.WriteLine(s.Name);
            Action<Circle> circleAction = shapeAction;  // OK
            circleAction(new Circle("Circle for Action", 7));
        }
    }
}
          `,
          quiz: [
            {
              question: "What is the difference between method overloading and method overriding?",
              options: [
                "They are the same thing",
                "Overloading is compile-time, overriding is runtime",
                "Overriding is compile-time, overloading is runtime",
                "Overloading is for static methods only"
              ],
              correctAnswer: 1,
              explanation: "Method overloading is compile-time polymorphism (same name, different parameters). Method overriding is runtime polymorphism (replacing base class implementation with virtual/override)."
            }
          ]
        },
        {
          id: "csharp-ch3-page5",
          title: "Abstraction",
          content: `
Abstraction in C#:

Abstraction Concepts:
- Hide complex implementation details
- Show only essential features
- Reduce complexity
- Increase reusability

Abstract Classes:
- Cannot be instantiated
- May contain abstract and concrete members
- Provide partial implementation
- Force derived classes to implement abstract members

Interfaces:
- Contract for classes to implement
- No implementation (before C# 8)
- Can contain methods, properties, events
- Multiple inheritance possible

When to use Abstract Classes vs Interfaces:
- Abstract class: Shared base implementation
- Interface: Contract across unrelated classes

C# 8+ Interface Enhancements:
- Default interface methods
- Private methods in interfaces
- Static members in interfaces

Sealed Classes:
- Cannot be inherited
- Final implementation
          `,
          exampleCode: `
using System;
using System.Collections.Generic;

namespace AbstractionDemo
{
    // Abstract class - provides partial implementation
    public abstract class DatabaseConnection
    {
        // Abstract property - must be implemented
        public abstract string ConnectionString { get; set; }
        
        // Abstract method - must be implemented
        public abstract void Connect();
        
        // Abstract method - must be implemented
        public abstract void Disconnect();
        
        // Concrete method - common functionality
        public void ExecuteQuery(string query)
        {
            Connect();
            Console.WriteLine($"Executing: {query}");
            LogQuery(query);
            Disconnect();
        }
        
        // Virtual method - can be overridden
        protected virtual void LogQuery(string query)
        {
            Console.WriteLine($"Query logged at {DateTime.Now}");
        }
        
        // Abstract class can have constructor
        protected DatabaseConnection()
        {
            Console.WriteLine("DatabaseConnection initialized");
        }
    }
    
    // Concrete implementation
    public class SqlServerConnection : DatabaseConnection
    {
        private string _connectionString;
        
        public override string ConnectionString 
        { 
            get { return _connectionString; }
            set { _connectionString = value; }
        }
        
        public SqlServerConnection(string connectionString)
        {
            ConnectionString = connectionString;
        }
        
        public override void Connect()
        {
            Console.WriteLine($"Connecting to SQL Server: {ConnectionString}");
        }
        
        public override void Disconnect()
        {
            Console.WriteLine("Disconnecting from SQL Server");
        }
        
        protected override void LogQuery(string query)
        {
            base.LogQuery(query);
            Console.WriteLine("SQL Server-specific logging");
        }
    }
    
    // Interface - pure abstraction
    public interface IPaymentProcessor
    {
        // Interface members (public by default)
        bool ProcessPayment(decimal amount);
        void Refund(decimal amount);
        
        // Property in interface
        string ProcessorName { get; }
        
        // Default interface method (C# 8+)
        void LogTransaction(decimal amount, bool success)
        {
            string status = success ? "successful" : "failed";
            Console.WriteLine($"{ProcessorName}: Payment of {amount:C} {status} at {DateTime.Now}");
        }
        
        // Static method in interface (C# 8+)
        static IPaymentProcessor CreateDefault()
        {
            return new CreditCardProcessor();
        }
    }
    
    // Interface for fraud detection
    public interface IFraudDetectable
    {
        bool CheckFraud(decimal amount, string customerId);
    }
    
    // Multiple interface implementation
    public class CreditCardProcessor : IPaymentProcessor, IFraudDetectable
    {
        public string ProcessorName => "Credit Card Processor";
        
        public bool CheckFraud(decimal amount, string customerId)
        {
            // Simple fraud check
            return amount > 10000; // Flag large transactions
        }
        
        public bool ProcessPayment(decimal amount)
        {
            Console.WriteLine($"Processing credit card payment: {amount:C}");
            
            bool success = amount <= 5000; // Simple validation
            
            // Using default interface method
            LogTransaction(amount, success);
            
            return success;
        }
        
        public void Refund(decimal amount)
        {
            Console.WriteLine($"Refunding {amount:C} to credit card");
        }
    }
    
    public class PayPalProcessor : IPaymentProcessor
    {
        public string ProcessorName => "PayPal";
        
        public bool ProcessPayment(decimal amount)
        {
            Console.WriteLine($"Processing PayPal payment: {amount:C}");
            
            bool success = true;
            LogTransaction(amount, success);
            
            return success;
        }
        
        public void Refund(decimal amount)
        {
            Console.WriteLine($"Refunding {amount:C} via PayPal");
        }
    }
    
    // Abstract class with factory method pattern
    public abstract class ReportGenerator
    {
        // Template method pattern
        public void GenerateReport()
        {
            GatherData();
            FormatData();
            CreateHeader();
            CreateBody();
            CreateFooter();
            ExportReport();
        }
        
        protected abstract void GatherData();
        protected abstract void FormatData();
        
        protected virtual void CreateHeader()
        {
            Console.WriteLine("=== Report Header ===");
        }
        
        protected virtual void CreateBody()
        {
            Console.WriteLine("Report Body");
        }
        
        protected virtual void CreateFooter()
        {
            Console.WriteLine("=== Report Footer ===");
            Console.WriteLine($"Generated: {DateTime.Now}");
        }
        
        protected abstract void ExportReport();
    }
    
    public class PdfReportGenerator : ReportGenerator
    {
        protected override void GatherData()
        {
            Console.WriteLine("Gathering data for PDF report");
        }
        
        protected override void FormatData()
        {
            Console.WriteLine("Formatting data for PDF");
        }
        
        protected override void ExportReport()
        {
            Console.WriteLine("Exporting as PDF");
        }
        
        protected override void CreateBody()
        {
            Console.WriteLine("PDF Report Body with formatting");
        }
    }
    
    public class ExcelReportGenerator : ReportGenerator
    {
        protected override void GatherData()
        {
            Console.WriteLine("Gathering data for Excel report");
        }
        
        protected override void FormatData()
        {
            Console.WriteLine("Formatting data with columns and rows");
        }
        
        protected override void ExportReport()
        {
            Console.WriteLine("Exporting as Excel file");
        }
    }
    
    // Sealed class - cannot be inherited
    public sealed class ConfigurationManager
    {
        private static ConfigurationManager _instance;
        private static readonly object _lock = new object();
        
        // Singleton pattern
        public static ConfigurationManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    lock (_lock)
                    {
                        if (_instance == null)
                        {
                            _instance = new ConfigurationManager();
                        }
                    }
                }
                return _instance;
            }
        }
        
        private ConfigurationManager()
        {
            // Private constructor for singleton
        }
        
        public string GetSetting(string key)
        {
            // Implementation
            return $"Value for {key}";
        }
    }
    
    class Program
    {
        static void Main()
        {
            Console.WriteLine("=== Abstraction Demonstration ===\n");
            
            // Using abstract class
            Console.WriteLine("--- Database Operations ---");
            DatabaseConnection db = new SqlServerConnection("Server=localhost;Database=Test");
            db.ExecuteQuery("SELECT * FROM Users");
            
            // Using interfaces
            Console.WriteLine("\n--- Payment Processing ---");
            
            // Interface abstraction
            IPaymentProcessor processor = new CreditCardProcessor();
            processor.ProcessPayment(1500m);
            processor.Refund(100m);
            
            // Using default interface method
            processor.LogTransaction(2000m, true);
            
            // Multiple interfaces
            if (processor is IFraudDetectable fraudDetectable)
            {
                bool isFraud = fraudDetectable.CheckFraud(15000m, "CUST001");
                Console.WriteLine($"Fraud check result: {isFraud}");
            }
            
            // Factory method via interface static method
            IPaymentProcessor defaultProcessor = IPaymentProcessor.CreateDefault();
            defaultProcessor.ProcessPayment(500m);
            
            // Template method pattern with abstract class
            Console.WriteLine("\n--- Report Generation ---");
            
            ReportGenerator pdfReport = new PdfReportGenerator();
            pdfReport.GenerateReport();
            
            Console.WriteLine();
            
            ReportGenerator excelReport = new ExcelReportGenerator();
            excelReport.GenerateReport();
            
            // Sealed class
            Console.WriteLine("\n--- Configuration Manager (Sealed) ---");
            var config = ConfigurationManager.Instance;
            Console.WriteLine(config.GetSetting("DatabaseConnection"));
            
            // Cannot inherit from sealed class
            // class CustomConfig : ConfigurationManager {} // Error!
        }
    }
}
          `,
          quiz: [
            {
              question: "When would you choose an abstract class over an interface?",
              options: [
                "Always choose abstract class",
                "When you need to provide common implementation",
                "When you need multiple inheritance",
                "Interfaces are always better"
              ],
              correctAnswer: 1,
              explanation: "Abstract classes are preferred when you want to provide common implementation that derived classes can share, while interfaces define contracts without implementation."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 4 – SOLID Principles in C#
    // =====================================================
    {
      id: "csharp-ch4",
      title: "SOLID Principles in C#",
      description: "Five principles of object-oriented design with practical examples",
      pages: [
        {
          id: "csharp-ch4-page1",
          title: "Single Responsibility Principle (SRP)",
          content: `
Single Responsibility Principle (SRP):

Definition: A class should have only one reason to change.

Key Concepts:
- Each class has one responsibility
- Class should be focused on one task
- Changes to one requirement should affect only one class

Benefits:
- Easier maintenance
- Better testability
- Reduced coupling
- Clearer code organization

Signs of SRP violation:
- Large classes with many methods
- Class with unrelated functionality
- Multiple reasons to change
- Long parameter lists

Examples of responsibilities:
- Data access
- Business logic
- Validation
- Logging
- Formatting
- Notification
          `,
          exampleCode: `
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Mail;

namespace SRPDemo
{
    // ===== VIOLATION OF SRP =====
    // This class has multiple responsibilities
    public class UserService_Bad
    {
        public void RegisterUser(string username, string email, string password)
        {
            // Responsibility 1: Validation
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("All fields are required");
            }
            
            if (!email.Contains("@"))
            {
                throw new ArgumentException("Invalid email");
            }
            
            // Responsibility 2: Database operations
            // Save to database
            Console.WriteLine($"Saving user {username} to database");
            
            // Responsibility 3: Logging
            Console.WriteLine($"User {username} registered at {DateTime.Now}");
            
            // Responsibility 4: Email notification
            try
            {
                SmtpClient client = new SmtpClient("smtp.gmail.com");
                MailMessage message = new MailMessage("noreply@example.com", email)
                {
                    Subject = "Welcome",
                    Body = "Thank you for registering"
                };
                client.Send(message);
                Console.WriteLine("Welcome email sent");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
            }
            
            // Responsibility 5: File logging
            File.AppendAllText("log.txt", $"User {username} registered at {DateTime.Now}\\n");
        }
    }
    
    // ===== GOOD DESIGN FOLLOWING SRP =====
    
    // Responsibility 1: User entity
    public class User
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    // Responsibility 2: User validation
    public class UserValidator
    {
        public ValidationResult Validate(User user)
        {
            var errors = new List<string>();
            
            if (string.IsNullOrEmpty(user.Username))
                errors.Add("Username is required");
            
            if (string.IsNullOrEmpty(user.Email))
                errors.Add("Email is required");
            else if (!user.Email.Contains("@"))
                errors.Add("Invalid email format");
            
            if (string.IsNullOrEmpty(user.Password) || user.Password.Length < 6)
                errors.Add("Password must be at least 6 characters");
            
            return new ValidationResult 
            { 
                IsValid = errors.Count == 0, 
                Errors = errors 
            };
        }
    }
    
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; }
    }
    
    // Responsibility 3: User repository (data access)
    public interface IUserRepository
    {
        void Save(User user);
        User GetByUsername(string username);
    }
    
    public class UserRepository : IUserRepository
    {
        private List<User> _users = new List<User>();
        
        public void Save(User user)
        {
            user.CreatedAt = DateTime.Now;
            _users.Add(user);
            Console.WriteLine($"User {user.Username} saved to database");
        }
        
        public User GetByUsername(string username)
        {
            return _users.Find(u => u.Username == username);
        }
    }
    
    // Responsibility 4: Email service
    public interface IEmailService
    {
        void SendWelcomeEmail(string email, string username);
    }
    
    public class EmailService : IEmailService
    {
        public void SendWelcomeEmail(string email, string username)
        {
            try
            {
                // In real app, configure SMTP properly
                Console.WriteLine($"Sending welcome email to {email} for user {username}");
                // SmtpClient logic here
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email failed: {ex.Message}");
                throw;
            }
        }
    }
    
    // Responsibility 5: Logger
    public interface ILogger
    {
        void Log(string message);
    }
    
    public class ConsoleLogger : ILogger
    {
        public void Log(string message)
        {
            Console.WriteLine($"[LOG] {DateTime.Now}: {message}");
        }
    }
    
    public class FileLogger : ILogger
    {
        private readonly string _filePath;
        
        public FileLogger(string filePath)
        {
            _filePath = filePath;
        }
        
        public void Log(string message)
        {
            File.AppendAllText(_filePath, $"{DateTime.Now}: {message}\\n");
        }
    }
    
    // Responsibility 6: User service orchestrator
    public class UserService
    {
        private readonly UserValidator _validator;
        private readonly IUserRepository _repository;
        private readonly IEmailService _emailService;
        private readonly ILogger _logger;
        
        public UserService(
            UserValidator validator,
            IUserRepository repository,
            IEmailService emailService,
            ILogger logger)
        {
            _validator = validator;
            _repository = repository;
            _emailService = emailService;
            _logger = logger;
        }
        
        public RegistrationResult RegisterUser(User user)
        {
            // Delegate validation
            var validationResult = _validator.Validate(user);
            if (!validationResult.IsValid)
            {
                return new RegistrationResult 
                { 
                    Success = false, 
                    Message = string.Join(", ", validationResult.Errors) 
                };
            }
            
            try
            {
                // Delegate to repository
                _repository.Save(user);
                
                // Delegate to email service
                _emailService.SendWelcomeEmail(user.Email, user.Username);
                
                // Delegate to logger
                _logger.Log($"User {user.Username} registered successfully");
                
                return new RegistrationResult { Success = true };
            }
            catch (Exception ex)
            {
                _logger.Log($"Registration failed: {ex.Message}");
                return new RegistrationResult 
                { 
                    Success = false, 
                    Message = "Registration failed due to internal error" 
                };
            }
        }
    }
    
    public class RegistrationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }
    
    // Program to demonstrate SRP
    class Program
    {
        static void Main()
        {
            Console.WriteLine("=== Single Responsibility Principle Demo ===\n");
            
            // Setup dependencies
            var validator = new UserValidator();
            var repository = new UserRepository();
            var emailService = new EmailService();
            var logger = new ConsoleLogger();
            
            // Create service with dependencies injected
            var userService = new UserService(validator, repository, emailService, logger);
            
            // Register a user
            var user = new User
            {
                Username = "john_doe",
                Email = "john@example.com",
                Password = "password123"
            };
            
            var result = userService.RegisterUser(user);
            
            Console.WriteLine($"\\nRegistration result: {(result.Success ? "Success" : "Failed")}");
            if (!string.IsNullOrEmpty(result.Message))
                Console.WriteLine($"Message: {result.Message}");
            
            // Show bad example (commented to avoid execution)
            Console.WriteLine("\\n--- Comparison ---");
            Console.WriteLine("Bad design: UserService_Bad handles validation, DB, email, logging - multiple reasons to change");
            Console.WriteLine("Good design: Each class has single responsibility, easier to maintain and test");
        }
    }
}
          `,
          quiz: [
            {
              question: "What does the Single Responsibility Principle state?",
              options: [
                "A class should do many things",
                "A class should have only one reason to change",
                "A class should be responsible for all operations",
                "A class should not have any methods"
              ],
              correctAnswer: 1,
              explanation: "SRP states that a class should have only one reason to change, meaning it should have only one responsibility or job."
            }
          ]
        },
        {
          id: "csharp-ch4-page2",
          title: "Open/Closed Principle (OCP)",
          content: `
Open/Closed Principle (OCP):

Definition: Classes should be open for extension but closed for modification.

Key Concepts:
- Add new functionality without changing existing code
- Extend behavior through inheritance or composition
- Use interfaces and abstract classes

Benefits:
- Reduce risk when adding features
- Increase code reusability
- Improve maintainability
- Support polymorphism

Implementation Strategies:
- Strategy Pattern
- Template Method Pattern
- Decorator Pattern
- Specification Pattern

Violation Signs:
- Switch/case or if/else chains based on type
- Modifying existing classes for new features
- Type checking with 'is' or 'as'
          `,
          exampleCode: `
using System;
using System.Collections.Generic;
using System.Linq;

namespace OCPDemo
{
    // ===== VIOLATION OF OCP =====
    public class DiscountCalculator_Bad
    {
        public decimal CalculateDiscount(string customerType, decimal amount)
        {
            // Every time we add new customer type, we modify this method
            if (customerType == "Regular")
            {
                return amount * 0.1m; // 10% discount
            }
            else if (customerType == "Premium")
            {
                return amount * 0.2m; // 20% discount
            }
            else if (customerType == "VIP")
            {
                return amount * 0.3m; // 30% discount
            }
            else if (customerType == "Employee")
            {
                return amount * 0.4m; // 40% discount
            }
            
            return 0;
        }
    }
    
    // ===== GOOD DESIGN FOLLOWING OCP =====
    
    // 1. Using inheritance
    public abstract class Customer
    {
        public string Name { get; set; }
        public abstract decimal GetDiscount(decimal amount);
    }
    
    public class RegularCustomer : Customer
    {
        public override decimal GetDiscount(decimal amount)
        {
            return amount * 0.1m;
        }
    }
    
    public class PremiumCustomer : Customer
    {
        public override decimal GetDiscount(decimal amount)
        {
            return amount * 0.2m;
        }
    }
    
    public class VIPCustomer : Customer
    {
        public override decimal GetDiscount(decimal amount)
        {
            return amount * 0.3m;
        }
    }
    
    // Adding new customer type - no modification needed!
    public class EmployeeCustomer : Customer
    {
        public override decimal GetDiscount(decimal amount)
        {
            return amount * 0.4m;
        }
    }
    
    public class SeniorCitizenCustomer : Customer
    {
        public override decimal GetDiscount(decimal amount)
        {
            return amount * 0.35m;
        }
    }
    
    public class DiscountCalculator
    {
        public decimal CalculateDiscount(Customer customer, decimal amount)
        {
            return customer.GetDiscount(amount);
        }
    }
    
    // 2. Using interface (Strategy Pattern)
    public interface IDiscountStrategy
    {
        decimal CalculateDiscount(decimal amount);
        string StrategyName { get; }
    }
    
    public class RegularDiscountStrategy : IDiscountStrategy
    {
        public string StrategyName => "Regular";
        public decimal CalculateDiscount(decimal amount) => amount * 0.1m;
    }
    
    public class PremiumDiscountStrategy : IDiscountStrategy
    {
        public string StrategyName => "Premium";
        public decimal CalculateDiscount(decimal amount) => amount * 0.2m;
    }
    
    public class SeasonalDiscountStrategy : IDiscountStrategy
    {
        public string StrategyName => "Seasonal";
        public decimal CalculateDiscount(decimal amount) => amount * 0.25m;
    }
    
    public class BulkDiscountStrategy : IDiscountStrategy
    {
        private readonly int _minQuantity;
        public BulkDiscountStrategy(int minQuantity)
        {
            _minQuantity = minQuantity;
        }
        
        public string StrategyName => "Bulk";
        
        public decimal CalculateDiscount(decimal amount)
        {
            // Additional logic can be added without changing existing code
            return amount * 0.15m;
        }
    }
    
    public class Order
    {
        public Customer Customer { get; set; }
        public List<OrderItem> Items { get; set; }
        public IDiscountStrategy DiscountStrategy { get; set; }
        
        public decimal CalculateTotal()
        {
            decimal subtotal = Items.Sum(i => i.Price * i.Quantity);
            
            if (DiscountStrategy != null)
            {
                decimal discount = DiscountStrategy.CalculateDiscount(subtotal);
                return subtotal - discount;
            }
            
            return subtotal;
        }
    }
    
    public class OrderItem
    {
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
    
    // 3. Template Method Pattern
    public abstract class DataExporter
    {
        // Template method - closed for modification
        public void ExportData(string data)
        {
            ValidateData(data);
            TransformData(data);
            FormatData(data);
            WriteData(data);
            LogExport(data);
        }
        
        // These steps can be extended without modifying the template
        protected virtual void ValidateData(string data)
        {
            if (string.IsNullOrEmpty(data))
                throw new ArgumentException("Data cannot be empty");
        }
        
        protected abstract void TransformData(string data);
        protected abstract void FormatData(string data);
        protected abstract void WriteData(string data);
        
        protected virtual void LogExport(string data)
        {
            Console.WriteLine($"Data exported at {DateTime.Now}");
        }
    }
    
    public class CsvExporter : DataExporter
    {
        protected override void TransformData(string data)
        {
            Console.WriteLine("Transforming data for CSV format");
        }
        
        protected override void FormatData(string data)
        {
            Console.WriteLine("Formatting as CSV with commas");
        }
        
        protected override void WriteData(string data)
        {
            Console.WriteLine("Writing to CSV file");
        }
    }
    
    public class JsonExporter : DataExporter
    {
        protected override void TransformData(string data)
        {
            Console.WriteLine("Preparing data for JSON");
        }
        
        protected override void FormatData(string data)
        {
            Console.WriteLine("Formatting as JSON with proper structure");
        }
        
        protected override void WriteData(string data)
        {
            Console.WriteLine("Writing to JSON file");
        }
        
        protected override void LogExport(string data)
        {
            base.LogExport(data);
            Console.WriteLine("JSON export completed successfully");
        }
    }
    
    // 4. Specification Pattern
    public interface ISpecification<T>
    {
        bool IsSatisfiedBy(T entity);
    }
    
    public class CustomerEligibilitySpecification : ISpecification<Customer>
    {
        private readonly DateTime _minimumJoinDate;
        
        public CustomerEligibilitySpecification(DateTime minimumJoinDate)
        {
            _minimumJoinDate = minimumJoinDate;
        }
        
        public bool IsSatisfiedBy(Customer customer)
        {
            // This can be extended with new rules without changing the interface
            return customer.CreatedAt <= _minimumJoinDate;
        }
    }
    
   
    
    // Helper class from previous example
    public class ReadOnlyProductRepository : IReadableRepository<Product>
    {
        private List<Product> _products = new List<Product>();
        
        public ReadOnlyProductRepository()
        {
            _products.Add(new Product { Id = 1, Name = "Laptop", Price = 1200m });
            _products.Add(new Product { Id = 2, Name = "Mouse", Price = 25m });
        }
        
        public Product GetById(int id)
        {
            return _products.Find(p => p.Id == id);
        }
        
        public IEnumerable<Product> GetAll()
        {
            return _products;
        }
    }
}
          `,
          quiz: [
            {
              question: "What problem does the Interface Segregation Principle solve?",
              options: [
                "Too many small interfaces",
                "Classes implementing methods they don't need",
                "Too much inheritance",
                "Performance issues"
              ],
              correctAnswer: 1,
              explanation: "ISP solves the problem of 'fat' interfaces forcing classes to implement methods they don't need, often resulting in empty methods or exceptions."
            }
          ]
        },
        {
          id: "csharp-ch4-page5",
          title: "Dependency Inversion Principle (DIP)",
          content: `
Dependency Inversion Principle (DIP):

Definition: 
1. High-level modules should not depend on low-level modules. Both should depend on abstractions.
2. Abstractions should not depend on details. Details should depend on abstractions.

Key Concepts:
- Depend on interfaces/abstract classes, not concrete classes
- Decouple modules through abstractions
- Invert traditional dependency direction

Benefits:
- Loose coupling
- Better testability (easy mocking)
- Flexibility to change implementations
- Parallel development
- Reusable components

Implementation:
- Dependency Injection (Constructor, Property, Method)
- Service Locator (anti-pattern? debated)
- Factory Pattern
- Abstract Factory Pattern

Common Patterns:
- Constructor Injection (most common)
- Property Injection
- Method Injection
          `,
          exampleCode: `
using System;
using System.Collections.Generic;
using System.Linq;

namespace DIPDemo
{
    // ===== VIOLATION OF DIP =====
    
    // Low-level module
    public class EmailSender_Bad
    {
        public void SendEmail(string to, string subject, string body)
        {
            // Direct implementation - concrete class
            Console.WriteLine($"Sending email to {to}: {subject}");
            // Actual SMTP logic would be here
        }
    }
    
    // High-level module depends directly on low-level module
    public class UserService_Bad
    {
        private EmailSender_Bad _emailSender; // Direct dependency on concrete class
        
        public UserService_Bad()
        {
            _emailSender = new EmailSender_Bad(); // Tight coupling
        }
        
        public void RegisterUser(string username, string email)
        {
            // Business logic
            Console.WriteLine($"User {username} registered");
            
            // Direct dependency - can't easily change to SMS or different email service
            _emailSender.SendEmail(email, "Welcome", "Thank you for registering");
        }
    }
    
    // Another violation - depending on concrete repository
    public class SqlUserRepository_Bad
    {
        public void Save(User user)
        {
            Console.WriteLine($"Saving user to SQL database: {user.Username}");
        }
        
        public User GetById(int id)
        {
            Console.WriteLine("Getting user from SQL database");
            return new User();
        }
    }
    
    public class UserManager_Bad
    {
        private SqlUserRepository_Bad _repository; // Depends on concrete class
        
        public UserManager_Bad()
        {
            _repository = new SqlUserRepository_Bad(); // Tight coupling
        }
        
        public void CreateUser(User user)
        {
            _repository.Save(user);
        }
    }
    
    // ===== GOOD DESIGN FOLLOWING DIP =====
    
    // Abstractions
    public interface IMessageSender
    {
        void SendMessage(string to, string subject, string body);
    }
    
    public interface IUserRepository
    {
        void Save(User user);
        User GetById(int id);
        User GetByEmail(string email);
    }
    
    public interface INotificationService
    {
        void NotifyUser(string userId, string message);
    }
    
    // Domain model
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    // Low-level modules implementing abstractions
    public class EmailSender : IMessageSender
    {
        private readonly string _smtpServer;
        private readonly int _port;
        
        public EmailSender(string smtpServer, int port)
        {
            _smtpServer = smtpServer;
            _port = port;
        }
        
        public void SendMessage(string to, string subject, string body)
        {
            // Implementation details
            Console.WriteLine($"[Email] To: {to}, Subject: {subject}");
            Console.WriteLine($"Using SMTP server: {_smtpServer}:{_port}");
            // Actual email sending logic
        }
    }
    
    public class SmsSender : IMessageSender
    {
        private readonly string _apiKey;
        
        public SmsSender(string apiKey)
        {
            _apiKey = apiKey;
        }
        
        public void SendMessage(string to, string subject, string body)
        {
            // SMS doesn't use subject, but interface allows it
            Console.WriteLine($"[SMS] To: {to}, Body: {body}");
            Console.WriteLine($"Using SMS API with key: {_apiKey}");
        }
    }
    
    public class PushNotificationSender : IMessageSender
    {
        public void SendMessage(string to, string subject, string body)
        {
            Console.WriteLine($"[Push] Device: {to}, Message: {body}");
        }
    }
    
    // Repository implementations
    public class SqlUserRepository : IUserRepository
    {
        private readonly string _connectionString;
        private List<User> _users = new List<User>(); // Simulated database
        
        public SqlUserRepository(string connectionString)
        {
            _connectionString = connectionString;
        }
        
        public void Save(User user)
        {
            if (user.Id == 0)
            {
                user.Id = _users.Count + 1;
                user.CreatedAt = DateTime.Now;
                _users.Add(user);
                Console.WriteLine($"User saved to SQL database: {user.Username}");
            }
            else
            {
                var existing = _users.FirstOrDefault(u => u.Id == user.Id);
                if (existing != null)
                {
                    existing.Username = user.Username;
                    existing.Email = user.Email;
                    Console.WriteLine($"User updated in SQL database: {user.Username}");
                }
            }
        }
        
        public User GetById(int id)
        {
            Console.WriteLine($"Retrieving user {id} from SQL database");
            return _users.FirstOrDefault(u => u.Id == id);
        }
        
        public User GetByEmail(string email)
        {
            return _users.FirstOrDefault(u => u.Email == email);
        }
    }
    
    public class MongoUserRepository : IUserRepository
    {
        private readonly string _connectionString;
        
        public MongoUserRepository(string connectionString)
        {
            _connectionString = connectionString;
        }
        
        public void Save(User user)
        {
            Console.WriteLine($"User saved to MongoDB: {user.Username}");
        }
        
        public User GetById(int id)
        {
            Console.WriteLine($"Retrieving user {id} from MongoDB");
            return new User();
        }
        
        public User GetByEmail(string email)
        {
            Console.WriteLine($"Retrieving user by email {email} from MongoDB");
            return new User();
        }
    }
    
    // High-level module depending on abstractions
    public class UserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMessageSender _messageSender;
        private readonly ILogger _logger; // From SRP example
        
        // Constructor injection - dependencies provided from outside
        public UserService(
            IUserRepository userRepository,
            IMessageSender messageSender,
            ILogger logger)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _messageSender = messageSender ?? throw new ArgumentNullException(nameof(messageSender));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public void RegisterUser(string username, string email)
        {
            // Validate
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email))
                throw new ArgumentException("Invalid user data");
            
            // Check if user exists
            var existingUser = _userRepository.GetByEmail(email);
            if (existingUser != null)
                throw new InvalidOperationException("User already exists");
            
            // Create user
            var user = new User
            {
                Username = username,
                Email = email,
                CreatedAt = DateTime.Now
            };
            
            // Save using abstraction
            _userRepository.Save(user);
            
            // Send notification using abstraction
            _messageSender.SendMessage(email, "Welcome", $"Hello {username}, thanks for registering!");
            
            // Log using abstraction
            _logger.Log($"User {username} registered successfully");
        }
        
        // Property injection example
        public INotificationService NotificationService { get; set; }
        
        // Method injection example
        public void SendPromotionalEmail(IUserRepository repository, IMessageSender sender)
        {
            var users = repository.GetAll(); // Would need GetAll in interface
            
            foreach (var user in users)  // This won't compile unless we add GetAll
            {
                // sender.SendMessage(user.Email, "Promotion", "Special offer!");
            }
        }
    }
    
    // Extension method for repository (if needed)
    public static class UserRepositoryExtensions
    {
        public static IEnumerable<User> GetAll(this IUserRepository repository)
        {
            // Implementation would need actual method in interface
            yield break;
        }
    }
    
    // Dependency Injection Container simulation
    public class DIContainer
    {
        private Dictionary<Type, Func<object>> _registrations = new Dictionary<Type, Func<object>>();
        
        public void Register<TService, TImplementation>() where TImplementation : TService
        {
            _registrations[typeof(TService)] = () => Activator.CreateInstance<TImplementation>();
        }
        
        public void Register<TService>(Func<object> factory)
        {
            _registrations[typeof(TService)] = factory;
        }
        
        public TService Resolve<TService>()
        {
            if (_registrations.TryGetValue(typeof(TService), out var factory))
            {
                return (TService)factory();
            }
            
            throw new InvalidOperationException($"Service {typeof(TService)} not registered");
        }
    }
    
    // Logger interface (from SRP example)
    public interface ILogger
    {
        void Log(string message);
    }
    
    public class ConsoleLogger : ILogger
    {
        public void Log(string message)
        {
            Console.WriteLine($"[LOG] {DateTime.Now}: {message}");
        }
    }
    
    class Program
    {
        static void Main()
        {
            Console.WriteLine("=== Dependency Inversion Principle Demo ===\n");
            
            // Manual dependency injection (poor man's DI)
            Console.WriteLine("--- Manual Dependency Injection ---");
            
            ILogger logger = new ConsoleLogger();
            IUserRepository sqlRepo = new SqlUserRepository("Server=localhost;Database=Users");
            IMessageSender emailSender = new EmailSender("smtp.gmail.com", 587);
            
            var userService = new UserService(sqlRepo, emailSender, logger);
            userService.RegisterUser("john_doe", "john@example.com");
            
            // Switching to different implementations
            Console.WriteLine("\n--- Switching to different implementations ---");
            
            IUserRepository mongoRepo = new MongoUserRepository("mongodb://localhost:27017");
            IMessageSender smsSender = new SmsSender("api-key-12345");
            
            var anotherService = new UserService(mongoRepo, smsSender, logger);
            anotherService.RegisterUser("jane_doe", "jane@example.com");
            
            // Using different combinations
            Console.WriteLine("\n--- Different combinations ---");
            
            var service1 = new UserService(sqlRepo, smsSender, logger);
            service1.RegisterUser("bob", "bob@example.com");
            
            var service2 = new UserService(mongoRepo, emailSender, logger);
            service2.RegisterUser("alice", "alice@example.com");
            
            // With factory pattern
            Console.WriteLine("\n--- Factory Pattern Integration ---");
            
            Func<IMessageSender> senderFactory = () =>
            {
                // Complex logic to decide which sender to use
                if (DateTime.Now.Hour < 12)
                    return new EmailSender("smtp.gmail.com", 587);
                else
                    return new SmsSender("api-key");
            };
            
            var serviceWithFactory = new UserService(sqlRepo, senderFactory(), logger);
            
            // Dependency Injection Container simulation
            Console.WriteLine("\n--- DI Container Simulation ---");
            
            var container = new DIContainer();
            container.Register<ILogger, ConsoleLogger>();
            container.Register<IUserRepository>(() => new SqlUserRepository("conn-string"));
            container.Register<IMessageSender>(() => new EmailSender("smtp", 25));
            
            var resolvedService = new UserService(
                container.Resolve<IUserRepository>(),
                container.Resolve<IMessageSender>(),
                container.Resolve<ILogger>());
            
            Console.WriteLine("\n--- DIP Benefits ---");
            Console.WriteLine("✓ High-level modules don't depend on low-level details");
            Console.WriteLine("✓ Easy to swap implementations");
            Console.WriteLine("✓ Excellent testability (can mock dependencies)");
            Console.WriteLine("✓ Loose coupling between layers");
            Console.WriteLine("✓ Configuration-driven behavior");
        }
    }
}
          `,
          quiz: [
            {
              question: "What does the Dependency Inversion Principle state?",
              options: [
                "High-level modules should depend on low-level modules",
                "Both high and low-level modules should depend on abstractions",
                "Abstractions should depend on details",
                "Never use interfaces"
              ],
              correctAnswer: 1,
              explanation: "DIP states that both high-level and low-level modules should depend on abstractions, not on concrete implementations."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 5 – Advanced C# Features
    // =====================================================
    {
      id: "csharp-ch5",
      title: "Advanced C# Features",
      description: "Modern C# features, delegates, events, LINQ, async programming",
      pages: [
        {
          id: "csharp-ch5-page1",
          title: "Delegates and Events",
          content: `
Delegates and Events in C#:

Delegates:
- Type-safe function pointers
- Hold reference to methods
- Support multicast (multiple methods)
- Foundation for events and callbacks

Delegate Types:
- Singlecast delegate (one method)
- Multicast delegate (multiple methods)
- Generic delegates (Func, Action, Predicate)

Built-in Delegates:
- Action<T> – returns void
- Func<T, TResult> – returns value
- Predicate<T> – returns bool

Events:
- Based on delegates
- Publisher/subscriber pattern
- Encapsulate delegate invocation
- += and -= operators

EventHandler Pattern:
- EventHandler<T> delegate
- Custom event args
- Standard .NET pattern

Anonymous Methods and Lambda:
- Inline method definitions
- Lambda expressions (=>)
- Closure (capture variables)
          `,
          exampleCode: `
using System;
using System.Collections.Generic;
using System.Threading;

namespace DelegatesEventsDemo
{
    // Custom delegate declaration
    public delegate void MessageHandler(string message);
    public delegate int MathOperation(int a, int b);
    public delegate bool FilterDelegate(int number);
    
    // Custom EventArgs
    public class ProcessEventArgs : EventArgs
    {
        public int Progress { get; set; }
        public string Stage { get; set; }
        public DateTime Timestamp { get; set; }
    }
    
    // Publisher class
    public class Process
    {
        // Event using EventHandler<T>
        public event EventHandler<ProcessEventArgs> ProcessChanged;
        public event EventHandler ProcessCompleted;
        
        // Custom delegate event
        public event MessageHandler StatusUpdated;
        
        // Simple delegate (not event)
        public MessageHandler NotificationHandler;
        
        public void StartProcess()
        {
            Console.WriteLine("Process started...");
            
            for (int i = 0; i <= 100; i += 20)
            {
                Thread.Sleep(500); // Simulate work
                
                // Raise event
                OnProcessChanged(new ProcessEventArgs
                {
                    Progress = i,
                    Stage = i < 100 ? "Processing" : "Finishing",
                    Timestamp = DateTime.Now
                });
                
                // Invoke delegate
                NotificationHandler?.Invoke($"Progress: {i}%");
            }
            
            OnProcessCompleted(EventArgs.Empty);
        }
        
        protected virtual void OnProcessChanged(ProcessEventArgs e)
        {
            ProcessChanged?.Invoke(this, e);
        }
        
        protected virtual void OnProcessCompleted(EventArgs e)
        {
            ProcessCompleted?.Invoke(this, e);
        }
    }
    
    // Subscriber classes
    public class Logger
    {
        public void Subscribe(Process process)
        {
            process.ProcessChanged += OnProcessChanged;
            process.ProcessCompleted += OnProcessCompleted;
            process.StatusUpdated += OnStatusUpdated;
        }
        
        private void OnProcessChanged(object sender, ProcessEventArgs e)
        {
            Console.WriteLine($"[Logger] {e.Stage}: {e.Progress}% at {e.Timestamp:T}");
        }
        
        private void OnProcessCompleted(object sender, EventArgs e)
        {
            Console.WriteLine("[Logger] Process completed!");
        }
        
        private void OnStatusUpdated(string message)
        {
            Console.WriteLine($"[Logger] Status: {message}");
        }
    }
    
    public class UI
    {
        public void Subscribe(Process process)
        {
            process.ProcessChanged += UpdateProgressBar;
            process.ProcessCompleted += ShowCompletionMessage;
            process.StatusUpdated += DisplayNotification;
        }
        
        private void UpdateProgressBar(object sender, ProcessEventArgs e)
        {
            Console.WriteLine($"[UI] Progress bar: [{new string('=', e.Progress / 10)}{new string(' ', 10 - e.Progress / 10)}]");
        }
        
        private void ShowCompletionMessage(object sender, EventArgs e)
        {
            Console.WriteLine("[UI] ✓ Process completed successfully!");
        }
        
        private void DisplayNotification(string message)
        {
            Console.WriteLine($"[UI] Notification: {message}");
        }
    }
    
    // Built-in delegates demo
    public class DelegateDemo
    {
        // Action - returns void
        public Action<string> PrintAction;
        
        // Func - returns value
        public Func<int, int, int> AddFunc;
        
        // Predicate - returns bool
        public Predicate<int> IsEvenPredicate;
        
        public void DemonstrateBuiltInDelegates()
        {
            // Action
            PrintAction = message => Console.WriteLine($"Message: {message}");
            PrintAction("Hello from Action!");
            
            // Func
            AddFunc = (a, b) => a + b;
            int result = AddFunc(5, 3);
            Console.WriteLine($"Func result: {result}");
            
            // Predicate
            IsEvenPredicate = num => num % 2 == 0;
            bool isEven = IsEvenPredicate(4);
            Console.WriteLine($"Is 4 even? {isEven}");
        }
    }
    
    // LINQ with delegates
    public static class FilterExtensions
    {
        public static List<int> Filter(this List<int> numbers, FilterDelegate filter)
        {
            List<int> result = new List<int>();
            foreach (int num in numbers)
            {
                if (filter(num))
                    result.Add(num);
            }
            return result;
        }
    }
    
    // Async delegates
    public class AsyncDelegateDemo
    {
        public delegate int LongRunningOperation(int input);
        
        public void DemonstrateAsyncDelegate()
        {
            LongRunningOperation operation = (x) =>
            {
                Thread.Sleep(2000); // Simulate long work
                return x * x;
            };
            
            // BeginInvoke/EndInvoke pattern (legacy, but shows concept)
            IAsyncResult result = operation.BeginInvoke(5, null, null);
            
            Console.WriteLine("Doing other work while operation runs...");
            
            // Wait for completion
            int output = operation.EndInvoke(result);
            Console.WriteLine($"Async result: {output}");
        }
    }
    
    // Multicast delegate example
    public class MulticastDemo
    {
        public delegate void Notify(string message);
        
        public void DemonstrateMulticast()
        {
            Notify notifier = null;
            
            // Add methods to delegate chain
            notifier += (msg) => Console.WriteLine($"Method 1: {msg}");
            notifier += (msg) => Console.WriteLine($"Method 2: {msg}");
            notifier += (msg) => Console.WriteLine($"Method 3: {msg}");
            
            Console.WriteLine("Invoking multicast delegate:");
            notifier("Hello Multicast!");
            
            // Remove a method
            notifier -= (msg) => Console.WriteLine($"Method 2: {msg}"); // This won't remove - need same reference
            
            // Better approach with named methods
            Notify handler1 = Method1;
            Notify handler2 = Method2;
            
            Notify combined = handler1 + handler2;
            combined("Combined delegates");
        }
        
        private void Method1(string msg) => Console.WriteLine($"Method1: {msg}");
        private void Method2(string msg) => Console.WriteLine($"Method2: {msg}");
    }
    
    // Event best practices
    public class BankAccount
    {
        // Event declaration
        public event EventHandler<OverdraftEventArgs> OverdraftOccurred;
        public event EventHandler<TransactionEventArgs> TransactionProcessed;
        
        private decimal _balance;
        
        public decimal Balance
        {
            get => _balance;
            private set
            {
                _balance = value;
                OnBalanceChanged(EventArgs.Empty);
            }
        }
        
        // Standard event
        public event EventHandler BalanceChanged;
        
        public void Withdraw(decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Amount must be positive");
            
            if (amount > Balance)
            {
                // Raise overdraft event
                var args = new OverdraftEventArgs
                {
                    RequestedAmount = amount,
                    CurrentBalance = Balance,
                    IsAllowed = false
                };
                
                OnOverdraftOccurred(args);
                
                if (!args.IsAllowed)
                {
                    throw new InvalidOperationException("Insufficient funds");
                }
            }
            
            decimal oldBalance = Balance;
            Balance -= amount;
            
            // Raise transaction event
            OnTransactionProcessed(new TransactionEventArgs
            {
                Type = "Withdrawal",
                Amount = amount,
                OldBalance = oldBalance,
                NewBalance = Balance
            });
        }
        
        protected virtual void OnOverdraftOccurred(OverdraftEventArgs e)
        {
            OverdraftOccurred?.Invoke(this, e);
        }
        
        protected virtual void OnTransactionProcessed(TransactionEventArgs e)
        {
            TransactionProcessed?.Invoke(this, e);
        }
        
        protected virtual void OnBalanceChanged(EventArgs e)
        {
            BalanceChanged?.Invoke(this, e);
        }
    }
    
    public class OverdraftEventArgs : EventArgs
    {
        public decimal RequestedAmount { get; set; }
        public decimal CurrentBalance { get; set; }
        public bool IsAllowed { get; set; }
    }
    
    public class TransactionEventArgs : EventArgs
    {
        public string Type { get; set; }
        public decimal Amount { get; set; }
        public decimal OldBalance { get; set; }
        public decimal NewBalance { get; set; }
        
        public override string ToString()
        {
            return $"{Type}: {Amount:C}, Balance: {OldBalance:C} -> {NewBalance:C}";
        }
    }
    
    class Program
    {
        static void Main()
        {
            Console.WriteLine("=== Delegates and Events Demo ===\n");
            
            // Publisher-subscriber pattern
            Console.WriteLine("--- Event Pattern ---");
            var process = new Process();
            var logger = new Logger();
            var ui = new UI();
            
            logger.Subscribe(process);
            ui.Subscribe(process);
            
            // Also can subscribe with lambda
            process.ProcessCompleted += (sender, e) => 
                Console.WriteLine("[Lambda] Process completed notification");
            
            process.StartProcess();
            
            // Built-in delegates
            Console.WriteLine("\n--- Built-in Delegates ---");
            var delegateDemo = new DelegateDemo();
            delegateDemo.DemonstrateBuiltInDelegates();
            
            // LINQ with custom delegate
            Console.WriteLine("\n--- Delegate with LINQ ---");
            List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
            
            var evens = numbers.Filter(n => n % 2 == 0);
            Console.WriteLine("Even numbers: " + string.Join(", ", evens));
            
            var odds = numbers.Filter(n => n % 2 != 0);
            Console.WriteLine("Odd numbers: " + string.Join(", ", odds));
            
            // Multicast delegates
            Console.WriteLine("\n--- Multicast Delegates ---");
            var multicast = new MulticastDemo();
            multicast.DemonstrateMulticast();
            
            // Bank account with events
            Console.WriteLine("\n--- Bank Account Events ---");
            var account = new BankAccount();
            
            // Subscribe to events
            account.OverdraftOccurred += (sender, e) =>
            {
                Console.WriteLine($"⚠️ Overdraft attempt: Requested {e.RequestedAmount:C}, Balance: {e.CurrentBalance:C}");
                // Could allow overdraft for premium customers
                e.IsAllowed = e.CurrentBalance > -1000; // Allow $1000 overdraft
            };
            
            account.TransactionProcessed += (sender, e) =>
            {
                Console.WriteLine($"Transaction: {e}");
            };
            
            account.BalanceChanged += (sender, e) =>
            {
                Console.WriteLine($"Balance changed: {account.Balance:C}");
            };
            
            // Perform transactions
            try
            {
                // Need a way to add money first - let's add a deposit method
                // For demo, we'll use reflection or add method - simplified here
                Console.WriteLine("Account operations would go here");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
            
            // Anonymous methods and lambda closures
            Console.WriteLine("\n--- Closures ---");
            Func<int, Func<int, int>> add = x => y => x + y;
            
            var add5 = add(5);
            var add10 = add(10);
            
            Console.WriteLine($"add5(3): {add5(3)}");
            Console.WriteLine($"add10(3): {add10(3)}");
            
            // Delegate covariance and contravariance
            Console.WriteLine("\n--- Covariance and Contravariance ---");
            
            // Covariance - return more derived type
            Func<object> getObject = () => "Hello"; // string derives from object
            object obj = getObject();
            Console.WriteLine($"Covariance result: {obj}");
            
            // Contravariance - accept less derived type
            Action<string> printString = (s) => Console.WriteLine(s);
            Action<object> printObject = printString; // string is more specific
            printObject("Contravariance works!");
        }
    }
}
          `,
          quiz: [
            {
              question: "What is the main difference between a delegate and an event in C#?",
              options: [
                "They are the same thing",
                "Events cannot be assigned with =, only += and -=",
                "Delegates are only for static methods",
                "Events cannot have parameters"
              ],
              correctAnswer: 1,
              explanation: "Events encapsulate delegates and only allow += and -= operations from outside the class, providing better encapsulation and preventing accidental clearing of invocation list."
            }
          ]
        }
      ]
    }
  ]
};