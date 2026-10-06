import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { WorkSample } from "@/components/money/work-sample";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/money/store";
import type { Currency } from "@/lib/money/types";
import { SHIPPED_WORK } from "@/lib/money/works";

export default function ShippedStrip({
  currency,
  layout,
}: {
  currency: Currency;
  layout: "grid" | "detail";
}) {
  const name = useMoney((s) => s.profile.name).trim() || "Your desk";

  if (layout === "detail") {
    return (
      <>
        <PageHeader
          kicker={name}
          title="Shipped work, with the price"
          description="Work already shipped. Use these numbers when someone asks for the same kind of site or app."
          actions={
            <Button asChild>
              <Link to="/estimate">New estimate</Link>
            </Button>
          }
        />
        <div className="enter enter-2 mx-auto grid max-w-5xl gap-6">
          {SHIPPED_WORK.map((job) => (
            <WorkSample key={job.id} job={job} currency={currency} layout="detail" />
          ))}
        </div>
      </>
    );
  }

  const [featured, ...rest] = SHIPPED_WORK;
  return (
    <section className="enter enter-2 mx-auto mb-12 max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Shipped work, with the price
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/work">
            All work
            <ArrowRight />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {featured ? (
          <WorkSample job={featured} currency={currency} layout="featured" />
        ) : null}
        {rest.map((job) => (
          <WorkSample key={job.id} job={job} currency={currency} />
        ))}
      </div>
    </section>
  );
}
