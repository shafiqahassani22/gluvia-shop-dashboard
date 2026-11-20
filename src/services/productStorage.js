import { normalizeCategory, normalizeWarehouse } from "../constants/catalog";
import { normalizeUnit } from "../constants/units";

export const PRODUCT_STORAGE_KEY = "gluvia.products";
export const PRODUCTS_CHANGED_EVENT = "gluvia:products-changed";

const persianDigitMap = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩۰-۹]/g, (digit) => persianDigitMap[digit] ?? digit)
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

export function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = normalizeDigits(value).trim().replace(/,/g, "");
  if (!text) return null;

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function formatNumber(value, maximumFractionDigits = 2) {
  const number = parseNumber(value);
  if (number === null) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(number);
}

export function calculateBaseQuantity(quantity, ratio) {
  const parsedQuantity = parseNumber(quantity);
  const parsedRatio = parseNumber(ratio);
  if (parsedQuantity === null || parsedRatio === null) return 0;
  return Math.round(parsedQuantity * parsedRatio * 1_000_000) / 1_000_000;
}

export function createProductId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

const usageAliases = {
  "خرید": "purchase",
  Purchase: "purchase",
  "خرید / Purchase": "purchase",
  "فروش": "sales",
  Sale: "sales",
  "فروش / Sale": "sales",
  "هر دو": "both",
  Both: "both",
  "هر دو / Both": "both",
};

function normalizeUsage(value) {
  const text = asString(value).trim();
  return usageAliases[text] ?? text;
}

function normalizeUnitPrices(value) {
  return Object.fromEntries(
    Object.entries(asObject(value)).map(([unit, price]) => [normalizeUnit(unit), price])
  );
}

function normalizeMoney(value) {
  const raw = asObject(value);
  return {
    value: asString(raw.value),
    unit: normalizeUnit(raw.unit),
  };
}

function normalizeVariant(value) {
  const raw = asObject(value);
  return {
    id: asString(raw.id) || createProductId(),
    color: asString(raw.color),
    size: asString(raw.size),
    model: asString(raw.model),
    stock: asString(raw.stock),
    stockUnit: normalizeUnit(raw.stockUnit),
    ratio: asString(raw.ratio),
  };
}

function normalizeExtraUnit(value) {
  if (typeof value === "string") {
    return { unit: normalizeUnit(value), usage: "both", ratio: "" };
  }
  const raw = asObject(value);
  return {
    unit: normalizeUnit(raw.unit),
    usage: normalizeUsage(raw.usage) || "both",
    ratio: asString(raw.ratio),
  };
}

function normalizeOpeningRecord(value) {
  const raw = asObject(value);
  const quantity = parseNumber(raw.quantity);
  const ratio = parseNumber(raw.ratio);
  return {
    id: asString(raw.id) || createProductId(),
    date: asString(raw.date),
    warehouse: normalizeWarehouse(raw.warehouse),
    variantId: asString(raw.variantId),
    unit: normalizeUnit(raw.unit),
    quantity: quantity ?? 0,
    ratio: ratio ?? 1,
    baseQuantity: parseNumber(raw.baseQuantity) ?? calculateBaseQuantity(quantity ?? 0, ratio ?? 1),
    availableQuantity: parseNumber(raw.availableQuantity) ?? 0,
    baseAvailableQuantity:
      parseNumber(raw.baseAvailableQuantity) ??
      calculateBaseQuantity(raw.availableQuantity ?? 0, ratio ?? 1),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function normalizeProduct(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = asObject(value);
  const id = asString(raw.id).trim();
  const sku = asString(raw.sku).trim();
  const name = asString(raw.name).trim();
  if (!id || !sku || !name) return null;

  const baseUnit = normalizeUnit(raw.baseUnit);
  const opening = asObject(raw.openingStock ?? raw.opening);
  const stock = asObject(raw.stock);
  const settings = asObject(raw.settings);
  const prices = asObject(raw.prices);
  const openingRecords = asArray(raw.openingRecords ?? opening.records).map(normalizeOpeningRecord);
  const physical = parseNumber(stock.physical);
  const available = parseNumber(stock.available);

  return {
    ...raw,
    id,
    sku,
    name,
    category: normalizeCategory(raw.category),
    status: asString(raw.status) || "active",
    description: asString(raw.description),
    baseUnit,
    purchaseUnit: normalizeUnit(raw.purchaseUnit),
    variants: asArray(raw.variants).map(normalizeVariant),
    extraUnits: asArray(raw.extraUnits).map(normalizeExtraUnit).filter((unit) => unit.unit),
    purchaseUnits: asArray(raw.purchaseUnits)
      .filter((unit) => typeof unit === "string")
      .map(normalizeUnit),
    salesUnits: asArray(raw.salesUnits)
      .filter((unit) => typeof unit === "string")
      .map(normalizeUnit),
    openingStock: {
      date: asString(opening.date),
      warehouse: normalizeWarehouse(opening.warehouse),
      unit: normalizeUnit(opening.unit),
      physical: asString(opening.physical),
      available: asString(opening.available),
      physicalRatio: asString(opening.physicalRatio),
      availableRatio: asString(opening.availableRatio),
    },
    openingRecords,
    prices: {
      purchase: normalizeMoney(prices.purchase),
      sale: normalizeMoney(prices.sale),
      wholesale: normalizeMoney(prices.wholesale),
      byUnit: normalizeUnitPrices(prices.byUnit),
    },
    settings: {
      advance: Boolean(settings.advance),
      advanceValue: asString(settings.advanceValue),
      advanceType: asString(settings.advanceType) || "percent",
      lowStock: asString(settings.lowStock),
      lowStockUnit: normalizeUnit(settings.lowStockUnit),
    },
    stock: {
      physical:
        physical ??
        openingRecords.reduce((sum, record) => sum + record.baseQuantity, 0),
      available:
        available ??
        openingRecords.reduce((sum, record) => sum + record.baseAvailableQuantity, 0),
    },
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

function readRawProducts() {
  if (typeof localStorage === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getProducts() {
  const seenSkus = new Set();

  return readRawProducts()
    .map(normalizeProduct)
    .filter((product) => {
      if (!product) return false;
      const key = product.sku.toLocaleLowerCase();
      if (seenSkus.has(key)) return false;
      seenSkus.add(key);
      return true;
    });
}

export function getProductById(id) {
  return getProducts().find((product) => product.id === id) ?? null;
}

export function hasDuplicateSku(sku, exceptId = null) {
  const key = sku.trim().toLocaleLowerCase();
  return getProducts().some(
    (product) => product.sku.toLocaleLowerCase() === key && product.id !== exceptId
  );
}

function writeProducts(products) {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRODUCTS_CHANGED_EVENT));
  }
}

export function saveProduct(product) {
  const normalized = normalizeProduct(product);
  if (!normalized) throw new Error("INVALID_PRODUCT");

  const products = getProducts();
  if (hasDuplicateSku(normalized.sku, normalized.id)) {
    throw new Error("DUPLICATE_SKU");
  }

  const index = products.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    products[index] = { ...products[index], ...normalized };
  } else {
    products.push(normalized);
  }

  writeProducts(products);
  return normalized;
}

export function deleteProduct(id) {
  const products = getProducts();
  const remaining = products.filter((product) => product.id !== id);
  if (remaining.length === products.length) return false;

  writeProducts(remaining);
  return true;
}
