/**
 * Глобальний онлайн-лічильник — Layout і About читають/пишуть однакове значення.
 * Коли користувач відкриває Меню, бачить вже завантажений count (якщо Layout встиг завантажити).
 */
import { create } from "zustand";

interface OnlineCountState {
  onlineCount: number;
  setOnlineCount: (n: number) => void;
}

export const useOnlineCountStore = create<OnlineCountState>((set) => ({
  onlineCount: 0,
  setOnlineCount: (n) => set({ onlineCount: n }),
}));
