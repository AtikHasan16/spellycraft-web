import { Link } from "react-router";
import Logo from "./Logo";

const links = [
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/workspace/community", label: "Community" },
  { to: "/support-us", label: "Support" },
];

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
