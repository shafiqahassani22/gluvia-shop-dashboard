import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Banknote, Package, PackageX, Plus, Search, Trash2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "../components/ConfirmDialog";
import { categoryLabel } from "../constants/catalog";
import { units as allUnits, unitLabel } from "../constants/units";
import { useToast } from "../contexts/toast";
import {
  PRODUCTS_CHANGED_EVENT,
  calculateBaseQuantity,
  deleteProduct,
  formatNumber,
  getProducts,
  parseNumber,
} from "../services/productStorage";

const statusFilters = [
  { value: "all", key: "catalog.all" },
  { value: "available", key: "catalog.available" },
  { value: "low-stock", key: "catalog.lowStock" },
  { value: "out-of-stock", key: "catalog.outOfStock" },
];

const normalizeSearch = (value) => String(value ?? "").trim().toLocaleLowerCase();

function unitRatio(product, unit) {
  if (!unit || unit === product.baseUnit) return 1;
  const configured = (product.extraUnits ?? []).find((item) => item.unit === unit);
  const ratio = parseNumber(configured?.ratio);
  return ratio && ratio > 0 ? ratio : 1;
}

function getStockStatus(product) {
  const available = parseNumber(product.stock?.available) ?? 0;
  if (available <= 0) return "out-of-stock";

  const thresholdValue = parseNumber(product.settings?.lowStock);
  const threshold =
    thresholdValue === null || thresholdValue <= 0
      ? 0
      : thresholdValue * unitRatio(product, product.settings?.lowStockUnit);

  return available <= threshold ? "low-stock" : "available";
}

function getProductUnits(product) {
  const result = [];
  const add = (unit) => {
    if (unit && !result.includes(unit)) result.push(unit);
  };
  add(product.baseUnit);
  add(product.purchaseUnit);
  (product.extraUnits ?? []).forEach((item) => add(item.unit));
  return result;
}

function purchasePricePerBase(product) {
  const value = parseNumber(product.prices?.purchase?.value);
  if (value === null) return 0;
  return value / unitRatio(product, product.prices?.purchase?.unit);
}

function variantLabel(variant, product, t) {
  const attributes = [variant.color, variant.size, variant.model].filter(Boolean).join(" / ");
  const unit = variant.stockUnit || product.baseUnit;
  const baseQuantity = calculateBaseQuantity(variant.stock, unit === product.baseUnit ? 1 : variant.ratio);
  return `${attributes || t("catalog.noVariants")} — ${formatNumber(baseQuantity)} ${unitLabel(product.baseUnit, t)}`.trim();
}

function priceSummary(product, t) {
  const parts = [];
  const purchase = product.prices?.purchase;
  const sale = product.prices?.sale;

  if (purchase?.value) parts.push(`${formatNumber(purchase.value)} ${unitLabel(purchase.unit, t)}`.trim());
  if (sale?.value) parts.push(`${formatNumber(sale.value)} ${unitLabel(sale.unit, t)}`.trim());
  Object.entries(product.prices?.byUnit ?? {}).forEach(([unit, value]) => {
    if (value) parts.push(`${formatNumber(value)} ${unitLabel(unit, t)}`.trim());
  });

  return parts.length ? parts.join(" · ") : "—";
}

