import { useEffect, useRef, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiArrowUpRight,
  HiBookOpen,
  HiInformationCircle,
  HiPaperAirplane,
  HiXMark,
} from "react-icons/hi2";
import { SiGoogleassistant } from "react-icons/si";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { sendHelpAssistantMessage } from "../../services/aiService";
import { secureRandomUUID } from "../../utils/cryptoRandom";
import { classifyHelpTopic, getHelpAssistantReply } from "./helpAssistantUtils";

const SUGGESTIONS = [
  { label: "Help me with a word", prompt: "Can you help me with vocabulary?" },
  { label: "Explain a grammar topic", prompt: "Can you help me with grammar?" },
  { label: "Find my study progress", prompt: "Where can I find my progress?" },
];

const LABEL_STYLES = {
  // bold headline
  meaning: "headline",
  answer: "headline",
  "correct spelling": "headline",
  corrected: "headline",
  word: "headline",
  difference: "headline",
  rule: "headline",
  // semibold chips
  synonyms: "chips",
  antonyms: "chips",
  "common misspellings": "chips",
  // everything else renders as normal text
};

function parseSections(text) {
  const clean = text.replace(/\*\*|__/g, "");
  const sections = clean
    .split(/\n\s*-{3,}\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^([A-Za-z][A-Za-z ]{1,24}):\s*([\s\S]+)$/);
      return match
        ? { label: match[1].trim(), value: match[2].trim() }
        : { label: null, value: block };
    });
  return sections.some((s) => s.label) ? sections : null;
}

function SectionValue({ label, value }) {
  const style = LABEL_STYLES[label?.toLowerCase()] ?? "plain";

  if (style === "headline") {
    return <p className="text-base font-bold text-body-dark">{value}</p>;
  }
  if (style === "chips") {
    const items = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-plum-light px-2.5 py-1 text-sm font-semibold text-plum"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }
  return <p className="font-normal text-body-dark">{value}</p>;
}

function FormattedResponse({ text }) {
  const sections = parseSections(text);

  if (!sections) {
    return <p className="whitespace-pre-wrap text-body-dark">{text}</p>;
  }

  return (
    <div>
      {sections.map(({ label, value }, index) => (
        <div key={`${label}-${index}`}>
          {index > 0 && <hr className="my-3 border-plum-border/40" />}
          {label && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-label">
              {label}
            </p>
          )}
          <SectionValue label={label} value={value} />
        </div>
      ))}
    </div>
  );
}

