import { create } from "zustand";
import { adminMe } from "../utils/api";

interface AdminState {
  isAdmin: boolean;
  checked: boolean;
  checkAdmin: () => Promise<void>;
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
}));
