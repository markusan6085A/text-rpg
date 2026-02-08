import { create } from "zustand";
import { useCharacterStore } from "./characterStore";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;

  setAccessToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,

  setAccessToken: (token: string | null) => {
    set({
      accessToken: token,
      isAuthenticated: !!token,
    });
  },

  logout: () => {
    const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    useCharacterStore.getState().setCharacterId(null);
    set({ accessToken: null, isAuthenticated: false });
  },

  initialize: () => {
    set({ accessToken: null, isAuthenticated: false });
  },
}));
