import { useState } from "react";
import { Link } from "react-router";
import {
  HiArrowRight,
  HiCheck,
  HiOutlineAcademicCap,
  HiHeart,
  HiSparkles,
  HiSpeakerWave,
} from "react-icons/hi2";
import MinimalFooter from "../components/MinimalFooter";
import { speakWithMicrosoftTTS } from "../utils/speechTts";

const features = [
  {
    icon: HiOutlineAcademicCap,
    title: "Phonetic Sound Matching for Listening Tests",
    description:
      "Listen carefully, distinguish similar sounds, and spell each word from recall with natural speech playback.",
    label: "Listen. Recall. Spell.",
  },
  {
    icon: HiCheck,
    title: "Academic Collocation Drills",
    description:
      "Practise high-value academic word pairings and build the lexical range needed for clearer IELTS writing.",
    label: "Learn words in context",
  },
  {
    icon: HiSparkles,
    title: "One Connected Learning Workspace",
    description:
      "Explore flashcards, spelling practice, grammar modules, AI-assisted vocabulary, and saved mastery progress.",
    label: "Practice with purpose",
  },
];

function WorkspacePreview() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/25"
      aria-label="Animated preview of a spelling practice session"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="font-mono text-xs text-slate-400">
          spellycraft / spelling-lab
        </span>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          SESSION ACTIVE
        </span>
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
              Academic listening · word 04 of 12
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">Listen and spell</h2>
          </div>
          <button
            type="button"
            onClick={() => speakWithMicrosoftTTS("The committee reached a consensus.")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-cyan-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-label="Play sample pronunciation"
          >
            <HiSpeakerWave className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <p className="font-mono text-sm text-slate-400">Your response</p>
          <p className="mt-3 font-mono text-xl tracking-wide text-white">
            The committee reached a{" "}
            <span className="landing-corrected-word font-bold text-rose-300">
              concensus
            </span>
            <span className="ml-1 inline-block h-5 w-px animate-pulse bg-cyan-300 align-middle" />
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md bg-rose-400/10 px-2 py-1 font-mono text-rose-300 line-through">
              concensus
            </span>
            <span className="text-slate-500" aria-hidden="true">
              →
            </span>
            <span className="rounded-md bg-emerald-400/10 px-2 py-1 font-mono font-semibold text-emerald-300">
              consensus
            </span>
            <span className="text-slate-400">Correct spelling</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Accuracy tracked in your mastery history</span>
          <span className="font-mono text-cyan-200">REVIEW →</span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, label }) {
  return (
    <article className="group rounded-2xl border border-plum/15 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-plum/35 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-plum/10 text-plum transition group-hover:bg-plum group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-plum">
        {label}
      </p>
      <h3 className="mt-2 text-xl font-bold leading-snug text-body-dark">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted-label">{description}</p>
    </article>
  );
}

