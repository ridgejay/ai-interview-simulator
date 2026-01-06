'use client';

import React, { useState, useEffect } from 'react';
import { InterviewStorage } from '@/utils/storage';

interface ResumeModalProps {
  onResume: (sessionData: any) => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function ResumeModal({ onResume, onDiscard, onClose }: ResumeModalProps) {
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const data = InterviewStorage.loadSession();
    setSessionData(data);
  }, []);

  if (!sessionData) return null;

  const timeSince = sessionData.timestamp 
    ? Math.round((Date.now() - new Date(sessionData.timestamp).getTime()) / (1000 * 60))
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Resume Previous Session?
          </h3>
          <p className="text-gray-600 text-sm">
            You have an interview session in progress{timeSince > 0 && ` from ${timeSince} minutes ago`}.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-700">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Candidate:</span>
              <span>{sessionData.candidateName || 'Unknown'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Progress:</span>
              <span className="capitalize">{sessionData.currentState?.replace('-', ' ') || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Responses:</span>
              <span>{sessionData.responses?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onResume(sessionData)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Resume
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Start Fresh
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children, onError }: { children: React.ReactNode, onError?: () => void }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
      onError?.();
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(new Error(event.reason));
      setHasError(true);
      onError?.();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [onError]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Something Went Wrong
          </h3>
          
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Your session data has been preserved.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reload Page
            </button>
            
            <button
              onClick={() => {
                InterviewStorage.clearSession();
                window.location.reload();
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Start Fresh Session
            </button>
          </div>

          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Hide offline message after 10 seconds
    if (showOfflineMessage) {
      const timer = setTimeout(() => setShowOfflineMessage(false), 10000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOfflineMessage]);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
        </svg>
        <span className="text-sm font-medium">
          You're offline. Some features may not work.
        </span>
      </div>
    </div>
  );
}