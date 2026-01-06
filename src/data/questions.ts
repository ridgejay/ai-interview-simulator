import { Question } from '@/types/interview';

export const interviewQuestions: Question[] = [
  {
    id: 'react-hooks-1',
    text: 'Explain the difference between useState and useEffect. When would you use each?',
    followUp: 'I need a specific example. Walk me through a real component where you had performance issues due to improper useEffect usage. What was the bug and how did you fix it?',
    category: 'React Hooks',
    difficulty: 'intermediate'
  },
  {
    id: 'state-management-1', 
    text: 'How do you decide between local component state versus global state management?',
    followUp: 'Give me a concrete example from a project. What was the specific point where local state became insufficient? What metrics or pain points drove that decision?',
    category: 'State Management',
    difficulty: 'senior'
  },
  {
    id: 'performance-1',
    text: 'What are some techniques you use to optimize React component performance?',
    followUp: 'Tell me about the worst performance problem you ever debugged in React. What tools did you use? How did you isolate the issue? What was the root cause?',
    category: 'Performance Optimization', 
    difficulty: 'senior'
  },
  {
    id: 'architecture-1',
    text: 'How do you structure a large React application?',
    followUp: 'Describe the folder structure and component hierarchy for the most complex React app you built. How many developers worked on it? How did you prevent conflicts?',
    category: 'Component Architecture',
    difficulty: 'senior'
  },
  {
    id: 'testing-1',
    text: 'What is your approach to testing React components?',
    followUp: 'Walk me through testing a component with async operations, user interactions, and external API calls. Show me the actual test code structure.',
    category: 'Testing',
    difficulty: 'intermediate'
  },
  {
    id: 'hooks-advanced-1',
    text: 'When would you create a custom hook versus just using built-in hooks?',
    followUp: 'Show me a custom hook you wrote. What problem did it solve? How did you handle edge cases and testing?',
    category: 'React Hooks',
    difficulty: 'senior' 
  },
  {
    id: 'error-boundaries-1',
    text: 'How do you handle errors in React applications?',
    followUp: 'Describe a production error you had to debug. How did you track it down? What monitoring did you put in place to prevent it happening again?',
    category: 'Error Handling',
    difficulty: 'senior'
  },
  {
    id: 'bundle-optimization-1',
    text: 'How do you optimize bundle size in a React application?',
    followUp: 'Tell me about a time you had to reduce bundle size on a production app. What was the size before and after? Which techniques had the biggest impact?',
    category: 'Performance Optimization',
    difficulty: 'senior'
  }
];

export function getNextQuestion(usedQuestions: string[], phase: string): Question | null {
  // Filter out used questions
  const availableQuestions = interviewQuestions.filter(q => !usedQuestions.includes(q.id));
  
  if (availableQuestions.length === 0) return null;
  
  // Select based on interview phase
  let targetDifficulty: Question['difficulty'];
  switch (phase) {
    case 'warmup': targetDifficulty = 'intermediate'; break;
    case 'technical': targetDifficulty = 'intermediate'; break;
    case 'deep-dive': targetDifficulty = 'senior'; break;
    default: targetDifficulty = 'intermediate';
  }
  
  // Try to get a question of target difficulty first
  const preferredQuestions = availableQuestions.filter(q => q.difficulty === targetDifficulty);
  const questionPool = preferredQuestions.length > 0 ? preferredQuestions : availableQuestions;
  
  return questionPool[Math.floor(Math.random() * questionPool.length)];
}

