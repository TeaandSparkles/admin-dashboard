"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Bell, Send } from "lucide-react";

interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
  user: { username: string; email: string | null } | null;
}

interface User {
  id: string;
  username: string;
  email: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<"all" | "user">("all");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("system");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [nRes, uRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, user_id, type, title, message, read, created_at, user:users(username, email)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("users").select("id, username, email").order("username"),
    ]);
    if (nRes.error) setError(nRes.error.message);
    else setNotifications((nRes.data as unknown as Notification[]) ?? []);
    setUsers((uRes.data as User[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSend() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSending(true);
    setError(null);

    if (target === "all") {
      const rows = users.map((u) => ({
        user_id: u.id,
        type,
        title,
        message: message || null,
      }));
      const { error: err } = await supabase.from("notifications").insert(rows);
      if (err) setError(err.message);
    } else {
      if (!userId) {
        setError("Pick a user");
        setSending(false);
        return;
      }
      const { error: err } = await supabase.from("notifications").insert({
        user_id: userId,
        type,
        title,
        message: message || null,
      });
      if (err) setError(err.message);
    }

    setTitle("");
    setMessage("");
    setSending(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Send updates to users — viewable in the mobile app
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Send notification</CardTitle>
          <CardDescription>Broadcast to all users or target one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={target === "all" ? "default" : "outline"}
              onClick={() => setTarget("all")}
            >
              All users
            </Button>
            <Button
              type="button"
              size="sm"
              variant={target === "user" ? "default" : "outline"}
              onClick={() => setTarget("user")}
            >
              Specific user
            </Button>
          </div>

          {target === "user" && (
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={userId} onValueChange={(v) => v && setUserId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.username} ({u.email ?? "—"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="new_episode">New Episode</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : `Send to ${target === "all" ? users.length + " users" : "user"}`}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((n) => (
                  <TableRow key={n.id} className="border-gray-50">
                    <TableCell className="text-sm">{n.user?.username ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{n.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell>
                      <Badge variant={n.read ? "default" : "secondary"}>
                        {n.read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
