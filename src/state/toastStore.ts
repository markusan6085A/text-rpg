/**
 * Простий toast store — замість window.alert для інформаційних повідомлень.
 * Не блокує UI, зникає через 4 сек.
 */
import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  add: (message: string, type: ToastType = "info") => {
    const id = ++nextId;
    const item: ToastItem = { id, message, type, createdAt: Date.now() };
    set((s) => ({ toasts: [...s.toasts, item] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  remove: (id: number) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Викликати з будь-якого місця замість alert() */
export function showToast(message: string, type?: ToastType): void {
  useToastStore.getState().add(message, type ?? "info");
}
