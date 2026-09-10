import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "mute",
  children,
}: {
  className?: string;
  tone?: "mute" | "ok" | "warn" | "sent";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium tracking-wide uppercase",
        tone === "mute" && "bg-secondary text-muted-foreground",
        tone === "ok" && "bg-success/15 text-success",
        tone === "warn" && "bg-destructive/15 text-destructive",
        tone === "sent" && "bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
