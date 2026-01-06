'use client';

import { useState } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { getNextQuestion } from '@/utils/questionService';
import { LoadingButton } from '@/components/ui/LoadingComponents';

export default function AIAssistScreen() {
  const { state, dispatch } = useInterview();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  const handleContinue = async () => {
    if (isGeneratingNext) return;
    
    // Check if we should continue or go to summary
    if (state.responses.length >= 5 || state.usedQuestions.length >= 5) {
      dispatch({ type: 'SET_STATE', payload: 'summary' });
    } else {
      setIsGeneratingNext(true);
      try {
        // Get next question dynamically and continue
        const nextQuestion = await getNextQuestion({
          difficulty: state.responses.length >= 3 ? 'senior' : 'intermediate',
          usedQuestions: state.usedQuestions,
          responses: state.responses
        });
        if (nextQuestion) {
          dispatch({ type: 'SET_QUESTION', payload: nextQuestion });
          dispatch({ type: 'SET_STATE', payload: 'active' });
        } else {
          dispatch({ type: 'SET_STATE', payload: 'summary' });
        }
      } catch (error) {
        console.error('Failed to get next question:', error);
        dispatch({ type: 'SET_STATE', payload: 'summary' });
      } finally {
        setIsGeneratingNext(false);
      }
    }
  };

  const lastResponse = state.responses[state.responses.length - 1];
  const wasFromPressure = lastResponse && lastResponse.questionId.includes('-followup');
  
  const getInsightMessage = () => {
    if (!lastResponse) return 'Response evaluation complete.';
    
    const { reasoning, hasSpecifics, hasRealExample, isWeak, coversCorePoints } = lastResponse;
    
    if (wasFromPressure) {
      return `Follow-up evaluation: ${reasoning || 'Response assessed for depth and specifics.'}`;
    } else if (isWeak) {
      return `Initial response flagged: ${reasoning}`;
    } else {
      const positives = [];
      if (hasSpecifics) positives.push('technical depth');
      if (hasRealExample) positives.push('practical experience');
      if (coversCorePoints) positives.push('core concepts');
      
      const strengthsText = positives.length > 0 ? ` Strengths: ${positives.join(', ')}.` : '';
      return `Response accepted: ${reasoning}${strengthsText}`;
    }
  };

  const getDetectionDetails = () => {
    if (!lastResponse) return [];
    
    const details = [];
    const { hasSpecifics, hasRealExample, isWeak, coversCorePoints, reasoning } = lastResponse;
    
    if (isWeak) {
      details.push({
        type: 'warning',
        title: 'Needs more depth',
        description: reasoning || 'Answer lacks required specifics'
      });
    } else {
      details.push({
        type: 'success',
        title: 'Good answer depth',
        description: reasoning || 'Answer meets interview standards'
      });
    }
    
    // Add more granular evaluation details
    if (!isWeak) {
      if (hasSpecifics) {
        details.push({
          type: 'success',
          title: '✓ Technical specifics detected',
          description: 'Answer includes concrete technical details'
        });
      }
      
      if (hasRealExample) {
        details.push({
          type: 'success', 
          title: '✓ Real-world experience shown',
          description: 'Response demonstrates practical experience'
        });
      }
      
      if (coversCorePoints) {
        details.push({
          type: 'success',
          title: '✓ Core concepts addressed',
          description: 'Answer covers key technical points expected'
        });
      }
    } else {
      // Show what was missing for weak answers
      if (!hasSpecifics) {
        details.push({
          type: 'warning',
          title: '⚠ Missing technical specifics',
          description: 'Consider adding concrete examples, tool names, or specific approaches'
        });
      }
      
      if (!hasRealExample) {
        details.push({
          type: 'warning',
          title: '⚠ Lacks practical experience',
          description: 'Share actual projects where you used this technology'
        });
      }
      
      if (!coversCorePoints) {
        details.push({
          type: 'warning',
          title: '⚠ Core concepts not addressed',
          description: 'Answer misses key technical points the interviewer was looking for'
        });
      }
    }
    
    if (wasFromPressure) {
      details.push({
        type: 'info',
        title: 'Follow-up completed',
        description: 'Candidate responded to escalated question.'
      });
    }
    
    return details;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-900">AI Analysis</h1>
          {state.candidateName && (
            <p className="text-sm text-slate-600 mt-1">Here's how your response was evaluated, {state.candidateName}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main interview area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Response Evaluation
                </h2>
                
                <div className="space-y-4">
                  {lastResponse && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-700 mb-2">Latest Answer Analysis:</h3>
                      <p className="text-slate-600 text-sm">
                        "{lastResponse.answer.substring(0, 150)}{lastResponse.answer.length > 150 ? '...' : ''}"
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          lastResponse.isWeak ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {lastResponse.isWeak ? 'Needs depth' : 'Good depth'}
                        </span>
                        {lastResponse.hasSpecifics && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Technical details</span>
                        )}
                        {lastResponse.hasRealExample && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Real examples</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-indigo-800 text-sm">
                      {getInsightMessage()}
                    </p>
                  </div>
                </div>

                <LoadingButton
                  onClick={handleContinue}
                  isLoading={isGeneratingNext}
                  disabled={isGeneratingNext}
                  variant="primary"
                  className="mt-6"
                >
                  {isGeneratingNext ? 'Generating Next Question...' : 
                   state.responses.length >= 4 ? 'Complete Interview' : 'Continue Interview'}
                </LoadingButton>
              </div>
            </div>

            {/* AI Insight Panel */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 text-white rounded-lg p-6 sticky top-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold">AI Detection Engine</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  {getDetectionDetails().map((detail, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg p-3">
                      <div className={`font-semibold mb-1 ${
                        detail.type === 'success' ? 'text-green-400' :
                        detail.type === 'warning' ? 'text-orange-400' :
                        'text-blue-400'
                      }`}>
                        {detail.type === 'success' ? '✓' : 
                         detail.type === 'warning' ? '⚠️' : 
                         '🔄'} {detail.title}
                      </div>
                      <div className="text-slate-300 text-xs">
                        {detail.description}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-slate-700 pt-3 mt-4">
                    <div className="text-slate-400 text-xs">
                      <div className="mb-2">Interview Progress:</div>
                      <div>Phase: {state.interviewPhase}</div>
                      <div>Questions: {state.responses.length}</div>
                      <div>Strong answers: {state.responses.filter(r => !r.isWeak).length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}