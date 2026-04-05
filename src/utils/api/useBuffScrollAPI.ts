import { apiRequest } from "./core";
import { useCharacterStore } from "../../state/characterStore";
import type { Character } from "./typesAuthCharacter";

export interface UseBuffScrollResult {
  ok: boolean;
  character: Character;
}

export async function useBuffScrollAPI(itemId: string, expectedRevision: number): Promise<UseBuffScrollResult> {
  const characterId = useCharacterStore.getState().characterId;
  if (!characterId) throw new Error("no character id");

  return apiRequest<UseBuffScrollResult>(`/characters/${characterId}/use-buff-scroll`, {
    method: "POST",
    body: JSON.stringify({ itemId, expectedRevision }),
  });
}
