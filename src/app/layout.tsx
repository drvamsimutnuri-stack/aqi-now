import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AQI Now — live air quality index and health effects",
    template: "%s | AQI Now",
  },
  description:
    "Live air quality for any location: PM2.5, PM10, ozone, NO₂, SO₂, CO, ammonia, dust and pollen, scored on the US EPA, European and Indian air quality indices, with the health effects each pollutant causes.",
  keywords: [
    "AQI",
    "air quality index",
    "PM2.5",
    "PM10",
    "ozone",
    "nitrogen dioxide",
    "air pollution health effects",
    "live air quality",
  ],
  openGraph: {
    title: "AQI Now — live air quality index and health effects",
    description:
      "Instant AQI on three international standards, every pollutant broken out, and what each one does to your body.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AQI Now — live air quality index and health effects",
    description:
      "Instant AQI on three international standards, every pollutant broken out, and what each one does to your body.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Opts into keeping the CSS smooth scroll during route transitions.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 text-sm font-black text-ink-950"
              >
                A
              </span>
              <span className="text-base font-semibold tracking-tight">
                AQI<span className="text-sky-400">Now</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm text-mist-300">
              <Link
                href="/standards"
                className="rounded-md px-2.5 py-1.5 transition hover:bg-ink-800 hover:text-mist-100"
              >
                Standards
              </Link>
              <Link
                href="/pollutants"
                className="rounded-md px-2.5 py-1.5 transition hover:bg-ink-800 hover:text-mist-100"
              >
                Pollutants
              </Link>
              <Link
                href="/cities"
                className="rounded-md px-2.5 py-1.5 transition hover:bg-ink-800 hover:text-mist-100"
              >
                Cities
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-ink-700/60 bg-ink-950/60">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-relaxed text-mist-400 sm:px-6">
            <p>
              Concentrations come from the Copernicus Atmosphere Monitoring Service (CAMS) via{" "}
              <a
                href="https://open-meteo.com/en/docs/air-quality-api"
                className="text-sky-400 underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
              . Place names from Open-Meteo Geocoding and OpenStreetMap Nominatim. Index values are
              computed in this app from the published US EPA, European Environment Agency and CPCB
              breakpoint tables.
            </p>
            <p>
              CAMS is a global model at roughly 11 km resolution, not a street-corner sensor. Treat
              readings as a well-informed estimate for your area, and defer to a nearby reference
              monitor when one exists.
            </p>
            <p className="text-mist-400/80">
              Health information is general guidance drawn from EPA AirNow and WHO Air Quality
              Guidelines. It is not medical advice — talk to a clinician about your own situation.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
