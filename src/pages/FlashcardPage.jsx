import { useState, useEffect, useCallback, useRef } from "react";
import RandomQuizSetupModal from "../components/RandomQuizSetupModal";
import FlashcardHeader from "../components/flashcards/FlashcardHeader";
import FlashcardSetsView from "../components/flashcards/FlashcardSetsView";
import FlashcardDrillView from "../components/flashcards/FlashcardDrillView";
import FlashcardQuizView from "../components/flashcards/FlashcardQuizView";
import FlashcardSessionSummary from "../components/flashcards/FlashcardSessionSummary";
import { useCountdownTimer } from "../hooks/useCountdownTimer";
import { useModalEffects } from "../hooks/useModalEffects";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { speakWithMicrosoftTTS, stopAudioPlayback } from "../utils/speechTts";
import { showErrorAlert } from "../utils/sweetalert";
import { secureShuffle } from "../utils/cryptoRandom";
import { supabase } from "../services/supabaseClient";
import {
  generateVocabularyDefinition,
  generateVocabularyMeaning,
} from "../services/aiService";
import {
  getMeaningField,
  getVocabularyMeaning,
  MEANING_LANGUAGES,
} from "../utils/meaningLanguages";
import {
  getFlashcardMistakes,
  loadFlashcardMastery,
  recordFlashcardAttempt,
  saveFlashcardMastery,
} from "../utils/flashcardMastery";
import {
  buildFlashcardGroups,
  paginateFlashcardGroups,
} from "../utils/flashcardGroups";

const PARTS = ["All Active", "Listening Vocabs", "Uploaded", "Mistakes"];

/**
 * Flashcard page (src/pages/FlashcardPage.jsx)
 * Orchestration only: data fetching, drill/quiz state, persistence, and
 * delegation to presentational components under src/components/flashcards/.
 */
