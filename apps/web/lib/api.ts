const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SimInput = {
  initial_balance: number;
  monthly_contribution: number;
  years: number;
  annual_nominal_return: number;
  break_start_month: number;
  break_months: number;
  age?: number | null;
};

export type SeriesPoint = { year: number; balance: number; contributions: number; modeled_growth: number };
export type Scenario = {
  ending_balance: number;
  total_contributions: number;
  modeled_growth: number;
  annual_series: SeriesPoint[];
};
export type SimResult = Scenario & {
  baseline: Scenario;
  difference_from_baseline: number;
  break_presets: { break_months: number; ending_balance: number; difference_from_baseline: number }[];
  end_age: number | null;
  assumptions: Record<string, string | number | boolean>;
  calculation_version: string;
  disclaimer: string;
};

export type LessonSummary = { slug: string; title: string; topic: string; status: string; reviewed_at: string | null };
export type Lesson = LessonSummary & { sources: string[]; content_md: string };

export type ChatResult = {
  answer: string;
  key_terms: string[];
  lesson_links: string[];
  check_your_understanding: string | null;
  refused: boolean;
  disclaimer: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const runSimulation = (input: SimInput, signal?: AbortSignal) =>
  call<SimResult>("/api/v1/simulations/run", { method: "POST", body: JSON.stringify(input), signal });

export const listLessons = () => call<LessonSummary[]>("/api/v1/lessons");
export const getLesson = (slug: string) => call<Lesson>(`/api/v1/lessons/${encodeURIComponent(slug)}`);

export const chat = (message: string, scenario?: SimInput | null) =>
  call<ChatResult>("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message, scenario: scenario ?? undefined }),
  });

export const cad = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
