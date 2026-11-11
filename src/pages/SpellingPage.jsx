import { useState, useEffect, useCallback, useRef } from "react";
import RandomQuizSetupModal from "../components/RandomQuizSetupModal";
import SpellingHeader from "../components/spelling/SpellingHeader";
import SpellingSetsView from "../components/spelling/SpellingSetsView";
import SpellingDrillView from "../components/spelling/SpellingDrillView";
import SpellingQuizView from "../components/spelling/SpellingQuizView";
import SpellingSessionSummary from "../components/spelling/SpellingSessionSummary";
import { useCountdownTimer } from "../hooks/useCountdownTimer";
import { useModalEffects } from "../hooks/useModalEffects";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabaseClient";
import { speakWithMicrosoftTTS, stopAudioPlayback } from "../utils/speechTts";
import { showErrorAlert } from "../utils/sweetalert";
import { secureShuffle } from "../utils/cryptoRandom";
import { MEANING_LANGUAGES } from "../utils/meaningLanguages";
import {
  getSpellingMasterySummary,
  getSpellingMistakes,
  loadSpellingMastery,
  recordSpellingAttempt,
  saveSpellingMastery,
} from "../utils/spellingMastery";
import {
  buildSpellingGroups,
  buildSpellingMistakes,
  paginateSpellingGroups,
} from "../utils/spellingGroups";

const PARTS = ["All Active", "Listening Vocabs", "Uploaded", "Mistakes"];

/**
 * Spelling page (src/pages/SpellingPage.jsx)
 * Orchestration only: data fetching, dictation/quiz state, persistence, and
 * delegation to src/components/spelling/* presentational components.
 */
