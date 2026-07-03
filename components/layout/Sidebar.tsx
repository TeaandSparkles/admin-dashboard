"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShoppingCart,
  Truck,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  Flame,
  Database,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Novels", href: "/stories", icon: BookOpen },
  { label: "AI Studio", href: "/ai", icon: Sparkles },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Shipments", href: "/shipments", icon: Truck },
  { label: "Listening Streaks", href: "/streaks", icon: Flame },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Setup / SQL", href: "/setup", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6">
      {/* Brand */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Tea & Sparkles</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-blue-500/15 to-teal-400/10 text-blue-700 shadow-sm ring-1 ring-blue-200/50"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-blue-600" : "text-sidebar-foreground/60"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  );
}
