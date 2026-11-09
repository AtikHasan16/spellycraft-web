import { Link } from "react-router";
import MinimalFooter from "../components/MinimalFooter";
import ResourceDirectory from "../components/resources/ResourceDirectory";

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white text-body-dark">
      <header className="border-b border-plum/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-black tracking-tight text-plum">
            SpellyCraft
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/workspace/resources"
              className="imlaa-btn-secondary inline-flex min-h-11 items-center px-4 text-sm font-semibold"
            >
              More free resources
            </Link>
            <Link
              to="/login"
              className="imlaa-btn-primary inline-flex min-h-11 items-center px-4 text-sm font-bold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-3xl border border-plum/15 bg-linear-to-br from-plum/5 via-white to-slate-50 p-6 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-plum">
            Free IELTS study library
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-body-dark sm:text-5xl">
            IELTS Lexical &amp; Orthographic Toolkit
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-label sm:text-lg">
            Free, indexable study materials, audio-linked printables, and vocabulary
            masterlists curated for high-band candidates.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm">
              Academic vocabulary
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm">
              English spelling and listening practice
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm">
              Lexical mastery workspace
            </span>
          </div>
        </section>

        <section aria-label="Public study resources" className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-body-dark">Explore free resources</h2>
            <p className="mt-1 text-muted-label">
              Preview opens the shared document in Google Drive in a new tab.
            </p>
          </div>
          <ResourceDirectory visibility="public" />
        </section>

        <section className="grid gap-5 rounded-2xl border border-plum/15 bg-plum/5 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
              More free materials for members
            </p>
            <h2 className="mt-2 text-2xl font-black text-body-dark">
              Sign in to browse the private resource collection.
            </h2>
            <p className="mt-2 leading-relaxed text-muted-label">
              All available SpellyCraft study resources are free. Sign-in simply
              unlocks additional member resources and learning tools.
            </p>
          </div>
          <Link
            to="/workspace/resources"
            className="imlaa-btn-primary inline-flex min-h-12 items-center justify-center px-5 font-bold"
          >
            Browse member resources
          </Link>
        </section>
      </main>
      <MinimalFooter />
    </div>
  );
}
