export const categories = [
  { value: "glue", labelKey: "categories.glue" },
  { value: "texon", labelKey: "categories.texon" },
  { value: "upper", labelKey: "categories.upper" },
  { value: "spring", labelKey: "categories.spring" },
  { value: "nailsThread", labelKey: "categories.nailsThread" },
];

export const warehouses = [
  { value: "main", labelKey: "warehouses.main" },
  { value: "second", labelKey: "warehouses.second" },
];

const categoryAliases = {
  چسپ: "glue",
  Glue: "glue",
  تکسون: "texon",
  Texon: "texon",
  کوری: "upper",
  Upper: "upper",
  فنر: "spring",
  Spring: "spring",
  "میخ و نخ": "nailsThread",
  "Nails & thread": "nailsThread",
};

const warehouseAliases = {
  "Main Warehouse": "main",
  "گدام اصلی": "main",
  "گدام دوم": "second",
  "Second Warehouse": "second",
};

export function normalizeCategory(value) {
  const text = String(value ?? "").trim();
  return categoryAliases[text] ?? text;
}

export function normalizeWarehouse(value) {
  const text = String(value ?? "").trim();
  return warehouseAliases[text] ?? text;
}

export function categoryLabel(value, t) {
  const category = categories.find((item) => item.value === value);
  return category ? t(category.labelKey) : value;
}

export function warehouseLabel(value, t) {
  const warehouse = warehouses.find((item) => item.value === value);
  return warehouse ? t(warehouse.labelKey) : value;
}
