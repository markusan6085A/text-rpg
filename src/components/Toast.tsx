import React from "react";
import { useToastStore, type ToastItem, type ToastType } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";

function defaultTitle(type: ToastType): string {
  switch (type) {
    case "error":
      return "Помилка";
    case "success":
      return "Успішно";
    default:
      return "Повідомлення";
  }
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  const item = toasts[0];
  return (
    <ToastOverlay
      key={item.id}
      item={item}
      onDismiss={() => remove(item.id)}
    />
  );
}

function ToastOverlay({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const title = item.title?.trim() || defaultTitle(item.type);

  const panel =
    isL2
      ? "rounded-xl border border-[#c7ad80]/35 p-5 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
      : "bg-[#14110c] border border-white/40 rounded-lg p-5 max-w-md w-full";

  const titleCl = isL2 ? "text-base font-semibold text-[#e8c56e]" : "text-base font-semibold text-[#b8860b]";
  const bodyCl = isL2 ? "text-[#d4c4a8] text-sm whitespace-pre-wrap break-words" : "text-gray-300 text-sm whitespace-pre-wrap break-words";

  const okBtn =
    isL2
      ? "px-5 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#3a3020] to-[#1c1810] text-xs font-semibold text-[#e8c56e] hover:border-[#c7ad80]/50 hover:brightness-110"
      : "px-5 py-2 rounded-md bg-green-700 text-white hover:bg-green-600 text-xs font-semibold";

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="toast-title"
      onClick={onDismiss}
    >
      <div className={`${panel} pointer-events-auto`} onClick={(e) => e.stopPropagation()}>
        <h2 id="toast-title" className={`${titleCl} mb-3 pr-8`}>
          {title}
        </h2>
        <p className={`${bodyCl} mb-5`}>{item.message}</p>
        <div className="flex justify-center">
          <button type="button" className={okBtn} onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
