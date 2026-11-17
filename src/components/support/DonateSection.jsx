/**
 * Donate section (src/components/support/DonateSection.jsx)
 * The "Donate" tab of the Support Us page: where contributions go, the
 * international payment options, and the Bangladesh mobile banking details.
 */
import { useState } from "react";
import {
  HiCheck,
  HiClipboardDocument,
  HiCloud,
  HiHandRaised,
  HiHeart,
  HiLanguage,
  HiSpeakerWave,
  HiSparkles,
} from "react-icons/hi2";
import { SiBuymeacoffee, SiPaypal } from "react-icons/si";
import { showSuccessToast } from "../../utils/sweetalert";

const BD_METHODS = [
  {
    id: "bkash",
    name: "bKash",
    number: "0000000000",
    type: "Send Money",
    note: "Use 'SpellyCraft' in reference",
    tagColor: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    id: "nagad",
    name: "Nagad",
    number: "0000000000",
    type: "Send Money",
    note: "Use 'SpellyCraft' in reference",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "rocket",
    name: "Rocket",
    number: "0000000000-0",
    type: "Send Money",
    note: "Use *322# or app",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const IMPACT_ITEMS = [
  {
    icon: HiSpeakerWave,
    title: "Neural voice audio",
    text: "Natural pronunciation for every word and spelling drill.",
  },
  {
    icon: HiCloud,
    title: "Servers & database",
    text: "Keeps your progress synced online and always available.",
  },
  {
    icon: HiLanguage,
    title: "New IELTS content",
    text: "Fresh vocabulary sets, grammar lessons, and spelling lists.",
  },
  {
    icon: HiHeart,
    title: "Free for everyone",
    text: "No ads, no paywalls, and no locked lessons. Ever.",
  },
];

export default function DonateSection({ onVolunteer }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (id, text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      showSuccessToast("Copied!", `${text} copied to clipboard.`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Clipboard access can be blocked; the number stays visible to copy by hand.
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Where the money goes */}
      <section aria-labelledby="impact-title" className="space-y-3">
        <div className="flex flex-col gap-1">
          <h2
            id="impact-title"
            className="text-lg font-black text-body-dark sm:text-xl"
          >
            Where your support goes
          </h2>
          <p className="text-sm text-muted-label">
            SpellyCraft is free for every learner. Contributions cover the running
            costs that keep it that way.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {IMPACT_ITEMS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="imlaa-card flex flex-col gap-2.5 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/10 text-plum">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-bold text-body-dark">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-label">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Payment options */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 md:items-start">
        {/* International */}
        <section
          aria-labelledby="international-title"
          className="imlaa-card space-y-4 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 border-b border-plum/10 pb-2">
            <HiSparkles className="h-4 w-4 text-plum" aria-hidden="true" />
            <h2
              id="international-title"
              className="text-base font-bold text-body-dark sm:text-lg"
            >
              International
            </h2>
          </div>

          <div className="space-y-3">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 items-center justify-between rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 transition hover:bg-amber-100 sm:p-4"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400 font-bold text-stone-900">
                  <SiBuymeacoffee className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-stone-900">
                    Buy Me a Coffee
                  </span>
                  <span className="block text-xs text-stone-600">
                    Card, Apple Pay, Google Pay
                  </span>
                </span>
              </span>
              <span className="ml-2 shrink-0 text-xs font-bold text-amber-800 transition group-hover:translate-x-0.5">
                Contribute →
              </span>
            </a>

            <a
              href="https://paypal.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 transition hover:bg-sky-100 sm:p-4"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 font-bold text-white">
                  <SiPaypal className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-stone-900">
                    PayPal
                  </span>
                  <span className="block text-xs text-stone-600">
                    Direct wallet / card payment
                  </span>
                </span>
              </span>
              <span className="ml-2 shrink-0 text-xs font-bold text-sky-800 transition group-hover:translate-x-0.5">
                Contribute →
              </span>
            </a>
          </div>
        </section>

        {/* Bangladesh */}
        <section
          aria-labelledby="bangladesh-title"
          className="imlaa-card space-y-4 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 border-b border-plum/10 pb-2">
            <span aria-hidden="true" className="text-sm">
              🇧🇩
            </span>
            <h2
              id="bangladesh-title"
              className="text-base font-bold text-body-dark sm:text-lg"
            >
              Mobile Banking (Bangladesh)
            </h2>
          </div>

          <div className="space-y-2.5">
            {BD_METHODS.map((method) => (
              <div
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-plum/15 bg-plum/5 p-3 sm:flex-nowrap sm:p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-body-dark">
                      {method.name}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${method.tagColor}`}
                    >
                      {method.type}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-sm font-bold tracking-wide text-plum sm:text-base">
                    {method.number}
                  </div>
                  <div className="truncate text-[11px] text-muted-label">
                    {method.note}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(method.id, method.number)}
                  className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-plum/25 bg-white px-3 py-1.5 text-xs font-semibold text-plum shadow-xs transition hover:bg-plum/10 active:scale-95"
                >
                  {copiedId === method.id ? (
                    <>
                      <HiCheck
                        className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <HiClipboardDocument
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-relaxed text-muted-label">
            Mobile banking transfers are the cheapest option for supporters inside
            Bangladesh.
          </p>
        </section>
      </div>

      {/* Closing note + cross-link */}
      <div className="rounded-2xl border border-plum/15 bg-plum/5 p-4 text-center sm:p-5">
        <p className="text-xs leading-relaxed text-muted-label sm:text-sm">
          Any amount helps maintain database servers and voice generation for
          students in need. Contributions are voluntary and never unlock extra
          lessons.
        </p>
        <button
          type="button"
          onClick={onVolunteer}
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-plum/25 bg-white px-4 text-sm font-semibold text-plum transition hover:bg-plum/10"
        >
          <HiHandRaised className="h-4 w-4" aria-hidden="true" />
          Rather give your time? Work with us
        </button>
      </div>
    </div>
  );
}
