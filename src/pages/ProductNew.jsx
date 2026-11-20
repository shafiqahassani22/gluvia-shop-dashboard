import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Info, Plus, X } from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog";
import { categories, categoryLabel, warehouses, warehouseLabel } from "../constants/catalog";
import { units, unitLabel } from "../constants/units";
import { useToast } from "../contexts/toast";
import {
  calculateBaseQuantity,
  createProductId,
  getProductById,
  hasDuplicateSku,
  parseNumber,
  saveProduct,
} from "../services/productStorage";

const usagePurchase = "purchase";
const usageSales = "sales";
const usageBoth = "both";
const usageOptions = [
  { value: usagePurchase, labelKey: "productForm.usage.purchase" },
  { value: usageSales, labelKey: "productForm.usage.sales" },
  { value: usageBoth, labelKey: "productForm.usage.both" },
];

const statusOptions = [
  { value: "active", labelKey: "productForm.active" },
  { value: "inactive", labelKey: "productForm.inactive" },
];

const advanceTypes = [
  { value: "percent", labelKey: "productForm.advance.percent" },
  { value: "amount", labelKey: "productForm.advance.amount" },
];

const inputClass =
  "h-10 w-full min-w-0 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]";

const tableInputClass =
  "h-10 w-full min-w-[132px] rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 text-[13px] text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]";

const labelClass = "text-[12.5px] font-medium text-[#374151]";
const cardClass = "rounded-xl border border-[#E5E7EB] bg-white";
const columnClass =
  "whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]";
const cellClass = "border-b border-[#E5E7EB] px-4 py-[10px] align-middle";

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  name: "",
  sku: "",
  category: "",
  newCategory: "",
  status: "active",
  description: "",
  baseUnit: "",
  purchaseUnit: "",
};

const initialOpening = () => ({
  warehouse: warehouses[0].value,
  unit: "",
  physical: "",
  available: "",
  ratio: "",
  date: today(),
});

const initialSettings = {
  advance: false,
  advanceValue: "",
  advanceType: "percent",
  lowStock: "",
  lowStockUnit: units[0],
};

const initialPrices = {
  purchase: { value: "", unit: "" },
  sale: { value: "", unit: "" },
  wholesale: { value: "", unit: "" },
  byUnit: {},
};

function formFromProduct(product) {
  if (!product) return { ...initialForm };
  return {
    name: product.name ?? "",
    sku: product.sku ?? "",
    category: product.category ?? "",
    newCategory: "",
    status: product.status ?? "active",
    description: product.description ?? "",
    baseUnit: product.baseUnit ?? "",
    purchaseUnit: product.purchaseUnit ?? "",
  };
}

function variantsFromProduct(product) {
  const variants = product?.variants ?? [];
  if (!variants.length) {
    return [{ id: createProductId(), color: "", size: "", model: "", stock: "", stockUnit: product?.baseUnit ?? "", ratio: "" }];
  }
  return variants.map((variant) => ({
    id: variant.id || createProductId(),
    color: variant.color ?? "",
    size: variant.size ?? "",
    model: variant.model ?? "",
    stock: variant.stock ?? "",
    stockUnit: variant.stockUnit || product?.baseUnit || "",
    ratio: variant.ratio ?? "",
  }));
}

function extraUnitsFromProduct(product) {
  const configured = product?.extraUnits ?? [];
  if (!configured.length) return [{ unit: "", usage: usageBoth, ratio: "" }];
  return configured.map((unit) => ({
    unit: unit.unit ?? "",
    usage: unit.usage ?? usageBoth,
    ratio: unit.ratio ?? "",
  }));
}

function pricesFromProduct(product) {
  if (!product) return { ...initialPrices, byUnit: {} };
  return {
    purchase: product.prices?.purchase ?? { value: "", unit: "" },
    sale: product.prices?.sale ?? { value: "", unit: "" },
    wholesale: product.prices?.wholesale ?? { value: "", unit: "" },
    byUnit: product.prices?.byUnit ?? {},
  };
}

function openingFromProduct(product) {
  if (!product) return initialOpening();
  return {
    warehouse: product.openingStock?.warehouse || warehouses[0].value,
    unit: product.openingStock?.unit || "",
    physical: product.openingStock?.physical || "",
    available: product.openingStock?.available || "",
    ratio: product.openingStock?.physicalRatio || product.openingStock?.ratio || "",
    date: product.openingStock?.date || today(),
  };
}

function settingsFromProduct(product) {
  if (!product) return { ...initialSettings };
  return {
    advance: Boolean(product.settings?.advance),
    advanceValue: product.settings?.advanceValue ?? "",
    advanceType: product.settings?.advanceType || "percent",
    lowStock: product.settings?.lowStock ?? "",
    lowStockUnit: product.settings?.lowStockUnit || product.baseUnit || units[0],
  };
}

function UnitOptions({ options = units }) {
  const { t } = useTranslation();
  return options.map((unit) => (
    <option key={unit} value={unit}>
      {unitLabel(unit, t)}
    </option>
  ));
}

