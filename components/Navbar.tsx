"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

// ─── SVG icon helpers ────────────────────────────────────────────────────────

function IconLog({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-colors ${active ? "text-white" : "text-slate-400"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-colors ${active ? "text-white" : "text-slate-400"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5h7.5V3H3v10.5ZM13.5 21H21v-7.5h-7.5V21ZM3 21h7.5v-4.5H3V21ZM13.5 3v7.5H21V3h-7.5Z"
      />
    </svg>
  );
}

function IconAnalytics({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-colors ${active ? "text-white" : "text-slate-400"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v18h18M7 16l4-4 4 4 4-6"
      />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-colors ${active ? "text-white" : "text-slate-400"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
      />
    </svg>
  );
}

// ─── Nav items config ─────────────────────────────────────────────────────────

const navItems = [
  { href: "/log",       label: "Log",       Icon: IconLog },
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/analytics", label: "Analytics", Icon: IconAnalytics },
  { href: "/settings",  label: "Settings",  Icon: IconSettings },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const [signing, setSigning] = useState(false);

  const handleSignOut = async () => {
    setSigning(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* ── Desktop top nav (md and above) ───────────────────────────────── */}
      <nav className="hidden md:block sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-semibold text-white tracking-tight">
              Expense<span className="text-brand-400">Tracker</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              disabled={signing}
              className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {signing ? "..." : "Sign out"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav (below md) ─────────────────────────────────── */}
      <nav
        className="
          md:hidden
          fixed bottom-0 left-0 right-0 z-50
          flex items-center justify-around
          px-2 py-2
          border-t border-white/10
          bg-slate-950/60
          backdrop-blur-xl
          shadow-[0_-8px_32px_rgba(0,0,0,0.5)]
        "
        style={{
          /* extra glass sheen via inline style for wider browser support */
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(30,27,75,0.68) 100%)",
        }}
      >
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 active:scale-95"
              aria-label={label}
            >
              <Icon active={active} />
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors ${
                  active ? "text-white" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          disabled={signing}
          aria-label="Sign out"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40"
        >
          <span className="flex items-center justify-center px-4 py-1 text-slate-400">
            <IconSignOut />
          </span>
          <span className="text-[10px] font-medium tracking-wide text-slate-500">
            {signing ? "..." : "Out"}
          </span>
        </button>
      </nav>
    </>
  );
}
