import { ELEMENTS } from "./constants.js";
import { determineTenGod } from "./tenGods.js";

export const HIDDEN_STEM_WEIGHTS = [0.6, 0.3, 0.2];
const SEASON_ELEMENT = {
  spring: "wood",
  summer: "fire",
  autumn: "metal",
  winter: "water"
};

export function buildDerivedAnalysis({ pillars, hiddenStems = {}, tenGods = {}, yinYang = { yin: 0, yang: 0 } }) {
  const visibleElementCounts = countVisibleElements(pillars);
  const weightedElementCounts = countWeightedElements(pillars, hiddenStems);
  const monthSeason = pillars.month.branch.season;
  const seasonalElement = SEASON_ELEMENT[monthSeason] || pillars.month.branch.element;

  weightedElementCounts[seasonalElement] += 1;
  const roundedWeighted = roundCounts(weightedElementCounts);
  const rankedElements = rankCounts(roundedWeighted);
  const tenGodCounts = countTenGods(pillars, hiddenStems, tenGods);
  const rankedTenGods = rankCounts(tenGodCounts);

  return {
    visibleElementCounts,
    weightedElementCounts: roundedWeighted,
    rankedElements,
    strongElements: rankedElements.slice(0, 2).map(([element]) => element),
    weakElements: [...rankedElements].reverse().slice(0, 2).map(([element]) => element),
    yinYangMode: getYinYangMode(yinYang),
    dominantPolarity: yinYang.yang >= yinYang.yin ? "yang" : "yin",
    monthSeason,
    seasonalElement,
    tenGodCounts: roundCounts(tenGodCounts),
    dominantTenGods: rankedTenGods.slice(0, 3).map(([god]) => god),
    methodNote: "Weighted element analysis adds small hidden-stem weights and a month-season emphasis. It is an MVP interpretive aid, not a certified Manse-calendar strength model."
  };
}

export function rankCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function countVisibleElements(pillars) {
  const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  Object.values(pillars).forEach((pillar) => {
    counts[pillar.stem.element] += 1;
    counts[pillar.branch.element] += 1;
  });
  return counts;
}

function countWeightedElements(pillars, hiddenStems) {
  const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  Object.entries(pillars).forEach(([key, pillar]) => {
    const positionWeight = key === "month" ? 1.15 : 1;
    counts[pillar.stem.element] += 1 * positionWeight;
    counts[pillar.branch.element] += 1 * positionWeight;
    (hiddenStems[key] || []).forEach((stem, index) => {
      counts[stem.element] += HIDDEN_STEM_WEIGHTS[index] || 0.1;
    });
  });
  return counts;
}

function countTenGods(pillars, hiddenStems, tenGods) {
  const counts = {};
  Object.values(tenGods).forEach((god) => {
    counts[god] = (counts[god] || 0) + 1;
  });

  const dayStemIndex = pillars.day.stemIndex;
  Object.values(hiddenStems).forEach((stems) => {
    stems.forEach((stem, index) => {
      const god = determineTenGod(dayStemIndex, stem.index);
      counts[god] = (counts[god] || 0) + (HIDDEN_STEM_WEIGHTS[index] || 0.1);
    });
  });

  return counts;
}

function getYinYangMode(counts) {
  const difference = Math.abs((counts.yang || 0) - (counts.yin || 0));
  if (difference <= 1) return "balanced";
  return counts.yang > counts.yin ? "yang" : "yin";
}

function roundCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [key, Number(value.toFixed(2))])
  );
}
