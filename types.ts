export interface Tutor {
  id: string;
  name: string;
  subject: string;
  persona: string;
  createdAt: string;
  knowledge?: string;
  tools?: {
    webSearch?: boolean;
    quizGenerator?: boolean;
    conceptExplainer?: boolean;
    scenarioSimulator?: boolean;
    adaptiveLearning?: boolean;
    flashcardGenerator?: boolean;
  }
}

export enum MessageAuthor {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  sources?: { uri: string; title: string }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}