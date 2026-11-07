import { GRAMMAR_TOPICS } from "../data/grammarTopics.js";

const SITE_ORIGIN = "https://www.spellycraft.com";
const BRAND = "SpellyCraft";

const PAGE_METADATA = {
  "/": {
    title: "IELTS Vocabulary, Spelling & Grammar Practice",
    description:
      "Build IELTS vocabulary, improve English spelling, and practise grammar with SpellyCraft's interactive learning tools.",
  },
  "/about": {
    title: "About SpellyCraft",
    description:
      "Learn about SpellyCraft, an English learning platform for IELTS vocabulary, spelling practice, and grammar mastery.",
  },
  "/contact": {
    title: "Contact SpellyCraft",
    description:
      "Contact the SpellyCraft team for account support, technical help, and feedback about English learning resources.",
  },
  "/contribute": {
    title: "Contribute to SpellyCraft",
    description:
      "Help improve SpellyCraft by contributing ideas, reporting issues, or supporting English learning resources.",
  },
  "/support-us": {
    title: "Support SpellyCraft",
    description:
      "Support SpellyCraft and help make free English vocabulary, spelling, and grammar practice available to learners.",
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
