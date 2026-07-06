import ComingSoon from "@/components/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function EpisodesAnalyticsPage() {
  return (
    <ComingSoon
      title="Episodes Analytics"
      description="Per-episode plays, average watch time, drop-off points, and streak contribution. Populates once real user_progress rows accumulate."
      icon={BarChart3}
    />
  );
}