export function evaluateAnswer(answer: string, questionDifficulty: Question['difficulty']): {
  isWeak: boolean;
  hasSpecifics: boolean;
  hasRealExample: boolean;
  reasoning: string;
} {
  const trimmed = answer.trim().toLowerCase();
  
  // CRITICAL FAILS - Be very explicit about catching inability
  const explicitInability = [
    /\b(can't|cannot|can not)\b.*\b(answer|elaborate|explain|help|say|tell)\b/i.test(answer),
    /\b(don't know|dont know|no idea|no clue|not sure|unsure)\b/i.test(answer),
    /\b(haven't|havent|never)\b.*\b(done|worked|used|tried|experienced)\b/i.test(answer),
    /\b(no experience|not familiar|not sure|pass|skip)\b/i.test(answer)
  ];
  
  // SHORT/EMPTY responses
  const tooShort = trimmed.length < 25;
  
  // AVOIDANCE patterns
  const avoidancePatterns = [
    /^(yes|no|maybe|i think|probably|i guess|well|um|uh|hmm)\.?$/i.test(trimmed),
    /\b(would|could|might|should)\b.*\b(probably|maybe|possibly|theoretically)\b/i.test(answer) && trimmed.length < 80
  ];
  
  if (explicitInability.some(pattern => pattern) || tooShort || avoidancePatterns.some(pattern => pattern)) {
    return {
      isWeak: true,
      hasSpecifics: false,
      hasRealExample: false,
      reasoning: explicitInability.some(pattern => pattern) ? 
        'Explicit statement of inability to answer' : 
        tooShort ? 'Response too brief to demonstrate knowledge' :
        'Avoidance or purely hypothetical response'
    };
  }
  
  // Count actual technical terms (very specific React/frontend terms)
  const technicalPattern = /\b(usememo|usecallback|useeffect|usestate|usecontext|usereducer|react\.memo|memo|lazy|suspense|portal|fragment|strictmode|jsx|tsx|component|props|state|hook|lifecycle|render|reconciliation|virtual dom|fiber|ssr|csr|hydration|code splitting|tree shaking|webpack|vite|rollup|babel|typescript|jest|cypress|testing library|enzyme|storybook|redux|zustand|mobx|context api|custom hook|higher order component|hoc|compound component|render prop|children|ref|useref|useimperativehandle|forwardref|api|rest|graphql|fetch|axios|async|await|promise|callback|event handler|onclick|onchange|onsubmit|performance|optimization|bundle|lazy loading|memoization|debounce|throttle|lighthouse|devtools|eslint|prettier|git|github|deployment|ci cd|docker|kubernetes)\b/gi;
  const technicalTerms = (answer.match(technicalPattern) || []).length;
  
  // Count real experience indicators (specific work context)
  const experiencePattern = /\b(at (my )?(previous|last|current|former) (job|company|role|position|workplace)|at [a-z]+ (company|corp|inc|llc|startup|agency)|we (built|developed|implemented|deployed|shipped|created|designed)|our (team|client|project|application|system|product|website|platform)|production (environment|deployment|issue|bug|system|application)|i (built|developed|implemented|fixed|debugged|optimized|refactored|designed|architected|created|shipped)|real (project|application|system|world|client)|work(ed|ing) (on|with|for|at)|client (project|requirement|feedback|request)|user (feedback|complaints|issues|testing|research)|launched|released|delivered|maintained)\b/gi;
  const experienceTerms = (answer.match(experiencePattern) || []).length;
  
  // Count specific metrics/outcomes
  const metricsPattern = /\b(\d+(\.\d+)?%|\d+x (faster|slower|better|worse)|\d+ (ms|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|users?|customers?|requests?|calls?|mb|kb|gb|tb)|(improved|reduced|increased|decreased|boosted|enhanced|optimized) by \d+|(from|before) \d+ (to|after) \d+|(before|after): ?\d+|up to \d+|over \d+|under \d+|\d+ (times|fold))\b/gi;
  const metricsTerms = (answer.match(metricsPattern) || []).length;
  
  // Evaluate substance
  const hasSpecifics = technicalTerms >= 2;
  const hasRealExample = experienceTerms >= 1;
  const hasMetrics = metricsTerms >= 1;
  const hasSubstance = trimmed.length >= 80;
  
  // Check for buzzword fluff without substance
  const buzzwordPattern = /\b(leverage|utilize|implement|optimize|enhance|streamline|robust|scalable|efficient|effective|powerful|flexible|innovative|cutting edge|state of the art|best practices|industry standards|enterprise grade|mission critical|game changing|revolutionary|disruptive|synergistic|holistic|comprehensive|strategic|tactical|dynamic|agile|lean|robust|seamless|intuitive)\b/gi;
  const buzzwords = (answer.match(buzzwordPattern) || []).length;
  
  let isWeak = false;
  let reasoning = '';
  
  // STRICT EVALUATION
  if (questionDifficulty === 'senior') {
    // Senior questions require ALL THREE: technical depth, real experience, and substance
    if (!hasSpecifics || !hasRealExample || !hasSubstance) {
      isWeak = true;
      const missing = [];
      if (!hasSpecifics) missing.push(`technical specifics (found ${technicalTerms}, need 2+)`);
      if (!hasRealExample) missing.push(`real work experience (found ${experienceTerms}, need 1+)`);
      if (!hasSubstance) missing.push('sufficient detail (need 80+ chars)');
      reasoning = `Senior-level answer missing: ${missing.join(', ')}`;
    }
  } else {
    // Intermediate questions still need substance plus either tech OR experience
    if (!hasSubstance) {
      isWeak = true;
      reasoning = `Answer too brief (${trimmed.length} chars) - needs detailed explanation`;
    } else if (!hasSpecifics && !hasRealExample) {
      isWeak = true;
      reasoning = `Lacks both technical depth (${technicalTerms} terms) and work experience (${experienceTerms} references)`;
    } else if (buzzwords > 3 && technicalTerms === 0 && experienceTerms === 0) {
      isWeak = true;
      reasoning = 'Generic buzzwords without concrete technical details or experience';
    }
  }
  
  // Success message should be specific about what made it strong
  if (!isWeak) {
    const strengths = [];
    if (hasSpecifics) strengths.push(`technical depth (${technicalTerms} terms)`);
    if (hasRealExample) strengths.push(`work experience (${experienceTerms} references)`);
    if (hasMetrics) strengths.push(`measurable outcomes (${metricsTerms} metrics)`);
    reasoning = strengths.length > 0 ? 
      `Strong answer with ${strengths.join(' and ')}` :
      'Answer demonstrates good understanding with sufficient detail';
  }
  
  return {
    isWeak,
    hasSpecifics,
    hasRealExample,
    reasoning
  };
}