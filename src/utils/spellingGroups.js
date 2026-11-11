/**
 * Spelling corpus grouping (src/utils/spellingGroups.js)
 * Pure derivations from vocabulary stats and local mastery. Extracted from
 * SpellingPage so the page only orchestrates state and data fetching.
 */
import {
  getSpellingMasterySummary,
  getSpellingMistakes,
} from "./spellingMastery.js";

export const SPELLING_GROUPS_PER_PAGE = 6;

export function buildSpellingGroups({
  vocabStats,
  visibleMastery = {},
  userProgress = null,
  selectedGroupTitle = null,
  isAdmin = false,
  userName = "",
}) {
  const groups = [];

  // Official/active curriculum topics (legacy progress is used until the
  // learner has local mastery records for that topic).
  for (const [idx, topic] of (vocabStats?.activeTopics || []).entries()) {
    const totalWords = topic.count ?? 0;
    const savedSummary = getSpellingMasterySummary(visibleMastery, topic.title);
    const legacySummary = userProgress?.progressByTopic?.[topic.title];
    const hasLocalResults = savedSummary.total > 0;
    const mastered = hasLocalResults
      ? savedSummary.know
      : legacySummary?.mastered ||
        (selectedGroupTitle === topic.title ? userProgress?.masteredWords?.length : 0) ||
        0;
    const incorrect = hasLocalResults
      ? savedSummary.doNotKnow + savedSummary.forgot
      : legacySummary?.incorrect ||
        (selectedGroupTitle === topic.title
          ? userProgress?.incorrectWords?.length
          : 0) ||
        0;

    groups.push({
      id: `spelling-active-${idx}`,
      part: "All Active",
      title: topic.title,
      description:
        topic.title === "Academic Word List: Sublist A"
          ? "High-frequency academic stems, Latin morphemes & IELTS Band 8+ spelling dictation."
          : `Active official curriculum corpus with ${totalWords} spelling terms.`,
      wordsCount: totalWords,
      masteredCount: mastered,
      incorrectCount: incorrect,
      percent: totalWords > 0 ? Math.min(100, Math.round((mastered / totalWords) * 100)) : 0,
      hasMistakes: incorrect > 0,
    });
  }

  for (const [idx, topic] of (vocabStats?.listeningTopics || []).entries()) {
    const summary = getSpellingMasterySummary(visibleMastery, topic.title);
    const incorrect = summary.doNotKnow + summary.forgot;
    groups.push({
      id: `spelling-listening-${idx}`,
      part: "Listening Vocabs",
      title: topic.title,
      description: `IELTS listening module vocabulary (${topic.count} lexemes).`,
      wordsCount: topic.count,
      masteredCount: summary.know,
      incorrectCount: incorrect,
      percent:
        topic.count > 0 ? Math.min(100, Math.round((summary.know / topic.count) * 100)) : 0,
      hasMistakes: incorrect > 0,
    });
  }

  for (const [idx, topic] of (vocabStats?.uploadedTopics || []).entries()) {
    const summary = getSpellingMasterySummary(visibleMastery, topic.title);
    const incorrect = summary.doNotKnow + summary.forgot;
    groups.push({
      id: `spelling-uploaded-${idx}`,
      part: "Uploaded",
      title: topic.title,
      description: `Custom uploaded corpus category with ${topic.count} terms.`,
      wordsCount: topic.count,
      uploaderName: topic.uploaderName || (isAdmin ? "Admin" : userName || "You"),
      masteredCount: summary.know,
      incorrectCount: incorrect,
      percent:
        topic.count > 0 ? Math.min(100, Math.round((summary.know / topic.count) * 100)) : 0,
      hasMistakes: incorrect > 0,
    });
  }

  return groups;
}

/** Attach the owning corpus group to each unresolved spelling mistake. */
export function buildSpellingMistakes(visibleMastery, groups) {
  return getSpellingMistakes(visibleMastery).map((entry) => ({
    ...entry,
    group: groups.find((group) => group.title === entry.topic) || {
      title: entry.topic,
      part: "All Active",
      wordsCount: 0,
    },
  }));
}

export function paginateSpellingGroups(
  groups,
  page,
  perPage = SPELLING_GROUPS_PER_PAGE,
) {
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  return {
    totalPages,
    page: safePage,
    items: groups.slice(safePage * perPage, (safePage + 1) * perPage),
  };
}
