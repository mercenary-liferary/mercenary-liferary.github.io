import { getStem } from "./constants.js";

const GENERATES = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood"
};

const CONTROLS = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood"
};

export function determineTenGod(dayStemIndex, targetStemIndex) {
  if (dayStemIndex === targetStemIndex) return "self";

  const day = getStem(dayStemIndex);
  const target = getStem(targetStemIndex);
  const samePolarity = day.yinYang === target.yinYang;

  if (day.element === target.element) {
    return samePolarity ? "friend" : "robWealth";
  }

  if (GENERATES[day.element] === target.element) {
    return samePolarity ? "eatingGod" : "hurtingOfficer";
  }

  if (CONTROLS[day.element] === target.element) {
    return samePolarity ? "indirectWealth" : "directWealth";
  }

  if (CONTROLS[target.element] === day.element) {
    return samePolarity ? "sevenKillings" : "directOfficer";
  }

  if (GENERATES[target.element] === day.element) {
    return samePolarity ? "indirectResource" : "directResource";
  }

  return "self";
}

export function buildTenGodSummary(dayStemIndex, pillars) {
  return Object.fromEntries(
    Object.entries(pillars).map(([key, pillar]) => [key, determineTenGod(dayStemIndex, pillar.stemIndex)])
  );
}
