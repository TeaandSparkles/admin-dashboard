"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, BookOpen, ShoppingCart, Share2, CircleDollarSign, Library,
  Truck, DollarSign,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const kpiConfig = [
  { key: "totalUsers", label: "Total Users", icon: Users, gradient: "from-indigo-500 to-purple-500" },
  { key: "totalNovels", label: "Novels", icon: Library, gradient: "from-cyan-500 to-sky-500" },
  { key: "totalStories", label: "Stories", icon: BookOpen, gradient: "from-purple-500 to-pink-500" },
  { key: "totalOrders", label: "Orders", icon: ShoppingCart, gradient: "from-pink-500 to-rose-500" },
  { key: "totalCoinsIssued", label: "Coins Issued", icon: CircleDollarSign, gradient: "from-amber-500 to-orange-500" },
  { key: "activeReferrals", label: "Active Referrals", icon: Share2, gradient: "from-emerald-500 to-teal-500" },
] as const;

const CHART_COLORS = {
  primary: "#6366F1",
  accent: "#06B6D4",
  highlight: "#FB7185",
};

export default function DashboardPage() {
  const { stats, timeSeries, topStories, coinBreakdown, loading, error } = useDashboardStats();

  const coinPieData = [
    { name: "Earned", value: coinBreakdown.earned, color: CHART_COLORS.primary },
    { name: "Spent", value: coinBreakdown.spent, color: CHART_COLORS.highlight },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of your platform — synced from Supabase
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* KPI strip — 6 gradient cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpiConfig.map(({ key, label, icon: Icon, gradient }) => (
          <Card key={key} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {loading ? "—" : (stats?.[key] ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured gradient cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80">Total Revenue</p>
                <p className="mt-2 text-4xl font-bold tabular-nums">
                  ${loading ? "—" : (stats?.totalRevenue ?? 0).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-white/80">From all orders</p>
              </div>
              <DollarSign className="h-6 w-6 text-white/80" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 text-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80">Pending Fulfillment</p>
                <p className="mt-2 text-4xl font-bold tabular-nums">
                  {loading ? "—" : (stats?.pendingShipments ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  Shipments not delivered · {stats?.pendingReferrals ?? 0} referrals pending
                </p>
              </div>
              <Truck className="h-6 w-6 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Last 30 days — revenue, orders, coins</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E1F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E1F0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="coins" name="Coins" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke={CHART_COLORS.highlight} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coins Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Earned vs spent</p>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={coinPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {coinPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E1F0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2">
              <div className="rounded-xl bg-indigo-50 p-3 text-center">
                <p className="text-[10px] uppercase text-indigo-600">Earned</p>
                <p className="text-lg font-bold text-indigo-900 tabular-nums">{coinBreakdown.earned.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 text-center">
                <p className="text-[10px] uppercase text-rose-600">Spent</p>
                <p className="text-lg font-bold text-rose-900 tabular-nums">{coinBreakdown.spent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top stories with engagement bars */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Performing Stories</CardTitle>
          <p className="text-xs text-muted-foreground">By order revenue</p>
        </CardHeader>
        <CardContent className="p-0">
          {topStories.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No story revenue yet — once orders come in, top stories appear here
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topStories.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.novelTitle}</p>
                  </div>
                  <div className="hidden flex-1 sm:block">
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${s.engagementPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{s.engagementPct}% engagement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">${s.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{s.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
