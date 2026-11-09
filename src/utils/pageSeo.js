import { GRAMMAR_TOPICS } from "../data/grammarTopics.js";

const SITE_ORIGIN = "https://www.spellycraft.com";
const BRAND = "SpellyCraft";

const PAGE_METADATA = {
  "/": {
    title: "Secure Band 8.0+ in IELTS Writing & Listening",
    description:
      "Master academic English orthography, spelling recall, and vocabulary with SpellyCraft's phonemic speech practice and lexical mastery workspace.",
  },
  "/login": {
    title: "Sign In",
    description: "Sign in securely to continue your SpellyCraft IELTS vocabulary and spelling practice.",
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Create Your Account",
    description: "Create a SpellyCraft account to save your vocabulary, spelling, and IELTS practice progress.",
    robots: "noindex, nofollow",
  },
  "/about": {
    title: "About SpellyCraft",
    description:
      "Learn about SpellyCraft, an English learning platform for IELTS vocabulary, spelling practice, and grammar mastery.",
  },
  "/resources": {
    title: "Free IELTS Study Resources",
    description:
      "Browse free IELTS spelling, listening, reading, writing, and academic vocabulary resources in the SpellyCraft lexical mastery workspace.",
  },
  "/contact": {
    title: "Contact SpellyCraft",
    description:
      "Contact the SpellyCraft team for account support, technical help, and feedback about English learning resources.",
  },
  "/support-us": {
    title: "Support SpellyCraft",
    description:
      "Support SpellyCraft and help make free English vocabulary, spelling, and grammar practice available to learners.",
  },
  "/help": {
    title: "SpellyCraft Help",
    description:
      "Get help with English vocabulary, grammar practice, and using the SpellyCraft learning platform.",
    robots: "noindex, nofollow",
  },
  "/reset-password": {
    title: "Reset Your Password",
    description: "Securely reset your SpellyCraft account password.",
    robots: "noindex, nofollow",
  },
};

const WORKSPACE_METADATA = {
  "/workspace": ["Learning Dashboard", "Your personal SpellyCraft learning dashboard."],
  "/workspace/dashboard": ["Learning Dashboard", "Track your SpellyCraft vocabulary and practice progress."],
  "/workspace/flashcard": ["Vocabulary Flashcards", "Practise English vocabulary with SpellyCraft flashcards."],
  "/workspace/spelling": ["Spelling Practice", "Improve English spelling with interactive SpellyCraft dictation practice."],
  "/workspace/grammar": ["Grammar Practice", "Practise English grammar with interactive SpellyCraft quizzes."],
  "/workspace/upload": ["Study Upload", "Upload study materials to your SpellyCraft learning workspace."],
  "/workspace/upload-monitor": ["Upload Monitor", "Manage SpellyCraft vocabulary and grammar learning content."],
  "/workspace/admin": ["Administration", "Manage SpellyCraft platform administration."],
  "/workspace/profile": ["Your Profile", "Manage your SpellyCraft learner profile."],
  "/workspace/resources": ["Member Resources", "Browse free study resources for signed-in SpellyCraft members."],
  "/workspace/community": ["Community & Development", "Review private request statuses, aggregate community activity, and explore developer collaboration."],
  "/workspace/developer": ["Developer Collaboration", "Manage your SpellyCraft developer application, profile, and private project proposals."],
  "/workspace/developer/application": ["Developer Application", "Submit a private application to contribute to SpellyCraft development."],
};

function makeMetadata(title, description, pathname, robots = "index, follow") {
  return {
    title: `${title} | ${BRAND}`,
    description,
    robots,
    canonical: new URL(pathname, SITE_ORIGIN).toString(),
  };
}

export function getPageSeo(pathname) {
  const path = pathname || "/";
  const publicMetadata = PAGE_METADATA[path];
  if (publicMetadata) {
    return makeMetadata(
      publicMetadata.title,
      publicMetadata.description,
      path,
      publicMetadata.robots,
    );
  }

  if (path.startsWith("/workspace")) {
    const lessonPrefix = "/workspace/grammar/lesson/";
    if (path.startsWith(lessonPrefix)) {
      const topicId = path.slice(lessonPrefix.length).split("/")[0];
      const topic = GRAMMAR_TOPICS.find(({ id }) => id === topicId);
      return makeMetadata(
        topic ? `${topic.title} Lesson` : "Grammar Lesson",
        topic
          ? `Study ${topic.title.toLowerCase()} with SpellyCraft grammar lessons and practice.`
          : "Study English grammar with SpellyCraft lessons and practice.",
        path,
        "noindex, nofollow",
      );
    }

    const [title, description] = WORKSPACE_METADATA[path] || [
      "Learning Workspace",
      "Your private SpellyCraft English learning workspace.",
    ];
    return makeMetadata(title, description, path, "noindex, nofollow");
  }

  return makeMetadata(
    "Page Not Found",
    "The requested SpellyCraft page could not be found.",
    path,
    "noindex, nofollow",
  );
}
