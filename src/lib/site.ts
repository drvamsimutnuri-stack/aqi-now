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

/**
 * Publisher branding. Change these two values and every place it appears in the
 * UI and metadata follows — header, footer and page titles — so rebranding later
 * is a one-line edit rather than a search across components.
 */
export const BRAND_NAME = "Vamsipedia";
export const BRAND_URL: string | null = null;
