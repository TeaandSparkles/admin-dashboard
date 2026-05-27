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
  Share2,
  CircleDollarSign,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Stories", href: "/dashboard/stories", icon: BookOpen },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Referrals", href: "/dashboard/referrals", icon: Share2 },
  { label: "Coins", href: "/dashboard/coins", icon: CircleDollarSign },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-100 bg-white px-3 py-6">
      {/* Brand */}
      <div className="mb-8 px-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin Panel
        </p>
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
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  );
}
