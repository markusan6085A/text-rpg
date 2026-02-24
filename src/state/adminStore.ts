import { create } from "zustand";
import { adminMe } from "../utils/api";

interface AdminState {
  isAdmin: boolean;
  checked: boolean;
  checkAdmin: () => Promise<void>;
  /** Скинути адмін-стан (наприклад при виході з гри, щоб звичайний акаунт не бачив адмін-кнопки) */
  resetAdmin: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdmin: false,
  checked: false,

  checkAdmin: async () => {
    if (get().checked) return; // Вже перевірено — уникаємо зайвих запитів і оновлень
    // Prevent concurrent checks
    if ((get() as any)._checking) return;
    set({ _checking: true } as any);
    
    try {
      await adminMe();
      set({ isAdmin: true, checked: true, _checking: false } as any);
    } catch {
      set({ isAdmin: false, checked: true, _checking: false } as any);
    }
  },

  resetAdmin: () => set({ isAdmin: false, checked: true, _checking: false } as any),
}));
