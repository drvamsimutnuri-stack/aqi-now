import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/snapshot";

export const revalidate = 600;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Valid lat and lon are required." }, { status: 400 });
  }

  const name = params.get("name");
  try {
    const snapshot = await buildSnapshot(
      lat,
      lon,
      name ? { name, region: params.get("region"), country: params.get("country") } : undefined,
    );
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
