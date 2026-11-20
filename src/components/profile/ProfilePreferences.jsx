import { useEffect, useState } from "react";
import {
  HiCheckCircle,
  HiComputerDesktop,
  HiLanguage,
  HiMoon,
  HiSun,
} from "react-icons/hi2";
import { supabase } from "../../services/supabaseClient";
import { MEANING_LANGUAGES } from "../../utils/meaningLanguages";
import { useTheme } from "../../context/ThemeContext";

export default function ProfilePreferences({ userId }) {
  const { theme, setTheme } = useTheme();
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
      className="space-y-4"
    >
      <div>
        <h2 id="profile-preferences-title" className="text-lg font-bold text-body-dark">
          Preferences
        </h2>
        <p className="mt-1 text-sm text-muted-label">
          Personalize how SpellyCraft looks and displays vocabulary meanings.
        </p>
      </div>

      <section className="theme-card space-y-4 rounded-2xl p-5 sm:p-6" aria-labelledby="appearance-title">
        <div>
          <h3 id="appearance-title" className="font-bold text-body-dark">Appearance</h3>
          <p className="mt-1 text-sm text-muted-label">Choose a look for SpellyCraft.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "system", label: "System", detail: "Follow your device", Icon: HiComputerDesktop },
            { value: "light", label: "Light", detail: "Bright and clear", Icon: HiSun },
            { value: "dark", label: "Plum Night", detail: "Easy on the eyes", Icon: HiMoon },
          ].map(({ value, label, detail, Icon }) => (
            <label
              key={value}
              className={`theme-card flex cursor-pointer items-start gap-3 rounded-xl p-4 transition hover:border-plum/50 hover:shadow-sm ${
                theme === value ? "border-plum bg-plum-light ring-2 ring-plum/20" : ""
              }`}
            >
              <input
                type="radio"
                name="appearance"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
                className="mt-1 accent-plum"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold text-body-dark">
                  <Icon className="h-4 w-4 shrink-0 text-plum" aria-hidden="true" />
                  {label}
                </span>
                <span className="mt-1 block text-xs text-muted-label">{detail}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-label">Your appearance choice is saved in this browser.</p>
      </section>

      <section className="theme-card space-y-4 rounded-2xl p-5 sm:p-6" aria-labelledby="meaning-language-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum-light text-plum">
            <HiLanguage className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id="meaning-language-title" className="font-bold text-body-dark">Meaning language</h3>
            <p className="mt-1 text-sm text-muted-label">
              Choose the language used for vocabulary meanings. English definitions remain in English.
            </p>
          </div>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="sr-only">Meaning language</span>
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
      </section>

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
