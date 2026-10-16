import "server-only";

import { headers } from "next/headers";
import env, { cleanHost } from "@/lib/envConfig";

function getEnvHost() {
  return env.public.domainHost || env.server.vercelHost || null;
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
