import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money/format";
import type { Currency } from "@/lib/money/types";
import type { ShippedWork } from "@/lib/money/works";
import { cn } from "@/lib/utils";

export function WorkSample({
  job,
  currency,
  layout = "card",
}: {
  job: ShippedWork;
  currency: Currency;
  layout?: "card" | "featured" | "detail";
}) {
  const price = formatMoney(job.price, currency);
  const kindLabel =
    job.kind === "shop" ? "Shop" : job.kind === "app" ? "App" : "Website";

  return (
    <article
      id={job.id}
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]",
        layout === "featured" && "sm:col-span-2",
      )}
    >
      <div className="aspect-video overflow-hidden bg-secondary">
        <img
          src={job.image}
          alt={job.name}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className={cn("px-5 py-5", layout === "detail" && "px-5 py-6 sm:px-8")}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {job.year} · {kindLabel}
            </p>
            <h2
              className={cn(
                "mt-2 font-serif tracking-tight",
                layout === "card" ? "text-2xl" : "text-3xl",
              )}
            >
              {job.name}
            </h2>
          </div>
          <p
            className={cn(
              "font-serif tabular-nums",
              layout === "card" ? "text-xl" : "text-2xl",
            )}
          >
            {price}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {job.blurb}
        </p>
        {layout === "detail" ? (
          <ul className="mt-4 space-y-1 text-sm">
            {job.does.map((line) => (
              <li key={line} className="text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button asChild size={layout === "card" ? "sm" : "default"}>
            <Link to={job.quoteTo} search={{ like: job.id }}>
              Price a job like this
            </Link>
          </Button>
          {job.href ? (
            <Button asChild variant="ghost" size={layout === "card" ? "sm" : "default"}>
              <a href={job.href} target="_blank" rel="noreferrer">
                Open live site
                <ArrowUpRight />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
