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
export const htmlBook: Book = {
  id: "html-mastery",
  title: "HTML Mastery",
  subtitle: "Complete Guide from Beginner to Professional Web Structure Expert",
  author: "Web Development Experts",

  chapters: [

    // =====================================================
    // CHAPTER 1 – Introduction to HTML
    // =====================================================
    {
      id: "html-ch1",
      title: "Introduction to HTML",
      description: "Understanding how web pages are structured",
      pages: [
        {
          id: "html-ch1-page1",
          title: "What is HTML?",
          content: `
HTML (HyperText Markup Language) is the standard markup language used to create web pages.

HTML is not a programming language. It is a markup language used to structure content on the web.

HTML defines:
- Headings
- Paragraphs
- Links
- Images
- Tables
- Forms
- Multimedia
- Page layout

HTML works together with:
- CSS (for styling)
- JavaScript (for interactivity)

Browsers read HTML files and render them visually.
          `,
          exampleCode: `
<!DOCTYPE html>
<html>
<head>
  <title>My First Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is my first HTML page.</p>
</body>
</html>
          `,
          keyPoints: [
            "HTML structures web content",
            "It is not a programming language",
            "Browsers interpret HTML",
            "Works with CSS and JavaScript"
          ],
          quiz: [
            {
              question: "What does HTML stand for?",
              options: [
                "HyperText Markup Language",
                "HighText Machine Language",
                "Hyper Tool Markup Language",
                "Home Text Markup Language"
              ],
              correctAnswer: 0,
              explanation: "HTML stands for HyperText Markup Language."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 2 – HTML Structure & Elements
    // =====================================================
    {
      id: "html-ch2",
      title: "HTML Structure & Basic Elements",
      description: "Understanding elements, tags and document structure",
      pages: [
        {
          id: "html-ch2-page1",
          title: "HTML Document Structure",
          content: `
Every HTML document follows a standard structure.

Key parts:

1. <!DOCTYPE html> – Declares HTML5
2. <html> – Root element
3. <head> – Metadata section
4. <body> – Visible content

The head contains:
- title
- meta tags
- link to CSS
- scripts

The body contains visible content.
          `,
          exampleCode: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="HTML Learning">
  <title>HTML Structure</title>
</head>
<body>
  <h1>Welcome</h1>
</body>
</html>
          `,
          quiz: [
            {
              question: "Which section contains visible content?",
              options: ["head", "body", "html", "meta"],
              correctAnswer: 1,
              explanation: "The body contains visible content."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 3 – Text Formatting & Lists
    // =====================================================
    {
      id: "html-ch3",
      title: "Text Formatting & Lists",
      description: "Working with text and lists",
      pages: [
        {
          id: "html-ch3-page1",
          title: "Headings, Paragraphs & Formatting",
          content: `
HTML provides 6 heading levels:
<h1> to <h6>

Text formatting tags:
- <strong> (important text)
- <em> (emphasized text)
- <b> (bold)
- <i> (italic)
- <mark> (highlight)
- <small>
- <del>

Use semantic tags over visual-only tags.
          `,
          exampleCode: `
<h1>Main Heading</h1>
<p>This is <strong>important</strong> text.</p>
<p>This is <em>emphasized</em> text.</p>
          `,
          quiz: [
            {
              question: "Which tag is semantic for important text?",
              options: ["b", "strong", "i", "bold"],
              correctAnswer: 1,
              explanation: "<strong> is semantic."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 4 – Links & Images
    // =====================================================
    {
      id: "html-ch4",
      title: "Links & Images",
      description: "Creating navigation and adding images",
      pages: [
        {
          id: "html-ch4-page1",
          title: "Anchor Tag & Image Tag",
          content: `
<a> tag creates hyperlinks.

Attributes:
- href
- target
- rel

<img> tag embeds images.

Attributes:
- src
- alt
- width
- height

Always provide alt text for accessibility.
          `,
          exampleCode: `
<a href="https://google.com" target="_blank">Visit Google</a>

<img src="image.jpg" alt="Nature Image" width="300">
          `,
          quiz: [
            {
              question: "Which attribute is required for accessibility?",
              options: ["width", "height", "alt", "border"],
              correctAnswer: 2,
              explanation: "alt provides accessibility."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 5 – Tables
    // =====================================================
    {
      id: "html-ch5",
      title: "Tables",
      description: "Displaying tabular data",
      pages: [
        {
          id: "html-ch5-page1",
          title: "Table Structure",
          content: `
Table elements:
- <table>
- <tr> (row)
- <th> (header cell)
- <td> (data cell)
- <thead>
- <tbody>
- <tfoot>

Attributes:
- colspan
- rowspan
          `,
          exampleCode: `
<table border="1">
  <tr>
    <th>Name</th>
    <th>Age</th>
  </tr>
  <tr>
    <td>John</td>
    <td>25</td>
  </tr>
</table>
          `,
          quiz: [
            {
              question: "Which tag defines table header?",
              options: ["td", "tr", "th", "thead"],
              correctAnswer: 2,
              explanation: "<th> defines header."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 6 – Forms (Detailed)
    // =====================================================
    {
      id: "html-ch6",
      title: "Forms & Input Elements",
      description: "Collecting user input",
      pages: [
        {
          id: "html-ch6-page1",
          title: "Form Elements",
          content: `
Forms collect user input.

Important elements:
- <form>
- <input>
- <textarea>
- <select>
- <option>
- <button>
- <label>

Input types:
- text
- password
- email
- number
- radio
- checkbox
- date
- file
          `,
          exampleCode: `
<form>
  <label>Email:</label>
  <input type="email" required>

  <label>Password:</label>
  <input type="password">

  <button type="submit">Submit</button>
</form>
          `,
          quiz: [
            {
              question: "Which input type validates email?",
              options: ["text", "mail", "email", "string"],
              correctAnswer: 2,
              explanation: "email type validates format."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 7 – Semantic HTML
    // =====================================================
    {
      id: "html-ch7",
      title: "Semantic HTML",
      description: "Improving structure and SEO",
      pages: [
        {
          id: "html-ch7-page1",
          title: "Semantic Elements",
          content: `
Semantic tags improve accessibility and SEO.

Important tags:
- <header>
- <nav>
- <main>
- <section>
- <article>
- <aside>
- <footer>

Benefits:
- Better SEO
- Better accessibility
- Cleaner structure
          `,
          exampleCode: `
<header>
  <h1>Website Title</h1>
</header>

<main>
  <section>
    <article>
      <h2>Blog Post</h2>
      <p>Content...</p>
    </article>
  </section>
</main>
          `,
          quiz: [
            {
              question: "Which tag defines navigation?",
              options: ["nav", "menu", "section", "aside"],
              correctAnswer: 0,
              explanation: "<nav> defines navigation."
            }
          ]
        }
      ]
    },

    // =====================================================
    // CHAPTER 8 – Multimedia
    // =====================================================
    {
      id: "html-ch8",
      title: "Audio & Video",
      description: "Embedding multimedia",
      pages: [
        {
          id: "html-ch8-page1",
          title: "Audio & Video Tags",
          content: `
HTML5 provides:
- <audio>
- <video>
- <source>

Attributes:
- controls
- autoplay
- loop
- muted
          `,
          exampleCode: `
<video width="400" controls>
  <source src="movie.mp4" type="video/mp4">
</video>
          `,
          quiz: [
            {
              question: "Which tag plays video?",
              options: ["media", "movie", "video", "play"],
              correctAnswer: 2,
              explanation: "<video> plays videos."
            }
          ]
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "Difference between HTML and HTML5?",
      answer: "HTML5 introduced semantic elements, audio/video support, canvas, local storage, and better form validation.",
      difficulty: "beginner"
    },
    {
      question: "What are semantic tags?",
      answer: "Semantic tags describe meaning of content, such as header, article, footer.",
      difficulty: "intermediate"
    },
    {
      question: "What is accessibility in HTML?",
      answer: "Accessibility ensures web content is usable by people with disabilities using alt text, labels, ARIA roles.",
      difficulty: "intermediate"
    }
  ],

  finalAssessment: [
    {
      question: "Which tag creates hyperlink?",
      options: ["link", "href", "a", "url"],
      correctAnswer: 2,
      explanation: "<a> creates hyperlink."
    },
    {
      question: "Which tag defines table row?",
      options: ["td", "tr", "th", "row"],
      correctAnswer: 1,
      explanation: "<tr> defines row."
    }
  ]
};