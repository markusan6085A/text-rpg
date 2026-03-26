import { useState, useEffect, useMemo } from "react";
import type { ChatMessage } from "../../../utils/api";
import type { ChatChannel } from "../types";

export interface OutboxMessage extends ChatMessage {
  status?: "pending" | "sent"; // Статус повідомлення
}

function loadOutbox(storageKey: string): OutboxMessage[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** characterId — щоб outbox не змішувався між персонажами в одному браузері */
export function useOutbox(channel: ChatChannel, characterId?: string | null) {
  const storageKey = useMemo(() => {
    const scope = characterId ? String(characterId) : "_nochar_";
    return `chat:outbox:${scope}:${channel}`;
  }, [channel, characterId]);

  const [outbox, setOutbox] = useState<OutboxMessage[]>(() => loadOutbox(storageKey));

  useEffect(() => {
    setOutbox(loadOutbox(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(outbox));
    } catch (e) {
      console.error("[chat] Failed to save outbox to localStorage:", e);
    }
  }, [outbox, storageKey]);

  return [outbox, setOutbox] as const;
}
