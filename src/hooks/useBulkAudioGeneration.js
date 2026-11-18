import { useCallback, useEffect, useRef, useState } from "react";
import { recordAuditLog } from "../services/auditService";
import { supabase } from "../services/supabaseClient";
import { showErrorAlert, showSuccessToast } from "../utils/sweetalert";
import { buildPendingBatch, runBulkAudioBatch } from "../utils/bulkAudio";

const VOICE = "en-US-ChristopherNeural";

export default function useBulkAudioGeneration(user) {
  const [countsByTopic, setCountsByTopic] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [run, setRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const runRef = useRef(false);
  const stopRef = useRef(false);

  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_vocabulary_audio_counts");
      if (error) return;

      setCountsByTopic(
        Object.fromEntries(
          (data || []).map((row) => [
            row.topic,
            { total: Number(row.total), generated: Number(row.generated) },
          ]),
        ),
      );
    } catch {
      // Missing migration or a temporary RPC failure must not block the monitor page.
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const stopRun = useCallback(() => {
    if (runRef.current) stopRef.current = true;
  }, []);

  const startRun = useCallback(async (topic) => {
    if (runRef.current) return;

    runRef.current = true;
    stopRef.current = false;
    setIsRunning(true);
    setRun(null);

    try {
      const backendBase =
        import.meta.env.VITE_BACKEND_URL || "https://www.api.spellycraft.com";
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showErrorAlert("Sign in required", "Sign in with an administrator account to generate audio.");
        return;
      }

      const { data, error } = await supabase
        .from("vocabularies")
        .select("id, word, audio_url")
        .eq("topic", topic)
        .neq("target_tab", "uploaded")
        .is("audio_url", null)
        .order("word", { ascending: true })
        .limit(100);
      if (error) throw error;

      const tasks = buildPendingBatch(data);
      if (!tasks.length) {
        showSuccessToast("No missing audio", `All words in "${topic}" already have audio.`);
        await refreshCounts();
        return;
      }

      let progress = {
        done: 0,
        total: tasks.length,
        generated: 0,
        reused: 0,
        failed: [],
        status: "running",
        message: "Preparing audio generation.",
      };
      setRun({ topic, ...progress });

      const generate = async (task) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        try {
          const response = await fetch(`${backendBase}/api/audio/synthesize`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ word: task.word, voice: VOICE }),
            signal: controller.signal,
          });
          if (response.status === 429) {
            throw Object.assign(new Error("Rate limited"), { rateLimited: true });
          }
          if (!response.ok) {
            throw new Error(`Audio service returned ${response.status}.`);
          }
          if (!(response.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
            throw new Error("Audio upload failed; the service returned audio without a storage URL.");
          }

          const result = await response.json();
          if (!result?.audioUrl) throw new Error("Audio service did not return a storage URL.");
          return { audioUrl: result.audioUrl, cached: Boolean(result.cached) };
        } finally {
          clearTimeout(timer);
        }
      };

      const persist = async (task, audioUrl) => {
        const { data: rows, error: persistError } = await supabase.rpc(
          "set_vocabulary_audio_url",
          { p_word: task.word, p_audio_url: audioUrl },
        );
        if (persistError) throw persistError;
        return Number(rows) || 0;
      };

      const result = await runBulkAudioBatch({
        tasks,
        generate,
        persist,
        wait: (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
        shouldStop: () => stopRef.current,
        onProgress: (nextProgress) => {
          progress = { ...nextProgress, status: "running" };
          setRun({ topic, ...progress });
        },
      });
      const finalRun = {
        ...progress,
        topic,
        generated: result.generated,
        reused: result.reused,
        failed: result.failed,
        status: result.status,
        message: result.message,
      };
      setRun(finalRun);

      try {
        await recordAuditLog({
          userId: user?.id,
          userName: user?.name || "Admin",
          action: "VOCAB_AUDIO_GENERATED",
          details: `Audio generation for "${topic}": ${result.generated} generated, ${result.reused} reused, ${result.failed.length} failed of ${tasks.length} queued`,
          timestamp: new Date().toISOString(),
        });
      } catch (auditError) {
        console.warn("Could not record bulk audio audit log:", auditError);
      }

      await refreshCounts();
      if (result.failed.length === 0 && result.status === "done") {
        showSuccessToast(
          "Audio generation complete",
          `${result.generated} generated, ${result.reused} reused.`,
        );
      } else {
        const failedWords = result.failed.length
          ? `Failed words: ${result.failed.slice(0, 5).join(", ")}${result.failed.length > 5 ? ", …" : ""}. `
          : "";
        showErrorAlert("Audio generation stopped", `${result.message} ${failedWords}`);
      }
    } catch (error) {
      showErrorAlert(
        "Audio generation failed",
        error?.message || "The pending audio could not be loaded.",
      );
    } finally {
      runRef.current = false;
      stopRef.current = false;
      setIsRunning(false);
    }
  }, [refreshCounts, user]);

  return {
    countsByTopic,
    countsLoading,
    refreshCounts,
    run,
    startRun,
    stopRun,
    isRunning,
  };
}
