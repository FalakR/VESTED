"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/future-you", label: "Future You" },
  { href: "/learn", label: "Learn" },
  { href: "/circles", label: "Circles" },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:static md:w-56 md:flex-col md:gap-1 md:border-r md:border-t-0 md:p-4"
    >
      <span className="hidden px-3 pb-4 text-xl font-semibold text-primary md:block">HerVest</span>
      {ITEMS.map((i) => {
        const active = path === i.href || path.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 items-center justify-center text-sm md:min-h-11 md:flex-none md:justify-start md:rounded-xl md:px-3 md:text-base ${
              active ? "font-semibold text-primary md:bg-background" : "text-muted"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
