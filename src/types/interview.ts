export type InterviewState = 'landing' | 'active' | 'pressure' | 'ai-assist' | 'summary';

export interface Question {
  id: string;
  text: string;
  followUp?: string;
  category: string;
  difficulty: 'entry' | 'intermediate' | 'senior';
  expectedAnswerElements?: string[];
  weakAnswerIndicators?: string[];
  isAIGenerated?: boolean;
}

export interface InterviewData {
  role: string;
  candidateName: string;
  duration: number; // in minutes
  currentQuestion?: Question;
  currentState: InterviewState;
  startTime?: Date;
  timeRemaining?: number;
  responses: Array<{
    questionId: string;
    answer: string;
    timestamp: Date;
    isWeak?: boolean;
    hasSpecifics?: boolean;
    hasRealExample?: boolean;
    coversCorePoints?: boolean;
    reasoning?: string; // Why it was flagged as weak
  }>;
  usedQuestions: string[]; // Track used question IDs
  usedQuestionTypes: string[]; // Track question types for variety
  topics: string[];
  weakAreas: string[];
  interviewPhase: 'warmup' | 'technical' | 'deep-dive' | 'wrap-up';
}

export interface AIInsight {
  type: 'follow-up-triggered' | 'shallow-answer-detected' | 'missing-examples' | 'good-depth' | 'interview-progression';
  message: string;
  timestamp: Date;
}