import { getStem } from "./constants.js";

export const HIDDEN_STEMS_BY_BRANCH = {
  0: [9],
  1: [5, 9, 7],
  2: [0, 2, 4],
  3: [1],
  4: [4, 1, 9],
  5: [2, 4, 6],
  6: [3, 5],
  7: [5, 3, 1],
  8: [6, 8, 4],
  9: [7],
  10: [4, 7, 3],
  11: [8, 0]
};

export function getHiddenStems(branchIndex) {
  return (HIDDEN_STEMS_BY_BRANCH[branchIndex] || []).map((stemIndex) => getStem(stemIndex));
}

export function buildHiddenStemSummary(pillars) {
  return Object.fromEntries(
    Object.entries(pillars).map(([key, pillar]) => [key, getHiddenStems(pillar.branchIndex)])
  );
}