export default function Products() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [products, setProducts] = useState(() => getProducts());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [unit, setUnit] = useState("all");
  const [status, setStatus] = useState("all");
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const refresh = () => setProducts(getProducts());
    window.addEventListener(PRODUCTS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PRODUCTS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );
  const units = useMemo(
    () => [...new Set([...allUnits, ...products.flatMap((product) => getProductUnits(product))])],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(search);
    return products.filter((product) => {
      if (query && !normalizeSearch(product.name).includes(query) && !normalizeSearch(product.sku).includes(query)) {
        return false;
      }
      if (category !== "all" && product.category !== category) return false;
      if (unit !== "all" && !getProductUnits(product).includes(unit)) return false;
      if (status !== "all" && getStockStatus(product) !== status) return false;
      return true;
    });
  }, [products, search, category, unit, status]);

  const summary = useMemo(() => {
    const lowStock = products.filter((product) => getStockStatus(product) === "low-stock").length;
    const outOfStock = products.filter((product) => getStockStatus(product) === "out-of-stock").length;
    const inventoryValue = products.reduce(
      (total, product) => total + (parseNumber(product.stock?.physical) ?? 0) * purchasePricePerBase(product),
      0
    );
    return { lowStock, outOfStock, inventoryValue };
  }, [products]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setUnit("all");
    setStatus("all");
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;

    try {
      const removed = deleteProduct(productToDelete.id);
      if (!removed) throw new Error("NOT_FOUND");
      setProducts(getProducts());
      toast.success(t("action.deleted"));
    } catch {
      toast.error(t("action.deleteError"));
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{t("page.products.title")}</h1>
          <p className="mt-2 text-sm text-[#6B7280]">{t("page.products.sub")}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/warehouse"
            className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium"
          >
            {t("nav.warehouse")}
          </Link>
          <Link
            to="/products/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F766E] text-white text-sm font-medium"
          >
            <Plus size={18} />
            {t("action.newProduct")}
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[260px] flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={17}
                strokeWidth={1.8}
                className="pointer-events-none absolute text-[#6B7280]"
                style={{ insetInlineStart: 12, top: 11 }}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("catalog.searchPlaceholder")}
                className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-[#F4F6F5] pe-3 ps-[38px] text-[#111827] outline-none focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-[42px] w-full max-w-[180px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-[9px] text-[13.5px] text-[#111827] outline-none focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]"
            >
              <option value="all">{t("catalog.allCategories")}</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item, t)}
                </option>
              ))}
            </select>

            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              className="min-h-[42px] w-full max-w-[170px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-[9px] text-[13.5px] text-[#111827] outline-none focus:border-[#0F5C55] focus:ring-[3px] focus:ring-[#E6F2F0]"
            >
              <option value="all">{t("catalog.allUnits")}</option>
              {units.map((item) => (
                <option key={item} value={item}>
                  {unitLabel(item, t)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`inline-flex h-[26px] items-center gap-[5px] whitespace-nowrap rounded-lg border px-[9px] text-[11.5px] font-semibold ${
                  status === item.value
                    ? "border-[#BFE0DA] bg-[#E6F2F0] text-[#0F5C55]"
                    : "border-[#E5E7EB] bg-[#FBFCFC] text-[#6B7280]"
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-[18px] py-[17px]">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[12.5px] text-[#6B7280]">{t("catalog.totalProducts")}</span>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#E6F2F0] text-[#0F5C55]">
              <Package size={17} strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827]">
            {formatNumber(products.length, 0)}
          </div>
          <div className="flex items-center gap-[5px] text-[11.5px] text-[#6B7280]">
            {t("catalog.inCategories", { count: categories.length })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-[18px] py-[17px]">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[12.5px] text-[#6B7280]">{t("kpi.lowStock")}</span>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#FFF7E8] text-[#B45309]">
              <AlertTriangle size={17} strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827]">
            {formatNumber(summary.lowStock, 0)}
          </div>
          <div className="flex items-center gap-[5px] text-[11.5px] text-[#6B7280]">{t("catalog.needsPurchase")}</div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-[18px] py-[17px]">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[12.5px] text-[#6B7280]">{t("catalog.outOfStock")}</span>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#FDECEC] text-[#B91C1C]">
              <PackageX size={17} strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827]">
            {formatNumber(summary.outOfStock, 0)}
          </div>
          <div className="flex items-center gap-[5px] text-[11.5px] text-[#6B7280]">{t("catalog.outOfStock")}</div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-[18px] py-[17px]">
          <div className="flex items-start justify-between gap-2.5">
            <span className="text-[12.5px] text-[#6B7280]">{t("catalog.inventoryValue")}</span>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#EDF3FF] text-[#1D4ED8]">
              <Banknote size={17} strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827]">
            {formatNumber(summary.inventoryValue, 0)}{" "}
            <small className="text-[13px] font-semibold tracking-normal text-[#6B7280]">AFN</small>
          </div>
          <div className="flex items-center gap-[5px] text-[11.5px] text-[#6B7280]">{t("catalog.atCost")}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-[15px]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">{t("page.products.title")}</h2>
            <div className="mt-0.5 text-xs text-[#6B7280]">
              {t("catalog.showing", { count: filteredProducts.length, total: products.length })}
            </div>
          </div>
          {(search || category !== "all" || unit !== "all" || status !== "all") && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12.5px] font-semibold text-[#0F5C55] hover:underline"
            >
              {t("action.resetFilters")}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.product")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.reference")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.variants")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.baseUnit")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-end text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.physical")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-end text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.available")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.priceRange")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.status")}
                </th>
                <th className="border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px]"></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border-b border-[#E5E7EB] px-5 py-12 text-center">
                    <div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#F4F6F5] text-[#0F5C55]">
                      <Package size={21} strokeWidth={1.8} />
                    </div>
                    <div className="mt-3 text-[13.5px] font-semibold text-[#111827]">{t("catalog.empty")}</div>
                    <div className="mt-1 text-[12px] text-[#6B7280]">{t("catalog.emptySub")}</div>
                    <Link
                      to="/products/new"
                      className="mt-4 inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#0F5C55] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0B4A44]"
                    >
                      <Plus size={15} />
                      {t("catalog.addFirst")}
                    </Link>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border-b border-[#E5E7EB] px-5 py-12 text-center">
                    <div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#F4F6F5] text-[#6B7280]">
                      <Search size={21} strokeWidth={1.8} />
                    </div>
                    <div className="mt-3 text-[13.5px] font-semibold text-[#111827]">{t("catalog.noResults")}</div>
                    <div className="mt-1 text-[12px] text-[#6B7280]">{t("catalog.noResultsSub")}</div>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 inline-flex h-9 items-center rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-[12.5px] font-semibold text-[#0F5C55] hover:bg-[#FBFCFC]"
                    >
                      {t("action.resetFilters")}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const statusTone =
                    stockStatus === "available"
                      ? "bg-[#EAF7EF] text-[#15803D]"
                      : stockStatus === "low-stock"
                        ? "bg-[#FFF7E8] text-[#B45309]"
                        : "bg-[#FDECEC] text-[#B91C1C]";
                  const statusKey =
                    stockStatus === "available"
                      ? "status.inStock"
                      : stockStatus === "low-stock"
                        ? "status.lowStock"
                        : "status.outOfStock";
                  const extraUnits = getProductUnits(item).filter((value) => value !== item.baseUnit);

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFBFB] [&:last-child>td]:border-b-0">
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                        <div className="flex items-center gap-2">
                          <div className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-[#E5E7EB] bg-[#F4F6F5] text-[11px] font-bold text-[#0F5C55]">
                            {item.name?.slice(0, 1) ?? "—"}
                          </div>
                          <div className="flex min-w-0 flex-col gap-[3px]">
                            <span className="font-semibold text-[#111827]">{item.name}</span>
                            <span className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-[#6B7280]">
                              {item.category || "—"}
                              {item.status === "inactive" && (
                                <span className="rounded-full bg-[#F4F6F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                                  {t("catalog.inactive")}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle font-mono text-[#111827]">{item.sku}</td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#111827]">
                        {item.variants?.length ? (
                          <div className="flex flex-col gap-1">
                            {item.variants.map((variant) => (
                              <span key={variant.id} className="whitespace-nowrap text-[11.5px]">
                                {variantLabel(variant, item, t)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-[#6B7280]">{t("catalog.noVariants")}</span>
                        )}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                        <span className="inline-flex h-[26px] items-center rounded-lg border border-[#E5E7EB] bg-[#FBFCFC] px-[9px] text-[11.5px] font-semibold text-[#6B7280]">
                          {item.baseUnit ? unitLabel(item.baseUnit, t) : "—"}
                        </span>
                        {extraUnits.length > 0 && (
                          <div className="mt-1 whitespace-nowrap text-[10.5px] text-[#6B7280]">
                            + {extraUnits.map((value) => unitLabel(value, t)).join(t("common.listSeparator"))}
                          </div>
                        )}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-end tabular-nums text-[#111827]">
                        {formatNumber(item.stock?.physical, 2)}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-end font-semibold tabular-nums text-[#0F5C55]">
                        {formatNumber(item.stock?.available, 2)}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle tabular-nums tracking-[-0.01em] text-[#111827]">
                        <span className="text-[11.5px]">{priceSummary(item, t)}</span>
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                        <span className={`inline-flex h-[23px] items-center gap-[5px] rounded-full px-2 text-[11.5px] font-semibold ${statusTone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {t(statusKey)}
                        </span>
                      </td>
                      <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/products/${item.id}/edit`)}
                            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0F5C55] hover:underline"
                          >
                            <Pencil size={14} strokeWidth={1.9} />
                            {t("action.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(item)}
                            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#B91C1C] hover:underline"
                          >
                            <Trash2 size={14} strokeWidth={1.9} />
                            {t("action.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title={t("action.deleteProduct")}
        message={`${t("action.confirmDelete", { name: productToDelete?.name ?? "" })} ${t("action.deleteWarning")}`}
        confirmLabel={t("action.confirm")}
        cancelLabel={t("action.cancel")}
        onConfirm={handleDeleteConfirm}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
}
