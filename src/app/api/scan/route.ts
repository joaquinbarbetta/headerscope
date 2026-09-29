import { DEFAULT_LOCALE, isLocale, msg, translate, type Locale, type Message } from "@/lib/i18n";
import { scanErrorMessage } from "@/lib/i18n/errors";
import { rateLimit } from "@/lib/rate-limit";
import { TargetError, scan } from "@/lib/scanner";

export const maxDuration = 30;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

/** `error` is ready to display; `message` lets clients re-render it in another locale. */
function errorResponse(lang: Locale, message: Message, init: ResponseInit) {
  return Response.json({ error: translate(lang, message), message }, init);
}

export async function POST(request: Request) {
  let body: { url?: unknown; lang?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    // Reported below, once we know which language to answer in.
  }
  const lang = isLocale(body?.lang) ? body.lang : DEFAULT_LOCALE;

  const limit = rateLimit(clientIp(request));
  if (!limit.ok) {
    return errorResponse(lang, msg("error.rateLimited", { seconds: limit.retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  if (body === null || typeof body !== "object") {
    return errorResponse(lang, msg("error.invalidJson"), { status: 400 });
  }
  const { url } = body;
  if (typeof url !== "string" || (body.lang !== undefined && !isLocale(body.lang))) {
    return errorResponse(lang, msg("error.invalidBody"), { status: 400 });
  }

  try {
    const report = await scan(url, undefined, lang);
    return Response.json(report);
  } catch (err) {
    const status = err instanceof TargetError ? 400 : 502;
    return errorResponse(lang, scanErrorMessage(err), { status });
  }
}
