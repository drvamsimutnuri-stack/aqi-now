import { describe, expect, it } from "vitest";
import { formatDayShort, formatHourShort, formatLocalHour, placeLine } from "./format";

describe("wall-clock formatting", () => {
  // These must not depend on the runtime timezone, or server-rendered HTML
  // will disagree with the browser and React will throw a hydration error.
  it("formats a local timestamp without shifting the hour", () => {
    expect(formatLocalHour("2026-08-04T18:00")).toBe("Tue 4 Aug, 18:00");
  });

  it("keeps midnight on its own day", () => {
    expect(formatLocalHour("2026-01-01T00:00")).toBe("Thu 1 Jan, 00:00");
    expect(formatDayShort("2026-01-01T00:00")).toBe("Thu 1");
  });

  it("formats the hour alone", () => {
    expect(formatHourShort("2026-08-04T07:00")).toBe("07:00");
  });

  it("returns the input unchanged when it is not a timestamp", () => {
    expect(formatLocalHour("not a date")).toBe("not a date");
  });
});

describe("placeLine", () => {
  it("joins the parts that exist", () => {
    expect(placeLine({ name: "Hyderabad", region: "Telangana", country: "India" })).toBe(
      "Hyderabad, Telangana, India",
    );
  });

  it("drops missing parts", () => {
    expect(placeLine({ name: "Singapore", region: null, country: "Singapore" })).toBe("Singapore");
  });

  it("does not repeat a name that also appears as the region", () => {
    expect(placeLine({ name: "Delhi", region: "Delhi", country: "India" })).toBe("Delhi, India");
  });
});
