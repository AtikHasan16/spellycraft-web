/**
 * Volunteer benefits + contributor pathways
 * (src/components/support/VolunteerBenefits.jsx)
 * Static mission-support content: the four contribution benefits, the unpaid
 * compensation notice, and the two onboarding pathways.
 */
import { Link } from "react-router";
import {
  HiAcademicCap,
  HiArrowTopRightOnSquare,
  HiChatBubbleLeftRight,
  HiCodeBracket,
  HiDocumentCheck,
  HiExclamationTriangle,
  HiRocketLaunch,
  HiStar,
} from "react-icons/hi2";

const BENEFITS = [
  {
    icon: HiDocumentCheck,
    title: "Official Letter of Appreciation",
    text: "A formal certificate or letter recognizing the work you contributed to the platform.",
  },
  {
    icon: HiAcademicCap,
    title: "Verified Personal Recommendation",
    text: "A LinkedIn, academic, or professional recommendation backed by verifiable contributions.",
  },
  {
    icon: HiStar,
    title: "Featured Contributor Profile",
    text: "A dedicated spotlight on the SpellyCraft website for your work and contribution.",
  },
  {
    icon: HiRocketLaunch,
    title: "Priority Future Opportunities",
    text: "First consideration for paid roles in future SpellyCraft projects and ventures.",
  },
];

export function VolunteerBenefitsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <article key={title} className="imlaa-card flex flex-col gap-2.5 p-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum/10 text-plum">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-body-dark">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-label">{text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function VolunteerCompensationNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3">
        <HiExclamationTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-sm font-bold text-amber-950">
            Transparent compensation notice
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">
            SpellyCraft is currently an independent, non-commercial educational project
            built and maintained by a student without external funding. Consequently, all
            volunteer roles are unpaid at this stage. Every contribution is formally
            credited, documented, and deeply appreciated.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContributorPathways() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <article className="imlaa-card flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum text-white">
          <HiCodeBracket className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-body-dark">For developers</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-label">
            Explore the public repository to review the tech stack, system architecture,
            and open issues before applying.
          </p>
        </div>
        <a
          href="https://github.com/AtikHasan16/spellycraft-web"
          target="_blank"
          rel="noopener noreferrer"
          className="imlaa-btn-secondary mt-auto inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold"
        >
          Open GitHub repository
          <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
        </a>
      </article>

      <article className="imlaa-card flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/10 text-plum">
          <HiChatBubbleLeftRight className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-body-dark">
            For English educators &amp; linguists
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-label">
            Test the live platform, audit grammar and spelling explanations, and send
            feature ideas or bug reports through the feedback form.
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Link
            to="/"
            className="imlaa-btn-secondary inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-semibold"
          >
            Test the platform
          </Link>
          <Link
            to="/contact"
            className="imlaa-btn-primary inline-flex min-h-11 flex-1 items-center justify-center px-4 text-sm font-bold"
          >
            Contribution / Feedback form
          </Link>
        </div>
      </article>
    </div>
  );
}
