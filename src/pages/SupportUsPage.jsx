import { useSearchParams, useNavigate } from "react-router";
import { HiArrowLeft, HiHandRaised, HiHeart } from "react-icons/hi2";
import MinimalFooter from "../components/MinimalFooter";
import DonateSection from "../components/support/DonateSection";
import WorkWithUsSection from "../components/support/WorkWithUsSection";
import { Helmet } from "react-helmet-async";

const SUPPORT_TABS = [
  {
    id: "donate",
    label: "Donate",
    icon: HiHeart,
    tagline:
      "Your contributions directly support cloud servers and Neural TTS voice synthesis for English learners.",
  },
  {
    id: "volunteer",
    label: "Work with Us",
    icon: HiHandRaised,
    tagline:
      "Lend your development or English-teaching skills and help shape the next version of SpellyCraft.",
  },
];

const SUPPORT_TAB_IDS = new Set(SUPPORT_TABS.map(({ id }) => id));

export default function SupportUsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  // Deep links such as /support-us#volunteer should still open the volunteer tab.
  const hashTab =
    typeof window !== "undefined" && window.location.hash === "#volunteer"
      ? "volunteer"
      : null;
  const activeTab = SUPPORT_TAB_IDS.has(requestedTab)
    ? requestedTab
    : hashTab || "donate";
  const activeConfig =
    SUPPORT_TABS.find(({ id }) => id === activeTab) || SUPPORT_TABS[0];

  const selectTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const handleTabKeyDown = (event, currentIndex) => {
    let nextIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % SUPPORT_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + SUPPORT_TABS.length) % SUPPORT_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = SUPPORT_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = SUPPORT_TABS[nextIndex];
    selectTab(nextTab.id);
    document.getElementById(`support-tab-${nextTab.id}`)?.focus();
  };

  return (
    <>
      <Helmet>
        <title>Support SpellyCraft | Donate or Volunteer</title>
        <meta
          name="description"
          content="Support SpellyCraft's mission to provide free, high-quality IELTS vocabulary and spelling mastery tools. Donate, or volunteer in software development or English linguistics."
        />
        <meta
          name="keywords"
          content="Support SpellyCraft, donate IELTS learning platform, volunteer developer, English linguistics volunteer, academic IELTS candidates, lexical mastery workspace, phonemic speech synthesis, vocabulary building tools"
        />
        <meta property="og:title" content="Support SpellyCraft | Donate or Volunteer" />
        <meta
          property="og:description"
          content="Support SpellyCraft's mission to provide free, high-quality IELTS vocabulary and spelling mastery tools."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.spellycraft.com/support-us" />
        <meta property="og:image" content="https://www.spellycraft.com/logo192.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Support SpellyCraft | Donate or Volunteer"
        />
        <meta
          name="twitter:description"
          content="Support SpellyCraft's mission to provide free, high-quality IELTS vocabulary and spelling mastery tools."
        />
        <meta name="twitter:image" content="https://www.spellycraft.com/logo192.png" />
      </Helmet>

      <div className="flex min-h-screen flex-col justify-between overflow-x-hidden bg-white text-body-dark">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-plum/15 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 items-center gap-2 px-1 font-semibold text-plum transition hover:text-plum-hover"
            >
              <HiArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Go Back</span>
            </button>
            <div className="flex items-center gap-2 text-xl font-black tracking-tight text-plum">
              <span>SpellyCraft</span>
              <span className="inline-block h-2 w-2 rounded-full bg-plum" aria-hidden="true" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 animate-slide-up space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-12">
          {/* Hero */}
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-plum/10 px-3 py-1 text-xs font-bold tracking-wide text-plum">
              <HiHeart className="h-3.5 w-3.5" aria-hidden="true" />
              Support The Platform
            </span>
            <h1 className="text-2xl font-black tracking-tight text-body-dark wrap-break-word sm:text-4xl">
              Support SpellyCraft
            </h1>
            <p
              key={activeConfig.id}
              className="text-sm leading-relaxed text-muted-label sm:text-base"
            >
              {activeConfig.tagline}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mx-auto w-full max-w-md">
            <div
              role="tablist"
              aria-label="Support SpellyCraft"
              className="flex gap-1 rounded-2xl border border-plum/15 bg-plum/5 p-1.5"
            >
              {SUPPORT_TABS.map(({ id, label, icon: Icon }, index) => {
                const selected = activeTab === id;
                return (
                  <button
                    key={id}
                    id={`support-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`support-panel-${id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectTab(id)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition sm:text-base ${
                      selected
                        ? "bg-white text-plum shadow-sm ring-1 ring-plum/10"
                        : "text-muted-label hover:bg-white/60 hover:text-body-dark"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panels — both stay mounted so a half-filled application survives a tab switch */}
          {SUPPORT_TABS.map(({ id }) => (
            <div
              key={id}
              id={`support-panel-${id}`}
              role="tabpanel"
              aria-labelledby={`support-tab-${id}`}
              tabIndex={0}
              hidden={activeTab !== id}
              className="focus-visible:outline-none"
            >
              {id === "donate" ? (
                <DonateSection onVolunteer={() => selectTab("volunteer")} />
              ) : (
                <WorkWithUsSection onDonate={() => selectTab("donate")} />
              )}
            </div>
          ))}
        </main>

        <MinimalFooter />
      </div>
    </>
  );
}
