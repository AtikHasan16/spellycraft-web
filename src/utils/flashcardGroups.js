/**
 * Flashcard corpus grouping (src/utils/flashcardGroups.js)
 * Converts vocabulary statistics + local/cloud mastery into the card model
 * consumed by FlashcardSetsView. Pure functions keep the page focused on
 * state orchestration and make the grouping rules unit-testable.
 */
import {
  getFlashcardMasterySummary,
  getFlashcardMistakes,
} from "./flashcardMastery.js";

export const FLASHCARD_GROUPS_PER_PAGE = 6;

function countTopicMistakes(topic, masteryRecords, cloudProgressByTopic) {
  const localRecords = masteryRecords[topic] || {};
  const remoteProgress = cloudProgressByTopic[topic];
  const localMistakes = getFlashcardMistakes(masteryRecords, topic);
  const localWordKeys = new Set(Object.keys(localRecords));
  const remoteMistakes = [
    ...(remoteProgress?.unknownWords || []),
    ...(remoteProgress?.forgotWords || []),
  ].filter((word) => !localWordKeys.has(word.toLocaleLowerCase()));

  return localMistakes.length + new Set(remoteMistakes).size;
}

export function buildFlashcardGroups({
  vocabStats,
  masteryRecords = {},
  cloudProgressByTopic = {},
  isAdmin = false,
  userName = "",
}) {
  const groups = [];

  // 1. Official/active curriculum topics.
  for (const [idx, topic] of (vocabStats?.activeTopics || []).entries()) {
    const totalWords = topic.count ?? 0;
    const summary = getFlashcardMasterySummary(masteryRecords, topic.title);
    const legacyKnown =
      cloudProgressByTopic[topic.title]?.knownWords?.length || 0;
    const known = Math.max(summary.knew, legacyKnown);
    const mistakesCount = countTopicMistakes(
      topic.title,
      masteryRecords,
      cloudProgressByTopic,
    );

    groups.push({
      id: `active-${idx}-${topic.title}`,
      part: "All Active",
      title: topic.title,
      description:
        topic.title === "Academic Word List: Sublist A"
          ? "High-frequency academic stems, Latin morphemes & IELTS Band 8+ lexicon."
          : `Active official curriculum corpus with ${totalWords} lexemes.`,
      wordsCount: totalWords,
      knownCount: known,
      mistakesCount,
      percent:
        totalWords > 0
          ? Math.min(100, Math.round((known / totalWords) * 100))
          : 0,
      hasMistakes: mistakesCount > 0,
    });
  }

  // 2. Listening-specific topics.
  for (const [idx, topic] of (vocabStats?.listeningTopics || []).entries()) {
    const knew = getFlashcardMasterySummary(masteryRecords, topic.title).knew;
    const mistakesCount = countTopicMistakes(
      topic.title,
      masteryRecords,
      cloudProgressByTopic,
    );

    groups.push({
      id: `listening-${idx}-${topic.title}`,
      part: "Listening Vocabs",
      title: topic.title,
      description: `IELTS listening module vocabulary (${topic.count} lexemes).`,
      wordsCount: topic.count,
      knownCount: knew,
      mistakesCount,
      percent:
        topic.count > 0
          ? Math.min(100, Math.round((knew / topic.count) * 100))
          : 0,
      hasMistakes: mistakesCount > 0,
    });
  }

  // 3. User-uploaded corpora.
  for (const [idx, topic] of (vocabStats?.uploadedTopics || []).entries()) {
    const knew = getFlashcardMasterySummary(masteryRecords, topic.title).knew;
    const mistakesCount = countTopicMistakes(
      topic.title,
      masteryRecords,
      cloudProgressByTopic,
    );

    groups.push({
      id: `uploaded-${idx}-${topic.title}`,
      part: "Uploaded",
      title: topic.title,
      description: `Custom uploaded corpus category with ${topic.count} terms.`,
      wordsCount: topic.count,
      uploaderName:
        topic.uploaderName || (isAdmin ? "Admin" : userName || "You"),
      knownCount: knew,
      mistakesCount,
      percent:
        topic.count > 0
          ? Math.min(100, Math.round((knew / topic.count) * 100))
          : 0,
      hasMistakes: mistakesCount > 0,
    });
  }

  // 4. One "Mistakes" card per topic that still has unresolved words.
  const mistakeTopics = new Set(
    getFlashcardMistakes(masteryRecords).map((mistake) => mistake.topic),
  );
  for (const [topic, progress] of Object.entries(cloudProgressByTopic)) {
    if ((progress?.unknownWords?.length || 0) + (progress?.forgotWords?.length || 0) > 0) {
      mistakeTopics.add(topic);
    }
  }

  for (const topic of mistakeTopics) {
    const mistakesCount = countTopicMistakes(
      topic,
      masteryRecords,
      cloudProgressByTopic,
    );
    if (mistakesCount === 0) continue;

    groups.push({
      id: `mistakes-${topic}`,
      part: "Mistakes",
      title: topic,
      description: `${mistakesCount} words need another review.`,
      wordsCount: mistakesCount,
      knownCount: getFlashcardMasterySummary(masteryRecords, topic).knew,
      mistakesCount,
      percent: 0,
      hasMistakes: true,
    });
  }

  return groups;
}

/** Clamp the page index and slice the visible cards. */
export function paginateFlashcardGroups(
  groups,
  page,
  perPage = FLASHCARD_GROUPS_PER_PAGE,
) {
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  return {
    totalPages,
    page: safePage,
    items: groups.slice(safePage * perPage, (safePage + 1) * perPage),
  };
}
