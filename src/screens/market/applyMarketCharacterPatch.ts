import type { Character } from "../../utils/api";
import { applyCharacterSnapshotFromApi } from "../../state/heroStore";

/** Одразу застосовуємо повний server snapshot після мутацій ринку. */
export function applyMarketCharacterPatch(c: Character) {
  applyCharacterSnapshotFromApi(c);
}
