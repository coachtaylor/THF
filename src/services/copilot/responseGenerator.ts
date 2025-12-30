// Copilot Response Generator
// PRD 3.0: Generates responses using knowledge base retrieval + red flag deflection
// No LLM integration for v0 - purely retrieval-based

import {
  searchKnowledge,
  getRandomTips,
  KnowledgeEntry,
} from "./knowledgeBase";
import {
  checkForRedFlags,
  CRISIS_RESOURCES,
  RedFlagResult,
} from "../safety/redFlagDeflection";
import { trackEvent } from "../analytics";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
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
  hrt_type?: "estrogen" | "testosterone";
  primary_goal?: string;
  fitness_experience?: string;
}

/**
 * Generate a response to a user query
 */
export async function generateResponse(
  query: string,
  context?: UserContext,
): Promise<CopilotMessage> {
  const messageId = `msg_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Step 1: Check for red flags
  const redFlagResult = checkForRedFlags(query);

  if (redFlagResult.isRedFlag) {
    // Track red flag trigger
    await trackEvent("copilot_red_flag_triggered", {
      category: redFlagResult.category,
      keywords: redFlagResult.matchedKeywords.join(", "),
    });

    let response = redFlagResult.deflectionMessage;

    // Add crisis resources for mental health emergencies
    if (redFlagResult.category === "medical_emergency") {
      response += "\n\n**Crisis Resources:**\n";
      response += `• ${CRISIS_RESOURCES.suicideLifeline.name}: ${CRISIS_RESOURCES.suicideLifeline.number}\n`;
      response += `• ${CRISIS_RESOURCES.transLifeline.name}: ${CRISIS_RESOURCES.transLifeline.number}\n`;
      response += `• ${CRISIS_RESOURCES.trevorProject.name}: ${CRISIS_RESOURCES.trevorProject.number}`;
    }

    return {
      id: messageId,
      role: "assistant",
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
    await trackEvent("copilot_query_answered", {
      matched_entries: matches.map((m) => m.id).join(", "),
      query_length: query.length,
    });

    // Use the best match as the primary response
    const bestMatch = matches[0];
    let response = bestMatch.answer;

    // Add related guide suggestion if available
    if (bestMatch.relatedGuide) {
      response += `\n\n---\n*Want to learn more? Check out our ${bestMatch.relatedGuide === "binder_safety" ? "Binder Safety Guide" : "Post-Op Movement Guide"} in Settings.*`;
    }

    // If there are additional relevant topics, mention them
    if (matches.length > 1) {
      response += "\n\n**Related topics I can help with:**\n";
      matches.slice(1).forEach((match) => {
        response += `• ${match.question}\n`;
      });
    }

    return {
      id: messageId,
      role: "assistant",
      content: response,
      timestamp,
      metadata: {
        relatedGuide: bestMatch.relatedGuide,
        matchedKnowledge: matches.map((m) => m.id),
      },
    };
  }

  // Step 3: No matches - provide a helpful fallback
  await trackEvent("copilot_query_no_match", {
    query_preview: query.substring(0, 50),
  });

  const fallbackResponse = generateFallbackResponse(query, context);

  return {
    id: messageId,
    role: "assistant",
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
function generateFallbackResponse(
  query: string,
  context?: UserContext,
): string {
  let response =
    "I don't have a specific answer for that yet, but here's what might help:\n\n";

  // Try to be helpful based on query keywords
  const queryLower = query.toLowerCase();

  if (
    queryLower.includes("how to") ||
    queryLower.includes("technique") ||
    queryLower.includes("form")
  ) {
    response +=
      "For exercise technique questions, tap any exercise in your workout to see a demonstration and form tips.\n\n";
  } else if (
    queryLower.includes("hurt") ||
    queryLower.includes("pain") ||
    queryLower.includes("doctor")
  ) {
    response +=
      "**If you're experiencing pain or injury, please consult a healthcare provider.** TransFitness isn't a substitute for medical advice.\n\n";
  }

  response += "**I can help with:**\n";
  response += "• Binding & exercise safety\n";
  response += "• HRT effects on training (both T and E)\n";
  response += "• Post-op recovery timelines\n";
  response += "• Managing gym dysphoria\n";
  response += "• Nutrition basics (protein, calories)\n";
  response += "• Getting started and staying consistent\n";

  // Add contextual suggestions based on user profile
  if (context?.binds_chest) {
    response +=
      "\n**For you specifically:** Since you bind, try asking about breathing techniques, binder breaks, or safe exercises while binding.";
  } else if (context?.on_hrt && context?.hrt_type === "testosterone") {
    response +=
      "\n**For you specifically:** Try asking about muscle gains on T, tendon safety, or body recomposition.";
  } else if (context?.on_hrt && context?.hrt_type === "estrogen") {
    response +=
      "\n**For you specifically:** Try asking about hip exercises, muscle changes on E, or feminization workouts.";
  } else if (context?.has_surgery) {
    response +=
      "\n**For you specifically:** Try asking about your specific surgery recovery timeline or exercise restrictions.";
  }

  response +=
    '\n\n*Example questions: "How much protein do I need?" • "Can I do cardio while binding?" • "When can I exercise after top surgery?"*';

  return response;
}

/**
 * Get suggested questions based on user context
 */
export function getSuggestedQuestions(context?: UserContext): string[] {
  const suggestions: string[] = [];

  // Context-specific suggestions
  if (context?.binds_chest) {
    suggestions.push("Can I do cardio while binding?");
    suggestions.push("How long can I safely bind during workouts?");
  }

  if (context?.on_hrt && context?.hrt_type === "testosterone") {
    suggestions.push("When will I see muscle gains on T?");
    suggestions.push("Should I work out on injection day?");
  }

  if (context?.on_hrt && context?.hrt_type === "estrogen") {
    suggestions.push("How does estrogen affect my workouts?");
  }

  if (context?.has_surgery) {
    suggestions.push("When can I exercise after surgery?");
    suggestions.push("Will exercise affect my scars?");
  }

  // General suggestions
  suggestions.push("How do I manage gym dysphoria?");
  suggestions.push("Is muscle soreness normal?");
  suggestions.push("Where do I start with TransFitness?");

  // Return up to 4 unique suggestions
  return [...new Set(suggestions)].slice(0, 4);
}

/**
 * Get welcome message for new chat
 */
export function getWelcomeMessage(context?: UserContext): CopilotMessage {
  let greeting =
    "Hey! I'm your TransFitness Copilot. I can help answer questions about:\n\n";

  greeting += "• Working out safely with your body\n";
  greeting += "• Binding, HRT, and exercise\n";
  greeting += "• Post-op recovery guidance\n";
  greeting += "• Exercise modifications\n";
  greeting += "• Managing gym dysphoria\n";

  greeting += "\n**What can I help you with?**\n\n";

  // Add suggested questions
  const suggestions = getSuggestedQuestions(context);
  if (suggestions.length > 0) {
    greeting += "*Try asking:*\n";
    suggestions.forEach((q) => {
      greeting += `• ${q}\n`;
    });
  }

  return {
    id: "welcome",
    role: "assistant",
    content: greeting,
    timestamp: new Date().toISOString(),
  };
}
