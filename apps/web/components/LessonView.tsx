"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLesson, type Lesson } from "@/lib/api";

function Body({ md }: { md: string }) {
  return (
    <>
      {md.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        return <p key={i}>{block}</p>;
      })}
    </>
  );
}

export default function LessonView({ slug }: { slug: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLesson(slug).then(setLesson).catch(() => setError(true));
  }, [slug]);

  if (error) return <p role="alert" className="card text-warning">Lesson not found, or the API isn&apos;t running.</p>;
  if (!lesson) return <p className="text-muted">Loading…</p>;

  return (
    <article className="space-y-4">
      <Link href="/learn" className="text-primary underline">
        ← All lessons
      </Link>
      <h1 className="text-3xl font-semibold">{lesson.title}</h1>
      {lesson.status === "draft" && (
        <p className="card border-warning text-sm text-warning">
          Draft content: not yet reviewed against official Canadian sources. Treat as general education only.
        </p>
      )}
      <div className="space-y-3 leading-relaxed">
        <Body md={lesson.content_md} />
      </div>
      <p className="text-sm text-muted">
        {lesson.sources.length ? `Sources: ${lesson.sources.join("; ")}` : "Sources: pending verification."} Reviewed:{" "}
        {lesson.reviewed_at ?? "not yet"}.
      </p>
    </article>
  );
}
