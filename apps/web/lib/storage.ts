import type { SimInput } from "./api";

// Demo mode: everything stays in this browser's localStorage. Nothing is sent to the server.
export type Profile = {
  goals: string[];
  experience: "new" | "some" | "confident";
  confidence: number;
  learning: "read" | "visual" | "conversational";
  canadianContext: boolean;
  age: number | null;
};

const PROFILE = "hervest.profile";
const SCENARIO = "hervest.scenario";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const loadProfile = () => read<Profile>(PROFILE);
export const saveProfile = (p: Profile) => localStorage.setItem(PROFILE, JSON.stringify(p));
export const clearAll = () => {
  localStorage.removeItem(PROFILE);
  localStorage.removeItem(SCENARIO);
};
export const loadScenario = () => read<SimInput>(SCENARIO);
export const saveScenario = (s: SimInput) => localStorage.setItem(SCENARIO, JSON.stringify(s));

export const DEMO_SCENARIO: SimInput = {
  initial_balance: 1000,
  monthly_contribution: 200,
  years: 20,
  annual_nominal_return: 0.05,
  break_start_month: 60,
  break_months: 24,
  age: 24,
};
