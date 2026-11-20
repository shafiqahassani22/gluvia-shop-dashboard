import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gluvia-confirm-title"
        className="w-full max-w-[420px] rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_24px_60px_rgba(17,24,39,0.18)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#FFF7E8] text-[#B45309]">
              <AlertTriangle size={19} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h2 id="gluvia-confirm-title" className="text-[15px] font-semibold text-[#111827]">
                {title}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6B7280]">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.closeDialog")}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F4F6F5]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-4 text-[13px] font-semibold text-[#374151] hover:bg-[#FBFCFC]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-[10px] bg-[#B91C1C] px-4 text-[13px] font-semibold text-white hover:bg-[#991B1B]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
