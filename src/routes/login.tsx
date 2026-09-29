import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useClientReady } from "@/components/layout/app-shell";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: safeNext(search.next),
  }),
  component: Login,
});

function safeNext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.startsWith("/login")) return undefined;
  return value;
}

function Login() {
  const { next } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const mounted = useClientReady();
  const dest = next ?? "/";
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockName, setUnlockName] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState(false);

  if (!mounted || isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6">
        <div className="h-12 w-64 animate-pulse rounded-md bg-secondary" />
      </main>
    );
  }
  if (user) {
    if (dest !== "/") return <Go dest={dest} />;
    return <Navigate to="/" />;
  }

  async function finishSession() {
    try {
      await authClient.getSession();
    } catch {
      /* session store recovers on next fetch */
    }
    window.location.replace(dest);
  }

  async function onProvider(providerId: string) {
    setError(null);
    setBusy(true);
    const framed = insideFrame();
    const popup = framed ? openProviderPopup(providerId) : null;
    if (framed && !popup) {
      setBusy(false);
      setError("Allow pop-ups, then try Google again.");
      return;
    }
    try {
      if (framed && popup) {
        const token = await waitForProviderPopup(popup);
        if (!token) {
          setBusy(false);
          setError("Google didn’t finish. Allow pop-ups and try again.");
          return;
        }
        try {
          window.sessionStorage.setItem("grok-auth.bearer-token", token);
        } catch {
          /* ignore */
        }
        await finishSession();
        return;
      }
      await signIn(providerId, { callbackURL: dest, errorCallbackURL: "/login" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "signup" && !trimmedName) {
      setError("Add the name that should print on estimates.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              name: trimmedName,
              email: trimmedEmail,
              password,
            })
          : await authClient.signIn.email({
              email: trimmedEmail,
              password,
            });
      if (result.error) {
        setBusy(false);
        setError(friendlyAuthError(result.error.message));
        return;
      }
      const token = result.data && "token" in result.data ? result.data.token : null;
      if (typeof token === "string" && token) {
        try {
          window.sessionStorage.setItem("grok-auth.bearer-token", token);
        } catch {
          /* preview can still use the cookie when the window allows it */
        }
      }
      await finishSession();
    } catch (err) {
      setBusy(false);
      setError(
        friendlyAuthError(err instanceof Error ? err.message : "Could not sign in"),
      );
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Meridian · Kampala
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight">
          {mode === "signup" ? "Create your desk" : "Open your desk"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Google is the fast path. X and email keep this desk on that account.
        </p>

        <div className="mt-8 space-y-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => void onProvider(p.providerId)}
                disabled={busy}
              >
                {p.idp === "google" ? <GoogleMark /> : <XMark />}
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}

          <p className="flex items-center gap-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or email
            <span className="h-px flex-1 bg-border" />
          </p>

          <form
            className="space-y-3"
            autoComplete="off"
            onSubmit={(e) => void onEmail(e)}
          >
            {mode === "signup" ? (
              <div>
                <Label htmlFor="desk-person">Your name</Label>
                <Input
                  id="desk-person"
                  name="desk-person"
                  className="mt-2"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  readOnly={!unlockName}
                  onFocus={() => setUnlockName(true)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="desk-mail">Email</Label>
              <Input
                id="desk-mail"
                name="desk-mail"
                className="mt-2"
                type="text"
                inputMode="email"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                readOnly={!unlockEmail}
                onFocus={() => setUnlockEmail(true)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="desk-secret">Password</Label>
              <Input
                id="desk-secret"
                name="desk-secret"
                className="mt-2"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button className="h-12 w-full" type="submit" disabled={busy}>
              {busy
                ? "Working…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            className="h-11 w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Need a desk? Create account"}
          </button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

function insideFrame(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.hostname.endsWith(".grok-sandbox.com")) return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function openProviderPopup(providerId: string): Window | null {
  const url = `${window.location.origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`;
  return window.open(url, `grok-signin-${Date.now()}`, "popup,width=500,height=650");
}

function waitForProviderPopup(popup: Window): Promise<string | null> {
  return new Promise((resolve) => {
    const origin = window.location.origin;
    let settled = false;
    const settle = (token: string | null) => {
      if (settled) return;
      settled = true;
      window.clearInterval(poll);
      window.removeEventListener("message", onMessage);
      resolve(token);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as { source?: string; token?: string | null } | undefined;
      if (!data || data.source !== "grok-auth-popup") return;
      settle(data.token ?? null);
    };
    const poll = window.setInterval(() => {
      if (popup.closed) window.setTimeout(() => settle(null), 400);
    }, 300);
    window.addEventListener("message", onMessage);
  });
}

function friendlyAuthError(message?: string | null): string {
  const raw = (message ?? "").trim();
  if (/invalid origin/i.test(raw)) {
    return "This page couldn’t start the account. Refresh, then try again.";
  }
  if (/invalid email or password|invalid password|user not found/i.test(raw)) {
    return "Email or password is wrong.";
  }
  if (/already exists|user already/i.test(raw)) {
    return "That email already has a desk. Sign in instead.";
  }
  return raw || "Could not sign in.";
}

function Go({ dest }: { dest: string }) {
  useEffect(() => {
    window.location.replace(dest);
  }, [dest]);
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="h-12 w-64 animate-pulse rounded-md bg-secondary" />
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.04h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.43Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.96-.9 6.62-2.34l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        d="M6.41 13.99A6 6 0 0 1 6.1 12c0-.69.12-1.36.31-1.99V7.43H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.57l3.35-2.58Z"
      />
      <path
        fill="currentColor"
        d="M12 5.88c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.9 14.7 2 12 2A10 10 0 0 0 3.06 7.43l3.35 2.58C7.2 7.64 9.4 5.88 12 5.88Z"
      />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.57l-5.14-6.72L5.2 22H1.93l8.02-9.16L1.5 2h6.74l4.64 6.18L18.244 2Zm-1.15 18.12h1.82L7.01 3.79H5.06l12.03 16.33Z"
      />
    </svg>
  );
}
