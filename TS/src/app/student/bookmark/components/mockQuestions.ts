export type TopicKey =
  | 'Arithmetic Aptitude'
  | 'Data Interpretation'
  | 'C Programming'; // add more keys here

export type QA = {
  question: string;
  answer: string;
  explanation: string;
};

const mockQuestions = {
  'Arithmetic Aptitude': [
    {
      question: 'What is 25% of 200?',
      answer: '50',
      explanation: '25% of 200 = (25/100) × 200 = 50',
    },
  ],
  'Data Interpretation': [
    {
      question: 'What is the average of 10, 20, and 30?',
      answer: '20',
      explanation: 'Average = (10 + 20 + 30) / 3 = 60 / 3 = 20',
    },
  ],
  'C Programming': [
    {
      question: 'What is the output of `printf("%d", 10 + 20);`?',
      answer: '30',
      explanation: '`10 + 20 = 30` is printed as integer.',
    },
  ],
  // Add more topics...
};

export default mockQuestions;
