'use client';

import React, { useState, useEffect } from 'react';
import { useInterview } from '@/context/InterviewContext';
import LandingScreen from './screens/LandingScreen';
import ActiveInterviewScreen from './screens/ActiveInterviewScreen';
import PressureScreen from './screens/PressureScreen';
import AIAssistScreen from './screens/AIAssistScreen';
import SummaryScreen from './screens/SummaryScreen';
import { ResumeModal, ErrorBoundary, NetworkStatus } from '@/components/ErrorHandling';
import { InterviewStorage } from '@/utils/storage';

export default function InterviewSimulator() {
  const { state, dispatch } = useInterview();
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Check for stored session on mount
  useEffect(() => {
    if (InterviewStorage.hasStoredSession() && state.currentState === 'landing') {
      setShowResumeModal(true);
    }
  }, [state.currentState]);

  const handleResumeSession = (sessionData: any) => {
    dispatch({ type: 'LOAD_SESSION', payload: sessionData });
    setShowResumeModal(false);
  };

  const handleDiscardSession = () => {
    InterviewStorage.clearSession();
    setShowResumeModal(false);
  };

  const renderScreen = () => {
    switch (state.currentState) {
      case 'landing':
        return <LandingScreen />;
      case 'active':
        return <ActiveInterviewScreen />;
      case 'pressure':
        return <PressureScreen />;
      case 'ai-assist':
        return <AIAssistScreen />;
      case 'summary':
        return <SummaryScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <ErrorBoundary onError={() => InterviewStorage.saveSession(state)}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <NetworkStatus />
        {renderScreen()}
        
        {showResumeModal && (
          <ResumeModal
            onResume={handleResumeSession}
            onDiscard={handleDiscardSession}
            onClose={() => setShowResumeModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}