export default function SpellingPage() {
  const { user, isAdmin } = useAuth();
  const [preferredMeaningLanguage, setPreferredMeaningLanguage] = useState("en");

  // Navigation: 'sets' | 'drill' | 'finished' | 'quiz'
  const [activePart, setActivePart] = useState("All Active");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("sets");
  const [groupsPage, setGroupsPage] = useState(0);

  // Drill state
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState("");
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideDirection, setSlideDirection] = useState("next");

  // Per-session counts
  const [sessionCorrect, setSessionCorrect] = useState([]);
  const [sessionMisspelled, setSessionMisspelled] = useState([]);

  // Mistakes-only mode
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);
  const [drillRequest, setDrillRequest] = useState(null);

  // Persistence
  const [vocabStats, setVocabStats] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [mastery, setMastery] = useState({});
  const [masteryLoadedFor, setMasteryLoadedFor] = useState(null);
  const masteryRef = useRef({});
  const sessionStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadWordsRequestId = useRef(0);

  // Quiz state
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState(null);
  const [quizQuantity, setQuizQuantity] = useState(10);
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizInput, setQuizInput] = useState("");
  const [quizMisspelled, setQuizMisspelled] = useState([]);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const { startTimer: startQuizTimer, stopTimer: stopQuizTimer } = useCountdownTimer(
    setQuizTimeRemaining,
    () => setQuizFinished(true),
  );
  useModalEffects(quizModalOpen, setQuizModalOpen);

  useEffect(() => {
    let active = true;
    async function loadPreferredMeaningLanguage() {
      if (!user?.id) {
        setPreferredMeaningLanguage("en");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_meaning_language")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("Could not load spelling meaning language preference:", error);
        showErrorAlert(
          "Language Preference Unavailable",
          "The saved meaning language could not be loaded. Please check your Profile preferences.",
        );
        return;
      }
      const savedLanguage = data?.preferred_meaning_language || "en";
      setPreferredMeaningLanguage(
        MEANING_LANGUAGES.some(({ code }) => code === savedLanguage)
          ? savedLanguage
          : "en",
      );
    }

    loadPreferredMeaningLanguage().catch((error) => {
      if (!active) return;
      console.error("Could not load spelling meaning language preference:", error);
      showErrorAlert(
        "Language Preference Unavailable",
        "The saved meaning language could not be loaded. Please check your Profile preferences.",
      );
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const masteryOwnerId = user?.id || "guest";
  useEffect(() => {
    try {
      const savedMastery = loadSpellingMastery(masteryOwnerId);
      masteryRef.current = savedMastery;
      setMastery(savedMastery);
      setMasteryLoadedFor(masteryOwnerId);
    } catch (error) {
      console.error("Could not load saved spelling mastery:", error);
      showErrorAlert(
        "Mastery Not Loaded",
        "Saved spelling mastery could not be read from this browser.",
      );
    }
  }, [masteryOwnerId]);

  // Avoid flashing the previous user's mastery while the new one loads.
  const visibleMastery = masteryLoadedFor === masteryOwnerId ? mastery : {};

  const recordLocalMastery = (topic, word, outcome) => {
    const updatedMastery = recordSpellingAttempt(masteryRef.current, topic, word, outcome);
    saveSpellingMastery(masteryOwnerId, updatedMastery);
    masteryRef.current = updatedMastery;
    setMastery(updatedMastery);
  };

  const saveSpellingResult = async (word, outcome, topic, index) => {
    try {
      recordLocalMastery(topic, word, outcome);
    } catch (error) {
      console.error("Could not save local spelling mastery:", error);
      showErrorAlert(
        "Mastery Not Saved",
        "Your spelling result could not be saved in this browser. Please check browser storage and try again.",
      );
      return false;
    }

    if (user?.id) {
      try {
        const result = await apiClient.post("/spelling/progress", {
          userId: user.id,
          topic,
          word: word.word,
          isCorrect: outcome === "know",
          currentIndex: index,
        });
        if (result.data?.success && result.data.data) {
          setUserProgress(result.data.data);
        }
      } catch (error) {
        console.error("Could not save cloud spelling progress:", error);
        showErrorAlert(
          "Cloud Progress Not Saved",
          "Your result is saved on this browser, but could not be synced to your account.",
        );
      }

      // Correct spelling also clears an older flashcard mistake for that word.
      if (outcome === "know") {
        try {
          await apiClient.post("/flashcard/progress", {
            userId: user.id,
            topic,
            word: word.word,
            status: "knew",
            lastIndex: index,
          });
        } catch (error) {
          console.error("Could not clear the flashcard mistake after spelling practice:", error);
          showErrorAlert(
            "Mistake Sync Incomplete",
            "Your spelling result is saved, but an older flashcard mistake could not be cleared from your account.",
          );
        }
      }
    }
    return true;
  };

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
    try {
      const res = await apiClient.get("/spelling/progress", {
        params: {
          userId: targetId,
          topic: selectedGroup?.title || "Academic Word List: Sublist A",
        },
      });
      if (isMountedRef.current && res.data?.success && res.data.data) {
        setUserProgress(res.data.data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn("Could not load spelling progress:", err);
      }
    }
  }, [user, selectedGroup]);

  useEffect(() => {
    fetchStats();
    fetchProgress();
  }, [fetchStats, fetchProgress]);

  // Grouping and mistake derivation live in a pure utility module.
  const dynamicGroups = buildSpellingGroups({
    vocabStats,
    visibleMastery,
    userProgress,
    selectedGroupTitle: selectedGroup?.title || null,
    isAdmin,
    userName: user?.name,
  });
  const allMistakes = buildSpellingMistakes(visibleMastery, dynamicGroups);

  const loadWordsForDrill = useCallback(
    async (group, onlyMistakes = false) => {
      const requestId = ++loadWordsRequestId.current;
      setLoading(true);
      setSpellingInput("");
      setStatusFeedback(null);
      setHasAnsweredCurrent(false);
      try {
        const res = await apiClient.get("/vocabulary", {
          params: {
            topic: group.title,
            userId: user?.id,
            userRole: user?.role || "general",
            userName: user?.name,
          },
        });
        let loaded = res.data?.data || [];
        // Some uploaded groups return no rows by topic; fall back to the
        // caller's visible corpus rather than showing an empty drill.
        if (loaded.length === 0) {
          const fallback = await apiClient.get("/vocabulary", {
            params: {
              userId: user?.id,
              userRole: user?.role || "general",
              userName: user?.name,
            },
          });
          loaded = fallback.data?.data || [];
        }

        if (loadWordsRequestId.current !== requestId || !isMountedRef.current) return;

        setWords(loaded);
        if (onlyMistakes) {
          let legacyMistakes = [];
          if (user?.id) {
            try {
              const progress = await apiClient.get("/spelling/progress", {
                params: { userId: user.id, topic: group.title },
              });
              legacyMistakes = progress.data?.data?.incorrectWords || [];
            } catch (error) {
              console.warn("Could not load saved spelling mistakes:", error);
            }
          }
          const savedMistakes = getSpellingMistakes(masteryRef.current, group.title).map(
            (entry) => entry.word,
          );
          const loadedByKey = new Map(
            loaded.map((word) => [word.word.trim().toLocaleLowerCase(), word]),
          );
          const mistakesByKey = new Map(
            [...savedMistakes.map((word) => word.word), ...legacyMistakes].map(
              (wordText) => {
                const key = wordText.trim().toLocaleLowerCase();
                return [key, loadedByKey.get(key) || { word: wordText }];
              },
            ),
          );
          setMistakesList([...mistakesByKey.values()]);
        }
        if (loadWordsRequestId.current !== requestId || !isMountedRef.current) return;
        setCurrentIndex(0);
      } catch (err) {
        if (loadWordsRequestId.current === requestId && isMountedRef.current) {
          console.error("Failed to load spelling words:", err);
        }
      } finally {
        if (loadWordsRequestId.current === requestId && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [user],
  );

  const handleStartDrill = useCallback((group, isMistakes = false) => {
    setSelectedGroup(group);
    setMistakesOnly(isMistakes);
    setViewMode("drill");
    setSessionCorrect([]);
    setSessionMisspelled([]);
    setDrillRequest({ group, isMistakes });
  }, []);

  useEffect(() => {
    if (drillRequest) {
      sessionStartTimeRef.current = Date.now();
      loadWordsForDrill(drillRequest.group, drillRequest.isMistakes);
    }
  }, [drillRequest, loadWordsForDrill]);

  const handleReturnToSets = () => {
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
    setSpellingInput("");
    setStatusFeedback(null);
    setHasAnsweredCurrent(false);
    sessionStartTimeRef.current = null;
    fetchProgress();
  };

  const activeWords = mistakesOnly ? mistakesList : words;
  const currentWord = activeWords[currentIndex] || null;
  const meaningLanguageLabel =
    MEANING_LANGUAGES.find(({ code }) => code === preferredMeaningLanguage)?.label ||
    "English";

  const speakTargetWord = useCallback(
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

  // Dictation should be audible as soon as a new word appears.
  useEffect(() => {
    if (viewMode === "drill" && currentWord) {
      speakTargetWord(currentWord.word);
    }
  }, [viewMode, currentIndex, currentWord, speakTargetWord]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  const handleCheckSpelling = async (e) => {
    if (e) e.preventDefault();
    if (!currentWord || evaluating || !spellingInput.trim()) return;

    setEvaluating(true);
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanInput === cleanTarget;

    const topic = selectedGroup?.title || "Academic Word List: Sublist A";
    const saved = await saveSpellingResult(
      currentWord,
      isCorrect ? "know" : "doNotKnow",
      topic,
      currentIndex,
    );
    if (!saved) {
      setEvaluating(false);
      return;
    }

    setHasAnsweredCurrent(true);
    if (isCorrect) {
      setStatusFeedback("correct");
      setSessionCorrect((prev) => [...new Set([...prev, currentWord.word])]);
    } else {
      setStatusFeedback("incorrect");
      setSessionMisspelled((prev) => [...new Set([...prev, currentWord.word])]);
    }

    setEvaluating(false);
  };

  const handleRevealAnswer = async () => {
    if (!currentWord || hasAnsweredCurrent) return;
    const saved = await saveSpellingResult(
      currentWord,
      "forgot",
      selectedGroup?.title || "Academic Word List: Sublist A",
      currentIndex,
    );
    if (!saved) return;

    setHasAnsweredCurrent(true);
    setStatusFeedback("revealed");
    setSessionMisspelled((prev) => [...new Set([...prev, currentWord.word])]);
  };

  const handleNextWord = useCallback(() => {
    // Guard: a learner may not advance without answering or revealing.
    if (!hasAnsweredCurrent) return;

    if (mistakesOnly && currentWord && statusFeedback === "correct") {
      const currentKey = currentWord.word.trim().toLocaleLowerCase();
      const remainingMistakes = mistakesList.filter(
        (word) => word.word.trim().toLocaleLowerCase() !== currentKey,
      );
      setMistakesList(remainingMistakes);
      if (remainingMistakes.length === 0) {
        setViewMode("finished");
        return;
      }
      setCurrentIndex(Math.min(currentIndex, remainingMistakes.length - 1));
      setSpellingInput("");
      setStatusFeedback(null);
      setHasAnsweredCurrent(false);
      return;
    }

    if (currentIndex < activeWords.length - 1) {
      setSlideDirection("next");
      setCurrentIndex((prev) => prev + 1);
      setSpellingInput("");
      setStatusFeedback(null);
      setHasAnsweredCurrent(false);
    } else {
      setViewMode("finished");
    }
  }, [
    hasAnsweredCurrent,
    currentIndex,
    activeWords.length,
    mistakesOnly,
    currentWord,
    statusFeedback,
    mistakesList,
  ]);

  const handlePrevWord = () => {
    if (currentIndex > 0) {
      setSlideDirection("prev");
      setCurrentIndex((prev) => prev - 1);
      setSpellingInput("");
      setStatusFeedback(null);
      setHasAnsweredCurrent(false);
    }
  };

  useEffect(() => {
    if (viewMode !== "drill") return;

    const handleKeyDown = (e) => {
      if (e.repeat) return;

      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      if (e.key === "ArrowRight") {
        if (isInput && e.target.selectionStart < e.target.value.length) return;
        e.preventDefault();
        if (hasAnsweredCurrent) handleNextWord();
      } else if (e.key === "ArrowLeft") {
        if (isInput && e.target.selectionStart > 0) return;
        e.preventDefault();
        if (currentIndex > 0) {
          setSlideDirection("prev");
          setCurrentIndex((prev) => prev - 1);
          setSpellingInput("");
          setStatusFeedback(null);
          setHasAnsweredCurrent(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, hasAnsweredCurrent, currentIndex, activeWords.length, handleNextWord]);

  const startRandomQuiz = (group) => {
    setSelectedGroup(group || null);
    setQuizTopic(group?.title || null);
    setQuizModalOpen(true);
  };

  const speakQuizWord = (word) => {
    if (!word?.word) return;
    speakWithMicrosoftTTS(word.word, {
      vocabId: word.id,
      audioUrl: word.audioUrl || word.audio_url,
    });
  };

  const launchQuizSession = async () => {
    setQuizModalOpen(false);
    setLoading(true);
    try {
      const pageSize = 500;
      const firstPage = await apiClient.get("/vocabulary", {
        params: { topic: quizTopic || undefined, page: 1, pageSize },
      });
      const corpus = [...(firstPage.data?.data || [])];
      const totalCount = firstPage.data?.totalCount ?? corpus.length;
      const pageCount = Math.ceil(totalCount / pageSize);
      for (let page = 2; page <= pageCount; page += 1) {
        const pageResult = await apiClient.get("/vocabulary", {
          params: { topic: quizTopic || undefined, page, pageSize },
        });
        const pageWords = pageResult.data?.data || [];
        if (pageWords.length === 0) break;
        corpus.push(...pageWords);
      }
      if (corpus.length === 0) {
        showErrorAlert(
          "No Quiz Words Available",
          "There are no vocabulary words available for a quiz right now.",
        );
        return;
      }

      const shuffled = secureShuffle(corpus);
      const selected = shuffled.slice(0, Math.min(quizQuantity, shuffled.length));

      setQuizQuestions(selected);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizInput("");
      setQuizMisspelled([]);
      setQuizFinished(false);
      setViewMode("quiz");

      if (selected[0]) {
        setTimeout(() => speakQuizWord(selected[0]), 300);
      }

      startQuizTimer(quizTimerMinutes);
    } catch (error) {
      console.error("Could not start spelling quiz:", error);
      showErrorAlert("Quiz Could Not Be Started", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizInput.trim() || quizSubmitting) return;

    const question = quizQuestions[quizIndex];
    if (!question) return;
    const isCorrect =
      quizInput.trim().toLowerCase() === question.word.trim().toLowerCase();
    const topic = question.topic || quizTopic || "Academic Word List: Sublist A";
    setQuizSubmitting(true);
    try {
      const saved = await saveSpellingResult(
        question,
        isCorrect ? "know" : "doNotKnow",
        topic,
        quizIndex,
      );
      if (!saved) return;
      if (isCorrect) {
        setQuizScore((prev) => prev + 1);
      } else {
        setQuizMisspelled((prev) => [
          ...new Map(
            [...prev, question].map((word) => [word.word.toLocaleLowerCase(), word]),
          ).values(),
        ]);
      }

      setQuizInput("");
      if (quizIndex < quizQuestions.length - 1) {
        const nextQuestion = quizQuestions[quizIndex + 1];
        setQuizIndex((prev) => prev + 1);
        setTimeout(() => speakQuizWord(nextQuestion), 300);
      } else {
        stopQuizTimer();
        setQuizFinished(true);
      }
    } finally {
      setQuizSubmitting(false);
    }
  };

  const filteredGroups = dynamicGroups.filter((group) => group.part === activePart);
  const {
    totalPages: totalGroupsPages,
    page: currentGroupsPage,
    items: paginatedGroups,
  } = paginateSpellingGroups(filteredGroups, groupsPage);

  const handlePartChange = (part) => {
    setActivePart(part);
    setGroupsPage(0);
  };

  const activeTopic = selectedGroup?.title || "Academic Word List: Sublist A";
  const corpusMastery = getSpellingMasterySummary(visibleMastery, activeTopic);
  const quizMastery = quizTopic
    ? getSpellingMasterySummary(visibleMastery, quizTopic)
    : Object.values(visibleMastery).reduce(
        (total, records) => {
          const summary = getSpellingMasterySummary({ current: records }, "current");
          return {
            know: total.know + summary.know,
            doNotKnow: total.doNotKnow + summary.doNotKnow,
            forgot: total.forgot + summary.forgot,
          };
        },
        { know: 0, doNotKnow: 0, forgot: 0 },
      );
  const topicMistakes = getSpellingMistakes(visibleMastery, activeTopic);
  const quizMistakeCount = quizTopic
    ? getSpellingMistakes(visibleMastery, quizTopic).length
    : 0;

  const handlePracticeTopicMistakes = () => {
    const mistakeWords = topicMistakes.map((entry) => entry.word);
    setMistakesList(mistakeWords);
    setMistakesOnly(true);
    setCurrentIndex(0);
    setSpellingInput("");
    setStatusFeedback(null);
    setHasAnsweredCurrent(false);
    setSessionCorrect([]);
    setSessionMisspelled([]);
    setViewMode("drill");
  };

  const handleStartOver = () => {
    setMistakesOnly(false);
    setCurrentIndex(0);
    setSpellingInput("");
    setStatusFeedback(null);
    setHasAnsweredCurrent(false);
    setSessionCorrect([]);
    setSessionMisspelled([]);
    setViewMode("drill");
  };

  const handleExitQuiz = () => {
    stopQuizTimer();
    setViewMode("sets");
  };

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      <SpellingHeader loading={loading} onStartQuiz={startRandomQuiz} />

      {viewMode === "sets" && (
        <SpellingSetsView
          parts={PARTS}
          activePart={activePart}
          onPartChange={handlePartChange}
          groups={paginatedGroups}
          mistakes={allMistakes}
          totalPages={totalGroupsPages}
          currentPage={currentGroupsPage}
          onPrevPage={() => setGroupsPage((page) => Math.max(0, page - 1))}
          onNextPage={() =>
            setGroupsPage((page) => Math.min(totalGroupsPages - 1, page + 1))
          }
          userName={user?.name}
          meaningLanguageCode={preferredMeaningLanguage}
          meaningLanguageLabel={meaningLanguageLabel}
          onStartDrill={handleStartDrill}
          onStartQuiz={startRandomQuiz}
          onPracticeMistakes={(group) => handleStartDrill(group, true)}
        />
      )}

      {viewMode === "drill" && (
        <SpellingDrillView
          currentWord={currentWord}
          currentIndex={currentIndex}
          totalWords={activeWords.length}
          spellingInput={spellingInput}
          statusFeedback={statusFeedback}
          hasAnsweredCurrent={hasAnsweredCurrent}
          evaluating={evaluating}
          isSpeaking={isSpeaking}
          loading={loading}
          slideDirection={slideDirection}
          selectedGroup={selectedGroup}
          meaningLanguageCode={preferredMeaningLanguage}
          meaningLanguageLabel={meaningLanguageLabel}
          sessionMisspelled={sessionMisspelled}
          onBack={handleReturnToSets}
          onInputChange={setSpellingInput}
          onSubmit={handleCheckSpelling}
          onReveal={handleRevealAnswer}
          onNext={handleNextWord}
          onPrev={handlePrevWord}
          onSpeak={speakTargetWord}
        />
      )}

      {viewMode === "finished" && (
        <SpellingSessionSummary
          selectedGroup={selectedGroup}
          sessionCorrect={sessionCorrect}
          sessionMisspelled={sessionMisspelled}
          corpusMastery={corpusMastery}
          mistakeCount={topicMistakes.length}
          onPracticeMistakes={handlePracticeTopicMistakes}
          onStartOver={handleStartOver}
          onReturnToSets={handleReturnToSets}
        />
      )}

      {viewMode === "quiz" && (
        <SpellingQuizView
          questions={quizQuestions}
          index={quizIndex}
          score={quizScore}
          timerMinutes={quizTimerMinutes}
          timeRemaining={quizTimeRemaining}
          finished={quizFinished}
          input={quizInput}
          misspelled={quizMisspelled}
          submitting={quizSubmitting}
          meaningLanguageCode={preferredMeaningLanguage}
          meaningLanguageLabel={meaningLanguageLabel}
          quizMastery={quizMastery}
          mistakeCount={quizMistakeCount}
          onExit={handleExitQuiz}
          onInputChange={setQuizInput}
          onSubmit={handleQuizSubmit}
          onSpeak={speakQuizWord}
          onRetry={launchQuizSession}
          onPracticeMistakes={() => handleStartDrill(selectedGroup, true)}
          onReturn={() => setViewMode("sets")}
        />
      )}

      {quizModalOpen && (
        <RandomQuizSetupModal
          title="Random Spelling Quiz"
          questionLabel="Number of Dictation Words"
          quantityLabel="Words"
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
