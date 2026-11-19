import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HiArrowDownTray } from "react-icons/hi2";
import Logo from "./Logo";

const links = [
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/workspace/community", label: "Community" },
  { to: "/support-us", label: "Support" },
];

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    const standalone = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(standalone.matches);

    setInstalled(standalone.matches || window.navigator.standalone === true);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    standalone.addEventListener?.("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      standalone.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "dismissed") setShowInstructions(true);
    } catch {
      setShowInstructions(true);
    } finally {
      setInstallPrompt(null);
    }
  };

  if (installed) return null;

  const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instructions = isAppleMobile
    ? "In Safari, tap Share, then Add to Home Screen."
    : "Use your browser menu and choose Install app or Add to Home screen.";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-plum/25 bg-white px-4 text-sm font-semibold text-plum shadow-sm transition hover:bg-plum/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
      >
        <HiArrowDownTray aria-hidden="true" className="h-4 w-4" />
        Install app
      </button>
      {showInstructions && (
        <p role="status" className="max-w-xs text-center text-xs text-muted-label">
          {instructions}
        </p>
      )}
    </div>
  );
}

export default function MinimalFooter() {
  return (
    <footer className="mt-auto w-full border-t border-plum/15 py-9 text-muted-label sm:py-3">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo></Logo>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-1 sm:justify-end sm:gap-x-2"
          >
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex min-h-11 items-center rounded px-2 text-sm text-muted-label transition-colors duration-150 hover:text-plum hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
              >
                {label}
              </Link>
            ))}
          </nav>
          <InstallAppButton />
        </div>

        <div className="my-2 border-t border-plum/10 sm:my-3" />

        <div className="flex flex-col items-center gap-2 text-center text-xs leading-5 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} SpellyCraft. All rights reserved.</p>
          <p className="text-balance sm:whitespace-nowrap">
            <span className="whitespace-nowrap">
              Speech by Microsoft Edge TTS <span className=" font-bold">· </span>
            </span>
            <span className="whitespace-nowrap">AI by Google Gemini and NVIDIA NIM</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
