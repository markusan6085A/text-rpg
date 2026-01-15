import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { API_URL } from "../utils/api";
import { getToken } from "../utils/api";

type ChatMessage = {
  id: string;
  characterName: string;
  characterId?: string;
  channel: string;
  message: string;
  createdAt: string;
  isOwn?: boolean;
};

type UseChatOptions = {
  channel: string;              // "general"
  page: number;                 // 1
  limit?: number;              // 10
  cacheTtlMs?: number;         // 60_000
  autoRefresh?: boolean;       // false - disable auto refresh
  manual?: boolean;            // true - disable all automatic fetches, only manual refresh()
};

// RAM cache (shared across all instances)
const memCache = new Map<string, { ts: number; data: ChatMessage[] }>();

function cacheKey(channel: string, page: number, limit: number) {
  // Version 2: changed limit from 20/30 to 10, changed order from bottom to top
  return `chat:v2:${channel}|${page}|${limit}`;
}

function readLS(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== "number") return null;
    return parsed as { ts: number; data: ChatMessage[] };
  } catch {
    return null;
  }
}

function writeLS(key: string, value: { ts: number; data: ChatMessage[] }) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function useChatMessages(opts: UseChatOptions) {
  const { channel, page, limit = 10, cacheTtlMs = 60_000, autoRefresh = false, manual = false } = opts;

  const key = useMemo(() => cacheKey(channel, page, limit), [channel, page, limit]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // 1) RAM cache
    const mem = memCache.get(key);
    if (mem?.data?.length) return mem.data;

    // 2) localStorage cache
    const ls = readLS(key);
    if (ls?.data?.length) return ls.data;

    return [];
  });

  // 🔥 Оновлюємо messages при зміні key (channel/page/limit) - показуємо кеш миттєво
  useEffect(() => {
    const mem = memCache.get(key);
    const ls = readLS(key);
    
    // Показуємо кеш миттєво, якщо він є
    if (mem?.data?.length) {
      setMessages(mem.data);
    } else if (ls?.data?.length) {
      setMessages(ls.data);
    } else {
      setMessages([]);
    }
  }, [key]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  // 🔥 Зберігаємо поточні значення в refs для стабільного refresh()
  const channelRef = useRef(channel);
  const pageRef = useRef(page);
  const limitRef = useRef(limit);
  const keyRef = useRef(key);

  // Оновлюємо refs при зміні
  useEffect(() => {
    channelRef.current = channel;
    pageRef.current = page;
    limitRef.current = limit;
    keyRef.current = key;
  }, [channel, page, limit, key]);

  const fetchNow = useCallback(
    async (reason: string) => {
      // Використовуємо refs для отримання актуальних значень
      const currentChannel = channelRef.current;
      const currentPage = pageRef.current;
      const currentLimit = limitRef.current;
      const currentKey = keyRef.current;

      if (!currentChannel) return;

      // анти-спам: якщо хтось випадково викликає 2 рази підряд
      const now = Date.now();
      if (now - lastFetchAtRef.current < 500) {
        console.log(`[chat] Skipping fetch (${reason}) - too soon after last fetch`);
        return;
      }
      lastFetchAtRef.current = now;

      if (inFlightRef.current) {
        console.log(`[chat] Skipping fetch (${reason}) - already in flight`);
        return;
      }
      inFlightRef.current = true;

      // abort попередній
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setError(null);

      const url =
        `${API_URL}/chat/messages?channel=${encodeURIComponent(currentChannel)}` +
        `&page=${encodeURIComponent(String(currentPage))}` +
        `&limit=${encodeURIComponent(String(currentLimit))}`;

      const t0 = performance.now();

      try {
        const token = getToken();
        const headers: HeadersInit = {
          "Accept": "application/json",
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          method: "GET",
          signal: ac.signal,
          headers,
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

              const data = (await res.json()) as { ok: boolean; messages: ChatMessage[] };
              const cleaned = Array.isArray(data.messages) ? data.messages : [];

              // 🔥 Перевіряємо, чи канал/сторінка не змінилися під час запиту
              // Якщо змінилися - не оновлюємо state (запобігає race condition)
              if (channelRef.current !== currentChannel || pageRef.current !== currentPage) {
                console.log('[chat] Channel/page changed during fetch, ignoring response');
                return;
              }

              // оновлюємо state + кеші
              setMessages(cleaned);

              const entry = { ts: Date.now(), data: cleaned };
              memCache.set(currentKey, entry);
              writeLS(currentKey, entry);

      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Fetch error");
      } finally {
        const t1 = performance.now();
        // eslint-disable-next-line no-console
        console.log(`[chat] fetch (${reason}) ${Math.round(t1 - t0)}ms`, { channel: currentChannel, page: currentPage, limit: currentLimit });

        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [] // 🔥 Порожній масив - функція стабільна
  );

  // авто-оновлення: тільки якщо кеш протух (вимкнено за замовчуванням)
  useEffect(() => {
    if (manual) return; // Manual mode - no automatic fetches
    if (!autoRefresh) return; // Вимкнено автооновлення

    const mem = memCache.get(key);
    const ls = readLS(key);
    const newest = mem?.ts ? mem : ls;

    const isFresh = newest?.ts && Date.now() - newest.ts < cacheTtlMs;

    if (!isFresh) {
      fetchNow("mount_or_change");
    }
    // якщо кеш свіжий — показуємо миттєво і можна оновити кнопкою
  }, [key, cacheTtlMs, autoRefresh, manual, fetchNow]);

  // Перше завантаження при монтуванні (тільки якщо немає кешу) - ВИМКНЕНО в manual режимі
  useEffect(() => {
    if (manual) return; // Manual mode - no automatic initial load

    const mem = memCache.get(key);
    const ls = readLS(key);
    const hasCache = mem?.data?.length || ls?.data?.length;

    // Завантажуємо тільки якщо немає кешу
    if (!hasCache) {
      fetchNow("initial_load");
    }
  }, [key, manual, fetchNow]);

  // cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // 🔥 Стабільний refresh - використовує актуальні channel/page/limit з refs
  const refresh = useCallback(() => {
    // Використовуємо актуальні значення з refs
    const currentChannel = channelRef.current;
    const currentPage = pageRef.current;
    const currentLimit = limitRef.current;
    console.log('[chat] refresh() called:', { currentChannel, currentPage, currentLimit });
    fetchNow("manual_refresh");
  }, [fetchNow]);

  return {
    messages,
    loading,
    error,
    refresh,
  };
}
