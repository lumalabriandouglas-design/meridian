import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6">
        <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      </main>
    );
  }
  if (user) return <Navigate to="/" />;

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0] || "Studio",
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || "Could not create the account");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || "Could not sign in");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-sm">
        <p className="font-serif text-4xl tracking-tight">Meridian</p>
        <p className="mt-2 text-sm text-muted-foreground">Kampala · UGX</p>
        <h1 className="mt-10 font-serif text-3xl leading-none tracking-tight">
          Your desk. Not anyone else’s.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sign in to keep estimates, invoices, and your rate on this account —
          even from another phone.
        </p>

        {!authEnabled ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Sign-in is disabled.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))}

            <div className="flex items-center gap-3 py-2">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                or email
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-3" onSubmit={onEmail}>
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    className="mt-2"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  className="mt-2"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  className="mt-2"
                  type="password"
                  autoComplete={
                    mode === "up" ? "new-password" : "current-password"
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "up"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <button
              type="button"
              className="w-full pt-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode((m) => (m === "up" ? "in" : "up"));
                setError(null);
              }}
            >
              {mode === "up"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
