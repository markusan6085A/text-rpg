/**
 * Глобальні повідомлення: успіх / помилка / інфо.
 * Закриваються лише кнопкою OK (або тапом по фону), без авто-таймера.
 */
import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

export type ShowToastOptions = {
  title?: string;
  /** Викликається після закриття цього тоста (OK / фон). */
  onDismiss?: () => void;
};

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  createdAt: number;
  title?: string;
  onDismiss?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  add: (message: string, type?: ToastType, options?: ShowToastOptions) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  add: (message: string, type: ToastType = "info", options?: ShowToastOptions) => {
    const id = ++nextId;
    const item: ToastItem = {
      id,
      message,
      type,
      createdAt: Date.now(),
      title: options?.title,
      onDismiss: options?.onDismiss,
    };
    set((s) => ({ toasts: [...s.toasts, item] }));
  },

  remove: (id: number) => {
    const item = get().toasts.find((t) => t.id === id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    if (item?.onDismiss) {
      queueMicrotask(() => item.onDismiss?.());
    }
  },
}));

/** Замість alert() — однаковий діалог по всьому клієнту */
export function showToast(message: string, type?: ToastType, options?: ShowToastOptions): void {
  useToastStore.getState().add(message, type ?? "info", options);
}
