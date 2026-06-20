"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Auj.", icon: "🏠" },
  { href: "/budget", label: "Budget", icon: "📊" },
  { href: "/calendrier", label: "Agenda", icon: "📅" },
  { href: "/epargne", label: "Épargne", icon: "🐷" },
  { href: "/bilan", label: "Bilan", icon: "📈" },
  { href: "/reglages", label: "Réglages", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="absolute inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/95 backdrop-blur"
    >
      <ul className="mx-auto grid max-w-[440px] grid-cols-6">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex w-full flex-col items-center gap-1 px-0.5 pb-3 pt-3"
              >
                {active && (
                  <span className="absolute top-1.5 h-[3px] w-7 rounded-full bg-plum" />
                )}
                <span
                  className={`flex size-7 items-center justify-center rounded-[14px] text-base transition-colors ${
                    active ? "bg-lavender/40" : "bg-transparent"
                  }`}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span
                  className={`whitespace-nowrap text-[9px] ${
                    active ? "font-bold text-plum" : "text-graphite/55"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
