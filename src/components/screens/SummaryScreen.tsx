'use client';

import { useState } from 'react';
import { useInterview } from '@/context/InterviewContext';
import { AnimatedCounter, ProgressRing, FadeIn } from '@/components/ui/AnimationComponents';
import { LoadingButton } from '@/components/ui/LoadingComponents';

export default function SummaryScreen() {
  const { state, dispatch } = useInterview();
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestartInterview = () => {
    setIsRestarting(true);
    setTimeout(() => {
      dispatch({ type: 'RESET_INTERVIEW' });
      setIsRestarting(false);
    }, 500);
  };

  const answeredQuestions = state.responses.map(response => {
    const questionId = response.questionId.replace('-followup', '');
    return {
      ...response,
      isFollowUp: response.questionId.includes('-followup')
    };
  });

  const weakAreas = state.responses
    .filter(response => response.isWeak)
    .map(response => response.questionId);

  const strongAnswers = state.responses
    .filter(response => !response.isWeak);

  const getDynamicExample = () => {
    // Find the first weak answer to build example from
    const weakResponse = state.responses.find(r => r.isWeak);
    if (!weakResponse) {
      // If no weak answers, show a generic improvement structure
      return {
        questionType: 'technical challenge',
        context: 'In my last project at TechCorp, we had a React dashboard with performance issues',
        challenge: 'The component tree was re-rendering on every user action, causing 2-3 second delays',
        solution: 'I implemented React.memo for expensive components, used useMemo for calculations, and added useCallback for event handlers',
        result: 'This reduced render time from 2000ms to under 100ms and improved user satisfaction scores by 40%'
      };
    }

    // Create example based on their weak answer's category
    const questionId = weakResponse.questionId.replace('-followup', '');
    
    if (questionId.includes('hooks')) {
      return {
        questionType: 'React Hooks challenge',
        context: 'At my previous company, we had a user profile component that was causing performance issues',
        challenge: 'The component was making unnecessary API calls on every render due to poorly placed useEffect dependencies',
        solution: 'I refactored the useEffect to depend only on user ID, implemented useCallback for the fetch function, and added useMemo for derived state',
        result: 'API calls dropped from 50+ per page load to just 1, and the page load time improved from 3s to 800ms'
      };
    } else if (questionId.includes('performance')) {
      return {
        questionType: 'performance optimization',
        context: 'Working on an e-commerce platform, our product listing page was struggling with large datasets',
        challenge: 'The page would freeze when displaying 1000+ products, especially on mobile devices',
        solution: 'I implemented React.lazy for code splitting, added virtualization for the product list, and optimized images with next/image',
        result: 'Time to interactive improved from 8 seconds to 2 seconds, and mobile performance scores increased by 60%'
      };
    } else if (questionId.includes('state')) {
      return {
        questionType: 'state management decision',
        context: 'Our team was building a multi-step checkout flow with complex form validation',
        challenge: 'Local state was becoming unwieldy with 15+ form fields and cross-step validation requirements',
        solution: 'I migrated from useState to Zustand, created typed stores for each checkout step, and implemented persistence for form recovery',
        result: 'Development velocity increased 3x, bugs decreased by 70%, and we added form recovery that reduced cart abandonment by 15%'
      };
    } else {
      return {
        questionType: 'architecture challenge',
        context: 'Leading frontend development for a SaaS dashboard with 8 developers',
        challenge: 'Components were tightly coupled, making features difficult to test and causing frequent merge conflicts',
        solution: 'I established a design system with Storybook, implemented feature-based folder structure, and added strict TypeScript interfaces',
        result: 'Development conflicts dropped 80%, component reusability increased to 60%, and new feature delivery time halved'
      };
    }
  };

  const exampleAnswer = getDynamicExample();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h1 className="text-3xl font-bold text-slate-900">Interview Complete</h1>
            <p className="text-slate-600 mt-2">
              {state.candidateName ? `Here's how you performed, ${state.candidateName}` : "Here's how you performed"}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        
        {/* Overview stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={200}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center transform hover:scale-105 transition-transform duration-200">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                <AnimatedCounter value={state.responses.length} />
              </div>
              <div className="text-slate-600 font-medium">Questions Answered</div>
              <div className="text-xs text-slate-400 mt-1">of ~6 total</div>
            </div>
          </FadeIn>
          
          <FadeIn delay={400}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              <AnimatedCounter value={strongAnswers.length} />
            </div>
            <div className="text-slate-600 font-medium">Strong Responses</div>
            <div className="text-xs text-slate-400 mt-1">
              <AnimatedCounter 
                value={state.responses.length > 0 ? Math.round((strongAnswers.length / state.responses.length) * 100) : 0} 
              />% success rate
            </div>
          </div>
          </FadeIn>
          
          <FadeIn delay={600}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-4xl font-bold text-amber-600 mb-2">
              <AnimatedCounter value={weakAreas.length} />
            </div>
            <div className="text-slate-600 font-medium">Needed Follow-up</div>
            <div className="text-xs text-slate-400 mt-1">
              {weakAreas.length > 0 ? 'Room for improvement' : 'Great depth!'}
            </div>
          </div>
          </FadeIn>
        </div>

        {/* Topics covered */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Topics Covered</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {state.topics.map((topic, index) => (
              <div 
                key={topic}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-sm font-medium text-slate-700"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        {/* Where depth was shallow */}
        {weakAreas.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-900 mb-4">
              Areas That Needed Follow-up
            </h2>
            <div className="space-y-3">
              {weakAreas.map((questionId, index) => {
                const response = state.responses.find(r => r.questionId === questionId);
                return (
                  <div key={questionId} className="bg-white rounded-lg border border-orange-200 p-4">
                    <div className="text-sm text-orange-700 font-medium mb-2">
                      Initial Response:
                    </div>
                    <div className="text-slate-600 italic">
                      "{response?.answer}"
                    </div>
                    <div className="text-xs text-orange-600 mt-2">
                      → Required follow-up for more specific examples
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic example of stronger answer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-emerald-900">
              {weakAreas.length > 0 ? 'How to improve your answers' : 'Strong Answer Template'}
            </h2>
            {weakAreas.length > 0 && (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Based on your {exampleAnswer.questionType}
              </span>
            )}
          </div>
          
          <div className="bg-white rounded-lg border border-emerald-200 p-5 space-y-4">
            <div className="text-sm">
              <span className="font-semibold text-green-700 inline-block w-20">Context:</span> 
              <span className="text-slate-700">"{exampleAnswer.context}"</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-orange-700 inline-block w-20">Challenge:</span> 
              <span className="text-slate-700">"{exampleAnswer.challenge}"</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-blue-700 inline-block w-20">Solution:</span> 
              <span className="text-slate-700">"{exampleAnswer.solution}"</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-purple-700 inline-block w-20">Result:</span> 
              <span className="text-slate-700">"{exampleAnswer.result}"</span>
            </div>
            
            <div className="mt-4 pt-3 border-t border-green-100">
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">✓ Specific company/project</span>
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded">✓ Real technical problem</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">✓ Technical implementation details</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">✓ Measurable business impact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <FadeIn delay={800}>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <LoadingButton
              onClick={handleRestartInterview}
              isLoading={isRestarting}
              disabled={isRestarting}
              variant="primary"
              className="group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 py-4 px-8 rounded-xl"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRestarting ? 'Preparing New Interview...' : 'Try Another Interview'}
            </LoadingButton>
            
            <button
              onClick={() => window.print()}
              className="group bg-slate-600 hover:bg-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Save Results
            </button>
          </div>
        </FadeIn>

        {/* Footer message */}
        <div className="text-center pt-6 border-t border-slate-200">
          <p className="text-slate-600">
            Remember: Real interviews reward specific examples over theoretical knowledge.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Practice telling your stories with context, challenge, solution, and results.
          </p>
        </div>
      </div>
    </div>
  );
}