export default function FlashcardPage() {
  const { user, isAdmin } = useAuth();

  // Navigation & view state: 'sets' | 'drill' | 'finished' | 'quiz'
  const [activePart, setActivePart] = useState("All Active");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("sets");
  const [groupsPage, setGroupsPage] = useState(0);

  // Corpus & drill state
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState("next");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Preferred meaning language
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [generationInProgress, setGenerationInProgress] = useState(null);

  // Per-session tally
  const [sessionKnew, setSessionKnew] = useState([]);
  const [sessionUnknown, setSessionUnknown] = useState([]);
  const [sessionForgot, setSessionForgot] = useState([]);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  // Persisted progress
  const [vocabStats, setVocabStats] = useState(null);
  const [cloudProgressByTopic, setCloudProgressByTopic] = useState({});
  const [masteryRecords, setMasteryRecords] = useState({});
  const [isSavingQuizAnswer, setIsSavingQuizAnswer] = useState(false);
  const sessionStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadWordsRequestId = useRef(0);
  const handledDrillRequestIdRef = useRef(null);
  const rateTimeoutRef = useRef(null);
  const [drillRequest, setDrillRequest] = useState(null);

  // Mistakes-only drill
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);

  // Random quiz state
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState(null);
  const [quizQuantity, setQuizQuantity] = useState(10);
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizUserAnswers, setQuizUserAnswers] = useState([]);
  const { startTimer: startQuizTimer, stopTimer: stopQuizTimer } = useCountdownTimer(
    setQuizTimeRemaining,
    () => setQuizFinished(true),
  );
  useModalEffects(quizModalOpen, setQuizModalOpen);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(rateTimeoutRef.current);
    };
  }, []);

  // Load the learner's saved meaning language once per user.
  useEffect(() => {
    let active = true;
    async function loadPreferredLanguage() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_meaning_language")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        if (error) {
          console.warn("Could not load preferred meaning language:", error.message);
          showErrorAlert(
            "Language Preference Unavailable",
            "The saved meaning language could not be loaded. Please check your Profile preferences.",
          );
          return;
        }
        const preferredLanguage = data?.preferred_meaning_language || "en";
        if (MEANING_LANGUAGES.some((item) => item.code === preferredLanguage)) {
          setSelectedLanguage(preferredLanguage);
        }
      } catch (error) {
        if (!active) return;
        console.warn("Could not load preferred meaning language:", error);
        showErrorAlert(
          "Language Preference Unavailable",
          "The saved meaning language could not be loaded. Please check your Profile preferences.",
        );
      }
    }

    loadPreferredLanguage();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    try {
      setMasteryRecords(loadFlashcardMastery(user?.id));
    } catch (error) {
      console.error("Could not load saved flashcard mastery:", error);
      showErrorAlert(
        "Mastery Could Not Be Loaded",
        "Saved flashcard progress is unavailable in this browser.",
      );
      setMasteryRecords({});
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/vocabulary/stats", {
        params: {
          userId: user?.id,
          userRole: user?.role || "general",
          userName: user?.name,
        },
      });
      if (isMountedRef.current && res.data?.success) {
        setVocabStats(res.data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn("Could not load stats:", err);
      }
    }
  }, [user]);

  const fetchProgress = useCallback(async () => {
    const targetId = user?.id;
    if (!targetId) return;
    const topic = selectedGroup?.title || "Academic Word List: Sublist A";
    try {
      const res = await apiClient.get("/flashcard/progress", {
        params: { userId: targetId, topic },
      });
      if (isMountedRef.current && res.data?.success && res.data.data) {
        setCloudProgressByTopic((previous) => ({
          ...previous,
          [topic]: res.data.data,
        }));
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn("Could not load flashcard progress:", err);
      }
    }
  }, [user, selectedGroup]);

  useEffect(() => {
    fetchStats();
    fetchProgress();
  }, [fetchStats, fetchProgress]);

  const fetchVocabularyCorpus = useCallback(async (params = {}) => {
    const pageSize = 500;
    const corpus = [];
    let page = 1;
    let totalCount = Infinity;

    while (corpus.length < totalCount) {
      const res = await apiClient.get("/vocabulary", {
        params: { ...params, page, pageSize },
      });
      const pageData = res.data?.data;
      if (!Array.isArray(pageData)) {
        throw new Error("Vocabulary response did not contain a word list.");
      }

      corpus.push(...pageData);
      totalCount = Number.isFinite(res.data?.totalCount)
        ? res.data.totalCount
        : corpus.length;
      if (pageData.length < pageSize || pageData.length === 0) break;
      page += 1;
    }

    return corpus;
  }, []);

  // Grouping rules live in a pure utility so the page stays readable.
  const dynamicGroups = buildFlashcardGroups({
    vocabStats,
    masteryRecords,
    cloudProgressByTopic,
    isAdmin,
    userName: user?.name,
  });

  const getTopicMistakeCount = (topic) => {
    const localRecords = masteryRecords[topic] || {};
    const remoteProgress = cloudProgressByTopic[topic];
    const localMistakes = getFlashcardMistakes(masteryRecords, topic);
    const localWordKeys = new Set(Object.keys(localRecords));
    const remoteMistakes = [
      ...(remoteProgress?.unknownWords || []),
      ...(remoteProgress?.forgotWords || []),
    ].filter((word) => !localWordKeys.has(word.toLocaleLowerCase()));
    return localMistakes.length + new Set(remoteMistakes).size;
  };

  const filteredGroups = dynamicGroups.filter((group) => group.part === activePart);
  const {
    totalPages: totalGroupsPages,
    page: currentGroupsPage,
    items: paginatedGroups,
  } = paginateFlashcardGroups(filteredGroups, groupsPage);

  const handlePartChange = (part) => {
    setActivePart(part);
    setGroupsPage(0);
  };

  const loadWordsForDrill = useCallback(
    async (group, onlyMistakes = false) => {
      const requestId = ++loadWordsRequestId.current;
      setLoading(true);
      setIsFlipped(false);
      setHasAnsweredCurrent(false);
      try {
        const loaded = await fetchVocabularyCorpus({
          topic: group.title,
          userId: user?.id,
          userRole: user?.role || "general",
          userName: user?.name,
        });
        let remoteProgress = null;
        if (onlyMistakes && user?.id) {
          const progressRes = await apiClient.get("/flashcard/progress", {
            params: { userId: user.id, topic: group.title },
          });
          remoteProgress = progressRes.data?.data;
        }

        if (loadWordsRequestId.current !== requestId || !isMountedRef.current) return;

        if (onlyMistakes) {
          const remoteMistakes = new Map([
            ...(remoteProgress?.unknownWords || []).map((word) => [word, "unknown"]),
            ...(remoteProgress?.forgotWords || []).map((word) => [word, "forgot"]),
          ]);
          let updatedMastery = masteryRecords;
          const filtered = loaded.filter((word) => {
            const localRecord =
              updatedMastery[group.title]?.[word.word.toLocaleLowerCase()];
            if (localRecord) {
              return localRecord.status === "unknown" || localRecord.status === "forgot";
            }
            const remoteStatus = remoteMistakes.get(word.word);
            if (remoteStatus) {
              updatedMastery = recordFlashcardAttempt(
                updatedMastery,
                group.title,
                word,
                remoteStatus,
              );
              return true;
            }
            return false;
          });
          if (updatedMastery !== masteryRecords) {
            saveFlashcardMastery(user?.id, updatedMastery);
            setMasteryRecords(updatedMastery);
          }
          setMistakesList(filtered);
          setWords(loaded);
        } else {
          setWords(loaded);
        }
        setCurrentIndex(0);
      } catch (err) {
        if (loadWordsRequestId.current === requestId && isMountedRef.current) {
          console.error("Failed to load flashcard words:", err);
          showErrorAlert(
            "Flashcards Could Not Be Loaded",
            err.message || "Please try again.",
          );
        }
      } finally {
        if (loadWordsRequestId.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchVocabularyCorpus, masteryRecords, user],
  );

  const loadWordsForDrillRef = useRef(loadWordsForDrill);
  useEffect(() => {
    loadWordsForDrillRef.current = loadWordsForDrill;
  }, [loadWordsForDrill]);

  const handleStartDrill = useCallback((group, isMistakes = false) => {
    setSelectedGroup(group);
    setMistakesOnly(isMistakes);
    setViewMode("drill");
    setSessionKnew([]);
    setSessionUnknown([]);
    setSessionForgot([]);
    setDrillRequest((previous) => ({
      id: (previous?.id || 0) + 1,
      group,
      isMistakes,
    }));
  }, []);

  useEffect(() => {
    if (!drillRequest || handledDrillRequestIdRef.current === drillRequest.id) return;

    handledDrillRequestIdRef.current = drillRequest.id;
    sessionStartTimeRef.current = Date.now();
    loadWordsForDrillRef.current(drillRequest.group, drillRequest.isMistakes);
  }, [drillRequest]);

  const handleReturnToSets = () => {
    clearTimeout(rateTimeoutRef.current);

    if (sessionStartTimeRef.current && user?.id) {
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
      );
      apiClient
        .post("/user/study-session", { durationSeconds })
        .catch((err) => console.warn("Could not save study session:", err));
    }

    setViewMode("sets");
    setSelectedGroup(null);
    setIsFlipped(false);
    setHasAnsweredCurrent(false);
    sessionStartTimeRef.current = null;
    fetchProgress();
  };

  const activeWords = mistakesOnly ? mistakesList : words;
  const currentWord = activeWords[currentIndex] || null;
  const languageLabel =
    MEANING_LANGUAGES.find((item) => item.code === selectedLanguage)?.label ||
    "English";

  const handleGenerateContent = async (generationType) => {
    if (!currentWord?.id || generationInProgress) return;
    setGenerationInProgress({ id: currentWord.id, type: generationType });
    try {
      const generated =
        generationType === "meaning"
          ? await generateVocabularyMeaning(currentWord.id, selectedLanguage)
          : await generateVocabularyDefinition(currentWord.id);
      const updates =
        generationType === "meaning"
          ? { [getMeaningField(selectedLanguage)]: generated.meaning }
          : { definition: generated.definition };
      const applyUpdates = (word) =>
        word.id === currentWord.id ? { ...word, ...updates } : word;
      setWords((current) => current.map(applyUpdates));
      setMistakesList((current) => current.map(applyUpdates));
      setQuizQuestions((current) =>
        current.map((question) => ({
          ...question,
          vocabulary:
            question.vocabulary?.id === currentWord.id
              ? { ...question.vocabulary, ...updates }
              : question.vocabulary,
        })),
      );
    } catch (error) {
      console.error(`Could not generate vocabulary ${generationType}:`, error);
      showErrorAlert(
        generationType === "meaning"
          ? "Meaning Could Not Be Generated"
          : "Definition Could Not Be Generated",
        error.message || "Please try again later.",
      );
    } finally {
      setGenerationInProgress(null);
    }
  };

  const persistFlashcardAttempt = useCallback(
    async (word, status, lastIndex, topicOverride) => {
      const topic =
        topicOverride || selectedGroup?.title || "Academic Word List: Sublist A";
      let updatedMastery;
      try {
        updatedMastery = recordFlashcardAttempt(masteryRecords, topic, word, status);
        saveFlashcardMastery(user?.id, updatedMastery);
        setMasteryRecords(updatedMastery);
      } catch (error) {
        console.error("Could not save local flashcard mastery:", error);
        showErrorAlert(
          "Progress Not Saved",
          "Your answer could not be saved in this browser. Check storage availability and try again.",
        );
        return false;
      }

      if (user?.id) {
        try {
          await apiClient.post("/flashcard/progress", {
            userId: user.id,
            topic,
            word: word.word,
            status,
            lastIndex,
          });
        } catch (error) {
          console.error("Could not sync flashcard progress:", error);
          showErrorAlert(
            "Cloud Sync Failed",
            "Your answer is saved on this device, but could not be synced to your account.",
          );
        }

        // Knowing a card also clears any older spelling mistake for that word.
        if (status === "knew") {
          try {
            await apiClient.post("/spelling/progress", {
              userId: user.id,
              topic,
              word: word.word,
              isCorrect: true,
              lastIndex,
            });
          } catch (error) {
            console.error(
              "Could not clear the spelling mistake after flashcard practice:",
              error,
            );
            showErrorAlert(
              "Mistake Sync Incomplete",
              "Your flashcard result is saved, but an older spelling mistake could not be cleared from your account.",
            );
          }
        }
      }
      return true;
    },
    [masteryRecords, selectedGroup, user],
  );

  const speakCurrentWord = useCallback(
    (overrideWord) => {
      const text = overrideWord || currentWord?.word;
      if (!text) return;
      speakWithMicrosoftTTS(text, {
        voice: "en-US-ChristopherNeural",
        vocabId: currentWord?.id,
        audioUrl: currentWord?.audioUrl || currentWord?.audio_url,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [currentWord],
  );

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  const handleRateCard = useCallback(
    async (status) => {
      if (!currentWord || hasAnsweredCurrent) return;
      setHasAnsweredCurrent(true);

      const wordText = currentWord.word;
      const saved = await persistFlashcardAttempt(currentWord, status, currentIndex);
      if (!saved) {
        setHasAnsweredCurrent(false);
        return;
      }

      if (status === "knew") {
        setSessionKnew((prev) => [...prev, wordText]);
      } else if (status === "forgot") {
        setSessionForgot((prev) => [...prev, wordText]);
      } else {
        setSessionUnknown((prev) => [...prev, wordText]);
      }

      // Auto-advance after a short beat so the rating registers visually.
      clearTimeout(rateTimeoutRef.current);
      rateTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (currentIndex < activeWords.length - 1) {
          setSlideDirection("next");
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          setHasAnsweredCurrent(false);
        } else {
          setViewMode("finished");
        }
      }, 450);
    },
    [currentWord, hasAnsweredCurrent, persistFlashcardAttempt, currentIndex, activeWords.length],
  );

  useEffect(() => {
    if (viewMode !== "drill") return;

    const handleKeyDown = (e) => {
      if (e.repeat) return;

      if (e.key === "Tab" || e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      if (isFlipped && !hasAnsweredCurrent) {
        if (e.key === "1") {
          e.preventDefault();
          handleRateCard("unknown");
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          handleRateCard("forgot");
          return;
        }
        if (e.key === "3") {
          e.preventDefault();
          handleRateCard("knew");
          return;
        }
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!hasAnsweredCurrent) {
          if (!isFlipped) setIsFlipped(true);
          return;
        }
        if (currentIndex < activeWords.length - 1) {
          setSlideDirection("next");
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          setHasAnsweredCurrent(false);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setSlideDirection("prev");
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
          setHasAnsweredCurrent(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isFlipped, hasAnsweredCurrent, currentIndex, activeWords.length, handleRateCard]);

  const startRandomQuiz = (group) => {
    setSelectedGroup(group || null);
    setQuizTopic(group?.title || null);
    setQuizModalOpen(true);
  };

  const launchQuizSession = async () => {
    setQuizModalOpen(false);
    setLoading(true);
    try {
      const corpus = await fetchVocabularyCorpus({
        topic: quizTopic || undefined,
      });
      const quizCorpus = corpus.filter(
        (item) => item.word && getVocabularyMeaning(item, selectedLanguage),
      );
      if (quizCorpus.length === 0) {
        showErrorAlert(
          "No Quiz Words Available",
          "This vocabulary set has no words with saved meanings.",
        );
        return;
      }

      const shuffled = secureShuffle(quizCorpus);
      const selected = shuffled.slice(0, Math.min(quizQuantity, shuffled.length));

      const generated = selected.map((item) => {
        const correctAnswer = getVocabularyMeaning(item, selectedLanguage);
        const distractors = [
          ...new Set(
            secureShuffle(quizCorpus.filter((c) => c.word !== item.word))
              .map((c) => getVocabularyMeaning(c, selectedLanguage))
              .filter((meaning) => meaning && meaning !== correctAnswer),
          ),
        ].slice(0, 3);

        return {
          vocabulary: item,
          word: item.word,
          pos: item.pos,
          correctAnswer,
          options: secureShuffle([...distractors, correctAnswer]),
        };
      });

      setQuizQuestions(generated);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizUserAnswers([]);
      setQuizFinished(false);
      setViewMode("quiz");
      startQuizTimer(quizTimerMinutes);
    } catch (error) {
      console.error("Could not start flashcard quiz:", error);
      showErrorAlert("Quiz Could Not Be Started", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = async (chosen) => {
    if (isSavingQuizAnswer || quizFinished) return;
    const question = quizQuestions[quizIndex];
    if (!question) return;
    setIsSavingQuizAnswer(true);
    const isCorrect = chosen === question.correctAnswer;
    const saved = await persistFlashcardAttempt(
      question.vocabulary,
      isCorrect ? "knew" : "unknown",
      quizIndex,
      question.vocabulary.topic || quizTopic,
    );
    if (!saved) {
      setIsSavingQuizAnswer(false);
      return;
    }
    if (isCorrect) setQuizScore((prev) => prev + 1);

    setQuizUserAnswers((prev) => [
      ...prev,
      {
        question: question.word,
        chosen,
        correct: question.correctAnswer,
        isCorrect,
      },
    ]);

    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
    } else {
      stopQuizTimer();
      setQuizFinished(true);
    }
    setIsSavingQuizAnswer(false);
  };

  const handleNextCard = () => {
    if (currentIndex < activeWords.length - 1) {
      setSlideDirection("next");
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setHasAnsweredCurrent(false);
    } else {
      setViewMode("finished");
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setSlideDirection("prev");
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setHasAnsweredCurrent(false);
    }
  };

  const handlePracticeSessionMistakes = () => {
    const mistakeWords = words.filter(
      (word) =>
        sessionUnknown.includes(word.word) || sessionForgot.includes(word.word),
    );
    setMistakesList(mistakeWords);
    setMistakesOnly(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setHasAnsweredCurrent(false);
    setSessionKnew([]);
    setSessionUnknown([]);
    setSessionForgot([]);
    setViewMode("drill");
  };

  const handleStartOver = () => {
    setMistakesOnly(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setHasAnsweredCurrent(false);
    setSessionKnew([]);
    setSessionUnknown([]);
    setSessionForgot([]);
    setViewMode("drill");
  };

  const handleExitQuiz = () => {
    stopQuizTimer();
    setViewMode("sets");
  };

  const selectedTopicMistakes = selectedGroup
    ? getTopicMistakeCount(selectedGroup.title)
    : 0;

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      <FlashcardHeader
        totalCount={vocabStats?.totalCount}
        loading={loading}
        onStartQuiz={startRandomQuiz}
      />

      {viewMode === "sets" && (
        <FlashcardSetsView
          parts={PARTS}
          activePart={activePart}
          onPartChange={handlePartChange}
          groups={paginatedGroups}
          totalPages={totalGroupsPages}
          currentPage={currentGroupsPage}
          onPrevPage={() => setGroupsPage(Math.max(0, currentGroupsPage - 1))}
          onNextPage={() =>
            setGroupsPage(Math.min(totalGroupsPages - 1, currentGroupsPage + 1))
          }
          masteryRecords={masteryRecords}
          userName={user?.name}
          isAdmin={isAdmin}
          onStartDrill={handleStartDrill}
          onStartQuiz={startRandomQuiz}
        />
      )}

      {viewMode === "drill" && (
        <FlashcardDrillView
          currentWord={currentWord}
          currentIndex={currentIndex}
          totalWords={activeWords.length}
          isFlipped={isFlipped}
          slideDirection={slideDirection}
          isSpeaking={isSpeaking}
          loading={loading}
          selectedGroup={selectedGroup}
          languageCode={selectedLanguage}
          languageLabel={languageLabel}
          generationInProgress={generationInProgress}
          hasAnsweredCurrent={hasAnsweredCurrent}
          onBack={handleReturnToSets}
          onFlip={setIsFlipped}
          onSpeak={speakCurrentWord}
          onRate={handleRateCard}
          onGenerate={handleGenerateContent}
          onPrev={handlePrevCard}
          onNext={handleNextCard}
        />
      )}

      {viewMode === "finished" && (
        <FlashcardSessionSummary
          selectedGroup={selectedGroup}
          sessionKnew={sessionKnew}
          sessionUnknown={sessionUnknown}
          sessionForgot={sessionForgot}
          onPracticeMistakes={handlePracticeSessionMistakes}
          onStartOver={handleStartOver}
          onReturnToSets={handleReturnToSets}
        />
      )}

      {viewMode === "quiz" && (
        <FlashcardQuizView
          questions={quizQuestions}
          index={quizIndex}
          score={quizScore}
          timerMinutes={quizTimerMinutes}
          timeRemaining={quizTimeRemaining}
          finished={quizFinished}
          saving={isSavingQuizAnswer}
          userAnswers={quizUserAnswers}
          mistakeCount={selectedTopicMistakes}
          onExit={handleExitQuiz}
          onAnswer={handleQuizAnswer}
          onRetry={launchQuizSession}
          onReviewMistakes={() => handleStartDrill(selectedGroup, true)}
          onReturn={handleExitQuiz}
        />
      )}

      {quizModalOpen && (
        <RandomQuizSetupModal
          title="Random Vocabulary Quiz"
          questionLabel="Number of Questions"
          quantity={quizQuantity}
          onQuantityChange={setQuizQuantity}
          timerMinutes={quizTimerMinutes}
          onTimerChange={setQuizTimerMinutes}
          onCancel={() => setQuizModalOpen(false)}
          onStart={launchQuizSession}
        />
      )}
    </div>
  );
}
