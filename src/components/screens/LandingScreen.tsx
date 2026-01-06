'use client';

import { useState } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { LoadingButton } from '@/components/ui/LoadingComponents';

export default function LandingScreen() {
  const { state, dispatch } = useInterview();
  const [isStarting, setIsStarting] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const handleStartInterview = () => {
    if (!candidateName.trim()) {
      setShowNamePrompt(true);
      return;
    }
    
    setIsStarting(true);
    dispatch({ type: 'SET_CANDIDATE_NAME', payload: candidateName.trim() });
    
    // Small delay to show loading state before transition
    setTimeout(() => {
      dispatch({ type: 'START_INTERVIEW' });
      setIsStarting(false);
    }, 800);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName.trim()) {
      setShowNamePrompt(false);
      handleStartInterview();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8 container-mobile">
        {/* Header */}
        <div className="space-y-3 sm:space-y-4 text-mobile-adjust">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            AI-Assisted Interview Simulator
          </h1>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 sm:p-6 space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-900">
              {state.role}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-indigo-700 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{state.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>AI-Evaluated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-left">
          <h3 className="font-semibold text-slate-900 mb-4">How this works:</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Rules-driven interview</strong> — Questions escalate based on answer depth</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>AI assists only</strong> — No scoring, just transparent insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Real-world depth</strong> — Follow-ups probe for practical experience</span>
            </li>
          </ul>
        </div>

        {/* Name Input Section */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-6">
            <label htmlFor="candidateName" className="block text-sm font-medium text-slate-700 mb-2">
              What should we call you during the interview?
            </label>
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter your name or preferred name"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-slate-900 placeholder:text-slate-400"
              onKeyPress={(e) => e.key === 'Enter' && handleStartInterview()}
            />
            {showNamePrompt && (
              <p className="text-red-600 text-sm mt-2">
                Please enter your name to begin the interview.
              </p>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <LoadingButton
            onClick={handleStartInterview}
            isLoading={isStarting}
            disabled={isStarting}
            className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[44px]"
          >
            {isStarting ? 'Starting Interview...' : 'Begin Interview'}
          </LoadingButton>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-slate-600 space-y-1">
          <p>✨ Powered by real AI evaluation — not fake regex patterns</p>
          <p>🎯 Designed to help you practice and improve</p>
        </div>
      </div>
    </div>
  );
}