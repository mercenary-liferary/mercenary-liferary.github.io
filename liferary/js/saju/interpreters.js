const ELEMENT_READING = {
  ko: {
    wood: "목의 기운은 성장, 계획, 방향 감각을 상징합니다. 스스로의 리듬을 키우며 장기적인 관점을 세울 때 편안해질 수 있습니다.",
    fire: "화의 기운은 표현, 명료함, 따뜻한 반응성을 상징합니다. 생각을 말과 행동으로 밝히는 과정에서 흐름이 생길 수 있습니다.",
    earth: "토의 기운은 안정, 조율, 현실 감각을 상징합니다. 여러 입장을 담아내되 자신의 기준을 잃지 않는 것이 중요할 수 있습니다.",
    metal: "금의 기운은 정리, 판단, 품질 감각을 상징합니다. 덜어낼 것과 남길 것을 구분할 때 장점이 살아날 수 있습니다.",
    water: "수의 기운은 관찰, 학습, 유연한 적응을 상징합니다. 충분히 숙고한 뒤 움직일 때 깊이가 드러날 수 있습니다."
  },
  en: {
    wood: "Wood suggests growth, planning, and a sense of direction. You may feel steadier when you give an idea enough time to mature.",
    fire: "Fire suggests expression, clarity, and warm responsiveness. Momentum may arrive when thoughts become visible through words or action.",
    earth: "Earth suggests steadiness, mediation, and practical grounding. Holding many perspectives can be a gift when your own center stays clear.",
    metal: "Metal suggests discernment, refinement, and standards. Your strength may show when you decide what to keep and what to release.",
    water: "Water suggests observation, learning, and adaptive depth. Reflection before action may be part of your natural rhythm."
  },
  ja: {
    wood: "木の気は成長、計画、方向感覚を示します。考えを育てる時間を持つほど、落ち着いた力が出やすいでしょう。",
    fire: "火の気は表現、明快さ、温かい反応性を示します。思考を言葉や行動にすることで流れが生まれやすいでしょう。",
    earth: "土の気は安定、調整、現実感覚を示します。多くの立場を受け止めながら、自分の中心を保つことが鍵になります。",
    metal: "金の気は整理、判断、品質感覚を示します。残すものと手放すものを見分けると強みが出やすいでしょう。",
    water: "水の気は観察、学習、柔軟な適応を示します。動く前に深く考えることが自然なリズムかもしれません。"
  },
  zh: {
    wood: "木的气象征成长、规划与方向感。给想法足够的生长时间，可能会让你更稳定。",
    fire: "火的气象征表达、清晰与温暖的回应。把想法化为语言或行动时，流动感可能更明显。",
    earth: "土的气象征稳定、协调与现实感。能容纳多方观点，同时也需要保留自己的中心。",
    metal: "金的气象征辨别、整理与品质感。分清应保留和应放下的部分时，优势可能更清楚。",
    water: "水的气象征观察、学习与弹性。行动前的沉思，可能是你自然的节奏。"
  }
};

const BALANCE_READING = {
  ko: {
    yin: "음의 비중이 높아 섬세한 관찰과 내면의 정리가 두드러질 수 있습니다. 표현을 너무 늦추지 않는 연습이 균형에 도움이 됩니다.",
    yang: "양의 비중이 높아 추진과 반응이 빠르게 나타날 수 있습니다. 멈추어 확인하는 시간을 두면 선택이 더 단단해질 수 있습니다.",
    balanced: "음양의 균형이 비교적 고르게 나타납니다. 상황에 따라 수용과 추진을 오가는 유연성이 장점이 될 수 있습니다."
  },
  en: {
    yin: "A stronger Yin count may point to careful observation and inner processing. Balance may come from practicing timely expression.",
    yang: "A stronger Yang count may point to direct momentum and quick response. Balance may come from pausing long enough to confirm direction.",
    balanced: "Yin and Yang are relatively even. Flexibility between receiving and initiating may be one of the chart's useful themes."
  },
  ja: {
    yin: "陰が強めで、繊細な観察や内面整理が目立つかもしれません。適切なタイミングで表現する練習がバランスになります。",
    yang: "陽が強めで、推進力や反応の速さが出やすいかもしれません。立ち止まって方向を確認すると選択が安定します。",
    balanced: "陰陽は比較的均衡しています。受け取る力と始める力を状況に応じて切り替えられる柔軟性がテーマです。"
  },
  zh: {
    yin: "阴的比例较高，可能显示细致观察与内在整理。适时表达会有助于平衡。",
    yang: "阳的比例较高，可能显示直接的推动力与快速回应。给自己一点停顿确认方向，会让选择更稳。",
    balanced: "阴阳相对均衡。根据情境在接纳与主动之间切换，可能是这个命盘的有用主题。"
  }
};

