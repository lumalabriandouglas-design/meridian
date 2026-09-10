import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "paid" || status === "accepted"
      ? "ok"
      : status === "overdue" || status === "declined"
        ? "warn"
        : status === "sent"
          ? "sent"
          : "mute";
  return <Badge tone={tone}>{status}</Badge>;
}
