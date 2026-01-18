import { useState, useEffect } from "react";
import type { ChatMessage } from "../../../utils/api";
import type { ChatChannel } from "../types";

export interface OutboxMessage extends ChatMessage {
  status?: 'pending' | 'sent'; // Статус повідомлення
}

export function useOutbox(channel: ChatChannel) {
  const [outbox, setOutbox] = useState<OutboxMessage[]>(() => {
    try {
      const raw = localStorage.getItem(`chat:outbox:${channel}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Зберігаємо outbox в localStorage при зміні
  useEffect(() => {
    try {
      localStorage.setItem(`chat:outbox:${channel}`, JSON.stringify(outbox));
    } catch (e) {
      console.error('[chat] Failed to save outbox to localStorage:', e);
    }
  }, [outbox, channel]);

  return [outbox, setOutbox] as const;
}
