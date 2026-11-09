const TOPIC_PATTERNS = {
  vocabulary: [
    /\b(vocab(?:ulary)?|word|mean(?:s|ing)?|define|definition|synonym|antonym|opposite|collocation|spell(?:ing)?|pronunciation|pronounce|lexical|dictation|listening)\b/i,
    /\b(meaming|defination|synonims|antonyms|pronounciation|collocations)\b/i, // common typos
  ],
  grammar: [
    /\b(grammar|tense|verb|noun|article|preposition|conjunction|clause|sentence|punctuation|subject|predicate|adjective|adverb|plural|passive voice|active voice|conditionals?|correct|rewrite|fix)\b/i,
    /\b(grammer|gramers|tenses|verbs|nouns|prepositions|conjunctions|punctuations)\b/i, // common typos
  ],
  platform: [
    /\b(spellycraft|platform|workspace|flashcards?|dashboard|progress|account|login|register|resources?|profile|settings|upload|community|practice|quiz|navigate|website|app)\b/i,
    /\b(spellcraft|spelcraft|dashbord|progres|comunity|pratice|resourses)\b/i, // common typos
  ],
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

function fuzzyMatch(text, patterns) {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (pattern.test(lower)) return true;
  }
  return false;
}

export function classifyHelpTopic(message) {
  const text = String(message || "").trim();
  if (!text) return null;
  if (/^\s*(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(text)) {
    return "platform";
  }
  // single word or short phrase → treat as a meaning lookup
  if (/^[\p{L}'-]+(?:\s+[\p{L}'-]+){0,2}$/u.test(text)) return "vocabulary";

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (fuzzyMatch(text, patterns)) return topic;
  }
  if (/^\s*(can you (?:give|show|explain|provide)|give|show|explain|provide|why|how|what about|more|another|an example|examples|please elaborate)\b/i.test(text)) {
    return "platform";
  }
  return "unsupported";
}

export function getHelpAssistantReply(topic) {
  return REPLIES[topic] || REPLIES.unsupported;
}
