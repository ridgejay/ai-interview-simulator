import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionTypePrompt } from '@/utils/questionVariety';
import { ApiClient } from '@/utils/apiClient';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { difficulty, previousQuestions = [], weakAreas = [], performanceLevel = 'neutral', usedQuestionTypes = [] } = await request.json();
    
    const apiClient = new ApiClient();

    const focusArea = weakAreas.length > 0 ? `Focus on strengthening: ${weakAreas.join(', ')}` : 'Choose any relevant technical area';
    const varietyPrompt = generateQuestionTypePrompt(usedQuestionTypes);
    const performanceAdjustment = 
      performanceLevel === 'struggling' ? 'Keep questions accessible but probing. Build confidence while maintaining standards.' :
      performanceLevel === 'strong' ? 'Escalate to architecture and design challenges. Test senior-level thinking.' :
      'Standard intermediate to senior progression';

    const prompt = `Generate a realistic React/Frontend interview question for a ${difficulty} developer.

Previous questions already asked: ${previousQuestions.join(', ')}

VARIETY REQUIREMENT: ${varietyPrompt}

FOCUS STRATEGY: ${focusArea}

PERFORMANCE CONTEXT: ${performanceAdjustment}

Requirements:
- Make it COMPLETELY DIFFERENT from previous questions in style and approach
- ${weakAreas.length > 0 ? `Target weak areas: ${weakAreas.join(', ')} with questions that probe deeper understanding` : 'Focus on real-world scenarios that ' + difficulty + ' developers actually encounter'}
- Vary question types: scenarios, debugging, architecture, optimization, best practices, code review, etc.
- Include a challenging follow-up that requires concrete experience
- Be creative - think outside typical interview questions

Categories to choose from: React Hooks, State Management, Performance, Architecture, Testing, TypeScript, API Integration, Error Handling, Security, Build Tools

For ${difficulty} level:
- Intermediate: Questions about core concepts with practical application
- Senior: Questions requiring deep experience, architecture decisions, and problem-solving

Respond with valid JSON in this exact format:
{
  "id": "unique-id",
  "text": "main question text",
  "followUp": "specific follow-up requiring real experience",
  "category": "category name",
  "difficulty": "${difficulty}",
  "expectedAnswerElements": ["key point 1", "key point 2", "key point 3"],
  "weakAnswerIndicators": ["red flag 1", "red flag 2", "red flag 3"]
}`;

    const response = await apiClient.makeOpenAIRequest({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior technical interviewer who creates challenging but fair interview questions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 500
    });

    const data = await response.json();
    const question = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(question);
    
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Question generation failed' },
      { status: 500 }
    );
  }
}