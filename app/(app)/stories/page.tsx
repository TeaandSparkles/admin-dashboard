"use client";

import { useStories } from "@/hooks/useStories";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function StoriesPage() {
  const { novels, stories, loading, error } = useStories();

  const novelMap = Object.fromEntries(novels.map((n) => [n.id, n.title]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stories</h1>
          <p className="text-sm text-muted-foreground">
            {stories.length} stories across {novels.length} novels
          </p>
        </div>
        <Button size="sm" className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          Create Story
        </Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Stories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="px-6 py-4 text-sm text-red-500">{error}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead>Title</TableHead>
                <TableHead>Novel</TableHead>
                <TableHead>Price (coins)</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : stories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No stories yet
                  </TableCell>
                </TableRow>
              ) : (
                stories.map((story) => (
                  <TableRow key={story.id} className="border-gray-50">
                    <TableCell className="font-medium">{story.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {novelMap[story.novel_id ?? ""] ?? "—"}
                    </TableCell>
                    <TableCell>
                      {story.story_price != null ? story.story_price.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {story.fulfillment_type ?? "digital"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={story.published ? "default" : "secondary"}>
                        {story.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {story.created_at
                        ? new Date(story.created_at).toLocaleDateString()
                        : "—"}
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
