import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAirQuality, reverseGeocode } from "./openmeteo";

const payload = { latitude: 17.4, longitude: 78.5, elevation: 500, timezone: "Asia/Kolkata" };

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchAirQuality resilience", () => {
  it("recovers from a transient 5xx instead of failing the page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers from a dropped connection", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a rate limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 429))
      .mockResolvedValueOnce(jsonResponse(null, 429))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not waste retries on a client error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).rejects.toThrow(/HTTP 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting attempts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).rejects.toThrow(/HTTP 503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("requests the coordinates it was given", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await fetchAirQuality(17.385, 78.4867);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    // Sent at 4-decimal precision, roughly 11 metres — enough to be exact for
    // our purposes without turning a user's position into a fingerprint.
    expect(Number(url.searchParams.get("latitude"))).toBe(17.385);
    expect(Number(url.searchParams.get("longitude"))).toBe(78.4867);
  });
});

/**
 * Place names are cosmetic, so an unreachable Nominatim must never be allowed
 * to slow a page down. This is the bug that made renders take 11 seconds.
 */
describe("reverseGeocode never blocks a page", () => {
  it("returns a name when the lookup succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ address: { city: "Hyderabad", state: "Telangana", country: "India" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(reverseGeocode(17.385, 78.4867)).resolves.toEqual({
      name: "Hyderabad",
      region: "Telangana",
      country: "India",
    });
  });

  it("caps how long it waits, rather than inheriting a 10s connect timeout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ address: { city: "X" } }));
    vi.stubGlobal("fetch", fetchMock);

    await reverseGeocode(1, 1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails soft and then stops asking, so one outage is not paid per visitor", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("connect timeout"));
    vi.stubGlobal("fetch", failing);

    // Distinct coordinates prove the breaker is global, not per-location.
    await expect(reverseGeocode(51.5, -0.12)).resolves.toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);

    await expect(reverseGeocode(19.07, 72.87)).resolves.toBeNull();
    await expect(reverseGeocode(28.61, 77.2)).resolves.toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);
  });
});
