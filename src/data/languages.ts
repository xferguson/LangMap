// TODO(v1.3): grow toward 250
import type { Language } from "../types";
import { LANGUAGES_FIXTURE } from "./languages.fixture";
import { REGIONAL_LANGUAGES } from "./regional-languages";

// Additional widely-spoken languages, beyond the v1.1 fixture and the
// curated regional list. Speaker counts cite Wikipedia / Ethnologue.
const ADDITIONAL: Language[] = [
  { id: "rus", name: "Russian", endonym: "Русский", speakers: { l1: 154_000_000, l2: 104_000_000 }, regions: ["RU", "BY", "KZ", "KG", "UA", "MD", "EE", "LV", "LT"] },
  { id: "hin", name: "Hindi", endonym: "हिन्दी", speakers: { l1: 345_000_000, l2: 270_000_000 }, regions: ["IN"] },
  { id: "ben", name: "Bengali", endonym: "বাংলা", speakers: { l1: 234_000_000, l2: 39_000_000 }, regions: ["BD", "IN"] },
  { id: "urd", name: "Urdu", endonym: "اردو", speakers: { l1: 70_000_000, l2: 162_000_000 }, regions: ["PK", "IN"] },
  { id: "pan", name: "Punjabi", endonym: "ਪੰਜਾਬੀ", speakers: { l1: 113_000_000, l2: 1_000_000 }, regions: ["PK", "IN"] },
  { id: "tam", name: "Tamil", endonym: "தமிழ்", speakers: { l1: 79_000_000, l2: 8_000_000 }, regions: ["IN", "LK", "SG", "MY"] },
  { id: "tel", name: "Telugu", endonym: "తెలుగు", speakers: { l1: 83_000_000, l2: 13_000_000 }, regions: ["IN"] },
  { id: "mar", name: "Marathi", endonym: "मराठी", speakers: { l1: 83_000_000, l2: 16_000_000 }, regions: ["IN"] },
  { id: "guj", name: "Gujarati", endonym: "ગુજરાતી", speakers: { l1: 57_000_000, l2: 5_000_000 }, regions: ["IN"] },
  { id: "kan", name: "Kannada", endonym: "ಕನ್ನಡ", speakers: { l1: 44_000_000, l2: 15_000_000 }, regions: ["IN"] },
  { id: "mal", name: "Malayalam", endonym: "മലയാളം", speakers: { l1: 35_000_000, l2: 3_000_000 }, regions: ["IN"] },
  { id: "ori", name: "Odia", endonym: "ଓଡ଼ିଆ", speakers: { l1: 35_000_000, l2: 5_000_000 }, regions: ["IN"] },
  { id: "asm", name: "Assamese", endonym: "অসমীয়া", speakers: { l1: 15_000_000, l2: 8_000_000 }, regions: ["IN"] },
  { id: "nep", name: "Nepali", endonym: "नेपाली", speakers: { l1: 16_000_000, l2: 9_000_000 }, regions: ["NP", "IN"] },
  { id: "sin", name: "Sinhala", endonym: "සිංහල", speakers: { l1: 17_000_000, l2: 3_000_000 }, regions: ["LK"] },
  { id: "tha", name: "Thai", endonym: "ภาษาไทย", speakers: { l1: 36_000_000, l2: 28_000_000 }, regions: ["TH"] },
  { id: "vie", name: "Vietnamese", endonym: "Tiếng Việt", speakers: { l1: 76_000_000, l2: 9_000_000 }, regions: ["VN"] },
  { id: "ind", name: "Indonesian", endonym: "Bahasa Indonesia", speakers: { l1: 43_000_000, l2: 156_000_000 }, regions: ["ID"] },
  { id: "msa", name: "Malay", endonym: "Bahasa Melayu", speakers: { l1: 19_000_000, l2: 60_000_000 }, regions: ["MY", "BN", "SG", "ID"] },
  { id: "tgl", name: "Tagalog", endonym: "Tagalog", speakers: { l1: 28_000_000, l2: 45_000_000 }, regions: ["PH"] },
  { id: "kor", name: "Korean", endonym: "한국어", speakers: { l1: 81_000_000, l2: 1_000_000 }, regions: ["KR", "KP"] },
  { id: "yue", name: "Cantonese", endonym: "粵語", speakers: { l1: 86_000_000, l2: 1_000_000 }, regions: ["HK", "MO", "CN"] },
  { id: "wuu", name: "Wu Chinese", endonym: "吳語", speakers: { l1: 81_000_000, l2: 1_000_000 }, regions: ["CN"] },
  { id: "mya", name: "Burmese", endonym: "မြန်မာစာ", speakers: { l1: 33_000_000, l2: 10_000_000 }, regions: ["MM"] },
  { id: "khm", name: "Khmer", endonym: "ខ្មែរ", speakers: { l1: 17_000_000, l2: 1_000_000 }, regions: ["KH"] },
  { id: "lao", name: "Lao", endonym: "ພາສາລາວ", speakers: { l1: 30_000_000, l2: 1_000_000 }, regions: ["LA", "TH"] },
  { id: "mon", name: "Mongolian", endonym: "Монгол", speakers: { l1: 5_700_000, l2: 1_000_000 }, regions: ["MN", "CN"] },
  { id: "kaz", name: "Kazakh", endonym: "Қазақ тілі", speakers: { l1: 13_200_000, l2: 1_000_000 }, regions: ["KZ", "CN"] },
  { id: "uzb", name: "Uzbek", endonym: "Oʻzbekcha", speakers: { l1: 27_000_000, l2: 5_000_000 }, regions: ["UZ", "AF", "TJ"] },
  { id: "kir", name: "Kyrgyz", endonym: "Кыргызча", speakers: { l1: 5_100_000, l2: 1_000_000 }, regions: ["KG"] },
  { id: "tuk", name: "Turkmen", endonym: "Türkmen dili", speakers: { l1: 7_000_000, l2: 1_000_000 }, regions: ["TM"] },
  { id: "tgk", name: "Tajik", endonym: "Тоҷикӣ", speakers: { l1: 8_100_000, l2: 1_000_000 }, regions: ["TJ"] },
  { id: "aze", name: "Azerbaijani", endonym: "Azərbaycan dili", speakers: { l1: 23_000_000, l2: 4_000_000 }, regions: ["AZ", "IR"] },
  { id: "tur", name: "Turkish", endonym: "Türkçe", speakers: { l1: 80_000_000, l2: 5_000_000 }, regions: ["TR", "CY"] },
  { id: "kur", name: "Kurdish", endonym: "Kurdî", speakers: { l1: 26_000_000, l2: 4_000_000 }, regions: ["TR", "IQ", "IR", "SY"] },
  { id: "fas", name: "Persian", endonym: "فارسی", speakers: { l1: 70_000_000, l2: 50_000_000 }, regions: ["IR", "AF", "TJ"] },
  { id: "pus", name: "Pashto", endonym: "پښتو", speakers: { l1: 40_000_000, l2: 10_000_000 }, regions: ["AF", "PK"] },
  { id: "heb", name: "Hebrew", endonym: "עברית", speakers: { l1: 5_300_000, l2: 4_000_000 }, regions: ["IL"] },
  { id: "ell", name: "Greek", endonym: "Ελληνικά", speakers: { l1: 13_500_000, l2: 1_000_000 }, regions: ["GR", "CY"] },
  { id: "pol", name: "Polish", endonym: "Polski", speakers: { l1: 40_000_000, l2: 5_000_000 }, regions: ["PL"] },
  { id: "ces", name: "Czech", endonym: "Čeština", speakers: { l1: 10_700_000, l2: 1_000_000 }, regions: ["CZ"] },
  { id: "slk", name: "Slovak", endonym: "Slovenčina", speakers: { l1: 5_200_000, l2: 2_000_000 }, regions: ["SK"] },
  { id: "hun", name: "Hungarian", endonym: "Magyar", speakers: { l1: 13_000_000, l2: 1_000_000 }, regions: ["HU", "RO", "RS"] },
  { id: "ron", name: "Romanian", endonym: "Română", speakers: { l1: 24_000_000, l2: 4_000_000 }, regions: ["RO", "MD"] },
  { id: "bul", name: "Bulgarian", endonym: "Български", speakers: { l1: 8_000_000, l2: 1_000_000 }, regions: ["BG"] },
  { id: "srp", name: "Serbian", endonym: "Српски", speakers: { l1: 8_000_000, l2: 1_000_000 }, regions: ["RS", "BA", "ME"] },
  { id: "hrv", name: "Croatian", endonym: "Hrvatski", speakers: { l1: 5_600_000, l2: 1_000_000 }, regions: ["HR", "BA"] },
  { id: "bos", name: "Bosnian", endonym: "Bosanski", speakers: { l1: 2_500_000, l2: 1_000_000 }, regions: ["BA"] },
  { id: "slv", name: "Slovenian", endonym: "Slovenščina", speakers: { l1: 2_500_000, l2: 1_000_000 }, regions: ["SI"] },
  { id: "mkd", name: "Macedonian", endonym: "Македонски", speakers: { l1: 1_800_000, l2: 500_000 }, regions: ["MK"] },
  { id: "sqi", name: "Albanian", endonym: "Shqip", speakers: { l1: 7_500_000, l2: 1_000_000 }, regions: ["AL", "XK", "MK"] },
  { id: "ukr", name: "Ukrainian", endonym: "Українська", speakers: { l1: 27_000_000, l2: 6_000_000 }, regions: ["UA"] },
  { id: "bel", name: "Belarusian", endonym: "Беларуская", speakers: { l1: 5_100_000, l2: 1_000_000 }, regions: ["BY"] },
  { id: "lit", name: "Lithuanian", endonym: "Lietuvių", speakers: { l1: 3_000_000, l2: 200_000 }, regions: ["LT"] },
  { id: "lav", name: "Latvian", endonym: "Latviešu", speakers: { l1: 1_750_000, l2: 100_000 }, regions: ["LV"] },
  { id: "est", name: "Estonian", endonym: "Eesti", speakers: { l1: 1_100_000, l2: 200_000 }, regions: ["EE"] },
  { id: "fin", name: "Finnish", endonym: "Suomi", speakers: { l1: 5_400_000, l2: 500_000 }, regions: ["FI"] },
  { id: "swe", name: "Swedish", endonym: "Svenska", speakers: { l1: 10_000_000, l2: 3_300_000 }, regions: ["SE", "FI"] },
  { id: "nor", name: "Norwegian", endonym: "Norsk", speakers: { l1: 5_300_000, l2: 100_000 }, regions: ["NO"] },
  { id: "dan", name: "Danish", endonym: "Dansk", speakers: { l1: 5_500_000, l2: 300_000 }, regions: ["DK", "GL", "FO"] },
  { id: "isl", name: "Icelandic", endonym: "Íslenska", speakers: { l1: 320_000, l2: 50_000 }, regions: ["IS"] },
  { id: "nld", name: "Dutch", endonym: "Nederlands", speakers: { l1: 25_000_000, l2: 5_000_000 }, regions: ["NL", "BE", "SR"] },
  { id: "afr", name: "Afrikaans", endonym: "Afrikaans", speakers: { l1: 7_200_000, l2: 10_000_000 }, regions: ["ZA", "NA"] },
  { id: "mlt", name: "Maltese", endonym: "Malti", speakers: { l1: 520_000, l2: 100_000 }, regions: ["MT"] },
  { id: "kat", name: "Georgian", endonym: "ქართული", speakers: { l1: 3_700_000, l2: 1_000_000 }, regions: ["GE"] },
  { id: "hye", name: "Armenian", endonym: "Հայերեն", speakers: { l1: 6_700_000, l2: 1_000_000 }, regions: ["AM"] },
  { id: "mlg", name: "Malagasy", endonym: "Malagasy", speakers: { l1: 25_000_000, l2: 1_000_000 }, regions: ["MG"] },
  { id: "rar", name: "Rarotongan", endonym: "Māori Kūki ʻĀirani", speakers: { l1: 13_000, l2: 5_000 }, regions: ["NZ"] },
  { id: "smo", name: "Samoan", endonym: "Gagana Sāmoa", speakers: { l1: 510_000, l2: 100_000 }, regions: ["WS", "AS"] },
  { id: "ton", name: "Tongan", endonym: "Lea fakatonga", speakers: { l1: 187_000, l2: 50_000 }, regions: ["TO"] },
  { id: "fij", name: "Fijian", endonym: "Vosa Vakaviti", speakers: { l1: 350_000, l2: 200_000 }, regions: ["FJ"] },
  { id: "epo", name: "Esperanto", endonym: "Esperanto", speakers: { l1: 1_000, l2: 2_000_000 }, regions: [] },
  { id: "div", name: "Dhivehi", endonym: "ދިވެހި", speakers: { l1: 340_000, l2: 50_000 }, regions: ["MV"] },
  { id: "dzo", name: "Dzongkha", endonym: "རྫོང་ཁ", speakers: { l1: 170_000, l2: 470_000 }, regions: ["BT"] },
];

function dedupById(arr: Language[]): Language[] {
  const map = new Map<string, Language>();
  for (const l of arr) {
    if (!map.has(l.id)) map.set(l.id, l);
  }
  return [...map.values()];
}

export const LANGUAGES: Language[] = dedupById([
  ...LANGUAGES_FIXTURE,
  ...REGIONAL_LANGUAGES,
  ...ADDITIONAL,
]).sort((a, b) => a.name.localeCompare(b.name));
