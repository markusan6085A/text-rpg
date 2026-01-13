// Store for current character ID
import { create } from 'zustand';
import { setString, getString, removeItem } from './persistence';

interface CharacterState {
  characterId: string | null;
  
  setCharacterId: (id: string | null) => void;
  initialize: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characterId: null,

  setCharacterId: (id: string | null) => {
    if (id) {
      setString('current_character_id', id);
      set({ characterId: id });
    } else {
      removeItem('current_character_id');
      set({ characterId: null });
    }
  },

  initialize: () => {
    const id = getString('current_character_id', null);
    if (id) {
      set({ characterId: id });
    } else {
      set({ characterId: null });
    }
  },
}));
