import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { unitLabel } from "../constants/units";
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  ClipboardCheck,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const kpiTones = {
  primary: "bg-[#E6F2F0] text-[#0F5C55]",
  warning: "bg-[#FFF7E8] text-[#B45309]",
  danger: "bg-[#FDECEC] text-[#B91C1C]",
  info: "bg-[#EDF3FF] text-[#1D4ED8]",
  accent: "bg-[#F5EFE6] text-[#B08D57]",
};

const kpis = [
  {
    key: "available",
    titleKey: "kpi.available",
    value: "9,240",
    unitKey: "unitLabel.pair",
    tone: "primary",
    icon: Package,
    badge: "18%",
    metaKey: "kpi.availableMeta",
  },
  {
    key: "lowStock",
    titleKey: "kpi.lowStock",
    value: "14",
    unitKey: "unitLabel.items",
    tone: "warning",
    icon: AlertTriangle,
    metaKey: "kpi.lowStockMeta",
  },
  {
    key: "todaySales",
    titleKey: "kpi.todaySales",
    value: "42,600",
    unit: "AFN",
    tone: "primary",
    icon: Receipt,
    metaKey: "kpi.todaySalesMeta",
  },
  {
    key: "customerDebt",
    titleKey: "kpi.customerDebt",
    value: "128,400",
    unit: "AFN",
    tone: "danger",
    icon: Users,
    metaKey: "kpi.customerDebtMeta",
  },
  {
    key: "cashReceived",
    titleKey: "kpi.cashReceived",
    value: "31,200",
    unit: "AFN",
    tone: "info",
    icon: Banknote,
    metaKey: "kpi.cashReceivedMeta",
  },
  {
    key: "pendingSync",
    titleKey: "kpi.pendingSync",
    value: "3",
    unitKey: "unitLabel.tx",
    tone: "accent",
    icon: RefreshCw,
    metaKey: "kpi.pendingSyncMeta",
  },
];

const alertTones = {
  danger: "bg-[#FDECEC] text-[#7F1D1D]",
  warning: "bg-[#FFF7E8] text-[#7C2D12]",
  info: "bg-[#EDF3FF] text-[#1E3A8A]",
};

const alerts = [
  {
    key: "debts",
    tone: "danger",
    icon: AlertTriangle,
    titleKey: "dash.alert.debts",
    descKey: "dash.alert.debtsDesc",
  },
  {
    key: "low",
    tone: "warning",
    icon: AlertTriangle,
    titleKey: "dash.alert.low",
    descKey: "dash.alert.lowDesc",
  },
  {
    key: "hawala",
    tone: "info",
    icon: ArrowLeftRight,
    titleKey: "dash.alert.hawala",
    descKey: "dash.alert.hawalaDesc",
  },
];

const quickActions = [
  { key: "newSale", to: "/sales", icon: Plus, labelKey: "action.newSale" },
  {
    key: "newPurchase",
    to: "/purchases",
    icon: ShoppingCart,
    labelKey: "action.newPurchase",
  },
  {
    key: "newReturn",
    to: "/returns",
    icon: RotateCcw,
    labelKey: "action.newReturn",
  },
  {
    key: "stocktake",
    to: "/stocktake",
    icon: ClipboardCheck,
    labelKey: "action.startStocktake",
  },
];

const recentBadgeTones = {
  success: "bg-[#EAF7EF] text-[#15803D]",
  warning: "bg-[#FFF7E8] text-[#B45309]",
  danger: "bg-[#FDECEC] text-[#B91C1C]",
  info: "bg-[#EDF3FF] text-[#1D4ED8]",
};

const recentActivity = [
  {
    ref: "INV-1042",
    typeKey: "recentType.sale",
    customerKey: "recentCustomer.noor",
    itemCount: 3,
    itemsKey: "dashExtra.recentItems",
    total: "AFN 18,600",
    badgeKey: "status.partial",
    tone: "warning",
    date: "10:18",
    avatar: "INV",
  },
  {
    ref: "PO-203",
    typeKey: "recentType.purchase",
    customerKey: "recentCustomer.guangzhou",
    itemCount: 2,
    itemsKey: "dashExtra.recentLines",
    total: "AFN 250,000",
    badgeKey: "status.inTransit",
    tone: "info",
    date: "09:40",
    avatar: "PO",
  },
  {
    ref: "RT-018",
    typeKey: "recentType.return",
    customerKey: "recentCustomer.haji",
    itemCount: 2,
    itemsKey: "dashExtra.recentCarton",
    total: "AFN 13,200",
    badgeKey: "status.damaged",
    tone: "danger",
    dateKey: "recentDate.yesterday",
    avatar: "RT",
    avatarTone: "warn",
  },
  {
    ref: "ST-011",
    typeKey: "recentType.stocktake",
    customerKey: "recentCustomer.mainWarehouse",
    itemCount: 48,
    itemsKey: "dashExtra.recentLines",
    total: "AFN 0",
    badgeKey: "status.approved",
    tone: "success",
    dateKey: "recentDate.yesterday",
    avatar: "ST",
  },
];

