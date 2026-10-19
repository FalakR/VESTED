"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProfile, saveScenario, DEMO_SCENARIO, type Profile } from "@/lib/storage";

const GOALS = ["Financial independence", "First investment", "Emergency savings", "Retirement", "Major purchase"];
const TOTAL = 4;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [p, setP] = useState<Profile>({
    goals: [],
    experience: "new",
    confidence: 3,
    learning: "read",
    canadianContext: true,
    age: null,
  });
  const [monthly, setMonthly] = useState("");
  const [balance, setBalance] = useState("");

  const toggleGoal = (g: string) =>
    setP((s) => ({ ...s, goals: s.goals.includes(g) ? s.goals.filter((x) => x !== g) : [...s.goals, g] }));

  function finish() {
    saveProfile(p);
    saveScenario({
      ...DEMO_SCENARIO,
      age: p.age,
      initial_balance: balance ? Math.max(0, Number(balance)) : DEMO_SCENARIO.initial_balance,
      monthly_contribution: monthly ? Math.max(0, Number(monthly)) : DEMO_SCENARIO.monthly_contribution,
    });
    router.push("/home");
  }

  return (
    <main id="main" className="mx-auto max-w-xl p-5 py-10">
      <h1 className="text-3xl font-semibold">Build a plan that feels like yours</h1>
      <p className="mt-2 text-muted">
        Everything here is optional and stays in your browser in demo mode. We never ask for your SIN, banking
        login or income proof.
      </p>
      <p className="mt-6 text-sm font-medium" aria-live="polite">
        Step {step} of {TOTAL}
      </p>
      <div className="mt-1 h-2 rounded-full bg-border" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label="Onboarding progress">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      <div className="card mt-6">
        {step === 1 && (
          <fieldset>
            <legend className="text-lg font-semibold">What are you working toward?</legend>
            <p className="mb-3 text-sm text-muted">Why we ask: to suggest relevant lessons. Pick any.</p>
            {GOALS.map((g) => (
              <label key={g} className="flex min-h-11 items-center gap-3">
                <input type="checkbox" className="size-5 accent-primary" checked={p.goals.includes(g)} onChange={() => toggleGoal(g)} />
                {g}
              </label>
            ))}
          </fieldset>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-lg font-semibold">Your investing experience</legend>
              {(["new", "some", "confident"] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-3 capitalize">
                  <input type="radio" name="exp" className="size-5 accent-primary" checked={p.experience === v} onChange={() => setP({ ...p, experience: v })} />
                  {v}
                </label>
              ))}
            </fieldset>
            <label className="block">
              <span className="font-medium">How confident do you feel about investing? (1 to 5, subjective)</span>
              <input type="range" min={1} max={5} value={p.confidence} onChange={(e) => setP({ ...p, confidence: Number(e.target.value) })} className="mt-2 w-full accent-primary" />
              <span className="text-sm text-muted">Selected: {p.confidence}</span>
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-lg font-semibold">How do you like to learn?</legend>
              {(["read", "visual", "conversational"] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-3 capitalize">
                  <input type="radio" name="learn" className="size-5 accent-primary" checked={p.learning === v} onChange={() => setP({ ...p, learning: v })} />
                  {v}
                </label>
              ))}
            </fieldset>
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5 accent-primary" checked={p.canadianContext} onChange={(e) => setP({ ...p, canadianContext: e.target.checked })} />
              Include Canadian context (TFSA, RRSP and similar terms)
            </label>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Optional: starting numbers (hypothetical)</h2>
            <p className="text-sm text-muted">
              Used only to pre-fill your Future You simulation. Skip any or all and we will use an example scenario.
            </p>
            <label className="block">
              Age
              <input className="field mt-1" inputMode="numeric" value={p.age ?? ""} onChange={(e) => setP({ ...p, age: e.target.value ? Math.min(120, Number(e.target.value) || 0) || null : null })} />
            </label>
            <label className="block">
              Starting balance (CAD, hypothetical)
              <input className="field mt-1" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <label className="block">
              Monthly amount (CAD, hypothetical)
              <input className="field mt-1" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={step === 1}>
          Back
        </button>
        {step < TOTAL ? (
          <button className="btn" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button className="btn" onClick={finish}>
            See my journey
          </button>
        )}
      </div>
    </main>
  );
}
