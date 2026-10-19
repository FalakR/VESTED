"""Loads curated lessons from content/lessons/*.md (simple `key: value` frontmatter)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

LESSONS_DIR = Path(__file__).resolve().parents[3] / "content" / "lessons"


class Lesson(BaseModel):
    slug: str
    title: str
    topic: str
    status: str  # "draft" until sources are verified by a human reviewer
    reviewed_at: str | None
    sources: list[str]  # "Publisher - URL"; empty while draft
    content_md: str


def _parse(path: Path) -> Lesson:
    raw = path.read_text(encoding="utf-8")
    _, front, body = raw.split("---", 2)
    meta: dict[str, str] = {}
    for line in front.strip().splitlines():
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    sources = [s.strip() for s in meta.get("sources", "").split(";") if s.strip()]
    return Lesson(
        slug=meta["slug"],
        title=meta["title"],
        topic=meta["topic"],
        status=meta.get("status", "draft"),
        reviewed_at=meta.get("reviewed_at") or None,
        sources=sources,
        content_md=body.strip(),
    )


@lru_cache(maxsize=1)
def all_lessons() -> dict[str, Lesson]:
    return {l.slug: l for l in (_parse(p) for p in sorted(LESSONS_DIR.glob("*.md")))}
