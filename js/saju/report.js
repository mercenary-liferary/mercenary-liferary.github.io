import { EARTHLY_BRANCHES, ELEMENTS, HEAVENLY_STEMS, getBranch, getStem, mod } from "./constants.js";
import { getYearPillar } from "./pillars.js";
import { determineTenGod } from "./tenGods.js";
import { HIDDEN_STEM_WEIGHTS, buildDerivedAnalysis, rankCounts } from "./analysis.js";

const ELEMENT_BEHAVIOR = {
  wood: {
    noun: "성장과 기획",
    strength: "새로운 목표를 세우고 가능성을 키워가는 힘",
    excess: "방향을 너무 많이 열어두어 마무리가 늦어지는 패턴",
    lack: "시작한 흐름을 오래 키우기 위해 작은 루틴이 필요한 지점",
    habit: "큰 목표를 작은 반복 계획으로 쪼개기"
  },
  fire: {
    noun: "표현과 속도",
    strength: "생각과 감정을 밖으로 드러내고 분위기를 움직이는 힘",
    excess: "반응이 빨라져 소진되거나 감정적 판단이 앞서는 패턴",
    lack: "좋은 생각을 보여주고 알리는 연습이 필요한 지점",
    habit: "말, 글, 발표, 작은 공개 결과물로 생각을 보이게 만들기"
  },
  earth: {
    noun: "책임과 축적",
    strength: "현실을 붙잡고 관계와 일을 오래 유지하는 힘",
    excess: "혼자 책임을 많이 떠안아 움직임이 무거워지는 패턴",
    lack: "생활 기반과 안정적인 반복 구조를 의식적으로 만들어야 하는 지점",
    habit: "수면, 식사, 일정, 돈의 기본 표를 단순하게 유지하기"
  },
  metal: {
    noun: "기준과 정리",
    strength: "판단 기준을 세우고 품질을 관리하는 힘",
    excess: "비판과 경계가 강해져 기회를 좁히는 패턴",
    lack: "거절, 마감, 우선순위를 분명히 하는 연습이 필요한 지점",
    habit: "선택 기준을 한 문장으로 정하고 불필요한 약속 줄이기"
  },
  water: {
    noun: "관찰과 학습",
    strength: "상황을 읽고 정보를 모아 다음 수를 준비하는 힘",
    excess: "생각이 길어져 실행이 늦어지는 패턴",
    lack: "충분히 쉬고 정리하며 배움을 축적해야 하는 지점",
    habit: "하루를 기록하고, 결정 전 확인 질문을 하나 남기기"
  }
};

const YIN_YANG_LANGUAGE = {
  yin: {
    label: "내면 정리형",
    plain: "밖으로 바로 드러내기보다 안에서 충분히 정리한 뒤 움직이려는 경향",
    caution: "표현을 너무 늦추거나 혼자 감당하는 습관"
  },
  yang: {
    label: "외부 실행형",
    plain: "생각이 정리되면 밖으로 빠르게 움직이고 반응하는 경향",
    caution: "확인보다 추진이 앞서 결정이 빨라지는 습관"
  },
  balanced: {
    label: "전환 균형형",
    plain: "상황에 따라 관찰과 실행을 오갈 수 있는 경향",
    caution: "주변 요구에 따라 리듬이 흔들리는 습관"
  }
};

const TEN_GOD_GROUPS = {
  peer: ["friend", "robWealth"],
  expression: ["eatingGod", "hurtingOfficer"],
  wealth: ["directWealth", "indirectWealth"],
  authority: ["directOfficer", "sevenKillings"],
  resource: ["directResource", "indirectResource"]
};

const TEN_GOD_TO_GROUP = Object.fromEntries(
  Object.entries(TEN_GOD_GROUPS).flatMap(([group, gods]) => gods.map((god) => [god, group]))
);

const TEN_GOD_KEYS = [
  "friend",
  "robWealth",
  "eatingGod",
  "hurtingOfficer",
  "directWealth",
  "indirectWealth",
  "directOfficer",
  "sevenKillings",
  "directResource",
  "indirectResource"
];

const TEN_GOD_KO = {
  friend: "비견",
  robWealth: "겁재",
  eatingGod: "식신",
  hurtingOfficer: "상관",
  directWealth: "정재",
  indirectWealth: "편재",
  directOfficer: "정관",
  sevenKillings: "편관",
  directResource: "정인",
  indirectResource: "편인",
  self: "일간"
};

const GROUP_LANGUAGE = {
  peer: {
    label: "자기주도와 동료 관계",
    high: "스스로 결정하고 버티는 힘이 강합니다. 다만 혼자 다 하려 하거나 주변과 힘겨루기가 생길 수 있습니다.",
    medium: "자기 기준과 협업 감각을 함께 쓸 수 있습니다. 독립성과 조율 사이의 균형이 중요합니다.",
    low: "혼자 밀어붙이기보다 좋은 사람, 안정적인 시스템, 명확한 역할의 도움을 받을 때 더 잘 움직입니다.",
    excessive: "독립성과 경쟁심이 강해져 돈과 관계가 얽힐 때 부담이 커질 수 있습니다."
  },
  expression: {
    label: "표현과 결과물",
    high: "생각을 말, 글, 결과물, 행동으로 풀어내는 힘이 강합니다. 자유도가 있을수록 재능이 잘 드러납니다.",
    medium: "필요할 때 표현하고 결과를 만들 수 있습니다. 꾸준히 보여주는 습관이 평가를 끌어올립니다.",
    low: "생각은 많아도 바로 표현하거나 결과물로 만드는 데 시간이 걸릴 수 있습니다. 작은 공개가 중요합니다.",
    excessive: "표현이 날카롭거나 빨라져 규칙과 충돌할 수 있습니다. 재능은 정제될 때 신뢰가 됩니다."
  },
  wealth: {
    label: "현실 감각과 재물",
    high: "현실적인 결과를 만들고 자원을 움직이는 감각이 강하게 나타날 수 있습니다.",
    medium: "돈과 결과를 의식하되, 무리한 확장보다는 안정적인 기준을 둘 때 흐름이 좋아집니다.",
    low: "돈 자체보다 의미, 안정감, 관계, 배움 같은 기준이 먼저 작동할 수 있습니다.",
    excessive: "기회와 지출이 함께 커지기 쉽습니다. 좋아 보이는 제안일수록 유지 가능성을 확인해야 합니다."
  },
  authority: {
    label: "책임과 사회적 기준",
    high: "책임, 기준, 약속, 역할을 무겁게 받아들이는 편입니다. 공식적인 신뢰를 쌓기 좋습니다.",
    medium: "규칙과 자율성 사이에서 현실적인 균형을 찾을 수 있습니다.",
    low: "정해진 틀에 무조건 맞추기보다 납득할 수 있는 자율성이 있을 때 더 잘 움직입니다.",
    excessive: "책임감이 압박으로 바뀌면 몸과 마음이 경직될 수 있습니다. 맡을 일과 거절할 일을 구분해야 합니다."
  },
  resource: {
    label: "학습과 회복",
    high: "배우고 정리하고 이해하는 힘이 강합니다. 전문성, 문서화, 준비 과정에서 안정감이 생깁니다.",
    medium: "배움과 실행을 비교적 균형 있게 오갈 수 있습니다.",
    low: "오래 고민하기보다 직접 부딪치며 배우는 쪽이 더 잘 맞을 수 있습니다. 다만 회복 시간을 의식해야 합니다.",
    excessive: "생각과 준비가 길어져 실행이 늦어질 수 있습니다. 완벽한 이해보다 작은 실험이 필요합니다."
  }
};

const PILLAR_MEANINGS = {
  year: "early background / outer environment",
  month: "growth environment / social role / career foundation",
  day: "self / spouse / core identity",
  hour: "inner direction / later life / children / future tendency"
};

const BRANCH_COMBINATIONS = [
  [0, 1],
  [2, 11],
  [3, 10],
  [4, 9],
  [5, 8],
  [6, 7]
];

const BRANCH_CLASHES = [
  [0, 6],
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 10],
  [5, 11]
];

const BRANCH_HARMS = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
  [8, 11],
  [9, 10]
];

const BRANCH_BREAKS = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [7, 10]
];

const BRANCH_PUNISHMENTS = [
  [2, 5, 8],
  [1, 7, 10],
  [0, 3],
  [4, 4],
  [6, 6],
  [9, 9],
  [11, 11]
];

export function buildSajuReport({ record, result, lang = "ko", now = new Date() }) {
  const normalizedSaju = normalizeSaju({ record, result, now });
  const interpretationProfile = buildInterpretationProfile(normalizedSaju);
  const finalReport = localizeFinalReport(buildFinalReport(interpretationProfile, normalizedSaju, "ko"), lang);
  return { normalizedSaju, interpretationProfile, finalReport };
}

export function normalizeSaju({ record, result, now = new Date() }) {
  const analysis = result.analysis || buildDerivedAnalysis({
    pillars: result.pillars,
    hiddenStems: result.hiddenStems,
    tenGods: result.tenGods,
    yinYang: result.yinYang
  });
  const dayStem = result.pillars.day.stem;
  const weightedElements = analysis.weightedElementCounts || result.fiveElements;
  const rankedElements = rankCounts(weightedElements);
  const tenGodScores = scoreTenGods(result);
  const tenGodGroups = scoreTenGodGroups(tenGodScores);
  const seasonalStrength = buildSeasonalStrength(result, analysis);
  const dayMasterStrength = estimateDayMasterStrength(dayStem.element, weightedElements, seasonalStrength);
  const currentYearFlow = buildCurrentYearFlow(result, now);
  const currentAge = Math.max(0, currentYearFlow.year - Number(record.birth_year));
  const currentLuckContext = getCurrentLuckContext(result.luckPillars, currentAge, record.birth_year);

  return {
    pillars: normalizePillars(result.pillars),
    dayMaster: {
      stem: dayStem,
      element: dayStem.element,
      yinYang: dayStem.yinYang,
      strengthLevel: dayMasterStrength.level,
      strengthScore: dayMasterStrength.score,
      plainLanguageSummary: dayMasterPlain(dayStem, dayMasterStrength.level)
    },
    pillarMeanings: PILLAR_MEANINGS,
    fiveElements: {
      ...weightedElements,
      strongest: rankedElements.filter(([, score]) => score >= rankedElements[0][1] - 0.4).map(([element]) => element),
      weakest: rankedElements.filter(([, score]) => score <= rankedElements.at(-1)[1] + 0.4).map(([element]) => element),
      excessive: rankedElements.filter(([, score]) => score >= 4.6).map(([element]) => element),
      lacking: rankedElements.filter(([, score]) => score <= 1.2).map(([element]) => element),
      balanced: rankedElements.filter(([, score]) => score > 1.2 && score < 4.6).map(([element]) => element),
      ranked: rankedElements
    },
    yinYang: {
      ...result.yinYang,
      balanceLevel: analysis.yinYangMode || classifyYinYang(result.yinYang)
    },
    tenGods: tenGodScores,
    tenGodGroups,
    hiddenStems: result.hiddenStems,
    seasonalStrength,
    combinationsAndClashes: analyzeBranchRelations(result.pillars),
    luckPillars: result.luckPillars?.pillars || [],
    currentYearFlow,
    currentLuckContext,
    source: {
      calculationVersion: result.calculationVersion,
      analysisMethod: analysis.methodNote
    }
  };
}

function buildInterpretationProfile(saju) {
  const strong = saju.fiveElements.strongest[0] || "earth";
  const weak = saju.fiveElements.weakest[0] || "water";
  const strongestGroup = rankGroup(saju.tenGodGroups)[0];
  const weakestGroup = [...rankGroup(saju.tenGodGroups)].reverse()[0];
  const directWealth = saju.tenGods.directWealth || 0;
  const indirectWealth = saju.tenGods.indirectWealth || 0;
  const directOfficer = saju.tenGods.directOfficer || 0;
  const sevenKillings = saju.tenGods.sevenKillings || 0;
  const directResource = saju.tenGods.directResource || 0;
  const indirectResource = saju.tenGods.indirectResource || 0;
  const eatingGod = saju.tenGods.eatingGod || 0;
  const hurtingOfficer = saju.tenGods.hurtingOfficer || 0;

  return {
    dayMaster: {
      ...saju.dayMaster,
      plainLanguageSummary: saju.dayMaster.plainLanguageSummary,
      trace: ["dayMaster", "seasonalStrength", "weightedElements"]
    },
    pillarProfile: buildPillarProfile(saju),
    fiveElementBalance: {
      strongest: saju.fiveElements.strongest,
      weakest: saju.fiveElements.weakest,
      excessive: saju.fiveElements.excessive,
      lacking: saju.fiveElements.lacking,
      balanced: saju.fiveElements.balanced,
      plainLanguageImplications: [
        ELEMENT_BEHAVIOR[strong].strength,
        ELEMENT_BEHAVIOR[weak].lack
      ],
      trace: ["weightedElementCounts", "hiddenStems", "monthBranchSeason"]
    },
    yinYangProfile: {
      dominant: saju.yinYang.balanceLevel,
      balanceLevel: saju.yinYang.balanceLevel,
      plainLanguage: YIN_YANG_LANGUAGE[saju.yinYang.balanceLevel]?.plain || YIN_YANG_LANGUAGE.balanced.plain,
      trace: ["yinYang"]
    },
    tenGodsProfile: Object.fromEntries(
      Object.entries(saju.tenGodGroups).map(([group, value]) => [
        group,
        {
          ...value,
          plainLanguage: groupPlain(group, value.level),
          trace: [`tenGodGroups.${group}`]
        }
      ])
    ),
    hiddenMotivesProfile: buildHiddenMotivesProfile(saju),
    relationshipProfile: {
      trustStyle: relationshipTrustStyle(saju),
      conflictPattern: relationshipConflictPattern(saju),
      loveStyle: loveStyle(saju),
      suitablePartnerTraits: partnerTraits(weak, "supportive"),
      cautionPartnerTraits: partnerTraits(strong, "caution"),
      trace: ["dayBranch", "peerGroup", "expressionGroup", "branchRelations"]
    },
    workProfile: {
      workStyle: workStyle(saju, strong, strongestGroup[0]),
      suitableEnvironment: suitableEnvironment(saju),
      roleStrengths: roleStrengths(saju, strongestGroup[0], strong),
      collaborationStyle: collaborationStyle(saju),
      leadershipStyle: leadershipStyle(saju),
      risks: workRisks(saju, strongestGroup[0], weakestGroup[0]),
      trace: ["monthPillar", "authorityGroup", "expressionGroup", "resourceGroup", "strongestElement"]
    },
    moneyProfile: {
      moneyComesFrom: moneyComesFrom(saju, directWealth, indirectWealth, strongestGroup[0]),
      moneyLeaksFrom: moneyLeaksFrom(saju),
      accumulationStyle: accumulationStyle(saju, directWealth, indirectWealth),
      riskPattern: moneyRiskPattern(saju),
      protectiveHabits: moneyProtectiveHabits(saju),
      trace: ["wealthGroup", "peerGroup", "directWealth", "indirectWealth"]
    },
    healthLifestyleProfile: {
      stressPattern: stressPattern(saju, strong),
      energyPattern: energyPattern(saju),
      restPattern: restPattern(saju, weak),
      foodOrBodySensitivity: bodySensitivity(saju, weak),
      recommendedHabits: lifestyleHabits(weak, saju.yinYang.balanceLevel),
      trace: ["elementImbalance", "yinYang", "weakestElement"]
    },
    lifePhaseProfile: buildLifePhaseProfile(saju),
    currentFlowProfile: buildCurrentFlowProfile(saju),
    guidanceProfile: {
      practiceMore: practiceMore(saju, weak, weakestGroup[0]),
      reduce: reduceList(saju, strong, strongestGroup[0]),
      chooseEnvironment: chooseEnvironmentList(saju),
      stayCloseTo: stayCloseToList(saju, weak),
      decisionCriteria: decisionCriteria(saju, directOfficer, sevenKillings, directResource, indirectResource, eatingGod, hurtingOfficer),
      trace: ["weakestElement", "strongestTenGodGroup", "currentFlow"]
    }
  };
}

