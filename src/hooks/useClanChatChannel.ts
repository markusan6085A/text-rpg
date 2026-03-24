import { useCallback, useEffect, useState } from "react";
import {
  getClanChat,
  getMyClan,
  type ChatMessage,
  type ClanChatMessage,
} from "../utils/api";

function mapClanToChat(m: ClanChatMessage, heroId: string | undefined): ChatMessage {
  const createdAt =
    typeof m.createdAt === "string"
      ? m.createdAt
      : new Date(m.createdAt as unknown as Date).toISOString();
  return {
    id: m.id,
    characterName: m.characterName,
    characterId: m.characterId,
    channel: "clan",
    message: m.message,
    createdAt,
    isOwn: heroId ? m.characterId === heroId : false,
    nickColor: m.nickColor ?? undefined,
    emblem: m.emblem ?? undefined,
  };
}

/**
 * Той самий потік, що /clans/:id/chat — збігається з чатом на сторінці клану.
 * Порядок як у глобальному чаті: новіші зверху (getClanChat повертає старі → перший).
 */
export function useClanChatChannel(opts: {
  enabled: boolean;
  page: number;
  limit?: number;
  heroId: string | undefined;
}) {
  const { enabled, page, limit = 10, heroId } = opts;
  const [clanId, setClanId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setClanId(null);
      return;
    }
    let cancelled = false;
    void getMyClan()
      .then((r) => {
        if (cancelled) return;
        if (r.ok && r.clan?.id) setClanId(r.clan.id);
        else setClanId(null);
      })
      .catch(() => {
        if (!cancelled) setClanId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, heroId]);

  const load = useCallback(async () => {
    if (!clanId) {
      setMessages([]);
      setTotalPages(undefined);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getClanChat(clanId, page, limit);
      if (!res.ok) throw new Error("clan chat failed");
      const mapped = [...res.messages].reverse().map((m) => mapClanToChat(m, heroId));
      setMessages(mapped);
      setTotalPages(res.pagination.totalPages);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Помилка завантаження кланового чату";
      setError(msg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [clanId, page, limit, heroId]);

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      setTotalPages(undefined);
      return;
    }
    if (!clanId) {
      setMessages([]);
      setTotalPages(undefined);
      return;
    }
    void load();
  }, [enabled, clanId, load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return { messages, loading, error, refresh, totalPages, clanId };
}
