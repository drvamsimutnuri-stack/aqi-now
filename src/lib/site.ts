/**
 * Canonical origin for absolute URLs in metadata, sitemaps and share cards.
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is attached; otherwise fall
 * back to the URL Vercel injects per deployment, then to localhost in dev.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "AQI Now";
