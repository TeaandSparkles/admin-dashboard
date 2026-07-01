"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, Gift, Users } from "lucide-react";

export default function StreaksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Flame className="h-6 w-6 text-rose-500" />
          Listening Streaks
        </h1>
        <p className="text-sm text-muted-foreground">
          Reward listeners who make storytime a family ritual — with more content, never with pressure.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Coming soon — Phase 2</CardTitle>
          <CardDescription>
            Post-purchase loyalty. Never gates paid content. Never shames a broken streak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PillarCard
              icon={Users}
              title="Family-shared"
              desc="Multiple household members listening count toward the same streak."
              gradient="from-indigo-500 to-purple-500"
            />
            <PillarCard
              icon={Flame}
              title="Gentle streaks"
              desc="Tracks nights of storytime, not compulsive daily grind."
              gradient="from-cyan-500 to-sky-500"
            />
            <PillarCard
              icon={Gift}
              title="Bonus content"
              desc="Milestones unlock free chapters from other series, never gate what was bought."
              gradient="from-pink-500 to-rose-500"
            />
          </div>

          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
            <strong>What&apos;s coming here:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1 text-indigo-700/90">
              <li>Configure streak milestones and their rewards</li>
              <li>See which families are on active streaks</li>
              <li>Send a warm nudge when a streak needs one more chapter</li>
              <li>Track total bonus chapters gifted this month</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PillarCard({
  icon: Icon,
  title,
  desc,
  gradient,
}: {
  icon: typeof Flame;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
