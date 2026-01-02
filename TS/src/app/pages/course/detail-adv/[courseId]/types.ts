// types.ts

export interface Video {
  _id: string;
  video: string;
  description: string;
  time: string;
  duration: number;
  isPremium?: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Course {
  title: string;
  shortDescription: string;
  level: string;
  language: string;
  videos: Video[];
  addFAQ: FAQ[];
}
