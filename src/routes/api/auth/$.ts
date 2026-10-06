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

function idpForProvider(providerId: string): "google" | "twitter" | null {
  if (providerId === "grok-google") return "google";
  if (providerId === "grok-x") return "twitter";
  return null;
}

function withIdp(raw: string, idp: string): string {
  try {
    const url = new URL(raw);
    if (!url.pathname.includes("/oauth2/authorize")) return raw;
    if (url.searchParams.get("idp")) return raw;
    url.searchParams.set("idp", idp);
    return url.toString();
  } catch {
    return raw;
  }
}

async function ensureAuthorizeIdp(response: Response, providerId: string): Promise<Response> {
  const idp = idpForProvider(providerId);
  if (!idp) return response;

  const location = response.headers.get("location");
  if (location) {
    const next = withIdp(location, idp);
    if (next !== location) {
      const headers = new Headers(response.headers);
      headers.set("location", next);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return response;
  }

  const type = response.headers.get("content-type") || "";
  if (!type.includes("json")) return response;
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { url?: string };
    if (typeof data.url === "string") {
      const next = withIdp(data.url, idp);
      if (next !== data.url) {
        data.url = next;
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        return Response.json(data, { status: response.status, headers });
      }
    }
  } catch {
    /* keep the original body */
  }
  return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function handle(request: Request): Promise<Response> {
  trustArrivalHost(request);
  let providerId = "";
  let forwarded = request;
  if (request.method === "POST") {
    const text = await request.text();
    try {
      const parsed = JSON.parse(text) as { providerId?: unknown };
      if (typeof parsed.providerId === "string") providerId = parsed.providerId;
    } catch {
      /* email sign-in is not JSON */
    }
    forwarded = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: text,
    });
  }
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
    const response = await auth.handler(forwarded);
    const withProvider = await ensureAuthorizeIdp(response, providerId);
    if (withProvider.status < 500) return withProvider;
    const text = await withProvider.clone().text();
    if (text.trim()) return withProvider;
    return Response.json(
      { message: "Could not sign in.", detail: `empty ${withProvider.status}` },
      { status: withProvider.status },
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