export function createReadings(result, lang = "en") {
  const language = ELEMENT_READING[lang] ? lang : "en";
  const dayElement = result.pillars.day.stem.element;
  const strongestElement = getStrongestElement(result.fiveElements);
  const weakestElement = getWeakestElement(result.fiveElements);
  const yinYangMode = getYinYangMode(result.yinYang);

  return [
    {
      key: "personality",
      text: ELEMENT_READING[language][dayElement]
    },
    {
      key: "theme",
      text: themeReading(language, dayElement, strongestElement)
    },
    {
      key: "social",
      text: BALANCE_READING[language][yinYangMode]
    },
    {
      key: "work",
      text: workReading(language, strongestElement)
    },
    {
      key: "balance",
      text: balanceReading(language, weakestElement)
    }
  ];
}

function getStrongestElement(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "earth";
}

function getWeakestElement(counts) {
  return Object.entries(counts).sort((a, b) => a[1] - b[1])[0]?.[0] || "earth";
}

function getYinYangMode(counts) {
  if (counts.yin === counts.yang) return "balanced";
  return counts.yin > counts.yang ? "yin" : "yang";
}

function themeReading(lang, dayElement, strongestElement) {
  const text = {
    ko: `일간의 ${elementName(lang, dayElement)} 기운과 두드러진 ${elementName(lang, strongestElement)} 기운이 만나는 지점이 이 결과의 간단한 삶의 주제로 보입니다. 한 가지 결론보다 반복되는 선택의 패턴을 관찰해 보세요.`,
    en: `The meeting point between the Day Master ${elementName(lang, dayElement)} and the prominent ${elementName(lang, strongestElement)} energy can be read as a simple life theme. Notice the pattern of repeated choices rather than treating it as a fixed conclusion.`,
    ja: `日主の${elementName(lang, dayElement)}と目立つ${elementName(lang, strongestElement)}の気が交わるところを、簡単な人生テーマとして読めます。固定的な結論ではなく、繰り返される選択の傾向として眺めてください。`,
    zh: `日主的${elementName(lang, dayElement)}与较明显的${elementName(lang, strongestElement)}之气交会处，可作为一个简单的生活主题来阅读。请把它看作反复选择的模式，而不是固定结论。`
  };
  return text[lang] || text.en;
}

function workReading(lang, element) {
  const text = {
    ko: `현재 차트에서 ${elementName(lang, element)} 기운이 비교적 두드러집니다. 이것은 특정 직업을 단정하기보다, 일하는 방식에서 반복적으로 나타나는 관심과 리듬을 살펴보라는 신호로 읽을 수 있습니다.`,
    en: `${elementName(lang, element)} is relatively prominent in this chart. Rather than naming a fixed career, this points to a recurring rhythm in how attention and effort may gather.`,
    ja: `このチャートでは${elementName(lang, element)}の気が比較的目立ちます。特定の職業を断定するより、関心や努力が集まりやすいリズムとして読めます。`,
    zh: `此命盘中${elementName(lang, element)}的气相对明显。与其断定某种职业，不如把它看作注意力与行动方式反复出现的节奏。`
  };
  return text[lang] || text.en;
}

function balanceReading(lang, element) {
  const text = {
    ko: `${elementName(lang, element)} 기운은 상대적으로 적게 나타납니다. 부족함으로 단정하기보다, 의식적으로 빌려오면 균형감이 좋아질 수 있는 자기성찰 지점으로 볼 수 있습니다.`,
    en: `${elementName(lang, element)} appears less frequently. This is not a flaw; it can be read as a self-reflection point that may bring balance when practiced intentionally.`,
    ja: `${elementName(lang, element)}の気は相対的に少なめです。欠点ではなく、意識的に取り入れると均衡を助ける内省点として読めます。`,
    zh: `${elementName(lang, element)}的气出现较少。这不是缺陷，而是一个可以有意识练习、帮助取得平衡的自我观察点。`
  };
  return text[lang] || text.en;
}

function elementName(lang, element) {
  const names = {
    ko: { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" },
    en: { wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water" },
    ja: { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" },
    zh: { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" }
  };
  return names[lang]?.[element] || names.en[element];
}
