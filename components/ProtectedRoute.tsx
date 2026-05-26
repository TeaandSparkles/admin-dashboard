"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppUser, isAllowedRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const appUser = await getAppUser();

      if (!appUser) {
        router.replace("/login");
        return;
      }

      if (!isAllowedRole(appUser.role)) {
        router.replace("/login");
        return;
      }

      setAuthorized(true);
    }

    checkAccess();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Checking access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
