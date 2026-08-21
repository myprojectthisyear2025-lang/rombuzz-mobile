/**
 * ============================================================
 * 📁 File: src/monitoring/sentryPrivacy.ts
 * 🎯 Purpose: Protect private RomBuzz data before Sentry upload.
 *
 * Removes:
 *   - request bodies / headers / cookies
 *   - URL query parameters
 *   - user PII except internal user ID
 *   - console breadcrumbs
 *   - arbitrary extra payloads
 * ============================================================
 */

function stripUrlQuery(value: unknown) {
  if (typeof value !== "string") return value;

  const index = value.indexOf("?");
  return index >= 0 ? value.slice(0, index) : value;
}

export function sanitizeSentryBreadcrumb(breadcrumb: any) {
  if (!breadcrumb || typeof breadcrumb !== "object") {
    return breadcrumb;
  }

  // RomBuzz console logs may contain application data.
  if (breadcrumb.category === "console") {
    return null;
  }

  if (!breadcrumb.data || typeof breadcrumb.data !== "object") {
    return breadcrumb;
  }

  const data = {
    ...breadcrumb.data,
  };

  if ("url" in data) {
    data.url = stripUrlQuery(data.url);
  }

  delete data.headers;
  delete data.body;
  delete data.request;
  delete data.response;
  delete data.request_body;
  delete data.response_body;

  return {
    ...breadcrumb,
    data,
  };
}

export function sanitizeSentryEvent(event: any) {
  if (!event || typeof event !== "object") {
    return event;
  }

  if (event.request) {
    event.request.url = stripUrlQuery(event.request.url);

    delete event.request.headers;
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    delete event.request.env;
  }

  if (event.user?.id != null) {
    event.user = {
      id: String(event.user.id),
    };
  } else {
    delete event.user;
  }

  // Never allow arbitrary application payloads into Sentry.
  delete event.extra;

  // RomBuzz uses location features; don't send location context.
  if (event.contexts?.location) {
    delete event.contexts.location;
  }

  return event;
}