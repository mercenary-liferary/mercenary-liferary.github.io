export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
export const YIN_YANG = {
  YANG: "yang",
  YIN: "yin"
};

export const HEAVENLY_STEMS = [
  { index: 0, han: "甲", ko: "갑", element: "wood", yinYang: "yang" },
  { index: 1, han: "乙", ko: "을", element: "wood", yinYang: "yin" },
  { index: 2, han: "丙", ko: "병", element: "fire", yinYang: "yang" },
  { index: 3, han: "丁", ko: "정", element: "fire", yinYang: "yin" },
  { index: 4, han: "戊", ko: "무", element: "earth", yinYang: "yang" },
  { index: 5, han: "己", ko: "기", element: "earth", yinYang: "yin" },
  { index: 6, han: "庚", ko: "경", element: "metal", yinYang: "yang" },
  { index: 7, han: "辛", ko: "신", element: "metal", yinYang: "yin" },
  { index: 8, han: "壬", ko: "임", element: "water", yinYang: "yang" },
  { index: 9, han: "癸", ko: "계", element: "water", yinYang: "yin" }
];

export const EARTHLY_BRANCHES = [
  { index: 0, key: "zi", animalKey: "rat", han: "子", ko: "자", element: "water", yinYang: "yang", season: "winter" },
  { index: 1, key: "chou", animalKey: "ox", han: "丑", ko: "축", element: "earth", yinYang: "yin", season: "winter" },
  { index: 2, key: "yin", animalKey: "tiger", han: "寅", ko: "인", element: "wood", yinYang: "yang", season: "spring" },
  { index: 3, key: "mao", animalKey: "rabbit", han: "卯", ko: "묘", element: "wood", yinYang: "yin", season: "spring" },
  { index: 4, key: "chen", animalKey: "dragon", han: "辰", ko: "진", element: "earth", yinYang: "yang", season: "spring" },
  { index: 5, key: "si", animalKey: "snake", han: "巳", ko: "사", element: "fire", yinYang: "yin", season: "summer" },
  { index: 6, key: "wu", animalKey: "horse", han: "午", ko: "오", element: "fire", yinYang: "yang", season: "summer" },
  { index: 7, key: "wei", animalKey: "goat", han: "未", ko: "미", element: "earth", yinYang: "yin", season: "summer" },
  { index: 8, key: "shen", animalKey: "monkey", han: "申", ko: "신", element: "metal", yinYang: "yang", season: "autumn" },
  { index: 9, key: "you", animalKey: "rooster", han: "酉", ko: "유", element: "metal", yinYang: "yin", season: "autumn" },
  { index: 10, key: "xu", animalKey: "dog", han: "戌", ko: "술", element: "earth", yinYang: "yang", season: "autumn" },
  { index: 11, key: "hai", animalKey: "pig", han: "亥", ko: "해", element: "water", yinYang: "yin", season: "winter" }
];

export const BRANCH_TIME_RANGES = [
  // TODO: Add school-specific night-rat-hour handling: 야자시/조자시,
  // whether 23:00 belongs to the current or next day, and true solar time.
  { branchIndex: 0, start: "23:00", end: "00:59", representativeHour: 23 },
  { branchIndex: 1, start: "01:00", end: "02:59", representativeHour: 1 },
  { branchIndex: 2, start: "03:00", end: "04:59", representativeHour: 3 },
  { branchIndex: 3, start: "05:00", end: "06:59", representativeHour: 5 },
  { branchIndex: 4, start: "07:00", end: "08:59", representativeHour: 7 },
  { branchIndex: 5, start: "09:00", end: "10:59", representativeHour: 9 },
  { branchIndex: 6, start: "11:00", end: "12:59", representativeHour: 11 },
  { branchIndex: 7, start: "13:00", end: "14:59", representativeHour: 13 },
  { branchIndex: 8, start: "15:00", end: "16:59", representativeHour: 15 },
  { branchIndex: 9, start: "17:00", end: "18:59", representativeHour: 17 },
  { branchIndex: 10, start: "19:00", end: "20:59", representativeHour: 19 },
  { branchIndex: 11, start: "21:00", end: "22:59", representativeHour: 21 }
];

