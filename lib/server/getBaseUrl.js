import "server-only";

import { headers } from "next/headers";

function cleanHost(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const host = withoutProtocol.split("/")[0].trim();
  return host || null;
}

function getEnvHost() {
  return (
    cleanHost(process.env.NEXT_PUBLIC_DOMAIN_URL) ||
    cleanHost(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    cleanHost(process.env.VERCEL_URL) ||
    null
  );
}

export async function getBaseUrl() {
  try {
    const headerList = await headers();
    const forwardedHost = headerList.get("x-forwarded-host");
    const host = cleanHost(forwardedHost) || cleanHost(headerList.get("host"));
    if (host) {
      const proto = headerList.get("x-forwarded-proto")?.split(",")[0].trim();
      const protocol = proto === "http" || proto === "https" ? proto : "https";
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() is unavailable outside a request (e.g. static prerender).
  }

  const envHost = getEnvHost();
  if (envHost) return `https://${envHost}`;

  return "http://localhost:3000";
}
