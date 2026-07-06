import ComingSoon from "@/components/ComingSoon";
import { Crown } from "lucide-react";

export default function VipPlanPage() {
  return (
    <ComingSoon
      title="VIP Plan"
      description="All-access tier: every novel unlocked, printed books shipped quarterly, ad-free, priority support. Coming with Google Play Billing subscriptions."
      icon={Crown}
    />
  );
}
