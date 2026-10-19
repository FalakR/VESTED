"use client";

import { useState } from "react";
import { clearAll } from "@/lib/storage";

export default function Profile() {
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Profile and privacy</h1>
      <section className="card">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-muted">
          In demo mode your answers and scenario are stored only in this browser. Nothing is sent to a server except
          the numbers needed to run a simulation or answer an assistant question.
        </p>
        <button
          className="btn-secondary mt-3"
          onClick={() => {
            clearAll();
            setDone(true);
          }}
        >
          Delete my demo data
        </button>
        <p role="status" className="mt-2 text-sm text-success">
          {done ? "Demo data deleted from this browser." : ""}
        </p>
      </section>
    </div>
  );
}
