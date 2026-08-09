import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly allow the Geolocation API. Some browsers treat a missing
  // Permissions-Policy as "ask", but a deploy behind a stricter host or
  // in-app browser can otherwise refuse navigator.geolocation silently.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
