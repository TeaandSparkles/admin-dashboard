import ComingSoon from "@/components/ComingSoon";
import { Package } from "lucide-react";

export default function NovelPlanPage() {
  return (
    <ComingSoon
      title="Novel Plan"
      description="Bundle multiple novels into a single purchase or subscription. Configure duration, price, included titles, and free-preview chapters."
      icon={Package}
    />
  );
}
