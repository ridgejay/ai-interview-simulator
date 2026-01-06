import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { originalQuestion, originalAnswer, evaluation, difficulty } = await request.json();

    const prompt = `You are a senior technical interviewer who needs to create a targeted follow-up question based on a candidate's weak initial response.

ORIGINAL QUESTION (${difficulty}): ${originalQuestion}

CANDIDATE'S ANSWER: ${originalAnswer}

AI EVALUATION: ${evaluation.reasoning}

DETECTED ISSUES:
- Missing specifics: ${!evaluation.hasSpecifics}
- No real examples: ${!evaluation.hasRealExample}
- Missed core points: ${!evaluation.coversCorePoints}

Create a targeted follow-up question that:
1. Addresses the specific weaknesses identified
2. Gives the candidate a chance to demonstrate knowledge they might have
3. Is more specific and concrete than the original question
4. Maintains interview pressure while being fair

The follow-up should probe deeper into practical experience and force specificity. Make it sound like a real interviewer pushing for details.

Respond with valid JSON in this exact format:
{
  "followUpQuestion": "the targeted follow-up question text",
  "focusArea": "what specific area this targets (e.g., 'practical experience', 'technical specifics', 'problem-solving approach')",
  "expectedImprovement": "what the candidate should demonstrate in their response"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a senior technical interviewer who creates targeted follow-up questions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Follow-up generation error:', error);
    return NextResponse.json(
      { error: 'Follow-up generation failed' },
      { status: 500 }
    );
  }
}