// TODO: Country-level timezone is only an MVP approximation. Accurate Saju can
// require birth city, longitude, historical timezone/DST rules, and true solar
// time correction.
export const COUNTRY_TIMEZONES = [
  names("KR", "Asia/Seoul", 540, "대한민국", "South Korea", "韓国", "韩国"),
  names("JP", "Asia/Tokyo", 540, "일본", "Japan", "日本", "日本"),
  names("CN", "Asia/Shanghai", 480, "중국", "China", "中国", "中国"),
  names("TW", "Asia/Taipei", 480, "대만", "Taiwan", "台湾", "台湾"),
  names("HK", "Asia/Hong_Kong", 480, "홍콩", "Hong Kong", "香港", "香港"),
  names("SG", "Asia/Singapore", 480, "싱가포르", "Singapore", "シンガポール", "新加坡"),
  names("VN", "Asia/Ho_Chi_Minh", 420, "베트남", "Vietnam", "ベトナム", "越南"),
  names("TH", "Asia/Bangkok", 420, "태국", "Thailand", "タイ", "泰国"),
  names("MY", "Asia/Kuala_Lumpur", 480, "말레이시아", "Malaysia", "マレーシア", "马来西亚"),
  names("ID", "Asia/Jakarta", 420, "인도네시아", "Indonesia", "インドネシア", "印度尼西亚"),
  names("PH", "Asia/Manila", 480, "필리핀", "Philippines", "フィリピン", "菲律宾"),
  names("IN", "Asia/Kolkata", 330, "인도", "India", "インド", "印度"),
  names("AU", "Australia/Sydney", 600, "호주", "Australia", "オーストラリア", "澳大利亚"),
  names("US", "America/New_York", -300, "미국", "United States", "米国", "美国"),
  names("CA", "America/Toronto", -300, "캐나다", "Canada", "カナダ", "加拿大"),
  names("GB", "Europe/London", 0, "영국", "United Kingdom", "英国", "英国"),
  names("FR", "Europe/Paris", 60, "프랑스", "France", "フランス", "法国"),
  names("DE", "Europe/Berlin", 60, "독일", "Germany", "ドイツ", "德国")
];

export function getStem(index) {
  return HEAVENLY_STEMS[mod(index, 10)];
}

export function getBranch(index) {
  return EARTHLY_BRANCHES[mod(index, 12)];
}

export function getBranchByKey(key) {
  return EARTHLY_BRANCHES.find((branch) => branch.key === key);
}

export function getBranchTime(branchIndex) {
  return BRANCH_TIME_RANGES.find((range) => range.branchIndex === branchIndex);
}

export function getCountry(code) {
  return COUNTRY_TIMEZONES.find((country) => country.code === code) || COUNTRY_TIMEZONES[0];
}

export function getCountryName(code, lang = "en") {
  const country = getCountry(code);
  return country.names[lang] || country.names.en;
}

export function formatPillar(stemIndex, branchIndex) {
  const stem = getStem(stemIndex);
  const branch = getBranch(branchIndex);
  return {
    stemIndex: stem.index,
    branchIndex: branch.index,
    stem,
    branch,
    han: `${stem.han}${branch.han}`,
    ko: `${stem.ko}${branch.ko}`,
    element: {
      stem: stem.element,
      branch: branch.element
    },
    yinYang: {
      stem: stem.yinYang,
      branch: branch.yinYang
    }
  };
}

export function mod(n, m) {
  return ((n % m) + m) % m;
}

function names(code, timezone, offsetMinutes, ko, en, ja, zh) {
  return {
    code,
    timezone,
    offsetMinutes,
    names: { ko, en, ja, zh }
  };
}
