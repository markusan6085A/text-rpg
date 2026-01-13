// Auth store for managing authentication state
import { create } from 'zustand';
import { setString, getString, removeItem } from './persistence';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  
  setToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,

  setToken: (token: string | null) => {
    if (token) {
      setString('auth_token', token);
      set({ token, isAuthenticated: true });
    } else {
      removeItem('auth_token');
      set({ token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    removeItem('auth_token');
    removeItem('current_character_id'); // Also clear current character
    set({ token: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = getString('auth_token', null);
    if (token) {
      set({ token, isAuthenticated: true });
    } else {
      set({ token: null, isAuthenticated: false });
    }
  },
}));
