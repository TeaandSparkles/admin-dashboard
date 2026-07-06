"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Languages } from "lucide-react";

interface NovelRow {
  id: string;
  title: string;
  language: string | null;
  published: boolean | null;
}

const LANGUAGE_LABELS: Record<string, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  it: { label: "Italiano", flag: "🇮🇹" },
  pt: { label: "Português", flag: "🇵🇹" },
  sv: { label: "Svenska", flag: "🇸🇪" },
  hu: { label: "Magyar", flag: "🇭🇺" },
  pl: { label: "Polski", flag: "🇵🇱" },
  ru: { label: "Русский", flag: "🇷🇺" },
  ja: { label: "日本語", flag: "🇯🇵" },
  he: { label: "עברית", flag: "🇮🇱" },
  hi: { label: "हिन्दी", flag: "🇮🇳" },
  zh: { label: "中文", flag: "🇨🇳" },
};

export default function LanguageBookListsPage() {
  const [novels, setNovels] = useState<NovelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("stories")
        .select("id, title, language, published")
        .order("title");
      setNovels((data as NovelRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Group by language code
  const grouped = novels.reduce<Record<string, NovelRow[]>>((acc, n) => {
    const key = n.language ?? "en";
    (acc[key] ||= []).push(n);
    return acc;
  }, {});
  const languageCodes = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Language Book Lists</h1>
        <p className="text-sm text-muted-foreground">
          Every novel grouped by narration language. Click a title to edit.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : languageCodes.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No novels yet. Add one from Book List → Create Novel.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {languageCodes.map((code) => {
            const lang = LANGUAGE_LABELS[code] ?? { label: code.toUpperCase(), flag: "🌐" };
            return (
              <Card key={code} className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-lg">{lang.flag}</span> {lang.label}
                  </CardTitle>
                  <CardDescription>
                    {grouped[code].length} novel{grouped[code].length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {grouped[code].map((n) => (
                      <li key={n.id}>
                        <Link
                          href={`/stories/${n.id}`}
                          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span className="truncate">{n.title}</span>
                          {!n.published && (
                            <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                              Draft
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Languages className="h-4 w-4" />
        Set the narration language when creating or editing a novel — it drives the mobile globe filter and the flag chip on every book cover.
      </div>
    </div>
  );
}
