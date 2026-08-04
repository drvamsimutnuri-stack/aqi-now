import { NextResponse } from "next/server";
import { reverseGeocode, searchPlaces } from "@/lib/openmeteo";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q");
  const lat = params.get("lat");
  const lon = params.get("lon");

  try {
    // Coordinate pair means reverse lookup: name the place the browser gave us.
    if (lat !== null && lon !== null) {
      const latitude = Number(lat);
      const longitude = Number(lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
      }
      const place = await reverseGeocode(latitude, longitude);
      return NextResponse.json({ place }, {
        headers: { "Cache-Control": "public, s-maxage=86400" },
      });
    }

    if (!query) {
      return NextResponse.json({ error: "Provide q, or lat and lon." }, { status: 400 });
    }

    const results = await searchPlaces(query);
    return NextResponse.json({ results }, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