const lowStockItems = [
  {
    nameKey: "dashExtra.lowAdhesive",
    variantKey: "dashExtra.lowAdhesiveVariant",
    quantity: 3,
    unit: "can",
    minimum: 5,
  },
  {
    nameKey: "dashExtra.lowUpper",
    variantKey: "dashExtra.lowUpperVariant",
    quantity: 4,
    unit: "sheet",
    minimum: 10,
  },
  {
    nameKey: "dashExtra.lowThread",
    variantKey: "dashExtra.lowThreadVariant",
    quantity: 2,
    unit: "pack",
    minimum: 5,
  },
  {
    nameKey: "dashExtra.lowSpring",
    variantKey: "dashExtra.lowSpringVariant",
    quantity: 6,
    unit: "pack",
    minimum: 12,
  },
  {
    nameKey: "dashExtra.lowBlade",
    variantKey: "dashExtra.lowBladeVariant",
    quantity: 4,
    unit: "pack",
    minimum: 10,
  },
];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isDari = i18n.language === "fa";
  const [today] = useState(() => new Date());

  const dateLabel = today.toLocaleDateString(
    isDari ? "fa-IR-u-ca-persian" : "en-US",
    { year: "numeric", month: "2-digit", day: "2-digit" }
  );

  const weekdayLabel = today.toLocaleDateString(
    isDari ? "fa-IR-u-ca-persian" : "en-US",
    { weekday: "long" }
  );

  const shortDate = (date) =>
    date.toLocaleDateString(isDari ? "fa-IR-u-ca-persian" : "en-US", {
      month: "2-digit",
      day: "2-digit",
    });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const weekRangeLabel = `${shortDate(weekStart)} - ${shortDate(today)}`;

  const salesData = [
    { day: t("days.saturday"), sales: 12000 },
    { day: t("days.sunday"), sales: 18000 },
    { day: t("days.monday"), sales: 15000 },
    { day: t("days.tuesday"), sales: 22000 },
    { day: t("days.wednesday"), sales: 17000 },
    { day: t("days.thursday"), sales: 26000 },
    { day: t("days.friday"), sales: 20000 },
  ];
  const stockMovementData = [
    { key: "in", labelKey: "movement.in", value: 58 },
    { key: "sale", labelKey: "movement.sale", value: 76 },
    { key: "reserved", labelKey: "movement.reserved", value: 44, highlight: true },
    { key: "damaged", labelKey: "movement.damaged", value: 30 },
    { key: "adjustment", labelKey: "movement.adjustment", value: 64 },
    { key: "return", labelKey: "movement.return", value: 48 },
  ];

  return (
    <div className="text-start">
      {/* Page head */}
      <div className="mb-6 flex flex-col justify-between gap-4 max-[720px]:mb-4 max-[720px]:gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6B7280]">
            <span>{dateLabel}</span>
            <span className="opacity-50">·</span>
            <span>{weekdayLabel}</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-[#111827] max-[720px]:text-xl">
            {t("page.dashboard.title")}
          </h1>

          <p className="mt-1 text-[13.5px] text-[#6B7280] max-[720px]:text-[13px]">
            {t("page.dashboard.sub")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-[720px]:mt-3 max-[720px]:w-full">
          <Link
            to="/purchases"
            className="inline-flex h-[42px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white px-[15px] text-[13.5px] font-semibold text-[#111827] hover:border-[#CFD4DB] hover:bg-[#FBFCFC] max-[720px]:min-h-[46px] max-[720px]:flex-1"
          >
            {t("action.newPurchase")}
          </Link>

          <Link
            to="/sales"
            className="inline-flex h-[42px] items-center justify-center gap-[7px] rounded-[10px] bg-[#0F5C55] px-[15px] text-[13.5px] font-semibold text-white hover:bg-[#0B4A44] max-[720px]:min-h-[46px] max-[720px]:flex-1"
          >
            <Plus size={17} strokeWidth={2} />
            <span>{t("action.newSale")}</span>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-4 max-[720px]:gap-[10px] min-[1100px]:grid-cols-6">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white px-[18px] py-[17px] max-[720px]:gap-[5px] max-[720px]:p-3"
            >
              <div className="flex items-start justify-between gap-2.5">
                <span className="min-w-0 text-[12.5px] text-[#6B7280] max-[720px]:text-[11px]">
                  {t(item.titleKey)}
                </span>

                <span
                  className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] max-[720px]:size-7 max-[720px]:rounded-lg ${kpiTones[item.tone]}`}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className="max-[720px]:size-[15px]"
                  />
                </span>
              </div>

              <div className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827] max-[720px]:text-[18px] max-[720px]:tracking-[-0.02em]">
                {item.value}{" "}
                <span className="text-[13px] font-semibold tracking-normal text-[#6B7280] max-[720px]:text-[10px]">
                  {item.unitKey ? t(item.unitKey) : item.unit}
                </span>
              </div>

              <div className="flex items-center gap-[5px] text-[11.5px] text-[#6B7280] max-[720px]:text-[10.5px] max-[720px]:leading-[1.35]">
                {(item.badge || item.badgeKey) && (
                  <span className="inline-flex h-[23px] shrink-0 items-center gap-[5px] rounded-full bg-[#EAF7EF] px-2 text-[11.5px] font-semibold text-[#15803D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {item.badge || t(item.badgeKey)}
                  </span>
                )}
                <span>{t(item.metaKey)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="mb-4 grid grid-cols-1 gap-4 max-[720px]:gap-[10px] min-[721px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {alerts.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-[12.5px] max-[720px]:px-3 max-[720px]:py-[11px] max-[720px]:text-xs ${alertTones[item.tone]}`}
            >
              <Icon size={17} strokeWidth={1.8} className="mt-px shrink-0" />

              <div>
                <strong className="block font-semibold">
                  {t(item.titleKey)}
                </strong>
                <div className="text-[11.5px]">
                  {t(item.descKey)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low stock items */}
      <div className="mb-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-[15px] max-[720px]:px-3.5 max-[720px]:py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#111827]">
              {t("inventory.lowStockTitle")}
            </h2>

            <div className="mt-0.5 text-xs text-[#6B7280]">
              {t("kpi.lowStockMeta")}
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] tabular-nums text-[#111827] max-[720px]:text-[18px] max-[720px]:tracking-[-0.02em]">
              {lowStockItems.length}
            </span>
            <span className="text-[13px] font-semibold tracking-normal text-[#6B7280] max-[720px]:text-[10px]">
              {t("dashExtra.lowItems")}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("inventory.itemName")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("inventory.variant")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-end text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("inventory.currentStock")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-end text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("inventory.minimumStock")}
                </th>
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("inventory.status")}
                </th>
              </tr>
            </thead>

            <tbody>
              {lowStockItems.map((item) => (
                <tr
                  key={item.name}
                  className="hover:bg-[#FAFBFB] [&:last-child>td]:border-b-0"
                >
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#111827]">
                    {t(item.nameKey)}
                  </td>

                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#6B7280]">
                    {t(item.variantKey)}
                  </td>

                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-end tabular-nums text-[#111827]">
                    {item.quantity} {unitLabel(item.unit, t)}
                  </td>

                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-end tabular-nums text-[#111827]">
                    {item.minimum} {unitLabel(item.unit, t)}
                  </td>

                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                    <span className="inline-flex h-[23px] items-center gap-[5px] rounded-full bg-[#FFF7E8] px-2 text-[11.5px] font-semibold text-[#B45309]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {t("inventory.lowStatus")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 max-[720px]:p-3.5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">
              {t("dash.quick")}
            </h2>
            <div className="mt-0.5 text-xs text-[#6B7280]">
              {t("dash.quickSub")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-[720px]:w-full">
            {quickActions.map((item) => {
              const Icon = item.icon;
              const className =
                "inline-flex items-center gap-[9px] rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[12.5px] font-semibold text-[#111827] hover:border-[#BFE0DA] hover:bg-[#FAFDFC] max-[720px]:min-h-[46px] max-[720px]:flex-[1_1_calc(50%_-_8px)] max-[720px]:justify-center";
              const content = (
                <>
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className="text-[#0F5C55] max-[720px]:size-[19px]"
                  />
                  <span>{t(item.labelKey)}</span>
                </>
              );

              return (
                <Link key={item.key} to={item.to} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {/* charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-[15px] max-[720px]:flex-wrap max-[720px]:gap-2.5 max-[720px]:px-3.5 max-[720px]:py-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111827]">
                {t("dash.sales7")}
              </h2>
              <div className="mt-0.5 text-xs text-[#6B7280]">
                AFN · {weekRangeLabel}
              </div>
            </div>

            <span className="inline-flex h-[23px] items-center gap-[5px] rounded-full bg-[#EAF7EF] px-2 text-[11.5px] font-semibold text-[#15803D]">
              +12.4%
            </span>
          </div>

          <div className="p-5 max-[720px]:p-3.5">
            <div className="h-[210px] w-full max-[720px]:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{ top: 10, right: 28, left: 28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#0F5C55"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#0F5C55"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="day"
                    interval={0}
                    reversed={isDari}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, "dataMax"]} />
                  <Tooltip
                    cursor={{ stroke: "#BFE0DA", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 8px 20px rgba(17, 24, 39, 0.08)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} AFN`,
                      t("dashboard.sales"),
                    ]}
                  />
                  <Area
                    type="linear"
                    dataKey="sales"
                    stroke="#0F5C55"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="url(#salesFill)"
                    dot={(props) => {
                      const { cx, cy, index } = props;
                      if (index !== salesData.length - 1) return null;
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#0F5C55"
                        />
                      );
                    }}
                    activeDot={{ r: 4, fill: "#0F5C55", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stock movement */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-[15px] max-[720px]:flex-wrap max-[720px]:gap-2.5 max-[720px]:px-3.5 max-[720px]:py-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#111827]">
                {t("dash.stockMovement")}
              </h2>
              <div className="mt-0.5 text-xs text-[#6B7280]">
                {t("dashExtra.movementSubtitle")}
              </div>
            </div>

            <Link
              to="/warehouse"
              className="text-[12.5px] font-semibold text-[#0F5C55] hover:underline"
            >
              {t("dash.viewAll")}
            </Link>
          </div>

          <div className="p-5 max-[720px]:p-3.5">
            <div className="flex h-[180px] items-end gap-[9px] pt-3 max-[720px]:h-[150px] max-[720px]:gap-1.5">
              {stockMovementData.map((item) => (
                <div
                  key={item.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className={`w-full max-w-[24px] rounded-t-[6px] rounded-b-[2px] border max-[720px]:max-w-[18px] ${
                      item.highlight
                        ? "border-[#0F5C55] bg-[#0F5C55]"
                        : "border-[#BFE0DA] bg-[#E6F2F0]"
                    }`}
                    style={{ height: `${item.value}%` }}
                  />
                  <span className="text-[10px] text-[#6B7280] max-[720px]:text-[9px]">
                    {t(item.labelKey)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-[15px] max-[720px]:px-3.5 max-[720px]:py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#111827]">
              {t("dash.recent")}
            </h2>
            <div className="mt-0.5 text-xs text-[#6B7280]">
              {t("dash.recentSub")}
            </div>
          </div>

          <Link
            to="/sales"
            className="text-[12.5px] font-semibold text-[#0F5C55] hover:underline"
          >
            {t("dash.viewAll")}
          </Link>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {[
                  "label.reference",
                  "label.type",
                  "label.customer",
                  "label.items",
                ].map((key) => (
                  <th
                    key={key}
                    className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]"
                  >
                    {t(key)}
                  </th>
                ))}
                <th className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-end text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]">
                  {t("label.total")}
                </th>
                {["label.status", "label.date"].map((key) => (
                  <th
                    key={key}
                    className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#FBFCFC] px-4 py-[11px] text-start text-[10.5px] font-bold uppercase tracking-[.06em] text-[#6B7280]"
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {recentActivity.map((item) => (
                <tr
                  key={item.ref}
                  className="hover:bg-[#FAFBFB] [&:last-child>td]:border-b-0"
                >
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle font-semibold text-[#111827]">
                    {item.ref}
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#111827]">
                    {t(item.typeKey)}
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#111827]">
                    {t(item.customerKey)}
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#111827]">
                    {t(item.itemsKey, { count: item.itemCount })}
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-end font-semibold tabular-nums text-[#111827]">
                    {item.total}
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle">
                    <span
                      className={`inline-flex h-[23px] items-center gap-[5px] rounded-full px-2 text-[11.5px] font-semibold ${recentBadgeTones[item.tone]}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {t(item.badgeKey)}
                    </span>
                  </td>
                  <td className="border-b border-[#E5E7EB] px-4 py-[13px] align-middle text-[#6B7280]">
                    {item.dateKey ? t(item.dateKey) : item.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5 max-[720px]:px-3.5 max-[720px]:pb-3.5 lg:hidden">
          <div className="flex flex-col">
            {recentActivity.slice(0, 3).map((item) => (
              <div
                key={item.ref}
                className="flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0"
              >
                <div
                  className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] border text-[11px] font-bold ${
                    item.avatarTone === "warn"
                      ? "border-[#FDE8C2] bg-[#FFF7E8] text-[#B45309]"
                      : "border-[#E5E7EB] bg-[#F4F6F5] text-[#0F5C55]"
                  }`}
                >
                  {item.avatar}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[#111827]">
                    {item.ref} · {t(item.customerKey)}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {t(item.itemsKey, { count: item.itemCount })} ·{" "}
                    {item.dateKey ? t(item.dateKey) : item.date}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-[3px]">
                  <span className="font-semibold text-[#111827]">
                    {item.total}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 text-[11px] font-semibold ${recentBadgeTones[item.tone]}`}
                  >
                    {t(item.badgeKey)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
