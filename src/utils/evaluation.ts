import { Question } from '@/types/interview';

interface EvaluationResult {
  isWeak: boolean;
  hasSpecifics: boolean;
  hasRealExample: boolean;
  coversCorePoints: boolean;
  reasoning: string;
}

export async function evaluateAnswer(
  answer: string, 
  questionDifficulty: Question['difficulty'],
  questionText: string,
  expectedAnswerElements?: string[],
  weakAnswerIndicators?: string[],
  previousResponses?: Array<{ isWeak?: boolean; hasSpecifics?: boolean; coversCorePoints?: boolean }>
): Promise<EvaluationResult> {
  
  // Quick client-side checks for obvious failures
  if (answer.trim().length < 10) {
    return {
      isWeak: true,
      hasSpecifics: false,
      hasRealExample: false,
      coversCorePoints: false,
      reasoning: 'Response too brief to evaluate'
    };
  }

  try {
    const response = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: answer.trim(),
        questionDifficulty,
        questionText,
        expectedAnswerElements,
        weakAnswerIndicators,
        previousResponses: previousResponses?.slice(-3) || [] // Last 3 responses for context
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('AI evaluation failed:', error);
    
    // Fallback to basic evaluation if AI fails
    return {
      isWeak: answer.trim().length < 50,
      hasSpecifics: false,
      hasRealExample: false,
      coversCorePoints: false,
      reasoning: 'AI evaluation unavailable - using basic length check'
    };
  }
}