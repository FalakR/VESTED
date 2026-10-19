"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listLessons, type LessonSummary } from "@/lib/api";

export default function Learn() {
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listLessons().then(setLessons).catch(() => setError(true));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Learning Hub</h1>
      {error && <p role="alert" className="card text-warning">Couldn&apos;t load lessons. Is the API running?</p>}
      {!lessons && !error && <p className="text-muted">Loading lessons…</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {lessons?.map((l) => (
          <li key={l.slug} className="card">
            <p className="text-sm text-muted capitalize">{l.topic}</p>
            <h2 className="font-semibold">
              <Link href={`/learn/${l.slug}`} className="text-primary underline">
                {l.title}
              </Link>
            </h2>
            {l.status === "draft" && <p className="mt-1 text-sm text-warning">Draft: sources not yet reviewed</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
