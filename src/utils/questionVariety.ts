// Question type patterns to ensure variety
export const QUESTION_TYPES = [
  'scenario-based', // "You're working on a project where..."
  'debugging', // "You encounter this error, how do you debug it?"
  'architecture', // "How would you design a system that..."
  'optimization', // "This code is slow, how do you improve it?"
  'best-practices', // "What's the best way to handle..."
  'code-review', // "You see this code in a PR, what concerns do you have?"
  'comparison', // "When would you choose X over Y?"
  'troubleshooting', // "Users are reporting this issue, what's your approach?"
  'scaling', // "How do you handle this at scale?"
  'trade-offs' // "What are the pros and cons of this approach?"
];

export function generateQuestionTypePrompt(usedTypes: string[] = []): string {
  const availableTypes = QUESTION_TYPES.filter(type => !usedTypes.includes(type));
  
  if (availableTypes.length === 0) {
    // Reset if we've used all types
    return `Vary your approach - try a completely different style: ${QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)]}`;
  }
  
  const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  
  const typeInstructions = {
    'scenario-based': 'Create a realistic workplace scenario where they need to make technical decisions',
    'debugging': 'Present a specific error or bug that requires systematic troubleshooting',
    'architecture': 'Ask them to design or structure a complex system or component',
    'optimization': 'Give them a performance problem that needs improvement',
    'best-practices': 'Question their knowledge of industry standards and best approaches',
    'code-review': 'Show problematic code and ask for their review feedback',
    'comparison': 'Ask them to compare different approaches or technologies',
    'troubleshooting': 'Present a user-facing issue that needs investigation',
    'scaling': 'Challenge them with scale and performance considerations',
    'trade-offs': 'Explore their understanding of technical decision-making'
  };
  
  return `Use a ${randomType} approach: ${typeInstructions[randomType]}`;
}