export class LunarConversionUnsupportedError extends Error {
  constructor() {
    super("Exact Korean lunar conversion table is not bundled in this MVP.");
    this.name = "LunarConversionUnsupportedError";
    this.code = "LUNAR_UNSUPPORTED";
  }
}

export function normalizeCalendarDate({ calendar, year, month, day, isLunarLeapMonth = false }) {
  if (calendar === "solar") {
    return {
      calendar,
      solar: { year, month, day },
      warnings: []
    };
  }

  // TODO: Replace this placeholder with a verified Korean lunar calendar table
  // for 1900-2050, including leap months. We intentionally refuse to
  // approximate lunar conversion because a wrong conversion changes pillars.
  throw new LunarConversionUnsupportedError({ year, month, day, isLunarLeapMonth });
}
