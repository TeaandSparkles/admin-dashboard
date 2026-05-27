"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getUserRole, isAllowedRole } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    async function handleCallback() {
      // The Supabase client automatically detects and stores the session
      // from the URL when detectSessionInUrl: true. We just need to wait
      // for it to finish, then validate the role.

      // Give the client a moment to process the URL fragment
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setMessage("Sign in failed. Redirecting...");
        setTimeout(() => router.replace("/login"), 1500);
        return;
      }

      const role = await getUserRole(data.session.user.id);

      if (!isAllowedRole(role)) {
        setMessage("Access denied — admin or accounting role required.");
        await supabase.auth.signOut();
        setTimeout(() => router.replace("/login"), 2000);
        return;
      }

      router.replace("/dashboard");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
