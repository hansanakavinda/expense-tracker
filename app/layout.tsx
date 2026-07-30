import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Personal daily expense tracking app — fast, simple, mobile-friendly.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased font-sans">
        <SessionProvider session={session}>
          {session && <Navbar />}
          <main className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
