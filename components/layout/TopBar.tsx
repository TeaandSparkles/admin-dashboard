"use client";

import { useEffect, useState } from "react";
import { getAppUser, type AppUser } from "@/lib/auth";

const roleBadge: Record<string, string> = {
  admin: "bg-red-50 text-red-700 ring-red-200",
  accounting: "bg-blue-50 text-blue-700 ring-blue-200",
  management: "bg-purple-50 text-purple-700 ring-purple-200",
  user: "bg-gray-50 text-gray-700 ring-gray-200",
};

export default function TopBar() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    getAppUser().then(setUser);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <p className="text-xs text-muted-foreground">Admin Control Panel</p>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.email ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
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
