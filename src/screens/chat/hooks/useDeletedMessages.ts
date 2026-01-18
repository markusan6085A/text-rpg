import { useState, useEffect } from "react";
import type { ChatChannel } from "../types";

export function useDeletedMessages(channel: ChatChannel) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`chat:deleted:${channel}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('[chat] Failed to load deletedIds from localStorage:', e);
    }
    return new Set();
  });

  // Оновлюємо localStorage при зміні deletedIds
  useEffect(() => {
    try {
      const idsArray = Array.from(deletedIds);
      localStorage.setItem(`chat:deleted:${channel}`, JSON.stringify(idsArray));
    } catch (e) {
      console.error('[chat] Failed to save deletedIds to localStorage:', e);
    }
  }, [deletedIds, channel]);

  return [deletedIds, setDeletedIds] as const;
}
