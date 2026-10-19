"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cad, runSimulation, type SimResult } from "@/lib/api";
import { DEMO_SCENARIO, loadScenario, saveScenario } from "@/lib/storage";

type Form = {
  age: number | null;
  initial: number;
  monthly: number;
  years: number;
  rate: number; // percent
  pauseStartYear: number;
  pauseMonths: number;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function Num({ label, value, onChange, min, max, step = 1, hint }: {
  label: string; value: number | null; onChange: (n: number) => void; min: number; max: number; step?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        className="field mt-1"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function FutureYou() {
  const [f, setF] = useState<Form>({
    age: DEMO_SCENARIO.age ?? null,
    initial: DEMO_SCENARIO.initial_balance,
    monthly: DEMO_SCENARIO.monthly_contribution,
    years: DEMO_SCENARIO.years,
    rate: DEMO_SCENARIO.annual_nominal_return * 100,
    pauseStartYear: DEMO_SCENARIO.break_start_month / 12,
    pauseMonths: DEMO_SCENARIO.break_months,
  });
  const [res, setRes] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadScenario();
    const qMonthly = new URLSearchParams(window.location.search).get("monthly");
    if (saved || qMonthly) {
      // localStorage is browser-only, so this can't be read during SSR; hydrate once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF((s) => ({
        ...s,
        ...(saved && {
          age: saved.age ?? null,
          initial: saved.initial_balance,
          monthly: saved.monthly_contribution,
          years: saved.years,
          rate: saved.annual_nominal_return * 100,
          pauseStartYear: saved.break_start_month / 12,
          pauseMonths: saved.break_months,
        }),
        ...(qMonthly && { monthly: clamp(Number(qMonthly), 0, 100000), pauseMonths: 0 }),
      }));
    }
  }, []);

  useEffect(() => {
    const input = {
      initial_balance: f.initial,
      monthly_contribution: f.monthly,
      years: f.years,
      annual_nominal_return: f.rate / 100,
      break_start_month: Math.round(f.pauseStartYear * 12),
      break_months: f.pauseMonths,
      age: f.age,
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      runSimulation(input, ctrl.signal)
        .then((r) => {
          setRes(r);
          setError(null);
          saveScenario(input);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError("We couldn't run the simulation. Is the API running on port 8000?");
        })
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [f]);

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const data = res?.annual_series.map((p, i) => ({
    year: p.year,
    scenario: p.balance,
    baseline: res.baseline.annual_series[i].balance,
    invested: p.contributions,
    gain: p.modeled_growth,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">See your future, shape your wealth</h1>
      <p className="text-muted">A hypothetical illustration with a fixed assumed rate. Not a forecast or a guarantee.</p>

      <section className="card grid gap-4 sm:grid-cols-2" aria-label="Scenario inputs">
        <Num label="Age (optional)" value={f.age} min={13} max={120} onChange={set("age")} />
        <Num label="Starting balance (CAD)" value={f.initial} min={0} max={1000000000} step={100} onChange={set("initial")} />
        <Num label="Monthly contribution (CAD)" value={f.monthly} min={0} max={10000000} step={10} onChange={set("monthly")} />
        <Num label="Years" value={f.years} min={1} max={50} onChange={set("years")} />
        <Num label="Assumed annual return (%)" value={f.rate} min={0} max={10} step={0.5} onChange={set("rate")} hint="Fixed and hypothetical. Real returns vary and can be negative." />
        <Num label="Pause length (months)" value={f.pauseMonths} min={0} max={600} onChange={set("pauseMonths")} />
        <Num label="Pause starts after year" value={f.pauseStartYear} min={0} max={50} onChange={set("pauseStartYear")} />
      </section>

      <div role="status" aria-live="polite" className="text-sm text-muted">
        {loading ? "Updating…" : ""}
      </div>
      {error && (
        <p role="alert" className="card border-warning text-warning">
          {error}
        </p>
      )}

      {res && data && (
        <>
          <section className="grid gap-3 sm:grid-cols-4" aria-label="Results">
            <div className="card">
              <p className="text-sm text-muted">Modeled balance</p>
              <p className="text-xl font-semibold">{cad(res.ending_balance)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Total contributed</p>
              <p className="text-xl font-semibold">{cad(res.total_contributions)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">{res.modeled_growth >= 0 ? "Modeled growth" : "Modeled shortfall"}</p>
              <p className="text-xl font-semibold">{cad(Math.abs(res.modeled_growth))}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">End age</p>
              <p className="text-xl font-semibold">{res.end_age ?? "n/a"}</p>
            </div>
          </section>

          <section className="card" aria-labelledby="chart-h">
            <h2 id="chart-h" className="font-semibold">
              Balance over time
            </h2>
            <p className="sr-only">
              Chart summary: after {f.years} years the scenario ends at {cad(res.ending_balance)} and the uninterrupted
              baseline at {cad(res.baseline.ending_balance)}. A data table follows the chart.
            </p>
            <div className="mt-3 h-72" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="#e9e3f0" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} width={56} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof data)[number];
                      return (
                        <div className="rounded-xl border border-border bg-surface p-3 text-sm">
                          <p className="font-semibold">Year {p.year}</p>
                          <p>Scenario: {cad(p.scenario)}</p>
                          <p>Uninterrupted: {cad(p.baseline)}</p>
                          <p>Invested: {cad(p.invested)}</p>
                          <p>{p.gain >= 0 ? "Modeled gain" : "Modeled shortfall"}: {cad(Math.abs(p.gain))}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line name="Your scenario" dataKey="scenario" stroke="#5e3b8c" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line name="Uninterrupted" dataKey="baseline" stroke="#242034" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-primary">View as a table</summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Annual modeled balances (hypothetical)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Year</th>
                      <th scope="col">Scenario</th>
                      <th scope="col">Uninterrupted</th>
                      <th scope="col">Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d) => (
                      <tr key={d.year}>
                        <th scope="row">{d.year}</th>
                        <td>{cad(d.scenario)}</td>
                        <td>{cad(d.baseline)}</td>
                        <td>{cad(d.invested)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section aria-labelledby="cmp-h">
            <h2 id="cmp-h" className="mb-3 font-semibold">
              What a pause could change
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              <li className="card">
                <p className="font-medium">Uninterrupted</p>
                <p className="text-lg font-semibold">{cad(res.baseline.ending_balance)}</p>
              </li>
              {res.break_presets.map((b) => (
                <li key={b.break_months} className="card">
                  <p className="font-medium">{b.break_months / 12}-year break</p>
                  <p className="text-lg font-semibold">{cad(b.ending_balance)}</p>
                  <p className="text-sm text-muted">{cad(b.difference_from_baseline)} lower than uninterrupted</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">
              Differences reflect both the contributions not made and the hypothetical growth those contributions
              would have had. Illustrative only.
            </p>
          </section>

          <details className="card">
            <summary className="cursor-pointer font-medium">Assumptions</summary>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">
              <li>Fixed nominal return of {f.rate}% a year, compounded monthly</li>
              <li>Contributions added at the end of each month</li>
              <li>Fees 0%, taxes and inflation not included</li>
              <li>No randomness: the same inputs always give the same result (calculation v{res.calculation_version})</li>
            </ul>
          </details>

          <p className="text-sm text-muted">{res.disclaimer}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/assistant?q=Explain my scenario" className="btn">
              Why did this change?
            </Link>
            <Link href="/learn/compound-growth" className="btn-secondary">
              Learn about compounding
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
