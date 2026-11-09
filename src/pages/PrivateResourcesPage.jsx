import { Link } from "react-router";
import ResourceDirectory from "../components/resources/ResourceDirectory";

export default function PrivateResourcesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 animate-slide-up">
      <div className="flex flex-col gap-3 border-b border-plum/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
            Member library · free
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-body-dark">
            More study resources
          </h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted-label">
            Browse additional English spelling, listening, reading, writing, and
            academic vocabulary materials.
          </p>
          <p className="mt-2 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Sign-in protects this listing. Google Drive applies its own file permissions;
            a link-only file can still be forwarded outside SpellyCraft.
          </p>
        </div>
        <Link
          to="/resources"
          className="imlaa-btn-secondary inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold"
        >
          View public resources
        </Link>
      </div>
      <ResourceDirectory visibility="private" />
    </main>
  );
}