function ComparisonPanel() {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = answer.trim().toLocaleLowerCase() === "definitely";

  const handleCheck = (event) => {
    event.preventDefault();
    if (answer.trim()) setChecked(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Passive correction
        </p>
        <h3 className="mt-2 text-xl font-bold text-body-dark">
          Normal Vocab Website (Passive Fix)
        </h3>
        <p className="mt-2 leading-relaxed text-muted-label">
          An auto-correct can hide a spelling slip before you notice it. The page looks
          right, but the word may not stick.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="passive-example"
            className="text-sm font-semibold text-body-dark"
          >
            Example input
          </label>
          <input
            id="passive-example"
            className="imlaa-input mt-2"
            value="The result was definately clear."
            readOnly
            aria-describedby="passive-hint"
          />
          <p id="passive-hint" className="mt-2 text-xs text-rose-700">
            A red line flags the error, but gives no recall practice.
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-plum/25 bg-plum/5 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-plum">
          Active practice
        </p>
        <h3 className="mt-2 text-xl font-bold text-body-dark">
          SpellyCraft (Active Lexical Mastery)
        </h3>
        <p className="mt-2 leading-relaxed text-muted-label">
          Hear a word, retrieve its spelling yourself, then review the correction and
          practise it again.
        </p>
        <div className="mt-5 rounded-xl border border-plum/15 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="active-example"
              className="text-sm font-semibold text-body-dark"
            >
              Listen, then recall
            </label>
            <button
              type="button"
              onClick={() => speakWithMicrosoftTTS("definitely")}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-plum/25 px-3 text-sm font-semibold text-plum transition hover:bg-plum/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
            >
              <HiSpeakerWave className="h-4 w-4" aria-hidden="true" />
              Play audio
            </button>
          </div>
          <form onSubmit={handleCheck}>
            <input
              id="active-example"
              className="imlaa-input mt-3"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setChecked(false);
              }}
              placeholder="Type the word you heard"
              autoComplete="off"
              aria-describedby="active-hint"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p id="active-hint" className="text-xs text-muted-label">
                Recall first · check your spelling when ready
              </p>
              <button
                type="submit"
                disabled={!answer.trim()}
                className="imlaa-btn-primary min-h-11 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Check spelling
              </button>
            </div>
            {checked && (
              <p
                role="status"
                className={`mt-3 text-sm font-semibold ${
                  isCorrect ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isCorrect
                  ? "Correct — definitely."
                  : "Not quite. The correct spelling is definitely."}
              </p>
            )}
          </form>
        </div>
      </article>
    </div>
  );
}

function AuthoritySection() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
            Built for ambitious learners
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Turn small daily practice into confident academic English.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-300">
            Prepare for IELTS listening and writing with deliberate spelling recall,
            academic vocabulary, collocations, and progress you can revisit. Build a
            stronger application toolkit for your next study opportunity.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-black text-cyan-200">Recall</p>
              <p className="mt-1 text-sm text-slate-300">
                Practice, not passive correction
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-black text-cyan-200">Progress</p>
              <p className="mt-1 text-sm text-slate-300">Review mastery over time</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-200/20 bg-linear-to-br from-cyan-300/15 to-plum/30 p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-200">
            Your requested success target
          </p>
          <p className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Average Score Boost:
            <span className="mt-2 block text-cyan-200">+1.5 Band Points</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            A goal to work toward—not a verified outcome or guarantee. IELTS results
            depend on each learner’s starting level, study plan, and exam performance.
          </p>
          <div className="mt-8 space-y-3 border-t border-white/10 pt-5">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Learner review</p>
              <p className="mt-1 text-sm text-slate-400">
                Review card reserved for a verified learner testimonial.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Study outcome</p>
              <p className="mt-1 text-sm text-slate-400">
                Add measured, consented results here when available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-white text-body-dark">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="text-xl font-black tracking-tight text-plum">
          SpellyCraft<span aria-hidden="true">.</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-5">
          <Link
            to="/about"
            className="hidden min-h-11 items-center px-2 text-sm font-semibold text-muted-label hover:text-plum sm:inline-flex"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="hidden min-h-11 items-center px-2 text-sm font-semibold text-muted-label hover:text-plum sm:inline-flex"
          >
            Contact
          </Link>
          <Link
            to="/login"
            className="min-h-11 inline-flex items-center px-3 text-sm font-bold text-plum hover:text-plum-hover"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="imlaa-btn-primary min-h-11 px-4 text-sm font-bold"
          >
            Create account
          </Link>
        </nav>
      </header>

      <main>
        <section className="bg-linear-to-br from-[#faf8f7] via-white to-[#f2edef]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-plum/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-plum shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Linguistic mastery workspace
              </p>
              <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-body-dark sm:text-5xl lg:text-6xl">
                Secure Band 8.0+ in IELTS Writing &amp; Listening
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-label sm:text-xl">
                Master English orthography and advance with phonemic speech synthesis.
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-body-dark/80">
                Replace passive word lists with active spelling recall, academic
                collocations, and clear practice you can return to.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/workspace/flashcard"
                  className="imlaa-btn-primary min-h-12 justify-center gap-2 px-6 text-base font-bold shadow-lg shadow-plum/20 transition hover:-translate-y-0.5"
                >
                  Enter Workspace
                  <HiArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/register"
                  className="imlaa-btn-secondary min-h-12 justify-center px-6 text-base font-bold"
                >
                  Start free practice
                </Link>
              </div>
              <p className="mt-3 text-sm text-muted-label">
                Secure sign-in protects your personal learning progress.
              </p>
            </div>
            <WorkspacePreview />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-plum">
              Move beyond spell-check
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Fixing a word is not the same as learning it.
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-label">
              Generic spell-checkers can mask errors. High-stakes academic practice should
              help you notice, retrieve, and retain.
            </p>
          </div>
          <ComparisonPanel />
        </section>

        <section className="bg-[#faf8f7]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-plum">
                A focused toolkit
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Three ways to strengthen your academic English.
              </h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <AuthoritySection />

        <section className="px-4 py-16 text-center sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-plum/15 bg-linear-to-br from-white to-[#f6f1f3] px-5 py-10 shadow-sm sm:px-10 sm:py-14">
            <HiHeart className="mx-auto h-8 w-8 text-plum" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Your next practice session starts here.
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-label">
              Build confident spelling recall and academic vocabulary one focused session
              at a time.
            </p>
            <Link
              to="/workspace/flashcard"
              className="imlaa-btn-primary mt-7 min-h-14 justify-center gap-2 px-8 text-lg font-black shadow-lg shadow-plum/25 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum"
            >
              Enter Workspace
              <HiArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <MinimalFooter />
    </div>
  );
}
