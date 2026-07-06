import ComingSoon from "@/components/ComingSoon";
import { Video } from "lucide-react";

export default function EpisodesPage() {
  return (
    <ComingSoon
      title="Episodes / Videos"
      description="Central library of every chapter video across all novels — filter by language, upload status, or novel. For now, add/replace videos inside each novel's edit page under Book List."
      icon={Video}
    />
  );
}
