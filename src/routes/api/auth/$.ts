import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

/**
 * Better Auth only trusts `BETTER_AUTH_URL` once that env is set (deploy).
 * The public alias people actually open (this Vercel host) can differ, which
 * surfaces as "Invalid origin" on email create/sign-in.
 *
 * CSRF stays on: we only rewrite Origin when the browser is already
 * same-origin with THIS host. Foreign sites still fail the origin check.
 * Live preview leaves the header alone (`BETTER_AUTH_URL` unset).
 */
function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = (
    request.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "https"
  )
    .split(",")[0]
    .trim();
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host
  )
    .split(",")[0]
    .trim();
  const scheme = proto === "http" ? "http" : "https";
  return `${scheme}://${host}`;
}

function originOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function withTrustedOrigin(request: Request): Request {
  const trusted = process.env.BETTER_AUTH_URL?.trim().replace(/\/+$/, "");
  if (!trusted) return request;

  const self = publicOrigin(request);
  const incoming =
    originOf(request.headers.get("origin")) ??
    originOf(request.headers.get("referer"));
  if (!incoming || incoming !== self || incoming === trusted) return request;

  const headers = new Headers(request.headers);
  headers.set("origin", trusted);
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const r = new URL(referer);
      headers.set("referer", `${trusted}${r.pathname}${r.search}`);
    } catch {
      headers.set("referer", trusted);
    }
  }
  return new Request(request, { headers });
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(withTrustedOrigin(request)),
    },
  },
});
