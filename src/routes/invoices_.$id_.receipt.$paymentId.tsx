import { createFileRoute, Link } from "@tanstack/react-router";
import { ReceiptPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/invoices_/$id_/receipt/$paymentId")({
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id, paymentId } = Route.useParams();
  const invoice = useMoney((s) => s.invoices.find((e) => e.id === id));
  const profile = useMoney((s) => s.profile);
  const payment = invoice?.payments.find((p) => p.id === paymentId);

  if (!invoice || !payment) {
    return (
      <AppShell>
        <PageHeader title="Receipt missing" />
        <Link
          to="/invoices/$id"
          params={{ id }}
          className="text-sm text-muted-foreground"
        >
          Back to invoice
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        kicker={payment.number}
        title="Receipt"
        description={
          invoice.clientCompany || invoice.clientName
            ? `For ${invoice.clientCompany || invoice.clientName}`
            : "Print this and send it with the MoMo confirmation."
        }
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/invoices/$id" params={{ id }}>
                Invoice
              </Link>
            </Button>
            <Button onClick={() => window.print()}>Print receipt</Button>
          </>
        }
      />
      <div className="mx-auto max-w-2xl">
        <ReceiptPaper
          profile={profile}
          currency={profile.currency}
          invoice={invoice}
          payment={payment}
        />
      </div>
    </AppShell>
  );
}
