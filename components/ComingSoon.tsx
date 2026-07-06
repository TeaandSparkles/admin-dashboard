import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, type LucideIcon } from "lucide-react";

export default function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100">
            <Icon className="h-7 w-7 text-blue-600" />
          </div>
          <div className="max-w-md space-y-2">
            <p className="text-lg font-semibold">Coming soon</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
