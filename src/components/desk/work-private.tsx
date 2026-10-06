import { lazy, Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { useMoney } from "@/lib/money/store";
import type { Currency } from "@/lib/money/types";
import { ADMIN_EMAIL } from "@/lib/money/admin";

const ShippedStrip = lazy(() => import("@/components/desk/shipped-strip"));

export default function WorkPrivate() {
  const email = useMoney((s) => s.profile.email);
  const currency = (useMoney((s) => s.profile.currency) || "UGX") as Currency;
  const deskReady = useMoney((s) => s.status === "ready");
  const showCatalog =
    deskReady && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!showCatalog) {
    return (
      <PageHeader
        kicker="Kampala"
        title="Shipped work"
        description="Nothing from past jobs is on this desk."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto h-10 w-48 max-w-5xl animate-pulse rounded-md bg-secondary" />
      }
    >
      <ShippedStrip currency={currency} layout="detail" />
    </Suspense>
  );
}
