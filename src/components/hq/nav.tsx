"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { HQIcon, type HQIconName } from "./icon";

export const DESTINATIONS: { href: string; label: string; icon: HQIconName; match: string[] }[] = [
  { href: "/today", label: "Today", icon: "today", match: ["/today", "/dashboard"] },
  { href: "/journal", label: "Journal", icon: "journal", match: ["/journal", "/move", "/habits"] },
  { href: "/ask", label: "Ask", icon: "compass", match: ["/ask"] },
  { href: "/learn", label: "Learn", icon: "book", match: ["/learn"] },
  { href: "/you", label: "You", icon: "person", match: ["/you", "/settings", "/health-factors", "/visit", "/quests"] },
];

function useActive() {
  const pathname = usePathname() ?? "";
  return (match: string[]) => match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function HQBrand({ href = "/today" }: { href?: string }) {
  return (
    <Link className="hq-brand" href={href} aria-label="HealthQuest home">
      <HQIcon name="path" />
      <span aria-hidden>HealthQuest</span>
    </Link>
  );
}

/** Mobile top bar: brand, XP, and the always-reachable assistant. */
export function HQTopBar({ trailing }: { trailing?: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="hq-topbar" data-scrolled={scrolled ? "true" : undefined}>
      <HQBrand />
      <div className="hq-cluster">
        {trailing}
      </div>
    </header>
  );
}

export function HQTabBar() {
  const isActive = useActive();
  return (
    <nav className="hq-tabbar" aria-label="Primary">
      {DESTINATIONS.map((item) => (
        <Link
          key={item.href}
          className="hq-tab"
          href={item.href}
          aria-current={isActive(item.match) ? "page" : undefined}
        >
          <HQIcon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function HQSidebar({ footer }: { footer?: ReactNode }) {
  const isActive = useActive();
  return (
    <aside className="hq-sidebar" aria-label="HealthQuest">
      <HQBrand />
      <nav className="hq-sidebar__nav" aria-label="Primary">
        {DESTINATIONS.map((item) => (
          <Link
            key={item.href}
            className="hq-side-link"
            href={item.href}
            aria-current={isActive(item.match) ? "page" : undefined}
          >
            <HQIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
      {footer ? <div className="hq-sidebar__foot">{footer}</div> : null}
    </aside>
  );
}
