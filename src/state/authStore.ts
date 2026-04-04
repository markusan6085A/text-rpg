import { create } from "zustand";
import { useCharacterStore } from "./characterStore";
import { clearChatClientCaches } from "../hooks/useChatMessages";
import { usePartyStore } from "./partyStore";
import { clearHardReloadAfterAuthGate } from "../utils/hardReloadForNewAppBundle";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Після 401/403 і logout — true; після успішного refresh (setAccessToken) — false. Не славити PUT/GET, поки true. */
  sessionExpired: boolean;

  setAccessToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  sessionExpired: false,

  setAccessToken: (token: string | null) => {
    set({
      accessToken: token,
      isAuthenticated: !!token,
      sessionExpired: false, // Сесію відновлено — можна славити
    });
  },

  logout: () => {
    clearHardReloadAfterAuthGate();
    const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch((err) => {
      console.error("Logout request failed:", err);
    });
    useCharacterStore.getState().setCharacterId(null);
    usePartyStore.getState().clear();
    clearChatClientCaches();
    set({ accessToken: null, isAuthenticated: false, sessionExpired: true });
  },

  initialize: () => {
    set({ accessToken: null, isAuthenticated: false, sessionExpired: false });
  },
}));
