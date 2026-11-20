import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  LayoutDashboard,FileText,RefreshCcw, Package, Warehouse,ClipboardCheck,
  ArrowLeftRight,ShoppingCart,Truck,Wallet, Users,ChartNoAxesCombined,
  RefreshCw, Settings,Search, Globe, Menu, X, MoreHorizontal, ChevronLeft, ChevronRight,
} from "lucide-react";

const navigation = [
  {
    titleKey: "navGroup.main",
    items: [{ labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    titleKey: "navGroup.sales",
    items: [
      { labelKey: "nav.invoices", path: "/sales", icon: FileText },
      { labelKey: "nav.returns", path: "/returns", icon: RefreshCcw },
    ],
  },
  {
    titleKey: "navGroup.productsWarehouse",
    items: [
      { labelKey: "nav.products", path: "/products", icon: Package },
      { labelKey: "nav.warehouse", path: "/warehouse", icon: Warehouse },
      { labelKey: "nav.stocktake", path: "/stocktake", icon: ClipboardCheck },
      { labelKey: "nav.movements", path: "/movements", icon: ArrowLeftRight },
    ],
  },
  {
    titleKey: "navGroup.purchasing",
    items: [
      { labelKey: "nav.purchases", path: "/purchases", icon: ShoppingCart },
      { labelKey: "nav.suppliers", path: "/suppliers", icon: Truck },
    ],
  },
  {
    titleKey: "navGroup.financeCustomers",
    items: [
      { labelKey: "nav.hawala", path: "/hawala", icon: Wallet },
      { labelKey: "nav.customers", path: "/customers", icon: Users },
      { labelKey: "nav.debts", path: "/debts", icon: Wallet },
      { labelKey: "nav.reports", path: "/reports", icon: ChartNoAxesCombined },
    ],
  },
  {
    titleKey: "navGroup.system",
    items: [
      { labelKey: "nav.sync", path: "/sync", icon: RefreshCw, badge: "3" },
      { labelKey: "nav.settings", path: "/settings", icon: Settings },
    ],
  },
];

const mobileItems = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.invoices", path: "/sales", icon: FileText },
  { labelKey: "nav.products", path: "/products", icon: Package },
  { labelKey: "nav.warehouse", path: "/warehouse", icon: Warehouse },
];

const searchEntities = [
  {
    type: "product",
    path: "/products",
    labelFa: "چسپ",
    labelEn: "Adhesive",
    subFa: "قوطی ۱ کیلویی",
    subEn: "1 kg can",
  },
  {
    type: "product",
    path: "/products",
    labelFa: "کوری",
    labelEn: "Last",
    subFa: "رنگ سیاه",
    subEn: "Black",
  },
  {
    type: "product",
    path: "/products",
    labelFa: "نخ",
    labelEn: "Thread",
    subFa: "نخ سفید",
    subEn: "White thread",
  },
  {
    type: "product",
    path: "/products",
    labelFa: "فنر",
    labelEn: "Spring",
    subFa: "فنر فولادی",
    subEn: "Steel spring",
  },
  {
    type: "product",
    path: "/products",
    labelFa: "تیغ",
    labelEn: "Blade",
    subFa: "تیغ برش",
    subEn: "Cutting blade",
  },
  {
    type: "invoice",
    path: "/sales",
    labelFa: "INV-1042",
    labelEn: "INV-1042",
    subFa: "فروشگاه کفش نور",
    subEn: "Noor Shoe Store",
  },
  {
    type: "purchase",
    path: "/purchases",
    labelFa: "PO-203",
    labelEn: "PO-203",
    subFa: "Guangzhou Sole Co.",
    subEn: "Guangzhou Sole Co.",
  },
  {
    type: "return",
    path: "/returns",
    labelFa: "RT-018",
    labelEn: "RT-018",
    subFa: "حاجی رحیم",
    subEn: "Haji Rahim",
  },
  {
    type: "stocktake",
    path: "/stocktake",
    labelFa: "ST-011",
    labelEn: "ST-011",
    subFa: "گدام اصلی",
    subEn: "Main Warehouse",
  },
  {
    type: "customer",
    path: "/customers",
    labelFa: "حاجی رحیم",
    labelEn: "Haji Rahim",
    subFa: "مشتری",
    subEn: "Customer",
  },
  {
    type: "customer",
    path: "/customers",
    labelFa: "استاد کریم",
    labelEn: "Ustad Karim",
    subFa: "مشتری",
    subEn: "Customer",
  },
  {
    type: "supplier",
    path: "/suppliers",
    labelFa: "Guangzhou Sole Co.",
    labelEn: "Guangzhou Sole Co.",
    subFa: "تأمین‌کننده",
    subEn: "Supplier",
  },
];

const searchTypeIcons = {
  page: LayoutDashboard,
  product: Package,
  invoice: FileText,
  purchase: ShoppingCart,
  return: RefreshCcw,
  stocktake: ClipboardCheck,
  customer: Users,
  supplier: Truck,
};

export default function MainLayout() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultOpen, setResultOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const isDari = i18n.language === "fa";
  const direction = isDari ? "rtl" : "ltr";

  const toggleLanguage = () => {
    i18n.changeLanguage(isDari ? "en" : "fa");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path;
  };

  const closeMenu = () => setMenuOpen(false);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const pages = navigation.flatMap((group) =>
      group.items.map((item) => ({
        type: "page",
        path: item.path,
        label: t(item.labelKey),
        sub: t(group.titleKey),
        keywords: `${t(item.labelKey)} ${item.path}`,
      }))
    );

    const entities = searchEntities.map((item) => ({
      type: item.type,
      path: item.path,
      label: isDari ? item.labelFa : item.labelEn,
      sub: isDari ? item.subFa : item.subEn,
      keywords: `${item.labelFa} ${item.labelEn} ${item.subFa} ${item.subEn} ${item.path}`,
    }));

    return [...pages, ...entities]
      .filter((item) =>
        `${item.keywords} ${item.label} ${item.sub}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, isDari, t]);

  useEffect(() => {
    if (!resultOpen) return;

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResultOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [resultOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const goToResult = (result) => {
    if (!result) return;
    navigate(result.path);
    setQuery("");
    setResultOpen(false);
    setSearchOpen(false);
  };

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
    setActiveIndex(0);
    setResultOpen(true);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setResultOpen(false);
      setQuery("");
      event.currentTarget.blur();
      return;
    }

    if (!searchResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % searchResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + searchResults.length) % searchResults.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      goToResult(searchResults[activeIndex]);
    }
  };

  return (
    <div
      dir={direction}
      className="min-h-screen bg-[#F4F6F5] text-[#111827]"
      style={{
        fontFamily: isDari
          ? "'Vazirmatn', Tahoma, sans-serif"
          : "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 z-40 hidden w-[240px] flex-col gap-[22px] overflow-y-auto border-[#E5E7EB] bg-white px-[14px] py-5 lg:flex ${
          isDari ? "right-0 border-l" : "left-0 border-r"
        }`}
      >
        <Brand />

        <SidebarNavigation isActive={isActive} />

        <WarehouseStatus />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 z-[60] flex w-[280px] flex-col gap-6 overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
          isDari ? "right-0" : "left-0"
        } ${
          menuOpen
            ? "translate-x-0"
            : isDari
              ? "translate-x-full"
              : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Brand />

          <button
            onClick={closeMenu}
            aria-label={t("common.closeDialog")}
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-gray-100"
          >
            <X size={21} />
          </button>
        </div>

        <SidebarNavigation isActive={isActive} onNavigate={closeMenu} />

        <WarehouseStatus />
      </aside>

      {/* Main Area */}
      <div
        className={`min-h-screen min-w-0 ${
          isDari ? "lg:mr-[240px]" : "lg:ml-[240px]"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-[#E5E7EB] bg-white px-3 sm:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-[#F4F6F5] lg:hidden"
          >
            <Menu size={21} />
          </button>

          {/* Page Title */}
          <div className="min-w-0 shrink-0 text-sm font-semibold">
            <span className="hidden text-gray-500 sm:inline">
              {t("brand.name")}
              <span className="mx-2 text-gray-300">/</span>
            </span>

            <span className="truncate">{getPageTitle(location.pathname, t)}</span>
          </div>

          {/* Search */}
          <div
            ref={searchRef}
            className={`${
              searchOpen ? "flex" : "hidden"
            } absolute inset-x-2 top-[calc(100%+6px)] z-40 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg sm:relative sm:inset-auto sm:mx-auto sm:flex sm:w-full sm:max-w-[440px] sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}
          >
            <div className="relative w-full">
              <Search
                size={17}
                className={`pointer-events-none absolute top-3 text-gray-400 ${
                  isDari ? "right-3" : "left-3"
                }`}
              />

              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (query.trim()) setResultOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                aria-label={t("search.label")}
                placeholder={t("search.placeholder")}
                className={`h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-[#F4F6F5] text-sm outline-none transition focus:border-[#0F5C55] focus:ring-4 focus:ring-[#E6F2F0] ${
                  isDari ? "pr-10 pl-3" : "pl-10 pr-3"
                }`}
              />

              {resultOpen && query.trim() && (
                <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_16px_40px_rgba(17,24,39,0.14)]">
                  {searchResults.length > 0 ? (
                    <ul className="max-h-[340px] overflow-y-auto py-1">
                      {searchResults.map((result, index) => {
                        const Icon = searchTypeIcons[result.type];

                        return (
                          <li
                            key={`${result.type}-${result.path}-${result.label}`}
                          >
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => goToResult(result)}
                              className={`flex w-full items-center gap-3 px-3 py-2 text-start transition ${
                                index === activeIndex
                                  ? "bg-[#E6F2F0]"
                                  : "hover:bg-[#F4F6F5]"
                              }`}
                            >
                              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F4F6F5] text-[#0F5C55]">
                                <Icon size={16} strokeWidth={1.8} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold text-[#111827]">
                                  {result.label}
                                </span>
                                <span className="block truncate text-[11.5px] text-[#6B7280]">
                                  {result.sub}
                                </span>
                              </span>

                              <span className="shrink-0 rounded-full bg-[#F4F6F5] px-2 py-0.5 text-[10.5px] font-semibold text-[#6B7280]">
                                {t(`search.type.${result.type}`)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-[#6B7280]">
                      {t("search.noResults")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <span className="hidden h-[30px] items-center gap-2 rounded-full bg-[#EAF7EF] px-3 text-[11px] font-semibold text-[#15803D] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#15803D]" />
              {t("common.synced")}
            </span>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 hover:bg-[#F4F6F5] sm:hidden"
            >
              <Search size={19} />
            </button>

            <button
              onClick={toggleLanguage}
              title={t("language.change")}
              aria-label={t("language.change")}
              className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 hover:bg-[#F4F6F5]"
            >
              <Globe size={19} />
            </button>

            <button
              title={t("user.name")}
              aria-label={t("user.name")}
              className="flex items-center gap-2 rounded-full border border-[#BFE0DA] bg-[#E6F2F0] py-1 pe-3 ps-1 text-xs font-bold text-[#0F5C55]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0F5C55] text-[10px] text-white">
                {t("user.initials")}
              </span>
              <span className="hidden sm:inline">{t("user.name")}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] px-3 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#E5E7EB] bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_16px_rgba(17,24,39,0.06)] lg:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium ${
                active ? "text-[#0F5C55]" : "text-gray-500"
              }`}
            >
              <Icon size={20} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}

        <button
          onClick={() => setMenuOpen(true)}
          className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-medium text-gray-500"
        >
          <MoreHorizontal size={21} />
          <span>{t("common.more")}</span>
        </button>
      </nav>
    </div>
  );
}

/* Brand */
function Brand() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[#0F5C55] text-[15px] font-bold tracking-tight text-white shadow-inner">
        GS
      </div>

      <div>
        <div className="text-[15px] font-bold leading-tight">{t("brand.name")}</div>
        <div className="mt-[3px] text-[11px] text-[#6B7280]">{t("brand.tagline")}</div>
      </div>
    </div>
  );
}

/* Sidebar Navigation */
function SidebarNavigation({ isActive, onNavigate }) {
  const { i18n, t } = useTranslation();
  const isDari = i18n.language === "fa";
  const ActiveChevron = isDari ? ChevronLeft : ChevronRight;

  return (
    <nav className="flex flex-col gap-[18px]">
      {navigation.map((group) => (
        <div key={group.titleKey} className="flex flex-col gap-[3px]">
          <div className="mb-1 px-[10px] text-[10px] font-bold tracking-wider text-[#6B7280]">
            {t(group.titleKey)}
          </div>

          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onNavigate}
                className={`relative flex min-h-10 items-center gap-[10px] rounded-[10px] px-[10px] py-[9px] text-[13px] font-medium transition ${
                  active
                    ? "bg-[#E6F2F0] font-semibold text-[#0F5C55] before:absolute before:inset-y-[10px] before:start-0 before:w-[3px] before:rounded-full before:bg-[#B08D57]"
                    : "text-[#6B7280] hover:bg-[#F4F6F5] hover:text-[#111827]"
                }`}
              >
                <Icon size={18} className="shrink-0" />

                <span className="min-w-0 flex-1">{t(item.labelKey)}</span>

                {item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#FDECEC] px-1 text-[11px] font-bold text-[#B91C1C]">
                    {item.badge}
                  </span>
                )}

                {active && (
                  <ActiveChevron size={14} className="text-[#0F5C55] opacity-50" />
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/* Warehouse Status */
function WarehouseStatus() {
  const { t } = useTranslation();

  return (
    <div className="mt-auto border-t border-[#E5E7EB] pt-3">
      <div className="flex items-center gap-[9px] rounded-[10px] border border-[#E5E7EB] bg-[#FBFCFC] p-[10px]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#15803D]" />

        <div>
          <strong className="block text-[12px] font-semibold">
            {t("nav.warehouse")}
          </strong>

          <span className="block text-[11px] text-[#6B7280]">
            {t("label.available")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Page Titles */
const pageTitleKeys = {
  "/": "nav.dashboard",
  "/sales": "nav.invoices",
  "/returns": "nav.returns",
  "/products": "nav.products",
  "/products/new": "pageTitle.productNew",
  "/warehouse": "nav.warehouse",
  "/stocktake": "nav.stocktake",
  "/movements": "nav.movements",
  "/purchases": "nav.purchases",
  "/suppliers": "nav.suppliers",
  "/hawala": "nav.hawala",
  "/customers": "nav.customers",
  "/debts": "nav.debts",
  "/reports": "nav.reports",
  "/sync": "nav.sync",
  "/settings": "nav.settings",
};

function getPageTitle(path, t) {
  if (/^\/products\/[^/]+\/edit$/.test(path)) return t("pageTitle.productEdit");
  return t(pageTitleKeys[path] ?? "nav.dashboard");
}