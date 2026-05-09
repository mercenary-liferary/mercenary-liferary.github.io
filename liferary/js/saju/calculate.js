import { ELEMENTS, getBranchByKey, getBranchTime, getCountry, getStem } from "./constants.js";
import { normalizeCalendarDate } from "./lunar.js";
import { SOLAR_TERM_NOTE } from "./solarTerms.js";
import { getDayPillar, getHourPillar, getMonthPillar, getYearPillar } from "./pillars.js";
import { buildHiddenStemSummary } from "./hiddenStems.js";
import { buildTenGodSummary } from "./tenGods.js";
import { calculateLuckPillars } from "./luckPillars.js";

export function calculateSaju(input) {
  const country = getCountry(input.birthCountry);
  const normalized = normalizeCalendarDate({
    calendar: input.birthCalendar,
    year: input.birthYear,
    month: input.birthMonth,
    day: input.birthDay,
    isLunarLeapMonth: input.isLunarLeapMonth
  });
  const birthDate = normalized.solar;
  const birthBranch = getBranchByKey(input.birthTimeBranch);
  const timeRange = getBranchTime(birthBranch.index);
  const birthDateTime = {
    ...birthDate,
    hour: timeRange.representativeHour,
    minute: 0
  };

  const year = getYearPillar(birthDateTime, country.offsetMinutes);
  const month = getMonthPillar(birthDateTime, year.stemIndex, country.offsetMinutes);
  const day = getDayPillar(birthDate);
  const hour = getHourPillar(day.stemIndex, birthBranch.index);
  const pillars = { year, month, day, hour };
  const tenGods = buildTenGodSummary(day.stemIndex, pillars);
  const hiddenStems = buildHiddenStemSummary(pillars);
  const fiveElements = countFiveElements(pillars);
  const yinYang = countYinYang(pillars);
  const luckPillars = calculateLuckPillars({
    gender: input.gender,
    yearStemIndex: year.stemIndex,
    birthDate,
    birthTimeBranchIndex: birthBranch.index,
    monthPillar: month,
    offsetMinutes: country.offsetMinutes
  });

  return {
    calculationVersion: "liferary-mvp-0.1",
    calculatedAt: new Date().toISOString(),
    input: {
      name: input.name,
      gender: input.gender,
      birthCalendar: input.birthCalendar,
      isLunarLeapMonth: Boolean(input.isLunarLeapMonth),
      birthDate,
      birthTimeBranch: input.birthTimeBranch,
      birthCountry: country.code,
      timezone: country.timezone,
      timezoneOffsetMinutes: country.offsetMinutes
    },
    pillars,
    dayMaster: getStem(day.stemIndex),
    tenGods,
    hiddenStems,
    fiveElements,
    yinYang,
    luckPillars,
    warnings: [
      ...normalized.warnings,
      SOLAR_TERM_NOTE,
      "Day pillar base date 2000-01-01 = 戊午 is deterministic but should be verified against multiple Manse calendar samples before production use.",
      "Country-level timezone is approximate; accurate Saju may require birth city, longitude, historical timezone rules, true solar time, and night-rat-hour handling."
    ]
  };
}

export function runValidationSamples() {
  const yearSamples = [
    { label: "1984 after Ipchun", input: sample(1984, 2, 5), expected: "甲子" },
    { label: "2024 after Ipchun", input: sample(2024, 2, 5), expected: "甲辰" },
    { label: "2025 after Ipchun", input: sample(2025, 2, 5), expected: "乙巳" },
    { label: "2026 after Ipchun", input: sample(2026, 2, 5), expected: "丙午" }
  ];

  const yearResults = yearSamples.map(({ label, input, expected }) => {
    const result = calculateSaju(input);
    return {
      label,
      expectedYearPillar: expected,
      actualYearPillar: result.pillars.year.han,
      pass: result.pillars.year.han === expected
    };
  });

  const monthSamples = [
    { label: "甲 year + 寅 month", input: sample(2024, 2, 5), expected: "丙寅" },
    { label: "乙 year + 寅 month", input: sample(2025, 2, 5), expected: "戊寅" },
    { label: "丙 year + 寅 month", input: sample(2026, 2, 5), expected: "庚寅" },
    { label: "丁 year + 寅 month", input: sample(2027, 2, 5), expected: "壬寅" },
    { label: "戊 year + 寅 month", input: sample(2028, 2, 5), expected: "甲寅" }
  ].map(({ label, input, expected }) => {
    const result = calculateSaju(input);
    return {
      label,
      expectedMonthPillar: expected,
      actualMonthPillar: result.pillars.month.han,
      pass: result.pillars.month.han === expected
    };
  });

  const hourSamples = [
    { label: "甲 day + 子 hour", dayStemIndex: 0, expected: "甲子" },
    { label: "己 day + 子 hour", dayStemIndex: 5, expected: "甲子" },
    { label: "乙 day + 子 hour", dayStemIndex: 1, expected: "丙子" },
    { label: "庚 day + 子 hour", dayStemIndex: 6, expected: "丙子" },
    { label: "丙 day + 子 hour", dayStemIndex: 2, expected: "戊子" },
    { label: "辛 day + 子 hour", dayStemIndex: 7, expected: "戊子" },
    { label: "丁 day + 子 hour", dayStemIndex: 3, expected: "庚子" },
    { label: "壬 day + 子 hour", dayStemIndex: 8, expected: "庚子" },
    { label: "戊 day + 子 hour", dayStemIndex: 4, expected: "壬子" },
    { label: "癸 day + 子 hour", dayStemIndex: 9, expected: "壬子" }
  ].map(({ label, dayStemIndex, expected }) => {
    const pillar = getHourPillar(dayStemIndex, 0);
    return {
      label,
      expectedHourPillar: expected,
      actualHourPillar: pillar.han,
      pass: pillar.han === expected
    };
  });

  return [...yearResults, ...monthSamples, ...hourSamples];
}

function countFiveElements(pillars) {
  const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  Object.values(pillars).forEach((pillar) => {
    counts[pillar.stem.element] += 1;
    counts[pillar.branch.element] += 1;
  });
  return counts;
}

function countYinYang(pillars) {
  const counts = { yin: 0, yang: 0 };
  Object.values(pillars).forEach((pillar) => {
    counts[pillar.stem.yinYang] += 1;
    counts[pillar.branch.yinYang] += 1;
  });
  return counts;
}

function sample(year, month, day) {
  return {
    name: "Sample",
    gender: "male",
    birthCalendar: "solar",
    isLunarLeapMonth: false,
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    birthTimeBranch: "zi",
    birthCountry: "KR"
  };
}

if (typeof process !== "undefined" && process.argv?.includes("--samples")) {
  console.table(runValidationSamples());
}
