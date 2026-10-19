import { Suspense } from "react";
import LessonView from "@/components/LessonView";

async function Lesson({ params }: Pick<PageProps<"/learn/[slug]">, "params">) {
  const { slug } = await params;
  return <LessonView slug={slug} />;
}

export default function LessonPage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Lesson params={params} />
    </Suspense>
  );
}
