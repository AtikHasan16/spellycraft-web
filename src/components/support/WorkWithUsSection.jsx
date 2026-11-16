/**
 * Work With Us section (src/components/support/WorkWithUsSection.jsx)
 * Public volunteering hub for the Support Us page: mission narrative,
 * benefits, compensation transparency, contributor pathways, and the
 * application form with a live editable message preview.
 */
import { HiHandRaised, HiHeart, HiSparkles } from "react-icons/hi2";
import VolunteerApplicationForm from "./VolunteerApplicationForm";
import {
  ContributorPathways,
  VolunteerBenefitsGrid,
  VolunteerCompensationNotice,
} from "./VolunteerBenefits";

export default function WorkWithUsSection({ onDonate }) {
  return (
    <section
      id="volunteer"
      aria-labelledby="work-with-us-title"
      className="scroll-mt-24 space-y-7 sm:space-y-9"
    >
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-plum/10 px-3 py-1 text-xs font-bold tracking-wide text-plum">
          <HiHandRaised className="h-3.5 w-3.5" aria-hidden="true" />
          Work With Us
        </span>
        <h2
          id="work-with-us-title"
          className="text-2xl font-black tracking-tight text-body-dark sm:text-3xl"
        >
          Help shape SpellyCraft
        </h2>
        <p className="text-sm leading-relaxed text-muted-label sm:text-base">
          SpellyCraft is built by a student and fellow English learner dedicated to making
          high-quality English grammar and spelling practice accessible to learners
          worldwide. Because maintaining, updating, and building new features continuously
          as a solo student developer is challenging, we are looking for passionate
          volunteers to help shape the platform.
        </p>
        <p className="text-sm leading-relaxed text-muted-label sm:text-base">
          If you appreciate this mission and would love to contribute, fill out the form
          below, customize your application message in the live preview, and submit
          directly. Every applicant will receive a prompt response.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <HiSparkles className="h-4 w-4 text-plum" aria-hidden="true" />
          <h3 className="text-base font-black text-body-dark sm:text-lg">
            How you will benefit
          </h3>
        </div>
        <VolunteerBenefitsGrid />
      </div>
      {/*  */}
      <VolunteerCompensationNotice />
      <div className="space-y-3">
        <h3 className="text-base font-black text-body-dark sm:text-lg">
          Contributor pathways
        </h3>
        <ContributorPathways />
      </div>

      <div className="space-y-4">
        <div className="border-t border-plum/15 pt-6">
          <h3 className="text-lg font-black text-body-dark sm:text-xl">
            Apply to volunteer
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-label sm:text-sm">
            Fields marked with <span className="text-rose-500">*</span> are required. The
            live preview on the right is editable, and the signature stays in sync with
            your details.
          </p>
        </div>
        <VolunteerApplicationForm />
      </div>

      <p className="rounded-xl border border-plum/15 bg-plum/5 px-4 py-3 text-center text-xs leading-relaxed text-muted-label">
        Not able to volunteer right now?{" "}
        <button
          type="button"
          onClick={onDonate}
          className="inline-flex min-h-11 items-center gap-1.5 font-bold text-plum underline decoration-plum/30 underline-offset-4 transition hover:text-plum-hover"
        >
          <HiHeart className="h-3.5 w-3.5" aria-hidden="true" />
          Support the project with a donation
        </button>
      </p>
    </section>
  );
}
