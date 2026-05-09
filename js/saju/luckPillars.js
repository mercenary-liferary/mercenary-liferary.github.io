import { getBranchTime, getStem } from "./constants.js";
import { advancePillar } from "./pillars.js";
import { civilDateTimeToUtcMillis, getAdjacentSolarTerms, SOLAR_TERM_PRECISION } from "./solarTerms.js";

const DAY_MS = 86_400_000;

export function calculateLuckPillars({ gender, yearStemIndex, birthDate, birthTimeBranchIndex, monthPillar, offsetMinutes }) {
  const yearStem = getStem(yearStemIndex);
  const isYangYear = yearStem.yinYang === "yang";
  const direction = (gender === "male" && isYangYear) || (gender === "female" && !isYangYear) ? "forward" : "backward";
  const timeRange = getBranchTime(birthTimeBranchIndex);
  const localDateTime = {
    ...birthDate,
    hour: timeRange?.representativeHour ?? 12,
    minute: 0
  };
  const adjacent = getAdjacentSolarTerms(localDateTime, offsetMinutes);
  const targetTerm = direction === "forward" ? adjacent.next : adjacent.previous;
  const birthUtc = civilDateTimeToUtcMillis(localDateTime, offsetMinutes);
  const diffDays = Math.abs((targetTerm.utcMillis - birthUtc) / DAY_MS);
  const startYearsExact = diffDays / 3;
  let years = Math.floor(startYearsExact);
  let months = Math.round((startYearsExact - years) * 12);
  if (months === 12) {
    years += 1;
    months = 0;
  }

  const stepSign = direction === "forward" ? 1 : -1;
  const pillars = Array.from({ length: 8 }, (_, index) => {
    const pillar = advancePillar(monthPillar, stepSign * (index + 1));
    const startAge = years + index * 10;
    return {
      index: index + 1,
      startAge,
      endAge: startAge + 9,
      stemIndex: pillar.stemIndex,
      branchIndex: pillar.branchIndex,
      han: pillar.han,
      ko: pillar.ko
    };
  });

  return {
    direction,
    startAge: {
      years,
      months,
      exactYears: Number(startYearsExact.toFixed(2)),
      sourceTerm: targetTerm.key
    },
    precision: SOLAR_TERM_PRECISION,
    note: "Start age uses approximate fixed solar terms and a representative hour for the selected time branch.",
    pillars
  };
}
