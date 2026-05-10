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
  const finalReport = buildFinalReport(interpretationProfile, normalizedSaju, lang);
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
