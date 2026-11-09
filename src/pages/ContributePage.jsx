import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  HiBugAnt,
  HiCodeBracket,
  HiShieldCheck,
  HiUserGroup,
  HiLightBulb,
} from "react-icons/hi2";
import CommunityRequests from "../features/community/CommunityRequests";
import CommunityOverview from "../features/community/CommunityOverview";
import {
  DeveloperDirectory,
  VerifiedContributors,
} from "../features/community/CommunityHighlights";
import DeveloperWorkspacePage from "./DeveloperWorkspacePage";

const COMMUNITY_TABS = [
  { id: "overview", label: "Overview", icon: HiLightBulb },
  { id: "community", label: "Community board", icon: HiBugAnt },
  { id: "requests", label: "Your request status", icon: HiShieldCheck },
  { id: "developer", label: "Developer collaboration", icon: HiCodeBracket },
  { id: "developers", label: "Opt-in collaboration", icon: HiUserGroup },
  { id: "contributors", label: "Recognition by evidence", icon: HiShieldCheck },
];
const COMMUNITY_TAB_IDS = new Set(COMMUNITY_TABS.map(({ id }) => id));

export default function ContributePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestOpenSignal, setRequestOpenSignal] = useState(0);
  const [requestOpenType, setRequestOpenType] = useState("feature");
  const requestedTab = searchParams.get("tab");
  const activeTab = COMMUNITY_TAB_IDS.has(requestedTab)
    ? requestedTab
    : searchParams.has("compose")
      ? "community"
      : searchParams.has("hire")
      ? "developers"
      : "overview";

  const selectTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const openRequestForm = (requestType) => {
    setRequestOpenType(requestType);
    selectTab("community");
    setRequestOpenSignal((signal) => signal + 1);
  };

  const handleTabKeyDown = (event, currentIndex) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % COMMUNITY_TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + COMMUNITY_TABS.length) % COMMUNITY_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = COMMUNITY_TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = COMMUNITY_TABS[nextIndex];
    selectTab(nextTab.id);
    document.getElementById(`community-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div className="w-full space-y-4 bg-white text-body-dark">
      <header className="flex flex-col gap-3 border-b border-plum-border/35 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-plum">SpellyCraft community</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-body-dark sm:text-3xl">Community &amp; development</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openRequestForm("feature")} className="imlaa-btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold">
            <HiLightBulb className="h-4 w-4" aria-hidden="true" />
            Suggest a feature
          </button>
          <button type="button" onClick={() => openRequestForm("bug")} className="imlaa-btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold">
            <HiBugAnt className="h-4 w-4" aria-hidden="true" />
            Report a problem
          </button>
        </div>
      </header>

      <section aria-label="Community sections">
        <div role="tablist" aria-label="Community sections" className="sticky top-0 z-30 -mx-3 flex gap-2 overflow-x-auto border-b border-plum-border/35 bg-white/95 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          {COMMUNITY_TABS.map(({ id, label, icon: Icon }, index) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                id={`community-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`community-panel-${id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                  selected
                    ? "border-plum bg-plum text-white"
                    : "border-plum-border/40 bg-white text-muted-label hover:border-plum/40 hover:text-body-dark"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div
          id={`community-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`community-tab-${activeTab}`}
          tabIndex={0}
          className="pt-4"
        >
          {activeTab === "overview" && <CommunityOverview />}
          {activeTab === "community" && (
            <CommunityRequests
              view="board"
              openRequestSignal={requestOpenSignal}
              openRequestType={requestOpenType}
            />
          )}
          {activeTab === "requests" && <CommunityRequests view="mine" />}
          {activeTab === "developer" && <DeveloperWorkspacePage />}
          {activeTab === "developers" && <DeveloperDirectory />}
          {activeTab === "contributors" && <VerifiedContributors />}
        </div>
      </section>
    </div>
  );
}
