'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { InterviewData, InterviewState, Question, AIInsight } from '@/types/interview';
import { InterviewStorage, useAutoSave } from '@/utils/storage';

interface InterviewContextType {
  state: InterviewData;
  dispatch: React.Dispatch<InterviewAction>;
  insights: AIInsight[];
}

type InterviewAction =
  | { type: 'START_INTERVIEW' }
  | { type: 'SET_STATE'; payload: InterviewState }
  | { type: 'SET_QUESTION'; payload: Question }
  | { type: 'SET_CANDIDATE_NAME'; payload: string }
  | { type: 'ADD_RESPONSE'; payload: { questionId: string; answer: string; isWeak?: boolean; hasSpecifics?: boolean; hasRealExample?: boolean; coversCorePoints?: boolean; reasoning?: string } }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'ADD_INSIGHT'; payload: AIInsight }
  | { type: 'RESET_INTERVIEW' }
  | { type: 'LOAD_SESSION'; payload: Partial<InterviewData> };

const initialState: InterviewData = {
  role: 'Frontend React Developer (Mid–Senior)',
  candidateName: '',
  duration: 20,
  currentState: 'landing',
  responses: [],
  usedQuestions: [],
  usedQuestionTypes: [],
  topics: ['React Hooks', 'Component Architecture', 'State Management', 'Performance Optimization'],
  weakAreas: [],
  interviewPhase: 'warmup'
};

const interviewReducer = (state: InterviewData, action: InterviewAction): InterviewData => {
  switch (action.type) {
    case 'START_INTERVIEW':
      return {
        ...state,
        currentState: 'active',
        startTime: new Date(),
        timeRemaining: state.duration * 60 // Convert to seconds
      };
    
    case 'SET_STATE':
      return {
        ...state,
        currentState: action.payload
      };
    
    case 'SET_CANDIDATE_NAME':
      return {
        ...state,
        candidateName: action.payload
      };
    
    case 'SET_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        usedQuestions: [...state.usedQuestions, action.payload.id]
      };
    
    case 'ADD_RESPONSE':
      const newResponses = [
        ...state.responses,
        {
          ...action.payload,
          timestamp: new Date()
        }
      ];
      
      // Update interview phase based on number of responses
      let newPhase = state.interviewPhase;
      if (newResponses.length === 1) newPhase = 'technical';
      else if (newResponses.length >= 3) newPhase = 'deep-dive';
      
      return {
        ...state,
        responses: newResponses,
        interviewPhase: newPhase,
        weakAreas: action.payload.isWeak ? 
          [...state.weakAreas, action.payload.questionId] : 
          state.weakAreas
      };
    
    case 'UPDATE_TIME':
      return {
        ...state,
        timeRemaining: action.payload
      };
    
    case 'RESET_INTERVIEW':
      return {
        ...initialState,
        currentState: 'landing',
        responses: [],
        usedQuestions: [],
        weakAreas: [],
        interviewPhase: 'warmup',
        timeRemaining: 1200 // Reset to 20 minutes
      };
    
    case 'LOAD_SESSION':
      return {
        ...state,
        ...action.payload,
        responses: action.payload.responses?.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp)
        })) || state.responses
      };
    
    default:
      return state;
  }
};

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const [insights, setInsights] = React.useState<AIInsight[]>([]);

  // Auto-save functionality
  useAutoSave(state, state.currentState !== 'landing');

  const contextValue: InterviewContextType = {
    state,
    dispatch,
    insights
  };

  return (
    <InterviewContext.Provider value={contextValue}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}