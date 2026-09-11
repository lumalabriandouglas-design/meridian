import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Globe, List } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";

export const Route = createFileRoute("/estimate/")({ component: Choose });

function Choose() {
  return (
    <AppShell>
      <PageHeader
        kicker="New estimate"
        title="What are they asking for?"
        description="Pick a playbook. You are not writing a tech résumé — you are naming the job and protecting the price."
      />
      <div className="enter enter-2 mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
        <Choice
          to="/estimate/website"
          icon={Globe}
          title="Website"
          copy="Pick the client, then what the site will do. Languages stay off the invoice."
        />
        <Choice
          to="/estimate/auto"
          icon={Car}
          title="Auto shop"
          copy="Job, labour, parts. For the bay, not the wrench list."
        />
        <Choice
          to="/estimate/custom"
          icon={List}
          title="Custom job"
          copy="What the app will do for them — not the stack you write it in."
        />
      </div>
    </AppShell>
  );
}

function Choice({
  to,
  icon: Icon,
  title,
  copy,
}: {
  to: string;
  icon: typeof Globe;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] transition-[background-color] duration-150 hover:bg-secondary"
    >
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
      <h2 className="mt-6 font-serif text-3xl tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
    </Link>
  );
}
