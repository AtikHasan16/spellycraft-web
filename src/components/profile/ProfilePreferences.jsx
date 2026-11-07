import { useEffect, useState } from "react";
import { HiCheckCircle, HiLanguage } from "react-icons/hi2";
import { supabase } from "../../services/supabaseClient";
import { MEANING_LANGUAGES } from "../../utils/meaningLanguages";

export default function ProfilePreferences({ userId }) {
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadPreference() {
      if (!userId) return;
      setLoading(true);
      setErrorMessage("");
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_meaning_language")
          .eq("id", userId)
          .maybeSingle();

        if (!active) return;
        if (error) {
          setErrorMessage("Could not load your language preference. Please retry.");
        } else {
          const savedLanguage = data?.preferred_meaning_language || "en";
          setLanguage(
            MEANING_LANGUAGES.some((item) => item.code === savedLanguage)
              ? savedLanguage
              : "en",
          );
        }
      } catch {
        if (active) {
          setErrorMessage("Could not load your language preference. Please retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreference();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!userId || saving) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ preferred_meaning_language: language })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        setErrorMessage("Could not save your preference. Please try again.");
      } else {
        setMessage("Meaning language preference saved.");
      }
    } catch {
      setErrorMessage("Could not save your preference. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="profile-preferences-title"
      className="imlaa-card space-y-4 border border-plum/20 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plum/10 text-plum">
          <HiLanguage className="h-5 w-5" />
        </span>
        <div>
          <h2 id="profile-preferences-title" className="text-lg font-bold text-body-dark">
            Preferences
          </h2>
          <p className="mt-1 text-sm text-muted-label">
            Choose the language used for vocabulary meanings. English definitions remain in English.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1.5">
          <span className="text-sm font-semibold text-body-dark">Meaning language</span>
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              setMessage("");
            }}
            disabled={loading || saving}
            className="imlaa-input min-h-11 w-full rounded-xl"
          >
            {MEANING_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading || saving}
          className="imlaa-btn-primary min-h-11 shrink-0 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Preference"}
        </button>
      </form>

      {message && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <HiCheckCircle className="h-4 w-4" />
          {message}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