function buildFinalReport(profile, saju, lang = "ko") {
  const current = profile.currentFlowProfile;
  const strong = saju.fiveElements.strongest[0] || "earth";
  const weak = saju.fiveElements.weakest[0] || "water";
  const strongText = ELEMENT_BEHAVIOR[strong];
  const weakText = ELEMENT_BEHAVIOR[weak];
  const strongGroup = rankGroup(saju.tenGodGroups)[0][0];
  const weakGroup = [...rankGroup(saju.tenGodGroups)].reverse()[0][0];
  const tension = contradictionTension(profile, saju);

  return {
    language: lang,
    summaryCard: {
      coreKeywords: unique([
        strongText.noun,
        ELEMENT_BEHAVIOR[profile.dayMaster.element].noun,
        GROUP_LANGUAGE[strongGroup].label,
        current.theme
      ]).slice(0, 4),
      currentLifeTheme: current.theme,
      opportunityAreas: current.opportunities,
      cautionAreas: current.cautions,
      overall: `${profile.dayMaster.plainLanguageSummary} 지금은 ${current.theme}로 읽히며, ${weakText.habit}가 흐름을 안정시키는 핵심입니다.`
    },
    lifeOverview: withTrace([
      `이 사주의 중심은 ${profile.dayMaster.plainLanguageSummary} 여기에 ${strongText.strength}이 강하게 얹혀 있어, 스스로 납득한 방향에서는 오래 버티고 현실적인 결과를 만들 가능성이 있습니다.`,
      `결정을 내릴 때는 단순히 분위기를 따라가기보다, 안에서 기준이 정리되어야 움직이는 편으로 해석됩니다. ${profile.yinYangProfile.plainLanguage}이 함께 나타나므로, 겉으로 보이는 속도와 실제 마음속 정리 속도가 다를 수 있습니다.`,
      `잘 맞는 환경은 ${profile.workProfile.suitableEnvironment}입니다. 이 조건이 맞으면 책임감과 실행력이 강점이 되지만, 반대로 역할이 모호하거나 기대치가 불분명하면 에너지가 분산될 수 있습니다.`,
      `반복해서 주의할 지점은 ${weakText.lack}입니다. 이 부분은 약점이라기보다 의식적으로 설계해야 하는 영역입니다. 큰 결심보다 ${weakText.habit}가 더 현실적인 개선 방식입니다.`,
      tension,
      `이 흐름을 잘 쓰려면 삶의 방향을 크게 바꾸기보다, 지금 가진 강점을 결과물로 남기는 방식을 만들어야 합니다. 특히 ${profile.guidanceProfile.decisionCriteria[0]}라는 기준을 두면 관계, 일, 돈에서 같은 실수를 줄이는 데 도움이 됩니다.`
    ], ["dayMaster", "weightedElements", "yinYang", "tenGodGroups", "weakestElement"]),
    lifePhases: profile.lifePhaseProfile,
    currentFlow: {
      title: `${current.currentYear}년 현재 흐름`,
      paragraphs: withTrace([
        `현재 나이는 ${current.currentAge}세이며, 이 시기는 ${current.theme}로 볼 수 있습니다. 대운 흐름은 ${current.luckPillar?.label || "계산 가능한 범위"}를 배경으로 하고, 올해의 흐름은 ${current.annualFlow.label}로 들어옵니다.`,
        `올해는 ${current.annualFlow.groupPlain}이 활성화됩니다. 그래서 기회는 ${current.opportunities.join(", ")} 쪽에서 생기기 쉽고, 주의점은 ${current.cautions.join(", ")}입니다.`,
        `지금 집중할 것은 ${current.advice}입니다. 반대로 무리하면 익숙한 방식만 반복하거나, 도움을 요청할 시기를 놓칠 수 있습니다.`
      ], ["currentLuckContext", "currentYearFlow", "annualTenGod", "branchRelations"]),
      priorities: current.priorities
    },
    personality: withTrace([
      `${profile.dayMaster.plainLanguageSummary} 사고 방식은 ${ELEMENT_BEHAVIOR[strong].noun} 쪽으로 힘이 실리며, 정보를 받아들일 때도 자신만의 기준을 세우려는 경향이 있습니다.`,
      `강점은 ${profile.fiveElementBalance.plainLanguageImplications[0]}입니다. 이 강점이 잘 쓰이면 꾸준함과 설득력이 생기지만, 과해지면 ${ELEMENT_BEHAVIOR[strong].excess}으로 나타날 수 있습니다.`,
      `약점은 ${profile.fiveElementBalance.plainLanguageImplications[1]}입니다. 다른 사람이 보기에는 망설임이나 고집처럼 보일 수 있지만, 실제로는 에너지를 오래 유지할 구조가 필요한 경우가 많습니다.`,
      `타인이 오해하기 쉬운 부분은 겉으로 보이는 태도와 속마음의 속도가 다를 수 있다는 점입니다. ${profile.hiddenMotivesProfile.tensions[0]}`,
      `의식적으로 연습할 것은 ${profile.guidanceProfile.practiceMore[0]}입니다. 이 연습이 반복되면 성격의 단점처럼 보이던 부분이 안정적인 선택 능력으로 바뀔 수 있습니다.`
    ], ["dayMaster", "strongestElement", "weakestElement", "hiddenStems"]),
    characterSocial: withTrace([
      `신뢰를 쌓는 방식은 ${profile.relationshipProfile.trustStyle}입니다. 한 번 믿을 수 있다고 판단하면 관계를 오래 유지하려는 편이지만, 처음부터 모든 것을 열어두지는 않을 수 있습니다.`,
      `무리 안에서는 ${profile.workProfile.collaborationStyle} 성향이 나타납니다. 협업이 잘 되려면 역할과 책임이 분명해야 하고, 애매한 기대가 쌓이면 불편함이 커질 수 있습니다.`,
      `끌리는 사람은 ${profile.relationshipProfile.suitablePartnerTraits.join(", ")} 같은 특성을 가진 사람입니다. 반대로 ${profile.relationshipProfile.cautionPartnerTraits.join(", ")} 쪽이 과하면 관계 안에서 긴장감이 생길 수 있습니다.`,
      `관계에서 도움이 되는 습관은 감정을 늦게 폭발시키기보다 작은 불편함을 빨리 말하는 것입니다. 해로운 습관은 혼자 이해하고 혼자 참다가 어느 순간 거리를 두는 방식입니다.`
    ], ["dayBranch", "peerGroup", "branchRelations"]),
    socialWork: withTrace([
      `일의 방식은 ${profile.workProfile.workStyle}에 가깝습니다. 단순히 직업명을 정하기보다, 어떤 방식으로 일할 때 성과가 나는지를 보는 것이 더 중요합니다.`,
      `잘 맞는 환경은 ${profile.workProfile.suitableEnvironment}입니다. 이런 성향은 기획, 분석, 운영, 교육, 전문성 기반 업무, 콘텐츠나 커뮤니케이션처럼 자신의 기준과 결과물이 함께 필요한 영역에서 좋아질 수 있습니다.`,
      `리더십은 ${profile.workProfile.leadershipStyle}로 나타날 가능성이 있습니다. 강압적으로 끌고 가기보다 기준을 세우고 책임 범위를 정리할 때 신뢰를 얻습니다.`,
      `직장에서의 위험은 ${profile.workProfile.risks.join(", ")}입니다. 이 부분이 강점이 되려면 표현 방식과 절차를 조절하는 능력이 필요합니다.`
    ], ["monthPillar", "authorityGroup", "expressionGroup", "resourceGroup"]),
    moneyFlow: {
      paragraphs: withTrace([
        `재물운은 돈이 갑자기 크게 들어온다는 식으로 보기보다, 어떤 방식으로 현실적인 결과를 만드는지를 보는 편이 맞습니다. 이 사주는 ${profile.moneyProfile.moneyComesFrom}에서 재물 흐름이 생기기 쉽습니다.`,
        `돈이 들어오는 방식은 ${profile.moneyProfile.accumulationStyle}입니다. 한 번에 크게 잡기보다 특정 능력이나 신뢰를 꾸준히 쌓을 때 흐름이 안정되기 쉽습니다.`,
        `돈이 새기 쉬운 지점은 ${profile.moneyProfile.moneyLeaksFrom}입니다. 사람, 기대, 즉흥적 판단이 엮일수록 지출이나 투자가 커질 수 있으므로 확인 절차가 필요합니다.`,
        `재물 손실을 줄이는 법은 ${profile.moneyProfile.protectiveHabits.join(", ")}입니다. 이 내용은 투자 조언이 아니라 자기 점검 기준입니다. 실제 금융 결정은 전문가와 별도로 확인해야 합니다.`
      ], ["wealthGroup", "peerGroup", "directWealth", "indirectWealth"]),
      habits: profile.moneyProfile.protectiveHabits
    },
    loveRomance: withTrace([
      `연애와 애정 표현은 ${profile.relationshipProfile.loveStyle}로 나타날 수 있습니다. 마음이 있어도 표현 방식이 일정하지 않으면 상대가 헷갈릴 수 있으므로, 감정보다 행동의 일관성이 중요합니다.`,
      `잘 맞는 상대는 ${profile.relationshipProfile.suitablePartnerTraits.join(", ")}을 가진 사람입니다. 이런 사람은 부족한 리듬을 자연스럽게 보완해 주고, 관계가 한쪽으로 치우치지 않게 도와줄 수 있습니다.`,
      `긴장이 생기기 쉬운 상대는 ${profile.relationshipProfile.cautionPartnerTraits.join(", ")} 쪽이 강한 사람입니다. 비슷한 강점이 만나면 매력도 커지지만 주도권이나 속도 차이도 커질 수 있습니다.`,
      `장기 관계나 결혼은 시기를 단정하기보다 관계를 시작하는 방식과 유지하는 방식을 보는 것이 안전합니다. 시작에 시간이 걸리는 편이라면 장기 관계의 시기도 늦어질 수 있지만, 그만큼 신뢰가 쌓였을 때 안정적으로 이어질 가능성이 있습니다.`
    ], ["dayBranch", "relationshipProfile", "genderSecondarySignal"]),
    healthLifestyle: withTrace([
      `건강과 생활 리듬은 의학적 진단이 아니라 컨디션 관리 경향으로만 읽어야 합니다. 스트레스가 쌓이면 ${profile.healthLifestyleProfile.stressPattern} 식으로 나타날 수 있습니다.`,
      `에너지 패턴은 ${profile.healthLifestyleProfile.energyPattern}입니다. 무리하면 한 번에 많이 쓰고 한 번에 지치는 흐름이 생길 수 있으므로, 회복 시간을 일정에 먼저 넣는 편이 좋습니다.`,
      `식사나 몸의 감각은 ${profile.healthLifestyleProfile.foodOrBodySensitivity} 쪽으로 흔들릴 수 있습니다. 불편이 지속되면 반드시 의료 전문가와 상담해야 합니다.`,
      `추천 습관은 ${profile.healthLifestyleProfile.recommendedHabits.join(", ")}입니다. 운을 좋게 쓰는 생활 방식은 특별한 의식보다 몸의 리듬을 안정시키는 반복에서 시작됩니다.`
    ], ["elementImbalance", "yinYang", "weakestElement"]),
    cautionPoints: [
      `관계: ${profile.relationshipProfile.conflictPattern}`,
      `돈: ${profile.moneyProfile.riskPattern}`,
      `일: ${profile.workProfile.risks[0]}`,
      `생활: ${profile.healthLifestyleProfile.stressPattern}`,
      `판단: ${profile.guidanceProfile.decisionCriteria[0]}`
    ],
    useLuckWell: {
      practiceMore: profile.guidanceProfile.practiceMore,
      reduce: profile.guidanceProfile.reduce,
      chooseEnvironment: profile.guidanceProfile.chooseEnvironment,
      stayCloseTo: profile.guidanceProfile.stayCloseTo,
      decisionCriteria: profile.guidanceProfile.decisionCriteria
    },
    disclaimers: [
      "이 해석은 오락 및 자기성찰 목적의 참고 정보입니다.",
      "의학, 법률, 금융, 심리 상담 또는 전문 의사결정의 근거로 사용할 수 없습니다.",
      "건강 항목은 생활 리듬 경향이며 의학적 진단이 아닙니다.",
      "재물 항목은 투자 조언이 아닙니다.",
      "사주 해석은 유파, 진태양시, 음력 변환, 야자시/조자시, 출생지 보정, 절기 기준에 따라 달라질 수 있습니다."
    ]
  };
}

function localizeFinalReport(value, lang) {
  if (lang === "ko") return value;
  const replacements = getReportReplacements(lang);
  if (!replacements) return value;
  if (typeof value === "string") return translateKoText(value, replacements, lang);
  if (Array.isArray(value)) return value.map((item) => localizeFinalReport(item, lang));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeFinalReport(item, lang)])
    );
  }
  return value;
}

function getReportReplacements(lang) {
  const base = REPORT_REPLACEMENTS[lang] || [];
  const extra = Object.entries(REPORT_ADDITIONAL_REPLACEMENTS[lang] || {});
  return [...base, ...extra].sort((a, b) => b[0].length - a[0].length);
}

function translateKoText(text, replacements, lang) {
  const translatedText = replacements.reduce((result, [ko, translated]) => {
    return result.replaceAll(ko, translated);
  }, text);
  return cleanupLocalizedText(translatedText, lang);
}

