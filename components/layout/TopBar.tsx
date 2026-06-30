"use client";

import { useEffect, useState } from "react";
import { getAppUser, type AppUser } from "@/lib/auth";

const roleBadge: Record<string, string> = {
  admin: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm",
  accounting: "bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-sm",
  management: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm",
  user: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

export default function TopBar() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    getAppUser().then(setUser);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/60 px-6 backdrop-blur">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Admin Control Panel
        </p>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right">
              <p className="text-sm font-medium">{user.email ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">Signed in</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                roleBadge[user.role ?? "user"] ?? roleBadge.user
              }`}
            >
              {user.role ?? "user"}
            </span>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
      </div>
    </header>
  );
}
