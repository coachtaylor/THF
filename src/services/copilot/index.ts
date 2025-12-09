// Copilot Service Exports
// PRD 3.0: Simple chat for questions about workouts, binding, HRT, surgery

export {
  generateResponse,
  getSuggestedQuestions,
  getWelcomeMessage,
  type CopilotMessage,
  type UserContext,
} from './responseGenerator';

export {
  searchKnowledge,
  getRandomTips,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
} from './knowledgeBase';
