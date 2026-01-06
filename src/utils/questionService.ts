import { Question } from '@/types/interview';
import { interviewQuestions } from '@/data/questions';

interface QuestionGenerationOptions {
  difficulty: 'intermediate' | 'senior';
  usedQuestions: string[];
  responses: Array<{ isWeak?: boolean; hasSpecifics?: boolean; coversCorePoints?: boolean; questionId: string }>;
}

export async function getNextQuestion(options: QuestionGenerationOptions): Promise<Question> {
  const { difficulty, usedQuestions, responses } = options;
  
  // Analyze performance to determine strategy
  const recentResponses = responses.slice(-3);
  const weakResponses = recentResponses.filter(r => r.isWeak).length;
  const strongResponses = recentResponses.filter(r => !r.isWeak && r.hasSpecifics && r.coversCorePoints).length;
  
  // Determine performance level and adjust difficulty accordingly
  let targetDifficulty = difficulty;
  let performanceLevel = 'neutral';
  
  if (strongResponses >= 2 && weakResponses === 0) {
    // Candidate is doing well, escalate
    targetDifficulty = 'senior';
    performanceLevel = 'strong';
  } else if (weakResponses >= 2) {
    // Candidate struggling, make questions more accessible
    targetDifficulty = 'intermediate';
    performanceLevel = 'struggling';
  }
  
  // Identify weak areas from previous responses
  const weakAreas: string[] = [];
  responses.forEach(response => {
    if (response.isWeak) {
      const questionId = response.questionId.replace('-followup', '');
      const staticQ = interviewQuestions.find(q => q.id === questionId);
      if (staticQ?.category) {
        weakAreas.push(staticQ.category);
      }
    }
  });
  
  // Remove duplicates and limit to most recent weak areas
  const uniqueWeakAreas = [...new Set(weakAreas)].slice(-2);
  
  // Decide if we should generate dynamic question
  // Generate dynamic questions more frequently for variety
  const shouldGenerateDynamic = 
    responses.length >= 1 || // Start dynamic questions after first response
    uniqueWeakAreas.length > 0 || 
    Math.random() > 0.3; // 70% chance of dynamic question even on first question
  
  if (shouldGenerateDynamic) {
    try {
      const previousQuestions = usedQuestions.map(id => {
        const staticQ = interviewQuestions.find(q => q.id === id);
        return staticQ?.text || id;
      });
      
      const dynamicQuestion = await generateDynamicQuestion(
        targetDifficulty, 
        previousQuestions, 
        uniqueWeakAreas, 
        performanceLevel,
        usedQuestions
      );
      return dynamicQuestion;
    } catch (error) {
      console.error('Failed to generate dynamic question, falling back to static:', error);
      // Fall back to static questions if AI fails
    }
  }
  
  // Use static questions as fallback or for initial questions
  const availableQuestions = interviewQuestions.filter(
    q => q.difficulty === targetDifficulty && !usedQuestions.includes(q.id)
  );
  
  if (availableQuestions.length === 0) {
    // If we run out of static questions, try to generate dynamic ones
    try {
      const previousQuestions = usedQuestions.map(id => {
        const staticQ = interviewQuestions.find(q => q.id === id);
        return staticQ?.text || id;
      });
      
      return await generateDynamicQuestion(targetDifficulty, previousQuestions, uniqueWeakAreas, performanceLevel, []);
    } catch (error) {
      // Final fallback - reset and use first question
      return interviewQuestions.find(q => q.difficulty === targetDifficulty) || interviewQuestions[0];
    }
  }
  
  // Smart selection based on weak areas
  if (uniqueWeakAreas.length > 0) {
    const targetedQuestions = availableQuestions.filter(q => 
      uniqueWeakAreas.some(area => q.category.toLowerCase().includes(area.toLowerCase()))
    );
    if (targetedQuestions.length > 0) {
      return targetedQuestions[0];
    }
  }
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}

async function generateDynamicQuestion(
  difficulty: string, 
  previousQuestions: string[], 
  weakAreas: string[], 
  performanceLevel: string,
  usedQuestionTypes: string[]
): Promise<Question> {
  const response = await fetch('/api/generate-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      difficulty,
      previousQuestions,
      weakAreas,
      performanceLevel,
      usedQuestionTypes
    })
  });
  
  if (!response.ok) {
    throw new Error(`Question generation failed: ${response.status}`);
  }
  
  const question = await response.json();
  
  // Mark as AI generated for tracking
  return {
    ...question,
    isAIGenerated: true
  };
}