function cleanupLocalizedText(text, lang) {
  if (lang === "ko") return text;
  let output = text.replace(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])[가-힣]{2}/g, "$1");
  if (/^(갑|을|병|정|무|기|경|신|임|계)(자|축|인|묘|진|사|오|미|신|유|술|해)$/.test(output)) return "";
  if (lang === "en") {
    output = output
      .replace(/(\d+)세~(\d+)세/g, "ages $1-$2")
      .replace(/(\d+)세 이후/g, "after age $1")
      .replace(/(\d+)세/g, "$1 years old")
      .replace(/(\d{4})년~(\d{4})년/g, "$1-$2")
      .replace(/(\d{4})년 이후/g, "after $1")
      .replace(/(\d{4})년 현재 흐름/g, "Current flow in $1")
      .replace(/\)은 /g, ") is ")
      .replace(/로 볼 수 있습니다\./g, "can be read this way.")
      .replace(/쪽이 강한 사람/g, "people with this tendency")
      .replace(/([A-Za-z][A-Za-z ,'-]+)을/g, "$1")
      .replace(/([A-Za-z][A-Za-z ,'-]+)를/g, "$1")
      .replace(/([A-Za-z][A-Za-z ,'-]+)가/g, "$1")
      .replace(/\s+is strongly/g, " is strongly")
      .replace(/\s+\./g, ".")
      .replace(/,\s+\./g, ".");
  }
  if (lang === "ja") {
    output = output
      .replace(/(\d+)세~(\d+)세/g, "$1歳〜$2歳")
      .replace(/(\d+)세 이후/g, "$1歳以降")
      .replace(/(\d+)세/g, "$1歳")
      .replace(/(\d{4})년~(\d{4})년/g, "$1年〜$2年")
      .replace(/(\d{4})년 이후/g, "$1年以降")
      .replace(/(\d{4})년 현재 흐름/g, "$1年現在の流れ")
      .replace(/(\d{4})년/g, "$1年")
      .replace(/\)은/g, ")は")
      .replace(/가 /g, "が ")
      .replace(/쪽이 강한 사람/g, "傾向が強い人");
  }
  if (lang === "zh") {
    output = output
      .replace(/(\d+)세~(\d+)세/g, "$1岁~$2岁")
      .replace(/(\d+)세 이후/g, "$1岁以后")
      .replace(/(\d+)세/g, "$1岁")
      .replace(/(\d{4})년~(\d{4})년/g, "$1年~$2年")
      .replace(/(\d{4})년 이후/g, "$1年以后")
      .replace(/(\d{4})년 현재 흐름/g, "$1年当前流动")
      .replace(/(\d{4})년/g, "$1年")
      .replace(/\)은/g, ")")
      .replace(/가 /g, "")
      .replace(/쪽이 강한 사람/g, "这种倾向较强的人");
  }
  return output;
}

const REPORT_REPLACEMENTS = Object.fromEntries(
  Object.entries({
    en: {
      "성장과 기획": "growth and planning",
      "표현과 속도": "expression and pace",
      "책임과 축적": "responsibility and accumulation",
      "기준과 정리": "standards and organization",
      "관찰과 학습": "observation and learning",
      "새로운 목표를 세우고 가능성을 키워가는 힘": "the ability to set new goals and develop possibilities",
      "생각과 감정을 밖으로 드러내고 분위기를 움직이는 힘": "the ability to express thoughts and feelings and move the atmosphere",
      "현실을 붙잡고 관계와 일을 오래 유지하는 힘": "the ability to stay grounded and sustain work and relationships",
      "판단 기준을 세우고 품질을 관리하는 힘": "the ability to set standards and manage quality",
      "상황을 읽고 정보를 모아 다음 수를 준비하는 힘": "the ability to read situations, gather information, and prepare the next move",
      "방향을 너무 많이 열어두어 마무리가 늦어지는 패턴": "a pattern of leaving too many directions open and finishing late",
      "반응이 빨라져 소진되거나 감정적 판단이 앞서는 패턴": "a pattern where fast reactions can lead to burnout or emotional decisions",
      "혼자 책임을 많이 떠안아 움직임이 무거워지는 패턴": "a pattern of carrying too much responsibility alone and becoming heavy",
      "비판과 경계가 강해져 기회를 좁히는 패턴": "a pattern where criticism or strong boundaries can narrow opportunities",
      "생각이 길어져 실행이 늦어지는 패턴": "a pattern where long thinking delays action",
      "시작한 흐름을 오래 키우기 위해 작은 루틴이 필요한 지점": "the area that needs small routines to keep a beginning growing",
      "좋은 생각을 보여주고 알리는 연습이 필요한 지점": "the area that needs practice showing and sharing good ideas",
      "생활 기반과 안정적인 반복 구조를 의식적으로 만들어야 하는 지점": "the area that needs a stable daily base and repeatable structure",
      "거절, 마감, 우선순위를 분명히 하는 연습이 필요한 지점": "the area that needs clearer refusal, deadlines, and priorities",
      "충분히 쉬고 정리하며 배움을 축적해야 하는 지점": "the area that needs rest, reflection, and accumulated learning",
      "큰 목표를 작은 반복 계획으로 쪼개기": "breaking large goals into small repeatable plans",
      "말, 글, 발표, 작은 공개 결과물로 생각을 보이게 만들기": "making thoughts visible through speech, writing, presentations, or small public outputs",
      "수면, 식사, 일정, 돈의 기본 표를 단순하게 유지하기": "keeping sleep, meals, schedule, and money records simple",
      "선택 기준을 한 문장으로 정하고 불필요한 약속 줄이기": "writing one clear decision standard and reducing unnecessary commitments",
      "하루를 기록하고, 결정 전 확인 질문을 하나 남기기": "recording the day and leaving one check question before a decision",
      "자기주도와 동료 관계": "self-direction and peer relationships",
      "표현과 결과물": "expression and output",
      "현실 감각과 재물": "practical sense and money",
      "책임과 사회적 기준": "responsibility and social standards",
      "학습과 회복": "learning and recovery",
      "준비기": "preparation phase",
      "표현기": "expression phase",
      "확장기": "expansion phase",
      "수확기": "harvest phase",
      "도전기": "challenge phase",
      "전환기": "transition phase",
      "정리기": "reorganization phase",
      "이 해석은 오락 및 자기성찰 목적의 참고 정보입니다.": "This reading is for entertainment and self-reflection only.",
      "의학, 법률, 금융, 심리 상담 또는 전문 의사결정의 근거로 사용할 수 없습니다.": "It must not be used as the basis for medical, legal, financial, psychological, or professional decisions.",
      "건강 항목은 생활 리듬 경향이며 의학적 진단이 아닙니다.": "The health section describes lifestyle tendencies only and is not a medical diagnosis.",
      "재물 항목은 투자 조언이 아닙니다.": "The money section is not investment advice.",
      "사주 해석은 유파, 진태양시, 음력 변환, 야자시/조자시, 출생지 보정, 절기 기준에 따라 달라질 수 있습니다.": "Saju readings can vary by school, true solar time, lunar conversion, night-rat-hour handling, birthplace correction, and solar-term standards.",
      "이 사주의 중심은": "The center of this chart is",
      "여기에": "On top of this,",
      "이 강하게 얹혀 있어": "is strongly layered, so",
      "스스로 납득한 방향에서는 오래 버티고 현실적인 결과를 만들 가능성이 있습니다.": "there is a possibility of persisting and creating practical results when the direction makes sense internally.",
      "결정을 내릴 때는 단순히 분위기를 따라가기보다, 안에서 기준이 정리되어야 움직이는 편으로 해석됩니다.": "When making decisions, this chart tends to move after internal standards are organized rather than simply following the mood.",
      "이 함께 나타나므로, 겉으로 보이는 속도와 실제 마음속 정리 속도가 다를 수 있습니다.": "also appears, so the visible pace and the inner processing pace may differ.",
      "잘 맞는 환경은": "A suitable environment is",
      "입니다. 이 조건이 맞으면 책임감과 실행력이 강점이 되지만, 반대로 역할이 모호하거나 기대치가 불분명하면 에너지가 분산될 수 있습니다.": ". When this condition is met, responsibility and execution become strengths; when roles or expectations are unclear, energy can scatter.",
      "반복해서 주의할 지점은": "The recurring point to watch is",
      "입니다. 이 부분은 약점이라기보다 의식적으로 설계해야 하는 영역입니다. 큰 결심보다": ". This is less a flaw than an area that needs conscious design. Rather than one large resolution,",
      "가 더 현실적인 개선 방식입니다.": "is the more realistic way to improve.",
      "이 흐름을 잘 쓰려면 삶의 방향을 크게 바꾸기보다, 지금 가진 강점을 결과물로 남기는 방식을 만들어야 합니다.": "To use this flow well, it is better to build a way to leave your strengths as concrete output rather than drastically changing life direction.",
      "특히": "In particular,",
      "라는 기준을 두면 관계, 일, 돈에서 같은 실수를 줄이는 데 도움이 됩니다.": "as a standard can help reduce repeated mistakes in relationships, work, and money.",
      "현재 나이는": "The current age is",
      "세이며, 이 시기는": ", and this period can be read as",
      "로 볼 수 있습니다. 대운 흐름은": ". The long-term luck cycle uses",
      "를 배경으로 하고, 올해의 흐름은": "as a background, while the annual flow enters as",
      "로 들어옵니다.": ".",
      "올해는": "This year,",
      "이 활성화됩니다. 그래서 기회는": "is activated. Opportunities are likely around",
      "쪽에서 생기기 쉽고, 주의점은": ", while cautions are",
      "입니다.": ".",
      "지금 집중할 것은": "What to focus on now is",
      "반대로 무리하면 익숙한 방식만 반복하거나, 도움을 요청할 시기를 놓칠 수 있습니다.": "If pushed too far, you may repeat only familiar methods or miss the right time to ask for help.",
      "사고 방식은": "The thinking style leans toward",
      "쪽으로 힘이 실리며, 정보를 받아들일 때도 자신만의 기준을 세우려는 경향이 있습니다.": ", and even when receiving information, there is a tendency to build personal standards.",
      "강점은": "The strength is",
      "이 강점이 잘 쓰이면 꾸준함과 설득력이 생기지만, 과해지면": "When used well, this creates consistency and persuasiveness; when excessive, it can become",
      "으로 나타날 수 있습니다.": ".",
      "약점은": "The weaker point is",
      "다른 사람이 보기에는 망설임이나 고집처럼 보일 수 있지만, 실제로는 에너지를 오래 유지할 구조가 필요한 경우가 많습니다.": "To others this may look like hesitation or stubbornness, but often it means a structure is needed to sustain energy.",
      "타인이 오해하기 쉬운 부분은 겉으로 보이는 태도와 속마음의 속도가 다를 수 있다는 점입니다.": "What others may misunderstand is that the outer attitude and inner pace may differ.",
      "의식적으로 연습할 것은": "What to practice consciously is",
      "이 연습이 반복되면 성격의 단점처럼 보이던 부분이 안정적인 선택 능력으로 바뀔 수 있습니다.": "When repeated, this can turn what looked like a personality weakness into stable decision-making.",
      "신뢰를 쌓는 방식은": "Trust is built through",
      "한 번 믿을 수 있다고 판단하면 관계를 오래 유지하려는 편이지만, 처음부터 모든 것을 열어두지는 않을 수 있습니다.": "Once trust is confirmed, the relationship can last, but everything may not be opened from the beginning.",
      "무리 안에서는": "In groups,",
      "성향이 나타납니다. 협업이 잘 되려면 역할과 책임이 분명해야 하고, 애매한 기대가 쌓이면 불편함이 커질 수 있습니다.": "tends to appear. For collaboration to work, roles and responsibilities need to be clear; vague expectations can build discomfort.",
      "끌리는 사람은": "You may be drawn to people with traits such as",
      "같은 특성을 가진 사람입니다. 반대로": ". Conversely, when",
      "쪽이 과하면 관계 안에서 긴장감이 생길 수 있습니다.": "is excessive, tension can arise in relationships.",
      "관계에서 도움이 되는 습관은 감정을 늦게 폭발시키기보다 작은 불편함을 빨리 말하는 것입니다.": "A helpful relationship habit is to name small discomforts early rather than letting feelings erupt late.",
      "해로운 습관은 혼자 이해하고 혼자 참다가 어느 순간 거리를 두는 방식입니다.": "A harmful habit is understanding and enduring alone, then suddenly creating distance.",
      "일의 방식은": "The work style is close to",
      "에 가깝습니다. 단순히 직업명을 정하기보다, 어떤 방식으로 일할 때 성과가 나는지를 보는 것이 더 중요합니다.": ". It is more important to see what work mode produces results than to name one fixed occupation.",
      "이런 성향은 기획, 분석, 운영, 교육, 전문성 기반 업무, 콘텐츠나 커뮤니케이션처럼 자신의 기준과 결과물이 함께 필요한 영역에서 좋아질 수 있습니다.": "This tendency can fit areas such as planning, analysis, operations, education, expertise-based work, content, or communication where standards and output both matter.",
      "리더십은": "Leadership may appear as",
      "로 나타날 가능성이 있습니다. 강압적으로 끌고 가기보다 기준을 세우고 책임 범위를 정리할 때 신뢰를 얻습니다.": ". Trust is earned by setting standards and clarifying responsibility rather than forcing direction.",
      "직장에서의 위험은": "The workplace risk is",
      "이 부분이 강점이 되려면 표현 방식과 절차를 조절하는 능력이 필요합니다.": "For this to become a strength, expression and process need to be adjusted.",
      "재물운은 돈이 갑자기 크게 들어온다는 식으로 보기보다, 어떤 방식으로 현실적인 결과를 만드는지를 보는 편이 맞습니다.": "Money flow should be read less as sudden large gain and more as the way practical results are created.",
      "이 사주는": "This chart is likely to create money flow through",
      "에서 재물 흐름이 생기기 쉽습니다.": ".",
      "돈이 들어오는 방식은": "Money tends to come through",
      "한 번에 크게 잡기보다 특정 능력이나 신뢰를 꾸준히 쌓을 때 흐름이 안정되기 쉽습니다.": "The flow stabilizes more by steadily building a specific skill or trust than by trying to capture everything at once.",
      "돈이 새기 쉬운 지점은": "Money can leak through",
      "사람, 기대, 즉흥적 판단이 엮일수록 지출이나 투자가 커질 수 있으므로 확인 절차가 필요합니다.": "When people, expectations, and impulsive judgment are involved, spending or investment can grow, so a checking process is needed.",
      "재물 손실을 줄이는 법은": "Ways to reduce money loss include",
      "이 내용은 투자 조언이 아니라 자기 점검 기준입니다. 실제 금융 결정은 전문가와 별도로 확인해야 합니다.": "This is not investment advice; it is a self-check standard. Actual financial decisions should be reviewed separately with a professional.",
      "연애와 애정 표현은": "Love and affection may be expressed as",
      "로 나타날 수 있습니다. 마음이 있어도 표현 방식이 일정하지 않으면 상대가 헷갈릴 수 있으므로, 감정보다 행동의 일관성이 중요합니다.": ". Even when feelings are present, inconsistent expression can confuse the other person, so consistency matters more than intensity.",
      "잘 맞는 상대는": "A suitable partner is someone with traits such as",
      "을 가진 사람입니다. 이런 사람은 부족한 리듬을 자연스럽게 보완해 주고, 관계가 한쪽으로 치우치지 않게 도와줄 수 있습니다.": ". This person can naturally complement the missing rhythm and keep the relationship from leaning too far one way.",
      "긴장이 생기기 쉬운 상대는": "Tension may arise with people strong in",
      "비슷한 강점이 만나면 매력도 커지지만 주도권이나 속도 차이도 커질 수 있습니다.": "Similar strengths can be attractive, but they can also increase differences in control or pace.",
      "장기 관계나 결혼은 시기를 단정하기보다 관계를 시작하는 방식과 유지하는 방식을 보는 것이 안전합니다.": "For long-term relationships or marriage, it is safer to look at how relationships start and are maintained rather than fixed timing.",
      "시작에 시간이 걸리는 편이라면 장기 관계의 시기도 늦어질 수 있지만, 그만큼 신뢰가 쌓였을 때 안정적으로 이어질 가능성이 있습니다.": "If starting takes time, long-term commitment may also come later, but once trust is built it can continue steadily.",
      "건강과 생활 리듬은 의학적 진단이 아니라 컨디션 관리 경향으로만 읽어야 합니다.": "Health and lifestyle should be read only as condition-management tendencies, not medical diagnosis.",
      "스트레스가 쌓이면": "When stress builds,",
      "식으로 나타날 수 있습니다.": "may appear.",
      "에너지 패턴은": "The energy pattern is",
      "무리하면 한 번에 많이 쓰고 한 번에 지치는 흐름이 생길 수 있으므로, 회복 시간을 일정에 먼저 넣는 편이 좋습니다.": "If overextended, energy may be spent all at once and fatigue may follow, so recovery time should be scheduled first.",
      "식사나 몸의 감각은": "Food or body sensitivity may lean toward",
      "쪽으로 흔들릴 수 있습니다. 불편이 지속되면 반드시 의료 전문가와 상담해야 합니다.": ". If discomfort continues, consult a medical professional.",
      "추천 습관은": "Recommended habits are",
      "운을 좋게 쓰는 생활 방식은 특별한 의식보다 몸의 리듬을 안정시키는 반복에서 시작됩니다.": "Using luck well in daily life starts with stabilizing bodily rhythm, not with special rituals.",
      "관계:": "Relationships:",
      "돈:": "Money:",
      "일:": "Work:",
      "생활:": "Lifestyle:",
      "판단:": "Decision-making:"
    },
    ja: {
      "성장과 기획": "成長と計画",
      "표현과 속도": "表現とスピード",
      "책임과 축적": "責任と蓄積",
      "기준과 정리": "基準と整理",
      "관찰과 학습": "観察と学習",
      "자기주도와 동료 관계": "自己主導と仲間関係",
      "표현과 결과물": "表現と成果物",
      "현실 감각과 재물": "現実感覚とお金",
      "책임과 사회적 기준": "責任と社会的基準",
      "학습과 회복": "学習と回復",
      "준비기": "準備期",
      "표현기": "表現期",
      "확장기": "拡張期",
      "수확기": "収穫期",
      "도전기": "挑戦期",
      "전환기": "転換期",
      "정리기": "整理期",
      "새로운 목표를 세우고 가능성을 키워가는 힘": "新しい目標を立て、可能性を育てる力",
      "생각과 감정을 밖으로 드러내고 분위기를 움직이는 힘": "考えや感情を外に表し、場の空気を動かす力",
      "현실을 붙잡고 관계와 일을 오래 유지하는 힘": "現実を支え、関係や仕事を長く保つ力",
      "판단 기준을 세우고 품질을 관리하는 힘": "判断基準を立て、品質を管理する力",
      "상황을 읽고 정보를 모아 다음 수를 준비하는 힘": "状況を読み、情報を集めて次の一手を準備する力",
      "큰 목표를 작은 반복 계획으로 쪼개기": "大きな目標を小さな反復計画に分けること",
      "말, 글, 발표, 작은 공개 결과물로 생각을 보이게 만들기": "言葉、文章、発表、小さな公開成果で考えを見える形にすること",
      "수면, 식사, 일정, 돈의 기본 표를 단순하게 유지하기": "睡眠、食事、予定、お金の基本表をシンプルに保つこと",
      "선택 기준을 한 문장으로 정하고 불필요한 약속 줄이기": "選択基準を一文で決め、不要な約束を減らすこと",
      "하루를 기록하고, 결정 전 확인 질문을 하나 남기기": "一日を記録し、決定前に確認質問を一つ残すこと",
      "이 해석은 오락 및 자기성찰 목적의 참고 정보입니다.": "この解釈は娯楽と自己理解のための参考情報です。",
      "의학, 법률, 금융, 심리 상담 또는 전문 의사결정의 근거로 사용할 수 없습니다.": "医療、法律、金融、心理相談、専門的意思決定の根拠にはできません。",
      "건강 항목은 생활 리듬 경향이며 의학적 진단이 아닙니다.": "健康項目は生活リズムの傾向であり、医学的診断ではありません。",
      "재물 항목은 투자 조언이 아닙니다.": "お金の項目は投資助言ではありません。",
      "사주 해석은 유파, 진태양시, 음력 변환, 야자시/조자시, 출생지 보정, 절기 기준에 따라 달라질 수 있습니다.": "四柱推命の解釈は流派、真太陽時、旧暦変換、夜子時処理、出生地補正、節気基準により異なる場合があります。",
      "이 사주의 중심은": "この命式の中心は",
      "여기에": "そこに",
      "이 강하게 얹혀 있어": "が強く重なっており、",
      "스스로 납득한 방향에서는 오래 버티고 현실적인 결과를 만들 가능성이 있습니다.": "自分が納得した方向では長く粘り、現実的な結果を作る可能性があります。",
      "현재 나이는": "現在の年齢は",
      "세이며, 이 시기는": "歳で、この時期は",
      "로 볼 수 있습니다.": "として読めます。",
      "추천 습관은": "おすすめの習慣は",
      "관계:": "関係:",
      "돈:": "お金:",
      "일:": "仕事:",
      "생활:": "生活:",
      "판단:": "判断:"
    },
    zh: {
      "성장과 기획": "成长与规划",
      "표현과 속도": "表达与速度",
      "책임과 축적": "责任与积累",
      "기준과 정리": "标准与整理",
      "관찰과 학습": "观察与学习",
      "자기주도와 동료 관계": "自主性与同伴关系",
      "표현과 결과물": "表达与成果",
      "현실 감각과 재물": "现实感与财物",
      "책임과 사회적 기준": "责任与社会标准",
      "학습과 회복": "学习与恢复",
      "준비기": "准备期",
      "표현기": "表达期",
      "확장기": "扩张期",
      "수확기": "收获期",
      "도전기": "挑战期",
      "전환기": "转换期",
      "정리기": "整理期",
      "새로운 목표를 세우고 가능성을 키워가는 힘": "设定新目标并培养可能性的力量",
      "생각과 감정을 밖으로 드러내고 분위기를 움직이는 힘": "表达想法和情绪并带动氛围的力量",
      "현실을 붙잡고 관계와 일을 오래 유지하는 힘": "抓住现实、长期维持关系和工作的力量",
      "판단 기준을 세우고 품질을 관리하는 힘": "建立判断标准并管理品质的力量",
      "상황을 읽고 정보를 모아 다음 수를 준비하는 힘": "读取情境、收集信息并准备下一步的力量",
      "큰 목표를 작은 반복 계획으로 쪼개기": "把大目标拆成可重复的小计划",
      "말, 글, 발표, 작은 공개 결과물로 생각을 보이게 만들기": "通过语言、文字、发表或小成果让想法可见",
      "수면, 식사, 일정, 돈의 기본 표를 단순하게 유지하기": "让睡眠、饮食、日程和金钱记录保持简单",
      "선택 기준을 한 문장으로 정하고 불필요한 약속 줄이기": "用一句话确定选择标准，减少不必要承诺",
      "하루를 기록하고, 결정 전 확인 질문을 하나 남기기": "记录一天，并在决定前留下一个确认问题",
      "이 해석은 오락 및 자기성찰 목적의 참고 정보입니다.": "此解读仅供娱乐与自我反思参考。",
      "의학, 법률, 금융, 심리 상담 또는 전문 의사결정의 근거로 사용할 수 없습니다.": "不能作为医疗、法律、金融、心理咨询或专业决策依据。",
      "건강 항목은 생활 리듬 경향이며 의학적 진단이 아닙니다.": "健康部分只是生活节奏倾向，不是医学诊断。",
      "재물 항목은 투자 조언이 아닙니다.": "财物部分不是投资建议。",
      "사주 해석은 유파, 진태양시, 음력 변환, 야자시/조자시, 출생지 보정, 절기 기준에 따라 달라질 수 있습니다.": "四柱解读会因流派、真太阳时、农历转换、夜子时处理、出生地校正和节气标准而不同。",
      "이 사주의 중심은": "这个命盘的中心是",
      "여기에": "在此之上，",
      "이 강하게 얹혀 있어": "强烈叠加，",
      "스스로 납득한 방향에서는 오래 버티고 현실적인 결과를 만들 가능성이 있습니다.": "在自己能理解的方向上，有可能坚持较久并创造现实结果。",
      "현재 나이는": "当前年龄为",
      "세이며, 이 시기는": "岁，这一时期可视为",
      "로 볼 수 있습니다.": "。",
      "추천 습관은": "推荐习惯是",
      "관계:": "关系：",
      "돈:": "金钱：",
      "일:": "工作：",
      "생활:": "生活：",
      "판단:": "判断："
    }
  }).map(([lang, entries]) => [
    lang,
    Object.entries(entries).sort((a, b) => b[0].length - a[0].length)
  ])
);

const REPORT_ADDITIONAL_REPLACEMENTS = {
  en: {
    "성장과 기획을 중심으로 자신을 세우는 사람입니다.": "This person builds their sense of self around growth and planning.",
    "표현과 속도을 중심으로 자신을 세우는 사람입니다.": "This person builds their sense of self around expression and pace.",
    "책임과 축적을 중심으로 자신을 세우는 사람입니다.": "This person builds their sense of self around responsibility and accumulation.",
    "기준과 정리을 중심으로 자신을 세우는 사람입니다.": "This person builds their sense of self around standards and organization.",
    "관찰과 학습을 중심으로 자신을 세우는 사람입니다.": "This person builds their sense of self around observation and learning.",
    "다만 주변 요구나 현실 압력에 에너지가 쉽게 흩어질 수 있어, 회복과 기준 설정이 중요합니다.": "However, external demands and practical pressure can scatter energy easily, so recovery and clear standards matter.",
    "자기 기준은 있지만 환경의 영향을 크게 받기 쉬워, 안정적인 루틴과 지지가 필요합니다.": "There is a personal standard, but the environment can affect it strongly, so steady routines and support are important.",
    "자기 기준과 외부 요구 사이에서 비교적 균형을 잡을 수 있습니다.": "There is a relatively balanced ability to move between personal standards and outside demands.",
    "자기 기준이 분명하고 버티는 힘이 있는 편입니다.": "Personal standards are fairly clear, with a strong ability to endure.",
    "자기 기준과 추진력이 강해 스스로 판을 만들려는 힘이 큽니다.": "Personal standards and drive are strong, creating a tendency to build one's own field.",
    "지금은": "Right now,",
    "로 읽히며,": "is the main theme, and",
    "흐름을 안정시키는 핵심입니다.": "is the key to stabilizing the flow.",
    "밖으로 바로 드러내기보다 안에서 충분히 정리한 뒤 움직이려는 경향": "a tendency to organize things internally before showing them outwardly",
    "생각이 정리되면 밖으로 빠르게 움직이고 반응하는 경향": "a tendency to move and respond quickly once thoughts are organized",
    "상황에 따라 관찰과 실행을 오갈 수 있는 경향": "a tendency to switch between observation and action depending on the situation",
    "역할, 책임, 평가 기준이 명확한 환경": "an environment with clear roles, responsibilities, and evaluation standards",
    "자율성과 결과물 공개가 가능한 환경": "an environment with autonomy and visible output",
    "학습과 전문성이 존중되는 환경": "an environment where learning and expertise are respected",
    "역할이 분명하고 불필요한 감정 소모가 적은 환경": "an environment with clear roles and little unnecessary emotional drain",
    "기준은 분명하지만 표현의 자유도도 있는 환경": "an environment with clear standards and room for expression",
    "겉으로는 사람들과 맞추는 것처럼 보여도, 중요한 결정은 안에서 충분히 정리한 뒤 내리는 편입니다.": "Even if you appear to adjust well to others, important decisions are usually made after enough inner processing.",
    "이 차이를 스스로 이해하면 불필요한 오해를 줄일 수 있습니다.": "Understanding this difference can reduce unnecessary misunderstandings.",
    "지금 좋아 보이는가보다 3개월 뒤에도 유지 가능한가를 먼저 보기": "checking whether it is still sustainable three months from now before asking whether it looks good today",
    "초년운": "Early life",
    "중년운": "Middle life",
    "말년운": "Later life",
    "의 감각을 배우고 자기 기준을 만드는 시기": "a period of learning this sense and forming personal standards",
    "을 현실적인 성과로 바꾸는 시기": "a period of turning strengths into practical results",
    "를 통해 경험을 정리하고 삶의 밀도를 높이는 시기": "a period of organizing experience and deepening life through this habit",
    "흐름 참고": "cycle reference",
    "대운이 이 구간의 배경으로 일부 작동합니다.": "luck pillar partly forms the background of this period.",
    "대운 범위가 완전히 겹치지 않아 일반 생애 단계로 참고하는 편이 안전합니다.": "Because the luck pillar range does not fully overlap, it is safer to treat this as a general life phase.",
    "가족과 관계에서는 가까운 환경의 기대와 자신의 기준 사이에서 균형을 배우는 경향이 나타날 수 있습니다.": "In family and relationships, this can appear as learning balance between nearby expectations and personal standards.",
    "가족과 관계에서는 역할과 책임이 커지며 관계의 경계를 다시 세우는 경향이 나타날 수 있습니다.": "In family and relationships, roles and responsibilities may grow, requiring boundaries to be reset.",
    "가족과 관계에서는 많은 관계보다 오래 남는 관계의 질을 중시하는 경향이 나타날 수 있습니다.": "In family and relationships, lasting quality can become more important than having many connections.",
    "이 흐름은 좋고 나쁨보다, 어떤 방식으로 사람과 안정감을 만드는지를 보여줍니다.": "This is less about good or bad, and more about how stability is built with people.",
    "공부와 일에서는": "In study and work,",
    "을 배우고 시도하는 경험": "learning and trying this sense",
    "쪽이 중요합니다.": "becomes important.",
    "기회는": "Opportunities tend to come from",
    "에서 오기 쉽지만,": ", but if",
    "을 놓치면 흐름이 끊길 수 있습니다.": "is missed, the flow may break.",
    "재물과 기회는 돈보다 경험과 기준을 먼저 배우는 과정": "Money and opportunity are read as a process of learning experience and standards before money itself",
    "재물과 기회는 수입, 책임, 지출 구조가 함께 커지는 과정": "Money and opportunity are read as a process where income, responsibility, and spending structures grow together",
    "재물과 기회는 무리한 확장보다 지키고 정리하는 힘이 중요해지는 과정": "Money and opportunity are read as a process where protecting and organizing matters more than forced expansion",
    "로 읽힙니다.": ".",
    "주의할 점은": "The caution is not",
    "이 아니라, 부족한 리듬을 보완하지 않은 채 속도만 높이는 것입니다.": ", but increasing speed without supporting the missing rhythm.",
    "이 시기의 조언은": "The advice for this period is",
    "이것이 반복되면 운의 흐름을 기다리는 것이 아니라, 흐름을 받아낼 그릇을 만드는 쪽에 가까워집니다.": "When repeated, this becomes less about waiting for luck and more about building the capacity to receive the flow.",
    "계산 가능한 범위": "the calculable range",
    "기회와 지출이 함께 커지기 쉽습니다. 좋아 보이는 제안일수록 유지 가능성을 확인해야 합니다.": "opportunities and spending can grow together, so attractive offers need a sustainability check.",
    "돈과 역할의 기준을 먼저 정하는 것": "setting standards for money and roles first",
    "기대치를 말로 확인하기": "confirming expectations in words",
    "반복 가능한 업무 구조 만들기": "building a repeatable work structure",
    "수입과 지출 기준 점검": "checking income and spending standards",
    "수입 구조 점검": "reviewing income structure",
    "현실적 성과": "practical results",
    "자원 관리": "resource management",
    "검증 전 지출": "spending before verification",
    "관계와 돈의 경계 흐림": "blurred boundaries between relationships and money",
    "겉으로는": "On the surface,",
    "이 먼저 보이지만, 안쪽에서는": "appears first, but internally,",
    "도 함께 작동할 수 있습니다.": "may also be operating.",
    "편안한 반복과 작은 약속을 통해 신뢰를 확인하는 방식": "confirming trust through comfortable repetition and small promises",
    "동등한 거리에서 신뢰를 쌓는 방식": "building trust from an equal distance",
    "상대의 말과 행동을 충분히 관찰한 뒤 천천히 마음을 여는 방식": "opening up slowly after observing words and actions carefully",
    "역할이 분명할 때 편하게 협력하는 방식": "collaborating comfortably when roles are clear",
    "동등한 파트너십에서는 강하지만, 권한이 애매하면 주도권을 잡으려는 방식": "being strong in equal partnerships but trying to take the lead when authority is unclear",
    "충분히 이해하고 준비한 뒤 안정적으로 기여하는 방식": "contributing steadily after enough understanding and preparation",
    "성장을 응원하는 사람": "someone who supports growth",
    "장기 목표를 함께 세우는 사람": "someone who can set long-term goals together",
    "표현을 편하게 해주는 사람": "someone who makes expression feel comfortable",
    "따뜻하게 반응하는 사람": "someone who responds warmly",
    "생활 리듬이 안정적인 사람": "someone with a steady daily rhythm",
    "책임을 나눌 줄 아는 사람": "someone who can share responsibility",
    "기준과 경계를 존중하는 사람": "someone who respects standards and boundaries",
    "약속이 분명한 사람": "someone who is clear about commitments",
    "생각을 들어주는 사람": "someone who listens to your thoughts",
    "휴식과 여백을 존중하는 사람": "someone who respects rest and space",
    "감정 반응이 너무 빠른 사람": "someone with overly fast emotional reactions",
    "관심을 계속 요구하는 사람": "someone who constantly demands attention",
    "현실적인 목표와 성과 지표를 보며 자원을 움직이는 방식": "moving resources through practical goals and performance indicators",
    "책임 범위와 기준이 분명한 역할에서 신뢰를 쌓는 방식": "building trust in roles with clear responsibility and standards",
    "아이디어를 말, 글, 제품, 콘텐츠 같은 결과물로 바꾸는 방식": "turning ideas into output such as speech, writing, products, or content",
    "배우고 정리한 내용을 전문성으로 쌓아가는 방식": "building expertise from what has been learned and organized",
    "기준과 책임을 세워 안정감을 주는 리더십": "leadership that creates stability through standards and responsibility",
    "아이디어와 방향을 보여주며 사람을 움직이는 리더십": "leadership that moves people by showing ideas and direction",
    "직접 앞에서 버티고 행동으로 설득하는 리더십": "leadership that persuades through direct action and endurance",
    "필요한 역할을 조용히 맡아 신뢰를 쌓는 리더십": "leadership that builds trust by quietly taking needed roles",
    "익숙한 방식만 반복해 변화 신호를 늦게 알아차리는 점": "noticing change signals late by repeating only familiar methods",
    "넓은 기회, 거래, 네트워크, 새로운 판을 움직이는 과정": "broad opportunities, trade, networks, and creating new fields",
    "꾸준한 수입, 신뢰 기반의 일, 안정적인 관리": "steady income, trust-based work, and stable management",
    "결과물, 콘텐츠, 설명력, 생산성을 통해 가치가 보이는 과정": "making value visible through output, content, explanation, and productivity",
    "전문성, 지식, 자격, 꾸준한 학습이 신뢰로 바뀌는 과정": "expertise, knowledge, credentials, and steady learning turning into trust",
    "맡은 역할을 꾸준히 수행하며 신뢰를 쌓는 과정": "steadily fulfilling assigned roles and building trust",
    "기회 탐색과 네트워크 활용, 다만 기준 있는 선별": "opportunity search and network use, with clear filtering standards",
    "정기적인 수입과 지출 관리, 반복 가능한 축적": "regular income, spending management, and repeatable accumulation",
    "좋아 보이는 기회를 빠르게 잡으려는 마음": "the urge to quickly take opportunities that look attractive",
    "기준 없이 반복되는 작은 지출": "small repeated spending without clear standards",
    "사람과 돈이 가까워질 때 생기는 경쟁, 체면, 공동 지출": "competition, face-saving, or shared spending when people and money get close",
    "큰 결정 전 3개월 뒤에도 유지 가능한지 확인하기": "checking whether a major decision is sustainable three months later",
    "역할과 책임을 문장으로 남기기": "writing roles and responsibilities in clear sentences",
    "새로운 제안은 최소 하루 이상 두고 다시 보기": "leaving new proposals for at least a day before reviewing them again",
    "고정비와 반복 지출을 월 1회 점검하기": "reviewing fixed and recurring expenses once a month",
    "마음을 충분히 정리한 뒤 조심스럽게 표현하는 편": "expressing feelings carefully after enough inner organization",
    "마음이 움직이면 말이나 행동으로 표현하려는 편": "expressing feelings through words or actions when the heart moves",
    "상대의 반응을 보며 속도를 맞추는 편": "matching pace while watching the other person's response",
    "반응 속도가 빨라지며 쉽게 소진되는 방식": "reacting faster and burning out more easily",
    "책임을 오래 들고 있다가 몸과 마음이 무거워지는 방식": "carrying responsibility for too long until body and mind feel heavy",
    "생각이 길어져 쉬어도 쉬지 못하는 방식": "thinking for so long that rest does not feel restful",
    "조용히 오래 축적하는 힘은 있지만, 밖으로 풀어내지 못하면 답답함이 쌓일 수 있는 흐름": "a flow with quiet endurance, but frustration can build if it is not expressed outwardly",
    "짧게 강하게 쓰는 힘은 좋지만, 회복 시간을 놓치면 급격히 피로해질 수 있는 흐름": "a flow that can spend energy intensely, but fatigue can rise sharply if recovery is missed",
    "움직임과 회복을 번갈아 쓸 때 안정되는 흐름": "a flow that stabilizes when movement and recovery alternate",
    "새로운 일정이나 환경 변화가 누적될 때 긴장이 먼저 올라오는 편": "tension may rise first when new schedules or environmental changes accumulate",
    "표현하지 못한 감정이나 과한 자극이 쌓이면 컨디션이 흔들리는 편": "condition may shake when unexpressed emotion or overstimulation builds up",
    "스트레스가 쌓이면 식사나 소화 리듬이 먼저 흔들리는 사람도 있는 편": "meal or digestion rhythm may be affected first when stress builds",
    "경계와 긴장이 오래 유지되면 몸이 딱딱하게 굳는 느낌을 받을 수 있는 편": "long-held tension and boundaries may feel like physical stiffness",
    "휴식과 수면이 부족하면 집중력과 판단력이 먼저 흐려질 수 있는 편": "focus and judgment may blur first when rest and sleep are lacking",
    "생각을 정리한 뒤 작게라도 밖으로 표현하기": "expressing something outwardly, even small, after organizing thoughts",
    "컨디션이 흔들릴 때 중요한 결정을 미루기": "postponing major decisions when condition is unstable",
    "도움을 요청할 사람을 정해두기": "choosing in advance whom to ask for help",
    "작은 결과물을 정기적으로 공개하기": "sharing small outputs regularly",
    "수입과 지출을 같은 표에서 보기": "viewing income and spending in the same table",
    "내가 맡을 책임의 범위를 적어두기": "writing down the scope of responsibility",
    "배운 것을 한 문장으로 정리하고 바로 적용하기": "summarizing what was learned in one sentence and applying it right away",
    "중요한 선택은 기록으로 남기기": "recording important choices",
    "기회처럼 보인다는 이유만으로 움직이는 습관": "moving only because something looks like an opportunity",
    "자존심 때문에 도움을 미루는 습관": "delaying help because of pride",
    "정리되지 않은 말을 급하게 꺼내는 습관": "speaking too quickly before thoughts are organized",
    "책임을 모두 내 몫으로 받아들이는 습관": "taking every responsibility as your own",
    "준비가 끝나야 시작할 수 있다고 느끼는 습관": "feeling that you can start only after preparation is complete",
    "혼자 판단하고 혼자 버티는 시간": "time spent deciding and enduring alone",
    "역할과 기대치가 말로 정리되는 환경": "an environment where roles and expectations are stated clearly",
    "성과보다 과정의 기준도 함께 보는 환경": "an environment that considers process standards as well as results",
    "내 속도를 존중하면서도 현실적인 확인을 도와주는 사람": "people who respect your pace while helping with practical checks",
    "내가 맡을 책임과 상대가 맡을 책임을 구분하기": "separating your responsibility from the other person's responsibility",
    "속도를 높이기 전에 회복 가능한 일정인지 확인하기": "checking whether the schedule is recoverable before increasing speed",
    "말하지 않은 기대가 쌓일 때 오해가 생길 수 있습니다.": "Misunderstandings can arise when unspoken expectations accumulate.",
    "기회가 많아 보일 때 검증 전에 움직이는 점": "moving before verification when opportunities appear plentiful",
    "관계 안에서 역할이나 거리감이 바뀌는 압력이 생길 때 갈등이 커질 수 있습니다.": "Conflict can grow when pressure changes roles or distance within a relationship.",
    "서로의 자존심과 주도권이 부딪힐 때 관계 피로가 커질 수 있습니다.": "Relationship fatigue can grow when pride and control collide."
  },
  ja: {
    "성장과 기획을 중심으로 자신을 세우는 사람입니다.": "成長と計画を中心に自分らしさを築く人です。",
    "표현과 속도을 중심으로 자신을 세우는 사람입니다.": "表現とスピードを中心に自分らしさを築く人です。",
    "책임과 축적을 중심으로 자신을 세우는 사람입니다.": "責任と蓄積を中心に自分らしさを築く人です。",
    "기준과 정리을 중심으로 자신을 세우는 사람입니다.": "基準と整理を中心に自分らしさを築く人です。",
    "관찰과 학습을 중심으로 자신을 세우는 사람입니다.": "観察と学習を中心に自分らしさを築く人です。",
    "다만 주변 요구나 현실 압력에 에너지가 쉽게 흩어질 수 있어, 회복과 기준 설정이 중요합니다.": "ただし周囲の要求や現実的な圧力でエネルギーが散りやすいため、回復と基準づくりが重要です。",
    "지금은": "今は",
    "로 읽히며,": "として読め、",
    "흐름을 안정시키는 핵심입니다.": "流れを安定させる鍵です。",
    "밖으로 바로 드러내기보다 안에서 충분히 정리한 뒤 움직이려는 경향": "外にすぐ出すより、内側で十分に整理してから動こうとする傾向",
    "역할, 책임, 평가 기준이 명확한 환경": "役割、責任、評価基準が明確な環境",
    "겉으로는 사람들과 맞추는 것처럼 보여도, 중요한 결정은 안에서 충분히 정리한 뒤 내리는 편입니다.": "表面上は周囲に合わせているように見えても、重要な決定は内側で十分に整理してから下す傾向があります。",
    "이 차이를 스스로 이해하면 불필요한 오해를 줄일 수 있습니다.": "この違いを自分で理解すると、不要な誤解を減らせます。",
    "지금 좋아 보이는가보다 3개월 뒤에도 유지 가능한가를 먼저 보기": "今よく見えるかより、3か月後も維持できるかを先に確認すること",
    "초년운": "若年期",
    "중년운": "中年期",
    "말년운": "晩年期",
    "의 감각을 배우고 자기 기준을 만드는 시기": "の感覚を学び、自分の基準を作る時期",
    "을 현실적인 성과로 바꾸는 시기": "を現実的な成果へ変える時期",
    "를 통해 경험을 정리하고 삶의 밀도를 높이는 시기": "を通じて経験を整理し、人生の密度を高める時期",
    "흐름 참고": "流れ参考",
    "대운이 이 구간의 배경으로 일부 작동합니다.": "大運がこの区間の背景として一部働きます。",
    "가족과 관계에서는 가까운 환경의 기대와 자신의 기준 사이에서 균형을 배우는 경향이 나타날 수 있습니다.": "家族や関係では、身近な期待と自分の基準の間でバランスを学ぶ傾向が出やすいです。",
    "가족과 관계에서는 역할과 책임이 커지며 관계의 경계를 다시 세우는 경향이 나타날 수 있습니다.": "家族や関係では、役割と責任が大きくなり、関係の境界を立て直す傾向が出やすいです。",
    "가족과 관계에서는 많은 관계보다 오래 남는 관계의 질을 중시하는 경향이 나타날 수 있습니다.": "家族や関係では、多くの関係より長く残る関係の質を重視しやすくなります。",
    "이 흐름은 좋고 나쁨보다, 어떤 방식으로 사람과 안정감을 만드는지를 보여줍니다.": "この流れは善悪ではなく、人とどのように安定感を作るかを示します。",
    "공부와 일에서는": "学びと仕事では",
    "쪽이 중요합니다.": "が重要です。",
    "기회는": "機会は",
    "에서 오기 쉽지만,": "から生まれやすいですが、",
    "을 놓치면 흐름이 끊길 수 있습니다.": "を逃すと流れが途切れやすくなります。",
    "이 시기의 조언은": "この時期の助言は",
    "이것이 반복되면 운의 흐름을 기다리는 것이 아니라, 흐름을 받아낼 그릇을 만드는 쪽에 가까워집니다.": "これを繰り返すほど、運の流れを待つのではなく、その流れを受け取る器を作ることに近づきます。",
    "수입 구조 점검": "収入構造の点検",
    "현실적 성과": "現実的な成果",
    "자원 관리": "資源管理",
    "검증 전 지출": "検証前の支出",
    "관계와 돈의 경계 흐림": "関係とお金の境界が曖昧になること",
    "돈과 역할의 기준을 먼저 정하는 것": "お金と役割の基準を先に決めること",
    "기대치를 말로 확인하기": "期待値を言葉で確認すること",
    "반복 가능한 업무 구조 만들기": "反復できる仕事構造を作ること",
    "수입과 지출 기준 점검": "収入と支出の基準を点検すること",
    "편안한 반복과 작은 약속을 통해 신뢰를 확인하는 방식": "心地よい反復と小さな約束を通じて信頼を確認する方式",
    "역할이 분명할 때 편하게 협력하는 방식": "役割が明確なときに協力しやすい方式",
    "성장을 응원하는 사람": "成長を応援してくれる人",
    "장기 목표를 함께 세우는 사람": "長期目標を一緒に立てられる人",
    "감정 반응이 너무 빠른 사람": "感情反応が速すぎる人",
    "관심을 계속 요구하는 사람": "関心を求め続ける人",
    "현실적인 목표와 성과 지표를 보며 자원을 움직이는 방식": "現実的な目標と成果指標を見ながら資源を動かす方式",
    "기준과 책임을 세워 안정감을 주는 리더십": "基準と責任を立てて安定感を与えるリーダーシップ",
    "익숙한 방식만 반복해 변화 신호를 늦게 알아차리는 점": "慣れた方式だけを繰り返し、変化のサインに気づくのが遅れる点",
    "넓은 기회, 거래, 네트워크, 새로운 판을 움직이는 과정": "広い機会、取引、ネットワーク、新しい場を動かす過程",
    "기회 탐색과 네트워크 활용, 다만 기준 있는 선별": "機会探索とネットワーク活用、ただし基準ある選別",
    "좋아 보이는 기회를 빠르게 잡으려는 마음": "よく見える機会を早くつかもうとする気持ち",
    "큰 결정 전 3개월 뒤에도 유지 가능한지 확인하기": "大きな決定の前に3か月後も維持できるか確認すること",
    "역할과 책임을 문장으로 남기기": "役割と責任を文章で残すこと",
    "새로운 제안은 최소 하루 이상 두고 다시 보기": "新しい提案は最低1日置いてから見直すこと",
    "마음을 충분히 정리한 뒤 조심스럽게 표현하는 편": "気持ちを十分に整理してから慎重に表現する傾向",
    "반응 속도가 빨라지며 쉽게 소진되는 방식": "反応速度が速くなり、消耗しやすい方式",
    "조용히 오래 축적하는 힘은 있지만, 밖으로 풀어내지 못하면 답답함이 쌓일 수 있는 흐름": "静かに長く蓄積する力はありますが、外に出せないと息苦しさが溜まりやすい流れ",
    "새로운 일정이나 환경 변화가 누적될 때 긴장이 먼저 올라오는 편": "新しい予定や環境変化が重なると、緊張が先に高まりやすい傾向",
    "생각을 정리한 뒤 작게라도 밖으로 표현하기": "考えを整理した後、小さくても外に表現すること",
    "컨디션이 흔들릴 때 중요한 결정을 미루기": "コンディションが揺れる時は重要な決定を遅らせること",
    "도움을 요청할 사람을 정해두기": "助けを求める相手を決めておくこと",
    "중요한 선택은 기록으로 남기기": "重要な選択は記録に残すこと",
    "기회처럼 보인다는 이유만으로 움직이는 습관": "機会に見えるという理由だけで動く習慣",
    "혼자 판단하고 혼자 버티는 시간": "一人で判断し、一人で耐える時間",
    "역할과 기대치가 말로 정리되는 환경": "役割と期待値が言葉で整理される環境",
    "성과보다 과정의 기준도 함께 보는 환경": "成果だけでなく過程の基準も見る環境",
    "내 속도를 존중하면서도 현실적인 확인을 도와주는 사람": "自分の速度を尊重しながら現実的な確認を助けてくれる人",
    "내가 맡을 책임과 상대가 맡을 책임을 구분하기": "自分の責任と相手の責任を区別すること",
    "속도를 높이기 전에 회복 가능한 일정인지 확인하기": "速度を上げる前に回復可能な予定か確認すること",
    "말하지 않은 기대가 쌓일 때 오해가 생길 수 있습니다.": "言葉にしていない期待が溜まると誤解が生じることがあります。",
    "기회가 많아 보일 때 검증 전에 움직이는 점": "機会が多く見える時に検証前に動く点",
    "시작한 흐름을 오래 키우기 위해 작은 루틴이 필요한 지점": "始めた流れを長く育てるために小さなルーティンが必要な部分",
    "방향을 너무 많이 열어두어 마무리가 늦어지는 패턴": "方向を広げすぎて仕上げが遅れるパターン",
    "결정을 내릴 때는 단순히 분위기를 따라가기보다, 안에서 기준이 정리되어야 움직이는 편으로 해석됩니다.": "決定するときは、その場の雰囲気に流されるより、内側で基準が整理されてから動く傾向として読めます。",
    "이 함께 나타나므로, 겉으로 보이는 속도와 실제 마음속 정리 속도가 다를 수 있습니다.": "も一緒に現れるため、外から見える速度と内面で整理する速度が異なる場合があります。",
    "잘 맞는 환경은": "合いやすい環境は",
    "입니다. 이 조건이 맞으면 책임감과 실행력이 강점이 되지만, 반대로 역할이 모호하거나 기대치가 불분명하면 에너지가 분산될 수 있습니다.": "です。この条件が合うと責任感と実行力が強みになりますが、役割が曖昧だったり期待値が不明確だったりすると、エネルギーが分散しやすくなります。",
    "반복해서 주의할 지점은": "繰り返し注意したい点は",
    "입니다. 이 부분은 약점이라기보다 의식적으로 설계해야 하는 영역입니다. 큰 결심보다": "です。これは弱点というより、意識的に設計すべき領域です。大きな決意より",
    "가 더 현실적인 개선 방식입니다.": "のほうが現実的な改善方法です。",
    "이 흐름을 잘 쓰려면 삶의 방향을 크게 바꾸기보다, 지금 가진 강점을 결과물로 남기는 방식을 만들어야 합니다.": "この流れをうまく使うには、人生の方向を大きく変えるより、今ある強みを成果として残す方法を作ることが大切です。",
    "특히": "特に",
    "라는 기준을 두면 관계, 일, 돈에서 같은 실수를 줄이는 데 도움이 됩니다.": "という基準を持つと、関係、仕事、お金で同じ失敗を減らす助けになります。",
    "돈보다 경험과 기준을 먼저 배우는 과정": "お金より経験と基準を先に学ぶ過程",
    "수입, 책임, 지출 구조가 함께 커지는 과정": "収入、責任、支出構造が一緒に大きくなる過程",
    "무리한 확장보다 지키고 정리하는 힘이 중요해지는 과정": "無理な拡張より守り整理する力が重要になる過程",
    "재물과 기회는": "お金と機会は",
    "로 읽힙니다.": "として読めます。",
    "주의할 점은": "注意点は",
    "이 아니라, 부족한 리듬을 보완하지 않은 채 속도만 높이는 것입니다.": "ではなく、不足したリズムを補わないまま速度だけを上げることです。",
    "입니다.": "です。",
    "공부와 일에서는 표현과 속도을 배우고 시도하는 경험": "学びと仕事では表現とスピードを学び試す経験",
    "을 배우고 시도하는 경험": "を学び試す経験",
    "생각이 정리되면 밖으로 빠르게 움직이고 반응하는 경향": "考えが整理されると外へ素早く動き反応する傾向",
    "상황에 따라 관찰과 실행을 오갈 수 있는 경향": "状況に応じて観察と実行を行き来できる傾向",
    "계산 가능한 범위": "計算可能な範囲",
    "기회와 지출이 함께 커지기 쉽습니다. 좋아 보이는 제안일수록 유지 가능성을 확인해야 합니다.": "機会と支出が一緒に大きくなりやすいため、よく見える提案ほど維持可能性を確認する必要があります。",
    "올해는": "今年は",
    "이 활성화됩니다. 그래서 기회는": "が活性化します。そのため機会は",
    "쪽에서 생기기 쉽고, 주의점은": "から生まれやすく、注意点は",
    "현재 나이는": "現在の年齢は",
    "세이며, 이 시기는": "歳で、この時期は",
    "현재 흐름": "現在の流れ",
    "이 사주는": "この命式は",
    "에서 재물 흐름이 생기기 쉽습니다.": "から財の流れが生まれやすいです。",
    "식으로 나타날 수 있습니다.": "という形で表れやすいです。",
    "쪽으로 흔들릴 수 있습니다. 불편이 지속되면 반드시 의료 전문가와 상담해야 합니다.": "の方向へ揺れやすいことがあります。不調が続く場合は必ず医療専門家に相談してください。",
    "관계:": "関係:",
    "돈:": "お金:",
    "일:": "仕事:",
    "생활:": "生活:",
    "판단:": "判断:",
    "대운 흐름은": "大運の流れは",
    "를 배경으로 하고, 올해의 흐름은": "を背景とし、今年の流れは",
    "로 들어옵니다.": "として入ります。",
    "지금 집중할 것은": "今集中すべきことは",
    "반대로 무리하면 익숙한 방식만 반복하거나, 도움을 요청할 시기를 놓칠 수 있습니다.": "反対に無理をすると、慣れた方式だけを繰り返したり、助けを求める時期を逃したりすることがあります。",
    "사고 방식은": "思考スタイルは",
    "쪽으로 힘이 실리며, 정보를 받아들일 때도 자신만의 기준을 세우려는 경향이 있습니다.": "に重心があり、情報を受け取るときも自分なりの基準を立てようとする傾向があります。",
    "강점은": "強みは",
    "이 강점이 잘 쓰이면 꾸준함과 설득력이 생기지만, 과해지면": "です。この強みがうまく使われると継続力と説得力になりますが、過剰になると",
    "으로 나타날 수 있습니다.": "として表れることがあります。",
    "반응이 빨라져 소진되거나 감정적 판단이 앞서는 패턴": "反応が速くなり、消耗したり感情的判断が先に立つパターン",
    "약점은": "弱点は",
    "다른 사람이 보기에는 망설임이나 고집처럼 보일 수 있지만, 실제로는 에너지를 오래 유지할 구조가 필요한 경우가 많습니다.": "他人にはためらいや頑固さに見えることがありますが、実際にはエネルギーを長く保つ構造が必要な場合が多いです。",
    "타인이 오해하기 쉬운 부분은 겉으로 보이는 태도와 속마음의 속도가 다를 수 있다는 점": "他人が誤解しやすい点は、外に見える態度と内側の速度が違う場合があること",
    "겉으로는": "表面上は",
    "이 먼저 보이지만, 안쪽에서는": "が先に見えますが、内側では",
    "도 함께 작동할 수 있습니다.": "も一緒に働くことがあります。",
    "의식적으로 연습할 것은": "意識して練習したいことは",
    "이 연습이 반복되면 성격의 단점처럼 보이던 부분이 안정적인 선택 능력으로 바뀔 수 있습니다.": "この練習が繰り返されると、性格の短所のように見えた部分が安定した選択力に変わることがあります。",
    "신뢰를 쌓는 방식은": "信頼を築く方式は",
    "한 번 믿을 수 있다고 판단하면 관계를 오래 유지하려는 편이지만, 처음부터 모든 것을 열어두지는 않을 수 있습니다.": "一度信頼できると判断すると関係を長く維持しようとしますが、最初からすべてを開くとは限りません。",
    "무리 안에서는": "集団の中では",
    "성향이 나타납니다. 협업이 잘 되려면 역할과 책임이 분명해야 하고, 애매한 기대가 쌓이면 불편함이 커질 수 있습니다.": "という傾向が現れます。協業がうまくいくには役割と責任が明確である必要があり、曖昧な期待が溜まると違和感が大きくなりやすいです。",
    "끌리는 사람은": "惹かれやすい人は",
    "같은 특성을 가진 사람": "のような特性を持つ人",
    "반대로": "反対に",
    "쪽이 과하면 관계 안에서 긴장감이 생길 수 있습니다.": "が過剰だと、関係の中で緊張が生じることがあります。",
    "관계에서 도움이 되는 습관은 감정을 늦게 폭발시키기보다 작은 불편함을 빨리 말하는 것": "関係で役立つ習慣は、感情を遅れて爆発させるより、小さな違和感を早めに伝えること",
    "해로운 습관은 혼자 이해하고 혼자 참다가 어느 순간 거리를 두는 방식": "害になりやすい習慣は、一人で理解し一人で我慢した後、ある時点で距離を置く方式",
    "일의 방식은": "仕事の方式は",
    "에 가깝습니다. 단순히 직업명을 정하기보다, 어떤 방식으로 일할 때 성과가 나는지를 보는 것이 더 중요합니다.": "に近いです。単に職業名を決めるより、どのように働くと成果が出るかを見ることが重要です。",
    "이런 성향은 기획, 분석, 운영, 교육, 전문성 기반 업무, 콘텐츠나 커뮤니케이션처럼 자신의 기준과 결과물이 함께 필요한 영역에서 좋아질 수 있습니다.": "この傾向は、企画、分析、運営、教育、専門性を基盤にした仕事、コンテンツやコミュニケーションのように、自分の基準と成果物が共に必要な領域で活かしやすいです。",
    "리더십은": "リーダーシップは",
    "로 나타날 가능성이 있습니다. 강압적으로 끌고 가기보다 기준을 세우고 책임 범위를 정리할 때 신뢰를 얻습니다.": "として現れる可能性があります。強引に引っ張るより、基準を立て責任範囲を整理すると信頼を得やすいです。",
    "직장에서의 위험은": "職場でのリスクは",
    "이 부분이 강점이 되려면 표현 방식과 절차를 조절하는 능력이 필요합니다.": "この部分を強みにするには、表現方式と手順を調整する力が必要です。",
    "재물운은 돈이 갑자기 크게 들어온다는 식으로 보기보다, 어떤 방식으로 현실적인 결과를 만드는지를 보는 편이 맞습니다.": "金運は、お金が急に大きく入るというより、どのように現実的な結果を作るかとして見るのが適切です。",
    "돈이 들어오는 방식은": "お金が入る方式は",
    "한 번에 크게 잡기보다 특정 능력이나 신뢰를 꾸준히 쌓을 때 흐름이 안정되기 쉽습니다.": "一度に大きくつかむより、特定の能力や信頼を継続して積み上げると流れが安定しやすいです。",
    "돈이 새기 쉬운 지점은": "お金が漏れやすい点は",
    "사람, 기대, 즉흥적 판단이 엮일수록 지출이나 투자가 커질 수 있으므로 확인 절차가 필요합니다.": "人、期待、即興的判断が絡むほど支出や投資が大きくなりやすいため、確認手順が必要です。",
    "재물 손실을 줄이는 법은": "財の損失を減らす方法は",
    "이 내용은 투자 조언이 아니라 자기 점검 기준입니다. 실제 금융 결정은 전문가와 별도로 확인해야 합니다.": "これは投資助言ではなく自己点検の基準です。実際の金融判断は専門家と別途確認してください。",
    "연애와 애정 표현은": "恋愛と愛情表現は",
    "로 나타날 수 있습니다. 마음이 있어도 표현 방식이 일정하지 않으면 상대가 헷갈릴 수 있으므로, 감정보다 행동의 일관성이 중요합니다.": "として現れることがあります。気持ちがあっても表現が一定でないと相手が迷うため、感情の強さより行動の一貫性が重要です。",
    "잘 맞는 상대는": "合いやすい相手は",
    "을 가진 사람입니다. 이런 사람은 부족한 리듬을 자연스럽게 보완해 주고, 관계가 한쪽으로 치우치지 않게 도와줄 수 있습니다.": "を持つ人です。このような人は足りないリズムを自然に補い、関係が一方に偏らないよう助けてくれます。",
    "긴장이 생기기 쉬운 상대는": "緊張が生じやすい相手は",
    "비슷한 강점이 만나면 매력도 커지지만 주도권이나 속도 차이도 커질 수 있습니다.": "似た強みが出会うと魅力も増しますが、主導権や速度の差も大きくなりやすいです。",
    "장기 관계나 결혼은 시기를 단정하기보다 관계를 시작하는 방식과 유지하는 방식을 보는 것이 안전합니다.": "長期関係や結婚は時期を断定するより、関係の始め方と維持の仕方を見るほうが安全です。",
    "시작에 시간이 걸리는 편이라면 장기 관계의 시기도 늦어질 수 있지만, 그만큼 신뢰가 쌓였을 때 안정적으로 이어질 가능성이 있습니다.": "始めるのに時間がかかるタイプなら長期関係の時期も遅くなることがありますが、その分信頼が積み上がると安定して続く可能性があります。",
    "건강과 생활 리듬은 의학적 진단이 아니라 컨디션 관리 경향으로만 읽어야 합니다.": "健康と生活リズムは医学的診断ではなく、コンディション管理の傾向としてだけ読む必要があります。",
    "스트레스가 쌓이면": "ストレスが溜まると",
    "에너지 패턴은": "エネルギーパターンは",
    "무리하면 한 번에 많이 쓰고 한 번에 지치는 흐름이 생길 수 있으므로, 회복 시간을 일정에 먼저 넣는 편이 좋습니다.": "無理をすると一度に多く使い一度に疲れる流れが生じやすいため、回復時間を予定に先に入れるほうがよいです。",
    "식사나 몸의 감각은": "食事や身体感覚は",
    "추천 습관은": "おすすめの習慣は",
    "운을 좋게 쓰는 생활 방식은 특별한 의식보다 몸의 리듬을 안정시키는 반복에서 시작됩니다.": "運をよく使う生活方式は、特別な儀式より身体のリズムを安定させる反復から始まります。"
  },
  zh: {
    "성장과 기획을 중심으로 자신을 세우는 사람입니다.": "这是以成长与规划建立自我的人。",
    "표현과 속도을 중심으로 자신을 세우는 사람입니다.": "这是以表达与速度建立自我的人。",
    "책임과 축적을 중심으로 자신을 세우는 사람입니다.": "这是以责任与积累建立自我的人。",
    "기준과 정리을 중심으로 자신을 세우는 사람입니다.": "这是以标准与整理建立自我的人。",
    "관찰과 학습을 중심으로 자신을 세우는 사람입니다.": "这是以观察与学习建立自我的人。",
    "다만 주변 요구나 현실 압력에 에너지가 쉽게 흩어질 수 있어, 회복과 기준 설정이 중요합니다.": "只是周围要求和现实压力容易分散能量，因此恢复与设定标准很重要。",
    "지금은": "现在，",
    "로 읽히며,": "可视为主要主题，",
    "흐름을 안정시키는 핵심입니다.": "是稳定流动的关键。",
    "밖으로 바로 드러내기보다 안에서 충분히 정리한 뒤 움직이려는 경향": "比起马上向外表现，更倾向于先在内心充分整理再行动",
    "역할, 책임, 평가 기준이 명확한 환경": "角色、责任和评价标准明确的环境",
    "겉으로는 사람들과 맞추는 것처럼 보여도, 중요한 결정은 안에서 충분히 정리한 뒤 내리는 편입니다.": "表面上看似能配合别人，但重要决定通常会在内心充分整理后再下。",
    "이 차이를 스스로 이해하면 불필요한 오해를 줄일 수 있습니다.": "理解这种差异，可以减少不必要的误会。",
    "지금 좋아 보이는가보다 3개월 뒤에도 유지 가능한가를 먼저 보기": "先看三个月后是否还能维持，而不是只看现在是否看起来不错",
    "초년운": "早年运",
    "중년운": "中年运",
    "말년운": "晚年运",
    "의 감각을 배우고 자기 기준을 만드는 시기": "学习这种感觉并建立自我标准的时期",
    "을 현실적인 성과로 바꾸는 시기": "把优势转化为现实成果的时期",
    "를 통해 경험을 정리하고 삶의 밀도를 높이는 시기": "通过这一习惯整理经验、提升生活密度的时期",
    "흐름 참고": "流动参考",
    "대운이 이 구간의 배경으로 일부 작동합니다.": "大运会作为此阶段的部分背景发挥作用。",
    "가족과 관계에서는 가까운 환경의 기대와 자신의 기준 사이에서 균형을 배우는 경향이 나타날 수 있습니다.": "在家庭和关系中，可能表现为学习在周围期待与自我标准之间取得平衡。",
    "가족과 관계에서는 역할과 책임이 커지며 관계의 경계를 다시 세우는 경향이 나타날 수 있습니다.": "在家庭和关系中，角色与责任会变大，也可能需要重新建立关系边界。",
    "가족과 관계에서는 많은 관계보다 오래 남는 관계의 질을 중시하는 경향이 나타날 수 있습니다.": "在家庭和关系中，比起许多关系，更容易重视能够长久留下的关系质量。",
    "이 흐름은 좋고 나쁨보다, 어떤 방식으로 사람과 안정감을 만드는지를 보여줍니다.": "这个流动不是好坏判断，而是说明如何与人建立安定感。",
    "공부와 일에서는": "在学习和工作中，",
    "쪽이 중요합니다.": "会变得重要。",
    "기회는": "机会容易来自",
    "에서 오기 쉽지만,": "，但如果",
    "을 놓치면 흐름이 끊길 수 있습니다.": "被忽略，流动可能中断。",
    "이 시기의 조언은": "这一时期的建议是",
    "이것이 반복되면 운의 흐름을 기다리는 것이 아니라, 흐름을 받아낼 그릇을 만드는 쪽에 가까워집니다.": "反复实践后，就不是等待运势，而是在打造能够承接流动的容量。",
    "수입 구조 점검": "检查收入结构",
    "현실적 성과": "现实成果",
    "자원 관리": "资源管理",
    "검증 전 지출": "验证前支出",
    "관계와 돈의 경계 흐림": "关系与金钱边界模糊",
    "돈과 역할의 기준을 먼저 정하는 것": "先确定金钱和角色的标准",
    "기대치를 말로 확인하기": "用语言确认期待",
    "반복 가능한 업무 구조 만들기": "建立可重复的工作结构",
    "수입과 지출 기준 점검": "检查收入与支出标准",
    "편안한 반복과 작은 약속을 통해 신뢰를 확인하는 방식": "通过舒适的重复和小承诺确认信任的方式",
    "역할이 분명할 때 편하게 협력하는 방식": "角色明确时更容易合作的方式",
    "성장을 응원하는 사람": "支持成长的人",
    "장기 목표를 함께 세우는 사람": "能一起建立长期目标的人",
    "감정 반응이 너무 빠른 사람": "情绪反应过快的人",
    "관심을 계속 요구하는 사람": "不断要求关注的人",
    "현실적인 목표와 성과 지표를 보며 자원을 움직이는 방식": "根据现实目标和成果指标调动资源的方式",
    "기준과 책임을 세워 안정감을 주는 리더십": "通过标准和责任带来安定感的领导方式",
    "익숙한 방식만 반복해 변화 신호를 늦게 알아차리는 점": "只重复熟悉方式，较晚察觉变化信号",
    "넓은 기회, 거래, 네트워크, 새로운 판을 움직이는 과정": "广泛机会、交易、网络以及推动新局面的过程",
    "기회 탐색과 네트워크 활용, 다만 기준 있는 선별": "探索机会并运用网络，但需要有标准地筛选",
    "좋아 보이는 기회를 빠르게 잡으려는 마음": "想快速抓住看起来不错机会的心态",
    "큰 결정 전 3개월 뒤에도 유지 가능한지 확인하기": "重大决定前确认三个月后是否还能维持",
    "역할과 책임을 문장으로 남기기": "把角色和责任写成明确句子",
    "새로운 제안은 최소 하루 이상 두고 다시 보기": "新提案至少隔一天后再看",
    "마음을 충분히 정리한 뒤 조심스럽게 표현하는 편": "充分整理内心后再谨慎表达的倾向",
    "반응 속도가 빨라지며 쉽게 소진되는 방식": "反应速度变快并容易消耗的方式",
    "조용히 오래 축적하는 힘은 있지만, 밖으로 풀어내지 못하면 답답함이 쌓일 수 있는 흐름": "有安静长期积累的力量，但若无法向外释放，容易积累压抑感",
    "새로운 일정이나 환경 변화가 누적될 때 긴장이 먼저 올라오는 편": "新日程或环境变化累积时，紧张感容易先升高",
    "생각을 정리한 뒤 작게라도 밖으로 표현하기": "整理想法后，即使很小也向外表达",
    "컨디션이 흔들릴 때 중요한 결정을 미루기": "状态不稳时推迟重要决定",
    "도움을 요청할 사람을 정해두기": "预先确定可以求助的人",
    "중요한 선택은 기록으로 남기기": "把重要选择留下记录",
    "기회처럼 보인다는 이유만으로 움직이는 습관": "只因为看似机会就行动的习惯",
    "혼자 판단하고 혼자 버티는 시간": "独自判断并独自坚持的时间",
    "역할과 기대치가 말로 정리되는 환경": "角色和期待能用语言整理清楚的环境",
    "성과보다 과정의 기준도 함께 보는 환경": "不仅看成果，也看过程标准的环境",
    "내 속도를 존중하면서도 현실적인 확인을 도와주는 사람": "尊重你的速度，同时帮助做现实确认的人",
    "내가 맡을 책임과 상대가 맡을 책임을 구분하기": "区分自己的责任与对方的责任",
    "속도를 높이기 전에 회복 가능한 일정인지 확인하기": "提速前确认日程是否能恢复",
    "말하지 않은 기대가 쌓일 때 오해가 생길 수 있습니다.": "未说出口的期待累积时，容易产生误会。",
    "기회가 많아 보일 때 검증 전에 움직이는 점": "机会看起来很多时，在验证前就行动",
    "시작한 흐름을 오래 키우기 위해 작은 루틴이 필요한 지점": "为了让已经开始的流动持续成长，需要小型例行习惯的部分",
    "방향을 너무 많이 열어두어 마무리가 늦어지는 패턴": "方向打开太多，导致收尾变慢的模式",
    "결정을 내릴 때는 단순히 분위기를 따라가기보다, 안에서 기준이 정리되어야 움직이는 편으로 해석됩니다.": "做决定时，比起单纯跟随气氛，更像是内在标准整理清楚后才会行动。",
    "이 함께 나타나므로, 겉으로 보이는 속도와 실제 마음속 정리 속도가 다를 수 있습니다.": "也会同时出现，因此外在速度与内心整理速度可能不同。",
    "잘 맞는 환경은": "适合的环境是",
    "입니다. 이 조건이 맞으면 책임감과 실행력이 강점이 되지만, 반대로 역할이 모호하거나 기대치가 불분명하면 에너지가 분산될 수 있습니다.": "。这个条件合适时，责任感和执行力会成为优势；反之，如果角色模糊或期待不清，能量容易分散。",
    "반복해서 주의할 지점은": "需要反复注意的点是",
    "입니다. 이 부분은 약점이라기보다 의식적으로 설계해야 하는 영역입니다. 큰 결심보다": "。这与其说是弱点，不如说是需要有意识设计的领域。比起大决心，",
    "가 더 현실적인 개선 방식입니다.": "是更现实的改善方式。",
    "이 흐름을 잘 쓰려면 삶의 방향을 크게 바꾸기보다, 지금 가진 강점을 결과물로 남기는 방식을 만들어야 합니다.": "要善用这个流动，与其大幅改变人生方向，不如建立一种把现有优势留下为成果的方式。",
    "특히": "尤其",
    "라는 기준을 두면 관계, 일, 돈에서 같은 실수를 줄이는 데 도움이 됩니다.": "作为标准，有助于在关系、工作和金钱上减少重复错误。",
    "돈보다 경험과 기준을 먼저 배우는 과정": "先学习经验和标准，而不是先看金钱的过程",
    "수입, 책임, 지출 구조가 함께 커지는 과정": "收入、责任和支出结构一起变大的过程",
    "무리한 확장보다 지키고 정리하는 힘이 중요해지는 과정": "比起勉强扩张，更重视守住并整理的力量的过程",
    "재물과 기회는": "财物与机会可读作",
    "로 읽힙니다.": "。",
    "주의할 점은": "需要注意的不是",
    "이 아니라, 부족한 리듬을 보완하지 않은 채 속도만 높이는 것입니다.": "，而是在没有补足缺失节奏的情况下只提高速度。",
    "입니다.": "。",
    "공부와 일에서는 표현과 속도을 배우고 시도하는 경험": "在学习和工作中，学习并尝试表达与速度的经验",
    "을 배우고 시도하는 경험": "学习并尝试的经验",
    "생각이 정리되면 밖으로 빠르게 움직이고 반응하는 경향": "想法整理后会快速向外行动和回应的倾向",
    "상황에 따라 관찰과 실행을 오갈 수 있는 경향": "可根据情况在观察和执行之间切换的倾向",
    "계산 가능한 범위": "可计算范围",
    "기회와 지출이 함께 커지기 쉽습니다. 좋아 보이는 제안일수록 유지 가능성을 확인해야 합니다.": "机会和支出容易一起变大，因此越是看起来不错的提案，越要确认是否能持续。",
    "올해는": "今年，",
    "이 활성화됩니다. 그래서 기회는": "被激活。因此机会容易来自",
    "쪽에서 생기기 쉽고, 주의점은": "，需要注意的是",
    "현재 나이는": "当前年龄为",
    "세이며, 이 시기는": "岁，这一时期可视为",
    "현재 흐름": "当前流动",
    "이 사주는": "这个命盘容易从",
    "에서 재물 흐름이 생기기 쉽습니다.": "产生财物流动。",
    "식으로 나타날 수 있습니다.": "这种方式表现出来。",
    "쪽으로 흔들릴 수 있습니다. 불편이 지속되면 반드시 의료 전문가와 상담해야 합니다.": "方向波动。如果不适持续，请务必咨询医疗专业人士。",
    "관계:": "关系：",
    "돈:": "金钱：",
    "일:": "工作：",
    "생활:": "生活：",
    "판단:": "判断：",
    "대운 흐름은": "大运流动以",
    "를 배경으로 하고, 올해의 흐름은": "为背景，今年流动进入",
    "로 들어옵니다.": "。",
    "지금 집중할 것은": "现在需要专注的是",
    "반대로 무리하면 익숙한 방식만 반복하거나, 도움을 요청할 시기를 놓칠 수 있습니다.": "反之，若过度勉强，可能只重复熟悉方式，或错过寻求帮助的时机。",
    "사고 방식은": "思考方式偏向",
    "쪽으로 힘이 실리며, 정보를 받아들일 때도 자신만의 기준을 세우려는 경향이 있습니다.": "，接收信息时也倾向于建立自己的标准。",
    "강점은": "优势是",
    "이 강점이 잘 쓰이면 꾸준함과 설득력이 생기지만, 과해지면": "。这个优势用得好会形成持续力和说服力，但过度时可能表现为",
    "으로 나타날 수 있습니다.": "。",
    "반응이 빨라져 소진되거나 감정적 판단이 앞서는 패턴": "反应变快、容易消耗或情绪判断先行的模式",
    "약점은": "弱点是",
    "다른 사람이 보기에는 망설임이나 고집처럼 보일 수 있지만, 실제로는 에너지를 오래 유지할 구조가 필요한 경우가 많습니다.": "在别人看来可能像犹豫或固执，但实际上往往是需要能长期维持能量的结构。",
    "타인이 오해하기 쉬운 부분은 겉으로 보이는 태도와 속마음의 속도가 다를 수 있다는 점": "别人容易误解的一点是，外在态度与内心速度可能不同",
    "겉으로는": "表面上，",
    "이 먼저 보이지만, 안쪽에서는": "会先被看见，但内在也可能有",
    "도 함께 작동할 수 있습니다.": "一起运作。",
    "의식적으로 연습할 것은": "需要有意识练习的是",
    "이 연습이 반복되면 성격의 단점처럼 보이던 부분이 안정적인 선택 능력으로 바뀔 수 있습니다.": "这种练习反复后，看似性格缺点的部分可能转化为稳定的选择能力。",
    "신뢰를 쌓는 방식은": "建立信任的方式是",
    "한 번 믿을 수 있다고 판단하면 관계를 오래 유지하려는 편이지만, 처음부터 모든 것을 열어두지는 않을 수 있습니다.": "一旦判断可以信任，就倾向于长期维持关系，但未必一开始就完全敞开。",
    "무리 안에서는": "在群体中，",
    "성향이 나타납니다. 협업이 잘 되려면 역할과 책임이 분명해야 하고, 애매한 기대가 쌓이면 불편함이 커질 수 있습니다.": "这种倾向会出现。合作顺利需要角色和责任明确，模糊的期待累积时，不适感会变大。",
    "끌리는 사람은": "容易被吸引的人是",
    "같은 특성을 가진 사람": "具有这类特质的人",
    "반대로": "相反，",
    "쪽이 과하면 관계 안에서 긴장감이 생길 수 있습니다.": "过强时，关系中可能产生紧张感。",
    "관계에서 도움이 되는 습관은 감정을 늦게 폭발시키기보다 작은 불편함을 빨리 말하는 것": "关系中有帮助的习惯是，与其让情绪晚些爆发，不如早点说出小的不舒服",
    "해로운 습관은 혼자 이해하고 혼자 참다가 어느 순간 거리를 두는 방식": "有害的习惯是独自理解、独自忍耐，然后某一刻突然拉开距离",
    "일의 방식은": "工作方式接近",
    "에 가깝습니다. 단순히 직업명을 정하기보다, 어떤 방식으로 일할 때 성과가 나는지를 보는 것이 더 중요합니다.": "。比起单纯确定职业名称，更重要的是看以什么方式工作时会产生成果。",
    "이런 성향은 기획, 분석, 운영, 교육, 전문성 기반 업무, 콘텐츠나 커뮤니케이션처럼 자신의 기준과 결과물이 함께 필요한 영역에서 좋아질 수 있습니다.": "这种倾向适合企划、分析、运营、教育、专业性工作、内容或沟通等既需要自我标准也需要成果的领域。",
    "리더십은": "领导方式可能表现为",
    "로 나타날 가능성이 있습니다. 강압적으로 끌고 가기보다 기준을 세우고 책임 범위를 정리할 때 신뢰를 얻습니다.": "。比起强硬推动，建立标准并整理责任范围时更容易获得信任。",
    "직장에서의 위험은": "职场风险是",
    "이 부분이 강점이 되려면 표현 방식과 절차를 조절하는 능력이 필요합니다.": "若要让这一点成为优势，需要调整表达方式和流程的能力。",
    "재물운은 돈이 갑자기 크게 들어온다는 식으로 보기보다, 어떤 방식으로 현실적인 결과를 만드는지를 보는 편이 맞습니다.": "财运不宜理解为金钱突然大量进入，更适合看成以什么方式创造现实成果。",
    "돈이 들어오는 방식은": "钱进入的方式是",
    "한 번에 크게 잡기보다 특정 능력이나 신뢰를 꾸준히 쌓을 때 흐름이 안정되기 쉽습니다.": "比起一次抓大，持续积累特定能力或信任时，流动更容易稳定。",
    "돈이 새기 쉬운 지점은": "钱容易流失的地方是",
    "사람, 기대, 즉흥적 판단이 엮일수록 지출이나 투자가 커질 수 있으므로 확인 절차가 필요합니다.": "人、期待和即兴判断越纠缠，支出或投入越容易变大，因此需要确认流程。",
    "재물 손실을 줄이는 법은": "减少财物损失的方法是",
    "이 내용은 투자 조언이 아니라 자기 점검 기준입니다. 실제 금융 결정은 전문가와 별도로 확인해야 합니다.": "这不是投资建议，而是自我检查标准。实际金融决定应另行咨询专业人士。",
    "연애와 애정 표현은": "恋爱与情感表达可能表现为",
    "로 나타날 수 있습니다. 마음이 있어도 표현 방식이 일정하지 않으면 상대가 헷갈릴 수 있으므로, 감정보다 행동의 일관성이 중요합니다.": "。即使有心意，表达方式不稳定也会让对方困惑，因此比起情绪强度，行动一致性更重要。",
    "잘 맞는 상대는": "适合的对象是",
    "을 가진 사람입니다. 이런 사람은 부족한 리듬을 자연스럽게 보완해 주고, 관계가 한쪽으로 치우치지 않게 도와줄 수 있습니다.": "的人。这样的人能自然补足缺失节奏，帮助关系不向一边倾斜。",
    "긴장이 생기기 쉬운 상대는": "容易产生紧张的对象是",
    "비슷한 강점이 만나면 매력도 커지지만 주도권이나 속도 차이도 커질 수 있습니다.": "相似优势相遇会增加吸引力，但也可能扩大主导权或速度差异。",
    "장기 관계나 결혼은 시기를 단정하기보다 관계를 시작하는 방식과 유지하는 방식을 보는 것이 안전합니다.": "长期关系或婚姻，比起断定时间，更适合看关系如何开始以及如何维持。",
    "시작에 시간이 걸리는 편이라면 장기 관계의 시기도 늦어질 수 있지만, 그만큼 신뢰가 쌓였을 때 안정적으로 이어질 가능성이 있습니다.": "如果开始一段关系需要时间，长期关系的时机也可能偏晚；但正因如此，一旦信任累积，关系更可能稳定延续。",
    "건강과 생활 리듬은 의학적 진단이 아니라 컨디션 관리 경향으로만 읽어야 합니다.": "健康与生活节奏只能作为状态管理倾向阅读，不是医学诊断。",
    "스트레스가 쌓이면": "压力累积时，",
    "에너지 패턴은": "能量模式是",
    "무리하면 한 번에 많이 쓰고 한 번에 지치는 흐름이 생길 수 있으므로, 회복 시간을 일정에 먼저 넣는 편이 좋습니다.": "若勉强，可能一次性消耗很多并一次性疲惫，因此最好先把恢复时间放进行程。",
    "식사나 몸의 감각은": "饮食或身体感觉可能向",
    "추천 습관은": "推荐习惯是",
    "운을 좋게 쓰는 생활 방식은 특별한 의식보다 몸의 리듬을 안정시키는 반복에서 시작됩니다.": "善用运势的生活方式，不是从特殊仪式开始，而是从稳定身体节奏的重复开始。"
  }
};

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.en, {
  "책임 있는 역할": "responsible roles",
  "공식적 신뢰": "formal trust",
  "커리어 기준 정리": "clarifying career standards",
  "책임 과부하": "responsibility overload",
  "압박감": "pressure",
  "학습": "learning",
  "자격·전문성": "credentials and expertise",
  "회복과 준비": "recovery and preparation",
  "준비만 길어지는 점": "preparation becoming too long",
  "고립": "isolation",
  "독립적인 결정": "independent decisions",
  "동료와의 협업 재정비": "reorganizing collaboration with peers",
  "자기 기준 확립": "establishing personal standards",
  "주도권 다툼": "struggles over control",
  "혼자 다 하려는 태도": "trying to do everything alone",
  "결과물 공개": "sharing output",
  "말·글·콘텐츠": "speech, writing, and content",
  "아이디어 실행": "executing ideas",
  "말이 앞서고 정리가 늦어지는 점": "speaking before things are organized",
  "소진": "burnout",
  "맡을 책임과 거절할 책임을 구분하는 것": "separating responsibilities to accept from responsibilities to refuse",
  "배운 것을 실제 행동으로 작게 옮기는 것": "turning learning into small real actions",
  "혼자 버티는 힘을 협업 구조로 바꾸는 것": "turning solo endurance into a collaboration structure",
  "작은 결과물을 꾸준히 밖으로 보여주는 것": "showing small outputs consistently",
  "정해진 틀에 무조건 맞추기보다 납득할 수 있는 자율성이 있을 때 더 잘 움직입니다.": "You move better with autonomy you can accept than with a fixed frame you must obey blindly.",
  "배움과 실행을 비교적 균형 있게 오갈 수 있습니다.": "Learning and execution can be balanced relatively well.",
  "현실적인 결과를 만들고 자원을 움직이는 감각이 강하게 나타날 수 있습니다.": "There can be a strong sense for creating practical results and moving resources.",
  "혼자 밀어붙이기보다 좋은 사람, 안정적인 시스템, 명확한 역할의 도움을 받을 때 더 잘 움직입니다.": "You move better with good people, stable systems, and clear roles than by pushing alone.",
  "현실적인 성과를 만들고 싶은 욕구와 독립성이 함께 강합니다.": "The desire to create practical results and the need for independence are both strong.",
  "돈과 사람의 관계가 가까워질수록 기회도 커지지만, 경쟁이나 지출도 늘 수 있으므로 역할과 책임을 분명히 해야 합니다.": "As money and people become closely linked, opportunities can grow, but competition and spending can also grow, so roles and responsibilities need to be clear.",
  "거절, 마감, 우선순위를 분명히 하는 연습이 필요한 지점": "the area that needs practice with refusal, deadlines, and priorities",
  "비판과 경계가 강해져 기회를 좁히는 패턴": "a pattern where criticism and boundaries become too strong and narrow opportunities",
  "역할이 분명하고 불필요한 감정 소모가 적은 환경": "an environment with clear roles and little unnecessary emotional drain",
  "자율성과 결과물 공개가 가능한 환경": "an environment where autonomy and visible output are possible",
  "상대의 말과 행동을 충분히 관찰한 뒤 천천히 마음을 여는 방식": "opening up slowly after observing the other person's words and actions",
  "비판이 강한 사람": "strongly critical people",
  "통제하려는 사람": "controlling people",
  "보이는 결과물과 표현": "visible output and expression",
  "배우고 정리한 내용을 전문성으로 쌓아가는 방식": "building expertise from what you learn and organize",
  "필요한 역할을 조용히 맡아 신뢰를 쌓는 리더십": "leadership that quietly takes needed roles and builds trust",
  "실력에 비해 결과물을 늦게 보여주는 점": "showing output later than skill level would suggest",
  "작은 지출을 점검하지 않아 흐름을 놓치는 점": "missing the flow by not checking small expenses",
  "이 스트레스 신호로 나타나는 방식": "appearing as a stress signal"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.ja, {
  "책임 있는 역할": "責任ある役割",
  "공식적 신뢰": "公式な信頼",
  "커리어 기준 정리": "キャリア基準の整理",
  "책임 과부하": "責任の過負荷",
  "압박감": "圧迫感",
  "학습": "学習",
  "자격·전문성": "資格・専門性",
  "회복과 준비": "回復と準備",
  "준비만 길어지는 점": "準備だけが長くなる点",
  "고립": "孤立",
  "독립적인 결정": "独立した決定",
  "동료와의 협업 재정비": "仲間との協業の再整理",
  "자기 기준 확립": "自分の基準の確立",
  "주도권 다툼": "主導権争い",
  "혼자 다 하려는 태도": "一人ですべてやろうとする態度",
  "결과물 공개": "成果物の公開",
  "말·글·콘텐츠": "言葉・文章・コンテンツ",
  "아이디어 실행": "アイデアの実行",
  "말이 앞서고 정리가 늦어지는 점": "言葉が先に出て整理が遅れる点",
  "소진": "消耗",
  "맡을 책임과 거절할 책임을 구분하는 것": "引き受ける責任と断る責任を区別すること",
  "배운 것을 실제 행동으로 작게 옮기는 것": "学んだことを小さな実際の行動に移すこと",
  "혼자 버티는 힘을 협업 구조로 바꾸는 것": "一人で耐える力を協業構造に変えること",
  "작은 결과물을 꾸준히 밖으로 보여주는 것": "小さな成果物を継続して外に見せること",
  "정해진 틀에 무조건 맞추기보다 납득할 수 있는 자율성이 있을 때 더 잘 움직입니다.": "決められた枠に無条件で合わせるより、納得できる自律性があると動きやすいです。",
  "배움과 실행을 비교적 균형 있게 오갈 수 있습니다.": "学びと実行を比較的バランスよく行き来できます。",
  "자기 기준과 추진력이 강해 스스로 판을 만들려는 힘이 큽니다.": "自分の基準と推進力が強く、自分で場を作ろうとする力が大きいです。",
  "자기 기준과 외부 요구 사이에서 비교적 균형을 잡을 수 있습니다.": "自分の基準と外部要求の間で比較的バランスを取ることができます。",
  "현실적인 결과를 만들고 자원을 움직이는 감각이 강하게 나타날 수 있습니다.": "現実的な結果を作り、資源を動かす感覚が強く現れることがあります。",
  "혼자 밀어붙이기보다 좋은 사람, 안정적인 시스템, 명확한 역할의 도움을 받을 때 더 잘 움직입니다.": "一人で押し通すより、よい人、安定したシステム、明確な役割の助けがあると動きやすいです。",
  "현실적인 성과를 만들고 싶은 욕구와 독립성이 함께 강합니다.": "現実的な成果を作りたい欲求と独立性が共に強いです。",
  "돈과 사람의 관계가 가까워질수록 기회도 커지지만, 경쟁이나 지출도 늘 수 있으므로 역할과 책임을 분명히 해야 합니다.": "お金と人の関係が近づくほど機会も増えますが、競争や支出も増えやすいため、役割と責任を明確にする必要があります。",
  "거절, 마감, 우선순위를 분명히 하는 연습이 필요한 지점": "断ること、締切、優先順位を明確にする練習が必要な部分",
  "비판과 경계가 강해져 기회를 좁히는 패턴": "批判と境界が強くなり、機会を狭めるパターン",
  "역할이 분명하고 불필요한 감정 소모가 적은 환경": "役割が明確で不要な感情消耗が少ない環境",
  "자율성과 결과물 공개가 가능한 환경": "自律性と成果物の公開が可能な環境",
  "상대의 말과 행동을 충분히 관찰한 뒤 천천히 마음을 여는 방식": "相手の言葉と行動を十分に観察してからゆっくり心を開く方式",
  "비판이 강한 사람": "批判が強い人",
  "통제하려는 사람": "コントロールしようとする人",
  "보이는 결과물과 표현": "見える成果物と表現",
  "배우고 정리한 내용을 전문성으로 쌓아가는 방식": "学び整理した内容を専門性として積み上げる方式",
  "필요한 역할을 조용히 맡아 신뢰를 쌓는 리더십": "必要な役割を静かに引き受け、信頼を積むリーダーシップ",
  "실력에 비해 결과물을 늦게 보여주는 점": "実力に比べて成果物を見せるのが遅い点",
  "작은 지출을 점검하지 않아 흐름을 놓치는 점": "小さな支出を点検せず流れを逃す点",
  "이 스트레스 신호로 나타나는 방식": "がストレスサインとして現れる方式"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.zh, {
  "책임 있는 역할": "有责任的角色",
  "공식적 신뢰": "正式信任",
  "커리어 기준 정리": "整理职业标准",
  "책임 과부하": "责任过载",
  "압박감": "压力感",
  "학습": "学习",
  "자격·전문성": "资格与专业性",
  "회복과 준비": "恢复与准备",
  "준비만 길어지는 점": "准备时间过长",
  "고립": "孤立",
  "독립적인 결정": "独立决定",
  "동료와의 협업 재정비": "重新整理与同伴的协作",
  "자기 기준 확립": "建立自我标准",
  "주도권 다툼": "主导权争执",
  "혼자 다 하려는 태도": "想独自完成一切的态度",
  "결과물 공개": "公开成果",
  "말·글·콘텐츠": "语言、文字与内容",
  "아이디어 실행": "执行想法",
  "말이 앞서고 정리가 늦어지는 점": "话语先行而整理变慢",
  "소진": "耗竭",
  "맡을 책임과 거절할 책임을 구분하는 것": "区分该承担的责任与该拒绝的责任",
  "배운 것을 실제 행동으로 작게 옮기는 것": "把学到的内容转成小的实际行动",
  "혼자 버티는 힘을 협업 구조로 바꾸는 것": "把独自坚持的力量转为协作结构",
  "작은 결과물을 꾸준히 밖으로 보여주는 것": "持续向外展示小成果",
  "정해진 틀에 무조건 맞추기보다 납득할 수 있는 자율성이 있을 때 더 잘 움직입니다.": "比起无条件适应固定框架，有能理解和接受的自主性时会行动得更好。",
  "배움과 실행을 비교적 균형 있게 오갈 수 있습니다.": "学习与执行之间可以相对平衡地切换。",
  "자기 기준과 추진력이 강해 스스로 판을 만들려는 힘이 큽니다.": "自我标准和推动力较强，有自己开局面的力量。",
  "자기 기준과 외부 요구 사이에서 비교적 균형을 잡을 수 있습니다.": "能在自我标准与外部要求之间取得相对平衡。",
  "현실적인 결과를 만들고 자원을 움직이는 감각이 강하게 나타날 수 있습니다.": "创造现实成果并调动资源的感觉可能较强。",
  "혼자 밀어붙이기보다 좋은 사람, 안정적인 시스템, 명확한 역할의 도움을 받을 때 더 잘 움직입니다.": "比起独自硬推，有好的人、稳定系统和明确角色帮助时行动更顺。",
  "현실적인 성과를 만들고 싶은 욕구와 독립성이 함께 강합니다.": "想创造现实成果的欲望与独立性都较强。",
  "돈과 사람의 관계가 가까워질수록 기회도 커지지만, 경쟁이나 지출도 늘 수 있으므로 역할과 책임을 분명히 해야 합니다.": "金钱与人的关系越近，机会会变大，但竞争或支出也可能增加，因此需要明确角色与责任。",
  "거절, 마감, 우선순위를 분명히 하는 연습이 필요한 지점": "需要练习拒绝、截止期限和优先级的部分",
  "비판과 경계가 강해져 기회를 좁히는 패턴": "批判与边界变强而缩小机会的模式",
  "역할이 분명하고 불필요한 감정 소모가 적은 환경": "角色明确且不必要情绪消耗少的环境",
  "자율성과 결과물 공개가 가능한 환경": "可以拥有自主性并公开成果的环境",
  "상대의 말과 행동을 충분히 관찰한 뒤 천천히 마음을 여는 방식": "充分观察对方言行后慢慢敞开心的方式",
  "비판이 강한 사람": "批判性强的人",
  "통제하려는 사람": "想控制的人",
  "보이는 결과물과 표현": "可见成果与表达",
  "배우고 정리한 내용을 전문성으로 쌓아가는 방식": "把学习和整理的内容积累为专业性的方式",
  "필요한 역할을 조용히 맡아 신뢰를 쌓는 리더십": "安静承担必要角色并积累信任的领导方式",
  "실력에 비해 결과물을 늦게 보여주는 점": "成果展示晚于实力水平",
  "작은 지출을 점검하지 않아 흐름을 놓치는 점": "不检查小支出而错过流动",
  "이 스트레스 신호로 나타나는 방식": "作为压力信号表现出来的方式"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.en, {
  "책임 범위 정리": "clarifying the scope of responsibility",
  "작은 지출 기록": "recording small expenses",
  "학습을 결과로 전환": "turning learning into results",
  "결과로 전환": "turning it into results",
  "자존심보다 역할 조율": "role coordination over pride",
  "사람과 돈의 경계 세우기": "setting boundaries between people and money",
  "책임을 과하게 떠넘기는 사람": "people who pass on too much responsibility",
  "변화를 지나치게 막는 사람": "people who block change excessively",
  "결정을 끝없이 미루는 사람": "people who endlessly postpone decisions",
  "속마음을 숨기는 사람": "people who hide their inner thoughts",
  "혼자 책임을 많이 떠안아 움직임이 무거워지는 패턴": "a pattern of taking on too much responsibility alone and becoming heavy",
  "생각이 길어져 실행이 늦어지는 패턴": "a pattern where long thinking delays action",
  "쉽게 의존하기보다 동등한 거리에서 신뢰를 쌓는 방식": "building trust from an equal distance rather than depending easily",
  "동등한 파트너십에서는 강하지만, 권한이 애매하면 주도권을 잡으려는 방식": "being strong in equal partnerships but trying to take the lead when authority is unclear",
  "기준과 경계를 존중하는 사람": "people who respect standards and boundaries",
  "약속이 분명한 사람": "people with clear commitments",
  "아이디어와 방향을 보여주며 사람을 움직이는 리더십": "leadership that moves people by showing ideas and direction",
  "직접 앞에서 버티고 행동으로 설득하는 리더십": "leadership that endures in front and persuades through action",
  "아이디어를 말, 글, 제품, 콘텐츠 같은 결과물로 바꾸는 방식": "turning ideas into output such as speech, writing, products, or content",
  "전문성, 지식, 자격, 꾸준한 학습이 신뢰로 바뀌는 과정": "expertise, knowledge, credentials, and steady learning turning into trust",
  "꾸준한 수입, 신뢰 기반의 일, 안정적인 관리": "steady income, trust-based work, and stable management",
  "정기적인 수입과 지출 관리, 반복 가능한 축적": "regular income, expense management, and repeatable accumulation",
  "기준 없이 반복되는 작은 지출": "small recurring expenses without clear standards",
  "사람 관계에서 돈의 경계가 흐려지는 점": "money boundaries becoming blurred in relationships",
  "마음이 움직이면 말이나 행동으로 표현하려는 편": "expressing feelings through words or actions when the heart moves",
  "상대의 반응을 보며 속도를 맞추는 편": "matching pace while watching the other person's response",
  "책임을 오래 들고 있다가 몸과 마음이 무거워지는 방식": "carrying responsibility too long until body and mind feel heavy",
  "움직임과 회복을 번갈아 쓸 때 안정되는 흐름": "a flow that stabilizes when movement and recovery alternate",
  "빠른 결정 뒤에는 반드시 점검 시간을 두기": "always leaving time to review after fast decisions",
  "작은 결과물을 정기적으로 공개하기": "sharing small outputs regularly",
  "배운 것을 한 문장으로 정리하고 바로 적용하기": "summarizing what was learned in one sentence and applying it immediately",
  "준비가 끝나야 시작할 수 있다고 느끼는 습관": "feeling that you can start only after preparation is complete",
  "을 중심으로 자기 주도성을 살리는 방식": "a self-directed work style centered on this strength"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.ja, {
  "책임 범위 정리": "責任範囲の整理",
  "작은 지출 기록": "小さな支出の記録",
  "학습을 결과로 전환": "学習を成果へ転換すること",
  "결과로 전환": "成果へ転換すること",
  "자존심보다 역할 조율": "自尊心より役割調整",
  "사람과 돈의 경계 세우기": "人とお金の境界を立てること",
  "책임을 과하게 떠넘기는 사람": "責任を過度に押しつける人",
  "변화를 지나치게 막는 사람": "変化を過度に止める人",
  "결정을 끝없이 미루는 사람": "決定をいつまでも先延ばしにする人",
  "속마음을 숨기는 사람": "本音を隠す人",
  "혼자 책임을 많이 떠안아 움직임이 무거워지는 패턴": "一人で責任を多く抱え込み、動きが重くなるパターン",
  "생각이 길어져 실행이 늦어지는 패턴": "考えが長くなり実行が遅れるパターン",
  "쉽게 의존하기보다 동등한 거리에서 신뢰를 쌓는 방식": "簡単に依存するより、対等な距離で信頼を築く方式",
  "동등한 파트너십에서는 강하지만, 권한이 애매하면 주도권을 잡으려는 방식": "対等なパートナーシップでは強い一方、権限が曖昧だと主導権を握ろうとする方式",
  "기준과 경계를 존중하는 사람": "基準と境界を尊重する人",
  "약속이 분명한 사람": "約束が明確な人",
  "아이디어와 방향을 보여주며 사람을 움직이는 리더십": "アイデアと方向を示して人を動かすリーダーシップ",
  "직접 앞에서 버티고 행동으로 설득하는 리더십": "前に立って耐え、行動で説得するリーダーシップ",
  "아이디어를 말, 글, 제품, 콘텐츠 같은 결과물로 바꾸는 방식": "アイデアを言葉、文章、製品、コンテンツのような成果物に変える方式",
  "전문성, 지식, 자격, 꾸준한 학습이 신뢰로 바뀌는 과정": "専門性、知識、資格、継続的な学習が信頼に変わる過程",
  "꾸준한 수입, 신뢰 기반의 일, 안정적인 관리": "安定した収入、信頼基盤の仕事、安定した管理",
  "정기적인 수입과 지출 관리, 반복 가능한 축적": "定期的な収入と支出管理、反復可能な蓄積",
  "기준 없이 반복되는 작은 지출": "基準なく繰り返される小さな支出",
  "사람 관계에서 돈의 경계가 흐려지는 점": "人間関係でお金の境界が曖昧になる点",
  "마음이 움직이면 말이나 행동으로 표현하려는 편": "気持ちが動くと、言葉や行動で表現しようとする傾向",
  "상대의 반응을 보며 속도를 맞추는 편": "相手の反応を見ながら速度を合わせる傾向",
  "책임을 오래 들고 있다가 몸과 마음이 무거워지는 방식": "責任を長く抱え込み、体と心が重くなる方式",
  "움직임과 회복을 번갈아 쓸 때 안정되는 흐름": "動きと回復を交互に使うと安定する流れ",
  "빠른 결정 뒤에는 반드시 점검 시간을 두기": "速い決定の後には必ず点検時間を置くこと",
  "작은 결과물을 정기적으로 공개하기": "小さな成果物を定期的に公開すること",
  "배운 것을 한 문장으로 정리하고 바로 적용하기": "学んだことを一文で整理してすぐ適用すること",
  "준비가 끝나야 시작할 수 있다고 느끼는 습관": "準備が終わらないと始められないと感じる習慣",
  "을 중심으로 자기 주도성을 살리는 방식": "を中心に自己主導性を活かす方式"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.zh, {
  "책임 범위 정리": "整理责任范围",
  "작은 지출 기록": "记录小支出",
  "학습을 결과로 전환": "把学习转化为成果",
  "결과로 전환": "转化为成果",
  "자존심보다 역할 조율": "比起自尊心，更重视角色协调",
  "사람과 돈의 경계 세우기": "建立人与金钱的边界",
  "책임을 과하게 떠넘기는 사람": "过度推卸责任的人",
  "변화를 지나치게 막는 사람": "过度阻止变化的人",
  "결정을 끝없이 미루는 사람": "不断拖延决定的人",
  "속마음을 숨기는 사람": "隐藏内心想法的人",
  "혼자 책임을 많이 떠안아 움직임이 무거워지는 패턴": "独自承担过多责任，导致行动变沉重的模式",
  "생각이 길어져 실행이 늦어지는 패턴": "思考过长而导致执行变慢的模式",
  "쉽게 의존하기보다 동등한 거리에서 신뢰를 쌓는 방식": "比起轻易依赖，更以平等距离建立信任的方式",
  "동등한 파트너십에서는 강하지만, 권한이 애매하면 주도권을 잡으려는 방식": "在平等伙伴关系中较强，但权责模糊时容易想掌握主导权的方式",
  "기준과 경계를 존중하는 사람": "尊重标准和边界的人",
  "약속이 분명한 사람": "承诺明确的人",
  "아이디어와 방향을 보여주며 사람을 움직이는 리더십": "通过展示想法和方向带动他人的领导方式",
  "직접 앞에서 버티고 행동으로 설득하는 리더십": "亲自在前方坚持并用行动说服的领导方式",
  "아이디어를 말, 글, 제품, 콘텐츠 같은 결과물로 바꾸는 방식": "把想法转化为语言、文字、产品、内容等成果的方式",
  "전문성, 지식, 자격, 꾸준한 학습이 신뢰로 바뀌는 과정": "专业性、知识、资格和持续学习转化为信任的过程",
  "꾸준한 수입, 신뢰 기반의 일, 안정적인 관리": "稳定收入、基于信任的工作和稳定管理",
  "정기적인 수입과 지출 관리, 반복 가능한 축적": "定期收入与支出管理、可重复积累",
  "기준 없이 반복되는 작은 지출": "没有标准地重复小额支出",
  "사람 관계에서 돈의 경계가 흐려지는 점": "人际关系中金钱边界变模糊",
  "마음이 움직이면 말이나 행동으로 표현하려는 편": "心意被触动时倾向于用语言或行动表达",
  "상대의 반응을 보며 속도를 맞추는 편": "观察对方反应并调整速度的倾向",
  "책임을 오래 들고 있다가 몸과 마음이 무거워지는 방식": "长期承担责任后身心变沉重的方式",
  "움직임과 회복을 번갈아 쓸 때 안정되는 흐름": "行动与恢复交替使用时会稳定的流动",
  "빠른 결정 뒤에는 반드시 점검 시간을 두기": "快速决定后一定留下检查时间",
  "작은 결과물을 정기적으로 공개하기": "定期公开小成果",
  "배운 것을 한 문장으로 정리하고 바로 적용하기": "把学到的内容整理成一句话并立即应用",
  "준비가 끝나야 시작할 수 있다고 느끼는 습관": "觉得准备结束后才能开始的习惯",
  "을 중심으로 자기 주도성을 살리는 방식": "以此为中心发挥自主性的方式"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.ja, {
  "짧게 강하게 쓰는 힘은 좋지만, 회복 시간을 놓치면 급격히 피로해질 수 있는 흐름": "短く強く使う力はありますが、回復時間を逃すと急に疲れやすい流れ",
  "관계 안에서 역할이나 거리감이 바뀌는 압력이 생길 때 갈등이 커질 수 있습니다.": "関係の中で役割や距離感が変わる圧力が生じると、葛藤が大きくなることがあります。",
  "경계와 긴장이 오래 유지되면 몸이 딱딱하게 굳는 느낌을 받을 수 있는 편": "境界と緊張が長く続くと、身体が硬く固まる感覚を持ちやすい傾向",
  "서로의 자존심과 주도권이 부딪힐 때 관계 피로가 커질 수 있습니다.": "互いの自尊心と主導権がぶつかると、関係疲れが大きくなることがあります。",
  "자존심 때문에 도움을 미루는 습관": "自尊心のために助けを求めるのを遅らせる習慣",
  "정리되지 않은 말을 급하게 꺼내는 습관": "整理されていない言葉を急いで出す習慣",
  "사람과 돈이 가까워질 때 생기는 경쟁, 체면, 공동 지출": "人とお金が近づくときに生じる競争、体面、共同支出",
  "고정비와 반복 지출을 월 1회 점검하기": "固定費と反復支出を月1回点検すること"
});

Object.assign(REPORT_ADDITIONAL_REPLACEMENTS.zh, {
  "짧게 강하게 쓰는 힘은 좋지만, 회복 시간을 놓치면 급격히 피로해질 수 있는 흐름": "短时间强力使用能量的能力不错，但错过恢复时间时容易迅速疲惫的流动",
  "관계 안에서 역할이나 거리감이 바뀌는 압력이 생길 때 갈등이 커질 수 있습니다.": "当关系中的角色或距离感出现变化压力时，冲突可能变大。",
  "경계와 긴장이 오래 유지되면 몸이 딱딱하게 굳는 느낌을 받을 수 있는 편": "边界与紧张长期维持时，容易感到身体僵硬的倾向",
  "서로의 자존심과 주도권이 부딪힐 때 관계 피로가 커질 수 있습니다.": "彼此自尊心和主导权碰撞时，关系疲劳可能变大。",
  "자존심 때문에 도움을 미루는 습관": "因为自尊心而推迟求助的习惯",
  "정리되지 않은 말을 급하게 꺼내는 습관": "急着说出尚未整理好的话的习惯",
  "사람과 돈이 가까워질 때 생기는 경쟁, 체면, 공동 지출": "人与金钱靠近时产生的竞争、面子和共同支出",
  "고정비와 반복 지출을 월 1회 점검하기": "每月检查一次固定费用和重复支出"
});

function scoreTenGods(result) {
  const scores = Object.fromEntries(TEN_GOD_KEYS.map((key) => [key, 0]));
  const dayStemIndex = result.pillars.day.stemIndex;

  Object.entries(result.pillars).forEach(([position, pillar]) => {
    const positionWeight = position === "month" ? 1.2 : 1;
    addTenGodScore(scores, determineTenGod(dayStemIndex, pillar.stemIndex), 1 * positionWeight);

    const branchStemIndex = stemIndexForElementYinYang(pillar.branch.element, pillar.branch.yinYang);
    addTenGodScore(scores, determineTenGod(dayStemIndex, branchStemIndex), 1 * positionWeight);

    (result.hiddenStems[position] || []).forEach((stem, index) => {
      addTenGodScore(scores, determineTenGod(dayStemIndex, stem.index), (HIDDEN_STEM_WEIGHTS[index] || 0.1) * positionWeight);
    });
  });

  return roundScores(scores);
}

function addTenGodScore(scores, god, weight) {
  if (god === "self") return;
  if (!scores[god]) scores[god] = 0;
  scores[god] += weight;
}

function scoreTenGodGroups(scores) {
  return Object.fromEntries(
    Object.entries(TEN_GOD_GROUPS).map(([group, keys]) => {
      const score = keys.reduce((sum, key) => sum + (scores[key] || 0), 0);
      return [group, { score: Number(score.toFixed(2)), level: classifyScore(score) }];
    })
  );
}

function classifyScore(score) {
  if (score >= 4.2) return "excessive";
  if (score >= 2.8) return "high";
  if (score >= 1.2) return "medium";
  return "low";
}

function stemIndexForElementYinYang(element, yinYang) {
  return HEAVENLY_STEMS.find((stem) => stem.element === element && stem.yinYang === yinYang)?.index || 0;
}

function buildSeasonalStrength(result, analysis) {
  const monthBranch = result.pillars.month.branch;
  const seasonalElement = analysis.seasonalElement || monthBranch.element;
  return {
    monthBranch: monthBranch.key,
    season: monthBranch.season,
    seasonalElement,
    supportsDayMaster: seasonalElement === result.pillars.day.stem.element || generates(seasonalElement) === result.pillars.day.stem.element,
    plainLanguage: `${monthBranch.han}${monthBranch.ko} 월지는 ${ELEMENT_BEHAVIOR[seasonalElement].noun} 쪽에 계절감을 실어 줍니다.`
  };
}

function estimateDayMasterStrength(dayElement, elementScores, seasonalStrength) {
  const same = elementScores[dayElement] || 0;
  const resource = elementScores[resourceElement(dayElement)] || 0;
  const expression = elementScores[generates(dayElement)] || 0;
  const wealth = elementScores[controls(dayElement)] || 0;
  const authority = elementScores[controlledBy(dayElement)] || 0;
  const seasonalBonus = seasonalStrength.seasonalElement === dayElement ? 1.2 : resourceElement(dayElement) === seasonalStrength.seasonalElement ? 0.8 : 0;
  const score = same + resource * 0.8 + seasonalBonus - expression * 0.55 - wealth * 0.45 - authority * 0.75;

  let level = "balanced";
  if (score <= -2) level = "weak";
  else if (score <= -0.8) level = "moderatelyWeak";
  else if (score >= 2) level = "strong";
  else if (score >= 0.8) level = "moderatelyStrong";

  return { level, score: Number(score.toFixed(2)) };
}

function dayMasterPlain(stem, strengthLevel) {
  const base = `${ELEMENT_BEHAVIOR[stem.element].noun}을 중심으로 자신을 세우는 사람입니다.`;
  const strength = {
    weak: "다만 주변 요구나 현실 압력에 에너지가 쉽게 흩어질 수 있어, 회복과 기준 설정이 중요합니다.",
    moderatelyWeak: "자기 기준은 있지만 환경의 영향을 크게 받기 쉬워, 안정적인 루틴과 지지가 필요합니다.",
    balanced: "자기 기준과 외부 요구 사이에서 비교적 균형을 잡을 수 있습니다.",
    moderatelyStrong: "자기 기준이 분명하고 버티는 힘이 있는 편입니다.",
    strong: "자기 기준과 추진력이 강해 스스로 판을 만들려는 힘이 큽니다."
  };
  return `${base} ${strength[strengthLevel] || strength.balanced}`;
}

function buildPillarProfile(saju) {
  return {
    year: {
      theme: "초기 배경과 바깥 이미지",
      plainLanguage: "어린 시절의 분위기, 가족적 배경, 남들이 처음 보는 인상을 설명하는 축입니다.",
      trace: ["yearPillar"]
    },
    month: {
      theme: "성장 환경과 사회적 역할",
      plainLanguage: "일, 사회성, 책임감, 커리어 기반을 가장 강하게 설명하는 축입니다.",
      trace: ["monthPillar", "seasonalStrength"]
    },
    day: {
      theme: "나 자신과 가까운 관계",
      plainLanguage: "핵심 정체성과 배우자·장기 관계의 리듬을 설명하는 축입니다.",
      trace: ["dayPillar", "dayBranch"]
    },
    hour: {
      theme: "내면 방향과 미래 지향",
      plainLanguage: "속으로 원하는 방향, 장기 목표, 말년의 관심사를 설명하는 축입니다.",
      trace: ["hourPillar"]
    }
  };
}

function buildHiddenMotivesProfile(saju) {
  const visibleTraits = saju.fiveElements.strongest.map((element) => ELEMENT_BEHAVIOR[element].strength);
  const hiddenCounts = {};
  Object.values(saju.hiddenStems).flat().forEach((stem) => {
    hiddenCounts[stem.element] = (hiddenCounts[stem.element] || 0) + 1;
  });
  const hiddenTraits = rankCounts(hiddenCounts).slice(0, 2).map(([element]) => ELEMENT_BEHAVIOR[element]?.strength).filter(Boolean);
  const tensions = [
    hiddenTraits.length
      ? `겉으로는 ${visibleTraits[0]}이 먼저 보이지만, 안쪽에서는 ${hiddenTraits[0]}도 함께 작동할 수 있습니다.`
      : "겉으로 보이는 성향과 내면의 동기가 비교적 비슷하게 움직일 수 있습니다."
  ];
  return { visibleTraits, hiddenTraits, tensions, trace: ["hiddenStems", "visibleElements"] };
}

function buildLifePhaseProfile(saju) {
  const birthYear = saju.currentYearFlow.year - saju.currentYearFlow.currentAge;
  const phases = [
    { key: "early", label: "초년운", start: 0, end: 24 },
    { key: "middle", label: "중년운", start: 25, end: 54 },
    { key: "later", label: "말년운", start: 55, end: null }
  ];
  const strong = saju.fiveElements.strongest[0] || "earth";
  const weak = saju.fiveElements.weakest[0] || "water";
  const groupRank = rankGroup(saju.tenGodGroups);

  return Object.fromEntries(phases.map((phase) => {
    const lucks = saju.luckPillars.filter((luck) => luck.endAge >= phase.start && (phase.end === null || luck.startAge <= phase.end));
    const ageRange = phase.end === null ? `${phase.start}세 이후` : `${phase.start}세~${phase.end}세`;
    const yearRange = phase.end === null ? `${birthYear + phase.start}년 이후` : `${birthYear + phase.start}년~${birthYear + phase.end}년`;
    const mainLuck = lucks[0];
    const mainTheme = phaseTheme(phase.key, strong, weak, groupRank[0][0], mainLuck);
    return [phase.key, {
      title: phase.label,
      ageRange,
      yearRange,
      luckPillars: lucks,
      theme: mainTheme,
      paragraphs: withTrace([
        `${phase.label}(${ageRange} / ${yearRange})은 ${mainTheme}로 볼 수 있습니다. ${mainLuck ? `${mainLuck.han}${mainLuck.ko} 대운이 이 구간의 배경으로 일부 작동합니다.` : "대운 범위가 완전히 겹치지 않아 일반 생애 단계로 참고하는 편이 안전합니다."}`,
        `가족과 관계에서는 ${relationshipPhaseText(phase.key, saju)} 경향이 나타날 수 있습니다. 이 흐름은 좋고 나쁨보다, 어떤 방식으로 사람과 안정감을 만드는지를 보여줍니다.`,
        `공부와 일에서는 ${workPhaseText(phase.key, strong, groupRank[0][0])} 쪽이 중요합니다. 기회는 ${ELEMENT_BEHAVIOR[strong].strength}에서 오기 쉽지만, ${ELEMENT_BEHAVIOR[weak].lack}을 놓치면 흐름이 끊길 수 있습니다.`,
        `재물과 기회는 ${moneyPhaseText(phase.key, saju)}로 읽힙니다. 주의할 점은 ${ELEMENT_BEHAVIOR[weak].excess || ELEMENT_BEHAVIOR[weak].lack}이 아니라, 부족한 리듬을 보완하지 않은 채 속도만 높이는 것입니다.`,
        `이 시기의 조언은 ${ELEMENT_BEHAVIOR[weak].habit}입니다. 이것이 반복되면 운의 흐름을 기다리는 것이 아니라, 흐름을 받아낼 그릇을 만드는 쪽에 가까워집니다.`
      ], ["luckPillars", "lifePhase", "tenGodGroups", "elementBalance"])
    }];
  }));
}

function buildCurrentFlowProfile(saju) {
  const currentYear = saju.currentYearFlow.year;
  const currentAge = saju.currentYearFlow.currentAge;
  const annualGroup = saju.currentYearFlow.activatedGroup;
  const annualGroupLevel = saju.tenGodGroups[annualGroup]?.level || "medium";
  const luck = saju.currentLuckContext.current;
  const phase = currentPhaseName(saju, annualGroup, annualGroupLevel);
  const opportunities = currentOpportunities(saju, annualGroup);
  const cautions = currentCautions(saju, annualGroup);

  return {
    currentYear,
    currentAge,
    luckPillar: luck ? { ...luck, label: `${luck.startAge}-${luck.endAge}세 ${luck.han}${luck.ko}` } : null,
    annualFlow: {
      ...saju.currentYearFlow,
      label: `${saju.currentYearFlow.pillar.han}${saju.currentYearFlow.pillar.ko}`,
      groupPlain: groupPlain(annualGroup, saju.tenGodGroups[annualGroup]?.level || "medium")
    },
    theme: phase,
    opportunities,
    cautions,
    advice: currentAdvice(saju, annualGroup),
    priorities: {
      relationship: relationshipPriority(saju, annualGroup),
      work: workPriority(saju, annualGroup),
      money: moneyPriority(saju, annualGroup)
    },
    trace: ["currentYearFlow", "currentLuckPillar", "annualTenGod"]
  };
}

function buildCurrentYearFlow(result, now) {
  const offset = result.input?.timezoneOffsetMinutes ?? 540;
  const currentLocal = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: 12,
    minute: 0
  };
  const pillar = getYearPillar(currentLocal, offset);
  const annualTenGod = determineTenGod(result.pillars.day.stemIndex, pillar.stemIndex);
  const activatedGroup = TEN_GOD_TO_GROUP[annualTenGod] || "peer";
  const annualRelations = analyzeAnnualRelations(result.pillars, pillar.branchIndex);
  return {
    year: pillar.sajuYear,
    currentAge: Math.max(0, pillar.sajuYear - Number(result.input?.birthDate?.year || pillar.sajuYear)),
    pillar,
    annualTenGod,
    activatedGroup,
    relations: annualRelations,
    usesIpchunBoundary: true
  };
}

function getCurrentLuckContext(luckPillars, currentAge, birthYear) {
  const pillars = luckPillars?.pillars || [];
  const current = pillars.find((pillar) => currentAge >= pillar.startAge && currentAge <= pillar.endAge) || null;
  return {
    current,
    currentAge,
    calendarRange: current ? `${birthYear + current.startAge}년~${birthYear + current.endAge}년` : "",
    available: Boolean(current)
  };
}

function analyzeBranchRelations(pillars) {
  const entries = Object.entries(pillars).map(([position, pillar]) => ({ position, branchIndex: pillar.branchIndex, branch: pillar.branch }));
  return {
    combinations: findPairs(entries, BRANCH_COMBINATIONS, "combination"),
    clashes: findPairs(entries, BRANCH_CLASHES, "clash"),
    punishments: findPunishments(entries),
    breaks: findPairs(entries, BRANCH_BREAKS, "break"),
    harms: findPairs(entries, BRANCH_HARMS, "harm")
  };
}

function analyzeAnnualRelations(pillars, annualBranchIndex) {
  const annual = { position: "annual", branchIndex: annualBranchIndex, branch: getBranch(annualBranchIndex) };
  const entries = Object.entries(pillars).map(([position, pillar]) => ({ position, branchIndex: pillar.branchIndex, branch: pillar.branch }));
  return {
    combinations: entries.filter((entry) => hasPair(entry.branchIndex, annualBranchIndex, BRANCH_COMBINATIONS)).map((entry) => relationRecord(entry, annual, "combination")),
    clashes: entries.filter((entry) => hasPair(entry.branchIndex, annualBranchIndex, BRANCH_CLASHES)).map((entry) => relationRecord(entry, annual, "clash")),
    harms: entries.filter((entry) => hasPair(entry.branchIndex, annualBranchIndex, BRANCH_HARMS)).map((entry) => relationRecord(entry, annual, "harm")),
    breaks: entries.filter((entry) => hasPair(entry.branchIndex, annualBranchIndex, BRANCH_BREAKS)).map((entry) => relationRecord(entry, annual, "break"))
  };
}

function findPairs(entries, pairDefs, type) {
  const found = [];
  for (let index = 0; index < entries.length; index += 1) {
    for (let next = index + 1; next < entries.length; next += 1) {
      if (hasPair(entries[index].branchIndex, entries[next].branchIndex, pairDefs)) {
        found.push(relationRecord(entries[index], entries[next], type));
      }
    }
  }
  return found;
}

function findPunishments(entries) {
  const indexes = entries.map((entry) => entry.branchIndex);
  return BRANCH_PUNISHMENTS.filter((set) => {
    if (set.length === 2 && set[0] === set[1]) return indexes.filter((index) => index === set[0]).length >= 2;
    return set.every((index) => indexes.includes(index));
  }).map((set) => ({
    type: "punishment",
    branches: set.map((index) => getBranch(index)),
    plainLanguage: "반복되는 불편함이나 내부 압력이 생기기 쉬운 구조입니다."
  }));
}

function hasPair(a, b, pairDefs) {
  return pairDefs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function relationRecord(a, b, type) {
  const plain = {
    combination: "서로 끌리고 섞이려는 흐름입니다. 협력과 몰입으로 쓰기 좋습니다.",
    clash: "변화와 이동의 압력이 생기기 쉬운 구조입니다. 방향 전환의 신호로 쓰는 편이 좋습니다.",
    harm: "겉으로 크지 않아도 반복되는 불편함이 쌓일 수 있습니다.",
    break: "익숙한 구조가 끊기거나 다시 조정되는 흐름으로 나타날 수 있습니다."
  };
  return {
    type,
    positions: [a.position, b.position],
    branches: [a.branch, b.branch],
    plainLanguage: plain[type]
  };
}

function normalizePillars(pillars) {
  return Object.fromEntries(
    Object.entries(pillars).map(([key, pillar]) => [
      key,
      {
        stem: pillar.stem,
        branch: pillar.branch
      }
    ])
  );
}

function relationshipTrustStyle(saju) {
  const peer = saju.tenGodGroups.peer.level;
  const resource = saju.tenGodGroups.resource.level;
  if (peer === "high" || peer === "excessive") return "쉽게 의존하기보다 동등한 거리에서 신뢰를 쌓는 방식";
  if (resource === "high" || resource === "excessive") return "상대의 말과 행동을 충분히 관찰한 뒤 천천히 마음을 여는 방식";
  return "편안한 반복과 작은 약속을 통해 신뢰를 확인하는 방식";
}

function relationshipConflictPattern(saju) {
  if (saju.combinationsAndClashes.clashes.length) return "관계 안에서 역할이나 거리감이 바뀌는 압력이 생길 때 갈등이 커질 수 있습니다.";
  if (saju.tenGodGroups.peer.level === "excessive") return "서로의 자존심과 주도권이 부딪힐 때 관계 피로가 커질 수 있습니다.";
  return "말하지 않은 기대가 쌓일 때 오해가 생길 수 있습니다.";
}

function loveStyle(saju) {
  const expression = saju.tenGodGroups.expression.level;
  const yinYang = saju.yinYang.balanceLevel;
  if (expression === "high" || expression === "excessive") return "마음이 움직이면 말이나 행동으로 표현하려는 편";
  if (yinYang === "yin") return "마음을 충분히 정리한 뒤 조심스럽게 표현하는 편";
  return "상대의 반응을 보며 속도를 맞추는 편";
}

function partnerTraits(element, mode) {
  const supportive = {
    wood: ["성장을 응원하는 사람", "장기 목표를 함께 세우는 사람"],
    fire: ["표현을 편하게 해주는 사람", "따뜻하게 반응하는 사람"],
    earth: ["생활 리듬이 안정적인 사람", "책임을 나눌 줄 아는 사람"],
    metal: ["기준과 경계를 존중하는 사람", "약속이 분명한 사람"],
    water: ["생각을 들어주는 사람", "휴식과 여백을 존중하는 사람"]
  };
  const caution = {
    wood: ["방향을 계속 바꾸는 사람", "말만 앞서고 마무리가 약한 사람"],
    fire: ["감정 반응이 너무 빠른 사람", "관심을 계속 요구하는 사람"],
    earth: ["책임을 과하게 떠넘기는 사람", "변화를 지나치게 막는 사람"],
    metal: ["비판이 강한 사람", "통제하려는 사람"],
    water: ["결정을 끝없이 미루는 사람", "속마음을 숨기는 사람"]
  };
  return (mode === "supportive" ? supportive : caution)[element] || supportive.earth;
}

function workStyle(saju, strong, group) {
  if (group === "authority") return "책임 범위와 기준이 분명한 역할에서 신뢰를 쌓는 방식";
  if (group === "expression") return "아이디어를 말, 글, 제품, 콘텐츠 같은 결과물로 바꾸는 방식";
  if (group === "resource") return "배우고 정리한 내용을 전문성으로 쌓아가는 방식";
  if (group === "wealth") return "현실적인 목표와 성과 지표를 보며 자원을 움직이는 방식";
  return `${ELEMENT_BEHAVIOR[strong].strength}을 중심으로 자기 주도성을 살리는 방식`;
}

function suitableEnvironment(saju) {
  const authority = saju.tenGodGroups.authority.level;
  const expression = saju.tenGodGroups.expression.level;
  if ((authority === "high" || authority === "excessive") && (expression === "high" || expression === "excessive")) {
    return "기준은 분명하지만 표현의 자유도도 있는 환경";
  }
  if (authority === "high" || authority === "excessive") return "역할, 책임, 평가 기준이 명확한 환경";
  if (expression === "high" || expression === "excessive") return "자율성과 결과물 공개가 가능한 환경";
  if (saju.tenGodGroups.resource.level === "high") return "학습과 전문성이 존중되는 환경";
  return "역할이 분명하고 불필요한 감정 소모가 적은 환경";
}

function roleStrengths(saju, group, strong) {
  const byGroup = {
    peer: "독립적으로 책임지고 끝까지 버티는 역할",
    expression: "기획, 콘텐츠, 설명, 생산처럼 보이는 결과를 만드는 역할",
    wealth: "운영, 영업, 사업, 관리처럼 자원과 결과를 연결하는 역할",
    authority: "관리, 조율, 규정, 품질처럼 기준과 책임을 다루는 역할",
    resource: "교육, 연구, 분석, 문서화처럼 지식과 회복력을 쌓는 역할"
  };
  return byGroup[group] || `${ELEMENT_BEHAVIOR[strong].noun}을 살리는 역할`;
}

function collaborationStyle(saju) {
  if (saju.tenGodGroups.peer.level === "high" || saju.tenGodGroups.peer.level === "excessive") {
    return "동등한 파트너십에서는 강하지만, 권한이 애매하면 주도권을 잡으려는 방식";
  }
  if (saju.tenGodGroups.resource.level === "high") return "충분히 이해하고 준비한 뒤 안정적으로 기여하는 방식";
  return "역할이 분명할 때 편하게 협력하는 방식";
}

function leadershipStyle(saju) {
  if (saju.tenGodGroups.authority.level === "high") return "기준과 책임을 세워 안정감을 주는 리더십";
  if (saju.tenGodGroups.expression.level === "high") return "아이디어와 방향을 보여주며 사람을 움직이는 리더십";
  if (saju.tenGodGroups.peer.level === "high") return "직접 앞에서 버티고 행동으로 설득하는 리더십";
  return "필요한 역할을 조용히 맡아 신뢰를 쌓는 리더십";
}

function workRisks(saju, strongGroup, weakGroup) {
  const risks = [];
  if (strongGroup === "expression" && saju.tenGodGroups.authority.level === "low") risks.push("자유롭게 말하고 싶은 마음과 조직 절차가 부딪히는 점");
  if (strongGroup === "resource" && saju.tenGodGroups.expression.level === "low") risks.push("실력에 비해 결과물을 늦게 보여주는 점");
  if (strongGroup === "authority" && weakGroup === "resource") risks.push("책임을 많이 맡고 회복 시간을 줄이는 점");
  if (!risks.length) risks.push("익숙한 방식만 반복해 변화 신호를 늦게 알아차리는 점");
  return risks;
}

function moneyComesFrom(saju, directWealth, indirectWealth, strongestGroup) {
  if (indirectWealth > directWealth + 0.5) return "넓은 기회, 거래, 네트워크, 새로운 판을 움직이는 과정";
  if (directWealth >= indirectWealth && directWealth >= 1.2) return "꾸준한 수입, 신뢰 기반의 일, 안정적인 관리";
  if (strongestGroup === "expression") return "결과물, 콘텐츠, 설명력, 생산성을 통해 가치가 보이는 과정";
  if (strongestGroup === "resource") return "전문성, 지식, 자격, 꾸준한 학습이 신뢰로 바뀌는 과정";
  return "맡은 역할을 꾸준히 수행하며 신뢰를 쌓는 과정";
}

function moneyLeaksFrom(saju) {
  if (saju.tenGodGroups.peer.level === "high" && saju.tenGodGroups.wealth.level === "high") {
    return "사람과 돈이 가까워질 때 생기는 경쟁, 체면, 공동 지출";
  }
  if (saju.tenGods.indirectWealth > saju.tenGods.directWealth + 0.5) return "좋아 보이는 기회를 빠르게 잡으려는 마음";
  if (saju.tenGodGroups.expression.level === "excessive") return "기분, 표현, 즉흥적인 선택";
  return "기준 없이 반복되는 작은 지출";
}

function accumulationStyle(saju, directWealth, indirectWealth) {
  if (directWealth >= indirectWealth) return "정기적인 수입과 지출 관리, 반복 가능한 축적";
  return "기회 탐색과 네트워크 활용, 다만 기준 있는 선별";
}

function moneyRiskPattern(saju) {
  if (saju.tenGodGroups.peer.level === "excessive") return "사람 관계에서 돈의 경계가 흐려지는 점";
  if (saju.tenGodGroups.wealth.level === "excessive") return "기회가 많아 보일 때 검증 전에 움직이는 점";
  return "작은 지출을 점검하지 않아 흐름을 놓치는 점";
}

function moneyProtectiveHabits(saju) {
  const list = ["큰 결정 전 3개월 뒤에도 유지 가능한지 확인하기", "역할과 책임을 문장으로 남기기"];
  if (saju.tenGods.indirectWealth > saju.tenGods.directWealth) list.push("새로운 제안은 최소 하루 이상 두고 다시 보기");
  else list.push("고정비와 반복 지출을 월 1회 점검하기");
  return list;
}

function stressPattern(saju, strong) {
  if (saju.fiveElements.excessive.includes("fire")) return "반응 속도가 빨라지며 쉽게 소진되는 방식";
  if (saju.fiveElements.excessive.includes("earth")) return "책임을 오래 들고 있다가 몸과 마음이 무거워지는 방식";
  if (saju.fiveElements.excessive.includes("water")) return "생각이 길어져 쉬어도 쉬지 못하는 방식";
  return `${ELEMENT_BEHAVIOR[strong].excess}이 스트레스 신호로 나타나는 방식`;
}

function energyPattern(saju) {
  if (saju.yinYang.balanceLevel === "yang") return "짧게 강하게 쓰는 힘은 좋지만, 회복 시간을 놓치면 급격히 피로해질 수 있는 흐름";
  if (saju.yinYang.balanceLevel === "yin") return "조용히 오래 축적하는 힘은 있지만, 밖으로 풀어내지 못하면 답답함이 쌓일 수 있는 흐름";
  return "움직임과 회복을 번갈아 쓸 때 안정되는 흐름";
}

function restPattern(saju, weak) {
  if (weak === "water") return "생각을 멈추고 쉬는 시간이 가장 먼저 필요합니다.";
  if (weak === "earth") return "생활 리듬이 흐트러지면 컨디션이 같이 흔들릴 수 있습니다.";
  return `${ELEMENT_BEHAVIOR[weak].habit}가 회복 리듬을 만드는 데 도움이 됩니다.`;
}

function bodySensitivity(saju, weak) {
  const text = {
    wood: "새로운 일정이나 환경 변화가 누적될 때 긴장이 먼저 올라오는 편",
    fire: "표현하지 못한 감정이나 과한 자극이 쌓이면 컨디션이 흔들리는 편",
    earth: "스트레스가 쌓이면 식사나 소화 리듬이 먼저 흔들리는 사람도 있는 편",
    metal: "경계와 긴장이 오래 유지되면 몸이 딱딱하게 굳는 느낌을 받을 수 있는 편",
    water: "휴식과 수면이 부족하면 집중력과 판단력이 먼저 흐려질 수 있는 편"
  };
  return text[weak] || text.earth;
}

function lifestyleHabits(weak, yinYang) {
  return [
    ELEMENT_BEHAVIOR[weak].habit,
    yinYang === "yang" ? "빠른 결정 뒤에는 반드시 점검 시간을 두기" : "생각을 정리한 뒤 작게라도 밖으로 표현하기",
    "컨디션이 흔들릴 때 중요한 결정을 미루기"
  ];
}

function practiceMore(saju, weak, weakestGroup) {
  return [
    ELEMENT_BEHAVIOR[weak].habit,
    groupPractice(weakestGroup),
    "중요한 선택은 기록으로 남기기"
  ];
}

function reduceList(saju, strong, strongestGroup) {
  return [
    ELEMENT_BEHAVIOR[strong].excess,
    groupReduce(strongestGroup),
    "혼자 판단하고 혼자 버티는 시간"
  ];
}

function chooseEnvironmentList(saju) {
  return [
    suitableEnvironment(saju),
    "역할과 기대치가 말로 정리되는 환경",
    "성과보다 과정의 기준도 함께 보는 환경"
  ];
}

function stayCloseToList(saju, weak) {
  return [
    ...partnerTraits(weak, "supportive"),
    "내 속도를 존중하면서도 현실적인 확인을 도와주는 사람"
  ];
}

function decisionCriteria(saju) {
  return [
    "지금 좋아 보이는가보다 3개월 뒤에도 유지 가능한가를 먼저 보기",
    "내가 맡을 책임과 상대가 맡을 책임을 구분하기",
    "속도를 높이기 전에 회복 가능한 일정인지 확인하기"
  ];
}

function currentOpportunities(saju, group) {
  const map = {
    peer: ["독립적인 결정", "동료와의 협업 재정비", "자기 기준 확립"],
    expression: ["결과물 공개", "말·글·콘텐츠", "아이디어 실행"],
    wealth: ["수입 구조 점검", "현실적 성과", "자원 관리"],
    authority: ["책임 있는 역할", "공식적 신뢰", "커리어 기준 정리"],
    resource: ["학습", "자격·전문성", "회복과 준비"]
  };
  return map[group] || map.resource;
}

function currentCautions(saju, group) {
  const weak = saju.fiveElements.weakest[0] || "water";
  const map = {
    peer: ["주도권 다툼", "혼자 다 하려는 태도"],
    expression: ["말이 앞서고 정리가 늦어지는 점", "소진"],
    wealth: ["검증 전 지출", "관계와 돈의 경계 흐림"],
    authority: ["책임 과부하", "압박감"],
    resource: ["준비만 길어지는 점", "고립"]
  };
  return [...(map[group] || map.resource), ELEMENT_BEHAVIOR[weak].lack];
}

function currentAdvice(saju, group) {
  const map = {
    peer: "혼자 버티는 힘을 협업 구조로 바꾸는 것",
    expression: "작은 결과물을 꾸준히 밖으로 보여주는 것",
    wealth: "돈과 역할의 기준을 먼저 정하는 것",
    authority: "맡을 책임과 거절할 책임을 구분하는 것",
    resource: "배운 것을 실제 행동으로 작게 옮기는 것"
  };
  return map[group] || map.resource;
}

function relationshipPriority(saju, group) {
  if (group === "peer") return "자존심보다 역할 조율";
  if (group === "expression") return "표현의 속도와 상대의 이해 속도 맞추기";
  return "기대치를 말로 확인하기";
}

function workPriority(saju, group) {
  if (group === "authority") return "책임 범위 정리";
  if (group === "expression") return "결과물 공개";
  if (group === "resource") return "학습을 결과로 전환";
  return "반복 가능한 업무 구조 만들기";
}

function moneyPriority(saju, group) {
  if (group === "wealth") return "수입과 지출 기준 점검";
  if (group === "peer") return "사람과 돈의 경계 세우기";
  return "작은 지출 기록";
}

function currentPhaseName(saju, annualGroup, level) {
  if (annualGroup === "resource") return "준비기";
  if (annualGroup === "expression") return level === "high" || level === "excessive" ? "확장기" : "표현기";
  if (annualGroup === "wealth") return "수확기";
  if (annualGroup === "authority") return "도전기";
  if (annualGroup === "peer") return "전환기";
  return "정리기";
}

function phaseTheme(key, strong, weak, group, luck) {
  const byKey = {
    early: `${ELEMENT_BEHAVIOR[strong].noun}의 감각을 배우고 자기 기준을 만드는 시기`,
    middle: `${ELEMENT_BEHAVIOR[strong].strength}을 현실적인 성과로 바꾸는 시기`,
    later: `${ELEMENT_BEHAVIOR[weak].habit}를 통해 경험을 정리하고 삶의 밀도를 높이는 시기`
  };
  return luck ? `${byKey[key]} (${luck.han}${luck.ko} 흐름 참고)` : byKey[key];
}

function relationshipPhaseText(key, saju) {
  if (key === "early") return "가까운 환경의 기대와 자신의 기준 사이에서 균형을 배우는";
  if (key === "middle") return "역할과 책임이 커지며 관계의 경계를 다시 세우는";
  return "많은 관계보다 오래 남는 관계의 질을 중시하는";
}

function workPhaseText(key, strong, group) {
  if (key === "early") return `${ELEMENT_BEHAVIOR[strong].noun}을 배우고 시도하는 경험`;
  if (group === "authority") return "책임 있는 역할과 공식적 신뢰";
  if (group === "expression") return "보이는 결과물과 표현";
  return `${ELEMENT_BEHAVIOR[strong].strength}`;
}

function moneyPhaseText(key, saju) {
  if (key === "early") return "돈보다 경험과 기준을 먼저 배우는 과정";
  if (key === "middle") return "수입, 책임, 지출 구조가 함께 커지는 과정";
  return "무리한 확장보다 지키고 정리하는 힘이 중요해지는 과정";
}

function contradictionTension(profile, saju) {
  if (saju.tenGodGroups.expression.level === "high" && saju.tenGodGroups.authority.level === "high") {
    return "한편으로는 자유롭게 표현하고 싶지만, 다른 한편으로는 책임과 기준을 무겁게 느끼는 긴장도 함께 있습니다. 이 긴장은 약점이 아니라, 표현을 신뢰 가능한 결과로 다듬게 하는 장치가 될 수 있습니다.";
  }
  if (saju.tenGodGroups.resource.level === "high" && saju.tenGodGroups.expression.level === "low") {
    return "생각을 깊이 정리하고 배우는 힘은 강하지만, 그것을 밖으로 보여주는 데 시간이 걸릴 수 있습니다. 실력에 비해 평가가 늦게 따라오지 않도록 작은 결과물을 꾸준히 공개하는 습관이 중요합니다.";
  }
  if (saju.tenGodGroups.wealth.level === "high" && saju.tenGodGroups.peer.level === "high") {
    return "현실적인 성과를 만들고 싶은 욕구와 독립성이 함께 강합니다. 돈과 사람의 관계가 가까워질수록 기회도 커지지만, 경쟁이나 지출도 늘 수 있으므로 역할과 책임을 분명히 해야 합니다.";
  }
  return "겉으로는 사람들과 맞추는 것처럼 보여도, 중요한 결정은 안에서 충분히 정리한 뒤 내리는 편입니다. 이 차이를 스스로 이해하면 불필요한 오해를 줄일 수 있습니다.";
}

function groupPlain(group, level) {
  return GROUP_LANGUAGE[group]?.[level] || GROUP_LANGUAGE[group]?.medium || "";
}

function groupPractice(group) {
  const map = {
    peer: "도움을 요청할 사람을 정해두기",
    expression: "작은 결과물을 정기적으로 공개하기",
    wealth: "수입과 지출을 같은 표에서 보기",
    authority: "내가 맡을 책임의 범위를 적어두기",
    resource: "배운 것을 한 문장으로 정리하고 바로 적용하기"
  };
  return map[group] || map.resource;
}

function groupReduce(group) {
  const map = {
    peer: "자존심 때문에 도움을 미루는 습관",
    expression: "정리되지 않은 말을 급하게 꺼내는 습관",
    wealth: "기회처럼 보인다는 이유만으로 움직이는 습관",
    authority: "책임을 모두 내 몫으로 받아들이는 습관",
    resource: "준비가 끝나야 시작할 수 있다고 느끼는 습관"
  };
  return map[group] || map.resource;
}

function rankGroup(groups) {
  return Object.entries(groups).sort((a, b) => b[1].score - a[1].score || a[0].localeCompare(b[0]));
}

function classifyYinYang(counts) {
  const difference = Math.abs((counts.yang || 0) - (counts.yin || 0));
  if (difference <= 1) return "balanced";
  return counts.yang > counts.yin ? "yang" : "yin";
}

function resourceElement(element) {
  return controlledBy(generates(element));
}

function generates(element) {
  return { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" }[element];
}

function controls(element) {
  return { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" }[element];
}

function controlledBy(element) {
  return ELEMENTS.find((candidate) => controls(candidate) === element) || "earth";
}

function roundScores(scores) {
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number(value.toFixed(2))]));
}

function withTrace(paragraphs, trace) {
  return paragraphs.map((text) => ({ text, trace }));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
