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
  nickColor?: string; // Color of the character's nickname
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
  // Version 3: added nickColor support
  return `chat:v3:${channel}|${page}|${limit}`;
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
    // 1) RAM cache - найшвидший
    const mem = memCache.get(key);
    if (mem?.data?.length) return mem.data;

    // 2) localStorage cache
    const ls = readLS(key);
    if (ls?.data?.length) {
      // Зберігаємо в RAM для швидкого доступу
      memCache.set(key, ls);
      return ls.data;
    }

    return [];
  });

  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  // 🔥 Оновлюємо messages при зміні key (channel/page/limit) - показуємо кеш МИТТЄВО
  useEffect(() => {
    // Синхронно показуємо кеш миттєво (не чекаємо на асинхронні операції)
    const mem = memCache.get(key);
    const ls = readLS(key);
    
    // Показуємо кеш миттєво, якщо він є, але фільтруємо по channel
    const cachedData = mem?.data || ls?.data || [];
    const filteredByChannel = Array.isArray(cachedData) 
      ? cachedData.filter((m: any) => m.channel === channel)
      : [];
    
    if (filteredByChannel.length > 0) {
      setMessages(filteredByChannel);
      if (ls?.data?.length && !mem) {
        // Зберігаємо в RAM для швидкого доступу
        memCache.set(key, { ts: ls.ts, data: filteredByChannel });
      }
    } else {
      setMessages([]);
    }
  }, [key, channel]);

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

  // 🔥 fetchNow оголошується ПЕРЕД useEffect, які його використовують
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

        // ❗ Обробка 401 Unauthorized - не показуємо помилку, просто порожній список
        if (res.status === 401) {
          // Очищаємо токен, якщо він є
          if (token) {
            try {
              const { useAuthStore } = await import('../state/authStore');
              useAuthStore.getState().logout();
            } catch (e) {
              localStorage.removeItem('auth_token');
            }
          }
          // Повертаємо порожній список для неавторизованих користувачів
          setMessages([]);
          setLoading(false);
          setError(null);
          inFlightRef.current = false;
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as { ok: boolean; messages: ChatMessage[]; total?: number; totalPages?: number };
        const cleaned = Array.isArray(data.messages) ? data.messages : [];

        // 🔥 Перевіряємо, чи канал/сторінка не змінилися під час запиту
        // Якщо змінилися - не оновлюємо state (запобігає race condition)
        if (channelRef.current !== currentChannel || pageRef.current !== currentPage) {
          console.log('[chat] Channel/page changed during fetch, ignoring response');
          return;
        }

        // 🔥 Додаткова перевірка: фільтруємо повідомлення по channel (на випадок якщо сервер повернув не той канал)
        const filteredByChannel = cleaned.filter((m) => m.channel === currentChannel);

        // оновлюємо state + кеші
        console.log('[chat] Fetched messages:', { 
          page: currentPage, 
          channel: currentChannel, 
          count: filteredByChannel.length, 
          totalPages: data.totalPages,
          messageIds: filteredByChannel.map(m => m.id).slice(0, 5) 
        });
        setMessages(filteredByChannel);
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
        }

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

  // 🔥 ВАЖЛИВО: При зміні сторінки завжди завантажуємо актуальні дані з сервера
  // Це гарантує, що нові повідомлення з'являться на сторінці 2+
  // Розміщено ПІСЛЯ оголошення fetchNow, щоб уникнути помилки "used before declaration"
  useEffect(() => {
    if (manual) return; // Manual mode - no automatic fetches
    
    // Невелика затримка, щоб уникнути конфліктів з іншими useEffect
    const timer = setTimeout(() => {
      fetchNow("page_change");
    }, 150);
    return () => clearTimeout(timer);
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
    console.log('[chat] refresh() called:', { currentChannel, currentPage, currentLimit, key: keyRef.current });
    fetchNow("manual_refresh");
  }, [fetchNow]);

  return {
    messages,
    loading,
    error,
    refresh,
    totalPages,
  };
}
