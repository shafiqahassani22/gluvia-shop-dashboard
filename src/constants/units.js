export const units = [
  "tin",
  "can",
  "dozen",
  "pair",
  "pack",
  "sheet",
  "meter",
  "piece",
  "bundle",
  "carton",
];

const legacyUnits = {
  حلب: "tin",
  Tin: "tin",
  "حلب / Tin": "tin",
  قوطی: "can",
  Can: "can",
  "قوطی / Can": "can",
  درجن: "dozen",
  Dozen: "dozen",
  "درجن / Dozen": "dozen",
  جفت: "pair",
  Pair: "pair",
  "جفت / Pair": "pair",
  بسته: "pack",
  Pack: "pack",
  "بسته / Pack": "pack",
  تخته: "sheet",
  Sheet: "sheet",
  "تخته / Sheet": "sheet",
  متر: "meter",
  Meter: "meter",
  "متر / Meter": "meter",
  عدد: "piece",
  Piece: "piece",
  "عدد / Piece": "piece",
  بندل: "bundle",
  Bundle: "bundle",
  "بندل / Bundle": "bundle",
  کارتن: "carton",
  Carton: "carton",
  "کارتن / Carton": "carton",
};

export function normalizeUnit(value) {
  const text = String(value ?? "").trim();
  return legacyUnits[text] ?? text;
}

export function unitLabel(unit, t) {
  if (!unit) return "";
  if (!units.includes(unit)) return unit;
  return t(`units.${unit}`);
}
