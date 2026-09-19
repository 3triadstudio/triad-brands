import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const url = new URL(request.url);
      const isAdminHost = url.hostname === "admin.triadbrands.co.ke";
      const isPublicHost =
        url.hostname === "triadbrands.co.ke" || url.hostname === "www.triadbrands.co.ke";

      const isAdminPath =
        url.pathname === "/admin" ||
        url.pathname.startsWith("/admin/") ||
        url.pathname === "/login" ||
        url.pathname === "/auth";

      if (isPublicHost && isAdminPath) {
        const adminUrl = new URL(request.url);
        adminUrl.hostname = "admin.triadbrands.co.ke";
        return Response.redirect(adminUrl, 308);
      }

      if (isAdminHost && url.pathname === "/") {
        const dashboardUrl = new URL(request.url);
        dashboardUrl.pathname = "/admin";
        return Response.redirect(dashboardUrl, 308);
      }

      const isAdminDocumentPath =
        isAdminPath ||
        url.pathname.startsWith("/_serverFn/") ||
        url.pathname.startsWith("/assets/") ||
        /\.[a-z0-9]+$/i.test(url.pathname);

      if (isAdminHost && !isAdminDocumentPath) {
        const publicUrl = new URL(request.url);
        publicUrl.hostname = "triadbrands.co.ke";
        return Response.redirect(publicUrl, 308);
      }

      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
