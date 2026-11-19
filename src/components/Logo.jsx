import { Link } from "react-router";

function Logo() {
  return (
    <Link
      to="/"
      aria-label="SpellyCraft home"
      className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg text-body-dark"
    >
      <img
        src="/logo192.png"
        alt=""
        width="40"
        height="40"
        className="h-10 w-10 rounded-xl"
      />
      <span className="text-lg font-black tracking-tight">SpellyCraft</span>
    </Link>
  );
}

export default Logo;
