import React from "react";
import { useToastStore, type ToastItem } from "../state/toastStore";

const typeStyles: Record<string, string> = {
  info: "bg-[#2a2520] border-[#c7ad80]/60 text-[#d8c598]",
  success: "bg-[#1a2e1a] border-green-500/60 text-green-200",
  error: "bg-[#2e1a1a] border-red-500/60 text-red-200",
};

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[9999] flex flex-col gap-2 -translate-x-1/2 pointer-events-none"
      style={{ maxWidth: "min(90vw, 340px)" }}
    >
      {toasts.map((t) => (
        <ToastEntry key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastEntry({ item }: { item: ToastItem }) {
  const style = typeStyles[item.type] ?? typeStyles.info;

  return (
    <div
      className={`px-4 py-3 rounded-lg border text-sm shadow-lg ${style}`}
      role="alert"
    >
      {item.message}
    </div>
  );
}
