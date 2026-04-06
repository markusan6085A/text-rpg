import { create } from "zustand";
import { adminCheck } from "../utils/api";

interface AdminState {
  isAdmin: boolean;
  checked: boolean;
  checkAdmin: () => Promise<void>;
  /** Після POST /admin/auth/login треба зчитати cookie знову, навіть якщо checkAdmin вже відпрацьовував */
  recheckAdminAfterLogin: () => Promise<void>;
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
      const data = await adminCheck();
      set({ isAdmin: !!data?.ok && !!data?.admin, checked: true, _checking: false } as any);
    } catch {
      set({ isAdmin: false, checked: true, _checking: false } as any);
    }
  },

  recheckAdminAfterLogin: async () => {
    set({ checked: false, _checking: false } as any);
    await get().checkAdmin();
  },

  resetAdmin: () => set({ isAdmin: false, checked: true, _checking: false } as any),
}));
