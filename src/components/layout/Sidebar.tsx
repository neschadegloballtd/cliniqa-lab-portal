"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  CalendarDays,
  AlertTriangle,
  BarChart2,
  CreditCard,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabAuthStore } from "@/store/lab-auth.store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minTier: null },
  { href: "/results", label: "Results", icon: FlaskConical, minTier: null },
  { href: "/bookings", label: "Bookings", icon: CalendarDays, minTier: null },
  { href: "/pre-analytical", label: "Pre-Analytical", icon: AlertTriangle, minTier: null },
  { href: "/qa", label: "QA Dashboard", icon: BarChart2, minTier: "BASIC" as const },
  { href: "/subscription", label: "Subscription", icon: CreditCard, minTier: null },
  { href: "/profile", label: "Profile", icon: User, minTier: null },
  { href: "/settings", label: "Settings", icon: Settings, minTier: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const tier = useLabAuthStore((s) => s.tier);

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="font-bold text-lg text-sidebar-foreground">Cliniqa Labs</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, minTier }) => {
          const locked = minTier === "BASIC" && tier === "FREE";
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={locked ? "/subscription/upgrade" : href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                locked && "opacity-60",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {locked && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 rounded px-1">
                  BASIC+
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