function Badge({ tone = "neutral", dot = false, children }) {
  const tones = {
    neutral: "bg-[#F4F6F5] text-[#6B7280]",
    success: "bg-[#EAF7EF] text-[#15803D]",
    warning: "bg-[#FFF7E8] text-[#B45309]",
    info: "bg-[#EDF3FF] text-[#1D4ED8]",
    accent: "bg-[#F5EFE6] text-[#B08D57]",
  };

  return (
    <span className={`inline-flex h-[23px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold ${tones[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

function Alert({ tone = "info", title, children, compact = false }) {
  const tones = {
    info: "bg-[#EDF3FF] text-[#1E3A8A]",
    warning: "bg-[#FFF7E8] text-[#7C2D12]",
  };
  const Icon = tone === "warning" ? AlertTriangle : Info;

  return (
    <div className={`flex items-start gap-2.5 rounded-[10px] ${compact ? "px-3 py-2.5" : "px-3.5 py-3"} text-[12.5px] ${tones[tone]}`}>
      <Icon size={compact ? 15 : 17} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <strong className="block font-semibold">{title}</strong>}
        <div className={`mt-0.5 leading-relaxed ${compact ? "text-[11px]" : "text-[11.5px]"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Card({ id, title, subtitle, headRight, children, compact = false }) {
  return (
    <section id={id} className={cardClass}>
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E7EB] ${compact ? "px-3.5 py-3" : "px-5 py-[15px]"}`}>
        <div className="min-w-0">
          <h2 className={`font-semibold text-[#111827] ${compact ? "text-[13px]" : "text-[15px]"}`}>{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-[#6B7280]">{subtitle}</p>}
        </div>
        {headRight}
      </div>
      {children}
    </section>
  );
}

function Field({ htmlFor, label, required = false, hint, error, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required && <span className="text-[#B91C1C]"> *</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[11.5px] text-[#B91C1C]">{error}</span>
      ) : hint ? (
        <span className="text-[11.5px] text-[#6B7280]">{hint}</span>
      ) : null}
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-10 w-full gap-1 rounded-[10px] border border-[#E5E7EB] bg-[#F4F6F5] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-lg text-[12.5px] font-semibold transition ${
            value === option.value
              ? "bg-white text-[#0F5C55] shadow-sm"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 rounded-full bg-[#D1D5DB] after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:content-[''] after:transition-all peer-checked:bg-[#0F5C55] peer-checked:after:start-[18px] peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#E6F2F0]" />
      <span className="text-[11.5px] font-semibold text-[#6B7280]">{label}</span>
    </label>
  );
}

function PriceBox({ title, unitLabel, value, unit, unitOptions, onValueChange, onUnitChange, error }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFC] p-4">
      <label className={labelClass}>{title}</label>
      <div className="mt-1.5 flex h-10 overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white transition focus-within:border-[#0F5C55] focus-within:ring-[3px] focus-within:ring-[#E6F2F0]">
        <span className="grid place-items-center border-e border-[#E5E7EB] bg-[#F4F6F5] px-3 text-[11px] font-bold text-[#6B7280]">
          AFN
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onValueChange}
          placeholder="—"
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
      </div>
      <div className="mt-3">
        <label className="text-[11px] text-[#6B7280]">{unitLabel}</label>
        <select value={unit} onChange={onUnitChange} className={`${inputClass} mt-1`}>
          <option value="">{t("common.selectUnit")}</option>
          <UnitOptions options={unitOptions} />
        </select>
      </div>
      {error && <span className="mt-1.5 block text-[11.5px] text-[#B91C1C]">{error}</span>}
    </div>
  );
}

const guideSteps = [
  { letter: "A", titleKey: "productForm.guide.general", subKey: "productForm.generalSub", badgeKey: "notice.required", tone: "warning" },
  { letter: "B", titleKey: "productForm.guide.variants", subKey: "productForm.variantsSub", badgeKey: "productForm.optional", tone: "neutral" },
  { letter: "C", titleKey: "productForm.guide.units", subKey: "productForm.unitsSub", badgeKey: "productForm.guide.ownerApproval", tone: "warning" },
  { letter: "D", titleKey: "productForm.guide.prices", subKey: "productForm.pricingSub", badge: "AFN", tone: "neutral" },
  { letter: "E", titleKey: "productForm.guide.opening", subKey: "productForm.openingSub", badgeKey: "productForm.notPurchase", tone: "info" },
];

const guideNotes = [
  ["productForm.guide.noteVariantLabel", "productForm.guide.noteVariantsLabel"],
  ["productForm.guide.units", "productForm.unitsSub"],
  ["productForm.guide.noteOpeningLabel", "productForm.guide.noteOpeningLabel"],
  ["productForm.guide.noteSellableLabel", "productForm.guide.ownerApprovalDesc"],
];

function SetupGuide() {
  const { t } = useTranslation();

  return (
    <aside className="min-w-0 space-y-4 xl:sticky xl:top-20">
      <Card compact title={t("productForm.guide.setup")} subtitle={t("productForm.guide.setupSub")}>
        <div className="px-3.5 py-1">
          {guideSteps.map((step) => (
            <div key={step.letter} className="flex items-center gap-2.5 border-b border-[#E5E7EB] py-2 last:border-b-0">
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#F4F6F5] text-[11px] font-bold text-[#0F5C55]">
                {step.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-[#111827]">{t(step.titleKey)}</span>
                <span className="block truncate text-[10.5px] text-[#6B7280]">{t(step.subKey)}</span>
              </span>
              <Badge tone={step.tone}>{step.badgeKey ? t(step.badgeKey) : step.badge}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card compact title={t("productForm.guide.ownerApproval")}>
        <div className="px-3.5 pb-3.5 pt-0">
          <Alert compact tone="warning">{t("productForm.guide.ownerApprovalDesc")}</Alert>
        </div>
      </Card>

      <Card compact title={t("productForm.guide.notes")}>
        <div className="px-3.5 py-1">
          {guideNotes.map(([labelKey, valueKey]) => (
            <div key={labelKey} className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] py-2 last:border-b-0">
              <span className="text-[10.5px] text-[#6B7280]">{t(labelKey)}</span>
              <span className="text-start text-[11px] font-semibold text-[#111827]">{t(valueKey)}</span>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}

export default function ProductNew() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditing = Boolean(id);
  const [initialProduct] = useState(() => (id ? getProductById(id) : null));
  const originalRef = useRef(initialProduct);
  const warnedRef = useRef(false);

  const [form, setForm] = useState(() => formFromProduct(initialProduct));
  const [variants, setVariants] = useState(() => variantsFromProduct(initialProduct));
  const [hasVariants, setHasVariants] = useState((initialProduct?.variants ?? []).length > 0);
  const [extraUnits, setExtraUnits] = useState(() => extraUnitsFromProduct(initialProduct));
  const [prices, setPrices] = useState(() => pricesFromProduct(initialProduct));
  const [opening, setOpening] = useState(() => openingFromProduct(initialProduct));
  const [settings, setSettings] = useState(() => settingsFromProduct(initialProduct));
  const [existingCategory] = useState(initialProduct?.category ?? "");
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed] = useState(Boolean(id && !initialProduct));
  const [pendingNavigation, setPendingNavigation] = useState(null);

  useEffect(() => {
    if (!loadFailed || warnedRef.current) return;
    warnedRef.current = true;
    toast.error(t("action.loadError"));
  }, [loadFailed, t, toast]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const markDirty = () => {
    setDirty(true);
    setErrors({});
  };

  const configuredUnits = useMemo(() => {
    const result = [];
    [form.baseUnit, form.purchaseUnit, ...extraUnits.map((unit) => unit.unit)].forEach((unit) => {
      if (unit && !result.includes(unit)) result.push(unit);
    });
    return result;
  }, [form.baseUnit, form.purchaseUnit, extraUnits]);

  const selectableUnits = useMemo(() => {
    const result = [...configuredUnits];
    if (opening.unit && !result.includes(opening.unit)) result.push(opening.unit);
    [prices.purchase.unit, prices.sale.unit, prices.wholesale.unit].forEach((unit) => {
      if (unit && !result.includes(unit)) result.push(unit);
    });
    if (settings.lowStockUnit && !result.includes(settings.lowStockUnit)) result.push(settings.lowStockUnit);
    return result.length ? result : units;
  }, [configuredUnits, opening.unit, prices, settings.lowStockUnit]);

  const purchaseUnits = useMemo(() => {
    const result = [];
    if (form.baseUnit) result.push(form.baseUnit);
    if (form.purchaseUnit && !result.includes(form.purchaseUnit)) result.push(form.purchaseUnit);
    extraUnits.forEach((unit) => {
      if (unit.unit && (unit.usage === usagePurchase || unit.usage === usageBoth) && !result.includes(unit.unit)) {
        result.push(unit.unit);
      }
    });
    return result;
  }, [form.baseUnit, form.purchaseUnit, extraUnits]);

  const salesUnits = useMemo(() => {
    const result = [];
    if (form.baseUnit) result.push(form.baseUnit);
    extraUnits.forEach((unit) => {
      if (unit.unit && (unit.usage === usageSales || unit.usage === usageBoth) && !result.includes(unit.unit)) {
        result.push(unit.unit);
      }
    });
    return result;
  }, [form.baseUnit, extraUnits]);

  const setFormValue = (field, value) => {
    markDirty();
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setHasVariantOption = (value) => {
    markDirty();
    setHasVariants(value);
  };

  const updateVariant = (index, field, value) => {
    markDirty();
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant))
    );
  };

  const addVariant = () => {
    markDirty();
    setVariants((current) => [
      ...current,
      { id: createProductId(), color: "", size: "", model: "", stock: "", stockUnit: form.baseUnit, ratio: "" },
    ]);
  };

  const removeVariant = (index) => {
    markDirty();
    setVariants((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : [{ id: createProductId(), color: "", size: "", model: "", stock: "", stockUnit: form.baseUnit, ratio: "" }]
    );
  };

  const updateUnit = (index, field, value) => {
    markDirty();
    setExtraUnits((current) =>
      current.map((unit, i) => (i === index ? { ...unit, [field]: value } : unit))
    );
  };

  const addUnit = () => {
    markDirty();
    setExtraUnits((current) => [...current, { unit: "", usage: usageBoth, ratio: "" }]);
  };

  const removeUnit = (index) => {
    markDirty();
    setExtraUnits((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : [{ unit: "", usage: usageBoth, ratio: "" }]
    );
  };

  const setPrice = (type, field, value) => {
    markDirty();
    setPrices((current) => ({ ...current, [type]: { ...current[type], [field]: value } }));
  };

  const setUnitPrice = (unit, value) => {
    markDirty();
    setPrices((current) => ({ ...current, byUnit: { ...current.byUnit, [unit]: value } }));
  };

  const setOpeningValue = (field, value) => {
    markDirty();
    setOpening((current) => ({ ...current, [field]: value }));
  };

  const setSetting = (field, value) => {
    markDirty();
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleStay = () => setPendingNavigation(null);

  const handleLeaveAnyway = () => {
    const target = pendingNavigation ?? "/products";
    setPendingNavigation(null);
    setDirty(false);
    navigate(target);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = t("notice.required");
    if (!form.sku.trim()) nextErrors.sku = t("notice.required");
    else if (hasDuplicateSku(form.sku, originalRef.current?.id)) nextErrors.sku = t("notice.duplicateSku");
    if (!form.category) nextErrors.category = t("notice.required");
    if (form.category === "new" && !form.newCategory.trim()) nextErrors.newCategory = t("notice.required");
    if (!form.baseUnit) nextErrors.baseUnit = t("notice.required");

    const seenUnits = new Set();
    extraUnits.forEach((unit) => {
      if (!unit.unit) return;
      if (seenUnits.has(unit.unit)) {
        nextErrors.units = t("notice.duplicateUnit");
      }
      seenUnits.add(unit.unit);
      if (unit.unit !== form.baseUnit) {
        const ratio = parseNumber(unit.ratio);
        if (ratio === null || ratio <= 0) nextErrors.units = t("notice.invalidConversion");
      }
    });

    if (form.purchaseUnit && form.purchaseUnit !== form.baseUnit) {
      const purchaseConversion = extraUnits.find((unit) => unit.unit === form.purchaseUnit);
      if (!purchaseConversion || parseNumber(purchaseConversion.ratio) === null || parseNumber(purchaseConversion.ratio) <= 0) {
        nextErrors.units = t("notice.unitsIncomplete");
      }
    }

    if (hasVariants) {
      const seenCombinations = new Set();
      variants.forEach((variant) => {
        const attributes = [variant.color, variant.size, variant.model]
          .map((value) => value.trim().toLocaleLowerCase())
          .filter(Boolean);
        if (!attributes.length) {
          nextErrors.variants = t("notice.variantIncomplete");
          return;
        }
        const key = attributes.join("|");
        if (seenCombinations.has(key)) nextErrors.variants = t("notice.duplicateVariant");
        seenCombinations.add(key);

        if (variant.stock.trim()) {
          const quantity = parseNumber(variant.stock);
          const unit = variant.stockUnit || form.baseUnit;
          if (quantity === null || quantity < 0 || !unit) {
            nextErrors.variants = t("notice.invalidNumbers");
          } else if (unit !== form.baseUnit) {
            const ratio = parseNumber(variant.ratio);
            if (ratio === null || ratio <= 0) nextErrors.variants = t("notice.invalidConversion");
          }
        }
      });
    }

    const hasOpeningQuantity = [opening.physical, opening.available].some((value) => value.trim());
    if (hasOpeningQuantity) {
      if (!opening.date || !opening.unit || !form.baseUnit) {
        nextErrors.opening = t("notice.required");
      } else if (opening.unit !== form.baseUnit) {
        const ratio = parseNumber(opening.ratio);
        if (ratio === null || ratio <= 0) nextErrors.opening = t("notice.invalidConversion");
      }
      [opening.physical, opening.available].forEach((value) => {
        if (!value.trim()) return;
        const parsed = parseNumber(value);
        if (parsed === null || parsed < 0) nextErrors.opening = t("notice.invalidNumbers");
      });
    }

    const moneyFields = [prices.purchase, prices.sale, prices.wholesale];
    moneyFields.forEach((money) => {
      if (!money.value.trim()) return;
      const value = parseNumber(money.value);
      if (value === null || value < 0) {
        nextErrors.prices = t("notice.invalidNumbers");
      } else if (!money.unit) {
        nextErrors.prices = t("notice.unitsIncomplete");
      }
    });

    Object.values(prices.byUnit).forEach((value) => {
      if (!String(value ?? "").trim()) return;
      const parsed = parseNumber(value);
      if (parsed === null || parsed < 0) nextErrors.prices = t("notice.invalidNumbers");
    });

    if (settings.advance && settings.advanceValue.trim() && parseNumber(settings.advanceValue) === null) {
      nextErrors.settings = t("notice.invalidNumbers");
    }
    if (settings.lowStock.trim() && parseNumber(settings.lowStock) === null) {
      nextErrors.settings = t("notice.invalidNumbers");
    }

    return nextErrors;
  };

  const openingUnchanged = () => {
    const original = originalRef.current;
    if (!original) return false;

    const originalOpening = original.openingStock ?? {};
    const directFields = ["warehouse", "unit", "physical", "available", "date"];
    if (directFields.some((field) => String(opening[field] ?? "") !== String(originalOpening[field] ?? ""))) {
      return false;
    }
    if (String(opening.ratio ?? "") !== String(originalOpening.physicalRatio ?? originalOpening.ratio ?? "")) {
      return false;
    }

    const originalVariants = original.variants ?? [];
    if (hasVariants !== originalVariants.length > 0 || variants.length !== originalVariants.length) {
      return false;
    }
    if (!hasVariants) return true;

    return variants.every((variant, index) => {
      const previous = originalVariants[index];
      return (
        String(variant.stock ?? "") === String(previous.stock ?? "") &&
        String(variant.stockUnit ?? "") === String(previous.stockUnit ?? form.baseUnit ?? "") &&
        String(variant.ratio ?? "") === String(previous.ratio ?? "")
      );
    });
  };

  const buildProduct = () => {
    const now = new Date().toISOString();
    const keepOpeningRecords = openingUnchanged();
    const normalizedVariants = hasVariants
      ? variants.map((variant) => ({
          ...variant,
          id: variant.id || createProductId(),
          stockUnit: variant.stockUnit || form.baseUnit,
          ratio: variant.stockUnit && variant.stockUnit !== form.baseUnit ? String(parseNumber(variant.ratio) ?? 1) : "",
        }))
      : [];

    const openingRatio = opening.unit === form.baseUnit ? 1 : parseNumber(opening.ratio) ?? 1;
    const previousRecords = originalRef.current?.openingRecords ?? [];
    const openingRecords = keepOpeningRecords ? [...previousRecords] : [];

    if (!keepOpeningRecords) {
      if (hasVariants) {
        normalizedVariants.forEach((variant) => {
          const quantity = parseNumber(variant.stock);
          if (quantity === null || quantity === 0) return;
          const ratio = variant.stockUnit === form.baseUnit ? 1 : parseNumber(variant.ratio) ?? 1;
          const baseQuantity = calculateBaseQuantity(quantity, ratio);
          const previous = previousRecords.find((record) => record.variantId === variant.id);
          openingRecords.push({
            id: previous?.id ?? createProductId(),
            date: opening.date,
            warehouse: opening.warehouse,
            variantId: variant.id,
            unit: variant.stockUnit,
            quantity,
            ratio,
            baseQuantity,
            availableQuantity: quantity,
            baseAvailableQuantity: baseQuantity,
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          });
        });
      } else {
        const physical = parseNumber(opening.physical);
        const available = parseNumber(opening.available);
        if (physical !== null || available !== null) {
          const physicalValue = physical ?? 0;
          const availableValue = available ?? 0;
          const previous = previousRecords.find((record) => !record.variantId);
          openingRecords.push({
            id: previous?.id ?? createProductId(),
            date: opening.date,
            warehouse: opening.warehouse,
            variantId: "",
            unit: opening.unit,
            quantity: physicalValue,
            ratio: openingRatio,
            baseQuantity: calculateBaseQuantity(physicalValue, openingRatio),
            availableQuantity: availableValue,
            baseAvailableQuantity: calculateBaseQuantity(availableValue, openingRatio),
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
          });
        }
      }
    }

    const byUnit = {};
    salesUnits.forEach((unit) => {
      const value = String(prices.byUnit[unit] ?? "").trim();
      if (value && unit !== prices.sale.unit) byUnit[unit] = value;
    });

    return {
      ...(originalRef.current ?? {}),
      id: originalRef.current?.id ?? createProductId(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category === "new" ? form.newCategory.trim() : form.category,
      status: form.status,
      description: form.description.trim(),
      baseUnit: form.baseUnit,
      purchaseUnit: form.purchaseUnit,
      purchaseUnits,
      salesUnits,
      extraUnits: extraUnits
        .filter((unit) => unit.unit)
        .map((unit) => ({
          ...unit,
          ratio: unit.unit === form.baseUnit ? "" : String(parseNumber(unit.ratio) ?? 1),
        })),
      variants: normalizedVariants,
      openingStock: {
        ...opening,
        physicalRatio: opening.unit === form.baseUnit ? "" : String(openingRatio),
        availableRatio: opening.unit === form.baseUnit ? "" : String(openingRatio),
      },
      openingRecords,
      prices: { ...prices, byUnit },
      settings,
      stock: {
        physical: openingRecords.reduce((sum, record) => sum + record.baseQuantity, 0),
        available: openingRecords.reduce((sum, record) => sum + record.baseAvailableQuantity, 0),
      },
      createdAt: originalRef.current?.createdAt || now,
      updatedAt: now,
    };
  };

  const handleSave = () => {
    if (isSaving || loadFailed) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.warning(Object.values(nextErrors)[0] ?? t("notice.required"));
      return;
    }

    setIsSaving(true);
    try {
      saveProduct(buildProduct());
      setDirty(false);
      originalRef.current = null;
      toast.success(isEditing ? t("action.updated") : t("action.saved"));
      navigate("/products");
    } catch (error) {
      if (error?.message === "DUPLICATE_SKU") {
        setErrors((current) => ({ ...current, sku: t("notice.duplicateSku") }));
        toast.error(t("notice.duplicateSku"));
      } else {
        toast.error(isEditing ? t("action.updateError") : t("action.saveError"));
      }
      setIsSaving(false);
    }
  };

  const handleNavigationClick = (event) => {
    if (!dirty) return;
    event.preventDefault();
    setPendingNavigation("/products");
  };

  if (loadFailed) {
    return (
      <div className="space-y-4 text-start">
        <Alert tone="warning" title={t("action.loadError")}>
          <Link to="/products" className="font-semibold text-[#0F5C55] hover:underline">
            {t("page.products.title")}
          </Link>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-start">
      <div className="space-y-3">
        <nav className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <Link to="/products" onClick={handleNavigationClick} className="hover:text-[#0F5C55] hover:underline">
            {t("page.products.title")}
          </Link>
          <span>/</span>
          <span>{isEditing ? t("action.editProduct") : t("action.newProduct")}</span>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              {isEditing ? t("action.editProduct") : t("action.newProduct")}
            </h1>
            <p className="mt-1.5 text-[13px] text-[#6B7280]">
              {t("productForm.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/products"
              onClick={handleNavigationClick}
              className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#111827] hover:bg-[#FBFCFC]"
            >
              {t("action.cancel")}
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-[10px] bg-[#0F5C55] px-5 text-[13px] font-semibold text-white hover:bg-[#0B4A44] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? t("action.saving") : t("action.save")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_248px]">
        <div className="min-w-0 space-y-5">
          <Card
            id="general"
            title={`A · ${t("productForm.generalTitle")}`}
            subtitle={t("notice.required")}
            headRight={
              <Badge>
                {!isEditing
                  ? t("label.draft")
                  : t(form.status === "active" ? "productForm.active" : "productForm.inactive")}
              </Badge>
            }
          >
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <Field htmlFor="product-name" label={t("productForm.productName")} required error={errors.name}>
                <input
                  id="product-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setFormValue("name", event.target.value)}
                  placeholder={t("productForm.productNamePlaceholder")}
                  className={inputClass}
                />
              </Field>

              <Field htmlFor="product-sku" label={t("label.sku")} required error={errors.sku}>
                <input
                  id="product-sku"
                  type="text"
                  value={form.sku}
                  onChange={(event) => setFormValue("sku", event.target.value)}
                  placeholder={t("productForm.skuPlaceholder")}
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field htmlFor="product-category" label={t("productForm.category")} required error={errors.category}>
                <select
                  id="product-category"
                  value={form.category}
                  onChange={(event) => setFormValue("category", event.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("productForm.selectCategory")}</option>
                  {[...new Set([...categories.map((item) => item.value), ...(existingCategory ? [existingCategory] : [])])].map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category, t)}
                    </option>
                  ))}
                  <option value="new">{t("productForm.newCategory")}</option>
                </select>
              </Field>

              {form.category === "new" && (
                <Field htmlFor="product-new-category" label={t("productForm.newCategoryName")} required error={errors.newCategory}>
                  <input
                    id="product-new-category"
                    type="text"
                    value={form.newCategory}
                    onChange={(event) => setFormValue("newCategory", event.target.value)}
                    placeholder={t("productForm.newCategoryPlaceholder")}
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label={t("productForm.productStatus")}>
                <Segmented
                  value={form.status}
                  options={statusOptions}
                  onChange={(value) => setFormValue("status", value)}
                />
              </Field>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="product-description" className={labelClass}>
                  {t("productForm.description")}
                </label>
                <textarea
                  id="product-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => setFormValue("description", event.target.value)}
                  placeholder={t("productForm.descriptionPlaceholder")}
                  className="min-h-[92px] w-full resize-y rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]"
                />
                <span className="text-[11.5px] text-[#6B7280]">
                  {t("productForm.descriptionHint")}
                </span>
              </div>
            </div>
          </Card>

          <Card
            id="variants"
            title={`B · ${t("productForm.variantsTitle")}`}
            subtitle={t("productForm.variantsSub")}
            headRight={
              <Toggle
                checked={hasVariants}
                onChange={setHasVariantOption}
                label={t(hasVariants ? "productForm.hasVariants" : "productForm.noVariants")}
              />
            }
          >
            {hasVariants ? (
              <div className="space-y-4 p-5">
                <Alert title={t("productForm.guide.noteVariantsLabel")}>
                  {t("productForm.variantsAlertText")}
                </Alert>

                {errors.variants && (
                  <div className="rounded-[10px] border border-[#FDE8C2] bg-[#FFF7E8] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B45309]">
                    {errors.variants}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className={columnClass}>{t("productForm.colColor")}</th>
                        <th className={columnClass}>{t("productForm.colSize")}</th>
                        <th className={columnClass}>{t("productForm.colModel")}</th>
                        <th className={`${columnClass} text-end`}>{t("productForm.colOpening")}</th>
                        <th className={columnClass}>{t("productForm.colUnit")}</th>
                        <th className={columnClass}>{t("productForm.colConversionToBase")}</th>
                        <th className={columnClass}>{t("productForm.colStatus")}</th>
                        <th className={columnClass}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant, index) => {
                        const variantUnit = variant.stockUnit || form.baseUnit;
                        const isBaseUnit = !variantUnit || variantUnit === form.baseUnit;
                        const variantStock = parseNumber(variant.stock);
                        return (
                          <tr key={variant.id} className="hover:bg-[#FAFBFB] [&:last-child>td]:border-b-0">
                            <td className={cellClass}>
                              <input
                                type="text"
                                value={variant.color}
                                onChange={(event) => updateVariant(index, "color", event.target.value)}
                                placeholder={t("productForm.placeholderColor")}
                                className={tableInputClass}
                              />
                            </td>
                            <td className={cellClass}>
                              <input
                                type="text"
                                value={variant.size}
                                onChange={(event) => updateVariant(index, "size", event.target.value)}
                                placeholder={t("productForm.placeholderSize")}
                                className={tableInputClass}
                              />
                            </td>
                            <td className={cellClass}>
                              <input
                                type="text"
                                value={variant.model}
                                onChange={(event) => updateVariant(index, "model", event.target.value)}
                                placeholder={t("productForm.placeholderModel")}
                                className={tableInputClass}
                              />
                            </td>
                            <td className={cellClass}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={variant.stock}
                                onChange={(event) => updateVariant(index, "stock", event.target.value)}
                                placeholder="—"
                                className={`${tableInputClass} text-end font-mono`}
                              />
                            </td>
                            <td className={cellClass}>
                              <select
                                value={variantUnit}
                                onChange={(event) => updateVariant(index, "stockUnit", event.target.value)}
                                className={tableInputClass}
                              >
          <option value="">{t("common.selectUnit")}</option>
                                <UnitOptions options={selectableUnits} />
                              </select>
                            </td>
                            <td className={cellClass}>
                              {isBaseUnit ? (
                                <span className="block whitespace-nowrap px-1 text-[11.5px] font-semibold text-[#0F5C55]">
                                  {t("productForm.baseUnitOne")} (1)
                                </span>
                              ) : (
                                <div>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={variant.ratio}
                                    onChange={(event) => updateVariant(index, "ratio", event.target.value)}
                                    placeholder={t("productForm.ratioPlaceholder")}
                                    className={`${tableInputClass} font-mono`}
                                  />
                                  <span className="mt-1 block whitespace-nowrap text-[10.5px] text-[#6B7280]">
                                    1 {unitLabel(variantUnit, t)} = ? {form.baseUnit ? unitLabel(form.baseUnit, t) : t("productForm.base")}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className={cellClass}>
                              <Badge tone={variantStock && variantStock > 0 ? "success" : "warning"} dot>
                                {t(variantStock && variantStock > 0 ? "productForm.active" : "catalog.outOfStock")}
                              </Badge>
                            </td>
                            <td className={cellClass}>
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                title={t("productForm.removeVariant")}
                                className="grid size-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDECEC] hover:text-[#B91C1C]"
                              >
                                <X size={16} strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12.5px] font-semibold text-[#111827] hover:border-[#BFE0DA] hover:bg-[#FBFCFC]"
                  >
                    <Plus size={15} strokeWidth={2} />
                    {t("productForm.addVariant")}
                  </button>
                  <span className="text-[11.5px] text-[#6B7280]">
                    {t("productForm.variantStockNote")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <Alert title={t("productForm.noVariantAlertTitle")}>
                  {t("productForm.noVariantAlertText")}
                </Alert>
              </div>
            )}
          </Card>

          <Card
            id="units"
            title={`C · ${t("productForm.unitsTitle")}`}
            subtitle={t("productForm.unitsSub")}
            headRight={<Badge tone="warning" dot>{t("productForm.guide.ownerApproval")}</Badge>}
          >
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field htmlFor="base-unit" label={t("productForm.baseUnit")} required hint={t("productForm.baseUnitHint")} error={errors.baseUnit}>
                  <select
                    id="base-unit"
                    value={form.baseUnit}
                    onChange={(event) => setFormValue("baseUnit", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("productForm.selectBaseUnit")}</option>
                    <UnitOptions />
                  </select>
                </Field>

                <Field
                  htmlFor="purchase-unit"
                  label={t("productForm.defaultPurchaseUnit")}
                  hint={t("productForm.defaultPurchaseUnitHint")}
                >
                  <select
                    id="purchase-unit"
                    value={form.purchaseUnit}
                    onChange={(event) => setFormValue("purchaseUnit", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("productForm.selectPurchaseUnit")}</option>
                    <UnitOptions />
                  </select>
                </Field>
              </div>

              {errors.units && (
                <div className="rounded-[10px] border border-[#FDE8C2] bg-[#FFF7E8] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B45309]">
                  {errors.units}
                </div>
              )}

              <div className="border-t border-[#E5E7EB]" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">{t("productForm.additionalUnits")}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                    {t("productForm.additionalUnitsHint")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addUnit}
                  className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-[12.5px] font-semibold text-[#111827] hover:border-[#BFE0DA] hover:bg-[#FBFCFC]"
                >
                  <Plus size={15} strokeWidth={2} />
                  {t("units.add")}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className={columnClass}>{t("productForm.colUnit")}</th>
                      <th className={columnClass}>{t("productForm.colUsage")}</th>
                      <th className={columnClass}>{t("productForm.colConversionToBase")}</th>
                      <th className={columnClass}>{t("productForm.colApprovalStatus")}</th>
                      <th className={columnClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraUnits.map((unit, index) => {
                      const isBaseUnit = !unit.unit || unit.unit === form.baseUnit;
                      return (
                        <tr key={index} className="hover:bg-[#FAFBFB] [&:last-child>td]:border-b-0">
                          <td className={cellClass}>
                            <select
                              value={unit.unit}
                              onChange={(event) => updateUnit(index, "unit", event.target.value)}
                              className={tableInputClass}
                            >
                               <option value="">{t("common.selectUnit")}</option>
                               <UnitOptions />
                            </select>
                          </td>
                          <td className={cellClass}>
                            <select
                              value={unit.usage}
                              onChange={(event) => updateUnit(index, "usage", event.target.value)}
                              className={tableInputClass}
                            >
                              {usageOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {t(option.labelKey)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={cellClass}>
                            {isBaseUnit ? (
                              <span className="block whitespace-nowrap px-1 text-[11.5px] font-semibold text-[#0F5C55]">
                                {t("productForm.baseUnitOne")} (1)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="whitespace-nowrap text-[11px] text-[#6B7280]">1 {unitLabel(unit.unit, t)}</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={unit.ratio}
                                  onChange={(event) => updateUnit(index, "ratio", event.target.value)}
                                  placeholder={t("productForm.ratioPlaceholder")}
                                  className={`${tableInputClass} min-w-[90px] font-mono`}
                                />
                                <span className="whitespace-nowrap text-[11px] text-[#6B7280]">
                                  = ? {form.baseUnit ? unitLabel(form.baseUnit, t) : t("productForm.base")}
                                </span>
                              </div>
                            )}
                            <span className="mt-1 block text-[10.5px] text-[#6B7280]">
                              {t("productForm.baseFormula")}
                            </span>
                          </td>
                          <td className={cellClass}>
                            <Badge tone="warning" dot>{t("productForm.pendingApproval")}</Badge>
                          </td>
                          <td className={cellClass}>
                            <button
                              type="button"
                              onClick={() => removeUnit(index)}
                              title={t("productForm.removeUnit")}
                              className="grid size-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDECEC] hover:text-[#B91C1C]"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Alert tone="warning" title={t("productForm.ratioAlertTitle")}>
                {t("productForm.ratioAlertText")}
              </Alert>
            </div>
          </Card>

          <Card
            id="pricing"
            title={`D · ${t("productForm.pricingTitle")}`}
            subtitle={t("productForm.pricingSub")}
            headRight={<Badge tone="accent">AFN</Badge>}
          >
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PriceBox
                  title={t("productForm.purchasePrice")}
                  unitLabel={t("productForm.purchaseUnitLabel")}
                  value={prices.purchase.value}
                  unit={prices.purchase.unit}
                  unitOptions={selectableUnits}
                  onValueChange={(event) => setPrice("purchase", "value", event.target.value)}
                  onUnitChange={(event) => setPrice("purchase", "unit", event.target.value)}
                />
                <PriceBox
                  title={t("productForm.salesPrice")}
                  unitLabel={t("productForm.salesUnitLabel")}
                  value={prices.sale.value}
                  unit={prices.sale.unit}
                  unitOptions={selectableUnits}
                  onValueChange={(event) => setPrice("sale", "value", event.target.value)}
                  onUnitChange={(event) => setPrice("sale", "unit", event.target.value)}
                />
                <PriceBox
                  title={`${t("productForm.wholesalePrice")} (${t("productForm.optional")})`}
                  unitLabel={t("productForm.wholesaleUnitLabel")}
                  value={prices.wholesale.value}
                  unit={prices.wholesale.unit}
                  unitOptions={selectableUnits}
                  onValueChange={(event) => setPrice("wholesale", "value", event.target.value)}
                  onUnitChange={(event) => setPrice("wholesale", "unit", event.target.value)}
                />
              </div>

              {salesUnits.filter((unit) => unit !== prices.sale.unit).length > 0 && (
                <div className="rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFC] p-4">
                  <div className="text-[13px] font-semibold text-[#111827]">{t("productForm.pricePerUnit")}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                    {t("productForm.pricePerUnitHint")}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {salesUnits
                      .filter((unit) => unit !== prices.sale.unit)
                      .map((unit) => (
                        <div key={unit} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                          <Badge tone="info">{unitLabel(unit, t)}</Badge>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={prices.byUnit[unit] ?? ""}
                            onChange={(event) => setUnitPrice(unit, event.target.value)}
                            placeholder="AFN"
                            className="h-8 min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-2 text-[12.5px] outline-none focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {errors.prices && (
                <div className="rounded-[10px] border border-[#FDE8C2] bg-[#FFF7E8] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B45309]">
                  {errors.prices}
                </div>
              )}

              <Alert title={t("productForm.currencyAlertTitle")}>
                {t("productForm.currencyAlertText")}
              </Alert>
            </div>
          </Card>

          <Card
            id="opening"
            title={`E · ${t("productForm.openingTitle")}`}
            subtitle={t("productForm.openingSub")}
            headRight={<Badge tone="info" dot>{t("productForm.notPurchase")}</Badge>}
          >
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field htmlFor="opening-date" label={t("productForm.openingDate")} hint={t("productForm.openingDateHint")}>
                  <input
                    id="opening-date"
                    type="date"
                    value={opening.date}
                    onChange={(event) => setOpeningValue("date", event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field htmlFor="opening-warehouse" label={t("productForm.warehouse")}>
                  <select
                    id="opening-warehouse"
                    value={opening.warehouse}
                    onChange={(event) => setOpeningValue("warehouse", event.target.value)}
                    className={inputClass}
                  >
                    {[
                      ...warehouses,
                      ...(opening.warehouse && !warehouses.some((item) => item.value === opening.warehouse)
                        ? [{ value: opening.warehouse }]
                        : []),
                    ].map((warehouse) => (
                      <option key={warehouse.value} value={warehouse.value}>
                        {warehouseLabel(warehouse.value, t)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field htmlFor="opening-unit" label={t("productForm.openingUnit")}>
                  <select
                    id="opening-unit"
                    value={opening.unit}
                    onChange={(event) => setOpeningValue("unit", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("common.selectUnit")}</option>
                    <UnitOptions options={selectableUnits} />
                   </select>
                </Field>

                {opening.unit && opening.unit !== form.baseUnit && (
                  <Field htmlFor="opening-ratio" label={t("productForm.openingRatio")}>
                    <div className="flex h-10 overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white transition focus-within:border-[#0F5C55] focus-within:ring-[3px] focus-within:ring-[#E6F2F0]">
                      <span className="grid place-items-center whitespace-nowrap border-e border-[#E5E7EB] bg-[#F4F6F5] px-3 text-[11px] font-bold text-[#6B7280]">
                        1 {unitLabel(opening.unit, t)} =
                      </span>
                      <input
                        id="opening-ratio"
                        type="text"
                        inputMode="decimal"
                        value={opening.ratio}
                        onChange={(event) => setOpeningValue("ratio", event.target.value)}
                        placeholder={t("productForm.ratioPlaceholder")}
                        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] outline-none placeholder:text-[#9CA3AF]"
                      />
                      <span className="grid place-items-center whitespace-nowrap border-s border-[#E5E7EB] bg-[#F4F6F5] px-3 text-[11px] font-bold text-[#6B7280]">
                        {form.baseUnit ? unitLabel(form.baseUnit, t) : t("productForm.base")}
                      </span>
                    </div>
                  </Field>
                )}

                <Field htmlFor="opening-physical" label={t("productForm.openingPhysical")} hint={t("productForm.openingPhysicalHint")}>
                  <input
                    id="opening-physical"
                    type="text"
                    inputMode="decimal"
                    value={opening.physical}
                    onChange={(event) => setOpeningValue("physical", event.target.value)}
                    placeholder="—"
                    className={`${inputClass} font-mono`}
                  />
                </Field>

                <Field htmlFor="opening-available" label={t("productForm.openingAvailable")} hint={t("productForm.openingAvailableHint")}>
                  <input
                    id="opening-available"
                    type="text"
                    inputMode="decimal"
                    value={opening.available}
                    onChange={(event) => setOpeningValue("available", event.target.value)}
                    placeholder="—"
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>

              {errors.opening && (
                <div className="rounded-[10px] border border-[#FDE8C2] bg-[#FFF7E8] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B45309]">
                  {errors.opening}
                </div>
              )}

              <div className="border-t border-[#E5E7EB]" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">{t("productForm.variantOpening")}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                    {t("productForm.variantOpeningHint")}
                  </div>
                </div>
                <a href="#variants" className="text-[12.5px] font-semibold text-[#0F5C55] hover:underline">
                  {t("productForm.goToVariants")}
                </a>
              </div>

              <Alert tone="warning" title={t("productForm.notPurchase")}>
                {t("productForm.saveNote")}
              </Alert>
            </div>
          </Card>

          <Card
            id="settings"
            title={`F · ${t("productForm.settingsTitle")}`}
            subtitle={t("productForm.settingsSub")}
            headRight={<Badge>{t("productForm.optional")}</Badge>}
          >
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#111827]">{t("productForm.advancePayment")}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                    {t("productForm.advanceHint")}
                  </div>
                </div>
                <Toggle
                  checked={settings.advance}
                  onChange={(value) => setSetting("advance", value)}
                  label={t(settings.advance ? "productForm.active" : "productForm.inactive")}
                />
              </div>

              {settings.advance && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field htmlFor="advance-value" label={t("productForm.advanceAmount")}>
                    <div className="flex h-10 overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white transition focus-within:border-[#0F5C55] focus-within:ring-[3px] focus-within:ring-[#E6F2F0]">
                      <span className="grid place-items-center border-e border-[#E5E7EB] bg-[#F4F6F5] px-3 text-[11px] font-bold text-[#6B7280]">AFN</span>
                      <input
                        id="advance-value"
                        type="text"
                        inputMode="decimal"
                        value={settings.advanceValue}
                        onChange={(event) => setSetting("advanceValue", event.target.value)}
                        placeholder="—"
                        className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </Field>
                  <Field label={t("productForm.advanceType")}>
                    <Segmented
                      value={settings.advanceType}
                      options={advanceTypes}
                      onChange={(value) => setSetting("advanceType", value)}
                    />
                  </Field>
                </div>
              )}

              <div className="border-t border-[#E5E7EB]" />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#111827]">{t("productForm.lowStockThreshold")}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                    {t("productForm.lowStockHint")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={settings.lowStock}
                    onChange={(event) => setSetting("lowStock", event.target.value)}
                    placeholder="—"
                    className={`${inputClass} w-[110px] font-mono`}
                  />
                  <select
                    value={settings.lowStockUnit}
                    onChange={(event) => setSetting("lowStockUnit", event.target.value)}
                    className={`${inputClass} w-[140px]`}
                  >
                    <UnitOptions options={selectableUnits} />
                  </select>
                </div>
              </div>

              {errors.settings && (
                <div className="rounded-[10px] border border-[#FDE8C2] bg-[#FFF7E8] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B45309]">
                  {errors.settings}
                </div>
              )}
            </div>
          </Card>

          <div className={`${cardClass} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11.5px] text-[#6B7280]">
                {t("productForm.saveNote")}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  to="/products"
                  onClick={handleNavigationClick}
                  className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#111827] hover:bg-[#FBFCFC]"
                >
                  {t("action.cancel")}
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 rounded-[10px] bg-[#0F5C55] px-5 text-[13px] font-semibold text-white hover:bg-[#0B4A44] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? t("action.saving") : t("action.save")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <SetupGuide />
      </div>

      <ConfirmDialog
        open={Boolean(pendingNavigation)}
        title={t("notice.unsavedTitle")}
        message={t("notice.unsavedMessage")}
        confirmLabel={t("notice.leaveWithoutSaving")}
        cancelLabel={t("notice.stay")}
        onConfirm={handleLeaveAnyway}
        onClose={handleStay}
      />
    </div>
  );
}
