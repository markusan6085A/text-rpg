import { create } from "zustand";
import { adminMe } from "../utils/api";

interface AdminState {
  isAdmin: boolean;
  checked: boolean;
  checkAdmin: () => Promise<void>;
  /** Скинути адмін-стан (наприклад при виході з гри, щоб звичайний акаунт не бачив адмін-кнопки) */
  resetAdmin: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  checked: false,

  checkAdmin: async () => {
    try {
      await adminMe();
      set({ isAdmin: true, checked: true });
    } catch {
      set({ isAdmin: false, checked: true });
    }
  },

  resetAdmin: () => set({ isAdmin: false, checked: true }),
}));
