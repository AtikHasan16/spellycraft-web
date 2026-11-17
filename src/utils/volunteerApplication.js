/**
 * Volunteer application utilities (src/utils/volunteerApplication.js)
 * Pure helpers shared by the public form, the live message preview, and the
 * admin Volunteer Requests tab. Keeping validation/template logic here makes
 * the behavior unit-testable without rendering React.
 */

export const VOLUNTEER_TRACKS = [
  {
    value: "software",
    label: "Software & Web Development",
    shortLabel: "Software Dev",
    description: "Frontend, backend, UI/UX, and architecture",
  },
  {
    value: "linguistics",
    label: "English Linguistics & Curriculum Development",
    shortLabel: "Linguistics",
    description: "Grammar, spelling rules, and content verification",
  },
];

export const VOLUNTEER_STATUSES = ["new", "reviewed", "contacted"];

export const VOLUNTEER_STATUS_LABELS = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
};

const GMAIL_PATTERN = /^[a-z0-9._%+-]+@gmail\.com$/i;
const WHATSAPP_PATTERN = /^\+[1-9][0-9]{7,14}$/;

export function getVolunteerTrack(value) {
  return VOLUNTEER_TRACKS.find((track) => track.value === value) || null;
}

export function normalizeGmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isGmailAddress(value) {
  return GMAIL_PATTERN.test(normalizeGmail(value));
}

/**
 * Converts a human-entered phone number into the E.164-ish form used for
 * wa.me links and stored in the database. Non-digits are dropped and a single
 * leading "+" is restored.
 */
export function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function isValidWhatsAppNumber(value) {
  return WHATSAPP_PATTERN.test(normalizeWhatsAppNumber(value));
}

export function buildWhatsAppLink(value) {
  const normalized = normalizeWhatsAppNumber(value);
  return WHATSAPP_PATTERN.test(normalized)
    ? `https://wa.me/${normalized.slice(1)}`
    : "";
}

const VOWEL_LETTER_START = /^[aeiou]/i;
// Words spelled with a leading vowel but pronounced with a consonant sound.
const CONSONANT_SOUND_START = /^(uni|use|usu|eu)/i;
// Words spelled with a leading consonant but pronounced with a vowel sound.
const VOWEL_SOUND_START = /^(hour|honest|honou?r|heir|mba|x-ray)/i;
const LEADING_ARTICLE = /^(a|an|the)\s/i;

/**
 * Adds the correct indefinite article to a free-text designation, because the
 * applicant types their own role into the form.
 */
export function withIndefiniteArticle(phrase) {
  const text = String(phrase || "").trim();
  if (!text) return "a";
  if (LEADING_ARTICLE.test(text)) return text;
  if (VOWEL_SOUND_START.test(text)) return `an ${text}`;
  if (CONSONANT_SOUND_START.test(text)) return `a ${text}`;
  return `${VOWEL_LETTER_START.test(text) ? "an" : "a"} ${text}`;
}

export function buildVolunteerTemplateBody(fields = {}) {
  const name = String(fields.fullName || "").trim() || "[Your full name]";
  const designation =
    String(fields.designation || "").trim() || "[Your designation]";
  const country = String(fields.country || "").trim() || "[Your country]";
  const track = getVolunteerTrack(fields.track);
  const experience =
    String(fields.experience || "").trim() ||
    "[Share your previous experience and relevant skills]";

  return [
    "Dear SpellyCraft Team,",
    "",
    `My name is ${name}, and I am ${withIndefiniteArticle(designation)} based in ${country}. I would like to volunteer with SpellyCraft in the ${track?.label || "[Area of interest]"} track.`,
    "",
    "What I can contribute:",
    experience,
    "",
    "SpellyCraft's mission of making high-quality English grammar and spelling practice accessible to learners worldwide resonates with me. I would be glad to contribute my time and skills, and I would appreciate the opportunity to discuss how I can help.",
    "",
    "Thank you for considering my application. I look forward to hearing from you.",
  ].join("\n");
}

/**
 * The signature block is intentionally generated from structured fields on
 * every render, so hand-edited message bodies can never desynchronize the
 * applicant's contact details.
 */
export function buildVolunteerSignature(fields = {}) {
  const name = String(fields.fullName || "").trim() || "[Full Name]";
  const designation =
    String(fields.designation || "").trim() || "[Designation]";
  const whatsapp =
    normalizeWhatsAppNumber(fields.whatsapp) || "[WhatsApp Number]";
  const email = normalizeGmail(fields.gmail) || "[Gmail Address]";
  const country = String(fields.country || "").trim() || "[Country]";

  return [
    "Best regards,",
    "",
    name,
    designation,
    `WhatsApp: ${whatsapp}`,
    `Email: ${email}`,
    `Country: ${country}`,
  ].join("\n");
}

export function composeVolunteerMessage(body, fields = {}) {
  const messageBody = String(body || "").trim();
  return `${messageBody}\n\n${buildVolunteerSignature(fields)}`.trim();
}

export function validateVolunteerApplication(fields = {}) {
  const errors = {};
  const fullName = String(fields.fullName || "").trim();
  const designation = String(fields.designation || "").trim();
  const gmail = normalizeGmail(fields.gmail);
  const whatsapp = normalizeWhatsAppNumber(fields.whatsapp);
  const country = String(fields.country || "").trim();
  const experience = String(fields.experience || "").trim();
  const track = String(fields.track || "");

  if (!fullName) {
    errors.fullName = "Enter your full name.";
  } else if (fullName.length > 120) {
    errors.fullName = "Full name must be 120 characters or fewer.";
  }

  if (!designation) {
    errors.designation = "Enter your current designation or role.";
  } else if (designation.length > 160) {
    errors.designation = "Designation must be 160 characters or fewer.";
  }

  if (!gmail) {
    errors.gmail = "Enter your Gmail address.";
  } else if (!isGmailAddress(gmail)) {
    errors.gmail =
      "Use a Gmail address ending in @gmail.com (other domains are not accepted).";
  }

  if (!whatsapp) {
    errors.whatsapp = "Enter your WhatsApp number with country code.";
  } else if (!WHATSAPP_PATTERN.test(whatsapp)) {
    errors.whatsapp =
      "Enter a valid WhatsApp number with country code, e.g. +8801XXXXXXXXX.";
  }

  if (!country) {
    errors.country = "Enter your country of origin.";
  } else if (country.length < 2 || country.length > 80) {
    errors.country = "Country must be between 2 and 80 characters.";
  }

  if (!getVolunteerTrack(track)) {
    errors.track = "Choose an area of interest.";
  }

  if (!experience) {
    errors.experience =
      "Describe your previous experience and relevant skills.";
  } else if (experience.length < 10) {
    errors.experience =
      "Please write at least 10 characters about your experience.";
  } else if (experience.length > 4000) {
    errors.experience = "Experience must be 4,000 characters or fewer.";
  }

  const messageBody = String(fields.messageBody ?? "").trim();
  const composedMessage = String(fields.message ?? "").trim();

  // Form callers pass the editable body. Service callers pass the already
  // composed message, which includes the signature block.
  if (!messageBody) {
    if (composedMessage.length < 20) {
      errors.messageBody = "Write a short application message.";
    }
  } else if (messageBody.length < 20) {
    errors.messageBody = "Please write at least 20 characters in your message.";
  } else if (composeVolunteerMessage(messageBody, fields).length > 8000) {
    errors.messageBody =
      "The customized message is too long. Shorten it to fit 8,000 characters.";
  }

  return errors;
}
