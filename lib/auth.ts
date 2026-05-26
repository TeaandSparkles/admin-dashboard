import { supabase } from "./supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export type AllowedRole = "admin" | "accounting";

export interface AppUser {
  id: string;
  email: string | undefined;
  role: string | null;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Failed to get session:", error.message);
    return null;
  }
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Failed to get user:", error.message);
    return null;
  }
  return data.user;
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch user role:", error.message);
    return null;
  }
  return data?.role ?? null;
}

export async function getAppUser(): Promise<AppUser | null> {
  const user = await getUser();
  if (!user) return null;

  const role = await getUserRole(user.id);

  return {
    id: user.id,
    email: user.email,
    role,
  };
}

export function isAllowedRole(role: string | null): role is AllowedRole {
  return role === "admin" || role === "accounting";
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Failed to sign out:", error.message);
  }
}
