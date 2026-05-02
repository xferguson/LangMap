import type { Language } from "../types";

export const LANGUAGES_FIXTURE: Language[] = [
  {
    id: "spa",
    name: "Spanish",
    endonym: "Español",
    speakers: { l1: 486_000_000, l2: 75_000_000 },
    regions: ["ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "PR", "UY", "GQ"],
  },
  {
    id: "eng",
    name: "English",
    endonym: "English",
    speakers: { l1: 380_000_000, l2: 1_077_000_000 },
    regions: ["US", "GB", "CA", "AU", "NZ", "IE", "ZA", "IN", "PK", "NG", "PH", "SG", "JM", "KE", "BS", "BB", "BZ", "BW", "DM", "SZ", "GM", "GH", "GD", "GY", "LS", "LR", "MW", "MT", "MU", "FM", "NA", "PG", "RW", "KN", "LC", "VC", "WS", "SC", "SL", "SB", "SS", "TZ", "TO", "TT", "UG", "VU", "ZM", "ZW", "MY", "LK", "IM", "JE", "GG"],
  },
  {
    id: "fra",
    name: "French",
    endonym: "Français",
    speakers: { l1: 81_000_000, l2: 229_000_000 },
    regions: ["FR", "CA", "BE", "CH", "LU", "MC", "SN", "CI", "CD", "CM", "MG", "HT", "BJ", "BF", "BI", "KM", "DJ", "GA", "GN", "ML", "NE", "CG", "RW", "TD", "TG", "VU", "SC"],
  },
  {
    id: "cat",
    name: "Catalan",
    endonym: "Català",
    speakers: { l1: 4_100_000, l2: 5_000_000 },
    regions: ["ES-CT", "ES-IB", "ES-VC", "AD"],
  },
  {
    id: "deu",
    name: "German",
    endonym: "Deutsch",
    speakers: { l1: 95_000_000, l2: 80_000_000 },
    regions: ["DE", "AT", "CH", "LI", "LU", "BE"],
  },
  {
    id: "por",
    name: "Portuguese",
    endonym: "Português",
    speakers: { l1: 232_000_000, l2: 25_000_000 },
    regions: ["PT", "BR", "AO", "MZ", "CV", "GW", "ST", "TL", "MO"],
  },
  {
    id: "ita",
    name: "Italian",
    endonym: "Italiano",
    speakers: { l1: 65_000_000, l2: 3_000_000 },
    regions: ["IT", "CH", "SM", "VA"],
  },
  {
    id: "cmn",
    name: "Mandarin",
    endonym: "普通话",
    speakers: { l1: 939_000_000, l2: 199_000_000 },
    regions: ["CN", "TW", "SG"],
  },
  {
    id: "ara",
    name: "Arabic",
    endonym: "العربية",
    speakers: { l1: 313_000_000, l2: 274_000_000 },
    regions: ["EG", "SA", "DZ", "MA", "IQ", "SD", "SY", "TN", "JO", "LY", "LB", "PS", "OM", "KW", "AE", "QA", "BH", "YE", "IL", "SO", "MR", "DJ", "KM", "TD", "EH"],
  },
  {
    id: "jpn",
    name: "Japanese",
    endonym: "日本語",
    speakers: { l1: 125_000_000, l2: 1_000_000 },
    regions: ["JP"],
  },
];
