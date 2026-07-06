import ComingSoon from "@/components/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function NovelsAnalyticsPage() {
  return (
    <ComingSoon
      title="Novels Analytics"
      description="Per-novel views, unique listeners, completion rate, likes / comments / shares, and revenue. Populates automatically once the mobile engagement backend is wired."
      icon={BarChart3}
    />
  );
}
