import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { ToastContext } from "../contexts/toast";

const toneStyles = {
  success: {
    shell: "border-[#BFE0DA] bg-[#F0FBF6]",
    icon: "text-[#15803D]",
    text: "text-[#14532D]",
    Icon: CheckCircle2,
  },
  warning: {
    shell: "border-[#FDE8C2] bg-[#FFFAF0]",
    icon: "text-[#B45309]",
    text: "text-[#7C2D12]",
    Icon: AlertTriangle,
  },
  error: {
    shell: "border-[#F6CACA] bg-[#FFF5F5]",
    icon: "text-[#B91C1C]",
    text: "text-[#7F1D1D]",
    Icon: XCircle,
  },
  info: {
    shell: "border-[#CFDCFA] bg-[#F5F8FF]",
    icon: "text-[#1D4ED8]",
    text: "text-[#1E3A8A]",
    Icon: Info,
  },
};

export default function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const existingTimer = timers.current.get(id);
    if (existingTimer) clearTimeout(existingTimer);

    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
    );

    const removeTimer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, 180);
    timers.current.set(id, removeTimer);
  }, []);

  const push = useCallback(
    (tone, message) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [
        ...current.slice(-3),
        { id, tone, message: String(message ?? ""), leaving: false },
      ]);
      const timer = setTimeout(() => dismiss(id), 4200);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      warning: (message) => push("warning", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
      dismiss,
    }),
    [push, dismiss]
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 end-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-[360px] flex-col gap-2">
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone] ?? toneStyles.info;
          const Icon = style.Icon;
          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`gluvia-toast pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-[0_12px_30px_rgba(17,24,39,0.10)] ${style.shell} ${
                toast.leaving ? "gluvia-toast-leaving" : ""
              }`}
            >
              <Icon size={18} strokeWidth={1.9} className={`mt-0.5 shrink-0 ${style.icon}`} />
              <p className={`min-w-0 flex-1 text-[12.5px] font-semibold leading-relaxed ${style.text}`}>
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label={t("common.closeNotification")}
                className={`grid size-6 shrink-0 place-items-center rounded-md transition hover:bg-black/5 ${style.icon}`}
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
