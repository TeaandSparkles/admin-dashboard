"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CATEGORY_TREE } from "@/lib/categories";
import { FolderTree } from "lucide-react";

export default function NovelCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novel Categories</h1>
        <p className="text-sm text-muted-foreground">
          Full 3-level taxonomy used by the mobile app and search filters.{" "}
          {CATEGORY_TREE.length} categories ·{" "}
          {CATEGORY_TREE.reduce((a, c) => a + c.genres.length, 0)} genres ·{" "}
          {CATEGORY_TREE.reduce((a, c) => a + c.genres.reduce((b, g) => b + g.themes.length, 0), 0)}{" "}
          themes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CATEGORY_TREE.map((cat) => (
          <Card key={cat.name} className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">{cat.emoji}</span> {cat.name}
              </CardTitle>
              <CardDescription>{cat.genres.length} genres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cat.genres.map((g) => (
                  <div key={g.name}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                      {g.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.themes.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <FolderTree className="h-4 w-4" />
        Edit the taxonomy in <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs">lib/categories.ts</code>
        — changes here update the mobile app pills and search filters on the next deploy.
      </div>
    </div>
  );
}
