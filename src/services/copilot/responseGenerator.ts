// Copilot Response Generator
// PRD 3.0: Generates responses using knowledge base retrieval + red flag deflection
// No LLM integration for v0 - purely retrieval-based

import { searchKnowledge, getRandomTips, KnowledgeEntry } from './knowledgeBase';
import { checkForRedFlags, CRISIS_RESOURCES, RedFlagResult } from '../safety/redFlagDeflection';
import { trackEvent } from '../analytics';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    isRedFlag?: boolean;
    redFlagCategory?: string;
    relatedGuide?: string;
    matchedKnowledge?: string[];
  };
}

export interface UserContext {
  binds_chest?: boolean;
  on_hrt?: boolean;
  has_surgery?: boolean;
  hrt_type?: 'estrogen_blockers' | 'testosterone';
  primary_goal?: string;
  fitness_experience?: string;
}

/**
 * Generate a response to a user query
 */
export async function generateResponse(
  query: string,
  context?: UserContext
): Promise<CopilotMessage> {
  const messageId = `msg_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Step 1: Check for red flags
  const redFlagResult = checkForRedFlags(query);

  if (redFlagResult.isRedFlag) {
    // Track red flag trigger
    await trackEvent('copilot_red_flag_triggered', {
      category: redFlagResult.category,
      keywords: redFlagResult.matchedKeywords.join(', '),
    });

    let response = redFlagResult.deflectionMessage;

    // Add crisis resources for mental health emergencies
    if (redFlagResult.category === 'medical_emergency') {
      response += '\n\n**Crisis Resources:**\n';
      response += `• ${CRISIS_RESOURCES.suicideLifeline.name}: ${CRISIS_RESOURCES.suicideLifeline.number}\n`;
      response += `• ${CRISIS_RESOURCES.transLifeline.name}: ${CRISIS_RESOURCES.transLifeline.number}\n`;
      response += `• ${CRISIS_RESOURCES.trevorProject.name}: ${CRISIS_RESOURCES.trevorProject.number}`;
    }

    return {
      id: messageId,
      role: 'assistant',
      content: response,
      timestamp,
      metadata: {
        isRedFlag: true,
        redFlagCategory: redFlagResult.category,
      },
    };
  }

  // Step 2: Search knowledge base
  const matches = searchKnowledge(query, context);

  if (matches.length > 0) {
    // Track successful query
    await trackEvent('copilot_query_answered', {
      matched_entries: matches.map(m => m.id).join(', '),
      query_length: query.length,
    });

    // Use the best match as the primary response
    const bestMatch = matches[0];
    let response = bestMatch.answer;

    // Add related guide suggestion if available
    if (bestMatch.relatedGuide) {
      response += `\n\n---\n*Want to learn more? Check out our ${bestMatch.relatedGuide === 'binder_safety' ? 'Binder Safety Guide' : 'Post-Op Movement Guide'} in Settings.*`;
    }

    // If there are additional relevant topics, mention them
    if (matches.length > 1) {
      response += '\n\n**Related topics I can help with:**\n';
      matches.slice(1).forEach(match => {
        response += `• ${match.question}\n`;
      });
    }

    return {
      id: messageId,
      role: 'assistant',
      content: response,
      timestamp,
      metadata: {
        relatedGuide: bestMatch.relatedGuide,
        matchedKnowledge: matches.map(m => m.id),
      },
    };
  }

  // Step 3: No matches - provide a helpful fallback
  await trackEvent('copilot_query_no_match', {
    query_preview: query.substring(0, 50),
  });

  const fallbackResponse = generateFallbackResponse(query, context);

  return {
    id: messageId,
    role: 'assistant',
    content: fallbackResponse,
    timestamp,
    metadata: {
      matchedKnowledge: [],
    },
  };
}

/**
 * Generate a helpful fallback when no knowledge matches
 */
function generateFallbackResponse(query: string, context?: UserContext): string {
  let response = "I don't have a specific answer for that, but I'm here to help with:\n\n";

  response += '• **Binding & exercise** - safe workout tips for binders\n';
  response += '• **HRT & fitness** - how hormones affect training\n';
  response += '• **Post-op recovery** - returning to exercise after surgery\n';
  response += '• **Exercise modifications** - making workouts work for you\n';
  response += '• **Gym dysphoria** - strategies for comfortable workouts\n';

  // Add contextual suggestions based on user profile
  if (context?.binds_chest) {
    response += '\nSince you bind, you might find our **Binder Safety Guide** helpful - check it out in Settings!';
  } else if (context?.has_surgery) {
    response += '\nGiven your surgery history, our **Post-Op Movement Guide** might be useful - find it in Settings!';
  }

  response += '\n\n*Try asking me something like "Can I do cardio while binding?" or "When will I see muscle gains on T?"*';

  return response;
}

/**
 * Get suggested questions based on user context
 */
export function getSuggestedQuestions(context?: UserContext): string[] {
  const suggestions: string[] = [];

  // Context-specific suggestions
  if (context?.binds_chest) {
    suggestions.push('Can I do cardio while binding?');
    suggestions.push('How long can I safely bind during workouts?');
  }

  if (context?.on_hrt && context?.hrt_type === 'testosterone') {
    suggestions.push('When will I see muscle gains on T?');
    suggestions.push('Should I work out on injection day?');
  }

  if (context?.on_hrt && context?.hrt_type === 'estrogen_blockers') {
    suggestions.push('How does estrogen affect my workouts?');
  }

  if (context?.has_surgery) {
    suggestions.push('When can I exercise after surgery?');
    suggestions.push('Will exercise affect my scars?');
  }

  // General suggestions
  suggestions.push('How do I manage gym dysphoria?');
  suggestions.push('Is muscle soreness normal?');
  suggestions.push('Where do I start with TransFitness?');

  // Return up to 4 unique suggestions
  return [...new Set(suggestions)].slice(0, 4);
}

/**
 * Get welcome message for new chat
 */
export function getWelcomeMessage(context?: UserContext): CopilotMessage {
  let greeting = "Hey! I'm your TransFitness Copilot. I can help answer questions about:\n\n";

  greeting += '• Working out safely with your body\n';
  greeting += '• Binding, HRT, and exercise\n';
  greeting += '• Post-op recovery guidance\n';
  greeting += '• Exercise modifications\n';
  greeting += '• Managing gym dysphoria\n';

  greeting += '\n**What can I help you with?**\n\n';

  // Add suggested questions
  const suggestions = getSuggestedQuestions(context);
  if (suggestions.length > 0) {
    greeting += '*Try asking:*\n';
    suggestions.forEach(q => {
      greeting += `• ${q}\n`;
    });
  }

  return {
    id: 'welcome',
    role: 'assistant',
    content: greeting,
    timestamp: new Date().toISOString(),
  };
}
