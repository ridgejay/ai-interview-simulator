'use client';

import { useState, useEffect } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { evaluateAnswer } from '@/utils/evaluation';
import { LoadingButton } from '@/components/ui/LoadingComponents';

export default function PressureScreen() {
  const { state, dispatch } = useInterview();
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes for follow-up
  const [isIntense, setIsIntense] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    // Add intensity after 30 seconds
    const intensityTimer = setTimeout(() => setIsIntense(true), 30000);
    
    // Faster countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Move to AI assist to show what happened
          dispatch({ type: 'SET_STATE', payload: 'ai-assist' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(intensityTimer);
      clearInterval(timer);
    };
  }, [dispatch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !state.currentQuestion || isEvaluating) return;

    setIsEvaluating(true);
    try {
      // Evaluate the follow-up answer with AI
      const evaluation = await evaluateAnswer(
        answer,
        state.currentQuestion.difficulty,
        state.currentQuestion.followUp || state.currentQuestion.text,
        state.currentQuestion.expectedAnswerElements,
        state.currentQuestion.weakAnswerIndicators,
        state.responses
      );

      // Add the follow-up response
      dispatch({
        type: 'ADD_RESPONSE',
        payload: {
          questionId: `${state.currentQuestion.id}-followup`,
          answer: answer.trim(),
          isWeak: evaluation.isWeak,
          hasSpecifics: evaluation.hasSpecifics,
          hasRealExample: evaluation.hasRealExample,
          coversCorePoints: evaluation.coversCorePoints,
          reasoning: evaluation.reasoning
        }
      });

      // Move to AI assist to explain what just happened
      dispatch({ type: 'SET_STATE', payload: 'ai-assist' });
    } catch (error) {
      console.error('Follow-up evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const lastResponse = state.responses[state.responses.length - 1];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Intense header */}
      <div className={`border-b transition-colors duration-500 p-4 ${
        isIntense ? 'bg-red-600 border-red-700' : 'bg-orange-500 border-orange-600'
      }`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Follow-up Required</h1>
          <div className="flex items-center gap-4">
            <span className="text-orange-100 text-sm font-medium">
              Probing for real-world depth
            </span>
            <div className={`text-2xl font-mono font-bold transition-colors ${
              timeLeft < 60 ? 'text-red-200 animate-pulse' : 'text-white'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full space-y-8">
          {/* Previous answer context */}
          <div className="bg-white rounded-lg border-l-4 border-orange-400 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-orange-700 mb-2">Your previous answer:</h3>
            <p className="text-slate-600 italic">"{lastResponse?.answer}"</p>
          </div>

          {/* Escalated question */}
          <div className={`rounded-lg shadow-lg p-8 transition-colors duration-500 ${
            isIntense 
              ? 'bg-red-600 text-white border-2 border-red-700' 
              : 'bg-white border border-orange-200'
          }`}>
            <h2 className={`text-2xl font-medium leading-relaxed ${
              isIntense ? 'text-white' : 'text-slate-900'
            }`}>
              {state.currentQuestion?.followUp}
            </h2>
            <div className={`mt-4 text-sm ${
              isIntense ? 'text-red-200' : 'text-slate-500'
            }`}>
              {state.candidateName ? `This is where we separate junior from senior developers, ${state.candidateName}.` : 'This is where we separate junior from senior developers.'}
            </div>
          </div>

          {/* Answer input */}
          <div className="space-y-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Give me a specific example with real details..."
              className={`w-full h-40 p-4 rounded-lg resize-none transition-all duration-300 text-slate-900 placeholder:text-slate-400 ${
                isIntense 
                  ? 'border-2 border-amber-500 focus:ring-2 focus:ring-amber-400' 
                  : 'border border-slate-300 focus:ring-2 focus:ring-orange-500'
              } focus:border-transparent`}
            />
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isIntense ? 'text-red-600' : 'text-slate-500'}`}>
                Be specific. Use real examples.
              </span>
              
              <LoadingButton
                onClick={handleSubmitAnswer}
                isLoading={isEvaluating}
                disabled={!answer.trim() || isEvaluating}
                variant="secondary"
                className={isIntense
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-lg disabled:hover:bg-amber-600'
                  : 'bg-orange-600 hover:bg-orange-700 disabled:hover:bg-orange-600'
                }
              >
                {isEvaluating ? 'Evaluating...' : 'Defend Your Answer'}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}