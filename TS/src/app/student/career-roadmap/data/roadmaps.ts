export type StepType = 'topic' | 'project' | 'checkpoint'

export interface RoadmapStep {
  id: string
  stepType: StepType
  name: string
  description?: string
  subtopics: string[]
  searchKeywords: string[]
}

export interface RoadmapSection {
  id: string
  title: string
  steps: RoadmapStep[]
}

export interface CareerRoadmap {
  id: string
  title: string
  description: string
  longDescription: string
  type: 'ROLE' | 'SKILL'
  color: string
  totalTopics: number
  sections: RoadmapSection[]
}

const t = (id: string, name: string, subtopics: string[], keywords: string[], desc?: string): RoadmapStep =>
  ({ id, stepType: 'topic', name, description: desc, subtopics, searchKeywords: keywords })

const p = (id: string, name: string, subtopics: string[], keywords: string[], desc?: string): RoadmapStep =>
  ({ id, stepType: 'project', name, description: desc, subtopics, searchKeywords: keywords })

export const careerRoadmaps: CareerRoadmap[] = [
  {
    id: 'web-developer',
    title: 'Web Developer',
    description: 'Build modern web applications from scratch using the latest technologies',
    longDescription: 'A complete path from HTML basics to deploying production-ready full-stack web applications — HTML, CSS, JavaScript, React, Node.js.',
    type: 'ROLE',
    color: '#3b82f6',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('html-css', 'HTML & CSS', ['HTML5 Semantics', 'CSS3', 'Flexbox & Grid', 'Responsive Design'], ['html', 'css', 'web design', 'frontend basics']),
          p('html-css-project', 'HTML & CSS — Project', ['Portfolio Page', 'Landing Page', 'Responsive Layout'], ['html css project', 'web design project', 'frontend project'], 'Build a responsive portfolio website'),
          t('javascript', 'JavaScript', ['Variables & Types', 'Functions', 'DOM Manipulation', 'ES6+'], ['javascript', 'js', 'scripting', 'web programming']),
          p('js-project', 'JavaScript — Mini Projects', ['Todo App', 'Weather App', 'Quiz App'], ['javascript project', 'js project', 'web app project'], 'Build interactive web apps'),
        ],
      },
      {
        id: 'frontend',
        title: 'FRONTEND FRAMEWORK',
        steps: [
          t('css-frameworks', 'CSS Frameworks', ['Tailwind CSS', 'Bootstrap 5', 'Sass / SCSS', 'CSS Modules'], ['tailwind', 'bootstrap', 'css framework', 'sass', 'scss']),
          t('react', 'React', ['Components & Props', 'Hooks', 'Context API', 'React Router'], ['react', 'reactjs', 'frontend framework', 'ui library']),
          t('vue', 'Vue.js', ['Vue 3 Composition API', 'Components', 'Pinia / Vuex', 'Vue Router'], ['vue', 'vuejs', 'vue.js', 'vue 3', 'vuex', 'pinia']),
          t('angular', 'Angular', ['Components & Modules', 'Services & DI', 'RxJS', 'Angular Router'], ['angular', 'angularjs', 'angular framework']),
          t('svelte', 'Svelte / SvelteKit', ['Svelte Basics', 'Reactivity', 'Stores', 'SvelteKit Routing'], ['svelte', 'sveltekit', 'svelte framework']),
          t('nextjs', 'Next.js', ['App Router', 'SSR & SSG', 'API Routes', 'Image Optimization'], ['nextjs', 'next.js', 'ssr', 'server side rendering', 'nextjs 14']),
          t('typescript', 'TypeScript', ['Types & Interfaces', 'Generics', 'TypeScript with React/Vue'], ['typescript', 'ts', 'typed javascript']),
          p('framework-project', 'Frontend Framework — Project', ['E-Commerce UI', 'Dashboard App', 'Real-time Features'], ['react project', 'vue project', 'angular project', 'frontend app'], 'Build a full SPA with your chosen framework'),
        ],
      },
      {
        id: 'backend',
        title: 'BACKEND & DATABASE',
        steps: [
          t('nodejs', 'Node.js & Express', ['Express.js', 'REST APIs', 'Middleware', 'Authentication'], ['node', 'nodejs', 'express', 'backend', 'server']),
          t('database', 'Database', ['MongoDB', 'SQL Basics', 'Mongoose', 'Database Design'], ['database', 'mongodb', 'sql', 'mysql', 'postgresql']),
          p('fullstack-project', 'Full Stack — Project', ['CRUD App', 'Auth System', 'REST API'], ['fullstack project', 'node project', 'backend project'], 'Build a complete MERN stack app'),
        ],
      },
      {
        id: 'deployment',
        title: 'DEPLOYMENT',
        steps: [
          t('git', 'Git & GitHub', ['Git Commands', 'Branching', 'Pull Requests', 'CI/CD Basics'], ['git', 'github', 'version control']),
          t('deployment-basics', 'Deploy to Cloud', ['AWS / Vercel', 'Docker Basics', 'Environment Variables', 'HTTPS'], ['deployment', 'cloud', 'aws', 'vercel', 'docker', 'devops']),
        ],
      },
    ],
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    description: 'Master both frontend and backend to build complete production applications',
    longDescription: 'A guided path from your first web page to a full production-ready application — React, Node.js, MongoDB, REST APIs, and Deployment.',
    type: 'ROLE',
    color: '#10b981',
    totalTopics: 12,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('html-css', 'HTML & CSS', ['HTML5 Semantics', 'CSS Layouts', 'Responsive Design'], ['html', 'css', 'web design']),
          t('javascript', 'JavaScript', ['ES6+', 'Async/Await', 'APIs', 'DOM'], ['javascript', 'js']),
          p('js-project', 'JavaScript Project', ['Interactive Web App', 'API Integration'], ['javascript project', 'js project']),
        ],
      },
      {
        id: 'frontend',
        title: 'FRONTEND',
        steps: [
          t('css-frameworks', 'CSS Frameworks', ['Tailwind CSS', 'Bootstrap', 'Sass/SCSS', 'Styled Components'], ['tailwind', 'bootstrap', 'css framework', 'sass']),
          t('react', 'React', ['Hooks', 'Context API', 'State Management', 'React Router'], ['react', 'reactjs']),
          t('vue', 'Vue.js', ['Vue 3', 'Composition API', 'Pinia', 'Vue Router'], ['vue', 'vuejs', 'vue 3']),
          t('angular', 'Angular', ['Components', 'Services & DI', 'RxJS', 'Angular Forms'], ['angular', 'angularjs']),
          t('nextjs', 'Next.js / Nuxt.js', ['SSR & SSG', 'App Router', 'API Routes', 'Middleware'], ['nextjs', 'next.js', 'nuxt', 'ssr']),
          t('typescript', 'TypeScript', ['Types & Interfaces', 'Generics', 'TS with Frameworks'], ['typescript', 'ts']),
          p('frontend-project', 'Frontend Project', ['Dashboard App', 'E-Commerce UI', 'SPA with Auth'], ['react project', 'frontend project', 'vue project']),
        ],
      },
      {
        id: 'backend',
        title: 'BACKEND & API',
        steps: [
          t('nodejs', 'Node.js & Express', ['REST APIs', 'Middleware', 'Auth (JWT)'], ['node', 'nodejs', 'express', 'backend']),
          t('mongodb', 'MongoDB', ['Schema Design', 'Aggregation', 'Indexing', 'Mongoose'], ['mongodb', 'database', 'nosql', 'mongoose']),
          t('authentication', 'Authentication', ['JWT', 'OAuth', 'Sessions', 'Bcrypt'], ['authentication', 'auth', 'jwt', 'oauth', 'security']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED & DEPLOY',
        steps: [
          t('testing', 'Testing', ['Unit Tests', 'Integration Tests', 'Jest', 'Supertest'], ['testing', 'jest', 'unit test']),
          p('capstone', 'Capstone Project', ['Full MERN App', 'Auth + API + DB'], ['fullstack project', 'mern project', 'capstone']),
          t('deployment', 'Deployment & DevOps', ['Docker', 'AWS', 'CI/CD', 'Nginx'], ['deployment', 'devops', 'docker', 'aws', 'cloud']),
        ],
      },
    ],
  },
  {
    id: 'android-developer',
    title: 'Android Developer',
    description: 'Build native Android apps using Kotlin and Jetpack Compose',
    longDescription: 'A guided path from your first Activity to a production-ready app on the Play Store — Kotlin, Jetpack Compose, Room, Coroutines, Hilt, and Material Design 3.',
    type: 'ROLE',
    color: '#ef4444',
    totalTopics: 11,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS & TOOLING',
        steps: [
          t('android-basics', 'Android Platform Basics', ['What is Android?', 'API Levels & SDK', 'App Distribution', 'Native vs Cross-Platform'], ['android', 'android basics', 'android development']),
          t('kotlin', 'Kotlin Programming', ['Syntax & Types', 'Null Safety', 'Functions & Lambdas', 'Classes, Data Classes'], ['kotlin', 'android kotlin', 'programming']),
          t('android-studio', 'Android Studio & Tools', ['Installing Android Studio', 'SDK Manager & AVD', 'Gradle & the Build System', 'ADB & Logcat'], ['android studio', 'android tools', 'ide']),
          t('project-structure', 'Project Structure', ['Project Layout', 'AndroidManifest.xml', 'Resources & Qualifiers', 'Permissions Model'], ['android project', 'project structure', 'manifest']),
        ],
      },
      {
        id: 'app-components',
        title: 'APP COMPONENTS',
        steps: [
          t('context', 'Context & Application', ['Context Types & P...', 'Application Class', 'Services', 'BroadcastReceiver'], ['android context', 'android service', 'broadcast receiver']),
          t('fragments', 'Fragments', ['Why Fragments?', 'Fragment Lifecycle', 'FragmentManager', 'Fragment Communication'], ['fragments', 'android fragment']),
          t('intents', 'Intents & Navigation', ['Explicit vs Implicit', 'Passing Data', 'Deep Links & App...', 'Activity Result API'], ['intents', 'android navigation', 'deep links']),
          t('activities', 'Activities & Lifecycle', ['Activity Basics', 'Lifecycle Callbacks', 'Configuration Changes', 'Saved State & Process'], ['activity', 'android lifecycle', 'android activity']),
        ],
      },
      {
        id: 'ui-design',
        title: 'UI & DESIGN',
        steps: [
          t('jetpack-compose', 'Jetpack Compose', ['Composables', 'State & Recomposition', 'Layouts', 'Navigation Compose'], ['jetpack compose', 'compose', 'android ui']),
          t('material3', 'Material Design 3', ['Color Schemes', 'Typography', 'Motion', 'Adaptive Layouts'], ['material design', 'material 3', 'android design']),
          t('cross-platform', 'Cross-Platform Options', ['React Native', 'Flutter', 'Kotlin Multiplatform', 'Compose Multiplatform'], ['react native', 'flutter', 'kotlin multiplatform', 'cross platform android']),
          p('ui-project', 'UI Build — Project', ['Material 3 App', 'Custom Components', 'Animations'], ['android ui project', 'compose project'], 'Build a polished Android UI'),
          t('data-layer', 'Data & Networking', ['Room Database', 'DataStore', 'Retrofit', 'Ktor Client'], ['room', 'retrofit', 'android data', 'api android', 'ktor']),
        ],
      },
      {
        id: 'advanced',
        title: 'ARCHITECTURE & PUBLISH',
        steps: [
          t('architecture', 'MVVM Architecture', ['ViewModel', 'LiveData', 'Clean Architecture', 'Repository Pattern'], ['mvvm', 'android architecture', 'viewmodel']),
          t('coroutines', 'Coroutines & Flow', ['Coroutines Basics', 'Flow', 'StateFlow', 'Error Handling'], ['coroutines', 'kotlin flow', 'async android']),
          p('capstone', 'Full Android App', ['Play Store Ready', 'Signed APK', 'Release Build'], ['android project', 'play store', 'android release'], 'Complete app published to Play Store'),
        ],
      },
    ],
  },
  {
    id: 'ios-developer',
    title: 'iOS Developer',
    description: 'Build native iOS apps using Swift and SwiftUI for iPhone and iPad',
    longDescription: 'A comprehensive path from Swift basics to publishing your first app on the App Store.',
    type: 'ROLE',
    color: '#8b5cf6',
    totalTopics: 8,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('swift', 'Swift Programming', ['Variables & Types', 'Optionals', 'Closures', 'Protocols'], ['swift', 'ios programming', 'apple development']),
          t('xcode', 'Xcode & Tools', ['Xcode Setup', 'Simulator', 'Debugging', 'Instruments'], ['xcode', 'ios tools', 'apple tools']),
          p('swift-project', 'Swift — Practice Project', ['Playground Exercises', 'CLI App'], ['swift project', 'ios practice']),
        ],
      },
      {
        id: 'ui',
        title: 'UI DEVELOPMENT',
        steps: [
          t('swiftui', 'SwiftUI', ['Views & Modifiers', 'State & Binding', 'Navigation Stack', 'Animations'], ['swiftui', 'ios ui', 'apple ui']),
          t('uikit', 'UIKit', ['UIViewController', 'Table & Collection Views', 'Auto Layout', 'Storyboards vs Code'], ['uikit', 'ios uikit', 'interface builder']),
          t('combine', 'Combine & Swift Concurrency', ['Publishers & Subscribers', 'async/await', 'Actors', 'Task & TaskGroup'], ['combine', 'swift concurrency', 'async await swift', 'actor swift']),
          p('ui-project', 'iOS App — Project', ['Shopping List', 'Weather App', 'Notes App'], ['ios project', 'swiftui project', 'ios app']),
        ],
      },
      {
        id: 'data',
        title: 'DATA & NETWORKING',
        steps: [
          t('networking', 'Networking', ['URLSession', 'Codable', 'Async/Await APIs', 'REST APIs'], ['ios networking', 'urlsession', 'api ios']),
          t('coredata', 'Persistence', ['Core Data', 'SwiftData', 'UserDefaults', 'Keychain'], ['core data', 'swiftdata', 'ios database', 'local storage ios']),
          t('push', 'Push & Local Notifications', ['APNs', 'UNUserNotificationCenter', 'Rich Notifications', 'Notification Actions'], ['push notifications ios', 'apns', 'ios notifications']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED & PUBLISHING',
        steps: [
          t('architecture', 'Architecture Patterns', ['MVC', 'MVVM', 'Clean Architecture', 'The Composable Architecture'], ['ios architecture', 'mvvm ios', 'tca swift']),
          t('testing', 'Testing', ['XCTest', 'UI Testing', 'TDD', 'Snapshot Testing'], ['ios testing', 'xctest', 'swift testing']),
          t('app-store', 'App Store & Distribution', ['App Store Connect', 'TestFlight', 'App Review Guidelines', 'In-App Purchase'], ['app store', 'ios deployment', 'testflight']),
          p('capstone-ios', 'iOS Capstone App', ['Full App with Backend', 'App Store Ready'], ['ios capstone', 'ios project', 'ios app store']),
        ],
      },
    ],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Analyze complex data sets and build predictive models using Python and ML',
    longDescription: 'From Python basics to advanced ML models — master data analysis, visualization, and machine learning with real datasets.',
    type: 'ROLE',
    color: '#f59e0b',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python', 'Python Programming', ['Syntax & Types', 'Functions', 'OOP', 'Libraries'], ['python', 'python programming', 'python basics']),
          t('statistics', 'Statistics & Math', ['Probability', 'Distributions', 'Hypothesis Testing', 'Linear Algebra'], ['statistics', 'math for data science', 'probability']),
          p('eda-project', 'EDA Project', ['Data Cleaning', 'Descriptive Stats', 'Visualizations'], ['data analysis project', 'eda project', 'python data project']),
        ],
      },
      {
        id: 'data-analysis',
        title: 'DATA ANALYSIS',
        steps: [
          t('sql-ds', 'SQL for Data Science', ['SELECT & Aggregations', 'JOINs', 'Window Functions', 'CTEs'], ['sql', 'sql data science', 'database query', 'postgresql']),
          t('pandas', 'Data Analysis — Pandas & NumPy', ['DataFrames', 'Data Cleaning', 'Aggregation', 'Merging'], ['pandas', 'data analysis', 'numpy', 'data manipulation']),
          t('r-lang', 'R for Statistics', ['tidyverse', 'ggplot2', 'dplyr', 'R Markdown'], ['r', 'r language', 'r programming', 'statistics r', 'rstudio']),
          t('visualization', 'Data Visualization', ['Matplotlib', 'Seaborn', 'Plotly', 'Tableau / Power BI'], ['data visualization', 'matplotlib', 'seaborn', 'tableau', 'power bi', 'charts']),
          p('analysis-project', 'Data Analysis Project', ['Full EDA Report', 'Visual Dashboard', 'Insights Deck'], ['data analysis project', 'eda project', 'visualization project']),
        ],
      },
      {
        id: 'ml',
        title: 'MACHINE LEARNING',
        steps: [
          t('ml-fundamentals', 'ML Fundamentals', ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Scikit-Learn'], ['machine learning', 'ml', 'scikit learn', 'sklearn']),
          t('deep-learning', 'Deep Learning', ['Neural Networks', 'CNNs', 'RNNs', 'TensorFlow/PyTorch'], ['deep learning', 'neural network', 'tensorflow', 'pytorch', 'keras']),
          p('ml-project', 'ML — Capstone Project', ['Prediction Model', 'Classification App', 'Model Deployment'], ['machine learning project', 'ml project', 'data science project']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('nlp', 'Natural Language Processing', ['Text Preprocessing', 'Sentiment Analysis', 'Transformers', 'BERT'], ['nlp', 'natural language processing', 'text analysis', 'bert']),
          t('feature-engineering', 'Feature Engineering', ['Feature Selection', 'Encoding', 'Scaling', 'Dimensionality Reduction'], ['feature engineering', 'feature selection', 'pca', 'encoding']),
          t('cloud-ml', 'Cloud & Big Data', ['AWS SageMaker', 'Google BigQuery', 'Databricks', 'Apache Spark'], ['cloud ml', 'sagemaker', 'bigquery', 'databricks', 'spark']),
          t('mlops', 'MLOps for Data Scientists', ['Model Deployment', 'MLflow', 'Docker for ML', 'Experiment Tracking'], ['mlops', 'ml deployment', 'model production']),
          p('ds-capstone', 'Data Science Capstone', ['End-to-End ML Pipeline', 'Deployed Prediction App'], ['data science capstone', 'ml project', 'capstone project']),
        ],
      },
    ],
  },
  {
    id: 'ai-engineer',
    title: 'AI Engineer',
    description: 'Build intelligent AI systems using modern LLMs, APIs, and ML frameworks',
    longDescription: 'Master the art of building AI-powered applications — from LLM APIs to fine-tuning and deploying models at scale.',
    type: 'ROLE',
    color: '#06b6d4',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python', 'Python for AI', ['Python Basics', 'NumPy', 'Data Structures', 'APIs'], ['python', 'python programming', 'python ai']),
          t('ml-basics', 'Machine Learning Basics', ['Supervised Learning', 'Feature Engineering', 'Model Evaluation'], ['machine learning', 'ml', 'scikit learn']),
        ],
      },
      {
        id: 'deep-learning',
        title: 'DEEP LEARNING',
        steps: [
          t('neural-networks', 'Neural Networks', ['Feedforward Networks', 'Backpropagation', 'Activation Functions'], ['neural network', 'deep learning', 'backpropagation']),
          t('transformers', 'Transformers & LLMs', ['Attention Mechanism', 'BERT', 'GPT Architecture', 'Fine-Tuning'], ['transformers', 'llm', 'large language model', 'gpt', 'bert']),
          p('dl-project', 'Deep Learning Project', ['Image Classifier', 'Text Generator', 'Fine-tuned Model'], ['deep learning project', 'neural network project']),
        ],
      },
      {
        id: 'applied-ai',
        title: 'APPLIED AI',
        steps: [
          t('llm-apis', 'LLM APIs & Prompting', ['OpenAI API', 'Anthropic Claude', 'Prompt Engineering', 'Few-shot Learning'], ['openai', 'llm api', 'prompt engineering', 'anthropic', 'claude api']),
          t('rag', 'RAG & Vector Search', ['Retrieval-Augmented Generation', 'LangChain', 'LlamaIndex', 'Vector DBs (Pinecone/Chroma)'], ['rag', 'langchain', 'llamaindex', 'vector database', 'pinecone', 'chroma']),
          t('computer-vision', 'Computer Vision', ['CNNs', 'Object Detection (YOLO)', 'Image Segmentation', 'OpenCV'], ['computer vision', 'opencv', 'cnn', 'yolo', 'image recognition']),
          t('nlp', 'NLP Applications', ['Text Classification', 'NER', 'Question Answering', 'Summarization'], ['nlp', 'natural language processing', 'text classification']),
          t('agents', 'AI Agents & Tools', ['Function Calling', 'Tool Use', 'ReAct Agents', 'Multi-agent Systems'], ['ai agents', 'function calling', 'react agent', 'multi agent']),
        ],
      },
      {
        id: 'production',
        title: 'PRODUCTION & MLOPS',
        steps: [
          t('evaluation', 'AI Evaluation & Safety', ['Benchmarking', 'Hallucination Detection', 'Responsible AI', 'Guardrails'], ['ai evaluation', 'responsible ai', 'ai safety', 'llm evaluation']),
          t('mlops', 'MLOps & Deployment', ['Model Serving', 'Docker', 'FastAPI', 'Monitoring & Drift'], ['mlops', 'model deployment', 'fastapi', 'model serving']),
          p('ai-project', 'AI Product — Build', ['AI Chatbot', 'Vision App', 'LLM Pipeline'], ['ai project', 'llm project', 'ai application']),
        ],
      },
    ],
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    description: 'Build scalable server-side systems, APIs, and databases',
    longDescription: 'Master backend engineering — from REST APIs and databases to microservices and cloud deployment.',
    type: 'ROLE',
    color: '#f97316',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('nodejs-backend', 'Node.js & Express', ['Express.js', 'REST APIs', 'Middleware', 'npm Ecosystem'], ['nodejs', 'node', 'express', 'javascript backend']),
          t('python-backend', 'Python — Django / FastAPI', ['Django REST Framework', 'FastAPI', 'SQLAlchemy', 'Pydantic'], ['python', 'django', 'fastapi', 'flask', 'python backend']),
          t('java-backend', 'Java — Spring Boot', ['Spring Boot', 'Spring MVC', 'JPA / Hibernate', 'Maven / Gradle'], ['java', 'spring boot', 'spring', 'java backend']),
          t('go-backend', 'Go (Golang)', ['Go Syntax', 'Goroutines & Channels', 'HTTP Server', 'Go Modules'], ['go', 'golang', 'go backend']),
          t('internet', 'Internet & HTTP', ['HTTP/HTTPS', 'DNS', 'REST Principles', 'Status Codes', 'WebSockets'], ['http', 'rest api', 'web fundamentals', 'networking', 'websocket']),
        ],
      },
      {
        id: 'databases',
        title: 'DATABASES',
        steps: [
          t('relational-db', 'Relational Databases', ['SQL', 'PostgreSQL', 'Joins & Indexes', 'Transactions'], ['sql', 'postgresql', 'mysql', 'relational database']),
          t('nosql-db', 'NoSQL Databases', ['MongoDB', 'Redis', 'Document Design', 'Caching'], ['mongodb', 'redis', 'nosql', 'caching']),
          p('db-project', 'Database Project', ['Schema Design', 'Query Optimization', 'Migrations'], ['database project', 'sql project', 'mongodb project']),
        ],
      },
      {
        id: 'api-design',
        title: 'API DESIGN',
        steps: [
          t('rest-api', 'REST API Design', ['CRUD Operations', 'Pagination', 'Filtering', 'Error Handling'], ['rest api', 'api design', 'restful']),
          t('graphql', 'GraphQL', ['Schema & Types', 'Queries & Mutations', 'Resolvers', 'Apollo Server'], ['graphql', 'apollo', 'graphql api', 'graph ql']),
          t('grpc', 'gRPC & WebSockets', ['Protocol Buffers', 'gRPC Services', 'WebSocket Basics', 'Real-time APIs'], ['grpc', 'websocket', 'real time backend', 'protocol buffers']),
          t('auth', 'Authentication & Security', ['JWT', 'OAuth 2.0', 'API Keys', 'Rate Limiting', 'CORS'], ['authentication', 'jwt', 'oauth', 'security', 'authorization']),
          p('api-project', 'REST API Project', ['Full CRUD API', 'Auth Endpoints', 'Rate Limiting'], ['api project', 'backend project', 'rest api project']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('microservices', 'Microservices', ['Service Design', 'Message Queues (Kafka/RabbitMQ)', 'API Gateway', 'Service Mesh'], ['microservices', 'distributed systems', 'message queue', 'kafka', 'rabbitmq']),
          t('caching', 'Caching & Performance', ['Redis Caching', 'CDN', 'Database Indexing', 'Query Optimization'], ['caching', 'redis', 'performance', 'optimization']),
          t('devops', 'DevOps & Cloud', ['Docker', 'Kubernetes', 'AWS / GCP', 'CI/CD Pipelines'], ['devops', 'docker', 'kubernetes', 'cloud', 'aws', 'cicd']),
          p('capstone-backend', 'Backend Capstone', ['Microservices App', 'Deployed + Monitored API'], ['backend capstone', 'backend project', 'production backend']),
        ],
      },
    ],
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Automate infrastructure, CI/CD pipelines, and manage cloud deployments',
    longDescription: 'Learn to bridge development and operations — from Linux to Kubernetes, Docker, and cloud platforms.',
    type: 'ROLE',
    color: '#6366f1',
    totalTopics: 9,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('linux', 'Linux & Command Line', ['File System', 'Shell Scripting', 'Process Management', 'Permissions'], ['linux', 'shell', 'command line', 'bash']),
          t('git', 'Git & Version Control', ['Branching', 'Merging', 'GitHub Actions', 'Git Flow'], ['git', 'github', 'version control', 'cicd']),
        ],
      },
      {
        id: 'containers',
        title: 'CONTAINERS & ORCHESTRATION',
        steps: [
          t('docker', 'Docker', ['Dockerfile', 'Docker Compose', 'Images & Containers', 'Networking'], ['docker', 'containerization', 'containers']),
          t('kubernetes', 'Kubernetes', ['Pods & Deployments', 'Services', 'Ingress', 'Helm Charts'], ['kubernetes', 'k8s', 'orchestration']),
          p('container-project', 'Containerization Project', ['Multi-service App', 'Docker Compose', 'K8s Deploy'], ['docker project', 'kubernetes project', 'devops project']),
        ],
      },
      {
        id: 'cloud',
        title: 'CLOUD PLATFORMS',
        steps: [
          t('aws', 'Cloud (AWS / GCP / Azure)', ['EC2 / Compute', 'S3 / Storage', 'VPC / Networking', 'IAM'], ['aws', 'cloud', 'azure', 'gcp', 'cloud computing']),
          t('cicd', 'CI/CD Pipelines', ['GitHub Actions', 'Jenkins', 'GitLab CI', 'ArgoCD'], ['cicd', 'ci/cd', 'continuous integration', 'deployment pipeline']),
        ],
      },
      {
        id: 'monitoring',
        title: 'MONITORING & IaC',
        steps: [
          t('monitoring', 'Monitoring & Logging', ['Prometheus', 'Grafana', 'ELK Stack', 'OpenTelemetry', 'Alerting'], ['monitoring', 'logging', 'prometheus', 'grafana', 'observability', 'elk']),
          t('iac', 'Infrastructure as Code', ['Terraform', 'Pulumi', 'Ansible', 'CloudFormation'], ['terraform', 'ansible', 'infrastructure as code', 'iac', 'pulumi']),
          t('gitops', 'GitOps & Security', ['ArgoCD', 'Flux', 'Secrets Management', 'DevSecOps', 'SAST/DAST'], ['gitops', 'argocd', 'flux', 'devsecops', 'secrets management']),
          p('devops-capstone', 'DevOps Capstone', ['Full CI/CD + K8s + Monitoring Stack'], ['devops project', 'kubernetes project', 'devops capstone']),
        ],
      },
    ],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    description: 'Build and deploy ML models from data collection to production',
    longDescription: 'A comprehensive guide to ML — from statistical foundations through advanced deep learning and model deployment.',
    type: 'SKILL',
    color: '#ec4899',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python-ml', 'Python for ML', ['Python Basics', 'NumPy', 'Pandas', 'Matplotlib'], ['python', 'numpy', 'pandas', 'python machine learning']),
          t('math-stats', 'Math & Statistics', ['Linear Algebra', 'Calculus', 'Probability', 'Statistics'], ['statistics', 'math', 'linear algebra', 'probability']),
          p('eda', 'Exploratory Data Analysis', ['Data Cleaning', 'Feature Analysis', 'Correlation'], ['eda', 'data exploration', 'data analysis project']),
        ],
      },
      {
        id: 'classical-ml',
        title: 'CLASSICAL ML',
        steps: [
          t('supervised', 'Supervised Learning', ['Linear Regression', 'Decision Trees', 'SVM', 'Random Forest'], ['supervised learning', 'classification', 'regression', 'scikit learn']),
          t('unsupervised', 'Unsupervised Learning', ['K-Means', 'PCA', 'Autoencoders', 'DBSCAN'], ['unsupervised learning', 'clustering', 'pca', 'dimensionality reduction']),
          p('ml-project', 'Classical ML Project', ['Prediction Model', 'Clustering Analysis'], ['ml project', 'scikit learn project']),
        ],
      },
      {
        id: 'deep-learning',
        title: 'DEEP LEARNING',
        steps: [
          t('neural-networks', 'Neural Networks', ['Perceptrons', 'Backpropagation', 'Activation Functions', 'Optimizers'], ['neural network', 'deep learning', 'tensorflow', 'pytorch', 'keras']),
          t('advanced-dl', 'Advanced Deep Learning', ['CNNs', 'RNNs / LSTMs', 'Transformers', 'GANs'], ['cnn', 'rnn', 'lstm', 'transformers', 'gan', 'deep learning advanced']),
        ],
      },
      {
        id: 'production',
        title: 'PRODUCTION',
        steps: [
          t('model-evaluation', 'Model Evaluation', ['Cross-Validation', 'Metrics', 'Overfitting', 'Hyperparameter Tuning'], ['model evaluation', 'cross validation', 'hyperparameter tuning']),
          t('ml-deployment', 'Model Deployment', ['Flask / FastAPI', 'Docker', 'REST APIs for ML', 'Cloud Deployment'], ['model deployment', 'mlops', 'fastapi', 'flask', 'production ml']),
        ],
      },
    ],
  },
  {
    id: 'deep-learning',
    title: 'Deep Learning',
    description: 'Master neural networks, CNNs, RNNs, and modern deep learning architectures',
    longDescription: 'A structured path through deep learning — from mathematical foundations to CNNs, RNNs, Transformers, and real-world model deployment.',
    type: 'SKILL',
    color: '#7c3aed',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python-dl', 'Python & NumPy', ['Python Basics', 'NumPy', 'Pandas', 'Matplotlib'], ['python', 'numpy', 'python deep learning']),
          t('math', 'Math for Deep Learning', ['Linear Algebra', 'Calculus', 'Probability', 'Optimization'], ['linear algebra', 'calculus', 'math machine learning']),
          p('data-prep', 'Data Preparation Project', ['Dataset Loading', 'Normalization', 'Augmentation'], ['data preparation', 'dataset project']),
        ],
      },
      {
        id: 'core-dl',
        title: 'CORE DEEP LEARNING',
        steps: [
          t('ann', 'Artificial Neural Networks', ['Perceptrons', 'Backpropagation', 'Activation Functions', 'Optimizers'], ['neural network', 'ann', 'deep learning', 'tensorflow', 'pytorch']),
          t('cnn', 'Convolutional Neural Networks', ['Conv Layers', 'Pooling', 'ResNet', 'Transfer Learning'], ['cnn', 'convolutional neural network', 'image recognition', 'computer vision']),
          t('rnn', 'Recurrent Neural Networks', ['RNN', 'LSTM', 'GRU', 'Sequence Models'], ['rnn', 'lstm', 'recurrent neural network', 'sequence model']),
          p('vision-project', 'Image Classification Project', ['CNN from Scratch', 'Transfer Learning', 'Model Eval'], ['image classification project', 'cnn project']),
        ],
      },
      {
        id: 'advanced-dl',
        title: 'ADVANCED ARCHITECTURES',
        steps: [
          t('transformers', 'Transformers', ['Attention Mechanism', 'BERT', 'GPT', 'ViT'], ['transformers', 'bert', 'gpt', 'attention mechanism', 'llm']),
          t('gans', 'GANs & Generative Models', ['GAN Basics', 'DCGAN', 'StyleGAN', 'VAE'], ['gan', 'generative adversarial network', 'generative model', 'vae']),
          t('rl', 'Reinforcement Learning', ['Q-Learning', 'Policy Gradient', 'DQN', 'PPO'], ['reinforcement learning', 'q learning', 'rl', 'dqn']),
        ],
      },
      {
        id: 'production',
        title: 'DEPLOYMENT',
        steps: [
          t('deployment', 'Model Deployment', ['ONNX', 'TensorFlow Lite', 'FastAPI', 'Docker'], ['model deployment', 'mlops', 'tensorflow lite', 'fastapi']),
          p('capstone', 'Deep Learning Capstone', ['End-to-End DL Pipeline', 'Production Model'], ['deep learning project', 'dl capstone']),
        ],
      },
    ],
  },
  {
    id: 'developer-relations',
    title: 'Developer Relations',
    description: 'Build bridges between technical communities, create content, and drive developer adoption',
    longDescription: 'Learn the art and science of developer advocacy — technical writing, community building, public speaking, and API evangelism.',
    type: 'ROLE',
    color: '#0891b2',
    totalTopics: 8,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('programming', 'Programming Fundamentals', ['Coding Basics', 'APIs & SDKs', 'Documentation', 'Git'], ['programming', 'api', 'sdk', 'developer tools']),
          t('communication', 'Technical Communication', ['Technical Writing', 'Blog Posts', 'Video Scripts', 'Storytelling'], ['technical writing', 'communication', 'content creation']),
        ],
      },
      {
        id: 'core',
        title: 'CORE SKILLS',
        steps: [
          t('content', 'Content Creation', ['Blog Writing', 'Video Tutorials', 'Code Demos', 'Social Media'], ['content creation', 'blogging', 'video tutorials', 'developer content']),
          t('community', 'Community Building', ['Forum Management', 'Discord/Slack', 'Meetups', 'Open Source'], ['community building', 'developer community', 'open source']),
          t('public-speaking', 'Public Speaking', ['Conference Talks', 'Webinars', 'Demos', 'Workshops'], ['public speaking', 'conference', 'webinar', 'technical talk']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('api-evangelism', 'API Evangelism', ['API Design', 'Sample Apps', 'Postman Collections', 'SDKs'], ['api evangelism', 'api design', 'developer experience']),
          t('analytics', 'Developer Analytics', ['Adoption Metrics', 'NPS', 'Community Health', 'Reports'], ['analytics', 'metrics', 'developer analytics']),
          p('devrel-project', 'DevRel Campaign Project', ['Blog Series', 'Sample App', 'Community Event'], ['devrel project', 'developer advocacy project']),
        ],
      },
    ],
  },
  {
    id: 'engineering-manager',
    title: 'Engineering Manager',
    description: 'Lead engineering teams, drive technical decisions, and build high-performance culture',
    longDescription: 'A path from individual contributor to engineering leader — covering people management, technical strategy, and organizational design.',
    type: 'ROLE',
    color: '#d97706',
    totalTopics: 9,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('ic-excellence', 'IC Excellence', ['System Design', 'Code Review', 'Mentoring', 'Technical Leadership'], ['software engineering', 'system design', 'code review', 'technical leadership']),
          t('people-skills', 'People & Communication', ['1-on-1s', 'Feedback', 'Conflict Resolution', 'Active Listening'], ['people management', 'communication', 'leadership', 'team management']),
        ],
      },
      {
        id: 'management',
        title: 'MANAGEMENT SKILLS',
        steps: [
          t('hiring', 'Hiring & Onboarding', ['Interview Design', 'Job Descriptions', 'Onboarding Plans', 'Culture Fit'], ['hiring', 'recruitment', 'onboarding', 'team building']),
          t('performance', 'Performance Management', ['Goal Setting', 'OKRs', 'Performance Reviews', 'Career Growth'], ['performance management', 'okr', 'goal setting', 'career development']),
          t('project-mgmt', 'Project Management', ['Agile / Scrum', 'Sprint Planning', 'Risk Management', 'Roadmaps'], ['project management', 'agile', 'scrum', 'sprint planning']),
        ],
      },
      {
        id: 'leadership',
        title: 'TECHNICAL LEADERSHIP',
        steps: [
          t('architecture', 'Architecture Decisions', ['Tech Stack', 'ADRs', 'Scalability', 'Trade-offs'], ['architecture', 'system design', 'technical decisions']),
          t('culture', 'Engineering Culture', ['Psychological Safety', 'Blameless Culture', 'Innovation', 'Knowledge Sharing'], ['engineering culture', 'team culture', 'leadership']),
          t('strategy', 'Team Strategy & OKRs', ['Vision Setting', 'Quarterly Goals', 'Headcount Planning', 'Stakeholder Management'], ['strategy', 'okr', 'stakeholder management', 'engineering strategy']),
        ],
      },
    ],
  },
  {
    id: 'game-developer',
    title: 'Game Developer',
    description: 'Design, build, and ship games using modern game engines and programming',
    longDescription: 'From game design concepts to publishing on Steam or mobile stores — Unity, C#, physics, AI, and multiplayer fundamentals.',
    type: 'ROLE',
    color: '#16a34a',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('programming', 'Programming (C# / C++)', ['Variables & Types', 'OOP Concepts', 'Data Structures', 'Algorithms'], ['c#', 'csharp', 'c++', 'programming', 'game programming']),
          t('math-physics', 'Math & Physics for Games', ['Vectors & Matrices', 'Trigonometry', 'Rigid Body Physics', 'Collision Detection'], ['game math', 'physics for games', 'vectors', 'game physics']),
        ],
      },
      {
        id: 'engine',
        title: 'GAME ENGINE',
        steps: [
          t('unity', 'Unity Engine', ['Unity Editor', 'GameObject & Components', 'Physics System', 'UI Toolkit'], ['unity', 'unity 3d', 'game engine', 'unity development']),
          t('unity-scripting', 'Unity Scripting (C#)', ['MonoBehaviour', 'Input System', 'Coroutines', 'Animation Controller'], ['unity scripting', 'unity c#', 'monobehaviour']),
          t('unreal', 'Unreal Engine', ['Unreal Editor', 'Blueprints', 'C++ in Unreal', 'Nanite & Lumen'], ['unreal engine', 'unreal', 'ue5', 'blueprints', 'unreal c++']),
          t('godot', 'Godot Engine', ['Godot Basics', 'GDScript', 'Scene System', '2D & 3D Workflows'], ['godot', 'godot engine', 'gdscript', 'godot 4']),
          p('mini-game', 'Mini Game Project', ['2D Platformer', 'Top-down Shooter', 'Puzzle Game'], ['unity project', 'game project', '2d game']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED GAME DEV',
        steps: [
          t('game-ai', 'Game AI', ['State Machines', 'Pathfinding (A*)', 'Behavior Trees', 'NavMesh'], ['game ai', 'pathfinding', 'behavior tree', 'game artificial intelligence']),
          t('multiplayer', 'Multiplayer & Networking', ['Unity Netcode', 'Photon', 'Client-Server', 'Lag Compensation'], ['multiplayer', 'game networking', 'photon', 'unity networking']),
          t('shaders', 'Shaders & VFX', ['HLSL Basics', 'Shader Graph', 'Particle Systems', 'Post-Processing'], ['shader', 'hlsl', 'vfx', 'unity shader']),
        ],
      },
      {
        id: 'publishing',
        title: 'PUBLISHING',
        steps: [
          p('full-game', 'Full Game Project', ['Complete Game Loop', 'Level Design', 'Audio'], ['game project', 'unity full game', 'game design project']),
          t('publishing-basics', 'Publishing & Monetization', ['Steam / Play Store', 'Build Settings', 'Analytics', 'In-App Purchases'], ['game publishing', 'steam', 'play store game', 'game monetization']),
        ],
      },
    ],
  },
  {
    id: 'ml-engineer',
    title: 'ML Engineer',
    description: 'Build, deploy and maintain ML systems at scale in production environments',
    longDescription: 'Bridge the gap between data science and software engineering — production ML pipelines, feature stores, model serving, and MLOps.',
    type: 'ROLE',
    color: '#be185d',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python-se', 'Python & Software Engineering', ['Python Advanced', 'OOP', 'Testing', 'Design Patterns'], ['python', 'python software engineering', 'python advanced']),
          t('ml-core', 'ML Core Concepts', ['Supervised Learning', 'Feature Engineering', 'Model Evaluation', 'Scikit-Learn'], ['machine learning', 'ml', 'supervised learning', 'feature engineering']),
          t('dl', 'Deep Learning Basics', ['Neural Networks', 'TensorFlow / PyTorch', 'Training Loops'], ['deep learning', 'neural network', 'tensorflow', 'pytorch']),
        ],
      },
      {
        id: 'mlops',
        title: 'MLOPS & PIPELINES',
        steps: [
          t('data-pipelines', 'Data Pipelines', ['ETL Pipelines', 'Airflow', 'Spark', 'Feature Stores'], ['data pipeline', 'etl', 'airflow', 'spark', 'feature store']),
          t('experiment-tracking', 'Experiment Tracking', ['MLflow', 'Weights & Biases', 'Versioning', 'Reproducibility'], ['mlflow', 'experiment tracking', 'weights and biases', 'mlops']),
          p('pipeline-project', 'ML Pipeline Project', ['End-to-End Training', 'Tracking + Registry'], ['ml pipeline project', 'mlops project']),
        ],
      },
      {
        id: 'serving',
        title: 'MODEL SERVING',
        steps: [
          t('model-serving', 'Model Serving', ['FastAPI', 'TorchServe', 'TF Serving', 'gRPC'], ['model serving', 'fastapi', 'torchserve', 'tensorflow serving']),
          t('infrastructure', 'ML Infrastructure', ['Docker', 'Kubernetes', 'AWS SageMaker', 'Vertex AI'], ['ml infrastructure', 'sagemaker', 'vertex ai', 'kubernetes ml', 'docker ml']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('monitoring', 'Model Monitoring', ['Drift Detection', 'Performance Metrics', 'Retraining Triggers', 'Alerts'], ['model monitoring', 'drift detection', 'ml monitoring']),
          p('production-system', 'Production ML System', ['Full MLOps Pipeline', 'Deployed + Monitored'], ['ml production project', 'mlops project', 'production ml']),
        ],
      },
    ],
  },
  {
    id: 'nlp-engineer',
    title: 'NLP Engineer',
    description: 'Build natural language processing systems, chatbots, and language understanding models',
    longDescription: 'Master NLP from classical text processing to modern Transformer-based models — text classification, NER, QA, summarization, and RAG.',
    type: 'ROLE',
    color: '#0f766e',
    totalTopics: 10,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('python-nlp', 'Python for NLP', ['Python Basics', 'String Processing', 'Regex', 'File I/O'], ['python', 'python nlp', 'python text processing']),
          t('linguistics', 'Linguistics Basics', ['Tokenization', 'POS Tagging', 'Syntax', 'Semantics'], ['linguistics', 'tokenization', 'pos tagging', 'nlp basics']),
          t('classical-nlp', 'Classical NLP', ['TF-IDF', 'Word2Vec', 'GloVe', 'Bag of Words'], ['tfidf', 'word2vec', 'glove', 'classical nlp', 'text representation']),
        ],
      },
      {
        id: 'core',
        title: 'CORE NLP TASKS',
        steps: [
          t('text-classification', 'Text Classification', ['Sentiment Analysis', 'Topic Modeling', 'Intent Detection', 'Multi-label'], ['text classification', 'sentiment analysis', 'natural language processing', 'nlp']),
          t('ner', 'Named Entity Recognition', ['NER Models', 'spaCy', 'BERT for NER', 'Custom Entities'], ['ner', 'named entity recognition', 'spacy', 'entity extraction']),
          p('nlp-project', 'NLP Project', ['Sentiment Classifier', 'News Categorizer'], ['nlp project', 'text classification project']),
        ],
      },
      {
        id: 'transformers',
        title: 'TRANSFORMERS & LLMs',
        steps: [
          t('transformers', 'Transformers', ['BERT', 'GPT', 'T5', 'Fine-Tuning with HuggingFace'], ['transformers', 'bert', 'gpt', 'huggingface', 'llm']),
          t('qa-summ', 'QA & Summarization', ['Extractive QA', 'Abstractive QA', 'Text Summarization'], ['question answering', 'text summarization', 'extractive qa', 'nlp qa']),
          t('rag', 'RAG & LLM Applications', ['Retrieval-Augmented Generation', 'LangChain', 'Vector DBs', 'Embeddings'], ['rag', 'langchain', 'vector database', 'embeddings', 'llm applications']),
        ],
      },
      {
        id: 'production',
        title: 'PRODUCTION',
        steps: [
          p('chatbot', 'Chatbot / NLP App Project', ['End-to-End NLP App', 'FastAPI + Model'], ['nlp production project', 'chatbot project', 'nlp app']),
        ],
      },
    ],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description: 'Define product strategy, prioritize features, and lead cross-functional teams to ship great products',
    longDescription: 'A practical guide to modern product management — discovery, strategy, roadmapping, metrics, and stakeholder alignment.',
    type: 'ROLE',
    color: '#7c3aed',
    totalTopics: 9,
    sections: [
      {
        id: 'foundations',
        title: 'PM FUNDAMENTALS',
        steps: [
          t('pm-basics', 'PM Fundamentals', ['What is Product Management?', 'PM vs PO', 'Agile & Scrum', 'PM Tools'], ['product management', 'product manager', 'pm fundamentals', 'agile']),
          t('user-research', 'User Research', ['User Interviews', 'Surveys', 'Usability Testing', 'Personas'], ['user research', 'ux research', 'user interviews', 'product research']),
        ],
      },
      {
        id: 'strategy',
        title: 'PRODUCT STRATEGY',
        steps: [
          t('vision', 'Product Vision & Strategy', ['Vision Statements', 'Mission', 'Strategy Frameworks', 'North Star Metric'], ['product vision', 'product strategy', 'north star metric']),
          t('prioritization', 'Prioritization', ['RICE', 'MoSCoW', 'Kano Model', 'Impact vs Effort'], ['prioritization', 'rice framework', 'moscow', 'product prioritization']),
          t('roadmap', 'Product Roadmap', ['Roadmap Types', 'OKRs', 'Release Planning', 'Stakeholder Alignment'], ['product roadmap', 'okr', 'release planning', 'product planning']),
        ],
      },
      {
        id: 'execution',
        title: 'EXECUTION & METRICS',
        steps: [
          t('discovery', 'Product Discovery', ['Problem Statements', 'Opportunity Trees', 'Jobs to be Done', 'Prototyping'], ['product discovery', 'jobs to be done', 'jtbd', 'prototyping']),
          t('metrics', 'Metrics & Analytics', ['KPIs', 'Funnel Analysis', 'A/B Testing', 'Cohort Analysis'], ['product metrics', 'kpi', 'ab testing', 'analytics']),
          t('go-to-market', 'Go-to-Market & Launch', ['Launch Checklist', 'Positioning', 'Press Release', 'Feedback Loops'], ['go to market', 'product launch', 'gtm strategy']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          p('case-study', 'PM Case Study Project', ['Product Teardown', 'Strategy Doc', 'Mock Pitch'], ['product manager project', 'pm case study', 'product case study']),
        ],
      },
    ],
  },

  /* ─── SKILL-BASED ─── */

  {
    id: 'linux',
    title: 'Linux',
    description: 'Master the Linux command line, shell scripting, and system administration',
    longDescription: 'A hands-on path through Linux fundamentals — file system, permissions, shell scripting, process management, and server administration.',
    type: 'SKILL',
    color: '#f97316',
    totalTopics: 8,
    sections: [
      {
        id: 'basics',
        title: 'BASICS',
        steps: [
          t('intro', 'Linux Introduction', ['What is Linux?', 'Distributions', 'Terminal Basics', 'File System Hierarchy'], ['linux', 'linux basics', 'linux intro', 'terminal']),
          t('file-ops', 'File & Directory Operations', ['ls, cd, pwd', 'mkdir, cp, mv, rm', 'find, locate', 'Wildcards & Globbing'], ['linux commands', 'file system', 'linux files', 'command line']),
          t('permissions', 'Users & Permissions', ['chmod, chown', 'User Groups', 'sudo & Root', 'SSH Keys'], ['linux permissions', 'chmod', 'linux users', 'ssh']),
        ],
      },
      {
        id: 'shell',
        title: 'SHELL SCRIPTING',
        steps: [
          t('bash', 'Bash Scripting', ['Variables & Arrays', 'Conditionals', 'Loops', 'Functions'], ['bash', 'shell scripting', 'bash script', 'linux scripting']),
          t('text-tools', 'Text Processing Tools', ['grep, sed, awk', 'cut, sort, uniq', 'pipes & redirection', 'xargs'], ['grep', 'sed', 'awk', 'linux text tools']),
          p('script-project', 'Shell Script Project', ['Backup Script', 'Log Analyzer', 'Deploy Script'], ['bash project', 'shell script project']),
        ],
      },
      {
        id: 'sysadmin',
        title: 'SYSTEM ADMINISTRATION',
        steps: [
          t('processes', 'Process Management', ['ps, top, htop', 'kill, jobs', 'systemd & services', 'Cron Jobs'], ['linux process', 'systemd', 'cron', 'process management']),
          t('networking', 'Networking', ['ip, ifconfig', 'netstat, ss', 'curl, wget', 'Firewall (ufw/iptables)'], ['linux networking', 'netstat', 'firewall linux', 'network commands']),
          t('servers', 'Server Setup', ['Nginx / Apache', 'SSH Server', 'Package Managers (apt/yum)', 'Disk & LVM'], ['linux server', 'nginx', 'apache', 'web server linux']),
        ],
      },
    ],
  },

  {
    id: 'docker',
    title: 'Docker',
    description: 'Containerize applications and manage multi-container environments with Docker',
    longDescription: 'From Docker basics to production-ready containers — images, volumes, networking, Docker Compose, and container security.',
    type: 'SKILL',
    color: '#0ea5e9',
    totalTopics: 8,
    sections: [
      {
        id: 'core',
        title: 'CORE CONCEPTS',
        steps: [
          t('intro', 'Docker Introduction', ['What are Containers?', 'VMs vs Containers', 'Docker Architecture', 'Install Docker'], ['docker', 'docker basics', 'containerization', 'containers']),
          t('images', 'Images & Containers', ['docker pull / run', 'docker ps / exec', 'Image Layers', 'Container Lifecycle'], ['docker images', 'docker containers', 'docker run', 'docker commands']),
          t('dockerfile', 'Writing Dockerfiles', ['FROM, RUN, COPY', 'ENV & ARG', 'ENTRYPOINT vs CMD', 'Multi-stage Builds'], ['dockerfile', 'docker build', 'docker image build']),
        ],
      },
      {
        id: 'compose',
        title: 'DOCKER COMPOSE & NETWORKING',
        steps: [
          t('compose', 'Docker Compose', ['docker-compose.yml', 'Services & Volumes', 'Depends-on & Health Checks', 'Scaling Services'], ['docker compose', 'docker-compose', 'multi container']),
          t('networking', 'Docker Networking', ['Bridge & Host Networks', 'Container Communication', 'Port Mapping', 'Custom Networks'], ['docker networking', 'docker network', 'container networking']),
          t('volumes', 'Volumes & Storage', ['Named Volumes', 'Bind Mounts', 'tmpfs', 'Data Persistence'], ['docker volumes', 'docker storage', 'docker data']),
          p('compose-project', 'Multi-Container App', ['Full Stack App', 'Nginx + App + DB', 'Production Config'], ['docker project', 'docker compose project']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('registry', 'Container Registry', ['Docker Hub', 'ECR / GCR', 'Tagging & Versioning', 'Private Registries'], ['docker registry', 'docker hub', 'container registry']),
          t('security', 'Docker Security', ['Non-root Users', 'Image Scanning', 'Secrets Management', 'Read-only FS'], ['docker security', 'container security', 'docker best practices']),
        ],
      },
    ],
  },

  {
    id: 'kubernetes',
    title: 'Kubernetes',
    description: 'Orchestrate containerized applications at scale with Kubernetes',
    longDescription: 'A structured guide to Kubernetes — from Pods and Deployments to Ingress, Helm, and production cluster management.',
    type: 'SKILL',
    color: '#3b82f6',
    totalTopics: 9,
    sections: [
      {
        id: 'core',
        title: 'CORE CONCEPTS',
        steps: [
          t('intro', 'Kubernetes Basics', ['What is K8s?', 'Cluster Architecture', 'Control Plane', 'kubectl'], ['kubernetes', 'k8s', 'kubernetes basics', 'kubectl']),
          t('workloads', 'Workloads', ['Pods', 'ReplicaSets', 'Deployments', 'StatefulSets & DaemonSets'], ['kubernetes pods', 'kubernetes deployment', 'k8s workloads']),
          t('services', 'Services & Networking', ['ClusterIP', 'NodePort', 'LoadBalancer', 'Ingress'], ['kubernetes service', 'k8s networking', 'kubernetes ingress']),
        ],
      },
      {
        id: 'config',
        title: 'CONFIGURATION',
        steps: [
          t('config-maps', 'ConfigMaps & Secrets', ['ConfigMap Usage', 'Secrets', 'Environment Variables', 'Volume Mounts'], ['kubernetes configmap', 'kubernetes secrets', 'k8s config']),
          t('storage', 'Storage', ['PersistentVolumes', 'PVCs', 'Storage Classes', 'StatefulSet Storage'], ['kubernetes storage', 'persistent volume', 'k8s storage']),
          p('deploy-project', 'Deploy an App to K8s', ['Deployment + Service + Ingress', 'ConfigMap + Secret'], ['kubernetes project', 'k8s deploy', 'kubernetes tutorial']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('helm', 'Helm Charts', ['Helm Basics', 'Chart Templates', 'Values & Overrides', 'Helm Repositories'], ['helm', 'helm charts', 'kubernetes helm']),
          t('rbac', 'RBAC & Security', ['Roles & ClusterRoles', 'ServiceAccounts', 'Network Policies', 'Pod Security'], ['kubernetes rbac', 'k8s security', 'kubernetes security']),
          t('autoscaling', 'Autoscaling & Monitoring', ['HPA', 'VPA', 'Prometheus + Grafana', 'Resource Limits'], ['kubernetes autoscaling', 'hpa', 'k8s monitoring']),
        ],
      },
    ],
  },

  {
    id: 'git-github',
    title: 'Git & GitHub',
    description: 'Master version control, branching strategies, and collaborative workflows with Git and GitHub',
    longDescription: 'Everything from your first commit to advanced Git workflows — branching, rebasing, pull requests, GitHub Actions, and team collaboration.',
    type: 'SKILL',
    color: '#6366f1',
    totalTopics: 7,
    sections: [
      {
        id: 'git-basics',
        title: 'GIT FUNDAMENTALS',
        steps: [
          t('intro', 'Git Basics', ['What is Version Control?', 'git init, add, commit', 'git log, diff, status', 'Staging Area'], ['git', 'git basics', 'version control', 'git commands']),
          t('branching', 'Branching & Merging', ['git branch, checkout', 'git merge', 'Merge Conflicts', 'git stash'], ['git branching', 'git merge', 'git branch', 'merge conflicts']),
          t('rewriting', 'Rewriting History', ['git rebase', 'git reset & revert', 'git cherry-pick', 'Interactive Rebase'], ['git rebase', 'git reset', 'git revert', 'git history']),
        ],
      },
      {
        id: 'github',
        title: 'GITHUB & COLLABORATION',
        steps: [
          t('remote', 'Remote Repositories', ['git remote', 'git push, pull, fetch', 'SSH & HTTPS Auth', 'Forks & Clones'], ['github', 'git remote', 'git push', 'git pull']),
          t('prs', 'Pull Requests & Reviews', ['Opening PRs', 'Code Reviews', 'Branch Protection', 'CODEOWNERS'], ['pull request', 'github pr', 'code review', 'github collaboration']),
          t('actions', 'GitHub Actions', ['Workflow YAML', 'CI/CD with Actions', 'Secrets & Env Vars', 'Marketplace Actions'], ['github actions', 'ci/cd', 'github ci', 'workflow']),
          p('workflow-project', 'Team Workflow Project', ['Feature Branch Workflow', 'PR + CI Pipeline'], ['git project', 'github workflow', 'git collaboration']),
        ],
      },
    ],
  },

  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'Deep dive into JavaScript — from core language fundamentals to advanced patterns and modern APIs',
    longDescription: 'A comprehensive JavaScript path — closures, async/await, prototypes, modules, functional programming, and the modern JS ecosystem.',
    type: 'SKILL',
    color: '#eab308',
    totalTopics: 9,
    sections: [
      {
        id: 'fundamentals',
        title: 'FUNDAMENTALS',
        steps: [
          t('core', 'Core Language', ['Variables, Types, Scopes', 'Functions & Arrow Functions', 'Objects & Arrays', 'Destructuring & Spread'], ['javascript', 'js basics', 'javascript fundamentals', 'es6']),
          t('dom', 'DOM & Browser APIs', ['DOM Selection & Manipulation', 'Events & Listeners', 'Local Storage', 'Fetch API'], ['dom manipulation', 'javascript dom', 'browser api', 'javascript events']),
          p('dom-project', 'DOM Project', ['Todo App', 'Weather App', 'Interactive Quiz'], ['javascript project', 'dom project', 'js project']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED JS',
        steps: [
          t('async', 'Asynchronous JS', ['Callbacks & Promises', 'async/await', 'Event Loop', 'Error Handling'], ['async javascript', 'promises', 'async await', 'javascript async']),
          t('oop', 'OOP & Prototypes', ['Prototypal Inheritance', 'Classes & Constructors', 'Closures', 'this & bind'], ['javascript oop', 'prototypes', 'javascript classes', 'closures']),
          t('functional', 'Functional Programming', ['map, filter, reduce', 'Pure Functions', 'Immutability', 'Currying'], ['functional javascript', 'higher order functions', 'map filter reduce']),
          t('modules', 'Modules & Tooling', ['ES Modules (import/export)', 'CommonJS', 'Bundlers (Vite/Webpack)', 'npm Packages'], ['javascript modules', 'es modules', 'npm', 'bundler']),
          p('app-project', 'JavaScript App', ['Full SPA', 'API-connected App', 'Real-time Features'], ['javascript advanced project', 'js application']),
        ],
      },
    ],
  },

  {
    id: 'mongodb',
    title: 'MongoDB',
    description: 'Master NoSQL database design, queries, aggregation, and scaling with MongoDB',
    longDescription: 'From CRUD to advanced aggregation pipelines — learn MongoDB schema design, indexing, transactions, and Atlas cloud deployment.',
    type: 'SKILL',
    color: '#16a34a',
    totalTopics: 7,
    sections: [
      {
        id: 'basics',
        title: 'BASICS',
        steps: [
          t('intro', 'MongoDB Introduction', ['NoSQL vs SQL', 'Documents & Collections', 'BSON & JSON', 'Install & Connect'], ['mongodb', 'nosql', 'mongodb basics', 'database']),
          t('crud', 'CRUD Operations', ['insertOne / insertMany', 'find & Projections', 'updateOne / updateMany', 'deleteOne / deleteMany'], ['mongodb crud', 'mongodb queries', 'find query', 'mongodb operations']),
          t('schema', 'Schema Design', ['Embedded vs Referenced', 'One-to-Many', 'Many-to-Many', 'Normalization vs Denormalization'], ['mongodb schema', 'database design', 'nosql design', 'data modeling']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('aggregation', 'Aggregation Pipeline', ['$match, $group, $project', '$lookup (Joins)', '$unwind', 'Faceted Search'], ['mongodb aggregation', 'aggregation pipeline', 'mongodb aggregate']),
          t('indexes', 'Indexes & Performance', ['Single & Compound Indexes', 'Text Indexes', 'explain()', 'Query Optimization'], ['mongodb index', 'mongodb performance', 'database indexing']),
          t('mongoose', 'Mongoose ODM', ['Schemas & Models', 'Validation', 'Virtuals & Methods', 'Middleware (Hooks)'], ['mongoose', 'mongodb nodejs', 'mongoose schema', 'odm']),
          p('mongo-project', 'MongoDB App Project', ['REST API + MongoDB', 'Complex Aggregations', 'Atlas Deployment'], ['mongodb project', 'mongodb tutorial project', 'nosql project']),
        ],
      },
    ],
  },

  {
    id: 'react',
    title: 'React',
    description: 'Master React — hooks, state management, performance, and the full React ecosystem',
    longDescription: 'A deep-dive skill path into React — from fundamentals to advanced patterns, performance optimization, testing, and the modern React ecosystem.',
    type: 'SKILL',
    color: '#38bdf8',
    totalTopics: 9,
    sections: [
      {
        id: 'core',
        title: 'REACT CORE',
        steps: [
          t('jsx', 'JSX & Components', ['JSX Syntax', 'Function Components', 'Props & PropTypes', 'Component Composition'], ['react', 'reactjs', 'jsx', 'react components']),
          t('hooks', 'Hooks', ['useState & useEffect', 'useRef & useMemo', 'useCallback', 'Custom Hooks'], ['react hooks', 'usestate', 'useeffect', 'custom hooks']),
          t('state', 'State Management', ['Context API', 'Redux Toolkit', 'Zustand', 'Jotai / Recoil'], ['react state management', 'redux', 'redux toolkit', 'zustand', 'context api']),
          p('hooks-project', 'Hooks-Heavy App', ['Custom Hook Library', 'Real Data App'], ['react project', 'react hooks project']),
        ],
      },
      {
        id: 'ecosystem',
        title: 'ECOSYSTEM & ADVANCED',
        steps: [
          t('routing', 'Routing', ['React Router v6', 'Nested Routes', 'Protected Routes', 'TanStack Router'], ['react router', 'react routing', 'react router v6']),
          t('data-fetching', 'Data Fetching', ['TanStack Query', 'SWR', 'Suspense', 'Error Boundaries'], ['react query', 'tanstack query', 'swr', 'data fetching react']),
          t('forms', 'Forms & Validation', ['React Hook Form', 'Zod / Yup', 'Controlled vs Uncontrolled', 'Form State'], ['react form', 'react hook form', 'form validation react']),
          t('performance', 'Performance', ['React.memo', 'Code Splitting', 'Lazy Loading', 'Virtual DOM Internals'], ['react performance', 'code splitting react', 'react optimization']),
          t('testing', 'Testing', ['Jest + RTL', 'User Interactions', 'Mocking', 'Vitest'], ['react testing', 'testing library', 'jest react', 'vitest']),
        ],
      },
    ],
  },

  {
    id: 'typescript',
    title: 'TypeScript',
    description: 'Add strong typing to JavaScript — master TypeScript for large-scale applications',
    longDescription: 'From basic type annotations to advanced TypeScript — generics, utility types, conditional types, decorators, and TS with popular frameworks.',
    type: 'SKILL',
    color: '#3b82f6',
    totalTopics: 8,
    sections: [
      {
        id: 'basics',
        title: 'BASICS',
        steps: [
          t('types', 'Type System', ['Primitive Types', 'Arrays & Tuples', 'Enums', 'Union & Intersection Types'], ['typescript', 'typescript types', 'ts basics', 'type system']),
          t('interfaces', 'Interfaces & Type Aliases', ['interface vs type', 'Extending Interfaces', 'Readonly & Optional', 'Index Signatures'], ['typescript interface', 'typescript types', 'type alias']),
          t('functions', 'Functions & Classes', ['Typed Parameters', 'Return Types', 'Overloads', 'Classes & Access Modifiers'], ['typescript functions', 'typescript classes', 'typed functions']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED TYPESCRIPT',
        steps: [
          t('generics', 'Generics', ['Generic Functions', 'Generic Interfaces', 'Constraints', 'Conditional Types'], ['typescript generics', 'generic types', 'ts generics']),
          t('utility-types', 'Utility Types', ['Partial, Required, Readonly', 'Pick, Omit, Exclude', 'Record, ReturnType', 'Template Literals'], ['typescript utility types', 'partial typescript', 'pick omit typescript']),
          t('advanced-patterns', 'Advanced Patterns', ['Mapped Types', 'Infer Keyword', 'Decorators', 'Declaration Files (.d.ts)'], ['typescript advanced', 'mapped types', 'typescript decorators', 'declaration files']),
          t('with-frameworks', 'TS with Frameworks', ['TypeScript + React', 'TypeScript + Node.js', 'TypeScript + Express', 'tsconfig Deep Dive'], ['typescript react', 'typescript nodejs', 'typescript express', 'tsconfig']),
          p('ts-project', 'TypeScript Project', ['Typed REST API', 'React + TS App', 'Full Type Coverage'], ['typescript project', 'ts project', 'typed application']),
        ],
      },
    ],
  },

  {
    id: 'openai-apis',
    title: 'OpenAI & APIs',
    description: 'Build AI-powered applications using OpenAI APIs, prompt engineering, and LLM integrations',
    longDescription: 'A practical path to building with LLMs — OpenAI API, prompt engineering, function calling, embeddings, RAG, and deploying AI-powered apps.',
    type: 'SKILL',
    color: '#10b981',
    totalTopics: 7,
    sections: [
      {
        id: 'foundations',
        title: 'FOUNDATIONS',
        steps: [
          t('llm-basics', 'LLM Fundamentals', ['How LLMs Work', 'Tokens & Context Window', 'Temperature & Parameters', 'Model Comparisons'], ['llm', 'large language model', 'openai', 'gpt', 'chatgpt']),
          t('api-basics', 'OpenAI API Basics', ['API Authentication', 'Chat Completions', 'Models Overview', 'Rate Limits & Pricing'], ['openai api', 'chatgpt api', 'gpt api', 'openai']),
          t('prompting', 'Prompt Engineering', ['Zero-shot & Few-shot', 'Chain-of-Thought', 'System Prompts', 'Prompt Templates'], ['prompt engineering', 'openai prompts', 'llm prompting', 'chatgpt prompting']),
        ],
      },
      {
        id: 'advanced',
        title: 'ADVANCED',
        steps: [
          t('function-calling', 'Function Calling & Tools', ['Tool Definitions', 'Structured Outputs', 'JSON Mode', 'Tool Choice'], ['openai function calling', 'tool use', 'structured output', 'json mode']),
          t('embeddings', 'Embeddings & RAG', ['text-embedding Models', 'Vector Search', 'Retrieval-Augmented Generation', 'Semantic Search'], ['embeddings', 'openai embeddings', 'rag', 'vector search', 'semantic search']),
          t('fine-tuning', 'Fine-Tuning', ['Dataset Preparation', 'Fine-tune API', 'Evaluation', 'Cost Optimization'], ['fine tuning', 'openai fine tuning', 'model fine tuning']),
          p('ai-app', 'AI Application Build', ['Chatbot with Memory', 'RAG Document Q&A', 'AI-powered Feature'], ['openai project', 'llm app', 'ai application project']),
        ],
      },
    ],
  },

  {
    id: 'claude-code',
    title: 'Claude Code',
    description: 'Master AI-assisted coding with Claude — prompting, agentic workflows, and building with the Anthropic API',
    longDescription: 'Learn to work effectively with Claude for software engineering — code generation, debugging, agentic tasks, Claude API integration, and best practices.',
    type: 'SKILL',
    color: '#d97706',
    totalTopics: 6,
    sections: [
      {
        id: 'basics',
        title: 'GETTING STARTED',
        steps: [
          t('intro', 'Claude & Anthropic API', ['What is Claude?', 'API Authentication', 'Models (Haiku/Sonnet/Opus)', 'Messages API'], ['claude', 'anthropic', 'claude api', 'anthropic api', 'claude code']),
          t('prompting', 'Effective Prompting', ['System Prompts', 'Structured Requests', 'Code Generation Prompts', 'Debugging with Claude'], ['claude prompting', 'ai prompting', 'code with claude', 'prompt engineering']),
        ],
      },
      {
        id: 'development',
        title: 'AI-ASSISTED DEVELOPMENT',
        steps: [
          t('code-gen', 'Code Generation & Review', ['Feature Implementation', 'Refactoring', 'Code Review', 'Test Generation'], ['ai code generation', 'claude coding', 'code review ai', 'ai refactoring']),
          t('agentic', 'Agentic Workflows', ['Tool Use', 'Multi-step Tasks', 'MCP (Model Context Protocol)', 'Custom Tools'], ['agentic ai', 'claude tools', 'mcp', 'ai agents']),
          t('integration', 'Claude API Integration', ['Streaming Responses', 'Vision (Image Input)', 'Document Processing', 'Batching'], ['claude api integration', 'anthropic sdk', 'claude integration']),
          p('claude-project', 'Build with Claude', ['AI-Powered CLI Tool', 'Coding Assistant', 'Agentic Pipeline'], ['claude project', 'anthropic api project', 'ai coding project']),
        ],
      },
    ],
  },

  {
    id: 'vibe-coding',
    title: 'Vibe Coding',
    description: 'Build software fast using AI tools — from idea to deployed app with minimal friction',
    longDescription: 'The modern art of AI-first development — using LLMs, AI editors, and no-code tools to prototype, build, and ship products rapidly.',
    type: 'SKILL',
    color: '#a855f7',
    totalTopics: 6,
    sections: [
      {
        id: 'mindset',
        title: 'AI-FIRST MINDSET',
        steps: [
          t('philosophy', 'Vibe Coding Philosophy', ['AI as a Coding Partner', 'Iterating Fast', 'Prompt-first Thinking', 'When to Trust AI Output'], ['vibe coding', 'ai coding', 'ai assisted development', 'ai programming']),
          t('tools', 'AI Coding Tools', ['Cursor IDE', 'GitHub Copilot', 'Claude Code', 'Windsurf / Zed'], ['cursor', 'github copilot', 'ai editor', 'coding tools']),
        ],
      },
      {
        id: 'workflows',
        title: 'WORKFLOWS & SHIPPING',
        steps: [
          t('prototyping', 'Rapid Prototyping', ['Spec Writing', 'Scaffold Generation', 'UI from Screenshot', 'Iterate Quickly'], ['rapid prototyping', 'ai prototype', 'quick build']),
          t('debugging', 'AI-Assisted Debugging', ['Error Explanation', 'Rubber Duck with AI', 'Root Cause Analysis', 'Test Generation'], ['ai debugging', 'debugging with ai', 'copilot debugging']),
          t('deployment', 'Ship to Production', ['Vercel / Netlify One-click', 'Supabase Backend', 'Railway / Render', 'Domain & DNS'], ['deployment', 'vercel', 'netlify', 'supabase', 'ship fast']),
          p('vibe-project', 'Build & Ship a Product', ['Full App in a Weekend', 'AI-Built Side Project'], ['vibe coding project', 'ai app project', 'build with ai']),
        ],
      },
    ],
  },
]

export function findRoadmapById(id: string): CareerRoadmap | undefined {
  return careerRoadmaps.find((r) => r.id === id)
}
