import { bindLanguageSelect, formatDateTime, getLanguage, t, translatePage } from "./i18n.js";
import { EARTHLY_BRANCHES, getCountryName } from "./saju/constants.js";
import { deleteResult, getResultById, isMockMode, StorageError } from "./storage.js";
import { isValidLifeId, normalizeLifeId } from "./validation.js";

const languageSelect = document.getElementById("languageSelect");
const resultRoot = document.getElementById("resultRoot");
const notFoundState = document.getElementById("notFoundState");
const resultIntro = document.getElementById("resultIntro");
const deleteModal = document.getElementById("deleteModal");
const deletePassword = document.getElementById("deletePassword");
const deleteError = document.getElementById("deleteError");

let currentRecord = null;
let currentSlug = "";

const RESULT_COPY = {
  ko: {
    sections: {
      summary: "요약",
      pillars: "사주 시각 차트",
      balance: "균형",
      personality: "성향",
      past: "과거 패턴",
      current: "현재 흐름",
      future: "미래 전망",
      relationships: "관계",
      workMoney: "일과 돈",
      guidance: "가이드",
      technical: "기술 상세"
    },
    labels: {
      coreKeywords: "핵심 키워드",
      currentLifeTheme: "현재 삶의 주제",
      opportunityAreas: "기회 영역",
      cautionAreas: "주의 영역",
      fiveElements: "오행 분포",
      yinYang: "음양 분포",
      strongEnergy: "강한 기운",
      weakEnergy: "약한 기운",
      balanceAdvice: "균형 조언",
      heavenlyStem: "천간",
      earthlyBranch: "지지",
      dayMaster: "일간",
      basicPersonality: "기본 성향",
      strengths: "강점",
      vulnerabilities: "취약점",
      thinkingStyle: "사고 방식",
      actionStyle: "행동 방식",
      emotionalExpression: "감정 표현",
      repeatedPastPatterns: "반복되기 쉬운 과거 패턴",
      earlyTemperament: "초기 기질",
      relationshipPatterns: "관계 패턴",
      workStudyPatterns: "일/학습 패턴",
      selfCheckQuestions: "셀프 체크 질문",
      currentPhase: "현재 단계",
      whatToFocusOn: "집중할 것",
      whatToAvoid: "피할 것",
      relationshipPriority: "관계 우선순위",
      workPriority: "일 우선순위",
      moneyPriority: "돈 우선순위",
      relationship: "관계",
      work: "일",
      money: "돈",
      thisYearNextYear: "올해부터 내년",
      nextThreeYears: "향후 3년",
      tenYearLuckTheme: "10년 대운 주제",
      opportunityTags: "기회 태그",
      riskTags: "리스크 태그",
      thisYear: "올해",
      relationshipStyle: "관계 스타일",
      loveStyle: "애정 스타일",
      matchingPeople: "잘 맞는 사람",
      conflictPronePeople: "충돌하기 쉬운 사람",
      longTermAdvice: "장기 관계 조언",
      workStyle: "일하는 방식",
      suitableEnvironment: "맞는 환경",
      roleStrengths: "역할 강점",
      moneyMakingStyle: "돈을 만드는 방식",
      moneyManagementCaution: "돈 관리 주의점",
      whatToDoNow: "지금 할 일",
      whatToAvoidNow: "지금 피할 일",
      relationshipGuidance: "관계 가이드",
      workGuidance: "일 가이드",
      moneyGuidance: "돈 가이드",
      balanceRecoveryActions: "균형 회복 행동",
      profile: "프로필",
      rawFourPillars: "원자료 사주표",
      tenGods: "십성",
      hiddenStems: "지장간",
      luckPillars: "대운",
      assumptions: "계산 가정"
    },
    elements: { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" },
    yinYang: { yin: "음", yang: "양" },
    elementKeywords: {
      wood: ["성장", "기획", "방향성", "회복력"],
      fire: ["표현", "명료함", "반응성", "활력"],
      earth: ["안정", "조율", "현실감", "신뢰"],
      metal: ["정리", "판단", "품질", "기준"],
      water: ["관찰", "학습", "유연성", "깊이"]
    },
    opportunities: {
      wood: ["장기 계획", "새로운 배움", "관계 확장", "브랜딩"],
      fire: ["발표", "콘텐츠", "리더십", "인지도"],
      earth: ["운영", "중재", "기반 만들기", "신뢰 축적"],
      metal: ["정리", "전문화", "품질 개선", "계약"],
      water: ["연구", "전략", "이동", "네트워크"]
    },
    cautions: {
      wood: ["조급한 확장", "방향 분산", "미완성"],
      fire: ["과열", "감정적 결정", "소진"],
      earth: ["정체", "과도한 책임", "우유부단"],
      metal: ["비판 과잉", "경직", "고립"],
      water: ["망설임", "과도한 관찰", "회피"]
    },
    polarityCautions: {
      yin: ["표현 지연", "혼자 감당하기"],
      yang: ["성급한 추진", "확인 없는 결정"]
    },
    selfCheckQuestions: ["내가 반복해서 미루는 선택은 무엇인가요?", "편안함 때문에 놓친 기회는 없나요?", "관계에서 같은 반응을 되풀이하고 있나요?"],
    recoveryActions: {
      wood: ["작은 계획표를 만들기", "새로운 공부를 20분 시작하기", "몸을 펴는 산책하기"],
      fire: ["말로 정리하기", "햇빛을 보기", "작은 결과물을 공개하기"],
      earth: ["공간 정돈하기", "식사와 수면 리듬 회복하기", "해야 할 일을 세 묶음으로 나누기"],
      metal: ["불필요한 약속 줄이기", "기준을 한 문장으로 쓰기", "마감선을 정하기"],
      water: ["조용히 기록하기", "충분히 쉬기", "정보를 모아 다음 수를 정하기"]
    },
    sentences: koreanSentences()
  },
  en: {
    sections: {
      summary: "Summary",
      pillars: "Four Pillars Visual Chart",
      balance: "Balance",
      personality: "Personality",
      past: "Past Patterns",
      current: "Current Flow",
      future: "Future Outlook",
      relationships: "Relationships",
      workMoney: "Work & Money",
      guidance: "Guidance",
      technical: "Technical Details"
    },
    labels: {
      coreKeywords: "Core keywords",
      currentLifeTheme: "Current life theme",
      opportunityAreas: "Opportunity areas",
      cautionAreas: "Caution areas",
      fiveElements: "Five elements",
      yinYang: "Yin/Yang",
      strongEnergy: "Strong energy",
      weakEnergy: "Weak energy",
      balanceAdvice: "Balance advice",
      heavenlyStem: "Heavenly Stem",
      earthlyBranch: "Earthly Branch",
      dayMaster: "Day Master",
      basicPersonality: "Basic personality",
      strengths: "Strengths",
      vulnerabilities: "Vulnerabilities",
      thinkingStyle: "Thinking style",
      actionStyle: "Action style",
      emotionalExpression: "Emotional expression",
      repeatedPastPatterns: "Likely repeated past patterns",
      earlyTemperament: "Early temperament",
      relationshipPatterns: "Relationship patterns",
      workStudyPatterns: "Work/study patterns",
      selfCheckQuestions: "Self-check questions",
      currentPhase: "Current phase",
      whatToFocusOn: "What to focus on",
      whatToAvoid: "What to avoid",
      relationshipPriority: "Relationship priority",
      workPriority: "Work priority",
      moneyPriority: "Money priority",
      relationship: "relationships",
      work: "work",
      money: "money",
      thisYearNextYear: "This year to next year",
      nextThreeYears: "Next 3 years",
      tenYearLuckTheme: "10-year luck pillar theme",
      opportunityTags: "Opportunity tags",
      riskTags: "Risk tags",
      thisYear: "This year",
      relationshipStyle: "Relationship style",
      loveStyle: "Love style",
      matchingPeople: "Matching people",
      conflictPronePeople: "Conflict-prone people",
      longTermAdvice: "Long-term relationship advice",
      workStyle: "Work style",
      suitableEnvironment: "Suitable environment",
      roleStrengths: "Role strengths",
      moneyMakingStyle: "Money-making style",
      moneyManagementCaution: "Money-management caution",
      whatToDoNow: "What to do now",
      whatToAvoidNow: "What to avoid now",
      relationshipGuidance: "Relationship guidance",
      workGuidance: "Work guidance",
      moneyGuidance: "Money guidance",
      balanceRecoveryActions: "Balance recovery actions",
      profile: "Profile",
      rawFourPillars: "Raw four pillars table",
      tenGods: "Ten Gods",
      hiddenStems: "Hidden stems",
      luckPillars: "Luck pillars",
      assumptions: "Calculation assumptions"
    },
    elements: { wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water" },
    yinYang: { yin: "Yin", yang: "Yang" },
    elementKeywords: {
      wood: ["growth", "planning", "direction", "resilience"],
      fire: ["expression", "clarity", "responsiveness", "vitality"],
      earth: ["stability", "mediation", "grounding", "trust"],
      metal: ["discernment", "refinement", "quality", "standards"],
      water: ["observation", "learning", "adaptability", "depth"]
    },
    opportunities: {
      wood: ["long-term planning", "learning", "relationship expansion", "branding"],
      fire: ["presenting", "content", "leadership", "visibility"],
      earth: ["operations", "mediation", "building foundations", "trust"],
      metal: ["organization", "specialization", "quality improvement", "contracts"],
      water: ["research", "strategy", "mobility", "networks"]
    },
    cautions: {
      wood: ["over-expansion", "scattered direction", "unfinished starts"],
      fire: ["overheating", "emotional decisions", "burnout"],
      earth: ["stagnation", "over-responsibility", "indecision"],
      metal: ["over-criticism", "rigidity", "isolation"],
      water: ["hesitation", "over-observation", "avoidance"]
    },
    polarityCautions: {
      yin: ["delayed expression", "carrying too much alone"],
      yang: ["rushing ahead", "deciding without checking"]
    },
    selfCheckQuestions: ["What choice do I keep postponing?", "Have I missed an opening because comfort felt safer?", "Do I repeat the same response in relationships?"],
    recoveryActions: {
      wood: ["Make a small plan", "Study for 20 minutes", "Take a stretching walk"],
      fire: ["Say it out loud", "Get sunlight", "Publish one small result"],
      earth: ["Reset your space", "Recover meal and sleep rhythm", "Group tasks into three buckets"],
      metal: ["Reduce unnecessary promises", "Write one standard clearly", "Set a deadline"],
      water: ["Write quietly", "Rest fully", "Gather information before the next move"]
    },
    sentences: englishSentences()
  },
  ja: {
    sections: {
      summary: "要約",
      pillars: "四柱ビジュアルチャート",
      balance: "バランス",
      personality: "性格",
      past: "過去のパターン",
      current: "現在の流れ",
      future: "今後の見通し",
      relationships: "人間関係",
      workMoney: "仕事とお金",
      guidance: "ガイダンス",
      technical: "技術詳細"
    },
    labels: {
      coreKeywords: "核心キーワード",
      currentLifeTheme: "現在の人生テーマ",
      opportunityAreas: "機会領域",
      cautionAreas: "注意領域",
      fiveElements: "五行分布",
      yinYang: "陰陽分布",
      strongEnergy: "強い気",
      weakEnergy: "弱い気",
      balanceAdvice: "バランス助言",
      heavenlyStem: "天干",
      earthlyBranch: "地支",
      dayMaster: "日主",
      basicPersonality: "基本性格",
      strengths: "強み",
      vulnerabilities: "弱点",
      thinkingStyle: "思考スタイル",
      actionStyle: "行動スタイル",
      emotionalExpression: "感情表現",
      repeatedPastPatterns: "繰り返しやすい過去パターン",
      earlyTemperament: "初期気質",
      relationshipPatterns: "関係パターン",
      workStudyPatterns: "仕事/学習パターン",
      selfCheckQuestions: "セルフチェック質問",
      currentPhase: "現在の段階",
      whatToFocusOn: "集中すること",
      whatToAvoid: "避けること",
      relationshipPriority: "関係の優先度",
      workPriority: "仕事の優先度",
      moneyPriority: "お金の優先度",
      relationship: "関係",
      work: "仕事",
      money: "お金",
      thisYearNextYear: "今年から来年",
      nextThreeYears: "次の3年",
      tenYearLuckTheme: "10年運のテーマ",
      opportunityTags: "機会タグ",
      riskTags: "リスクタグ",
      thisYear: "今年",
      relationshipStyle: "関係スタイル",
      loveStyle: "愛情スタイル",
      matchingPeople: "合いやすい人",
      conflictPronePeople: "衝突しやすい人",
      longTermAdvice: "長期関係の助言",
      workStyle: "仕事スタイル",
      suitableEnvironment: "合う環境",
      roleStrengths: "役割の強み",
      moneyMakingStyle: "稼ぎ方",
      moneyManagementCaution: "お金管理の注意",
      whatToDoNow: "今すること",
      whatToAvoidNow: "今避けること",
      relationshipGuidance: "関係ガイド",
      workGuidance: "仕事ガイド",
      moneyGuidance: "お金ガイド",
      balanceRecoveryActions: "バランス回復行動",
      profile: "プロフィール",
      rawFourPillars: "四柱原表",
      tenGods: "十神",
      hiddenStems: "蔵干",
      luckPillars: "大運",
      assumptions: "計算前提"
    },
    elements: { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" },
    yinYang: { yin: "陰", yang: "陽" },
    elementKeywords: {
      wood: ["成長", "計画", "方向性", "回復力"],
      fire: ["表現", "明快さ", "反応性", "活力"],
      earth: ["安定", "調整", "現実感", "信頼"],
      metal: ["整理", "判断", "品質", "基準"],
      water: ["観察", "学習", "柔軟性", "深さ"]
    },
    opportunities: {
      wood: ["長期計画", "学習", "関係拡張", "ブランド"],
      fire: ["発表", "コンテンツ", "リーダーシップ", "認知"],
      earth: ["運営", "調整", "土台作り", "信頼"],
      metal: ["整理", "専門化", "品質改善", "契約"],
      water: ["研究", "戦略", "移動", "ネットワーク"]
    },
    cautions: {
      wood: ["広げすぎ", "方向分散", "未完了"],
      fire: ["過熱", "感情的判断", "消耗"],
      earth: ["停滞", "抱えすぎ", "優柔不断"],
      metal: ["批判過多", "硬直", "孤立"],
      water: ["ためらい", "観察過多", "回避"]
    },
    polarityCautions: {
      yin: ["表現の遅れ", "一人で抱え込むこと"],
      yang: ["急ぎすぎ", "確認不足の決定"]
    },
    selfCheckQuestions: ["先延ばしにしている選択は何ですか？", "安心を選びすぎて逃した機会はありませんか？", "関係で同じ反応を繰り返していませんか？"],
    recoveryActions: {
      wood: ["小さな計画を作る", "20分だけ学ぶ", "体を伸ばして歩く"],
      fire: ["声に出して整理する", "日光を浴びる", "小さな成果を出す"],
      earth: ["空間を整える", "食事と睡眠を戻す", "タスクを三つに分ける"],
      metal: ["不要な約束を減らす", "基準を一文で書く", "締切を決める"],
      water: ["静かに記録する", "十分に休む", "情報を集めて次を決める"]
    },
    sentences: japaneseSentences()
  },
  zh: {
    sections: {
      summary: "摘要",
      pillars: "四柱视觉图",
      balance: "平衡",
      personality: "性格",
      past: "过去模式",
      current: "当前流动",
      future: "未来展望",
      relationships: "关系",
      workMoney: "工作与金钱",
      guidance: "指引",
      technical: "技术细节"
    },
    labels: {
      coreKeywords: "核心关键词",
      currentLifeTheme: "当前生活主题",
      opportunityAreas: "机会领域",
      cautionAreas: "注意领域",
      fiveElements: "五行分布",
      yinYang: "阴阳分布",
      strongEnergy: "较强能量",
      weakEnergy: "较弱能量",
      balanceAdvice: "平衡建议",
      heavenlyStem: "天干",
      earthlyBranch: "地支",
      dayMaster: "日主",
      basicPersonality: "基本性格",
      strengths: "优势",
      vulnerabilities: "脆弱点",
      thinkingStyle: "思考方式",
      actionStyle: "行动方式",
      emotionalExpression: "情绪表达",
      repeatedPastPatterns: "可能重复的过去模式",
      earlyTemperament: "早期气质",
      relationshipPatterns: "关系模式",
      workStudyPatterns: "工作/学习模式",
      selfCheckQuestions: "自我检查问题",
      currentPhase: "当前阶段",
      whatToFocusOn: "需要专注",
      whatToAvoid: "需要避免",
      relationshipPriority: "关系优先级",
      workPriority: "工作优先级",
      moneyPriority: "金钱优先级",
      relationship: "关系",
      work: "工作",
      money: "金钱",
      thisYearNextYear: "今年到明年",
      nextThreeYears: "未来三年",
      tenYearLuckTheme: "十年大运主题",
      opportunityTags: "机会标签",
      riskTags: "风险标签",
      thisYear: "今年",
      relationshipStyle: "关系风格",
      loveStyle: "恋爱风格",
      matchingPeople: "适合的人",
      conflictPronePeople: "容易冲突的人",
      longTermAdvice: "长期关系建议",
      workStyle: "工作方式",
      suitableEnvironment: "适合环境",
      roleStrengths: "角色优势",
      moneyMakingStyle: "赚钱方式",
      moneyManagementCaution: "金钱管理注意",
      whatToDoNow: "现在该做",
      whatToAvoidNow: "现在避免",
      relationshipGuidance: "关系指引",
      workGuidance: "工作指引",
      moneyGuidance: "金钱指引",
      balanceRecoveryActions: "平衡恢复行动",
      profile: "资料",
      rawFourPillars: "原始四柱表",
      tenGods: "十神",
      hiddenStems: "藏干",
      luckPillars: "大运",
      assumptions: "计算假设"
    },
    elements: { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" },
    yinYang: { yin: "阴", yang: "阳" },
    elementKeywords: {
      wood: ["成长", "规划", "方向", "恢复力"],
      fire: ["表达", "清晰", "回应", "活力"],
      earth: ["稳定", "协调", "现实感", "信任"],
      metal: ["整理", "判断", "品质", "标准"],
      water: ["观察", "学习", "弹性", "深度"]
    },
    opportunities: {
      wood: ["长期计划", "学习", "关系扩展", "品牌"],
      fire: ["表达", "内容", "领导", "可见度"],
      earth: ["运营", "协调", "建立基础", "累积信任"],
      metal: ["整理", "专业化", "品质提升", "合约"],
      water: ["研究", "策略", "移动", "网络"]
    },
    cautions: {
      wood: ["扩张过快", "方向分散", "半途而止"],
      fire: ["过热", "情绪决策", "耗竭"],
      earth: ["停滞", "责任过重", "犹豫"],
      metal: ["批判过多", "僵硬", "孤立"],
      water: ["迟疑", "观察过度", "回避"]
    },
    polarityCautions: {
      yin: ["表达延迟", "独自承受太多"],
      yang: ["推进过急", "未确认就决定"]
    },
    selfCheckQuestions: ["我反复推迟的选择是什么？", "是否因为舒适而错过机会？", "关系中是否重复同一种反应？"],
    recoveryActions: {
      wood: ["制定小计划", "学习20分钟", "伸展后散步"],
      fire: ["说出来整理", "晒太阳", "发布一个小成果"],
      earth: ["整理空间", "恢复饮食睡眠节奏", "把任务分成三类"],
      metal: ["减少不必要承诺", "写下一条标准", "设定截止时间"],
      water: ["安静记录", "充分休息", "收集信息再行动"]
    },
    sentences: chineseSentences()
  }
};

bindLanguageSelect(languageSelect, () => {
  if (currentRecord) renderResult(currentRecord);
});

init();

async function init() {
  currentSlug = normalizeLifeId(new URLSearchParams(window.location.search).get("id"));
  if (!isValidLifeId(currentSlug)) {
    showNotFound();
    return;
  }

  try {
    const record = await getResultById(currentSlug);
    if (!record) {
      showNotFound();
      return;
    }
    currentRecord = record;
    renderResult(record);
  } catch (error) {
    resultIntro.textContent = error.message || t("common.error");
    showNotFound();
  }
}

function renderResult(record) {
  const result = typeof record.result_json === "string" ? JSON.parse(record.result_json) : record.result_json;
  const lang = getLanguage();
  const copy = getResultCopy(lang);
  const narrative = buildNarrative(record, result, lang);
  const country = getCountryName(record.birth_country, getLanguage());
  const branch = EARTHLY_BRANCHES.find((item) => item.key === record.birth_time_branch);

  document.title = `${t("result.title")} ${record.slug} | Liferary`;
  resultIntro.textContent = `${record.name} · ${record.slug}`;
  notFoundState.hidden = true;
  resultRoot.hidden = false;

  resultRoot.innerHTML = `
    <section class="result-section" aria-labelledby="summaryTitle">
      <h2 id="summaryTitle">${escapeHtml(copy.sections.summary)}</h2>
      <div class="meta-grid summary-cards">
        ${metaItem(t("result.id"), record.slug, t("result.rememberId"))}
        ${metaItem(t("result.created"), formatDateTime(record.created_at))}
        ${metaItem(copy.labels.coreKeywords, narrative.coreKeywords.join(" · "))}
        ${metaItem(copy.labels.currentLifeTheme, narrative.currentLifeTheme)}
        ${metaItem(copy.labels.opportunityAreas, narrative.opportunityAreas.join(" · "))}
        ${metaItem(copy.labels.cautionAreas, narrative.cautionAreas.join(" · "))}
      </div>
      <p class="overall-reading">${escapeHtml(narrative.overall)}</p>
      ${isMockMode() ? `<ul class="tag-list" style="margin-top: 14px;"><li>${t("result.mockBadge")}</li></ul>` : ""}
    </section>

    <section class="result-section" aria-labelledby="pillarsTitle">
      <h2 id="pillarsTitle">${escapeHtml(copy.sections.pillars)}</h2>
      ${renderPillarChart(result, copy)}
    </section>

    <section class="result-section" aria-labelledby="balanceTitle">
      <h2 id="balanceTitle">${escapeHtml(copy.sections.balance)}</h2>
      <div class="balance-grid">
        <div>
          <h3>${escapeHtml(copy.labels.fiveElements)}</h3>
          ${renderMeters(result.fiveElements, "element")}
        </div>
        <div>
          <h3>${escapeHtml(copy.labels.yinYang)}</h3>
          ${renderMeters(result.yinYang, "yinYang")}
        </div>
      </div>
      <div class="reading-grid compact">
        ${textBlock(copy.labels.strongEnergy, narrative.strongEnergy)}
        ${textBlock(copy.labels.weakEnergy, narrative.weakEnergy)}
        ${textBlock(copy.labels.balanceAdvice, narrative.balanceAdvice)}
      </div>
    </section>

    <section class="result-section" aria-labelledby="personalityTitle">
      <h2 id="personalityTitle">${escapeHtml(copy.sections.personality)}</h2>
      ${renderReadingBlocks(narrative.personality)}
    </section>

    <section class="result-section" aria-labelledby="pastTitle">
      <h2 id="pastTitle">${escapeHtml(copy.sections.past)}</h2>
      ${renderReadingBlocks(narrative.past)}
    </section>

    <section class="result-section" aria-labelledby="currentTitle">
      <h2 id="currentTitle">${escapeHtml(copy.sections.current)}</h2>
      ${renderReadingBlocks(narrative.current)}
    </section>

    <section class="result-section" aria-labelledby="futureTitle">
      <h2 id="futureTitle">${escapeHtml(copy.sections.future)}</h2>
      ${renderReadingBlocks(narrative.future.blocks)}
      <div class="tag-row-group">
        ${tagGroup(copy.labels.opportunityTags, narrative.future.opportunityTags)}
        ${tagGroup(copy.labels.riskTags, narrative.future.riskTags)}
      </div>
      ${renderTimeline(narrative.future.timeline)}
    </section>

    <section class="result-section" aria-labelledby="relationshipsTitle">
      <h2 id="relationshipsTitle">${escapeHtml(copy.sections.relationships)}</h2>
      ${renderReadingBlocks(narrative.relationships)}
    </section>

    <section class="result-section" aria-labelledby="workMoneyTitle">
      <h2 id="workMoneyTitle">${escapeHtml(copy.sections.workMoney)}</h2>
      ${renderReadingBlocks(narrative.workMoney)}
    </section>

    <section class="result-section" aria-labelledby="guidanceTitle">
      <h2 id="guidanceTitle">${escapeHtml(copy.sections.guidance)}</h2>
      ${renderReadingBlocks(narrative.guidance)}
    </section>

    <section class="result-section" aria-labelledby="technicalTitle">
      <details class="technical-details">
        <summary id="technicalTitle">${escapeHtml(copy.sections.technical)}</summary>
        <div class="technical-stack">
          <div>
            <h3>${escapeHtml(copy.labels.profile)}</h3>
            <div class="summary-grid">
              ${metaItem(t("result.name"), record.name)}
              ${metaItem(t("result.birth"), `${record.birth_year}-${pad(record.birth_month)}-${pad(record.birth_day)} · ${branch?.han || ""}${branch?.ko || ""}`)}
              ${metaItem(t("result.calendar"), t(`calendar.${record.birth_calendar}`))}
              ${metaItem(t("result.country"), `${country} · ${record.timezone}`)}
            </div>
          </div>
          <div>
            <h3>${escapeHtml(copy.labels.rawFourPillars)}</h3>
            ${renderPillarTable(result)}
          </div>
          <div>
            <h3>${escapeHtml(copy.labels.tenGods)}</h3>
            ${renderTenGodTags(result)}
          </div>
          <div>
            <h3>${escapeHtml(copy.labels.hiddenStems)}</h3>
            ${renderHiddenStemTags(result)}
          </div>
          <div>
            <h3>${escapeHtml(copy.labels.luckPillars)}</h3>
            <p class="field-note">${escapeHtml(t(`direction.${result.luckPillars.direction}`))} · ${escapeHtml(result.luckPillars.startAge.years)}y ${escapeHtml(result.luckPillars.startAge.months)}m · ${escapeHtml(result.luckPillars.note)}</p>
            ${renderLuckTable(result.luckPillars)}
          </div>
          <div>
            <h3>${escapeHtml(copy.labels.assumptions)}</h3>
            <ul class="tag-list">
              ${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
            </ul>
          </div>
          <div class="notice-stack">
            <p>${t("disclaimer.service")}</p>
            <p>${t("disclaimer.calculation")}</p>
          </div>
        </div>
      </details>
    </section>

    <div class="bottom-actions">
      <button class="danger-button" id="openDeleteButton" type="button">${t("result.delete")}</button>
    </div>
  `;

  document.getElementById("openDeleteButton").addEventListener("click", () => openDialog(deleteModal));
  translatePage();
}

function renderPillarChart(result, copy) {
  return `
    <div class="pillar-chart" aria-label="${escapeHtml(copy.sections.pillars)}">
      ${["hour", "day", "month", "year"].map((key) => {
        const pillar = result.pillars[key];
        return `
          <article class="pillar-stack ${key === "day" ? "day-pillar" : ""}">
            <h3>${escapeHtml(t(`pillar.${key}`))}</h3>
            ${characterCard(pillar.stem, copy.labels.heavenlyStem, key === "day")}
            ${characterCard(pillar.branch, copy.labels.earthlyBranch, false)}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function characterCard(part, label, isDayMaster) {
  return `
    <div class="character-card element-${part.element} ${isDayMaster ? "day-master" : ""}">
      <span class="character-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(part.han)}</strong>
      <span>${escapeHtml(part.ko)} · ${escapeHtml(t(`element.${part.element}`))} · ${escapeHtml(t(`yinYang.${part.yinYang}`))}</span>
      ${isDayMaster ? `<em>${escapeHtml(getResultCopy(getLanguage()).labels.dayMaster)}</em>` : ""}
    </div>
  `;
}

function renderPillarTable(result) {
  const keys = ["year", "month", "day", "hour"];
  return `
    <table class="pillar-table">
      <thead>
        <tr>
          <th>${t("table.pillar")}</th>
          <th>${t("table.stem")}</th>
          <th>${t("table.branch")}</th>
          <th>${t("table.tenGod")}</th>
          <th>${t("table.hidden")}</th>
        </tr>
      </thead>
      <tbody>
        ${keys.map((key) => {
          const pillar = result.pillars[key];
          return `
            <tr>
              <td>${escapeHtml(t(`pillar.${key}`))}</td>
              <td>${renderGanjiPart(pillar.stem)}</td>
              <td>${renderGanjiPart(pillar.branch)}</td>
              <td>${escapeHtml(t(`tenGod.${result.tenGods[key]}`))}</td>
              <td>${result.hiddenStems[key].map((stem) => escapeHtml(`${stem.han}${stem.ko}`)).join(" · ")}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderTenGodTags(result) {
  return `
    <ul class="tag-list">
      ${["year", "month", "day", "hour"].map((key) => `
        <li>${escapeHtml(t(`pillar.${key}`))}: ${escapeHtml(t(`tenGod.${result.tenGods[key]}`))}</li>
      `).join("")}
    </ul>
  `;
}

function renderHiddenStemTags(result) {
  return `
    <ul class="tag-list">
      ${["year", "month", "day", "hour"].map((key) => `
        <li>${escapeHtml(t(`pillar.${key}`))}: ${result.hiddenStems[key].map((stem) => escapeHtml(`${stem.han}${stem.ko}`)).join(" · ")}</li>
      `).join("")}
    </ul>
  `;
}

function renderLuckTable(luckPillars) {
  return `
    <table class="luck-table" style="margin-top: 14px;">
      <thead>
        <tr>
          <th>${t("table.range")}</th>
          <th>${t("table.pillar")}</th>
        </tr>
      </thead>
      <tbody>
        ${luckPillars.pillars.map((pillar) => `
          <tr>
            <td>${escapeHtml(pillar.startAge)}-${escapeHtml(pillar.endAge)}</td>
            <td><span class="ganji"><span class="han">${escapeHtml(pillar.han)}</span><span class="ko">${escapeHtml(pillar.ko)}</span></span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderReadingBlocks(blocks) {
  return `
    <div class="reading-grid">
      ${blocks.map((block) => textBlock(block.title, block.text)).join("")}
    </div>
  `;
}

function textBlock(title, text) {
  return `
    <article class="reading-item">
      <h3>${escapeHtml(title)}</h3>
      ${Array.isArray(text)
        ? `<ul class="check-list">${text.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p>${escapeHtml(text)}</p>`}
    </article>
  `;
}

function tagGroup(title, tags) {
  return `
    <div class="tag-group">
      <h3>${escapeHtml(title)}</h3>
      <ul class="tag-list">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderTimeline(items) {
  return `
    <div class="timeline" aria-label="Timeline">
      ${items.map((item) => `
        <article class="timeline-item">
          <span>${escapeHtml(item.period)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderGanjiPart(part) {
  return `
    <span class="ganji">
      <span class="han">${escapeHtml(part.han)}</span>
      <span class="ko">${escapeHtml(part.ko)}</span>
    </span>
    <div class="field-note">${t(`element.${part.element}`)} · ${t(`yinYang.${part.yinYang}`)}</div>
  `;
}

function buildNarrative(record, result, lang) {
  const copy = getResultCopy(lang);
  const strong = getRankedElements(result.fiveElements)[0]?.[0] || "earth";
  const weak = getRankedElements(result.fiveElements).at(-1)?.[0] || "earth";
  const dayElement = result.pillars.day.stem.element;
  const dayYinYang = result.pillars.day.stem.yinYang;
  const dominantPolarity = result.yinYang.yang >= result.yinYang.yin ? "yang" : "yin";
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const threeYear = currentYear + 3;
  const currentAge = Math.max(0, currentYear - Number(record.birth_year));
  const currentLuck = result.luckPillars.pillars.find((pillar) => currentAge >= pillar.startAge && currentAge <= pillar.endAge) || result.luckPillars.pillars[0];
  const day = elementText(copy, dayElement);
  const strongText = elementText(copy, strong);
  const weakText = elementText(copy, weak);
  const polarityText = copy.yinYang[dominantPolarity];
  const keywords = unique([...copy.elementKeywords[dayElement], ...copy.elementKeywords[strong]]).slice(0, 5);
  const opportunityAreas = unique([...copy.opportunities[strong], ...copy.opportunities[dayElement]]).slice(0, 4);
  const cautionAreas = unique([...copy.cautions[weak], ...copy.polarityCautions[dominantPolarity]]).slice(0, 4);

  return {
    coreKeywords: keywords,
    currentLifeTheme: copy.sentences.theme(day, strongText),
    opportunityAreas,
    cautionAreas,
    overall: copy.sentences.overall(day, strongText, weakText),
    strongEnergy: copy.sentences.strong(strongText),
    weakEnergy: copy.sentences.weak(weakText),
    balanceAdvice: copy.sentences.balance(weakText, polarityText),
    personality: [
      block(copy.labels.basicPersonality, copy.sentences.personality(day, copy.yinYang[dayYinYang])),
      block(copy.labels.strengths, copy.sentences.strengths(strongText)),
      block(copy.labels.vulnerabilities, copy.sentences.vulnerabilities(weakText)),
      block(copy.labels.thinkingStyle, copy.sentences.thinking(day)),
      block(copy.labels.actionStyle, copy.sentences.action(polarityText)),
      block(copy.labels.emotionalExpression, copy.sentences.emotion(day, polarityText))
    ],
    past: [
      block(copy.labels.repeatedPastPatterns, copy.sentences.pastPattern(strongText)),
      block(copy.labels.earlyTemperament, copy.sentences.early(day)),
      block(copy.labels.relationshipPatterns, copy.sentences.relationshipPast(polarityText)),
      block(copy.labels.workStudyPatterns, copy.sentences.workStudy(strongText)),
      block(copy.labels.selfCheckQuestions, copy.selfCheckQuestions)
    ],
    current: [
      block(copy.labels.currentPhase, copy.sentences.currentPhase(strongText, weakText)),
      block(copy.labels.whatToFocusOn, copy.sentences.focus(weakText)),
      block(copy.labels.whatToAvoid, copy.sentences.avoid(strongText)),
      block(copy.labels.relationshipPriority, copy.sentences.priority(copy.labels.relationship)),
      block(copy.labels.workPriority, copy.sentences.priority(copy.labels.work)),
      block(copy.labels.moneyPriority, copy.sentences.priority(copy.labels.money))
    ],
    future: {
      blocks: [
        block(copy.labels.thisYearNextYear, copy.sentences.yearFlow(currentYear, nextYear, strongText)),
        block(copy.labels.nextThreeYears, copy.sentences.threeYears(currentYear, threeYear, weakText)),
        block(copy.labels.tenYearLuckTheme, copy.sentences.luckTheme(currentLuck?.han || "", currentLuck?.ko || "", currentLuck?.startAge, currentLuck?.endAge))
      ],
      opportunityTags: opportunityAreas,
      riskTags: cautionAreas,
      timeline: [
        { period: String(currentYear), title: copy.labels.thisYear, text: copy.sentences.timelineNow(strongText) },
        { period: `${currentYear}-${threeYear}`, title: copy.labels.nextThreeYears, text: copy.sentences.timelineThree(weakText) },
        { period: `${currentLuck?.startAge || ""}-${currentLuck?.endAge || ""}`, title: copy.labels.tenYearLuckTheme, text: copy.sentences.timelineLuck(currentLuck?.han || "") }
      ]
    },
    relationships: [
      block(copy.labels.relationshipStyle, copy.sentences.relationshipStyle(day)),
      block(copy.labels.loveStyle, copy.sentences.loveStyle(polarityText)),
      block(copy.labels.matchingPeople, copy.sentences.matchingPeople(weakText)),
      block(copy.labels.conflictPronePeople, copy.sentences.conflictPeople(strongText)),
      block(copy.labels.longTermAdvice, copy.sentences.longTermAdvice(weakText))
    ],
    workMoney: [
      block(copy.labels.workStyle, copy.sentences.workStyle(strongText)),
      block(copy.labels.suitableEnvironment, copy.sentences.environment(day)),
      block(copy.labels.roleStrengths, copy.sentences.roleStrengths(strongText)),
      block(copy.labels.moneyMakingStyle, copy.sentences.moneyMaking(strongText)),
      block(copy.labels.moneyManagementCaution, copy.sentences.moneyCaution(weakText))
    ],
    guidance: [
      block(copy.labels.whatToDoNow, copy.sentences.doNow(weakText)),
      block(copy.labels.whatToAvoidNow, copy.sentences.avoidNow(strongText)),
      block(copy.labels.relationshipGuidance, copy.sentences.relationshipGuidance(weakText)),
      block(copy.labels.workGuidance, copy.sentences.workGuidance(strongText)),
      block(copy.labels.moneyGuidance, copy.sentences.moneyGuidance(weakText)),
      block(copy.labels.balanceRecoveryActions, copy.recoveryActions[weak])
    ]
  };
}

function block(title, text) {
  return { title, text };
}

function getRankedElements(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function elementText(copy, element) {
  return copy.elements[element] || element;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getResultCopy(lang) {
  return RESULT_COPY[lang] || RESULT_COPY.en;
}

function koreanSentences() {
  return sentenceSet({
    theme: "{day} 일간이 {strong} 기운으로 드러납니다. 지금은 방향을 넓히기보다 리듬을 정돈하는 시기입니다.",
    overall: "{day} 성향 위에 {strong} 기운이 두드러지고, {weak}을 보완할 때 균형이 좋아집니다.",
    strong: "{element} 기운이 비교적 강합니다. 장점으로 쓰이면 추진력과 반복 가능한 패턴이 됩니다.",
    weak: "{element} 기운은 상대적으로 약합니다. 결핍이 아니라 의식적으로 빌려오면 균형을 만드는 지점입니다.",
    balance: "{weak}의 행동을 작게 실천하고, {polarity} 리듬이 한쪽으로 치우치지 않게 조절해 보세요.",
    personality: "{day} 일간과 {polarity} 성향이 함께 나타납니다. 스스로 납득할 수 있는 방식에서 안정감이 생깁니다.",
    strengths: "{strong} 기운은 반복과 축적 속에서 강점이 됩니다. 잘하는 방식을 시스템으로 만들수록 힘이 납니다.",
    vulnerabilities: "{weak} 영역은 무리하게 밀어붙이기보다 작은 루틴으로 보완하는 편이 좋습니다.",
    thinking: "{day}의 관점으로 정보를 해석합니다. 빠른 답보다 스스로 정리한 기준이 더 오래 갑니다.",
    action: "{polarity} 기운이 행동 속도에 영향을 줍니다. 시작과 점검의 간격을 의식하면 균형이 좋아집니다.",
    emotion: "감정은 {day}의 방식으로 정리되고 {polarity}의 리듬으로 표현됩니다. 충분히 이름 붙인 뒤 말하는 것이 도움이 됩니다.",
    pastPattern: "{strong} 기운이 익숙한 선택을 반복하게 만들었을 수 있습니다. 잘하는 방식을 고집으로 바꾸지 않는 것이 포인트입니다.",
    early: "초기 기질에는 {day}의 색이 묻어납니다. 낯선 환경에서도 자기 기준을 찾으려는 성향이 있었을 수 있습니다.",
    relationshipPast: "관계에서는 {polarity} 리듬이 반복되기 쉽습니다. 가까워지는 속도와 거리를 의식하는 것이 좋습니다.",
    workStudy: "일과 학습에서는 {strong} 기운이 성과의 문을 엽니다. 단기 몰입보다 반복 가능한 구조가 더 잘 맞습니다.",
    currentPhase: "현재는 {strong}을 활용하되 {weak}을 보완해야 하는 단계입니다.",
    focus: "{weak} 영역을 작게 회복하는 데 집중하세요. 큰 변화보다 매일 반복할 수 있는 행동이 좋습니다.",
    avoid: "{strong}의 장점이 과해지면 시야가 좁아질 수 있습니다. 익숙한 방식만 반복하지 않도록 주의하세요.",
    priority: "{area}에서는 빠른 결론보다 기준을 세우고 확인하는 과정이 우선입니다.",
    yearFlow: "{year}년부터 {nextYear}년까지는 {strong} 기운을 현실적인 결과로 옮기는 흐름으로 읽을 수 있습니다.",
    threeYears: "{year}년부터 {threeYear}년까지는 {weak} 기운을 보완하는 선택이 장기 균형을 만듭니다.",
    luckTheme: "{start}-{end}세 구간의 대운은 {han}{ko} 흐름입니다. 정확한 예언보다 10년 단위의 환경 리듬으로 참고하세요.",
    timelineNow: "{strong} 강점을 정돈해 눈에 보이는 결과로 만드는 시기입니다.",
    timelineThree: "{weak} 보완이 다음 선택의 안정성을 높입니다.",
    timelineLuck: "{pillar} 대운은 장기 배경음처럼 작동하는 흐름입니다.",
    relationshipStyle: "{day} 성향은 관계에서 신뢰할 수 있는 리듬을 찾으려 합니다.",
    loveStyle: "애정 표현은 {polarity} 리듬을 타기 쉽습니다. 상대가 이해할 수 있는 속도로 표현하는 것이 좋습니다.",
    matchingPeople: "{weak} 기운을 자연스럽게 보완해 주는 사람과 함께할 때 시야가 넓어집니다.",
    conflictPeople: "{strong} 기운이 지나치게 비슷하거나 강한 사람과는 주도권 충돌이 생길 수 있습니다.",
    longTermAdvice: "장기 관계에서는 {weak} 영역을 함께 회복하는 습관이 중요합니다.",
    workStyle: "{strong} 기운을 쓸 수 있는 역할에서 몰입이 잘 생깁니다.",
    environment: "{day} 성향이 존중되는 환경, 즉 기준과 자율성이 함께 있는 곳이 잘 맞습니다.",
    roleStrengths: "{strong}을 구조화하는 역할에서 신뢰를 얻기 쉽습니다.",
    moneyMaking: "돈은 {strong} 강점을 꾸준한 가치로 바꿀 때 들어오기 쉽습니다.",
    moneyCaution: "{weak} 영역이 약할 때는 감정적 소비나 불명확한 약속을 조심하세요.",
    doNow: "지금은 {weak} 기운을 하루 한 번 회복하는 행동을 정하세요.",
    avoidNow: "{strong}의 익숙함에만 기대어 결정을 서두르지 마세요.",
    relationshipGuidance: "관계에서는 {weak} 기운을 빌려 듣고 확인하는 시간을 두세요.",
    workGuidance: "일에서는 {strong} 강점을 결과물의 형태로 정리하세요.",
    moneyGuidance: "돈에서는 {weak} 영역을 보완하는 기록과 점검이 필요합니다."
  });
}

function englishSentences() {
  return sentenceSet({
    theme: "Your {day} Day Master is expressed through prominent {strong} energy. This phase asks you to refine rhythm before widening direction.",
    overall: "This chart rests on {day}, shows noticeable {strong}, and becomes steadier when {weak} is practiced intentionally.",
    strong: "{element} is relatively strong. Used well, it becomes momentum and a repeatable pattern of strength.",
    weak: "{element} is relatively quiet. This is not a flaw; it is a useful place to borrow balance from.",
    balance: "Practice small {weak} actions and keep the {polarity} rhythm from taking over the whole pace.",
    personality: "{day} and {polarity} tendencies meet here. You may feel most stable when your actions make sense internally.",
    strengths: "{strong} becomes a strength through repetition and accumulation. Your gift grows when your method becomes a system.",
    vulnerabilities: "{weak} may need small routines rather than force. Gentle structure works better than pressure.",
    thinking: "You tend to interpret information through a {day} lens. A self-owned standard lasts longer than a quick answer.",
    action: "{polarity} influences your action speed. Balance improves when you pair starting with checking.",
    emotion: "Emotion is processed through {day} and expressed through a {polarity} rhythm. Naming it first can help.",
    pastPattern: "{strong} may have shaped familiar past choices. The key is not letting a strength harden into a fixed habit.",
    early: "Early temperament may have carried a {day} tone: looking for your own standard even in unfamiliar surroundings.",
    relationshipPast: "Relationships may repeat a {polarity} rhythm. Notice the pace of closeness and distance.",
    workStudy: "{strong} opens the door in work and study. Repeatable structure may fit better than short bursts.",
    currentPhase: "This phase asks you to use {strong} while restoring {weak}.",
    focus: "Focus on restoring {weak} in small daily actions rather than making one large change.",
    avoid: "When {strong} is overused, your view may narrow. Avoid repeating only what already feels familiar.",
    priority: "For {area}, setting a standard and checking it matters more than rushing to a conclusion.",
    yearFlow: "From {year} to {nextYear}, the flow favors turning {strong} into practical results.",
    threeYears: "From {year} to {threeYear}, choices that restore {weak} can support longer-term balance.",
    luckTheme: "The {start}-{end} age luck pillar is {han}{ko}. Read it as a 10-year environmental rhythm, not a fixed prediction.",
    timelineNow: "Shape your {strong} strength into visible outcomes.",
    timelineThree: "Restoring {weak} makes the next choices steadier.",
    timelineLuck: "{pillar} works like a long-term background rhythm.",
    relationshipStyle: "{day} seeks a reliable rhythm in relationships.",
    loveStyle: "Love expression may follow a {polarity} rhythm. Express it at a pace another person can understand.",
    matchingPeople: "People who naturally bring {weak} may widen your perspective.",
    conflictPeople: "Conflict can arise with people whose {strong} energy is equally intense or overly similar.",
    longTermAdvice: "Long-term bonds benefit from shared habits that restore {weak}.",
    workStyle: "You may focus well in roles where {strong} can be used directly.",
    environment: "An environment that respects {day}, with both standards and autonomy, can fit well.",
    roleStrengths: "You can earn trust by turning {strong} into structure.",
    moneyMaking: "Money tends to follow when {strong} becomes consistent value.",
    moneyCaution: "When {weak} is neglected, be careful with emotional spending and vague promises.",
    doNow: "Choose one daily action that restores {weak}.",
    avoidNow: "Do not rush decisions by relying only on familiar {strong}.",
    relationshipGuidance: "In relationships, borrow {weak}: listen, confirm, and give space.",
    workGuidance: "At work, turn {strong} into a visible deliverable.",
    moneyGuidance: "With money, records and review help restore {weak}."
  });
}

function japaneseSentences() {
  return sentenceSet({
    theme: "{day}の日主が{strong}の気を通して表れています。今は方向を広げる前にリズムを整える時期です。",
    overall: "{day}を土台に{strong}が目立ち、{weak}を意識して補うほど安定します。",
    strong: "{element}の気が比較的強めです。うまく使うと推進力と再現性のある強みになります。",
    weak: "{element}の気は静かです。欠点ではなく、意識的に取り入れると均衡を作る場所です。",
    balance: "{weak}の小さな行動を実践し、{polarity}のリズムに偏りすぎないよう調整しましょう。",
    personality: "{day}と{polarity}の傾向が交わります。自分が納得できる動き方に安定感があります。",
    strengths: "{strong}は反復と蓄積で強みになります。方法を仕組みにすると力が出ます。",
    vulnerabilities: "{weak}は無理に押すより、小さな習慣で補うほうが合います。",
    thinking: "{day}の視点で情報を解釈しやすいです。早い答えより自分の基準が長く残ります。",
    action: "{polarity}が行動速度に影響します。始めることと確認することを組み合わせると安定します。",
    emotion: "感情は{day}の形で整理され、{polarity}のリズムで表現されます。まず名前を付けることが助けになります。",
    pastPattern: "{strong}が過去の慣れた選択を作ってきた可能性があります。強みを固定化しないことが大切です。",
    early: "初期気質には{day}の色があります。未知の場でも自分の基準を探したかもしれません。",
    relationshipPast: "関係では{polarity}のリズムが繰り返されやすいです。近さと距離の速度を観察しましょう。",
    workStudy: "仕事や学習では{strong}が入口になります。短期集中より再現できる構造が合います。",
    currentPhase: "現在は{strong}を使いながら{weak}を回復する段階です。",
    focus: "{weak}を日々の小さな行動で回復することに集中しましょう。",
    avoid: "{strong}を使いすぎると視野が狭くなります。慣れた方法だけに頼らないでください。",
    priority: "{area}では早い結論より、基準を立てて確認することが優先です。",
    yearFlow: "{year}年から{nextYear}年は、{strong}を現実的な成果に移す流れです。",
    threeYears: "{year}年から{threeYear}年は、{weak}を補う選択が長期の均衡を支えます。",
    luckTheme: "{start}-{end}歳の大運は{han}{ko}です。固定予測ではなく10年単位の環境リズムとして見てください。",
    timelineNow: "{strong}の強みを見える成果に整える時期です。",
    timelineThree: "{weak}の回復が次の選択を安定させます。",
    timelineLuck: "{pillar}は長期的な背景リズムとして働きます。",
    relationshipStyle: "{day}は関係の中で信頼できるリズムを求めます。",
    loveStyle: "愛情表現は{polarity}のリズムを帯びます。相手に伝わる速度が大切です。",
    matchingPeople: "{weak}を自然に補う人といると視野が広がります。",
    conflictPeople: "{strong}が似すぎたり強すぎたりする相手とは衝突しやすいです。",
    longTermAdvice: "長期関係では{weak}を一緒に回復する習慣が役立ちます。",
    workStyle: "{strong}を直接使える役割で集中しやすいです。",
    environment: "{day}が尊重され、基準と自律性が両方ある環境が合います。",
    roleStrengths: "{strong}を構造化する役割で信頼を得やすいです。",
    moneyMaking: "お金は{strong}を継続的な価値に変えると流れやすくなります。",
    moneyCaution: "{weak}が不足するときは感情的な支出や曖昧な約束に注意しましょう。",
    doNow: "今は{weak}を一日一回回復する行動を決めましょう。",
    avoidNow: "{strong}の慣れだけで急いで決めないようにしましょう。",
    relationshipGuidance: "関係では{weak}を借りて、聞く・確認する時間を持ちましょう。",
    workGuidance: "仕事では{strong}を見える成果物に整えましょう。",
    moneyGuidance: "お金では記録と確認が{weak}を補います。"
  });
}

function chineseSentences() {
  return sentenceSet({
    theme: "{day}日主正通过{strong}之气显现。当前主题是先整理节奏，再扩大方向。",
    overall: "此盘以{day}为基础，{strong}较明显；有意识补充{weak}时，整体更平衡。",
    strong: "{element}之气相对较强。善用时，会成为推动力和可重复的优势。",
    weak: "{element}之气相对安静。这不是缺陷，而是可以借力取得平衡的位置。",
    balance: "用小行动练习{weak}，同时避免{polarity}节奏过度主导。",
    personality: "{day}与{polarity}倾向交会。按自己能理解的方式行动时，会更稳定。",
    strengths: "{strong}通过重复和累积成为优势。把方法变成系统时，力量会更清楚。",
    vulnerabilities: "{weak}领域更适合用小习惯补充，而不是强行推进。",
    thinking: "你容易用{day}的视角解释信息。自己的标准比快速答案更持久。",
    action: "{polarity}影响行动速度。把开始和确认配对，会更平衡。",
    emotion: "情绪以{day}的方式整理，并以{polarity}节奏表达。先命名情绪会有帮助。",
    pastPattern: "{strong}可能塑造了过去熟悉的选择。关键是不要让优势变成固执。",
    early: "早期气质带有{day}的色彩，即使在陌生环境也会寻找自己的标准。",
    relationshipPast: "关系中容易重复{polarity}节奏。请观察靠近与保持距离的速度。",
    workStudy: "工作和学习中，{strong}是打开成果的入口。可重复结构比短期冲刺更合适。",
    currentPhase: "当前阶段是使用{strong}，同时恢复{weak}。",
    focus: "请专注于用每日小行动恢复{weak}，而不是一次性大改变。",
    avoid: "{strong}过度时视野会变窄。避免只重复熟悉的方法。",
    priority: "在{area}上，建立标准并确认，比快速下结论更重要。",
    yearFlow: "{year}到{nextYear}年，适合把{strong}转化为现实成果。",
    threeYears: "{year}到{threeYear}年，补充{weak}的选择会支持长期平衡。",
    luckTheme: "{start}-{end}岁的大运为{han}{ko}。请把它作为十年环境节奏，而非固定预测。",
    timelineNow: "把{strong}优势整理成可见结果。",
    timelineThree: "恢复{weak}会让之后的选择更稳。",
    timelineLuck: "{pillar}像长期背景节奏一样发挥作用。",
    relationshipStyle: "{day}在关系中寻找可信赖的节奏。",
    loveStyle: "爱的表达带有{polarity}节奏。用对方能理解的速度表达会更好。",
    matchingPeople: "能自然补充{weak}的人，会让你的视野更宽。",
    conflictPeople: "{strong}过于相似或过强的人，容易产生主导权冲突。",
    longTermAdvice: "长期关系需要一起恢复{weak}的习惯。",
    workStyle: "能直接使用{strong}的角色，容易带来专注。",
    environment: "尊重{day}，同时有标准与自主性的环境较适合。",
    roleStrengths: "把{strong}结构化的角色，容易获得信任。",
    moneyMaking: "当{strong}变成持续价值时，金钱更容易流入。",
    moneyCaution: "{weak}被忽略时，请注意情绪消费和模糊承诺。",
    doNow: "现在请选择一个每天恢复{weak}的小行动。",
    avoidNow: "不要只依赖熟悉的{strong}而急着决定。",
    relationshipGuidance: "关系中请借用{weak}：倾听、确认、留空间。",
    workGuidance: "工作中请把{strong}整理成可见成果。",
    moneyGuidance: "金钱方面，记录和复盘能补充{weak}。"
  });
}

function sentenceSet(templates) {
  const fill = (key, values) => renderTemplate(templates[key], values);
  return {
    theme: (day, strong) => fill("theme", { day, strong }),
    overall: (day, strong, weak) => fill("overall", { day, strong, weak }),
    strong: (element) => fill("strong", { element }),
    weak: (element) => fill("weak", { element }),
    balance: (weak, polarity) => fill("balance", { weak, polarity }),
    personality: (day, polarity) => fill("personality", { day, polarity }),
    strengths: (strong) => fill("strengths", { strong }),
    vulnerabilities: (weak) => fill("vulnerabilities", { weak }),
    thinking: (day) => fill("thinking", { day }),
    action: (polarity) => fill("action", { polarity }),
    emotion: (day, polarity) => fill("emotion", { day, polarity }),
    pastPattern: (strong) => fill("pastPattern", { strong }),
    early: (day) => fill("early", { day }),
    relationshipPast: (polarity) => fill("relationshipPast", { polarity }),
    workStudy: (strong) => fill("workStudy", { strong }),
    currentPhase: (strong, weak) => fill("currentPhase", { strong, weak }),
    focus: (weak) => fill("focus", { weak }),
    avoid: (strong) => fill("avoid", { strong }),
    priority: (area) => fill("priority", { area }),
    yearFlow: (year, nextYear, strong) => fill("yearFlow", { year, nextYear, strong }),
    threeYears: (year, threeYear, weak) => fill("threeYears", { year, threeYear, weak }),
    luckTheme: (han, ko, start, end) => fill("luckTheme", { han, ko, start, end }),
    timelineNow: (strong) => fill("timelineNow", { strong }),
    timelineThree: (weak) => fill("timelineThree", { weak }),
    timelineLuck: (pillar) => fill("timelineLuck", { pillar }),
    relationshipStyle: (day) => fill("relationshipStyle", { day }),
    loveStyle: (polarity) => fill("loveStyle", { polarity }),
    matchingPeople: (weak) => fill("matchingPeople", { weak }),
    conflictPeople: (strong) => fill("conflictPeople", { strong }),
    longTermAdvice: (weak) => fill("longTermAdvice", { weak }),
    workStyle: (strong) => fill("workStyle", { strong }),
    environment: (day) => fill("environment", { day }),
    roleStrengths: (strong) => fill("roleStrengths", { strong }),
    moneyMaking: (strong) => fill("moneyMaking", { strong }),
    moneyCaution: (weak) => fill("moneyCaution", { weak }),
    doNow: (weak) => fill("doNow", { weak }),
    avoidNow: (strong) => fill("avoidNow", { strong }),
    relationshipGuidance: (weak) => fill("relationshipGuidance", { weak }),
    workGuidance: (strong) => fill("workGuidance", { strong }),
    moneyGuidance: (weak) => fill("moneyGuidance", { weak })
  };
}

function renderTemplate(template, values) {
  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{${key}}`, value ?? "");
  }, template);
}

function renderMeters(counts, prefix) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return `
    <div class="meter-list">
      ${Object.entries(counts).map(([key, value]) => `
        <div class="meter-row">
          <strong>${escapeHtml(t(`${prefix}.${key}`))}</strong>
          <span class="meter-track"><span class="meter-fill" style="width: ${(value / total) * 100}%"></span></span>
          <span>${value}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function metaItem(label, value, note = "") {
  return `
    <div class="meta-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `;
}

document.getElementById("shareButton").addEventListener("click", async () => {
  const shareUrl = window.location.href;
  const title = document.title;
  if (navigator.share) {
    try {
      await navigator.share({ title, url: shareUrl });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyText(shareUrl);
  showToast(t("share.copied"));
});

document.getElementById("confirmDeleteButton").addEventListener("click", async () => {
  deleteError.textContent = "";
  const button = document.getElementById("confirmDeleteButton");
  button.disabled = true;
  button.textContent = t("common.loading");
  try {
    await deleteResult(currentSlug, deletePassword.value);
    showToast(t("delete.success"));
    window.setTimeout(() => {
      window.location.href = `index.html?lang=${getLanguage()}`;
    }, 800);
  } catch (error) {
    deleteError.textContent = error instanceof StorageError && error.code === "INVALID_PASSWORD" ? t("delete.invalid") : t("common.error");
  } finally {
    button.disabled = false;
    button.textContent = t("delete.action");
  }
});

deletePassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("confirmDeleteButton").click();
  }
});

deleteModal.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  deletePassword.value = "";
  deleteError.textContent = "";
});

function showNotFound() {
  resultRoot.hidden = true;
  notFoundState.hidden = false;
  resultIntro.textContent = t("result.notFoundBody");
}

function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add("modal-open");
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