function ChatMessage({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isAssistant
            ? "rounded-bl-md border border-plum-border/60 bg-white text-body-dark shadow-sm"
            : "rounded-br-md bg-plum text-white"
        }`}
      >
        {isAssistant && message.formatted ? (
          <FormattedResponse text={message.text} />
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
        {message.link && (
          <Link
            to={message.link.to}
            className="mt-2 inline-flex min-h-11 items-center font-semibold text-plum underline decoration-plum/40 underline-offset-2 hover:text-plum-hover"
          >
            {message.link.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function HelpChat({ fullPage = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function sendMessage(text = draft) {
    const message = text.trim();
    if (!message || sending) return;

    const topic = classifyHelpTopic(message, messages);
    setMessages((current) => [
      ...current,
      {
        id: secureRandomUUID(),
        role: "user",
        text: message,
      },
    ]);
    setDraft("");

    if (topic === "unsupported") {
      setMessages((current) => [
        ...current,
        { id: secureRandomUUID(), role: "assistant", ...getHelpAssistantReply(topic) },
      ]);
      return;
    }

    const context = messages
      .slice(-6)
      .map(({ role, text: content }) => ({ role, content }));
    setSending(true);
    try {
      const answer = await sendHelpAssistantMessage([
        ...context,
        { role: "user", content: message },
      ]);
      setMessages((current) => [
        ...current,
        { id: secureRandomUUID(), role: "assistant", text: answer, formatted: true },
      ]);
    } catch (error) {
      console.error("Could not get a help assistant response:", error);
      setMessages((current) => [
        ...current,
        {
          id: secureRandomUUID(),
          role: "assistant",
          text:
            error.message ||
            "The assistant is temporarily unavailable. Please try again shortly.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-plum-border/70 bg-white shadow-2xl shadow-body-dark/15 ${
        fullPage
          ? "h-full rounded-2xl"
          : "h-[min(39rem,calc(100dvh-8rem))] w-[min(30rem,calc(100vw-2rem))] rounded-2xl"
      }`}
      aria-label="SpellyCraft help chat"
    >
      <header className="flex items-center justify-between gap-3 bg-plum px-4 py-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <SiGoogleassistant className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">SpellyCraft Assistant</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fullPage ? null : (
            <button
              type="button"
              onClick={() =>
                navigate("/help", {
                  state: { from: `${location.pathname}${location.search}` },
                })
              }
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-medium text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Open full chat page"
            >
              <HiArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Open Chat</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Close help chat"
            >
              <HiXMark className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-plum-border/40 bg-plum-light px-4 py-2.5 text-xs text-plum">
        <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
        <span>AI help is available for vocabulary, grammar, and platform guidance.</span>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto bg-[#faf9f8] p-4"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <div className="flex justify-start">
          <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-plum-border/60 bg-white px-4 py-3 text-sm leading-6 text-body-dark shadow-sm">
            <p className="font-semibold">Hi, what are you working on?</p>
            <p className="mt-1 text-muted-label">
              I can help with English vocabulary, grammar, or finding your way around
              SpellyCraft.
            </p>
          </div>
        </div>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {!messages.length && (
          <div className="grid gap-2 pt-1">
            {SUGGESTIONS.map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={sending}
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-plum-border/50 bg-white px-3 text-left text-sm font-medium text-body-dark transition hover:border-plum/50 hover:bg-plum-light focus-visible:outline focus-visible:outline-plum"
              >
                <span>{label}</span>
                <HiArrowLeft
                  className="h-4 w-4 rotate-180 text-plum"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="border-t border-plum-border/40 bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label
          className="sr-only"
          htmlFor={fullPage ? "help-message-full" : "help-message-popup"}
        >
          Your question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id={fullPage ? "help-message-full" : "help-message-popup"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            maxLength={500}
            rows={1}
            placeholder="Ask about vocabulary, grammar, or SpellyCraft…"
            className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-plum-border/60 px-3 py-2.5 text-sm text-body-dark outline-none transition placeholder:text-muted-label/80 focus:border-plum focus:ring-2 focus:ring-plum/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-plum text-white transition hover:bg-plum-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <HiPaperAirplane className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-label" role="status">
          {sending
            ? "Thinking…"
            : "Only vocabulary, grammar, and platform guidance are in scope."}
        </p>
      </form>
      <div className="border-t border-plum-border/30 bg-white">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={() => setShowProviderInfo(true)}
            className="text-xs font-medium text-plum hover:text-plum-hover focus-visible:outline focus-visible:outline-plum"
            aria-label="Learn more about AI providers and privacy"
          >
            Learn more
            <HiInformationCircle className="inline h-3.5 w-3.5 ml-1" aria-hidden="true" />
          </button>
        </div>
      </div>
      {showProviderInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-info-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 id="provider-info-title" className="text-base font-bold text-body-dark">
                AI Providers & Privacy
              </h2>
              <button
                type="button"
                onClick={() => setShowProviderInfo(false)}
                className="text-muted-label hover:text-body-dark focus-visible:outline focus-visible:outline-plum"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-label">
              <p className="leading-5">
                <strong className="text-body-dark">Provider integrations:</strong> Google
                AI Studio (Gemini) and NVIDIA NIM. We appreciate their developer access
                programs; free quotas and terms may change.
              </p>
              <p className="leading-5">
                <strong className="text-body-dark">
                  Chat isn't stored by SpellyCraft.
                </strong>{" "}
                Provider data handling follows their terms; don't share sensitive details.
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowProviderInfo(false)}
                className="w-full min-h-11 rounded-xl bg-plum text-white font-semibold transition hover:bg-plum-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function HelpAssistant() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (loading || !isAuthenticated || location.pathname === "/help") return null;

  function openAssistant() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      navigate("/help", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }
    setOpen((current) => !current);
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-60 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div
          id="help-assistant-panel"
          className="origin-bottom-right animate-[imlaaSlideIn_180ms_ease-out]"
          role="dialog"
          aria-modal="false"
          aria-label="SpellyCraft help assistant"
        >
          <HelpChat onClose={() => setOpen(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={openAssistant}
        aria-expanded={open}
        aria-controls={open ? "help-assistant-panel" : undefined}
        aria-label={open ? "Close SpellyCraft help" : "Open SpellyCraft help"}
        className="group relative inline-flex min-h-14 min-w-14 items-center justify-center rounded-full bg-plum text-white shadow-xl shadow-plum/25 transition duration-200 hover:-translate-y-1 hover:bg-plum-hover focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-plum"
      >
        {open ? (
          <HiXMark className="h-6 w-6" aria-hidden="true" />
        ) : (
          <SiGoogleassistant className="h-6 w-6" aria-hidden="true" />
        )}
        <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-lg bg-body-dark px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 md:block">
          Ask SpellyCraft
        </span>
      </button>
    </div>
  );
}

export function HelpAssistantPage() {
  const navigate = useNavigate();
  const location = useLocation();

  function returnToPreviousPage() {
    navigate(location.state?.from || "/", { replace: true });
  }

  return (
    <main className="min-h-dvh bg-[#f7f5f4] px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-3xl flex-col sm:min-h-[calc(100dvh-3rem)]">
        <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-plum text-white shadow-sm">
              <HiAcademicCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-body-dark">SpellyCraft</p>
              <p className="text-xs text-muted-label">Learning support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={returnToPreviousPage}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-plum-border/60 bg-white px-3 text-sm font-semibold text-body-dark transition hover:border-plum hover:text-plum focus-visible:outline focus-visible:outline-plum"
          >
            <HiArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to SpellyCraft</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <HelpChat fullPage />
        </div>
        <p className="pt-3 text-center text-xs text-muted-label">
          <HiBookOpen className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          Vocabulary, grammar, and platform help only.
        </p>
      </div>
    </main>
  );
}
