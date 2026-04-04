import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";

export interface UseBuffScrollResult {
  ok: boolean;
  heroJson: any;
}

export async function useBuffScrollAPI(itemId: string): Promise<UseBuffScrollResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<UseBuffScrollResult>(`/characters/${characterId}/use-buff-scroll`, {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
}
