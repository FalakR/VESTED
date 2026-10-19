import Link from "next/link";
import { Suspense } from "react";
import Nav from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex">
      <Suspense fallback={<div className="md:w-56" />}>
        <Nav />
      </Suspense>
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 p-4 pb-28 md:p-8">
        {children}
        <p className="mt-10 text-sm text-muted">
          HerVest is for education only. Simulations are hypothetical, not forecasts, and not financial advice.
        </p>
      </main>
      <Link
        href="/assistant"
        className="btn fixed bottom-20 right-4 z-10 shadow-lg md:bottom-6 md:right-6"
        aria-label="Ask HerVest, the education assistant"
      >
        Ask HerVest
      </Link>
    </div>
  );
}
