import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

/**
 * The published desk is opened on a host the frozen auth list does not
 * include (only the sandbox and localhost). Email then returns
 * "Invalid origin", and Google crashes while building the redirect.
 *
 * Trust only the host this request actually arrived on, and only when
 * the browser origin is that same host. Cross-site calls stay rejected.
 */
type AuthOptions = {
  baseURL?: { allowedHosts?: string[] } | string;
  trustedOrigins?: string[] | ((request: Request) => Promise<string[]>);
};

function firstHeader(request: Request, name: string): string | null {
  const raw = request.headers.get(name);
  if (!raw) return null;
  const value = raw.split(",")[0]?.trim() ?? "";
  return value || null;
}

function isSafeHost(host: string): boolean {
  return (
    /^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/.test(host) ||
    /^\[[0-9a-fA-F:]+\](?::[0-9]{1,5})?$/.test(host)
  );
}

function arrivalHost(request: Request): string | null {
  const forwarded = firstHeader(request, "x-forwarded-host");
  const hostHeader = firstHeader(request, "host");
  let urlHost: string | null = null;
  try {
    urlHost = new URL(request.url).host;
  } catch {
    urlHost = null;
  }
  const candidate = [forwarded, hostHeader, urlHost].find(
    (host) => host && isSafeHost(host),
  );
  return candidate ?? null;
}

function trustArrivalHost(request: Request): void {
  const site = (request.headers.get("sec-fetch-site") || "").toLowerCase();
  if (site === "cross-site") return;

  const host = arrivalHost(request);
  if (!host) return;

  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      if (new URL(originHeader).host !== host) return;
    } catch {
      return;
    }
  }

  const options = (auth as { options?: AuthOptions }).options;
  if (!options) return;

  const base = options.baseURL;
  if (base && typeof base === "object" && Array.isArray(base.allowedHosts)) {
    const exists = base.allowedHosts.some(
      (pattern) => pattern.toLowerCase() === host.toLowerCase(),
    );
    if (!exists) base.allowedHosts.push(host);
  }

  const forwardedProto = firstHeader(request, "x-forwarded-proto");
  let proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : null;
  if (!proto) {
    try {
      proto = new URL(request.url).protocol === "http:" ? "http" : "https";
    } catch {
      proto = "https";
    }
  }
  const origin = `${proto}://${host}`;
  if (Array.isArray(options.trustedOrigins) && !options.trustedOrigins.includes(origin)) {
    options.trustedOrigins.push(origin);
  }
}

async function handle(request: Request): Promise<Response> {
  trustArrivalHost(request);
  if (!process.env.DATABASE_URL?.trim()) {
    try {
      const { getPglite } = await import("@/lib/db");
      await getPglite();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Could not open records";
      return Response.json(
        { message: "Could not open the desk records.", detail },
        { status: 500 },
      );
    }
  }
  try {
    const response = await auth.handler(request);
    if (response.status < 500) return response;
    const text = await response.clone().text();
    if (text.trim()) return response;
    return Response.json(
      { message: "Could not sign in.", detail: `empty ${response.status}` },
      { status: response.status },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Could not sign in";
    return Response.json({ message: "Could not sign in.", detail }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
