// Red Flag Deflection System
// PRD 3.0 requirement: Detect concerning symptom keywords and deflect to medical care
// Critical for safety and legal protection

/**
 * Categories of red flag keywords that should trigger deflection
 */
export type RedFlagCategory =
  | "acute_symptoms" // Immediate physical symptoms
  | "medical_emergency" // Emergency situations
  | "medication_dosing" // HRT dosing questions
  | "diagnosis_seeking" // Asking for diagnosis
  | "surgical_clearance"; // Post-op medical clearance

/**
 * Result of checking text for red flags
 */
export interface RedFlagResult {
  isRedFlag: boolean;
  category?: RedFlagCategory;
  matchedKeywords: string[];
  deflectionMessage: string;
}

/**
 * Red flag patterns organized by category
 * These are conservative patterns to catch concerning queries
 */
const RED_FLAG_PATTERNS: Record<RedFlagCategory, RegExp[]> = {
  acute_symptoms: [
    /sharp\s*(chest\s*)?pain/i,
    /can'?t\s*breathe/i,
    /difficulty\s*breathing/i,
    /chest\s*tightness/i,
    /heart\s+(?:is\s+)?(?:racing|pounding|palpitations)/i,
    /numbness\s*(in\s*(my\s*)?(arm|chest|hand))?/i,
    /severe\s*(pain|swelling|bruising)/i,
    /blood\s*(in|from)\s*(urine|stool)/i,
    /passing\s*out/i,
    /fainted/i,
    /dizzy\s*(and|while)/i,
    /fever\s*(after|and)/i,
    /infection/i,
    /\bpus\b|discharge\s*(from|at)\s*(incision|wound)/i,
    /incision\s*(opening|splitting|bleeding)/i,
    /extreme\s*(fatigue|weakness)/i,
  ],
  medical_emergency: [
    /call\s+(?:an?\s+)?(?:911|ambulance|emergency)/i,
    /go\s*to\s*(the\s*)?(er|emergency|hospital)/i,
    /medical\s*emergency/i,
    /overdose/i,
    /can'?t\s*(move|feel)/i,
    /losing\s*consciousness/i,
    /suicidal/i,
    /self.?harm/i,
    /want\s*to\s*(die|hurt\s*myself)/i,
  ],
  medication_dosing: [
    /how\s*much\s*(t|testosterone|estrogen|hrt)/i,
    /increase\s*(my\s*)?(dose|dosage)/i,
    /change\s*(my\s*)?(dose|dosage)/i,
    /skip\s*(my\s*)?(dose|shot|injection)/i,
    /double\s*(my\s*)?(dose|shot)/i,
    /what\s*dose\s*should\s*i/i,
    /mg\s*(of\s*)?(testosterone|estrogen)/i,
    /injection\s*site\s*(pain|swelling|lump)/i,
  ],
  diagnosis_seeking: [
    /\bdo\s+i\s+have\b/i,
    /is\s*this\s*(normal|okay)\s*after\s*surgery/i,
    /is\s*(this|it)\s*infected/i,
    /should\s*i\s*(be\s*)?(worried|concerned)/i,
    /what'?s\s*wrong\s*with/i,
    /diagnose/i,
    /is\s*this\s*serious/i,
    /am\s*i\s*(okay|dying|having)/i,
  ],
  surgical_clearance: [
    /can\s+i\s+(?:exercise|lift|workout)(?:\s+\w+)?\s+(?:yet|now)/i,
    /when\s*can\s*i\s*(start|begin|resume)/i,
    /cleared\s*(to|for)\s*(exercise|lift)/i,
    /override\s*(my\s*)?surgeon/i,
    /ignore\s*(my\s*)?(surgeon|doctor)/i,
    /surgeon\s*said\s*(no|wait|don'?t)/i,
  ],
};

/**
 * Deflection messages for each category
 */
const DEFLECTION_MESSAGES: Record<RedFlagCategory, string> = {
  acute_symptoms:
    "This sounds like it could be a medical concern. Please stop your workout and contact your healthcare provider or seek medical attention. TransFitness cannot assess symptoms or provide medical advice.",

  medical_emergency:
    "If you are experiencing a medical emergency, please call 911 or your local emergency services immediately. If you are having thoughts of self-harm, please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) or the Trans Lifeline (877-565-8860).",

  medication_dosing:
    "HRT dosing should only be managed by your prescribing provider. Please contact your doctor or endocrinologist about any medication questions. TransFitness cannot provide advice on hormone dosing.",

  diagnosis_seeking:
    'TransFitness cannot diagnose conditions or determine if something is "normal." If you have concerns about your health or recovery, please contact your healthcare provider.',

  surgical_clearance:
    "Your surgeon knows your specific situation best. Please follow their post-op instructions. TransFitness provides general movement guidance, but your surgeon's clearance is required before returning to exercise.",
};

/**
 * General fallback deflection message
 */
const GENERAL_DEFLECTION =
  "This question is outside what TransFitness can help with. For medical questions, please consult your healthcare provider. We're here to help with fitness guidance within safe boundaries.";

/**
 * Check if text contains red flag keywords that should trigger deflection
 *
 * @param text - Text to check (user input, Copilot query, etc.)
 * @returns RedFlagResult with detection status and appropriate message
 */
export function checkForRedFlags(text: string): RedFlagResult {
  const normalizedText = text.toLowerCase().trim();
  const matchedKeywords: string[] = [];
  let detectedCategory: RedFlagCategory | undefined;

  // Check each category in priority order (emergencies first)
  const categoryPriority: RedFlagCategory[] = [
    "medical_emergency",
    "acute_symptoms",
    "medication_dosing",
    "surgical_clearance",
    "diagnosis_seeking",
  ];

  for (const category of categoryPriority) {
    const patterns = RED_FLAG_PATTERNS[category];

    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        matchedKeywords.push(match[0]);
        if (!detectedCategory) {
          detectedCategory = category;
        }
      }
    }

    // Stop after finding the highest priority category
    if (detectedCategory === category && matchedKeywords.length > 0) {
      break;
    }
  }

  if (detectedCategory) {
    return {
      isRedFlag: true,
      category: detectedCategory,
      matchedKeywords,
      deflectionMessage: DEFLECTION_MESSAGES[detectedCategory],
    };
  }

  return {
    isRedFlag: false,
    matchedKeywords: [],
    deflectionMessage: GENERAL_DEFLECTION,
  };
}

/**
 * Check if a query is safe to process (no red flags detected)
 *
 * @param text - Text to check
 * @returns true if safe to process, false if should deflect
 */
export function isSafeQuery(text: string): boolean {
  return !checkForRedFlags(text).isRedFlag;
}

/**
 * Get the appropriate deflection message for a red flag category
 *
 * @param category - The red flag category
 * @returns Deflection message string
 */
export function getDeflectionMessage(category?: RedFlagCategory): string {
  if (category) {
    return DEFLECTION_MESSAGES[category];
  }
  return GENERAL_DEFLECTION;
}

/**
 * Crisis resources for mental health emergencies
 */
export const CRISIS_RESOURCES = {
  suicideLifeline: {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "Call or text 24/7",
  },
  transLifeline: {
    name: "Trans Lifeline",
    number: "877-565-8860",
    description: "Peer support for trans people",
  },
  crisisTextLine: {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free 24/7 text support",
  },
  trevorProject: {
    name: "The Trevor Project",
    number: "1-866-488-7386",
    description: "LGBTQ+ youth crisis support",
  },
};
