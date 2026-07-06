import ComingSoon from "@/components/ComingSoon";
import { DollarSign } from "lucide-react";

export default function MonetizationPage() {
  return (
    <ComingSoon
      title="Monetization"
      description="Revenue overview, per-novel earnings, chargebacks, refunds, and payout controls. Coming next once purchases start flowing through Google Play Billing."
      icon={DollarSign}
    />
  );
}
