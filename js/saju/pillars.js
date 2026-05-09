import { formatPillar, mod } from "./constants.js";
import { getMonthInfo, getSajuYear } from "./solarTerms.js";

const BASE_DAY = { year: 2000, month: 1, day: 1, stemIndex: 4, branchIndex: 6 }; // 2000-01-01 = 戊午; verify against multiple Manse samples before production.

export function getYearPillar(localDateTime, offsetMinutes) {
  const sajuYear = getSajuYear(localDateTime, offsetMinutes);
  const stemIndex = mod(sajuYear - 4, 10);
  const branchIndex = mod(sajuYear - 4, 12);
  return {
    ...formatPillar(stemIndex, branchIndex),
    sajuYear
  };
}

export function getMonthPillar(localDateTime, yearStemIndex, offsetMinutes) {
  const monthInfo = getMonthInfo(localDateTime, offsetMinutes);
  const stemIndex = mod((yearStemIndex % 5) * 2 + 2 + monthInfo.orderFromTiger, 10);
  return {
    ...formatPillar(stemIndex, monthInfo.branchIndex),
    monthOrderFromTiger: monthInfo.orderFromTiger,
    solarTermBoundary: monthInfo.key,
    precision: monthInfo.precision
  };
}

export function getDayPillar(localDate) {
  const diffDays = daysBetween(BASE_DAY, localDate);
  const stemIndex = mod(BASE_DAY.stemIndex + diffDays, 10);
  const branchIndex = mod(BASE_DAY.branchIndex + diffDays, 12);
  return {
    ...formatPillar(stemIndex, branchIndex),
    baseDate: BASE_DAY,
    diffDays
  };
}

export function getHourPillar(dayStemIndex, hourBranchIndex) {
  const stemIndex = mod((dayStemIndex % 5) * 2 + hourBranchIndex, 10);
  return formatPillar(stemIndex, hourBranchIndex);
}

export function advancePillar(pillar, step) {
  return formatPillar(mod(pillar.stemIndex + step, 10), mod(pillar.branchIndex + step, 12));
}

export function daysBetween(fromDate, toDate) {
  return daysFromCivil(toDate.year, toDate.month, toDate.day) - daysFromCivil(fromDate.year, fromDate.month, fromDate.day);
}

export function isValidCivilDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const nextDay = civilFromDays(daysFromCivil(year, month, day));
  return nextDay.year === year && nextDay.month === month && nextDay.day === day;
}

export function daysFromCivil(year, month, day) {
  let y = year;
  y -= month <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = month + (month > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(days) {
  let z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  let y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  y += month <= 2 ? 1 : 0;
  return { year: y, month, day };
}
