"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [signing, setSigning] = useState(false);

  const handleSignOut = async () => {
    setSigning(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">
            Expense<span className="text-brand-400">Tracker</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/log"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/log"
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Log
          </Link>
          <Link
            href="/dashboard"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/analytics"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/analytics"
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/settings"
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Settings
          </Link>
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
  );
}
