export const SOLAR_TERM_PRECISION = "approximate-fixed-date";

export const SOLAR_TERM_NOTE =
  "MVP solar terms use fixed approximate local dates at 00:00. Replace with precomputed exact local datetimes for 1900-2050 before claiming Manse-calendar precision.";

const TERM_DEFINITIONS = [
  { key: "sohan", month: 1, day: 6 },
  { key: "ipchun", month: 2, day: 4 },
  { key: "gyeongchip", month: 3, day: 6 },
  { key: "cheongmyeong", month: 4, day: 5 },
  { key: "ipha", month: 5, day: 6 },
  { key: "mangjong", month: 6, day: 6 },
  { key: "soseo", month: 7, day: 7 },
  { key: "ipchu", month: 8, day: 8 },
  { key: "baengno", month: 9, day: 8 },
  { key: "hallo", month: 10, day: 8 },
  { key: "ipdong", month: 11, day: 7 },
  { key: "daeseol", month: 12, day: 7 }
];

const MONTH_STARTS = {
  ipchun: { branchIndex: 2, orderFromTiger: 0 },
  gyeongchip: { branchIndex: 3, orderFromTiger: 1 },
  cheongmyeong: { branchIndex: 4, orderFromTiger: 2 },
  ipha: { branchIndex: 5, orderFromTiger: 3 },
  mangjong: { branchIndex: 6, orderFromTiger: 4 },
  soseo: { branchIndex: 7, orderFromTiger: 5 },
  ipchu: { branchIndex: 8, orderFromTiger: 6 },
  baengno: { branchIndex: 9, orderFromTiger: 7 },
  hallo: { branchIndex: 10, orderFromTiger: 8 },
  ipdong: { branchIndex: 11, orderFromTiger: 9 },
  daeseol: { branchIndex: 0, orderFromTiger: 10 },
  sohan: { branchIndex: 1, orderFromTiger: 11 }
};

export function civilDateTimeToUtcMillis({ year, month, day, hour = 0, minute = 0 }, offsetMinutes = 0) {
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0) - offsetMinutes * 60_000;
}

export function getApproxSolarTermsForYear(year, offsetMinutes = 540) {
  return TERM_DEFINITIONS.map((term) => ({
    ...term,
    year,
    hour: 0,
    minute: 0,
    precision: SOLAR_TERM_PRECISION,
    utcMillis: civilDateTimeToUtcMillis({ year, month: term.month, day: term.day }, offsetMinutes)
  })).sort((a, b) => a.utcMillis - b.utcMillis);
}

export function getIpchunForYear(year, offsetMinutes = 540) {
  return getApproxSolarTermsForYear(year, offsetMinutes).find((term) => term.key === "ipchun");
}

export function getSajuYear(localDateTime, offsetMinutes = 540) {
  const birthUtc = civilDateTimeToUtcMillis(localDateTime, offsetMinutes);
  const ipchun = getIpchunForYear(localDateTime.year, offsetMinutes);
  return birthUtc < ipchun.utcMillis ? localDateTime.year - 1 : localDateTime.year;
}

export function getMonthInfo(localDateTime, offsetMinutes = 540) {
  const birthUtc = civilDateTimeToUtcMillis(localDateTime, offsetMinutes);
  const terms = getApproxSolarTermsForYear(localDateTime.year, offsetMinutes);
  let current = {
    key: "daeseol",
    branchIndex: 0,
    orderFromTiger: 10,
    precision: SOLAR_TERM_PRECISION
  };

  for (const term of terms) {
    const monthStart = MONTH_STARTS[term.key];
    if (monthStart && birthUtc >= term.utcMillis) {
      current = {
        key: term.key,
        branchIndex: monthStart.branchIndex,
        orderFromTiger: monthStart.orderFromTiger,
        precision: SOLAR_TERM_PRECISION,
        startsAtUtcMillis: term.utcMillis
      };
    }
  }

  return current;
}

export function getAdjacentSolarTerms(localDateTime, offsetMinutes = 540) {
  const birthUtc = civilDateTimeToUtcMillis(localDateTime, offsetMinutes);
  const terms = [
    ...getApproxSolarTermsForYear(localDateTime.year - 1, offsetMinutes),
    ...getApproxSolarTermsForYear(localDateTime.year, offsetMinutes),
    ...getApproxSolarTermsForYear(localDateTime.year + 1, offsetMinutes)
  ].sort((a, b) => a.utcMillis - b.utcMillis);

  const previous = [...terms].reverse().find((term) => term.utcMillis <= birthUtc);
  const next = terms.find((term) => term.utcMillis > birthUtc);
  return { previous, next, birthUtc };
}
