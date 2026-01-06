'use client';

import { useState, useEffect } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { getNextQuestion } from '@/utils/questionService';
import { evaluateAnswer } from '@/utils/evaluation';
import { LoadingButton } from '@/components/ui/LoadingComponents';

export default function ActiveInterviewScreen() {
  const { state, dispatch } = useInterview();
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(() => {
    // Check if we have a saved interview time, otherwise start with 20 minutes
    const savedTime = state.timeRemaining;
    return savedTime !== undefined && savedTime > 0 ? savedTime : 1200;
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  useEffect(() => {
    // Set initial question if none exists (only run once)
    if (!state.currentQuestion && state.currentState === 'active') {
      setIsLoadingQuestion(true);
      const loadInitialQuestion = async () => {
        const nextQuestion = await getNextQuestion({
          difficulty: 'intermediate',
          usedQuestions: state.usedQuestions,
          responses: state.responses
        });
        if (nextQuestion) {
          dispatch({ type: 'SET_QUESTION', payload: nextQuestion });
        }
        setIsLoadingQuestion(false);
      };
      loadInitialQuestion();
    }
  }, [state.currentQuestion, state.currentState, dispatch]);

  useEffect(() => {
    // Timer countdown - persist across the entire interview
    if (state.currentState !== 'active') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        
        // Update global state for persistence
        dispatch({ type: 'UPDATE_TIME', payload: newTime });
        
        if (newTime <= 0) {
          clearInterval(timer);
          dispatch({ type: 'SET_STATE', payload: 'summary' });
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.currentState, dispatch]); // Only restart if we leave and re-enter active state

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !state.currentQuestion || isEvaluating) return;

    setIsEvaluating(true);
    try {
      // Show loading state while AI evaluates
      const evaluation = await evaluateAnswer(
        answer, 
        state.currentQuestion.difficulty, 
        state.currentQuestion.text,
        state.currentQuestion.expectedAnswerElements,
        state.currentQuestion.weakAnswerIndicators,
        state.responses
      );
    
    // Add response to state with evaluation details
    dispatch({
      type: 'ADD_RESPONSE',
      payload: {
        questionId: state.currentQuestion.id,
        answer: answer.trim(),
        isWeak: evaluation.isWeak,
        hasSpecifics: evaluation.hasSpecifics,
        hasRealExample: evaluation.hasRealExample,
        coversCorePoints: evaluation.coversCorePoints,
        reasoning: evaluation.reasoning
      }
    });

    // Clear answer
    setAnswer('');

    // Determine next state based on evaluation
    // Only escalate to pressure if answer is genuinely inadequate (not just "could be better")
    const isGenuinelyWeak = evaluation.isWeak && (!evaluation.hasSpecifics && !evaluation.hasRealExample && !evaluation.coversCorePoints);
    
    if (isGenuinelyWeak && state.currentQuestion.followUp) {
      // Move to pressure state for follow-up only if truly inadequate
      dispatch({ type: 'SET_STATE', payload: 'pressure' });
    } else {
      // Show AI insight about the evaluation
      dispatch({ type: 'SET_STATE', payload: 'ai-assist' });
    }
    } catch (error) {
      console.error('Answer evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getPhaseDescription = () => {
    switch (state.interviewPhase) {
      case 'warmup': return 'Getting started';
      case 'technical': return 'Technical depth';
      case 'deep-dive': return 'Senior-level probing';
      case 'wrap-up': return 'Wrapping up';
      default: return 'In progress';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with timer */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Interview in Progress</h1>
            {state.candidateName && (
              <p className="text-sm text-slate-600 mt-1">Hi {state.candidateName}, let's dive into some technical questions</p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-600">
              <span className="font-medium">{getPhaseDescription()}</span>
              <span className="mx-2">•</span>
              <span>Question {state.responses.filter(r => !r.questionId.includes('-followup')).length + 1} of ~5</span>
            </div>
            <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {(isLoadingQuestion || !state.currentQuestion) ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600">Generating your first question...</p>
            <p className="text-sm text-slate-500">This may take a moment</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full space-y-8">
          {/* Question */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-medium text-slate-900 leading-relaxed flex-1">
                {state.currentQuestion?.text}
              </h2>
              <div className="ml-4 flex flex-col items-end text-sm text-slate-500">
                <span className="font-medium">{state.currentQuestion?.category}</span>
                <span className="text-xs capitalize mt-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {state.currentQuestion?.difficulty}
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              💡 Looking for: specific examples, real-world experience, technical depth
              {state.candidateName && state.responses.length === 0 && (
                <span className="ml-2 text-indigo-600 font-medium animate-pulse">
                  • Good luck, {state.candidateName}!
                </span>
              )}
            </div>
          </div>

          {/* Answer input */}
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Share a specific example from your experience..."
              className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">
                <span>{answer.length} characters</span>
                <span className="mx-2">•</span>
                <span>{answer.split(' ').filter(word => word.length > 0).length} words</span>
              </div>
              
              <LoadingButton
                onClick={handleSubmitAnswer}
                isLoading={isEvaluating}
                disabled={!answer.trim() || isEvaluating}
                variant="primary"
              >
                {isEvaluating ? 'Analyzing...' : 'Submit Answer'}
              </LoadingButton>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-center text-sm text-slate-500">
            <div className="flex justify-center items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => {
                const mainQuestionCount = state.responses.filter(r => !r.questionId.includes('-followup')).length;
                return (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < mainQuestionCount ? 'bg-blue-600' : 
                      i === mainQuestionCount ? 'bg-blue-300' : 'bg-slate-300'
                    }`}
                  />
                );
              })}
            </div>
            <div>
              Question {state.responses.filter(r => !r.questionId.includes('-followup')).length + 1} of ~5 • Phase: {getPhaseDescription()}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}