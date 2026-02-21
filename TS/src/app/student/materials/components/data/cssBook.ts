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
  chapterQuiz?: Quiz[];
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  chapters: Chapter[];
  interviewQuestions?: InterviewQuestion[];
  finalAssessment?: Quiz[];
}

export const cssBook: Book = {
  id: "css-mastery",
  title: "CSS Mastery",
  subtitle: "Complete Guide from Basics to Advanced Layouts & Animations",
  author: "Frontend Experts Team",

  chapters: [
    // ===============================
    // CHAPTER 1 – CSS Fundamentals
    // ===============================
    {
      id: "css-ch1",
      title: "CSS Fundamentals",
      description: "Introduction to CSS, selectors, and basic styling",
      pages: [
        {
          id: "css-ch1-page1",
          title: "What is CSS? & Syntax",
          content: `
## What is CSS?
CSS (Cascading Style Sheets) is the language used to style HTML elements and control the visual presentation of web pages.

## Basic Syntax:
selector {
  property: value;
}

## Three Ways to Apply CSS:
1. **Inline CSS** - Directly in HTML elements
2. **Internal CSS** - Within <style> tags in HTML head
3. **External CSS** - Separate .css file (Recommended)

## How CSS Works:
- Browser loads HTML
- Converts HTML to DOM
- Fetches CSS resources
- Parses CSS and applies rules
- Renders styled page

## Cascading Order:
1. **Importance** (!important)
2. **Specificity** (Inline > ID > Class > Element)
3. **Source Order** (Last rule wins)
          `,
          exampleCode: `<!-- Inline CSS -->
<h1 style="color: blue; font-size: 24px;">Hello World</h1>

<!-- Internal CSS -->
<style>
  h1 {
    color: blue;
    font-size: 24px;
  }
</style>

<!-- External CSS (style.css) -->
body {
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

h1 {
  color: #ff7a00;
  text-align: center;
  border-bottom: 2px solid #ff7a00;
  padding-bottom: 10px;
}

p {
  line-height: 1.6;
  color: #333;
  margin: 10px 0;
}`,
          keyPoints: [
            "CSS stands for Cascading Style Sheets",
            "External CSS is the best practice",
            "CSS follows cascading rules (last rule takes precedence)",
            "Selectors target HTML elements",
            "Properties and values define styles"
          ],
          quiz: [
            {
              question: "What does CSS stand for?",
              options: [
                "Creative Style Sheets",
                "Cascading Style Sheets",
                "Computer Style Syntax",
                "Colorful Style Sheets"
              ],
              correctAnswer: 1,
              explanation: "CSS stands for Cascading Style Sheets, which describes how HTML elements should be displayed."
            },
            {
              question: "Which method of applying CSS is recommended for large websites?",
              options: [
                "Inline CSS",
                "Internal CSS",
                "External CSS",
                "Inline and Internal both"
              ],
              correctAnswer: 2,
              explanation: "External CSS is recommended as it separates content from design and allows reusing styles across multiple pages."
            },
            {
              question: "What happens when two conflicting CSS rules target the same element?",
              options: [
                "Browser crashes",
                "First rule applies",
                "Last rule applies",
                "No style applies"
              ],
              correctAnswer: 2,
              explanation: "Due to cascading nature, the last rule defined in the source order typically applies, unless overridden by specificity or importance."
            }
          ]
        },
        {
          id: "css-ch1-page2",
          title: "CSS Selectors Deep Dive",
          content: `
## CSS Selectors - Complete Guide

### 1. Basic Selectors:
- **Universal Selector** (*) - Selects all elements
- **Element Selector** (div, p, h1) - Selects specific elements
- **Class Selector** (.className) - Selects elements with specific class
- **ID Selector** (#idName) - Selects element with specific ID

### 2. Combinators:
- **Descendant Selector** (div p) - Selects p inside div
- **Child Selector** (div > p) - Selects direct child p of div
- **Adjacent Sibling** (h1 + p) - Selects p immediately after h1
- **General Sibling** (h1 ~ p) - Selects all p after h1

### 3. Attribute Selectors:
- **[attr]** - Elements with attribute
- **[attr="value"]** - Exact match
- **[attr^="value"]** - Starts with
- **[attr$="value"]** - Ends with
- **[attr*="value"]** - Contains

### 4. Pseudo-classes:
- **:hover** - Mouse over
- **:focus** - Element focused
- **:first-child** - First child
- **:last-child** - Last child
- **:nth-child(n)** - Nth child
- **:not(selector)** - Negation

### 5. Pseudo-elements:
- **::before** - Insert before content
- **::after** - Insert after content
- **::first-line** - First line
- **::first-letter** - First letter
- **::selection** - Selected text

## Specificity Hierarchy:
1. **Inline styles** - 1000 points
2. **ID selectors** - 100 points
3. **Class selectors** - 10 points
4. **Element selectors** - 1 point
          `,
          exampleCode: `/* Universal Selector */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Element Selectors */
body {
  font-family: 'Segoe UI', sans-serif;
}

h1, h2, h3 {
  font-weight: 600;
  color: #333;
}

/* Class Selectors */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

/* ID Selector */
#header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
}

/* Combinators */
.container .card {
  margin: 10px;  /* Descendant */
}

.container > .card {
  border: 1px solid #ddd;  /* Child */
}

h1 + p {
  font-size: 1.2em;  /* Adjacent sibling */
  color: #666;
}

/* Attribute Selectors */
input[type="text"] {
  border: 1px solid #ccc;
  padding: 8px;
}

a[href^="https"] {
  color: green;
}

a[href$=".pdf"]::after {
  content: " (PDF)";
  font-size: 0.8em;
  color: red;
}

/* Pseudo-classes */
button:hover {
  background: #ff7a00;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #ff7a00;
  box-shadow: 0 0 5px rgba(255,122,0,0.3);
}

li:first-child {
  font-weight: bold;
}

li:last-child {
  border-bottom: none;
}

tr:nth-child(even) {
  background: #f9f9f9;
}

/* Pseudo-elements */
.quote::before {
  content: "❝";
  font-size: 2em;
  color: #ff7a00;
}

.quote::after {
  content: "❞";
  font-size: 2em;
  color: #ff7a00;
}

p::first-line {
  font-weight: bold;
  color: #ff7a00;
}

p::first-letter {
  font-size: 3em;
  float: left;
  margin-right: 5px;
  color: #ff7a00;
}

/* Specificity Examples */
#main .card p {
  color: blue;  /* Specificity: 100 + 10 + 1 = 111 */
}

.card p {
  color: red;   /* Specificity: 10 + 1 = 11 */
}

p {
  color: green; /* Specificity: 1 */
}
/* The paragraph will be blue because higher specificity */`,
          keyPoints: [
            "Universal selector (*) affects all elements",
            "Class selectors are reusable across multiple elements",
            "ID selectors are unique per page",
            "Specificity determines which rule applies",
            "Pseudo-classes style element states",
            "Pseudo-elements style specific parts of elements"
          ],
          quiz: [
            {
              question: "What is the specificity of the selector '#header .nav a'?",
              options: [
                "111",
                "100",
                "110",
                "101"
              ],
              correctAnswer: 0,
              explanation: "ID = 100, Class = 10, Element = 1 → Total 111"
            },
            {
              question: "Which pseudo-element is used to insert content before an element?",
              options: [
                ":before",
                "::before",
                ".before",
                "#before"
              ],
              correctAnswer: 1,
              explanation: "::before pseudo-element inserts content before the element's content"
            },
            {
              question: "What does the '~' selector do?",
              options: [
                "Selects direct children",
                "Selects adjacent siblings",
                "Selects all following siblings",
                "Selects parent elements"
              ],
              correctAnswer: 2,
              explanation: "The general sibling combinator (~) selects all elements that follow a specified element"
            }
          ]
        },
        {
          id: "css-ch1-page3",
          title: "Colors, Units & Typography",
          content: `
## CSS Colors

### Color Formats:
1. **Named Colors** - red, blue, transparent
2. **Hexadecimal** - #FF7A00, #333, #F00
3. **RGB/RGBA** - rgb(255, 122, 0), rgba(255, 122, 0, 0.5)
4. **HSL/HSLA** - hsl(30, 100%, 50%), hsla(30, 100%, 50%, 0.5)

### Color Functions:
- **rgba()** - RGB with alpha transparency
- **hsla()** - HSL with alpha transparency
- **currentColor** - Current text color
- **transparent** - Fully transparent

## CSS Units

### Absolute Units (Fixed):
- **px** - Pixels (1px = 1/96th of 1 inch)
- **pt** - Points (1pt = 1/72 of 1 inch)
- **cm** - Centimeters
- **mm** - Millimeters
- **in** - Inches

### Relative Units (Responsive):
- **%** - Percentage of parent
- **em** - Relative to parent font-size
- **rem** - Relative to root font-size
- **vw** - 1% of viewport width
- **vh** - 1% of viewport height
- **vmin** - Smaller of vw and vh
- **vmax** - Larger of vw and vh
- **ch** - Width of '0' character
- **ex** - x-height of font

### Viewport Units:
- 100vw = Full viewport width
- 100vh = Full viewport height
- 100vmin = 100 × min(vw, vh)
- 100vmax = 100 × max(vw, vh)

## CSS Typography

### Font Properties:
- **font-family** - Typeface
- **font-size** - Text size
- **font-weight** - Boldness (100-900)
- **font-style** - normal/italic/oblique
- **font-variant** - small-caps etc.

### Text Properties:
- **color** - Text color
- **text-align** - left/right/center/justify
- **text-decoration** - underline/overline/line-through
- **text-transform** - uppercase/lowercase/capitalize
- **line-height** - Space between lines
- **letter-spacing** - Space between characters
- **word-spacing** - Space between words
- **text-shadow** - Shadow effect

### Web Safe Fonts:
- Arial, Helvetica
- Times New Roman
- Courier New
- Georgia
- Verdana
- Trebuchet MS

### Google Fonts & @font-face:
          `,
          exampleCode: `/* Color Examples */
.hex-example {
  color: #ff7a00;
  background-color: #f5f5f5;
  border: 2px solid #333;
}

.rgb-example {
  color: rgb(255, 122, 0);
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hsl-example {
  color: hsl(30, 100%, 50%);
  background: hsla(200, 50%, 50%, 0.3);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* Unit Examples */
.pixel-example {
  width: 300px;
  height: 200px;
  font-size: 16px;
  padding: 20px;
  border-radius: 8px;
}

.relative-example {
  font-size: 1.2rem; /* Relative to root */
  margin: 1.5em; /* Relative to current font-size */
  padding: 5%; /* Relative to parent */
}

.viewport-example {
  width: 100vw;
  height: 100vh;
  font-size: 5vw; /* Responsive text */
}

/* Typography Examples */
body {
  font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: #ff7a00;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

h2 {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  border-bottom: 2px solid #ff7a00;
  padding-bottom: 0.5rem;
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #444;
}

p {
  margin-bottom: 1.2rem;
  text-align: justify;
}

.special-text {
  text-transform: uppercase;
  text-decoration: underline wavy #ff7a00;
  word-spacing: 0.3em;
  letter-spacing: 0.1em;
}

/* Google Fonts Example */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

/* @font-face Example */
@font-face {
  font-family: 'MyCustomFont';
  src: url('fonts/custom-font.woff2') format('woff2'),
       url('fonts/custom-font.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.custom-font {
  font-family: 'MyCustomFont', 'Roboto', sans-serif;
}

/* Advanced Text Effects */
.gradient-text {
  background: linear-gradient(45deg, #ff7a00, #ff2e2e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 3rem;
  font-weight: bold;
}

.text-outline {
  color: white;
  text-shadow: 2px 2px 0 #ff7a00,
               4px 4px 0 rgba(255,122,0,0.3);
}

.neumorphic-text {
  color: #d9d9d9;
  text-shadow: 2px 2px 4px rgba(255,255,255,0.5),
               -2px -2px 4px rgba(0,0,0,0.2);
}`,
          keyPoints: [
            "Use hex colors for solid colors, rgba for transparency",
            "rem units are best for typography (accessibility)",
            "vw/vh units are great for full-screen layouts",
            "Always provide fallback fonts",
            "Line-height should be 1.5-1.6 for readability",
            "Use relative units for responsive design"
          ],
          quiz: [
            {
              question: "What's the difference between em and rem units?",
              options: [
                "They're the same",
                "em is relative to parent, rem is relative to root",
                "em is absolute, rem is relative",
                "em is for fonts, rem is for spacing"
              ],
              correctAnswer: 1,
              explanation: "em is relative to the parent element's font-size, while rem is always relative to the root (html) font-size."
            },
            {
              question: "Which color format supports transparency?",
              options: [
                "#FF7A00",
                "rgb(255,122,0)",
                "rgba(255,122,0,0.5)",
                "hsl(30,100%,50%)"
              ],
              correctAnswer: 2,
              explanation: "rgba() includes an alpha channel for transparency (0-1)."
            },
            {
              question: "What does 100vw represent?",
              options: [
                "100% of parent width",
                "100% of viewport width",
                "100 pixels wide",
                "100% of document width"
              ],
              correctAnswer: 1,
              explanation: "vw stands for viewport width - 100vw equals the full width of the browser viewport."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "What is the correct CSS syntax to select all paragraphs inside a div with class 'content'?",
          options: [
            "div.content p",
            "div > .content p",
            ".content div p",
            "div .content > p"
          ],
          correctAnswer: 0,
          explanation: "div.content selects div with class content, then p selects all paragraphs inside it."
        },
        {
          question: "Which unit is best for responsive typography?",
          options: ["px", "pt", "rem", "cm"],
          correctAnswer: 2,
          explanation: "rem units respect user's browser font-size settings and scale consistently."
        }
      ]
    },

    // ===============================
    // CHAPTER 2 – CSS Box Model
    // ===============================
    {
      id: "css-ch2",
      title: "CSS Box Model",
      description: "Understanding margin, border, padding, and content - the foundation of CSS layout",
      pages: [
        {
          id: "css-ch2-page1",
          title: "Box Model Components",
          content: `
## The CSS Box Model

Every element in CSS is a rectangular box with the following layers:

1. **Content** - The actual content (text, images, etc.)
2. **Padding** - Space between content and border
3. **Border** - Surrounds padding (if any)
4. **Margin** - Space between elements

## Visual Representation:
+---------------------------+
|        Margin             |
|  +---------------------+  |
|  |      Border         |  |
|  |  +---------------+  |  |
|  |  |   Padding     |  |  |
|  |  |  +---------+  |  |  |
|  |  |  | Content |  |  |  |
|  |  |  +---------+  |  |  |
|  |  +---------------+  |  |
|  +---------------------+  |
+---------------------------+

## Box Sizing:

### content-box (Default):
width = content width
Total width = width + padding + border

### border-box:
width = content + padding + border
Total width = width (specified)

## Margin Collapsing:
- Vertical margins between elements collapse
- Larger margin wins
- Only happens with block elements
- Flex/Grid items don't collapse
          `,
          exampleCode: `/* Basic Box Model Example */
.box-model-demo {
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 5px solid #ff7a00;
  margin: 30px;
  background: #f5f5f5;
  
  /* Understanding dimensions:
     Content: 300x200
     Padding adds: 40px to width, 40px to height
     Border adds: 10px to width, 10px to height
     Total width: 300 + 40 + 10 = 350px
     Total height: 200 + 40 + 10 = 250px
     Margin adds space outside: 30px all around
  */
}

/* Content-box vs Border-box */
.content-box {
  box-sizing: content-box;
  width: 300px;
  padding: 20px;
  border: 5px solid black;
  /* Total width = 300 + 40 + 10 = 350px */
}

.border-box {
  box-sizing: border-box;
  width: 300px;
  padding: 20px;
  border: 5px solid black;
  /* Total width = 300px (content shrinks to 250px) */
}

/* Margin Collapsing Example */
.box1 {
  margin-bottom: 30px;
  background: lightblue;
  height: 50px;
}

.box2 {
  margin-top: 20px;
  background: lightgreen;
  height: 50px;
}
/* The gap between boxes will be 30px (the larger margin), not 50px */

/* Preventing margin collapse */
.no-collapse {
  display: flex;
  flex-direction: column;
}

.no-collapse .box {
  margin: 20px 0; /* Margins won't collapse in flex container */
}

/* Padding and Border shorthand */
.padding-examples {
  /* All sides */
  padding: 20px;
  
  /* Vertical | Horizontal */
  padding: 10px 20px;
  
  /* Top | Horizontal | Bottom */
  padding: 10px 20px 15px;
  
  /* Top | Right | Bottom | Left */
  padding: 10px 15px 20px 25px;
}

.border-examples {
  /* width style color */
  border: 2px solid #ff7a00;
  
  /* Individual sides */
  border-top: 3px dashed red;
  border-right: 4px dotted green;
  border-bottom: 5px double blue;
  border-left: 6px groove orange;
  
  /* Border radius for rounded corners */
  border-radius: 8px;
  border-radius: 10px 20px 30px 40px; /* top-left top-right bottom-right bottom-left */
  border-radius: 50%; /* Perfect circle with equal width/height */
}

/* Negative margins */
.negative-margin {
  margin-top: -20px; /* Pulls element up */
  margin-left: -30px; /* Pulls element left */
}

/* Centering with margin auto */
.center-block {
  width: 300px;
  margin: 0 auto; /* Horizontal centering */
  background: #f0f0f0;
}

/* Margin for spacing in flex/grid */
.flex-container {
  display: flex;
  gap: 20px; /* Modern way, no margin collapsing */
}

.flex-container > * {
  /* No need for margin when using gap */
  flex: 1;
}`,
          keyPoints: [
            "Content-box adds padding and border to width, border-box includes them",
            "Always set box-sizing: border-box on all elements for predictable layouts",
            "Vertical margins collapse, horizontal margins don't",
            "Negative margins can pull elements in opposite directions",
            "Use gap in flex/grid instead of margins for better control",
            "Border-radius creates rounded corners and circles"
          ],
          quiz: [
            {
              question: "With box-sizing: border-box, width 200px, padding 20px, border 2px - what's total width?",
              options: [
                "200px",
                "222px",
                "244px",
                "220px"
              ],
              correctAnswer: 0,
              explanation: "With border-box, the specified width includes padding and border - total width stays 200px."
            },
            {
              question: "What is margin collapsing?",
              options: [
                "Margins disappear",
                "Vertical margins combine into one",
                "Horizontal margins combine",
                "Margins double"
              ],
              correctAnswer: 1,
              explanation: "Margin collapsing occurs when vertical margins of adjacent elements combine into a single margin equal to the larger of the two."
            }
          ]
        },
        {
          id: "css-ch2-page2",
          title: "Advanced Box Model & Display Properties",
          content: `
## Display Property Values:

### Block-level Elements:
- Take full width available
- Start on new line
- Respect width, height, margin, padding
- Examples: div, p, h1-h6, section

### Inline Elements:
- Take only necessary width
- Don't start new line
- Ignore width/height
- Respect only horizontal margin/padding
- Examples: span, a, strong, em

### Inline-block Elements:
- Take only necessary width
- Don't start new line
- Respect width/height and all margins/padding
- Best of both worlds

### Other Display Values:
- **none** - Element removed from layout
- **flex** - Flexbox container
- **grid** - Grid container
- **table** - Table behavior

## Overflow Property:
- **visible** - Content overflows (default)
- **hidden** - Content clipped
- **scroll** - Always show scrollbars
- **auto** - Scrollbars only when needed

## Box Shadows:
box-shadow: offset-x offset-y blur-radius spread-radius color inset

## Outline vs Border:
- Outline doesn't affect box model
- Outline can be non-rectangular (for elements with border-radius)
- Outline is always on top

## Visibility:
- **visible** - Element visible
- **hidden** - Element hidden but occupies space
- **collapse** - For table rows/columns
          `,
          exampleCode: `/* Display Property Examples */
.block-example {
  display: block;
  width: 100%;
  padding: 20px;
  margin: 10px 0;
  background: #ff7a00;
  color: white;
}

.inline-example {
  display: inline;
  width: 300px; /* Ignored */
  height: 100px; /* Ignored */
  padding: 20px; /* Affects background but not layout flow */
  background: #ff7a00;
  color: white;
}

.inline-block-example {
  display: inline-block;
  width: 150px;
  height: 80px;
  margin: 10px;
  padding: 10px;
  background: #ff7a00;
  color: white;
  vertical-align: middle;
}

/* Hiding elements */
.display-none {
  display: none; /* Completely removed */
}

.visibility-hidden {
  visibility: hidden; /* Hidden but space remains */
}

.opacity-zero {
  opacity: 0; /* Transparent but interactive */
}

/* Overflow Examples */
.overflow-container {
  width: 200px;
  height: 100px;
  border: 1px solid #ccc;
}

.overflow-visible {
  overflow: visible; /* Content spills out */
  white-space: nowrap;
}

.overflow-hidden {
  overflow: hidden; /* Content clipped */
}

.overflow-scroll {
  overflow: scroll; /* Always show scrollbars */
}

.overflow-auto {
  overflow: auto; /* Scrollbars when needed */
}

.overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Box Shadow Examples */
.box-shadow-basic {
  box-shadow: 5px 5px 10px rgba(0,0,0,0.3);
}

.box-shadow-spread {
  box-shadow: 0 0 0 10px #ff7a00; /* Simulates border */
}

.box-shadow-multiple {
  box-shadow: 
    3px 3px 10px rgba(0,0,0,0.2),
    -3px -3px 10px rgba(255,255,255,0.5),
    inset 0 0 20px rgba(255,122,0,0.3);
}

.box-shadow-inset {
  box-shadow: inset 0 0 20px rgba(0,0,0,0.3);
}

/* Inner shadow effect */
.inner-glow {
  box-shadow: inset 0 0 30px rgba(255,122,0,0.5);
}

/* Neumorphism effect */
.neumorphism {
  background: #e0e0e0;
  border-radius: 50px;
  box-shadow: 
    20px 20px 60px #bebebe,
    -20px -20px 60px #ffffff;
}

/* Outline examples */
.outline-example {
  outline: 3px solid #ff7a00;
  outline-offset: 5px; /* Space between border and outline */
  border: 2px solid black;
  margin: 20px;
  padding: 10px;
}

/* Outline for accessibility */
:focus {
  outline: 3px solid #ff7a00;
  outline-offset: 2px;
}

/* Different display behaviors */
.min-content {
  width: min-content; /* Width based on largest child */
  background: #f0f0f0;
  padding: 10px;
}

.max-content {
  width: max-content; /* Width based on content */
  background: #f0f0f0;
  padding: 10px;
}

.fit-content {
  width: fit-content; /* Like min-content but respects constraints */
  background: #f0f0f0;
  padding: 10px;
  max-width: 300px;
}

/* Writing mode affects box model */
.vertical-text {
  writing-mode: vertical-rl;
  height: 200px;
  background: #ff7a00;
  color: white;
  padding: 10px;
}

/* Box decoration break */
.inline-boxes {
  border: 2px solid #ff7a00;
  border-radius: 8px;
  padding: 5px;
  box-decoration-break: clone; /* Each fragment gets its own border */
}`,
          keyPoints: [
            "display: none removes element from layout, visibility: hidden keeps space",
            "box-shadow can create depth, glow, and neumorphic effects",
            "Outline doesn't affect layout - great for focus indicators",
            "inline-block combines inline flow with block dimensions",
            "overflow properties control content that doesn't fit",
            "min-content, max-content, fit-content give content-based sizing"
          ],
          quiz: [
            {
              question: "What's the difference between display: none and visibility: hidden?",
              options: [
                "They're the same",
                "display: none removes element, visibility: hidden keeps space",
                "visibility: none removes element, display: hidden keeps space",
                "Both keep space but hide content"
              ],
              correctAnswer: 1,
              explanation: "display: none completely removes element from layout flow, while visibility: hidden hides content but preserves the space it occupies."
            },
            {
              question: "Which box-shadow property creates an inner shadow?",
              options: [
                "spread-radius",
                "inset",
                "inner",
                "internal"
              ],
              correctAnswer: 1,
              explanation: "The inset keyword creates a shadow inside the element instead of outside."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "What is the default box-sizing value?",
          options: [
            "border-box",
            "content-box",
            "padding-box",
            "margin-box"
          ],
          correctAnswer: 1,
          explanation: "The default box-sizing is content-box, where width/height only apply to content area."
        },
        {
          question: "Which property is best for creating rounded corners?",
          options: [
            "corner-radius",
            "border-curve",
            "border-radius",
            "round-corners"
          ],
          correctAnswer: 2,
          explanation: "border-radius creates rounded corners, with 50% creating circles/ellipses."
        }
      ]
    },

    // ===============================
    // CHAPTER 3 – CSS Layout (Flexbox & Grid)
    // ===============================
    {
      id: "css-ch3",
      title: "Modern Layouts",
      description: "Flexbox and Grid for responsive layouts",
      pages: [
        {
          id: "css-ch3-page1",
          title: "Flexbox - One-dimensional Layout",
          content: `
## Flexbox (Flexible Box Layout)

Flexbox is designed for one-dimensional layouts - either rows OR columns.

### Flex Container Properties:
- **display: flex** - Creates flex container
- **flex-direction** - row | column | row-reverse | column-reverse
- **flex-wrap** - nowrap | wrap | wrap-reverse
- **justify-content** - main axis alignment
- **align-items** - cross axis alignment
- **align-content** - multi-line alignment
- **gap** - Space between items

### Flex Item Properties:
- **flex-grow** - Ability to grow
- **flex-shrink** - Ability to shrink
- **flex-basis** - Initial size
- **flex** - Shorthand (grow shrink basis)
- **align-self** - Individual alignment
- **order** - Reordering

## Main Axis vs Cross Axis:
- **main axis** - Direction of flex-direction
- **cross axis** - Perpendicular to main axis

## Common Flexbox Patterns:
- Navigation bars
- Card layouts
- Centering elements
- Holy grail layout
- Equal height columns
- Sticky footer
          `,
          exampleCode: `/* Flex Container Basics */
.flex-container {
  display: flex;
  flex-direction: row; /* Default */
  flex-wrap: wrap; /* Allow items to wrap */
  justify-content: space-between; /* Space between items */
  align-items: center; /* Center vertically */
  gap: 20px; /* Space between items */
  padding: 20px;
  background: #f5f5f5;
  min-height: 300px;
}

.flex-item {
  background: #ff7a00;
  color: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 100px;
  text-align: center;
}

/* Different justify-content values */
.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }

/* Different align-items values */
.align-stretch { align-items: stretch; }
.align-start { align-items: flex-start; }
.align-end { align-items: flex-end; }
.align-center { align-items: center; }
.align-baseline { align-items: baseline; }

/* Flex Item Properties */
.item-grow-1 {
  flex-grow: 1; /* Takes up available space */
}

.item-grow-2 {
  flex-grow: 2; /* Takes twice as much space as flex-grow:1 */
}

.item-no-shrink {
  flex-shrink: 0; /* Won't shrink even if container is small */
  width: 200px;
}

.flex-basis-example {
  flex-basis: 200px; /* Initial size before growing/shrinking */
}

/* Flex Shorthand */
.flex-1 {
  flex: 1; /* flex: 1 1 0% - grow, shrink, basis */
}

.flex-auto {
  flex: auto; /* flex: 1 1 auto - grow, shrink, content-based basis */
}

.flex-initial {
  flex: initial; /* flex: 0 1 auto - default */
}

.flex-none {
  flex: none; /* flex: 0 0 auto - fixed size */
}

/* Common Flexbox Patterns */

/* 1. Navigation Bar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #333;
  color: white;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

/* 2. Card Grid */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
}

.card {
  flex: 1 1 300px; /* Grow, shrink, basis 300px */
  min-width: 250px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

/* 3. Perfect Centering */
.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: #f0f0f0;
}

.centered-content {
  background: #ff7a00;
  color: white;
  padding: 40px;
  border-radius: 8px;
}

/* 4. Holy Grail Layout */
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.holy-grail header,
.holy-grail footer {
  background: #333;
  color: white;
  padding: 1rem;
  text-align: center;
}

.holy-grail main {
  display: flex;
  flex: 1;
}

.holy-grail article {
  flex: 1;
  padding: 20px;
}

.holy-grail nav,
.holy-grail aside {
  flex: 0 0 200px;
  background: #f5f5f5;
  padding: 20px;
}

/* 5. Equal Height Columns */
.equal-height {
  display: flex;
  gap: 20px;
}

.equal-height > * {
  flex: 1;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

/* 6. Sticky Footer */
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 20px;
}

.footer {
  background: #333;
  color: white;
  padding: 20px;
  text-align: center;
}

/* 7. Responsive Flexbox */
.responsive-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.responsive-item {
  flex: 1 1 calc(33.333% - 20px); /* 3 columns with gap */
  min-width: 250px;
}

@media (max-width: 768px) {
  .responsive-item {
    flex: 1 1 calc(50% - 20px); /* 2 columns on tablet */
  }
}

@media (max-width: 480px) {
  .responsive-item {
    flex: 1 1 100%; /* 1 column on mobile */
  }
}

/* 8. Order property */
.flex-order {
  display: flex;
  gap: 10px;
}

.order-1 { order: 1; }
.order-2 { order: 2; }
.order-3 { order: 3; }
.order-first { order: -1; }
.order-last { order: 999; }

/* 9. Align-self example */
.align-self-demo {
  display: flex;
  align-items: center;
  height: 200px;
  background: #f5f5f5;
  gap: 10px;
}

.align-self-start { align-self: flex-start; }
.align-self-end { align-self: flex-end; }
.align-self-stretch { align-self: stretch; }
.align-self-center { align-self: center; }

/* 10. Complex Flexbox Example */
.pricing-table {
  display: flex;
  gap: 30px;
  padding: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pricing-card {
  flex: 1;
  background: white;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.pricing-card:hover {
  transform: translateY(-10px);
}

.pricing-card.featured {
  transform: scale(1.05);
  border: 2px solid #ff7a00;
}

.price {
  font-size: 2.5rem;
  color: #ff7a00;
  font-weight: bold;
  margin: 20px 0;
}

.features {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.features li {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.features li:last-child {
  border-bottom: none;
}

.btn {
  display: inline-block;
  padding: 12px 30px;
  background: #ff7a00;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: background 0.3s;
}

.btn:hover {
  background: #e66a00;
}`,
          keyPoints: [
            "Flexbox is for 1D layouts (row OR column)",
            "justify-content works on main axis, align-items on cross axis",
            "flex-grow distributes extra space, flex-shrink handles overflow",
            "flex-basis sets initial size before growing/shrinking",
            "gap creates space between items (supported in modern browsers)",
            "order can rearrange items (use carefully for accessibility)"
          ],
          quiz: [
            {
              question: "Which property controls alignment on the cross axis in Flexbox?",
              options: [
                "justify-content",
                "align-items",
                "align-content",
                "flex-align"
              ],
              correctAnswer: 1,
              explanation: "align-items controls alignment on the cross axis (perpendicular to flex-direction)."
            },
            {
              question: "What does flex: 1 mean?",
              options: [
                "flex: 1 1 0%",
                "flex: 0 1 auto",
                "flex: 1 0 auto",
                "flex: 1 1 auto"
              ],
              correctAnswer: 0,
              explanation: "flex: 1 is shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0%"
            }
          ]
        },
        {
          id: "css-ch3-page2",
          title: "CSS Grid - Two-dimensional Layout",
          content: `
## CSS Grid Layout

CSS Grid is designed for two-dimensional layouts - rows AND columns simultaneously.

### Grid Container Properties:
- **display: grid** - Creates grid container
- **grid-template-columns** - Define columns
- **grid-template-rows** - Define rows
- **grid-template-areas** - Named areas
- **gap (grid-gap)** - Gutters between cells
- **justify-items** - Horizontal alignment of items
- **align-items** - Vertical alignment of items
- **place-items** - Shorthand for both
- **justify-content** - Horizontal alignment of entire grid
- **align-content** - Vertical alignment of entire grid

### Grid Item Properties:
- **grid-column** - Start/end column placement
- **grid-row** - Start/end row placement
- **grid-area** - Assign to named area
- **justify-self** - Individual horizontal alignment
- **align-self** - Individual vertical alignment

### Grid Units:
- **fr** - Fraction of available space
- **min-content** - Smallest size based on content
- **max-content** - Largest size based on content
- **minmax(min, max)** - Size range
- **repeat()** - Repeat pattern
- **auto-fill / auto-fit** - Responsive patterns

## Grid Functions:
- **repeat()** - Repeats columns/rows
- **minmax()** - Sets size range
- **fit-content()** - Clamps to content size

## Common Grid Patterns:
- Magazine layouts
- Dashboard layouts
- Photo galleries
- Card grids
- Holy grail layout
          `,
          exampleCode: `/* Basic Grid Container */
.grid-container {
  display: grid;
  grid-template-columns: 200px 1fr 200px; /* Fixed + flexible + fixed */
  grid-template-rows: auto 1fr auto; /* Header, main, footer */
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
}

/* Using repeat() */
.repeat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 equal columns */
  grid-template-rows: repeat(4, 100px); /* 4 rows of 100px */
  gap: 10px;
}

/* Using minmax() */
.minmax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* Grid Template Areas */
.area-grid {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
  gap: 10px;
}

.header { grid-area: header; background: #333; color: white; }
.sidebar { grid-area: sidebar; background: #f5f5f5; }
.main { grid-area: main; background: white; }
.aside { grid-area: aside; background: #f5f5f5; }
.footer { grid-area: footer; background: #333; color: white; }

/* Grid Item Placement */
.grid-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 100px);
  gap: 10px;
}

.item1 {
  grid-column: 1 / 3; /* Span from column line 1 to 3 */
  grid-row: 1 / 2; /* Span from row line 1 to 2 */
  background: #ff7a00;
}

.item2 {
  grid-column: 3 / 5; /* Span columns 3-4 */
  grid-row: 1 / 3; /* Span rows 1-2 */
  background: #ff9a44;
}

.item3 {
  grid-column: 1 / 2;
  grid-row: 2 / 4;
  background: #ffb366;
}

.item4 {
  grid-column: 2 / 5;
  grid-row: 3 / 4;
  background: #ffcc99;
}

/* Span shorthand */
.span-item {
  grid-column: 2 / span 2; /* Start at 2, span 2 columns */
  grid-row: span 2; /* Span 2 rows from wherever placed */
}

/* Named grid lines */
.named-grid {
  display: grid;
  grid-template-columns: [sidebar-start] 200px [main-start] 1fr [main-end] 200px [sidebar-end];
  grid-template-rows: [header-start] auto [content-start] 1fr [content-end] auto [footer-end];
}

/* Auto-flow */
.auto-flow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto); /* Size of implicit rows */
  grid-auto-flow: dense; /* Fill gaps automatically */
  gap: 10px;
}

/* Justify/Align content */
.alignment-grid {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(2, 100px);
  justify-content: center; /* Center horizontally */
  align-content: center; /* Center vertically */
  gap: 10px;
  height: 500px;
  background: #f5f5f5;
}

/* Complex Grid Examples */

/* 1. Magazine Layout */
.magazine-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.featured-article {
  grid-column: span 2;
  grid-row: span 2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
}

.article {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.sidebar {
  grid-column: 4 / 5;
  grid-row: 1 / span 3;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

/* 2. Photo Gallery */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: minmax(150px, auto);
  gap: 15px;
  padding: 20px;
}

.gallery-item {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-item.wide {
  grid-column: span 2;
}

.gallery-item.tall {
  grid-row: span 2;
}

/* 3. Dashboard Layout */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "sidebar header header"
    "sidebar main main"
    "sidebar widget1 widget2";
  min-height: 100vh;
  gap: 10px;
  padding: 10px;
}

.dashboard-sidebar {
  grid-area: sidebar;
  background: #333;
  color: white;
  padding: 20px;
}

.dashboard-header {
  grid-area: header;
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-main {
  grid-area: main;
  background: white;
  padding: 20px;
}

.widget-1 {
  grid-area: widget1;
  background: #ff7a00;
  color: white;
  padding: 20px;
  border-radius: 8px;
}

.widget-2 {
  grid-area: widget2;
  background: #764ba2;
  color: white;
  padding: 20px;
  border-radius: 8px;
}

/* 4. Responsive Card Grid with auto-fit */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.grid-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.grid-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-image {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-content {
  padding: 20px;
}

/* 5. Holy Grail with Grid (simpler) */
.holy-grail-grid {
  display: grid;
  grid-template: 
    "header header header" auto
    "nav main aside" 1fr
    "footer footer footer" auto / 200px 1fr 200px;
  min-height: 100vh;
  gap: 10px;
}

/* 6. Masonry-like layout with dense packing */
.masonry {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(100px, auto);
  gap: 15px;
}

.masonry-item {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.masonry-item:nth-child(3n+1) {
  grid-row: span 2;
}

.masonry-item:nth-child(3n+2) {
  grid-row: span 3;
}

.masonry-item:nth-child(3n+3) {
  grid-row: span 1;
}

/* 7. Grid with offset items */
.offset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.offset-item:first-child {
  grid-column: 2 / 4; /* Starts at column 2 */
}

.offset-item:last-child {
  grid-column: 1 / 3; /* Ends at column 3 */
}

/* 8. Nested Grid */
.outer-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.inner-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* 9. Grid + Flexbox hybrid */
.hybrid-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.flex-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 10. Calendar-style grid */
.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-header {
  grid-column: span 7;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #333;
  color: white;
  padding: 10px;
  text-align: center;
}

.calendar-day {
  aspect-ratio: 1;
  background: #f5f5f5;
  padding: 5px;
  text-align: right;
}

.calendar-day.today {
  background: #ff7a00;
  color: white;
  font-weight: bold;
}`,
          keyPoints: [
            "Grid is for 2D layouts (rows AND columns simultaneously)",
            "fr units distribute available space fractionally",
            "grid-template-areas provides visual layout mapping",
            "repeat(auto-fit, minmax()) creates responsive grids without media queries",
            "grid-column/row can use line numbers, spans, or names",
            "auto-fit vs auto-fill: auto-fit collapses empty tracks"
          ],
          quiz: [
            {
              question: "What's the difference between auto-fit and auto-fill in grid?",
              options: [
                "They're identical",
                "auto-fit collapses empty tracks, auto-fill preserves them",
                "auto-fill collapses empty tracks, auto-fit preserves them",
                "auto-fit is for rows, auto-fill for columns"
              ],
              correctAnswer: 1,
              explanation: "auto-fit collapses empty grid tracks, while auto-fill preserves them even if empty."
            },
            {
              question: "How do you create a 3-column grid with equal width columns?",
              options: [
                "grid-template-columns: 3fr",
                "grid-template-columns: repeat(3, 1fr)",
                "grid-template-columns: 1fr 1fr 1fr",
                "Both B and C"
              ],
              correctAnswer: 3,
              explanation: "Both grid-template-columns: repeat(3, 1fr) and grid-template-columns: 1fr 1fr 1fr create 3 equal columns."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "When should you use Flexbox vs Grid?",
          options: [
            "Flexbox for 1D, Grid for 2D layouts",
            "Grid for 1D, Flexbox for 2D",
            "They're interchangeable",
            "Flexbox for modern browsers only"
          ],
          correctAnswer: 0,
          explanation: "Flexbox is designed for one-dimensional layouts (row OR column), while Grid excels at two-dimensional layouts (rows AND columns)."
        },
        {
          question: "Which property creates space between grid/flex items?",
          options: ["margin", "padding", "gap", "spacing"],
          correctAnswer: 2,
          explanation: "The gap property creates consistent spacing between items in both Grid and Flexbox."
        }
      ]
    },

    // ===============================
    // CHAPTER 4 – Responsive Design
    // ===============================
    {
      id: "css-ch4",
      title: "Responsive Design",
      description: "Media queries, mobile-first design, and responsive patterns",
      pages: [
        {
          id: "css-ch4-page1",
          title: "Media Queries & Breakpoints",
          content: `
## Media Queries

Media queries allow CSS to apply styles based on device characteristics.

### Media Types:
- **all** - All devices (default)
- **screen** - Computer screens, tablets, phones
- **print** - Print preview/print mode
- **speech** - Screen readers

### Media Features:
- **width / height** - Viewport dimensions
- **min-width / max-width** - Range conditions
- **orientation** - portrait/landscape
- **aspect-ratio** - Width/height ratio
- **resolution** - Pixel density
- **hover** - Can device hover?
- **pointer** - Primary input type

### Common Breakpoints:
- Mobile: 320px - 480px
- Mobile Landscape: 481px - 768px
- Tablet: 769px - 1024px
- Desktop: 1025px - 1200px
- Large Desktop: 1201px+

### Mobile-First vs Desktop-First:
- **Mobile-First**: Start with mobile styles, add complexity with min-width
- **Desktop-First**: Start with desktop styles, simplify with max-width

### Responsive Design Patterns:
- Mostly Fluid
- Column Drop
- Layout Shifter
- Tiny Tweaks
- Off Canvas
          `,
          exampleCode: `/* Mobile-First Approach (Recommended) */

/* Base styles for mobile */
body {
  font-size: 16px;
  line-height: 1.5;
  padding: 10px;
}

.container {
  width: 100%;
  padding: 0 15px;
}

/* Tablet styles */
@media (min-width: 768px) {
  body {
    font-size: 18px;
    padding: 20px;
  }
  
  .container {
    max-width: 750px;
    margin: 0 auto;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .sidebar {
    width: 300px;
    float: left;
  }
}

/* Large Desktop */
@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}

/* Desktop-First Approach */
.container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .container {
    max-width: 960px;
  }
}

@media (max-width: 768px) {
  .container {
    max-width: 100%;
    padding: 0 20px;
  }
  
  .sidebar {
    display: none; /* Hide sidebar on mobile */
  }
}

@media (max-width: 480px) {
  body {
    font-size: 14px;
  }
}

/* Complex Media Queries */

/* Orientation based */
@media (orientation: landscape) {
  .hero {
    height: 60vh;
  }
}

@media (orientation: portrait) {
  .hero {
    height: 40vh;
  }
}

/* Based on device capabilities */
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    background: #ff7a00;
    transform: scale(1.05);
  }
}

/* Based on resolution */
@media (min-resolution: 2dppx) {
  .logo {
    background-image: url('logo@2x.png');
    background-size: contain;
  }
}

/* Print styles */
@media print {
  body {
    font-size: 12pt;
    line-height: 1.3;
    color: black;
    background: white;
  }
  
  .no-print,
  nav,
  footer {
    display: none !important;
  }
  
  a[href]::after {
    content: " (" attr(href) ")";
  }
}

/* Range queries */
@media (min-width: 768px) and (max-width: 1024px) {
  .tablet-only {
    display: block;
  }
}

@media (width >= 768px) and (width <= 1024px) { /* Modern syntax */
  .tablet-only {
    display: block;
  }
}

/* Responsive Patterns */

/* 1. Mostly Fluid */
.fluid-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .fluid-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .fluid-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .fluid-grid {
    grid-template-columns: 1fr;
  }
}

/* 2. Column Drop */
.column-drop {
  display: flex;
  flex-wrap: wrap;
}

.column {
  flex: 1 1 300px;
  margin: 10px;
}

/* 3. Layout Shifter */
.shifter {
  display: flex;
  flex-wrap: wrap;
}

.shifter-main {
  flex: 1 1 600px;
}

.shifter-sidebar {
  flex: 1 1 300px;
}

@media (max-width: 900px) {
  .shifter {
    flex-direction: column;
  }
  
  .shifter-main {
    order: 2;
  }
  
  .shifter-sidebar {
    order: 1;
  }
}

/* 4. Tiny Tweaks */
.tiny-tweaks {
  text-align: left;
}

@media (min-width: 768px) {
  .tiny-tweaks {
    text-align: center;
    font-size: 1.2em;
  }
}

@media (min-width: 1024px) {
  .tiny-tweaks {
    text-align: right;
    font-size: 1.5em;
  }
}

/* 5. Off Canvas */
.off-canvas {
  position: relative;
  overflow-x: hidden;
}

.off-canvas-nav {
  position: absolute;
  left: -250px;
  width: 250px;
  transition: left 0.3s ease;
}

.off-canvas-nav.open {
  left: 0;
}

.off-canvas-content {
  transition: transform 0.3s ease;
}

.off-canvas-nav.open + .off-canvas-content {
  transform: translateX(250px);
}

@media (min-width: 768px) {
  .off-canvas-nav {
    position: static;
    width: auto;
  }
  
  .off-canvas-nav.open + .off-canvas-content {
    transform: none;
  }
}

/* Responsive Typography */
html {
  font-size: 16px; /* Base size */
}

@media (min-width: 768px) {
  html {
    font-size: 18px;
  }
}

@media (min-width: 1024px) {
  html {
    font-size: 20px;
  }
}

/* Fluid typography with clamp() */
.fluid-text {
  font-size: clamp(1rem, 3vw, 2rem);
}

/* Responsive Images */
img {
  max-width: 100%;
  height: auto;
}

/* Picture element for art direction */
<picture>
  <source media="(min-width: 1024px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <img src="small.jpg" alt="Responsive image">
</picture>

/* Responsive Containers */
.container {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 576px) {
  .container {
    max-width: 540px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}

/* Responsive Navigation */
.nav-toggle {
  display: block;
}

.nav-menu {
  display: none;
}

.nav-menu.active {
  display: block;
}

@media (min-width: 768px) {
  .nav-toggle {
    display: none;
  }
  
  .nav-menu {
    display: flex;
  }
}

/* Responsive Tables */
.table-container {
  overflow-x: auto;
}

table {
  min-width: 600px;
}

@media (max-width: 600px) {
  .card-table {
    display: block;
  }
  
  .card-table thead {
    display: none;
  }
  
  .card-table tr {
    display: block;
    margin-bottom: 20px;
    border: 1px solid #ddd;
  }
  
  .card-table td {
    display: block;
    text-align: right;
    padding: 10px;
  }
  
  .card-table td::before {
    content: attr(data-label);
    float: left;
    font-weight: bold;
  }
}`,
          keyPoints: [
            "Mobile-first approach uses min-width, desktop-first uses max-width",
            "Common breakpoints: 480px, 768px, 1024px, 1200px",
            "Use relative units (%, em, rem, vw) for responsiveness",
            "Images should have max-width: 100% and height: auto",
            "Test on real devices, not just browser resizing",
            "Consider touch targets (minimum 44x44px)"
          ],
          quiz: [
            {
              question: "What's the advantage of mobile-first approach?",
              options: [
                "Faster loading on mobile",
                "Less code to write",
                "Progressive enhancement - start simple, add complexity",
                "Better for SEO only"
              ],
              correctAnswer: 2,
              explanation: "Mobile-first follows progressive enhancement - start with core functionality for mobile and enhance for larger screens."
            },
            {
              question: "Which CSS unit is best for responsive typography?",
              options: ["px", "pt", "rem", "cm"],
              correctAnswer: 2,
              explanation: "rem units respect user's browser font-size settings and scale consistently across devices."
            }
          ]
        },
        {
          id: "css-ch4-page2",
          title: "Responsive Units & Techniques",
          content: `
## Advanced Responsive Techniques

### Modern CSS Units:

1. **Viewport Units**:
   - **vw** - % of viewport width
   - **vh** - % of viewport height
   - **vmin** - Smaller of vw and vh
   - **vmax** - Larger of vw and vh
   - **dvw/dvh** - Dynamic viewport units (account for browser UI)

2. **Container Queries**:
   - **cqw** - % of container width
   - **cqh** - % of container height
   - **cqi** - % of container inline size
   - **cqb** - % of container block size
   - **cqmin/cqmax** - Min/max of container dimensions

### CSS Functions for Responsiveness:

- **clamp(min, preferred, max)** - Fluid values
- **min()** - Choose smallest value
- **max()** - Choose largest value
- **calc()** - Mathematical expressions

### Container Queries:
Query based on parent container size, not viewport

### Aspect Ratio:
Control element proportions

### Responsive Images:
- **srcset** - Different resolutions
- **sizes** - Viewport-based selection
- **picture element** - Art direction
          `,
          exampleCode: `/* Modern Responsive Units */

/* Dynamic viewport units */
.full-height {
  height: 100vh; /* Traditional */
  height: 100dvh; /* Dynamic - accounts for browser UI */
}

/* Container Query Units */
.container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    font-size: clamp(1rem, 5cqi, 2rem);
  }
}

/* CSS Functions */

/* clamp() - Fluid typography */
.fluid-heading {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

.fluid-padding {
  padding: clamp(1rem, 3vw, 3rem);
}

/* min() and max() */
.responsive-width {
  width: min(90%, 1200px); /* Takes whichever is smaller */
}

.responsive-padding {
  padding: max(1rem, 2vw); /* Ensures minimum padding */
}

/* calc() for complex calculations */
.calculated-width {
  width: calc(100% - 40px);
  height: calc(100vh - 80px);
  font-size: calc(1rem + 0.5vw);
}

/* Container Queries - The Future of Responsive */

/* Define containers */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Container queries */
@container card (min-width: 400px) {
  .card {
    display: flex;
    gap: 20px;
  }
  
  .card-image {
    width: 200px;
  }
}

@container card (min-width: 600px) {
  .card {
    flex-direction: column;
  }
  
  .card-title {
    font-size: 2rem;
  }
}

/* Multiple containers */
.sidebar {
  container: sidebar / inline-size;
}

.main-content {
  container: main / inline-size;
}

@container sidebar (min-width: 300px) {
  .widget {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@container main (min-width: 600px) {
  .article {
    column-count: 2;
  }
}

/* Aspect Ratio */
.aspect-ratio-box {
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
}

.aspect-ratio-square {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
}

/* Combined with responsive */
.responsive-video {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* Responsive Images - Advanced */

/* Resolution switching */
<img 
  srcset="small.jpg 300w,
          medium.jpg 600w,
          large.jpg 900w"
  sizes="(max-width: 320px) 280px,
         (max-width: 640px) 580px,
         900px"
  src="fallback.jpg"
  alt="Responsive image">

/* Art direction with picture */
<picture>
  <source 
    media="(max-width: 480px)" 
    srcset="portrait-small.jpg 1x,
            portrait-small@2x.jpg 2x">
  <source 
    media="(max-width: 768px)" 
    srcset="landscape-medium.jpg 1x,
            landscape-medium@2x.jpg 2x">
  <img 
    src="landscape-large.jpg" 
    alt="Hero image"
    loading="lazy"
    width="1200"
    height="600">
</picture>

/* Responsive Background Images */
.hero {
  background-image: url('hero-mobile.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 768px) {
  .hero {
    background-image: url('hero-tablet.jpg');
  }
}

@media (min-width: 1024px) {
  .hero {
    background-image: url('hero-desktop.jpg');
  }
}

/* Object-fit for images */
.image-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* cover | contain | fill | scale-down */
  object-position: center;
}

/* Responsive Grid with Container Queries */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.grid-item {
  container-type: inline-size;
}

@container (min-width: 300px) {
  .card {
    display: flex;
  }
}

/* Responsive Typography System */
:root {
  --fluid-min-width: 320;
  --fluid-max-width: 1200;
  --fluid-min-size: 16;
  --fluid-max-size: 20;
  
  --fluid-min: var(--fluid-min-size) * 1px;
  --fluid-max: var(--fluid-max-size) * 1px;
  
  --fluid-screen: 100vw;
  --fluid-bp: calc(
    (var(--fluid-screen) - var(--fluid-min-width) * 1px) / 
    (var(--fluid-max-width) - var(--fluid-min-width))
  );
}

h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}

/* Responsive Spacing */
.spacing-system {
  margin: clamp(1rem, 3vw, 3rem);
  padding: clamp(0.5rem, 2vw, 2rem);
  gap: clamp(0.5rem, 1.5vw, 1.5rem);
}

/* Responsive Flexbox Grid */
.responsive-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.responsive-flex > * {
  flex: 1 1 calc(33.333% - 20px);
  min-width: 250px;
}

/* Complex Responsive Layout */
.responsive-dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.sidebar {
  grid-column: span 3;
}

.main {
  grid-column: span 9;
}

@media (max-width: 1024px) {
  .sidebar {
    grid-column: span 4;
  }
  
  .main {
    grid-column: span 8;
  }
}

@media (max-width: 768px) {
  .responsive-dashboard {
    grid-template-columns: 1fr;
  }
  
  .sidebar,
  .main {
    grid-column: span 1;
  }
}

/* Responsive Navigation with Dropdowns */
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

@media (max-width: 768px) {
  .nav {
    flex-direction: column;
  }
  
  .dropdown {
    position: static;
  }
  
  .dropdown-menu {
    position: static;
    display: none;
    padding-left: 20px;
  }
  
  .dropdown.active .dropdown-menu {
    display: block;
  }
}

/* Responsive Tables with Grid */
@media (max-width: 600px) {
  .responsive-table {
    display: block;
  }
  
  .responsive-table thead {
    display: none;
  }
  
  .responsive-table tbody {
    display: grid;
    gap: 20px;
  }
  
  .responsive-table tr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .responsive-table td {
    display: flex;
    flex-direction: column;
  }
  
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: bold;
    margin-bottom: 5px;
    color: #ff7a00;
  }
}`,
          keyPoints: [
            "Viewport units (vw/vh) are great for full-screen layouts",
            "Container queries allow component-based responsiveness",
            "clamp() creates fluid typography that scales smoothly",
            "aspect-ratio maintains proportions responsively",
            "object-fit controls how images fit their containers",
            "srcset and picture optimize images for different screens"
          ],
          quiz: [
            {
              question: "What's the difference between container queries and media queries?",
              options: [
                "They're the same",
                "Media queries check viewport, container queries check parent size",
                "Container queries are faster",
                "Media queries are newer"
              ],
              correctAnswer: 1,
              explanation: "Media queries respond to viewport size, while container queries respond to the size of a parent container."
            },
            {
              question: "What does clamp(1rem, 3vw, 2rem) do?",
              options: [
                "Sets value to exactly 3vw",
                "Creates fluid value between 1rem and 2rem based on viewport",
                "Clamps the element to 3vw only",
                "Sets minimum of 1rem and maximum of 2rem"
              ],
              correctAnswer: 1,
              explanation: "clamp() creates a fluid value that scales between the minimum (1rem) and maximum (2rem) based on the preferred value (3vw)."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "What is the mobile-first approach?",
          options: [
            "Designing for desktop first",
            "Starting with mobile styles and enhancing for larger screens",
            "Only designing for mobile",
            "Using max-width media queries"
          ],
          correctAnswer: 1,
          explanation: "Mobile-first means starting with styles for small screens and using min-width media queries to add complexity for larger screens."
        },
        {
          question: "Which is the best practice for responsive images?",
          options: [
            "Use one large image for all devices",
            "Use srcset with multiple resolutions",
            "Use only width: 100%",
            "Always use background-image"
          ],
          correctAnswer: 1,
          explanation: "srcset allows browsers to choose the most appropriate image size based on device capabilities and viewport."
        }
      ]
    },

    // ===============================
    // CHAPTER 5 – CSS Animations & Transitions
    // ===============================
    {
      id: "css-ch5",
      title: "Animations & Transitions",
      description: "Adding motion and interactivity with CSS",
      pages: [
        {
          id: "css-ch5-page1",
          title: "CSS Transitions",
          content: `
## CSS Transitions

Transitions allow property changes to occur smoothly over time.

### Transition Properties:
- **transition-property** - Which property to animate
- **transition-duration** - How long the animation lasts
- **transition-timing-function** - Acceleration curve
- **transition-delay** - Delay before starting
- **transition** - Shorthand for all

### Timing Functions:
- **ease** - Slow start, fast middle, slow end (default)
- **linear** - Constant speed
- **ease-in** - Slow start
- **ease-out** - Slow end
- **ease-in-out** - Slow start and end
- **cubic-bezier()** - Custom curve
- **steps()** - Step-based animation

### Transitionable Properties:
- Transform properties (translate, rotate, scale)
- Color properties (color, background, border-color)
- Box model (width, height, padding, margin)
- Opacity, visibility
- Box-shadow, text-shadow
- Filter properties
          `,
          exampleCode: `/* Basic Transition */
.button {
  background: #ff7a00;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.button:hover {
  background: #e66a00;
}

/* Multiple Properties */
.card {
  transform: scale(1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* All Properties */
.animated-box {
  background: blue;
  width: 100px;
  height: 100px;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animated-box:hover {
  background: red;
  width: 150px;
  height: 150px;
  transform: rotate(45deg);
}

/* Different Timing Functions */
.timing-examples {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.timing-box {
  width: 100px;
  height: 100px;
  background: #ff7a00;
  transition: transform 2s;
}

.timing-box:hover {
  transform: translateX(200px);
}

.ease { transition-timing-function: ease; }
.linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: ease-in; }
.ease-out { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }

/* Custom cubic-bezier */
.custom-bezier {
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Step animation */
.step-animation {
  transition-timing-function: steps(4, end);
}

/* Transition with Delay */
.delayed {
  transition: opacity 0.3s ease 0.2s; /* 0.2s delay */
}

/* Transform Transitions */
.transform-demo {
  width: 100px;
  height: 100px;
  background: #ff7a00;
  transition: transform 0.3s ease;
}

.transform-demo:hover {
  transform: rotate(45deg) scale(1.2) translateX(20px);
}

/* Hover Card Example */
.hover-card {
  width: 300px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.hover-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
}

/* Button Hover Effects */
.btn {
  padding: 12px 24px;
  background: transparent;
  border: 2px solid #ff7a00;
  color: #ff7a00;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
  z-index: 1;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: #ff7a00;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
  z-index: -1;
}

.btn:hover {
  color: white;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

/* Menu Hover Effect */
.menu-item {
  position: relative;
  padding: 10px 0;
  color: #333;
  text-decoration: none;
}

.menu-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #ff7a00;
  transition: width 0.3s ease;
}

.menu-item:hover::after {
  width: 100%;
}

/* Loading Spinner Transition */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff7a00;
  border-radius: 50%;
  transition: transform 0.3s ease;
  animation: spin 1s linear infinite;
}

.spinner:hover {
  transform: scale(1.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Accordion Transition */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.accordion.active .accordion-content {
  max-height: 500px; /* Large enough for content */
}

/* Modal Transition */
.modal {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal.active {
  opacity: 1;
  visibility: visible;
}

/* Multiple Transitions Example */
.animated-icon {
  display: inline-block;
  transition: transform 0.3s ease, color 0.2s ease, filter 0.3s ease;
}

.animated-icon:hover {
  transform: rotate(360deg) scale(1.2);
  color: #ff7a00;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.2));
}`,
          keyPoints: [
            "Transitions smooth property changes over time",
            "Not all properties can be transitioned - only interpolatable ones",
            "transform and opacity are most performant for animations",
            "cubic-bezier creates custom easing curves",
            "Transitions require a trigger (like :hover)",
            "Multiple properties can be transitioned simultaneously"
          ],
          quiz: [
            {
              question: "Which properties are most performant for animations?",
              options: [
                "width and height",
                "transform and opacity",
                "margin and padding",
                "color and background"
              ],
              correctAnswer: 1,
              explanation: "transform and opacity are GPU-accelerated and don't trigger layout/reflow, making them most performant."
            },
            {
              question: "What's the shorthand for transition property, duration, and timing function?",
              options: [
                "transition: all 0.3s ease",
                "animate: 0.3s ease all",
                "transition: 0.3s all ease",
                "animation: all 0.3s ease"
              ],
              correctAnswer: 0,
              explanation: "The shorthand order is transition: property duration timing-function delay;"
            }
          ]
        },
        {
          id: "css-ch5-page2",
          title: "CSS Keyframe Animations",
          content: `
## CSS Keyframe Animations

Keyframe animations offer more control than transitions, allowing multiple steps and automatic playback.

### Animation Properties:
- **animation-name** - @keyframes name
- **animation-duration** - How long
- **animation-timing-function** - Acceleration curve
- **animation-delay** - Delay before start
- **animation-iteration-count** - Number of times
- **animation-direction** - normal | reverse | alternate
- **animation-fill-mode** - forwards | backwards | both
- **animation-play-state** - running | paused
- **animation** - Shorthand

### Keyframe Syntax:
@keyframes name {
  0% { properties }
  50% { properties }
  100% { properties }
}

### Animation Directions:
- **normal** - 0% to 100%
- **reverse** - 100% to 0%
- **alternate** - normal then reverse
- **alternate-reverse** - reverse then normal

### Fill Modes:
- **none** - No styles before/after (default)
- **forwards** - Retain final state
- **backwards** - Apply first state before delay
- **both** - Both forwards and backwards
          `,
          exampleCode: `/* Basic Keyframe Animation */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 1s ease forwards;
}

/* Multiple Keyframes */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
}

.bounce {
  animation: bounce 1s ease infinite;
}

/* Complex Animation */
@keyframes slideInRotate {
  0% {
    opacity: 0;
    transform: translateX(-100px) rotate(-45deg);
  }
  50% {
    opacity: 0.5;
    transform: translateX(20px) rotate(10deg);
  }
  100% {
    opacity: 1;
    transform: translateX(0) rotate(0);
  }
}

.slide-rotate {
  animation: slideInRotate 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

/* Animation with Steps */
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}

.typewriter {
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid #ff7a00;
  animation: 
    typewriter 3s steps(40) forwards,
    blink 1s step-end infinite;
}

/* Loading Spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff7a00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Pulse Animation */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255,122,0,0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(255,122,0,0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255,122,0,0);
  }
}

.pulse-button {
  animation: pulse 2s infinite;
  background: #ff7a00;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
}

/* Shimmer Effect */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Floating Animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float {
  animation: float 3s ease-in-out infinite;
}

/* Wave Animation */
@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(15deg);
  }
  75% {
    transform: rotate(-15deg);
  }
}

.wave:hover {
  animation: wave 0.5s ease-in-out;
}

/* Multiple Elements Staggered */
@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.stagger-item {
  opacity: 0;
  animation: fadeInScale 0.5s ease forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }
.stagger-item:nth-child(5) { animation-delay: 0.5s; }

/* Page Transition */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.page-enter {
  animation: slideIn 0.5s ease forwards;
}

.page-exit {
  animation: slideOut 0.5s ease forwards;
}

/* 3D Flip Card */
.card-container {
  perspective: 1000px;
}

.flip-card {
  position: relative;
  width: 300px;
  height: 200px;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}

.flip-card:hover {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-front {
  background: #ff7a00;
  color: white;
}

.card-back {
  background: #333;
  color: white;
  transform: rotateY(180deg);
}

/* Animated Gradient */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-bg {
  background: linear-gradient(-45deg, #ff7a00, #ff2e2e, #8e44ad, #3498db);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

/* Text Reveal Animation */
@keyframes reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

.reveal-text {
  animation: reveal 1s ease forwards;
}

/* Bounce In Animation */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

.bounce-in {
  animation: bounceIn 0.6s ease forwards;
}

/* Loading Progress Bar */
@keyframes loading {
  0% { width: 0; }
  100% { width: 100%; }
}

.progress-bar {
  height: 4px;
  background: #ff7a00;
  animation: loading 2s ease infinite;
}

/* Animated Notification */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.notification {
  animation: slideInRight 0.3s ease forwards;
}

.notification.hide {
  animation: slideOutRight 0.3s ease forwards;
}

/* Combination with Transitions and Animations */
.interactive-card {
  transition: all 0.3s ease;
}

.interactive-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.interactive-card:active {
  animation: pulse 0.3s ease;
}`,
          keyPoints: [
            "Keyframes define multi-step animations",
            "Animations can run automatically without triggers",
            "Use animation-fill-mode to control pre/post states",
            "Infinite animations should be used sparingly",
            "transform-style: preserve-3d enables 3D effects",
            "Staggered delays create sequential animations"
          ],
          quiz: [
            {
              question: "What does animation-fill-mode: forwards do?",
              options: [
                "Makes animation play forward",
                "Retains the final state after animation ends",
                "Applies first frame before animation starts",
                "Makes animation infinite"
              ],
              correctAnswer: 1,
              explanation: "forwards preserves the property values from the last keyframe after the animation completes."
            },
            {
              question: "Which property creates 3D transformations?",
              options: [
                "transform-3d",
                "preserve-3d",
                "transform-style: preserve-3d",
                "3d-transform"
              ],
              correctAnswer: 2,
              explanation: "transform-style: preserve-3d allows children to be positioned in 3D space."
            }
          ]
        },
        {
          id: "css-ch5-page3",
          title: "Advanced Animation Techniques",
          content: `
## Advanced Animation Techniques

### Performance Optimization:
- Use transform and opacity for smooth animations
- Promote elements to their own layer (will-change)
- Avoid animating layout properties
- Use requestAnimationFrame for JS animations

### Will-Change Property:
- Hints browser about upcoming changes
- Allows browser optimizations
- Use sparingly, not on all elements

### Scroll-linked Animations:
- View Timeline
- Scroll Timeline
- Animation-timeline

### Web Animations API:
- Programmatic control
- Better performance than JS
- Seamless with CSS animations

### Accessibility Considerations:
- Respect prefers-reduced-motion
- Provide alternative experiences
- Don't rely solely on animation for information
          `,
          exampleCode: `/* Performance Optimization */

/* Bad - animates layout properties */
.bad-animation {
  width: 100px;
  height: 100px;
  transition: width 0.3s ease, height 0.3s ease;
}

.bad-animation:hover {
  width: 200px;
  height: 200px;
}

/* Good - uses transform */
.good-animation {
  transform: scale(1);
  transition: transform 0.3s ease;
}

.good-animation:hover {
  transform: scale(2);
}

/* Will-change hint */
.will-change-optimized {
  will-change: transform, opacity;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.will-change-optimized:hover {
  transform: translateY(-10px);
  opacity: 0.9;
}

/* Layer promotion */
.hardware-accelerated {
  transform: translateZ(0); /* Forces GPU layer */
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Scroll-linked Animations (Modern CSS) */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-animation {
  animation: fade-in linear forwards;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* View Timeline */
@view-timeline {
  source: auto;
  orientation: block;
}

.view-animation {
  animation: slide-in linear;
  animation-timeline: view(block);
  animation-range: entry 0% entry 100%;
}

/* Range-based animations */
@keyframes reveal {
  entry 0% {
    opacity: 0;
    transform: scale(0.8);
  }
  entry 100% {
    opacity: 1;
    transform: scale(1);
  }
  exit 0% {
    opacity: 1;
    transform: scale(1);
  }
  exit 100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

.reveal-on-scroll {
  animation: reveal linear;
  animation-timeline: view();
}

/* Parallax Effect */
.parallax-container {
  height: 100vh;
  overflow-y: auto;
  perspective: 2px;
}

.parallax-background {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateZ(-1px) scale(1.5);
  background-image: url('background.jpg');
  background-size: cover;
  z-index: -1;
}

.parallax-content {
  transform: translateZ(0);
  position: relative;
  z-index: 1;
}

/* Motion Path */
@keyframes move {
  0% {
    offset-distance: 0%;
  }
  100% {
    offset-distance: 100%;
  }
}

.motion-path {
  offset-path: path('M10,80 C40,10 65,10 95,80 S150,150 180,80');
  animation: move 3s linear infinite;
}

/* Complex Timeline */
@property --rotation {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes rotate-on-scroll {
  from { --rotation: 0deg; }
  to { --rotation: 360deg; }
}

.rotating-element {
  transform: rotate(var(--rotation));
  animation: rotate-on-scroll linear;
  animation-timeline: scroll();
}

/* Smooth State Transitions */
.smooth-state {
  transition: background-color 0.3s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease;
}

/* Accessibility - Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Fallback for reduced motion */
.animated-element {
  animation: bounce 1s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transform: none;
  }
}

/* Web Animations API Example (JS) */
/*
const element = document.querySelector('.animate-me');
const animation = element.animate([
  { transform: 'translateX(0px)' },
  { transform: 'translateX(100px)' }
], {
  duration: 1000,
  iterations: Infinity,
  direction: 'alternate',
  easing: 'ease-in-out'
});

// Control animation
animation.pause();
animation.play();
animation.reverse();
animation.finish();
animation.cancel();
*/

/* Combined Effects */
@keyframes float-and-glow {
  0%, 100% {
    transform: translateY(0);
    filter: drop-shadow(0 5px 15px rgba(255,122,0,0.3));
  }
  50% {
    transform: translateY(-10px);
    filter: drop-shadow(0 15px 25px rgba(255,122,0,0.5));
  }
}

.fancy-element {
  animation: float-and-glow 3s ease-in-out infinite;
}

/* Sequential Animation */
@keyframes step1 {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

@keyframes step2 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.sequential {
  animation: 
    step1 0.5s ease forwards,
    step2 0.5s 0.5s ease forwards;
}

/* Animation with Custom Easing */
.custom-easing {
  animation: slide 2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}

@keyframes slide {
  0% { transform: translateX(0); }
  100% { transform: translateX(200px); }
}

/* Interactive Timeline */
.timeline-track {
  position: relative;
  height: 4px;
  background: #ddd;
}

.timeline-progress {
  height: 100%;
  background: #ff7a00;
  transform: scaleX(0);
  transform-origin: left;
  animation: progress-timeline linear;
  animation-timeline: scroll();
}

@keyframes progress-timeline {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* View-based Opacity */
.fade-on-scroll {
  opacity: 0;
  animation: fade linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes fade {
  entry 0% { opacity: 0; }
  entry 100% { opacity: 1; }
  exit 0% { opacity: 1; }
  exit 100% { opacity: 0; }
}`,
          keyPoints: [
            "Use transform and opacity for smooth 60fps animations",
            "will-change hints browser for optimization (use sparingly)",
            "prefers-reduced-motion respects user accessibility settings",
            "Scroll-linked animations create immersive experiences",
            "Motion path allows complex movement trajectories",
            "Web Animations API provides programmatic control"
          ],
          quiz: [
            {
              question: "Why should we use prefers-reduced-motion?",
              options: [
                "To make animations faster",
                "To respect user accessibility preferences",
                "To reduce CSS code",
                "To improve SEO"
              ],
              correctAnswer: 1,
              explanation: "prefers-reduced-motion allows users with vestibular disorders to disable or reduce animations."
            },
            {
              question: "What does will-change do?",
              options: [
                "Changes the element permanently",
                "Hints browser about upcoming changes for optimization",
                "Makes animations impossible",
                "Removes the element from layout"
              ],
              correctAnswer: 1,
              explanation: "will-change tells the browser what properties might change, allowing it to optimize ahead of time."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "What's the most performant way to animate an element's position?",
          options: [
            "left: 100px; transition: left 0.3s",
            "transform: translateX(100px); transition: transform 0.3s",
            "margin-left: 100px; transition: margin 0.3s",
            "position: absolute; left: 100px"
          ],
          correctAnswer: 1,
          explanation: "transform uses GPU acceleration and doesn't trigger layout/reflow, making it most performant."
        },
        {
          question: "How do you respect reduced motion preferences?",
          options: [
            "Use slower animations",
            "Use @media (prefers-reduced-motion: reduce)",
            "Remove all animations",
            "Use JavaScript"
          ],
          correctAnswer: 1,
          explanation: "The prefers-reduced-motion media query detects user preferences and allows appropriate fallbacks."
        }
      ]
    },

    // ===============================
    // CHAPTER 6 – Advanced CSS Features
    // ===============================
    {
      id: "css-ch6",
      title: "Advanced CSS Features",
      description: "CSS variables, filters, blend modes, and modern CSS features",
      pages: [
        {
          id: "css-ch6-page1",
          title: "CSS Custom Properties (Variables)",
          content: `
## CSS Custom Properties (Variables)

CSS variables allow reusable values throughout stylesheets.

### Benefits:
- Centralized theme management
- Dynamic updates with JavaScript
- Cascade and inheritance
- Runtime manipulation

### Syntax:
- **Declaration** --variable-name: value
- **Usage** var(--variable-name)
- **Fallback** var(--variable-name, fallback-value)

### Scope:
- **Global** - Declared on :root
- **Local** - Declared in specific elements

### JavaScript Access:
- getPropertyValue()
- setProperty()
          `,
          exampleCode: `/* Global Variables */
:root {
  /* Colors */
  --primary-color: #ff7a00;
  --secondary-color: #8e44ad;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  
  /* Typography */
  --font-family: 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px;
  --font-size-lg: 1.2rem;
  --font-size-sm: 0.875rem;
  --line-height: 1.6;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-xxl: 3rem;
  
  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --border-radius-circle: 50%;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.14);
  --shadow-xl: 0 12px 24px rgba(0,0,0,0.16);
  
  /* Transitions */
  --transition-fast: 0.2s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
  
  /* Layout */
  --container-max-width: 1200px;
  --header-height: 80px;
  --sidebar-width: 250px;
  
  /* Z-indices */
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-modal: 1030;
  --z-index-popover: 1040;
  --z-index-tooltip: 1050;
}

/* Local Variables */
.card {
  --card-padding: var(--spacing-lg);
  --card-bg: white;
  --card-border-radius: var(--border-radius-md);
  --card-shadow: var(--shadow-md);
  
  padding: var(--card-padding);
  background: var(--card-bg);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}

/* Variable Fallbacks */
.old-browser {
  color: var(--undefined-color, #333); /* Falls back to #333 */
}

/* Dynamic Theming */
.light-theme {
  --bg-color: #ffffff;
  --text-color: #333333;
  --link-color: #ff7a00;
}

.dark-theme {
  --bg-color: #1a1a1a;
  --text-color: #f5f5f5;
  --link-color: #ff9a44;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color var(--transition-base),
              color var(--transition-base);
}

a {
  color: var(--link-color);
}

/* Theme Toggle with JavaScript */
/*
// JavaScript
const root = document.documentElement;
root.style.setProperty('--primary-color', '#00ff7a');

// Get variable value
const primary = getComputedStyle(root).getPropertyValue('--primary-color');
*/

/* Responsive Variables */
:root {
  --container-padding: 20px;
  --heading-size: 2rem;
}

@media (max-width: 768px) {
  :root {
    --container-padding: 15px;
    --heading-size: 1.5rem;
  }
}

/* Component Variables */
.button {
  --btn-bg: var(--primary-color);
  --btn-color: white;
  --btn-padding: var(--spacing-md) var(--spacing-lg);
  --btn-radius: var(--border-radius-sm);
  
  background: var(--btn-bg);
  color: var(--btn-color);
  padding: var(--btn-padding);
  border-radius: var(--btn-radius);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.button:hover {
  --btn-bg: var(--secondary-color);
}

.button.secondary {
  --btn-bg: var(--secondary-color);
}

.button.outline {
  --btn-bg: transparent;
  --btn-color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

/* Calculator with Variables */
:root {
  --base-size: 16px;
  --ratio: 1.618; /* Golden ratio */
}

h1 { font-size: calc(var(--base-size) * var(--ratio) * var(--ratio) * var(--ratio)); }
h2 { font-size: calc(var(--base-size) * var(--ratio) * var(--ratio)); }
h3 { font-size: calc(var(--base-size) * var(--ratio)); }
p { font-size: var(--base-size); }

/* Color Manipulation with Variables */
:root {
  --hue: 30;
  --saturation: 100%;
  --lightness: 50%;
  --primary: hsl(var(--hue), var(--saturation), var(--lightness));
  --primary-light: hsl(var(--hue), calc(var(--saturation) - 20%), calc(var(--lightness) + 15%));
  --primary-dark: hsl(var(--hue), calc(var(--saturation) - 10%), calc(var(--lightness) - 15%));
}

/* Complex Theme System */
.theme-default {
  --primary-h: 30;
  --primary-s: 100%;
  --primary-l: 50%;
  
  --secondary-h: 280;
  --secondary-s: 60%;
  --secondary-l: 47%;
}

.theme-blue {
  --primary-h: 210;
  --primary-s: 100%;
  --primary-l: 50%;
  
  --secondary-h: 350;
  --secondary-s: 80%;
  --secondary-l: 50%;
}

/* Usage in components */
.card {
  background: hsl(var(--primary-h), var(--primary-s), var(--primary-l));
  color: white;
}

.card-secondary {
  background: hsl(var(--secondary-h), var(--secondary-s), var(--secondary-l));
}

/* CSS Custom Properties with calc */
:root {
  --columns: 4;
  --gap: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  gap: var(--gap);
}

@media (max-width: 768px) {
  :root {
    --columns: 2;
    --gap: 15px;
  }
}

@media (max-width: 480px) {
  :root {
    --columns: 1;
    --gap: 10px;
  }
}

/* Animation with Variables */
@keyframes move {
  from { transform: translateX(0); }
  to { transform: translateX(var(--move-distance, 100px)); }
}

.moving-element {
  --move-distance: 200px;
  animation: move 2s ease infinite alternate;
}

/* Component API with Variables */
.alert {
  --alert-bg: var(--info-color);
  --alert-border: var(--info-color);
  --alert-color: white;
  
  background: var(--alert-bg);
  border: 1px solid var(--alert-border);
  color: var(--alert-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
}

.alert.success {
  --alert-bg: var(--success-color);
  --alert-border: var(--success-color);
}

.alert.warning {
  --alert-bg: var(--warning-color);
  --alert-border: var(--warning-color);
  --alert-color: var(--dark-color);
}

.alert.error {
  --alert-bg: var(--danger-color);
  --alert-border: var(--danger-color);
}`,
          keyPoints: [
            "CSS variables enable dynamic theming and reusable values",
            "Use :root for global variables, element scope for local",
            "Variables cascade and can be overridden",
            "JavaScript can read and modify variables at runtime",
            "Use fallback values for browser compatibility",
            "Combine with calc() for dynamic calculations"
          ],
          quiz: [
            {
              question: "How do you declare a global CSS variable?",
              options: [
                "$primary-color: #ff7a00;",
                "@primary-color: #ff7a00;",
                "--primary-color: #ff7a00; on :root",
                "var-primary-color: #ff7a00;"
              ],
              correctAnswer: 2,
              explanation: "Global CSS variables are declared on :root with the -- prefix."
            },
            {
              question: "How do you access a CSS variable with fallback?",
              options: [
                "var(--primary-color, #333)",
                "get(--primary-color, #333)",
                "css(--primary-color, #333)",
                "use(--primary-color, #333)"
              ],
              correctAnswer: 0,
              explanation: "var(--variable, fallback) provides a fallback value if the variable isn't defined."
            }
          ]
        },
        {
          id: "css-ch6-page2",
          title: "CSS Filters & Blend Modes",
          content: `
## CSS Filters

Filters apply graphical effects like blur, contrast, and grayscale.

### Filter Functions:
- **blur()** - Gaussian blur
- **brightness()** - Adjust brightness
- **contrast()** - Adjust contrast
- **drop-shadow()** - Drop shadow (follows shape)
- **grayscale()** - Convert to grayscale
- **hue-rotate()** - Rotate hue
- **invert()** - Invert colors
- **opacity()** - Set transparency
- **saturate()** - Adjust saturation
- **sepia()** - Sepia tone
- **url()** - SVG filter reference

## Backdrop Filters:
Apply filters to the area behind an element

## Blend Modes:
Control how elements blend with their background

### Mix Blend Mode:
- **normal**
- **multiply**
- **screen**
- **overlay**
- **darken/lighten**
- **color-dodge/burn**
- **hard-light/soft-light**
- **difference/exclusion**
- **hue/saturation/color/luminosity**

### Background Blend Mode:
Blend background images and colors
          `,
          exampleCode: `/* Basic Filters */
.blur {
  filter: blur(5px);
}

.brightness {
  filter: brightness(150%);
}

.contrast {
  filter: contrast(200%);
}

.grayscale {
  filter: grayscale(100%);
}

.hue-rotate {
  filter: hue-rotate(90deg);
}

.invert {
  filter: invert(100%);
}

.saturate {
  filter: saturate(200%);
}

.sepia {
  filter: sepia(100%);
}

/* Multiple Filters */
.multiple-filters {
  filter: brightness(120%) contrast(110%) saturate(120%);
}

/* Drop Shadow (different from box-shadow) */
.drop-shadow {
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
}

/* Drop shadow on transparent PNG follows shape */
.logo {
  filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3));
}

/* Hover Effects with Filters */
.image-effect {
  transition: filter 0.3s ease;
}

.image-effect:hover {
  filter: brightness(110%) contrast(110%);
}

/* Duotone Effect with Filters */
.duotone {
  filter: sepia(100%) hue-rotate(180deg) saturate(200%);
}

/* Backdrop Filters */
.backdrop-blur {
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.1);
}

.backdrop-brightness {
  backdrop-filter: brightness(150%);
}

.backdrop-contrast {
  backdrop-filter: contrast(150%);
}

/* Glassmorphism Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  padding: 20px;
}

/* Multiple Backdrop Filters */
.backdrop-multiple {
  backdrop-filter: blur(10px) brightness(150%) saturate(180%);
}

/* Background Blend Modes */
.blend-multiply {
  background-image: url('image1.jpg'), url('image2.jpg');
  background-blend-mode: multiply;
  background-size: cover;
}

.blend-screen {
  background-image: url('image1.jpg'), linear-gradient(45deg, red, blue);
  background-blend-mode: screen;
}

/* Mix Blend Modes */
.mix-multiply {
  mix-blend-mode: multiply;
}

.mix-screen {
  mix-blend-mode: screen;
}

.mix-overlay {
  mix-blend-mode: overlay;
}

.mix-difference {
  mix-blend-mode: difference;
}

/* Text Effects with Blend Modes */
.text-overlay {
  position: relative;
  color: white;
  mix-blend-mode: difference;
}

/* Creative Examples */

/* 1. Instagram-like Filters */
.instagram-clarendon {
  filter: brightness(120%) contrast(120%) saturate(125%);
}

.instagram-gingham {
  filter: brightness(105%) contrast(110%) sepia(10%);
}

.instagram-lark {
  filter: brightness(110%) contrast(110%) hue-rotate(10deg) saturate(130%);
}

/* 2. Vintage Effect */
.vintage {
  filter: sepia(50%) brightness(90%) contrast(90%) saturate(80%);
}

/* 3. Cool Blue Effect */
.cool-blue {
  filter: hue-rotate(180deg) saturate(150%) brightness(110%);
}

/* 4. Warm Sunset Effect */
.warm-sunset {
  filter: sepia(50%) hue-rotate(320deg) saturate(150%);
}

/* 5. Double Exposure Effect */
.double-exposure {
  position: relative;
}

.double-exposure::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('texture.jpg');
  mix-blend-mode: screen;
  opacity: 0.5;
  pointer-events: none;
}

/* 6. Frosted Glass with Backdrop Filter */
.frosted-glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(15px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 7. Color Pop Effect */
.color-pop {
  filter: grayscale(100%);
  transition: filter 0.5s ease;
}

.color-pop:hover {
  filter: grayscale(0%);
}

/* 8. Glitch Effect */
@keyframes glitch {
  0% {
    filter: hue-rotate(0deg) blur(0);
  }
  20% {
    filter: hue-rotate(90deg) blur(2px);
  }
  40% {
    filter: hue-rotate(180deg) blur(0);
  }
  60% {
    filter: hue-rotate(270deg) blur(2px);
  }
  80% {
    filter: hue-rotate(360deg) blur(0);
  }
  100% {
    filter: hue-rotate(0deg) blur(0);
  }
}

.glitch:hover {
  animation: glitch 0.3s ease infinite;
}

/* 9. Neon Glow */
.neon {
  filter: drop-shadow(0 0 10px currentColor) brightness(150%);
  color: #ff7a00;
}

/* 10. Image Mask with Blend */
.masked-image {
  background: linear-gradient(45deg, red, blue);
  mix-blend-mode: overlay;
}

/* Practical Applications */

/* Hero Section with Overlay */
.hero {
  position: relative;
  background-image: url('hero.jpg');
  background-size: cover;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(2px);
}

.hero-content {
  position: relative;
  z-index: 1;
  color: white;
  mix-blend-mode: difference;
}

/* Colorful Card Hover */
.colorful-card {
  transition: all 0.3s ease;
}

.colorful-card:hover {
  filter: hue-rotate(90deg) brightness(120%);
  transform: scale(1.05);
}

/* Image Gallery Hover */
.gallery-item {
  overflow: hidden;
}

.gallery-item img {
  transition: filter 0.3s ease, transform 0.3s ease;
}

.gallery-item:hover img {
  filter: brightness(80%) blur(2px);
  transform: scale(1.1);
}

.gallery-item:hover .caption {
  mix-blend-mode: difference;
  color: white;
}`,
          keyPoints: [
            "Filters modify element appearance non-destructively",
            "Backdrop filters affect area behind element (glassmorphism)",
            "Blend modes control how elements combine with background",
            "Drop shadow follows shape contours (unlike box-shadow)",
            "Multiple filters can be combined",
            "Performance impact on mobile - use sparingly"
          ],
          quiz: [
            {
              question: "What's the difference between box-shadow and drop-shadow?",
              options: [
                "They're the same",
                "drop-shadow follows shape contours, box-shadow follows box",
                "box-shadow is newer",
                "drop-shadow only works on images"
              ],
              correctAnswer: 1,
              explanation: "drop-shadow creates a shadow that follows the actual shape (including transparency), while box-shadow follows the element's box."
            },
            {
              question: "What does backdrop-filter do?",
              options: [
                "Filters the element itself",
                "Filters the area behind the element",
                "Filters background images only",
                "Creates a backdrop for modals"
              ],
              correctAnswer: 1,
              explanation: "backdrop-filter applies filters to the area behind an element, creating effects like frosted glass."
            }
          ]
        },
        {
          id: "css-ch6-page3",
          title: "Modern CSS Features",
          content: `
## Modern CSS Features

### CSS Shapes:
- **shape-outside** - Wrap text around custom shapes
- **clip-path** - Clip elements to shapes
- **offset-path** - Motion path

### CSS Scroll Snap:
- **scroll-snap-type** - Snap behavior
- **scroll-snap-align** - Snap position
- **scroll-margin/padding** - Adjust snap area

### CSS Math Functions:
- **min()** - Smallest value
- **max()** - Largest value
- **clamp()** - Value within range
- **calc()** - Calculations

### CSS Logical Properties:
- **inline/block** instead of left/right/top/bottom
- Better for internationalization

### CSS Subgrid:
- Nested grid alignment

### CSS Nesting:
- Sass-like nesting (modern browsers)

### CSS :has() Selector:
- Parent selector

### CSS Cascade Layers:
- Control specificity layers
          `,
          exampleCode: `/* CSS Shapes */
.shape-example {
  float: left;
  shape-outside: circle(50%);
  width: 200px;
  height: 200px;
  clip-path: circle(50%);
  background: #ff7a00;
}

.shape-polygon {
  shape-outside: polygon(0 0, 100% 0, 100% 100%);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  width: 200px;
  height: 200px;
  background: #8e44ad;
}

/* Clip Path Examples */
.clip-circle {
  clip-path: circle(50% at 50% 50%);
}

.clip-ellipse {
  clip-path: ellipse(25% 40% at 50% 50%);
}

.clip-polygon {
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

.clip-inset {
  clip-path: inset(20px 20px 20px 20px round 10px);
}

/* Scroll Snap */
.scroll-container {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  display: flex;
  gap: 20px;
}

.scroll-item {
  scroll-snap-align: start;
  flex: 0 0 300px;
  height: 200px;
  background: #ff7a00;
}

.vertical-snap {
  scroll-snap-type: y proximity;
  height: 300px;
  overflow-y: auto;
}

.vertical-item {
  scroll-snap-align: start;
  height: 200px;
  background: #8e44ad;
  margin-bottom: 10px;
}

/* CSS Math Functions */
.math-demo {
  width: min(90%, 1200px); /* Takes the smaller value */
  height: max(300px, 50vh); /* Takes the larger value */
  padding: clamp(1rem, 5%, 3rem); /* Value within range */
  margin: calc(100% - 200px);
}

/* Responsive with min/max */
.responsive-card {
  width: min(400px, 100%);
  height: min(300px, 50vh);
  font-size: clamp(1rem, 2vw, 1.5rem);
}

/* Logical Properties */
.logical-demo {
  margin-inline: 20px; /* Left and right in LTR, right and left in RTL */
  margin-block: 10px; /* Top and bottom */
  padding-inline-start: 15px; /* Left in LTR, right in RTL */
  border-inline-end: 2px solid #ff7a00; /* Right border in LTR */
  
  inset-inline: 0; /* Left and right positioning */
  inset-block: 0; /* Top and bottom positioning */
}

/* RTL Support */
[dir="rtl"] .logical-demo {
  /* Automatically handled by logical properties */
}

/* CSS Subgrid */
.subgrid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.subgrid-item {
  display: grid;
  grid-template-rows: subgrid; /* Inherit row sizing from parent */
  grid-row: span 2;
}

/* CSS Nesting */
.card {
  background: white;
  
  & .header {
    font-size: 1.2rem;
    
    &:hover {
      color: #ff7a00;
    }
  }
  
  & > .content {
    padding: 1rem;
    
    & p {
      margin: 0;
    }
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
}

/* CSS :has() Selector - Parent Selector */
.card:has(img) {
  display: flex;
  gap: 20px;
}

.container:has(.active) {
  background: #f0f0f0;
}

form:has(input:invalid) {
  border-color: red;
}

/* Select parent if it contains a specific element */
section:has(h2) {
  margin-top: 2rem;
}

/* Cascade Layers */
@layer reset, base, components, utilities;

@layer reset {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

@layer base {
  body {
    font-family: sans-serif;
    line-height: 1.6;
  }
}

@layer components {
  .button {
    padding: 0.5rem 1rem;
    background: #ff7a00;
    color: white;
  }
}

@layer utilities {
  .text-center {
    text-align: center;
  }
}

/* CSS Container Queries (already covered) */
@container (min-width: 400px) {
  .card {
    display: flex;
  }
}

/* CSS Trigonometric Functions */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* CSS Color Functions */
.color-demo {
  background: color-mix(in srgb, #ff7a00 50%, white);
  color: color-contrast(#ff7a00 vs white, black);
}

/* Custom Media Queries */
@custom-media --mobile (max-width: 768px);
@custom-media --tablet (min-width: 769px) and (max-width: 1024px);
@custom-media --desktop (min-width: 1025px);

@media (--mobile) {
  .container {
    padding: 10px;
  }
}

/* CSS Gradients - Advanced */
.conic-gradient {
  background: conic-gradient(from 90deg, #ff7a00, #8e44ad, #ff7a00);
  border-radius: 50%;
  width: 200px;
  height: 200px;
}

.radial-gradient {
  background: radial-gradient(circle at 30% 30%, #ff7a00, #8e44ad);
}

.repeating-gradient {
  background: repeating-linear-gradient(45deg, #ff7a00 0px, #ff7a00 10px, #8e44ad 10px, #8e44ad 20px);
}

/* CSS Masking */
.mask-image {
  mask-image: linear-gradient(to bottom, transparent, black);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black);
}

.mask-border {
  mask-border: url('mask.png') 30 repeat;
}

/* CSS Painting API (Custom Paint) */
@property --my-color {
  syntax: '<color>';
  inherits: false;
  initial-value: #ff7a00;
}

@keyframes color-change {
  from { --my-color: #ff7a00; }
  to { --my-color: #8e44ad; }
}

/* CSS Overscroll Behavior */
.overscroll-example {
  overscroll-behavior: contain; /* Prevent scroll chaining */
  overscroll-behavior-x: none; /* Disable horizontal overscroll */
}

/* CSS Scrollbar Styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ff7a00;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e66a00;
}

/* CSS Counter */
.chapter {
  counter-increment: chapter;
}

.chapter::before {
  content: "Chapter " counter(chapter) ": ";
  color: #ff7a00;
  font-weight: bold;
}

/* CSS @property for Animations */
@property --rotation {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.rotating-box {
  --rotation: 0deg;
  transform: rotate(var(--rotation));
  animation: rotate 2s linear infinite;
  background: #ff7a00;
  width: 100px;
  height: 100px;
}

@keyframes rotate {
  to { --rotation: 360deg; }
}`,
          keyPoints: [
            "CSS Shapes enable creative text wrapping",
            "Scroll snap creates smooth scrolling experiences",
            "clamp(), min(), max() provide fluid responsive values",
            "Logical properties improve internationalization",
            "Subgrid aligns nested grids with parent",
            ":has() selector enables parent selection based on children"
          ],
          quiz: [
            {
              question: "What does :has() selector do?",
              options: [
                "Selects elements that have a specific attribute",
                "Selects parent elements containing specific children",
                "Selects elements with specific properties",
                "Selects sibling elements"
              ],
              correctAnswer: 1,
              explanation: ":has() selects an element if it contains another element matching the selector - it's a parent selector."
            },
            {
              question: "What's the benefit of logical properties?",
              options: [
                "They're faster",
                "They automatically handle different writing modes",
                "They use less CSS",
                "They're only for RTL languages"
              ],
              correctAnswer: 1,
              explanation: "Logical properties (margin-inline, padding-block) adapt to different writing modes and directions automatically."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "How do you create a CSS custom property that can be animated?",
          options: [
            "Use @keyframes directly",
            "Use @property to define syntax",
            "Use var() with transition",
            "Cannot animate custom properties"
          ],
          correctAnswer: 1,
          explanation: "@property defines custom properties with a syntax type, allowing them to be animated."
        },
        {
          question: "Which feature allows selecting a parent based on its children?",
          options: [
            ":parent",
            ":contains",
            ":has()",
            ":with"
          ],
          correctAnswer: 2,
          explanation: ":has() is the parent selector that styles an element based on its children."
        }
      ]
    },

    // ===============================
    // CHAPTER 7 – CSS Best Practices
    // ===============================
    {
      id: "css-ch7",
      title: "CSS Best Practices",
      description: "Architecture, naming conventions, and optimization",
      pages: [
        {
          id: "css-ch7-page1",
          title: "CSS Architecture & Methodologies",
          content: `
## CSS Architecture

### BEM (Block Element Modifier):
- **Block** - Standalone component (.card)
- **Element** - Part of block (.card__title)
- **Modifier** - Variation (.card--featured)

### SMACSS:
- Base
- Layout
- Module
- State
- Theme

### OOCSS:
- Separate structure from skin
- Separate container from content

### ITCSS:
- Settings
- Tools
- Generic
- Elements
- Objects
- Components
- Utilities

### CSS-in-JS:
- Styled Components
- Emotion
- CSS Modules

### Utility-First CSS:
- Tailwind CSS
- Atomic CSS
          `,
          exampleCode: `/* BEM Methodology */

/* Block */
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Element */
.card__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.card__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.card__content {
  color: #333;
  line-height: 1.5;
}

.card__footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

/* Modifier */
.card--featured {
  border: 2px solid #ff7a00;
  transform: scale(1.02);
}

.card--compact {
  padding: 10px;
}

.card--compact .card__title {
  font-size: 1rem;
}

/* BEM with Modifiers for Elements */
.card__button--primary {
  background: #ff7a00;
  color: white;
}

.card__button--secondary {
  background: transparent;
  color: #ff7a00;
  border: 2px solid #ff7a00;
}

/* SMACSS Example */

/* Base */
body {
  margin: 0;
  font-family: sans-serif;
  line-height: 1.6;
}

/* Layout */
.l-header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
}

.l-main {
  margin-top: 80px;
  padding: 20px;
}

.l-footer {
  background: #333;
  color: white;
  padding: 40px 20px;
}

/* Module */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 8px;
  z-index: 1000;
}

/* State */
.is-hidden {
  display: none !important;
}

.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

/* Theme */
.theme-dark .modal {
  background: #333;
  color: white;
}

/* OOCSS Example */

/* Structure */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Skin */
.btn-primary {
  background: #ff7a00;
  color: white;
}

.btn-secondary {
  background: transparent;
  color: #ff7a00;
  border: 2px solid #ff7a00;
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.2rem;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.875rem;
}

/* ITCSS Structure */
/* 1. Settings */
:root {
  --primary-color: #ff7a00;
  --spacing-unit: 8px;
  --container-width: 1200px;
}

/* 2. Tools */
@mixin center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 3. Generic */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 4. Elements */
body {
  font-family: sans-serif;
  color: #333;
}

a {
  color: var(--primary-color);
}

/* 5. Objects */
.container {
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 6. Components */
.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 7. Utilities */
.text-center { text-align: center; }
.mt-1 { margin-top: calc(var(--spacing-unit) * 1); }
.mt-2 { margin-top: calc(var(--spacing-unit) * 2); }
.mt-3 { margin-top: calc(var(--spacing-unit) * 3); }

/* CSS Modules Example */
/*
import styles from './Button.module.css';

<button className={styles.button}>Click</button>
*/

/* Styled Components (CSS-in-JS) */
/*
import styled from 'styled-components';

const Button = styled.button\`
  background: #ff7a00;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  
  &:hover {
    background: #e66a00;
  }
\`;
*/

/* Utility-First CSS (Tailwind-like) */
.utility-demo {
  @apply bg-orange-500 text-white px-4 py-2 rounded;
}

/* Custom Utility Classes */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* CSS Organization with Comments */

/* ========================================
   Variables
   ======================================== */
:root {
  /* Colors */
  --color-primary: #ff7a00;
  --color-secondary: #8e44ad;
  
  /* Spacing */
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
}

/* ========================================
   Base Styles
   ======================================== */
/* ... */

/* ========================================
   Components
   ======================================== */
/* Card Component
   ============================ */
.card {
  /* Styles */
}

/* Button Component
   ============================ */
.btn {
  /* Styles */
}

/* ========================================
   Utilities
   ======================================== */
/* Spacing Utilities */
/* ... */

/* Responsive Design Pattern */
.responsive-component {
  /* Mobile first styles */
  
  @media (min-width: 768px) {
    /* Tablet styles */
  }
  
  @media (min-width: 1024px) {
    /* Desktop styles */
  }
}

/* CSS File Structure */
/*
styles/
├── base/
│   ├── reset.css
│   ├── typography.css
│   └── variables.css
├── components/
│   ├── button.css
│   ├── card.css
│   └── modal.css
├── layouts/
│   ├── header.css
│   ├── footer.css
│   └── grid.css
├── pages/
│   ├── home.css
│   └── about.css
├── utils/
│   ├── spacing.css
│   └── colors.css
└── main.css
*/`,
          keyPoints: [
            "BEM provides clear naming convention for maintainable CSS",
            "SMACSS categorizes CSS into base, layout, module, state, theme",
            "OOCSS promotes reusable object-oriented styles",
            "ITCSS creates a clear specificity hierarchy",
            "Choose methodology based on project size and team preference",
            "Consistency is more important than which methodology"
          ],
          quiz: [
            {
              question: "In BEM, what does the double underscore (__) represent?",
              options: [
                "Block",
                "Element",
                "Modifier",
                "Variable"
              ],
              correctAnswer: 1,
              explanation: "In BEM, __ separates the Block from its Element (e.g., card__title)."
            },
            {
              question: "What's the main principle of OOCSS?",
              options: [
                "Use only classes, no IDs",
                "Separate structure from skin",
                "Write mobile-first CSS",
                "Use preprocessors"
              ],
              correctAnswer: 1,
              explanation: "OOCSS separates structure (layout) from skin (visual design) to promote reusability."
            }
          ]
        },
        {
          id: "css-ch7-page2",
          title: "CSS Performance Optimization",
          content: `
## CSS Performance Optimization

### Critical CSS:
- Inline above-the-fold styles
- Defer non-critical CSS
- Load CSS asynchronously

### CSS Optimization Techniques:
- Minify CSS
- Remove unused CSS
- Combine media queries
- Use shorthand properties
- Avoid expensive selectors
- Use will-change sparingly

### Selector Performance:
- Avoid universal selectors (*)
- Avoid deep nesting
- Use classes over element selectors
- Keep selectors short

### Rendering Performance:
- Use transform and opacity for animations
- Avoid layout thrashing
- Promote to GPU layer
- Reduce paint areas

### Asset Optimization:
- Use CSS sprites
- Inline small assets (base64)
- Use modern image formats
- Lazy load below-fold content
          `,
          exampleCode: `/* Critical CSS - Inline in HTML */
<style>
  /* Above-the-fold styles only */
  header {
    position: fixed;
    top: 0;
    width: 100%;
    background: white;
    z-index: 100;
  }
  
  .hero {
    height: 100vh;
    background: linear-gradient(135deg, #ff7a00, #8e44ad);
    color: white;
  }
</style>

<!-- Load non-critical CSS asynchronously -->
<link rel="preload" href="non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>

/* Minified CSS Example */
/* Before minification */
.button {
  background-color: #ff7a00;
  color: #ffffff;
  padding-top: 12px;
  padding-right: 24px;
  padding-bottom: 12px;
  padding-left: 24px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
}

/* After minification */
.button{background:#ff7a00;color:#fff;padding:12px 24px;border-radius:4px}

/* Remove Unused CSS with tools like PurgeCSS */
/* Keep only used styles */

/* Combine Media Queries */
/* Instead of this: */
@media (max-width: 768px) {
  .sidebar { display: none; }
}

@media (max-width: 768px) {
  .main { width: 100%; }
}

/* Do this: */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { width: 100%; }
}

/* Expensive Selectors to Avoid */
/* Bad */
* { box-sizing: border-box; } /* Universal selector */
div > p:first-child { color: red; } /* Complex */
ul li a span { color: blue; } /* Deep nesting */
[data-attribute^="value"] { color: green; } /* Expensive attribute */

/* Good */
.container { box-sizing: border-box; }
.active-link { color: blue; }

/* Layout Thrashing Prevention */
/* Bad - causes multiple reflows */
element.style.width = '100px';
element.style.height = '100px';
element.style.margin = '10px';

/* Good - batch DOM reads/writes */
element.style.cssText = 'width: 100px; height: 100px; margin: 10px;';

/* Or use classList */
element.classList.add('box');

/* GPU Layer Promotion */
.gpu-layer {
  transform: translateZ(0);
  will-change: transform; /* Use sparingly */
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Reduce Paint Areas */
/* Bad - animates large area */
.large-area {
  width: 100%;
  height: 100vh;
  transition: background 0.3s;
}

/* Good - animate small overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

/* CSS Sprites */
.sprite-icon {
  background-image: url('sprite.png');
  background-position: -20px -40px; /* Position specific icon */
  width: 20px;
  height: 20px;
  display: inline-block;
}

/* Base64 Inline Images */
.inline-image {
  background-image: url('data:image/svg+xml;utf8,<svg...></svg>');
  background-size: contain;
  width: 20px;
  height: 20px;
}

/* Lazy Loading Images */
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy-image.loaded {
  opacity: 1;
}

/* Efficient Animations */
/* Bad */
.bad-animation {
  animation: bad 1s infinite;
}

@keyframes bad {
  from { 
    left: 0; /* Triggers layout */
    top: 0; 
  }
  to { 
    left: 100px; 
    top: 100px; 
  }
}

/* Good */
.good-animation {
  animation: good 1s infinite;
}

@keyframes good {
  from { 
    transform: translate(0, 0); /* Compositor-only */
  }
  to { 
    transform: translate(100px, 100px); 
  }
}

/* Content Visibility for Off-screen Elements */
.off-screen {
  content-visibility: auto; /* Skip rendering when off-screen */
  contain-intrinsic-size: 0 500px; /* Reserve space */
}

/* Font Loading Optimization */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Show fallback font while loading */
  font-weight: 400;
}

/* Reduce Repaints with Containment */
.widget {
  contain: layout style paint; /* Isolate from rest of page */
}

/* CSS Containment */
.contained {
  contain: strict; /* Maximum containment */
  content-visibility: auto;
}

/* Efficient Selector Writing */
/* Instead of this: */
ul.nav li.active a { color: red; }

/* Do this: */
.nav-link-active { color: red; }

/* Reduce Specificity Wars */
/* Instead of escalating specificity */
#header .nav ul li a { color: blue; } /* Specificity war */

/* Use single classes */
.nav-link { color: blue; }

/* Print styles optimization */
@media print {
  /* Hide unnecessary elements */
  nav, footer, .ads {
    display: none !important;
  }
  
  /* Optimize for black and white */
  * {
    color: black !important;
    background: white !important;
  }
  
  /* Ensure links are readable */
  a[href]::after {
    content: " (" attr(href) ")";
  }
}

/* Media Query Performance */
/* Group similar breakpoints */
/* Instead of multiple similar queries */
@media (max-width: 480px) { /* ... */ }
@media (min-width: 481px) and (max-width: 768px) { /* ... */ }

/* Use range syntax */
@media (width <= 480px) { /* ... */ }
@media (481px <= width <= 768px) { /* ... */ }

/* CSS Variables Performance */
:root {
  --dynamic-color: #ff7a00;
}

.element {
  color: var(--dynamic-color); /* Slightly slower than static values */
}

/* For frequently updated values, consider direct properties */
.static-element {
  color: #ff7a00; /* Faster */
}

/* Reduce CSS File Size */
/* Avoid long hex codes */
/* Instead of #ff7a00ff (8 chars) */
color: #ff7a00; /* 6 chars */

/* Use shorthand when possible */
margin: 10px 5px; /* Instead of margin: 10px 5px 10px 5px */

/* Avoid vendor prefixes where not needed */
/* Instead of: */
-webkit-border-radius: 4px;
-moz-border-radius: 4px;
border-radius: 4px;

/* Modern browsers only need: */
border-radius: 4px;`,
          keyPoints: [
            "Critical CSS improves perceived performance",
            "Minify and remove unused CSS for smaller bundles",
            "Use transform/opacity for smooth 60fps animations",
            "Avoid expensive selectors and deep nesting",
            "Content-visibility skips rendering off-screen content",
            "Measure performance with Lighthouse and DevTools"
          ],
          quiz: [
            {
              question: "What's the most performant way to animate an element?",
              options: [
                "Change left/top properties",
                "Use transform and opacity",
                "Animate width and height",
                "Use JavaScript directly"
              ],
              correctAnswer: 1,
              explanation: "transform and opacity are compositor-only properties that don't trigger layout or paint."
            },
            {
              question: "What does content-visibility: auto do?",
              options: [
                "Hides content permanently",
                "Skips rendering off-screen content until needed",
                "Makes content visible only on hover",
                "Prioritizes content loading"
              ],
              correctAnswer: 1,
              explanation: "content-visibility: auto skips rendering off-screen elements, improving initial load performance."
            }
          ]
        }
      ],
      chapterQuiz: [
        {
          question: "Which CSS methodology uses __ for elements and -- for modifiers?",
          options: ["SMACSS", "BEM", "OOCSS", "ITCSS"],
          correctAnswer: 1,
          explanation: "BEM uses block__element for elements and block--modifier for variations."
        },
        {
          question: "What's the purpose of critical CSS?",
          options: [
            "To make CSS more important",
            "To inline above-the-fold styles for faster rendering",
            "To compress CSS files",
            "To remove unused styles"
          ],
          correctAnswer: 1,
          explanation: "Critical CSS inlines styles needed for above-the-fold content, improving perceived load time."
        }
      ]
    }
  ],

  interviewQuestions: [
    {
      question: "What is the CSS Box Model?",
      answer: "The CSS Box Model consists of content, padding, border, and margin. Content is the actual content, padding is space inside the border, border surrounds padding, and margin is space outside the border. box-sizing property controls whether width includes padding and border.",
      difficulty: "beginner"
    },
    {
      question: "Difference between Flexbox and Grid?",
      answer: "Flexbox is one-dimensional (row OR column) and great for component-level layouts. Grid is two-dimensional (rows AND columns) and ideal for page-level layouts. Flexbox focuses on content flow, Grid on layout structure.",
      difficulty: "intermediate"
    },
    {
      question: "What is specificity in CSS?",
      answer: "Specificity determines which CSS rule applies when multiple rules target the same element. Order: inline styles (1000) > ID selectors (100) > class selectors (10) > element selectors (1). Important! overrides everything.",
      difficulty: "intermediate"
    },
    {
      question: "Explain CSS position values.",
      answer: "static (default), relative (relative to normal position), absolute (relative to nearest positioned ancestor), fixed (relative to viewport), sticky (toggles between relative and fixed based on scroll).",
      difficulty: "beginner"
    },
    {
      question: "What's the difference between em and rem?",
      answer: "em is relative to the parent element's font-size, rem is relative to the root (html) font-size. rem is preferred for accessibility as it respects user browser settings.",
      difficulty: "beginner"
    },
    {
      question: "How do you create a responsive layout?",
      answer: "Use relative units (%, em, rem, vw/vh), media queries with breakpoints, flexbox/grid, and responsive images with srcset. Mobile-first approach with min-width media queries is recommended.",
      difficulty: "intermediate"
    },
    {
      question: "What are CSS pseudo-classes and pseudo-elements?",
      answer: "Pseudo-classes (:hover, :focus) style element states. Pseudo-elements (::before, ::after) style specific parts of an element. Pseudo-elements use double colon notation.",
      difficulty: "intermediate"
    },
    {
      question: "Explain CSS z-index and stacking context.",
      answer: "z-index controls stack order of positioned elements. Higher values appear on top. Stacking context is created by positioned elements, opacity < 1, transforms, etc. z-index only works within same context.",
      difficulty: "advanced"
    },
    {
      question: "What's the difference between transform and position animations?",
      answer: "transform uses GPU acceleration and doesn't trigger layout/reflow, making it smoother. position animations trigger layout and can cause jank. Always prefer transform for animations.",
      difficulty: "advanced"
    },
    {
      question: "How do you handle browser-specific CSS issues?",
      answer: "Use feature queries (@supports), autoprefixer for vendor prefixes, normalize.css for consistent defaults, and progressive enhancement. Test in multiple browsers and use caniuse.com for reference.",
      difficulty: "intermediate"
    },
    {
      question: "Explain CSS custom properties (variables).",
      answer: "CSS variables (--primary-color) allow reusable values. They cascade, can be updated with JavaScript, and support fallbacks. Great for theming and dynamic updates.",
      difficulty: "intermediate"
    },
    {
      question: "What's the difference between visibility: hidden and display: none?",
      answer: "display: none removes element from layout flow, visibility: hidden hides but preserves space. display: none triggers reflow, visibility: hidden doesn't.",
      difficulty: "beginner"
    },
    {
      question: "How do you center an element horizontally and vertically?",
      answer: "Multiple ways: flexbox (display: flex, justify/align center), grid (place-items: center), position absolute with transform, margin: auto with positioning.",
      difficulty: "beginner"
    },
    {
      question: "Explain CSS containment and content-visibility.",
      answer: "contain isolates elements for performance. content-visibility: auto skips rendering off-screen content, dramatically improving load time. contain-intrinsic-size reserves space.",
      difficulty: "advanced"
    },
    {
      question: "What are CSS Houdini and the Paint API?",
      answer: "Houdini exposes browser's CSS engine via APIs. Paint API allows custom paint worklets, creating complex backgrounds and effects programmatically with near-native performance.",
      difficulty: "advanced"
    }
  ],

  finalAssessment: [
    {
      question: "Which property creates space between flex/grid items?",
      options: ["margin", "padding", "gap", "spacing"],
      correctAnswer: 2,
      explanation: "gap creates consistent spacing between items in both Flexbox and Grid layouts."
    },
    {
      question: "What's the most performant way to hide an element?",
      options: ["display: none", "visibility: hidden", "opacity: 0", "transform: scale(0)"],
      correctAnswer: 0,
      explanation: "display: none removes the element from layout completely, which can be beneficial for performance with large hidden elements."
    },
    {
      question: "Which selector has highest specificity?",
      options: ["div p", ".container", "#header", "*"],
      correctAnswer: 2,
      explanation: "ID selector (#header) has highest specificity (100 points) compared to class (10) and element (1)."
    },
    {
      question: "What does box-sizing: border-box do?",
      options: [
        "Includes padding and border in width/height",
        "Excludes padding and border from width/height",
        "Changes box model completely",
        "Adds box shadow"
      ],
      correctAnswer: 0,
      explanation: "border-box makes width/height include content, padding, and border - total width equals specified width."
    },
    {
      question: "Which property is best for 2D layouts?",
      options: ["Flexbox", "Grid", "Float", "Inline-block"],
      correctAnswer: 1,
      explanation: "Grid is designed specifically for two-dimensional layouts with both rows and columns."
    },
    {
      question: "What's the purpose of @media queries?",
      options: [
        "Import external CSS",
        "Apply styles based on device characteristics",
        "Create animations",
        "Define variables"
      ],
      correctAnswer: 1,
      explanation: "Media queries apply CSS conditionally based on viewport size, orientation, or device capabilities."
    },
    {
      question: "Which unit is relative to root font-size?",
      options: ["em", "rem", "px", "%"],
      correctAnswer: 1,
      explanation: "rem (root em) is relative to the html element's font-size, making it great for responsive typography."
    },
    {
      question: "What does transform: translateZ(0) do?",
      options: [
        "Moves element in 3D space",
        "Forces GPU acceleration",
        "Rotates the element",
        "Changes z-index"
      ],
      correctAnswer: 1,
      explanation: "translateZ(0) promotes the element to its own GPU layer, often improving animation performance."
    },
    {
      question: "How do you create a CSS custom property?",
      options: ["$primary", "@primary", "--primary", "primary:"],
      correctAnswer: 2,
      explanation: "CSS custom properties use the -- prefix and are accessed with var() function."
    },
    {
      question: "What's the difference between ::before and :before?",
      options: [
        "Same thing",
        "::before is pseudo-element, :before is pseudo-class",
        "::before is modern syntax, :before is legacy",
        "They're interchangeable"
      ],
      correctAnswer: 2,
      explanation: "Double colon (::before) is the modern syntax for pseudo-elements, though single colon still works for compatibility."
    }
  ]
};