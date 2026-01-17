// Утиліти для навігації між локаціями та містом
import { getString, setString, removeItem } from "../state/persistence";

const PREV_LOCATION_KEY = "l2_prev_location";

export function savePreviousLocation(zoneId: string): void {
  try {
    setString(PREV_LOCATION_KEY, zoneId);
  } catch (err) {
    console.error("[locationNavigation] Failed to save previous location:", err);
  }
}

export function getPreviousLocation(): string | null {
  try {
    return getString(PREV_LOCATION_KEY, null);
  } catch (err) {
    console.error("[locationNavigation] Failed to get previous location:", err);
    return null;
  }
}

export function clearPreviousLocation(): void {
  try {
    removeItem(PREV_LOCATION_KEY);
  } catch (err) {
    console.error("[locationNavigation] Failed to clear previous location:", err);
  }
}
