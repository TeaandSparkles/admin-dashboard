"use client";

import { useUsers } from "@/hooks/useUsers";
import { useOrders } from "@/hooks/useOrders";
import { useCoins } from "@/hooks/useCoins";

export default function DashboardPage() {
  const { users, loading: usersLoading } = useUsers();
  const { orders, loading: ordersLoading } = useOrders();
  const { transactions, loading: coinsLoading } = useCoins();

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={usersLoading ? "…" : users.length}
        />
        <StatCard
          label="Total Orders"
          value={ordersLoading ? "…" : orders.length}
        />
        <StatCard
          label="Coin Transactions"
          value={coinsLoading ? "…" : transactions.length}
        />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
