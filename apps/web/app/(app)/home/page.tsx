"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cad } from "@/lib/api";
import { loadProfile, loadScenario, type Profile } from "@/lib/storage";
import type { SimInput } from "@/lib/api";

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scenario, setScenario] = useState<SimInput | null>(null);

  useEffect(() => {
    // localStorage is browser-only, so hydrate once on mount rather than during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setScenario(loadScenario());
  }, []);

  const goals = profile?.goals.length ? profile.goals : ["First investment"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Your Wealth Journey</h1>

      <section className="card" aria-labelledby="next">
        <h2 id="next" className="font-semibold">
          Your next best learning step
        </h2>
        <p className="mt-1 text-muted">
          {profile?.experience === "new" || !profile ? "Start with how compounding works." : "Revisit risk and diversification."}
        </p>
        <Link href={profile?.experience === "new" || !profile ? "/learn/compound-growth" : "/learn/risk-and-diversification"} className="btn mt-3">
          Open lesson
        </Link>
        {profile && (
          <p className="mt-3 text-sm text-muted" title="Self-rated, subjective">
            Confidence (self-rated, 1 to 5): {profile.confidence}. This is your own rating, not a test of knowledge.
          </p>
        )}
      </section>

      <section className="card border-primary" aria-labelledby="fy">
        <h2 id="fy" className="font-semibold">
          Meet Future You
        </h2>
        {scenario ? (
          <p className="mt-1 text-muted">
            Last scenario (hypothetical): {cad(scenario.monthly_contribution)}/month for {scenario.years} years at{" "}
            {(scenario.annual_nominal_return * 100).toFixed(1)}% assumed.
          </p>
        ) : (
          <p className="mt-1 text-muted">Example (hypothetical): {cad(50)}/month for 20 years at an assumed 5%.</p>
        )}
        <Link href={scenario ? "/future-you" : "/future-you?monthly=50"} className="btn mt-3">
          {scenario ? "Explore a possibility" : "Start with $50/month"}
        </Link>
      </section>

      <section aria-labelledby="goals">
        <h2 id="goals" className="mb-3 font-semibold">
          Your goals
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <li key={g} className="card">
              <p className="font-medium">{g}</p>
              <p className="mt-1 text-sm text-muted">Milestone: run one scenario, then read one lesson.</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="circ">
        <h2 id="circ" className="font-semibold">
          HerCircles
        </h2>
        <p className="mt-1 text-sm text-muted">
          Peer communities are coming later, once moderation is in place. Your amounts and scenarios will never be
          shared without your explicit consent.
        </p>
      </section>
    </div>
  );
}
