import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { HiBars3, HiOutlineUserCircle, HiXMark } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
  { to: "/pricing", label: "Pricing" },
  { to: "/support-us", label: "Support Us" },
];

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < 40 || currentY < lastScrollY.current);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountActions = isAuthenticated ? (
    <>
      <Link
        to="/workspace/flashcard"
        className="imlaa-btn-primary min-h-11 rounded-full px-5 text-sm font-bold"
      >
        Workspace
      </Link>
      <details className="dropdown dropdown-end relative">
        <summary
          aria-label="Profile menu"
          className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full border border-plum/20 text-plum hover:bg-plum/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
        >
          <HiOutlineUserCircle aria-hidden="true" className="h-6 w-6" />
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl theme-floating-panel p-2 shadow-lg">
          <Link
            to="/workspace/profile"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-plum/5"
          >
            Profile
          </Link>
          <Link
            to="/workspace/flashcard"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-plum/5"
          >
            Flashcards
          </Link>
          <Link
            to="/workspace/spelling"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-plum/5"
          >
            Spelling
          </Link>
          <Link
            to="/workspace/grammar"
            className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-plum/5"
          >
            Grammar
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-red-700 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </details>
    </>
  ) : loading ? null : (
    <>
      <Link
        to="/login"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-plum/20 px-5 text-sm font-semibold text-plum hover:bg-plum/5"
      >
        Sign in
      </Link>
      <Link
        to="/register"
        className="imlaa-btn-primary min-h-11 rounded-full px-5 text-sm font-bold"
      >
        Create account
      </Link>
    </>
  );

  return (
    <>
      <header
        className={`fixed left-1/2 top-3 z-40 w-full max-w-6xl -translate-x-1/2 px-4 transition-transform duration-300 sm:px-6 ${visible ? "translate-y-0" : "translate-y-[-150%]"}`}
      >
        <div className="rounded-2xl border theme-navbar shadow-md backdrop-blur-xs">
          <div className="flex min-h-18 items-center justify-between gap-4 px-4 sm:px-6">
            <Logo></Logo>
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 lg:flex"
            >
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-label hover:bg-plum/5 hover:text-plum"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              {accountActions}
            </div>
            <button
              type="button"
              aria-label={
                mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-plum/20 text-plum lg:hidden"
            >
              {mobileMenuOpen ? (
                <HiXMark aria-hidden="true" className="h-5 w-5" />
              ) : (
                <HiBars3 aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="border-t border-plum/10 px-4 pb-4 pt-2 lg:hidden">
              <nav aria-label="Mobile main navigation" className="flex flex-col">
                {links.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-label hover:bg-plum/5 hover:text-plum"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {accountActions}
              </div>
            </div>
          )}
        </div>
      </header>
      <div aria-hidden="true" className="h-24 shrink-0" />
    </>
  );
}
