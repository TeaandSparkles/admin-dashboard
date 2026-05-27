"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  ShoppingCart,
  Share2,
  CircleDollarSign,
  Library,
} from "lucide-react";

const kpiConfig = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-blue-600" },
  { key: "totalNovels", label: "Novels", icon: Library, color: "text-violet-600" },
  { key: "totalStories", label: "Stories", icon: BookOpen, color: "text-indigo-600" },
  { key: "totalOrders", label: "Orders", icon: ShoppingCart, color: "text-orange-600" },
  { key: "totalCoinsIssued", label: "Coins Issued", icon: CircleDollarSign, color: "text-yellow-600" },
  { key: "activeReferrals", label: "Active Referrals", icon: Share2, color: "text-green-600" },
] as const;

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview — live from Supabase
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {kpiConfig.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {loading ? "—" : (stats?.[key] ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
