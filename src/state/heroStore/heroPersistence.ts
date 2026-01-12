import type { Hero } from "../../types/Hero";
import { updateCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { getJSON, setJSON } from "../persistence"; // Fallback for localStorage

// Try to save via API, fallback to localStorage if not authenticated
export async function saveHeroToLocalStorage(hero: Hero): Promise<void> {
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  // If not authenticated, use localStorage (backward compatibility)
  if (!authStore.isAuthenticated || !characterStore.characterId) {
    const current = getJSON<string | null>("l2_current_user", null);
    if (!current) return;

    const accounts = getJSON<any[]>("l2_accounts_v2", []);
    const accIndex = accounts.findIndex((a: any) => a.username === current);
    if (accIndex !== -1) {
      accounts[accIndex].hero = hero;
      setJSON("l2_accounts_v2", accounts);
    }
    return;
  }

  // Save via API
  try {
    await updateCharacter(characterStore.characterId, {
      heroJson: hero,
      level: hero.level,
      exp: hero.exp,
      sp: hero.sp,
      adena: hero.adena,
      aa: hero.aa || 0,
      coinLuck: hero.coinOfLuck || 0,
    });
  } catch (error) {
    console.error('Failed to save hero via API:', error);
    // Fallback to localStorage on error
    const current = getJSON<string | null>("l2_current_user", null);
    if (current) {
      const accounts = getJSON<any[]>("l2_accounts_v2", []);
      const accIndex = accounts.findIndex((a: any) => a.username === current);
      if (accIndex !== -1) {
        accounts[accIndex].hero = hero;
        setJSON("l2_accounts_v2", accounts);
      }
    }
  }
}
