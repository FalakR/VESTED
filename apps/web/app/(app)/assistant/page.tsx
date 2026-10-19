"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chat, type ChatResult } from "@/lib/api";
import { loadScenario } from "@/lib/storage";

type Msg = { role: "user"; text: string } | { role: "assistant"; r: ChatResult } | { role: "error"; text: string };

const CHIPS = ["What is an ETF?", "Explain my scenario", "What is diversification?"];

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await chat(q, loadScenario());
      setMsgs((m) => [...m, { role: "assistant", r }]);
    } catch {
      setMsgs((m) => [...m, { role: "error", text: "The assistant is unavailable right now. Try the Learn section in the meantime." }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && !started.current) {
      started.current = true;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Ask HerVest</h1>
      <p className="font-medium text-warning">Education, not financial advice.</p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button key={c} className="btn-secondary" onClick={() => send(c)} disabled={busy}>
            {c}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="space-y-3">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-white">
              {m.text}
            </p>
          ) : m.role === "error" ? (
            <p key={i} role="alert" className="card text-warning">
              {m.text}
            </p>
          ) : (
            <div key={i} className="card space-y-2">
              <p>{m.r.answer}</p>
              {m.r.key_terms.length > 0 && <p className="text-sm text-muted">Key terms: {m.r.key_terms.join(", ")}</p>}
              {m.r.lesson_links.length > 0 && (
                <p className="text-sm">
                  Learn more:{" "}
                  {m.r.lesson_links.map((s) => (
                    <Link key={s} href={`/learn/${s}`} className="mr-3 text-primary underline">
                      {s.replace(/-/g, " ")}
                    </Link>
                  ))}
                </p>
              )}
              {m.r.check_your_understanding && (
                <p className="text-sm">
                  <strong>Check your understanding:</strong> {m.r.check_your_understanding}
                </p>
              )}
            </div>
          ),
        )}
        {busy && <p className="text-muted">Thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor="q">
          Your question
        </label>
        <input id="q" className="field" maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question about investing basics" />
        <button className="btn" disabled={busy}>
          Send
        </button>
      </form>
      <p className="text-sm text-muted">Please don&apos;t share account numbers, passwords or your SIN.</p>
    </div>
  );
}
