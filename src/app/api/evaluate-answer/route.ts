import { NextRequest, NextResponse } from 'next/server';
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
    const { answer, questionDifficulty, questionText, expectedAnswerElements, weakAnswerIndicators, previousResponses = [] } = await request.json();
    
    const apiClient = new ApiClient();

    // Calculate performance context
    const strongAnswers = previousResponses.filter((r: any) => !r.isWeak).length;
    const totalAnswers = previousResponses.length;
    const performanceContext = totalAnswers > 0 ? `Candidate has answered ${strongAnswers}/${totalAnswers} questions well so far.` : 'This is their first question.';

    const prompt = `You are an expert technical interviewer evaluating a candidate's response to a React/Frontend interview question.

QUESTION (${questionDifficulty} level): ${questionText}

CANDIDATE ANSWER: ${answer}

PERFORMANCE CONTEXT: ${performanceContext}

EXPECTED ANSWER ELEMENTS: ${expectedAnswerElements?.join(', ') || 'Not specified'}

WEAK ANSWER INDICATORS: ${weakAnswerIndicators?.join(', ') || 'Generic weak responses'}

Evaluate this answer like a senior developer would in a real interview. Consider:
1. Does the answer address the core question with technical accuracy?
2. Does it demonstrate real-world experience vs just theoretical knowledge?
3. Are specific examples, tools, or concrete details mentioned?
4. Does it show depth appropriate for a ${questionDifficulty} developer?
5. Does it avoid the weak answer patterns listed above?

EVALUATION STANDARDS:
- INADEQUATE: No knowledge shown, completely off-topic, or obvious "I don't know" responses
- ADEQUATE: Shows understanding of core concepts, may lack some depth but demonstrates competence  
- STRONG: Deep knowledge with specific examples and practical experience

For a ${questionDifficulty}-level question:
- Senior: ADEQUATE = solid technical understanding + some practical context. STRONG = deep knowledge + real project examples + specific tools/challenges
- Intermediate: ADEQUATE = basic concepts explained correctly. STRONG = good technical grasp + practical application

CONTEXT CONSIDERATION: ${strongAnswers >= 2 ? 'Candidate has shown competence previously - give benefit of doubt on borderline responses' : strongAnswers === 0 && totalAnswers > 0 ? 'Candidate struggling - be encouraging but maintain standards' : 'First impression - evaluate fairly without bias'}

RED FLAGS for INADEQUATE answers:
- Explicit lack of knowledge ("I don't know", "I can't think of anything")
- Completely incorrect technical information
- Obviously copied responses without understanding
- Total failure to address the core question
- Clear indicators of inexperience ("I think", "I believe", "probably" without supporting evidence)
- Responses that completely miss the core question
- Copy-paste answers that sound like documentation

BALANCED EVALUATION:
- Give credit for partial technical knowledge if it's genuine
- Recognize real-world examples even if they lack some details
- Value practical experience over perfect theoretical explanations
- Be encouraging of growth while noting areas for improvement

Respond with valid JSON in this exact format:
{
  "isWeak": boolean,
  "hasSpecifics": boolean,
  "hasRealExample": boolean,
  "coversCorePoints": boolean,
  "reasoning": "specific explanation of evaluation, mentioning what made it adequate/strong or what was missing for inadequate answers"
}

Be realistic and encouraging. Mark as weak only if genuinely inadequate. Adequate answers with room for improvement should not be marked weak.`;

    const response = await apiClient.makeOpenAIRequest({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const data = await response.json();
    const evaluation = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(evaluation);
    
  } catch (error) {
    console.error('Evaluation API error:', error);
    return NextResponse.json(
      { 
        error: 'Evaluation failed',
        fallback: {
          isWeak: true,
          hasSpecifics: false, 
          hasRealExample: false,
          reasoning: 'AI evaluation service temporarily unavailable'
        }
      },
      { status: 500 }
    );
  }
}