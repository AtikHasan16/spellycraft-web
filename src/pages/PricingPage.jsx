import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import MinimalFooter from "../components/MinimalFooter";
import PublicNavbar from "../components/PublicNavbar";

const features = [
  ["2,000+ vocabulary words", "A substantial library for building academic English."],
  [
    "Clear, natural audio for every word",
    "Hear the pronunciation clearly while you study.",
  ],
  ["Spelling practice", "Listen, recall, and check your spelling."],
  ["Vocabulary flashcards", "Review words with focused recall practice."],
  ["Random vocabulary quizzes", "Test what you remember across the collection."],
  ["Upload your own vocabulary", "Practise personal word lists in your workspace."],
  ["AI vocabulary support", "AI assisted vocabulary learning and word exploration."],
  ["Grammar assistant", "Get guided help while learning grammar."],
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-body-dark">
      <Helmet>
        <title>Free Pricing | SpellyCraft</title>
        <meta
          name="description"
          content="SpellyCraft learning tools are free. See what is included and support our mission if you can."
        />
      </Helmet>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <PublicNavbar />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-plum">
          Simple pricing
        </p>
        <h1 className=" text-center text-4xl font-black tracking-tight sm:text-5xl">
          Every learner gets the full toolkit.
        </h1>
        <p className="max-w-2xl text-center text-lg leading-relaxed text-muted-label">
          SpellyCraft is free to use. No subscriptions or feature tiers.
        </p>
        {/* Free plan features */}
        <section
          aria-label="Free plan features"
          className="theme-card mt-10 w-full max-w-6xl rounded-3xl p-7 shadow-sm sm:p-9"
        >
          <div className="flex items-end justify-between gap-4 border-b border-plum/10 pb-6">
            <div>
              <h2 className="text-3xl font-bold">Free</h2>
              <p className="mt-1 text-sm text-muted-label">
                All learning features included
              </p>
            </div>
            <p className="text-5xl font-black text-plum">
              $0
              <span className="text-base font-semibold text-muted-label"> / forever</span>
            </p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {features.map(([feature, description]) => (
              <li
                key={feature}
                className="theme-card-soft rounded-2xl p-4"
              >
                <span className="text-plum" aria-hidden="true">
                  ✦
                </span>
                <h3 className="mt-2 font-bold">{feature}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-label">
                  {description}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="imlaa-btn-primary mt-7 min-h-12 w-full justify-center text-base font-bold"
          >
            Start learning free
          </Link>
        </section>
        <p className="mt-8 text-center text-muted-label">
          We keep learning free through community support.{" "}
          <Link to="/support-us" className="font-semibold text-plum underline">
            Support us
          </Link>{" "}
          if you would like to help.
        </p>
      </main>
      <MinimalFooter />
    </div>
  );
}
