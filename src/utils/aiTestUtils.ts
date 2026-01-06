// Test dynamic question generation
import { Question } from '@/types/interview';

export async function testQuestionGeneration() {
  console.log('🧪 Testing AI Question Generation...\n');
  
  // Test 1: Generate a basic intermediate question
  console.log('Test 1: Basic intermediate question');
  try {
    const response1 = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty: 'intermediate',
        previousQuestions: []
      })
    });
    
    if (response1.ok) {
      const question1 = await response1.json();
      console.log('✅ Generated question:', question1.text);
      console.log('📝 Category:', question1.category);
      console.log('🎯 Expected elements:', question1.expectedAnswerElements?.join(', '));
      console.log('⚠️ Weak indicators:', question1.weakAnswerIndicators?.join(', '));
      console.log('---');
    } else {
      console.log('❌ Failed to generate question:', response1.status);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
  
  // Test 2: Generate a senior question avoiding previous topics
  console.log('\nTest 2: Senior question with topic avoidance');
  try {
    const response2 = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty: 'senior',
        previousQuestions: [
          'Explain useState and useEffect hooks',
          'How do you optimize React performance?'
        ]
      })
    });
    
    if (response2.ok) {
      const question2 = await response2.json();
      console.log('✅ Generated question:', question2.text);
      console.log('📝 Category:', question2.category);
      console.log('🎯 Expected elements:', question2.expectedAnswerElements?.join(', '));
      console.log('⚠️ Weak indicators:', question2.weakAnswerIndicators?.join(', '));
      console.log('---');
    } else {
      console.log('❌ Failed to generate question:', response2.status);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Test answer evaluation with hints
export async function testAnswerEvaluation() {
  console.log('\n🔍 Testing Enhanced AI Answer Evaluation...\n');
  
  const testCases = [
    {
      name: 'Strong Answer',
      answer: 'I use React.memo for component memoization when I have expensive child components. In my last project, I had a data visualization dashboard where parent state changes were causing unnecessary re-renders of expensive chart components. I wrapped them in React.memo with a custom comparison function that only triggered re-renders when the actual data changed, not just when parent state updated. This reduced render times from 200ms to 50ms.',
      expected: { isWeak: false, hasSpecifics: true, hasRealExample: true }
    },
    {
      name: 'Weak Answer',
      answer: 'I can\'t elaborate on that. React has some optimization techniques but I haven\'t really used them.',
      expected: { isWeak: true, hasSpecifics: false, hasRealExample: false }
    },
    {
      name: 'Theoretical Answer',
      answer: 'React optimization can be done with memo, useMemo, and useCallback. These prevent unnecessary re-renders.',
      expected: { isWeak: true, hasSpecifics: false, hasRealExample: false }
    }
  ];
  
  const question = {
    text: 'What React optimization techniques have you used in production?',
    difficulty: 'senior',
    expectedAnswerElements: ['React.memo', 'useMemo', 'useCallback', 'real project example', 'performance metrics'],
    weakAnswerIndicators: ['theoretical only', 'no specific examples', 'can\'t elaborate']
  };
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: testCase.answer,
          questionDifficulty: question.difficulty,
          questionText: question.text,
          expectedAnswerElements: question.expectedAnswerElements,
          weakAnswerIndicators: question.weakAnswerIndicators
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Result: ${result.isWeak ? '❌ Weak' : '✅ Strong'}`);
        console.log(`🔍 Reasoning: ${result.reasoning}`);
        console.log(`📝 Specifics: ${result.hasSpecifics ? '✅' : '❌'}`);
        console.log(`💼 Real Example: ${result.hasRealExample ? '✅' : '❌'}`);
        console.log(`🎯 Core Points: ${result.coversCorePoints ? '✅' : '❌'}`);
        console.log('---');
      } else {
        console.log('❌ Evaluation failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Error:', error);
    }
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testAI = {
    testQuestionGeneration,
    testAnswerEvaluation
  };
}