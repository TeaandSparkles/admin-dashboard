"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShoppingCart,
  Sparkles,
  Settings,
  LogOut,
  Database,
  DollarSign,
  Coins,
  BarChart3,
  Video,
  Shield,
  Languages,
  Package,
  Crown,
  FolderTree,
  MessageSquare,
  FileText,
  MailQuestion,
  Star,
  Facebook,
  Instagram,
  Music2,
  Megaphone,
  Zap,
  Mail,
  ScrollText,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  alertPlatform?: string;   // when set, badge shows unread count from promo_alerts
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Users",
    items: [{ label: "User Management", href: "/users", icon: Users }],
  },
  {
    label: "Admin",
    items: [
      { label: "Monetization", href: "/monetization", icon: DollarSign },
      { label: "Coins Economy", href: "/coins", icon: Coins },
      { label: "Novels Analytics", href: "/analytics/novels", icon: BarChart3 },
      { label: "Episodes Analytics", href: "/analytics/episodes", icon: BarChart3 },
    ],
  },
  {
    label: "Books Management",
    items: [
      { label: "Novel Categories", href: "/novel-categories", icon: FolderTree },
      { label: "Book List", href: "/stories", icon: BookOpen },
      { label: "Episodes / Videos", href: "/episodes", icon: Video },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Contact Us", href: "/content/contact", icon: MessageSquare },
      { label: "Terms of Service", href: "/content/terms", icon: FileText },
      { label: "Privacy Policy", href: "/content/privacy", icon: Shield },
      { label: "Feedback", href: "/content/feedback", icon: MailQuestion },
    ],
  },
  {
    label: "Promote",
    items: [
      { label: "Google Reviews", href: "/promote/reviews", icon: Star, alertPlatform: "google" },
      { label: "Facebook Posts", href: "/promote/facebook", icon: Facebook, alertPlatform: "facebook" },
      { label: "Instagram Posts", href: "/promote/instagram", icon: Instagram, alertPlatform: "instagram" },
      { label: "TikTok Posts", href: "/promote/tiktok", icon: Music2, alertPlatform: "tiktok" },
    ],
  },
  {
    label: "Auto",
    items: [
      { label: "Email Templates", href: "/auto/templates", icon: Mail },
      { label: "Triggers", href: "/auto/triggers", icon: Zap },
      { label: "Send Log", href: "/auto/log", icon: ScrollText },
    ],
  },
  {
    label: "Staff Management",
    items: [{ label: "Staff Users", href: "/staff", icon: Shield }],
  },
  {
    label: "Language Management",
    items: [{ label: "Language Book Lists", href: "/languages", icon: Languages }],
  },
  {
    label: "Packages",
    items: [
      { label: "Novel Plan", href: "/plans/novels", icon: Package },
      { label: "VIP Plan", href: "/plans/vip", icon: Crown },
      { label: "Order History", href: "/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Setup / SQL", href: "/setup", icon: Database },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCounts() {
      const platforms = ["google", "facebook", "instagram", "tiktok"];
      const counts: Record<string, number> = {};
      for (const p of platforms) {
        const { count } = await supabase
          .from("promo_alerts")
          .select("*", { count: "exact", head: true })
          .eq("platform", p)
          .eq("is_read", false);
        counts[p] = count ?? 0;
      }
      setUnread(counts);
    }
    loadCounts().catch(() => {});
    // Poll every 60s
    const timer = setInterval(loadCounts, 60_000);
    return () => clearInterval(timer);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="px-3 py-5">
        <div className="flex items-center gap-2 px-3">
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

      {/* Nav — scrollable so sections all fit */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
              {section.label}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map(({ label, href, icon: Icon, alertPlatform }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === href || pathname.startsWith(href + "/");
                const badgeCount = alertPlatform ? unread[alertPlatform] ?? 0 : 0;
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
                    <span className="flex-1">{label}</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out (always at the bottom) */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
