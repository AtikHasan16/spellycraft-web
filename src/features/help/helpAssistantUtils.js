const TOPIC_PATTERNS = {
  vocabulary:
    /\b(vocab(?:ulary)?|word|meaning|define|definition|synonym|antonym|collocation|spelling|pronunciation|pronounce|lexical|dictation|listening)\b/i,
  grammar:
    /\b(grammar|tense|verb|noun|article|preposition|conjunction|clause|sentence|punctuation|subject|predicate|adjective|adverb|plural|passive voice|active voice|conditionals?)\b/i,
  platform:
    /\b(spellycraft|platform|workspace|flashcards?|dashboard|progress|account|login|register|resources?|profile|settings|upload|community|practice|quiz|navigate|website|app)\b/i,
};

const REPLIES = {
  vocabulary: {
    text: "Vocabulary, spelling, and listening practice are in scope. The assistant connection is not active in this design preview yet.",
    link: { label: "Open Flashcards", to: "/workspace/flashcard" },
  },
  grammar: {
    text: "Grammar explanations and practice are in scope. The assistant connection is not active in this design preview yet.",
    link: { label: "Open Grammar", to: "/workspace/grammar" },
  },
  platform: {
    text: "I can help you find your way around SpellyCraft. The assistant connection is not active in this design preview yet.",
    link: { label: "Open Workspace", to: "/workspace/dashboard" },
  },
  unsupported: {
    text: "I can only help with vocabulary, grammar, and using the SpellyCraft platform. For anything else, please contact the team.",
    link: { label: "Contact Support", to: "/contact" },
  },
};

export function classifyHelpTopic(message) {
  const text = String(message || "").trim();
  if (!text) return null;
  if (/^\s*(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(text)) {
    return "platform";
  }

  for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
    if (pattern.test(text)) return topic;
  }
  if (/^\s*(can you (?:give|show|explain|provide)|give|show|explain|provide|why|how|what about|more|another|an example|examples|please elaborate)\b/i.test(text)) {
    return "platform";
  }
  return "unsupported";
}

export function getHelpAssistantReply(topic) {
  return REPLIES[topic] || REPLIES.unsupported;
}
